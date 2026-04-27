import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/* ─────────────────────────── STYLES ─────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --ink:     #0d1117;
    --ink2:    #1c2333;
    --ink3:    #253047;
    --gold:    #c9a84c;
    --gold2:   #e8c97a;
    --teal:    #0fbcb0;
    --ice:     #e8f4f8;
    --surface: #ffffff;
    --border:  rgba(13,17,23,.09);
    --border2: rgba(13,17,23,.05);
    --muted:   #6b7a99;
    --sub:     #9aa3b5;
    --f-head:  'Fraunces', Georgia, serif;
    --f-body:  'Instrument Sans', system-ui, sans-serif;
    --f-mono:  'JetBrains Mono', monospace;
    --radius:  18px;
    --shadow:  0 2px 24px rgba(13,17,23,.07);
    --shadow2: 0 8px 48px rgba(13,17,23,.12);
  }

  .hp {
    font-family: var(--f-body);
    color: var(--ink);
    background: #f4f6fa;
    min-height: 100vh;
    background-image:
      radial-gradient(ellipse 900px 600px at 70% -10%, rgba(201,168,76,.07) 0%, transparent 70%),
      radial-gradient(ellipse 600px 400px at 10% 80%, rgba(15,188,176,.06) 0%, transparent 70%);
  }

  /* ── WRAP ── */
  .hp-wrap {
    max-width: 1060px;
    margin: 0 auto;
    padding: 36px 28px 64px;
  }
  @media (max-width: 640px) { .hp-wrap { padding: 20px 16px 48px; } }

  /* ── TOPBAR ── */
  .hp-topbar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 36px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .hp-eyebrow {
    font-family: var(--f-mono);
    font-size: 10px;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 6px;
  }
  .hp-title {
    font-family: var(--f-head);
    font-size: clamp(26px, 3vw, 38px);
    font-weight: 300;
    font-style: italic;
    color: var(--ink);
    line-height: 1.1;
    letter-spacing: -.01em;
  }
  .hp-title strong {
    font-weight: 600;
    font-style: normal;
    color: var(--ink);
  }
  .hp-datebox {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
  }
  .hp-date {
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--muted);
    letter-spacing: .04em;
  }
  .hp-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--f-mono);
    font-size: 10px;
    letter-spacing: .08em;
    color: var(--teal);
    text-transform: uppercase;
  }
  .hp-status::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--teal);
    animation: hp-pulse 2.4s ease infinite;
  }
  @keyframes hp-pulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50%      { opacity: .5; transform: scale(.75); }
  }

  /* ── STATS ── */
  .hp-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  @media (max-width: 700px) { .hp-stats { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 440px) { .hp-stats { grid-template-columns: 1fr; gap: 12px; } }

  .hp-stat {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 24px 22px 20px;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow);
    opacity: 0;
    animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) forwards;
    cursor: default;
    transition: box-shadow .2s, transform .2s;
  }
  .hp-stat:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow2);
  }
  .hp-stat:nth-child(1) { animation-delay: .06s; }
  .hp-stat:nth-child(2) { animation-delay: .14s; }
  .hp-stat:nth-child(3) { animation-delay: .22s; }

  .hp-stat-line {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
  }
  .hp-stat.gold .hp-stat-line { background: linear-gradient(90deg, var(--gold), var(--gold2)); }
  .hp-stat.teal .hp-stat-line { background: linear-gradient(90deg, #0fbcb0, #38e8e0); }
  .hp-stat.ink  .hp-stat-line { background: linear-gradient(90deg, var(--ink2), var(--ink3)); }

  .hp-stat-watermark {
    position: absolute;
    right: 12px; bottom: 8px;
    font-family: var(--f-head);
    font-size: 72px;
    font-weight: 600;
    opacity: .04;
    line-height: 1;
    pointer-events: none;
    color: var(--ink);
    letter-spacing: -.04em;
  }

  .hp-stat-lbl {
    font-family: var(--f-mono);
    font-size: 9px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--sub);
    margin-bottom: 12px;
  }
  .hp-stat-val {
    font-family: var(--f-head);
    font-size: clamp(34px, 4vw, 44px);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -.02em;
  }
  .hp-stat.gold .hp-stat-val { color: var(--gold); }
  .hp-stat.teal .hp-stat-val { color: var(--teal); }
  .hp-stat.ink  .hp-stat-val { color: var(--ink); }

  .hp-stat-delta {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--f-mono);
    font-size: 10px;
    margin-top: 10px;
    padding: 3px 8px;
    border-radius: 20px;
    letter-spacing: .04em;
  }
  .hp-stat.gold .hp-stat-delta { background: rgba(201,168,76,.1); color: var(--gold); }
  .hp-stat.teal .hp-stat-delta { background: rgba(15,188,176,.1); color: var(--teal); }
  .hp-stat.ink  .hp-stat-delta { background: rgba(13,17,23,.06); color: var(--muted); }

  /* ── GRID ── */
  .hp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
    opacity: 0;
    animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .32s forwards;
  }
  @media (max-width: 720px) { .hp-grid { grid-template-columns: 1fr; } }

  /* ── PANEL ── */
  .hp-panel {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  .hp-panel-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px 14px;
    border-bottom: 1px solid var(--border2);
  }
  .hp-panel-icon {
    width: 32px; height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    background: rgba(201,168,76,.08);
    border: 1px solid rgba(201,168,76,.18);
    flex-shrink: 0;
  }
  .hp-panel-icon.teal {
    background: rgba(15,188,176,.08);
    border-color: rgba(15,188,176,.18);
  }
  .hp-panel-name {
    font-family: var(--f-head);
    font-size: 15px;
    font-weight: 400;
    font-style: italic;
    color: var(--ink);
    flex: 1;
    min-width: 0;
  }
  .hp-panel-badge {
    font-family: var(--f-mono);
    font-size: 9px;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--sub);
    background: rgba(13,17,23,.04);
    border: 1px solid var(--border);
    padding: 3px 10px;
    border-radius: 20px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .hp-panel-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--teal);
    flex-shrink: 0;
    animation: hp-pulse 2.4s ease infinite;
  }

  /* ── LIST ROW ── */
  .hp-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 20px;
    border-bottom: 1px solid var(--border2);
    transition: background .15s;
    text-decoration: none !important;
    color: inherit;
    position: relative;
    overflow: hidden;
  }
  .hp-row:last-child { border-bottom: none; }
  .hp-row:hover { background: #fafbfc; }
  .hp-row::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 2px;
    background: var(--gold);
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform .2s cubic-bezier(.22,.68,0,1.2);
  }
  .hp-row:hover::before { transform: scaleY(1); }

  .hp-row-ico {
    width: 40px; height: 40px;
    border-radius: 12px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    border: 1px solid var(--border);
    background: var(--ice);
    transition: transform .2s;
  }
  .hp-row:hover .hp-row-ico { transform: scale(1.07); }
  .hp-row-ico.gold   { background: rgba(201,168,76,.07);  border-color: rgba(201,168,76,.2); }
  .hp-row-ico.teal   { background: rgba(15,188,176,.07);  border-color: rgba(15,188,176,.2); }
  .hp-row-ico.violet { background: rgba(109,40,217,.06);  border-color: rgba(109,40,217,.15); }
  .hp-row-ico.rose   { background: rgba(225,29,72,.06);   border-color: rgba(225,29,72,.15); }

  .hp-row-body { flex: 1; min-width: 0; }
  .hp-row-lbl {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hp-row-sub {
    font-size: 11.5px;
    color: var(--sub);
    line-height: 1.4;
  }
  .hp-arrow {
    font-size: 14px;
    color: var(--sub);
    transition: transform .2s, color .2s;
  }
  .hp-row:hover .hp-arrow {
    transform: translateX(4px);
    color: var(--gold);
  }

  /* ── AI PANEL ── */
  .hp-ai {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    overflow: hidden;
    margin-bottom: 20px;
    opacity: 0;
    animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .44s forwards;
  }
  .hp-ai-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px 14px;
    border-bottom: 1px solid var(--border2);
    background: linear-gradient(90deg, rgba(201,168,76,.03) 0%, transparent 60%);
  }
  .hp-ai-badge {
    font-family: var(--f-mono);
    font-size: 9px;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--gold);
    background: rgba(201,168,76,.1);
    border: 1px solid rgba(201,168,76,.25);
    padding: 3px 10px;
    border-radius: 20px;
  }
  .hp-ai-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
  }
  @media (max-width: 640px) { .hp-ai-grid { grid-template-columns: 1fr; } }
  .hp-ai-item {
    padding: 18px 20px;
    border-right: 1px solid var(--border2);
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .hp-ai-item:last-child { border-right: none; }
  @media (max-width: 640px) {
    .hp-ai-item { border-right: none; border-bottom: 1px solid var(--border2); }
    .hp-ai-item:last-child { border-bottom: none; }
  }
  .hp-ai-dot {
    width: 36px; height: 36px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    background: rgba(201,168,76,.07);
    border: 1px solid rgba(201,168,76,.18);
  }
  .hp-ai-lbl {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 3px;
    line-height: 1.3;
  }
  .hp-ai-sub {
    font-size: 11px;
    color: var(--sub);
    line-height: 1.4;
  }

  /* ── NEWS ── */
  .hp-news-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    opacity: 0;
    animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .56s forwards;
  }
  @media (max-width: 720px) { .hp-news-wrap { grid-template-columns: 1fr; } }

  .hp-news {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  .hp-news-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px 14px;
    border-bottom: 1px solid var(--border2);
  }
  .hp-news-title {
    font-family: var(--f-head);
    font-size: 15px;
    font-weight: 400;
    font-style: italic;
    color: var(--ink);
    flex: 1;
  }
  .hp-news-badge {
    font-family: var(--f-mono);
    font-size: 9px;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--sub);
    background: rgba(13,17,23,.04);
    border: 1px solid var(--border);
    padding: 3px 10px;
    border-radius: 20px;
    white-space: nowrap;
  }
  .hp-news-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--teal);
    animation: hp-pulse 2.4s ease infinite;
  }

  .hp-article {
    display: flex;
    gap: 14px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border2);
    text-decoration: none !important;
    color: inherit;
    transition: background .15s;
    position: relative;
  }
  .hp-article:last-child { border-bottom: none; }
  .hp-article:hover { background: #fafbfc; }
  .hp-article::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 2px;
    background: var(--teal);
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform .2s cubic-bezier(.22,.68,0,1.2);
  }
  .hp-article:hover::before { transform: scaleY(1); }

  .hp-article-img {
    width: 60px; height: 60px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
    background: var(--ice);
    border: 1px solid var(--border);
    display: block;
    transition: transform .2s;
  }
  .hp-article:hover .hp-article-img { transform: scale(1.04); }

  .hp-article-body { flex: 1; min-width: 0; }
  .hp-article-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.4;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hp-article-preview {
    font-size: 11.5px;
    color: var(--sub);
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ── SKELETON ── */
  .hp-skel-row {
    display: flex;
    gap: 14px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border2);
    align-items: center;
  }
  .hp-skel {
    background: linear-gradient(90deg, #f0f2f7 25%, #e4e8f0 50%, #f0f2f7 75%);
    background-size: 300% 100%;
    animation: hp-shimmer 1.6s ease infinite;
    border-radius: 6px;
    flex-shrink: 0;
  }
  @keyframes hp-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── EMPTY ── */
  .hp-empty {
    padding: 48px 20px;
    text-align: center;
    color: var(--sub);
  }
  .hp-empty-icon {
    font-size: 32px;
    opacity: .18;
    margin-bottom: 10px;
  }
  .hp-empty-text {
    font-family: var(--f-head);
    font-style: italic;
    font-size: 14px;
  }

  /* ── DIVIDER ── */
  .hp-divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 24px 0 20px;
    opacity: 0;
    animation: hp-rise .4s ease .38s forwards;
  }
  .hp-divider-line { flex: 1; height: 1px; background: var(--border); }
  .hp-divider-text {
    font-family: var(--f-mono);
    font-size: 9px;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: var(--sub);
    white-space: nowrap;
  }

  @keyframes hp-rise {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

export default function ProfilePatientHomePage() {
  const { t } = useTranslation();
  const [articleCount, setArticleCount] = useState(0);
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(`${API_BASE}/doctor-profile/api/count-articles-today`)
      .then((r) => setArticleCount(r.data?.count || 0))
      .catch(console.error);
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE}/doctor-profile/api/count-all-articles`)
      .then((r) => setTotalArticles(r.data?.count || 0))
      .catch(console.error);
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE}/doctor-profile/api/count-all-doctors`)
      .then((r) => setTotalDoctors(r.data?.count || 0))
      .catch(console.error);
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE}/doctor-profile/articles-all`, {
        withCredentials: true,
        params: { page: 1, perPage: 6, previewWords: 30 },
      })
      .then((r) =>
        setArticles(Array.isArray(r.data?.articles) ? r.data.articles : []),
      )
      .catch(console.error)
      .finally(() => setArticlesLoading(false));
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = now.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const healthItems = [
    {
      icon: "📋",
      color: "violet",
      label: t("ProfileHomePage.health.tests"),
      sub: t("ProfileHomePage.health.testsSub"),
      link: "/patient/lab-tests",
    },
    {
      icon: "🧠",
      color: "teal",
      label: t("ProfileHomePage.health.exams"),
      sub: t("ProfileHomePage.health.examsSub"),
      link: "/patient/files",
    },
    {
      icon: "💊",
      color: "gold",
      label: t("ProfileHomePage.health.prescriptions"),
      sub: t("ProfileHomePage.health.prescSub"),
      link: "/patient/prescriptions",
    },
    {
      icon: "📑",
      color: "rose",
      label: t("ProfileHomePage.health.history"),
      sub: t("ProfileHomePage.health.historySub"),
      link: "/patient/medical-history",
    },
  ];

  const doctorItems = [
    {
      icon: "💬",
      color: "teal",
      label: t("ProfileHomePage.doctor.chat"),
      sub: t("ProfileHomePage.doctor.chatSub"),
      link: "/patient/communication",
    },
    {
      icon: "📅",
      color: "gold",
      label: t("ProfileHomePage.doctor.visits"),
      sub: t("ProfileHomePage.doctor.visitsSub"),
      link: "/patient/my-appointment",
    },
    {
      icon: "👨‍⚕️",
      color: "violet",
      label: t("ProfileHomePage.doctor.find"),
      sub: t("ProfileHomePage.doctor.findSub"),
      link: "/patient/doctors",
    },
    {
      icon: "📤",
      color: "rose",
      label: t("ProfileHomePage.doctor.upload"),
      sub: t("ProfileHomePage.doctor.uploadSub"),
      link: "/patient/upload",
    },
  ];

  const aiItems = [
    {
      icon: "🧪",
      label: t("ProfileHomePage.ai.vitD"),
      sub: t("ProfileHomePage.ai.vitDSub"),
    },
    {
      icon: "❤️",
      label: t("ProfileHomePage.ai.pressure"),
      sub: t("ProfileHomePage.ai.pressureSub"),
    },
    {
      icon: "🏃",
      label: t("ProfileHomePage.ai.activity"),
      sub: t("ProfileHomePage.ai.activitySub"),
    },
  ];

  const NewsColumn = () => (
    <div className="hp-news">
      <div className="hp-news-head">
        <span className="hp-news-title">{t("ProfileHomePage.news.title")}</span>
        <span className="hp-news-badge">{t("ProfileHomePage.news.badge")}</span>
        <span className="hp-news-dot" />
      </div>

      {articlesLoading ? (
        [0, 1, 2].map((i) => (
          <div className="hp-skel-row" key={i}>
            <div
              className="hp-skel"
              style={{ width: 60, height: 60, borderRadius: 12 }}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}
            >
              <div className="hp-skel" style={{ height: 13, width: "68%" }} />
              <div className="hp-skel" style={{ height: 11, width: "90%" }} />
              <div className="hp-skel" style={{ height: 11, width: "50%" }} />
            </div>
          </div>
        ))
      ) : articles.length > 0 ? (
        articles.map((a) => (
          <Link
            key={a._id}
            to={`/patient/article-detail/${a._id}`}
            className="hp-article"
          >
            <img
              className="hp-article-img"
              src={a.imageUrl || "/default-image.jpg"}
              alt={a.title}
              onError={(e) => {
                e.target.style.opacity = "0";
              }}
            />
            <div className="hp-article-body">
              <div className="hp-article-title">
                {a.title || t("ProfileHomePage.news.noTitle")}
              </div>
              <div className="hp-article-preview">
                {a.preview || t("ProfileHomePage.news.noPreview")}
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className="hp-empty">
          <div className="hp-empty-icon">📰</div>
          <div className="hp-empty-text">{t("ProfileHomePage.news.empty")}</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="hp">
      <style>{S}</style>
      <div className="hp-wrap">
        {/* ── Topbar ── */}
        <div className="hp-topbar">
          <div>
            <div className="hp-eyebrow">{t("ProfileHomePage.eyebrow")}</div>
            <div className="hp-title">
              {t("ProfileHomePage.titleItalic")}&nbsp;
              <strong>{t("ProfileHomePage.titleBold")}</strong>
            </div>
          </div>
          <div className="hp-datebox">
            <div className="hp-date">
              {dateStr} · {timeStr}
            </div>
            <div className="hp-status">{t("ProfileHomePage.statusOnline")}</div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="hp-stats">
          <div className="hp-stat gold">
            <div className="hp-stat-line" />
            <div className="hp-stat-watermark">{articleCount}</div>
            <div className="hp-stat-lbl">
              {t("ProfileHomePage.stats.todayArticles")}
            </div>
            <div className="hp-stat-val">{articleCount}</div>
            <div className="hp-stat-delta">↑ 12%</div>
          </div>

          <div className="hp-stat teal">
            <div className="hp-stat-line" />
            <div className="hp-stat-watermark">{totalArticles}</div>
            <div className="hp-stat-lbl">
              {t("ProfileHomePage.stats.allArticles")}
            </div>
            <div className="hp-stat-val">{totalArticles}</div>
            <div className="hp-stat-delta">
              +{articleCount} {t("ProfileHomePage.stats.today")}
            </div>
          </div>

          <div className="hp-stat ink">
            <div className="hp-stat-line" />
            <div className="hp-stat-watermark">{totalDoctors}</div>
            <div className="hp-stat-lbl">
              {t("ProfileHomePage.stats.doctors")}
            </div>
            <div className="hp-stat-val">{totalDoctors}</div>
            <div className="hp-stat-delta">
              +{totalDoctors > 0 ? 5 : 0}% {t("ProfileHomePage.stats.new")}
            </div>
          </div>
        </div>

        {/* ── Two panels ── */}
        <div className="hp-grid">
          {/* My health */}
          <div className="hp-panel">
            <div className="hp-panel-head">
              <div className="hp-panel-icon">🫀</div>
              <span className="hp-panel-name">
                {t("ProfileHomePage.panels.myHealth")}
              </span>
              <span className="hp-panel-badge">
                {t("ProfileHomePage.panels.section")}
              </span>
            </div>
            {healthItems.map((item, i) => (
              <Link key={i} to={item.link} className="hp-row">
                <div className={`hp-row-ico ${item.color}`}>{item.icon}</div>
                <div className="hp-row-body">
                  <div className="hp-row-lbl">{item.label}</div>
                  <div className="hp-row-sub">{item.sub}</div>
                </div>
                <span className="hp-arrow">→</span>
              </Link>
            ))}
          </div>

          {/* My doctor */}
          <div className="hp-panel">
            <div className="hp-panel-head">
              <div className="hp-panel-icon teal">👨‍⚕️</div>
              <span className="hp-panel-name">
                {t("ProfileHomePage.panels.myDoctor")}
              </span>
              <span className="hp-panel-badge">
                {t("ProfileHomePage.panels.contacts")}
              </span>
            </div>
            {doctorItems.map((item, i) => (
              <Link key={i} to={item.link} className="hp-row">
                <div className={`hp-row-ico ${item.color}`}>{item.icon}</div>
                <div className="hp-row-body">
                  <div className="hp-row-lbl">{item.label}</div>
                  <div className="hp-row-sub">{item.sub}</div>
                </div>
                <span className="hp-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── AI Recommendations ── */}
        <div className="hp-ai">
          <div className="hp-ai-head">
            <div className="hp-panel-icon">✨</div>
            <span className="hp-panel-name">
              {t("ProfileHomePage.ai.title")}
            </span>
            <span className="hp-ai-badge">DocPats AI</span>
            <span className="hp-panel-dot" />
          </div>
          <div className="hp-ai-grid">
            {aiItems.map((item, i) => (
              <div className="hp-ai-item" key={i}>
                <div className="hp-ai-dot">{item.icon}</div>
                <div>
                  <div className="hp-ai-lbl">{item.label}</div>
                  <div className="hp-ai-sub">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── News ── */}
        <div className="hp-divider">
          <div className="hp-divider-line" />
          <div className="hp-divider-text">
            {t("ProfileHomePage.news.sectionLabel")}
          </div>
          <div className="hp-divider-line" />
        </div>

        <div className="hp-news-wrap">
          <NewsColumn />
          <NewsColumn />
        </div>
      </div>
    </div>
  );
}
