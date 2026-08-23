// client/src/pages/clinic/ClinicPublicPageSettings/ClinicPublicPageSettings.jsx
//
// Clinic-as-Brand (этапы A+B+C) — раздел «Публичная страница» / витрина.
//
// DUAL-MODE:
//   • OWNER-зона (/clinic/public-page): источник данных — getClinicMe();
//     canWrite = owner/admin/clinic.write. Виден блок удаления клиники,
//     ссылки ведут в owner-зону (/clinic/pages, /clinic/dashboard).
//   • EMPLOYEE-зона (/clinic/employee/vitrina, роль marketer): источник данных
//     — useOutletContext().clinic (толстый DTO из employeeAuth); canWrite =
//     can("site_builder","write"). Блок удаления скрыт, ссылки ведут в
//     employee-зону. Модерация отзывов гейтится отдельным правом review.write.
//
// Режим определяется по ctx.kind === "employee". Backend-гейт витринных
// сохранений — site_builder.write ИЛИ clinic.write (clinic.controller.js
// SITE_BUILDER_FIELDS + clinicMedia.controller assertCanEdit).
//
// Отзывы используют namespace "clinicReviews" (хук tr).

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useOutletContext, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeSwitcher from "../vitrina/theme/ThemeSwitcher.jsx";
import LayoutEditor from "../vitrina/layout/LayoutEditor.jsx";
import ClinicContentForm from "../vitrina/settings/ClinicContentForm.jsx";
import DeleteClinicSection from "./DeleteClinicSection";
import { useClinicPermissions } from "../../../lib/can";
import {
  getClinicMe,
  updateClinic,
  setClinicPublished,
  uploadClinicLogo,
  deleteClinicLogo,
  uploadClinicGallery,
  deleteClinicGalleryItem,
  listClinicReviews,
  moderateClinicReview,
  listCustomPages,
} from "../../../api/clinic";
import "./clinicPublicPageSettings.css";

// Языки витрины. Совпадает с локалями интерфейса и enum на сервере.
const CLINIC_LANGS = ["ru", "en", "az", "tr", "ar"];
const LANG_LABEL = {
  ru: "Русский",
  en: "English",
  az: "Azərbaycan",
  tr: "Türkçe",
  ar: "العربية",
};

const DESC_MAX = 5000;
const GALLERY_MAX = 20;

