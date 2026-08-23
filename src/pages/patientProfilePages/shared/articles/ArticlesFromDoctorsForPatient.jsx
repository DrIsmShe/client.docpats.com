import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaCommentDots, FaUserNurse } from "react-icons/fa6";
import { BsCalendar2DateFill } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import { sh } from "../../../../lib/sanitizeHtml";
import { COUNTRIES, COUNTRY_ALIASES } from "../../../../constants/countries";

/* ====================== Страны (фиксированный список) ====================== */

/* ====== Алиасы стран ====== */

/* ====================== Helpers ====================== */
const normalize = (s) => (s || "").toString().trim().toLowerCase();
const stripHtml = (s) => (s || "").replace(/<[^>]*>/g, " ");
const dateRu = (iso) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU") : "Нет даты";
const normalizeCountryForSelect = (s) => {
  const raw = (s || "").trim();
  return COUNTRY_ALIASES[raw] || raw;
};
const authorName = (a) =>
  [a?.author?.firstName, a?.author?.lastName].filter(Boolean).join(" ").trim();
const getCountry = (a) => {
  const c = a?.country || "Не указано";
  return normalizeCountryForSelect(c);
};

/** Категории: поддержка разных форматов (одна, массив, объект с name) */
const getCategoryNames = (a) => {
  const c = a?.category;
  if (!c) return [];
  if (typeof c === "string") return [c];
  if (Array.isArray(c))
    return c.map((x) => (typeof x === "string" ? x : x?.name)).filter(Boolean);
  if (typeof c === "object" && c?.name) return [c.name];
  return [];
};

const likesCountOf = (a) =>
  typeof a?.likesCount === "number"
    ? a.likesCount
    : Array.isArray(a?.likes)
    ? a.likes.length
    : 0;
const commentsCountOf = (a) =>
  typeof a?.commentCount === "number" ? a.commentCount : 0;

/** Простая раскодировка часто встречающихся HTML-сущностей */
const decodeBasicEntities = (html) =>
  (html || "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");

/** Выбор HTML контента с фолбэками (исправляет кейсы с JSON/Delta/экранированным HTML) */
const pickContentHtml = (a) => {
  // пробуем типичные поля
  let html = a?.contentHtml || a?.content || a?.body || a?.text || "";

  // если не строка — превращаем в текст
  if (typeof html !== "string") {
    try {
      html = stripHtml(JSON.stringify(html)).slice(0, 600);
      html = `<p>${html}</p>`;
    } catch {
      html = "";
    }
  }

  // если HTML экранирован (&lt;p&gt;...), раскодируем
  if (html.includes("&lt;") && html.includes("&gt;")) {
    html = decodeBasicEntities(html);
  }

  // если пусто — превью из текста/тайтла
  if (!html.trim()) {
    const txt = stripHtml(a?.content || a?.text || a?.body || a?.title || "");
    html = `<p>${(txt || "Контент отсутствует").slice(0, 220)}</p>`;
  }

  return html;
};

