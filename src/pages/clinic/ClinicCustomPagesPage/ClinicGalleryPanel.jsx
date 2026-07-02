// client/src/pages/clinic/ClinicCustomPagesPage/ClinicGalleryPanel.jsx
//
// ВИТРИНА 2.0 (Часть 4, Г3) — управление ГАЛЕРЕЕЙ одной категории.
// Встраивается в ClinicCustomPagesPage по кнопке «Галерея» у страницы.
//
// Загрузка фото (uploadClinicAsset → URL) + подпись + описание. Список превью
// с удалением. На витрине галерея показывается автоматически (блок сам себя
// дорисовывает, если в категории есть фото).

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  listGalleryItems,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  uploadClinicAsset,
} from "../../../api/clinic";

const CSS = `
.cgp { background: #faf9f6; border: 1px solid #e7e2d8; border-radius: 12px; padding: 18px; margin-top: 12px; }
.cgp-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.cgp-title { font-size: 16px; font-weight: 700; color: #292524; margin: 0; }
.cgp-btn { border: none; border-radius: 8px; padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
.cgp-btn-primary { background: #0f766e; color: #fff; }
.cgp-btn-primary:disabled { opacity: .5; cursor: default; }
.cgp-error { background: #fdecea; color: #c0392b; border: 1px solid #f5c6cb; border-radius: 8px; padding: 9px 13px; font-size: 13px; margin-bottom: 12px; }
.cgp-add { border: 1px dashed #cbd5c8; border-radius: 10px; padding: 14px; margin-bottom: 14px; background: #fff; }
.cgp-add-row { display: flex; flex-direction: column; gap: 8px; }
.cgp-input, .cgp-textarea { border: 1px solid #d6d0c4; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-family: inherit; }
.cgp-textarea { resize: vertical; min-height: 48px; }
.cgp-prev { max-width: 160px; max-height: 110px; border-radius: 8px; border: 1px solid #e7e2d8; object-fit: cover; display: block; }
.cgp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.cgp-cell { background: #fff; border: 1px solid #e7e2d8; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; }
.cgp-cell-img { width: 100%; height: 120px; object-fit: cover; background: #f0ede7; }
.cgp-cell-body { padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }
.cgp-cell-cap { font-size: 13px; font-weight: 600; color: #292524; }
.cgp-cell-desc { font-size: 12px; color: #78716c; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cgp-cell-del { align-self: flex-start; border: none; background: transparent; color: #c0392b; font-size: 12px; font-weight: 600; cursor: pointer; padding: 2px 0; }
.cgp-empty { padding: 22px; text-align: center; color: #a8a29e; font-size: 13px; border: 1px dashed #d6d0c4; border-radius: 9px; }
.cgp-hint { font-size: 11px; color: #a8a29e; }
`;

export default function ClinicGalleryPanel({ clinic, page, canWrite }) {
  const { t } = useTranslation("clinic");
  const clinicId = clinic?._id || clinic?.id;
  const pageId = page?._id || page?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // форма добавления
  const [image, setImage] = useState("");
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!pageId) return;
    setLoading(true);
    try {
      const res = await listGalleryItems({ pageId });
      setItems(res.items || []);
    } catch {
      setError(t("publicPage.loadError", { defaultValue: "Ошибка загрузки." }));
    } finally {
      setLoading(false);
    }
  }, [pageId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !clinicId) return;
    setUploadBusy(true);
    setError("");
    try {
      const res = await uploadClinicAsset(clinicId, file);
      setImage(res.url || res.asset || "");
    } catch {
      setError(
        t("publicPage.logoError", {
          defaultValue: "Не удалось загрузить фото.",
        }),
      );
    } finally {
      setUploadBusy(false);
    }
  };

  const handleAdd = async () => {
    if (!image || saving) return;
    setSaving(true);
    setError("");
    try {
      await createGalleryItem({ pageId, image, caption, description });
      setImage("");
      setCaption("");
      setDescription("");
      await load();
    } catch (e2) {
      setError(
        e2?.response?.data?.error ||
          t("publicPage.saveError", { defaultValue: "Не удалось сохранить." }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (it) => {
    if (
      !window.confirm(
        t("publicPage.confirmDeletePhoto", {
          defaultValue: "Удалить это фото?",
        }),
      )
    )
      return;
    await deleteGalleryItem(it.id);
    await load();
  };

  const handleCaptionBlur = async (it, newCap) => {
    if (newCap === it.caption) return;
    await updateGalleryItem(it.id, { caption: newCap });
    await load();
  };

  return (
    <div className="cgp">
      <style>{CSS}</style>
      <div className="cgp-head">
        <h3 className="cgp-title">
          {t("publicPage.galleryOf", { defaultValue: "Галерея категории" })}:{" "}
          {page?.title}
        </h3>
      </div>

      {error && <div className="cgp-error">{error}</div>}

      {/* форма добавления */}
      {canWrite && (
        <div className="cgp-add">
          <div className="cgp-add-row">
            <div>
              <input
                type="file"
                accept="image/*"
                disabled={uploadBusy}
                onChange={handleUpload}
              />
              {uploadBusy && (
                <span className="cgp-hint">
                  {" "}
                  {t("common.saving", { defaultValue: "Загрузка…" })}
                </span>
              )}
            </div>
            {image && <img className="cgp-prev" src={image} alt="" />}
            <input
              className="cgp-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t("publicPage.photoCaption", {
                defaultValue: "Подпись",
              })}
            />
            <textarea
              className="cgp-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("publicPage.photoDescription", {
                defaultValue: "Описание (показывается при открытии фото)",
              })}
            />
            <button
              type="button"
              className="cgp-btn cgp-btn-primary"
              disabled={!image || saving}
              onClick={handleAdd}
            >
              {saving
                ? t("common.saving", { defaultValue: "Сохранение…" })
                : t("publicPage.addPhoto", { defaultValue: "Добавить фото" })}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#78716c", fontSize: 13 }}>
          {t("common.loading", { defaultValue: "Загрузка…" })}
        </p>
      ) : items.length === 0 ? (
        <div className="cgp-empty">
          {t("publicPage.noPhotos", {
            defaultValue: "Пока нет фото. Добавьте первое.",
          })}
        </div>
      ) : (
        <div className="cgp-grid">
          {items.map((it) => (
            <div className="cgp-cell" key={it.id}>
              <img className="cgp-cell-img" src={it.image} alt={it.caption} />
              <div className="cgp-cell-body">
                {canWrite ? (
                  <input
                    className="cgp-input"
                    style={{ fontSize: 13, padding: "4px 8px" }}
                    defaultValue={it.caption}
                    placeholder={t("publicPage.photoCaption", {
                      defaultValue: "Подпись",
                    })}
                    onBlur={(e) => handleCaptionBlur(it, e.target.value)}
                  />
                ) : (
                  it.caption && <div className="cgp-cell-cap">{it.caption}</div>
                )}
                {it.description && (
                  <div className="cgp-cell-desc">{it.description}</div>
                )}
                {canWrite && (
                  <button
                    type="button"
                    className="cgp-cell-del"
                    onClick={() => handleDelete(it)}
                  >
                    {t("common.remove", { defaultValue: "Удалить" })}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
