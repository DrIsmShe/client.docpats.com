// client/src/pages/clinic/ClinicCustomPagesPage/ClinicArticlesPanel.jsx
//
// ВИТРИНА 2.0 (Часть 3, Этап 5) — управление статьями ОДНОЙ страницы-категории.
// Встраивается в ClinicCustomPagesPage по кнопке «Статьи» у страницы.
//
// Список статей категории (создать / редактировать / опубликовать-снять / удалить)
// + форма с CKEditor (как редактор научных статей). Обложка грузится отдельно
// (uploadClinicAsset → URL), затем сохраняется как article.cover (бэк ждёт URL).
//
// Поля формы повторяют редактор научных статей: title, authors, excerpt (аннотация),
// cover, body (rich-text), links, tags, metaDescription, metaKeywords, status.

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  publishArticle,
  deleteArticle,
  uploadClinicAsset,
} from "../../../api/clinic";

const CSS = `
.cap { background: #faf9f6; border: 1px solid #e7e2d8; border-radius: 12px; padding: 18px; margin-top: 12px; }
.cap-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.cap-title { font-size: 16px; font-weight: 700; color: #292524; margin: 0; }
.cap-list { display: flex; flex-direction: column; gap: 8px; }
.cap-item { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #e7e2d8; border-radius: 9px; padding: 10px 14px; }
.cap-item-title { flex: 1; font-size: 14px; font-weight: 600; color: #292524; }
.cap-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 100px; text-transform: uppercase; }
.cap-badge.published { background: #def7ec; color: #1a6b3c; }
.cap-badge.draft { background: #fef3c7; color: #b5870a; }
.cap-badge.disabled { background: #fde2e1; color: #c0392b; }
.cap-act { border: none; background: transparent; cursor: pointer; font-size: 12px; color: #0f766e; font-weight: 600; padding: 4px 8px; border-radius: 6px; }
.cap-act:hover { background: #f5f3ef; }
.cap-act.danger { color: #c0392b; }
.cap-empty { padding: 22px; text-align: center; color: #a8a29e; font-size: 13px; border: 1px dashed #d6d0c4; border-radius: 9px; }
.cap-btn { border: none; border-radius: 8px; padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
.cap-btn-primary { background: #0f766e; color: #fff; }
.cap-btn-primary:disabled { opacity: .5; cursor: default; }
.cap-btn-ghost { background: #f0ede7; color: #44403c; }
.cap-form { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
.cap-row { display: flex; flex-direction: column; gap: 4px; }
.cap-row label { font-size: 12px; font-weight: 600; color: #57534e; }
.cap-input, .cap-textarea { border: 1px solid #d6d0c4; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-family: inherit; }
.cap-textarea { resize: vertical; min-height: 60px; }
.cap-hint { font-size: 11px; color: #a8a29e; }
.cap-error { background: #fdecea; color: #c0392b; border: 1px solid #f5c6cb; border-radius: 8px; padding: 9px 13px; font-size: 13px; }
.cap-cover-prev { max-width: 200px; max-height: 120px; border-radius: 8px; border: 1px solid #e7e2d8; display: block; margin-top: 6px; object-fit: cover; }
.cap-form-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.cap-ck { border: 1px solid #d6d0c4; border-radius: 8px; overflow: hidden; }
.cap-gal { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
.cap-gal-item { display: flex; flex-direction: column; gap: 6px; padding: 10px; border: 1px solid #e7e2d8; border-radius: 9px; background: #fff; }
.cap-gal-img { max-width: 180px; max-height: 110px; object-fit: cover; border-radius: 7px; border: 1px solid #e7e2d8; }
`;

const EMPTY = {
  gallery: [],
  title: "",
  authors: "",
  excerpt: "",
  cover: "",
  body: "",
  links: "",
  tags: "",
  metaDescription: "",
  metaKeywords: "",
};

