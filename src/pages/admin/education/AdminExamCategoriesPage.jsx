// client/src/pages/admin/education/AdminExamCategoriesPage.jsx
//
// Админка → Тесты → Категории. Маршрут: /admin/education-categories
//
// Полный аналог «Категорий статей», но для рубрикатора тестов. Админ сам
// создаёт и именует категории («Международные экзамены») и подкатегории
// внутри них; изначально ничего не задано. По этим рубрикам строится
// витрина /education.
//
// Глубина ограничена двумя уровнями (категория → подкатегория): так же
// устроена витрина и деление больших тестов на блоки.

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  readApiError,
  isAuthError,
} from "../../../api/education";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import "../../education/education.css";

// Языки совпадают с EXAM_LANGUAGES на бэкенде.
const LANG_CODES = ["ru", "en", "az", "tr", "ar"];

// lang — язык, на котором админ набирает имя рубрики. От него зависит две
// вещи: с какого языка переводить на остальные четыре и к какому языку
// рубрика относится в каталоге. По умолчанию берём рабочий язык админа: он
// набирает имя на нём, а не на русском «потому что так в форме стояло».
const EMPTY_FORM = {
  name: "",
  parentId: "",
  description: "",
  icon: "",
  order: 0,
  lang: "",
};

// Иконки рубрик. Раньше класс вписывали руками, и опечатка («bi bi-globus»)
// давала на витрине пустой кружок — ошибку было видно только там.
// Значение поля — готовый класс bootstrap-icons: ровно то, что понимает
// CategoryIcon на витрине (ветка "bi ").
//
// Набор академический и медицинско-экзаменационный; все имена проверены по
// public/assets/vendor/bootstrap-icons (v1.11.1), который отдаёт index.html.
const ACADEMIC_ICONS = [
  "mortarboard",
  "journal-check",
  "journal-medical",
  "book",
  "clipboard-check",
  "list-check",
  "patch-check",
  "award",
  "trophy",
  "person-badge",
  "people-fill",
  "bank",
  "building",
  "hospital",
  "heart-pulse",
  "activity",
  "capsule",
  "prescription2",
  "bandaid",
  "thermometer",
  "globe",
  "flag",
  "stopwatch",
  "lightbulb",
  "pencil-square",
  "graph-up",
].map((name) => `bi bi-${name}`);

// Иконка рубрики: класс bootstrap-icons или эмодзи (старые категории могли
// завести эмодзи руками). Пусто — рисуем прочерк, чтобы поле не выглядело
// сломанным.
function IconGlyph({ icon, fallback = "—" }) {
  if (icon && icon.startsWith("bi ")) {
    return <i className={icon} aria-hidden="true" />;
  }
  return <span aria-hidden="true">{icon || fallback}</span>;
}

// Выпадающий список иконок с живым превью выбранной.
//
// В <option> иконку шрифтом не отрисовать — браузер рендерит там только
// текст, — поэтому в списке названия, а сама иконка показана рядом.
function IconSelect({ value, onChange, t }) {
  // Значение, заведённое до появления списка (эмодзи или чужой класс), не
  // теряем: добавляем отдельным пунктом. Иначе первое же сохранение из
  // формы редактирования молча стёрло бы иконку.
  const custom = value && !ACADEMIC_ICONS.includes(value) ? value : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        className="edu-cat-admin-icon"
        style={{ flex: "0 0 auto" }}
        title={value || ""}
      >
        <IconGlyph icon={value} />
      </span>
      <select
        className="edu-select"
        style={{ flex: 1, minWidth: 0 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t("adminCategories.form.iconNone")}</option>
        {custom && (
          <option value={custom}>
            {t("adminCategories.form.iconCustom", { icon: custom })}
          </option>
        )}
        {ACADEMIC_ICONS.map((cls) => (
          <option key={cls} value={cls}>
            {t(`adminCategories.icons.${cls.replace("bi bi-", "")}`)}
          </option>
        ))}
      </select>
    </div>
  );
}

// Дерево произвольной глубины разворачиваем в плоский список с отступом —
// для выпадающих списков «Родитель» и рекурсивной отрисовки.
function flattenTree(nodes, depth = 0, acc = []) {
  for (const n of nodes) {
    acc.push({ node: n, depth });
    flattenTree(n.children || [], depth + 1, acc);
  }
  return acc;
}

// Все потомки узла — чтобы при смене родителя не предлагать вложить категорию
// в саму себя или в своё же поддерево (сервер это тоже запрещает).
function collectDescendantIds(node, acc = new Set()) {
  for (const c of node.children || []) {
    acc.add(c.id);
    collectDescendantIds(c, acc);
  }
  return acc;
}

