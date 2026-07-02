// client/src/pages/clinic/ClinicCustomPagesPage/ClinicCustomPagesPage.jsx
//
// ВИТРИНА 2.0 (Часть 2, Этап 4 + Часть 3, Этап 5) — управление кастомными
// страницами сайта + статьями категорий.
//
// Список страниц клиники (создать / опубликовать-снять / удалить) + редактор
// выбранной страницы через PageLayoutEditor (конструктор блоков). У каждой
// страницы кнопка «Статьи» → панель ClinicArticlesPanel (CRUD статей категории).
//
// Данные клиники (getClinicMe) нужны для темы превью + прав (canWrite).

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  getClinicMe,
  listCustomPages,
  createCustomPage,
  getCustomPage,
  updateCustomPage,
  publishCustomPage,
  deleteCustomPage,
} from "../../../api/clinic";
import PageLayoutEditor from "../vitrina/layout/PageLayoutEditor.jsx";
import ClinicArticlesPanel from "./ClinicArticlesPanel.jsx";
import ClinicGalleryPanel from "./ClinicGalleryPanel.jsx";

const CSS = `
.ccp { max-width: 1280px; margin: 0 auto; padding: 24px; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
.ccp-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.ccp-title { font-size: 22px; font-weight: 700; color: #292524; margin: 0; }
.ccp-new { display: flex; gap: 8px; flex-wrap: wrap; }
.ccp-input { border: 1px solid #d6d0c4; border-radius: 8px; padding: 8px 12px; font-size: 14px; }
.ccp-btn { border: none; border-radius: 8px; padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
.ccp-btn-primary { background: #0f766e; color: #fff; }
.ccp-btn-primary:disabled { opacity: .5; cursor: default; }
.ccp-btn-ghost { background: #f5f3ef; color: #44403c; }
.ccp-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
.ccp-item { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #e7e2d8; border-radius: 10px; padding: 12px 16px; flex-wrap: wrap; }
.ccp-item.active { border-color: #0f766e; box-shadow: 0 0 0 1px #0f766e; }
.ccp-item.articles-open { border-color: #0f766e; }
.ccp-item-title { flex: 1; font-size: 15px; font-weight: 600; color: #292524; }
.ccp-item-sub { background: #faf9f6; }
.ccp-sub-mark { color: #a8a29e; font-size: 14px; margin-right: 2px; }
.ccp-parent-sel { border: 1px solid #d6d0c4; border-radius: 6px; padding: 4px 8px; font-size: 12px; color: #57534e; background: #fff; cursor: pointer; max-width: 160px; }
.ccp-item-slug { font-size: 12px; color: #a8a29e; font-family: monospace; }
.ccp-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 100px; text-transform: uppercase; }
.ccp-badge.published { background: #def7ec; color: #1a6b3c; }
.ccp-badge.draft { background: #fef3c7; color: #b5870a; }
.ccp-act { border: none; background: transparent; cursor: pointer; font-size: 13px; color: #0f766e; font-weight: 600; padding: 4px 8px; border-radius: 6px; }
.ccp-act:hover { background: #f5f3ef; }
.ccp-act.danger { color: #c0392b; }
.ccp-act.on { background: #0f766e; color: #fff; }
.ccp-empty { padding: 32px; text-align: center; color: #a8a29e; font-size: 14px; border: 1px dashed #d6d0c4; border-radius: 10px; }
.ccp-editor { border-top: 2px solid #e7e2d8; padding-top: 20px; }
.ccp-editor-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.ccp-editor-title { font-size: 18px; font-weight: 700; color: #292524; margin: 0; }
.ccp-error { background: #fdecea; color: #c0392b; border: 1px solid #f5c6cb; border-radius: 8px; padding: 10px 14px; font-size: 14px; margin-bottom: 14px; }
.ccp-link { font-size: 12px; color: #0f766e; }
`;

