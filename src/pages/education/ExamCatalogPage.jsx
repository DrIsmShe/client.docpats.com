// client/src/pages/education/ExamCatalogPage.jsx
//
// Витрина подготовки к экзаменам. Точка входа модуля: /education
//
// Навигация построена по рубрикам, которые создаёт админ (дерево
// ПРОИЗВОЛЬНОЙ глубины: категория → подкатегория → …, коллекция
// exam_categories). Ходим по нему как по папкам: текущий раздел показывает
// свои подразделы и тесты, привязанные прямо к нему, а хлебные крошки
// возвращают наверх. Тесты без рубрики лежат в корне («Все тесты»).
//
// Гварда как отдельного компонента в проекте нет — каждый layout
// самозащищается сам. 401 от API означает, что сессии нет, и мы уводим
// на /login.

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchPrograms,
  fetchCategories,
  fetchQuota,
  fetchGuestPrograms,
  fetchGuestQuota,
  readApiError,
  isAuthError,
} from "../../api/education";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import BackToCabinet from "./BackToCabinet";
import "./education.css";

// Языки совпадают с EXAM_LANGUAGES на бэкенде (server/modules/education/
// constants.js) и с локалями фронтенда. Порядок здесь задаёт порядок в
// выпадающем списке.
const LANG_CODES = ["ru", "en", "az", "tr", "ar"];

// Иконка рубрики: поддерживаем и класс bootstrap-icons ("bi bi-globe"),
// и эмодзи. Если пусто — рисуем нейтральный кружок с первой буквой.
function CategoryIcon({ icon, name }) {
  if (icon && icon.startsWith("bi ")) {
    return <i className={icon} aria-hidden="true" />;
  }
  if (icon) return <span aria-hidden="true">{icon}</span>;
  return <span aria-hidden="true">{(name || "?").charAt(0).toUpperCase()}</span>;
}

function ProgramCard({ program, t }) {
  return (
    <Link to={`/education/programs/${program._id}`} className="edu-prog-card">
      <h3 className="edu-prog-card-title">{program.title}</h3>
      {program.description && (
        <p className="edu-prog-card-desc">{program.description}</p>
      )}
      <div className="edu-card-meta">
        <span className="edu-tag">
          {t(`shared.examTypes.${program.examType}`, {
            defaultValue: program.examType,
          })}
        </span>
        {program.authority && (
          <span className="edu-tag">{program.authority}</span>
        )}
        <span className="edu-tag">
          {t("catalog.card.questions", {
            count: program.publishedItemCount ?? 0,
          })}
        </span>
        {(program.languages ?? []).map((lang) => (
          <span key={lang} className="edu-tag">
            {t(`shared.langs.${lang}`, { defaultValue: lang })}
          </span>
        ))}
        {program.blockSize > 0 && (
          <span className="edu-tag">
            {t("catalog.card.blocks", { size: program.blockSize })}
          </span>
        )}
        {program.isFree && (
          <span className="edu-tag edu-tag--free">{t("catalog.card.free")}</span>
        )}
      </div>
    </Link>
  );
}

/**
 * Полоса остатка квоты над витриной.
 *
 * Показываем именно остаток, а не «использовано»: человеку важно, сколько
 * он ещё может пройти. Безлимиту полоса не нужна — тогда ничего не рисуем,
 * чтобы не превращать преимущество тарифа в шум.
 */
