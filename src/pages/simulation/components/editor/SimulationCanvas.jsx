// src/pages/simulation/components/editor/SimulationCanvas.jsx
import React, { useEffect, useRef, useCallback } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Canvas-рендерер. S.3 обновление: приоритет рендера
     warpedImageData (если есть) → bitmap (fallback / первый кадр).

   warpedImageData — результат warp worker'а. Это ImageData в размере
   preview (1200×X), которое мы putImageData'им в offscreen, а потом
   drawImage'им с viewport-трансформацией. Напрямую putImageData на
   видимый canvas НЕ использует viewport (putImageData игнорирует
   currentTransform — это фича браузера, не баг).
   ────────────────────────────────────────────────────────────────────────── */

export default function SimulationCanvas({
  preview,
  viewport,
  warpedImageData,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSizeChange,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const warpedCanvasRef = useRef(null); // offscreen для warped ImageData

  /* ────────── ResizeObserver ────────── */
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    const applySize = (cssW, cssH) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      onSizeChange?.({ width: cssW, height: cssH, dpr });
    };

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      applySize(width, height);
    });

    ro.observe(container);
    const rect = container.getBoundingClientRect();
    applySize(rect.width, rect.height);
    return () => ro.disconnect();
  }, [onSizeChange]);

  /* ────────── Offscreen canvas для warpedImageData ──────────
     Держим отдельный canvas размера preview. putImageData → он,
     потом drawImage(offscreen) → на видимый с viewport transform.
  */
  useEffect(() => {
    if (!warpedImageData) return;

    let oc = warpedCanvasRef.current;
    if (!oc) {
      oc =
        typeof OffscreenCanvas !== "undefined"
          ? new OffscreenCanvas(warpedImageData.width, warpedImageData.height)
          : Object.assign(document.createElement("canvas"), {
              width: warpedImageData.width,
              height: warpedImageData.height,
            });
      warpedCanvasRef.current = oc;
    } else if (
      oc.width !== warpedImageData.width ||
      oc.height !== warpedImageData.height
    ) {
      oc.width = warpedImageData.width;
      oc.height = warpedImageData.height;
    }

    const ctx = oc.getContext("2d");
    ctx.putImageData(warpedImageData, 0, 0);
  }, [warpedImageData]);

  /* ────────── Render: выбираем источник и рисуем ────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !preview) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    ctx.save();
    ctx.translate(viewport.tx, viewport.ty);
    ctx.scale(viewport.scale, viewport.scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = viewport.scale < 1 ? "high" : "low";

    // Если есть warped — рисуем его; иначе чистый bitmap.
    const source =
      warpedImageData && warpedCanvasRef.current
        ? warpedCanvasRef.current
        : preview.bitmap;

    ctx.drawImage(source, 0, 0, preview.width, preview.height);
    ctx.restore();
  }, [preview, viewport, warpedImageData]);

  const wheelHandler = useCallback(
    (evt) => {
      onWheel?.(evt.nativeEvent, canvasRef.current);
    },
    [onWheel],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onWheel) return undefined;
    const handler = (evt) => onWheel(evt, canvas);
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [onWheel]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        flex: 1,
        position: "relative",
        overflow: "hidden",
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          position: "absolute",
          inset: 0,
        }}
        onWheel={wheelHandler}
      />
    </div>
  );
}
