// src/pages/simulation/components/editor/MeasurementsOverlay.jsx
//
// Canvas-слой поверх LandmarksOverlay. Рендерит:
//   - линии для nasofrontal angle (G→N→P) и дугу с подписью
//   - две линии для Goode's projection с числовым значением
//   - линию между крыльями носа для alar base width
//
// Использует тот же viewport ({scale, tx, ty}) что и SimulationCanvas.

import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useMeasurements } from "../../hooks/useMeasurements.js";
import { selectVisibleMeasurements } from "../../store/simulationSlice.js";
import { formatMeasurement } from "../../mediapipe/measurements.js";

const COLOR_NASOFRONTAL = "#3d7fff";
const COLOR_GOODE = "#22c55e";
const COLOR_ALAR = "#f59e0b";
const COLOR_OUT_OF_RANGE = "#ef4444";

const LINE_WIDTH = 1.6;
const ARC_RADIUS_PX = 28;
const LABEL_FONT = "600 12px system-ui, -apple-system, sans-serif";
const LABEL_BG = "rgba(15, 21, 40, 0.85)";
const LABEL_TEXT = "#e2e8f0";

/**
 * Преобразует нормализованную точку в screen-координаты.
 * viewport: { scale, tx, ty } — как в useZoomPan.
 */
function toScreen(point, preview, viewport) {
  const scale = viewport?.scale ?? 1;
  const tx = viewport?.tx ?? 0;
  const ty = viewport?.ty ?? 0;
  return {
    x: point.x * preview.width * scale + tx,
    y: point.y * preview.height * scale + ty,
  };
}

/**
 * Рисует labeled-плашку с текстом по центру указанной точки.
 */
function drawLabel(ctx, text, cx, cy) {
  ctx.font = LABEL_FONT;
  const metrics = ctx.measureText(text);
  const padX = 6;
  const w = metrics.width + padX * 2;
  const h = 18;

  ctx.fillStyle = LABEL_BG;
  // roundRect не везде поддержан, fallback на простой rect
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 4);
    ctx.fill();
  } else {
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  }

  ctx.fillStyle = LABEL_TEXT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy);
}

export default function MeasurementsOverlay({ preview, viewport, canvasSize }) {
  const { t } = useTranslation("Simulation");
  const canvasRef = useRef(null);
  const visible = useSelector(selectVisibleMeasurements);
  const { measurements, calibration, imageWidth } = useMeasurements();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !preview || !canvasSize?.width || !canvasSize?.height) {
      return;
    }

    const { width, height } = canvasSize;
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // ─── Nasofrontal angle ─────────────────────────────────────
    if (visible.nasofrontalAngle && measurements.nasofrontalAngle) {
      const { value, points, inNormalRange } = measurements.nasofrontalAngle;
      const G = toScreen(points.glabella, preview, viewport);
      const N = toScreen(points.nasion, preview, viewport);
      const P = toScreen(points.pronasale, preview, viewport);
      const color = inNormalRange ? COLOR_NASOFRONTAL : COLOR_OUT_OF_RANGE;

      ctx.strokeStyle = color;
      ctx.lineWidth = LINE_WIDTH;

      // Линии G→N и N→P
      ctx.beginPath();
      ctx.moveTo(G.x, G.y);
      ctx.lineTo(N.x, N.y);
      ctx.lineTo(P.x, P.y);
      ctx.stroke();

      // Дуга в вершине N
      const angleToG = Math.atan2(G.y - N.y, G.x - N.x);
      const angleToP = Math.atan2(P.y - N.y, P.x - N.x);
      ctx.beginPath();
      ctx.arc(N.x, N.y, ARC_RADIUS_PX, angleToG, angleToP);
      ctx.stroke();

      // Подпись по биссектрисе
      const bisector = (angleToG + angleToP) / 2;
      const labelX = N.x + Math.cos(bisector) * (ARC_RADIUS_PX + 18);
      const labelY = N.y + Math.sin(bisector) * (ARC_RADIUS_PX + 18);
      drawLabel(ctx, formatMeasurement("angle", value).primary, labelX, labelY);
    }

    // ─── Goode's tip projection ────────────────────────────────
    if (visible.goodeProjection && measurements.goodeProjection) {
      const { value, tipLine, nasionLine, inNormalRange } =
        measurements.goodeProjection;
      const color = inNormalRange ? COLOR_GOODE : COLOR_OUT_OF_RANGE;

      const tipFrom = toScreen(tipLine.from, preview, viewport);
      const tipTo = toScreen(tipLine.to, preview, viewport);
      const nasFrom = toScreen(nasionLine.from, preview, viewport);
      const nasTo = toScreen(nasionLine.to, preview, viewport);

      ctx.strokeStyle = color;
      ctx.lineWidth = LINE_WIDTH;

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(tipFrom.x, tipFrom.y);
      ctx.lineTo(tipTo.x, tipTo.y);
      ctx.stroke();

      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(nasFrom.x, nasFrom.y);
      ctx.lineTo(nasTo.x, nasTo.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const cx = (tipFrom.x + tipTo.x) / 2;
      const cy = (tipFrom.y + tipTo.y) / 2;
      drawLabel(ctx, formatMeasurement("ratio", value).primary, cx, cy);
    }

    // ─── Alar base width ───────────────────────────────────────
    if (visible.alarBaseWidth && measurements.alarBaseWidth) {
      const { value, points } = measurements.alarBaseWidth;
      const L = toScreen(points.left, preview, viewport);
      const R = toScreen(points.right, preview, viewport);

      ctx.strokeStyle = COLOR_ALAR;
      ctx.lineWidth = LINE_WIDTH;

      ctx.beginPath();
      ctx.moveTo(L.x, L.y);
      ctx.lineTo(R.x, R.y);
      ctx.stroke();

      const tickLen = 6;
      const dx = R.x - L.x;
      const dy = R.y - L.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      ctx.beginPath();
      ctx.moveTo(L.x + nx * tickLen, L.y + ny * tickLen);
      ctx.lineTo(L.x - nx * tickLen, L.y - ny * tickLen);
      ctx.moveTo(R.x + nx * tickLen, R.y + ny * tickLen);
      ctx.lineTo(R.x - nx * tickLen, R.y - ny * tickLen);
      ctx.stroke();

      const cx = (L.x + R.x) / 2;
      const cy = (L.y + R.y) / 2 - 12;
      const formatted = formatMeasurement(
        "distance",
        value,
        calibration,
        imageWidth,
      );
      drawLabel(ctx, formatted.primary, cx, cy);
    }
  }, [
    measurements,
    visible,
    preview,
    viewport,
    canvasSize,
    calibration,
    imageWidth,
    t,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        insetInlineStart: 0,
        top: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}