function QuotaBar({ quota, isGuest, t }) {
  if (!quota || quota.unlimited) return null;

  const { limit, used } = quota;
  const remaining = Math.max(0, limit - used);
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const exhausted = remaining === 0;

  return (
    <div className={`edu-quota${exhausted ? " edu-quota--out" : ""}`}>
      <div className="edu-quota-head">
        <span className="edu-quota-title">
          {isGuest
            ? t("catalog.quota.guestTitle", { defaultValue: "Демо-доступ" })
            : t("catalog.quota.title", {
                defaultValue: "Вопросов в этом месяце",
              })}
        </span>
        <span className="edu-quota-value">
          {remaining} / {limit}
        </span>
      </div>

      <div className="edu-quota-track">
        <div className="edu-quota-fill" style={{ width: `${pct}%` }} />
      </div>

      <p className="edu-quota-note">
        {exhausted
          ? isGuest
            ? t("catalog.quota.guestOut", {
                defaultValue:
                  "Демо пройдено. Зарегистрируйтесь — 250 вопросов в месяц бесплатно.",
              })
            : t("catalog.quota.out", {
                defaultValue:
                  "Квота исчерпана. Она обновится в начале месяца или сразу после подключения Exam Prep.",
              })
          : isGuest
            ? t("catalog.quota.guestHint", {
                defaultValue:
                  "Пробный проход без регистрации. Регистрация открывает 250 вопросов в месяц.",
              })
            : t("catalog.quota.hint", {
                defaultValue:
                  "Расход считается по отвеченным вопросам, а не по открытым тестам.",
              })}
      </p>

      {exhausted && (
        {/* Маршрут регистрации в проекте — /registration (зона AuthLayout). */}
        <Link
          to={isGuest ? "/registration" : "/pricing"}
          className="edu-btn edu-quota-cta"
        >
          {isGuest
            ? t("catalog.quota.registerCta", {
                defaultValue: "Зарегистрироваться бесплатно",
              })
            : t("catalog.quota.upgradeCta", {
                defaultValue: "Подключить Exam Prep",
              })}
        </Link>
      )}
    </div>
  );
}

