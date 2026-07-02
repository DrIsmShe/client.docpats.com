// client/src/pages/clinic/vitrina/layout/configForms.jsx
//
// ВИТРИНА 2.0 (V3.3) — формы редактирования config по типам блоков.
// Реестр type → форма. Форма: ({ config, onChange }) — onChange(nextConfig)
// заменяет config блока целиком. Блоки на реальных данных (doctors/reviews/
// publications/gallery/contacts/nav) форм не имеют.
//
// Списочные конфиги (stats.items, whyUs.advantages, bento.tiles, faq.items)
// редактируются через ListEditor. Простые (slogan/title/subtitle/hours/note) —
// текстовые поля.

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { listDepartments, uploadClinicAsset } from "../../../../api/clinic";
import { SECTION_BY_TYPE } from "../lib/utils.js";
import {
  LabeledInput,
  LabeledTextarea,
  LabeledSelect,
  LabeledCheckbox,
  ListEditor,
  IconPicker,
  BgPicker,
} from "./configFields.jsx";

// Общее поле «Фон блока» — единообразно во всех формах. Пишет config.bg/bgColor.
function BgField({ config, onChange, t }) {
  return (
    <BgPicker
      label={t("publicPage.cfgBlockBg", { defaultValue: "Фон блока" })}
      bg={config.bg}
      bgColor={config.bgColor}
      onChange={({ bg, bgColor }) => onChange({ ...config, bg, bgColor })}
    />
  );
}

// Доп. блоки, которые можно показать на странице раздела снизу.
const PAGE_EXTRA_OPTIONS = [
  { type: "cta", label: "Призыв к записи (CTA)" },
  { type: "contacts", label: "Контакты" },
  { type: "reviews", label: "Отзывы" },
  { type: "doctors", label: "Специалисты" },
  { type: "bento", label: "Отделения" },
];

// Разделы витрины для дропдауна ссылок (slug → метка). Сюда юзер НЕ вписывает
// произвольный текст — выбирает из готового, поэтому 404 от опечаток нет.
const SECTION_LINK_OPTIONS = [
  { value: "about", label: "О клинике" },
  { value: "departments", label: "Отделения" },
  { value: "doctors", label: "Специалисты" },
  { value: "articles", label: "Публикации" },
  { value: "gallery", label: "Галерея" },
  { value: "reviews", label: "Отзывы" },
  { value: "faq", label: "Вопросы (FAQ)" },
  { value: "contacts", label: "Контакты" },
];

/**
 * LinkPicker — выбор куда ведёт ссылка БЕЗ свободного ввода пути:
 *   "" (ничего) | раздел витрины | "__external" (поле URL).
 * Хранит готовую строку в value (slug раздела или URL).
 */
function LinkPicker({ label, value, onChange, t, customPages = [] }) {
  const v = (value || "").trim();
  const isExternal = /^(https?:)?\/\//i.test(v) || /^(tel:|mailto:|#)/i.test(v);
  const isCustomPage = /^\/?dp\/[a-z0-9-]+$/i.test(v);
  // нормализуем кастом-значение к виду "dp/slug" (для совпадения с option.value)
  const customVal = isCustomPage
    ? "dp/" + v.replace(/^\/?dp\//i, "").toLowerCase()
    : "";

  const mode = !v
    ? ""
    : isExternal
      ? "__external"
      : isCustomPage
        ? customVal
        : v;

  const pages = Array.isArray(customPages)
    ? customPages.filter((p) => p && p.slug)
    : [];

  return (
    <>
      <LabeledSelect
        label={label}
        value={mode}
        onChange={(m) => {
          if (m === "") onChange("");
          else if (m === "__external") onChange(isExternal ? v : "https://");
          else onChange(m); // slug раздела ИЛИ "dp/slug" кастомной страницы
        }}
        options={[
          {
            value: "",
            label: t("publicPage.linkNone", { defaultValue: "— не выбрано —" }),
          },
          ...SECTION_LINK_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
          })),
          ...pages.map((p) => ({
            value: `dp/${p.slug}`,
            label: `📄 ${p.title || p.slug}`,
          })),
          {
            value: "__external",
            label: t("publicPage.linkExternal", {
              defaultValue: "Внешняя ссылка / телефон",
            }),
          },
        ]}
      />
      {mode === "__external" && (
        <LabeledInput
          label={t("publicPage.linkUrl", { defaultValue: "URL или tel:" })}
          value={v === "https://" ? "" : v}
          onChange={(url) => onChange(url)}
          placeholder="https://… или tel:+994…"
        />
      )}
    </>
  );
}

