// src/pages/simulation/breast/components/BreastEditorToolbar.jsx
//
// Phase A.4 — Toolbar с увеличенными кнопками на мобиле.

import React from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function BreastEditorToolbar({
  viewport,
  saveStatus,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
}) {
  const isMobile = useIsMobile();
  const zoomPercent = Math.round(viewport.scale * 100);

  const saveLabel = {
    idle: "✓",
    dirty: "●",
    saving: "●",
    saved: "✓",
    error: "✕",
  }[saveStatus];

  const saveColor = {
    idle: "#94a3b8",
    dirty: "#fbbf24",
    saving: "#60a5fa",
    saved: "#4ade80",
    error: "#f87171",
  }[saveStatus];

  const saveTitle = {
    idle: "Сохранено",
    dirty: "Несохранённые изменения",
    saving: "Сохранение...",
    saved: "Сохранено",
    error: "Ошибка сохранения",
  }[saveStatus];

  const buttonStyle = isMobile ? mobileButtonStyle : desktopButtonStyle;
  const dividerStyle = isMobile ? mobileDividerStyle : desktopDividerStyle;
  const zoomValueStyle = isMobile
    ? mobileZoomValueStyle
    : desktopZoomValueStyle;

  return (
    <div style={isMobile ? mobileToolbarStyle : desktopToolbarStyle}>
      <button
        type="button"
        style={buttonStyle}
        onClick={onZoomOut}
        title="Уменьшить (−)"
      >
        −
      </button>
      <div style={zoomValueStyle}>{zoomPercent}%</div>
      <button
        type="button"
        style={buttonStyle}
        onClick={onZoomIn}
        title="Увеличить (+)"
      >
        +
      </button>

      <div style={dividerStyle} />

      <button
        type="button"
        style={buttonStyle}
        onClick={onFit}
        title="Подогнать"
      >
        ⊡
      </button>
      <button type="button" style={buttonStyle} onClick={onReset} title="1:1">
        1:1
      </button>

      <div style={dividerStyle} />

      <div
        style={{
          ...saveStatusStyle,
          color: saveColor,
        }}
        title={saveTitle}
      >
        {saveLabel}
      </div>
    </div>
  );
}

/* ─────── styles ─────── */

const desktopToolbarStyle = {
  position: "absolute",
  top: 12,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "center",
  gap: 2,
  padding: 6,
  background: "rgba(20, 20, 30, 0.85)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.08)",
  borderRadius: 8,
  zIndex: 20,
};

const mobileToolbarStyle = {
  ...desktopToolbarStyle,
  top: 8,
  padding: 4,
  flexWrap: "wrap",
  gap: 1,
  // Чуть уже max-width на мобиле, чтобы кнопки не слиплись
  maxWidth: "calc(100% - 16px)",
};

const desktopButtonStyle = {
  minWidth: 36,
  height: 36,
  padding: "0 10px",
  background: "transparent",
  color: "#e2e8f0",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 5,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

const mobileButtonStyle = {
  ...desktopButtonStyle,
  minWidth: 44,
  height: 44,
  fontSize: 16,
};

const desktopZoomValueStyle = {
  minWidth: 44,
  padding: "0 4px",
  fontSize: 11,
  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
  color: "#94a3b8",
  textAlign: "center",
};

const mobileZoomValueStyle = {
  ...desktopZoomValueStyle,
  minWidth: 50,
  fontSize: 12,
};

const desktopDividerStyle = {
  width: 1,
  height: 22,
  background: "rgba(255, 255, 255, 0.1)",
  margin: "0 4px",
};

const mobileDividerStyle = {
  ...desktopDividerStyle,
  height: 28,
};

const saveStatusStyle = {
  width: 26,
  height: 26,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  fontSize: 12,
  transition: "color 0.2s",
};
