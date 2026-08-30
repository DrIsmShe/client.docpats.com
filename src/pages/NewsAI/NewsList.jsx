import React, { useEffect, useState, useCallback } from "react";
import { fetchSynthesisArticles, fetchNews, searchNews } from "../../axios";
import NewsCard from "../../components/newsAI/NewsCard";
import apiInstance from "../../axios";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../../components/newsAI/header/header";

const SPECIALTY_COLORS = {
  oncology: "#b83030",
  cardiology: "#a93226",
  neurology: "#0e5c6b",
  infectious: "#b7290e",
  surgery: "#1a7a4a",
  endocrinology: "#8a6a00",
  pulmonology: "#1a5276",
  gastroenterology: "#0e6655",
  general: "#3a3830",
};
const LOCALES = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "az", label: "AZ" },
  { code: "ar", label: "AR" },
  { code: "tr", label: "TR" },
];
const RTL_LOCALES = new Set(["ar"]);
const SOURCE_META = {
  ai: { key: "sourceType.ai", color: "#0f766e", bg: "rgba(15,118,110,.1)" },
  scientific: {
    key: "sourceType.scientific",
    color: "#0e5c6b",
    bg: "rgba(14,92,107,.1)",
  },
  article: {
    key: "sourceType.article",
    color: "#1a6b3c",
    bg: "rgba(26,107,60,.1)",
  },
  doctor: { key: "sourceType.doctor", color: "#7c3d9f", bg: "rgba(124,61,159,.1)" },
};

