// src/pages/simulation/hooks/useWarpEngine.js
import { useEffect, useRef, useState, useCallback } from "react";
import { computeDirtyRect } from "../utils/warpMath.js";

/* ──────────────────────────────────────────────────────────────────────────
   Hook owning the Web Worker lifecycle.

   ЧТО ИЗМЕНИЛОСЬ И ПОЧЕМУ

   Было: на каждое движение указателя main thread копировал ВЕСЬ исходник
   (~4 МБ для превью 1200×900), отдавал его воркеру, получал обратно целый
   кадр, оборачивал в новый ImageData и клал в state. Полный пересчёт кадра
   ради круга радиусом в пять процентов ширины.

   Стало:
   1. Исходник уезжает в воркер ОДИН раз ("init"). Кадровое сообщение —
      это точки и прямоугольник, сотни байт.
   2. Считается только прямоугольник, изменившийся с прошлой отправки
      (computeDirtyRect). При перетаскивании точки это её круг влияния:
      работы в десятки раз меньше.
   3. Обратно приходит вырезка, а не кадр. Она накладывается на постоянный
      буфер, ImageData над которым не пересоздаётся — меняется warpVersion.

   BACKPRESSURE ВМЕСТО ОТБРАСЫВАНИЯ

   Раньше устаревшие ответы отбрасывались по jobId. С вырезками так нельзя:
   пропущенная вырезка — это дырка в накопленном кадре навсегда. Поэтому
   новая задача не уходит, пока не вернулась предыдущая; свежие точки ждут
   в pendingPointsRef и затирают друг друга. Очередь ограничена одной
   задачей, все ответы применяются по порядку.

   Fallback на main-thread applyWarp сохранён (старый Safari, unit-тесты) —
   он всегда считает кадр целиком, без ROI: путь редкий, усложнять незачем.
   ────────────────────────────────────────────────────────────────────────── */

// Сколько ждать тишины, прежде чем погасить индикатор «идёт расчёт».
// Без задержки индикатор мигал бы на каждой задаче, то есть до 120 раз
// в секунду, и каждое мигание — это перерисовка всего редактора.
const IDLE_INDICATOR_MS = 150;

