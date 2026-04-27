// src/pages/simulation/components/editor/ControlPointLayer.jsx
import React, { useMemo } from "react";
import ControlPointHandle from "./ControlPointHandle.jsx";
import {
  normalizedToImage,
  imageToCanvas,
} from "../../utils/coordinateHelpers.js";

/* ──────────────────────────────────────────────────────────────────────────
   Overlay с SVG-маркерами над canvas.

   КРИТИЧНО (pointer-events):
   — Корневой <svg> имеет pointerEvents: "none" → клики проходят насквозь
     к canvas-контейнеру, который обрабатывает pan (select-mode) или
     добавление точки (add-mode).
   — Конкретные handles (circle/rect в ControlPointHandle) получают
     events благодаря <g pointerEvents="auto"> обёртке. Это позволяет
     схватить маркер даже в select-режиме для drag, но не перехватывать
     фоновые клики.
   ────────────────────────────────────────────────────────────────────────── */

export default function ControlPointLayer({
  points,
  preview,
  viewport,
  canvasSize,
  selectedKey,
  mode, // оставлено для будущих расширений (курсор в add-режиме и т.п.)
  onSelect,
  onCurrentPointerDown,
  onAnchorPointerDown,
  onBackgroundClick, // не вешаем на корень — оставлено для совместимости
}) {
  const projected = useMemo(() => {
    if (!preview || !canvasSize.width) return [];
    return points.map((p) => {
      const anchorImg = normalizedToImage(
        p.anchor.x,
        p.anchor.y,
        preview.width,
        preview.height,
      );
      const currentImg = normalizedToImage(
        p.current.x,
        p.current.y,
        preview.width,
        preview.height,
      );
      const anchorPx = imageToCanvas(anchorImg.x, anchorImg.y, viewport);
      const currentPx = imageToCanvas(currentImg.x, currentImg.y, viewport);
      const pixelRadius =
        p.radius * Math.max(preview.width, preview.height) * viewport.scale;
      return {
        point: p,
        anchorPx,
        currentPx,
        pixelRadius,
      };
    });
  }, [points, preview, viewport, canvasSize]);

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none", // клики проваливаются к canvas
      }}
    >
      <g style={{ pointerEvents: "auto" }}>
        {projected.map(({ point, anchorPx, currentPx, pixelRadius }) => (
          <ControlPointHandle
            key={point.key}
            point={point}
            pixelAnchor={anchorPx}
            pixelCurrent={currentPx}
            pixelRadius={pixelRadius}
            isSelected={point.key === selectedKey}
            onSelect={onSelect}
            onCurrentPointerDown={onCurrentPointerDown}
            onAnchorPointerDown={onAnchorPointerDown}
          />
        ))}
      </g>
    </svg>
  );
}
