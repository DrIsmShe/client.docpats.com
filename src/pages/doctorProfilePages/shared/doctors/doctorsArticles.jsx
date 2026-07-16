import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { BsCalendar2DateFill } from "react-icons/bs";
import { FaCommentDots, FaUserNurse } from "react-icons/fa6";
import { AiFillLike } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { sh } from "../../../../lib/sanitizeHtml";

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
    --shadow-sm: 0 2px 8px rgba(28,25,23,.07), 0 1px 3px rgba(28,25,23,.04);
    --shadow-md: 0 8px 24px rgba(28,25,23,.09), 0 2px 8px rgba(28,25,23,.04);
    --shadow-hover: 0 16px 40px rgba(15,118,110,.13), 0 4px 12px rgba(28,25,23,.06);
    --radius: 16px;
    --transition: all .22s cubic-bezier(.4,0,.2,1);
    --font-display: 'Lora', Georgia, serif;
    --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  .doa-wrap {
    background: var(--cream);
    min-height: 100vh;
    font-family: var(--font-body);
    color: var(--ink);
  }

  /* ── HERO HEADER ── */
  .doa-header {
    background: linear-gradient(150deg, #0c4a6e 0%, #0f766e 60%, #065f46 100%);
    padding: 52px 40px 80px;
    position: relative;
    overflow: hidden;
  }
  .doa-header::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 700px 400px at 90% 40%, rgba(20,184,166,.18) 0%, transparent 65%),
      radial-gradient(ellipse 300px 500px at 5% 110%, rgba(6,95,70,.5) 0%, transparent 60%);
    pointer-events: none;
  }
  .doa-header::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 64px;
    background: var(--cream);
    clip-path: ellipse(55% 100% at 50% 100%);
  }
  .doa-header-inner {
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 32px;
    flex-wrap: wrap;
  }

  /* Doctor avatar in header */
  .doa-doctor-avatar {
    width: 80px; height: 80px;
    border-radius: 20px;
    background: rgba(255,255,255,.18);
    border: 2px solid rgba(255,255,255,.3);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    backdrop-filter: blur(8px);
    overflow: hidden;
  }
  .doa-doctor-avatar img {
    width: 100%; height: 100%;
    object-fit: cover;
  }

  .doa-header-text {}
  .doa-header-tag {
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
    margin-bottom: 14px;
  }
  .doa-header-tag::before {
    content: '';
    width: 6px; height: 6px;
    background: #5eead4;
    border-radius: 50%;
  }
  .doa-header-title {
    font-family: var(--font-display);
    font-size: clamp(22px, 3vw, 36px);
    font-weight: 700;
    color: white;
    line-height: 1.2;
    letter-spacing: -.015em;
    margin: 0 0 10px;
  }
  .doa-header-title span { color: #5eead4; }
  .doa-header-sub {
    font-size: 13px;
    color: rgba(255,255,255,.65);
    font-weight: 500;
  }
  .doa-count-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    color: rgba(255,255,255,.8);
    font-size: 12px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 100px;
    margin-top: 8px;
  }
  .doa-count-chip b { color: white; }

  /* ── BODY ── */
  .doa-body {
    max-width: 1100px;
    margin: -32px auto 0;
    padding: 0 32px 80px;
    position: relative;
    z-index: 2;
  }
  @media (max-width: 768px) { .doa-body { padding: 0 16px 60px; } }

  /* ── GRID ── */
  .doa-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }
  @media (max-width: 640px) { .doa-grid { grid-template-columns: 1fr; gap: 16px; } }

  /* ── ARTICLE CARD ── */
  .doa-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    transition: var(--transition);
  }
  .doa-card:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-3px);
    border-color: var(--teal-border);
  }

  /* Image */
  .doa-card-img-wrap {
    position: relative;
    overflow: hidden;
    height: 200px;
    flex-shrink: 0;
  }
  .doa-card-no-img {
    height: 200px;
    background: linear-gradient(135deg, var(--cream2) 0%, var(--parchment) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    opacity: .4;
    flex-shrink: 0;
  }
  .doa-card-img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .5s cubic-bezier(.4,0,.2,1);
  }
  .doa-card:hover .doa-card-img { transform: scale(1.04); }
  .doa-card-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(12,74,110,.5) 0%, transparent 55%);
    pointer-events: none;
  }

  /* Body */
  .doa-card-body {
    padding: 20px 22px 14px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .doa-card-title-link {
    text-decoration: none;
    display: block;
    margin-bottom: 12px;
  }
  .doa-card-title {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color .15s;
  }
  .doa-card-title-link:hover .doa-card-title { color: var(--teal); }

  /* HTML content preview */
  .doa-card-preview {
    font-size: 13px;
    color: var(--ink3);
    line-height: 1.65;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    /* strip inherited styles from dangerouslySetInnerHTML */
  }
  .doa-card-preview * {
    font-size: 13px !important;
    font-family: var(--font-body) !important;
    color: var(--ink3) !important;
    background: none !important;
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1.65 !important;
  }

  /* Footer */
  .doa-card-footer {
    padding: 11px 22px 15px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .doa-card-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .doa-meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--ink3);
    font-weight: 500;
  }
  .doa-meta-item svg { opacity: .7; flex-shrink: 0; }

  .doa-author-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--teal);
    background: var(--teal-pale);
    border: 1px solid var(--teal-border);
    padding: 4px 12px;
    border-radius: 100px;
    max-width: 180px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .doa-author-dot {
    width: 18px; height: 18px;
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-light) 100%);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 8px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }

  /* ── EMPTY STATE ── */
  .doa-empty {
    text-align: center;
    padding: 80px 20px;
    color: var(--ink3);
  }
  .doa-empty-icon { font-size: 52px; opacity: .35; margin-bottom: 16px; }
  .doa-empty-title {
    font-family: var(--font-display);
    font-size: 20px;
    color: var(--ink2);
    margin-bottom: 6px;
  }
  .doa-empty-sub { font-size: 13px; }

  /* ── LOADING / ERROR ── */
  .doa-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 60vh; gap: 16px;
    font-size: 14px; color: var(--ink3);
    background: var(--cream);
    font-family: var(--font-body);
  }
  .doa-spinner {
    width: 44px; height: 44px;
    border: 3px solid var(--parchment);
    border-top-color: var(--teal);
    border-radius: 50%;
    animation: doa-spin .7s linear infinite;
  }
  @keyframes doa-spin { to { transform: rotate(360deg); } }
  .doa-error-box {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #dc2626;
    border-radius: 12px;
    padding: 14px 22px;
    font-size: 14px;
    font-weight: 500;
    max-width: 480px;
    text-align: center;
  }
