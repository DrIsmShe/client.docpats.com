// DoctorDetail.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import CommentSection from "../../../../components/shared/CommentSection";
import { BsCalendar2DateFill } from "react-icons/bs";
import { FaCommentDots } from "react-icons/fa6";
import { AiFillLike } from "react-icons/ai";
import { FaCalendarCheck } from "react-icons/fa";
import { getOrCreateDialogWithUser } from "../../../communication/api/communicationApi";
const API = process.env.REACT_APP_API_URL;

/* ====== Маппинг языков i18n → BCP-47 локали (для дат и Intl) ====== */
const LANG_TO_LOCALE = {
  ru: "ru-RU",
  en: "en-US",
  tr: "tr-TR",
  ar: "ar-SA",
  az: "az-AZ",
};

/* ====================== Безопасный useState ====================== */
function useSafeState(initialValue) {
  const mounted = useRef(true);
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const safeSet = useCallback((updater) => {
    if (!mounted.current) return;
    setState(updater);
  }, []);

  return [state, safeSet];
}

/* ====================== Шина событий «Мои доктора» ====================== */
function emitMyDoctorsChanged(detail) {
  window.dispatchEvent(new CustomEvent("my-doctors:changed", { detail }));
}

/* ====================== Утилиты ====================== */
const stripHtml = (s) => (s || "").replace(/<[^>]*>/g, " ");
/* Старый ru-форматтер оставляем как есть — не ломаем внешние использования */
const dateRu = (iso) => (iso ? new Date(iso).toLocaleDateString("ru-RU") : "—");

/* ====================== Иконки ====================== */
const IconMessage = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconPlus = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconTrash = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IconHeart = ({ filled }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const IconClinic = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 9h6" />
    <path d="M12 6v6" />
    <path d="M9 21v-5h6v5" />
  </svg>
);
const IconGlobe = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IconBriefcase = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const IconCheck = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconClock = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconX = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconBookOpen = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const IconChat = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const IconAbout = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/* ====================== Стили ======================
 * ЗАЩИТНАЯ ВЁРСТКА: компонент НЕ МОЖЕТ расшириться больше родителя.
 * Все контейнеры имеют: width:100%, max-width:100%, min-width:0, box-sizing:border-box
 * Все flex/grid items имеют min-width:0 (позволяет контенту сжиматься)
 */
