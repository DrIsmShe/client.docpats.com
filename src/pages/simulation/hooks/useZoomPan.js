// src/pages/simulation/hooks/useZoomPan.js
import { useState, useCallback, useRef, useEffect } from "react";
import { clampScale, canvasToImage } from "../utils/coordinateHelpers.js";

/* ──────────────────────────────────────────────────────────────────────────
   Zoom & pan viewport.

   viewport = { scale, tx, ty }.

   ЖЕСТЫ (закрывает давний TODO S.4)

   Раньше здесь был только `wheel`, а его на тач-экране не существует —
   на телефоне масштаб менялся исключительно кнопками тулбара. Теперь
   панорама и зум описаны ОДНИМ жестом:

     startGesture()  — снимок текущего viewport'а;
     updateGesture({ dx, dy, scaleRatio, centerX, centerY })
                     — dx/dy: сдвиг центроида указателей от начала жеста;
                       scaleRatio: отношение текущего расстояния между
                       двумя указателями к начальному (для одного пальца
                       это 1);
     endGesture().

   Один палец даёт scaleRatio = 1 и вырождается в чистый сдвиг, два пальца
   дают щипок. Отдельной ветки для «мобильного» нет — это один и тот же код,
   поэтому поведение мыши, стилуса и пальца не может разъехаться.

   Точка под начальным центроидом остаётся под ним при любом масштабе —
   то же правило, что у зума колесом (как в Figma).

   ПЕРЕРИСОВКА (пункт 4)

   viewport лежит и в ref (истина, обновляется синхронно), и в state (для
   React-потребителей). setState вызывается не чаще одного раза за кадр:
   стилус шлёт до 240 событий в секунду, и без этого каждое из них
   перерисовывало бы канвас, три слоя оверлеев и все ручки точек.
   ────────────────────────────────────────────────────────────────────────── */

const INITIAL_VIEWPORT = { scale: 1, tx: 0, ty: 0 };

export function useZoomPan({
  minScale = 0.1,
  maxScale = 10,
  zoomStep = 1.15,
} = {}) {
  const [viewport, setViewportState] = useState(INITIAL_VIEWPORT);

  const viewportRef = useRef(INITIAL_VIEWPORT);
  const rafIdRef = useRef(null);
  const gestureStartRef = useRef(null);

  /* ────────── Синхронизация ref → state, не чаще кадра ────────── */
  const flush = useCallback(() => {
    rafIdRef.current = null;
    setViewportState(viewportRef.current);
  }, []);

  const commitViewport = useCallback(
    (next) => {
      viewportRef.current = next;
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(flush);
      }
    },
    [flush],
  );

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  /* ────────── Wheel ────────── */
  const handleWheel = useCallback(
    (evt, canvasElement) => {
      try {
        evt.preventDefault();
      } catch {
        /* passive listener — ignore */
      }
      if (!canvasElement) return;

      const rect = canvasElement.getBoundingClientRect();
      const cx = evt.clientX - rect.left;
      const cy = evt.clientY - rect.top;

      const v = viewportRef.current;
      const direction = evt.deltaY < 0 ? 1 : -1;
      const factor = direction > 0 ? zoomStep : 1 / zoomStep;
      const newScale = clampScale(v.scale * factor, minScale, maxScale);
      if (newScale === v.scale) return;

      const imgPt = canvasToImage(cx, cy, v);
      commitViewport({
        scale: newScale,
        tx: cx - imgPt.x * newScale,
        ty: cy - imgPt.y * newScale,
      });
    },
    [minScale, maxScale, zoomStep, commitViewport],
  );

  const attachWheelListener = useCallback(
    (element) => {
      if (!element) return undefined;
      const onWheel = (evt) => {
        evt.preventDefault();
        handleWheel(evt, element);
      };
      element.addEventListener("wheel", onWheel, { passive: false });
      return () => element.removeEventListener("wheel", onWheel);
    },
    [handleWheel],
  );

  /* ────────── Единый жест: пан одним указателем + щипок двумя ────────── */
  const startGesture = useCallback(() => {
    gestureStartRef.current = { ...viewportRef.current };
  }, []);

  const updateGesture = useCallback(
    ({ dx = 0, dy = 0, scaleRatio = 1, centerX = 0, centerY = 0 }) => {
      const start = gestureStartRef.current;
      if (!start) return;

      const newScale = clampScale(start.scale * scaleRatio, minScale, maxScale);

      // Точка изображения, бывшая под начальным центроидом, обязана
      // остаться под ним же — иначе картинка «убегает» из-под пальцев.
      const imgPt = canvasToImage(centerX, centerY, start);

      commitViewport({
        scale: newScale,
        tx: centerX + dx - imgPt.x * newScale,
        ty: centerY + dy - imgPt.y * newScale,
      });
    },
    [minScale, maxScale, commitViewport],
  );

  const endGesture = useCallback(() => {
    gestureStartRef.current = null;
  }, []);

  /* ────────── Совместимость: одноуказательный пан ──────────
     Этим API пользуются RadiologyCanvas и BreastEditorPage. Ломать их
     ради жестов в лицевом редакторе незачем — старая сигнатура осталась,
     просто теперь это частный случай жеста (scaleRatio = 1), и они
     бесплатно получают тот же rAF-троттлинг.

     centerX/centerY здесь роли не играют: при scaleRatio = 1 масштаб не
     меняется, и формула вырождается в tx = start.tx + dx. */
  const panPointerRef = useRef(null);

  const startPan = useCallback(
    (evt) => {
      panPointerRef.current = { x: evt.clientX, y: evt.clientY };
      startGesture();
    },
    [startGesture],
  );

  const updatePan = useCallback(
    (evt) => {
      const s = panPointerRef.current;
      if (!s) return;
      updateGesture({
        dx: evt.clientX - s.x,
        dy: evt.clientY - s.y,
        scaleRatio: 1,
        centerX: 0,
        centerY: 0,
      });
    },
    [updateGesture],
  );

  const endPan = useCallback(() => {
    panPointerRef.current = null;
    endGesture();
  }, [endGesture]);

  /* ────────── Imperative actions ────────── */
  const zoomAtCenter = useCallback(
    (factor) => {
      const v = viewportRef.current;
      const newScale = clampScale(v.scale * factor, minScale, maxScale);
      if (newScale === v.scale) return;
      commitViewport({ ...v, scale: newScale });
    },
    [minScale, maxScale, commitViewport],
  );

  const zoomIn = useCallback(
    () => zoomAtCenter(zoomStep),
    [zoomAtCenter, zoomStep],
  );
  const zoomOut = useCallback(
    () => zoomAtCenter(1 / zoomStep),
    [zoomAtCenter, zoomStep],
  );

  const setViewport = useCallback(
    (next) => {
      viewportRef.current = next;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setViewportState(next);
    },
    [],
  );

  const reset = useCallback(
    () => setViewport(INITIAL_VIEWPORT),
    [setViewport],
  );

  return {
    viewport,
    viewportRef,
    handleWheel,
    attachWheelListener,
    startGesture,
    updateGesture,
    endGesture,
    startPan,
    updatePan,
    endPan,
    zoomIn,
    zoomOut,
    reset,
    setViewport,
  };
}