export function useWarpEngine({ sourceImageData }) {
  const workerRef = useRef(null);
  const workerReadyRef = useRef(false);
  const latestJobIdRef = useRef(0);

  const pendingPointsRef = useRef(null); // точки, ожидающие отправки
  const lastSentPointsRef = useRef([]); // точки последней отправленной задачи
  const needsFullRef = useRef(true); // следующий пересчёт — полный
  const busyRef = useRef(false);

  // Постоянный буфер накопленного результата + ImageData над ним.
  // Идентичность ImageData НЕ меняется между кадрами — сигналом к
  // перерисовке служит warpVersion.
  const accumRef = useRef(null); // { data: Uint8ClampedArray, imageData }
  const idleTimerRef = useRef(null);

  const [warpedImageData, setWarpedImageData] = useState(null);
  const [warpRegion, setWarpRegion] = useState(null); // {x,y,w,h,version}
  const [isWarping, setIsWarping] = useState(false);

  const versionRef = useRef(0);

  /* ────────── Индикатор занятости ────────── */
  const markBusyIndicator = useCallback(() => {
    setIsWarping((prev) => (prev ? prev : true));
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null;
      setIsWarping(false);
    }, IDLE_INDICATOR_MS);
  }, []);

  /* ────────── Наложение вырезки на накопленный буфер ──────────

     ImageData пересоздаётся на каждый кадр — но это ОБЁРТКА над тем же
     буфером, а не копия пикселей: конструктор ImageData принимает
     существующий Uint8ClampedArray как есть. Стоит это одного маленького
     объекта в кадр.

     Так сделано намеренно. Потребители движка (BreastCanvas и другие)
     перерисовываются по изменению идентичности warpedImageData — это был
     контракт до инкрементальных вырезок. Когда я оставил объект
     постоянным, канвас маммопластики перестал обновляться вовсе: точки
     двигались, а форма не менялась. Возвращать контракт правильнее, чем
     заставлять каждого потребителя знать про warpRegion. */
  const applyPatch = useCallback((buffer, x, y, w, h) => {
    const accum = accumRef.current;
    if (!accum || !buffer || w <= 0 || h <= 0) return;
    const patch = new Uint8ClampedArray(buffer);
    const rowBytes = w * 4;
    for (let row = 0; row < h; row++) {
      const to = ((y + row) * accum.width + x) * 4;
      accum.data.set(patch.subarray(row * rowBytes, (row + 1) * rowBytes), to);
    }
    versionRef.current += 1;
    accum.imageData = new ImageData(accum.data, accum.width, accum.height);
    setWarpedImageData(accum.imageData);
    setWarpRegion({ x, y, w, h, version: versionRef.current });
  }, []);

  /* ────────── Main-thread fallback (всегда полный кадр) ────────── */
  const runMainThreadWarp = useCallback(async (src, width, height, points) => {
    const { applyWarp } = await import("../utils/warpMath.js");
    return applyWarp({ src, width, height, points });
  }, []);

  /* ────────── Отправка задачи ────────── */
  const dispatchPending = useCallback(() => {
    if (busyRef.current) return;
    const points = pendingPointsRef.current;
    if (!points || !sourceImageData) return;

    // Воркер есть, но ещё не принял исходник — ждём "ready". Уйти сейчас
    // в main-thread fallback значило бы посчитать полный кадр в UI-потоке
    // на каждом монтировании редактора.
    if (workerRef.current && !workerReadyRef.current) return;

    const W = sourceImageData.width;
    const H = sourceImageData.height;

    const roi = needsFullRef.current
      ? null
      : computeDirtyRect(lastSentPointsRef.current, points, W, H);

    // Точки формально новые, но по содержанию те же — считать нечего.
    if (roi && roi.w === 0 && roi.h === 0) {
      pendingPointsRef.current = null;
      lastSentPointsRef.current = points;
      return;
    }

    pendingPointsRef.current = null;
    lastSentPointsRef.current = points;
    needsFullRef.current = false;

    const jobId = ++latestJobIdRef.current;
    markBusyIndicator();

    const worker = workerRef.current;

    if (!worker || !workerReadyRef.current) {
      busyRef.current = true;
      runMainThreadWarp(sourceImageData.data, W, H, points)
        .then((result) => {
          busyRef.current = false;
          applyPatch(result.buffer, 0, 0, W, H);
          if (pendingPointsRef.current) dispatchPending();
        })
        .catch((err) => {
          busyRef.current = false;
          console.error(
            "[simulation/useWarpEngine] main-thread warp failed:",
            err,
          );
        });
      return;
    }

    busyRef.current = true;
    worker.postMessage({ type: "warp", jobId, points, roi });
  }, [sourceImageData, markBusyIndicator, applyPatch, runMainThreadWarp]);

  const dispatchRef = useRef(dispatchPending);
  dispatchRef.current = dispatchPending;

  /* ────────── Spawn worker ────────── */
  useEffect(() => {
    let worker = null;
    try {
      worker = new Worker(new URL("../workers/warp.worker.js", import.meta.url), {
        type: "module",
      });
    } catch (err) {
      console.warn(
        "[simulation/useWarpEngine] Worker spawn failed, using main-thread fallback:",
        err,
      );
      workerRef.current = null;
      workerReadyRef.current = false;
      return undefined;
    }

    worker.onmessage = (evt) => {
      const msg = evt.data;
      if (!msg) return;

      if (msg.type === "ready") {
        workerReadyRef.current = true;
        if (pendingPointsRef.current) dispatchRef.current();
        return;
      }

      if (msg.type === "result") {
        busyRef.current = false;
        if (msg.buffer) applyPatch(msg.buffer, msg.x, msg.y, msg.w, msg.h);
        if (pendingPointsRef.current) dispatchRef.current();
        return;
      }

      if (msg.type === "error") {
        busyRef.current = false;
        console.error("[simulation/useWarpEngine] worker error:", msg.message);
        // Следующая задача должна восстановить кадр целиком: после ошибки
        // содержимое dst в воркере считаем недостоверным.
        needsFullRef.current = true;
        if (pendingPointsRef.current) dispatchRef.current();
      }
    };

    worker.onerror = (err) => {
      busyRef.current = false;
      needsFullRef.current = true;
      console.error("[simulation/useWarpEngine] worker crashed:", err);
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
      workerReadyRef.current = false;
    };
  }, [applyPatch]);

  /* ────────── Смена источника: init воркера + новый накопитель ────────── */
  useEffect(() => {
    busyRef.current = false;
    needsFullRef.current = true;
    pendingPointsRef.current = null;
    lastSentPointsRef.current = [];
    versionRef.current = 0;
    setWarpedImageData(null);
    setWarpRegion(null);

    if (!sourceImageData) {
      accumRef.current = null;
      return undefined;
    }

    const W = sourceImageData.width;
    const H = sourceImageData.height;

    // Накопитель main thread'а — стартует копией оригинала.
    const data = new Uint8ClampedArray(sourceImageData.data);
    accumRef.current = {
      data,
      width: W,
      height: H,
      imageData: new ImageData(data, W, H),
    };

    const worker = workerRef.current;
    if (worker) {
      workerReadyRef.current = false;
      // Копия обязательна: буфер уезжает transferable и станет detached.
      const srcCopy = new Uint8ClampedArray(sourceImageData.data);
      worker.postMessage(
        { type: "init", src: srcCopy.buffer, width: W, height: H },
        [srcCopy.buffer],
      );
    }

    return undefined;
  }, [sourceImageData]);

  /* ────────── Публичный планировщик ────────── */
  const scheduleWarp = useCallback(
    (points) => {
      pendingPointsRef.current = points;
      dispatchRef.current();
    },
    [],
  );

  /* ────────── Cleanup ────────── */
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return {
    warpedImageData,
    warpRegion,
    isWarping,
    scheduleWarp,
  };
}
