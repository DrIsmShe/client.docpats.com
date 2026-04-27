// src/pages/simulation/hooks/useZoomPan.js
import { useState, useCallback, useRef, useEffect } from "react";
import { clampScale, canvasToImage } from "../utils/coordinateHelpers.js";

/* ──────────────────────────────────────────────────────────────────────────
   Zoom & pan viewport.

   viewport = { scale, tx, ty } — state.

   Особенности:
   — zoom-at-point: колесо крутится относительно курсора (как в Figma).
     Формула: после зума точка под курсором должна остаться под курсором.
   — pan: drag с правой кнопкой ИЛИ пробел+drag ИЛИ touch-drag двумя
     пальцами (TODO S.4). Для S.2 — просто drag мышью.

   S.7.5+ — passive wheel listener fix:
   React 17+ оборачивает onWheel как passive event listener, и
   evt.preventDefault() внутри не работает (warning в console). Решение —
   крепим обработчик wheel вручную через addEventListener с
   { passive: false }. Возвращаем `attachWheelListener(el)` который
   вешается на canvas через useEffect или ref-callback.
   ────────────────────────────────────────────────────────────────────────── */

const INITIAL_VIEWPORT = { scale: 1, tx: 0, ty: 0 };

const EMPTY_PAN = {
  active: false,
  startX: 0,
  startY: 0,
  startTx: 0,
  startTy: 0,
};

export function useZoomPan({
  minScale = 0.1,
  maxScale = 10,
  zoomStep = 1.15,
} = {}) {
  const [viewport, setViewport] = useState(INITIAL_VIEWPORT);

  const panStateRef = useRef({ ...EMPTY_PAN });
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  /* ────────── Wheel handler (берём элемент в callback) ──────────
     Возвращаем функцию которая принимает (evt, canvasElement).
     Внутри SimulationCanvas / SimulationEditor можно её использовать
     как раньше через onWheel — но ТАКЖЕ предоставляем
     attachWheelListener для повешивания вручную через useEffect. */
  const handleWheel = useCallback(
    (evt, canvasElement) => {
      // Этот метод оставлен для обратной совместимости. Если evt
      // приходит как passive (через onWheel), preventDefault не сработает,
      // но и крашиться не будет.
      try {
        evt.preventDefault();
      } catch {
        /* passive listener — ignore */
      }
      if (!canvasElement) return;

      const rect = canvasElement.getBoundingClientRect();
      const cx = evt.clientX - rect.left;
      const cy = evt.clientY - rect.top;

      setViewport((v) => {
        const direction = evt.deltaY < 0 ? 1 : -1;
        const factor = direction > 0 ? zoomStep : 1 / zoomStep;
        const newScale = clampScale(v.scale * factor, minScale, maxScale);

        if (newScale === v.scale) return v;

        const imgPt = canvasToImage(cx, cy, v);
        const newTx = cx - imgPt.x * newScale;
        const newTy = cy - imgPt.y * newScale;

        return { scale: newScale, tx: newTx, ty: newTy };
      });
    },
    [minScale, maxScale, zoomStep],
  );

  /**
   * S.7.5+ — Хелпер для повешивания wheel listener'а на DOM-элемент
   * с { passive: false }. Используется так:
   *
   *   const wheelRef = useCallback(attachWheelListener, [attachWheelListener]);
   *   <div ref={wheelRef}>...</div>
   *
   * Или через useEffect:
   *
   *   useEffect(() => attachWheelListener(canvasEl.current), [attachWheelListener]);
   */
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

  /* ────────── Pan ────────── */
  const startPan = useCallback((evt) => {
    const v = viewportRef.current;
    const ps = panStateRef.current;
    ps.active = true;
    ps.startX = evt.clientX;
    ps.startY = evt.clientY;
    ps.startTx = v.tx;
    ps.startTy = v.ty;
  }, []);

  const updatePan = useCallback((evt) => {
    const s = panStateRef.current;
    if (!s.active) return;
    const dx = evt.clientX - s.startX;
    const dy = evt.clientY - s.startY;
    setViewport((v) => ({
      ...v,
      tx: s.startTx + dx,
      ty: s.startTy + dy,
    }));
  }, []);

  const endPan = useCallback(() => {
    panStateRef.current.active = false;
  }, []);

  /* ────────── Imperative actions ────────── */
  const zoomIn = useCallback(() => {
    setViewport((v) => ({
      ...v,
      scale: clampScale(v.scale * zoomStep, minScale, maxScale),
    }));
  }, [minScale, maxScale, zoomStep]);

  const zoomOut = useCallback(() => {
    setViewport((v) => ({
      ...v,
      scale: clampScale(v.scale / zoomStep, minScale, maxScale),
    }));
  }, [minScale, maxScale, zoomStep]);

  const setViewportDirect = useCallback((next) => {
    setViewport(next);
  }, []);

  const reset = useCallback(() => {
    setViewport(INITIAL_VIEWPORT);
  }, []);

  return {
    viewport,
    handleWheel,
    attachWheelListener,
    startPan,
    updatePan,
    endPan,
    zoomIn,
    zoomOut,
    reset,
    setViewport: setViewportDirect,
  };
}
