// client/src/pages/clinic/vitrina/blocks/StatsBlock.jsx
//
// ВИТРИНА 2.0 (V1) — блок stats (новый).
// Полоса цифр клиники. Авто-метрика «врачей» считается из clinic.doctors.length;
// остальные показатели владелец задаёт вручную в config.items (label + value +
// опц. icon) — до появления полей статистики в модели (V4).
//
// Нет ручных показателей И нет врачей → блок не рендерится.
// Полноширинная полоса на --v-surface-alt, акцентные числа --v-primary. НЕ Section.
//
// Контракт: ({ clinic, config }).
//   config.items           — [{ value, label, icon? }] ручные показатели
//   config.showDoctorsStat — false, чтобы скрыть авто-метрику врачей

import React from "react";
import { useTranslation } from "react-i18next";
import { blockBgStyle } from "../lib/utils.js";

const CSS = `
.vt-stats { background: var(--v-surface-alt); border-block: 1px solid var(--v-border); margin-top: 22px; }
.vt-stats-in { max-width: var(--v-content-max, 1040px); margin: 0 auto; padding: 36px 32px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 24px; }
.vt-stat { text-align: center; display: flex; flex-direction: column; gap: 6px; align-items: center; }
.vt-stat-ico { font-size: 24px; line-height: 1; }
.vt-stat-value { font-family: var(--v-font-heading); font-size: clamp(28px, 4vw, 40px); font-weight: 800; color: var(--v-primary); line-height: 1; }
.vt-stat-label { font-size: 13px; color: var(--v-text-muted); line-height: 1.3; }
@media (max-width: 640px) { .vt-stats-in { padding: 28px 18px; gap: 18px; } }
`;

export default function StatsBlock({ clinic, config = {} }) {
  const { t } = useTranslation();

  const items = [];

  // авто-метрика: количество врачей (реальные данные DTO)
  const docCount = Array.isArray(clinic?.doctors) ? clinic.doctors.length : 0;
  if (config.showDoctorsStat !== false && docCount > 0) {
    items.push({
      value: String(docCount),
      label: t("publicClinic.statsDoctors", {
        count: docCount,
        defaultValue: "врачей",
      }),
      icon: "👨‍⚕️",
    });
  }

  // ручные показатели из config
  const manual = Array.isArray(config.items) ? config.items : [];
  for (const it of manual) {
    if (!it) continue;
    const value = it.value != null ? String(it.value) : "";
    const label = it.label || "";
    if (!value && !label) continue; // пустой элемент пропускаем
    // иконка не задана → дефолтный значок, чтобы число не висело «голым»
    items.push({ value, label, icon: it.icon || "📊" });
  }

  if (items.length === 0) return null;

  return (
    <section
      className="vt-stats"
      data-block="stats"
      style={blockBgStyle(config).style}
    >
      <style>{CSS}</style>
      <div className="vt-stats-in">
        {items.map((s, i) => (
          <div className="vt-stat" key={i}>
            {s.icon && <span className="vt-stat-ico">{s.icon}</span>}
            {s.value && <span className="vt-stat-value">{s.value}</span>}
            {s.label && <span className="vt-stat-label">{s.label}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