/* ====================== Component ====================== */
export default function ArticlesFromDoctorsForPatient() {
  const { t } = useTranslation("patientArea");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Фильтры/поиск/сорт
  const [search, setSearch] = useState(""); // title + content
  const [authorQuery, setAuthorQuery] = useState(""); // ФИО автора
  const [country, setCountry] = useState("all"); // страна
  const [catSelected, setCatSelected] = useState([]); // категории (имена)
  const [specialization, setSpecialization] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc"); // date_desc|date_asc|likes_desc|comments_desc|title_asc
  const API_BASE = process.env.REACT_APP_API_URL;
  // Загрузка
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/patient-profile/articles-all`,
          { withCredentials: true }
        );
        setArticles(res.data?.articles || []);
      } catch (err) {
        console.error("Ошибка при загрузке статей:", err?.message || err);
        setError("Ошибка при загрузке статей");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Опции (страны — фикс; категории/спец — из данных)
  const options = useMemo(() => {
    const catSet = new Set();
    const specSet = new Set();

    for (const a of articles) {
      for (const c of getCategoryNames(a)) if (c) catSet.add(c);
      if (a?.specialization) specSet.add(String(a.specialization).trim());
    }

    const toSorted = (it) =>
      Array.from(it)
        .filter(Boolean)
        .sort((x, y) => x.localeCompare(y, "ru"));

    return {
      countries: ["all", ...COUNTRIES],
      categories: toSorted(catSet),
      specializations: ["all", ...toSorted(specSet)],
    };
  }, [articles]);

  const toggleCat = (val) =>
    setCatSelected((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );

  const resetFilters = () => {
    setSearch("");
    setAuthorQuery("");
    setCountry("all");
    setCatSelected([]);
    setSpecialization("all");
    setSortBy("date_desc");
  };

  // Фильтрация + сортировка
  const filtered = useMemo(() => {
    let list = [...articles];

    // Поиск по названию и тексту
    const q = normalize(search);
    if (q) {
      list = list.filter((a) => {
        const hay =
          normalize(a?.title) +
          " " +
          normalize(
            stripHtml(a?.content || a?.contentHtml || a?.text || a?.body || "")
          );
        return hay.includes(q);
      });
    }

    // Автор
    const qAuthor = normalize(authorQuery);
    if (qAuthor) {
      list = list.filter((a) => normalize(authorName(a)).includes(qAuthor));
    }

    // Страна
    if (country !== "all") {
      const qCountry = normalize(country);
      list = list.filter((a) => normalize(getCountry(a)) === qCountry);
    }

    // Специализация
    if (specialization !== "all") {
      const qSpec = normalize(specialization);
      list = list.filter(
        (a) => normalize(String(a?.specialization || "")) === qSpec
      );
    }

    // Категории (ANY)
    if (catSelected.length) {
      list = list.filter((a) => {
        const cats = getCategoryNames(a).map(normalize);
        return catSelected.some((c) => cats.includes(normalize(c)));
      });
    }

    // Сортировка
    list.sort((A, B) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(A.createdAt) - new Date(B.createdAt);
        case "date_desc":
          return new Date(B.createdAt) - new Date(A.createdAt);
        case "likes_desc":
          return likesCountOf(B) - likesCountOf(A);
        case "comments_desc":
          return commentsCountOf(B) - commentsCountOf(A);
        case "title_asc":
          return normalize(A?.title).localeCompare(normalize(B?.title), "ru");
        default:
          return 0;
      }
    });

    return list;
  }, [
    articles,
    search,
    authorQuery,
    country,
    specialization,
    catSelected,
    sortBy,
  ]);

  if (loading) return <div>{t("common.loading")}</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div>
      <div className="pagetitle">
        <h1>{t("articles.all")}</h1>
      </div>

      <section className="section">
        <div className="row align-items-top">
          <div className="col-lg-12">
            {/* Панель фильтров */}
            <div className="card mb-3 shadow-sm">
              <div className="card-body">
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                  <h5 className="card-title m-0">{t("articles.filtersAndSearch")}</h5>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>
                    {t("articles.found")} <b>{filtered.length}</b>
                  </div>
                </div>

                <div className="row g-3">
                  {/* Поиск (title + content) */}
                  <div className="col-md-6">
                    <label className="form-label">
                      {t("articles.searchPlaceholder")}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t("articles.categoriesExample")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Автор */}
                  <div className="col-md-6">
                    <label className="form-label">{t("articles.author")}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t("articles.authorExample")}
                      value={authorQuery}
                      onChange={(e) => setAuthorQuery(e.target.value)}
                    />
                  </div>

                  {/* Страна */}
                  <div className="col-md-4">
                    <label className="form-label">{t("articles.country")}</label>
                    <select
                      className="form-select"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    >
                      {options.countries.map((c) => (
                        <option key={c} value={c}>
                          {c === "all" ? "Все страны" : c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Специализация */}
                  <div className="col-md-4">
                    <label className="form-label">{t("articles.specialty")}</label>
                    <select
                      className="form-select"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                    >
                      {options.specializations.map((s) => (
                        <option key={s} value={s}>
                          {s === "all" ? "Все специализации" : s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Сортировка */}
                  <div className="col-md-4">
                    <label className="form-label">{t("articles.sorting")}</label>
                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="date_desc">{t("articles.sortNewest")}</option>
                      <option value="date_asc">{t("articles.sortOldest")}</option>
                      <option value="likes_desc">{t("articles.sortLikes")}</option>
                      <option value="comments_desc">{t("articles.sortComments")}</option>
                      <option value="title_asc">{t("articles.sortAlpha")}</option>
                    </select>
                  </div>

                  {/* Сброс */}
                  <div className="col-md-12 d-flex">
                    <button
                      className="btn btn-outline-secondary ms-auto"
                      onClick={resetFilters}
                    >
                      {t("articles.resetFilters")}
                    </button>
                  </div>

                  {/* Категории */}
                  {options.categories.length > 0 && (
                    <div className="col-12">
                      <label className="form-label d-block mb-2">
                        {t("articles.categories")}
                      </label>
                      <div className="d-flex flex-wrap gap-3">
                        {options.categories.map((c) => (
                          <label key={c} className="form-check">
                            <input
                              className="form-check-input me-1"
                              type="checkbox"
                              checked={catSelected.includes(c)}
                              onChange={() => toggleCat(c)}
                            />
                            <span className="form-check-label">{c}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Список статей */}
            {filtered.length === 0 ? (
              <p>{t("articles.nothingForFilters")}</p>
            ) : (
              <div className="row">
                {filtered.map((article) => {
                  const catNames = getCategoryNames(article);
                  return (
                    <div key={article._id} className="col-md-4">
                      <div className="card mb-3 shadow-sm">
                        <div className="card-body">
                          <Link to={`/patient/article-detail/${article._id}`}>
                            <h2
                              className="card-title"
                              style={{
                                fontSize: "22px",
                                height: "100px",
                                overflow: "hidden",
                              }}
                            >
                              {article.title}
                            </h2>
                          </Link>

                          {article.imageUrl && (
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              style={{
                                width: "100%",
                                height: "300px",
                                objectFit: "cover",
                              }}
                              className="mb-3"
                            />
                          )}

                          <div
                            className="card-text"
                            style={{
                              marginTop: 12,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: "vertical",
                              whiteSpace: "normal",
                            }}
                            dangerouslySetInnerHTML={{
                              __html: sh(pickContentHtml(article),)
                            }}
                          />
                        </div>

                        <div className="px-3 pb-3">
                          <div
                            className="d-flex flex-wrap align-items-center gap-2 gap-md-4 mt-3"
                            style={{ fontSize: "15px" }}
                          >
                            <div className="d-flex align-items-center">
                              <BsCalendar2DateFill className="me-1" />
                              {dateRu(article.createdAt)}
                            </div>

                            <div className="d-flex align-items-center">
                              <FaCommentDots className="me-1" />
                              {commentsCountOf(article)}
                            </div>

                            <div className="d-flex align-items-center">
                              <AiFillLike className="me-1" />
                              {likesCountOf(article)}
                            </div>

                            <div className="d-flex align-items-center">
                              <FaUserNurse className="me-1" />
                              {authorName(article) || "Неизвестно"}
                            </div>

                            <div
                              className="d-flex align-items-center"
                              title={t("articles.country")}
                            >
                              <span className="badge text-bg-light ms-1">
                                {getCountry(article)}
                              </span>
                            </div>

                            {article?.specialization && (
                              <div
                                className="d-flex align-items-center"
                                title={t("articles.specialty")}
                              >
                                <span className="badge text-bg-secondary ms-1">
                                  {article.specialization}
                                </span>
                              </div>
                            )}

                            {catNames.length > 0 && (
                              <div className="d-flex align-items-center flex-wrap gap-1">
                                {catNames.map((c) => (
                                  <span key={c} className="badge text-bg-info">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
