// client/src/pages/clinic/vitrina/layout/LayoutEditor.jsx
//
// ВИТРИНА 2.0 (V3 + V3.3) — редактор раскладки блоков (для ClinicPublicPageSettings).
// Drag-reorder (нативный HTML5 DnD) + тоггл видимости + редактирование config
// каждого блока (раскрывающаяся форма из configForms) + live-preview
// (VitrinaRenderer на sample-данных, в реальной теме клиники).
//
// Сохранение: onSave(blocks) — order = индекс, visible и config сохраняются.
//
// Props: clinic (getClinicMe), canWrite, onSave(blocks).

import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import VitrinaRenderer from "../VitrinaRenderer.jsx";
import { resolveThemeClient } from "../theme/resolveThemeClient.js";
import { useThemePresets } from "../theme/useThemePresets.js";
import { CONFIG_CSS } from "./configFields.jsx";
import { getConfigForm, hasConfigForm } from "./configForms.jsx";

// Дефолтная раскладка — фолбэк, если у клиники layout пуст (старые записи).
// Зеркало defaultLayoutBlocks() из модели. faq скрыт по умолчанию.
const DEFAULT_BLOCKS = [
  { type: "topbar", visible: true },
  { type: "nav", visible: true },
  { type: "hero", visible: true },
  { type: "stats", visible: true },
  { type: "whyUs", visible: true },
  { type: "doctors", visible: true },
  { type: "bento", visible: true },
  { type: "reviews", visible: true },
  { type: "publications", visible: true },
  { type: "gallery", visible: true },
  { type: "faq", visible: false },
  { type: "contacts", visible: true },
  { type: "cta", visible: true },
  { type: "footer", visible: true },
];

const BLOCK_LABELS = {
  topbar: "Верхняя панель",
  nav: "Меню",
  hero: "Обложка",
  stats: "Цифры",
  whyUs: "О клинике",
  doctors: "Врачи",
  bento: "Отделения",
  reviews: "Отзывы",
  publications: "Статьи наших врачей",
  gallery: "Галерея",
  faq: "Вопросы",
  contacts: "Контакты",
  cta: "Призыв к записи",
  footer: "Подвал",
};

// SAMPLE-наполнение превью (как в ThemeSwitcher) + конфиги блоков.
const SAMPLE_CONFIG = {
  hero: { slogan: "Здоровье начинается здесь" },
  stats: {
    items: [
      { value: "15+", label: "лет на рынке", icon: "📅" },
      { value: "5000+", label: "пациентов", icon: "🩺" },
    ],
  },
  whyUs: {
    advantages: [
      { icon: "⚡", title: "Быстро", text: "Приём в день обращения" },
      { icon: "🛡️", title: "Надёжно", text: "Сертифицированные врачи" },
    ],
  },
  bento: {
    tiles: [
      { title: "ЛОР", icon: "👂", span: "2x1" },
      { title: "Хирургия", icon: "🔪" },
      { title: "Кардиология", icon: "❤️", accent: true },
    ],
  },
  faq: { items: [{ q: "Есть ли парковка?", a: "Да, бесплатная." }] },
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
    text: "Отличная клиника!",
    createdAt: "2025-02-01",
  },
];
const SAMPLE_PUBS = [
  {
    id: "p1",
    title: "Здоровье ЛОР-органов",
    abstract: "Краткая аннотация статьи.",
    authorName: "Иванов И.",
    readTime: 5,
    url: "#",
  },
];

// Чистая перестановка элемента массива from→to (для DnD).
export function moveBlock(arr, from, to) {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= arr.length ||
    to >= arr.length
  ) {
    return arr;
  }
  const next = arr.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

// Сигнатура для dirty: тип + видимость + config (правки конфига тоже = изменения).
function blocksSig(bs) {
  return JSON.stringify(bs.map((b) => [b.type, b.visible, b.config || {}]));
}

function normalizeBlocks(raw) {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((b, i) => ({
        key: b.id || b._id || `${b.type}-${i}`,
        type: b.type,
        visible: b.visible !== false,
        config: b.config || {},
      }));
  }
  return DEFAULT_BLOCKS.map((b, i) => ({
    key: `${b.type}-${i}`,
    type: b.type,
    visible: b.visible,
    config: {},
  }));
}