/**
 * Надстройки страницы раздела (Путь 1). Видны только если блок открывается
 * отдельной страницей (/clinics/:slug/:section). Пишут в config:
 *   pageIntro {title,text}, pageOutro, pageBg/pageBgColor, pageExtras[].
 */
function PageSettingsField({ config, onChange, t, sectionType, clinic }) {
  const intro = config.pageIntro || {};
  const extras = Array.isArray(config.pageExtras) ? config.pageExtras : [];
  const [uploading, setUploading] = useState(false);

  const setIntro = (patch) =>
    onChange({ ...config, pageIntro: { ...intro, ...patch } });

  const toggleExtra = (type, on) => {
    const next = on
      ? [...extras.filter((x) => x !== type), type]
      : extras.filter((x) => x !== type);
    onChange({ ...config, pageExtras: next });
  };

  const onBannerFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const clinicId = clinic?._id || clinic?.id;
    if (!clinicId) {
      console.error("uploadClinicAsset: no clinicId");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadClinicAsset(clinicId, file);
      if (res?.url) onChange({ ...config, pageBannerUrl: res.url });
    } catch (err) {
      console.error("banner upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="vt-cf-pageblock">
      <div className="vt-cf-pagehdr">
        {t("publicPage.cfgPageTitle", {
          defaultValue: "Оформление отдельной страницы",
        })}
      </div>
      <p className="vt-cf-hint" style={{ margin: "0 0 10px" }}>
        {t("publicPage.cfgPageHint", {
          defaultValue:
            "Показывается, когда раздел открыт отдельной страницей (по клику в меню).",
        })}
      </p>

      {/* баннер */}
      <span className="vt-cf-label">
        {t("publicPage.cfgPageBanner", { defaultValue: "Баннер страницы" })}
      </span>
      {config.pageBannerUrl && (
        <div className="vt-cf-bannerprev">
          <img src={config.pageBannerUrl} alt="" />
          <button
            type="button"
            className="vt-cf-bgreset"
            onClick={() => onChange({ ...config, pageBannerUrl: "" })}
            title={t("common.remove", { defaultValue: "Убрать" })}
          >
            ✕
          </button>
        </div>
      )}
      <label className="vt-cf-uploadbtn">
        {uploading
          ? t("common.loading", { defaultValue: "Загрузка…" })
          : t("publicPage.cfgUpload", { defaultValue: "Загрузить картинку" })}
        <input
          type="file"
          accept="image/*"
          onChange={onBannerFile}
          disabled={uploading}
          hidden
        />
      </label>

      {config.pageBannerUrl && (
        <>
          <div className="vt-cf-row2">
            <LabeledSelect
              label={t("publicPage.cfgBannerH", {
                defaultValue: "Высота баннера",
              })}
              value={config.pageBannerHeight || "mid"}
              onChange={(v) => onChange({ ...config, pageBannerHeight: v })}
              options={[
                {
                  value: "low",
                  label: t("publicPage.bhLow", { defaultValue: "Низкий" }),
                },
                {
                  value: "mid",
                  label: t("publicPage.bhMid", { defaultValue: "Средний" }),
                },
                {
                  value: "high",
                  label: t("publicPage.bhHigh", { defaultValue: "Высокий" }),
                },
              ]}
            />
          </div>
          <LabeledCheckbox
            label={t("publicPage.cfgTitleOnBanner", {
              defaultValue: "Заголовок поверх баннера",
            })}
            checked={Boolean(config.pageTitleOnBanner)}
            onChange={(v) => onChange({ ...config, pageTitleOnBanner: v })}
          />
        </>
      )}

      <LabeledInput
        label={t("publicPage.cfgPageH1", {
          defaultValue: "Заголовок страницы",
        })}
        value={intro.title}
        onChange={(v) => setIntro({ title: v })}
        placeholder="Наши специалисты"
      />
      <LabeledTextarea
        label={t("publicPage.cfgPageIntro", {
          defaultValue: "Вступительный текст (над блоком)",
        })}
        value={intro.text}
        onChange={(v) => setIntro({ text: v })}
        rows={3}
      />

      <div className="vt-cf-row2">
        <LabeledSelect
          label={t("publicPage.cfgPageAlign", { defaultValue: "Выравнивание" })}
          value={config.pageAlign || "center"}
          onChange={(v) => onChange({ ...config, pageAlign: v })}
          options={[
            {
              value: "center",
              label: t("publicPage.alignCenter", { defaultValue: "По центру" }),
            },
            {
              value: "left",
              label: t("publicPage.alignLeft", { defaultValue: "Слева" }),
            },
          ]}
        />
        <LabeledSelect
          label={t("publicPage.cfgPagePad", { defaultValue: "Отступы" })}
          value={config.pagePad || "normal"}
          onChange={(v) => onChange({ ...config, pagePad: v })}
          options={[
            {
              value: "compact",
              label: t("publicPage.padCompact", { defaultValue: "Компактные" }),
            },
            {
              value: "normal",
              label: t("publicPage.padNormal", { defaultValue: "Обычные" }),
            },
            {
              value: "roomy",
              label: t("publicPage.padRoomy", { defaultValue: "Просторные" }),
            },
          ]}
        />
      </div>

      <LabeledSelect
        label={t("publicPage.cfgPageWidth", {
          defaultValue: "Ширина контента",
        })}
        value={config.pageWidth || "normal"}
        onChange={(v) => onChange({ ...config, pageWidth: v })}
        options={[
          {
            value: "narrow",
            label: t("publicPage.widthNarrow", { defaultValue: "Узкая" }),
          },
          {
            value: "normal",
            label: t("publicPage.widthNormal", { defaultValue: "Обычная" }),
          },
          {
            value: "wide",
            label: t("publicPage.widthWide", { defaultValue: "Широкая" }),
          },
        ]}
      />

      <BgPicker
        label={t("publicPage.cfgPageBg", { defaultValue: "Фон страницы" })}
        bg={config.pageBg}
        bgColor={config.pageBgColor}
        onChange={({ bg, bgColor }) =>
          onChange({ ...config, pageBg: bg, pageBgColor: bgColor })
        }
      />

      <LabeledCheckbox
        label={t("publicPage.cfgLightText", {
          defaultValue: "Светлый текст (для тёмного фона)",
        })}
        checked={Boolean(config.pageLightText)}
        onChange={(v) => onChange({ ...config, pageLightText: v })}
      />

      {/* кнопки-якоря в шапке */}
      <span className="vt-cf-label" style={{ marginTop: 10 }}>
        {t("publicPage.cfgPageButtons", { defaultValue: "Кнопки в шапке" })}
      </span>
      <ListEditor
        items={config.pageButtons || []}
        onChange={(pageButtons) => onChange({ ...config, pageButtons })}
        emptyItem={{ label: "", href: "", style: "primary" }}
        addLabel={t("publicPage.cfgAddBtn", { defaultValue: "+ Кнопка" })}
        renderFields={(it, update) => (
          <>
            <LabeledInput
              label={t("publicPage.btnLabel", { defaultValue: "Текст" })}
              value={it.label}
              onChange={(v) => update({ ...it, label: v })}
              placeholder="Записаться"
            />
            <LinkPicker
              label={t("publicPage.btnHref", { defaultValue: "Куда ведёт" })}
              value={it.href}
              onChange={(v) => update({ ...it, href: v })}
              t={t}
              customPages={clinic?.customPages}
            />
            <LabeledSelect
              label={t("publicPage.btnStyle", { defaultValue: "Стиль" })}
              value={it.style || "primary"}
              onChange={(v) => update({ ...it, style: v })}
              options={[
                {
                  value: "primary",
                  label: t("publicPage.btnPrimary", {
                    defaultValue: "Основная",
                  }),
                },
                {
                  value: "ghost",
                  label: t("publicPage.btnGhost", {
                    defaultValue: "Контурная",
                  }),
                },
              ]}
            />
          </>
        )}
      />

      <span className="vt-cf-label" style={{ marginTop: 10 }}>
        {t("publicPage.cfgPageExtras", { defaultValue: "Доп. блоки внизу" })}
      </span>
      {PAGE_EXTRA_OPTIONS.filter((o) => o.type !== sectionType).map((o) => (
        <LabeledCheckbox
          key={o.type}
          label={o.label}
          checked={extras.includes(o.type)}
          onChange={(v) => toggleExtra(o.type, v)}
        />
      ))}

      <LabeledCheckbox
        label={t("publicPage.cfgPageDividers", {
          defaultValue: "Разделители между блоками",
        })}
        checked={Boolean(config.pageDividers)}
        onChange={(v) => onChange({ ...config, pageDividers: v })}
      />

      {/* свой CTA страницы */}
      <span className="vt-cf-label" style={{ marginTop: 10 }}>
        {t("publicPage.cfgPageCta", { defaultValue: "Блок призыва (CTA)" })}
      </span>
      <LabeledInput
        label={t("publicPage.ctaTitle", { defaultValue: "Заголовок CTA" })}
        value={config.pageCta?.title}
        onChange={(v) =>
          onChange({
            ...config,
            pageCta: { ...(config.pageCta || {}), title: v },
          })
        }
        placeholder="Запишитесь на приём"
      />
      <div className="vt-cf-row2">
        <LabeledInput
          label={t("publicPage.ctaBtn", { defaultValue: "Текст кнопки" })}
          value={config.pageCta?.btnText}
          onChange={(v) =>
            onChange({
              ...config,
              pageCta: { ...(config.pageCta || {}), btnText: v },
            })
          }
          placeholder="Позвонить"
        />
        <LabeledInput
          label={t("publicPage.ctaPhone", { defaultValue: "Телефон" })}
          value={config.pageCta?.btnPhone}
          onChange={(v) =>
            onChange({
              ...config,
              pageCta: { ...(config.pageCta || {}), btnPhone: v },
            })
          }
          placeholder="+994 12 000 00 00"
        />
      </div>
      <LinkPicker
        label={t("publicPage.ctaHref", {
          defaultValue: "Или ссылка (вместо телефона)",
        })}
        value={config.pageCta?.btnHref}
        onChange={(v) =>
          onChange({
            ...config,
            pageCta: { ...(config.pageCta || {}), btnHref: v },
          })
        }
        t={t}
        customPages={clinic?.customPages}
      />

      {/* SEO */}
      <span className="vt-cf-label" style={{ marginTop: 10 }}>
        {t("publicPage.cfgSeo", { defaultValue: "SEO страницы" })}
      </span>
      <LabeledInput
        label={t("publicPage.seoTitle", {
          defaultValue: "Title (вкладка/поиск)",
        })}
        value={config.pageSeo?.title}
        onChange={(v) =>
          onChange({
            ...config,
            pageSeo: { ...(config.pageSeo || {}), title: v },
          })
        }
        placeholder="Специалисты клиники"
      />
      <LabeledTextarea
        label={t("publicPage.seoDesc", {
          defaultValue: "Описание (meta description)",
        })}
        value={config.pageSeo?.description}
        onChange={(v) =>
          onChange({
            ...config,
            pageSeo: { ...(config.pageSeo || {}), description: v },
          })
        }
        rows={2}
      />

      <LabeledTextarea
        label={t("publicPage.cfgPageOutro", {
          defaultValue: "Текст внизу страницы",
        })}
        value={config.pageOutro}
        onChange={(v) => onChange({ ...config, pageOutro: v })}
        rows={3}
      />
    </div>
  );
}

const SPAN_OPTIONS = [
  { value: "1x1", label: "1×1" },
  { value: "2x1", label: "2×1 (шире)" },
  { value: "1x2", label: "1×2 (выше)" },
  { value: "2x2", label: "2×2 (крупная)" },
];

function HeroForm({ config, onChange }) {
  const { t } = useTranslation("clinic");
  return (
    <div className="vt-cf">
      <BgField config={config} onChange={onChange} t={t} />
      <LabeledInput
        label={t("publicPage.cfgSlogan", { defaultValue: "Слоган" })}
        value={config.slogan}
        onChange={(v) => onChange({ ...config, slogan: v })}
        placeholder={t("publicPage.cfgSloganPh", {
          defaultValue: "Здоровье начинается здесь",
        })}
      />
    </div>
  );
}

function CtaForm({ config, onChange }) {
  const { t } = useTranslation("clinic");
  return (
    <div className="vt-cf">
      <BgField config={config} onChange={onChange} t={t} />
      <LabeledInput
        label={t("publicPage.cfgTitle", { defaultValue: "Заголовок" })}
        value={config.title}
        onChange={(v) => onChange({ ...config, title: v })}
        placeholder="Запишитесь на приём"
      />
      <LabeledTextarea
        label={t("publicPage.cfgSubtitle", { defaultValue: "Подзаголовок" })}
        value={config.subtitle}
        onChange={(v) => onChange({ ...config, subtitle: v })}
        placeholder="Позвоните в регистратуру — подберём удобное время"
      />
    </div>
  );
}

function TopbarForm({ config, onChange }) {
  const { t } = useTranslation("clinic");
  return (
    <div className="vt-cf">
      <BgField config={config} onChange={onChange} t={t} />
      <LabeledInput
        label={t("publicPage.cfgHours", { defaultValue: "Часы работы" })}
        value={config.hours}
        onChange={(v) => onChange({ ...config, hours: v })}
        placeholder="Пн–Пт 9:00–18:00"
      />
    </div>
  );
}

function FooterForm({ config, onChange }) {
  const { t } = useTranslation("clinic");
  return (
    <div className="vt-cf">
      <BgField config={config} onChange={onChange} t={t} />
      <LabeledTextarea
        label={t("publicPage.cfgFooterNote", {
          defaultValue: "Подпись в подвале",
        })}
        value={config.note}
        onChange={(v) => onChange({ ...config, note: v })}
        rows={2}
      />
    </div>
  );
}

function StatsForm({ config, onChange }) {
  const { t } = useTranslation("clinic");
  return (
    <div className="vt-cf">
      <BgField config={config} onChange={onChange} t={t} />
      <LabeledCheckbox
        label={t("publicPage.cfgShowDoctorsStat", {
          defaultValue: "Показывать количество врачей",
        })}
        checked={config.showDoctorsStat !== false}
        onChange={(v) => onChange({ ...config, showDoctorsStat: v })}
      />
      <ListEditor
        items={config.items || []}
        onChange={(items) => onChange({ ...config, items })}
        emptyItem={{ value: "", label: "", icon: "" }}
        addLabel={t("publicPage.cfgAddStat", { defaultValue: "+ Показатель" })}
        renderFields={(it, update) => (
          <>
            <div className="vt-cf-row2">
              <LabeledInput
                label={t("publicPage.cfgValue", { defaultValue: "Значение" })}
                value={it.value}
                onChange={(v) => update({ ...it, value: v })}
                placeholder="15+"
              />
              <LabeledInput
                label={t("publicPage.cfgLabel", { defaultValue: "Подпись" })}
                value={it.label}
                onChange={(v) => update({ ...it, label: v })}
                placeholder="лет опыта"
              />
            </div>
            <IconPicker
              label={t("publicPage.cfgIcon", { defaultValue: "Иконка" })}
              value={it.icon}
              onChange={(v) => update({ ...it, icon: v })}
            />
          </>
        )}
      />
    </div>
  );
}

function WhyUsForm({ config, onChange, clinic }) {
  const { t } = useTranslation("clinic");
  return (
    <div className="vt-cf">
      <BgField config={config} onChange={onChange} t={t} />
      <LabeledInput
        label={t("publicPage.cfgTitle", { defaultValue: "Заголовок" })}
        value={config.title}
        onChange={(v) => onChange({ ...config, title: v })}
        placeholder="О клинике"
      />
      <ListEditor
        items={config.advantages || []}
        onChange={(advantages) => onChange({ ...config, advantages })}
        emptyItem={{ icon: "", title: "", text: "" }}
        addLabel={t("publicPage.cfgAddAdvantage", {
          defaultValue: "+ Преимущество",
        })}
        renderFields={(it, update) => (
          <>
            <IconPicker
              label={t("publicPage.cfgIcon", { defaultValue: "Иконка" })}
              value={it.icon}
              onChange={(v) => update({ ...it, icon: v })}
            />
            <LabeledInput
              label={t("publicPage.cfgTitle", { defaultValue: "Заголовок" })}
              value={it.title}
              onChange={(v) => update({ ...it, title: v })}
              placeholder="Быстро"
            />
            <LabeledTextarea
              label={t("publicPage.cfgText", { defaultValue: "Текст" })}
              value={it.text}
              onChange={(v) => update({ ...it, text: v })}
              rows={2}
            />
          </>
        )}
      />
      <PageSettingsField
        config={config}
        onChange={onChange}
        t={t}
        sectionType="whyUs"
        clinic={clinic}
      />
    </div>
  );
}

function BentoForm({ config, onChange, clinic }) {
  const { t } = useTranslation("clinic");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listDepartments({ status: "active" })
      .then((res) => {
        if (alive) setDepartments(res?.items || []);
      })
      .catch(() => {
        if (alive) setDepartments([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const overrides =
    config.deptOverrides && typeof config.deptOverrides === "object"
      ? config.deptOverrides
      : {};

  const setOverride = (id, patch) => {
    const next = { ...overrides, [id]: { ...(overrides[id] || {}), ...patch } };
    onChange({ ...config, deptOverrides: next });
  };

  return (
    <div className="vt-cf">
      <BgField config={config} onChange={onChange} t={t} />
      <LabeledInput
        label={t("publicPage.cfgTitle", { defaultValue: "Заголовок" })}
        value={config.title}
        onChange={(v) => onChange({ ...config, title: v })}
        placeholder="Отделения и услуги"
      />

      <p className="vt-cf-hint" style={{ margin: "4px 0 8px" }}>
        {t("publicPage.cfgDeptHint", {
          defaultValue:
            "Отделения берутся из админпанели. Здесь можно дополнить каждую карточку: доп. текст, иконка, акцент, размер.",
        })}
      </p>

      {loading && (
        <p className="vt-cf-hint">
          {t("common.loading", { defaultValue: "Загрузка…" })}
        </p>
      )}

      {!loading && departments.length === 0 && (
        <p className="vt-cf-hint">
          {t("publicPage.cfgNoDepts", {
            defaultValue:
              "Нет отделений. Добавьте их в админпанели (Отделения).",
          })}
        </p>
      )}

      {departments.map((d) => {
        const key = String(d.id || d._id || d.code || d.name || "");
        const ov = overrides[key] || {};
        return (
          <div key={key} className="vt-cf-deptcard">
            <div className="vt-cf-deptname">{d.name}</div>
            <IconPicker
              label={t("publicPage.cfgIcon", { defaultValue: "Иконка" })}
              value={ov.icon}
              onChange={(v) => setOverride(key, { icon: v })}
            />
            <LabeledTextarea
              label={t("publicPage.cfgDeptNote", {
                defaultValue: "Доп. текст",
              })}
              value={ov.note}
              onChange={(v) => setOverride(key, { note: v })}
              rows={2}
            />
            <div className="vt-cf-row2">
              <LabeledSelect
                label={t("publicPage.cfgSpan", { defaultValue: "Размер" })}
                value={ov.span || "1x1"}
                onChange={(v) => setOverride(key, { span: v })}
                options={SPAN_OPTIONS}
              />
              <LabeledCheckbox
                label={t("publicPage.cfgAccent", {
                  defaultValue: "Акцент",
                })}
                checked={Boolean(ov.accent)}
                onChange={(v) => setOverride(key, { accent: v })}
              />
            </div>
          </div>
        );
      })}
      <PageSettingsField
        config={config}
        onChange={onChange}
        t={t}
        sectionType="bento"
        clinic={clinic}
      />
    </div>
  );
}

function FaqForm({ config, onChange, clinic }) {
  const { t } = useTranslation("clinic");
  return (
    <div className="vt-cf">
      <BgField config={config} onChange={onChange} t={t} />
      <LabeledInput
        label={t("publicPage.cfgTitle", { defaultValue: "Заголовок" })}
        value={config.title}
        onChange={(v) => onChange({ ...config, title: v })}
        placeholder="Вопросы и ответы"
      />
      <ListEditor
        items={config.items || []}
        onChange={(items) => onChange({ ...config, items })}
        emptyItem={{ q: "", a: "" }}
        addLabel={t("publicPage.cfgAddFaq", { defaultValue: "+ Вопрос" })}
        renderFields={(it, update) => (
          <>
            <LabeledInput
              label={t("publicPage.cfgQuestion", { defaultValue: "Вопрос" })}
              value={it.q}
              onChange={(v) => update({ ...it, q: v })}
            />
            <LabeledTextarea
              label={t("publicPage.cfgAnswer", { defaultValue: "Ответ" })}
              value={it.a}
              onChange={(v) => update({ ...it, a: v })}
              rows={2}
            />
          </>
        )}
      />
      <PageSettingsField
        config={config}
        onChange={onChange}
        t={t}
        sectionType="faq"
        clinic={clinic}
      />
    </div>
  );
}

// Блоки без собственных настроек, кроме фона (doctors/reviews/gallery/…).
function BgOnlyForm({ config, onChange, blockType, clinic }) {
  const { t } = useTranslation("clinic");
  const hasPage = Boolean(SECTION_BY_TYPE[blockType]);
  return (
    <div className="vt-cf">
      <BgField config={config} onChange={onChange} t={t} />
      {hasPage && (
        <PageSettingsField
          config={config}
          onChange={onChange}
          t={t}
          sectionType={blockType}
          clinic={clinic}
        />
      )}
    </div>
  );
}

// Меню (nav): фон + свои пункты меню (добавляются к авто-пунктам из блоков).
function NavForm({ config, onChange, clinic }) {
  const { t } = useTranslation("clinic");

  // авто-пункты меню (разделы сайта) — те же типы, что в NavBlock NAV_DEFS.
  // показываем переключатель только для блоков, реально присутствующих в layout.
  const NAV_ITEMS = [
    { type: "whyUs", def: "О нас" },
    { type: "bento", def: "Отделения" },
    { type: "priceList", def: "Услуги и цены" },
    { type: "doctors", def: "Врачи" },
    { type: "publications", def: "Статьи наших врачей" },
    { type: "gallery", def: "Галерея" },
    { type: "reviews", def: "Отзывы" },
    { type: "faq", def: "Вопросы" },
    { type: "contacts", def: "Контакты" },
  ];
  const present = new Set(
    (clinic?.layout?.blocks || []).map((b) => b.type).filter(Boolean),
  );
  const hasServices =
    Array.isArray(clinic?.services) && clinic.services.length > 0;

  const availableItems = NAV_ITEMS.filter((n) =>
    n.type === "priceList" ? hasServices : present.has(n.type),
  );

  const hidden = Array.isArray(config.hiddenNavItems)
    ? config.hiddenNavItems
    : [];

  const navOrder = Array.isArray(config.navOrder) ? config.navOrder : [];
  const rank = new Map(navOrder.map((type, i) => [type, i]));
  const orderedItems = availableItems.slice().sort((a, b) => {
    const ra = rank.has(a.type) ? rank.get(a.type) : Infinity;
    const rb = rank.has(b.type) ? rank.get(b.type) : Infinity;
    return ra - rb;
  });

  const toggleItem = (type) => {
    const next = hidden.includes(type)
      ? hidden.filter((x) => x !== type)
      : [...hidden, type];
    onChange({ ...config, hiddenNavItems: next });
  };

  const moveItem = (type, dir) => {
    const cur = orderedItems.map((n) => n.type);
    const i = cur.indexOf(type);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cur.length) return;
    [cur[i], cur[j]] = [cur[j], cur[i]];
    onChange({ ...config, navOrder: cur });
  };

  return (
    <div className="vt-cf">
      <BgField config={config} onChange={onChange} t={t} />

      {orderedItems.length > 0 && (
        <>
          <span className="vt-cf-label" style={{ marginTop: 10 }}>
            {t("publicPage.cfgNavVisible", {
              defaultValue: "Пункты меню (разделы сайта)",
            })}
          </span>
          <p className="vt-cf-hint" style={{ margin: "0 0 8px" }}>
            {t("publicPage.cfgNavReorderHint", {
              defaultValue:
                "Стрелками меняйте порядок, галочкой — показать/скрыть.",
            })}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {orderedItems.map((n, idx) => (
              <div
                key={n.type}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  border: "1px solid #e7e2d8",
                  borderRadius: 8,
                  background: "#fff",
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!hidden.includes(n.type)}
                    onChange={() => toggleItem(n.type)}
                  />
                  {t(`publicClinic.nav_${n.type}`, { defaultValue: n.def })}
                </label>
                <button
                  type="button"
                  className="vt-cf-iconbtn"
                  onClick={() => moveItem(n.type, -1)}
                  disabled={idx === 0}
                  title={t("common.moveUp", { defaultValue: "Вверх" })}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="vt-cf-iconbtn"
                  onClick={() => moveItem(n.type, 1)}
                  disabled={idx === orderedItems.length - 1}
                  title={t("common.moveDown", { defaultValue: "Вниз" })}
                >
                  ↓
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <span className="vt-cf-label" style={{ marginTop: 10 }}>
        {t("publicPage.cfgNavItems", { defaultValue: "Свои пункты меню" })}
      </span>
      <p className="vt-cf-hint" style={{ margin: "0 0 8px" }}>
        {t("publicPage.cfgNavHint", {
          defaultValue:
            "Добавляются после автоматических пунктов (разделов сайта).",
        })}
      </p>
      <ListEditor
        items={config.customItems || []}
        onChange={(customItems) => onChange({ ...config, customItems })}
        emptyItem={{ label: "", href: "" }}
        addLabel={t("publicPage.cfgAddNavItem", {
          defaultValue: "+ Пункт меню",
        })}
        renderFields={(it, update) => (
          <>
            <LabeledInput
              label={t("publicPage.btnLabel", { defaultValue: "Текст" })}
              value={it.label}
              onChange={(v) => update({ ...it, label: v })}
              placeholder="Акции"
            />
            <LinkPicker
              label={t("publicPage.btnHref", { defaultValue: "Куда ведёт" })}
              value={it.href}
              onChange={(v) => update({ ...it, href: v })}
              t={t}
              customPages={clinic?.customPages}
            />
          </>
        )}
      />
    </div>
  );
}

// Статьи категории: заголовок секции + фон.
function CategoryArticlesForm({ config, onChange }) {
  const { t } = useTranslation("clinic");
  return (
    <div className="vt-cf">
      <BgField config={config} onChange={onChange} t={t} />
      <LabeledInput
        label={t("publicPage.cfgArticlesTitle", {
          defaultValue: "Заголовок секции",
        })}
        value={config.title}
        onChange={(v) => onChange({ ...config, title: v })}
        placeholder="Статьи"
      />
    </div>
  );
}

// Галерея категории: заголовок секции + фон.
function CategoryGalleryForm({ config, onChange }) {
  const { t } = useTranslation("clinic");
  return (
    <div className="vt-cf">
      <BgField config={config} onChange={onChange} t={t} />
      <LabeledInput
        label={t("publicPage.cfgGalleryTitle", {
          defaultValue: "Заголовок секции",
        })}
        value={config.title}
        onChange={(v) => onChange({ ...config, title: v })}
        placeholder="Галерея"
      />
    </div>
  );
}

export const CONFIG_FORMS = {
  hero: HeroForm,
  stats: StatsForm,
  whyUs: WhyUsForm,
  bento: BentoForm,
  faq: FaqForm,
  cta: CtaForm,
  topbar: TopbarForm,
  footer: FooterForm,
  nav: NavForm,
  doctors: BgOnlyForm,
  reviews: BgOnlyForm,
  gallery: BgOnlyForm,
  publications: BgOnlyForm,
  contacts: BgOnlyForm,
  categoryArticles: CategoryArticlesForm,
  categoryGallery: CategoryGalleryForm,
  parentCategoryArticles: CategoryArticlesForm,
};

export function getConfigForm(type) {
  return CONFIG_FORMS[type] || null;
}

export function hasConfigForm(type) {
  return Object.prototype.hasOwnProperty.call(CONFIG_FORMS, type);
}
