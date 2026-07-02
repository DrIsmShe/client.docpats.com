// client/src/pages/clinic/vitrina/blocks/BentoBlock.jsx
//
// ВИТРИНА 2.0 (V1 + V4.2) — блок bento: плитки отделений с их услугами.
// Источник — clinic.departments (отделения) + clinic.services (услуги).
// Услуги группируются по departmentId под соответствующим отделением;
// услуги без отдела → отдельная плитка «Прочие услуги». Bento-сетка:
// плитки 1x1 / 2x1 / 1x2 / 2x2 (override config.deptOverrides[id].span).
//
// Пустой набор (нет отделений И нет услуг) → блок не рендерится.
//
// Контракт: ({ clinic, config }).
//   config.title       — заголовок (дефолт «Отделения и услуги»)
//   config.showPrices  — показывать цены услуг (дефолт true)
//   config.deptOverrides[id] = { note?, icon?, accent?, span? }

import React from "react";
import { useTranslation } from "react-i18next";
import { blockBgStyle } from "../lib/utils.js";

const SPAN_CLASS = {
  "2x1": "vt-tile--2x1",
  "1x2": "vt-tile--1x2",
  "2x2": "vt-tile--2x2",
};

// V4.2: иконка плитки отделения по ключу specialty (фолбэк 🏥).
const SPECIALTY_ICONS = {
  cardiology: "❤️",
  cardiac_surgery: "❤️",
  neurology: "🧠",
  neurosurgery: "🧠",
  ent: "👂",
  audiology: "👂",
  ophthalmology: "👁️",
  pediatrics: "🧸",
  neonatology: "🍼",
  dentistry: "🦷",
  orthodontics: "🦷",
  maxillofacial_surgery: "🦷",
  surgery: "🔪",
  plastic_surgery: "🔪",
  orthopedics: "🦴",
  traumatology: "🦴",
  dermatology: "🧴",
  cosmetology: "💆",
  gynecology: "🌸",
  obstetrics: "🤰",
  urology: "🚹",
  gastroenterology: "🩺",
  pulmonology: "🫁",
  oncology: "🎗️",
  psychiatry: "🧩",
  psychology: "🧩",
  radiology: "🩻",
  laboratory_medicine: "🧪",
  genetics: "🧬",
  rehabilitation: "🧘",
  physiotherapy: "🧘",
  endocrinology: "⚖️",
  nephrology: "🫘",
  rheumatology: "🦵",
};

const CSS = `
.vt-bento-wrap { max-width: var(--v-content-max, 1040px); margin: 0 auto; padding: 22px 32px 0; }
.vt-bento-title { font-family: var(--v-font-heading); font-size: 20px; font-weight: 700; color: var(--v-text); margin: 0 0 16px; }
.vt-bento { display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 140px; gap: 14px; grid-auto-flow: dense; }
.vt-tile { display: flex; flex-direction: column; justify-content: flex-end; gap: 6px; background: var(--v-surface); border: 1px solid var(--v-border); border-radius: 14px; padding: 18px; text-decoration: none; color: inherit; transition: box-shadow .2s, border-color .2s, transform .2s; overflow: hidden; }
.vt-bento-wrap.vt-hasbg { border-radius: 16px; padding: 22px; }
.vt-bento-wrap.vt-hasbg .vt-tile { background: transparent; border-color: rgba(255,255,255,.25); color: inherit; }
.vt-bento-wrap.vt-hasbg .vt-bento-title { color: inherit; }
a.vt-tile:hover { box-shadow: 0 8px 24px rgba(0,0,0,.1); border-color: var(--v-primary); transform: translateY(-3px); }
.vt-tile-ico { font-size: 26px; line-height: 1; margin-bottom: auto; }
.vt-tile-title { font-family: var(--v-font-heading); font-size: 16px; font-weight: 700; color: var(--v-text); line-height: 1.25; }
.vt-tile-text { font-size: 13px; color: var(--v-text-muted); line-height: 1.45; white-space: pre-line; }
/* V4.2: список услуг внутри плитки отделения */
.vt-tile-svc { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
.vt-tile-svc li { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; font-size: 12.5px; color: var(--v-text-muted); line-height: 1.4; }
.vt-tile-svc .vt-svc-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vt-tile-svc .vt-svc-price { flex-shrink: 0; font-weight: 600; color: var(--v-text); white-space: nowrap; }
.vt-tile-svc .vt-svc-more { color: var(--v-primary); font-weight: 600; }
.vt-tile--2x1 { grid-column: span 2; }
.vt-tile--1x2 { grid-row: span 2; }
.vt-tile--2x2 { grid-column: span 2; grid-row: span 2; }
.vt-tile--accent { background: linear-gradient(135deg, var(--v-primary), var(--v-primary-dark)); border-color: transparent; }
.vt-tile--accent .vt-tile-title { color: #fff; }
.vt-tile--accent .vt-tile-text { color: rgba(255,255,255,.85); }
.vt-tile--accent .vt-tile-svc li, .vt-tile--accent .vt-svc-price { color: rgba(255,255,255,.9); }

@media (max-width: 860px) { .vt-bento { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) {
  .vt-bento-wrap { padding: 22px 18px 0; }
  .vt-bento { grid-template-columns: 1fr; grid-auto-rows: auto; }
  .vt-tile { grid-column: auto; grid-row: auto; min-height: 120px; }
}
`;