export default function ClinicArticlesPanel({ clinic, page, canWrite }) {
  const { t } = useTranslation("clinic");
  const clinicId = clinic?._id || clinic?.id;
  const pageId = page?._id || page?.id;
  const clinicSlug = clinic?.slug || "";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mode, setMode] = useState("list"); // list | form
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [galPhotoBusy, setGalPhotoBusy] = useState(false);

  const load = useCallback(async () => {
    if (!pageId) return;
    setLoading(true);
    try {
      const res = await listArticles({ pageId });
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

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
    setMode("form");
  };

  const openEdit = async (id) => {
    setError("");
    try {
      const res = await getArticle(id);
      const a = res.article || {};
      setForm({
        title: a.title || "",
        authors: a.authors || "",
        excerpt: a.excerpt || "",
        cover: a.cover || "",
        body: a.body || "",
        gallery: Array.isArray(a.gallery) ? a.gallery : [],
        links: a.links || "",
        tags: Array.isArray(a.tags) ? a.tags.join(", ") : "",
        metaDescription: a.metaDescription || "",
        metaKeywords: Array.isArray(a.metaKeywords)
          ? a.metaKeywords.join(", ")
          : "",
      });
      setEditingId(id);
      setMode("form");
    } catch {
      setError(t("publicPage.loadError", { defaultValue: "Ошибка загрузки." }));
    }
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ─── галерея статьи ───
  const addGalleryPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !clinicId) return;
    setGalPhotoBusy(true);
    setError("");
    try {
      const res = await uploadClinicAsset(clinicId, file);
      const url = res.url || res.asset || "";
      if (url) {
        setForm((f) => ({
          ...f,
          gallery: [
            ...(f.gallery || []),
            { image: url, caption: "", description: "" },
          ],
        }));
      }
    } catch {
      setError(
        t("publicPage.logoError", {
          defaultValue: "Не удалось загрузить фото.",
        }),
      );
    } finally {
      setGalPhotoBusy(false);
    }
  };

  const updateGalleryPhoto = (idx, key, val) =>
    setForm((f) => ({
      ...f,
      gallery: f.gallery.map((g, i) => (i === idx ? { ...g, [key]: val } : g)),
    }));

  const removeGalleryPhoto = (idx) =>
    setForm((f) => ({
      ...f,
      gallery: f.gallery.filter((_, i) => i !== idx),
    }));

  const handleCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !clinicId) return;
    setCoverBusy(true);
    setError("");
    try {
      const res = await uploadClinicAsset(clinicId, file);
      setField("cover", res.url || res.asset || "");
    } catch {
      setError(
        t("publicPage.logoError", {
          defaultValue: "Не удалось загрузить фото.",
        }),
      );
    } finally {
      setCoverBusy(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    setError("");
    const payload = {
      title: form.title.trim(),
      authors: form.authors,
      excerpt: form.excerpt,
      cover: form.cover,
      body: form.body,
      links: form.links,
      gallery: form.gallery,
      tags: form.tags, // строка → бэк (Zod) сам в массив
      metaDescription: form.metaDescription,
      metaKeywords: form.metaKeywords,
    };
    try {
      if (editingId) {
        await updateArticle(editingId, payload);
      } else {
        await createArticle({ ...payload, pageId });
      }
      setMode("list");
      setEditingId(null);
      setForm(EMPTY);
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

  const togglePublish = async (a) => {
    const next = a.status === "published" ? "draft" : "published";
    await publishArticle(a.id, next);
    await load();
  };

  const handleDelete = async (a) => {
    if (
      !window.confirm(
        t("publicPage.confirmDeleteArticle", {
          defaultValue: `Удалить статью «${a.title}»?`,
        }),
      )
    )
      return;
    await deleteArticle(a.id);
    await load();
  };

  // ─── форма ───
  if (mode === "form") {
    return (
      <div className="cap">
        <style>{CSS}</style>
        <div className="cap-head">
          <h3 className="cap-title">
            {editingId
              ? t("publicPage.editArticle", {
                  defaultValue: "Редактирование статьи",
                })
              : t("publicPage.newArticle", { defaultValue: "Новая статья" })}
          </h3>
          <button
            type="button"
            className="cap-btn cap-btn-ghost"
            onClick={() => {
              setMode("list");
              setEditingId(null);
              setForm(EMPTY);
            }}
          >
            {t("common.close", { defaultValue: "Закрыть" })}
          </button>
        </div>

        {error && <div className="cap-error">{error}</div>}

        <div className="cap-form">
          <div className="cap-row">
            <label>
              {t("publicPage.artTitle", { defaultValue: "Заголовок" })}
            </label>
            <input
              className="cap-input"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
            />
          </div>

          <div className="cap-row">
            <label>
              {t("publicPage.artAuthors", { defaultValue: "Авторы" })}
            </label>
            <input
              className="cap-input"
              value={form.authors}
              onChange={(e) => setField("authors", e.target.value)}
            />
          </div>

          <div className="cap-row">
            <label>
              {t("publicPage.artExcerpt", { defaultValue: "Аннотация" })}
            </label>
            <textarea
              className="cap-textarea"
              value={form.excerpt}
              onChange={(e) => setField("excerpt", e.target.value)}
            />
          </div>

          <div className="cap-row">
            <label>
              {t("publicPage.artCover", { defaultValue: "Обложка" })}
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={coverBusy}
              onChange={handleCover}
            />
            {coverBusy && (
              <span className="cap-hint">
                {t("common.saving", { defaultValue: "Загрузка…" })}
              </span>
            )}
            {form.cover && (
              <img className="cap-cover-prev" src={form.cover} alt="" />
            )}
          </div>

          <div className="cap-row">
            <label>{t("publicPage.artBody", { defaultValue: "Текст" })}</label>
            <div className="cap-ck">
              <CKEditor
                editor={ClassicEditor}
                data={form.body}
                config={{
                  language: "ru",
                  toolbar: [
                    "heading",
                    "|",
                    "bold",
                    "italic",
                    "link",
                    "|",
                    "bulletedList",
                    "numberedList",
                    "uploadImage",
                    "insertTable",
                    "|",
                    "undo",
                    "redo",
                  ],
                  ckfinder: {
                    uploadUrl: `${process.env.REACT_APP_API_URL}/uploads`,
                    withCredentials: true,
                  },
                }}
                onChange={(event, editor) => setField("body", editor.getData())}
              />
            </div>
          </div>

          <div className="cap-row">
            <label>
              {t("publicPage.artLinks", { defaultValue: "Ссылки / источники" })}
            </label>
            <input
              className="cap-input"
              value={form.links}
              onChange={(e) => setField("links", e.target.value)}
            />
          </div>

          {/* галерея статьи */}
          <div className="cap-row">
            <label>
              {t("publicPage.artGallery", { defaultValue: "Галерея статьи" })}
            </label>
            <div>
              <input
                type="file"
                accept="image/*"
                disabled={galPhotoBusy}
                onChange={addGalleryPhoto}
              />
              {galPhotoBusy && (
                <span className="cap-hint">
                  {" "}
                  {t("common.saving", { defaultValue: "Загрузка…" })}
                </span>
              )}
            </div>
            {Array.isArray(form.gallery) && form.gallery.length > 0 && (
              <div className="cap-gal">
                {form.gallery.map((g, i) => (
                  <div className="cap-gal-item" key={i}>
                    <img className="cap-gal-img" src={g.image} alt="" />
                    <input
                      className="cap-input"
                      style={{ fontSize: 13, padding: "5px 8px" }}
                      value={g.caption}
                      placeholder={t("publicPage.photoCaption", {
                        defaultValue: "Подпись",
                      })}
                      onChange={(e) =>
                        updateGalleryPhoto(i, "caption", e.target.value)
                      }
                    />
                    <textarea
                      className="cap-textarea"
                      style={{ minHeight: 40, fontSize: 13 }}
                      value={g.description}
                      placeholder={t("publicPage.photoDescription", {
                        defaultValue: "Описание",
                      })}
                      onChange={(e) =>
                        updateGalleryPhoto(i, "description", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="cap-act danger"
                      style={{ alignSelf: "flex-start" }}
                      onClick={() => removeGalleryPhoto(i)}
                    >
                      {t("common.remove", { defaultValue: "Удалить" })}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cap-row">
            <label>{t("publicPage.artTags", { defaultValue: "Теги" })}</label>
            <input
              className="cap-input"
              value={form.tags}
              onChange={(e) => setField("tags", e.target.value)}
            />
            <span className="cap-hint">
              {t("publicPage.csvHint", { defaultValue: "Через запятую." })}
            </span>
          </div>

          <div className="cap-row">
            <label>
              {t("publicPage.artMetaDesc", { defaultValue: "Мета-описание" })}
            </label>
            <input
              className="cap-input"
              value={form.metaDescription}
              onChange={(e) => setField("metaDescription", e.target.value)}
            />
          </div>

          <div className="cap-row">
            <label>
              {t("publicPage.artMetaKeywords", {
                defaultValue: "Мета-ключевые слова",
              })}
            </label>
            <input
              className="cap-input"
              value={form.metaKeywords}
              onChange={(e) => setField("metaKeywords", e.target.value)}
            />
            <span className="cap-hint">
              {t("publicPage.csvHint", { defaultValue: "Через запятую." })}
            </span>
          </div>

          <div className="cap-form-actions">
            <button
              type="button"
              className="cap-btn cap-btn-primary"
              disabled={saving || !form.title.trim()}
              onClick={handleSave}
            >
              {saving
                ? t("common.saving", { defaultValue: "Сохранение…" })
                : t("common.save", { defaultValue: "Сохранить" })}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── список ───
  return (
    <div className="cap">
      <style>{CSS}</style>
      <div className="cap-head">
        <h3 className="cap-title">
          {t("publicPage.articlesOf", { defaultValue: "Статьи категории" })}:{" "}
          {page?.title}
        </h3>
        {canWrite && (
          <button
            type="button"
            className="cap-btn cap-btn-primary"
            onClick={openCreate}
          >
            {t("publicPage.addArticle", { defaultValue: "+ Статья" })}
          </button>
        )}
      </div>

      {error && <div className="cap-error">{error}</div>}

      {loading ? (
        <p style={{ color: "#78716c", fontSize: 13 }}>
          {t("common.loading", { defaultValue: "Загрузка…" })}
        </p>
      ) : items.length === 0 ? (
        <div className="cap-empty">
          {t("publicPage.noArticles", {
            defaultValue: "Пока нет статей. Добавьте первую.",
          })}
        </div>
      ) : (
        <div className="cap-list">
          {items.map((a) => (
            <div className="cap-item" key={a.id}>
              <span className="cap-item-title">{a.title}</span>
              {a.moderation === "disabled" && (
                <span className="cap-badge disabled">
                  {t("publicPage.artDisabled", { defaultValue: "заблок." })}
                </span>
              )}
              <span className={"cap-badge " + a.status}>
                {a.status === "published"
                  ? t("publicPage.statusPublished", { defaultValue: "опубл." })
                  : t("publicPage.statusDraft", { defaultValue: "черновик" })}
              </span>
              {a.status === "published" && clinicSlug && page?.slug && (
                <a
                  className="cap-act"
                  href={`/clinics/${clinicSlug}/dp/${page.slug}/articles/${a.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("publicPage.openPage", { defaultValue: "открыть" })}
                </a>
              )}
              <button
                type="button"
                className="cap-act"
                onClick={() => openEdit(a.id)}
              >
                {t("common.edit", { defaultValue: "Редактировать" })}
              </button>
              {canWrite && (
                <>
                  <button
                    type="button"
                    className="cap-act"
                    onClick={() => togglePublish(a)}
                  >
                    {a.status === "published"
                      ? t("publicPage.unpublish", {
                          defaultValue: "В черновик",
                        })
                      : t("publicPage.publish", {
                          defaultValue: "Опубликовать",
                        })}
                  </button>
                  <button
                    type="button"
                    className="cap-act danger"
                    onClick={() => handleDelete(a)}
                  >
                    {t("common.remove", { defaultValue: "Удалить" })}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
