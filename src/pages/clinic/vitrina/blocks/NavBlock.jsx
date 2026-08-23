// client/src/pages/clinic/vitrina/blocks/NavBlock.jsx
//
// ВИТРИНА 2.0 (V1) — блок nav.
// Липкое горизонтальное меню под topbar: бренд (лого+имя) слева, пункты справа.
// На десктопе — дропдауны (по hover), на мобиле — бургер с раскрытым списком.
//
// Пункты АВТО-выводятся из блоков, реально присутствующих в layout (clinic.
// layout.blocks) + РУЧНЫЕ пункты из config.customItems (добавляются после авто).
//
// Контракт: ({ clinic, config }).
//   config.showBrand   — false, чтобы скрыть бренд слева (по умолчанию показан)
//   config.customItems — [{ label, href }] ручные пункты меню

import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  resolveUrl,
  initials,
  blockBgStyle,
  sectionSlugForType,
  clinicBasePath,
  resolveVitrinaLink,
} from "../lib/utils.js";

const NAV_HEIGHT = 64; // px, для поправки якорного скролла

// Порядок и подписи пунктов. Пункт показывается, только если его блок есть в layout.
const NAV_DEFS = [
  { type: "whyUs", key: "publicClinic.navAbout", def: "О нас" },
  { type: "bento", key: "publicClinic.navDepartments", def: "Отделения" },
  { type: "priceList", key: "publicClinic.navServices", def: "Услуги и цены" },
  { type: "doctors", key: "publicClinic.navDoctors", def: "Врачи" },
  {
    type: "publications",
    key: "publicClinic.navArticles",
    def: "Статьи наших врачей",
  },
  { type: "gallery", key: "publicClinic.navGallery", def: "Галерея" },
  { type: "reviews", key: "publicClinic.navReviews", def: "Отзывы" },
  { type: "faq", key: "publicClinic.navFaq", def: "Вопросы" },
  { type: "contacts", key: "publicClinic.navContacts", def: "Контакты" },
];

