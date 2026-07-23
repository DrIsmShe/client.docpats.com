// client/src/pages/admin/education/AdminExamProgramsPage.jsx
//
// Админка → Тесты → Список тестов. Маршрут: /admin/education-programs
//
// Недостающее звено цепочки. Раньше админ мог загрузить файл и
// опубликовать вопросы — и всё равно не увидеть теста на витрине, потому
// что сама программа оставалась черновиком, а публиковать её было неоткуда.
//
// Публикация вопроса и публикация теста — разные решения. Вопросы можно
// накапливать месяцами, а тест открыть учащимся один раз, когда он готов.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchPrograms,
  fetchItems,
  fetchCategories,
  updateProgram,
  archiveProgram,
  hardDeleteProgram,
  readApiError,
  isAuthError,
} from "../../../api/education";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import "../../education/education.css";

// Языки совпадают с EXAM_LANGUAGES на бэкенде и с локалями фронтенда.
// Порядок здесь задаёт порядок в выпадающем списке.
const LANG_CODES = ["ru", "en", "az", "tr", "ar"];

export default function AdminExamProgramsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("education");

  const [programs, setPrograms] = useState([]);
  const [pendingByProgram, setPendingByProgram] = useState({});
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [blockDraft, setBlockDraft] = useState({}); // programId -> строка
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Панель фильтров.
  const [searchText, setSearchText] = useState("");
  const [langFilter, setLangFilter] = useState(""); // "" = все языки
  const [statusFilter, setStatusFilter] = useState("active"); // active|draft|published|archived|all
  const [sortBy, setSortBy] = useState("title"); // title|questions_desc|questions_asc|newest

  // Переименование: id программы, которую сейчас правят, и новое название.
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

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
      // Вопросы на ревью считаем отдельно: в программе хранится только
      // счётчик опубликованных, а админу важно видеть и незакрытый хвост.
      const [list, inReview, drafts, cats] = await Promise.all([
        fetchPrograms({ scope: "all", limit: 500 }),
        fetchItems({ status: "in_review", limit: 500 }),
        fetchItems({ status: "draft", limit: 500 }),
        fetchCategories({ scope: "all" }),
      ]);

      const pending = {};
      for (const item of [...inReview, ...drafts]) {
        const key = String(item.programId);
        pending[key] = (pending[key] ?? 0) + 1;
      }

      // Плоский список рубрик для выпадающего списка: дерево произвольной
      // глубины разворачиваем рекурсивно, отступом показываем вложенность —
      // чтобы админ мог привязать тест к любому узлу на любом уровне.
      const options = [];
      const walkCats = (nodes, depth) => {
        for (const n of nodes) {
          options.push({ value: n.id, label: `${"\u2014 ".repeat(depth)}${n.name}` });
          walkCats(n.children ?? [], depth + 1);
        }
      };
      walkCats(cats, 0);

      setPrograms(list);
      setPendingByProgram(pending);
      setCategoryOptions(options);
      setBlockDraft(
        Object.fromEntries(
          list.map((p) => [String(p._id), p.blockSize ? String(p.blockSize) : ""]),
        ),
      );
    } catch (err) {
      handleApiError(err, t("adminPrograms.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [handleApiError, t]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const arr = programs.filter((p) => {
      // Статус.
      if (statusFilter === "active" && p.status === "archived") return false;
      if (
        ["draft", "published", "archived"].includes(statusFilter) &&
        p.status !== statusFilter
      ) {
        return false;
      }
      // Язык: программа подходит, если у неё есть вопросы на этом языке.
      if (langFilter && !(p.languages ?? []).includes(langFilter)) return false;
      // Поиск по названию / коду / органу.
      if (
        q &&
        ![p.title, p.code, p.authority]
          .filter(Boolean)
          .some((s) => s.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });

    const sorted = [...arr].sort((a, b) => {
      if (sortBy === "questions_desc")
        return (b.publishedItemCount ?? 0) - (a.publishedItemCount ?? 0);
      if (sortBy === "questions_asc")
        return (a.publishedItemCount ?? 0) - (b.publishedItemCount ?? 0);
      if (sortBy === "newest")
        return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
      return String(a.title).localeCompare(String(b.title), "ru");
    });
    return sorted;
  }, [programs, searchText, langFilter, statusFilter, sortBy]);

  async function changeStatus(program, status) {
    setBusyId(program._id);
    setError(null);
    setNotice(null);
    try {
      await updateProgram(program._id, { status });
      setNotice(
        status === "published"
          ? t("adminPrograms.notices.published", { title: program.title })
          : t("adminPrograms.notices.unpublished", { title: program.title }),
      );
      await load();
    } catch (err) {
      handleApiError(err, t("adminPrograms.errors.statusFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRestore(program) {
    // Возврат из архива делает тест черновиком, а не публикует сразу:
    // публикация — отдельное осознанное решение (см. вводный текст страницы).
    setBusyId(program._id);
    setError(null);
    setNotice(null);
    try {
      await updateProgram(program._id, { status: "draft" });
      setNotice(
        t("adminPrograms.notices.restored", { title: program.title }),
      );
      await load();
    } catch (err) {
      handleApiError(err, t("adminPrograms.errors.restoreFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleArchive(program) {
    // Архивирование не удаляет данные, но убирает тест из всех списков —
    // подтверждение уместно, случайный клик здесь дорого стоит.
    const confirmed = window.confirm(
      t("adminPrograms.confirms.archive", { title: program.title }),
    );
    if (!confirmed) return;

    setBusyId(program._id);
    setError(null);
    try {
      await archiveProgram(program._id);
      setNotice(t("adminPrograms.notices.archived", { title: program.title }));
      await load();
    } catch (err) {
      handleApiError(err, t("adminPrograms.errors.archiveFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAssignCategory(program, categoryId) {
    setBusyId(program._id);
    setError(null);
    setNotice(null);
    try {
      await updateProgram(program._id, { categoryId: categoryId || null });
      await load();
    } catch (err) {
      handleApiError(err, t("adminPrograms.errors.categoryFailed"));
    } finally {
      setBusyId(null);
    }
  }

  // Метка «Бесплатно» на карточке теста. На доступ НЕ влияет:
  // каталог целиком открыт всем, ограничивает только квота вопросов.
  async function handleToggleFree(program, isFree) {
    setBusyId(program._id);
    setError(null);
    setNotice(null);
    try {
      await updateProgram(program._id, { isFree });
      setNotice(
        isFree
          ? t("adminPrograms.notices.freeOn", {
              title: program.title,
              defaultValue: `«${program.title}» открыт гостям без регистрации`,
            })
          : t("adminPrograms.notices.freeOff", {
              title: program.title,
              defaultValue: `«${program.title}» скрыт от гостей`,
            }),
      );
      await load();
    } catch (err) {
      handleApiError(err, t("adminPrograms.errors.freeFailed", {
        defaultValue: "Не удалось изменить доступ гостей",
      }));
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveBlockSize(program) {
    const raw = (blockDraft[String(program._id)] ?? "").trim();
    let blockSize = null;
    if (raw !== "") {
      const n = parseInt(raw, 10);
      if (!Number.isInteger(n) || n < 1 || n > 500) {
        setError(t("adminPrograms.errors.blockSizeRange"));
        return;
      }
      blockSize = n;
    }
    if ((program.blockSize ?? null) === blockSize) return; // без изменений

    setBusyId(program._id);
    setError(null);
    setNotice(null);
    try {
      await updateProgram(program._id, { blockSize });
      setNotice(
        blockSize
          ? t("adminPrograms.notices.blockSizeSet", {
              title: program.title,
              count: blockSize,
            })
          : t("adminPrograms.notices.blockSizeOff", { title: program.title }),
      );
      await load();
    } catch (err) {
      handleApiError(err, t("adminPrograms.errors.blockSizeFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleHardDelete(program) {
    const confirmed = window.confirm(
      t("adminPrograms.confirms.hardDelete", { title: program.title }),
    );
    if (!confirmed) return;

    setBusyId(program._id);
    setError(null);
    setNotice(null);
    try {
      const res = await hardDeleteProgram(program._id);
      setNotice(
        t("adminPrograms.notices.hardDeleted", {
          title: program.title,
          count: res.itemsDeleted ?? 0,
        }),
      );
      await load();
    } catch (err) {
      // Бэкенд бережёт историю: если по тесту есть попытки — удаление
      // блокируется. Даём админу выбор: удалить всё принудительно (вместе
      // с историей) или оставить, чтобы можно было убрать в архив вручную.
      if (err?.response?.status === 409) {
        const doForce = window.confirm(
          `${readApiError(err, t("adminPrograms.errors.deleteForbidden"))}\n\n${t("adminPrograms.confirms.forceDelete")}`,
        );
        if (doForce) {
          try {
            const res = await hardDeleteProgram(program._id, { force: true });
            setNotice(
              t("adminPrograms.notices.hardDeletedWithAttempts", {
                title: program.title,
                items: res.itemsDeleted ?? 0,
                attempts: res.attemptsDeleted ?? 0,
              }),
            );
            await load();
          } catch (e2) {
            handleApiError(e2, t("adminPrograms.errors.deleteFailed"));
          }
          return;
        }
      }
      handleApiError(err, t("adminPrograms.errors.deleteFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRename(program) {
    const title = renameValue.trim();
    if (!title) {
      setError(t("adminPrograms.errors.emptyTitle"));
      return;
    }
    setBusyId(program._id);
    setError(null);
    try {
      await updateProgram(program._id, { title });
      setRenamingId(null);
      setRenameValue("");
      await load();
    } catch (err) {
      handleApiError(err, t("adminPrograms.errors.renameFailed"));
    } finally {
      setBusyId(null);
    }
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
          <h1 className="edu-title">{t("adminPrograms.title")}</h1>
          <p className="edu-subtitle">{t("adminPrograms.subtitle")}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {error && <div className="edu-error">{error}</div>}
      {notice && <div className="edu-notice">{notice}</div>}

      <div className="edu-btn-row" style={{ marginBottom: 16 }}>
        <Link to="/admin/education-import" className="edu-btn">
          {t("adminPrograms.actions.importFromFile")}
        </Link>
        <Link to="/admin/education-review" className="edu-btn edu-btn--ghost">
          {t("adminPrograms.actions.reviewQuestions")}
        </Link>
      </div>

      {/* ─── Панель фильтров ─── */}
      <div className="edu-filterbar">
        <div className="edu-search" style={{ marginBottom: 0, flex: "1 1 240px" }}>
          <i className="bi bi-search" aria-hidden="true" />
          <input
            className="edu-search-input"
            type="search"
            placeholder={t("adminPrograms.filters.searchPlaceholder")}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <select
          className="edu-select edu-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          title={t("adminPrograms.filters.statusTitle")}
        >
          <option value="active">{t("adminPrograms.filters.status.active")}</option>
          <option value="published">
            {t("adminPrograms.filters.status.published")}
          </option>
          <option value="draft">{t("adminPrograms.filters.status.draft")}</option>
          <option value="archived">
            {t("adminPrograms.filters.status.archived")}
          </option>
          <option value="all">{t("adminPrograms.filters.status.all")}</option>
        </select>

        <select
          className="edu-select edu-filter-select"
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          title={t("adminPrograms.filters.langTitle")}
        >
          <option value="">{t("adminPrograms.filters.allLangs")}</option>
          {LANG_CODES.map((code) => (
            <option key={code} value={code}>
              {t(`shared.langs.${code}`, { defaultValue: code })}
            </option>
          ))}
        </select>

        <select
          className="edu-select edu-filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          title={t("adminPrograms.filters.sortTitle")}
        >
          <option value="title">{t("adminPrograms.filters.sort.title")}</option>
          <option value="questions_desc">
            {t("adminPrograms.filters.sort.questionsDesc")}
          </option>
          <option value="questions_asc">
            {t("adminPrograms.filters.sort.questionsAsc")}
          </option>
          <option value="newest">{t("adminPrograms.filters.sort.newest")}</option>
        </select>
      </div>

      <div className="edu-filter-count">
        {t("adminPrograms.filters.shown", {
          count: visible.length,
          total: programs.length,
        })}
      </div>

      {visible.length === 0 && programs.length === 0 && (
        <div className="edu-state">
          {t("adminPrograms.empty.noPrograms")}
          <br />
          <Link to="/admin/education-import">
            {t("adminPrograms.empty.importFirst")}
          </Link>
        </div>
      )}
      {visible.length === 0 && programs.length > 0 && (
        <div className="edu-state">{t("adminPrograms.empty.noMatches")}</div>
      )}

      {visible.map((program) => {
        const published = program.publishedItemCount ?? 0;
        const pending = pendingByProgram[String(program._id)] ?? 0;
        const isBusy = busyId === program._id;
        const canPublish = published > 0;

        return (
          <div key={program._id} className="edu-card">
            {renamingId === program._id ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  className="edu-input"
                  value={renameValue}
                  autoFocus
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(program);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                />
                <button
                  type="button"
                  className="edu-btn"
                  disabled={isBusy}
                  onClick={() => handleRename(program)}
                >
                  {t("shared.actions.save")}
                </button>
                <button
                  type="button"
                  className="edu-btn edu-btn--ghost"
                  onClick={() => setRenamingId(null)}
                >
                  {t("shared.actions.cancel")}
                </button>
              </div>
            ) : (
              <h2 className="edu-card-title" style={{ marginBottom: 10 }}>
                {program.title}
              </h2>
            )}

            <div className="edu-card-meta" style={{ marginTop: 0 }}>
              <span
                className={`edu-tag ${
                  program.status === "published" ? "edu-tag--free" : ""
                }`}
              >
                {t(`shared.statuses.${program.status}`, {
                  defaultValue: program.status,
                })}
              </span>
              <span className="edu-tag">{program.country}</span>
              <span className="edu-tag">
                {t(`shared.examTypes.${program.examType}`, {
                  defaultValue: program.examType,
                })}
              </span>
              <span className="edu-tag">
                {t("adminPrograms.tags.sections", {
                  count: program.blueprint?.length ?? 0,
                })}
              </span>
              <span className="edu-tag">
                {t("adminPrograms.tags.questions", { count: published })}
              </span>
              {pending > 0 && (
                <span className="edu-tag">
                  {t("adminPrograms.tags.inReview", { count: pending })}
                </span>
              )}
            </div>

            {published === 0 && (
              <div className="edu-warn" style={{ marginTop: 14 }}>
                {t("adminPrograms.warnings.noPublished")}
                {pending > 0 ? (
                  <>
                    {" "}
                    {t("adminPrograms.warnings.pendingCount", { count: pending })}{" "}
                    <Link to="/admin/education-review">
                      {t("adminPrograms.warnings.pendingLink")}
                    </Link>
                  </>
                ) : (
                  <> {t("adminPrograms.warnings.uploadFromFile")}</>
                )}
              </div>
            )}

            {(program.blueprint?.length ?? 0) === 0 && published > 0 && (
              <div className="edu-warn" style={{ marginTop: 14 }}>
                {t("adminPrograms.warnings.noBlueprint")}
              </div>
            )}

            {/* ─── Рубрика и деление на блоки ─── */}
            <div className="edu-prog-settings">
              <label className="edu-prog-setting">
                <span>{t("adminPrograms.settings.category")}</span>
                <select
                  className="edu-select"
                  value={program.categoryId ? String(program.categoryId) : ""}
                  disabled={isBusy}
                  onChange={(e) => handleAssignCategory(program, e.target.value)}
                >
                  <option value="">
                    {t("adminPrograms.settings.noCategory")}
                  </option>
                  {categoryOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="edu-prog-setting">
                <span>{t("adminPrograms.settings.blockSizeLabel")}</span>
                <span className="edu-block-input-wrap">
                  <input
                    className="edu-input"
                    type="number"
                    min="1"
                    max="500"
                    placeholder={t("adminPrograms.settings.blockSizePlaceholder")}
                    style={{ width: 90 }}
                    value={blockDraft[String(program._id)] ?? ""}
                    disabled={isBusy}
                    onChange={(e) =>
                      setBlockDraft((d) => ({
                        ...d,
                        [String(program._id)]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveBlockSize(program);
                    }}
                  />
                  <button
                    type="button"
                    className="edu-btn edu-btn--ghost"
                    disabled={isBusy}
                    onClick={() => handleSaveBlockSize(program)}
                  >
                    {t("shared.actions.save")}
                  </button>
                </span>
              </label>

              {/* Только оформление карточки: доступ к тесту метка не меняет. */}
              <label className="edu-prog-setting">
                <span>
                  {t("adminPrograms.settings.freeLabel", {
                    defaultValue: "Метка «Бесплатно»",
                  })}
                </span>
                <span className="edu-free-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(program.isFree)}
                    disabled={isBusy}
                    onChange={(e) => handleToggleFree(program, e.target.checked)}
                  />
                  <span className="edu-hint" style={{ margin: 0 }}>
                    {t("adminPrograms.settings.freeHint", {
                      defaultValue: "показывать бейдж на карточке",
                    })}
                  </span>
                </span>
              </label>
            </div>
            {categoryOptions.length === 0 && (
              <div className="edu-hint" style={{ marginTop: 2 }}>
                {t("adminPrograms.hints.noCategories")}{" "}
                <Link to="/admin/education-categories">
                  {t("adminPrograms.hints.noCategoriesLink")}
                </Link>
                {t("adminPrograms.hints.noCategoriesTail")}
              </div>
            )}

            <div className="edu-btn-row">
              {program.status === "archived" && (
                <button
                  type="button"
                  className="edu-btn"
                  disabled={isBusy}
                  onClick={() => handleRestore(program)}
                >
                  {isBusy ? "…" : t("adminPrograms.actions.restore")}
                </button>
              )}

              {program.status === "draft" && (
                <button
                  type="button"
                  className="edu-btn"
                  disabled={isBusy || !canPublish}
                  onClick={() => changeStatus(program, "published")}
                  title={
                    canPublish ? "" : t("adminPrograms.actions.publishDisabledHint")
                  }
                >
                  {isBusy ? "…" : t("adminPrograms.actions.publish")}
                </button>
              )}

              {program.status === "published" && (
                <>
                  <Link
                    to={`/education/programs/${program._id}`}
                    className="edu-btn edu-btn--ghost"
                  >
                    {t("adminPrograms.actions.openAsStudent")}
                  </Link>
                  <button
                    type="button"
                    className="edu-btn edu-btn--ghost"
                    disabled={isBusy}
                    onClick={() => changeStatus(program, "draft")}
                  >
                    {t("adminPrograms.actions.unpublish")}
                  </button>
                </>
              )}

              {renamingId !== program._id && (
                <button
                  type="button"
                  className="edu-btn edu-btn--ghost"
                  disabled={isBusy}
                  onClick={() => {
                    setRenamingId(program._id);
                    setRenameValue(program.title);
                  }}
                >
                  {t("adminPrograms.actions.rename")}
                </button>
              )}

              {program.status !== "archived" && (
                <button
                  type="button"
                  className="edu-btn edu-btn--danger"
                  disabled={isBusy}
                  onClick={() => handleArchive(program)}
                >
                  {t("adminPrograms.actions.archive")}
                </button>
              )}

              <button
                type="button"
                className="edu-btn edu-btn--danger"
                disabled={isBusy}
                onClick={() => handleHardDelete(program)}
                title={t("adminPrograms.actions.hardDeleteHint")}
              >
                {t("adminPrograms.actions.hardDelete")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
