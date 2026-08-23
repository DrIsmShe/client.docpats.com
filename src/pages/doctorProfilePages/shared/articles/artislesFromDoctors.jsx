// client/modules/doctorProfile/pages/ArticlesFromDoctors.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaCommentDots, FaUserNurse } from "react-icons/fa6";
import { BsCalendar2DateFill } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import useCommentCountBulk from "../../../../components/shared/useCommentCount";
import { useTranslation } from "react-i18next";
import { COUNTRIES, COUNTRY_ALIASES } from "../../../../constants/countries";

const API_BASE = process.env.REACT_APP_API_URL;

/* ===== helpers ===== */
const normalize = (s) => (s || "").toString().trim().toLowerCase();
const stripHtml = (s) => (s || "").replace(/<[^>]*>/g, " ");
const normalizeCountryForSelect = (s, t) => {
  const raw = (s || "").trim();
  return (
    COUNTRY_ALIASES[raw] || raw || t("articles-from-doctor.misc.noCountry")
  );
};

const authorName = (a) => {
  const n1 = [a?.author?.firstName, a?.author?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (n1) return n1;
  const n2 = [a?.authorFirstName, a?.authorLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return n2 || a?.author_name || "Неизвестно";
};

const getCountry = (a, t) =>
  normalizeCountryForSelect(a?.country ?? a?.author?.country ?? "", t);

const useDebounced = (value, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

/* ===== STYLES ===== */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  :root {
    --cream: #faf8f4;
    --cream2: #f3efe8;
    --parchment: #ede8df;
    --ink: #1c1917;
    --ink2: #44403c;
    --ink3: #78716c;
    --teal: #0f766e;
    --teal-mid: #0d9488;
    --teal-light: #14b8a6;
    --teal-pale: #f0fdfa;
    --teal-border: #99f6e4;
    --gold: #b45309;
    --border: #e7e2d8;
    --border2: #d6d0c6;
    --shadow-xs: 0 1px 3px rgba(28,25,23,.05);
    --shadow-sm: 0 2px 8px rgba(28,25,23,.07), 0 1px 3px rgba(28,25,23,.04);
    --shadow-md: 0 8px 24px rgba(28,25,23,.09), 0 2px 8px rgba(28,25,23,.04);
    --shadow-hover: 0 16px 40px rgba(15,118,110,.13), 0 4px 12px rgba(28,25,23,.06);
    --radius: 16px;
    --radius-sm: 10px;
    --font-display: 'Lora', Georgia, serif;
    --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
    --transition: all .22s cubic-bezier(.4,0,.2,1);
  }

  .afd-wrap {
    background: var(--cream);
    min-height: 100vh;
    font-family: var(--font-body);
    color: var(--ink);
  }

  /* ── PAGE HEADER ── */
  .afd-header {
    background: linear-gradient(150deg, #0c4a6e 0%, #0f766e 60%, #065f46 100%);
    padding: 52px 40px 72px;
    position: relative;
    overflow: hidden;
  }
  .afd-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 700px 400px at 90% 40%, rgba(20,184,166,.18) 0%, transparent 65%),
      radial-gradient(ellipse 300px 500px at 5% 110%, rgba(6,95,70,.5) 0%, transparent 60%);
    pointer-events: none;
  }
  .afd-header::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 56px;
    background: var(--cream);
    clip-path: ellipse(55% 100% at 50% 100%);
  }
  .afd-header-inner {
    max-width: 1280px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }
  .afd-header-tag {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(255,255,255,.12);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.22);
    color: rgba(255,255,255,.88);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 100px;
    margin-bottom: 18px;
  }
  .afd-header-tag::before { content: ''; width: 6px; height: 6px; background: #5eead4; border-radius: 50%; }
  .afd-header-title {
    font-family: var(--font-display);
    font-size: clamp(26px, 4vw, 42px);
    font-weight: 700;
    color: white;
    line-height: 1.2;
    letter-spacing: -.015em;
    margin-bottom: 14px;
  }
  .afd-header-stats {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    align-items: center;
  }
  .afd-stat-chip {
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    color: rgba(255,255,255,.8);
    font-size: 12px;
    font-weight: 500;
    padding: 5px 14px;
    border-radius: 100px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .afd-stat-chip b { color: white; }
  .afd-updating-dot {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: rgba(255,255,255,.65);
    font-size: 12px;
  }
  .afd-updating-dot::before {
    content: '';
    width: 7px; height: 7px;
    background: #5eead4;
    border-radius: 50%;
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }

  /* ── LAYOUT BODY ── */
  .afd-body {
    max-width: 1280px;
    margin: -28px auto 0;
    padding: 0 32px 80px;
    position: relative;
    z-index: 2;
  }
  @media (max-width: 768px) { .afd-body { padding: 0 16px 60px; } }

  /* ── FILTER PANEL ── */
  .afd-filters {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    margin-bottom: 36px;
  }
  .afd-filters-head {
    background: var(--cream2);
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .afd-filters-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--ink3);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .afd-filters-title::before {
    content: '';
    width: 14px; height: 14px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230f766e' stroke-width='2.5'%3E%3Cpath d='M3 6h18M7 12h10M11 18h2'/%3E%3C/svg%3E") center/contain no-repeat;
  }
  .afd-reset-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--ink3);
    background: none;
    border: 1.5px solid var(--border2);
    border-radius: 100px;
    padding: 5px 14px;
    cursor: pointer;
    transition: var(--transition);
  }
  .afd-reset-btn:hover { border-color: var(--teal); color: var(--teal); background: var(--teal-pale); }
  .afd-filters-grid {
    padding: 22px 24px 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  .afd-filters-row-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 24px 18px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .afd-checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink2);
    cursor: pointer;
    user-select: none;
  }
  .afd-checkbox {
    appearance: none;
    width: 18px; height: 18px;
    border: 2px solid var(--border2);
    border-radius: 5px;
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
    transition: var(--transition);
    background: white;
  }
  .afd-checkbox:checked {
    background: var(--teal);
    border-color: var(--teal);
  }
  .afd-checkbox:checked::after {
    content: '';
    position: absolute;
    top: 2px; left: 5px;
    width: 5px; height: 8px;
    border: 2px solid white;
    border-top: none;
    border-left: none;
    transform: rotate(45deg);
  }
  .afd-perpage-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink3);
  }

  /* ── FIELD ── */
  .afd-field { display: flex; flex-direction: column; gap: 6px; }
  .afd-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--ink3);
  }
  .afd-input, .afd-select {
    height: 38px;
    padding: 0 12px;
    background: var(--cream2);
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--ink);
    transition: var(--transition);
    outline: none;
    width: 100%;
  }
  .afd-input::placeholder { color: var(--ink3); }
  .afd-input:focus, .afd-select:focus {
    border-color: var(--teal-mid);
    background: white;
    box-shadow: 0 0 0 3px rgba(15,118,110,.1);
  }
  .afd-select-sm {
    height: 36px;
    padding: 0 10px;
    background: var(--cream2);
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--ink);
    transition: var(--transition);
    outline: none;
    min-width: 80px;
  }
  .afd-select-sm:focus {
    border-color: var(--teal-mid);
    background: white;
    box-shadow: 0 0 0 3px rgba(15,118,110,.1);
  }

  /* ── GRID ── */
  .afd-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 48px;
  }
  @media (max-width: 640px) { .afd-grid { grid-template-columns: 1fr; gap: 16px; } }

  /* ── ARTICLE CARD ── */
  .afd-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    transition: var(--transition);
    text-decoration: none;
    color: inherit;
  }
  .afd-card:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-3px);
    border-color: var(--teal-border);
  }
  .afd-card-img-wrap {
    position: relative;
    overflow: hidden;
    height: 200px;
    flex-shrink: 0;
  }
  .afd-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform .5s cubic-bezier(.4,0,.2,1);
    display: block;
  }
  .afd-card:hover .afd-card-img { transform: scale(1.04); }
  .afd-card-img-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(12,74,110,.55) 0%, transparent 50%);
    pointer-events: none;
  }
  .afd-card-badges {
    position: absolute;
    top: 12px; left: 12px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .afd-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 100px;
    backdrop-filter: blur(8px);
  }
  .afd-badge-country {
    background: rgba(255,255,255,.88);
    color: var(--ink2);
    border: 1px solid rgba(255,255,255,.5);
  }
  .afd-badge-spec {
    background: rgba(15,118,110,.85);
    color: white;
    border: 1px solid rgba(20,184,166,.4);
  }
  .afd-card-body {
    padding: 20px 22px 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .afd-card-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.4;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .afd-card-preview {
    font-size: 13px;
    color: var(--ink3);
    line-height: 1.65;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 0;
  }
  .afd-card-footer {
    padding: 12px 22px 16px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .afd-card-meta {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .afd-meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--ink3);
    font-weight: 500;
  }
  .afd-meta-item svg { opacity: .7; flex-shrink: 0; }
  .afd-author-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--teal);
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .afd-author-avatar {
    width: 22px; height: 22px;
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-light) 100%);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }

  /* ── EMPTY STATE ── */
  .afd-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px 20px;
    color: var(--ink3);
  }
  .afd-empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: .4;
  }
  .afd-empty-text {
    font-family: var(--font-display);
    font-size: 18px;
    color: var(--ink2);
    margin-bottom: 6px;
  }
  .afd-empty-sub { font-size: 13px; }

  /* ── LOADING ── */
  .afd-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 20px;
    gap: 16px;
    color: var(--ink3);
    font-size: 14px;
  }
  .afd-spinner {
    width: 44px; height: 44px;
    border: 3px solid var(--parchment);
    border-top-color: var(--teal);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── ERROR ── */
  .afd-error {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #dc2626;
    border-radius: var(--radius-sm);
    padding: 14px 20px;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 24px;
  }

  /* ── PAGINATION ── */
  .afd-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .afd-page-btn {
    min-width: 38px; height: 38px;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 10px;
    background: white;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink2);
    cursor: pointer;
    transition: var(--transition);
    font-family: var(--font-body);
  }
  .afd-page-btn:hover:not(:disabled) {
    border-color: var(--teal);
    color: var(--teal);
    background: var(--teal-pale);
  }
  .afd-page-btn.active {
    background: var(--teal);
    border-color: var(--teal);
    color: white;
  }
  .afd-page-btn:disabled {
    opacity: .35;
    cursor: not-allowed;
  }
  .afd-page-ellipsis {
    color: var(--ink3);
    font-size: 14px;
    padding: 0 4px;
    line-height: 38px;
  }
