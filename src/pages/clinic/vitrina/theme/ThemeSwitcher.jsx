// client/src/pages/clinic/vitrina/theme/ThemeSwitcher.jsx
//
// ВИТРИНА 2.0 (V2) — switcher темы с live-preview (для ClinicPublicPageSettings).
// Контролы: пресеты, палитры (свотчи), пары шрифтов (образцы), hero- и card-стили.
// Превью: VitrinaRenderer на SAMPLE-данных + реальные имя/лого/описание/контакты
// клиники, тема резолвится ЛОКАЛЬНО (resolveThemeClient) — мгновенно, без сейва.
//
// Сохранение делает родитель через onSave(themeKeys) (см. шаг 4 — PATCH темы).
//
// Props:
//   clinic   — объект клиники из getClinicMe (берём theme + имя/лого/контакты)
//   canWrite — права на сохранение
//   onSave   — async (themeKeys) => void

import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import VitrinaRenderer from "../VitrinaRenderer.jsx";
import { resolveThemeClient } from "./resolveThemeClient.js";
import { useThemePresets } from "./useThemePresets.js";

const HERO_LABELS = {
  gradient: "Градиент",
  photo: "Фото",
  minimal: "Минимал",
  split: "Сплит",
};
const CARD_LABELS = {
  elevated: "С тенью",
  flat: "Плоский",
  outline: "Контур",
  soft: "Мягкий",
};
const PAGE_BG_LABELS = {
  none: "Нет",
  gradient: "Градиент",
  photo: "Фото",
};
const PRESET_LABELS = {
  classic: "Классика",
  modern: "Модерн",
  warm: "Тёплый",
  clinical: "Клиничный",
  bold: "Смелый",
  nature: "Природа",
};

// SAMPLE-наполнение превью (чтобы рендерились все блоки).
const SAMPLE_LAYOUT = {
  blocks: [
    { type: "nav", order: 1, config: {} },
    { type: "hero", order: 2, config: { slogan: "Здоровье начинается здесь" } },
    {
      type: "stats",
      order: 3,
      config: {
        items: [
          { value: "15+", label: "лет на рынке", icon: "📅" },
          { value: "5000+", label: "пациентов", icon: "🩺" },
        ],
      },
    },
    {
      type: "whyUs",
      order: 4,
      config: {
        advantages: [
          { icon: "⚡", title: "Быстро", text: "Приём в день обращения" },
          { icon: "🛡️", title: "Надёжно", text: "Сертифицированные врачи" },
        ],
      },
    },
    { type: "doctors", order: 5, config: {} },
    {
      type: "bento",
      order: 6,
      config: {
        tiles: [
          { title: "ЛОР", icon: "👂", span: "2x1" },
          { title: "Хирургия", icon: "🔪" },
          { title: "Кардиология", icon: "❤️", accent: true },
        ],
      },
    },
    { type: "reviews", order: 7, config: {} },
    { type: "publications", order: 8, config: {} },
    { type: "cta", order: 12, config: {} },
    { type: "footer", order: 13, config: {} },
  ],
};
const SAMPLE_DOCTORS = [
  {
    userId: "s1",
    name: "Иванов И.",
    specialization: "ЛОР",
    isVerified: true,
    experienceYears: 12,
    profileUrl: "#",
  },
  {
    userId: "s2",
    name: "Петрова А.",
    specialization: "Кардиолог",
    experienceYears: 7,
    profileUrl: "#",
  },
  {
    userId: "s3",
    name: "Сидоров П.",
    specialization: "Хирург",
    isVerified: true,
    experienceYears: 20,
    profileUrl: "#",
  },
];
const SAMPLE_REVIEWS = [
  {
    id: "r1",
    authorName: "Гость",
    rating: 5,
    text: "Отличная клиника, внимательные врачи!",
    createdAt: "2025-02-01",
  },
];
const SAMPLE_PUBS = [
  {
    id: "p1",
    title: "Здоровье ЛОР-органов",
    abstract: "Краткая аннотация статьи для превью.",
    authorName: "Иванов И.",
    readTime: 5,
    url: "#",
  },
];

