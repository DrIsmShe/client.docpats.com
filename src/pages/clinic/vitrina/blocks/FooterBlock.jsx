// client/src/pages/clinic/vitrina/blocks/FooterBlock.jsx
//
// ВИТРИНА 2.0 (V1) — блок footer (новый).
// Низ страницы: бренд (лого+имя+описание), контакты, быстрые ссылки на разделы,
// полоса копирайта. Всё на токенах и данных DTO.
//
// Ссылки «Разделы» авто-выводятся из блоков, реально присутствующих в layout
// (как в nav), и скроллят к [data-block="<type>"]. Контакты берутся из
// clinic.contacts / address. Структурный блок — рендерится всегда при наличии clinic.
//
// Контракт: ({ clinic, config }).
//   config.note — произвольная строка в правой части полосы копирайта (опц.)

import React from "react";
import { useTranslation } from "react-i18next";
import { resolveUrl, initials, telHref, blockBgStyle } from "../lib/utils.js";

const NAV_HEIGHT = 64;

const LINK_DEFS = [
  { type: "whyUs", key: "publicClinic.navAbout", def: "О нас" },
  { type: "bento", key: "publicClinic.navDepartments", def: "Отделения" },
  { type: "doctors", key: "publicClinic.navDoctors", def: "Врачи" },
  { type: "publications", key: "publicClinic.navArticles", def: "Статьи" },
  { type: "gallery", key: "publicClinic.navGallery", def: "Галерея" },
  { type: "reviews", key: "publicClinic.navReviews", def: "Отзывы" },
  { type: "contacts", key: "publicClinic.navContacts", def: "Контакты" },
];

const CSS = `
.vt-footer { background: var(--v-surface-alt); border-top: 1px solid var(--v-border); font-family: var(--v-font-body); margin-top: 32px; }
.vt-footer-in { max-width: var(--v-content-max, 1040px); margin: 0 auto; padding: 44px 32px 0; display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 32px; }
.vt-foot-col-title { font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--v-text-muted); margin: 0 0 14px; }

.vt-foot-brand { display: flex; flex-direction: column; gap: 12px; }
.vt-foot-head { display: inline-flex; align-items: center; gap: 10px; }
.vt-foot-logo { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; background: var(--v-surface); flex-shrink: 0; }
.vt-foot-logo-init { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: var(--v-font-heading); font-weight: 700; font-size: 17px; color: var(--v-primary); background: var(--v-surface); flex-shrink: 0; }
.vt-foot-name { font-family: var(--v-font-heading); font-size: 17px; font-weight: 700; color: var(--v-text); }
.vt-foot-desc { font-size: 13px; color: var(--v-text-muted); line-height: 1.6; max-width: 360px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.vt-foot-list { display: flex; flex-direction: column; gap: 9px; align-items: flex-start; }
.vt-foot-item { font-size: 13.5px; color: var(--v-text-muted); text-decoration: none; display: inline-flex; align-items: center; gap: 8px; line-height: 1.4; }
a.vt-foot-item:hover { color: var(--v-primary); }
.vt-foot-link { font-size: 13.5px; color: var(--v-text-muted); background: none; border: none; padding: 0; cursor: pointer; font-family: var(--v-font-body); text-align: inherit; }
.vt-foot-link:hover { color: var(--v-primary); }

.vt-foot-bottom { max-width: var(--v-content-max, 1040px); margin: 36px auto 0; padding: 18px 32px; border-top: 1px solid var(--v-border); font-size: 12.5px; color: var(--v-text-muted); display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }

@media (max-width: 760px) {
  .vt-footer-in { grid-template-columns: 1fr; gap: 28px; padding: 36px 18px 0; }
  .vt-foot-bottom { padding: 16px 18px; }
}
`;

function scrollToBlock(type) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const el = document.querySelector(`[data-block="${type}"]`);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export default function FooterBlock({ clinic, config = {} }) {
  const { t } = useTranslation();
  if (!clinic) return null;

  const name = clinic.name || "";
  const logoUrl = resolveUrl(clinic.logo);
  const description = clinic.description || "";
  const contacts = clinic.contacts || {};
  const address = clinic.address || {};
  const addressLine = [address.street, address.city, address.country]
    .filter(Boolean)
    .join(", ");

  const present = new Set(
    (clinic.layout?.blocks || []).map((b) => b.type).filter(Boolean),
  );
  const links = LINK_DEFS.filter((d) => present.has(d.type));

  const year = new Date().getFullYear();
  const hasContacts =
    addressLine || contacts.phone || contacts.email || contacts.website;

  return (
    <footer
      className="vt-footer"
      data-block="footer"
      style={blockBgStyle(config).style}
    >
      <style>{CSS}</style>
      <div className="vt-footer-in">
        {/* бренд */}
        <div className="vt-foot-brand">
          <div className="vt-foot-head">
            {logoUrl ? (
              <img className="vt-foot-logo" src={logoUrl} alt={name} />
            ) : (
              <span className="vt-foot-logo-init">{initials(name)}</span>
            )}
            <span className="vt-foot-name">{name}</span>
          </div>
          {description && <p className="vt-foot-desc">{description}</p>}
        </div>

        {/* контакты */}
        {hasContacts && (
          <div className="vt-foot-contacts">
            <h3 className="vt-foot-col-title">
              {t("publicClinic.contactsTitle", { defaultValue: "Контакты" })}
            </h3>
            <div className="vt-foot-list">
              {addressLine && (
                <span className="vt-foot-item">📍 {addressLine}</span>
              )}
              {contacts.phone && (
                <a
                  className="vt-foot-item"
                  href={telHref(contacts.phone)}
                  dir="ltr"
                >
                  📞 {contacts.phone}
                </a>
              )}
              {contacts.email && (
                <a className="vt-foot-item" href={`mailto:${contacts.email}`}>
                  ✉️ {contacts.email}
                </a>
              )}
              {contacts.website && (
                <a
                  className="vt-foot-item"
                  href={contacts.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🌐 {contacts.website}
                </a>
              )}
            </div>
          </div>
        )}

        {/* разделы */}
        {links.length > 0 && (
          <div className="vt-foot-nav">
            <h3 className="vt-foot-col-title">
              {t("publicClinic.footerSections", { defaultValue: "Разделы" })}
            </h3>
            <div className="vt-foot-list">
              {links.map((l) => (
                <button
                  key={l.type}
                  type="button"
                  className="vt-foot-link"
                  onClick={() => scrollToBlock(l.type)}
                >
                  {t(l.key, { defaultValue: l.def })}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* копирайт */}
      <div className="vt-foot-bottom">
        <span>
          © {year} {name}
        </span>
        {config.note && <span>{config.note}</span>}
      </div>
    </footer>
  );
}
