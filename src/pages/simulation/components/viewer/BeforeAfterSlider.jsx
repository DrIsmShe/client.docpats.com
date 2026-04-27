// src/pages/simulation/components/viewer/BeforeAfterSlider.jsx
import React, { useRef, useState, useCallback, useEffect } from "react";
import styles from "./BeforeAfterViewer.module.css";

/* ──────────────────────────────────────────────────────────────────────────
   Вертикальный слайдер-делитель: левая половина — before, правая — after.
   Пользователь тянет разделитель → двигает границу.

   Двуй canvas'а одинакового размера, наложены друг на друга. Правый
   обрезан через clip-path по x-координате слайдера.

   Coordinates:
   — dividerPercent: 0..100, позиция делителя в процентах ширины контейнера
   — Тач и мышь обрабатываются одинаково через pointer events.

   ImageData размера 4000px НЕ помещается в DOM как <img>. Рисуем в
   canvas на этапе mount (один раз) и больше не трогаем.
   ────────────────────────────────────────────────────────────────────────── */

export default function BeforeAfterSlider({
  original,
  warped,
  labelBefore,
  labelAfter,
}) {
  const beforeCanvasRef = useRef(null);
  const afterCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dividerPercent, setDividerPercent] = useState(50);
  const draggingRef = useRef(false);

  /* ────────── Render both canvases ────────── */
  useEffect(() => {
    if (!original || !warped) return;

    const b = beforeCanvasRef.current;
    const a = afterCanvasRef.current;
    if (!b || !a) return;

    b.width = original.width;
    b.height = original.height;
    a.width = warped.width;
    a.height = warped.height;

    b.getContext("2d").putImageData(original, 0, 0);
    a.getContext("2d").putImageData(warped, 0, 0);
  }, [original, warped]);

  /* ────────── Drag handlers ────────── */
  const updateDivider = useCallback((clientX) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setDividerPercent(pct);
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      draggingRef.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      updateDivider(e.clientX);
    },
    [updateDivider],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!draggingRef.current) return;
      updateDivider(e.clientX);
    },
    [updateDivider],
  );

  const onPointerUp = useCallback((e) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  if (!original || !warped) {
    return <div className={styles.sliderEmpty}>...</div>;
  }

  return (
    <div
      ref={containerRef}
      className={styles.sliderContainer}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Before — полностью видимый, под after. */}
      <canvas ref={beforeCanvasRef} className={styles.sliderCanvas} />

      {/* After — обрезан clip-path справа от делителя. */}
      <canvas
        ref={afterCanvasRef}
        className={styles.sliderCanvas}
        style={{
          clipPath: `inset(0 0 0 ${dividerPercent}%)`,
        }}
      />

      {/* Labels в углах */}
      <div className={`${styles.sliderLabel} ${styles.sliderLabelLeft}`}>
        {labelBefore}
      </div>
      <div className={`${styles.sliderLabel} ${styles.sliderLabelRight}`}>
        {labelAfter}
      </div>

      {/* Divider handle */}
      <div
        className={styles.sliderDivider}
        style={{ insetInlineStart: `${dividerPercent}%` }}
      >
        <div className={styles.sliderDividerHandle}>
          <span className={styles.sliderDividerArrow}>‹</span>
          <span className={styles.sliderDividerArrow}>›</span>
        </div>
      </div>
    </div>
  );
}
