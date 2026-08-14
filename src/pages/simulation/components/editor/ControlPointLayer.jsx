// src/pages/simulation/components/editor/ControlPointLayer.jsx
import React, { useMemo } from "react";
import ControlPointHandle from "./ControlPointHandle.jsx";
import { normalizedToImage } from "../../utils/coordinateHelpers.js";

/* ──────────────────────────────────────────────────────────────────────────
   Overlay с SVG-маркерами над canvas.

   КРИТИЧНО (pointer-events):
   — Корневой <svg> имеет pointerEvents: "none" → клики проходят насквозь
     к canvas-контейнеру, который обрабатывает жест (панорама/щипок) или
     добавление точки.
   — Конкретные handles получают события благодаря <g pointerEvents="auto">.

   ПОЧЕМУ КООРДИНАТЫ В ПРОСТРАНСТВЕ ИЗОБРАЖЕНИЯ (пункт 4)

   Раньше каждая точка проецировалась в экранные пиксели на JS, и любое
   изменение viewport'а пересчитывало весь массив и перерисовывало все
   ручки. При панораме это N перерисовок React на кадр.

   Теперь точки живут в координатах изображения, а viewport — это один
   transform на группе. Панорама меняет ровно одну строку атрибута: сами
   ручки не перерендериваются вообще (они мемоизированы, а их пропсы не
   меняются). Масштаб влияет на invScale — он нужен, чтобы ручки на экране
   оставались одного размера независимо от зума.
   ────────────────────────────────────────────────────────────────────────── */

export default function ControlPointLayer({
  points,
  preview,
  viewport,
  canvasSize,
  selectedKey,
  mode, // оставлено для будущих расширений (курсор в add-режиме и т.п.)
  isMobile,
  onSelect,
  onCurrentPointerDown,
  onAnchorPointerDown,
  onRadiusPointerDown,
  onBackgroundClick, // не вешаем на корень — оставлено для совместимости
}) {
  // Зависит только от точек и размеров кадра — viewport здесь не участвует,
  // поэтому панорама и зум не пересчитывают этот массив.
  const projected = useMemo(() => {
    if (!preview) return [];
    const maxDim = Math.max(preview.width, preview.height);
    return points.map((p) => ({
      point: p,
      anchorImg: normalizedToImage(
        p.anchor.x,
        p.anchor.y,
        preview.width,
        preview.height,
      ),
      currentImg: normalizedToImage(
        p.current.x,
        p.current.y,
        preview.width,
        preview.height,
      ),
      radiusImg: p.radius * maxDim,
    }));
  }, [points, preview]);

  if (!preview || !canvasSize.width) return null;

  const scale = viewport?.scale ?? 1;
  const invScale = scale > 0 ? 1 / scale : 1;

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
      <g
        style={{ pointerEvents: "auto" }}
        transform={`translate(${viewport?.tx ?? 0} ${viewport?.ty ?? 0}) scale(${scale})`}
      >
        {projected.map(({ point, anchorImg, currentImg, radiusImg }) => (
          <ControlPointHandle
            key={point.key}
            point={point}
            imgAnchor={anchorImg}
            imgCurrent={currentImg}
            imgRadius={radiusImg}
            invScale={invScale}
            isMobile={isMobile}
            isSelected={point.key === selectedKey}
            onSelect={onSelect}
            onCurrentPointerDown={onCurrentPointerDown}
            onAnchorPointerDown={onAnchorPointerDown}
            onRadiusPointerDown={onRadiusPointerDown}
          />
        ))}
      </g>
    </svg>
  );
}