function Stars({ value }) {
  const v = Math.round(Number(value) || 0);
  return (
    <span className="cpps-rv-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= v ? "on" : ""}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ClinicPublicPageSettings() {
  const { t } = useTranslation("clinic");
  const { t: tr } = useTranslation("clinicReviews"); // namespace отзывов
  const navigate = useNavigate();

  // Режим: employee-зона (marketer) vs owner-зона.
  const ctx = useOutletContext();
  const isEmployee = ctx?.kind === "employee";
  const { can } = useClinicPermissions();

  // Mode-aware навигация.
  const pagesPath = isEmployee ? "/clinic/employee/marketing" : "/clinic/pages";
  const backPath = isEmployee ? "/clinic/employee" : "/clinic/dashboard";

  const logoInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [clinic, setClinic] = useState(null);
  const [canWrite, setCanWrite] = useState(false);

  // Модерация отзывов — отдельное право (review.write). У marketer оно есть
  // (RW), у owner/admin — тоже. Не путать с витринным site_builder.write.
  const canModerateReviews = isEmployee ? can("review", "write") : canWrite;

  // editable state
  const [description, setDescription] = useState("");
  // Переводы описания и слогана: { az: "…", en: "…" }. Язык оригинала здесь
  // НЕ хранится — он лежит в самих description/slogan, чтобы клиника, которая
  // никогда не откроет эту вкладку, продолжала работать как прежде.
  const [descI18n, setDescI18n] = useState({});
  const [sloganI18n, setSloganI18n] = useState({});
  const [origLang, setOrigLang] = useState("ru");
  const [transLang, setTransLang] = useState(null);
  const [savingTrans, setSavingTrans] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [logo, setLogo] = useState(null);
  const [gallery, setGallery] = useState([]);

  // ui state
  const [savingDesc, setSavingDesc] = useState(false);
  const [savingPub, setSavingPub] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // reviews moderation (этап C)
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewFilter, setReviewFilter] = useState("pending"); // pending|approved|rejected|all
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewBusyId, setReviewBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let c;
        let writable;

        if (isEmployee) {
          // EMPLOYEE (marketer): clinic приходит из outlet-контекста
          // (толстый DTO из employeeAuth — theme/layout/gallery/… уже внутри).
          const src = ctx?.clinic;
          if (!src) {
            setError(t("common.error", { defaultValue: "Ошибка" }));
            setLoading(false);
            return;
          }
          c = { ...src };
          // employee DTO использует _id; owner-код опирается на .id — нормализуем.
          if (!c.id && c._id) c.id = String(c._id);
          writable = can("site_builder", "write");
        } else {
          // OWNER/ADMIN: canonical source — /clinic/me.
          const me = await getClinicMe();
          if (cancelled) return;
          if (!me.hasClinic) {
            navigate("/clinic", { replace: true });
            return;
          }
          c = me.clinic || {};
          const role = me.role || "member";
          const perms = me.permissions || {};
          writable =
            role === "owner" ||
            role === "admin" ||
            perms?.clinic?.write === true;
        }

        // Кастомные страницы (оба режима, clinic-scoped: marketer read ок).
        try {
          const pagesRes = await listCustomPages();
          c.customPages = (pagesRes.items || []).map((p) => ({
            slug: p.slug,
            title: p.title,
          }));
        } catch {
          c.customPages = [];
        }

        if (cancelled) return;

        setClinic(c);
        setDescription(c.description || "");
        setDescI18n(c.descriptionI18n || {});
        setSloganI18n(c.sloganI18n || {});
        setOrigLang(c.originalLanguage || "ru");
        setIsPublished(c.isPublished === true);
        setLogo(c.logo || null);
        setGallery(Array.isArray(c.gallery) ? c.gallery : []);
        setCanWrite(writable);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("PublicPageSettings load failed:", err);
        setError(err.message || t("common.error", { defaultValue: "Ошибка" }));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployee, navigate]);

  const flashSaved = () => {
    setSavedMsg(t("publicPage.saved", { defaultValue: "Сохранено" }));
    setTimeout(() => setSavedMsg(""), 2500);
  };

  const showError = (err, fallbackKey, fallbackText) => {
    setError(
      err?.response?.data?.error ||
        t(fallbackKey, { defaultValue: fallbackText }),
    );
  };

  // ─── description ───
  const handleSaveDescription = async () => {
    if (!clinic?.id || savingDesc) return;
    setSavingDesc(true);
    setError(null);
    try {
      await updateClinic(clinic.id, { description });
      flashSaved();
    } catch (err) {
      console.error("save description failed:", err);
      showError(err, "publicPage.saveError", "Не удалось сохранить описание");
    } finally {
      setSavingDesc(false);
    }
  };
  // ─── переводы ───
  const handleSaveTranslations = async () => {
    if (!clinic?.id || savingTrans) return;
    setSavingTrans(true);
    setError(null);
    try {
      await updateClinic(clinic.id, {
        descriptionI18n: descI18n,
        sloganI18n,
        originalLanguage: origLang,
      });
      flashSaved();
    } catch (err) {
      console.error("save translations failed:", err);
      showError(err, "publicPage.saveError", "Не удалось сохранить переводы");
    } finally {
      setSavingTrans(false);
    }
  };

  const handleSaveTheme = async (theme) => {
    if (!clinic?.id) return;
    await updateClinic(clinic.id, { theme });
    setClinic((c) => ({ ...c, theme }));
    flashSaved();
  };
  const handleSaveLayout = async (blocks) => {
    if (!clinic?.id) return;
    await updateClinic(clinic.id, { layout: { blocks } });
    setClinic((c) => ({ ...c, layout: { blocks } }));
    flashSaved();
  };
  // ─── publish ───
  const handleTogglePublish = async () => {
    if (!clinic?.id || savingPub) return;
    const next = !isPublished;
    setSavingPub(true);
    setError(null);
    try {
      await setClinicPublished(clinic.id, next);
      setIsPublished(next);
      flashSaved();
    } catch (err) {
      console.error("toggle publish failed:", err);
      showError(
        err,
        "publicPage.publishError",
        "Не удалось изменить статус публикации",
      );
    } finally {
      setSavingPub(false);
    }
  };

  // ─── logo ───
  const handleLogoPick = () => {
    if (!canWrite || logoBusy) return;
    logoInputRef.current?.click();
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !clinic?.id) return;
    setLogoBusy(true);
    setError(null);
    try {
      const res = await uploadClinicLogo(clinic.id, file);
      setLogo(res.logo || null);
      flashSaved();
    } catch (err) {
      console.error("logo upload failed:", err);
      showError(err, "publicPage.logoError", "Не удалось загрузить логотип");
    } finally {
      setLogoBusy(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!clinic?.id || logoBusy) return;
    setLogoBusy(true);
    setError(null);
    try {
      await deleteClinicLogo(clinic.id);
      setLogo(null);
      flashSaved();
    } catch (err) {
      console.error("logo delete failed:", err);
      showError(err, "publicPage.logoError", "Не удалось удалить логотип");
    } finally {
      setLogoBusy(false);
    }
  };

  // ─── gallery ───
  const handleGalleryPick = () => {
    if (!canWrite || galleryBusy) return;
    galleryInputRef.current?.click();
  };

  const handleGalleryChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !clinic?.id) return;
    if (gallery.length + files.length > GALLERY_MAX) {
      showError(
        null,
        "publicPage.galleryLimit",
        `Максимум ${GALLERY_MAX} фото в галерее`,
      );
      return;
    }
    setGalleryBusy(true);
    setError(null);
    try {
      const res = await uploadClinicGallery(clinic.id, files);
      setGallery(res.gallery || []);
      flashSaved();
    } catch (err) {
      console.error("gallery upload failed:", err);
      showError(err, "publicPage.galleryError", "Не удалось загрузить фото");
    } finally {
      setGalleryBusy(false);
    }
  };

  const handleGalleryDelete = async (itemId) => {
    if (!clinic?.id || galleryBusy) return;
    setGalleryBusy(true);
    setError(null);
    try {
      const res = await deleteClinicGalleryItem(clinic.id, itemId);
      setGallery(res.gallery || []);
    } catch (err) {
      console.error("gallery delete failed:", err);
      showError(err, "publicPage.galleryError", "Не удалось удалить фото");
    } finally {
      setGalleryBusy(false);
    }
  };
  const handleSaveContent = async (fields) => {
    if (!clinic?.id) return;
    await updateClinic(clinic.id, fields);
    setClinic((c) => ({ ...c, ...fields }));
    flashSaved();
  };
  // ─── reviews moderation (этап C) ───
  const loadReviews = useCallback(
    async (filter) => {
      if (!clinic?.id) return;
      setReviewsLoading(true);
      try {
        const opts = filter && filter !== "all" ? { status: filter } : {};
        const res = await listClinicReviews(clinic.id, opts);
        setReviews(Array.isArray(res.items) ? res.items : []);
        setReviewsTotal(res.total || 0);
      } catch (err) {
        console.error("load reviews failed:", err);
      } finally {
        setReviewsLoading(false);
      }
    },
    [clinic],
  );

  useEffect(() => {
    if (clinic?.id && canModerateReviews) loadReviews(reviewFilter);
  }, [clinic, canModerateReviews, reviewFilter, loadReviews]);

  const handleModerate = async (reviewId, action) => {
    if (!clinic?.id || reviewBusyId) return;
    setReviewBusyId(reviewId);
    try {
      await moderateClinicReview(clinic.id, reviewId, action);
      await loadReviews(reviewFilter);
    } catch (err) {
      console.error("moderate failed:", err);
      showError(err, "publicPage.reviewError", "Не удалось изменить статус");
    } finally {
      setReviewBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="cpps-loading">
        <div className="cpps-spinner" />
      </div>
    );
  }

  if (error && !clinic) {
    return (
      <div className="cpps-error">
        <h2>{t("common.error", { defaultValue: "Ошибка" })}</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Каноничный публичный адрес клиники — корневой /slug (не /clinics/slug).
  // Отсюда директор копирует ссылку для рассылки и соцсетей, и этот же
  // адрес netlify/edge-functions/seo.js объявляет каноническим: обработку
  // корневого слага он выполняет наравне с /clinics/slug.
  const publicUrl = clinic?.slug ? `/${clinic.slug}` : null;

  const fmtDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return "";
    }
  };

  // лейбл фильтра через namespace clinicReviews
  const filterLabel = (f) =>
    f === "pending"
      ? tr("filterPending")
      : f === "approved"
        ? tr("filterApproved")
        : f === "rejected"
          ? tr("filterRejected")
          : tr("filterAll");

  // лейбл статуса в карточке отзыва
  const statusLabel = (s) =>
    s === "pending"
      ? tr("statusPending")
      : s === "approved"
        ? tr("statusApprovedShort")
        : s === "rejected"
          ? tr("statusRejected")
          : s;

  return (
    <div className="cpps">
      <header className="cpps-header">
        <h1 className="cpps-title">
          {t("publicPage.title", { defaultValue: "Публичная страница" })}
        </h1>
        <p className="cpps-subtitle">
          {t("publicPage.subtitle", {
            defaultValue:
              "Мини-сайт клиники для пациентов: описание, врачи, контакты.",
          })}
        </p>
      </header>

      {!canWrite && (
        <div className="cpps-banner cpps-banner-warn">
          {t("publicPage.noPermission", {
            defaultValue:
              "У вас нет прав на редактирование. Обратитесь к владельцу клиники.",
          })}
        </div>
      )}

      {error && clinic && (
        <div className="cpps-banner cpps-banner-error">{error}</div>
      )}

      {/* PUBLISH TOGGLE */}
      <section className="cpps-card">
        <div className="cpps-card-head">
          <h2 className="cpps-card-title">
            {t("publicPage.statusTitle", { defaultValue: "Статус" })}
          </h2>
        </div>
        <div className="cpps-card-body">
          <div className="cpps-toggle-row">
            <div className="cpps-toggle-info">
              <div className="cpps-toggle-label">
                {isPublished
                  ? t("publicPage.published", {
                      defaultValue: "Страница опубликована",
                    })
                  : t("publicPage.unpublished", {
                      defaultValue: "Страница скрыта",
                    })}
              </div>
              <div className="cpps-toggle-hint">
                {isPublished
                  ? t("publicPage.publishedHint", {
                      defaultValue: "Страница видна всем по ссылке ниже.",
                    })
                  : t("publicPage.unpublishedHint", {
                      defaultValue:
                        "Опубликуйте, когда профиль готов — тогда страница станет видна.",
                    })}
              </div>
            </div>
            <button
              type="button"
              className={`cpps-switch${isPublished ? " on" : ""}`}
              role="switch"
              aria-checked={isPublished}
              disabled={!canWrite || savingPub}
              onClick={handleTogglePublish}
            >
              <span className="cpps-switch-knob" />
            </button>
          </div>

          {publicUrl && (
            <div className="cpps-preview">
              <span className="cpps-preview-label">
                {t("publicPage.linkLabel", { defaultValue: "Адрес страницы:" })}
              </span>
              {isPublished ? (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cpps-preview-link"
                >
                  {window.location.origin}
                  {publicUrl} ↗
                </a>
              ) : (
                <span className="cpps-preview-muted">
                  {window.location.origin}
                  {publicUrl}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* LOGO */}
      <section className="cpps-card">
        <div className="cpps-card-head">
          <h2 className="cpps-card-title">
            {t("publicPage.logoTitle", { defaultValue: "Логотип" })}
          </h2>
        </div>
        <div className="cpps-card-body">
          <div className="cpps-logo-row">
            <div className="cpps-logo-preview">
              {logo ? (
                <img src={logo} alt={t("publicPage.logoTitle")} />
              ) : (
                <span className="cpps-logo-empty">🏥</span>
              )}
            </div>
            <div className="cpps-logo-actions">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleLogoChange}
              />
              <button
                type="button"
                className="cpps-btn cpps-btn-primary"
                disabled={!canWrite || logoBusy}
                onClick={handleLogoPick}
              >
                {logoBusy
                  ? t("common.saving", { defaultValue: "Сохранение…" })
                  : logo
                    ? t("publicPage.logoReplace", { defaultValue: "Заменить" })
                    : t("publicPage.logoUpload", { defaultValue: "Загрузить" })}
              </button>
              {logo && (
                <button
                  type="button"
                  className="cpps-btn cpps-btn-ghost"
                  disabled={!canWrite || logoBusy}
                  onClick={handleLogoDelete}
                >
                  {t("publicPage.remove", { defaultValue: "Удалить" })}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TRANSLATIONS */}
      <section className="cpps-card">
        <div className="cpps-card-head">
          <h2 className="cpps-card-title">
            {t("publicPage.i18nTitle", { defaultValue: "Языки витрины" })}
          </h2>
        </div>
        <div className="cpps-card-body">
          <p className="cpps-hint">
            {t("publicPage.i18nHint", {
              defaultValue:
                "Витрина показывается на языке посетителя. Где перевода нет — показывается язык оригинала, так что заполнять все языки не обязательно.",
            })}
          </p>

          <label className="cpps-label">
            {t("publicPage.origLang", { defaultValue: "Язык оригинала" })}
          </label>
          <select
            className="cpps-select"
            value={origLang}
            disabled={!canWrite || savingTrans}
            onChange={(e) => setOrigLang(e.target.value)}
          >
            {CLINIC_LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_LABEL[l]}
              </option>
            ))}
          </select>

          <div className="cpps-lang-tabs">
            {CLINIC_LANGS.filter((l) => l !== origLang).map((l) => (
              <button
                key={l}
                type="button"
                className={
                  "cpps-lang-tab" +
                  (transLang === l ? " is-active" : "") +
                  (descI18n[l] || sloganI18n[l] ? " is-filled" : "")
                }
                onClick={() => setTransLang(transLang === l ? null : l)}
              >
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>

          {transLang && (
            <div className="cpps-lang-editor">
              <label className="cpps-label">
                {t("publicPage.sloganLabel", { defaultValue: "Слоган" })} —{" "}
                {LANG_LABEL[transLang]}
              </label>
              <input
                className="cpps-input"
                maxLength={200}
                value={sloganI18n[transLang] || ""}
                disabled={!canWrite || savingTrans}
                onChange={(e) =>
                  setSloganI18n({ ...sloganI18n, [transLang]: e.target.value })
                }
              />

              <label className="cpps-label">
                {t("publicPage.descTitle", { defaultValue: "Описание клиники" })}{" "}
                — {LANG_LABEL[transLang]}
              </label>
              <textarea
                className="cpps-textarea"
                rows={8}
                maxLength={DESC_MAX}
                value={descI18n[transLang] || ""}
                disabled={!canWrite || savingTrans}
                placeholder={description}
                onChange={(e) =>
                  setDescI18n({ ...descI18n, [transLang]: e.target.value })
                }
              />

              <div className="cpps-desc-foot">
                <span className="cpps-counter">
                  {(descI18n[transLang] || "").length} / {DESC_MAX}
                </span>
                <div className="cpps-actions">
                  {savedMsg && <span className="cpps-saved">{savedMsg}</span>}
                  <button
                    type="button"
                    className="cpps-btn cpps-btn-primary"
                    disabled={!canWrite || savingTrans}
                    onClick={handleSaveTranslations}
                  >
                    {savingTrans
                      ? t("common.saving", { defaultValue: "Сохранение…" })
                      : t("common.save", { defaultValue: "Сохранить" })}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* DESCRIPTION */}
      <section className="cpps-card">
        <div className="cpps-card-head">
          <h2 className="cpps-card-title">
            {t("publicPage.descTitle", { defaultValue: "Описание клиники" })}
          </h2>
        </div>
        <div className="cpps-card-body">
          <textarea
            className="cpps-textarea"
            value={description}
            maxLength={DESC_MAX}
            disabled={!canWrite || savingDesc}
            placeholder={t("publicPage.descPlaceholder", {
              defaultValue:
                "Расскажите о клинике: направления, история, преимущества…",
            })}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
          />
          <div className="cpps-desc-foot">
            <span className="cpps-counter">
              {description.length} / {DESC_MAX}
            </span>
            <div className="cpps-actions">
              {savedMsg && <span className="cpps-saved">{savedMsg}</span>}
              <button
                type="button"
                className="cpps-btn cpps-btn-primary"
                disabled={!canWrite || savingDesc}
                onClick={handleSaveDescription}
              >
                {savingDesc
                  ? t("common.saving", { defaultValue: "Сохранение…" })
                  : t("common.save", { defaultValue: "Сохранить" })}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="cpps-card">
        <div className="cpps-card-head">
          <h2 className="cpps-card-title">
            {t("publicPage.galleryTitle", { defaultValue: "Галерея" })}
          </h2>
          <span className="cpps-gallery-count">
            {gallery.length} / {GALLERY_MAX}
          </span>
        </div>
        <div className="cpps-card-body">
          {gallery.length > 0 && (
            <div className="cpps-gallery-grid">
              {gallery.map((g) => (
                <div className="cpps-gallery-item" key={g.id}>
                  <img src={g.url} alt={g.caption || ""} />
                  {canWrite && (
                    <button
                      type="button"
                      className="cpps-gallery-del"
                      disabled={galleryBusy}
                      onClick={() => handleGalleryDelete(g.id)}
                      aria-label={t("publicPage.remove", {
                        defaultValue: "Удалить",
                      })}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleGalleryChange}
          />
          <button
            type="button"
            className="cpps-btn cpps-btn-primary cpps-gallery-add"
            disabled={!canWrite || galleryBusy || gallery.length >= GALLERY_MAX}
            onClick={handleGalleryPick}
          >
            {galleryBusy
              ? t("common.saving", { defaultValue: "Сохранение…" })
              : t("publicPage.galleryAdd", { defaultValue: "Добавить фото" })}
          </button>
          {gallery.length === 0 && (
            <div className="cpps-gallery-empty">
              {t("publicPage.galleryEmpty", {
                defaultValue: "Пока нет фотографий.",
              })}
            </div>
          )}
        </div>
      </section>
      <section className="cpps-card">
        <div className="cpps-card-head">
          <h2 className="cpps-card-title">
            {t("publicPage.contentTitle", { defaultValue: "Контент клиники" })}
          </h2>
        </div>
        <div className="cpps-card-body">
          <ClinicContentForm
            clinic={clinic}
            canWrite={canWrite}
            onSave={handleSaveContent}
            onCoverChange={(url) =>
              setClinic((c) => ({ ...c, coverImage: url }))
            }
            onPageBgChange={(url) =>
              setClinic((c) => ({ ...c, pageBackground: url }))
            }
          />
        </div>
      </section>
      <section className="cpps-card">
        <div className="cpps-card-head">
          <h2 className="cpps-card-title">
            {t("publicPage.themeTitle", { defaultValue: "Оформление витрины" })}
          </h2>
        </div>
        <div className="cpps-card-body">
          <ThemeSwitcher
            clinic={clinic}
            canWrite={canWrite}
            onSave={handleSaveTheme}
          />
        </div>
      </section>
      <section className="cpps-card">
        <div className="cpps-card-head">
          <h2 className="cpps-card-title">
            {t("publicPage.layoutTitle", { defaultValue: "Блоки витрины" })}
          </h2>
        </div>
        <div className="cpps-card-body">
          <LayoutEditor
            clinic={clinic}
            canWrite={canWrite}
            onSave={handleSaveLayout}
          />
        </div>
      </section>
      {/* CUSTOM PAGES — ссылка на конструктор кастомных страниц */}
      <section className="cpps-card">
        <div className="cpps-card-head">
          <h2 className="cpps-card-title">
            {t("publicPage.customPagesTitle", {
              defaultValue: "Страницы сайта",
            })}
          </h2>
        </div>
        <div className="cpps-card-body">
          <p style={{ marginBottom: 14, color: "#78716c", fontSize: 14 }}>
            {t("publicPage.customPagesHint", {
              defaultValue:
                "Создавайте отдельные страницы (Акции, О враче, Цены) из блоков и добавляйте их в меню витрины.",
            })}
          </p>
          <Link to={pagesPath} className="cpps-btn cpps-btn-primary">
            {t("publicPage.customPagesManage", {
              defaultValue: "Управление страницами →",
            })}
          </Link>
        </div>
      </section>
      {/* REVIEWS MODERATION (этап C) — namespace clinicReviews */}
      {canModerateReviews && (
        <section className="cpps-card">
          <div className="cpps-card-head">
            <h2 className="cpps-card-title">{tr("modTitle")}</h2>
            <span className="cpps-gallery-count">{reviewsTotal}</span>
          </div>
          <div className="cpps-card-body">
            {/* filter tabs */}
            <div className="cpps-rv-tabs">
              {["pending", "approved", "rejected", "all"].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`cpps-rv-tab${reviewFilter === f ? " active" : ""}`}
                  onClick={() => setReviewFilter(f)}
                >
                  {filterLabel(f)}
                </button>
              ))}
            </div>

            {reviewsLoading ? (
              <div className="cpps-rv-empty">{tr("loading")}</div>
            ) : reviews.length === 0 ? (
              <div className="cpps-rv-empty">{tr("empty")}</div>
            ) : (
              <div className="cpps-rv-list">
                {reviews.map((r) => (
                  <div className="cpps-rv-item" key={r.id}>
                    <div className="cpps-rv-item-head">
                      <span className="cpps-rv-author">{r.authorName}</span>
                      <Stars value={r.rating} />
                      <span className={`cpps-rv-status ${r.status}`}>
                        {statusLabel(r.status)}
                      </span>
                    </div>
                    {r.text && <div className="cpps-rv-text">{r.text}</div>}
                    <div className="cpps-rv-foot">
                      <span className="cpps-rv-date">
                        {fmtDate(r.createdAt)}
                      </span>
                      <div className="cpps-rv-actions">
                        {r.status !== "approved" && (
                          <button
                            type="button"
                            className="cpps-btn cpps-btn-primary cpps-rv-btn"
                            disabled={reviewBusyId === r.id}
                            onClick={() => handleModerate(r.id, "approve")}
                          >
                            {tr("approve")}
                          </button>
                        )}
                        {r.status !== "rejected" && (
                          <button
                            type="button"
                            className="cpps-btn cpps-btn-ghost cpps-rv-btn"
                            disabled={reviewBusyId === r.id}
                            onClick={() => handleModerate(r.id, "reject")}
                          >
                            {tr("reject")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* footnote */}
      <div className="cpps-foot-note">
        {t("publicPage.moreSoon", {
          defaultValue: "Публикации появятся в следующих обновлениях.",
        })}
      </div>

      <div className="cpps-back">
        <Link to={backPath} className="cpps-back-link">
          ← {t("common.backToDashboard", { defaultValue: "К дашборду" })}
        </Link>
      </div>

      {/* Удаление клиники — только owner-зона. Маркетолог не должен видеть. */}
      {!isEmployee && (
        <DeleteClinicSection clinicId={clinic.id} clinicName={clinic.name} />
      )}
    </div>
  );
}