const CSS = `
.vt-nav { position: sticky; top: 0; z-index: 100; background: var(--v-surface); border-bottom: 1px solid var(--v-border); font-family: var(--v-font-body); transition: box-shadow .2s; }
.vt-nav.vt-scrolled { box-shadow: 0 4px 20px rgba(0,0,0,.07); }
.vt-nav-in { max-width: var(--v-content-max, 1040px); margin: 0 auto; padding: 0 32px; height: ${NAV_HEIGHT}px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.vt-nav-brand { display: inline-flex; align-items: center; gap: 10px; background: none; border: none; cursor: pointer; padding: 0; color: inherit; font-family: var(--v-font-heading); }
.vt-nav-logo { width: 34px; height: 34px; border-radius: 9px; object-fit: cover; background: var(--v-surface-alt); flex-shrink: 0; }
.vt-nav-logo-init { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-family: var(--v-font-heading); font-weight: 700; font-size: 15px; color: var(--v-primary); background: var(--v-surface-alt); flex-shrink: 0; }
.vt-nav-name { font-size: 16px; font-weight: 700; color: var(--v-text); white-space: nowrap; max-width: 240px; overflow: hidden; text-overflow: ellipsis; }

.vt-nav-menu { display: flex; align-items: center; gap: 4px; list-style: none; margin: 0; padding: 0; }
.vt-nav-item { position: relative; }
.vt-nav-link { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; font-family: var(--v-font-body); font-size: 14px; font-weight: 500; color: var(--v-text); padding: 8px 12px; border-radius: 8px; transition: color .15s, background .15s; white-space: nowrap; text-decoration: none; }
.vt-nav-link.vt-active, .vt-nav-m-link.vt-active { color: var(--v-primary); font-weight: 600; }
.vt-nav-link:hover { color: var(--v-primary); background: var(--v-surface-alt); }
.vt-nav-caret { font-size: 9px; opacity: .6; transition: transform .15s; }
.vt-nav-item:hover .vt-nav-caret { transform: rotate(180deg); }

.vt-nav-dd { position: absolute; top: 100%; inset-inline-start: 0; min-width: 220px; background: var(--v-surface); border: 1px solid var(--v-border); border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,.12); padding: 8px; opacity: 0; visibility: hidden; transform: translateY(6px); transition: opacity .16s, transform .16s, visibility .16s; z-index: 60; }
.vt-nav-item:hover .vt-nav-dd { opacity: 1; visibility: visible; transform: translateY(0); }
.vt-nav-dd-link { display: block; padding: 9px 12px; border-radius: 8px; font-size: 14px; color: var(--v-text); text-decoration: none; cursor: pointer; background: none; border: none; width: 100%; text-align: inherit; font-family: var(--v-font-body); white-space: nowrap; }
.vt-nav-dd-link:hover { background: var(--v-surface-alt); color: var(--v-primary); }
.vt-nav-dd-all { margin-top: 4px; border-top: 1px solid var(--v-border); padding-top: 8px; color: var(--v-primary); font-weight: 600; }

.vt-nav-burger { display: none; background: none; border: 1px solid var(--v-border); border-radius: 9px; width: 40px; height: 40px; cursor: pointer; align-items: center; justify-content: center; color: var(--v-text); font-size: 18px; }

.vt-nav-mobile { display: none; }

@media (max-width: 880px) {
  .vt-nav-menu { display: none; }
  .vt-nav-burger { display: inline-flex; }
  .vt-nav-mobile { display: block; border-top: 1px solid var(--v-border); background: var(--v-surface); max-height: 0; overflow: hidden; transition: max-height .25s ease; }
  .vt-nav-mobile.vt-open { max-height: 80vh; overflow-y: auto; }
  .vt-nav-mobile-in { padding: 8px 24px 16px; display: flex; flex-direction: column; }
  .vt-nav-m-link { text-align: inherit; background: none; border: none; cursor: pointer; font-family: var(--v-font-body); font-size: 15px; font-weight: 600; color: var(--v-text); padding: 12px 4px; border-bottom: 1px solid var(--v-border); text-decoration: none; }
  .vt-nav-m-sub { display: flex; flex-direction: column; padding: 4px 0 8px 14px; }
  .vt-nav-m-sub a { font-size: 14px; font-weight: 500; color: var(--v-text-muted); text-decoration: none; padding: 7px 4px; }
  .vt-nav-m-sub a:hover { color: var(--v-primary); }
  .vt-nav-in { padding: 0 16px; }
}
`;

/**
 * Собрать пункты меню из реально присутствующих блоков layout.
 * Для "Врачи" подкладываем дропдаун из clinic.doctors (реальные данные).
 */
function buildNavItems(clinic, t, hidden = [], order = [], base = "") {
  const present = new Set(
    (clinic?.layout?.blocks || []).map((b) => b.type).filter(Boolean),
  );
  const hiddenSet = new Set(Array.isArray(hidden) ? hidden : []);

  const hasServices =
    Array.isArray(clinic?.services) && clinic.services.length > 0;

  // Порядок пунктов: config.navOrder (типы) задаёт приоритет; типы, не
  // упомянутые в navOrder, идут после в исходном порядке NAV_DEFS.
  const orderArr = Array.isArray(order) ? order : [];
  const rank = new Map(orderArr.map((type, i) => [type, i]));
  const orderedDefs = NAV_DEFS.slice().sort((a, b) => {
    const ra = rank.has(a.type) ? rank.get(a.type) : Infinity;
    const rb = rank.has(b.type) ? rank.get(b.type) : Infinity;
    if (ra !== rb) return ra - rb;
    return 0; // стабильно — сохраняем исходный порядок NAV_DEFS
  });

  const items = [];
  for (const d of orderedDefs) {
    // priceList — синтетический раздел (нет блока в layout). Показываем пункт,
    // если у клиники есть хотя бы одна услуга.
    if (d.type === "priceList") {
      if (!hasServices) continue;
      if (hiddenSet.has(d.type)) continue;
      items.push({ type: d.type, label: t(d.key, { defaultValue: d.def }) });
      continue;
    }
    if (!present.has(d.type)) continue;
    if (hiddenSet.has(d.type)) continue; // скрыт переключателем в редакторе
    const item = { type: d.type, label: t(d.key, { defaultValue: d.def }) };

    if (d.type === "doctors") {
      const docs = Array.isArray(clinic?.doctors) ? clinic.doctors : [];
      if (docs.length > 0) {
        // Врач открывается ВНУТРИ витрины. Здесь оставался doc.profileUrl —
        // адрес платформы, и меню уводило посетителя туда же, откуда его
        // увели карточки: к чужой шапке. profileUrl — запасной путь для
        // старого DTO без id.
        item.children = docs.slice(0, 8).map((doc) => ({
          label: doc.name || "—",
          to:
            doc.id && base
              ? `${base}/doctors/${doc.id}`
              : doc.profileUrl || null,
        }));
        item.hasMore = docs.length > 8;
      }
    }
    items.push(item);
  }
  return items;
}

