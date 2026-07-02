// client/src/pages/clinic/vitrina/blocks/PriceListBlock.jsx
//
// ВИТРИНА 2.0 (V4.2) — блок полного прайс-листа.
// Раздел /clinics/:slug/services. Все услуги клиники, сгруппированные по
// отделениям, с подробным описанием, ценой (по priceType) и длительностью.
//
// Источник: clinic.services + clinic.departments (публичный DTO, уже в clinic).
// Группировка: каждое отделение → его услуги; затем «Прочие услуги» (без отдела).
// Если услуг нет вообще — дружелюбная заглушка (не пустой экран).
//
// Контракт: ({ clinic, config }).
//   config.title   — заголовок (дефолт «Услуги и цены»)
//   config.note    — текст-примечание под заголовком (напр. «Цены указаны в AZN»)
//   config.currency — валюта-фолбэк для услуг без своей (дефолт AZN)

import React from "react";
import { useTranslation } from "react-i18next";
import { blockBgStyle } from "../lib/utils.js";

const CSS = `
.vt-price-wrap { max-width: var(--v-content-max, 1040px); margin: 0 auto; padding: 40px 32px; }
.vt-price-head { text-align: center; margin-bottom: 36px; }
.vt-price-title { font-family: var(--v-font-heading); font-size: clamp(26px, 4vw, 40px); font-weight: 700; color: var(--v-text); margin: 0 0 10px; letter-spacing: -.01em; }
.vt-price-note { font-size: 15px; color: var(--v-text-muted); margin: 0; }

.vt-price-dept { margin-bottom: 34px; }
.vt-price-dept-head { display: flex; align-items: baseline; gap: 12px; margin: 0 0 14px; padding-bottom: 10px; border-bottom: 2px solid var(--v-primary); }
.vt-price-dept-name { font-family: var(--v-font-heading); font-size: 22px; font-weight: 700; color: var(--v-text); margin: 0; }
.vt-price-dept-desc { font-size: 13px; color: var(--v-text-muted); margin: 0; }

.vt-price-list { display: flex; flex-direction: column; gap: 2px; }
.vt-price-row { display: flex; align-items: flex-start; gap: 16px; padding: 16px 18px; background: var(--v-surface); border: 1px solid var(--v-border); border-radius: 12px; transition: border-color .15s, box-shadow .15s; }
.vt-price-row:hover { border-color: var(--v-primary); box-shadow: 0 4px 16px rgba(0,0,0,.06); }
.vt-price-row-main { flex: 1; min-width: 0; }
.vt-price-row-name { font-family: var(--v-font-heading); font-size: 16px; font-weight: 600; color: var(--v-text); margin: 0 0 4px; }
.vt-price-row-desc { font-size: 14px; line-height: 1.6; color: var(--v-text-muted); margin: 0; white-space: pre-line; }
.vt-price-row-dur { display: inline-block; margin-top: 6px; font-size: 12px; color: var(--v-text-muted); background: var(--v-bg); border: 1px solid var(--v-border); border-radius: 100px; padding: 2px 10px; }
.vt-price-row-price { flex-shrink: 0; text-align: right; min-width: 110px; }
.vt-price-amount { font-family: var(--v-font-heading); font-size: 18px; font-weight: 700; color: var(--v-primary); white-space: nowrap; }
.vt-price-amount--soft { font-size: 15px; font-weight: 600; color: var(--v-text-muted); }

.vt-price-empty { text-align: center; padding: 48px 24px; color: var(--v-text-muted); font-size: 15px; }

@media (max-width: 560px) {
  .vt-price-wrap { padding: 28px 16px; }
  .vt-price-row { flex-direction: column; gap: 8px; }
  .vt-price-row-price { text-align: left; min-width: 0; }
}
`;

