// client/src/pages/clinic/vitrina/settings/ClinicContentForm.jsx
//
// ВИТРИНА 2.0 (V4.1 UI) — форма brand-полей уровня клиники для
// ClinicPublicPageSettings. Текстовые поля (slogan/callCenterPhone/
// callCenterHours/faq) сохраняются разом через onSave(fields).
//
// Обложка (coverImage) — ОТДЕЛЬНО: пикер с немедленной загрузкой в R2
// (uploadClinicCover / deleteClinicCover), как logo/gallery. После загрузки
// зовём onCoverChange(url), чтобы родитель обновил clinic.coverImage и
// live-превью (ThemeSwitcher/LayoutEditor) подхватили новую обложку.
//
// Поля приоритетнее config блоков (V4.3). Props: clinic, canWrite, onSave,
// onCoverChange? (опц.).

import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LabeledInput,
  LabeledTextarea,
  ListEditor,
  CONFIG_CSS,
} from "../layout/configFields.jsx";
import {
  uploadClinicCover,
  deleteClinicCover,
  uploadClinicPageBg,
  deleteClinicPageBg,
} from "../../../../api/clinic";

const CSS = `
.vt-cc { max-width: 680px; }
.vt-cc-section-label { font-size: 12px; font-weight: 700; color: #57534e; margin: 6px 0 4px; }
.vt-cc-hint { font-size: 11px; color: #8a8a7a; margin: 4px 0 0; }
.vt-cc-cover { display: flex; gap: 16px; align-items: flex-start; }
.vt-cc-cover-preview { width: 220px; aspect-ratio: 16 / 9; border-radius: 10px; border: 1px solid #d6d0c6; background: #f3efe8; display: flex; align-items: center; justify-content: center; color: #b8b2a6; font-size: 30px; overflow: hidden; flex-shrink: 0; }
.vt-cc-cover-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.vt-cc-cover-actions { display: flex; flex-direction: column; gap: 8px; }
.vt-cc-btn { border: 1px solid #d6d0c6; background: #fff; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; color: #44403c; cursor: pointer; }
.vt-cc-btn:disabled { opacity: .5; cursor: default; }
.vt-cc-btn-danger { color: #c0392b; border-color: #f0c0bc; }
.vt-cc-err { font-size: 12px; color: #c0392b; margin: 4px 0 0; }

.vt-cc-save-row { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
.vt-cc-save { background: #0f766e; color: #fff; border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 700; cursor: pointer; }
.vt-cc-save:disabled { opacity: .5; cursor: default; }
.vt-cc-saved { font-size: 13px; color: #1a6b3c; }
`;