`;

export default function DoctorArticles() {
  const { id } = useParams();
  const { t } = useTranslation();

  const [articles, setArticles] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  /* ============================
        LOAD DATA
  ============================ */
  useEffect(() => {
    const fetchDoctorArticles = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/doctor-profile/doctor-articles/${id}`,
          { withCredentials: true },
        );

        if (response.data) {
          setDoctor(response.data.doctor || null);
          setArticles(response.data.data || []);
        } else {
          setError(t("articles-of-doctor.noData"));
        }
      } catch (err) {
        console.error("❌ Ошибка загрузки:", err.response?.data || err);
        setError(
          err.response?.data?.message || t("articles-of-doctor.loadError"),
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDoctorArticles();
  }, [id, API_BASE, t]);

  /* ============================
        STATES (LOADING/ERROR)
  ============================ */
  if (loading)
    return (
      <div className="doa-wrap">
        <style>{styles}</style>
        <div className="doa-state">
          <div className="doa-spinner" />
          <span>{t("articles-of-doctor.loading")}...</span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="doa-wrap">
        <style>{styles}</style>
        <div className="doa-state">
          <span style={{ fontSize: 36, opacity: 0.4 }}>⚠</span>
          <div className="doa-error-box">
            {t("articles-of-doctor.error")}: {error}
          </div>
        </div>
      </div>
    );

  /* ── helpers ── */
  const doctorFirstName = doctor?.firstName || "";
  const doctorLastName = doctor?.lastName || "";
  const doctorFullName =
    `${doctorFirstName} ${doctorLastName}`.trim() ||
    t("articles-of-doctor.doctorFallback");

  const initials =
    ((doctorFirstName[0] || "") + (doctorLastName[0] || "")).toUpperCase() ||
    "Dr";

  const getAuthorInitials = (article) => {
    const f = article.author?.firstName?.[0] || "";
    const l = article.author?.lastName?.[0] || "";
    return (f + l).toUpperCase() || "Dr";
  };

  /* ============================
        COMPONENT UI
  ============================ */
  return (
    <div className="doa-wrap">
      <style>{styles}</style>

      {/* ── HEADER ── */}
      <div className="doa-header">
        <div className="doa-header-inner">
          {/* Doctor avatar */}
          <div className="doa-doctor-avatar">
            {doctor?.profileImage ? (
              <img src={doctor.profileImage} alt={doctorFullName} />
            ) : (
              initials
            )}
          </div>

          {/* Text */}
          <div className="doa-header-text">
            <div className="doa-header-tag">DocPats · Doctor Publications</div>
            <h1 className="doa-header-title">
              {t("articles-of-doctor.title")} <span>Dr. {doctorFullName}</span>
            </h1>
            <div className="doa-header-sub">
              {doctor?.specialty && `${doctor.specialty} · `}
              {doctor?.country || ""}
            </div>
            <div className="doa-count-chip">
              📄 <b>{articles.length}</b>&nbsp;
              {t("articles-of-doctor.title") ? "публикаций" : "publications"}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="doa-body">
        {articles.length === 0 ? (
          <div className="doa-empty">
            <div className="doa-empty-icon">📝</div>
            <div className="doa-empty-title">
              {t("articles-of-doctor.noArticlesYet")}
            </div>
            <div className="doa-empty-sub">
              У этого врача пока нет опубликованных статей
            </div>
          </div>
        ) : (
          <div className="doa-grid">
            {articles.map((article) => (
              <div className="doa-card" key={article._id}>
                {/* Image */}
                {article.imageUrl ? (
                  <div className="doa-card-img-wrap">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="doa-card-img"
                    />
                    <div className="doa-card-img-overlay" />
                  </div>
                ) : (
                  <div className="doa-card-no-img">🔬</div>
                )}

                {/* Body */}
                <div className="doa-card-body">
                  <Link
                    to={`/doctor/article-detail/${article._id}`}
                    className="doa-card-title-link"
                  >
                    <div className="doa-card-title">{article.title}</div>
                  </Link>

                  <div
                    className="doa-card-preview"
                    dangerouslySetInnerHTML={{ __html: sh(article.content) }}
                  />
                </div>

                {/* Footer */}
                <div className="doa-card-footer">
                  <div className="doa-card-meta">
                    <div className="doa-meta-item">
                      <BsCalendar2DateFill size={12} />
                      {new Date(article.createdAt).toLocaleDateString(
                        t("lang.locale"),
                        { day: "numeric", month: "numeric", year: "numeric" },
                      )}
                    </div>
                    <div className="doa-meta-item">
                      <FaCommentDots size={12} />
                      {article.commentsCount || 0}
                    </div>
                    <div className="doa-meta-item">
                      <AiFillLike size={12} />
                      {article.likesCount || 0}
                    </div>
                  </div>

                  <div className="doa-author-chip">
                    <div className="doa-author-dot">
                      {getAuthorInitials(article)}
                    </div>
                    {article.author?.firstName ||
                      t("articles-of-doctor.authorFallback")}{" "}
                    {article.author?.lastName || ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
