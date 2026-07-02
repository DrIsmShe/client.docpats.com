// client/src/pages/clinic/vitrina/blocks/CtaBlock.jsx
//
// ВИТРИНА 2.0 (V1) — блок cta (новый).
// Акцентная полоса-призыв: заголовок + подзаголовок + кнопка звонка в
// регистратуру. Бронь по телефону (архитектура: НЕ self-booking форма).
//
// Кнопка = телефон (tel:). Нет телефона → фолбэк на email (mailto:).
// Нет ни того, ни другого → блок не рендерится (звать некуда).
// Полноширинная полоса на градиенте --v-primary → --v-primary-dark, НЕ Section.
//
// Контракт: ({ clinic, config }).
//   config.title    — заголовок (дефолт «Запишитесь на приём»)
//   config.subtitle — подзаголовок (дефолт про регистратуру)

import React from "react";
import { useTranslation } from "react-i18next";
import { telHref, blockBgStyle } from "../lib/utils.js";

const CSS = `
.vt-cta { background: linear-gradient(135deg, var(--v-primary), var(--v-primary-dark)); margin-top: 32px; }
.vt-cta-in { max-width: var(--v-content-max, 1040px); margin: 0 auto; padding: 48px 32px; display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap; }
.vt-cta-text { flex: 1; min-width: 260px; }
.vt-cta-title { font-family: var(--v-font-heading); font-size: clamp(22px, 3vw, 30px); font-weight: 700; color: #fff; margin: 0 0 8px; line-height: 1.2; }
.vt-cta-sub { font-size: 15px; color: rgba(255,255,255,.88); margin: 0; line-height: 1.5; max-width: 520px; }
.vt-cta-btn { display: inline-flex; align-items: center; gap: 10px; background: #fff; color: var(--v-primary); font-family: var(--v-font-body); font-weight: 700; font-size: 17px; padding: 15px 26px; border-radius: 100px; text-decoration: none; box-shadow: 0 8px 24px rgba(0,0,0,.18); transition: transform .15s, box-shadow .15s; white-space: nowrap; }
.vt-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,.24); }
.vt-cta-btn-ico { font-size: 18px; }
@media (max-width: 640px) {
  .vt-cta-in { padding: 36px 18px; }
  .vt-cta-btn { width: 100%; justify-content: center; }
}
`;

export default function CtaBlock({ clinic, config = {} }) {
  const { t } = useTranslation();

  // приоритет: callCenterPhone (V4.1, телефон записи) > contacts.phone > email
  const phone = clinic?.callCenterPhone || clinic?.contacts?.phone || null;
  const email = clinic?.contacts?.email || null;
  if (!phone && !email) return null;

  const title =
    config.title ||
    t("publicClinic.ctaTitle", { defaultValue: "Запишитесь на приём" });
  const subtitle =
    config.subtitle ||
    t("publicClinic.ctaSubtitle", {
      defaultValue: "Позвоните в регистратуру — подберём удобное время",
    });

  const href = phone ? telHref(phone) : `mailto:${email}`;
  const label = phone || email;
  const ico = phone ? "📞" : "✉️";

  return (
    <section
      className="vt-cta"
      data-block="cta"
      style={blockBgStyle(config).style}
    >
      <style>{CSS}</style>
      <div className="vt-cta-in">
        <div className="vt-cta-text">
          <h2 className="vt-cta-title">{title}</h2>
          <p className="vt-cta-sub">{subtitle}</p>
        </div>
        <a className="vt-cta-btn" href={href} dir={phone ? "ltr" : undefined}>
          <span className="vt-cta-btn-ico">{ico}</span> {label}
        </a>
      </div>
    </section>
  );
}
