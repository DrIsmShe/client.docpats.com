// src/pages/simulation/components/editor/MeasurementsOverlay.jsx
//
// S.7.7+ — упрощённый рендер:
//   • На canvas рисуются ТОЛЬКО геометрические элементы измерений:
//     линии, дуги, тики. БЕЗ лейблов с числовыми значениями.
//   • Все числовые значения отображаются в правой панели MeasurementsPanel.
//   • Out-of-range подсвечивается КРАСНЫМ цветом линии (визуальный сигнал
//     врачу что значение вне нормы), без лейбла на canvas.
//
// Почему убраны лейблы:
//   1. Smart-positioning логика выноса лейблов в боковой столбец
//      пересекалась с UI-панелями слева/справа на desktop.
//   2. Дублирование цифр (на canvas + в панели) визуально шумит.
//   3. Чистый canvas = врач сосредоточен на лице, цифры читает в панели.

import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useMeasurements } from "../../hooks/useMeasurements.js";
import { selectVisibleMeasurements } from "../../store/simulationSlice.js";

const COLOR_NASOFRONTAL = "#3d7fff";
const COLOR_GOODE = "#22c55e";
const COLOR_ALAR = "#f59e0b";
const COLOR_OUT_OF_RANGE = "#ef4444";

const LINE_WIDTH = 1.8;
const ARC_RADIUS_PX = 28;
const TICK_LEN = 6;

/**
 * Конвертирует normalized point (0..1) в screen-coordinates.
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

export default function MeasurementsOverlay({ preview, viewport, canvasSize }) {
  const canvasRef = useRef(null);
  const visible = useSelector(selectVisibleMeasurements);
  const { measurements } = useMeasurements();

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

    /* ─── Nasofrontal angle ─── */
    if (visible.nasofrontalAngle && measurements.nasofrontalAngle) {
      const m = measurements.nasofrontalAngle;
      const G = toScreen(m.points.glabella, preview, viewport);
      const N = toScreen(m.points.nasion, preview, viewport);
      const P = toScreen(m.points.pronasale, preview, viewport);

      const color = m.inNormalRange ? COLOR_NASOFRONTAL : COLOR_OUT_OF_RANGE;
      ctx.strokeStyle = color;
      ctx.lineWidth = LINE_WIDTH;
      ctx.setLineDash([]);

      // Two segments: glabella → nasion → pronasale
      ctx.beginPath();
      ctx.moveTo(G.x, G.y);
      ctx.lineTo(N.x, N.y);
      ctx.lineTo(P.x, P.y);
      ctx.stroke();

      // Arc at vertex N (визуализация самого угла)
      const a1 = Math.atan2(G.y - N.y, G.x - N.x);
      const a2 = Math.atan2(P.y - N.y, P.x - N.x);
      ctx.beginPath();
      ctx.arc(N.x, N.y, ARC_RADIUS_PX, a1, a2);
      ctx.stroke();
    }

    /* ─── Goode tip projection ─── */
    if (visible.goodeProjection && measurements.goodeProjection) {
      const m = measurements.goodeProjection;
      const tipFrom = toScreen(m.tipLine.from, preview, viewport);
      const tipTo = toScreen(m.tipLine.to, preview, viewport);
      const nasFrom = toScreen(m.nasionLine.from, preview, viewport);
      const nasTo = toScreen(m.nasionLine.to, preview, viewport);

      const color = m.inNormalRange ? COLOR_GOODE : COLOR_OUT_OF_RANGE;
      ctx.strokeStyle = color;
      ctx.lineWidth = LINE_WIDTH;

      // Tip line (solid)
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(tipFrom.x, tipFrom.y);
      ctx.lineTo(tipTo.x, tipTo.y);
      ctx.stroke();

      // Nasion line (dashed — это «эталонная» линия для сравнения)
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(nasFrom.x, nasFrom.y);
      ctx.lineTo(nasTo.x, nasTo.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    /* ─── Alar base width ─── */
    if (visible.alarBaseWidth && measurements.alarBaseWidth) {
      const m = measurements.alarBaseWidth;
      const L = toScreen(m.points.left, preview, viewport);
      const R = toScreen(m.points.right, preview, viewport);

      ctx.strokeStyle = COLOR_ALAR;
      ctx.lineWidth = LINE_WIDTH;
      ctx.setLineDash([]);

      // Main horizontal line
      ctx.beginPath();
      ctx.moveTo(L.x, L.y);
      ctx.lineTo(R.x, R.y);
      ctx.stroke();

      // Perpendicular ticks at both ends
      const dx = R.x - L.x;
      const dy = R.y - L.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      ctx.beginPath();
      ctx.moveTo(L.x + nx * TICK_LEN, L.y + ny * TICK_LEN);
      ctx.lineTo(L.x - nx * TICK_LEN, L.y - ny * TICK_LEN);
      ctx.moveTo(R.x + nx * TICK_LEN, R.y + ny * TICK_LEN);
      ctx.lineTo(R.x - nx * TICK_LEN, R.y - ny * TICK_LEN);
      ctx.stroke();
    }
  }, [measurements, visible, preview, viewport, canvasSize]);

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
