// client/src/pages/clinic/vitrina/blocks/WhyUsBlock.jsx
//
// ВИТРИНА 2.0 (V1) — блок whyUs / about (порт «О клинике» + преимущества).
// Слева — описание клиники + чипы специализаций (данные DTO). Справа —
// «преимущества» (иконка + заголовок + текст) из config.advantages.
//
// Если есть и описание, и преимущества → split (2 колонки); иначе одна колонка.
// Нет ни описания/спец, ни преимуществ → блок не рендерится.
//
// Контракт: ({ clinic, config }).
//   config.title      — заголовок секции (дефолт «О клинике»)
//   config.advantages — [{ icon, title, text }]

import React from "react";
import { useTranslation } from "react-i18next";
import Section from "../components/Section.jsx";
import { blockBgStyle } from "../lib/utils.js";

const CSS = `
.vt-why { display: block; }
.vt-why--split { display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; align-items: start; }
@media (max-width: 760px) { .vt-why--split { grid-template-columns: 1fr; gap: 24px; } }

.vt-why-about { font-family: var(--v-font-heading); font-size: 15.5px; color: var(--v-text-muted); line-height: 1.85; white-space: pre-wrap; word-break: break-word; }
.vt-why-specs { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.vt-spec { font-size: 12px; font-weight: 600; color: var(--v-primary); background: var(--v-surface-alt); border: 1px solid var(--v-border); padding: 5px 13px; border-radius: 100px; }

.vt-why-adv { display: flex; flex-direction: column; gap: 16px; }
.vt-adv { display: flex; gap: 12px; align-items: flex-start; }
.vt-adv-ico { width: 40px; height: 40px; border-radius: 10px; background: var(--v-surface-alt); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.vt-adv-title { font-family: var(--v-font-heading); font-size: 14.5px; font-weight: 700; color: var(--v-text); margin-bottom: 3px; }
.vt-adv-text { font-size: 13px; color: var(--v-text-muted); line-height: 1.5; }
`;

export default function WhyUsBlock({ clinic, config = {} }) {
  const { t } = useTranslation();

  const description = clinic?.description || "";
  const specs = Array.isArray(clinic?.specializations)
    ? clinic.specializations
    : [];
  const advantages = (
    Array.isArray(config.advantages) ? config.advantages : []
  ).filter((a) => a && (a.title || a.text));

  const hasAbout = Boolean(description || specs.length);
  const hasAdv = advantages.length > 0;
  if (!hasAbout && !hasAdv) return null;

  const split = hasAbout && hasAdv;

  return (
    <Section
      bg={blockBgStyle(config)}
      id="whyUs"
      title={
        config.title ||
        t("publicClinic.aboutTitle", { defaultValue: "О клинике" })
      }
    >
      <style>{CSS}</style>
      <div className={"vt-why" + (split ? " vt-why--split" : "")}>
        {hasAbout && (
          <div className="vt-why-col">
            {description && <div className="vt-why-about">{description}</div>}
            {specs.length > 0 && (
              <div className="vt-why-specs">
                {specs.map((s, i) => (
                  <span className="vt-spec" key={i}>
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {hasAdv && (
          <div className="vt-why-adv">
            {advantages.map((a, i) => (
              <div className="vt-adv" key={i}>
                {a.icon && <span className="vt-adv-ico">{a.icon}</span>}
                <div className="vt-adv-body">
                  {a.title && <div className="vt-adv-title">{a.title}</div>}
                  {a.text && <div className="vt-adv-text">{a.text}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
