// src/pages/simulation/hooks/useWarpEngine.js
import { useEffect, useRef, useState, useCallback } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Hook owning the Web Worker lifecycle.

   Responsibilities:
   1. Spawn worker on mount, terminate on unmount.
   2. Принимать (sourceImageData, points) и отправлять в worker.
   3. Игнорировать устаревшие jobs — если пришло 3 запроса подряд, принять
      только последний.
   4. Держать resulting ImageData в state для Canvas.
   5. Coalesce bursts: при быстрых изменениях (drag точки) не слать
      каждое микро-изменение, а собирать в rAF-батчи.

   Main optimization:
   — Transferable ArrayBuffer в обе стороны (0 копий).
   — jobId для skip stale.
   — Fallback на main-thread applyWarp если Worker недоступен (старый
     Safari, Jest unit tests и т.п.).

   Зачем main-thread fallback: в тестах Jest нет Worker API по дефолту.
   Жёсткая зависимость убила бы возможность юнит-тестить warp math.
   ────────────────────────────────────────────────────────────────────────── */

export function useWarpEngine({ sourceImageData }) {
  const workerRef = useRef(null);
  const latestJobIdRef = useRef(0);
  const pendingRef = useRef(null); // { points, requestedAt }
  const rafIdRef = useRef(null);
  const [warpedImageData, setWarpedImageData] = useState(null);
  const [isWarping, setIsWarping] = useState(false);

  /* ────────── Spawn worker ────────── */
  useEffect(() => {
    let worker = null;
    try {
      worker = new Worker(
        new URL("../workers/warp.worker.js", import.meta.url),
        { type: "module" },
      );
    } catch (err) {
      console.warn(
        "[simulation/useWarpEngine] Worker spawn failed, using main-thread fallback:",
        err,
      );
      workerRef.current = null;
      return undefined;
    }

    worker.onmessage = (evt) => {
      const msg = evt.data;
      if (!msg) return;

      if (msg.type === "result") {
        // Отбрасываем устаревший результат.
        if (msg.jobId !== latestJobIdRef.current) return;

        const arr = new Uint8ClampedArray(msg.buffer);
        const imgData = new ImageData(arr, msg.width, msg.height);
        setWarpedImageData(imgData);
        setIsWarping(false);
      } else if (msg.type === "error") {
        console.error("[simulation/useWarpEngine] worker error:", msg.message);
        setIsWarping(false);
      }
    };

    worker.onerror = (err) => {
      console.error("[simulation/useWarpEngine] worker crashed:", err);
      setIsWarping(false);
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  /* ────────── Main-thread fallback ────────── */
  const runMainThreadWarp = useCallback(async (src, width, height, points) => {
    // Динамический импорт, чтобы не тянуть warpMath в main bundle без
    // необходимости. Worker обычно есть — fallback редкость.
    const { applyWarp } = await import("../utils/warpMath.js");
    const result = applyWarp({ src, width, height, points });
    return new ImageData(result, width, height);
  }, []);

  /* ────────── Dispatch warp job ────────── */
  const runWarp = useCallback(
    (points) => {
      if (!sourceImageData) return;

      // Increment job id
      const jobId = ++latestJobIdRef.current;
      setIsWarping(true);

      const worker = workerRef.current;

      if (!worker) {
        // Fallback: same-thread, async to не блочить render.
        runMainThreadWarp(
          sourceImageData.data,
          sourceImageData.width,
          sourceImageData.height,
          points,
        )
          .then((imgData) => {
            if (jobId !== latestJobIdRef.current) return;
            setWarpedImageData(imgData);
            setIsWarping(false);
          })
          .catch((err) => {
            console.error(
              "[simulation/useWarpEngine] main-thread warp failed:",
              err,
            );
            setIsWarping(false);
          });
        return;
      }

      // Worker path: копируем src (иначе buffer станет detached в main
      // thread и второй warp сломается).
      const srcCopy = new Uint8ClampedArray(sourceImageData.data);

      worker.postMessage(
        {
          type: "warp",
          jobId,
          src: srcCopy.buffer,
          width: sourceImageData.width,
          height: sourceImageData.height,
          points,
        },
        [srcCopy.buffer],
      );
    },
    [sourceImageData, runMainThreadWarp],
  );

  /* ────────── rAF-coalesced scheduler ────────── */
  const scheduleWarp = useCallback(
    (points) => {
      pendingRef.current = points;

      if (rafIdRef.current !== null) return; // уже запланировано

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const pts = pendingRef.current;
        pendingRef.current = null;
        if (pts) runWarp(pts);
      });
    },
    [runWarp],
  );

  /* ────────── Cleanup pending rAF ────────── */
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  /* ────────── Reset warped когда источник меняется ────────── */
  useEffect(() => {
    setWarpedImageData(null);
  }, [sourceImageData]);

  return {
    warpedImageData,
    isWarping,
    scheduleWarp,
  };
}