const DDStyles = () => (
  <style>{`
    /* ===== Глобальное box-sizing для всех потомков ===== */
    .dd-wrap, .dd-wrap *, .dd-wrap *::before, .dd-wrap *::after {
      box-sizing: border-box;
    }

    /* ===== Base / container ===== */
    .dd-wrap {
      width: 100%;
      max-width: 1280px;
      min-width: 0;
      margin: 0 auto;
      padding: clamp(12px, 2vw, 32px) clamp(8px, 1.5vw, 20px) clamp(40px, 6vw, 80px);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      overflow-x: clip;
      overflow-x: hidden; /* fallback */
    }

    /* ===== Layout ===== */
    .dd-layout {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
      gap: clamp(12px, 2vw, 22px);
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .dd-layout > * { min-width: 0; max-width: 100%; }
    @media (max-width: 1024px) {
      .dd-layout { grid-template-columns: minmax(0, 1fr); }
    }

    /* ===== Profile card ===== */
    .dd-profile-card {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: clamp(12px, 2vw, 20px);
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }

    /* ===== Hero ===== */
    .dd-hero {
      position: relative;
      width: 100%;
      max-width: 100%;
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 55%, #0369a1 100%);
      overflow: hidden;
    }
    .dd-hero::before {
      content: "";
      position: absolute;
      top: -80px; right: -60px;
      width: 280px; height: 280px;
      background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%);
      pointer-events: none;
    }
    .dd-hero-inner {
      position: relative;
      z-index: 1;
      padding: clamp(18px, 3.5vw, 36px);
      display: flex;
      gap: clamp(14px, 2.5vw, 28px);
      align-items: center;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .dd-photo-frame {
      flex-shrink: 0;
      width: clamp(88px, 14vw, 170px);
      height: clamp(88px, 14vw, 170px);
      border-radius: clamp(12px, 1.6vw, 20px);
      overflow: hidden;
      border: 3px solid rgba(255,255,255,0.8);
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.25);
      background: white;
    }
    .dd-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .dd-hero-text {
      color: white;
      min-width: 0;
      max-width: 100%;
      flex: 1 1 0;
      overflow: hidden;
    }
    .dd-spec-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.18);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.22);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: clamp(10px, 1.2vw, 12px);
      color: white;
      font-weight: 600;
      letter-spacing: 0.02em;
      margin-bottom: clamp(6px, 1vw, 12px);
      max-width: 100%;
      min-width: 0;
    }
    .dd-spec-badge svg { flex-shrink: 0; }
    .dd-spec-badge-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
      flex: 1 1 auto;
    }
    .dd-name {
      font-size: clamp(16px, 2.8vw, 30px);
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 clamp(6px, 1vw, 10px);
      line-height: 1.2;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      word-break: break-word;
      overflow-wrap: anywhere;
      min-width: 0;
      max-width: 100%;
    }
    .dd-verify-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: clamp(9px, 1vw, 11px);
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 999px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      white-space: nowrap;
      max-width: 100%;
      flex-shrink: 0;
    }
    .dd-verify-badge.approved {
      background: rgba(34, 197, 94, 0.25);
      color: #bbf7d0;
      border: 1px solid rgba(34, 197, 94, 0.4);
    }
    .dd-verify-badge.pending {
      background: rgba(251, 191, 36, 0.25);
      color: #fde68a;
      border: 1px solid rgba(251, 191, 36, 0.4);
    }
    .dd-verify-badge.rejected {
      background: rgba(239, 68, 68, 0.25);
      color: #fecaca;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .dd-verify-badge.notsubmitted {
      background: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.25);
    }
    .dd-hero-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      font-size: clamp(11px, 1.3vw, 13px);
      color: rgba(255,255,255,0.9);
      max-width: 100%;
      min-width: 0;
    }
    .dd-hero-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }
    .dd-hero-meta-item svg { color: rgba(255,255,255,0.75); flex-shrink: 0; }
    .dd-hero-meta-item > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    /* Hero на мобилке → колонка */
    @media (max-width: 560px) {
      .dd-hero-inner {
        flex-direction: column;
        text-align: center;
        padding: clamp(16px, 5vw, 24px) clamp(12px, 4vw, 20px);
        gap: 12px;
      }
      .dd-photo-frame {
        width: clamp(96px, 28vw, 130px);
        height: clamp(96px, 28vw, 130px);
      }
      .dd-hero-meta { justify-content: center; }
      .dd-name { justify-content: center; }
      .dd-spec-badge { margin-inline: auto; }
    }

    /* ===== Actions ===== */
    .dd-actions {
      padding: clamp(12px, 2.5vw, 24px) clamp(12px, 3vw, 28px);
      border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(to bottom, #f8fafc 0%, white 100%);
      max-width: 100%;
      min-width: 0;
    }
    .dd-cta-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      max-width: 100%;
      padding: clamp(12px, 1.8vw, 15px) clamp(12px, 3vw, 24px);
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      text-decoration: none;
      border: none;
      border-radius: 12px;
      font-size: clamp(13px, 1.6vw, 15px);
      font-weight: 700;
      letter-spacing: 0.3px;
      cursor: pointer;
      box-shadow: 0 8px 20px -6px rgba(0, 150, 255, 0.45);
      transition: all 0.25s ease;
      font-family: inherit;
      min-height: 44px;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dd-cta-primary svg { flex-shrink: 0; }
    .dd-cta-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 28px -8px rgba(0, 150, 255, 0.55);
    }

    /* 3 → 2 → 1 колонка */
    .dd-actions-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-top: 10px;
      max-width: 100%;
    }
    @media (max-width: 768px) {
      .dd-actions-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .dd-actions-row > *:last-child { grid-column: 1 / -1; }
    }
    @media (max-width: 480px) {
      .dd-actions-row { grid-template-columns: minmax(0, 1fr); }
      .dd-actions-row > *:last-child { grid-column: auto; }
    }

    .dd-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: clamp(10px, 1.4vw, 11px) clamp(8px, 1.8vw, 16px);
      border-radius: 10px;
      font-size: clamp(11px, 1.4vw, 13px);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      text-decoration: none;
      border: 1px solid transparent;
      min-height: 42px;
      flex-wrap: wrap;
      text-align: center;
      line-height: 1.2;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      overflow: hidden;
    }
    .dd-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .dd-btn svg { flex-shrink: 0; }

    .dd-btn-msg { background: #0891b2; color: white; border-color: #0891b2; }
    .dd-btn-msg:hover:not(:disabled) { background: #0e7490; border-color: #0e7490; transform: translateY(-1px); }
    .dd-btn-add { background: white; color: #0891b2; border-color: #a5f3fc; }
    .dd-btn-add:hover:not(:disabled) { background: #ecfeff; border-color: #0891b2; }
    .dd-btn-remove { background: white; color: #be123c; border-color: #fecdd3; }
    .dd-btn-remove:hover:not(:disabled) { background: #fff1f2; border-color: #f43f5e; }
    .dd-btn-recommend { background: white; color: #15803d; border-color: #bbf7d0; }
    .dd-btn-recommend:hover:not(:disabled) { background: #f0fdf4; border-color: #22c55e; }
    .dd-btn-recommend.active {
      background: linear-gradient(135deg, #15803d 0%, #22c55e 100%);
      color: white;
      border-color: transparent;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }
    .dd-rec-count {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.8);
      color: #15803d;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .dd-btn-recommend.active .dd-rec-count {
      background: rgba(255, 255, 255, 0.25);
      color: white;
    }

    /* ===== Info grid ===== */
    .dd-info-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      padding: clamp(12px, 2vw, 20px) clamp(12px, 3vw, 28px);
      max-width: 100%;
    }
    @media (max-width: 768px) {
      .dd-info-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 480px) {
      .dd-info-grid { grid-template-columns: minmax(0, 1fr); }
    }
    .dd-info-item {
      padding: clamp(10px, 1.6vw, 14px) clamp(10px, 1.8vw, 16px);
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }
    .dd-info-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .dd-info-label svg { flex-shrink: 0; }
    .dd-info-value {
      font-size: clamp(12px, 1.5vw, 14px);
      color: #0f172a;
      font-weight: 500;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .dd-info-value.empty { color: #94a3b8; font-style: italic; font-weight: 400; }

    /* ===== Sections / About ===== */
    .dd-section {
      padding: clamp(14px, 2.2vw, 22px) clamp(12px, 3vw, 28px);
      border-top: 1px solid #f1f5f9;
      max-width: 100%;
    }
    .dd-section-title {
      font-size: clamp(13px, 1.7vw, 15px);
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 10px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .dd-section-title svg { color: #0891b2; flex-shrink: 0; }
    .dd-about-text {
      font-size: clamp(12px, 1.5vw, 14px);
      line-height: 1.7;
      color: #334155;
      white-space: pre-wrap;
      font-style: italic;
      padding: clamp(10px, 1.6vw, 14px) clamp(12px, 2vw, 18px);
      background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
      border-left: 3px solid #0891b2;
      border-radius: 8px;
      margin: 0;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      max-width: 100%;
    }
    .dd-about-text.empty { font-style: normal; color: #94a3b8; }

    /* ===== Comments card ===== */
    .dd-comments-card {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: clamp(12px, 2vw, 20px);
      padding: clamp(14px, 2.6vw, 28px);
      margin-top: clamp(12px, 2vw, 22px);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }

    /* ===== Sidebar / articles ===== */
    .dd-sidebar {
      display: flex;
      flex-direction: column;
      gap: clamp(10px, 1.6vw, 16px);
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .dd-sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: clamp(12px, 2vw, 18px) clamp(14px, 2.4vw, 22px);
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 14px;
      color: white;
      box-shadow: 0 6px 18px -8px rgba(15, 23, 42, 0.3);
      max-width: 100%;
      min-width: 0;
    }
    .dd-sidebar-title {
      font-size: clamp(13px, 1.6vw, 15px);
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dd-sidebar-title svg { flex-shrink: 0; }
    .dd-sidebar-count {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .dd-article-card {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: clamp(12px, 2vw, 18px);
      transition: all 0.2s ease;
      overflow: hidden;
    }
    .dd-article-card:hover {
      border-color: #a5f3fc;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px -8px rgba(8, 145, 178, 0.2);
    }
    .dd-article-link { text-decoration: none; color: inherit; }
    .dd-article-title {
      font-size: clamp(13px, 1.6vw, 15px);
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
      margin: 0 0 8px;
      transition: color 0.15s ease;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }
    .dd-article-card:hover .dd-article-title { color: #0891b2; }
    .dd-article-preview {
      font-size: clamp(11px, 1.4vw, 13px);
      color: #64748b;
      line-height: 1.55;
      margin: 0 0 10px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .dd-article-stats {
      display: flex;
      gap: 4px;
      padding-top: 8px;
      border-top: 1px dashed #e2e8f0;
      flex-wrap: wrap;
    }
    .dd-article-stat {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      padding: 3px 7px;
      border-radius: 6px;
      font-weight: 500;
      white-space: nowrap;
    }
    .dd-article-stat.date { color: #64748b; }
    .dd-article-stat.comments { color: #0e7490; background: #ecfeff; }
    .dd-article-stat.likes { color: #be185d; background: #fdf2f8; }

    .dd-empty-articles {
      text-align: center;
      padding: clamp(24px, 4vw, 40px) 16px;
      background: white;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      color: #64748b;
      font-size: 14px;
    }

    /* ===== States ===== */
    .dd-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: clamp(48px, 8vw, 80px) 16px;
      color: #64748b;
      font-size: 14px;
    }
    .dd-spinner {
      width: 20px; height: 20px;
      border: 2.5px solid #e2e8f0;
      border-top-color: #0891b2;
      border-radius: 50%;
      animation: dd-spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    @keyframes dd-spin { to { transform: rotate(360deg); } }
    .dd-alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 16px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      margin: 20px 0;
      max-width: 100%;
      word-break: break-word;
    }
    .dd-alert.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }
    .dd-alert.empty {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #64748b;
      color: #334155;
    }

    /* ===== XS: очень маленькие экраны (≤ 380px) ===== */
    @media (max-width: 380px) {
      .dd-wrap { padding: 10px 6px 40px; }
      .dd-photo-frame { width: 90px; height: 90px; border-width: 3px; }
      .dd-btn {
        font-size: 11px;
        padding: 10px 6px;
        gap: 5px;
        min-height: 40px;
      }
      .dd-rec-count { font-size: 10px; padding: 2px 5px; }
      .dd-cta-primary {
        font-size: 13px;
        padding: 12px 10px;
      }
      .dd-hero-meta { font-size: 11px; }
      .dd-about-text { font-size: 12px; padding: 10px 12px; }
      .dd-hero-inner { padding: 16px 12px; }
      .dd-actions { padding: 12px; }
      .dd-info-grid, .dd-section { padding-inline: 12px; }
      .dd-comments-card { padding: 14px; }
      .dd-article-card { padding: 12px; }
    }
  `}</style>
);

