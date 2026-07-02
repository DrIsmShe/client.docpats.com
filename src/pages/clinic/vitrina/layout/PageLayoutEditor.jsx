// client/src/pages/clinic/vitrina/layout/PageLayoutEditor.jsx
//
// ВИТРИНА 2.0 (Часть 2, Этап 4) — редактор блоков КАСТОМНОЙ страницы.
//
// Отличие от LayoutEditor (витрина): тот работает с фиксированным набором
// блоков витрины (reorder/visible/config). Здесь страница собирается С НУЛЯ →
// нужны ДОБАВЛЕНИЕ и УДАЛЕНИЕ блоков из палитры.
//
// Chrome (topbar/nav/footer) на кастомную страницу не добавляется — он берётся
// от витрины клиники при рендере (CustomPageRenderer). Поэтому в палитре только
// контентные блоки.
//
// Props: clinic, page {layout:{blocks}}, canWrite, onSave(blocks).

import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import CustomPageRenderer from "../CustomPageRenderer.jsx";
import { resolveThemeClient } from "../theme/resolveThemeClient.js";
import { useThemePresets } from "../theme/useThemePresets.js";
import { CONFIG_CSS } from "./configFields.jsx";
import { getConfigForm, hasConfigForm } from "./configForms.jsx";

// Контентные блоки, которые можно добавить на кастомную страницу.
// БЕЗ topbar/nav/footer — они приходят от витрины клиники.
const ADDABLE_BLOCKS = [
  "hero",
  "stats",
  "whyUs",
  "doctors",
  "bento",
  "reviews",
  "publications",
  "gallery",
  "faq",
  "contacts",
  "cta",
  "categoryArticles",
  "categoryGallery",
  "parentCategoryArticles",
];

const BLOCK_LABELS = {
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
  categoryArticles: "Статьи категории",
  categoryGallery: "Галерея категории",
  parentCategoryArticles: "Статьи подкатегорий (родитель)",
};

// SAMPLE-наполнение превью (как в LayoutEditor витрины).
const SAMPLE_DOCTORS = [
  {
    userId: "s1",
    name: "Иван Петров",
    specialization: "Кардиолог",
    experienceYears: 12,
    profileUrl: "#",
  },
  {
    userId: "s2",
    name: "Мария Алиева",
    specialization: "Невролог",
    experienceYears: 8,
    profileUrl: "#",
  },
];
const SAMPLE_REVIEWS = [
  { id: "r1", author: "Гость", rating: 5, text: "Отличная клиника." },
];
const SAMPLE_PUBS = [];
const SAMPLE_CONFIG = {
  hero: { slogan: "Здоровье начинается здесь" },
  cta: { title: "Запишитесь на приём" },
};

let _seq = 0;
const nextKey = (type) => `${type}-${Date.now()}-${_seq++}`;

