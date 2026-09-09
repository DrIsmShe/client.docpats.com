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
import { useLocaleAddressable } from "../../../../lib/useLocaleAddressable";
import { useTranslation } from "react-i18next";
import { categoryName } from "../../../../utils/categoryName";
import { Helmet } from "react-helmet-async";
import { sh } from "../../../../lib/sanitizeHtml";
import { articleStyles as styles } from "../../../../styles/articlePage";


export default function SingleArticleForAll() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isWaiting, setIsWaiting] = useState(false);
  const [article, setArticle] = useState(null);

  // У статьи есть языковые адреса: она переводится, и переводы лежат в
  // ContentTranslation. Переключатель допишет ?locale=, чтобы ссылка
  // открывалась на том же языке; на языке оригинала — уберёт.
  useLocaleAddressable(article?.originalLanguage || null);
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