export default function ClinicCustomPagesPage() {
  const { t } = useTranslation("clinic");

  const [clinic, setClinic] = useState(null);
  const [canWrite, setCanWrite] = useState(false);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newParentId, setNewParentId] = useState(""); // "" = корневая категория
  const [creating, setCreating] = useState(false);

  const [activeId, setActiveId] = useState(null);
  const [articlesFor, setArticlesFor] = useState(null); // page object, для которого открыта панель статей
  const [galleryFor, setGalleryFor] = useState(null); // page object, для которого открыта панель галереи
  const [activePage, setActivePage] = useState(null); // полный объект с layout

  const loadPages = useCallback(async () => {
    const res = await listCustomPages();
    setPages(res.items || []);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getClinicMe(), listCustomPages()])
      .then(([me, list]) => {
        if (!alive) return;
        setClinic(me?.clinic || null);
        setCanWrite(
          Boolean(me?.permissions?.includes?.("clinic.write")) ||
            me?.role === "owner" ||
            me?.role === "admin",
        );
        setPages(list.items || []);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(
          t("publicPage.loadError", { defaultValue: "Ошибка загрузки." }),
        );
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [t]);

  // сменить родителя категории ("" → открепить, сделать корневой)
  const handleChangeParent = async (page, parentId) => {
    setError("");
    try {
      await updateCustomPage(page.id, { parentId: parentId || null });
      await loadPages();
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          t("publicPage.saveError", { defaultValue: "Не удалось сохранить." }),
      );
    }
  };

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title || creating) return;
    setCreating(true);
    setError("");
    try {
      const res = await createCustomPage({
        title,
        parentId: newParentId || null,
      });
      setNewTitle("");
      setNewParentId("");
      await loadPages();
      // сразу открыть в редакторе
      openEditor(res.page?._id || res.page?.id);
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          t("publicPage.createError", {
            defaultValue: "Не удалось создать страницу.",
          }),
      );
    } finally {
      setCreating(false);
    }
  };

  const openEditor = async (id) => {
    if (!id) return;
    setActiveId(id);
    setActivePage(null);
    setArticlesFor(null); // закрываем панели при входе в конструктор
    setGalleryFor(null);
    try {
      const res = await getCustomPage(id);
      setActivePage(res.page || null);
    } catch {
      setError(t("publicPage.loadError", { defaultValue: "Ошибка загрузки." }));
    }
  };

  const handleSaveBlocks = async (blocks) => {
    if (!activeId) return;
    await updateCustomPage(activeId, { layout: { blocks } });
    await loadPages();
  };

  const togglePublish = async (page) => {
    const next = page.status === "published" ? "draft" : "published";
    await publishCustomPage(page.id, next);
    await loadPages();
  };

  const toggleArticles = (page) => {
    setArticlesFor((cur) => (cur?.id === page.id ? null : page));
    setGalleryFor(null);
    setActiveId(null);
    setActivePage(null);
  };

  const toggleGallery = (page) => {
    setGalleryFor((cur) => (cur?.id === page.id ? null : page));
    setArticlesFor(null);
    setActiveId(null);
    setActivePage(null);
  };

  const handleDelete = async (page) => {
    if (
      !window.confirm(
        t("publicPage.confirmDeletePage", {
          defaultValue: `Удалить страницу «${page.title}»?`,
        }),
      )
    )
      return;
    await deleteCustomPage(page.id);
    if (activeId === page.id) {
      setActiveId(null);
      setActivePage(null);
    }
    if (articlesFor?.id === page.id) setArticlesFor(null);
    if (galleryFor?.id === page.id) setGalleryFor(null);
    await loadPages();
  };

  if (loading) {
    return (
      <div className="ccp">
        <style>{CSS}</style>
        <p style={{ color: "#78716c" }}>
          {t("common.loading", { defaultValue: "Загрузка…" })}
        </p>
      </div>
    );
  }

  const clinicSlug = clinic?.slug || "";

  // упорядоченный список с вложенностью: каждый родитель, затем его дети.
  // depth=0 — корневая категория, depth=1 — подкатегория.
  const orderedPages = [];
  const roots = pages.filter((p) => !p.parentId);
  const childrenOf = (id) =>
    pages.filter((p) => String(p.parentId) === String(id));
  for (const root of roots) {
    orderedPages.push({ ...root, _depth: 0 });
    for (const child of childrenOf(root.id)) {
      orderedPages.push({ ...child, _depth: 1 });
    }
  }
  // подкатегории-сироты (если родитель не в списке) — на всякий случай в конец
  for (const p of pages) {
    if (p.parentId && !roots.some((r) => String(r.id) === String(p.parentId))) {
      if (!orderedPages.some((o) => o.id === p.id)) {
        orderedPages.push({ ...p, _depth: 1 });
      }
    }
  }

  return (
    <div className="ccp">
      <style>{CSS}</style>

      <div className="ccp-head">
        <h1 className="ccp-title">
          {t("publicPage.customPagesTitle", { defaultValue: "Страницы сайта" })}
        </h1>
        {canWrite && (
          <div className="ccp-new">
            <input
              className="ccp-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t("publicPage.newPageTitle", {
                defaultValue: "Название новой страницы",
              })}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <select
              className="ccp-input"
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
              title={t("publicPage.parentCategory", {
                defaultValue: "Родительская категория",
              })}
            >
              <option value="">
                {t("publicPage.noParent", {
                  defaultValue: "— Корневая категория —",
                })}
              </option>
              {pages
                .filter((p) => !p.parentId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {t("publicPage.subOf", { defaultValue: "Подкатегория:" })}{" "}
                    {p.title}
                  </option>
                ))}
            </select>
            <button
              type="button"
              className="ccp-btn ccp-btn-primary"
              disabled={creating || !newTitle.trim()}
              onClick={handleCreate}
            >
              {t("publicPage.createPage", { defaultValue: "Создать" })}
            </button>
          </div>
        )}
      </div>

      {error && <div className="ccp-error">{error}</div>}

      {pages.length === 0 ? (
        <div className="ccp-empty">
          {t("publicPage.noPages", {
            defaultValue: "Пока нет страниц. Создайте первую выше.",
          })}
        </div>
      ) : (
        <div className="ccp-list">
          {orderedPages.map((p) => (
            <React.Fragment key={p.id}>
              <div
                className={
                  "ccp-item" +
                  (activeId === p.id ? " active" : "") +
                  (articlesFor?.id === p.id ? " articles-open" : "") +
                  (p._depth === 1 ? " ccp-item-sub" : "")
                }
                style={p._depth === 1 ? { marginLeft: 28 } : undefined}
              >
                {p._depth === 1 && <span className="ccp-sub-mark">↳</span>}
                <span className="ccp-item-title">{p.title}</span>
                <span className="ccp-item-slug">/dp/{p.slug}</span>
                <span className={"ccp-badge " + p.status}>
                  {p.status === "published"
                    ? t("publicPage.statusPublished", {
                        defaultValue: "опубликована",
                      })
                    : t("publicPage.statusDraft", { defaultValue: "черновик" })}
                </span>
                {p.status === "published" && clinicSlug && (
                  <a
                    className="ccp-link"
                    href={`/clinics/${clinicSlug}/dp/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("publicPage.openPage", { defaultValue: "открыть" })}
                  </a>
                )}
                <button
                  type="button"
                  className="ccp-act"
                  onClick={() => openEditor(p.id)}
                >
                  {t("common.edit", { defaultValue: "Редактировать" })}
                </button>
                <button
                  type="button"
                  className={
                    "ccp-act" + (articlesFor?.id === p.id ? " on" : "")
                  }
                  onClick={() => toggleArticles(p)}
                >
                  {t("publicPage.articlesBtn", { defaultValue: "Статьи" })}
                </button>
                <button
                  type="button"
                  className={"ccp-act" + (galleryFor?.id === p.id ? " on" : "")}
                  onClick={() => toggleGallery(p)}
                >
                  {t("publicPage.galleryBtn", { defaultValue: "Галерея" })}
                </button>
                {canWrite && (
                  <>
                    <button
                      type="button"
                      className="ccp-act"
                      onClick={() => togglePublish(p)}
                    >
                      {p.status === "published"
                        ? t("publicPage.unpublish", {
                            defaultValue: "В черновик",
                          })
                        : t("publicPage.publish", {
                            defaultValue: "Опубликовать",
                          })}
                    </button>
                    <button
                      type="button"
                      className="ccp-act danger"
                      onClick={() => handleDelete(p)}
                    >
                      {t("common.remove", { defaultValue: "Удалить" })}
                    </button>
                    <select
                      className="ccp-parent-sel"
                      value={p.parentId || ""}
                      onChange={(e) => handleChangeParent(p, e.target.value)}
                      title={t("publicPage.parentCategory", {
                        defaultValue: "Родительская категория",
                      })}
                    >
                      <option value="">
                        {t("publicPage.noParent", {
                          defaultValue: "— Корневая —",
                        })}
                      </option>
                      {pages
                        .filter(
                          (cand) =>
                            !cand.parentId && // кандидат сам корневой
                            cand.id !== p.id && // не сам себе
                            !pages.some(
                              (x) => String(x.parentId) === String(p.id),
                            ), // у p нет своих детей
                        )
                        .map((cand) => (
                          <option key={cand.id} value={cand.id}>
                            ↳ {cand.title}
                          </option>
                        ))}
                    </select>
                  </>
                )}
              </div>

              {/* панель статей этой страницы-категории */}
              {articlesFor?.id === p.id && (
                <ClinicArticlesPanel
                  clinic={clinic}
                  page={articlesFor}
                  canWrite={canWrite}
                />
              )}

              {galleryFor?.id === p.id && (
                <ClinicGalleryPanel
                  clinic={clinic}
                  page={galleryFor}
                  canWrite={canWrite}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {activeId && (
        <div className="ccp-editor">
          <div className="ccp-editor-head">
            <h2 className="ccp-editor-title">
              {activePage?.title ||
                t("publicPage.editingPage", { defaultValue: "Редактирование" })}
            </h2>
            <button
              type="button"
              className="ccp-btn ccp-btn-ghost"
              onClick={() => {
                setActiveId(null);
                setActivePage(null);
              }}
            >
              {t("common.close", { defaultValue: "Закрыть" })}
            </button>
          </div>

          {activePage ? (
            <PageLayoutEditor
              clinic={clinic}
              page={activePage}
              canWrite={canWrite}
              onSave={handleSaveBlocks}
            />
          ) : (
            <p style={{ color: "#78716c" }}>
              {t("common.loading", { defaultValue: "Загрузка…" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