export default function ExamCatalogPage() {
  const { t, i18n } = useTranslation("education");
  // Арабский разворачивает страницу: у зоны /education своего layout нет,
  // а ClinicLayout, который делает это для клиники, сюда не применяется.
  const dir = i18n.language?.startsWith("ar") ? "rtl" : "ltr";
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeId, setActiveId] = useState(""); // "" = корень
  const [query, setQuery] = useState("");
  const [langFilter, setLangFilter] = useState(""); // "" = все языки
  const [catFilter, setCatFilter] = useState(""); // "" = все разделы
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Гость смотрит витрину без регистрации: тесты с isFree и 20 вопросов
  // демо. Флаг влияет на баннер и на то, куда ведут карточки.
  const [isGuest, setIsGuest] = useState(false);
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [list, cats, q] = await Promise.all([
          fetchPrograms(),
          fetchCategories(),
          // Квота не критична для витрины: без неё просто нет баннера.
          fetchQuota().catch(() => null),
        ]);
        if (cancelled) return;
        setPrograms(list);
        setCategories(cats);
        setQuota(q);
      } catch (err) {
        if (cancelled) return;

        // 401 больше не повод уводить на /login: без регистрации человек
        // видит витринные тесты и может пройти демо из 20 вопросов.
        // Раньше гость упирался в форму входа, не увидев продукта вообще.
        if (isAuthError(err)) {
          try {
            const [list, q] = await Promise.all([
              fetchGuestPrograms(),
              fetchGuestQuota().catch(() => null),
            ]);
            if (cancelled) return;
            setIsGuest(true);
            setPrograms(list);
            setCategories([]); // рубрики гостю не нужны: тестов единицы
            setQuota(q);
            return;
          } catch (guestErr) {
            if (cancelled) return;
            setError(readApiError(guestErr, t("catalog.errors.load")));
            return;
          }
        }
        setError(readApiError(err, t("catalog.errors.load")));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Разворачиваем дерево любой глубины в индексы: узел по id и его родитель.
  const { nodeById, parentOf } = useMemo(() => {
    const byId = new Map();
    const parent = new Map();
    const walk = (nodes, pid) => {
      for (const n of nodes) {
        byId.set(n.id, n);
        parent.set(n.id, pid);
        walk(n.children || [], n.id);
      }
    };
    walk(categories, null);
    return { nodeById: byId, parentOf: parent };
  }, [categories]);

  // Хлебные крошки: путь от корня до текущего узла.
  const crumbs = useMemo(() => {
    const path = [];
    let cur = activeId;
    while (cur) {
      const node = nodeById.get(cur);
      if (!node) break;
      path.unshift(node);
      cur = parentOf.get(cur) ?? null;
    }
    return path;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, nodeById, parentOf]);

  // Подпапки текущего узла (или корневые категории на верхнем уровне).
  const childFolders = activeId
    ? nodeById.get(activeId)?.children ?? []
    : categories;

  // Языки для выпадающего списка — только те, что реально есть в каталоге:
  // предлагать фильтр, который заведомо ничего не найдёт, бессмысленно.
  const availableLangs = useMemo(() => {
    const present = new Set();
    for (const p of programs) for (const l of p.languages ?? []) present.add(l);
    const known = LANG_CODES.filter((l) => present.has(l));
    const unknown = [...present].filter((l) => !LANG_CODES.includes(l)).sort();
    return [...known, ...unknown];
  }, [programs]);

  const langLabel = (code) =>
    t(`shared.langs.${code}`, { defaultValue: code });

  // Цифры реестра в шапке. Считаем по всему каталогу, а не по текущей
  // выборке: это «выходные данные» издания, а не счётчик фильтра.
  const stats = useMemo(() => {
    let sections = 0;
    const walk = (nodes) => {
      for (const n of nodes) {
        sections += 1;
        walk(n.children || []);
      }
    };
    walk(categories);
    const questions = programs.reduce(
      (sum, p) => sum + (p.publishedItemCount ?? 0),
      0
    );
    return { sections, questions };
  }, [categories, programs]);

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    // Главная рубрика теста: поднимаемся от его категории до самого верха
    // дерева. Фильтр по разделу работает по всему поддереву, иначе выбор
    // «Azərbaycanda Həkimlər…» не показал бы тесты из её подразделов.
    const rootIdOf = (categoryId) => {
      let cur = categoryId ? String(categoryId) : null;
      if (!cur || !nodeById.has(cur)) return null;
      let parent = parentOf.get(cur);
      while (parent) {
        cur = parent;
        parent = parentOf.get(cur);
      }
      return cur;
    };

    return programs.filter((p) => {
      const cid = p.categoryId ? String(p.categoryId) : null;
      const rootId = rootIdOf(cid);

      // Язык: тест подходит, если у него есть вопросы на этом языке.
      if (langFilter && !(p.languages ?? []).includes(langFilter)) return false;
      if (catFilter && rootId !== catFilter) return false;

      if (q) {
        // В поиск включены и названия рубрик: человек ищет «Azərbaycan»,
        // а название самого теста может быть на другом языке.
        const haystack = [
          p.title,
          p.authority,
          p.description,
          cid ? nodeById.get(cid)?.name : null,
          rootId ? nodeById.get(rootId)?.name : null,
        ];
        if (!haystack.filter(Boolean).some((s) => s.toLowerCase().includes(q))) {
          return false;
        }
      }
      return true;
    });
  }, [programs, q, langFilter, catFilter, nodeById, parentOf]);

  // Активен ли хоть один фильтр, кроме строки поиска: от этого зависит,
  // можно ли верить серверным счётчикам на карточках рубрик.
  const filtersActive = Boolean(langFilter || catFilter);

  // Сколько отфильтрованных тестов лежит в узле и во всём его поддереве.
  // Серверный programCount считает все опубликованные тесты и про фильтр по
  // языку не знает, поэтому при активном фильтре цифра на папке врала бы.
  const countBySubtree = useMemo(() => {
    const direct = new Map();
    for (const p of filtered) {
      const cid = p.categoryId ? String(p.categoryId) : null;
      if (!cid) continue;
      direct.set(cid, (direct.get(cid) ?? 0) + 1);
    }
    const totals = new Map();
    const walk = (node) => {
      let total = direct.get(node.id) ?? 0;
      for (const child of node.children ?? []) total += walk(child);
      totals.set(node.id, total);
      return total;
    };
    categories.forEach(walk);
    return totals;
  }, [categories, filtered]);

  // Число тестов и подразделов на карточке папки: при активных фильтрах —
  // только то, что в них попало, иначе серверные счётчики (они видят весь
  // каталог, а не первые N загруженных программ).
  const folderCount = (node) =>
    filtersActive ? countBySubtree.get(node.id) ?? 0 : node.programCount;

  // Папки, в которых после фильтрации ничего не осталось, не показываем —
  // иначе пользователь проваливается в заведомо пустой раздел.
  const keepFolder = (node) =>
    !filtersActive || (countBySubtree.get(node.id) ?? 0) > 0;

  const visibleFolders = childFolders.filter(keepFolder);

  // Тесты, привязанные ПРЯМО к текущему узлу. В корне — тесты без рубрики
  // (или с рубрикой, которой уже нет).
  const directPrograms = filtered.filter((p) => {
    const cid = p.categoryId ? String(p.categoryId) : null;
    if (!activeId) return !cid || !nodeById.has(cid);
    return cid === activeId;
  });

  return (
    <div className="edu-page edu-page--wide" dir={dir}>
      {/* ─── Шапка ─── */}
      {/* Титульный лист: колонтитул с монограммой, двойная линейка, титул
          раздела и реестр цифр. Возврат в кабинет и переключатель языка
          живут здесь, потому что у зоны /education нет общего layout с
          шапкой: без них выйти из модуля и сменить язык можно было только
          через браузер. */}
      <header className="edu-masthead">
        <div className="edu-masthead-bar">
          <div className="edu-monogram">
            <span className="edu-monogram-mark" aria-hidden="true">
              DP
            </span>
            <span className="edu-monogram-text">
              <span className="edu-monogram-name">DocPats</span>
              <span className="edu-monogram-sub">
                {t("catalog.brand", { defaultValue: "Academia Medica" })}
              </span>
            </span>
          </div>
          <div className="edu-masthead-actions">
            <BackToCabinet />
            <LanguageSwitcher />
          </div>
        </div>

        <div className="edu-rule-double" aria-hidden="true" />

        <div className="edu-catalog-hero">
          {/* Надзаголовок необязателен: в локали его может не быть, и
              пустая строка оставила бы дыру над титулом. */}
          {t("catalog.eyebrow", { defaultValue: "" }) && (
            <p className="edu-eyebrow">{t("catalog.eyebrow")}</p>
          )}
          <h1 className="edu-title">{t("catalog.title")}</h1>
          <div className="edu-ornament" aria-hidden="true">
            <span className="edu-ornament-mark">◆</span>
          </div>
          <p className="edu-subtitle" style={{ marginBottom: 0 }}>
            {t("catalog.subtitle")}
          </p>
        </div>

        {/* Реестр каталога. Показываем, только когда есть что считать. */}
        {!loading && programs.length > 0 && (
          <div className="edu-stats">
            <div className="edu-stat">
              <span className="edu-stat-value">{programs.length}</span>
              <span className="edu-stat-label">
                {t("catalog.stats.programs", { defaultValue: "Tests" })}
              </span>
            </div>
            {stats.sections > 0 && (
              <div className="edu-stat">
                <span className="edu-stat-value">{stats.sections}</span>
                <span className="edu-stat-label">
                  {t("catalog.stats.sections", { defaultValue: "Sections" })}
                </span>
              </div>
            )}
            {stats.questions > 0 && (
              <div className="edu-stat">
                <span className="edu-stat-value">{stats.questions}</span>
                <span className="edu-stat-label">
                  {t("catalog.stats.questions", { defaultValue: "Questions" })}
                </span>
              </div>
            )}
            {availableLangs.length > 0 && (
              <div className="edu-stat">
                <span className="edu-stat-value">{availableLangs.length}</span>
                <span className="edu-stat-label">
                  {t("catalog.stats.langs", { defaultValue: "Languages" })}
                </span>
              </div>
            )}
          </div>
        )}
      </header>

      {error && <div className="edu-error">{error}</div>}

      <QuotaBar quota={quota} isGuest={isGuest} t={t} />

      {/* ─── Поиск и фильтры ─── */}
      <div className="edu-filterbar">
        <div
          className="edu-search"
          style={{ marginBottom: 0, flex: "1 1 240px" }}
        >
          <i className="bi bi-search" aria-hidden="true" />
          <input
            className="edu-search-input"
            type="search"
            placeholder={t("catalog.search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Главные рубрики. Вложенные подразделы сюда не выводим: список
            стал бы длинным, а фильтр и так считает по всему поддереву —
            внутрь ходят через папки и хлебные крошки. */}
        {categories.length > 0 && (
          <select
            className="edu-select edu-filter-select"
            value={catFilter}
            onChange={(e) => {
              setCatFilter(e.target.value);
              // Возвращаем к корню: иначе остаёмся стоять внутри рубрики,
              // которую фильтр только что скрыл.
              setActiveId("");
            }}
            title={t("catalog.filters.category")}
            aria-label={t("catalog.filters.category")}
          >
            <option value="">{t("catalog.filters.allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {availableLangs.length > 0 && (
          <select
            className="edu-select edu-filter-select"
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            title={t("catalog.filters.lang")}
            aria-label={t("catalog.filters.lang")}
          >
            <option value="">{t("catalog.filters.allLangs")}</option>
            {availableLangs.map((code) => (
              <option key={code} value={code}>
                {langLabel(code)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Счётчик показываем только когда фильтры реально что-то отсекают. */}
      {!loading && programs.length > 0 && (q || filtersActive) && (
        <div className="edu-filter-count">
          {t("catalog.found", {
            count: filtered.length,
            total: programs.length,
          })}
          {filtersActive && (
            <>
              {" · "}
              <button
                type="button"
                className="edu-crumb"
                onClick={() => {
                  setLangFilter("");
                  setCatFilter("");
                }}
              >
                {t("catalog.filters.reset")}
              </button>
            </>
          )}
        </div>
      )}

      {loading && <div className="edu-state">{t("catalog.loading")}</div>}

      {/* ─── Пусто ─── */}
      {!loading && programs.length === 0 && !error && (
        <div className="edu-state">
          {t("catalog.empty.title")}
          <br />
          {t("catalog.empty.hint")}
        </div>
      )}

      {/* ─── Поиск: плоский список результатов ─── */}
      {!loading && programs.length > 0 && q && (
        <>
          {filtered.length === 0 ? (
            <div className="edu-state">
              {filtersActive
                ? t("catalog.noResults.withFilters")
                : t("catalog.noResults.plain")}
            </div>
          ) : (
            <div className="edu-grid">
              {filtered.map((p) => (
                <ProgramCard key={p._id} program={p} t={t} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Навигация по папкам ─── */}
      {!loading && programs.length > 0 && !q && (
        <>
          {/* Хлебные крошки */}
          {(crumbs.length > 0 || visibleFolders.length > 0) && (
            <nav className="edu-crumbs">
              <button
                type="button"
                className="edu-crumb"
                onClick={() => setActiveId("")}
              >
                {t("catalog.allPrograms")}
              </button>
              {crumbs.map((c) => (
                <span key={c.id} className="edu-crumb-wrap">
                  <span className="edu-crumb-sep">/</span>
                  <button
                    type="button"
                    className="edu-crumb"
                    onClick={() => setActiveId(c.id)}
                    disabled={c.id === activeId}
                  >
                    {c.name}
                  </button>
                </span>
              ))}
            </nav>
          )}

          {/* Подпапки текущего раздела */}
          {visibleFolders.length > 0 && (
            <div className="edu-toc">
              {visibleFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="edu-folder-card"
                  onClick={() => setActiveId(f.id)}
                >
                  <span className="edu-folder-icon">
                    <CategoryIcon icon={f.icon} name={f.name} />
                  </span>
                  <span className="edu-folder-text">
                    <span className="edu-folder-name">{f.name}</span>
                    <span className="edu-folder-meta">
                      {t("catalog.folder.programs", { count: folderCount(f) })}
                      {(f.children ?? []).filter(keepFolder).length
                        ? ` · ${t("catalog.folder.subsections", {
                            count: (f.children ?? []).filter(keepFolder).length,
                          })}`
                        : ""}
                    </span>
                  </span>
                  <span className="edu-folder-chevron">›</span>
                </button>
              ))}
            </div>
          )}

          {/* Тесты этого уровня */}
          {directPrograms.length > 0 && (
            <>
              {visibleFolders.length > 0 && (
                <div className="edu-section-title">
                  {activeId
                    ? t("catalog.section.inThisCategory")
                    : t("catalog.section.uncategorized")}
                </div>
              )}
              <div className="edu-grid">
                {directPrograms.map((p) => (
                  <ProgramCard key={p._id} program={p} t={t} />
                ))}
              </div>
            </>
          )}

          {/* Пустой раздел */}
          {visibleFolders.length === 0 && directPrograms.length === 0 && (
            <div className="edu-state">
              {langFilter
                ? t("catalog.emptyFolder.byLang", { lang: langLabel(langFilter) })
                : t("catalog.emptyFolder.plain")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