export default function AdminExamCategoriesPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("education");
  // Рабочий язык админа — умолчание для новой рубрики: имя он набирает на
  // нём, а не на русском «потому что так стояло в форме».
  const uiLang = LANG_CODES.includes(i18n.language) ? i18n.language : "ru";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Форма создания.
  const [form, setForm] = useState(EMPTY_FORM);

  // Инлайн-редактирование: id узла и его поля.
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const handleApiError = useCallback(
    (err, fallback) => {
      if (isAuthError(err)) {
        navigate("/login");
        return;
      }
      setError(readApiError(err, fallback));
    },
    [navigate],
  );

  const load = useCallback(async () => {
    try {
      const cats = await fetchCategories({ scope: "all" });
      setCategories(cats);
    } catch (err) {
      handleApiError(err, t("adminCategories.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [handleApiError, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError(t("adminCategories.errors.nameRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await createCategory({
        name,
        lang: form.lang || uiLang,
        parentId: form.parentId || null,
        description: form.description.trim() || undefined,
        icon: form.icon.trim() || undefined,
        order: Number(form.order) || 0,
      });
      setNotice(
        form.parentId
          ? t("adminCategories.notices.subcategoryCreated", { name })
          : t("adminCategories.notices.categoryCreated", { name }),
      );
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      handleApiError(err, t("adminCategories.errors.createFailed"));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(node) {
    setEditId(node.id);
    setEditForm({
      name: node.name,
      lang: node.lang || "",
      parentId: node.parentId || "",
      description: node.description || "",
      icon: node.icon || "",
      order: node.order ?? 0,
    });
    setError(null);
    setNotice(null);
  }

  async function handleUpdate() {
    const name = editForm.name.trim();
    if (!name) {
      setError(t("adminCategories.errors.emptyName"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateCategory(editId, {
        name,
        // Смена языка пересобирает переводы: имя на другом языке — другой
        // исходник, и старые переводы к нему не относятся.
        lang: editForm.lang || undefined,
        parentId: editForm.parentId || null,
        description: editForm.description.trim(),
        icon: editForm.icon.trim(),
        order: Number(editForm.order) || 0,
      });
      setNotice(t("adminCategories.notices.saved", { name }));
      setEditId(null);
      await load();
    } catch (err) {
      handleApiError(err, t("adminCategories.errors.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(node) {
    const confirmed = window.confirm(
      t("adminCategories.confirms.delete", { name: node.name }),
    );
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await deleteCategory(node.id);
      setNotice(t("adminCategories.notices.deleted", { name: node.name }));
      await load();
    } catch (err) {
      // Сервер блокирует удаление непустой категории — показываем причину.
      handleApiError(err, t("adminCategories.errors.deleteFailed"));
    } finally {
      setBusy(false);
    }
  }

  // Плоский список всех узлов дерева (с глубиной) для выпадающих списков.
  const flat = flattenTree(categories);

  function renderEditRow(node) {
    // Нельзя переместить категорию в саму себя или в своё поддерево.
    const banned = new Set([node.id, ...collectDescendantIds(node)]);
    return (
      <div className="edu-card" style={{ marginBottom: 10 }}>
        <div className="edu-form-row">
          <div>
            <div className="edu-field-label" style={{ marginTop: 0 }}>
              {t("adminCategories.form.name")}
            </div>
            <input
              className="edu-input"
              value={editForm.name}
              autoFocus
              onChange={(e) =>
                setEditForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>
          <div>
            <div className="edu-field-label" style={{ marginTop: 0 }}>
              {t("adminCategories.form.lang")}
            </div>
            <select
              className="edu-select"
              value={editForm.lang}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, lang: e.target.value }))
              }
            >
              {LANG_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`shared.langs.${code}`, { defaultValue: code })}
                </option>
              ))}
            </select>
            <div className="edu-hint">{t("adminCategories.form.langHint")}</div>
          </div>
          <div>
            <div className="edu-field-label" style={{ marginTop: 0 }}>
              {t("adminCategories.form.parent")}
            </div>
            <select
              className="edu-select"
              value={editForm.parentId}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, parentId: e.target.value }))
              }
            >
              <option value="">{t("adminCategories.form.topLevelEdit")}</option>
              {flat
                .filter(({ node: n }) => !banned.has(n.id))
                .map(({ node: n, depth }) => (
                  <option key={n.id} value={n.id}>
                    {`${"— ".repeat(depth)}${n.name}`}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <div className="edu-field-label" style={{ marginTop: 0 }}>
              {t("adminCategories.form.icon")}
            </div>
            <IconSelect
              value={editForm.icon}
              onChange={(icon) => setEditForm((f) => ({ ...f, icon }))}
              t={t}
            />
          </div>
          <div>
            <div className="edu-field-label" style={{ marginTop: 0 }}>
              {t("adminCategories.form.order")}
            </div>
            <input
              className="edu-input"
              type="number"
              value={editForm.order}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, order: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="edu-field-label">
          {t("adminCategories.form.description")}
        </div>
        <textarea
          className="edu-textarea"
          rows={2}
          value={editForm.description}
          onChange={(e) =>
            setEditForm((f) => ({ ...f, description: e.target.value }))
          }
        />
        <div className="edu-btn-row">
          <button
            type="button"
            className="edu-btn"
            disabled={busy}
            onClick={handleUpdate}
          >
            {t("shared.actions.save")}
          </button>
          <button
            type="button"
            className="edu-btn edu-btn--ghost"
            onClick={() => setEditId(null)}
          >
            {t("shared.actions.cancel")}
          </button>
        </div>
      </div>
    );
  }

  function renderNode(node, depth) {
    const children = node.children ?? [];
    return (
      <div key={node.id}>
        {editId === node.id ? (
          <div style={{ paddingLeft: depth * 24 }}>{renderEditRow(node)}</div>
        ) : (
          <div
            className="edu-cat-admin-row"
            style={depth > 0 ? { paddingLeft: depth * 24 } : undefined}
          >
            <div className="edu-cat-admin-main">
              {/* Класс bootstrap-icons надо рисовать иконкой, а не печатать
                  строкой «bi bi-mortarboard» — до этого в списке было видно
                  именно её. */}
              <span className="edu-cat-admin-icon">
                <IconGlyph
                  icon={node.icon}
                  fallback={
                    depth > 0 ? "•" : node.name.charAt(0).toUpperCase()
                  }
                />
              </span>
              <div>
                <div className="edu-cat-admin-name">{node.name}</div>
                <div className="edu-list-item-meta">
                  {t("adminCategories.node.directPrograms", {
                    count: node.directProgramCount,
                  })}
                  {children.length
                    ? ` · ${t("adminCategories.node.children", {
                        count: children.length,
                      })}`
                    : ""}
                  {node.description ? ` · ${node.description}` : ""}
                </div>
              </div>
            </div>
            <div className="edu-cat-admin-actions">
              <button
                type="button"
                className="edu-btn edu-btn--ghost"
                disabled={busy}
                onClick={() => startEdit(node)}
              >
                {t("adminCategories.actions.edit")}
              </button>
              <button
                type="button"
                className="edu-btn edu-btn--danger"
                disabled={busy}
                onClick={() => handleDelete(node)}
              >
                {t("shared.actions.delete")}
              </button>
            </div>
          </div>
        )}
        {children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="edu-page edu-page--wide">
        <div className="edu-state">{t("shared.actions.loading")}</div>
      </div>
    );
  }

  return (
    <div className="edu-page edu-page--wide">
      {/* Переключатель языка: сама админка не переведена вовсе, и без
          него оператор не мог вернуть модуль на русский — значение
          языка общее для всего сайта и меняется только на витрине. */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <h1 className="edu-title">{t("adminCategories.title")}</h1>
          <p className="edu-subtitle">{t("adminCategories.subtitle")}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {error && <div className="edu-error">{error}</div>}
      {notice && <div className="edu-notice">{notice}</div>}

      {/* ─── Создание ─── */}
      <div className="edu-card">
        <h2 className="edu-card-title">{t("adminCategories.form.newCategory")}</h2>
        <form onSubmit={handleCreate}>
          <div className="edu-form-row">
            <div>
              <div className="edu-field-label" style={{ marginTop: 0 }}>
                {t("adminCategories.form.name")}
              </div>
              <input
                className="edu-input"
                placeholder={t("adminCategories.form.namePlaceholder")}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <div className="edu-field-label" style={{ marginTop: 0 }}>
                {t("adminCategories.form.lang")}
              </div>
              <select
                className="edu-select"
                value={form.lang || uiLang}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lang: e.target.value }))
                }
              >
                {LANG_CODES.map((code) => (
                  <option key={code} value={code}>
                    {t(`shared.langs.${code}`, { defaultValue: code })}
                  </option>
                ))}
              </select>
              <div className="edu-hint">
                {t("adminCategories.form.langHint")}
              </div>
            </div>
            <div>
              <div className="edu-field-label" style={{ marginTop: 0 }}>
                {t("adminCategories.form.parent")}
              </div>
              <select
                className="edu-select"
                value={form.parentId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parentId: e.target.value }))
                }
              >
                <option value="">{t("adminCategories.form.topLevel")}</option>
                {flat.map(({ node: n, depth }) => (
                  <option key={n.id} value={n.id}>
                    {`${"— ".repeat(depth + 1)}${n.name}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="edu-field-label" style={{ marginTop: 0 }}>
                {t("adminCategories.form.icon")}
              </div>
              <IconSelect
                value={form.icon}
                onChange={(icon) => setForm((f) => ({ ...f, icon }))}
                t={t}
              />
            </div>
            <div>
              <div className="edu-field-label" style={{ marginTop: 0 }}>
                {t("adminCategories.form.order")}
              </div>
              <input
                className="edu-input"
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, order: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="edu-field-label">
            {t("adminCategories.form.description")}
          </div>
          <textarea
            className="edu-textarea"
            rows={2}
            placeholder={t("adminCategories.form.descriptionPlaceholder")}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <div className="edu-btn-row">
            <button type="submit" className="edu-btn" disabled={busy}>
              {busy ? "…" : t("adminCategories.actions.create")}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Дерево ─── */}
      {categories.length === 0 ? (
        <div className="edu-state">{t("adminCategories.empty")}</div>
      ) : (
        <div className="edu-card">
          <h2 className="edu-card-title">
            {t("adminCategories.allCategories")}
          </h2>
          {categories.map((top) => renderNode(top, 0))}
        </div>
      )}
    </div>
  );
}
