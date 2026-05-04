import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import DoctorAIDashboardWidget from "../../../components/ai/DoctorAIDashboardWidget";
import {
  FaCalendarDay,
  FaCommentDots,
  FaNewspaper,
  FaUserNurse,
} from "react-icons/fa6";
import { BsCalendar2DateFill, BsFillShareFill } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import useCommentCountBulk from "../../../components/shared/useCommentCount";
import { useTranslation } from "react-i18next";
import { FaUserMd } from "react-icons/fa";

/* ─────────────── STYLES ─────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600&display=swap');

  .hp {
    --accent:  #0ea5e9;
    --teal:    #0d9488;
    --success: #059669;
    --danger:  #e11d48;
    --bg:      #f0f4f8;
    --surface: #ffffff;
    --border:  #e2e8f0;
    --text:    #0f172a;
    --sub:     #475569;
    --muted:   #94a3b8;
    --f-head:  'Playfair Display', Georgia, serif;
    --f-body:  'Outfit', system-ui, sans-serif;
    font-family: var(--f-body);
    color: var(--text);
    background: var(--bg);
    min-height: 100vh;
  }

  .hp-wrap {
    padding: 28px 28px 48px;
  }
  @media (max-width: 600px) {
    .hp-wrap { padding: 16px 14px 36px; }
  }

  /* PAGE TITLE */
  .hp-topbar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 26px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .hp-eyebrow {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 4px;
  }
  .hp-title {
    font-family: var(--f-head);
    font-size: clamp(20px, 2.5vw, 28px);
    font-weight: 500;
    color: var(--text);
    line-height: 1.2;
  }
  .hp-date {
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
  }

  /* STATS GRID */
  .hp-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 26px;
  }
  @media (max-width: 900px) { .hp-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 420px) { .hp-stats { gap: 10px; } }

  .hp-stat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px 20px 18px;
    position: relative;
    overflow: hidden;
    transition: transform .2s, box-shadow .2s;
    opacity: 0;
    animation: hp-up .45s ease forwards;
  }
  .hp-stat:nth-child(1) { animation-delay: .04s; }
  .hp-stat:nth-child(2) { animation-delay: .10s; }
  .hp-stat:nth-child(3) { animation-delay: .16s; }
  .hp-stat:nth-child(4) { animation-delay: .22s; }
  .hp-stat:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 36px rgba(0,0,0,.08);
  }
  .hp-stat::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 16px 16px 0 0;
  }
  .hp-stat.c-blue::after  { background: linear-gradient(90deg,#0ea5e9,#38bdf8); }
  .hp-stat.c-green::after { background: linear-gradient(90deg,#059669,#34d399); }
  .hp-stat.c-rose::after  { background: linear-gradient(90deg,#e11d48,#fb7185); }
  .hp-stat.c-teal::after  { background: linear-gradient(90deg,#0d9488,#2dd4bf); }

  .hp-stat-bg {
    position: absolute;
    right: -6px; bottom: -8px;
    font-size: 64px;
    opacity: .05;
    pointer-events: none;
    line-height: 1;
    display: flex;
  }
  .hp-stat-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }
  .hp-stat-num {
    font-family: var(--f-head);
    font-size: clamp(28px, 3vw, 36px);
    font-weight: 600;
    line-height: 1;
  }
  .hp-stat.c-blue  .hp-stat-num { color: #0ea5e9; }
  .hp-stat.c-green .hp-stat-num { color: #059669; }
  .hp-stat.c-rose  .hp-stat-num { color: #e11d48; }
  .hp-stat.c-teal  .hp-stat-num { color: #0d9488; }

  @media (max-width: 420px) {
    .hp-stat { padding: 14px 14px 12px; border-radius: 12px; }
    .hp-stat-num { font-size: 26px; }
    .hp-stat-bg  { font-size: 48px; }
  }

  /* NEWS COLUMNS */
  .hp-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    opacity: 0;
    animation: hp-up .45s ease .3s forwards;
  }
  @media (max-width: 768px) {
    .hp-cols { grid-template-columns: 1fr; }
  }

  /* NEWS CARD */
   

  .hp-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }
  .hp-card-head-left{
    display:flex;
    align-items:center;
    gap:8px;
    }
    
  .hp-card-head-right{
    display:flex;
    align-items:center;
    gap:10px;
    }

  .hp-card-icon{
    font-size:14px;
    color:var(--accent);
    }

  .hp-card-more{
    font-size:11px;
    color:var(--accent);
    text-decoration:none;
    font-weight:500;
    }

  .hp-card-more:hover{
    text-decoration:underline;
    }

  .hp-item-meta{
    margin-top:6px;
    font-size:11px;
    color:var(--muted);
    display:flex;
    gap:12px;
    align-items:center;
    }

  .hp-item-meta svg{
    margin-right:3px;
    opacity:.7;
    }
  .hp-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    gap: 10px;

  }
  .hp-card-title {
    font-family: var(--f-head);
    font-size: 15px;
    font-weight: 500;
    color: var(--text);
    flex: 1;
    min-width: 0;
  }
  .hp-card-badge {
    font-family: var(--f-body);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--muted);
    background: var(--bg);
    border: 1px solid var(--border);
    padding: 2px 9px;
    border-radius: 20px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .hp-card-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    animation: hp-dot 2s ease infinite;
  }
  @keyframes hp-dot {
    0%,100% { box-shadow: 0 0 4px rgba(14,165,233,.4); }
    50%      { box-shadow: 0 0 10px rgba(14,165,233,.8); }
  }

  /* NEWS ITEM */
  .hp-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 20px;
    text-decoration: none !important;
    border-bottom: 1px solid var(--border);
    transition: background .15s;
    position: relative;
  }
  .hp-item:last-child { border-bottom: none; }
  .hp-item:hover { background: #f8fafc; }
  .hp-item::before {
    content: '';
    position: absolute;
    left: 0; top: 16%; bottom: 16%;
    width: 3px;
    background: var(--accent);
    border-radius: 0 2px 2px 0;
    transform: scaleY(0);
    transition: transform .18s ease;
  }
  .hp-item:hover::before { transform: scaleY(1); }

  .hp-item-img {
    width: 58px; height: 58px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    background: var(--bg);
    border: 1px solid var(--border);
    display: block;
  }
  .hp-item-body { flex: 1; min-width: 0; }
  .hp-item-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.4;
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hp-item-preview {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (max-width: 420px) {
    .hp-item { padding: 10px 14px; gap: 10px; }
    .hp-item-img { width: 44px; height: 44px; border-radius: 8px; }
  }

  /* EMPTY / LOADING */
  .hp-empty {
    padding: 40px 20px;
    text-align: center;
    color: var(--muted);
    font-size: 13px;
  }
  .hp-empty-icon { font-size: 28px; opacity: .2; margin-bottom: 8px; }
  .hp-loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 220px; gap: 10px;
    color: var(--muted); font-size: 14px;
  }
  .hp-spin {
    width: 20px; height: 20px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: hp-spin .7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes hp-spin { to { transform: rotate(360deg); } }
  @keyframes hp-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }


.ai-card{
  background:#fff;
  border:1px solid #e5e5e5;
  border-radius:14px;
  padding:20px;
  box-shadow:0 4px 18px rgba(0,0,0,0.05);
  max-width:360px;
  cursor:pointer;
  transition:all .2s;
  margin-bottom: 10px;
}

.ai-card:hover{
  transform:translateY(-2px);
  box-shadow:0 8px 30px rgba(0,0,0,.08);
}

.ai-card-header{
  display:flex;
  align-items:center;
  gap:10px;
}

.ai-card-icon{
  font-size:26px;
}

.ai-card-title{
  font-weight:600;
  font-size:16px;
}

.ai-card-subtitle{
  font-size:12px;
  color:#777;
}

.ai-card-desc{
  margin-top:15px;
  font-size:14px;
  color:#555;
}

.ai-card-link{
  margin-top:14px;
  font-size:13px;
  color:#2563eb;
  font-weight:500;
}

/* MODAL */

.ai-modal{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.55);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:9999;
}

.ai-modal-content{
  background:#fff;
  width:95%;
  max-width:1200px;
  max-height:90vh;
  overflow:auto;
  border-radius:14px;
  position:relative;
}

/* кнопка закрытия */

.ai-modal-close{
  position:absolute;
  top:12px;
  right:12px;
  border:none;
  background:#f5f5f5;
  width:34px;
  height:34px;
  border-radius:8px;
  font-size:18px;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
}

.ai-modal-close:hover{
  background:#e5e5e5;
}
  .hp-item-meta{
display:flex;
align-items:center;
flex-wrap:wrap;
gap:10px;
margin-top:6px;
font-size:12px;
color:var(--muted);
}

.hp-item-meta span{
display:flex;
align-items:center;
gap:4px;
white-space:nowrap;
}

.hp-meta-author{
font-weight:500;
color:var(--sub);
}

.hp-meta-category{
background:#eef2ff;
color:#4338ca;
padding:2px 8px;
border-radius:6px;
font-size:11px;
font-weight:500;
max-width:140px;
overflow:hidden;
text-overflow:ellipsis;
}

.hp-meta-likes,
.hp-meta-comments{
opacity:.8;
}

/* планшеты */

@media (max-width:768px){

.hp-item-meta{
gap:8px;
font-size:11px;
}

.hp-meta-category{
max-width:110px;
}

}

/* телефоны */

@media (max-width:480px){

.hp-item-meta{
gap:6px;
font-size:10px;
}

.hp-meta-category{
display:none;
}

.hp-meta-author{
max-width:120px;
overflow:hidden;
text-overflow:ellipsis;
}

.ai-card{
background:linear-gradient(135deg,#ffffff,#f8fafc);
border:1px solid #e2e8f0;
border-radius:16px;
padding:22px;
max-width:380px;
cursor:pointer;
position:relative;
overflow:hidden;
transition:all .25s ease;
box-shadow:0 8px 30px rgba(0,0,0,.05);
margin-bottom:18px;
}

/* градиентная линия сверху */

.ai-card::before{
content:"";
position:absolute;
top:0;
left:0;
right:0;
height:3px;
background:linear-gradient(90deg,#0ea5e9,#6366f1,#22c55e);
}

/* glow */

.ai-card::after{
content:"";
position:absolute;
inset:-40%;
background:radial-gradient(circle at center,rgba(14,165,233,.15),transparent 70%);
opacity:0;
transition:opacity .3s;
pointer-events:none;
}

/* hover эффект */

.ai-card:hover{
transform:translateY(-4px);
box-shadow:0 16px 50px rgba(0,0,0,.12);
border-color:#cbd5f5;
}

.ai-card:hover::after{
opacity:1;
}

/* header */

.ai-card-header{
display:flex;
align-items:center;
gap:12px;
}

/* иконка */

.ai-card-icon{
font-size:28px;
width:42px;
height:42px;
display:flex;
align-items:center;
justify-content:center;
border-radius:12px;
background:linear-gradient(135deg,#6366f1,#0ea5e9);
color:white;
box-shadow:0 6px 16px rgba(99,102,241,.35);
}

/* title */

.ai-card-title{
font-weight:600;
font-size:17px;
color:#0f172a;
}

/* subtitle */

.ai-card-subtitle{
font-size:12px;
color:#64748b;
margin-top:2px;
}

/* description */

.ai-card-desc{
margin-top:16px;
font-size:14px;
color:#475569;
line-height:1.5;
}

/* link */

.ai-card-link{
margin-top:14px;
font-size:13px;
font-weight:600;
color:#0ea5e9;
display:inline-flex;
align-items:center;
gap:4px;
}

/* hover link */

.ai-card:hover .ai-card-link{
color:#2563eb;
}

/* маленькая AI точка */

.ai-card-link::after{
content:"";
width:6px;
height:6px;
border-radius:50%;
background:#6366f1;
margin-left:6px;
animation:aiPulse 1.8s infinite;
}

@keyframes aiPulse{
0%{opacity:.3;transform:scale(.8);}
50%{opacity:1;transform:scale(1.2);}
100%{opacity:.3;transform:scale(.8);}
}
.ai-card-stats{
margin-top:14px;
display:flex;
flex-direction:column;
gap:6px;
padding:10px 12px;
background:#f8fafc;
border-radius:10px;
border:1px solid #e2e8f0;
}

.ai-stat-row{
display:flex;
justify-content:space-between;
align-items:center;
font-size:13px;
color:#475569;
}

.ai-stat-row strong{
font-size:14px;
font-weight:600;
}

.ai-risk{
color:#ef4444;
}

.ai-alert{
color:#f59e0b;
}
@media (max-width:480px){

.ai-card-stats{
font-size:12px;
}

.ai-stat-row strong{
font-size:13px;
}

}
`;

/* ─────────────── COMPONENT ─────────────── */
export default function ProfileDoctorHomePage() {
  const { t } = useTranslation();
  const { userId } = useParams();
  const [openAI, setOpenAI] = useState(false);
  const [articleCount, setArticleCount] = useState(0);
  const [articles, setArticles] = useState([]);
  const [scientificArticles, setScientificArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [patientStats, setPatientStats] = useState({
    totalPatients: 0,
    registeredPatients: 0,
    privatePatients: 0,
  });

  const articleIds = useMemo(() => articles.map((a) => a._id), [articles]);
  const commentCounts = useCommentCountBulk(articleIds);
  const API_BASE = process.env.REACT_APP_API_URL;

  /* articles */
  useEffect(() => {
    axios
      .get(`${API_BASE}/doctor-profile/articles-all`, {
        withCredentials: true,
        params: {
          page: 1,
          perPage: 3,
          sortBy: "date_desc",
          previewWords: 30,
        },
      })
      .then((r) =>
        setArticles(Array.isArray(r.data?.articles) ? r.data.articles : []),
      )
      .catch((e) => {
        console.error(e);
        setError(t("doctor_home.errors.load_articles"));
      })
      .finally(() => setLoading(false));
  }, [t]);
  useEffect(() => {
    axios
      .get(`${API_BASE}/doctor-profile/articles-scientific-all`, {
        withCredentials: true,
        page: 1,
        perPage: 3,
        sortBy: "date_desc",
        previewWords: 30,
      })
      .then((r) =>
        setScientificArticles(
          Array.isArray(r.data?.articles) ? r.data.articles : [],
        ),
      )
      .catch((e) => {
        console.error(e);
        setError(t("doctor_home.errors.load_articles"));
      });
  }, [t]);
  const [aiStats, setAiStats] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/ai/generate-clinical-summary/doctor-dashboard`, {
        withCredentials: true,
      })
      .then((res) => {
        setAiStats(res.data?.dashboard);
      })
      .catch(console.error);
  }, []);
  /* counts */
  /* counts */
  useEffect(() => {
    // Статьи СЕГОДНЯ — обычные + научные
    Promise.all([
      axios.get(`${API_BASE}/doctor-profile/api/count-articles-today`),
      axios.get(
        `${API_BASE}/doctor-profile/api/count-scientific-articles-today`,
      ),
    ])
      .then(([regular, scientific]) => {
        const total =
          (regular.data?.count || 0) + (scientific.data?.count || 0);
        setArticleCount(total);
      })
      .catch(console.error);

    // Статьи ВСЕГО — обычные + научные
    Promise.all([
      axios.get(`${API_BASE}/doctor-profile/api/count-all-articles`),
      axios.get(`${API_BASE}/doctor-profile/api/count-scientific-all-articles`),
    ])
      .then(([regular, scientific]) => {
        const total =
          (regular.data?.count || 0) + (scientific.data?.count || 0);
        setTotalArticles(total);
      })
      .catch(console.error);

    axios
      .get(`${API_BASE}/doctor-profile/api/count-all-doctors`)
      .then((r) => setTotalDoctors(r.data?.count || 0))
      .catch(console.error);

    axios
      .get(`${API_BASE}/doctor-profile/api/count-all-patients`, {
        withCredentials: true,
      })
      .then((r) => {
        if (r.data?.success) setPatientStats(r.data.data);
      })
      .catch(console.error);
  }, []);
  // закрытие по ESC
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") setOpenAI(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);
  if (loading)
    return (
      <div className="hp">
        <style>{S}</style>
        <div className="hp-loading">
          <div className="hp-spin" />
          {t("doctor_home.ui.loading_articles")}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="hp">
        <style>{S}</style>
        <div className="hp-empty" style={{ marginTop: 40 }}>
          {error}
        </div>
      </div>
    );

  const today = new Date().toLocaleDateString("en-EN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const NewsColumn = () => (
    <div className="hp-card hp-card-news">
      <div className="hp-card-head">
        <div className="hp-card-head-left">
          <FaNewspaper className="hp-card-icon" />
          <span className="hp-card-title">{t("doctor_home.news.title")}</span>
        </div>

        <div className="hp-card-head-right">
          <span className="hp-card-badge">{t("doctor_home.news.today")}</span>

          <Link to="/doctor/all-articles-here" className="hp-card-more">
            {t("doctor_home.news.view_all")}
          </Link>
        </div>
      </div>

      {articles.length > 0 ? (
        articles.map((article) => (
          <Link
            key={article._id}
            to={`/doctor/article-detail/${article._id}`}
            className="hp-item hp-item-news"
          >
            <img
              className="hp-item-img"
              src={article.imageUrl || "/default-image.jpg"}
              alt={article.title}
              onError={(e) => (e.target.style.opacity = "0")}
            />

            <div className="hp-item-body">
              <div className="hp-item-title">
                {article.title || t("doctor_home.news.item.no_title")}
              </div>

              <div className="hp-item-preview">
                {article.preview || t("doctor_home.news.item.no_preview")}
              </div>

              {/* META */}
              <div className="hp-item-meta">
                <span className="hp-meta-author">
                  <FaUserMd />
                  {[article.author?.firstName, article.author?.lastName]
                    .filter(Boolean)
                    .join(" ") || t("doctor_home.news.item.unknown_author")}
                </span>

                {article.category?.name && (
                  <span className="hp-meta-category">
                    {article.category.name}
                  </span>
                )}

                <span className="hp-meta-likes">
                  <AiFillLike /> {article.likes?.length || 0}
                </span>

                <span className="hp-meta-comments">
                  <FaCommentDots /> {commentCounts[article._id] || 0}
                </span>
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className="hp-empty">
          <div className="hp-empty-icon">
            <FaNewspaper />
          </div>
          {t("doctor_home.news.no_articles")}
        </div>
      )}
    </div>
  );
  const NewsScientificColumn = () => (
    <div className="hp-card hp-card-news hp-card-science">
      <div className="hp-card-head">
        <div className="hp-card-head-left">
          <FaUserMd className="hp-card-icon" />

          <span className="hp-card-title">
            {t("doctor_home.news.scientific_articles")}
          </span>
        </div>

        <div className="hp-card-head-right">
          <span className="hp-card-badge">{t("doctor_home.news.today")}</span>

          <Link
            to="/doctor/all-articles-scientific-here"
            className="hp-card-more"
          >
            {t("doctor_home.news.view_all")}
          </Link>
        </div>
      </div>

      {scientificArticles.length > 0 ? (
        scientificArticles.map((article) => (
          <Link
            key={article._id}
            to={`/doctor/article-scientific-detail/${article._id}`}
            className="hp-item hp-item-news"
          >
            <img
              className="hp-item-img"
              src={article.imageUrl || "/default-image.jpg"}
              alt={article.title}
              onError={(e) => (e.target.style.opacity = "0")}
            />

            <div className="hp-item-body">
              <div className="hp-item-title">
                {article.title || t("doctor_home.news.item.no_title")}
              </div>

              <div className="hp-item-preview">
                {article.preview || t("doctor_home.news.item.no_preview")}
              </div>

              {/* META */}
              <div className="hp-item-meta">
                <span className="hp-meta-author">
                  <FaUserMd />
                  {[article.author?.firstName, article.author?.lastName]
                    .filter(Boolean)
                    .join(" ") || t("doctor_home.news.item.unknown_author")}
                </span>

                {article.category?.name && (
                  <span className="hp-meta-category">
                    {article.category.name}
                  </span>
                )}

                <span className="hp-meta-likes">
                  <AiFillLike /> {article.likes?.length || 0}
                </span>

                <span className="hp-meta-comments">
                  <FaCommentDots /> {commentCounts[article._id] || 0}
                </span>
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className="hp-empty">
          <div className="hp-empty-icon">
            <FaNewspaper />
          </div>
          {t("doctor_home.news.no_articles")}
        </div>
      )}
    </div>
  );
  return (
    <div className="hp">
      <style>{S}</style>
      <div className="hp-wrap">
        {/* Header */}
        <div className="hp-topbar">
          <div>
            {/* <div className="hp-eyebrow">Dashboard</div> */}
            <div className="hp-title">
              {t("doctor_home.news.title") || "Главная"}
            </div>
          </div>
          <div className="hp-date">{today}</div>
        </div>

        {/* Stats */}
        <div className="hp-stats">
          <div className="hp-stat c-blue">
            <div className="hp-stat-bg">
              <FaUserMd />
            </div>
            <div className="hp-stat-label">
              {t("doctor_home.stats.total_doctors")}
            </div>
            <div className="hp-stat-num">{totalDoctors}</div>
          </div>

          <div className="hp-stat c-green">
            <div className="hp-stat-bg">
              <FaNewspaper />
            </div>
            <div className="hp-stat-label">
              {t("doctor_home.stats.total_articles")}
            </div>
            <div className="hp-stat-num">{totalArticles}</div>
          </div>

          <div className="hp-stat c-rose">
            <div className="hp-stat-bg">
              <FaCalendarDay />
            </div>
            <div className="hp-stat-label">
              {t("doctor_home.stats.today_articles")}
            </div>
            <div className="hp-stat-num">{articleCount}</div>
          </div>

          <div className="hp-stat c-teal">
            <div className="hp-stat-bg">
              <FaUserNurse />
            </div>
            <div className="hp-stat-label">
              {t("doctor_home.stats.total_patients")}
            </div>
            <div className="hp-stat-num">{patientStats.totalPatients}</div>
          </div>
        </div>
        {/* CARD */}
        <div className="ai-card" onClick={() => setOpenAI(true)}>
          <div className="ai-card-header">
            <div className="ai-card-icon">🧠</div>

            <div>
              <div className="ai-card-title">AI Practice Analytics</div>
              <div className="ai-card-subtitle">
                Clinical intelligence for your patients
              </div>
            </div>
          </div>

          <div className="ai-card-stats">
            <div className="ai-stat-row">
              <span>High Risk Patients</span>
              <strong className="ai-risk">
                {aiStats?.highRiskPatients?.length || 0}
              </strong>
            </div>

            <div className="ai-stat-row">
              <span>Active Alerts</span>
              <strong className="ai-alert">
                {aiStats?.patientsWithAlerts?.length || 0}
              </strong>
            </div>
          </div>

          <div className="ai-card-link">Open dashboard →</div>
        </div>

        {/* MODAL */}
        {openAI && (
          <div className="ai-modal" onClick={() => setOpenAI(false)}>
            <div
              className="ai-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* КНОПКА ЗАКРЫТИЯ */}
              <button
                className="ai-modal-close"
                onClick={() => setOpenAI(false)}
                aria-label="Close"
              >
                ✕
              </button>

              <DoctorAIDashboardWidget />
            </div>
          </div>
        )}

        {/* Two news columns */}
        <div className="hp-cols">
          <NewsColumn />
          <NewsScientificColumn />
        </div>
      </div>
    </div>
  );
}
