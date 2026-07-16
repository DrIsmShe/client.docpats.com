import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { FaCommentDots } from "react-icons/fa6";
import { BsCalendar2DateFill, BsFillShareFill } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import CommentSection from "../../../../components/shared/CommentSection";
import useCommentCount from "../../../../components/shared/useCommentCountDetail";
import { sh } from "../../../../lib/sanitizeHtml";

/* ─────────────── STYLES ─────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

  .sa {
    --accent:   #0ea5e9;
    --teal:     #0d9488;
    --success:  #059669;
    --danger:   #e11d48;
    --bg:       #f0f4f8;
    --surface:  #ffffff;
    --border:   #e2e8f0;
    --text:     #0f172a;
    --sub:      #475569;
    --muted:    #94a3b8;
    --f-head:   'Playfair Display', Georgia, serif;
    --f-body:   'Outfit', system-ui, sans-serif;
    font-family: var(--f-body);
    color: var(--text);
    background: var(--bg);
    min-height: 100vh;
    padding: 32px 28px 64px;
  }
  @media (max-width: 600px) {
    .sa { padding: 16px 14px 48px; }
  }

  /* ── BACK BUTTON ── */
  .sa-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--muted);
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    margin-bottom: 28px;
    transition: color .15s;
  }
  .sa-back:hover { color: var(--accent); }
  .sa-back::before { content: '←'; font-size: 14px; }

  /* ── LAYOUT ── */
  .sa-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 28px;
    max-width: 1100px;
    margin: 0 auto;
    opacity: 0;
    animation: sa-up .5s ease .05s forwards;
  }
  @media (max-width: 960px) {
    .sa-layout { grid-template-columns: 1fr; }
  }

  /* ── ARTICLE CARD ── */
  .sa-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
  }

  .sa-hero {
    width: 100%;
    max-height: 420px;
    object-fit: cover;
    display: block;
    border-bottom: 1px solid var(--border);
  }

  .sa-body {
    padding: 36px 40px 32px;
  }
  @media (max-width: 600px) {
    .sa-body { padding: 22px 18px 24px; }
  }

  /* ── CATEGORY CHIP ── */
  .sa-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--accent);
    background: rgba(14,165,233,.08);
    border: 1px solid rgba(14,165,233,.2);
    padding: 4px 12px;
    border-radius: 20px;
    margin-bottom: 18px;
  }
  .sa-chip::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    animation: sa-dot 2s ease infinite;
  }
  @keyframes sa-dot {
    0%,100% { box-shadow: 0 0 3px rgba(14,165,233,.4); }
    50%      { box-shadow: 0 0 8px rgba(14,165,233,.9); }
  }

  /* ── TITLE ── */
  .sa-title {
    font-family: var(--f-head);
    font-size: clamp(24px, 3.5vw, 38px);
    font-weight: 600;
    line-height: 1.22;
    color: var(--text);
    margin-bottom: 20px;
    letter-spacing: -.01em;
  }

  /* ── META ROW ── */
  .sa-meta {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    padding: 14px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    margin-bottom: 32px;
  }
  .sa-meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--sub);
  }
  .sa-meta-item svg { color: var(--muted); flex-shrink: 0; }

  /* ── DIVIDER ── */
  .sa-divider {
    width: 48px;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--teal));
    border-radius: 2px;
    margin-bottom: 28px;
  }

  /* ── CONTENT ── */
  .sa-content {
    font-size: 15.5px;
    line-height: 1.85;
    color: var(--sub);
  }
  .sa-content p  { margin-bottom: 18px; }
  .sa-content h2 { font-family: var(--f-head); font-size: 22px; font-weight: 600; color: var(--text); margin: 32px 0 14px; }
  .sa-content h3 { font-family: var(--f-head); font-size: 18px; font-weight: 500; color: var(--text); margin: 24px 0 10px; }
  .sa-content ul, .sa-content ol { padding-left: 22px; margin-bottom: 18px; }
  .sa-content li { margin-bottom: 6px; }
  .sa-content img { max-width: 100%; border-radius: 12px; margin: 20px 0; border: 1px solid var(--border); }
  .sa-content blockquote {
    border-left: 3px solid var(--accent);
    padding: 12px 20px;
    margin: 24px 0;
    background: rgba(14,165,233,.04);
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: var(--sub);
  }
  .sa-content a { color: var(--accent); text-decoration: none; }
  .sa-content a:hover { text-decoration: underline; }

  /* ── ACTION BAR ── */
  .sa-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding-top: 28px;
    margin-top: 28px;
    border-top: 1px solid var(--border);
  }

  .sa-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: var(--f-body);
    font-size: 13px;
    font-weight: 500;
    padding: 9px 18px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--sub);
    cursor: pointer;
    transition: all .18s;
  }
  .sa-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(14,165,233,.05);
  }

  .sa-like-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: var(--f-body);
    font-size: 13px;
    font-weight: 500;
    padding: 9px 18px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--sub);
    cursor: pointer;
    transition: all .18s;
  }
  .sa-like-btn.liked {
    border-color: #3b82f6;
    color: #3b82f6;
    background: rgba(59,130,246,.07);
  }
  .sa-like-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: rgba(59,130,246,.07);
  }
  .sa-like-num {
    font-weight: 600;
    min-width: 16px;
  }

  .sa-share-btn {
    margin-left: auto;
  }

  /* ── SIDEBAR ── */
  .sa-sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .sa-widget {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    opacity: 0;
    animation: sa-up .5s ease forwards;
  }
  .sa-widget:nth-child(1) { animation-delay: .15s; }
  .sa-widget:nth-child(2) { animation-delay: .25s; }

  .sa-widget-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border);
  }
  .sa-widget-title {
    font-family: var(--f-head);
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
  }
  .sa-widget-badge {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--muted);
    background: var(--bg);
    border: 1px solid var(--border);
    padding: 2px 8px;
    border-radius: 20px;
  }
  .sa-widget-body {
    padding: 18px;
  }

  /* ── STAT ROW IN SIDEBAR ── */
  .sa-stat-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 11px 0;
    border-bottom: 1px solid var(--border);
  }
  .sa-stat-row:last-child { border-bottom: none; }
  .sa-stat-icon {
    width: 36px; height: 36px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }
  .sa-stat-icon.blue   { background: #eff6ff; }
  .sa-stat-icon.green  { background: #f0fdf4; }
  .sa-stat-icon.rose   { background: #fff1f2; }
  .sa-stat-info { flex: 1; min-width: 0; }
  .sa-stat-label { font-size: 11px; color: var(--muted); margin-bottom: 2px; }
  .sa-stat-val {
    font-family: var(--f-head);
    font-size: 20px;
    font-weight: 600;
    color: var(--text);
    line-height: 1;
  }
  .sa-stat-val.blue  { color: #0ea5e9; }
  .sa-stat-val.green { color: #059669; }
  .sa-stat-val.rose  { color: #e11d48; }

  /* ── COMMENTS CARD ── */
  .sa-comments {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
    margin-top: 28px;
    max-width: 1100px;
    margin-left: auto;
    margin-right: auto;
    opacity: 0;
    animation: sa-up .5s ease .35s forwards;
  }
  .sa-comments-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 28px;
    border-bottom: 1px solid var(--border);
  }
  .sa-comments-title {
    font-family: var(--f-head);
    font-size: 18px;
    font-weight: 500;
    color: var(--text);
  }
  .sa-comments-count {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    color: var(--muted);
    background: var(--bg);
    border: 1px solid var(--border);
    padding: 3px 10px;
    border-radius: 20px;
  }
  .sa-comments-body {
    padding: 24px 28px;
  }
  @media (max-width: 600px) {
    .sa-comments-head { padding: 16px 18px; }
    .sa-comments-body { padding: 18px; }
  }

  /* ── LOADING / ERROR ── */
  .sa-loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 60vh; gap: 12px;
    color: var(--muted); font-size: 15px;
    font-family: var(--f-body);
    background: var(--bg);
  }
  .sa-spin {
    width: 22px; height: 22px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: sa-spin .7s linear infinite;
    flex-shrink: 0;
  }
  .sa-error {
    display: flex; align-items: center; justify-content: center;
    min-height: 60vh;
    color: var(--danger); font-size: 15px;
    font-family: var(--f-body);
    background: var(--bg);
  }

  /* ── TOAST ── */
  .sa-toast {
    position: fixed;
    bottom: 28px; right: 28px;
    background: var(--text);
    color: #fff;
    font-family: var(--f-body);
    font-size: 13px;
    padding: 12px 20px;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,.18);
    z-index: 9999;
    animation: sa-toast-in .25s ease, sa-toast-out .25s ease 2.5s forwards;
  }
  @keyframes sa-toast-in  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes sa-toast-out { from { opacity: 1; } to { opacity: 0; } }

  @keyframes sa-spin { to { transform: rotate(360deg); } }
  @keyframes sa-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

export default function SingleArticle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState(false);
  const commentCount = useCommentCount(id);
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articleRes, userRes, likeStatusRes] = await Promise.all([
          axios.get(`${API_BASE}/patient-profile/article-single/${id}`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE}/common-for-user`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE}/comments/add-likes/status/article/${id}`, {
            withCredentials: true,
          }),
        ]);

        if (articleRes.data.success) {
          setArticle(articleRes.data.data);
        } else {
          throw new Error(articleRes.data.message || "Статья не найдена");
        }

        setUserId(userRes.data.user.userId);
        setLikesCount(likeStatusRes.data.likesCount);
        setLiked(likeStatusRes.data.liked);
      } catch (err) {
        console.error("❌ Ошибка при загрузке статьи:", err.message);
        setError(err.message || "Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleLikeToggle = async () => {
    try {
      const res = await axios.post(
        `${API_BASE}/comments/add-likes/article/${id}`,
        {},
        { withCredentials: true },
      );
      setLikesCount(res.data.likesCount);
      setLiked(res.data.liked);
    } catch (err) {
      console.error("Ошибка при лайке:", err.message);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/doctor/article-detail/${id}`;
    navigator.clipboard.writeText(url);
    setToast(true);
    setTimeout(() => setToast(false), 2800);
  };

  if (loading)
    return (
      <div className="sa-loading">
        <style>{S}</style>
        <div className="sa-spin" />
        Загрузка статьи…
      </div>
    );

  if (error)
    return (
      <div className="sa-error">
        <style>{S}</style>
        Ошибка: {error}
      </div>
    );

  if (!article)
    return (
      <div className="sa-error">
        <style>{S}</style>
        Статья не найдена
      </div>
    );

  const formattedDate = article.createdAt
    ? new Date(article.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Дата не указана";

  return (
    <div className="sa">
      <style>{S}</style>

      {/* Back */}
      <button className="sa-back" onClick={() => navigate(-1)}>
        Назад
      </button>

      {/* Main layout */}
      <div className="sa-layout">
        {/* ── Article ── */}
        <div>
          <div className="sa-card">
            {article.imageUrl && (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="sa-hero"
              />
            )}

            <div className="sa-body">
              <div className="sa-chip">Статья</div>

              <h1 className="sa-title">{article.title}</h1>

              <div className="sa-meta">
                <span className="sa-meta-item">
                  <BsCalendar2DateFill size={14} />
                  {formattedDate}
                </span>
                <span className="sa-meta-item">
                  <FaCommentDots size={14} />
                  {commentCount} комментариев
                </span>
                <span className="sa-meta-item">
                  <AiFillLike
                    size={14}
                    color={liked ? "#3b82f6" : "currentColor"}
                  />
                  {likesCount} лайков
                </span>
              </div>

              <div className="sa-divider" />

              <div
                className="sa-content"
                dangerouslySetInnerHTML={{
                  __html: sh(article.content || "<p>Контент отсутствует</p>",)
                }}
              />

              <div className="sa-actions">
                <button
                  className={`sa-like-btn${liked ? " liked" : ""}`}
                  onClick={handleLikeToggle}
                >
                  <AiFillLike size={16} />
                  <span className="sa-like-num">{likesCount}</span>
                  {liked ? "Нравится" : "Нравится"}
                </button>

                <span className="sa-meta-item" style={{ fontSize: 13 }}>
                  <FaCommentDots size={14} />
                  {commentCount} комментариев
                </span>

                <button className="sa-btn sa-share-btn" onClick={handleShare}>
                  <BsFillShareFill size={13} />
                  Поделиться
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="sa-sidebar">
          <div className="sa-widget">
            <div className="sa-widget-head">
              <span className="sa-widget-title">Статистика</span>
              <span className="sa-widget-badge">Статья</span>
            </div>
            <div className="sa-widget-body">
              <div className="sa-stat-row">
                <div className="sa-stat-icon blue">👍</div>
                <div className="sa-stat-info">
                  <div className="sa-stat-label">Лайки</div>
                  <div className="sa-stat-val blue">{likesCount}</div>
                </div>
              </div>
              <div className="sa-stat-row">
                <div className="sa-stat-icon green">💬</div>
                <div className="sa-stat-info">
                  <div className="sa-stat-label">Комментарии</div>
                  <div className="sa-stat-val green">{commentCount}</div>
                </div>
              </div>
              <div className="sa-stat-row">
                <div className="sa-stat-icon rose">📅</div>
                <div className="sa-stat-info">
                  <div className="sa-stat-label">Дата публикации</div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--sub)",
                      marginTop: 2,
                    }}
                  >
                    {formattedDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sa-widget">
            <div className="sa-widget-head">
              <span className="sa-widget-title">Действия</span>
            </div>
            <div
              className="sa-widget-body"
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <button
                className={`sa-like-btn${liked ? " liked" : ""}`}
                onClick={handleLikeToggle}
                style={{ justifyContent: "center", width: "100%" }}
              >
                <AiFillLike size={15} />
                {liked ? "Убрать лайк" : "Поставить лайк"}
              </button>
              <button
                className="sa-btn"
                onClick={handleShare}
                style={{ justifyContent: "center", width: "100%" }}
              >
                <BsFillShareFill size={13} />
                Поделиться
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Comments ── */}
      <div className="sa-comments">
        <div className="sa-comments-head">
          <h2 className="sa-comments-title">Комментарии</h2>
          <span className="sa-comments-count">
            <FaCommentDots size={12} />
            {commentCount}
          </span>
        </div>
        <div className="sa-comments-body">
          <CommentSection refId={id} targetType="Article" />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="sa-toast">✓ Ссылка скопирована в буфер обмена</div>
      )}
    </div>
  );
}
