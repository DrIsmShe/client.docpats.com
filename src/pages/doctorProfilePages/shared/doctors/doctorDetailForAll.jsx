import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import CommentSection from "../../../../components/shared/CommentSection";
import { BsCalendar2DateFill } from "react-icons/bs";
import { FaCommentDots } from "react-icons/fa6";
import { AiFillLike } from "react-icons/ai";
import DoctorEndorseItem from "./DoctorEndorseItem";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { getOrCreateDialogWithUser } from "../../../communication/api/communicationApi";
import { Helmet } from "react-helmet-async";
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
    --gold-pale: #fffbeb;
    --gold-border: #fde68a;
    --border: #e7e2d8;
    --border2: #d6d0c6;
    --shadow-xs: 0 1px 3px rgba(28,25,23,.05);
    --shadow-sm: 0 2px 8px rgba(28,25,23,.07), 0 1px 3px rgba(28,25,23,.04);
    --shadow-md: 0 8px 24px rgba(28,25,23,.09), 0 2px 8px rgba(28,25,23,.04);
    --shadow-hover: 0 16px 40px rgba(15,118,110,.13), 0 4px 12px rgba(28,25,23,.06);
    --radius: 16px;
    --radius-sm: 10px;
    --transition: all .22s cubic-bezier(.4,0,.2,1);
    --font-display: 'Lora', Georgia, serif;
    --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  .dd-wrap {
    background: var(--cream);
    min-height: 100vh;
    font-family: var(--font-body);
    color: var(--ink);
  }

  /* ── HERO ── */
  .dd-hero {
    background: linear-gradient(150deg, #0c4a6e 0%, #0f766e 60%, #065f46 100%);
    padding: 52px 40px 100px;
    position: relative;
    overflow: hidden;
  }
  .dd-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 700px 400px at 90% 40%, rgba(20,184,166,.18) 0%, transparent 65%),
      radial-gradient(ellipse 300px 500px at 5% 110%, rgba(6,95,70,.5) 0%, transparent 60%);
    pointer-events: none;
  }
  .dd-hero::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 64px;
    background: var(--cream);
    clip-path: ellipse(55% 100% at 50% 100%);
  }
  .dd-hero-inner {
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    display: flex;
    gap: 32px;
    align-items: flex-end;
    flex-wrap: wrap;
  }

  /* Doctor photo */
  .dd-photo-wrap {
    width: 140px; height: 140px;
    border-radius: 24px;
    overflow: hidden;
    border: 3px solid rgba(255,255,255,.3);
    box-shadow: 0 8px 32px rgba(0,0,0,.2);
    flex-shrink: 0;
    background: rgba(255,255,255,.1);
  }
  .dd-photo {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
  }
  .dd-photo-initials {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display);
    font-size: 42px;
    font-weight: 700;
    color: rgba(255,255,255,.7);
  }

  .dd-hero-info { flex: 1; min-width: 0; }
  .dd-hero-tag {
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
  .dd-hero-tag::before { content:''; width:6px; height:6px; background:#5eead4; border-radius:50%; }
  .dd-hero-name {
    font-family: var(--font-display);
    font-size: clamp(24px, 3.5vw, 40px);
    font-weight: 700;
    color: white;
    line-height: 1.15;
    letter-spacing: -.015em;
    margin: 0 0 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .dd-verify-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 100px;
    letter-spacing: .05em;
    text-transform: uppercase;
  }
  .dd-verify-badge.approved { background: rgba(34,197,94,.2); color: #86efac; border: 1px solid rgba(34,197,94,.3); }
  .dd-verify-badge.pending  { background: rgba(245,158,11,.2); color: #fde68a; border: 1px solid rgba(245,158,11,.3); }
  .dd-verify-badge.rejected { background: rgba(239,68,68,.2);  color: #fca5a5; border: 1px solid rgba(239,68,68,.3); }
  .dd-verify-badge.unknown  { background: rgba(255,255,255,.1); color: rgba(255,255,255,.5); border: 1px solid rgba(255,255,255,.15); }

  .dd-hero-spec {
    font-size: 14px;
    color: #5eead4;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .dd-hero-chips {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 10px;
  }
  .dd-hero-chip {
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    color: rgba(255,255,255,.8);
    font-size: 12px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 100px;
  }
  .dd-hero-chip b { color: white; }

  /* ── BODY LAYOUT ── */
  .dd-body {
    max-width: 1400px;
    margin: -40px auto 0;
    padding: 0 32px 80px;
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 28px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .dd-body { grid-template-columns: 1fr; padding: 0 16px 60px; }
  }

  /* ── CARD BASE ── */
  .dd-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    margin-bottom: 20px;
  }
  .dd-card-head {
    padding: 18px 24px 14px;
    border-bottom: 1px solid var(--border);
    background: var(--cream2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }
  .dd-card-head-title {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 600;
    color: var(--ink);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dd-card-body { padding: 22px 24px; }

  /* ── ACTION BUTTONS ── */
  .dd-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 20px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    transition: var(--transition);
    border: 1.5px solid transparent;
    text-decoration: none;
    white-space: nowrap;
  }
  .dd-btn:disabled { opacity: .5; cursor: not-allowed; }
  .dd-btn-primary {
    background: var(--teal);
    color: white;
    border-color: var(--teal);
  }
  .dd-btn-primary:hover:not(:disabled) {
    background: var(--teal-mid);
    border-color: var(--teal-mid);
  }
  .dd-btn-outline {
    background: white;
    color: var(--teal);
    border-color: var(--teal-border);
  }
  .dd-btn-outline:hover:not(:disabled) {
    background: var(--teal-pale);
    border-color: var(--teal);
  }
  .dd-btn-ghost {
    background: var(--cream2);
    color: var(--ink2);
    border-color: var(--border2);
  }
  .dd-btn-ghost:hover:not(:disabled) {
    background: var(--parchment);
    border-color: var(--ink3);
  }
  .dd-btn-danger {
    background: white;
    color: #dc2626;
    border-color: #fca5a5;
  }
  .dd-btn-danger:hover:not(:disabled) {
    background: #fef2f2;
    border-color: #dc2626;
  }
  .dd-btn-warning {
    background: var(--gold-pale);
    color: var(--gold);
    border-color: var(--gold-border);
  }
  .dd-btn-warning:hover:not(:disabled) {
    background: #fef3c7;
  }
  .dd-btn-success {
    background: #f0fdf4;
    color: #16a34a;
    border-color: #bbf7d0;
  }
  .dd-btn-success:disabled { opacity: 1; cursor: default; }
  .dd-btn-msg {
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-mid) 100%);
    color: white;
    border-color: var(--teal);
    font-size: 14px;
    padding: 11px 24px;
    box-shadow: 0 4px 14px rgba(15,118,110,.3);
  }
  .dd-btn-msg:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(15,118,110,.4);
    transform: translateY(-1px);
  }

  .dd-btns-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 14px;
  }

  /* ── PROFILE INFO ROWS ── */
  .dd-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 20px;
  }
  @media (max-width: 600px) { .dd-info-grid { grid-template-columns: 1fr; } }
  .dd-info-item {}
  .dd-info-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--ink3);
    margin-bottom: 3px;
  }
  .dd-info-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--ink);
  }

  /* ── ENDORSEMENT RATING ── */
  .dd-endorse-score {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: linear-gradient(135deg, var(--gold-pale) 0%, #fff8ed 100%);
    border: 1px solid var(--gold-border);
    border-radius: var(--radius-sm);
    margin-bottom: 16px;
  }
  .dd-endorse-stars {
    font-size: 24px;
    letter-spacing: 2px;
  }
  .dd-endorse-num {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
  }
  .dd-endorse-label { font-size: 12px; color: var(--ink3); }
  .dd-endorsed-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 14px;
    border-radius: 100px;
    margin-top: 8px;
  }

  /* ── ABOUT ── */
  .dd-about-text {
    font-family: var(--font-display);
    font-size: 15px;
    font-style: italic;
    color: var(--ink2);
    line-height: 1.8;
    white-space: pre-line;
  }

  /* ── COLLAPSE TOGGLE ── */
  .dd-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 600;
    color: var(--teal);
    background: none;
    border: 1.5px solid var(--teal-border);
    border-radius: 100px;
    padding: 7px 18px;
    cursor: pointer;
    transition: var(--transition);
    font-family: var(--font-body);
  }
  .dd-toggle-btn:hover { background: var(--teal-pale); border-color: var(--teal); }
  .dd-toggle-arrow { transition: transform .2s; }
  .dd-toggle-btn.open .dd-toggle-arrow { transform: rotate(180deg); }

  .dd-count-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--teal);
    color: white;
    font-size: 11px;
    font-weight: 700;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 100px;
  }

  /* ── ENDORSEMENTS LIST ── */
  .dd-endorse-list {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── COMMENTS WRAP ── */
  .dd-comments-wrap { margin-top: 4px; }

  /* ── RIGHT: ARTICLE CARDS ── */
  .dd-article-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    box-shadow: var(--shadow-xs);
    transition: var(--transition);
    margin-bottom: 14px;
  }
  .dd-article-card:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-2px);
    border-color: var(--teal-border);
  }
  .dd-article-card-body { padding: 16px 18px 12px; }
  .dd-article-title {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 600;
    color: var(--teal);
    text-decoration: none;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;
    display: block;
  }
  .dd-article-title:hover { text-decoration: underline; }
  .dd-article-preview {
    font-size: 12px;
    color: var(--ink3);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 10px;
  }
  .dd-article-preview * {
    font-size: 12px !important;
    color: var(--ink3) !important;
    background: none !important;
    margin: 0 !important;
    padding: 0 !important;
    font-family: var(--font-body) !important;
  }
  .dd-article-meta {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
  .dd-article-meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--ink3);
    font-weight: 500;
  }
  .dd-article-meta-item svg { opacity: .7; }

  /* ── LOADING / ERROR ── */
  .dd-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 60vh; gap: 16px;
    font-size: 14px; color: var(--ink3);
    background: var(--cream);
    font-family: var(--font-body);
  }
  .dd-spinner {
    width: 44px; height: 44px;
    border: 3px solid var(--parchment);
    border-top-color: var(--teal);
    border-radius: 50%;
    animation: dd-spin .7s linear infinite;
  }
  @keyframes dd-spin { to { transform: rotate(360deg); } }

  /* ── MODAL ── */
  .dd-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(28,25,23,.5);
    backdrop-filter: blur(4px);
    z-index: 1040;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .dd-modal {
    background: white;
    border-radius: var(--radius);
    width: 100%;
    max-width: 480px;
    box-shadow: 0 24px 80px rgba(0,0,0,.2);
    overflow: hidden;
    animation: dd-modal-in .2s ease;
  }
  @keyframes dd-modal-in { from { opacity:0; transform: scale(.96) translateY(8px); } to { opacity:1; transform: none; } }
  .dd-modal-head {
    padding: 22px 28px 18px;
    border-bottom: 1px solid var(--border);
    background: var(--cream2);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .dd-modal-title {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 600;
    color: var(--ink);
  }
  .dd-modal-close {
    width: 30px; height: 30px;
    border: none; background: none;
    font-size: 20px; color: var(--ink3);
    cursor: pointer; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: var(--transition);
    line-height: 1;
  }
  .dd-modal-close:hover { background: var(--parchment); color: var(--ink); }
  .dd-modal-body { padding: 22px 28px; }
  .dd-modal-desc {
    font-size: 13px;
    color: var(--ink3);
    margin-bottom: 14px;
    line-height: 1.6;
  }
  .dd-modal-textarea {
    width: 100%;
    padding: 12px 14px;
    background: var(--cream2);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--ink);
    line-height: 1.6;
    resize: vertical;
    transition: var(--transition);
    outline: none;
    min-height: 110px;
  }
  .dd-modal-textarea:focus {
    border-color: var(--teal-mid);
    background: white;
    box-shadow: 0 0 0 3px rgba(15,118,110,.1);
  }
  .dd-modal-foot {
    padding: 16px 28px 22px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  /* ── AUTH GATE BANNER ── */
  .dd-auth-gate {
    display: flex;
    align-items: center;
    gap: 14px;
    background: linear-gradient(135deg, var(--teal-pale) 0%, #e0f7f4 100%);
    border: 1.5px solid var(--teal-border);
    border-radius: var(--radius-sm);
    padding: 16px 20px;
    margin-top: 4px;
  }
  .dd-auth-gate-icon {
    font-size: 26px;
    flex-shrink: 0;
    opacity: .8;
  }
  .dd-auth-gate-text {
    flex: 1;
  }
  .dd-auth-gate-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--teal);
    margin-bottom: 2px;
  }
  .dd-auth-gate-sub {
    font-size: 12px;
    color: var(--ink3);
    line-height: 1.5;
  }
  .dd-auth-gate-btns {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .dd-auth-gate-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    transition: var(--transition);
    white-space: nowrap;
    font-family: var(--font-body);
    cursor: pointer;
    border: 1.5px solid transparent;
  }
  .dd-auth-gate-link.primary {
    background: var(--teal);
    color: white;
    border-color: var(--teal);
  }
  .dd-auth-gate-link.primary:hover { background: var(--teal-mid); }
  .dd-auth-gate-link.outline {
    background: white;
    color: var(--teal);
    border-color: var(--teal-border);
  }
  .dd-auth-gate-link.outline:hover { background: var(--teal-pale); border-color: var(--teal); }

  /* ── PHONE HIDDEN ── */
  .dd-phone-hidden {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--ink3);
    background: var(--cream2);
    border: 1px dashed var(--border2);
    border-radius: 8px;
    padding: 5px 12px;
    font-style: italic;
  }
  .dd-phone-hidden a {
    color: var(--teal);
    font-weight: 600;
    font-style: normal;
    text-decoration: none;
  }
  .dd-phone-hidden a:hover { text-decoration: underline; }
