// src/pages/simulation/components/editor/LandmarksOverlay.jsx
//
// S.7.7+ — добавлен wizard mode (Manual Landmark Wizard).
// Когда wizardActive=true:
//   • Все клики ловятся и передаются в wizard.handleClick
//   • Авто-точки скрываются (рисуем разметку с нуля)
//   • Уже размеченные wizard'ом точки рендерятся фиолетовыми кружками
//     с номером (1-6)
//
// Когда wizardActive=false — поведение как раньше.

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  selectVisibleLandmarks,
  selectVisibleLandmarkGroups,
} from "../../store/simulationSlice.js";
import { ANCHOR_POINTS } from "../../mediapipe/canonicalAnchorPoints.js";

const GROUP_COLORS = {
  face_oval: "#94a3b8",
  forehead: "#fbbf24",
  nose: "#3d7fff",
  lips: "#ef4444",
  left_eye: "#22c55e",
  right_eye: "#22c55e",
  left_eyebrow: "#f59e0b",
  right_eyebrow: "#f59e0b",
  left_cheek: "#ec4899",
  right_cheek: "#ec4899",
  left_jaw: "#06b6d4",
  right_jaw: "#06b6d4",
  chin: "#8b5cf6",
  ears: "#14b8a6",
  manual: "#a855f7",
  other: "#cbd5e1",
};

const DIMMED_COLOR = "rgba(148, 163, 184, 0.35)";

const POINT_RADIUS = 1.8;
const POINT_RADIUS_DIMMED = 1.0;
const POINT_RADIUS_HOVER = 5;
const POINT_RADIUS_MANUAL = 3;
const HIT_RADIUS_PX = 12;

// Wizard markers
const WIZARD_MARKER_RADIUS = 9;
const WIZARD_MARKER_COLOR = "#a855f7";
const WIZARD_MARKER_BORDER = "#ffffff";