const CSS = `
.vt-le { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
@media (max-width: 900px) { .vt-le { grid-template-columns: 1fr; } }

.vt-le-list { display: flex; flex-direction: column; gap: 6px; }
.vt-le-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #fff; border: 1px solid #d6d0c6; border-radius: 10px; cursor: grab; }
.vt-le-row.hidden { opacity: .5; }
.vt-le-row.dragging { opacity: .4; border-style: dashed; }
.vt-le-row.over { border-color: #0f766e; box-shadow: 0 0 0 2px rgba(15,118,110,.15); }
.vt-le-row.expanded { border-color: #0f766e; }
.vt-le-grip { color: #b8b2a6; font-size: 14px; line-height: 1; letter-spacing: -2px; user-select: none; }
.vt-le-label { font-size: 14px; font-weight: 600; color: #1c1917; flex: 1; }
.vt-le-type { font-family: monospace; font-size: 10px; color: #8a8a7a; }
.vt-le-eye { border: none; background: transparent; cursor: pointer; font-size: 16px; padding: 2px 6px; border-radius: 6px; }
.vt-le-eye:hover { background: #f3efe8; }
.vt-le-eye:disabled { opacity: .4; cursor: default; }
.vt-le-gear.active { background: #d7f0ec; }

.vt-le-config { border: 1px solid #e7e2d8; border-left: 3px solid #0f766e; border-radius: 0 10px 10px 0; padding: 0 14px 10px; margin: -2px 0 6px 10px; background: #fbfaf7; }

.vt-le-save-row { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
.vt-le-save { background: #0f766e; color: #fff; border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 700; cursor: pointer; }
.vt-le-save:disabled { opacity: .5; cursor: default; }
.vt-le-saved { font-size: 13px; color: #1a6b3c; }
.vt-le-hint { font-size: 12px; color: #8a8a7a; margin: 0 0 10px; }

.vt-le-preview { border: 1px solid #d6d0c6; border-radius: 14px; overflow: hidden; height: 600px; background: #fff; }
.vt-le-preview-scroll { height: 100%; overflow: auto; }
.vt-le-preview-label { font-size: 11px; color: #8a8a7a; margin: 0 0 8px; font-family: monospace; }
`;

