// client/src/pages/clinic/vitrina/blocks/DoctorsBlock.jsx
//
// ВИТРИНА 2.0 — блок doctors («Специалисты»).
// Дизайн в духе крупных клиник: центральный заголовок, ряд кнопок-фильтров по
// специализациям, сетка крупных карточек (большое фото cover + бейдж стажа
// поверх фото + имя + должность). Клик по карточке → /doctor/:id.
//
// Фильтры строятся из уникальных d.specialization (связи врач↔отделение в DTO
// пока нет). Если специализаций < 2 — панель фильтров не показывается.
//
// Контракт: ({ clinic, config }).

import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { specialityName } from "../../../../utils/specialityName";
import {
  resolveUrl,
  initials,
  blockBgStyle,
  clinicBasePath,
} from "../lib/utils.js";

const CSS = `
.vt-spec { padding: 56px 0 8px; }
.vt-spec-in { max-width: var(--v-content-max, 1040px); margin: 0 auto; padding: 0 32px; }
.vt-spec-title { font-family: var(--v-font-heading); font-size: clamp(30px, 5vw, 52px); font-weight: 700; color: var(--v-text); text-align: center; margin: 0 0 36px; letter-spacing: -.01em; }

.vt-spec-filters { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 36px; }
.vt-spec-fbtn { border: 1px solid var(--v-border); background: var(--v-surface); color: var(--v-text); font-family: var(--v-font-body); font-size: 14px; font-weight: 500; padding: 9px 18px; border-radius: 100px; cursor: pointer; transition: all .15s; white-space: nowrap; }
.vt-spec-fbtn:hover { border-color: var(--v-primary); color: var(--v-primary); }
.vt-spec-fbtn.vt-on { background: var(--v-primary); border-color: var(--v-primary); color: var(--v-on-primary); }

.vt-spec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 26px 24px; }
.vt-spec-card { display: block; text-decoration: none; color: inherit; background: var(--v-surface-alt); border: 1px solid var(--v-border); border-radius: 22px; padding: 14px 14px 22px; transition: box-shadow .2s, transform .2s; }
.vt-spec-card:hover { box-shadow: 0 10px 30px rgba(0,0,0,.08); transform: translateY(-3px); }
.vt-spec.vt-hasbg .vt-spec-card { background: transparent; border-color: rgba(255,255,255,.22); }
.vt-spec.vt-hasbg .vt-spec-title,
.vt-spec.vt-hasbg .vt-spec-name { color: inherit; }
.vt-spec.vt-hasbg .vt-spec-role { color: inherit; opacity: .8; }
.vt-spec.vt-hasbg .vt-spec-fbtn { background: transparent; color: inherit; border-color: rgba(255,255,255,.3); }
.vt-spec.vt-hasbg .vt-spec-fbtn.vt-on { background: var(--v-surface); color: var(--v-text); border-color: var(--v-surface); }
.vt-spec-photo { position: relative; width: 100%; aspect-ratio: 1 / 1; border-radius: 14px; overflow: hidden; background: #e5e7eb; margin-bottom: 16px; }
.vt-spec-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s; }
.vt-spec-card:hover .vt-spec-photo img { transform: scale(1.04); }
.vt-spec-init { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-family: var(--v-font-heading); font-size: 52px; font-weight: 700; color: var(--v-primary); background: var(--v-surface-alt); }
.vt-spec-exp { position: absolute; left: 12px; bottom: 12px; background: var(--v-surface); color: var(--v-text); font-size: 13px; font-weight: 600; padding: 7px 15px; border-radius: 100px; box-shadow: 0 2px 12px rgba(0,0,0,.14); }
.vt-spec-name { font-family: var(--v-font-heading); font-size: 19px; font-weight: 600; color: var(--v-text); line-height: 1.25; margin: 0 4px 8px; display: flex; align-items: flex-start; gap: 6px; }
.vt-spec-vrf { color: var(--v-primary); font-size: 15px; flex-shrink: 0; margin-top: 2px; }
.vt-spec-role { font-size: 14px; color: var(--v-text-muted); line-height: 1.45; margin: 0 4px; }

@media (max-width: 640px) {
  .vt-spec-in { padding: 0 16px; }
  .vt-spec-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px 14px; }
  .vt-spec-name { font-size: 16px; }
}
`;