`;

export default function ArticlesFromDoctors() {
  const { t } = useTranslation();

  const [articles, setArticles] = useState([]);
  const [meta, setMeta] = useState({ specializations: [], categories: [] });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [booting, setBooting] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  const [qTitle, setQTitle] = useState("");
  const [qAuthor, setQAuthor] = useState("");
  const [country, setCountry] = useState("all");
  const [specialization, setSpecialization] = useState("all");
  const [minLikes, setMinLikes] = useState(0);
  const [withImage, setWithImage] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  const dqTitle = useDebounced(qTitle);
  const dqAuthor = useDebounced(qAuthor);
  const dDateFrom = useDebounced(dateFrom);
  const dDateTo = useDebounced(dateTo);

  const articleIds = useMemo(
    () => (Array.isArray(articles) ? articles.map((a) => a._id) : []),
    [articles],
  );
  const commentCounts = useCommentCountBulk(articleIds);

  const options = useMemo(() => {
    const toSorted = (arr) =>
      (arr || []).filter(Boolean).sort((a, b) => a.localeCompare(b, "ru"));
    return {
      countries: ["all", ...COUNTRIES],
      specializations: ["all", ...toSorted(meta.specializations || [])],
    };
  }, [meta]);

  const cancelRef = useRef(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setError(null);
      setFetching(!booting);
      if (cancelRef.current)
        cancelRef.current.cancel("Canceled due to new request");
      const source = axios.CancelToken.source();
      cancelRef.current = source;

      try {
        const params = {
          page,
          perPage,
          previewWords: 30,
          qTitle: dqTitle || undefined,
          qAuthor: dqAuthor || undefined,
          country: country !== "all" ? country : undefined,
          specialization: specialization !== "all" ? specialization : undefined,
          minLikes: minLikes > 0 ? minLikes : undefined,
          withImage: withImage || undefined,
          dateFrom: dDateFrom || undefined,
          dateTo: dDateTo || undefined,
          sortBy: sortBy || undefined,
        };

        const { data } = await axios.get(
          `${API_BASE}/doctor-profile/articles-all`,
          {
            withCredentials: true,
            params,
            cancelToken: source.token,
          },
        );

        setArticles(Array.isArray(data?.articles) ? data.articles : []);
        setTotalPages(data?.totalPages || 1);
        setTotal(data?.total ?? (data?.articles?.length || 0));
        if (data?.meta) setMeta(data.meta);
      } catch (e) {
        if (!axios.isCancel(e))
          setError(t("articles-from-doctor.misc.loadError"));
      } finally {
        setBooting(false);
        setFetching(false);
      }
    };

    fetchArticles();
    return () => {
      if (cancelRef.current) cancelRef.current.cancel("unmount");
    };
  }, [
    page,
    perPage,
    dqTitle,
    dqAuthor,
    country,
    specialization,
    minLikes,
    withImage,
    dDateFrom,
    dDateTo,
    sortBy,
    t,
  ]);

  const filteredCount = useMemo(() => {
    let list = [...articles];
    const qT = normalize(dqTitle);
    const qA = normalize(dqAuthor);

    if (qT) {
      list = list.filter((a) => {
        const hay =
          normalize(a?.title) +
          " " +
          normalize(stripHtml(a?.preview)) +
          " " +
          normalize(stripHtml(a?.content));
        return hay.includes(qT);
      });
    }
    if (qA)
      list = list.filter((a) =>
        normalize(authorName(a)).includes(normalize(qAuthor)),
      );
    if (country !== "all")
      list = list.filter(
        (a) => normalize(getCountry(a, t)) === normalize(country),
      );
    if (specialization !== "all") {
      list = list.filter(
        (a) =>
          normalize(String(a?.specialization || a?.author?.specialty || "")) ===
          normalize(specialization),
      );
    }
    if (minLikes > 0)
      list = list.filter(
        (a) => (a?.likes?.length || a?.likesCount || 0) >= Number(minLikes),
      );
    if (withImage)
      list = list.filter(
        (a) => a?.imageUrl && String(a.imageUrl).trim().length > 0,
      );
    if (dDateFrom || dDateTo) {
      const fromTs = dDateFrom ? new Date(dDateFrom).getTime() : null;
      const toTs = dDateTo ? new Date(dDateTo).getTime() : null;
      list = list.filter((a) => {
        const ts = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;
        return true;
      });
    }
    return list.length;
  }, [
    articles,
    dqTitle,
    dqAuthor,
    country,
    specialization,
    minLikes,
    withImage,
    dDateFrom,
    dDateTo,
  ]);

  const handlePerPageChange = (e) => {
    const v = Number(e.target.value) || 12;
    setPerPage(v);
    setPage(1);
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const buildPageItems = () => {
    const items = [];
    const maxButtons = 7;
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    items.push(1);
    if (left > 2) items.push("…");
    for (let i = left; i <= right; i++) items.push(i);
    if (right < totalPages - 1) items.push("…");
    items.push(totalPages);
    return items;
  };

  const resetFilters = () => {
    setQTitle("");
    setQAuthor("");
    setCountry("all");
    setSpecialization("all");
    setMinLikes(0);
    setWithImage(false);
    setDateFrom("");
    setDateTo("");
    setSortBy("date_desc");
    setPage(1);
  };

  // helper: author initials
  const getInitials = (article) => {
    const name = authorName(article);
    const parts = name.split(" ");
    return (
      ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "Dr"
    );
  };

  return (
    <div className="afd-wrap">
      <style>{styles}</style>

      {/* ── PAGE HEADER ── */}
      <div className="afd-header">
        <div className="afd-header-inner">
          <div className="afd-header-tag">
            {t("articles-from-doctor.header.allArticles") ||
              "Medical Knowledge Base"}
          </div>
          <h1 className="afd-header-title">
            {t("articles-from-doctor.header.allArticles")}
          </h1>
          <div className="afd-header-stats">
            <div className="afd-stat-chip">
              {t("articles-from-doctor.header.found")}: <b>{filteredCount}</b>
            </div>
            <div className="afd-stat-chip">
              {t("articles-from-doctor.header.total")}: <b>{total}</b>
            </div>
            <div className="afd-stat-chip">
              {t("articles-from-doctor.header.page")} <b>{page}</b>{" "}
              {t("articles-from-doctor.header.of")} <b>{totalPages}</b>
            </div>
            {fetching && (
              <div className="afd-updating-dot">
                {t("articles-from-doctor.misc.updating")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="afd-body">
        {error && <div className="afd-error">{error}</div>}

        {/* ── FILTERS ── */}
        <div className="afd-filters">
          <div className="afd-filters-head">
            <div className="afd-filters-title">
              {t("articles-from-doctor.filters.searchTitleText") || "Filters"}
            </div>
            <button className="afd-reset-btn" onClick={resetFilters}>
              ↺ {t("articles-from-doctor.filters.reset")}
            </button>
          </div>

          <div className="afd-filters-grid">
            <div className="afd-field">
              <label className="afd-label">
                {t("articles-from-doctor.filters.searchTitleText")}
              </label>
              <input
                type="text"
                className="afd-input"
                placeholder={t(
                  "articles-from-doctor.filters.searchPlaceholder",
                )}
                value={qTitle}
                onChange={(e) => setQTitle(e.target.value)}
              />
            </div>

            <div className="afd-field">
              <label className="afd-label">
                {t("articles-from-doctor.filters.author")}
              </label>
              <input
                type="text"
                className="afd-input"
                placeholder={t(
                  "articles-from-doctor.filters.authorPlaceholder",
                )}
                value={qAuthor}
                onChange={(e) => setQAuthor(e.target.value)}
              />
            </div>

            <div className="afd-field">
              <label className="afd-label">
                {t("articles-from-doctor.filters.country")}
              </label>
              <select
                className="afd-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {options.countries?.map((c) => (
                  <option key={c} value={c}>
                    {c === "all"
                      ? t("articles-from-doctor.filters.allCountries")
                      : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="afd-field">
              <label className="afd-label">
                {t("articles-from-doctor.filters.specialization")}
              </label>
              <select
                className="afd-select"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              >
                {options.specializations?.map((s) => (
                  <option key={s} value={s}>
                    {s === "all"
                      ? t("articles-from-doctor.filters.allSpecializations")
                      : s}
                  </option>
                ))}
              </select>
            </div>

            <div className="afd-field">
              <label className="afd-label">
                {t("articles-from-doctor.filters.sort")}
              </label>
              <select
                className="afd-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date_desc">
                  {t("articles-from-doctor.filters.sort_new")}
                </option>
                <option value="date_asc">
                  {t("articles-from-doctor.filters.sort_old")}
                </option>
                <option value="likes_desc">
                  {t("articles-from-doctor.filters.sort_likes")}
                </option>
                <option value="comments_desc">
                  {t("articles-from-doctor.filters.sort_comments")}
                </option>
                <option value="title_asc">
                  {t("articles-from-doctor.filters.sort_title")}
                </option>
                <option value="author_asc">
                  {t("articles-from-doctor.filters.sort_author")}
                </option>
              </select>
            </div>

            <div className="afd-field">
              <label className="afd-label">
                {t("articles-from-doctor.filters.minLikes")}
              </label>
              <input
                type="number"
                min={0}
                className="afd-input"
                value={minLikes}
                onChange={(e) =>
                  setMinLikes(Math.max(0, Number(e.target.value || 0)))
                }
              />
            </div>

            <div className="afd-field">
              <label className="afd-label">
                {t("articles-from-doctor.filters.dateFrom")}
              </label>
              <input
                type="date"
                className="afd-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="afd-field">
              <label className="afd-label">
                {t("articles-from-doctor.filters.dateTo")}
              </label>
              <input
                type="date"
                className="afd-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="afd-filters-row-bottom">
            <label className="afd-checkbox-label">
              <input
                type="checkbox"
                className="afd-checkbox"
                checked={withImage}
                onChange={(e) => setWithImage(e.target.checked)}
              />
              {t("articles-from-doctor.filters.perPage")
                ? "С изображением"
                : "With image"}
            </label>
            <div className="afd-perpage-row">
              <span>{t("articles-from-doctor.filters.perPage")}</span>
              <select
                value={perPage}
                onChange={handlePerPageChange}
                className="afd-select-sm"
              >
                {[6, 12, 24, 36, 48].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        {booting ? (
          <div className="afd-loading">
            <div className="afd-spinner" />
            <span>{t("articles-from-doctor.misc.loading")}</span>
          </div>
        ) : (
          <>
            {/* ── ARTICLE GRID ── */}
            <div className="afd-grid">
              {articles.length > 0 ? (
                articles.map((article) => (
                  <Link
                    key={article._id}
                    to={`/doctor/article-detail/${article._id}`}
                    className="afd-card"
                  >
                    {/* Image */}
                    <div className="afd-card-img-wrap">
                      <img
                        src={article.imageUrl || "/default-image.jpg"}
                        alt={
                          article.title ||
                          t("articles-from-doctor.cards.noTitle")
                        }
                        className="afd-card-img"
                      />
                      <div className="afd-card-img-overlay" />
                      <div className="afd-card-badges">
                        {getCountry(article, t) && (
                          <span className="afd-badge afd-badge-country">
                            {getCountry(article, t)}
                          </span>
                        )}
                        {article?.specialization && (
                          <span className="afd-badge afd-badge-spec">
                            {article.specialization}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="afd-card-body">
                      <div className="afd-card-title">
                        {article.title ||
                          t("articles-from-doctor.cards.noTitle")}
                      </div>
                      <p className="afd-card-preview" title={article.preview}>
                        {article.preview ||
                          t("articles-from-doctor.cards.noDescription")}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="afd-card-footer">
                      <div className="afd-card-meta">
                        <div className="afd-meta-item">
                          <BsCalendar2DateFill size={12} />
                          {new Date(article.createdAt).toLocaleDateString(
                            "ru-RU",
                          )}
                        </div>
                        <div className="afd-meta-item">
                          <FaCommentDots size={12} />
                          {commentCounts[article._id] || 0}
                        </div>
                        <div className="afd-meta-item">
                          <AiFillLike size={12} />
                          {article.likes?.length ?? article.likesCount ?? 0}
                        </div>
                      </div>
                      <div
                        className="afd-author-chip"
                        title={authorName(article)}
                      >
                        <div className="afd-author-avatar">
                          {getInitials(article)}
                        </div>
                        {authorName(article)}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="afd-empty">
                  <div className="afd-empty-icon">🔬</div>
                  <div className="afd-empty-text">
                    {t("articles-from-doctor.cards.noArticles")}
                  </div>
                  <div className="afd-empty-sub">
                    {t("doctorsList.tryOtherFilters")}
                  </div>
                </div>
              )}
            </div>

            {/* ── PAGINATION ── */}
            {totalPages > 1 && (
              <div className="afd-pagination">
                <button
                  className="afd-page-btn"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                >
                  ← {t("articles-from-doctor.pagination.prev")}
                </button>

                {buildPageItems().map((p, idx) =>
                  p === "…" ? (
                    <span key={`ellipsis-${idx}`} className="afd-page-ellipsis">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      className={`afd-page-btn${p === page ? " active" : ""}`}
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </button>
                  ),
                )}

                <button
                  className="afd-page-btn"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                >
                  {t("articles-from-doctor.pagination.next")} →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
