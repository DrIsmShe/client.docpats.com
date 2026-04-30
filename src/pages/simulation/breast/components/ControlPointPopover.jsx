// src/pages/simulation/breast/components/ControlPointPopover.jsx
//
// Phase Б.2 v3 — Inline-popover для редактирования параметров одной
// control point: радиус и сила. Появляется рядом с выбранной точкой.

import React, { useEffect, useRef } from "react";

const NORM_RADIUS_MIN = 0.005;
const NORM_RADIUS_MAX = 0.4;

export default function ControlPointPopover({
  point,
  screenAnchor,
  screenCurrent,
  onChangeRadius,
  onChangeStrength,
  onRemove,
  onClose,
}) {
  const popoverRef = useRef(null);

  // Закрытие при клике вне
  useEffect(() => {
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        // Не закрываемся если кликнули на сам маркер (он за пределами popover)
        // — закрытие управляется снаружи через hoveredKey
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!point || !screenAnchor || !screenCurrent) return null;

  const radius = point.radius ?? 0.05;
  const strength = point.strength ?? 1.0;

  // Позиционирование: справа от current на 20px, или слева если близко к правому краю
  // Простой подход — всегда справа от current handle. Размеры popover ~190x130.
  const POPOVER_W = 200;
  const POPOVER_H = 145;
  const OFFSET = 20;

  const x = screenCurrent.x;
  const y = screenCurrent.y;
  const containerW = window.innerWidth;
  const containerH = window.innerHeight;

  const placeRight = x + OFFSET + POPOVER_W < containerW;
  const placeBelow = y + OFFSET + POPOVER_H < containerH;

  const left = placeRight ? x + OFFSET : x - OFFSET - POPOVER_W;
  const top = placeBelow ? y + OFFSET : y - OFFSET - POPOVER_H;

  return (
    <div
      ref={popoverRef}
      style={{
        ...popoverStyle,
        left,
        top,
        width: POPOVER_W,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={headerStyle}>
        <span style={titleStyle}>{point.label || "Точка"}</span>
        <button
          type="button"
          style={closeButtonStyle}
          onClick={onClose}
          title="Скрыть"
        >
          ✕
        </button>
      </div>

      <div style={fieldStyle}>
        <div style={fieldLabelRowStyle}>
          <span style={fieldLabelStyle}>Радиус</span>
          <span style={fieldValueStyle}>{radius.toFixed(3)}</span>
        </div>
        <input
          type="range"
          min={NORM_RADIUS_MIN}
          max={NORM_RADIUS_MAX}
          step={0.005}
          value={radius}
          onChange={(e) =>
            onChangeRadius?.(point.key, parseFloat(e.target.value))
          }
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={sliderStyle}
        />
      </div>

      <div style={fieldStyle}>
        <div style={fieldLabelRowStyle}>
          <span style={fieldLabelStyle}>Сила</span>
          <span style={fieldValueStyle}>{strength.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.05}
          value={strength}
          onChange={(e) =>
            onChangeStrength?.(point.key, parseFloat(e.target.value))
          }
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={sliderStyle}
        />
        <div style={strengthHintRowStyle}>
          <span style={strengthHintLeftStyle}>− обратное</span>
          <span style={strengthHintRightStyle}>+ прямое</span>
        </div>
      </div>

      <button
        type="button"
        style={removeButtonStyle}
        onClick={() => onRemove?.(point.key)}
      >
        🗑 Удалить точку
      </button>
    </div>
  );
}

/* ─────── styles ─────── */

const popoverStyle = {
  position: "fixed",
  background: "rgba(15, 20, 32, 0.97)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.12)",
  borderRadius: 8,
  padding: 10,
  zIndex: 30,
  color: "#e2e8f0",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
  pointerEvents: "auto",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 6,
  paddingBottom: 6,
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "rgba(255, 255, 255, 0.08)",
};

const titleStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: "#cbd5e1",
  flex: 1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const closeButtonStyle = {
  width: 20,
  height: 20,
  background: "transparent",
  borderWidth: 0,
  borderStyle: "none",
  color: "#94a3b8",
  cursor: "pointer",
  fontSize: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 3,
  flexShrink: 0,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const fieldLabelRowStyle = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
};

const fieldLabelStyle = {
  fontSize: 10,
  color: "#94a3b8",
};

const fieldValueStyle = {
  fontSize: 10,
  fontWeight: 600,
  color: "#93c5fd",
  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
};

const sliderStyle = {
  width: "100%",
  WebkitAppearance: "none",
  appearance: "none",
  height: 18,
  background: "transparent",
  cursor: "pointer",
  margin: 0,
  padding: 0,
};

const strengthHintRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 9,
  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
  color: "#64748b",
};

const strengthHintLeftStyle = {};
const strengthHintRightStyle = {};

const removeButtonStyle = {
  padding: "5px 8px",
  background: "transparent",
  color: "rgba(252, 165, 165, 0.85)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(239, 68, 68, 0.25)",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 10,
  fontFamily: "inherit",
  marginTop: 2,
};
