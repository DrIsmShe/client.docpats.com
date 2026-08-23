import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaCommentDots, FaUserNurse } from "react-icons/fa6";
import { BsCalendar2DateFill } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import useCommentCountBulk from "../../../components/shared/useCommentCount";
import { useTranslation } from "react-i18next";

// Fallback-утилиты
const stripHtml = (html) => {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
};
const truncateWords = (text, maxWords = 30) => {
  if (!text) return "";
  const words = text.split(/\s+/);
  return words.length <= maxWords
    ? text
    : words.slice(0, maxWords).join(" ") + "…";
};
const buildPreview = (html, maxWords = 30) =>
  truncateWords(stripHtml(html), maxWords);

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
    --border: #e7e2d8;
    --border2: #d6d0c6;
    --shadow-sm: 0 2px 8px rgba(28,25,23,.07), 0 1px 3px rgba(28,25,23,.04);
    --shadow-md: 0 8px 24px rgba(28,25,23,.09), 0 2px 8px rgba(28,25,23,.04);
    --shadow-hover: 0 16px 40px rgba(15,118,110,.13), 0 4px 12px rgba(28,25,23,.06);
    --radius: 16px;
    --transition: all .22s cubic-bezier(.4,0,.2,1);
    --font-display: 'Lora', Georgia, serif;
    --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  .ma-wrap {
    background: var(--cream);
    min-height: 100vh;
    font-family: var(--font-body);
    color: var(--ink);
  }

  /* ── HEADER ── */
  .ma-header {
    background: linear-gradient(150deg, #0c4a6e 0%, #0f766e 60%, #065f46 100%);
    padding: 52px 40px 72px;
    position: relative;
    overflow: hidden;
  }
  .ma-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 700px 400px at 90% 40%, rgba(20,184,166,.18) 0%, transparent 65%),
      radial-gradient(ellipse 300px 500px at 5% 110%, rgba(6,95,70,.5) 0%, transparent 60%);
    pointer-events: none;
  }
  .ma-header::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 56px;
    background: var(--cream);
    clip-path: ellipse(55% 100% at 50% 100%);
  }
  .ma-header-inner {
    max-width: 1280px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
  }
  .ma-header-tag {
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
  .ma-header-tag::before {
    content: '';
    width: 6px; height: 6px;
    background: #5eead4;
    border-radius: 50%;
  }
  .ma-header-title {
    font-family: var(--font-display);
    font-size: clamp(24px, 3.5vw, 40px);
    font-weight: 700;
    color: white;
    line-height: 1.2;
    letter-spacing: -.015em;
    margin: 0 0 14px;
  }
  .ma-header-stats {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }
  .ma-stat-chip {
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    color: rgba(255,255,255,.8);
    font-size: 12px;
    font-weight: 500;
    padding: 5px 14px;
    border-radius: 100px;
  }
  .ma-stat-chip b { color: white; }
  .ma-header-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .ma-perpage-label {
    font-size: 12px;
    color: rgba(255,255,255,.7);
    font-weight: 500;
    white-space: nowrap;
  }
  .ma-perpage-select {
    height: 36px;
    padding: 0 28px 0 12px;
    background: rgba(255,255,255,.15);
    border: 1.5px solid rgba(255,255,255,.25);
    border-radius: 8px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    backdrop-filter: blur(8px);
    transition: var(--transition);
  }
  .ma-perpage-select:focus { border-color: rgba(255,255,255,.5); }
  .ma-perpage-select option { background: #0f766e; color: white; }

  /* ── BODY ── */
  .ma-body {
    max-width: 1280px;
    margin: -28px auto 0;
    padding: 0 32px 80px;
    position: relative;
    z-index: 2;
  }
  @media (max-width: 768px) { .ma-body { padding: 0 16px 60px; } }

  /* ── STATES ── */
  .ma-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 20px;
    gap: 16px;
    color: var(--ink3);
    font-size: 14px;
    font-family: var(--font-body);
    background: var(--cream);
    min-height: 60vh;
  }
  .ma-spinner {
    width: 44px; height: 44px;
    border: 3px solid var(--parchment);
    border-top-color: var(--teal);
    border-radius: 50%;
    animation: ma-spin .7s linear infinite;
  }
  @keyframes ma-spin { to { transform: rotate(360deg); } }
  .ma-error {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #dc2626;
    border-radius: 12px;
    padding: 16px 22px;
    font-size: 14px;
    font-weight: 500;
    font-family: var(--font-body);
  }
  .ma-empty-icon { font-size: 52px; opacity: .35; }
  .ma-empty-title {
    font-family: var(--font-display);
    font-size: 20px;
    color: var(--ink2);
  }
  .ma-empty-sub { font-size: 13px; color: var(--ink3); }

  /* ── GRID ── */
  .ma-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 48px;
  }
  @media (max-width: 640px) { .ma-grid { grid-template-columns: 1fr; gap: 16px; } }

  /* ── CARD ── */
  .ma-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    transition: var(--transition);
  }
  .ma-card:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-3px);
    border-color: var(--teal-border);
  }
  .ma-card-link {
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .ma-card-img-wrap {
    position: relative;
    overflow: hidden;
    height: 210px;
    flex-shrink: 0;
  }
  .ma-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .5s cubic-bezier(.4,0,.2,1);
  }
  .ma-card:hover .ma-card-img { transform: scale(1.04); }
  .ma-card-img-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(12,74,110,.5) 0%, transparent 55%);
    pointer-events: none;
  }
  .ma-card-status {
    position: absolute;
    top: 12px; right: 12px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
    padding: 4px 11px;
    border-radius: 100px;
    backdrop-filter: blur(8px);
  }
  .ma-card-status.published {
    background: rgba(15,118,110,.85);
    color: white;
    border: 1px solid rgba(20,184,166,.4);
  }
  .ma-card-status.draft {
    background: rgba(180,83,9,.85);
    color: white;
    border: 1px solid rgba(245,158,11,.4);
  }
  .ma-card-body {
    padding: 20px 22px 14px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .ma-card-title {
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
  .ma-card-preview {
    font-size: 13px;
    color: var(--ink3);
    line-height: 1.65;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
  }
  .ma-card-footer {
    padding: 11px 22px 15px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    flex-wrap: wrap;
  }
  .ma-card-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .ma-meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--ink3);
    font-weight: 500;
  }
  .ma-meta-item svg { opacity: .7; flex-shrink: 0; }
  .ma-author-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--teal);
    max-width: 150px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .ma-author-avatar {
    width: 22px; height: 22px;
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-light) 100%);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }

  /* ── PAGINATION ── */
  .ma-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .ma-page-btn {
    min-width: 38px; height: 38px;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 12px;
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
  .ma-page-btn:hover:not(:disabled) {
    border-color: var(--teal);
    color: var(--teal);
    background: var(--teal-pale);
  }
  .ma-page-btn.active {
    background: var(--teal);
    border-color: var(--teal);
    color: white;
  }
  .ma-page-btn:disabled { opacity: .35; cursor: not-allowed; }
  .ma-page-ellipsis {
    color: var(--ink3);
    font-size: 14px;
    padding: 0 4px;
    line-height: 38px;
  }
`;

export default function MyArticles() {
  const { t } = useTranslation();

  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;
  const PREVIEW_WORDS = 30;

  const articleIds = useMemo(
    () => (Array.isArray(articles) ? articles.map((a) => a._id) : []),
    [articles],
  );
  const commentCounts = useCommentCountBulk(articleIds);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await axios.get(
          `${API_BASE}/doctor-profile/my-articles-scientific`,
          {
            withCredentials: true,
            params: { page, perPage, previewWords: PREVIEW_WORDS },
          },
        );

        const data = resp?.data;
        if (!data || !Array.isArray(data.articles)) {
          setArticles([]);
          setTotalPages(1);
          setTotal(0);
          return;
        }

        setArticles(data.articles);
        setTotalPages(data.totalPages || 1);
        setTotal(
          typeof data.total === "number" ? data.total : data.articles.length,
        );
      } catch (e) {
        console.error("Ошибка загрузки статей:", e);
        setError(t("my_article.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [page, perPage, t]);

  useEffect(() => {
    setPage((prev) => {
      if (totalPages < 1) return 1;
      return prev > totalPages ? totalPages : prev < 1 ? 1 : prev;
    });
  }, [totalPages]);

  const handlePerPageChange = (e) => {
    const v = Number(e.target.value) || 9;
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

  const getInitials = (article) => {
    const f = article.author?.firstName?.[0] || "";
    const l = article.author?.lastName?.[0] || "";
    return (f + l).toUpperCase() || "Dr";
  };

  // ── Loading ──
  if (loading)
    return (
      <div className="ma-wrap">
        <style>{styles}</style>
        <div className="ma-state">
          <div className="ma-spinner" />
          <span>{t("my_article.loading")}</span>
        </div>
      </div>
    );

  // ── Error ──
  if (error)
    return (
      <div className="ma-wrap">
        <style>{styles}</style>
        <div className="ma-state">
          <span style={{ fontSize: 36, opacity: 0.45 }}>⚠</span>
          <div className="ma-error">{error}</div>
        </div>
      </div>
    );

  // ── Render ──
  return (
    <div className="ma-wrap">
      <style>{styles}</style>

      {/* ── HEADER ── */}
      <div className="ma-header">
        <div className="ma-header-inner">
          <div>
            <div className="ma-header-tag">{t("publications.myPageTitle")}</div>
            <h1 className="ma-header-title">{t("my_article.title")}</h1>
            <div className="ma-header-stats">
              <div className="ma-stat-chip">
                {t("my_article.total")}: <b>&nbsp;{total}</b>
              </div>
              <div className="ma-stat-chip">
                {t("my_article.page")} <b>&nbsp;{page}&nbsp;</b>
                {t("my_article.of")} <b>&nbsp;{totalPages}</b>
              </div>
            </div>
          </div>

          <div className="ma-header-controls">
            <span className="ma-perpage-label">
              {t("my_article.per_page")}:
            </span>
            <select
              value={perPage}
              onChange={handlePerPageChange}
              className="ma-perpage-select"
            >
              {[3, 6, 9, 12, 18, 24].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="ma-body">
        {/* ── GRID ── */}
        <div className="ma-grid">
          {articles.length > 0 ? (
            articles.map((article) => {
              const safeTitle =
                stripHtml(article.title) || t("my_article.preview_no_title");
              const safePreview =
                article.preview ||
                buildPreview(article.content, PREVIEW_WORDS) ||
                t("my_article.preview_no_text");

              return (
                <div className="ma-card" key={article._id}>
                  <Link
                    to={`/doctor/article-scientific-detail/${article._id}`}
                    className="ma-card-link"
                  >
                    <div className="ma-card-img-wrap">
                      <img
                        src={article.imageUrl || "/default-image.jpg"}
                        alt={safeTitle}
                        className="ma-card-img"
                      />
                      <div className="ma-card-img-overlay" />
                      {article.isPublished !== undefined && (
                        <div
                          className={`ma-card-status ${article.isPublished ? "published" : "draft"}`}
                        >
                          {article.isPublished ? "Published" : "Draft"}
                        </div>
                      )}
                    </div>

                    <div className="ma-card-body">
                      <div className="ma-card-title" title={safeTitle}>
                        {safeTitle}
                      </div>
                      <p className="ma-card-preview" title={safePreview}>
                        {safePreview}
                      </p>
                    </div>
                  </Link>

                  <div className="ma-card-footer">
                    <div className="ma-card-meta">
                      <div className="ma-meta-item">
                        <BsCalendar2DateFill size={12} />
                        {new Date(article.createdAt).toLocaleDateString(
                          "ru-RU",
                        )}
                      </div>
                      <div className="ma-meta-item">
                        <FaCommentDots size={12} />
                        {commentCounts[article._id] || 0}
                      </div>
                      <div className="ma-meta-item">
                        <AiFillLike size={12} />
                        {article.likes?.length || 0}
                      </div>
                    </div>
                    <div
                      className="ma-author-chip"
                      title={`${article.author?.firstName || ""} ${article.author?.lastName || ""}`}
                    >
                      <div className="ma-author-avatar">
                        {getInitials(article)}
                      </div>
                      {article.author?.firstName} {article.author?.lastName}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: "1 / -1" }}>
              <div
                className="ma-state"
                style={{ minHeight: "auto", padding: "60px 20px" }}
              >
                <div className="ma-empty-icon">📄</div>
                <div className="ma-empty-title">
                  {t("my_article.no_articles")}
                </div>
                <div className="ma-empty-sub">
                  {t("publications.yoursWillAppear")}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="ma-pagination">
            <button
              className="ma-page-btn"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
            >
              ← {t("my_article.pagination_prev")}
            </button>

            {buildPageItems().map((p, idx) =>
              p === "…" ? (
                <span key={`ellipsis-${idx}`} className="ma-page-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  className={`ma-page-btn${p === page ? " active" : ""}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ),
            )}

            <button
              className="ma-page-btn"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
            >
              {t("my_article.pagination_next")} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
