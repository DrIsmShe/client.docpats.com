// client/src/pages/clinic/vitrina/blocks/HeroBlock.jsx
//
// ВИТРИНА 2.0 (V1) — блок hero (центральный).
// Ветвится по theme.heroStyle (gradient/photo/minimal/split). Тон текста и
// потребность в обложке берёт из theme.hero (резолвнут на сервере).
//
// gradient (дефолт) — повторяет текущую шапку PublicClinicPage: 3-стоповый
//   градиент hero-from → primary → hero-to, нижняя дуга в цвет --v-bg, светлый текст.
// minimal — фон --v-bg, тёмный текст, тонкий разделитель.
// photo   — обложка на фоне + затемнение (theme.hero.overlay), светлый текст.
// split   — две колонки: текст (--v-surface, тёмный) слева, обложка справа.
//
// photo/split ТРЕБУЮТ обложку (clinic.coverImage — поле появится в V4). Пока её
// нет → откат на gradient. Язык переехал в topbar, в hero его НЕТ.
//
// Контракт: ({ clinic, config }).
//   config.slogan — подзаголовок под именем (стоп-гэп до V4-поля)

import React from "react";
import { useTranslation } from "react-i18next";
import { resolveUrl, initials, blockBgStyle } from "../lib/utils.js";

const TONE_BY_STYLE = {
  gradient: "light",
  photo: "light",
  minimal: "dark",
  split: "dark",
};

const CSS = `
.vt-hero { position: relative; overflow: hidden; font-family: var(--v-font-body); background-size: cover; background-position: center; min-height: var(--v-hero-h, 0px); display: flex; flex-direction: column; justify-content: flex-end; }
.vt-hero-in { max-width: var(--v-content-max, 1040px); margin: 0 auto; position: relative; z-index: 1; width: 100%; }
.vt-hero-overlay { position: absolute; inset: 0; z-index: 0; }

.vt-hero-logo { width: 104px; height: 104px; border-radius: 24px; overflow: hidden; flex-shrink: 0; }
.vt-hero-logo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.vt-hero-logo-init { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-family: var(--v-font-heading); font-size: 38px; font-weight: 700; }

.vt-hero-info { flex: 1; min-width: 0; }
.vt-hero-name { font-family: var(--v-font-heading); font-weight: 700; line-height: 1.15; letter-spacing: -.015em; margin: 0 0 8px; font-size: clamp(26px, 4vw, 40px); }
.vt-hero-slogan { margin: 0 0 12px; font-size: 16px; line-height: 1.5; max-width: 560px; }

.vt-hero-meta { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.vt-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; padding: 5px 13px; border-radius: 100px; }
.vt-chip--verified { font-weight: 600; }
.vt-chip--verified::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.vt-chip--rating { font-weight: 600; }

/* ── ТОН: светлый текст (на градиенте/фото) ── */
.vt-hero--light .vt-hero-name { color: #fff; }
.vt-hero--light .vt-hero-slogan { color: rgba(255,255,255,.85); }
.vt-hero--light .vt-hero-logo { border: 3px solid rgba(255,255,255,.35); box-shadow: 0 8px 32px rgba(0,0,0,.2); background: rgba(255,255,255,.12); }
.vt-hero--light .vt-hero-logo-init { color: rgba(255,255,255,.8); }
.vt-hero--light .vt-chip { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); color: rgba(255,255,255,.9); }
.vt-hero--light .vt-chip--verified { background: rgba(255,255,255,.16); border-color: rgba(255,255,255,.4); color: #fff; }
.vt-hero--light .vt-chip--rating { background: rgba(245,158,11,.18); border-color: rgba(245,158,11,.4); color: #fcd34d; }

/* ── ТОН: тёмный текст (minimal/split) ── */
.vt-hero--dark .vt-hero-name { color: var(--v-text); }
.vt-hero--dark .vt-hero-slogan { color: var(--v-text-muted); }
.vt-hero--dark .vt-hero-logo { border: 1px solid var(--v-border); box-shadow: 0 4px 16px rgba(0,0,0,.06); background: var(--v-surface-alt); }
.vt-hero--dark .vt-hero-logo-init { color: var(--v-primary); }
.vt-hero--dark .vt-chip { background: var(--v-surface-alt); border: 1px solid var(--v-border); color: var(--v-text-muted); }
.vt-hero--dark .vt-chip--verified { color: var(--v-primary); }
.vt-hero--dark .vt-chip--rating { background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.3); color: #b5870a; }

/* ── gradient ── */
.vt-hero--gradient { background: linear-gradient(150deg, var(--v-hero-from) 0%, var(--v-primary) 60%, var(--v-hero-to) 100%); padding: 56px 32px 90px; }
.vt-hero--gradient::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 700px 400px at 88% 25%, rgba(255,255,255,.14) 0%, transparent 60%); pointer-events: none; z-index: 0; }
.vt-hero--gradient::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 56px; background: var(--v-bg); clip-path: ellipse(60% 100% at 50% 100%); z-index: 0; }
.vt-hero--gradient .vt-hero-in { display: flex; align-items: flex-end; gap: 24px; flex-wrap: wrap; }

/* ── minimal ── */
.vt-hero--minimal { background: var(--v-bg); padding: 64px 32px 48px; border-bottom: 1px solid var(--v-border); justify-content: center; }
.vt-hero--minimal .vt-hero-in { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }

/* ── photo ── */
.vt-hero--photo { padding: 76px 32px 96px; }
.vt-hero--photo .vt-hero-in { display: flex; align-items: flex-end; gap: 24px; flex-wrap: wrap; }

/* ── split ── */
.vt-hero--split { background: var(--v-surface); }
.vt-hero--split .vt-hero-in { display: grid; grid-template-columns: 1.05fr .95fr; gap: 0; align-items: stretch; }
.vt-hero-split-text { padding: 56px 40px; display: flex; flex-direction: column; justify-content: center; gap: 16px; }
.vt-hero-split-img { background-size: cover; background-position: center; min-height: 340px; }
@media (max-width: 760px) {
  .vt-hero--split .vt-hero-in { grid-template-columns: 1fr; }
  .vt-hero-split-text { padding: 40px 24px; }
  .vt-hero-split-img { min-height: 220px; order: -1; }
}

@media (max-width: 640px) {
  .vt-hero--gradient { padding: 44px 18px 80px; }
  .vt-hero--minimal { padding: 48px 18px 36px; }
  .vt-hero--photo { padding: 56px 18px 76px; }
}
`;