function normalizePageBlocks(raw) {
  if (!Array.isArray(raw)) return [];
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

function blocksSig(blocks) {
  return JSON.stringify(blocks.map((b) => [b.type, b.visible, b.config]));
}

const CSS = `
.vt-ple { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.1fr); gap: 24px; align-items: start; }
@media (max-width: 1024px) { .vt-ple { grid-template-columns: 1fr; } }
.vt-ple-hint { font-size: 13px; color: #78716c; margin: 0 0 12px; }
.vt-ple-palette { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.vt-ple-add { font-size: 12px; font-weight: 600; color: #0f766e; background: #e7f3f1; border: 1px solid #b9ddd6; border-radius: 100px; padding: 6px 12px; cursor: pointer; transition: background .12s; }
.vt-ple-add:hover { background: #d6ebe7; }
.vt-ple-add:disabled { opacity: .5; cursor: default; }
.vt-ple-list { display: flex; flex-direction: column; gap: 6px; }
.vt-ple-row { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e7e2d8; border-radius: 10px; padding: 10px 12px; }
.vt-ple-row.over { border-color: #0f766e; }
.vt-ple-row.hidden { opacity: .5; }
.vt-ple-row.expanded { border-color: #0f766e; }
.vt-ple-grip { cursor: grab; color: #a8a29e; }
.vt-ple-label { flex: 1; font-size: 14px; font-weight: 600; color: #292524; }
.vt-ple-type { font-size: 11px; color: #a8a29e; font-family: monospace; }
.vt-ple-btn { border: none; background: transparent; cursor: pointer; font-size: 15px; padding: 2px 6px; border-radius: 6px; }
.vt-ple-btn:hover { background: #f5f3ef; }
.vt-ple-btn.active { background: #e7f3f1; }
.vt-ple-config { background: #faf8f4; border: 1px solid #e7e2d8; border-top: none; border-radius: 0 0 10px 10px; padding: 14px; margin-top: -6px; }
.vt-ple-save-row { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
.vt-ple-save { background: #0f766e; color: #fff; border: none; border-radius: 100px; padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer; }
.vt-ple-save:disabled { opacity: .5; cursor: default; }
.vt-ple-saved { color: #1a6b3c; font-size: 13px; }
.vt-ple-preview-label { font-size: 12px; color: #78716c; margin: 0 0 8px; }
.vt-ple-preview { border: 1px solid #e7e2d8; border-radius: 12px; overflow: hidden; max-height: 70vh; }
.vt-ple-preview-scroll { max-height: 70vh; overflow-y: auto; }
.vt-ple-empty { padding: 24px; text-align: center; color: #a8a29e; font-size: 13px; border: 1px dashed #d6d0c4; border-radius: 10px; }
`;

function PageLayoutEditorView({ presets, clinic, page, canWrite, onSave }) {
  const { t } = useTranslation("clinic");

  const initial = useMemo(
    () => normalizePageBlocks(page?.layout?.blocks),
    [page],
  );
  const initialRef = useRef(blocksSig(initial));

  const [blocks, setBlocks] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [overIdx, setOverIdx] = useState(-1);
  const [expandedKey, setExpandedKey] = useState(null);
  const dragIdx = useRef(-1);

  const markChanged = () => setSaved(false);

  const addBlock = (type) => {
    setBlocks((prev) => [
      ...prev,
      { key: nextKey(type), type, visible: true, config: {} },
    ]);
    markChanged();
  };

  const removeBlock = (i) => {
    setBlocks((prev) => prev.filter((_, idx) => idx !== i));
    markChanged();
  };

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
    if (from < 0 || from === to) return;
    setBlocks((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    markChanged();
  };

  const dirty = blocksSig(blocks) !== initialRef.current;

  const resolvedTheme = resolveThemeClient(clinic?.theme, presets);

  // превью: клиника с темой + chrome, страница с текущими блоками
  const previewClinic = useMemo(
    () => ({
      name: clinic?.name || "Ваша клиника",
      logo: clinic?.logo || null,
      isVerified: clinic?.isVerified ?? true,
      description: clinic?.description || "",
      specializations: clinic?.specializations || [],
      contacts: clinic?.contacts || { phone: "+994 12 000 00 00" },
      address: clinic?.address || { city: "Баку" },
      doctors: SAMPLE_DOCTORS,
      reviews: SAMPLE_REVIEWS,
      rating: { avg: 4.8, count: 12 },
      publications: SAMPLE_PUBS,
      gallery: [],
      theme: resolvedTheme,
      // chrome витрины для превью
      layout: {
        blocks: [
          { type: "nav", order: 0, config: {} },
          { type: "footer", order: 99, config: {} },
        ],
      },
    }),
    [clinic, resolvedTheme],
  );

  const previewPage = useMemo(
    () => ({
      slug: page?.slug || "preview",
      title: page?.title || "Страница",
      seo: page?.seo || {},
      layout: {
        blocks: blocks
          .filter((b) => b.visible)
          .map((b, i) => ({
            id: b.key,
            type: b.type,
            order: i,
            config: { ...(SAMPLE_CONFIG[b.type] || {}), ...b.config },
          })),
      },
    }),
    [blocks, page],
  );

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
    <div className="vt-ple">
      <style>{CSS + CONFIG_CSS}</style>

      <div>
        <p className="vt-ple-hint">
          {t("publicPage.pageEditorHint", {
            defaultValue:
              "Добавляйте блоки из палитры, перетаскивайте для порядка. Меню и подвал берутся от витрины автоматически.",
          })}
        </p>

        {/* палитра добавления */}
        <div className="vt-ple-palette">
          {ADDABLE_BLOCKS.map((type) => (
            <button
              key={type}
              type="button"
              className="vt-ple-add"
              disabled={!canWrite}
              onClick={() => addBlock(type)}
            >
              +{" "}
              {t(`publicPage.block_${type}`, {
                defaultValue: BLOCK_LABELS[type] || type,
              })}
            </button>
          ))}
        </div>

        {/* список блоков страницы */}
        {blocks.length === 0 ? (
          <div className="vt-ple-empty">
            {t("publicPage.pageEmptyBlocks", {
              defaultValue: "Пока нет блоков — добавьте из палитры выше.",
            })}
          </div>
        ) : (
          <div className="vt-ple-list">
            {blocks.map((b, i) => {
              const editable = hasConfigForm(b.type);
              const isOpen = expandedKey === b.key;
              return (
                <React.Fragment key={b.key}>
                  <div
                    className={
                      "vt-ple-row" +
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
                    <span className="vt-ple-grip" aria-hidden>
                      ⠿
                    </span>
                    <span className="vt-ple-label">
                      {t(`publicPage.block_${b.type}`, {
                        defaultValue: BLOCK_LABELS[b.type] || b.type,
                      })}
                    </span>
                    <span className="vt-ple-type">{b.type}</span>
                    {editable && (
                      <button
                        type="button"
                        className={"vt-ple-btn" + (isOpen ? " active" : "")}
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
                      className="vt-ple-btn"
                      disabled={!canWrite}
                      onClick={() => toggleVisible(i)}
                      title={
                        b.visible
                          ? t("publicPage.blockHide", {
                              defaultValue: "Скрыть",
                            })
                          : t("publicPage.blockShow", {
                              defaultValue: "Показать",
                            })
                      }
                    >
                      {b.visible ? "👁" : "🚫"}
                    </button>
                    <button
                      type="button"
                      className="vt-ple-btn"
                      disabled={!canWrite}
                      onClick={() => removeBlock(i)}
                      title={t("common.remove", { defaultValue: "Удалить" })}
                    >
                      🗑
                    </button>
                  </div>

                  {isOpen && editable && (
                    <div className="vt-ple-config">
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
        )}

        <div className="vt-ple-save-row">
          <button
            type="button"
            className="vt-ple-save"
            disabled={!canWrite || saving || !dirty}
            onClick={handleSave}
          >
            {saving
              ? t("common.saving", { defaultValue: "Сохранение…" })
              : t("common.save", { defaultValue: "Сохранить" })}
          </button>
          {saved && (
            <span className="vt-ple-saved">
              {t("publicPage.saved", { defaultValue: "Сохранено" })}
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="vt-ple-preview-label">
          {t("publicPage.themePreview", { defaultValue: "Предпросмотр" })}
        </p>
        <div className="vt-ple-preview">
          <div className="vt-ple-preview-scroll">
            <CustomPageRenderer clinic={previewClinic} page={previewPage} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PageLayoutEditor({ clinic, page, canWrite, onSave }) {
  const { t } = useTranslation("clinic");
  const { presets, loading, error } = useThemePresets();

  if (loading) {
    return (
      <p style={{ color: "#78716c", fontSize: 14 }}>
        {t("common.loading", { defaultValue: "Загрузка…" })}
      </p>
    );
  }
  if (error) {
    return (
      <p style={{ color: "#c0392b", fontSize: 14 }}>
        {t("common.loadError", { defaultValue: "Ошибка загрузки." })}
      </p>
    );
  }

  return (
    <PageLayoutEditorView
      presets={presets}
      clinic={clinic}
      page={page}
      canWrite={canWrite}
      onSave={onSave}
    />
  );
}
