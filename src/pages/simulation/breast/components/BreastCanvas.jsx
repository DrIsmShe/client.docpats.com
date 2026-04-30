// src/pages/simulation/breast/components/BreastCanvas.jsx
//
// Phase Б.2 — Canvas с поддержкой warpedImageData.
// Если warpedImageData есть — рисуем его, иначе оригинальный bitmap.
// Same pattern что в face SimulationCanvas.

import React, { useEffect, useRef, useCallback } from "react";

export default function BreastCanvas({
  preview,
  viewport,
  warpedImageData, // Phase Б.2
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSizeChange,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const warpedCanvasRef = useRef(null); // offscreen для warpedImageData

  /* ─── ResizeObserver ─── */
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

  /* ─── Offscreen canvas для warpedImageData ─── */
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

  /* ─── Render ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !preview) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#0f1420";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    ctx.save();
    ctx.translate(viewport.tx, viewport.ty);
    ctx.scale(viewport.scale, viewport.scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = viewport.scale < 1 ? "high" : "low";

    // Если есть warped — рисуем его, иначе оригинал
    const source =
      warpedImageData && warpedCanvasRef.current
        ? warpedCanvasRef.current
        : preview.bitmap;

    ctx.drawImage(source, 0, 0, preview.width, preview.height);
    ctx.restore();
  }, [preview, viewport, warpedImageData]);

  /* ─── Wheel listener ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onWheel) return undefined;
    const handler = (evt) => onWheel(evt, canvas);
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [onWheel]);

  const wheelHandler = useCallback(
    (evt) => {
      onWheel?.(evt.nativeEvent, canvasRef.current);
    },
    [onWheel],
  );

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
