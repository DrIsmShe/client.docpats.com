// client/src/pages/clinic/vitrina/blocks/FaqBlock.jsx
//
// ВИТРИНА 2.0 (V1) — блок faq (новый): аккордеон вопрос/ответ.
// Источник — config.items [{ q, a }] (поля FAQ как сущность появятся в V4).
// Раскрытие на нативных <details>/<summary> — работает без JS и при SSR.
//
// В дефолтном layout faq скрыт (visible:false) — наружу попадёт, только когда
// владелец включит и заполнит. Пустой config.items → блок не рендерится.
//
// Контракт: ({ clinic, config }).
//   config.title — заголовок (дефолт «Вопросы и ответы»)
//   config.items — [{ q, a }]

import React from "react";
import { useTranslation } from "react-i18next";
import Section from "../components/Section.jsx";
import { blockBgStyle } from "../lib/utils.js";

const CSS = `
.vt-faq-list { display: flex; flex-direction: column; gap: 10px; }
.vt-faq-item { border: 1px solid var(--v-border); border-radius: 12px; background: var(--v-surface); overflow: hidden; }
.vt-faq-item > summary { list-style: none; cursor: pointer; padding: 16px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-family: var(--v-font-heading); font-size: 15px; font-weight: 600; color: var(--v-text); }
.vt-faq-item > summary::-webkit-details-marker { display: none; }
.vt-faq-item > summary:hover { color: var(--v-primary); }
.vt-faq-ico { color: var(--v-primary); font-size: 12px; transition: transform .2s; flex-shrink: 0; }
.vt-faq-item[open] .vt-faq-ico { transform: rotate(180deg); }
.vt-faq-a { padding: 0 18px 16px; font-size: 14px; color: var(--v-text-muted); line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
`;

export default function FaqBlock({ clinic, config = {} }) {
  const { t } = useTranslation();

  // приоритет: clinic.faq (V4.1) > config.items (фолбэк до редактора V3.3)
  const clinicFaq = Array.isArray(clinic?.faq) ? clinic.faq : [];
  const source =
    clinicFaq.length > 0
      ? clinicFaq
      : Array.isArray(config.items)
        ? config.items
        : [];
  const items = source.filter((x) => x && x.q && x.a);
  if (items.length === 0) return null;

  const title =
    config.title ||
    t("publicClinic.faqTitle", { defaultValue: "Вопросы и ответы" });

  return (
    <Section bg={blockBgStyle(config)} id="faq" title={title}>
      <style>{CSS}</style>
      <div className="vt-faq-list">
        {items.map((it, i) => (
          <details className="vt-faq-item" key={i}>
            <summary>
              <span>{it.q}</span>
              <span className="vt-faq-ico">▼</span>
            </summary>
            <div className="vt-faq-a">{it.a}</div>
          </details>
        ))}
      </div>
    </Section>
  );
}