// Сколько услуг показываем в одной плитке отделения (остальное — «ещё N»).
const MAX_SVC_PER_TILE = 4;

export default function BentoBlock({ clinic, config = {} }) {
  const { t } = useTranslation();

  const departments = Array.isArray(clinic?.departments)
    ? clinic.departments.filter((d) => d && d.name)
    : [];
  const services = Array.isArray(clinic?.services)
    ? clinic.services.filter((s) => s && s.name)
    : [];

  const overrides =
    config.deptOverrides && typeof config.deptOverrides === "object"
      ? config.deptOverrides
      : {};
  const showPrices = config.showPrices !== false; // дефолт true

  // Валюта по умолчанию для услуг без своей валюты (фронт-фолбэк; точную
  // clinic.defaultCurrency публичный DTO не отдаёт → берём AZN-нейтрально).
  const fallbackCurrency = config.currency || "AZN";

  // Форматирование цены услуги по priceType.
  const fmtPrice = (s) => {
    const cur = s.currency || fallbackCurrency;
    const n = (v) =>
      typeof v === "number" ? new Intl.NumberFormat().format(v) : "";
    switch (s.priceType) {
      case "free":
        return t("publicClinic.priceFree", { defaultValue: "бесплатно" });
      case "on_request":
        return t("publicClinic.priceOnRequest", { defaultValue: "по запросу" });
      case "from":
        return typeof s.price === "number"
          ? `${t("publicClinic.priceFrom", { defaultValue: "от" })} ${n(s.price)} ${cur}`
          : "";
      case "range":
        return typeof s.price === "number" && typeof s.priceMax === "number"
          ? `${n(s.price)}–${n(s.priceMax)} ${cur}`
          : typeof s.price === "number"
            ? `${n(s.price)} ${cur}`
            : "";
      case "fixed":
      default:
        return typeof s.price === "number" ? `${n(s.price)} ${cur}` : "";
    }
  };

  // Группировка услуг по departmentId.
  const svcByDept = new Map();
  const looseServices = []; // услуги без отдела
  for (const s of services) {
    const did = s.departmentId ? String(s.departmentId) : null;
    if (!did) {
      looseServices.push(s);
      continue;
    }
    if (!svcByDept.has(did)) svcByDept.set(did, []);
    svcByDept.get(did).push(s);
  }

  // Рендер списка услуг внутри плитки (≤ MAX_SVC_PER_TILE + «ещё N»).
  const renderSvcList = (list) => {
    if (!list || !list.length) return null;
    const shown = list.slice(0, MAX_SVC_PER_TILE);
    const rest = list.length - shown.length;
    return (
      <ul className="vt-tile-svc">
        {shown.map((s, i) => {
          const price = showPrices ? fmtPrice(s) : "";
          return (
            <li key={s.id || i}>
              <span className="vt-svc-name">{s.name}</span>
              {price && <span className="vt-svc-price">{price}</span>}
            </li>
          );
        })}
        {rest > 0 && (
          <li>
            <span className="vt-svc-more">
              {t("publicClinic.servicesMore", {
                defaultValue: `ещё ${rest}`,
                count: rest,
              })}
            </span>
          </li>
        )}
      </ul>
    );
  };

  // Плитки отделений.
  const deptTiles = departments.map((d) => {
    const key = String(d.id || d._id || d.code || d.name || "");
    const ov = overrides[key] || {};
    const baseText = d.description || "";
    const note = (ov.note || "").trim();
    const deptServices = svcByDept.get(key) || [];
    return {
      kind: "dept",
      title: d.name,
      text: note ? (baseText ? `${baseText}\n${note}` : note) : baseText,
      icon: ov.icon || SPECIALTY_ICONS[d.specialty] || "🏥",
      accent: Boolean(ov.accent),
      span: ov.span || undefined,
      services: deptServices,
    };
  });

  // Плитка «Прочие услуги» (услуги без отдела) — в конце, если есть.
  const tiles = [...deptTiles];
  if (looseServices.length) {
    tiles.push({
      kind: "loose",
      title: t("publicClinic.otherServicesTitle", {
        defaultValue: "Услуги",
      }),
      text: "",
      icon: "🩺",
      accent: false,
      span: looseServices.length > MAX_SVC_PER_TILE ? "2x1" : undefined,
      services: looseServices,
    });
  }

  if (tiles.length === 0) return null;

  const title =
    config.title ||
    t("publicClinic.departmentsTitle", { defaultValue: "Отделения и услуги" });

  const bg = blockBgStyle(config);

  return (
    <section
      className={"vt-bento-wrap" + (bg.hasBg ? " vt-hasbg" : "")}
      data-block="bento"
      style={bg.style}
    >
      <style>{CSS}</style>
      <h2 className="vt-bento-title">{title}</h2>
      <div className="vt-bento">
        {tiles.map((tile, i) => {
          const cls = [
            "vt-tile",
            SPAN_CLASS[tile.span] || "",
            tile.accent ? "vt-tile--accent" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div className={cls} key={tile.id || i} data-tile={tile.kind}>
              {tile.icon && <span className="vt-tile-ico">{tile.icon}</span>}
              {tile.title && (
                <span className="vt-tile-title">{tile.title}</span>
              )}
              {tile.text && <span className="vt-tile-text">{tile.text}</span>}
              {renderSvcList(tile.services)}
            </div>
          );
        })}
      </div>
    </section>
  );
}