`;

// ── Auth Gate Banner component ────────────────
function AuthGateBanner({ message, sub }) {
  return (
    <div className="dd-auth-gate">
      <div className="dd-auth-gate-icon">🔒</div>
      <div className="dd-auth-gate-text">
        <div className="dd-auth-gate-title">{message}</div>
        {sub && <div className="dd-auth-gate-sub">{sub}</div>}
      </div>
      <div className="dd-auth-gate-btns">
        <a href="/login" className="dd-auth-gate-link primary">
          Войти
        </a>
        <a href="/register" className="dd-auth-gate-link outline">
          Регистрация
        </a>
      </div>
    </div>
  );
}

export default function DoctorDetailsForAll() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [speciality, setSpeciality] = useState({ name: "Неизвестно" });
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isFriend, setIsFriend] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);

  // ── auth state ──
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isEndorsed, setIsEndorsed] = useState(false);
  const [endorseCount, setEndorseCount] = useState(0);
  const [loadingEndorse, setLoadingEndorse] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const [endorsements, setEndorsements] = useState([]);
  const [myEndorseComment, setMyEndorseComment] = useState("");
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [savingComment, setSavingComment] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL;
  const R2_BASE = process.env.REACT_APP_R2_PUBLIC_URL;
  const [showEndorsements, setShowEndorsements] = useState(false);

  const getProfileImageUrl = (img) => {
    if (!img || img.includes("undefined") || img.includes("localhost"))
      return "/default-image.jpg";
    if (img.startsWith("https://") && !img.includes("localhost")) return img;
    const clean = img.startsWith("/") ? img.slice(1) : img;
    return `${R2_BASE}/${clean}`;
  };

  const getTargetUserId = (profile) => {
    if (!profile || !profile.user) return null;
    if (typeof profile.user === "string") return profile.user;
    return profile.user._id || null;
  };

  // ── Check auth — публичная страница, поэтому просто проверяем без редиректа ──
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (res.data?.authenticated) {
          setIsAuthenticated(true);
          localStorage.setItem("userId", res.data.user.userId);
          setUserId(res.data.user.userId);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [API_BASE]);

  const reloadEndorsements = async (targetUserId) => {
    try {
      if (!targetUserId) return;
      const endorseRes = await axios.get(
        `${API_BASE}/doctor-profile/recommendations-from-doctor/get/${targetUserId}/list`,
        { withCredentials: true },
      );
      const list = endorseRes.data?.endorsements || [];
      setEndorsements(list);
      setEndorseCount(list.length);
      console.log("👉 ENDORSE LIST:", list);
      console.log("👉 CURRENT USER ID:", userId);
      const mine = list.find((e) => {
        if (!e.fromDoctorId) return false;
        let fromId = null;
        if (typeof e.fromDoctorId === "object" && e.fromDoctorId._id)
          fromId = e.fromDoctorId._id.toString();
        if (typeof e.fromDoctorId === "string") fromId = e.fromDoctorId;
        console.log("👉 CHECK ITEM:", { fromId, userId });
        return fromId === String(userId);
      });
      if (mine) {
        setIsEndorsed(true);
        setMyEndorseComment(mine.comment || "");
      } else {
        setIsEndorsed(false);
        setMyEndorseComment("");
      }
    } catch (err) {
      console.error("❌ Ошибка endorse GET:", err);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (!id) {
          setError("Не найден ID доктора");
          setLoading(false);
          return;
        }

        // Публичные запросы — не требуют авторизации
        const requestConfig = isAuthenticated ? { withCredentials: true } : {};

        const publicRequests = [
          axios.get(
            `${API_BASE}/doctor-profile/doctor-detail/${id}`,
            requestConfig,
          ),
          axios.get(
            `${API_BASE}/doctor-profile/doctor-articles/${id}`,
            requestConfig,
          ),
        ];

        // Friends — только если авторизован
        const [doctorRes, articlesRes, friendsRes] = await Promise.allSettled([
          ...publicRequests,
          isAuthenticated
            ? axios.get(`${API_BASE}/doctor-profile/api-follows/friends`, {
                withCredentials: true,
              })
            : Promise.resolve(null),
        ]);

        if (doctorRes.status === "fulfilled") {
          setDoctorProfile(doctorRes.value.data);
          setVerificationStatus(
            doctorRes.value.data?.verificationStatus || "not_submitted",
          );
        } else {
          setError("Ошибка загрузки профиля врача");
        }

        if (articlesRes.status === "fulfilled") {
          setArticles(articlesRes.value.data.data || []);
        }

        if (friendsRes.status === "fulfilled" && friendsRes.value?.data) {
          const friendsList = friendsRes.value.data.friends || [];
          setIsFriend(friendsList.some((f) => f.id === id));
        }
      } catch (err) {
        console.error("❌ Ошибка загрузки:", err);
        setError("Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, API_BASE, isAuthenticated]);

  useEffect(() => {
    const targetUserId = getTargetUserId(doctorProfile);
    if (targetUserId) reloadEndorsements(targetUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorProfile, userId, API_BASE]);

  const openCommentModal = () => setShowCommentModal(true);
  const closeCommentModal = () => setShowCommentModal(false);

  const handleSaveEndorseWithComment = async () => {
    try {
      const targetUserId = getTargetUserId(doctorProfile);
      if (!targetUserId) return;
      setSavingComment(true);
      if (!isEndorsed) {
        await axios.post(
          `${API_BASE}/doctor-profile/recommendations-from-doctor/add/${targetUserId}`,
          { comment: myEndorseComment },
          { withCredentials: true },
        );
      } else {
        await axios.put(
          `${API_BASE}/doctor-profile/recommendations-from-doctor/comment/${targetUserId}`,
          { comment: myEndorseComment },
          { withCredentials: true },
        );
      }
      await reloadEndorsements(targetUserId);
      setShowCommentModal(false);
    } catch (err) {
      console.error("❌ Ошибка сохранения рекомендации:", err);
      alert("Ошибка при сохранении рекомендации");
    } finally {
      setSavingComment(false);
    }
  };

  const handleRemoveEndorse = async () => {
    try {
      const targetUserId = getTargetUserId(doctorProfile);
      if (!targetUserId) return;
      setLoadingEndorse(true);
      await axios.delete(
        `${API_BASE}/doctor-profile/recommendations-from-doctor/delete/${targetUserId}`,
        { withCredentials: true },
      );
      await reloadEndorsements(targetUserId);
    } catch (err) {
      console.error("❌ Ошибка удаления endorse:", err);
      alert("Ошибка");
    } finally {
      setLoadingEndorse(false);
    }
  };

  const handleAddFriend = async () => {
    try {
      setAddingFriend(true);
      const targetUserId = getTargetUserId(doctorProfile);
      if (!targetUserId) return;
      await axios.post(
        `${API_BASE}/doctor-profile/api-follows/friends/add`,
        { friendId: targetUserId },
        { withCredentials: true },
      );
      setIsFriend(true);
    } catch (error) {
      console.error("❌ Ошибка при добавлении друга:", error);
      alert("Не удалось добавить друга");
    } finally {
      setAddingFriend(false);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      setAddingFriend(true);
      const targetUserId = getTargetUserId(doctorProfile);
      if (!targetUserId) return;
      await axios.delete(
        `${API_BASE}/doctor-profile/api-follows/friends/remove/${targetUserId}`,
        { withCredentials: true },
      );
      setIsFriend(false);
    } catch (error) {
      console.error("❌ Ошибка при удалении друга:", error);
      alert("Не удалось удалить из друзей");
    } finally {
      setAddingFriend(false);
    }
  };

  const [showComments, setShowComments] = useState(false);
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/comments/add-comments/comment-count/${id}`,
          { withCredentials: true },
        );
        setCommentCount(res.data.count || 0);
      } catch (err) {
        console.error("Ошибка получения количества комментариев:", err);
      }
    };
    if (id) fetchCommentCount();
  }, [id, API_BASE]);

  const [verificationStatus, setVerificationStatus] = useState("not_submitted");
  const verificationBadge = useMemo(() => {
    if (verificationStatus === "approved")
      return <span className="dd-verify-badge approved">✔ Verified</span>;
    if (verificationStatus === "pending")
      return <span className="dd-verify-badge pending">⏳ Pending</span>;
    if (verificationStatus === "rejected")
      return <span className="dd-verify-badge rejected">✖ Rejected</span>;
    return <span className="dd-verify-badge unknown">— Not verified</span>;
  }, [verificationStatus]);

  useEffect(() => {
    if (doctorProfile?.verificationStatus)
      setVerificationStatus(doctorProfile.verificationStatus);
  }, [doctorProfile]);

  /* ── loading / error states ── */
  if (loading)
    return (
      <div className="dd-wrap">
        <style>{styles}</style>
        <div className="dd-state">
          <div className="dd-spinner" />
          <span>Загрузка...</span>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="dd-wrap">
        <style>{styles}</style>
        <div className="dd-state">
          <span style={{ fontSize: 36, opacity: 0.4 }}>⚠</span>
          <span style={{ color: "#dc2626" }}>{error}</span>
        </div>
      </div>
    );
  if (!doctorProfile)
    return (
      <div className="dd-wrap">
        <style>{styles}</style>
        <div className="dd-state">
          <span>Профиль врача не найден</span>
        </div>
      </div>
    );

  let fullName = "Доктор";
  if (doctorProfile.user && typeof doctorProfile.user !== "string") {
    fullName =
      `${doctorProfile.user.firstName || ""} ${doctorProfile.user.lastName || ""}`.trim() ||
      "Доктор";
  }
  const nameInitials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const specName =
    doctorProfile.user?.specializationName ||
    doctorProfile.user?.specialization?.name ||
    t("doctorDetails.common.unknown");

  return (
    <div className="dd-wrap">
      <style>{styles}</style>
      <Helmet>
        <title>
          Dr. {fullName} — {specName} | DocPats
        </title>
        <meta
          name="description"
          content={
            doctorProfile.about?.slice(0, 155) ||
            `Профиль врача ${fullName}, специальность: ${specName}. DocPats — медицинская платформа.`
          }
        />
        <link
          rel="canonical"
          href={`https://docpats.com/public/doctor-profile/doctor-details/${id}`}
        />
        <meta property="og:type" content="profile" />
        <meta
          property="og:title"
          content={`Dr. ${fullName} — ${specName} | DocPats`}
        />
        <meta
          property="og:description"
          content={
            doctorProfile.about?.slice(0, 155) ||
            `Профиль врача ${fullName} на платформе DocPats`
          }
        />
        <meta
          property="og:url"
          content={`https://docpats.com/public/doctor-profile/doctor-details/${id}`}
        />
        <meta
          property="og:image"
          content={
            doctorProfile.profileImage
              ? getProfileImageUrl(doctorProfile.profileImage)
              : "https://docpats.com/og-default.jpg"
          }
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`Dr. ${fullName} — ${specName} | DocPats`}
        />
        <meta
          name="twitter:description"
          content={
            doctorProfile.about?.slice(0, 155) ||
            `Профиль врача ${fullName} на платформе DocPats`
          }
        />
        <meta
          name="twitter:image"
          content={
            doctorProfile.profileImage
              ? getProfileImageUrl(doctorProfile.profileImage)
              : "https://docpats.com/og-default.jpg"
          }
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Physician",
            name: `Dr. ${fullName}`,
            description: doctorProfile.about || "",
            medicalSpecialty: specName,
            url: `https://docpats.com/public/doctor-profile/doctor-details/${id}`,
            image: doctorProfile.profileImage
              ? getProfileImageUrl(doctorProfile.profileImage)
              : "",
            worksFor: doctorProfile.company
              ? {
                  "@type": "Organization",
                  name: doctorProfile.company,
                }
              : undefined,
            address: doctorProfile.country
              ? {
                  "@type": "PostalAddress",
                  addressCountry: doctorProfile.country,
                }
              : undefined,
          })}
        </script>
      </Helmet>
      {/* ── HERO ── */}
      <div className="dd-hero">
        <div className="dd-hero-inner">
          {/* Photo */}
          <div className="dd-photo-wrap">
            {doctorProfile.profileImage ? (
              <img
                src={getProfileImageUrl(doctorProfile.profileImage)}
                alt={fullName}
                className="dd-photo"
              />
            ) : (
              <div className="dd-photo-initials">{nameInitials}</div>
            )}
          </div>

          {/* Info */}
          <div className="dd-hero-info">
            <div className="dd-hero-tag">DocPats · Doctor Profile</div>
            <div className="dd-hero-name">
              Dr. {fullName}
              {verificationBadge}
            </div>
            <div className="dd-hero-spec">{specName}</div>
            <div className="dd-hero-chips">
              {doctorProfile.country && (
                <div className="dd-hero-chip">🌍 {doctorProfile.country}</div>
              )}
              {doctorProfile.company && (
                <div className="dd-hero-chip">🏥 {doctorProfile.company}</div>
              )}
              {endorseCount > 0 && (
                <div className="dd-hero-chip">
                  ⭐ <b>{endorseCount}</b>{" "}
                  {t("doctorDetails.endorse.byColleagues")}
                </div>
              )}
              <div className="dd-hero-chip">
                📄 <b>{articles.length}</b> статей
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="dd-body">
        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Message + Friend actions — только для авторизованных */}
          <div className="dd-card">
            <div className="dd-card-body">
              {isAuthenticated ? (
                <div className="dd-btns-row">
                  <button
                    className="dd-btn dd-btn-msg"
                    onClick={async () => {
                      try {
                        console.log("👆 КЛИК по 'Написать врачу'");
                        const targetUserId = getTargetUserId(doctorProfile);
                        console.log(
                          "🎯 targetUserId (userId врача):",
                          targetUserId,
                        );
                        if (!targetUserId) {
                          alert("Не найден userId врача");
                          return;
                        }
                        const res =
                          await getOrCreateDialogWithUser(targetUserId);
                        console.log(
                          "✅ Ответ от /communication/dialogs/with-user:",
                          res.data,
                        );
                        const dialogId =
                          res.data?.dialog?._id || res.data?.dialog?.id;
                        console.log("🆔 dialogId:", dialogId);
                        if (!dialogId) {
                          alert("Сервер не вернул dialogId");
                          return;
                        }
                        navigate(`/doctor/communication/${dialogId}`);
                      } catch (err) {
                        console.error(
                          "❌ Ошибка при создании/получении диалога:",
                          err,
                        );
                        alert("Ошибка при создании диалога, смотри консоль");
                      }
                    }}
                  >
                    💬 Написать врачу
                  </button>

                  {!isFriend ? (
                    <button
                      className="dd-btn dd-btn-primary"
                      onClick={handleAddFriend}
                      disabled={addingFriend}
                    >
                      {addingFriend
                        ? t("doctorDetails.friends.adding")
                        : `+ ${t("doctorDetails.friends.add")}`}
                    </button>
                  ) : (
                    <>
                      <button className="dd-btn dd-btn-success" disabled>
                        ✅ {t("doctorDetails.friends.already")}
                      </button>
                      <button
                        className="dd-btn dd-btn-danger"
                        onClick={handleRemoveFriend}
                        disabled={addingFriend}
                      >
                        {addingFriend
                          ? t("doctorDetails.friends.removing")
                          : t("doctorDetails.friends.remove")}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <AuthGateBanner
                  message="Хотите написать врачу или добавить в контакты?"
                  sub="Войдите или зарегистрируйтесь — это бесплатно"
                />
              )}
            </div>
          </div>

          {/* Profile info */}
          <div className="dd-card">
            <div className="dd-card-head">
              <div className="dd-card-head-title">
                👤 {t("doctorDetails.about.title") || "О враче"}
              </div>
            </div>
            <div className="dd-card-body">
              <div
                className="dd-info-grid"
                style={{ marginBottom: doctorProfile.about ? 20 : 0 }}
              >
                <div className="dd-info-item">
                  <div className="dd-info-label">
                    {t("doctorDetails.profile.specialization")}
                  </div>
                  <div className="dd-info-value">{specName}</div>
                </div>
                <div className="dd-info-item">
                  <div className="dd-info-label">
                    {t("doctorDetails.profile.company")}
                  </div>
                  <div className="dd-info-value">
                    {doctorProfile.company || "—"}
                  </div>
                </div>
                <div className="dd-info-item">
                  <div className="dd-info-label">
                    {t("doctorDetails.profile.country")}
                  </div>
                  <div className="dd-info-value">
                    {doctorProfile.country || "—"}
                  </div>
                </div>

                {/* Телефон — скрыт для гостей */}
                <div className="dd-info-item">
                  <div className="dd-info-label">
                    {t("doctorDetails.profile.phone")}
                  </div>
                  <div className="dd-info-value">
                    {isAuthenticated ? (
                      doctorProfile.phoneNumber || "—"
                    ) : (
                      <span className="dd-phone-hidden">
                        🔒 Скрыто · <a href="/login">войдите</a>, чтобы увидеть
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {doctorProfile.about && (
                <>
                  <div
                    style={{
                      height: 1,
                      background: "var(--border)",
                      margin: "0 0 18px",
                    }}
                  />
                  <div className="dd-about-text">
                    {doctorProfile.about.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Endorsements */}
          <div className="dd-card">
            <div className="dd-card-head">
              <div className="dd-card-head-title">
                ⭐ {t("doctorDetails.endorse.blockTitle")}
                {endorseCount > 0 && (
                  <span className="dd-count-pill">{endorseCount}</span>
                )}
              </div>
            </div>
            <div className="dd-card-body">
              {endorseCount > 0 && (
                <div className="dd-endorse-score">
                  <div className="dd-endorse-num">{endorseCount}</div>
                  <div>
                    <div className="dd-endorse-stars">
                      {"⭐".repeat(Math.min(endorseCount, 5))}
                    </div>
                    <div className="dd-endorse-label">
                      {t("doctorDetails.endorse.byColleagues")}
                    </div>
                  </div>
                </div>
              )}

              {/* Кнопки рекомендации — только для авторизованных */}
              {isAuthenticated ? (
                <div
                  className="dd-btns-row"
                  style={{ marginTop: 0, marginBottom: 12 }}
                >
                  {!isEndorsed ? (
                    <button
                      className="dd-btn dd-btn-primary"
                      onClick={openCommentModal}
                      disabled={loadingEndorse}
                    >
                      {loadingEndorse
                        ? t("doctorDetails.endorse.sending")
                        : `✦ ${t("doctorDetails.endorse.add")}`}
                    </button>
                  ) : (
                    <>
                      <button
                        className="dd-btn dd-btn-warning"
                        onClick={openCommentModal}
                        disabled={loadingEndorse}
                      >
                        ✏️ {t("doctorDetails.endorse.edit")}
                      </button>
                      <button
                        className="dd-btn dd-btn-danger"
                        onClick={handleRemoveEndorse}
                        disabled={loadingEndorse}
                      >
                        {loadingEndorse
                          ? t("doctorDetails.endorse.removing")
                          : t("doctorDetails.endorse.remove")}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <AuthGateBanner
                    message="Рекомендуйте этого врача коллегам"
                    sub="Функция доступна только зарегистрированным пользователям"
                  />
                </div>
              )}

              {isAuthenticated && isEndorsed && (
                <div className="dd-endorsed-badge">
                  ✅ {t("doctorDetails.endorse.already")}
                </div>
              )}

              {/* Список рекомендаций — доступен всем */}
              <div style={{ marginTop: 16 }}>
                <button
                  className={`dd-toggle-btn${showEndorsements ? " open" : ""}`}
                  onClick={() => setShowEndorsements((prev) => !prev)}
                >
                  {showEndorsements
                    ? t("doctorDetails.endorse.hide", { count: endorseCount })
                    : t("doctorDetails.endorse.show", { count: endorseCount })}
                  <span className="dd-toggle-arrow">▾</span>
                </button>

                {showEndorsements && (
                  <div className="dd-endorse-list">
                    {endorsements.length === 0 ? (
                      <p style={{ color: "var(--ink3)", fontSize: 14 }}>
                        {t("doctorDetails.endorse.noEndorsements")}
                      </p>
                    ) : (
                      endorsements.map((e) => (
                        <DoctorEndorseItem key={e._id} endorsement={e} />
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="dd-card">
            <div className="dd-card-head">
              <div className="dd-card-head-title">
                💬{" "}
                {t("doctorDetails.comments.show", { count: commentCount }) ||
                  "Комментарии"}
                <span className="dd-count-pill">{commentCount}</span>
              </div>
              <button
                className={`dd-toggle-btn${showComments ? " open" : ""}`}
                onClick={() => setShowComments((prev) => !prev)}
              >
                {showComments ? "Скрыть" : "Показать"}{" "}
                <span className="dd-toggle-arrow">▾</span>
              </button>
            </div>
            {showComments && (
              <div className="dd-card-body dd-comments-wrap">
                {isAuthenticated ? (
                  /* Авторизован — полный CommentSection с формой */
                  <CommentSection
                    refId={id}
                    userId={userId}
                    targetType="Doctor"
                    onNewComment={() => setCommentCount((c) => c + 1)}
                    onDeleteComment={() =>
                      setCommentCount((c) => Math.max(0, c - 1))
                    }
                  />
                ) : (
                  /* Гость — только чтение + баннер */
                  <>
                    <CommentSection
                      refId={id}
                      userId={null}
                      targetType="Doctor"
                      readOnly={true}
                    />
                    <div style={{ marginTop: 16 }}>
                      <AuthGateBanner
                        message="Хотите оставить комментарий?"
                        sub="Войдите или зарегистрируйтесь, чтобы участвовать в обсуждении"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN — ARTICLES ── */}
        <div>
          <div className="dd-card">
            <div className="dd-card-head">
              <div className="dd-card-head-title">
                📄 {t("doctorDetails.articles.title")}
                {articles.length > 0 && (
                  <span className="dd-count-pill">{articles.length}</span>
                )}
              </div>
            </div>
            <div className="dd-card-body" style={{ padding: "16px 18px" }}>
              {articles.length === 0 ? (
                <p
                  style={{
                    color: "var(--ink3)",
                    fontSize: 14,
                    textAlign: "center",
                    padding: "20px 0",
                  }}
                >
                  {t("doctorDetails.articles.none")}
                </p>
              ) : (
                articles.map((article) => (
                  <div key={article._id} className="dd-article-card">
                    <div className="dd-article-card-body">
                      <Link
                        to={`/doctor/article-detail/${article._id}`}
                        className="dd-article-title"
                      >
                        {article.title}
                      </Link>
                      <div
                        className="dd-article-preview"
                        dangerouslySetInnerHTML={{
                          __html: article.content.slice(0, 100) + "...",
                        }}
                      />
                      <div className="dd-article-meta">
                        <div className="dd-article-meta-item">
                          <BsCalendar2DateFill size={11} />
                          {new Date(article.createdAt).toLocaleDateString(
                            "ru-RU",
                          )}
                        </div>
                        <div className="dd-article-meta-item">
                          <FaCommentDots size={11} />
                          {article.commentsCount || 0}
                        </div>
                        <div className="dd-article-meta-item">
                          <AiFillLike size={11} />
                          {article.likesCount || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL — только для авторизованных ── */}
      {isAuthenticated && showCommentModal && (
        <div className="dd-modal-overlay" onClick={closeCommentModal}>
          <div className="dd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dd-modal-head">
              <div className="dd-modal-title">
                {isEndorsed
                  ? t("doctorDetails.endorse.modal.editTitle")
                  : t("doctorDetails.endorse.modal.addTitle")}
              </div>
              <button className="dd-modal-close" onClick={closeCommentModal}>
                ×
              </button>
            </div>
            <div className="dd-modal-body">
              <p className="dd-modal-desc">
                {t("doctorDetails.endorse.modal.description")}
              </p>
              <textarea
                className="dd-modal-textarea"
                rows={4}
                value={myEndorseComment}
                onChange={(e) => setMyEndorseComment(e.target.value)}
                placeholder={t("doctorDetails.endorse.modal.placeholder")}
              />
            </div>
            <div className="dd-modal-foot">
              <button
                className="dd-btn dd-btn-ghost"
                onClick={closeCommentModal}
                disabled={savingComment}
              >
                {t("doctorDetails.endorse.modal.cancel")}
              </button>
              <button
                className="dd-btn dd-btn-primary"
                onClick={handleSaveEndorseWithComment}
                disabled={savingComment}
              >
                {savingComment
                  ? t("doctorDetails.endorse.modal.saving")
                  : isEndorsed
                    ? t("doctorDetails.endorse.modal.saveChanges")
                    : t("doctorDetails.endorse.modal.send")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
