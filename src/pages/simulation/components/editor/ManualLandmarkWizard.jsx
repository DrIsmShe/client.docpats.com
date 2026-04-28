// src/pages/simulation/components/editor/ManualLandmarkWizard.jsx
//
// S.7.7+ — UI компонент wizard'а ручной разметки.
//
// Рендерится поверх canvas (z-index выше toolbar). Показывает:
//   • Текущий шаг (Шаг 2 из 6)
//   • Инструкцию ("Кликните на переносицу")
//   • Прогресс-бар
//   • Кнопки "Назад" / "Отмена"
//
// Сами клики ловит LandmarksOverlay через wizard.handleClick.

import React from "react";
import { useTranslation } from "react-i18next";

const wizardStyle = {
  position: "absolute",
  top: 60, // под toolbar
  insetInlineStart: "50%",
  transform: "translateX(-50%)",
  width: "min(560px, calc(100% - 32px))",
  background: "rgba(15, 21, 40, 0.96)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(168, 85, 247, 0.4)",
  borderRadius: 12,
  padding: "14px 18px",
  zIndex: 30,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
  pointerEvents: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const stepLabelStyle = {
  fontSize: 11,
  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
  color: "#c4b5fd",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontWeight: 600,
};

const titleStyle = {
  fontSize: 16,
  fontWeight: 600,
  color: "#ffffff",
  lineHeight: 1.3,
  margin: 0,
};

const promptStyle = {
  fontSize: 14,
  color: "#e2e8f0",
  lineHeight: 1.5,
};

const progressBarStyle = {
  width: "100%",
  height: 4,
  background: "rgba(255, 255, 255, 0.08)",
  borderRadius: 2,
  overflow: "hidden",
};

const progressFillStyle = (pct) => ({
  width: `${pct}%`,
  height: "100%",
  background: "linear-gradient(90deg, #a855f7 0%, #c084fc 100%)",
  borderRadius: 2,
  transition: "width 0.25s ease",
});

const actionsRowStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const ghostBtnStyle = {
  padding: "6px 12px",
  background: "rgba(255, 255, 255, 0.06)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: 6,
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 500,
  fontFamily: "inherit",
  cursor: "pointer",
};

const ghostBtnDisabledStyle = {
  ...ghostBtnStyle,
  opacity: 0.4,
  cursor: "not-allowed",
};

const cancelBtnStyle = {
  padding: "6px 12px",
  background: "transparent",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  borderRadius: 6,
  color: "rgba(252, 165, 165, 0.9)",
  fontSize: 12,
  fontWeight: 500,
  fontFamily: "inherit",
  cursor: "pointer",
  marginInlineStart: "auto",
};

export default function ManualLandmarkWizard({ wizard }) {
  const { t } = useTranslation("Simulation");

  if (!wizard.active) return null;
  if (!wizard.currentAnchor) return null;

  const stepLabel = t("manualLandmarks.stepLabel", {
    current: wizard.currentStep + 1,
    total: wizard.totalSteps,
    defaultValue: `Шаг ${wizard.currentStep + 1} из ${wizard.totalSteps}`,
  });

  const prompt = t(wizard.currentAnchor.promptKey, {
    defaultValue: wizard.currentAnchor.promptDefault,
  });

  return (
    <div style={wizardStyle} role="dialog" aria-live="polite">
      <div style={headerRowStyle}>
        <span style={stepLabelStyle}>{stepLabel}</span>
        <span style={stepLabelStyle}>{wizard.progressPercent}%</span>
      </div>

      <div style={progressBarStyle}>
        <div style={progressFillStyle(wizard.progressPercent)} />
      </div>

      <div>
        <h4 style={titleStyle}>
          {t("manualLandmarks.title", {
            defaultValue: "Ручная разметка лица",
          })}
        </h4>
        <p style={{ ...promptStyle, marginTop: 6 }}>{prompt}</p>
      </div>

      <div style={actionsRowStyle}>
        <button
          type="button"
          style={wizard.canUndo ? ghostBtnStyle : ghostBtnDisabledStyle}
          onClick={wizard.undoLast}
          disabled={!wizard.canUndo}
        >
          ←{" "}
          {t("manualLandmarks.undo", {
            defaultValue: "Назад",
          })}
        </button>
        <button type="button" style={cancelBtnStyle} onClick={wizard.cancel}>
          {t("manualLandmarks.cancel", {
            defaultValue: "Отмена",
          })}
        </button>
      </div>
    </div>
  );
}