export default function HeroBlock({ clinic, config = {} }) {
  const { t } = useTranslation();
  const theme = clinic?.theme || {};
  const heroCfg = theme.hero || {};

  let style = theme.heroStyle || "gradient";
  const coverUrl = resolveUrl(clinic?.coverImage); // V4-поле; пока обычно null
  // photo/split без обложки бессмысленны → откат на gradient
  if ((style === "photo" || style === "split") && !coverUrl) style = "gradient";

  const tone = TONE_BY_STYLE[style] || "light";

  const name = clinic?.name || "";
  const logoUrl = resolveUrl(clinic?.logo);
  const isVerified = Boolean(clinic?.isVerified);
  const rating = clinic?.rating || { avg: 0, count: 0 };
  const hasRating = (rating.count || 0) > 0;
  const cityLine = [clinic?.address?.city, clinic?.address?.country]
    .filter(Boolean)
    .join(", ");
  // приоритет: поле клиники (V4.1) > config блока (V3.3) > пусто
  const slogan = clinic?.slogan || config.slogan || null;

  const brand = (
    <div className="vt-hero-logo">
      {logoUrl ? (
        <img src={logoUrl} alt={name} />
      ) : (
        <div className="vt-hero-logo-init">{initials(name)}</div>
      )}
    </div>
  );

  const info = (
    <div className="vt-hero-info">
      <h1 className="vt-hero-name">{name}</h1>
      {slogan && <p className="vt-hero-slogan">{slogan}</p>}
      <div className="vt-hero-meta">
        {isVerified && (
          <span className="vt-chip vt-chip--verified">
            {t("publicClinic.verified", { defaultValue: "Подтверждена" })}
          </span>
        )}
        {hasRating && (
          <span className="vt-chip vt-chip--rating">
            ★ {rating.avg} · {rating.count}
          </span>
        )}
        {cityLine && <span className="vt-chip">📍 {cityLine}</span>}
      </div>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <header
        className={`vt-hero vt-hero--${style} vt-hero--${tone}`}
        data-block="hero"
        style={
          style === "photo" && coverUrl
            ? { backgroundImage: `url(${coverUrl})` }
            : blockBgStyle(config).style
        }
      >
        {style === "photo" && coverUrl && (
          <div
            className="vt-hero-overlay"
            style={{ background: heroCfg.overlay || "rgba(0,0,0,.45)" }}
          />
        )}

        <div className="vt-hero-in">
          {style === "split" ? (
            <>
              <div className="vt-hero-split-text">
                {brand}
                {info}
              </div>
              <div
                className="vt-hero-split-img"
                style={{ backgroundImage: `url(${coverUrl})` }}
                role="img"
                aria-label={name}
              />
            </>
          ) : (
            <>
              {brand}
              {info}
            </>
          )}
        </div>
      </header>
    </>
  );
}