/* ====================== Компонент ====================== */
export default function DoctorDetail() {
  const { t, i18n } = useTranslation("PatuentTranslate");

  /* ── язык / локаль / направление текста ── */
  const currentLang = (i18n.language || "ru").split("-")[0];
  const locale = LANG_TO_LOCALE[currentLang] || LANG_TO_LOCALE.ru;
  const isRTL = currentLang === "ar";

  /* Локализованная дата (для статей) — старый dateRu НЕ трогаем */
  const dateLocalized = (iso) =>
    iso ? new Date(iso).toLocaleDateString(locale) : "—";

  const { id: profileId } = useParams(); // profileId из URL
  const [verificationStatus, setVerificationStatus] = useState("not_submitted");
  // данные
  const [doctorProfile, setDoctorProfile] = useSafeState(null);
  const [doctorUserId, setDoctorUserId] = useSafeState(null);
  const [articles, setArticles] = useSafeState([]);
  // Храним «сырое» значение специализации; перевод fallback делаем на слое отображения.
  const [speciality, setSpeciality] = useSafeState(null);
  const navigate = useNavigate();
  // состояния
  const [loading, setLoading] = useSafeState(true);
  // В error теперь храним i18n-ключ (или null), а текст берём через t() в рендере —
  // чтобы при смене языка сообщение автоматически перевелось.
  const [error, setError] = useSafeState(null);
  const [isAdded, setIsAdded] = useSafeState(false);
  const [pending, setPending] = useSafeState(false);

  // рекомендации
  const [recommendedByMe, setRecommendedByMe] = useSafeState(false);
  const [recommendCount, setRecommendCount] = useSafeState(0);
  const [recPending, setRecPending] = useSafeState(false);

  const fullName = useMemo(() => {
    const fn = doctorProfile?.user?.firstName || doctorProfile?.firstName || "";
    const ln = doctorProfile?.user?.lastName || doctorProfile?.lastName || "";
    return [fn, ln].filter(Boolean).join(" ").trim();
  }, [doctorProfile]);

  // Отображаемая специализация: raw → fallback через t()
  const specialityDisplay = speciality || t("doctorDetail.speciality.unknown");

  /* ---------- Проверка: есть ли доктор в «моих докторах» ---------- */
  const checkDoctorStatus = useCallback(
    async (userIdCandidate, profileIdCandidate) => {
      const main = userIdCandidate || profileIdCandidate || "";
      const alt =
        userIdCandidate && profileIdCandidate
          ? main === userIdCandidate
            ? profileIdCandidate
            : userIdCandidate
          : "";

      if (!main) {
        setIsAdded(false);
        return;
      }

      try {
        const { data } = await axios.get(
          `${API}/patient-profile/check-my-doctor/${main}${
            alt ? `?alt=${alt}` : ""
          }`,
          {
            withCredentials: true,
            params: { t: Date.now() },
          },
        );
        setIsAdded(Boolean(data?.isAdded));
      } catch (e) {
        console.error("Ошибка при проверке статуса доктора:", e);
        setIsAdded(false);
      }
    },
    [setIsAdded],
  );
  const getTargetUserId = (profile) => {
    if (!profile) return null;

    // вариант 1
    if (profile.userId) return profile.userId;

    // вариант 2
    if (typeof profile.user === "string") return profile.user;

    // вариант 3
    if (profile.user?._id) return profile.user._id;

    return null;
  };
  /* ---------- Загрузка профиля и статей ---------- */
  const fetchDoctorData = useCallback(async () => {
    if (!profileId) {
      setError("doctorDetail.errors.noProfileId");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1) Профиль
      const { data: doctorData } = await axios.get(
        `${API}/patient-profile/doctor-details-for-patient/${profileId}`,
        { withCredentials: true, params: { t: Date.now() } },
      );
      setDoctorProfile(doctorData);
      // статус верификации (если приходит с контроллера)
      setVerificationStatus(
        doctorData?.verification?.overallStatus ||
          doctorData?.verificationStatus ||
          "not_submitted",
      );
      // userId доктора (учитываем разные формы ответа)
      const uid =
        doctorData?.user?._id ||
        doctorData?.userId ||
        (typeof doctorData?.user === "string" ? doctorData.user : null);
      setDoctorUserId(uid);

      // специализация (сырое значение; если null — подставим fallback на рендере)
      const spec =
        doctorData?.user?.specialization?.name ??
        doctorData?.specialization?.name ??
        doctorData?.specialization ??
        null;
      setSpeciality(spec);

      // рекомендации (из контроллера)
      setRecommendedByMe(Boolean(doctorData?.recommendedByMe));
      setRecommendCount(Number(doctorData?.recommendCount || 0));

      // 2) Статьи
      const { data: articlesData } = await axios.get(
        `${API}/patient-profile/doctor-articles/${profileId}`,
        { withCredentials: true, params: { t: Date.now() } },
      );
      setArticles(articlesData?.success ? articlesData?.articles || [] : []);

      // 3) Статус «в моих докторах»
      await checkDoctorStatus(uid, profileId);
    } catch (e) {
      console.error("Ошибка при загрузке данных:", e);
      setError("doctorDetail.errors.loadFailed");
    } finally {
      setLoading(false);
    }
  }, [
    profileId,
    checkDoctorStatus,
    setDoctorProfile,
    setDoctorUserId,
    setSpeciality,
    setArticles,
    setError,
    setLoading,
    setRecommendedByMe,
    setRecommendCount,
  ]);

  useEffect(() => {
    fetchDoctorData();
  }, [fetchDoctorData]);

  /* ---------- Добавить/удалить в «Мои доктора» ---------- */
  const handleAddDoctor = async () => {
    try {
      setPending(true);
      await axios.post(
        `${API}/patient-profile/add-doctor/${profileId}`,
        {},
        { withCredentials: true },
      );
      alert(t("doctorDetail.alerts.added"));
      emitMyDoctorsChanged({
        action: "added",
        userId: doctorUserId || null,
        profileId: profileId || null,
      });
      await checkDoctorStatus(doctorUserId, profileId);
    } catch (error) {
      console.error("Ошибка при добавлении доктора:", error);
      alert(
        error?.response?.data?.message || t("doctorDetail.errors.addDoctor"),
      );
    } finally {
      setPending(false);
    }
  };

  const handleRemoveDoctor = async () => {
    try {
      if (!doctorUserId && !profileId) {
        alert(t("doctorDetail.errors.noDoctorId"));
        return;
      }
      setPending(true);

      const main = doctorUserId || profileId;
      const alt =
        doctorUserId && profileId
          ? main === doctorUserId
            ? profileId
            : doctorUserId
          : "";

      await axios.delete(
        `${API}/patient-profile/remove-doctor/${main}${
          alt ? `?alt=${alt}` : ""
        }`,
        { withCredentials: true },
      );

      alert(t("doctorDetail.alerts.removed"));
      emitMyDoctorsChanged({
        action: "removed",
        userId: doctorUserId || null,
        profileId: profileId || null,
      });
      setIsAdded(false);
    } catch (error) {
      console.error("Ошибка при удалении доктора:", error);
      alert(
        error?.response?.data?.message || t("doctorDetail.errors.removeDoctor"),
      );
    } finally {
      setPending(false);
    }
  };

  /* ---------- Тоггл «Рекомендую» ---------- */
  const handleToggleRecommend = async () => {
    try {
      setRecPending(true);
      const { data } = await axios.post(
        `${API}/patient-profile/doctor/${profileId}/recommend`,
        {},
        { withCredentials: true },
      );
      if (data?.ok) {
        setRecommendedByMe(Boolean(data.recommended));
        setRecommendCount(Number(data.recommendCount || 0));
      } else {
        alert(data?.message || t("doctorDetail.errors.recommendUpdate"));
      }
    } catch (e) {
      console.error("Ошибка recommend toggle:", e);
      alert(
        e?.response?.data?.message || t("doctorDetail.errors.recommendGeneric"),
      );
    } finally {
      setRecPending(false);
    }
  };

  /* ---------- Бейдж верификации ---------- */
  const verificationBadge = useMemo(() => {
    if (verificationStatus === "approved") {
      return (
        <span className="dd-verify-badge approved">
          <IconCheck /> {t("doctorDetail.verification.approved")}
        </span>
      );
    }
    if (verificationStatus === "pending") {
      return (
        <span className="dd-verify-badge pending">
          <IconClock /> {t("doctorDetail.verification.pending")}
        </span>
      );
    }
    if (verificationStatus === "rejected") {
      return (
        <span className="dd-verify-badge rejected">
          <IconX /> {t("doctorDetail.verification.rejected")}
        </span>
      );
    }
    return (
      <span className="dd-verify-badge notsubmitted">
        — {t("doctorDetail.verification.notSubmitted")}
      </span>
    );
  }, [verificationStatus, t]);

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <div className="dd-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <DDStyles />
        <div className="dd-loading">
          <span className="dd-spinner" />
          <span>{t("doctorDetail.loading")}</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="dd-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <DDStyles />
        <div className="dd-alert error" role="alert">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{t(error)}</span>
        </div>
      </div>
    );
  }
  if (!doctorProfile) {
    return (
      <div className="dd-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <DDStyles />
        <div className="dd-alert empty">
          <span>{t("doctorDetail.notFound")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dd-wrap" dir={isRTL ? "rtl" : "ltr"}>
      <DDStyles />

      <div className="dd-layout">
        {/* ───── Левая часть: профиль + комментарии ───── */}
        <div style={{ minWidth: 0, maxWidth: "100%" }}>
          <div className="dd-profile-card">
            {/* Hero */}
            <div className="dd-hero">
              <div className="dd-hero-inner">
                <div className="dd-photo-frame">
                  <img
                    className="dd-photo"
                    src={doctorProfile.profileImage || "/uploads/default.png"}
                    alt={t("doctorDetail.hero.photoAlt")}
                    onError={(e) => {
                      e.currentTarget.src = "/uploads/default.png";
                    }}
                  />
                </div>
                <div className="dd-hero-text">
                  <span className="dd-spec-badge">
                    <IconBriefcase />
                    <span className="dd-spec-badge-text">
                      {specialityDisplay}
                    </span>
                  </span>
                  <h1 className="dd-name">
                    {fullName || t("doctorDetail.hero.nameFallback")}
                    {verificationBadge}
                  </h1>
                  <div className="dd-hero-meta">
                    <span className="dd-hero-meta-item">
                      <IconClinic />
                      <span>
                        {doctorProfile.clinic ||
                          t("doctorDetail.hero.clinicFallback")}
                      </span>
                    </span>
                    <span className="dd-hero-meta-item">
                      <IconGlobe />
                      <span>
                        {doctorProfile.country ||
                          t("doctorDetail.hero.countryFallback")}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="dd-actions">
              {/* Primary CTA */}
              <Link
                to={`/patient/appointment?doctorId=${doctorUserId || profileId}`}
                className="dd-cta-primary"
              >
                <FaCalendarCheck />
                {t("doctorDetail.actions.appointment")}
              </Link>

              {/* Secondary actions */}
              <div className="dd-actions-row">
                <button
                  type="button"
                  className="dd-btn dd-btn-msg"
                  onClick={async () => {
                    try {
                      console.log("👆 КЛИК по 'Написать врачу'");

                      const targetUserId = doctorUserId;

                      if (!targetUserId) {
                        alert(t("doctorDetail.errors.noUserId"));
                        return;
                      }

                      const res = await getOrCreateDialogWithUser(targetUserId);

                      const dialogId = res.data?.dialog?._id || res.data?._id;

                      if (!dialogId) {
                        alert(t("doctorDetail.errors.noDialogId"));
                        return;
                      }

                      navigate(`/patient/communication/${dialogId}`);
                    } catch (err) {
                      console.error("Ошибка при создании диалога:", err);
                      alert(t("doctorDetail.errors.dialogCreate"));
                    }
                  }}
                >
                  <IconMessage />
                  {t("doctorDetail.actions.message")}
                </button>

                {isAdded ? (
                  <button
                    type="button"
                    className="dd-btn dd-btn-remove"
                    onClick={handleRemoveDoctor}
                    disabled={pending}
                  >
                    <IconTrash />
                    {pending
                      ? t("doctorDetail.actions.removing")
                      : t("doctorDetail.actions.remove")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="dd-btn dd-btn-add"
                    onClick={handleAddDoctor}
                    disabled={pending}
                  >
                    <IconPlus />
                    {pending
                      ? t("doctorDetail.actions.adding")
                      : t("doctorDetail.actions.add")}
                  </button>
                )}

                <button
                  type="button"
                  className={`dd-btn dd-btn-recommend ${recommendedByMe ? "active" : ""}`}
                  onClick={handleToggleRecommend}
                  disabled={recPending}
                  title={t("doctorDetail.actions.recommendTitle")}
                >
                  <IconHeart filled={recommendedByMe} />
                  {recPending
                    ? t("doctorDetail.actions.recommendPending")
                    : t("doctorDetail.actions.recommend")}
                  <span className="dd-rec-count">
                    <AiFillLike /> {recommendCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Info grid */}
            <div className="dd-info-grid">
              <div className="dd-info-item">
                <div className="dd-info-label">
                  <IconBriefcase /> {t("doctorDetail.info.specialty")}
                </div>
                <div className="dd-info-value">{specialityDisplay}</div>
              </div>
              <div className="dd-info-item">
                <div className="dd-info-label">
                  <IconClinic /> {t("doctorDetail.info.clinic")}
                </div>
                {doctorProfile.clinic ? (
                  <div className="dd-info-value">{doctorProfile.clinic}</div>
                ) : (
                  <div className="dd-info-value empty">
                    {t("doctorDetail.info.notSpecified")}
                  </div>
                )}
              </div>
              <div className="dd-info-item">
                <div className="dd-info-label">
                  <IconGlobe /> {t("doctorDetail.info.country")}
                </div>
                {doctorProfile.country ? (
                  <div className="dd-info-value">{doctorProfile.country}</div>
                ) : (
                  <div className="dd-info-value empty">
                    {t("doctorDetail.info.notSpecified")}
                  </div>
                )}
              </div>
            </div>

            {/* About */}
            <div className="dd-section">
              <h4 className="dd-section-title">
                <IconAbout />
                {t("doctorDetail.about.title")}
              </h4>
              <p
                className={`dd-about-text ${!doctorProfile?.about ? "empty" : ""}`}
              >
                {doctorProfile?.about || t("doctorDetail.about.empty")}
              </p>
            </div>
          </div>

          {/* Комментарии */}
          <div className="dd-comments-card">
            <h4 className="dd-section-title" style={{ marginBottom: 16 }}>
              <IconChat />
              {t("doctorDetail.comments.title")}
            </h4>
            <CommentSection refId={profileId} targetType="Doctor" />
          </div>
        </div>

        {/* ───── Правая часть: статьи ───── */}
        <aside className="dd-sidebar">
          <div className="dd-sidebar-header">
            <h4 className="dd-sidebar-title">
              <IconBookOpen />
              {t("doctorDetail.articles.title")}
            </h4>
            <span className="dd-sidebar-count">{articles.length}</span>
          </div>

          {articles.length === 0 ? (
            <div className="dd-empty-articles">
              {t("doctorDetail.articles.empty")}
            </div>
          ) : (
            articles.map((article) => {
              const preview = stripHtml(article.content).slice(0, 120);
              return (
                <div key={article._id} className="dd-article-card">
                  <Link
                    to={`/patient/article-detail/${article._id}`}
                    className="dd-article-link"
                  >
                    <h5 className="dd-article-title">{article.title}</h5>
                  </Link>
                  <p className="dd-article-preview">{preview}...</p>
                  <div className="dd-article-stats">
                    <span
                      className="dd-article-stat date"
                      title={t("doctorDetail.articles.tooltips.date")}
                    >
                      <BsCalendar2DateFill />
                      {dateLocalized(article.createdAt)}
                    </span>
                    <span
                      className="dd-article-stat comments"
                      title={t("doctorDetail.articles.tooltips.comments")}
                    >
                      <FaCommentDots />
                      {article.commentsCount || 0}
                    </span>
                    <span
                      className="dd-article-stat likes"
                      title={t("doctorDetail.articles.tooltips.likes")}
                    >
                      <AiFillLike />
                      {article.likesCount || 0}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </aside>
      </div>
    </div>
  );
}
