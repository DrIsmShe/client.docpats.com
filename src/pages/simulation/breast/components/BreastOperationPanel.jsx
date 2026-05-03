// src/pages/simulation/breast/components/BreastOperationPanel.jsx

import React from "react";
import { useTranslation } from "react-i18next";

export default function BreastOperationPanel({
  controlPointsCount,
  isAddMode,
  canCompare,
  onClearPoints,
  onToggleAddMode,
  onOpenCompare,
}) {
  const { t } = useTranslation("Simulation");

  return (
    <div style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div style={titleStyle}>
          {t("breastOperationPanel.title", { defaultValue: "Деформация" })}
        </div>
        <span style={countBadgeStyle}>{controlPointsCount}</span>
      </div>

      <button
        type="button"
        style={{
          ...addPointButtonStyle,
          ...(isAddMode ? addPointActiveStyle : {}),
        }}
        onClick={onToggleAddMode}
      >
        {isAddMode
          ? `✕ ${t("breastOperationPanel.cancel", { defaultValue: "Отмена" })}`
          : `+ ${t("breastOperationPanel.addPoint", {
              defaultValue: "Добавить точку",
            })}`}
      </button>

      {canCompare && onOpenCompare && (
        <button
          type="button"
          style={compareButtonStyle}
          onClick={onOpenCompare}
        >
          🔍{" "}
          {t("breastOperationPanel.compareButton", {
            defaultValue: "До / После",
          })}
        </button>
      )}

      {controlPointsCount > 0 && (
        <button
          type="button"
          style={clearAllButtonStyle}
          onClick={onClearPoints}
        >
          🗑{" "}
          {t("breastOperationPanel.clearAll", {
            defaultValue: "Удалить все точки",
          })}
        </button>
      )}

      <div style={helpStyle}>
        <strong style={helpTitleStyle}>
          {t("breastOperationPanel.help.title", {
            defaultValue: "Как работать:",
          })}
        </strong>
        <div style={helpRowStyle}>
          <span style={kbdStyle}>+</span>
          <span>
            {t("breastOperationPanel.help.addPoint", {
              defaultValue: "Добавить точку — клик на фото",
            })}
          </span>
        </div>
        <div style={helpRowStyle}>
          <span style={dotBlueStyle} />
          <span>
            {t("breastOperationPanel.help.dragBlue", {
              defaultValue: "Тяни синюю — деформация",
            })}
          </span>
        </div>
        <div style={helpRowStyle}>
          <span style={dotGreenStyle} />
          <span>
            {t("breastOperationPanel.help.dragGreen", {
              defaultValue: "Тяни зелёную — переместить",
            })}
          </span>
        </div>
        <div style={helpRowStyle}>
          <span style={kbdStyle}>⚙</span>
          <span>
            {t("breastOperationPanel.help.clickPoint", {
              defaultValue: "Клик по точке — настройки",
            })}
          </span>
        </div>
        <div style={helpRowStyle}>
          <span style={kbdStyle}>⊙</span>
          <span>
            {t("breastOperationPanel.help.wheelRadius", {
              defaultValue: "Колесо мыши — радиус",
            })}
          </span>
        </div>
        <div style={helpRowStyle}>
          <span style={kbdStyle}>⇧</span>
          <span>
            {t("breastOperationPanel.help.shiftClickRemove", {
              defaultValue: "Shift+клик — удалить",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────── styles ─────── */

const panelStyle = {
  background: "rgba(20, 24, 38, 0.92)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.08)",
  borderRadius: 10,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  color: "#e2e8f0",
};

const panelHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  paddingBottom: 8,
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "rgba(255, 255, 255, 0.08)",
};

const titleStyle = {
  fontSize: 13,
  fontWeight: 600,
};

const countBadgeStyle = {
  fontSize: 11,
  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
  color: "#3d7fff",
  fontWeight: 700,
  background: "rgba(61, 127, 255, 0.12)",
  padding: "3px 10px",
  borderRadius: 12,
  minWidth: 28,
  textAlign: "center",
};

const addPointButtonStyle = {
  padding: "11px 14px",
  background: "rgba(61, 127, 255, 0.18)",
  color: "#93c5fd",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(61, 127, 255, 0.4)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
  fontFamily: "inherit",
};

const addPointActiveStyle = {
  background: "rgba(34, 197, 94, 0.18)",
  color: "#4ade80",
  borderColor: "rgba(34, 197, 94, 0.5)",
};

const compareButtonStyle = {
  padding: "11px 14px",
  background: "rgba(34, 197, 94, 0.15)",
  color: "#4ade80",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(34, 197, 94, 0.35)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "inherit",
};

const clearAllButtonStyle = {
  padding: "8px 12px",
  background: "transparent",
  color: "rgba(252, 165, 165, 0.85)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(239, 68, 68, 0.25)",
  borderRadius: 5,
  cursor: "pointer",
  fontSize: 11,
  fontFamily: "inherit",
};

const helpStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
  marginTop: 6,
  padding: "10px 12px",
  background: "rgba(255, 255, 255, 0.03)",
  borderRadius: 6,
  fontSize: 11,
  color: "#94a3b8",
};

const helpTitleStyle = {
  fontSize: 10,
  fontWeight: 600,
  color: "#cbd5e1",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 2,
};

const helpRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  lineHeight: 1.4,
};

const kbdStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 18,
  height: 18,
  background: "rgba(255, 255, 255, 0.05)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.1)",
  borderRadius: 3,
  fontSize: 10,
  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
  flexShrink: 0,
};

const dotBlueStyle = {
  display: "inline-block",
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#3d7fff",
  borderWidth: 1.5,
  borderStyle: "solid",
  borderColor: "#fff",
  flexShrink: 0,
  marginInlineStart: 4,
  marginInlineEnd: 4,
};

const dotGreenStyle = {
  display: "inline-block",
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#22c55e",
  borderWidth: 1.5,
  borderStyle: "solid",
  borderColor: "#fff",
  flexShrink: 0,
  marginInlineStart: 4,
  marginInlineEnd: 4,
};