export function LayoutEditorView({ presets, clinic, canWrite, onSave }) {
  const { t } = useTranslation("clinic");

  const initial = useMemo(
    () => normalizeBlocks(clinic?.layout?.blocks),
    [clinic],
  );
  const initialRef = useRef(blocksSig(initial));

  const [blocks, setBlocks] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [overIdx, setOverIdx] = useState(-1);
  const [expandedKey, setExpandedKey] = useState(null);
  const dragIdx = useRef(-1);

  const markChanged = () => setSaved(false);

  const toggleVisible = (i) => {
    setBlocks((prev) =>
      prev.map((b, idx) => (idx === i ? { ...b, visible: !b.visible } : b)),
    );
    markChanged();
  };

  const updateConfig = (i, cfg) => {
    setBlocks((prev) =>
      prev.map((b, idx) => (idx === i ? { ...b, config: cfg } : b)),
    );
    markChanged();
  };

  const toggleExpand = (key) => setExpandedKey((k) => (k === key ? null : key));

  const onDrop = (to) => {
    const from = dragIdx.current;
    dragIdx.current = -1;
    setOverIdx(-1);
    if (from < 0) return;
    setBlocks((prev) => moveBlock(prev, from, to));
    markChanged();
  };

  const dirty = blocksSig(blocks) !== initialRef.current;

  // тема клиники резолвится локально для точного превью
  const resolvedTheme = resolveThemeClient(clinic?.theme, presets);

  const previewClinic = useMemo(() => {
    const visibleBlocks = blocks
      .filter((b) => b.visible)
      .map((b, i) => ({
        id: b.key,
        type: b.type,
        order: i,
        config: { ...(SAMPLE_CONFIG[b.type] || {}), ...b.config },
      }));
    return {
      name: clinic?.name || "Ваша клиника",
      logo: clinic?.logo || null,
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
      theme: resolvedTheme,
      layout: { blocks: visibleBlocks },
    };
  }, [blocks, clinic, resolvedTheme]);

  const handleSave = async () => {
    if (!canWrite || saving || !dirty) return;
    setSaving(true);
    try {
      const out = blocks.map((b, i) => ({
        type: b.type,
        visible: b.visible,
        order: i,
        config: b.config || {},
      }));
      await onSave(out);
      initialRef.current = blocksSig(blocks);
      setSaved(true);
    } catch {
      /* ошибку показывает родитель */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vt-le">
      <style>{CSS + CONFIG_CSS}</style>

      <div>
        <p className="vt-le-hint">
          {t("publicPage.layoutHint", {
            defaultValue:
              "Перетаскивайте блоки, чтобы менять порядок. ⚙ — содержимое, глаз — показать/скрыть.",
          })}
        </p>

        <div className="vt-le-list">
          {blocks.map((b, i) => {
            const editable = hasConfigForm(b.type);
            const isOpen = expandedKey === b.key;
            return (
              <React.Fragment key={b.key}>
                <div
                  className={
                    "vt-le-row" +
                    (b.visible ? "" : " hidden") +
                    (overIdx === i ? " over" : "") +
                    (isOpen ? " expanded" : "")
                  }
                  draggable={canWrite}
                  onDragStart={() => {
                    dragIdx.current = i;
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (overIdx !== i) setOverIdx(i);
                  }}
                  onDragLeave={() => {
                    if (overIdx === i) setOverIdx(-1);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    onDrop(i);
                  }}
                >
                  <span className="vt-le-grip" aria-hidden>
                    ⠿
                  </span>
                  <span className="vt-le-label">
                    {t(`publicPage.block_${b.type}`, {
                      defaultValue: BLOCK_LABELS[b.type] || b.type,
                    })}
                  </span>
                  <span className="vt-le-type">{b.type}</span>
                  {editable && (
                    <button
                      type="button"
                      className={
                        "vt-le-eye vt-le-gear" + (isOpen ? " active" : "")
                      }
                      disabled={!canWrite}
                      onClick={() => toggleExpand(b.key)}
                      title={t("publicPage.blockConfig", {
                        defaultValue: "Настроить",
                      })}
                    >
                      ⚙
                    </button>
                  )}
                  <button
                    type="button"
                    className="vt-le-eye"
                    disabled={!canWrite}
                    onClick={() => toggleVisible(i)}
                    title={
                      b.visible
                        ? t("publicPage.blockHide", { defaultValue: "Скрыть" })
                        : t("publicPage.blockShow", {
                            defaultValue: "Показать",
                          })
                    }
                  >
                    {b.visible ? "👁" : "🚫"}
                  </button>
                </div>

                {isOpen && editable && (
                  <div className="vt-le-config">
                    {React.createElement(getConfigForm(b.type), {
                      config: b.config || {},
                      onChange: (cfg) => updateConfig(i, cfg),
                      clinic,
                      blockType: b.type,
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="vt-le-save-row">
          <button
            type="button"
            className="vt-le-save"
            disabled={!canWrite || saving || !dirty}
            onClick={handleSave}
          >
            {saving
              ? t("common.saving", { defaultValue: "Сохранение…" })
              : t("common.save", { defaultValue: "Сохранить" })}
          </button>
          {saved && (
            <span className="vt-le-saved">
              {t("publicPage.saved", { defaultValue: "Сохранено" })}
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="vt-le-preview-label">
          {t("publicPage.themePreview", { defaultValue: "Предпросмотр" })}
        </p>
        <div className="vt-le-preview">
          <div className="vt-le-preview-scroll">
            <VitrinaRenderer clinic={previewClinic} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LayoutEditor({ clinic, canWrite, onSave }) {
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
          defaultValue: "Не удалось загрузить.",
        })}
      </div>
    );
  }

  return (
    <LayoutEditorView
      presets={presets}
      clinic={clinic}
      canWrite={canWrite}
      onSave={onSave}
    />
  );
}