function DoctorCard({ d, t, base }) {
  const img = resolveUrl(d.profileImage);
  const years = Number(d.experienceYears) || 0;
  const role = specialityName(d.specialization, t) || d.about || "";

  const inner = (
    <>
      <div className="vt-spec-photo">
        {img ? (
          <img src={img} alt={d.name} loading="lazy" />
        ) : (
          <div className="vt-spec-init">{initials(d.name)}</div>
        )}
        {years > 0 && (
          <span className="vt-spec-exp">
            {t("publicClinic.experienceShort", {
              count: years,
              defaultValue: "Стаж {{count}} лет",
            })}
          </span>
        )}
      </div>
      <div className="vt-spec-name">
        <span>{d.name || "—"}</span>
        {d.isVerified && (
          <span
            className="vt-spec-vrf"
            title={t("publicClinic.verifiedDoctor", {
              defaultValue: "Подтверждённый врач",
            })}
          >
            ✓
          </span>
        )}
      </div>
      {role && <div className="vt-spec-role">{role}</div>}
    </>
  );

  // Карточка ведёт на страницу врача ВНУТРИ витрины: /<slug>/doctors/<id>.
  // Раньше здесь стоял d.profileUrl — адрес страницы ПЛАТФОРМЫ
  // (/public/doctor-profile/doctor-details/<id>), и посетитель уходил с сайта
  // клиники к чужой шапке. profileUrl остаётся запасным вариантом: у старого
  // DTO поля id ещё нет, и лучше увести на платформу, чем никуда.
  const href = d.id && base ? `${base}/doctors/${d.id}` : d.profileUrl;

  return href ? (
    <Link className="vt-spec-card" to={href}>
      {inner}
    </Link>
  ) : (
    <div className="vt-spec-card">{inner}</div>
  );
}

export default function DoctorsBlock({ clinic, config = {} }) {
  const { t } = useTranslation();
  const location = useLocation();
  const base = clinic?.slug
    ? clinicBasePath(location.pathname, clinic.slug)
    : "";
  const doctors = useMemo(
    () => (Array.isArray(clinic?.doctors) ? clinic.doctors : []),
    [clinic?.doctors],
  );

  // уникальные специализации для фильтра (без пустых)
  const specs = useMemo(() => {
    const set = new Set();
    for (const d of doctors) {
      const s = (d.specialization || "").trim();
      if (s) set.add(s);
    }
    return Array.from(set);
  }, [doctors]);

  const [active, setActive] = useState("all"); // "all" | specialization

  if (doctors.length === 0) return null;

  const shown =
    active === "all"
      ? doctors
      : doctors.filter((d) => (d.specialization || "").trim() === active);

  const showFilters = specs.length >= 2;
  const bg = blockBgStyle(config);

  return (
    <section
      className={"vt-spec" + (bg.hasBg ? " vt-hasbg" : "")}
      data-block="doctors"
      style={bg.style}
    >
      <style>{CSS}</style>
      <div className="vt-spec-in">
        <h2 className="vt-spec-title">
          {t("publicClinic.specialistsTitle", { defaultValue: "Специалисты" })}
        </h2>

        {showFilters && (
          <div className="vt-spec-filters">
            <button
              type="button"
              className={"vt-spec-fbtn" + (active === "all" ? " vt-on" : "")}
              onClick={() => setActive("all")}
            >
              {t("publicClinic.doctorsAll", { defaultValue: "Все" })}
            </button>
            {specs.map((s) => (
              <button
                type="button"
                key={s}
                className={"vt-spec-fbtn" + (active === s ? " vt-on" : "")}
                onClick={() => setActive(s)}
              >
                {specialityName(s, t)}
              </button>
            ))}
          </div>
        )}

        <div className="vt-spec-grid">
          {shown.map((d) => (
            <DoctorCard key={d.userId} d={d} t={t} base={base} />
          ))}
        </div>
      </div>
    </section>
  );
}
