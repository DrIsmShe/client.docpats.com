// src/pages/simulation/standards/components/StandardSelector.jsx

import React, { useMemo } from "react";
import { listStandardsByCategory } from "../data/index.js";
import { isStandardApplicableToView, VIEW } from "../services/viewDetection.js";
import styles from "./ApplyStandardPanel.module.css";

const VIEW_LABEL = {
  [VIEW.FRONTAL]: "анфас",
  [VIEW.PROFILE]: "профиль",
  [VIEW.THREE_QUARTER]: "¾",
  [VIEW.UNKNOWN]: "—",
};

const STANDARD_DESCRIPTIONS = {
  // Canonical (anthropometric ideal)
  "ideal-female-canonical":
    "✦ Полная коррекция всех черт лица к эталонным пропорциям женского лица (Farkas)",
  "ideal-male-canonical":
    "✦ Полная коррекция всех черт лица к эталонным пропорциям мужского лица (Farkas)",
  // Relative norms (per-feature)
  "powell-humphrey-female":
    "Угол лоб-нос (горбинка/седловидность) + угол лицо-нос",
  "powell-humphrey-male":
    "Угол лоб-нос (горбинка/седловидность) + угол лицо-нос",
  goode: "Длина и проекция кончика носа",
  crumley: "Пропорции пирамиды носа 3:4:5 (только оценка)",
  "farkas-frontal": "Ширина носа относительно глаз и рта",
  "nose-symmetry": "Центрирование кончика носа и симметрия крыльев",
  "penn-ideal": "Идеальные пропорции груди (Penn's triangle)",
};

export default function StandardSelector({
  category,
  value,
  onChange,
  currentView = VIEW.UNKNOWN,
}) {
  const standards = useMemo(
    () => listStandardsByCategory(category),
    [category],
  );

  const { applicable, others } = useMemo(() => {
    const applicable = [];
    const others = [];
    for (const s of standards) {
      if (isStandardApplicableToView(currentView, s)) {
        applicable.push(s);
      } else {
        others.push(s);
      }
    }
    return { applicable, others };
  }, [standards, currentView]);

  const selectedDescription = value ? STANDARD_DESCRIPTIONS[value] : null;

  return (
    <div className={styles.selectorWrapper}>
      <select
        className={styles.selector}
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">— Выберите стандарт —</option>

        {applicable.length > 0 && (
          <optgroup
            label={`Доступно для ракурса: ${VIEW_LABEL[currentView] || "—"}`}
          >
            {applicable.map((s) => (
              <option key={s.id} value={s.id}>
                {s.isCanonical ? "✦ " : ""}
                {s.name}
              </option>
            ))}
          </optgroup>
        )}

        {others.length > 0 && (
          <optgroup label="Требуют другого ракурса">
            {others.map((s) => (
              <option key={s.id} value={s.id} disabled>
                {s.name} (нужен{" "}
                {s.applicableViews?.map((v) => VIEW_LABEL[v] || v).join(" / ")})
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {selectedDescription && (
        <div className={styles.selectorHint}>
          <span className={styles.selectorHintIcon}>ⓘ</span>
          <span>{selectedDescription}</span>
        </div>
      )}
    </div>
  );
}