function normalizeAiItem(item) {
  return {
    _id: item._id || item.slug,
    _sourceType: "ai",
    _sortDate: item.publishedAt || item.createdAt || null,
    title: item.title || "",
    preview: item.summary || item.description || item.preview || "",
    imageUrl: item.imageUrl || item.image || null,
    createdAt: item.publishedAt || item.createdAt,
    author: item.source ? { name: item.source } : null,
    specialization: item.specialty || null,
    country: null,
    likesCount: 0,
    commentCount: 0,
    categories: item.tags || [],
    category: item.specialty || null,
    _original: item,
  };
}
function normalizeDocpatsItem(item, sourceType) {
  return {
    _id: item._id,
    _sourceType: sourceType,
    _sortDate: item.createdAt || null,
    title: item.title || "Без заголовка",
    preview: item.preview || "",
    imageUrl: item.imageUrl || null,
    createdAt: item.createdAt,
    author: item.author
      ? {
          name: `${item.author.firstName || ""} ${item.author.lastName || ""}`.trim(),
        }
      : null,
    specialization: item.specialization || null,
    country: item.country || null,
    likesCount: item.likesCount ?? 0,
    commentCount: item.commentCount ?? 0,
    categories: item.categories || [],
    category: item.category || null,
    _original: null,
  };
}
function normalizeDoctorItem(item) {
  const fullName =
    `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim();
  return {
    _id: item._id,
    _sourceType: "doctor",
    _sortDate: item.createdAt || null,
    title: fullName || "Врач",
    preview: item.about || "",
    imageUrl: item.profileImage || null,
    createdAt: item.createdAt,
    author: null,
    specialization: item.specialty || null,
    country: item.country || null,
    likesCount: 0,
    commentCount: item.articles?.count || 0,
    categories: [],
    category: item.specialty || null,
    clinic: item.clinic || null,
    articlesCount: item.articles?.count || 0,
    _original: item,
  };
}

function sortFeed(items, sortBy) {
  // При поиске порядок уже задан релевантностью: сервер вернул материалы
  // отсортированными по совпадению, а лента идёт первой.
  //
  // Пересортировать их по дате — значит похоронить найденное. Именно так и
  // выходило: врач вставлял в поиск заголовок статьи, она находилась, но выше
  // неё вставали свежие публикации врачей, потому что вышли сегодня. Выглядело
  // как «поиск не нашёл и показал что-то своё».
  if (sortBy === "relevance") return items;

  return [...items].sort((a, b) => {
    switch (sortBy) {
      case "date_asc":
        return (
          (a._sortDate ? new Date(a._sortDate) : new Date(0)) -
          (b._sortDate ? new Date(b._sortDate) : new Date(0))
        );
      case "likes_desc":
        return (b.likesCount || 0) - (a.likesCount || 0);
      case "comments_desc":
        return (b.commentCount || 0) - (a.commentCount || 0);
      case "title_asc":
        return (a.title || "").localeCompare(b.title || "", "ru");
      case "author_asc":
        return (a.author?.name || "").localeCompare(b.author?.name || "", "ru");
      default:
        return (
          (b._sortDate ? new Date(b._sortDate) : new Date(0)) -
          (a._sortDate ? new Date(a._sortDate) : new Date(0))
        );
    }
  });
}
// Аналитическая статья приходит из движка новостей и устроена иначе, чем
// врачебная: у неё специальность вместо категории и нет автора-человека.
// Приводим к тому же виду, что и остальные карточки, — иначе вкладка не
// сможет жить внутри общей ленты.
function normalizeSynthesisItem(item) {
  return {
    _id: item._id,
    _sourceType: "synthesis",
    _sortDate: item.createdAt || item.publishedAt || null,
    title: item.title || "Без заголовка",
    preview: item.summary || item.abstract || item.preview || "",
    imageUrl: item.imageUrl || null,
    createdAt: item.createdAt || item.publishedAt,
    author: item.author ? { name: item.author } : null,
    specialization: item.specialty || null,
    country: null,
    likesCount: 0,
    commentCount: 0,
    categories: item.specialty ? [item.specialty] : [],
    category: item.specialty || null,
    _original: item,
  };
}

function mergeAndSort(ai, pub, sci, doc = [], syn = [], sortBy = "date_desc") {
  return sortFeed(
    [
      ...ai.map(normalizeAiItem),
      ...pub.map((i) => normalizeDocpatsItem(i, "article")),
      ...sci.map((i) => normalizeDocpatsItem(i, "scientific")),
      ...doc.map(normalizeDoctorItem),
      ...syn.map(normalizeSynthesisItem),
    ],
    sortBy,
  );
}
function getItemLink(item, { isAuthenticated, userRole } = {}) {
  if (item._sourceType === "ai")
    return `/news/${item._original?.slug || item._id}`;
  if (item._sourceType === "article") {
    if (!isAuthenticated)
      return `/public/doctor-profile/article-detail-for-all/${item._id}`;
    if (userRole === "patient") return `/patient/article-detail/${item._id}`;
    if (userRole === "doctor") return `/doctor/article-detail/${item._id}`;
    return `/public/doctor-profile/article-detail-for-all/${item._id}`;
  }
  if (item._sourceType === "scientific") {
    if (!isAuthenticated)
      return `/public/doctor/article-scientific-detail-for-all/${item._id}`;
    if (userRole === "patient")
      return `/patient/article-scientific-detail/${item._id}`;
    if (userRole === "doctor")
      return `/doctor/article-scientific-detail/${item._id}`;
    return `/public/doctor/article-scientific-detail-for-all/${item._id}`;
  }
  if (item._sourceType === "synthesis") {
    // Отдельная страница статьи остаётся прежней — меняется только то, откуда
    // на неё попадают: из общей ленты, а не с отдельной вкладки-перехода.
    return `/articles/${item._id}`;
  }
  if (item._sourceType === "doctor") {
    if (!isAuthenticated)
      return `/public/doctor-profile/doctor-details/${item._id}`;
    if (userRole === "patient") return `/patient/doctor-details/${item._id}`;
    if (userRole === "doctor") return `/doctor/doctor-details/${item._id}`;
    return `/public/doctor-profile/doctor-details/${item._id}`;
  }
  return "/";
}

const DOCTOR_API = process.env.REACT_APP_API_URL || "";

async function fetchArticles({
  page = 1,
  perPage = 20,
  qTitle = "",
  sortBy = "date_desc",
  cat = "",
  locale = "en",
} = {}) {
  const p = new URLSearchParams({ page, perPage, sortBy });
  if (qTitle) p.set("qTitle", qTitle);
  if (cat) p.set("cat", cat);
  return (
    await axios.get(`${DOCTOR_API}/doctor-profile/articles-all?${p}`, {
      headers: { "X-Language": locale, "Accept-Language": locale },
    })
  ).data;
}

async function fetchScientificArticles({
  page = 1,
  perPage = 20,
  qTitle = "",
  sortBy = "date_desc",
  cat = "",
  locale = "en",
} = {}) {
  const p = new URLSearchParams({ page, perPage, sortBy });
  if (qTitle) p.set("qTitle", qTitle);
  if (cat) p.set("cat", cat);
  return (
    await axios.get(
      `${DOCTOR_API}/doctor-profile/articles-scientific-all?${p}`,
      {
        headers: { "X-Language": locale, "Accept-Language": locale },
      },
    )
  ).data;
}

async function fetchDoctors() {
  return (await axios.get(`${DOCTOR_API}/doctor-profile/doctors`)).data;
}
async function fetchDoctorsForPatient() {
  return (await axios.get(`${DOCTOR_API}/patient-profile/doctors-for-patient`))
    .data;
}
function normalizeAiResponse(data) {
  if (!data) return [];
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data.map((i) => i.article || i);
  if (Array.isArray(data)) return data;
  return [];
}

export default function NewsList() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");

  // Раздел ленты, отвечающий специальности врача. Приходит с сервера готовым
  // ключом (GET /api/me/specialty): клиенту незачем знать все 101 название
  // справочника специализаций.
  //
  // null означает «своего раздела нет» — нормальный ответ, а не сбой: у
  // терапевта и семейного врача его и не должно быть. Тогда переключателя не
  // будет, и лента останется общей.
  const [mySection, setMySection] = useState(null);
  const [mySpecName, setMySpecName] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setIsAuthenticated(true);
      setUserRole(user.role);
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    if (userRole !== "doctor") return;
    let cancelled = false;

    apiInstance
      .get("/api/me/specialty")
      .then(({ data }) => {
        if (cancelled || !data?.feedSection) return;
        setMySection(data.feedSection);
        setMySpecName(data.specialization || "");
        // Врач заходит сюда за своей темой — включаем её сразу. Общая лента
        // остаётся в одном клике, а разбирать восемь с половиной тысяч чужих
        // материалов, чтобы добраться до своих, никто не станет.
        setOnlyMine(true);
      })
      // Молча: не смогли узнать специальность — показываем всю ленту. Это
      // рабочее состояние, а не ошибка, о которой надо кричать.
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [userRole]);

  const { t, i18n } = useTranslation("NewsAiTranslate");
  const navigate = useNavigate();
  const [type, setType] = useState("");

  // ── ИЗМЕНЕНИЕ: locale синхронизируется с i18n.language ──
  const [locale, setLocale] = useState(i18n.language || "en");

  useEffect(() => {
    setLocale(i18n.language);
  }, [i18n.language]);
  // ────────────────────────────────────────────────────────

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("");
  const [appliedSort, setAppliedSort] = useState("date_desc");

  const [feed, setFeed] = useState([]);
  const [total, setTotal] = useState(0);
  const [aiPage, setAiPage] = useState(1);
  const [aiTotalPages, setAiTotalPages] = useState(1);
  const [pubPage, setPubPage] = useState(1);
  const [pubTotalPages, setPubTotalPages] = useState(1);
  const [sciPage, setSciPage] = useState(1);
  const [sciTotalPages, setSciTotalPages] = useState(1);
  const [aiTotal, setAiTotal] = useState(0);
  const [pubTotal, setPubTotal] = useState(0);
  const [sciTotal, setSciTotal] = useState(0);
  const [synPage, setSynPage] = useState(1);
  const [synTotalPages, setSynTotalPages] = useState(1);
  const [synTotal, setSynTotal] = useState(0);
  const [doctorTotal, setDoctorTotal] = useState(0);
  const [categoryList, setCategoryList] = useState([]);
  const [aiCategories, setAiCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const API_BASE = process.env.REACT_APP_NEWS_API;
  const isRTL = RTL_LOCALES.has(locale);
  const dir = isRTL ? "rtl" : "ltr";

  const FILTERS = [
    { value: "", label: t("filters.all") },
    { value: "news", label: t("news_ai_news") },
    { value: "research", label: t("research_ai_news") },
    { value: "publications", label: t("publications_ai_news") },
    { value: "doctors", label: t("doctors_ai_news") },
    { value: "analytics", label: t("news_ai_analitics") },
  ];
  const SORT_OPTIONS = [
    { value: "date_desc", label: t("sort.date_desc") },
    { value: "date_asc", label: t("sort.date_asc") },
    { value: "likes_desc", label: t("sort.likes_desc") },
    { value: "comments_desc", label: t("sort.comments_desc") },
    { value: "title_asc", label: t("sort.title_asc") },
    { value: "author_asc", label: t("sort.author_asc") },
  ];

  const hasSearch = Boolean(appliedSearch);
  const doLoadAI = type === "" || type === "news" || hasSearch;
  const doLoadPub = type === "" || type === "publications" || hasSearch;
  const doLoadSci = type === "" || type === "research" || hasSearch;
  const doLoadDoctors = type === "" || type === "doctors";
  // Аналитика грузится и в общей ленте, и на своей вкладке — как остальные
  // разделы. Раньше вкладка вела на отдельную страницу, и «Всё» её не включало.
  const doLoadSyn = type === "" || type === "analytics";

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const res = await axios.get(`${DOCTOR_API}/common-for-user`, {
          withCredentials: true,
        });
        if (res.data?.authenticated) {
          setIsAuthenticated(true);
          setUserRole(String(res.data.user?.role || "").toLowerCase());
        } else setIsAuthenticated(false);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuthentication();
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/news/categories`)
      .then((res) => setAiCategories(res.data?.categories || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (feed.length === 0) return;
    const cats = new Set();
    feed.forEach((item) => {
      if (item.specialization) cats.add(item.specialization);
      (item.categories || []).forEach((c) => {
        if (c) cats.add(c);
      });
    });
    setCategoryList((prev) => [...new Set([...prev, ...cats])].sort());
  }, [feed]);

  const loadAll = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      const q = appliedSearch;
      const docParams = {
        page: pageNum,
        perPage: 20,
        qTitle: q,
        cat: appliedCategory,
        sortBy: appliedSort,
      };
      try {
        const [aiRes, pubRes, sciRes, docRes, synRes] = await Promise.allSettled([
          doLoadAI
            ? q
              ? searchNews({
                  query: q,
                  page: pageNum,
                  limit: 20,
                  type: "",
                  locale,
                  specialty: appliedCategory || (onlyMine && mySection ? mySection : ""),
                })
              : fetchNews({
                  page: pageNum,
                  limit: 20,
                  type: "",
                  locale,
                  specialty: appliedCategory || (onlyMine && mySection ? mySection : ""),
                })
            : Promise.resolve(null),
          doLoadPub
            ? fetchArticles({ ...docParams, locale })
            : Promise.resolve(null),
          doLoadSci
            ? fetchScientificArticles({ ...docParams, locale })
            : Promise.resolve(null),
          doLoadDoctors ? fetchDoctors() : Promise.resolve(null),
          doLoadSyn
            ? fetchSynthesisArticles({ page: pageNum, limit: 20, locale })
            : Promise.resolve(null),
        ]);

        let ai = [],
          pub = [],
          sci = [],
          doc = [],
          syn = [];

        if (aiRes.status === "fulfilled" && aiRes.value) {
          const d = aiRes.value;
          ai = normalizeAiResponse(d);
          setAiTotal(d?.total || 0);
          setAiPage(d?.page || 1);
          setAiTotalPages(d?.totalPages || 1);
        } else {
          setAiTotal(0);
          setAiPage(1);
          setAiTotalPages(1);
        }

        if (pubRes.status === "fulfilled" && pubRes.value) {
          const d = pubRes.value;
          pub = d.articles || [];
          setPubTotal(d.total || 0);
          setPubPage(d.page || 1);
          setPubTotalPages(d.totalPages || 1);
        } else {
          setPubTotal(0);
          setPubPage(1);
          setPubTotalPages(1);
        }

        if (sciRes.status === "fulfilled" && sciRes.value) {
          const d = sciRes.value;
          sci = d.articles || [];
          setSciTotal(d.total || 0);
          setSciPage(d.page || 1);
          setSciTotalPages(d.totalPages || 1);
        } else {
          setSciTotal(0);
          setSciPage(1);
          setSciTotalPages(1);
        }

        if (docRes.status === "fulfilled" && Array.isArray(docRes.value)) {
          doc = docRes.value;
          setDoctorTotal(doc.length);
        } else {
          setDoctorTotal(0);
        }

        if (synRes.status === "fulfilled" && synRes.value) {
          const d = synRes.value;
          syn = d.articles || [];
          setSynTotal(d.total || 0);
          setSynPage(d.page || 1);
          setSynTotalPages(d.totalPages || 1);
        } else {
          setSynTotal(0);
          setSynPage(1);
          setSynTotalPages(1);
        }

        // Ищем — значит сортируем по совпадению, а не по дате. Явный выбор
        // врача в списке сортировки при этом уважаем.
        const order =
          appliedSearch && appliedSort === "date_desc" ? "relevance" : appliedSort;
        setFeed(mergeAndSort(ai, pub, sci, doc, syn, order));
        setTotal(
          (aiRes.value?.total || 0) +
            (pubRes.value?.total || 0) +
            (sciRes.value?.total || 0) +
            (synRes.value?.total || 0) +
            doc.length,
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [type, locale, appliedSearch, appliedCategory, appliedSort, onlyMine, mySection],
  );

  useEffect(() => {
    loadAll(1);
  }, [type, locale, appliedSearch, appliedCategory, appliedSort, onlyMine, mySection, loadAll]);

  const hasMore =
    (doLoadAI && aiPage < aiTotalPages) ||
    (doLoadPub && pubPage < pubTotalPages) ||
    (doLoadSci && sciPage < sciTotalPages) ||
    (doLoadSyn && synPage < synTotalPages);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const docParams = {
      perPage: 20,
      qTitle: appliedSearch,
      cat: appliedCategory,
      sortBy: appliedSort,
    };
    try {
      const [aiRes, pubRes, sciRes, synRes] = await Promise.allSettled([
        doLoadAI && aiPage < aiTotalPages
          ? appliedSearch
            ? searchNews({
                query: appliedSearch,
                page: aiPage + 1,
                limit: 20,
                type: "",
                locale,
              })
            : fetchNews({
                page: aiPage + 1,
                limit: 20,
                type: "",
                locale,
                specialty: appliedCategory || (onlyMine && mySection ? mySection : ""),
              })
          : Promise.resolve(null),
        doLoadPub && pubPage < pubTotalPages
          ? fetchArticles({ ...docParams, page: pubPage + 1, locale })
          : Promise.resolve(null),
        doLoadSci && sciPage < sciTotalPages
          ? fetchScientificArticles({ ...docParams, page: sciPage + 1, locale })
          : Promise.resolve(null),
        doLoadSyn && synPage < synTotalPages
          ? fetchSynthesisArticles({ page: synPage + 1, limit: 20, locale })
          : Promise.resolve(null),
      ]);
      let ai = [],
        pub = [],
        sci = [],
        syn = [];
      if (aiRes.status === "fulfilled" && aiRes.value) {
        ai = normalizeAiResponse(aiRes.value);
        setAiPage(aiRes.value?.page || aiPage + 1);
      }
      if (pubRes.status === "fulfilled" && pubRes.value) {
        pub = pubRes.value.articles || [];
        setPubPage(pubRes.value?.page || pubPage + 1);
      }
      if (sciRes.status === "fulfilled" && sciRes.value) {
        sci = sciRes.value.articles || [];
        setSciPage(sciRes.value?.page || sciPage + 1);
      }
      if (synRes.status === "fulfilled" && synRes.value) {
        syn = synRes.value.articles || [];
        setSynPage(synRes.value?.page || synPage + 1);
      }
      setFeed((prev) =>
        sortFeed(
          [...prev, ...mergeAndSort(ai, pub, sci, [], syn, appliedSort)],
          appliedSort,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const applyFilters = () => {
    setAppliedCategory(filterCategory);
    setAppliedSort(sortBy);
    setFiltersOpen(false);
  };
  const resetFilters = () => {
    setSearchInput("");
    setFilterCategory("");
    setSortBy("date_desc");
    setAppliedSearch("");
    setAppliedCategory("");
    setAppliedSort("date_desc");
    setFiltersOpen(false);
  };

  const activeFilterCount =
    [appliedSearch, appliedCategory].filter(Boolean).length +
    (appliedSort !== "date_desc" ? 1 : 0);

  // Крупной первой карточки больше нет: лента во всех вкладках начинается
  // сразу с сетки одинаковых карточек.
  const gridItems = feed;
  const heroTitle = appliedSearch ? (
    <>
      {" "}
      {t("search_label")} <em>"{appliedSearch}"</em>{" "}
    </>
  ) : type ? (
    FILTERS.find((f) => f.value === type)?.label
  ) : (
    t("hero.title")
  );

  useEffect(() => {
    const delay = setTimeout(() => {
      setAppliedSearch(searchInput);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchInput]);

  const allCategories = [
    ...new Set([...aiCategories.map((c) => c._id), ...categoryList]),
  ].sort();

  return (
    <>
      <style>{CSS}</style>
      <div className="nl-root" dir={dir}>
        {/* HERO */}
        <div className="nl-hero">
          <div className="nl-hero-inner">
            <div className="nl-hero-left">
              <div className="nl-breadcrumb">
                <Link to="/">{t("hero.breadcrumbHome")}</Link>
                <svg
                  width="8"
                  height="12"
                  viewBox="0 0 8 12"
                  fill="none"
                  style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
                >
                  <path
                    d="M2 2l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span>{t("hero.breadcrumbFeed")}</span>
              </div>
              <div className="nl-header-tag">
                DocPats · Medical Intelligence
              </div>
              <h1 className="nl-hero-title">{heroTitle}</h1>
              {!appliedSearch && !type && (
                <p className="nl-hero-sub">{t("hero.subtitle")}</p>
              )}
              {!loading && (
                <div className="nl-hero-stats">
                  <div className="nl-stat-chip">
                    <b>{total}</b> {t("stats.materials")}
                  </div>
                  {doLoadAI && aiTotal > 0 && (
                    <div className="nl-stat-chip">
                      <span className="nl-chip-dot news" />
                      <b>{aiTotal}</b> {t("stats.news")}
                    </div>
                  )}
                  {doLoadSci && sciTotal > 0 && (
                    <div className="nl-stat-chip">
                      <span className="nl-chip-dot science" />
                      <b>{sciTotal}</b> {t("stats.scientific")}
                    </div>
                  )}
                  {doLoadPub && pubTotal > 0 && (
                    <div className="nl-stat-chip">
                      <span className="nl-chip-dot article" />
                      <b>{pubTotal}</b> {t("stats.publications")}
                    </div>
                  )}
                  {doLoadDoctors && doctorTotal > 0 && (
                    <div className="nl-stat-chip">
                      <span className="nl-chip-dot doctor" />
                      <b>{doctorTotal}</b> {t("stats.doctors") || "Врачей"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="nl-filter-bar">
          <div className="nl-filter-bar-inner">
            <div className="nl-filter-tabs">
              {/* Аналитика теперь такая же вкладка, как остальные: раньше она
                  уводила на отдельную страницу, и лента обрывалась. Отдельная
                  страница осталась и открывается ссылкой с главной. */}
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`nl-filter-tab${type === f.value ? " active" : ""}`}
                  onClick={() => setType(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Своя специальность или вся лента.
                Показывается только врачу, у которого специальность указана и
                для неё есть раздел: обещать «моя специальность» терапевту, у
                которого своего раздела нет, — значит показать ему пустоту. */}
            {mySection && (
              <div className="nl-mine">
                <button
                  className={`nl-mine-btn${onlyMine ? " active" : ""}`}
                  onClick={() => setOnlyMine(true)}
                  title={mySpecName}
                >
                  {t("feed.mySpecialty", { defaultValue: "Моя специальность" })}
                </button>
                <button
                  className={`nl-mine-btn${onlyMine ? "" : " active"}`}
                  onClick={() => setOnlyMine(false)}
                >
                  {t("feed.allTopics", { defaultValue: "Все темы" })}
                </button>
              </div>
            )}

            <div className="nl-filter-right">
              {/* Поиск по всем разделам. Раньше поле было закомментировано, а
                  эндпоинт /api/search не смонтирован на сервере — то есть
                  поиска не существовало вовсе, и заметить это было нельзя. */}
              <div className="nl-filter-search">
                <input
                  type="search"
                  className="nl-search-input"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t("filters.searchPlaceholder", {
                    defaultValue: "Поиск по материалам…",
                  })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setAppliedSearch(searchInput.trim());
                  }}
                />
                {searchInput && (
                  <button
                    type="button"
                    className="nl-search-clear"
                    onClick={() => {
                      setSearchInput("");
                      setAppliedSearch("");
                    }}
                    aria-label="×"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                className={`nl-filter-adv-btn${filtersOpen ? " open" : ""}`}
                onClick={() => setFiltersOpen((o) => !o)}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M3 5h14M6 10h8M9 15h2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                {t("buttons.filters")}
                {activeFilterCount > 0 && (
                  <span className="nl-filter-badge">{activeFilterCount}</span>
                )}
              </button>
              <div className="nl-sort-wrap">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M3 6h14M5 10h10M7 14h6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                <select
                  className="nl-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <button className="nl-filter-apply-btn" onClick={applyFilters}>
                {t("buttons.apply")}
              </button>
            </div>
          </div>

          {filtersOpen && (
            <div className="nl-adv-panel">
              <div className="nl-adv-panel-inner">
                <div className="nl-adv-field">
                  <label className="nl-adv-label">{t("labels.category")}</label>
                  {allCategories.length > 0 ? (
                    <select
                      className="nl-adv-select"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="">{t("labels.allCategories")}</option>
                      {allCategories.map((c) => (
                        <option key={c} value={c}>
                          {/* Ключи разделов технические — «infectious»,
                              «sports_medicine». Врачу показываем название на
                              его языке, а в запрос уходит по-прежнему ключ.
                              Если названия для ключа нет (категория статьи
                              врача), показываем как есть. */}
                          {t(`specialties.${c}`, { defaultValue: c })}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="nl-adv-input"
                      type="text"
                      placeholder={t("search.placeholder")}
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    />
                  )}
                </div>
                <div className="nl-adv-field">
                  <label className="nl-adv-label">{t("tags.sorting")}</label>
                  <select
                    className="nl-adv-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="nl-adv-actions">
                  <button className="nl-adv-apply" onClick={applyFilters}>
                    {t("buttons.apply")}
                  </button>
                  <button className="nl-adv-reset" onClick={resetFilters}>
                    {t("buttons.reset")}
                  </button>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="nl-active-tags">
                  {appliedSearch && (
                    <span className="nl-tag">
                      {t("tags.search")}: <b>{appliedSearch}</b>
                      <button
                        onClick={() => {
                          setSearchInput("");
                          setAppliedSearch("");
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {appliedCategory && (
                    <span className="nl-tag">
                      {t("labels.category")}: <b>{t(`specialties.${appliedCategory}`, { defaultValue: appliedCategory })}</b>
                      <button
                        onClick={() => {
                          setFilterCategory("");
                          setAppliedCategory("");
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {appliedSort !== "date_desc" && (
                    <span className="nl-tag">
                      {t("labels.sorting")}:{" "}
                      <b>
                        {
                          SORT_OPTIONS.find((o) => o.value === appliedSort)
                            ?.label
                        }
                      </b>
                      <button
                        onClick={() => {
                          setSortBy("date_desc");
                          setAppliedSort("date_desc");
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {!filtersOpen && activeFilterCount > 0 && (
            <div className="nl-active-tags nl-active-tags-bar">
              {appliedSearch && (
                <span className="nl-tag">
                  {t("tags.search")}: <b>{appliedSearch}</b>
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setAppliedSearch("");
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
              {appliedCategory && (
                <span className="nl-tag">
                  {t("tags.category")}: <b>{t(`specialties.${appliedCategory}`, { defaultValue: appliedCategory })}</b>
                  <button
                    onClick={() => {
                      setFilterCategory("");
                      setAppliedCategory("");
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
              {appliedSort !== "date_desc" && (
                <span className="nl-tag">
                  ↕{" "}
                  <b>
                    {SORT_OPTIONS.find((o) => o.value === appliedSort)?.label}
                  </b>
                  <button
                    onClick={() => {
                      setSortBy("date_desc");
                      setAppliedSort("date_desc");
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
              <button className="nl-tag-reset-all" onClick={resetFilters}>
                {t("buttons.reset")}
              </button>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="nl-content">
          <div className="nl-content-inner">
            {loading ? (
              <div className="nl-loading">
                <div className="nl-spinner" />
                <span className="nl-loading-text">{t("list.loading")}</span>
              </div>
            ) : feed.length === 0 ? (
              <div className="nl-empty">
                <div className="nl-empty-icon">🔍</div>
                <div className="nl-empty-title">{t("nothing_found")}</div>
                {activeFilterCount > 0 && (
                  <button className="nl-empty-reset" onClick={resetFilters}>
                    {t("buttons.reset")}
                  </button>
                )}
              </div>
            ) : (
              <>
                {gridItems.length > 0 && (
                  <div className="nl-grid">
                    {gridItems.map((item) => (
                      <FeedCard
                        key={`${item._sourceType}-${item._id}`}
                        item={item}
                        searchTerm={appliedSearch}
                        isAuthenticated={isAuthenticated}
                        userRole={userRole}
                      />
                    ))}
                  </div>
                )}
                {hasMore && (
                  <div className="nl-more-wrap">
                    <button
                      className="nl-btn-more"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore
                        ? t("list.loadingMore")
                        : t("buttons.loadMore")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="nl-footer">
          <div className="nl-footer-inner">
            <div className="nl-footer-brand">
              <span className="nl-footer-logo">
                Doc<span>Pats</span>
              </span>
              <span className="nl-footer-tagline">{t("footer.tagline")}</span>
            </div>
            <div className="nl-footer-links">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setType(f.value)}
                  className="nl-footer-link"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// Иконки типов материала в «бровке» карточки — у дайджеста они свои (📡/⚗),
// здесь задаём для остальных источников.
const TYPE_ICON = { article: "🩺", scientific: "⚗" };

/**
 * Ссылка «проверить доказательства» для материала дайджеста.
 *
 * Заголовок уходит в модуль доказательной медицины как вопрос — он сам
 * разберёт его и построит запрос к PubMed. Так новость перестаёт быть
 * тупиком: от «вот что пишут» можно перейти к «а что за этим стоит».
 *
 * Только врачу: страница /doctor/evidence закрыта для пациентов и гостей,
 * и вести их туда — значит вести в отказ.
 */
function evidenceLinkFor(news, userRole) {
  if (userRole !== "doctor") return null;
  const question = String(news?.title || "").trim();
  if (question.length < 10) return null;
  return `/doctor/evidence?q=${encodeURIComponent(question.slice(0, 300))}`;
}

function FeedCard({ item, searchTerm, isAuthenticated, userRole }) {
  const { t } = useTranslation("NewsAiTranslate");
  if (item._sourceType === "ai")
    return (
      <NewsCard
        news={item._original}
        searchTerm={searchTerm}
        evidenceHref={evidenceLinkFor(item._original, userRole)}
      />
    );
  if (item._sourceType === "doctor")
    return (
      <DoctorCard
        item={item}
        searchTerm={searchTerm}
        isAuthenticated={isAuthenticated}
        userRole={userRole}
      />
    );

  // Публикации врачей и научные статьи рендерит та же карточка, что и
  // дайджест, — иначе шрифты и вёрстка в ленте расходятся.
  const meta = SOURCE_META[item._sourceType] || SOURCE_META.article;
  const byline = [item.author?.name, item.country].filter(Boolean).join(" · ");
  return (
    <NewsCard
      news={{
        title: item.title,
        summary: item.preview,
        publishedAt: item.createdAt,
        specialty: item.specialization,
        type: item._sourceType,
      }}
      searchTerm={searchTerm}
      href={getItemLink(item, { isAuthenticated, userRole })}
      typeLabel={t(meta.key)}
      typeIcon={TYPE_ICON[item._sourceType]}
      byline={byline}
    />
  );
}

function DoctorCard({ item, searchTerm, isAuthenticated, userRole }) {
  const { t } = useTranslation("NewsAiTranslate");
  const hl = makeHighlight(searchTerm);
  const href = getItemLink(item, { isAuthenticated, userRole });
  return (
    <article className="dc-card">
      <div className="dc-strip" />
      <div className="dc-head">
        <div className="dc-avatar">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div className="dc-head-text">
          <div className="dc-eyebrow">
            <span className="dc-type">{t(SOURCE_META.doctor.key)}</span>
            {item.specialization && (
              <span className="dc-spec">{item.specialization}</span>
            )}
          </div>
          <h3 className="dc-name">
            <Link
              to={href}
              className="dc-name-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {hl(item.title)}
            </Link>
          </h3>
        </div>
      </div>

      {item.clinic && (
        <p className="dc-clinic">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {item.clinic}
        </p>
      )}

      {item.preview && <p className="dc-about">{hl(item.preview)}</p>}

      <div className="dc-footer">
        <span className="dc-meta">
          {[
            item.country,
            item.articlesCount > 0
              ? t("publications", { count: item.articlesCount })
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <Link
          to={href}
          className="dc-open"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("profile_link")}
        </Link>
      </div>
    </article>
  );
}

function makeHighlight(searchTerm) {
  return function (text) {
    if (!searchTerm || !text) return text;
    const esc = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.split(new RegExp(`(${esc})`, "gi")).map((p, i) =>
      p.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark
          key={i}
          style={{ background: "#fde68a", borderRadius: 2, padding: "0 1px" }}
        >
          {p}
        </mark>
      ) : (
        p
      ),
    );
  };
}

const CSS = `
.nl-hero-card-link {text-decoration: none;color: inherit;display: block;}
.nl-hero-card-link:hover .nl-hero-card {transform: translateY(-4px);box-shadow: 0 32px 80px rgba(28,25,23,.18);}
@import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,300;1,8..60,400&family=Nunito:wght@300;400;500;600;700;800&display=swap');
/* Шрифты карточек дайджеста (NewsCard) — чтобы все карточки ленты были
   набраны одинаково, даже когда на вкладке нет ни одной карточки дайджеста. */
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
.nl-root*,.nl-root *::before,.nl-root *::after{box-sizing:border-box}
.nl-root{--cream:#faf8f4;--cream2:#f3efe8;--parchment:#ede8df;--ink:#1c1917;--ink2:#44403c;--ink3:#78716c;--teal:#0f766e;--teal-light:#14b8a6;--teal-pale:#f0fdfa;--teal-border:#99f6e4;--border:#e7e2d8;--border2:#d6d0c6;--shadow-sm:0 2px 8px rgba(28,25,23,.07),0 1px 3px rgba(28,25,23,.04);--shadow-md:0 8px 24px rgba(28,25,23,.09),0 2px 8px rgba(28,25,23,.04);--shadow-lg:0 20px 48px rgba(28,25,23,.12),0 4px 16px rgba(28,25,23,.06);--font-display:'Merriweather','Source Serif 4',Georgia,serif;--font-body:'Nunito',system-ui,sans-serif;--font-card-serif:'DM Serif Display',Georgia,serif;--font-card-sans:'DM Sans',system-ui,sans-serif;background:var(--cream);color:var(--ink);font-family:var(--font-body);font-size:15px;-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column;overflow-x:hidden;}
.nl-topbar{background:var(--ink);color:rgba(255,255,255,.35);height:30px;padding:0 40px;display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:500;letter-spacing:.1em;text-transform:uppercase}
.nl-root[dir=rtl] .nl-topbar{letter-spacing:0}
.nl-topbar-left{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:rgba(255,255,255,.4)}
.nl-topbar-date{color:rgba(255,255,255,.3);white-space:nowrap;flex-shrink:0}
.nl-nav{background:linear-gradient(150deg,#0c4a6e 0%,#0f766e 60%,#065f46 100%);position:sticky;top:0;z-index:200;height:60px;border-bottom:1px solid rgba(255,255,255,.1);box-shadow:0 4px 20px rgba(12,74,110,.25)}
.nl-nav::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 600px 200px at 80% 50%,rgba(20,184,166,.15) 0%,transparent 70%);pointer-events:none}
.nl-nav-inner{display:flex;align-items:center;height:100%;padding:0 40px;position:relative}
.nl-hamburger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:8px;margin-inline-end:8px;flex-shrink:0}
.nl-hamburger span{display:block;width:20px;height:2px;background:white;border-radius:1px}
.nl-nav-link{font-family:var(--font-body);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.55);background:none;border:none;cursor:pointer;padding:0 14px;height:60px;transition:color .15s;white-space:nowrap;position:relative}
.nl-root[dir=rtl] .nl-nav-link{letter-spacing:0}
.nl-nav-link::after{content:'';position:absolute;bottom:0;inset-inline-start:14px;inset-inline-end:14px;height:3px;background:var(--teal-light);border-radius:2px 2px 0 0;transform:scaleX(0);transition:transform .15s}
.nl-nav-link:hover{color:rgba(255,255,255,.9)}
.nl-nav-link.active{color:white}
.nl-nav-link.active::after{transform:scaleX(1)}
.nl-nav-logo{position:absolute;left:50%;transform:translateX(-50%);font-family:var(--font-display);font-size:26px;font-weight:900;letter-spacing:-.02em;color:white;text-decoration:none;line-height:1;white-space:nowrap}
.nl-root[dir=rtl] .nl-nav-logo{left:auto;right:50%;transform:translateX(50%)}
.nl-nav-logo span{color:#5eead4}
.nl-nav-right{margin-inline-start:auto;display:flex;align-items:center;gap:10px}
/* Шапка на телефоне и небольшом планшете — ДВА ряда: логотип слева, язык и
   вход справа; навигация отдельной строкой. Правило продублировано вместе со
   всей шапкой в DashboardLayout.jsx — стили этой страницы идут в каскаде
   позже и перекрывают его, поэтому менять надо оба места. */
@media (max-width: 900px){
  .nl-nav{height:auto}
  .nl-nav-inner{
    display:grid;
    grid-template-columns:auto 1fr;
    grid-template-areas:"logo right" "nav nav";
    align-items:center;
    row-gap:10px;column-gap:10px;
    height:auto;padding-top:10px;padding-bottom:10px
  }
  .nl-nav-logo{grid-area:logo;position:static;transform:none;justify-self:start;font-size:22px}
  .nl-root[dir=rtl] .nl-nav-logo{right:auto;transform:none}
  .nl-nav-right{grid-area:right;justify-self:end;display:flex;align-items:center;gap:8px;margin-inline-start:0;min-width:0}
  .dp-nav-links{grid-area:nav;display:flex}
  .dp-conf-btn{width:100%;justify-content:center}
}
@media (max-width: 520px){
  .nl-topbar-left{display:none}
  .dp-conf-btn{padding:9px 14px;font-size:13px}
  .nl-btn-member{max-width:46vw;overflow:hidden;text-overflow:ellipsis;padding:8px 12px}
}
.nl-locale-switcher{display:flex;align-items:center;gap:2px}
.nl-locale-btn{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgb(3 3 3);background:none;border:1px solid transparent;border-radius:6px;padding:4px 8px;cursor:pointer;transition:all .12s}
.nl-locale-btn:hover{color:rgba(64,67,233,.85);border-color:rgba(199,222,230,.2)}
.nl-locale-btn.active{color:rgba(14,3,3,.3);border-color:rgba(14,3,3,.3);background:rgba(123,192,212,.1)}
.nl-btn-member{background:rgba(255,255,255,.12);color:white;border:1.5px solid rgba(255,255,255,.25);font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:8px 16px;cursor:pointer;white-space:nowrap;text-decoration:none;border-radius:8px;transition:all .15s;backdrop-filter:blur(8px)}
.nl-root[dir=rtl] .nl-btn-member{letter-spacing:0}
.nl-btn-member:hover{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.4)}
.nl-hero{background: linear-gradient(150deg, #06324b 0%, #004bb6 60%, #065f46 100%);padding:44px 0 72px;position:relative;overflow:hidden}
.nl-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 700px 400px at 85% 40%,rgba(20,184,166,.18) 0%,transparent 65%),radial-gradient(ellipse 300px 500px at 5% 110%,rgba(6,95,70,.5) 0%,transparent 60%);pointer-events:none}
.nl-hero::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:60px;background:var(--cream);clip-path:ellipse(55% 100% at 50% 100%)}
.nl-hero-inner{padding:0 40px;position:relative;z-index:1}
.nl-hero-left{max-width:680px}
.nl-breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:14px}
.nl-root[dir=rtl] .nl-breadcrumb{letter-spacing:0}
.nl-breadcrumb a{color:inherit;text-decoration:none;transition:color .12s}
.nl-breadcrumb a:hover{color:rgba(255,255,255,.8)}
.nl-breadcrumb span{color:rgba(255,255,255,.75)}
.nl-breadcrumb svg{color:rgba(255,255,255,.3);flex-shrink:0}
.nl-header-tag{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.85);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:6px 16px;border-radius:100px;margin-bottom:16px}
.nl-header-tag::before{content:'';width:6px;height:6px;background:#5eead4;border-radius:50%}
.nl-hero-title{font-family:var(--font-display);font-size:clamp(28px,4vw,52px);font-weight:700;letter-spacing:-.015em;color:white;line-height:1.15;margin-bottom:10px}
.nl-root[dir=rtl] .nl-hero-title{letter-spacing:0;line-height:1.3}
.nl-hero-title em{font-style:italic;font-weight:600;color:#5eead4}
.nl-hero-sub{font-family:var(--font-display);font-size:17px;font-style:italic;color:rgba(255,255,255,.6);margin-bottom:16px}
.nl-hero-stats{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.nl-stat-chip{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.8);font-size:13px;font-weight:500;padding:6px 14px;border-radius:100px}
.nl-stat-chip b{color:white;font-weight:700}
.nl-chip-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.nl-chip-dot.news{background:#5eead4}
.nl-chip-dot.article{background:#86efac}
.nl-chip-dot.science{background:#93c5fd}
.nl-chip-dot.doctor{background:#c084fc}
.nl-filter-bar{background:white;border-bottom:1px solid var(--border);box-shadow:0 2px 12px rgba(28,25,23,.05);position:sticky;top:60px;z-index:100}
.nl-filter-bar-inner{padding:0 40px;display:flex;align-items:center;gap:12px;min-height:56px;flex-wrap:wrap}
.nl-filter-search{position:relative;display:flex;align-items:center;flex:1;min-width:180px;max-width:340px}
.nl-search-input{width:100%;font:inherit;font-size:13px;padding:7px 28px 7px 12px;border:1px solid var(--border);border-radius:999px;background:#fff;outline:none}
.nl-search-input:focus{border-color:#0f766e}
.nl-search-clear{position:absolute;inset-inline-end:8px;border:0;background:none;font-size:16px;line-height:1;color:#9ca3af;cursor:pointer;padding:0}
.nl-mine{display:flex;gap:4px;flex-shrink:0;margin-inline-end:8px}
.nl-mine-btn{font:inherit;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:5px 12px;border:1px solid var(--border);background:#fff;color:#6b7280;border-radius:999px;cursor:pointer;white-space:nowrap}
.nl-mine-btn.active{background:#0f766e;border-color:#0f766e;color:#fff}
.nl-filter-tabs{display:flex;align-items:center;gap:4px;flex-shrink:0;border-inline-end:1px solid var(--border);padding-inline-end:16px;margin-inline-end:4px}
.nl-filter-tab{font-family:var(--font-body);font-size:13px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink3);background:transparent;border:1.5px solid transparent;border-radius:8px;padding:7px 14px;cursor:pointer;transition:all .15s;white-space:nowrap}
.nl-root[dir=rtl] .nl-filter-tab{letter-spacing:0}
.nl-filter-tab:hover{background:var(--cream2);color:var(--ink2);border-color:var(--border)}
.nl-filter-tab.active{background:var(--teal-pale);border-color:var(--teal-border);color:var(--teal)}
.nl-filter-right{display:flex;align-items:center;gap:10px;flex:1;flex-wrap:wrap}
.nl-filter-search{position:relative;display:flex;align-items:center;flex:1;min-width:200px;max-width:380px}
.nl-filter-search-ico{position:absolute;inset-inline-start:11px;color:var(--ink3);pointer-events:none;flex-shrink:0}
.nl-filter-search-input{width:100%;font-family:var(--font-body);font-size:14px;color:var(--ink);background:var(--cream);border:1.5px solid var(--border);border-radius:8px;padding:8px 32px 8px 32px;outline:none;transition:all .15s}
.nl-filter-search-input::placeholder{color:var(--ink3)}
.nl-filter-search-input:focus{border-color:var(--teal);background:white;box-shadow:0 0 0 3px rgba(15,118,110,.08)}
.nl-filter-search-clear{position:absolute;inset-inline-end:9px;background:none;border:none;cursor:pointer;color:var(--ink3);font-size:11px;padding:2px;line-height:1}
.nl-filter-search-clear:hover{color:var(--ink)}
.nl-filter-adv-btn{display:flex;align-items:center;gap:7px;font-family:var(--font-body);font-size:13px;font-weight:600;color:var(--ink2);background:var(--cream);border:1.5px solid var(--border);border-radius:8px;padding:8px 14px;cursor:pointer;transition:all .15s;white-space:nowrap;flex-shrink:0;position:relative}
.nl-filter-adv-btn:hover{background:var(--cream2);border-color:var(--border2)}
.nl-filter-adv-btn.open{background:var(--teal-pale);border-color:var(--teal-border);color:var(--teal)}
.nl-filter-badge{background:var(--teal);color:white;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-inline-start:2px}
.nl-sort-wrap{display:flex;align-items:center;gap:7px;color:var(--ink3);flex-shrink:0}
.nl-sort-select{font-family:var(--font-body);font-size:13px;font-weight:600;color:var(--ink2);background:var(--cream);border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;cursor:pointer;outline:none;transition:all .15s;appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2378716c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-inline-end:28px}
.nl-sort-select:focus{border-color:var(--teal);background-color:white}
.nl-filter-apply-btn{font-family:var(--font-body);font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:var(--teal);color:white;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;transition:background .15s;white-space:nowrap;flex-shrink:0}
.nl-filter-apply-btn:hover{background:#0d6560}
.nl-adv-panel{border-top:1px solid var(--border);background:var(--cream2)}
.nl-adv-panel-inner{padding:20px 40px;display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end}
.nl-adv-field{display:flex;flex-direction:column;gap:6px;flex:1;min-width:180px}
.nl-adv-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.nl-root[dir=rtl] .nl-adv-label{letter-spacing:0}
.nl-adv-input,.nl-adv-select{font-family:var(--font-body);font-size:14px;color:var(--ink);background:white;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;outline:none;transition:all .15s;width:100%}
.nl-adv-input:focus,.nl-adv-select:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(15,118,110,.08)}
.nl-adv-select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2378716c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-inline-end:28px;cursor:pointer}
.nl-adv-actions{display:flex;gap:8px;align-items:center;flex-shrink:0}
.nl-adv-apply{font-family:var(--font-body);font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:var(--teal);color:white;border:none;border-radius:8px;padding:10px 24px;cursor:pointer;transition:background .15s;white-space:nowrap}
.nl-adv-apply:hover{background:#0d6560}
.nl-adv-reset{font-family:var(--font-body);font-size:13px;font-weight:600;color:var(--ink3);background:none;border:1.5px solid var(--border);border-radius:8px;padding:10px 16px;cursor:pointer;transition:all .15s;white-space:nowrap}
.nl-adv-reset:hover{border-color:var(--border2);color:var(--ink2)}
.nl-active-tags{display:flex;align-items:center;gap:8px;padding:10px 40px;flex-wrap:wrap;border-top:1px solid var(--border)}
.nl-active-tags-bar{background:var(--cream2)}
.nl-tag{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:500;color:var(--teal);background:var(--teal-pale);border:1px solid var(--teal-border);border-radius:100px;padding:4px 10px 4px 12px}
.nl-tag b{font-weight:700}
.nl-tag button{background:none;border:none;cursor:pointer;color:var(--teal);font-size:11px;padding:0;line-height:1;opacity:.7;margin-inline-start:2px}
.nl-tag button:hover{opacity:1}
.nl-tag-reset-all{font-size:12px;font-weight:600;color:var(--ink3);background:none;border:1px solid var(--border);border-radius:100px;padding:4px 12px;cursor:pointer;transition:all .12s;margin-inline-start:4px}
.nl-tag-reset-all:hover{color:var(--ink);border-color:var(--border2)}
.nl-content{flex:1;background:var(--cream)}
.nl-content-inner{padding:32px 40px 64px}
.nl-hero-card-wrap{margin-bottom:32px}
.nl-hero-card{background:white;border:1px solid var(--border);border-radius:20px;overflow:hidden;display:grid;grid-template-columns:1fr 2fr;min-height:340px;box-shadow:var(--shadow-lg);transition:box-shadow .25s,transform .25s;cursor:pointer}
.nl-hero-card:hover{box-shadow:0 28px 64px rgba(28,25,23,.14);transform:translateY(-3px)}
.nl-hero-card.nl-hero-card--noimg{grid-template-columns:1fr;min-height:0}
.nl-hero-card-img{position:relative;overflow:hidden}
.nl-hero-card-img img{width:450px;height:350px;object-fit:cover;transition:transform .4s ease}
.nl-hero-card:hover .nl-hero-card-img img{transform:scale(1.04)}
.nl-hero-card-overlay{position:absolute;inset:0;background:linear-gradient(135deg,rgba(12,74,110,.15) 0%,transparent 60%)}
.nl-hero-card-body{padding:36px 40px;display:flex;flex-direction:column;justify-content:center}
.nl-hero-card-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.nl-hero-badge{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:4px 12px;border-radius:100px;white-space:nowrap}
.nl-hero-badge-spec{background:var(--cream2);color:var(--ink3);border:1px solid var(--border)}
.nl-hero-date{font-size:12px;color:var(--ink3);margin-inline-start:auto}
.nl-hero-card-title{font-family:var(--font-display);font-size:clamp(18px,2vw,26px);font-weight:700;line-height:1.3;color:var(--ink);margin-bottom:14px;letter-spacing:-.01em}
.nl-hero-card-preview{font-size:14px;color:var(--ink3);line-height:1.7;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;flex:1;margin-bottom:20px}
.nl-hero-card-footer{display:flex;align-items:center;gap:8px;padding-top:16px;border-top:1px solid var(--border)}
.nl-hero-author{font-size:13px;font-weight:600;color:var(--ink2)}
.nl-hero-dot{color:var(--border2)}
.nl-hero-country{font-size:13px;color:var(--ink3)}
.nl-hero-stat{display:flex;align-items:center;gap:5px;font-size:13px;color:var(--ink3);font-weight:500}
.nl-hero-stat svg{opacity:.6}
.nl-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}
.nl-more-wrap{display:flex;justify-content:center;padding:40px 0 0}
.nl-btn-more{font-family:var(--font-body);font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--teal);background:white;border:2px solid var(--teal-border);border-radius:10px;padding:11px 36px;cursor:pointer;transition:all .2s;box-shadow:var(--shadow-sm)}
.nl-root[dir=rtl] .nl-btn-more{letter-spacing:0}
.nl-btn-more:hover:not(:disabled){background:var(--teal);color:white;border-color:var(--teal)}
.nl-btn-more:disabled{opacity:.4;cursor:not-allowed}
.nl-loading{display:flex;flex-direction:column;align-items:center;padding:80px 0;gap:16px}
.nl-spinner{width:44px;height:44px;border:3px solid var(--parchment);border-top-color:var(--teal);border-radius:50%;animation:nl-spin .7s linear infinite}
@keyframes nl-spin{to{transform:rotate(360deg)}}
.nl-loading-text{font-family:var(--font-display);font-size:18px;font-style:italic;color:var(--ink3)}
.nl-empty{display:flex;flex-direction:column;align-items:center;padding:80px 0;gap:16px}
.nl-empty-icon{font-size:48px;opacity:.35}
.nl-empty-title{font-family:var(--font-display);font-size:22px;color:var(--ink2);font-style:italic}
.nl-empty-reset{font-family:var(--font-body);font-size:14px;font-weight:600;color:var(--teal);background:var(--teal-pale);border:1.5px solid var(--teal-border);border-radius:8px;padding:10px 24px;cursor:pointer;transition:all .15s}
.nl-empty-reset:hover{background:var(--teal);color:white;border-color:var(--teal)}
.nl-footer{background:var(--ink);border-top:3px solid var(--teal);padding:28px 0;margin-top:auto}
.nl-footer-inner{padding:0 40px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.nl-footer-brand{display:flex;align-items:baseline;gap:14px}
.nl-footer-logo{font-family:var(--font-display);font-size:24px;font-weight:700;letter-spacing:-.02em;color:white}
.nl-footer-logo span{color:var(--teal-light)}
.nl-footer-tagline{font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.3)}
.nl-root[dir=rtl] .nl-footer-tagline{letter-spacing:0}
.nl-footer-links{display:flex;gap:4px}
.nl-footer-link{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.4);background:none;border:none;cursor:pointer;padding:5px 12px;border-radius:6px;transition:all .12s}
.nl-root[dir=rtl] .nl-footer-link{letter-spacing:0}
.nl-footer-link:hover{color:white;background:rgba(255,255,255,.08)}
@media(max-width:1023px) and (min-width:768px){.nl-nav-inner,.nl-topbar,.nl-hero-inner,.nl-filter-bar-inner,.nl-adv-panel-inner,.nl-content-inner,.nl-footer-inner,.nl-active-tags{padding-left:24px;padding-right:24px}.nl-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.nl-hero-card{grid-template-columns:1fr}.nl-hero-card-img{height:260px}.nl-hero-title{font-size:clamp(22px,3.5vw,32px)}}
@media(max-width:769px){.nl-topbar{padding:0 20px;font-size:9px}.nl-topbar-date{display:none}.nl-nav-inner{padding:0 20px}.nl-hamburger{display:flex}.nl-nav-links{display:none;position:absolute;top:60px;left:0;right:0;background:linear-gradient(135deg,#0c4a6e 0%,#0f766e 100%);flex-direction:column;align-items:flex-start;padding:8px 0;border-top:1px solid rgba(255,255,255,.1);z-index:300}.nl-nav-links.open{display:flex}.nl-nav-link{width:100%;padding:12px 20px;height:auto;font-size:11px}.nl-nav-link::after{display:none}.nl-nav-logo{font-size:20px}.nl-locale-btn{padding:3px 6px;font-size:9px}.nl-btn-member{display:none}.nl-hero{padding:28px 0 56px}.nl-hero-inner{padding:0 20px}.nl-hero-title{font-size:clamp(20px,6vw,28px)}.nl-filter-bar-inner{padding:0 16px;gap:8px}.nl-filter-tabs{border-inline-end:none;padding-inline-end:0;margin-inline-end:0;border-bottom:1px solid var(--border);padding-bottom:10px;width:100%;overflow-x:auto}.nl-filter-right{width:100%}.nl-filter-search{max-width:100%}.nl-adv-panel-inner{padding:16px 16px}.nl-active-tags{padding:8px 16px}.nl-content-inner{padding:20px 16px 48px}.nl-footer-inner{padding:0 20px}.nl-hero-card{grid-template-columns:1fr}.nl-hero-card-img{height:400px;width:400px}.nl-hero-card-body{padding:20px 18px}.nl-grid{grid-template-columns:1fr;gap:16px}}
@media(max-width:769px){.nl-topbar{display:none}.nl-nav-inner,.nl-hero-inner,.nl-content-inner,.nl-footer-inner{padding-left:14px;padding-right:14px}.nl-footer-brand{flex-direction:column;gap:2px}.nl-footer-links{flex-wrap:wrap}}
/* ── Карточка врача: та же типографика и ритм, что у карточек материалов ── */
.dc-card{background:#fff;border:1px solid var(--border);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--shadow-sm);transition:box-shadow .25s,transform .25s,border-color .2s}
.dc-card:hover{box-shadow:var(--shadow-md);transform:translateY(-4px);border-color:rgba(20,17,15,.15)}
.dc-strip{height:4px;flex-shrink:0;background:linear-gradient(90deg,#7c3d9f,#a855f7)}
.dc-head{display:flex;align-items:center;gap:14px;padding:20px 22px 0}
.dc-avatar{width:56px;height:56px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f5f3ff,#ede9fe);color:#7c3d9f;border:1px solid #e9d8fd}
.dc-head-text{min-width:0}
.dc-eyebrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.dc-type,.dc-spec{font-family:var(--font-card-sans);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:100px;white-space:nowrap;line-height:1.4}
.dc-type{background:rgba(124,61,159,.1);color:#7c3d9f}
.dc-spec{background:var(--cream2);color:var(--ink3);border:1px solid var(--border)}
.dc-name{font-family:var(--font-card-serif);font-size:21px;font-weight:400;line-height:1.3;letter-spacing:-.01em;color:#14110f}
.dc-name-link{color:inherit;text-decoration:none;background-image:linear-gradient(currentColor,currentColor);background-size:0% 1px;background-repeat:no-repeat;background-position:0 100%;transition:background-size .3s cubic-bezier(.4,0,.2,1)}
.dc-card:hover .dc-name-link{background-size:100% 1px}
.dc-clinic{display:flex;align-items:center;gap:6px;font-family:var(--font-card-sans);font-size:13px;font-style:italic;color:#7a7268;margin:12px 22px 0;line-height:1.4}
.dc-clinic svg{flex-shrink:0;opacity:.6}
.dc-about{font-family:var(--font-card-sans);font-size:15.5px;line-height:1.72;color:#3d3830;margin:12px 22px 16px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.dc-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto;padding:14px 22px 18px;border-top:1px solid var(--border)}
.dc-meta{font-family:var(--font-card-sans);font-size:12px;color:#7a7268;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-open{font-family:var(--font-card-sans);font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;text-decoration:none;color:#7c3d9f;border:1.5px solid currentColor;border-radius:100px;padding:6px 14px;white-space:nowrap;flex-shrink:0;opacity:.8;transition:background .18s,color .18s,opacity .18s}
.dc-open:hover{opacity:1;background:#7c3d9f;color:#fff}
@media(max-width:479px){.dc-name{font-size:17px}.dc-about{font-size:13px;-webkit-line-clamp:2}}
@media(hover:none) and (pointer:coarse){.nl-hero-card:hover{transform:none;box-shadow:var(--shadow-lg)}.nl-btn-more:hover:not(:disabled){background:white;color:var(--teal);border-color:var(--teal-border)}}
`;
