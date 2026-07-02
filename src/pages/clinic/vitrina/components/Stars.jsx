// client/src/pages/clinic/vitrina/components/Stars.jsx
//
// ВИТРИНА 2.0 (V1) — атом «звёзды рейтинга». Вынесен из PublicClinicPage.
// Заполненные — золотые (#f59e0b, конвенция рейтинга), пустые — var(--v-border).
// Самодостаточен (инлайн-стили), без внешнего CSS.

import React from "react";

/**
 * @param {Object} props
 * @param {number} props.value  значение рейтинга (округляется)
 * @param {number} [props.size=16]  размер шрифта (px)
 */
export default function Stars({ value, size = 16 }) {
  const v = Math.round(Number(value) || 0);
  return (
    <span
      style={{ display: "inline-flex", gap: 2, fontSize: size, lineHeight: 1 }}
      aria-label={`${v} / 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= v ? "#f59e0b" : "var(--v-border)" }}>
          ★
        </span>
      ))}
    </span>
  );
}