const CSS = `
.vt-sw { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
@media (max-width: 900px) { .vt-sw { grid-template-columns: 1fr; } }
.vt-sw-controls { display: flex; flex-direction: column; gap: 20px; }
.vt-sw-group-title { font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #78716c; margin: 0 0 10px; }
.vt-sw-row { display: flex; flex-wrap: wrap; gap: 8px; }

.vt-sw-preset { border: 1px solid #d6d0c6; background: #fff; border-radius: 100px; padding: 6px 14px; font-size: 13px; font-weight: 600; color: #44403c; cursor: pointer; }
.vt-sw-preset:hover { border-color: #0f766e; color: #0f766e; }

.vt-sw-pal { width: 40px; height: 40px; border-radius: 10px; border: 2px solid transparent; cursor: pointer; position: relative; overflow: hidden; padding: 0; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
.vt-sw-pal.active { border-color: #1c1917; }
.vt-sw-pal-bg { position: absolute; inset: 0; }
.vt-sw-pal-pri { position: absolute; right: 0; bottom: 0; width: 60%; height: 60%; border-top-left-radius: 8px; }

.vt-sw-font { border: 1px solid #d6d0c6; background: #fff; border-radius: 10px; padding: 8px 12px; cursor: pointer; text-align: left; min-width: 120px; }
.vt-sw-font.active { border-color: #0f766e; box-shadow: 0 0 0 2px rgba(15,118,110,.15); }
.vt-sw-font-h { font-size: 17px; font-weight: 700; color: #1c1917; line-height: 1.1; }
.vt-sw-font-b { font-size: 12px; color: #78716c; }

.vt-sw-opt { border: 1px solid #d6d0c6; background: #fff; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 600; color: #44403c; cursor: pointer; }
.vt-sw-opt.active { border-color: #0f766e; background: #f0fdfa; color: #0f766e; }

.vt-sw-save-row { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
.vt-sw-save { background: #0f766e; color: #fff; border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 700; cursor: pointer; }
.vt-sw-save:disabled { opacity: .5; cursor: default; }
.vt-sw-saved { font-size: 13px; color: #1a6b3c; }

.vt-sw-preview { border: 1px solid #d6d0c6; border-radius: 14px; overflow: hidden; height: 600px; background: #fff; }
.vt-sw-preview-scroll { height: 100%; overflow: auto; }
.vt-sw-preview-label { font-size: 11px; color: #8a8a7a; margin: 0 0 8px; font-family: monospace; }
`;