export default function ClinicContentForm({
  clinic,
  canWrite,
  onSave,
  onCoverChange,
  onPageBgChange,
}) {
  const { t } = useTranslation("clinic");

  // текстовые поля (сохраняются кнопкой Save)
  const initial = useMemo(
    () => ({
      slogan: clinic?.slogan || "",
      callCenterPhone: clinic?.callCenterPhone || "",
      callCenterHours: clinic?.callCenterHours || "",
      faq: Array.isArray(clinic?.faq)
        ? clinic.faq.map((f) => ({ q: f.q || "", a: f.a || "" }))
        : [],
    }),
    [clinic],
  );
  const initialRef = useRef(JSON.stringify(initial));

  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // обложка (немедленная загрузка, вне Save)
  const [coverImage, setCoverImage] = useState(clinic?.coverImage || null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState("");
  const coverInputRef = useRef(null);

  // фон всей страницы (немедленная загрузка, вне Save)
  const [pageBackground, setPageBackground] = useState(
    clinic?.pageBackground || null,
  );
  const [pageBgBusy, setPageBgBusy] = useState(false);
  const [pageBgError, setPageBgError] = useState("");
  const pageBgInputRef = useRef(null);

  const set = (k, val) => {
    setV((p) => ({ ...p, [k]: val }));
    setSaved(false);
  };

  const dirty = JSON.stringify(v) !== initialRef.current;

  const handleSave = async () => {
    if (!canWrite || saving || !dirty) return;
    setSaving(true);
    try {
      const payload = {
        slogan: v.slogan.trim(),
        callCenterPhone: v.callCenterPhone.trim(),
        callCenterHours: v.callCenterHours.trim(),
        faq: v.faq
          .filter((f) => f.q.trim() && f.a.trim())
          .map((f) => ({ q: f.q.trim(), a: f.a.trim() })),
      };
      await onSave(payload);
      initialRef.current = JSON.stringify(v);
      setSaved(true);
    } catch {
      /* ошибку показывает родитель */
    } finally {
      setSaving(false);
    }
  };

  // ─── обложка ───
  const handleCoverPick = () => {
    if (!canWrite || coverBusy) return;
    coverInputRef.current?.click();
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !clinic?.id) return;
    setCoverBusy(true);
    setCoverError("");
    try {
      const res = await uploadClinicCover(clinic.id, file);
      const url = res?.coverImage || null;
      setCoverImage(url);
      if (onCoverChange) onCoverChange(url);
    } catch {
      setCoverError(
        t("publicPage.coverError", {
          defaultValue: "Не удалось загрузить обложку",
        }),
      );
    } finally {
      setCoverBusy(false);
    }
  };

  const handleCoverDelete = async () => {
    if (!clinic?.id || coverBusy) return;
    setCoverBusy(true);
    setCoverError("");
    try {
      await deleteClinicCover(clinic.id);
      setCoverImage(null);
      if (onCoverChange) onCoverChange(null);
    } catch {
      setCoverError(
        t("publicPage.coverError", {
          defaultValue: "Не удалось удалить обложку",
        }),
      );
    } finally {
      setCoverBusy(false);
    }
  };

  // ─── фон страницы ───
  const handlePageBgPick = () => {
    if (!canWrite || pageBgBusy) return;
    pageBgInputRef.current?.click();
  };

  const handlePageBgChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !clinic?.id) return;
    setPageBgBusy(true);
    setPageBgError("");
    try {
      const res = await uploadClinicPageBg(clinic.id, file);
      const url = res?.pageBackground || null;
      setPageBackground(url);
      if (onPageBgChange) onPageBgChange(url);
    } catch {
      setPageBgError(
        t("publicPage.pageBgError", {
          defaultValue: "Не удалось загрузить фон",
        }),
      );
    } finally {
      setPageBgBusy(false);
    }
  };

  const handlePageBgDelete = async () => {
    if (!clinic?.id || pageBgBusy) return;
    setPageBgBusy(true);
    setPageBgError("");
    try {
      await deleteClinicPageBg(clinic.id);
      setPageBackground(null);
      if (onPageBgChange) onPageBgChange(null);
    } catch {
      setPageBgError(
        t("publicPage.pageBgError", {
          defaultValue: "Не удалось удалить фон",
        }),
      );
    } finally {
      setPageBgBusy(false);
    }
  };

  return (
    <div className="vt-cc">
      <style>
        {CONFIG_CSS}
        {CSS}
      </style>

      <div className="vt-cf">
        <LabeledInput
          label={t("publicPage.fieldSlogan", { defaultValue: "Слоган" })}
          value={v.slogan}
          onChange={(val) => set("slogan", val)}
          placeholder={t("publicPage.fieldSloganPh", {
            defaultValue: "Здоровье начинается здесь",
          })}
        />

        {/* обложка — пикер */}
        <div>
          <p className="vt-cc-section-label">
            {t("publicPage.fieldCover", { defaultValue: "Обложка (hero)" })}
          </p>
          <div className="vt-cc-cover">
            <div className="vt-cc-cover-preview">
              {coverImage ? <img src={coverImage} alt="" /> : <span>🖼️</span>}
            </div>
            <div className="vt-cc-cover-actions">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleCoverChange}
              />
              <button
                type="button"
                className="vt-cc-btn"
                disabled={!canWrite || coverBusy}
                onClick={handleCoverPick}
              >
                {coverBusy
                  ? t("common.saving", { defaultValue: "Сохранение…" })
                  : coverImage
                    ? t("publicPage.coverReplace", { defaultValue: "Заменить" })
                    : t("publicPage.coverUpload", {
                        defaultValue: "Загрузить",
                      })}
              </button>
              {coverImage && (
                <button
                  type="button"
                  className="vt-cc-btn vt-cc-btn-danger"
                  disabled={!canWrite || coverBusy}
                  onClick={handleCoverDelete}
                >
                  {t("publicPage.remove", { defaultValue: "Удалить" })}
                </button>
              )}
            </div>
          </div>
          {coverError && <p className="vt-cc-err">{coverError}</p>}
          <p className="vt-cc-hint">
            {t("publicPage.fieldCoverHint", {
              defaultValue:
                "Нужна для hero-стилей «Фото» и «Сплит». Сохраняется сразу при загрузке.",
            })}
          </p>
        </div>

        {/* фон страницы — пикер */}
        <div>
          <p className="vt-cc-section-label">
            {t("publicPage.fieldPageBg", {
              defaultValue: "Фон страницы",
            })}
          </p>
          <div className="vt-cc-cover">
            <div className="vt-cc-cover-preview">
              {pageBackground ? (
                <img src={pageBackground} alt="" />
              ) : (
                <span>🖼️</span>
              )}
            </div>
            <div className="vt-cc-cover-actions">
              <input
                ref={pageBgInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePageBgChange}
              />
              <button
                type="button"
                className="vt-cc-btn"
                disabled={!canWrite || pageBgBusy}
                onClick={handlePageBgPick}
              >
                {pageBgBusy
                  ? t("common.saving", { defaultValue: "Сохранение…" })
                  : pageBackground
                    ? t("publicPage.coverReplace", { defaultValue: "Заменить" })
                    : t("publicPage.coverUpload", {
                        defaultValue: "Загрузить",
                      })}
              </button>
              {pageBackground && (
                <button
                  type="button"
                  className="vt-cc-btn vt-cc-btn-danger"
                  disabled={!canWrite || pageBgBusy}
                  onClick={handlePageBgDelete}
                >
                  {t("publicPage.remove", { defaultValue: "Удалить" })}
                </button>
              )}
            </div>
          </div>
          {pageBgError && <p className="vt-cc-err">{pageBgError}</p>}
          <p className="vt-cc-hint">
            {t("publicPage.fieldPageBgHint", {
              defaultValue:
                "Фон всей страницы. Активен при выборе «Фон страницы → Фото» в оформлении. Сохраняется сразу при загрузке.",
            })}
          </p>
        </div>

        <div className="vt-cf-row2">
          <LabeledInput
            label={t("publicPage.fieldCallPhone", {
              defaultValue: "Телефон записи",
            })}
            value={v.callCenterPhone}
            onChange={(val) => set("callCenterPhone", val)}
            placeholder="+994 12 555 00 00"
          />
          <LabeledInput
            label={t("publicPage.fieldCallHours", {
              defaultValue: "Часы работы",
            })}
            value={v.callCenterHours}
            onChange={(val) => set("callCenterHours", val)}
            placeholder="Пн–Пт 9:00–18:00"
          />
        </div>

        <div>
          <p className="vt-cc-section-label">
            {t("publicPage.fieldFaq", { defaultValue: "Вопросы и ответы" })}
          </p>
          <ListEditor
            items={v.faq}
            onChange={(faq) => set("faq", faq)}
            emptyItem={{ q: "", a: "" }}
            addLabel={t("publicPage.cfgAddFaq", { defaultValue: "+ Вопрос" })}
            max={30}
            renderFields={(it, update) => (
              <>
                <LabeledInput
                  label={t("publicPage.cfgQuestion", {
                    defaultValue: "Вопрос",
                  })}
                  value={it.q}
                  onChange={(val) => update({ ...it, q: val })}
                />
                <LabeledTextarea
                  label={t("publicPage.cfgAnswer", { defaultValue: "Ответ" })}
                  value={it.a}
                  onChange={(val) => update({ ...it, a: val })}
                  rows={2}
                />
              </>
            )}
          />
        </div>
      </div>

      <div className="vt-cc-save-row">
        <button
          type="button"
          className="vt-cc-save"
          disabled={!canWrite || saving || !dirty}
          onClick={handleSave}
        >
          {saving
            ? t("common.saving", { defaultValue: "Сохранение…" })
            : t("common.save", { defaultValue: "Сохранить" })}
        </button>
        {saved && (
          <span className="vt-cc-saved">
            {t("publicPage.saved", { defaultValue: "Сохранено" })}
          </span>
        )}
      </div>
    </div>
  );
}
