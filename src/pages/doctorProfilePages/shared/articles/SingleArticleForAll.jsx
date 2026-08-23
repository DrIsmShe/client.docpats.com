import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaCommentDots } from "react-icons/fa6";
import { BsCalendar2DateFill } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { BsFillShareFill } from "react-icons/bs";
import ShareMenu from "../../../../components/shared/ShareMenu";
import CommentSection from "../../../../components/shared/CommentSection";
import useCommentCount from "../../../../components/shared/useCommentCountDetail";
import { useTranslation } from "react-i18next";
import { categoryName } from "../../../../utils/categoryName";
import { Helmet } from "react-helmet-async";
import { sh } from "../../../../lib/sanitizeHtml";
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  :root {
    --cream: #faf8f4;
    --cream2: #f3efe8;
    --parchment: #ede8df;
    --ink: #1c1917;
    --ink2: #44403c;
    --ink3: #78716c;
    --teal: #0f766e;
    --teal-light: #14b8a6;
    --teal-pale: #f0fdfa;
    --teal-border: #99f6e4;
    --gold: #b45309;
    --gold-pale: #fffbeb;
    --rose: #be185d;
    --border: #e7e2d8;
    --shadow-sm: 0 1px 3px rgba(28,25,23,.06), 0 1px 2px rgba(28,25,23,.04);
    --shadow-md: 0 4px 16px rgba(28,25,23,.08), 0 2px 6px rgba(28,25,23,.04);
    --shadow-lg: 0 20px 60px rgba(28,25,23,.10), 0 8px 24px rgba(28,25,23,.06);
    --radius: 16px;
    --font-display: 'Lora', Georgia, serif;
    --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  .sa-page {
    background: var(--cream);
    min-height: 100vh;
    font-family: var(--font-body);
    color: var(--ink);
  }

  /* ── HERO BANNER ── */
  .sa-hero {
    background: linear-gradient(160deg, #0c4a6e 0%, #0f766e 55%, #065f46 100%);
    padding: 64px 0 80px;
    position: relative;
    overflow: hidden;
  }
  .sa-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 600px 400px at 80% 50%, rgba(20,184,166,.18) 0%, transparent 70%),
      radial-gradient(ellipse 400px 600px at 10% 100%, rgba(6,95,70,.4) 0%, transparent 60%);
    pointer-events: none;
  }
  .sa-hero::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 64px;
    background: var(--cream);
    clip-path: ellipse(55% 100% at 50% 100%);
  }
  .sa-hero-inner {
    max-width: 860px;
    margin: 0 auto;
    padding: 0 32px;
    position: relative;
    z-index: 1;
  }
  .sa-category-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.25);
    color: rgba(255,255,255,.9);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    padding: 6px 14px;
    border-radius: 100px;
    margin-bottom: 20px;
  }
  .sa-category-pill::before {
    content: '';
    width: 6px; height: 6px;
    background: #5eead4;
    border-radius: 50%;
  }
  .sa-title {
    font-family: var(--font-display);
    font-size: clamp(28px, 5vw, 48px);
    font-weight: 700;
    color: white;
    line-height: 1.2;
    letter-spacing: -.01em;
    margin-bottom: 24px;
  }
  .sa-meta-row {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }
  .sa-meta-chip {
    display: flex;
    align-items: center;
    gap: 7px;
    color: rgba(255,255,255,.75);
    font-size: 13px;
    font-weight: 500;
  }
  .sa-meta-chip svg { opacity: .8; }

  /* ── LAYOUT ── */
  .sa-layout {
    max-width: 1160px;
    margin: -24px auto 0;
    padding: 0 32px 80px;
    position: relative;
    z-index: 2;
  }

  /* ── AUTHOR CARDS ── */
  .sa-authors-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 32px;
  }
  @media (max-width: 600px) {
    .sa-authors-row { grid-template-columns: 1fr; }
  }
  .sa-author-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 22px;
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .sa-author-avatar {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-light) 100%);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }
  .sa-author-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--teal);
    margin-bottom: 3px;
  }
  .sa-author-name {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.3;
  }

  /* ── ABSTRACT ── */
  .sa-abstract {
    background: linear-gradient(135deg, var(--teal-pale) 0%, #f0fdf9 100%);
    border: 1px solid var(--teal-border);
    border-radius: var(--radius);
    padding: 28px 32px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
  }
  .sa-abstract::before {
    content: '"';
    position: absolute;
    top: -10px; left: 16px;
    font-family: var(--font-display);
    font-size: 120px;
    color: rgba(15,118,110,.1);
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }
  .sa-abstract-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--teal);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sa-abstract-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--teal-border);
  }
  .sa-abstract-text {
    font-family: var(--font-display);
    font-size: 16px;
    font-style: italic;
    color: var(--ink2);
    line-height: 1.75;
    position: relative;
    z-index: 1;
  }

  /* ── MAIN ARTICLE CARD ── */
  .sa-article-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    margin-bottom: 24px;
  }
  .sa-article-image {
    width: 100%;
    max-height: 440px;
    object-fit: cover;
    display: block;
  }
  .sa-article-body {
    padding: 40px 44px;
  }
  @media (max-width: 600px) {
    .sa-article-body { padding: 24px 20px; }
  }

  /* ── ARTICLE CONTENT TYPOGRAPHY ── */
  .sa-article-content {
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.85;
    color: var(--ink2);
    margin-bottom: 36px;
  }
  .sa-article-content h1,
  .sa-article-content h2,
  .sa-article-content h3 {
    font-family: var(--font-display);
    color: var(--ink);
    margin-top: 32px;
    margin-bottom: 12px;
  }
  .sa-article-content h2 { font-size: 22px; }
  .sa-article-content h3 { font-size: 18px; }
  .sa-article-content p { margin-bottom: 18px; }
  .sa-article-content a { color: var(--teal); text-decoration: underline; text-decoration-color: rgba(15,118,110,.3); }
  .sa-article-content blockquote {
    border-left: 3px solid var(--teal-light);
    margin: 24px 0;
    padding: 4px 0 4px 20px;
    font-family: var(--font-display);
    font-style: italic;
    color: var(--ink3);
  }

  /* ── REFERENCES ── */
  .sa-references {
    background: var(--cream2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 22px 26px;
    margin-bottom: 32px;
  }
  .sa-references-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--ink3);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sa-references-label::before {
    content: '§';
    color: var(--gold);
    font-family: var(--font-display);
    font-size: 16px;
    font-style: italic;
  }
  .sa-references-text {
    font-size: 13px;
    color: var(--ink3);
    line-height: 1.7;
  }

  /* ── ACTION BAR ── */
  .sa-action-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding-top: 24px;
    border-top: 1px solid var(--border);
  }
  .sa-stat {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink3);
    font-size: 14px;
    font-weight: 500;
    padding: 8px 14px;
    border-radius: 100px;
    background: var(--cream2);
    border: 1px solid var(--border);
    transition: all .2s;
  }
  .sa-stat:hover { border-color: var(--teal-border); color: var(--teal); }
  .sa-like-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 18px;
    border-radius: 100px;
    border: 1px solid var(--border);
    background: var(--cream2);
    cursor: pointer;
    transition: all .2s;
    color: var(--ink3);
  }
  .sa-like-btn:hover { border-color: var(--teal-border); background: var(--teal-pale); }
  .sa-like-btn.liked {
    background: var(--teal-pale);
    border-color: var(--teal-border);
    color: var(--teal);
  }
  .sa-like-btn.guest {
    opacity: .7;
    cursor: default;
  }
  .sa-share-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 18px;
    border-radius: 100px;
    border: 1px solid var(--border);
    background: white;
    cursor: pointer;
    color: var(--ink2);
    transition: all .2s;
  }
  .sa-share-btn:hover { border-color: var(--ink3); background: var(--cream2); }

  /* ── OWNER ACTIONS ── */
  .sa-owner-actions {
    display: flex;
    gap: 10px;
    margin-left: auto;
  }
  .sa-btn-edit {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    background: white;
    border: 1.5px solid var(--teal);
    color: var(--teal);
    border-radius: 100px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: all .2s;
  }
  .sa-btn-edit:hover { background: var(--teal); color: white; }
  .sa-btn-delete {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    background: white;
    border: 1.5px solid #fca5a5;
    color: #dc2626;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
  }
  .sa-btn-delete:hover { background: #fef2f2; border-color: #dc2626; }

  /* ── AUTH GATE ── */
  .sa-auth-gate {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 48px 32px;
    text-align: center;
    box-shadow: var(--shadow-sm);
  }
  .sa-auth-gate-icon {
    width: 56px; height: 56px;
    background: var(--teal-pale);
    border: 1.5px solid var(--teal-border);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    margin: 0 auto 16px;
  }
  .sa-auth-gate-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 8px;
  }
  .sa-auth-gate-sub {
    font-size: 14px;
    color: var(--ink3);
    margin-bottom: 24px;
    line-height: 1.6;
  }
  .sa-auth-gate-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .sa-btn-login {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 28px;
    background: var(--teal);
    color: white;
    border: none;
    border-radius: 100px;
    font-size: 14px;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    text-decoration: none;
    transition: background .2s;
  }
  .sa-btn-login:hover { background: #0d6560; color: white; }
  .sa-btn-register {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 28px;
    background: white;
    color: var(--teal);
    border: 1.5px solid var(--teal-border);
    border-radius: 100px;
    font-size: 14px;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    text-decoration: none;
    transition: all .2s;
  }
  .sa-btn-register:hover { background: var(--teal-pale); border-color: var(--teal); }

  /* ── COMMENTS SECTION ── */
  .sa-comments-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .sa-comments-header {
    padding: 22px 32px;
    border-bottom: 1px solid var(--border);
    background: var(--cream2);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sa-comments-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    color: var(--ink);
  }
  .sa-comments-count {
    background: var(--teal);
    color: white;
    font-size: 12px;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 100px;
  }
  .sa-comments-body {
    padding: 28px 32px;
  }
  @media (max-width: 600px) {
    .sa-comments-header, .sa-comments-body { padding-left: 20px; padding-right: 20px; }
  }

  /* ── LOADING / ERROR ── */
  .sa-state {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--ink3);
    font-size: 15px;
    background: var(--cream);
  }
  .sa-spinner {
    width: 40px; height: 40px;
    border: 3px solid var(--parchment);
    border-top-color: var(--teal);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── DIVIDER ── */
  .sa-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
    margin: 32px 0;
  }