/**
 * Дерево категорий (страниц) из clinic.customPages (плоский список с parentId).
 * Корневые категории; у каждой children — подкатегории. base — /clinics/:slug.
 */
function buildCategoryItems(clinic, base) {
  const pages = Array.isArray(clinic?.customPages) ? clinic.customPages : [];
  if (!pages.length) return [];

  const roots = pages
    .filter((p) => !p.parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return roots.map((root) => {
    const kids = pages
      .filter((p) => p.parentId && String(p.parentId) === String(root.id))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((c) => ({ label: c.title, to: `${base}/dp/${c.slug}` }));
    return {
      _cat: true,
      label: root.title,
      to: `${base}/dp/${root.slug}`,
      children: kids.length ? kids : null,
    };
  });
}

export default function NavBlock({ clinic, config = {} }) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Многостраничность: каждый пункт ведёт на <база>/:section.
  const params = useParams();
  const location = useLocation();
  const slug = params.slug || clinic?.slug || "";
  const base = clinicBasePath(location.pathname, slug);

  // base считается ДО построения пунктов: дропдаун «Врачи» строит по нему
  // адреса врачей внутри витрины.
  const items = buildNavItems(
    clinic,
    t,
    config.hiddenNavItems,
    config.navOrder,
    base,
  );
  const showBrand = config.showBrand !== false;
  const logoUrl = resolveUrl(clinic?.logo);
  const name = clinic?.name || "";
  const activeSection = params.section || ""; // "" = главная витрины

  // ссылка пункта меню: home-блоки (hero/stats/cta и т.п.) без своей секции
  // ведут на главную витрины (base); контентные — на base/section.
  const linkForType = (type) => {
    const section = sectionSlugForType(type);
    return section ? `${base}/${section}` : base || "/";
  };
  const isActive = (type) => sectionSlugForType(type) === activeSection;

  // ручные пункты меню (config.customItems) — добавляются ПОСЛЕ авто-пунктов.
  const customItems = Array.isArray(config.customItems)
    ? config.customItems.filter((c) => c && c.label)
    : [];

  // категории (страницы) с подкатегориями — дропдаун из clinic.customPages
  const categoryItems = buildCategoryItems(clinic, base);

  // рендер ручного пункта как ссылки (раздел/кастомная страница/внешняя/якорь)
  const renderCustom = (c, i, cls, onClick) => {
    const link = resolveVitrinaLink(c.href, base);
    if (!link) {
      return (
        <span className={cls} key={`c-${i}`}>
          {c.label}
        </span>
      );
    }
    if (link.kind === "internal") {
      return (
        <Link className={cls} to={link.href} key={`c-${i}`} onClick={onClick}>
          {c.label}
        </Link>
      );
    }
    const ext = link.kind === "external" && /^https?:/i.test(link.href);
    return (
      <a
        className={cls}
        href={link.href}
        key={`c-${i}`}
        onClick={onClick}
        {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {c.label}
      </a>
    );
  };

  return (
    <>
      <style>{CSS}</style>
      <nav
        className={"vt-nav" + (scrolled ? " vt-scrolled" : "")}
        data-block="nav"
        style={blockBgStyle(config).style}
      >
        <div className="vt-nav-in">
          {showBrand && (
            <Link
              className="vt-nav-brand"
              to={base || "/"}
              aria-label={name}
              onClick={() => setMobileOpen(false)}
            >
              {logoUrl ? (
                <img className="vt-nav-logo" src={logoUrl} alt={name} />
              ) : (
                <span className="vt-nav-logo-init">{initials(name)}</span>
              )}
              <span className="vt-nav-name">{name}</span>
            </Link>
          )}

          {/* десктоп-меню */}
          <ul className="vt-nav-menu">
            {items.map((it) => (
              <li className="vt-nav-item" key={it.type}>
                <Link
                  className={
                    "vt-nav-link" + (isActive(it.type) ? " vt-active" : "")
                  }
                  to={linkForType(it.type)}
                  onClick={() => setMobileOpen(false)}
                >
                  {it.label}
                  {it.children && <span className="vt-nav-caret">▼</span>}
                </Link>
                {it.children && (
                  <div className="vt-nav-dd">
                    {it.children.map((c, i) =>
                      c.to ? (
                        <Link className="vt-nav-dd-link" to={c.to} key={i}>
                          {c.label}
                        </Link>
                      ) : (
                        <Link
                          className="vt-nav-dd-link"
                          to={linkForType(it.type)}
                          key={i}
                        >
                          {c.label}
                        </Link>
                      ),
                    )}
                    {it.hasMore && (
                      <Link
                        className="vt-nav-dd-link vt-nav-dd-all"
                        to={linkForType(it.type)}
                      >
                        {t("publicClinic.navAllDoctors", {
                          defaultValue: "Все врачи →",
                        })}
                      </Link>
                    )}
                  </div>
                )}
              </li>
            ))}
            {/* категории-страницы с подкатегориями (дропдаун) */}
            {categoryItems.map((cat, ci) => (
              <li className="vt-nav-item" key={`cat-${ci}`}>
                <Link
                  className="vt-nav-link"
                  to={cat.to}
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.label}
                  {cat.children && <span className="vt-nav-caret">▼</span>}
                </Link>
                {cat.children && (
                  <div className="vt-nav-dd">
                    {cat.children.map((c, i) => (
                      <Link className="vt-nav-dd-link" to={c.to} key={i}>
                        {c.label}
                      </Link>
                    ))}
                    <Link className="vt-nav-dd-link vt-nav-dd-all" to={cat.to}>
                      {t("publicClinic.navAllArticles", {
                        defaultValue: "Все статьи →",
                      })}
                    </Link>
                  </div>
                )}
              </li>
            ))}
            {customItems.map((c, i) => (
              <li className="vt-nav-item" key={`c-${i}`}>
                {renderCustom(c, i, "vt-nav-link", () => setMobileOpen(false))}
              </li>
            ))}
          </ul>

          {/* бургер (мобайл) */}
          {(items.length > 0 ||
            customItems.length > 0 ||
            categoryItems.length > 0) && (
            <button
              type="button"
              className="vt-nav-burger"
              aria-label="menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          )}
        </div>

        {/* мобильная панель */}
        <div className={"vt-nav-mobile" + (mobileOpen ? " vt-open" : "")}>
          <div className="vt-nav-mobile-in">
            {items.map((it) => (
              <React.Fragment key={it.type}>
                <Link
                  className={
                    "vt-nav-m-link" + (isActive(it.type) ? " vt-active" : "")
                  }
                  to={linkForType(it.type)}
                  onClick={() => setMobileOpen(false)}
                >
                  {it.label}
                </Link>
                {it.children && (
                  <div className="vt-nav-m-sub">
                    {it.children.map((c, i) =>
                      c.to ? (
                        <Link
                          to={c.to}
                          key={i}
                          onClick={() => setMobileOpen(false)}
                        >
                          {c.label}
                        </Link>
                      ) : null,
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
            {/* категории-страницы (мобайл) */}
            {categoryItems.map((cat, ci) => (
              <React.Fragment key={`mcat-${ci}`}>
                <Link
                  className="vt-nav-m-link"
                  to={cat.to}
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.label}
                </Link>
                {cat.children && (
                  <div className="vt-nav-m-sub">
                    {cat.children.map((c, i) => (
                      <Link
                        to={c.to}
                        key={i}
                        onClick={() => setMobileOpen(false)}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
            {customItems.map((c, i) =>
              renderCustom(c, i, "vt-nav-m-link", () => setMobileOpen(false)),
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
