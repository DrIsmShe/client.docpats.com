// client/src/pages/clinic/vitrina/blocks/TopbarBlock.jsx
//
// ВИТРИНА 2.0 (V1) — блок topbar.
// Тонкая инфо-полоса над навигацией: адрес/часы слева, телефон + переключатель
// языка справа. Полностью на токенах темы (--v-*).
//
// Контракт: ({ clinic, config }).
//   config.hours    — строка часов работы (стоп-гэп: поле появится в DTO в V4)
//   config.showLang — false, чтобы скрыть переключатель языка (по умолчанию показан)
//   config.showPhone, config.showAddress — аналогично (по умолчанию true)
//
// Язык переключается через react-i18next (i18n.changeLanguage). RTL (ar)
// обрабатывается атрибутом dir на корне витрины (шелл/рендерер) — здесь
// раскладка во flow, переворачивается автоматически.

import React from "react";
import { useTranslation } from "react-i18next";
import { LANGS, telHref, blockBgStyle } from "../lib/utils.js";

const CSS = `
.vt-topbar { background: var(--v-surface-alt); border-bottom: 1px solid var(--v-border); font-family: var(--v-font-body); }
.vt-topbar-in { max-width: var(--v-content-max, 1040px); margin: 0 auto; padding: 8px 32px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.vt-topbar-left, .vt-topbar-right { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.vt-tb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--v-text-muted); }
.vt-tb-phone { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--v-primary); text-decoration: none; font-weight: 600; }
.vt-tb-phone:hover { text-decoration: underline; }
.vt-tb-lang { display: flex; gap: 2px; }
.vt-tb-lang-btn { border: none; background: transparent; color: var(--v-text-muted); font-family: var(--v-font-body); font-size: 11px; font-weight: 600; letter-spacing: .04em; padding: 4px 8px; border-radius: 100px; cursor: pointer; text-transform: uppercase; line-height: 1; transition: color .15s, background .15s; }
.vt-tb-lang-btn:hover { color: var(--v-text); background: rgba(0,0,0,.05); }
.vt-tb-lang-btn.vt-active { color: var(--v-on-primary); background: var(--v-primary); }
@media (max-width: 640px) {
  .vt-topbar-in { padding: 8px 16px; gap: 8px; }
  .vt-tb-item, .vt-tb-phone { font-size: 11.5px; }
}
`;

export default function TopbarBlock({ clinic, config = {} }) {
  const { i18n } = useTranslation();

  const address = clinic?.address || {};
  // приоритет: callCenterPhone (V4.1) > contacts.phone; callCenterHours > config.hours
  const phone =
    config.showPhone === false
      ? null
      : clinic?.callCenterPhone || clinic?.contacts?.phone || null;
  const hours = clinic?.callCenterHours || config.hours || null;
  const showLang = config.showLang !== false;
  const showAddress = config.showAddress !== false;

  const addressLine = showAddress
    ? [address.street, address.city].filter(Boolean).join(", ")
    : "";

  const hasLeft = Boolean(addressLine || hours);
  const hasRight = Boolean(phone || showLang);
  if (!hasLeft && !hasRight) return null; // нечего показывать — бар не рисуем

  const current = i18n?.language || "ru";

  return (
    <>
      <style>{CSS}</style>
      <div
        className="vt-topbar"
        data-block="topbar"
        style={blockBgStyle(config).style}
      >
        <div className="vt-topbar-in">
          <div className="vt-topbar-left">
            {addressLine && (
              <span className="vt-tb-item">📍 {addressLine}</span>
            )}
            {hours && <span className="vt-tb-item">🕐 {hours}</span>}
          </div>
          <div className="vt-topbar-right">
            {phone && (
              <a className="vt-tb-phone" href={telHref(phone)} dir="ltr">
                📞 {phone}
              </a>
            )}
            {showLang && (
              <div className="vt-tb-lang">
                {LANGS.map((lng) => (
                  <button
                    key={lng}
                    type="button"
                    className={
                      "vt-tb-lang-btn" + (current === lng ? " vt-active" : "")
                    }
                    onClick={() => i18n.changeLanguage(lng)}
                  >
                    {lng}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