`;

export default function SingleArticleForAll() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isWaiting, setIsWaiting] = useState(false);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const commentCount = useCommentCount(id);
  const API_BASE = process.env.REACT_APP_API_URL;
  const [showOriginal, setShowOriginal] = useState(false);

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Article fetch — always runs (no auth needed)
        const articleRes = await axios.get(
          `${API_BASE}/doctor-profile/my-article-single/${id}`,
          { headers: { "Accept-Language": i18n.language } },
        );
        setArticle(articleRes.data.data);

        // Auth-dependent fetches — run in parallel, failures are non-fatal
        const [userRes, likeStatusRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/common-for-user`, { withCredentials: true }),
          axios.get(`${API_BASE}/comments/add-likes/status/article/${id}`, {
            withCredentials: true,
          }),
        ]);

        if (
          userRes.status === "fulfilled" &&
          userRes.value?.data?.authenticated
        ) {
          setUserId(userRes.value.data.user.userId);
          setUserRole(userRes.value.data.user.role);
          setIsAuthenticated(true);
        }

        if (likeStatusRes.status === "fulfilled") {
          setLikesCount(likeStatusRes.value.data.likesCount ?? 0);
          setLiked(likeStatusRes.value.data.liked ?? false);
        }
      } catch (err) {
        setError(err.response?.data?.message || t("article_single.load_error"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, i18n.language, refresh]);

  useEffect(() => {
    if (!article) return;
    if (!article.isOriginal) {
      setIsWaiting(false);
      return;
    }
    setIsWaiting(true);
  }, [article?.isOriginal]);

  useEffect(() => {
    if (!isWaiting) return;
    const MAX_ATTEMPTS = 10;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        return;
      }
      setRefresh((r) => r + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [isWaiting]);

  // ---------------- LIKE TOGGLE ----------------
  const handleLikeToggle = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axios.post(
        `${API_BASE}/comments/add-likes/article/${id}`,
        {},
        { withCredentials: true },
      );
      setLikesCount(res.data.likesCount);
      setLiked(res.data.liked);
    } catch {
      console.error(t("article_single.like_comment_failed"));
    }
  };

  // ---------------- DELETE ARTICLE ----------------
  const handleDelete = async () => {
    if (!window.confirm(t("article_single.confirm_delete_article"))) return;
    try {
      const res = await axios.delete(
        `${API_BASE}/doctor-profile/delete-my-article/${id}`,
        { withCredentials: true },
      );
      alert(res.data.message);
      navigate("/doctor/my-articles");
    } catch {
      alert(t("article_single.delete_article_failed"));
    }
  };

  // ---------------- SHARE ----------------
  const shareUrl = `${window.location.origin}/public/doctor-profile/article-detail-for-all/${id}`;

  const getInitials = (firstName, lastName) => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return (f + l).toUpperCase() || "Dr";
  };

  // ---------------- UI STATES ----------------
  if (loading)
    return (
      <div className="sa-page">
        <style>{styles}</style>
        <div className="sa-state">
          <div className="sa-spinner" />
          <span>{t("article_single.loading")}</span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="sa-page">
        <style>{styles}</style>
        <div className="sa-state">
          <span style={{ color: "#dc2626", fontSize: 32 }}>⚠</span>
          <span style={{ color: "#dc2626" }}>
            {t("article_single.error_prefix")}: {error}
          </span>
        </div>
      </div>
    );

  if (!article)
    return (
      <div className="sa-page">
        <style>{styles}</style>
        <div className="sa-state">
          <span>{t("article_single.load_error")}</span>
        </div>
      </div>
    );

  const authorFirstName =
    article.authorPublic?.firstName || article.authorId?.firstName || "";
  const authorLastName =
    article.authorPublic?.lastName || article.authorId?.lastName || "";
  const fullAuthorName = ["Dr.", authorFirstName, authorLastName]
    .filter(Boolean)
    .join(" ");
  const isOwner =
    isAuthenticated &&
    String(article?.authorId?._id ?? article?.authorId) === String(userId);
  // Админ может редактировать любую статью (модерация); бэкенд проверяет так же.
  const isAdmin = userRole === "admin";
  const canEdit = isOwner || isAdmin;

  // ---------------- RENDER ----------------
  return (
    <div className="sa-page">
      <style>{styles}</style>
      <Helmet>
        <title>{article.title} | DocPats</title>
        <meta
          name="description"
          content={
            article.metaDescription || article.abstract?.slice(0, 155) || ""
          }
        />
        <link
          rel="canonical"
          href={`https://docpats.com/public/doctor-profile/article-detail-for-all/${id}`}
        />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.title} />
        <meta
          property="og:description"
          content={
            article.metaDescription || article.abstract?.slice(0, 155) || ""
          }
        />
        <meta
          property="og:url"
          content={`https://docpats.com/public/doctor-profile/article-detail-for-all/${id}`}
        />
        <meta
          property="og:image"
          content={article.imageUrl || "https://docpats.com/og-default.jpg"}
        />
        <meta property="article:published_time" content={article.createdAt} />
        <meta property="article:section" content={categoryName(article.category)} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta
          name="twitter:description"
          content={
            article.metaDescription || article.abstract?.slice(0, 155) || ""
          }
        />
        <meta
          name="twitter:image"
          content={article.imageUrl || "https://docpats.com/og-default.jpg"}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalScholarlyArticle",
            headline: article.title,
            description: article.metaDescription || article.abstract || "",
            url: `https://docpats.com/public/doctor-profile/article-detail-for-all/${id}`,
            datePublished: article.createdAt,
            image: article.imageUrl || "https://docpats.com/og-default.jpg",
            author: {
              "@type": "Person",
              name: `Dr. ${article.authorPublic?.firstName || ""} ${article.authorPublic?.lastName || ""}`.trim(),
            },
            publisher: {
              "@type": "Organization",
              name: "DocPats",
              url: "https://docpats.com",
            },
            keywords: article.metaKeywords || "",
            articleSection: categoryName(article.category),
          })}
        </script>
      </Helmet>
      {/* ── HERO ── */}
      <div className="sa-hero">
        <div className="sa-hero-inner">
          <div className="sa-category-pill">
            {categoryName(article.category) || t("article_single.medical_article")}
          </div>
          <h1 className="sa-title">{article.title}</h1>
          {article.isOriginal &&
          article.originalLanguage !== article.displayedLanguage &&
          !showOriginal ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div
                className="sa-spinner"
                style={{ width: 16, height: 16, borderWidth: 2 }}
              />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,.7)" }}>
                {t("article_single.translation_pending") ||
                  "Перевод готовится..."}
              </span>
            </div>
          ) : !article.isOriginal ? (
            <button
              onClick={() => setShowOriginal((p) => !p)}
              style={{
                marginBottom: 16,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,.3)",
                background: "rgba(255,255,255,.1)",
                color: "rgba(255,255,255,.9)",
                cursor: "pointer",
                fontSize: 13,
                backdropFilter: "blur(8px)",
              }}
            >
              {showOriginal
                ? t("article_single.show_translation") || "Показать перевод"
                : t("article_single.show_original") || "Показать оригинал"}
            </button>
          ) : null}
          <div className="sa-meta-row">
            <div className="sa-meta-chip">
              <BsCalendar2DateFill size={13} />
              {article.createdAt
                ? new Date(article.createdAt).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : t("article_single.date_unknown")}
            </div>
            <div className="sa-meta-chip">
              <FaCommentDots size={13} />
              {commentCount} {t("article_single.comments_title")}
            </div>
            <div className="sa-meta-chip">
              <AiFillLike size={13} />
              {likesCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="sa-layout">
        {/* ── AUTHORS ── */}
        <div className="sa-authors-row">
          <div className="sa-author-card">
            <div className="sa-author-avatar">
              {getInitials(authorFirstName, authorLastName)}
            </div>
            <div>
              <div className="sa-author-label">
                {t("article_single.author_of_publication")}
              </div>
              <div className="sa-author-name">{fullAuthorName || "—"}</div>
            </div>
          </div>
          <div className="sa-author-card">
            <div
              className="sa-author-avatar"
              style={{
                background: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
              }}
            >
              Co
            </div>
            <div>
              <div className="sa-author-label">
                {t("article_single.co_authors")}
              </div>
              <div className="sa-author-name">
                {article.authors && article.authors.trim()
                  ? article.authors
                  : t("article_single.no_authors")}
              </div>
            </div>
          </div>
        </div>

        {/* ── ABSTRACT ── */}
        {article.abstract && (
          <div className="sa-abstract">
            <div className="sa-abstract-label">
              {t("article_single.abstract_title")}
            </div>
            <div className="sa-abstract-text">
              {showOriginal
                ? article.originalAbstract || article.abstract
                : article.abstract}
            </div>
          </div>
        )}

        {/* ── MAIN CARD ── */}
        <div className="sa-article-card">
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="sa-article-image"
            />
          )}
          <div className="sa-article-body">
            <div
              className="sa-article-content"
              dangerouslySetInnerHTML={{
                __html: sh(showOriginal
                  ? article.originalContent || article.content
                  : article.content,)
              }}
            />

            {/* References */}
            <div className="sa-references">
              <div className="sa-references-label">
                {t("article_single.references_title")}
              </div>
              <div className="sa-references-text">
                {article.references || t("article_single.no_references")}
              </div>
            </div>

            {/* Action bar */}
            <div className="sa-action-bar">
              <div className="sa-stat">
                <BsCalendar2DateFill size={14} />
                {article.createdAt
                  ? new Date(article.createdAt).toLocaleDateString(
                      i18n.language,
                    )
                  : t("article_single.date_unknown")}
              </div>
              <div className="sa-stat">
                <FaCommentDots size={14} />
                {commentCount} {t("article_single.comments_title")}
              </div>

              {/* Like button — interactive only for auth users */}
              {isAuthenticated ? (
                <button
                  className={`sa-like-btn${liked ? " liked" : ""}`}
                  onClick={handleLikeToggle}
                >
                  <AiFillLike size={15} color={liked ? "#0f766e" : "#a8a29e"} />
                  {likesCount}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="sa-like-btn guest"
                  title={
                    t("article_single.login_to_like") ||
                    "Войдите чтобы поставить лайк"
                  }
                >
                  <AiFillLike size={15} color="#a8a29e" />
                  {likesCount}
                </Link>
              )}

              <ShareMenu url={shareUrl} title={article?.title} />

              {/* Редактирование — владельцу ИЛИ админу; удаление — только владельцу */}
              {canEdit && (
                <div className="sa-owner-actions">
                  <Link
                    to={`/public/edit-article/${article._id}`}
                    state={{
                      title: article.title,
                      content: article.content,
                      abstract: article.abstract,
                      category: categoryName(article.category),
                      tags: article.tags,
                      metaDescription: article.metaDescription,
                      metaKeywords: article.metaKeywords,
                      isPublished: article.isPublished,
                      imageUrl: article.imageUrl,
                    }}
                    className="sa-btn-edit"
                  >
                    <FaEdit size={13} /> {t("article_single.edit")}
                  </Link>
                  {isOwner && (
                    <button className="sa-btn-delete" onClick={handleDelete}>
                      <MdDelete size={14} /> {t("article_single.delete")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── COMMENTS ── */}
        <div className="sa-comments-card">
          <div className="sa-comments-header">
            <FaCommentDots size={18} color="#0f766e" />
            <span className="sa-comments-title">
              {t("article_single.comments_title")}
            </span>
            <span className="sa-comments-count">{commentCount}</span>
          </div>
          <div className="sa-comments-body">
            {isAuthenticated ? (
              <CommentSection refId={id} targetType="Article" />
            ) : (
              <div className="sa-auth-gate">
                <div className="sa-auth-gate-icon">💬</div>
                <div className="sa-auth-gate-title">
                  {t("article_single.comments_login_title") ||
                    "Присоединитесь к обсуждению"}
                </div>
                <div className="sa-auth-gate-sub">
                  {t("article_single.comments_login_sub") ||
                    "Войдите в аккаунт, чтобы оставлять комментарии и участвовать в профессиональных дискуссиях."}
                </div>
                <div className="sa-auth-gate-actions">
                  <Link to="/login" className="sa-btn-login">
                    {t("article_single.login_btn") || "Войти"}
                  </Link>
                  <Link to="/register" className="sa-btn-register">
                    {t("article_single.register_btn") || "Зарегистрироваться"}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
