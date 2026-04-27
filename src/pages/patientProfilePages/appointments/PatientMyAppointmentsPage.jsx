import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaCalendarAlt,
  FaVideo,
  FaHospital,
  FaMapMarkerAlt,
  FaUserMd,
  FaTimesCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.REACT_APP_API_URL;

/* ====== Маппинг языков i18n → BCP-47 локали (для дат и Intl) ====== */
const LANG_TO_LOCALE = {
  ru: "ru-RU",
  en: "en-US",
  tr: "tr-TR",
  ar: "ar-SA",
  az: "az-AZ",
};

/* ====================== Иконки ====================== */
const IconClock = () => (
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
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconCalendar = () => (
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
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconUsers = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <polyline points="8 14 11 17 16 12" />
  </svg>
);
const IconX = () => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconVideoCall = () => (
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
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const IconAlert = () => (
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
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ====================== Стили ====================== */
const MAStyles = () => (
  <style>{`
    /* ===== Защитный reset ===== */
    .ma-wrap, .ma-wrap *, .ma-wrap *::before, .ma-wrap *::after {
      box-sizing: border-box;
    }

    /* ===== Base ===== */
    .ma-wrap {
      width: 100%;
      max-width: 1240px;
      min-width: 0;
      margin: 0 auto;
      padding: clamp(12px, 2vw, 32px) clamp(8px, 1.5vw, 20px) clamp(40px, 6vw, 80px);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      overflow-x: clip;
      overflow-x: hidden;
    }

    /* ===== Hero ===== */
    .ma-header {
      position: relative;
      width: 100%;
      max-width: 100%;
      padding: clamp(22px, 3.5vw, 34px) clamp(18px, 3vw, 36px);
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 55%, #0369a1 100%);
      border-radius: clamp(14px, 2vw, 20px);
      color: white;
      overflow: hidden;
      margin-bottom: clamp(14px, 2vw, 22px);
      box-shadow: 0 12px 32px -14px rgba(15, 118, 110, 0.4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .ma-header::before {
      content: "";
      position: absolute;
      top: -100px; right: -60px;
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%);
      pointer-events: none;
    }
    .ma-header-content { position: relative; z-index: 1; min-width: 0; }
    .ma-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.92);
      background: rgba(255,255,255,0.14);
      padding: 5px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
      border: 1px solid rgba(255,255,255,0.18);
    }
    .ma-eyebrow .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.35);
    }
    .ma-title {
      font-size: clamp(20px, 3vw, 30px);
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 6px;
      line-height: 1.2;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .ma-title svg { flex-shrink: 0; }
    .ma-subtitle {
      font-size: clamp(12px, 1.4vw, 14px);
      color: rgba(255,255,255,0.88);
      margin: 0;
    }
    .ma-count-pill {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      padding: 10px 16px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.22);
      flex-shrink: 0;
    }
    .ma-count-icon {
      width: 36px; height: 36px;
      border-radius: 9px;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .ma-count-num { font-size: 20px; font-weight: 700; line-height: 1; }
    .ma-count-label {
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.82);
      margin-top: 3px;
    }

    /* ===== Alerts ===== */
    .ma-alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 16px;
      max-width: 100%;
    }
    .ma-alert svg { flex-shrink: 0; margin-top: 1px; }
    .ma-alert.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }

    /* ===== Loading ===== */
    .ma-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: clamp(48px, 8vw, 80px) 20px;
      color: #64748b;
      font-size: 14px;
    }
    .ma-spinner {
      width: 24px; height: 24px;
      border: 3px solid #e2e8f0;
      border-top-color: #0891b2;
      border-radius: 50%;
      animation: ma-spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    @keyframes ma-spin { to { transform: rotate(360deg); } }

    /* ===== Empty ===== */
    .ma-empty {
      text-align: center;
      padding: clamp(40px, 6vw, 60px) 20px;
      background: white;
      border: 1px dashed #cbd5e1;
      border-radius: 16px;
      color: #64748b;
    }
    .ma-empty-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px; height: 64px;
      border-radius: 50%;
      background: #f0fdfa;
      color: #0891b2;
      margin-bottom: 12px;
    }
    .ma-empty-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .ma-empty-text { font-size: 14px; color: #64748b; }

    /* ===== Grid ===== */
    .ma-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: clamp(12px, 1.8vw, 18px);
      max-width: 100%;
    }

    /* ===== Card ===== */
    .ma-card {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: clamp(14px, 2vw, 18px);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.2s ease;
      overflow: hidden;
      position: relative;
    }
    .ma-card:hover {
      border-color: #a5f3fc;
      transform: translateY(-2px);
      box-shadow: 0 10px 24px -12px rgba(8, 145, 178, 0.2);
    }
    .ma-card.cancelled { opacity: 0.68; }
    .ma-card.cancelled:hover { transform: none; }
    .ma-card::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
    }
    .ma-card.confirmed::before { background: linear-gradient(90deg, #15803d, #22c55e); }
    .ma-card.pending::before   { background: linear-gradient(90deg, #b45309, #f59e0b); }
    .ma-card.cancelled::before { background: linear-gradient(90deg, #991b1b, #ef4444); }
    .ma-card.completed::before { background: linear-gradient(90deg, #0369a1, #0891b2); }

    /* Doctor row */
    .ma-doctor-row {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      max-width: 100%;
    }
    .ma-doctor-photo {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e2e8f0;
      flex-shrink: 0;
      background: #f8fafc;
    }
    .ma-doctor-info { flex: 1 1 0; min-width: 0; max-width: 100%; overflow: hidden; }
    .ma-doctor-name {
      font-size: clamp(14px, 1.6vw, 16px);
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
      margin: 0 0 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ma-doctor-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .ma-doctor-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #64748b;
      min-width: 0;
      overflow: hidden;
    }
    .ma-doctor-meta-item > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ma-icon-spec svg { color: #0891b2; flex-shrink: 0; }
    .ma-icon-place svg { color: #ef4444; flex-shrink: 0; }

    /* Divider */
    .ma-divider {
      border: 0;
      border-top: 1px dashed #e2e8f0;
      margin: 0;
    }

    /* Info rows */
    .ma-info-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ma-info-line {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: clamp(12px, 1.4vw, 13px);
      color: #475569;
      min-width: 0;
      flex-wrap: wrap;
    }
    .ma-info-line svg { color: #0891b2; flex-shrink: 0; }
    .ma-info-label {
      color: #64748b;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .ma-info-value { color: #0f172a; font-weight: 500; word-break: break-word; }

    /* Type pill */
    .ma-type-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .ma-type-pill.video {
      color: #15803d;
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .ma-type-pill.offline {
      color: #0369a1;
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    .ma-type-pill svg { flex-shrink: 0; }

    /* Footer */
    .ma-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: auto;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
      flex-wrap: wrap;
    }

    /* Status badge */
    .ma-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
      border: 1px solid transparent;
    }
    .ma-status-badge::before {
      content: "";
      width: 6px; height: 6px;
      border-radius: 50%;
    }
    .ma-status-badge.confirmed {
      color: #166534; background: #f0fdf4; border-color: #bbf7d0;
    }
    .ma-status-badge.confirmed::before { background: #22c55e; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25); }
    .ma-status-badge.pending {
      color: #854d0e; background: #fefce8; border-color: #fde68a;
    }
    .ma-status-badge.pending::before { background: #f59e0b; }
    .ma-status-badge.cancelled {
      color: #991b1b; background: #fef2f2; border-color: #fecaca;
    }
    .ma-status-badge.cancelled::before { background: #ef4444; }
    .ma-status-badge.completed {
      color: #075985; background: #f0f9ff; border-color: #bae6fd;
    }
    .ma-status-badge.completed::before { background: #0891b2; }
    .ma-status-badge.unknown {
      color: #475569; background: #f1f5f9; border-color: #cbd5e1;
    }
    .ma-status-badge.unknown::before { background: #64748b; }

    /* Action buttons */
    .ma-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .ma-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 7px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      text-decoration: none;
      border: 1px solid transparent;
      min-height: 34px;
      white-space: nowrap;
    }
    .ma-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .ma-btn svg { flex-shrink: 0; }
    .ma-btn-video {
      background: linear-gradient(135deg, #15803d 0%, #22c55e 100%);
      color: white;
      box-shadow: 0 4px 10px -3px rgba(34, 197, 94, 0.35);
    }
    .ma-btn-video:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 16px -3px rgba(34, 197, 94, 0.5);
    }
    .ma-btn-cancel {
      background: white;
      color: #be123c;
      border-color: #fecdd3;
    }
    .ma-btn-cancel:hover:not(:disabled) {
      background: #fff1f2;
      border-color: #f43f5e;
    }

    /* ===== Modal ===== */
    .ma-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: ma-fade 0.2s ease-out;
    }
    @keyframes ma-fade { from { opacity: 0; } to { opacity: 1; } }
    .ma-modal {
      width: 100%;
      max-width: 480px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      overflow: hidden;
      animation: ma-slide 0.25s cubic-bezier(.4,0,.2,1);
      max-height: calc(100vh - 32px);
      display: flex;
      flex-direction: column;
    }
    @keyframes ma-slide {
      from { opacity: 0; transform: translateY(20px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .ma-modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 18px 22px;
      border-bottom: 1px solid #f1f5f9;
      flex-shrink: 0;
    }
    .ma-modal-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .ma-modal-title svg { color: #ef4444; flex-shrink: 0; }
    .ma-modal-close {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: #f1f5f9;
      border-radius: 8px;
      cursor: pointer;
      color: #475569;
      transition: all 0.15s ease;
    }
    .ma-modal-close:hover { background: #e2e8f0; color: #0f172a; }
    .ma-modal-body {
      padding: 22px;
      overflow-y: auto;
      flex: 1;
    }
    .ma-modal-text {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      margin: 0 0 16px;
    }
    .ma-modal-text strong { color: #0f172a; font-weight: 700; }
    .ma-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 6px;
    }
    .ma-textarea {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      font-size: 14px;
      color: #0f172a;
      transition: all 0.15s ease;
      font-family: inherit;
      resize: vertical;
      min-height: 80px;
    }
    .ma-textarea:hover { border-color: #cbd5e1; }
    .ma-textarea:focus {
      outline: none;
      border-color: #0891b2;
      background: white;
      box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.15);
    }
    .ma-modal-footer {
      display: flex;
      gap: 10px;
      padding: 16px 22px;
      border-top: 1px solid #f1f5f9;
      justify-content: flex-end;
      flex-wrap: wrap;
      flex-shrink: 0;
    }
    .ma-btn-modal {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      border: 1px solid transparent;
      min-height: 40px;
    }
    .ma-btn-modal:disabled { opacity: 0.6; cursor: not-allowed; }
    .ma-btn-secondary {
      background: white;
      color: #475569;
      border-color: #e2e8f0;
    }
    .ma-btn-secondary:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .ma-btn-danger {
      background: linear-gradient(135deg, #991b1b 0%, #ef4444 100%);
      color: white;
      box-shadow: 0 4px 10px -3px rgba(239, 68, 68, 0.4);
    }
    .ma-btn-danger:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 16px -3px rgba(239, 68, 68, 0.55);
    }
    .ma-btn-spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: white;
      border-radius: 50%;
      animation: ma-spin 0.7s linear infinite;
    }

    /* ===== Breakpoints ===== */
    @media (max-width: 560px) {
      .ma-grid { grid-template-columns: 1fr; }
      .ma-card-footer { flex-direction: column; align-items: stretch; }
      .ma-actions { justify-content: center; }
      .ma-count-pill { width: 100%; justify-content: center; }
    }
    @media (max-width: 380px) {
      .ma-wrap { padding: 10px 6px 40px; }
      .ma-card { padding: 14px; }
      .ma-header { padding: 18px 14px; }
      .ma-modal-head, .ma-modal-footer { padding: 14px 16px; }
      .ma-modal-body { padding: 16px; }
      .ma-btn { padding: 6px 10px; font-size: 11px; }
    }
  `}</style>
);

export default function PatientMyAppointmentsPage() {
  const { t, i18n } = useTranslation("PatuentTranslate");

  /* ── язык / локаль / направление текста ── */
  const currentLang = (i18n.language || "ru").split("-")[0];
  const locale = LANG_TO_LOCALE[currentLang] || LANG_TO_LOCALE.ru;
  const isRTL = currentLang === "ar";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  // В error храним i18n-ключ (или пустую строку), текст берём через t() в рендере —
  // чтобы при смене языка сообщение автоматически перевелось.
  const [error, setError] = useState("");
  const [cancelModal, setCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const navigate = useNavigate();
  // 🔹 Загрузка всех приёмов пациента
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/appointment-for-patient/my`, {
          withCredentials: true,
        });
        setAppointments(res.data?.data || []);
        setError("");
      } catch (err) {
        console.error("❌ Ошибка загрузки приёмов:", err);
        setError("myAppointments.error");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // 🔹 Блокируем скролл body когда модалка открыта + Esc закрывает
  useEffect(() => {
    if (!cancelModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape" && !cancelLoading) setCancelModal(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [cancelModal, cancelLoading]);

  // 🔹 Отображение статуса приёма (ключ + лейбл).
  // Лейбл берём из переводов; key остаётся таким же, как раньше (используется для CSS-класса).
  const getStatusMeta = (status) => {
    switch (status) {
      case "confirmed":
        return {
          key: "confirmed",
          label: t("myAppointments.status.confirmed"),
        };
      case "pending":
        return { key: "pending", label: t("myAppointments.status.pending") };
      case "cancelled":
        return {
          key: "cancelled",
          label: t("myAppointments.status.cancelled"),
        };
      case "completed":
        return {
          key: "completed",
          label: t("myAppointments.status.completed"),
        };
      default:
        return { key: "unknown", label: t("myAppointments.status.unknown") };
    }
  };

  // 🔹 Открыть модалку отмены
  const handleOpenCancel = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason("");
    setCancelModal(true);
  };

  // 🔹 Отменить приём
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    setCancelLoading(true);
    try {
      await axios.put(
        `${API_BASE}/appointment-for-patient/cancel/${selectedAppointment._id}`,
        { reason: cancelReason },
        { withCredentials: true },
      );

      // 🔄 Обновляем состояние — меняем статус в списке
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === selectedAppointment._id ? { ...a, status: "cancelled" } : a,
        ),
      );

      setCancelModal(false);
    } catch (err) {
      console.error("Ошибка при отмене приёма:", err);
      alert(t("myAppointments.alerts.cancelError"));
    } finally {
      setCancelLoading(false);
    }
  };

  // Имя врача для подстановки в текст модалки (с fallback на перевод).
  const modalDoctorName =
    selectedAppointment?.doctorId?.userId?.firstName ||
    t("myAppointments.cancelModal.doctorFallback");

  return (
    <div className="ma-wrap" dir={isRTL ? "rtl" : "ltr"}>
      <MAStyles />

      {/* ===== Hero ===== */}
      <div className="ma-header">
        <div className="ma-header-content">
          <span className="ma-eyebrow">
            <span className="dot" />
            {t("myAppointments.header.eyebrow")}
          </span>
          <h1 className="ma-title">
            <FaCalendarAlt />
            {t("myAppointments.header.title")}
          </h1>
          <p className="ma-subtitle">{t("myAppointments.header.subtitle")}</p>
        </div>
        <div className="ma-count-pill">
          <div className="ma-count-icon">
            <IconUsers />
          </div>
          <div>
            <div className="ma-count-num">{appointments.length}</div>
            <div className="ma-count-label">
              {t("myAppointments.header.countLabel")}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Error ===== */}
      {error && (
        <div className="ma-alert error" role="alert">
          <IconAlert />
          <span>{t(error)}</span>
        </div>
      )}

      {/* ===== Loading ===== */}
      {loading && (
        <div className="ma-loading">
          <span className="ma-spinner" />
          <span>{t("myAppointments.loading")}</span>
        </div>
      )}

      {/* ===== Empty ===== */}
      {!loading && !error && appointments.length === 0 && (
        <div className="ma-empty">
          <div className="ma-empty-icon">
            <FaCalendarAlt size={24} />
          </div>
          <div className="ma-empty-title">
            {t("myAppointments.empty.title")}
          </div>
          <div className="ma-empty-text">{t("myAppointments.empty.text")}</div>
        </div>
      )}

      {/* ===== Grid ===== */}
      {!loading && appointments.length > 0 && (
        <div className="ma-grid">
          {appointments.map((a, i) => {
            const doctor = a.doctorId || {};
            const user = doctor.userId || {};
            const specializationName =
              user?.specialization?.name ||
              t("myAppointments.card.specialtyFallback");
            const country =
              user?.country ||
              doctor?.country ||
              t("myAppointments.card.countryFallback");
            const statusMeta = getStatusMeta(a.status);

            return (
              <article key={i} className={`ma-card ${statusMeta.key}`}>
                {/* 👨‍⚕️ Информация о враче */}
                <div className="ma-doctor-row">
                  <img
                    src={doctor.profileImage || "/default-doctor.png"}
                    alt={t("myAppointments.card.doctorAlt")}
                    className="ma-doctor-photo"
                    onError={(e) => {
                      e.currentTarget.src = "/default-doctor.png";
                    }}
                  />
                  <div className="ma-doctor-info">
                    <h6 className="ma-doctor-name">
                      {user.firstName ||
                        t("myAppointments.card.doctorFallback")}{" "}
                      {user.lastName || ""}
                    </h6>
                    <div className="ma-doctor-meta">
                      <span className="ma-doctor-meta-item ma-icon-spec">
                        <FaUserMd />
                        <span>{specializationName}</span>
                      </span>
                      <span className="ma-doctor-meta-item ma-icon-place">
                        <FaMapMarkerAlt />
                        <span>{country}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <hr className="ma-divider" />

                {/* 📅 Дата и время */}
                <div className="ma-info-group">
                  <div className="ma-info-line">
                    <IconCalendar />
                    <span className="ma-info-label">
                      {t("myAppointments.card.dateLabel")}
                    </span>
                    <span className="ma-info-value">
                      {new Date(a.startsAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                  <div className="ma-info-line">
                    <IconClock />
                    <span className="ma-info-label">
                      {t("myAppointments.card.timeLabel")}
                    </span>
                    <span className="ma-info-value">
                      {new Date(a.startsAt).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {new Date(a.endsAt).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="ma-info-line">
                    <span className="ma-info-label">
                      {t("myAppointments.card.typeLabel")}
                    </span>
                    {a.type === "video" ? (
                      <span className="ma-type-pill video">
                        <FaVideo />
                        {t("myAppointments.card.typeOnline")}
                      </span>
                    ) : (
                      <span className="ma-type-pill offline">
                        <FaHospital />
                        {t("myAppointments.card.typeOffline")}
                      </span>
                    )}
                  </div>
                </div>

                {/* ⚙️ Footer: статус и кнопки */}
                <div className="ma-card-footer">
                  <span className={`ma-status-badge ${statusMeta.key}`}>
                    {statusMeta.label}
                  </span>
                  <div className="ma-actions">
                    {a.type === "video" && a.status === "confirmed" && (
                      <Link
                        to={`/chat/videocall/${a._id}`}
                        className="ma-btn ma-btn-video"
                      >
                        <IconVideoCall />
                        {t("myAppointments.card.videoCall")}
                      </Link>
                    )}

                    {["confirmed", "pending"].includes(a.status) && (
                      <button
                        type="button"
                        className="ma-btn ma-btn-cancel"
                        onClick={() => handleOpenCancel(a)}
                      >
                        <FaTimesCircle />
                        {t("myAppointments.card.cancel")}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ===== Модалка подтверждения отмены ===== */}
      {cancelModal && (
        <div
          className="ma-modal-overlay"
          // backdrop="static" в оригинале → клик вне не закрывает
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ma-cancel-title"
        >
          <div className="ma-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ma-modal-head">
              <h3 className="ma-modal-title" id="ma-cancel-title">
                <FaTimesCircle />
                {t("myAppointments.cancelModal.title")}
              </h3>
              <button
                type="button"
                className="ma-modal-close"
                onClick={() => !cancelLoading && setCancelModal(false)}
                disabled={cancelLoading}
                aria-label={t("myAppointments.cancelModal.closeLabel")}
              >
                <IconX />
              </button>
            </div>

            <div className="ma-modal-body">
              <p className="ma-modal-text">
                {t("myAppointments.cancelModal.confirmText", {
                  doctor: modalDoctorName,
                })}
              </p>
              <label className="ma-label" htmlFor="ma-cancel-reason">
                {t("myAppointments.cancelModal.reasonLabel")}
              </label>
              <textarea
                id="ma-cancel-reason"
                className="ma-textarea"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t("myAppointments.cancelModal.reasonPlaceholder")}
              />
            </div>

            <div className="ma-modal-footer">
              <button
                type="button"
                className="ma-btn-modal ma-btn-secondary"
                onClick={() => setCancelModal(false)}
                disabled={cancelLoading}
              >
                {t("myAppointments.cancelModal.cancelBtn")}
              </button>
              <button
                type="button"
                className="ma-btn-modal ma-btn-danger"
                onClick={handleCancelAppointment}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <span className="ma-btn-spinner" />
                ) : (
                  t("myAppointments.cancelModal.confirmBtn")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
