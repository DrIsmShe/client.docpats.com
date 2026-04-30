// src/pages/simulation/breast/components/WarpTuningPanel.jsx
//
// Phase Б.2 — Tuning panel для подкрутки коэффициентов warp генератора.
// Expandable секция в Operation panel.

import React, { useState, useCallback } from "react";
import { DEFAULT_WARP_TUNING } from "../breastWarpGenerator.js";

const TUNING_PARAMS = [
  {
    key: "globalStrength",
    label: "Сила деформации",
    min: 0.1,
    max: 2.0,
    step: 0.05,
    suffix: "×",
  },
  {
    key: "globalRadius",
    label: "Радиус влияния",
    min: 0.3,
    max: 1.5,
    step: 0.05,
    suffix: "×",
  },
  {
    key: "lateralBias",
    label: "Латеральное смещение",
    min: 0,
    max: 2.0,
    step: 0.05,
    suffix: "×",
  },
  {
    key: "verticalBias",
    label: "Вертикальное смещение",
    min: 0,
    max: 2.0,
    step: 0.05,
    suffix: "×",
  },
];

export default function WarpTuningPanel({ warpTuning, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const tuning = {
    ...DEFAULT_WARP_TUNING,
    ...(warpTuning || {}),
  };

  const handleChange = useCallback(
    (key, value) => {
      onChange?.({ ...tuning, [key]: value });
    },
    [tuning, onChange],
  );

  const handleReset = useCallback(() => {
    onChange?.({ ...DEFAULT_WARP_TUNING });
  }, [onChange]);

  // Проверка — отличается ли текущий tuning от defaults
  const isModified = TUNING_PARAMS.some(
    (p) => Math.abs((tuning[p.key] ?? 0) - DEFAULT_WARP_TUNING[p.key]) > 0.001,
  );

  return (
    <div style={containerStyle}>
      <button
        type="button"
        style={headerStyle}
        onClick={() => setIsOpen((v) => !v)}
      >
        <span style={iconStyle}>⚙</span>
        <span style={titleStyle}>Точная настройка</span>
        {isModified && <span style={modifiedDotStyle} />}
        <span style={chevronStyle}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div style={bodyStyle}>
          {TUNING_PARAMS.map((p) => {
            const value = tuning[p.key] ?? DEFAULT_WARP_TUNING[p.key];
            return (
              <div key={p.key} style={fieldStyle}>
                <div style={labelRowStyle}>
                  <span style={labelStyle}>{p.label}</span>
                  <span style={valueStyle}>
                    {value.toFixed(2)}
                    <span style={suffixStyle}>{p.suffix}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={value}
                  onChange={(e) =>
                    handleChange(p.key, parseFloat(e.target.value))
                  }
                  style={sliderStyle}
                />
                <div style={rangeRowStyle}>
                  <span style={rangeStyle}>
                    {p.min}
                    {p.suffix}
                  </span>
                  <span style={rangeStyle}>
                    {p.max}
                    {p.suffix}
                  </span>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            style={{
              ...resetButtonStyle,
              ...(isModified ? {} : resetButtonDisabledStyle),
            }}
            onClick={handleReset}
            disabled={!isModified}
          >
            ↺ Сбросить к defaults
          </button>

          <div style={hintStyle}>
            Подбирайте под конкретное фото. По умолчанию интенсивность снижена в
            2 раза для естественного вида.
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────── styles ─────── */

const containerStyle = {
  background: "rgba(255, 255, 255, 0.02)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.06)",
  borderRadius: 8,
  marginTop: 8,
};

const headerStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  background: "transparent",
  borderWidth: 0,
  borderStyle: "none",
  color: "#cbd5e1",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
  fontFamily: "inherit",
};

const iconStyle = {
  fontSize: 14,
  color: "#94a3b8",
};

const titleStyle = {
  flex: 1,
  textAlign: "start",
};

const modifiedDotStyle = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#fbbf24",
  flexShrink: 0,
};

const chevronStyle = {
  fontSize: 9,
  color: "#94a3b8",
};

const bodyStyle = {
  padding: "4px 12px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  borderTopWidth: 1,
  borderTopStyle: "solid",
  borderTopColor: "rgba(255, 255, 255, 0.06)",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const labelRowStyle = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
};

const labelStyle = {
  fontSize: 11,
  color: "#94a3b8",
};

const valueStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: "#e2e8f0",
  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
};

const suffixStyle = {
  fontSize: 10,
  fontWeight: 400,
  color: "#94a3b8",
  marginInlineStart: 2,
};

const sliderStyle = {
  width: "100%",
  WebkitAppearance: "none",
  appearance: "none",
  height: 24,
  background: "transparent",
  cursor: "pointer",
  margin: 0,
  padding: 0,
};

const rangeRowStyle = {
  display: "flex",
  justifyContent: "space-between",
};

const rangeStyle = {
  fontSize: 9,
  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
  color: "#64748b",
};

const resetButtonStyle = {
  padding: "6px 10px",
  background: "transparent",
  color: "#cbd5e1",
  borderWidth: 1,
  borderStyle: "dashed",
  borderColor: "rgba(255, 255, 255, 0.15)",
  borderRadius: 5,
  cursor: "pointer",
  fontSize: 11,
  fontFamily: "inherit",
  marginTop: 4,
};

const resetButtonDisabledStyle = {
  opacity: 0.4,
  cursor: "not-allowed",
};

const hintStyle = {
  fontSize: 10,
  color: "#64748b",
  fontStyle: "italic",
  lineHeight: 1.5,
  paddingTop: 4,
};