export default function PriceListBlock({ clinic, config = {} }) {
  const { t } = useTranslation();

  const departments = Array.isArray(clinic?.departments)
    ? clinic.departments.filter((d) => d && d.name)
    : [];
  const services = Array.isArray(clinic?.services)
    ? clinic.services.filter((s) => s && s.name)
    : [];

  const fallbackCurrency = config.currency || clinic?.defaultCurrency || "AZN";

  // Формат цены по priceType.
  const fmtPrice = (s) => {
    const cur = s.currency || fallbackCurrency;
    const n = (v) =>
      typeof v === "number" ? new Intl.NumberFormat().format(v) : "";
    switch (s.priceType) {
      case "free":
        return {
          text: t("publicClinic.priceFree", { defaultValue: "Бесплатно" }),
          soft: true,
        };
      case "on_request":
        return {
          text: t("publicClinic.priceOnRequest", {
            defaultValue: "По запросу",
          }),
          soft: true,
        };
      case "from":
        return typeof s.price === "number"
          ? {
              text: `${t("publicClinic.priceFrom", { defaultValue: "от" })} ${n(s.price)} ${cur}`,
              soft: false,
            }
          : { text: "—", soft: true };
      case "range":
        return typeof s.price === "number" && typeof s.priceMax === "number"
          ? { text: `${n(s.price)}–${n(s.priceMax)} ${cur}`, soft: false }
          : typeof s.price === "number"
            ? { text: `${n(s.price)} ${cur}`, soft: false }
            : { text: "—", soft: true };
      case "fixed":
      default:
        return typeof s.price === "number"
          ? { text: `${n(s.price)} ${cur}`, soft: false }
          : { text: "—", soft: true };
    }
  };

  // Группировка услуг по departmentId.
  const svcByDept = new Map();
  const loose = [];
  for (const s of services) {
    const did = s.departmentId ? String(s.departmentId) : null;
    if (!did) {
      loose.push(s);
      continue;
    }
    if (!svcByDept.has(did)) svcByDept.set(did, []);
    svcByDept.get(did).push(s);
  }

  const title =
    config.title ||
    t("publicClinic.priceListTitle", { defaultValue: "Услуги и цены" });
  const note = config.note || "";

  const bg = blockBgStyle(config);

  // Рендер одной услуги-строки.
  const renderRow = (s, i) => {
    const price = fmtPrice(s);
    return (
      <div className="vt-price-row" key={s.id || i}>
        <div className="vt-price-row-main">
          <h4 className="vt-price-row-name">{s.name}</h4>
          {s.description && (
            <p className="vt-price-row-desc">{s.description}</p>
          )}
          {typeof s.durationMinutes === "number" && s.durationMinutes > 0 && (
            <span className="vt-price-row-dur">
              {s.durationMinutes}{" "}
              {t("publicClinic.minShort", { defaultValue: "мин" })}
            </span>
          )}
        </div>
        <div className="vt-price-row-price">
          <span
            className={
              "vt-price-amount" + (price.soft ? " vt-price-amount--soft" : "")
            }
          >
            {price.text}
          </span>
        </div>
      </div>
    );
  };

  // Отделения с услугами (в порядке departments из DTO).
  const deptSections = departments
    .map((d) => {
      const key = String(d.id || d._id || "");
      const list = svcByDept.get(key) || [];
      return { dept: d, list };
    })
    .filter((x) => x.list.length > 0);

  const hasAnything = deptSections.length > 0 || loose.length > 0;

  return (
    <section
      className={"vt-price-wrap" + (bg.hasBg ? " vt-hasbg" : "")}
      data-block="priceList"
      style={bg.style}
    >
      <style>{CSS}</style>

      <div className="vt-price-head">
        <h2 className="vt-price-title">{title}</h2>
        {note && <p className="vt-price-note">{note}</p>}
      </div>

      {!hasAnything ? (
        <div className="vt-price-empty">
          {t("publicClinic.priceEmpty", {
            defaultValue: "Прайс-лист пока заполняется.",
          })}
        </div>
      ) : (
        <>
          {deptSections.map(({ dept, list }) => (
            <div className="vt-price-dept" key={dept.id || dept.name}>
              <div className="vt-price-dept-head">
                <h3 className="vt-price-dept-name">{dept.name}</h3>
                {dept.description && (
                  <p className="vt-price-dept-desc">{dept.description}</p>
                )}
              </div>
              <div className="vt-price-list">{list.map(renderRow)}</div>
            </div>
          ))}

          {loose.length > 0 && (
            <div className="vt-price-dept">
              <div className="vt-price-dept-head">
                <h3 className="vt-price-dept-name">
                  {t("publicClinic.otherServicesTitle", {
                    defaultValue: "Прочие услуги",
                  })}
                </h3>
              </div>
              <div className="vt-price-list">{loose.map(renderRow)}</div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