export default function LandmarksOverlay({
  preview,
  viewport,
  canvasSize,
  mode,
  landmarkEditMode,
  onLandmarkClick,
  onLandmarkRemove,
  onAddManualLandmark,
  // S.7.7+ wizard
  wizard,
}) {
  const canvasRef = useRef(null);
  const landmarks = useSelector(selectVisibleLandmarks);
  const visibleGroups = useSelector(selectVisibleLandmarkGroups);
  const [hoveredId, setHoveredId] = useState(null);

  const wizardActive = !!wizard?.active;

  const effectiveEditMode =
    landmarkEditMode || (mode === "add" ? "pick" : null);
  const isInteractive = wizardActive || effectiveEditMode !== null;

  const norm2screen = useCallback(
    (lm) => {
      const scale = viewport?.scale ?? 1;
      const tx = viewport?.tx ?? 0;
      const ty = viewport?.ty ?? 0;
      return {
        x: lm.x * preview.width * scale + tx,
        y: lm.y * preview.height * scale + ty,
      };
    },
    [viewport, preview],
  );

  const hitTest = useCallback(
    (screenX, screenY) => {
      if (!landmarks || landmarks.length === 0) return null;

      let bestLm = null;
      let bestDistSq = HIT_RADIUS_PX * HIT_RADIUS_PX;

      for (const lm of landmarks) {
        const sp = norm2screen(lm);
        const dx = sp.x - screenX;
        const dy = sp.y - screenY;
        const distSq = dx * dx + dy * dy;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestLm = lm;
        }
      }
      return bestLm;
    },
    [landmarks, norm2screen],
  );

  const screenToNorm = useCallback(
    (screenX, screenY) => {
      const scale = viewport?.scale ?? 1;
      const tx = viewport?.tx ?? 0;
      const ty = viewport?.ty ?? 0;
      const imgX = (screenX - tx) / scale;
      const imgY = (screenY - ty) / scale;
      return {
        x: imgX / preview.width,
        y: imgY / preview.height,
      };
    },
    [viewport, preview],
  );

  /* ────── Render ────── */
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

    /* ─── WIZARD MODE ─── */
    if (wizardActive) {
      // В wizard'е НЕ рисуем 478 авто-точек — только размеченные anchor'ы
      const marked = wizard?.marked || {};
      ANCHOR_POINTS.forEach((anchor, idx) => {
        const point = marked[anchor.key];
        if (!point) return;

        const scale = viewport?.scale ?? 1;
        const tx = viewport?.tx ?? 0;
        const ty = viewport?.ty ?? 0;
        const sx = point.x * preview.width * scale + tx;
        const sy = point.y * preview.height * scale + ty;

        // Фиолетовый круг
        ctx.fillStyle = WIZARD_MARKER_COLOR;
        ctx.beginPath();
        ctx.arc(sx, sy, WIZARD_MARKER_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Белая обводка
        ctx.strokeStyle = WIZARD_MARKER_BORDER;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Номер внутри (1-6)
        ctx.fillStyle = WIZARD_MARKER_BORDER;
        ctx.font = "700 11px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(idx + 1), sx, sy + 0.5);
      });
      return;
    }

    /* ─── NORMAL MODE ─── */
    if (!landmarks || landmarks.length === 0) return;

    const visibleSet = new Set(visibleGroups);

    // PASS 1: приглушённые
    landmarks.forEach((lm) => {
      if (visibleSet.has(lm.group)) return;
      const { x: px, y: py } = norm2screen(lm);
      if (px < -10 || py < -10 || px > width + 10 || py > height + 10) return;

      ctx.fillStyle = DIMMED_COLOR;
      ctx.beginPath();
      ctx.arc(px, py, POINT_RADIUS_DIMMED, 0, Math.PI * 2);
      ctx.fill();
    });

    // PASS 2: яркие активных групп
    landmarks.forEach((lm) => {
      if (!visibleSet.has(lm.group)) return;
      const { x: px, y: py } = norm2screen(lm);
      if (px < -10 || py < -10 || px > width + 10 || py > height + 10) return;

      const isHovered = isInteractive && lm.id === hoveredId;
      const isManual = lm.autoGenerated === false;
      const color = GROUP_COLORS[lm.group] || GROUP_COLORS.other;
      const baseRadius = isManual ? POINT_RADIUS_MANUAL : POINT_RADIUS;
      const radius = isHovered ? POINT_RADIUS_HOVER : baseRadius;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isHovered) {
        ctx.strokeStyle = effectiveEditMode === "hide" ? "#ef4444" : "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (isManual) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }, [
    landmarks,
    visibleGroups,
    preview,
    viewport,
    canvasSize,
    isInteractive,
    hoveredId,
    effectiveEditMode,
    norm2screen,
    wizardActive,
    wizard?.marked,
  ]);

  /* ────── Pointer ────── */
  const onMove = useCallback(
    (e) => {
      if (!isInteractive) return;
      if (wizardActive) return; // в wizard hover не нужен
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (effectiveEditMode === "addManual") {
        setHoveredId(null);
        return;
      }

      const lm = hitTest(x, y);
      setHoveredId(lm?.id ?? null);
    },
    [isInteractive, wizardActive, effectiveEditMode, hitTest],
  );

  const onLeave = useCallback(() => {
    setHoveredId(null);
  }, []);

  const onClick = useCallback(
    (e) => {
      if (!isInteractive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // S.7.7+ — wizard mode перехватывает все клики
      if (wizardActive) {
        const norm = screenToNorm(x, y);
        wizard.handleClick(norm);
        return;
      }

      if (effectiveEditMode === "addManual") {
        if (onAddManualLandmark) {
          const norm = screenToNorm(x, y);
          onAddManualLandmark(norm);
        }
        return;
      }

      const lm = hitTest(x, y);
      if (!lm) return;

      if (effectiveEditMode === "hide") {
        if (onLandmarkRemove) onLandmarkRemove(lm.id);
      } else {
        if (onLandmarkClick) onLandmarkClick({ x: lm.x, y: lm.y }, lm);
      }
    },
    [
      isInteractive,
      wizardActive,
      wizard,
      effectiveEditMode,
      hitTest,
      screenToNorm,
      onLandmarkClick,
      onLandmarkRemove,
      onAddManualLandmark,
    ],
  );

  let cursor = "default";
  if (isInteractive) {
    if (wizardActive) cursor = "crosshair";
    else if (effectiveEditMode === "addManual") cursor = "crosshair";
    else if (effectiveEditMode === "hide" && hoveredId) cursor = "not-allowed";
    else if (hoveredId) cursor = "crosshair";
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={onClick}
      style={{
        position: "absolute",
        insetInlineStart: 0,
        top: 0,
        pointerEvents: isInteractive ? "auto" : "none",
        cursor,
        // В wizard'е overlay поверх всего, чтобы клики не уходили на canvas
        zIndex: wizardActive ? 15 : "auto",
      }}
      aria-hidden="true"
    />
  );
}
