// src/pages/simulation/standards/wizard/StandardsLandmarkWizardOverlay.jsx
//
// Fullscreen overlay для wizard.
// Показывается когда wizard.active === true.
//
// Перехватывает клики на canvas → конвертирует в нормализованные
// координаты через переданный converter → registerClick.
//
// Также рисует уже поставленные точки и подсказку для текущего шага.

import React, { useCallback, useEffect } from "react";
import styles from "./StandardsLandmarkWizardOverlay.module.css";

const POINT_COLORS = [
  "#3d7fff", // glabella
  "#22c55e", // nasion
  "#f59e0b", // pronasale
  "#ef4444", // alarLeft
  "#a855f7", // alarRight
  "#06b6d4", // chin
];

export default function StandardsLandmarkWizardOverlay({
  wizard,
  preview,
  viewport,
  canvasSize,
  pointerToNorm,
}) {
  const {
    active,
    clicks,
    currentStepIndex,
    totalSteps,
    isComplete,
    currentAnchor,
    registerClick,
    cancel,
    undoLastClick,
    finalize,
  } = wizard;

  // Автоматически финализируем после последнего клика
  useEffect(() => {
    if (active && isComplete) {
      const t = setTimeout(() => finalize(), 200); // небольшой delay для UX
      return () => clearTimeout(t);
    }
    return undefined;
  }, [active, isComplete, finalize]);

  // Обработка Escape — отмена
  useEffect(() => {
    if (!active) return undefined;
    const handler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      } else if (e.key === "Backspace" && clicks.length > 0) {
        e.preventDefault();
        undoLastClick();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, clicks.length, cancel, undoLastClick]);

  const handleClick = useCallback(
    (e) => {
      if (!active || isComplete) return;
      const norm = pointerToNorm?.(e, e.currentTarget);
      if (!norm) return;
      registerClick(norm);
    },
    [active, isComplete, pointerToNorm, registerClick],
  );

  if (!active || !preview || !canvasSize?.width) return null;

  const scale = viewport?.scale ?? 1;
  const tx = viewport?.tx ?? 0;
  const ty = viewport?.ty ?? 0;

  // Конвертер norm → screen для рендера уже поставленных точек
  const normToScreen = (p) => ({
    x: p.x * preview.width * scale + tx,
    y: p.y * preview.height * scale + ty,
  });

  const promptText =
    currentAnchor?.promptDefault ||
    (isComplete
      ? "Готово, обработка..."
      : `Шаг ${currentStepIndex + 1} из ${totalSteps}`);

  return (
    <>
      {/* Click-handler overlay — перехватывает клики на canvas */}
      <div
        className={styles.clickLayer}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          if (clicks.length > 0) undoLastClick();
        }}
      />

      {/* SVG для уже поставленных точек */}
      <svg
        className={styles.pointsLayer}
        width={canvasSize.width}
        height={canvasSize.height}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
      >
        {clicks.map((click, idx) => {
          const screen = normToScreen(click);
          const color = POINT_COLORS[idx] || "#fff";
          return (
            <g key={click.key}>
              <circle
                cx={screen.x}
                cy={screen.y}
                r="8"
                fill={color}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={screen.x + 12}
                y={screen.y - 8}
                fill="#fff"
                fontSize="11"
                fontWeight="600"
                stroke="#000"
                strokeWidth="0.5"
                paintOrder="stroke"
              >
                {idx + 1}. {click.key}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating instruction panel */}
      <div className={styles.instructionPanel}>
        <div className={styles.instructionHeader}>
          <span className={styles.stepBadge}>
            {Math.min(currentStepIndex + 1, totalSteps)} / {totalSteps}
          </span>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={cancel}
            aria-label="Отмена"
          >
            ✕
          </button>
        </div>

        <div className={styles.promptText}>{promptText}</div>

        <div className={styles.progressBar}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`${styles.progressDot} ${
                i < clicks.length
                  ? styles.progressDotDone
                  : i === currentStepIndex
                    ? styles.progressDotActive
                    : ""
              }`}
              style={{
                background: i < clicks.length ? POINT_COLORS[i] : undefined,
              }}
            />
          ))}
        </div>

        <div className={styles.actionsRow}>
          {clicks.length > 0 && (
            <button
              type="button"
              className={styles.undoBtn}
              onClick={undoLastClick}
            >
              ↶ Отменить шаг
            </button>
          )}
        </div>

        <div className={styles.hintText}>
          {clicks.length > 0
            ? "ESC — отмена, Backspace — назад"
            : "Кликайте по фото в указанных точках. ESC — отмена."}
        </div>
      </div>
    </>
  );
}