export function ThemeSwitcherView({ presets, clinic, canWrite, onSave }) {
  const { t } = useTranslation("clinic");

  const def = presets?.default || {};
  const initial = useMemo(
    () => ({
      palette: clinic?.theme?.palette || def.palette,
      fontPair: clinic?.theme?.fontPair || def.fontPair,
      heroStyle: clinic?.theme?.heroStyle || def.heroStyle,
      cardStyle: clinic?.theme?.cardStyle || def.cardStyle,
      pageBgStyle: clinic?.theme?.pageBgStyle || def.pageBgStyle || "none",
      pageBgDim: Number.isFinite(clinic?.theme?.pageBgDim)
        ? clinic.theme.pageBgDim
        : Number.isFinite(def.pageBgDim)
          ? def.pageBgDim
          : 85,
      contentWidth: Number.isFinite(clinic?.theme?.contentWidth)
        ? clinic.theme.contentWidth
        : Number.isFinite(def.contentWidth)
          ? def.contentWidth
          : 1040,
      heroHeight: Number.isFinite(clinic?.theme?.heroHeight)
        ? clinic.theme.heroHeight
        : Number.isFinite(def.heroHeight)
          ? def.heroHeight
          : 0,
    }),
    [
      clinic,
      def.palette,
      def.fontPair,
      def.heroStyle,
      def.cardStyle,
      def.pageBgStyle,
      def.pageBgDim,
      def.contentWidth,
      def.heroHeight,
    ],
  );
  const initialRef = useRef(JSON.stringify(initial));

  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => {
    setValue((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  };
  const applyPreset = (p) => {
    setValue((prev) => ({
      palette: p.palette,
      fontPair: p.fontPair,
      heroStyle: p.heroStyle,
      cardStyle: p.cardStyle,
      // пресеты не задают фон страницы — сохраняем текущий выбор владельца
      pageBgStyle: prev.pageBgStyle,
      pageBgDim: prev.pageBgDim,
      contentWidth: prev.contentWidth,
      heroHeight: prev.heroHeight,
    }));
    setSaved(false);
  };

  const dirty = JSON.stringify(value) !== initialRef.current;

  const resolved = resolveThemeClient(value, presets);

  const previewClinic = useMemo(
    () => ({
      name: clinic?.name || "Ваша клиника",
      logo: clinic?.logo || null,
      coverImage: clinic?.coverImage || null,
      pageBackground: clinic?.pageBackground || null,
      slogan: clinic?.slogan || null,
      isVerified: clinic?.isVerified ?? true,
      description:
        clinic?.description ||
        "Здесь будет описание вашей клиники — направления, история, преимущества.",
      specializations:
        clinic?.specializations?.length > 0
          ? clinic.specializations
          : ["Терапия", "Хирургия", "Диагностика"],
      contacts: clinic?.contacts || { phone: "+994 12 000 00 00" },
      address: clinic?.address || { city: "Баку" },
      doctors: SAMPLE_DOCTORS,
      reviews: SAMPLE_REVIEWS,
      rating: { avg: 4.8, count: 12 },
      publications: SAMPLE_PUBS,
      gallery: [],
      theme: resolved,
      layout: SAMPLE_LAYOUT,
    }),
    [clinic, resolved],
  );

  const handleSave = async () => {
    if (!canWrite || saving || !dirty) return;
    setSaving(true);
    try {
      await onSave(value);
      initialRef.current = JSON.stringify(value);
      setSaved(true);
    } catch {
      /* ошибку показывает родитель */
    } finally {
      setSaving(false);
    }
  };

  const palettes = presets?.palettes || [];
  const fontPairs = presets?.fontPairs || [];
  const heroStyles = presets?.heroStyles || [];
  const cardStyles = presets?.cardStyles || [];
  const pageBgStyles = presets?.pageBgStyles || [];
  const presetList = presets?.presets || [];

  return (
    <div className="vt-sw">
      <style>{CSS}</style>

      <div className="vt-sw-controls">
        {/* пресеты */}
        <div>
          <p className="vt-sw-group-title">
            {t("publicPage.themePresets", { defaultValue: "Готовые темы" })}
          </p>
          <div className="vt-sw-row">
            {presetList.map((p) => (
              <button
                key={p.key}
                type="button"
                className="vt-sw-preset"
                onClick={() => applyPreset(p)}
              >
                {t(`publicPage.preset_${p.key}`, {
                  defaultValue: PRESET_LABELS[p.key] || p.key,
                })}
              </button>
            ))}
          </div>
        </div>

        {/* палитры */}
        <div>
          <p className="vt-sw-group-title">
            {t("publicPage.themePalette", { defaultValue: "Палитра" })}
          </p>
          <div className="vt-sw-row">
            {palettes.map((p) => (
              <button
                key={p.key}
                type="button"
                title={p.key}
                className={
                  "vt-sw-pal" + (value.palette === p.key ? " active" : "")
                }
                onClick={() => set("palette", p.key)}
              >
                <span
                  className="vt-sw-pal-bg"
                  style={{ background: p.swatch?.bg || p.tokens?.bg }}
                />
                <span
                  className="vt-sw-pal-pri"
                  style={{ background: p.swatch?.primary || p.tokens?.primary }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* шрифты */}
        <div>
          <p className="vt-sw-group-title">
            {t("publicPage.themeFont", { defaultValue: "Шрифты" })}
          </p>
          <div className="vt-sw-row">
            {fontPairs.map((f) => (
              <button
                key={f.key}
                type="button"
                className={
                  "vt-sw-font" + (value.fontPair === f.key ? " active" : "")
                }
                onClick={() => set("fontPair", f.key)}
              >
                <div className="vt-sw-font-h" style={{ fontFamily: f.heading }}>
                  Клиника
                </div>
                <div className="vt-sw-font-b" style={{ fontFamily: f.body }}>
                  Aa Бб Cc
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* hero */}
        <div>
          <p className="vt-sw-group-title">
            {t("publicPage.themeHero", { defaultValue: "Обложка (hero)" })}
          </p>
          <div className="vt-sw-row">
            {heroStyles.map((h) => (
              <button
                key={h.key}
                type="button"
                className={
                  "vt-sw-opt" + (value.heroStyle === h.key ? " active" : "")
                }
                onClick={() => set("heroStyle", h.key)}
              >
                {t(`publicPage.hero_${h.key}`, {
                  defaultValue: HERO_LABELS[h.key] || h.key,
                })}
              </button>
            ))}
          </div>
          {/* высота hero */}
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "#8a8a7a",
                marginBottom: 4,
              }}
            >
              <span>
                {t("publicPage.heroHeightLabel", {
                  defaultValue: "Высота обложки",
                })}
              </span>
              <span>
                {(value.heroHeight ?? 0) <= 0
                  ? t("publicPage.heroHeightAuto", { defaultValue: "Авто" })
                  : `${value.heroHeight}px`}
              </span>
            </div>
            {/* 0 = авто; иначе 100..850. Шаг 10. Позиция 90 = авто (0). */}
            <input
              type="range"
              min="90"
              max="850"
              step="10"
              value={(value.heroHeight ?? 0) <= 0 ? 90 : value.heroHeight}
              onChange={(e) => {
                const v = Number(e.target.value);
                set("heroHeight", v < 100 ? 0 : v);
              }}
              style={{ width: "100%", accentColor: "#0f766e" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "#b8b2a6",
              }}
            >
              <span>
                {t("publicPage.heroHeightAuto", { defaultValue: "Авто" })}
              </span>
              <span>850px</span>
            </div>
          </div>
        </div>

        {/* cards */}
        <div>
          <p className="vt-sw-group-title">
            {t("publicPage.themeCard", { defaultValue: "Карточки" })}
          </p>
          <div className="vt-sw-row">
            {cardStyles.map((c) => (
              <button
                key={c.key}
                type="button"
                className={
                  "vt-sw-opt" + (value.cardStyle === c.key ? " active" : "")
                }
                onClick={() => set("cardStyle", c.key)}
              >
                {t(`publicPage.card_${c.key}`, {
                  defaultValue: CARD_LABELS[c.key] || c.key,
                })}
              </button>
            ))}
          </div>
        </div>

        {/* фон страницы */}
        <div>
          <p className="vt-sw-group-title">
            {t("publicPage.themePageBg", { defaultValue: "Фон страницы" })}
          </p>
          <div className="vt-sw-row">
            {pageBgStyles.map((b) => (
              <button
                key={b.key}
                type="button"
                className={
                  "vt-sw-opt" + (value.pageBgStyle === b.key ? " active" : "")
                }
                onClick={() => set("pageBgStyle", b.key)}
              >
                {t(`publicPage.pageBg_${b.key}`, {
                  defaultValue: PAGE_BG_LABELS[b.key] || b.key,
                })}
              </button>
            ))}
          </div>
          {value.pageBgStyle === "photo" && !clinic?.pageBackground && (
            <p
              style={{
                fontSize: 11,
                color: "#b5870a",
                margin: "6px 0 0",
              }}
            >
              {t("publicPage.pageBgNeedPhoto", {
                defaultValue:
                  "Загрузите фоновое фото в «Контент клиники» — иначе фон останется обычным.",
              })}
            </p>
          )}
          {value.pageBgStyle === "photo" && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "#8a8a7a",
                  marginBottom: 4,
                }}
              >
                <span>
                  {t("publicPage.pageBgDimLabel", {
                    defaultValue: "Яркость фото",
                  })}
                </span>
                <span>{100 - (value.pageBgDim ?? 85)}%</span>
              </div>
              {/* ползунок показывает «яркость» = 100 − dim: вправо → фото ярче */}
              <input
                type="range"
                min="0"
                max="92"
                step="1"
                value={92 - (value.pageBgDim ?? 85)}
                onChange={(e) => set("pageBgDim", 92 - Number(e.target.value))}
                style={{ width: "100%", accentColor: "#0f766e" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "#b8b2a6",
                }}
              >
                <span>
                  {t("publicPage.pageBgDimMin", { defaultValue: "Затемнено" })}
                </span>
                <span>
                  {t("publicPage.pageBgDimMax", {
                    defaultValue: "Фото целиком",
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ширина контента */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <p className="vt-sw-group-title">
              {t("publicPage.themeContentWidth", {
                defaultValue: "Ширина контента",
              })}
            </p>
            <span style={{ fontSize: 11, color: "#8a8a7a" }}>
              {(value.contentWidth ?? 1040) >= 1600
                ? "100%"
                : `${value.contentWidth ?? 1040}px`}
            </span>
          </div>
          <input
            type="range"
            min="380"
            max="1600"
            step="20"
            value={value.contentWidth ?? 1040}
            onChange={(e) => set("contentWidth", Number(e.target.value))}
            style={{ width: "100%", accentColor: "#0f766e" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "#b8b2a6",
            }}
          >
            <span>380px</span>
            <span>100%</span>
          </div>
        </div>

        {/* save */}
        <div className="vt-sw-save-row">
          <button
            type="button"
            className="vt-sw-save"
            disabled={!canWrite || saving || !dirty}
            onClick={handleSave}
          >
            {saving
              ? t("common.saving", { defaultValue: "Сохранение…" })
              : t("common.save", { defaultValue: "Сохранить" })}
          </button>
          {saved && (
            <span className="vt-sw-saved">
              {t("publicPage.saved", { defaultValue: "Сохранено" })}
            </span>
          )}
        </div>
      </div>

      {/* live preview */}
      <div>
        <p className="vt-sw-preview-label">
          {t("publicPage.themePreview", { defaultValue: "Предпросмотр" })}
        </p>
        <div className="vt-sw-preview">
          <div className="vt-sw-preview-scroll">
            <VitrinaRenderer clinic={previewClinic} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThemeSwitcher({ clinic, canWrite, onSave }) {
  const { t } = useTranslation("clinic");
  const { presets, loading, error } = useThemePresets();

  if (loading) {
    return (
      <div style={{ padding: 24, color: "#78716c" }}>
        {t("common.loading", { defaultValue: "Загрузка…" })}
      </div>
    );
  }
  if (error || !presets) {
    return (
      <div style={{ padding: 24, color: "#c0392b" }}>
        {t("publicPage.themeLoadError", {
          defaultValue: "Не удалось загрузить темы.",
        })}
      </div>
    );
  }

  return (
    <ThemeSwitcherView
      presets={presets}
      clinic={clinic}
      canWrite={canWrite}
      onSave={onSave}
    />
  );
}
