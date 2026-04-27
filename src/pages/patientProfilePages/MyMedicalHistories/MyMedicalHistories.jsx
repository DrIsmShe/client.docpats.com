import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/** ───────────── Helpers ───────────── */
const formatDate = (iso, locale = "ru-RU") => {
  try {
    return new Date(iso).toLocaleDateString(locale);
  } catch {
    return "-";
  }
};
const normalize = (s) => (s || "").toString().trim().toLowerCase();
const doctorFullName = (h) => {
  const first = h?.doctorId?.firstName || "";
  const last = h?.doctorId?.lastName || "";
  return [first, last].filter(Boolean).join(" ").trim();
};

/** ───────────── Иконки (inline SVG) ───────────── */
const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const IconDoctor = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mmh-doctor-icon">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconReset = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconFolder = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

/** ───────────── Styles ───────────── */
const MMHStyles = () => (
  <style>{`
    .mmh-wrap, .mmh-wrap *, .mmh-wrap *::before, .mmh-wrap *::after {
      box-sizing: border-box;
    }

    .mmh-wrap {
      width: 100%;
      max-width: 1040px;
      min-width: 0;
      margin: 0 auto;
      padding: clamp(12px, 2vw, 32px) clamp(8px, 1.5vw, 20px) clamp(40px, 6vw, 80px);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      overflow-x: clip;
      overflow-x: hidden;
    }

    .mmh-header {
      position: relative;
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
    .mmh-header::before {
      content: "";
      position: absolute;
      top: -100px; right: -60px;
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%);
      pointer-events: none;
    }
    .mmh-header::after {
      content: "";
      position: absolute;
      bottom: -80px; left: 20%;
      width: 260px; height: 260px;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      pointer-events: none;
    }
    .mmh-header-content { position: relative; z-index: 1; min-width: 0; }
    .mmh-eyebrow {
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
      margin-bottom: 14px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.15);
    }
    .mmh-eyebrow .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.35);
    }
    .mmh-title {
      font-size: clamp(20px, 3vw, 32px);
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 6px;
      line-height: 1.15;
    }
    .mmh-subtitle {
      font-size: clamp(12px, 1.4vw, 14px);
      color: rgba(255,255,255,0.88);
      margin: 0;
    }
    .mmh-count-pill {
      position: relative;
      z-index: 1;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      padding: 14px 22px;
      border-radius: 14px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.22);
      min-width: 110px;
      flex-shrink: 0;
    }
    .mmh-count-num {
      font-size: clamp(22px, 2.4vw, 26px);
      font-weight: 700;
      line-height: 1;
    }
    .mmh-count-label {
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.82);
      margin-top: 6px;
    }

    .mmh-filters {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: clamp(12px, 2vw, 16px);
      padding: clamp(16px, 2.4vw, 22px);
      margin-bottom: clamp(14px, 2vw, 22px);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .mmh-filters-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
    }
    .mmh-filters-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #0f172a;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .mmh-filters-title svg { color: #0891b2; flex-shrink: 0; }
    .mmh-found {
      font-size: 13px;
      color: #64748b;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .mmh-found-badge {
      background: #ecfeff;
      color: #0e7490;
      border: 1px solid #a5f3fc;
      padding: 2px 10px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 12px;
    }
    .mmh-filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
    }
    .mmh-field { display: flex; flex-direction: column; min-width: 0; }
    .mmh-label {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 6px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .mmh-label svg { color: #94a3b8; flex-shrink: 0; }
    .mmh-input, .mmh-select {
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
    }
    .mmh-input::placeholder { color: #94a3b8; }
    .mmh-input:hover, .mmh-select:hover { border-color: #cbd5e1; }
    .mmh-input:focus, .mmh-select:focus {
      outline: none;
      border-color: #0891b2;
      background: white;
      box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.15);
    }
    .mmh-select {
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 10px center;
      padding-right: 32px;
    }
    .mmh-field-actions { display: flex; align-items: flex-end; }
    .mmh-reset-btn {
      width: 100%;
      padding: 10px 14px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      color: #475569;
      font-weight: 500;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.15s ease;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 42px;
    }
    .mmh-reset-btn:hover {
      border-color: #fda4af;
      background: #fff1f2;
      color: #be123c;
    }

    .mmh-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .mmh-card {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    .mmh-card::before {
      content: "";
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #0f766e 0%, #0891b2 100%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .mmh-card:hover {
      border-color: #a5f3fc;
      box-shadow: 0 8px 24px -12px rgba(8, 145, 178, 0.2);
      transform: translateY(-1px);
    }
    .mmh-card:hover::before { opacity: 1; }
    .mmh-card-link {
      display: block;
      padding: clamp(14px, 2vw, 18px) clamp(16px, 2.4vw, 22px);
      color: inherit;
      text-decoration: none;
    }
    .mmh-card-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      min-width: 0;
    }
    .mmh-card-content { flex: 1 1 0; min-width: 0; max-width: 100%; }
    .mmh-card-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .mmh-index {
      width: 32px; height: 32px;
      border-radius: 9px;
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(8, 145, 178, 0.3);
    }
    .mmh-date-chip {
      font-size: 12px;
      color: #475569;
      padding: 4px 10px;
      background: #f1f5f9;
      border-radius: 6px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .mmh-date-chip svg { color: #64748b; flex-shrink: 0; }
    .mmh-diagnosis {
      font-size: clamp(14px, 1.6vw, 16px);
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 8px;
      line-height: 1.4;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .mmh-diagnosis-empty { color: #94a3b8; font-weight: 500; font-style: italic; font-size: 15px; }
    .mmh-doctor-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: clamp(12px, 1.4vw, 13px);
      color: #475569;
      flex-wrap: wrap;
      min-width: 0;
    }
    .mmh-doctor-icon { width: 15px; height: 15px; color: #0891b2; flex-shrink: 0; }
    .mmh-doctor-name { color: #0f172a; font-weight: 600; word-break: break-word; }
    .mmh-doctor-meta { color: #64748b; font-style: italic; font-size: 12.5px; word-break: break-word; }
    .mmh-doctor-empty { color: #94a3b8; font-style: italic; }
    .mmh-more {
      flex-shrink: 0;
      color: #0891b2;
      font-size: 20px;
      transition: transform 0.2s ease;
      font-weight: 600;
      padding: 8px;
      border-radius: 8px;
      background: #ecfeff;
    }
    .mmh-card:hover .mmh-more { transform: translateX(4px); background: #cffafe; }

    .mmh-state {
      text-align: center;
      padding: clamp(40px, 6vw, 60px) 20px;
      background: white;
      border: 1px dashed #cbd5e1;
      border-radius: 16px;
      color: #64748b;
    }
    .mmh-state-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px; height: 72px;
      border-radius: 50%;
      background: #f0fdfa;
      color: #0891b2;
      margin-bottom: 14px;
    }
    .mmh-state-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .mmh-state-text { font-size: 14px; color: #64748b; }

    .mmh-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: clamp(48px, 8vw, 80px) 20px;
      color: #64748b;
      font-size: 14px;
    }
    .mmh-spinner {
      width: 20px; height: 20px;
      border: 2.5px solid #e2e8f0;
      border-top-color: #0891b2;
      border-radius: 50%;
      animation: mmh-spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    @keyframes mmh-spin { to { transform: rotate(360deg); } }

    .mmh-error {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 18px 20px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      border-radius: 12px;
      color: #991b1b;
      font-size: 14px;
      font-weight: 500;
    }
    .mmh-error-icon { flex-shrink: 0; color: #ef4444; }

    @media (max-width: 560px) {
      .mmh-count-pill { width: 100%; min-width: 0; padding: 10px 16px; }
    }
    @media (max-width: 380px) {
      .mmh-wrap { padding: 10px 6px 40px; }
      .mmh-card-link { padding: 14px 16px; }
      .mmh-more { font-size: 16px; padding: 6px; }
      .mmh-filters { padding: 14px; }
    }
  `}</style>
);

/** ───────────── Компонент ───────────── */
export default function MyMedicalHistories() {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, i18n } = useTranslation("PatuentTranslate");
  const API_BASE = process.env.REACT_APP_API_URL;

  // Фильтры
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    doctorQuery: "",
    diagnosisQuery: "",
    sort: "createdAt_desc",
  });

  // Локальное состояние для дебаунса
  const [typedDoctor, setTypedDoctor] = useState("");
  const [typedDiagnosis, setTypedDiagnosis] = useState("");

  useEffect(() => {
    const fetchMedicalHistories = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/patient-profile/get-my-medical-history`,
          { withCredentials: true },
        );
        setHistories(response.data?.data || []);
      } catch (err) {
        console.error("Ошибка при получении историй болезни:", err);
        setError(t("myMedicalHistories.states.error"));
      } finally {
        setLoading(false);
      }
    };
    fetchMedicalHistories();
  }, [API_BASE, t]);

  // Дебаунс ввода (300 мс)
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, doctorQuery: typedDoctor }));
    }, 300);
    return () => clearTimeout(t);
  }, [typedDoctor]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, diagnosisQuery: typedDiagnosis }));
    }, 300);
    return () => clearTimeout(t);
  }, [typedDiagnosis]);

  const resetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      doctorQuery: "",
      diagnosisQuery: "",
      sort: "createdAt_desc",
    });
    setTypedDoctor("");
    setTypedDiagnosis("");
  };

  // Применение фильтров и сортировки
  const filtered = useMemo(() => {
    let list = [...histories];

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom + "T00:00:00");
      list = list.filter((h) => {
        const d = new Date(h?.createdAt);
        return !isNaN(d) && d >= from;
      });
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo + "T23:59:59.999");
      list = list.filter((h) => {
        const d = new Date(h?.createdAt);
        return !isNaN(d) && d <= to;
      });
    }

    if (filters.doctorQuery.trim()) {
      const q = normalize(filters.doctorQuery);
      list = list.filter((h) => normalize(doctorFullName(h)).includes(q));
    }

    if (filters.diagnosisQuery.trim()) {
      const q = normalize(filters.diagnosisQuery);
      list = list.filter((h) => normalize(h?.diagnosis).includes(q));
    }

    list.sort((a, b) => {
      switch (filters.sort) {
        case "createdAt_asc":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "createdAt_desc":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "doctor_asc":
          return normalize(doctorFullName(a)).localeCompare(
            normalize(doctorFullName(b)),
            i18n.language || "ru",
          );
        case "doctor_desc":
          return normalize(doctorFullName(b)).localeCompare(
            normalize(doctorFullName(a)),
            i18n.language || "ru",
          );
        default:
          return 0;
      }
    });

    return list;
  }, [histories, filters, i18n.language]);

  /** ───────── Loading ───────── */
  if (loading) {
    return (
      <div className="mmh-wrap">
        <MMHStyles />
        <div className="mmh-loading">
          <span className="mmh-spinner" />
          <span>{t("myMedicalHistories.states.loading")}</span>
        </div>
      </div>
    );
  }

  /** ───────── Error ───────── */
  if (error) {
    return (
      <div className="mmh-wrap">
        <MMHStyles />
        <div className="mmh-error" role="alert">
          <svg className="mmh-error-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  /** ───────── Main render ───────── */
  return (
    <div className="mmh-wrap">
      <MMHStyles />

      {/* Header */}
      <div className="mmh-header">
        <div className="mmh-header-content">
          <div className="mmh-eyebrow">
            <span className="dot" />
            {t("myMedicalHistories.header.eyebrow")}
          </div>
          <h2 className="mmh-title">{t("myMedicalHistories.header.title")}</h2>
          <p className="mmh-subtitle">
            {t("myMedicalHistories.header.subtitle")}
          </p>
        </div>
        <div className="mmh-count-pill">
          <div className="mmh-count-num">{histories.length}</div>
          <div className="mmh-count-label">
            {t("myMedicalHistories.header.totalLabel")}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mmh-filters">
        <div className="mmh-filters-head">
          <span className="mmh-filters-title">
            <IconFilter />
            {t("myMedicalHistories.filters.sectionTitle")}
          </span>
          <span className="mmh-found">
            {t("myMedicalHistories.filters.foundLabel")}
            <span className="mmh-found-badge">{filtered.length}</span>
          </span>
        </div>

        <div className="mmh-filters-grid">
          <div className="mmh-field">
            <label className="mmh-label">
              <IconCalendar />
              {t("myMedicalHistories.filters.dateFrom")}
            </label>
            <input
              type="date"
              className="mmh-input"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateFrom: e.target.value }))
              }
            />
          </div>

          <div className="mmh-field">
            <label className="mmh-label">
              <IconCalendar />
              {t("myMedicalHistories.filters.dateTo")}
            </label>
            <input
              type="date"
              className="mmh-input"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateTo: e.target.value }))
              }
            />
          </div>

          <div className="mmh-field">
            <label className="mmh-label">
              <IconSearch />
              {t("myMedicalHistories.filters.doctor")}
            </label>
            <input
              type="text"
              className="mmh-input"
              placeholder={t("myMedicalHistories.filters.doctorPlaceholder")}
              value={typedDoctor}
              onChange={(e) => setTypedDoctor(e.target.value)}
            />
          </div>

          <div className="mmh-field">
            <label className="mmh-label">
              <IconSearch />
              {t("myMedicalHistories.filters.diagnosis")}
            </label>
            <input
              type="text"
              className="mmh-input"
              placeholder={t("myMedicalHistories.filters.diagnosisPlaceholder")}
              value={typedDiagnosis}
              onChange={(e) => setTypedDiagnosis(e.target.value)}
            />
          </div>

          <div className="mmh-field">
            <label className="mmh-label">
              {t("myMedicalHistories.filters.sort")}
            </label>
            <select
              className="mmh-select"
              value={filters.sort}
              onChange={(e) =>
                setFilters((f) => ({ ...f, sort: e.target.value }))
              }
            >
              <option value="createdAt_desc">
                {t("myMedicalHistories.filters.sortOptions.newest")}
              </option>
              <option value="createdAt_asc">
                {t("myMedicalHistories.filters.sortOptions.oldest")}
              </option>
              <option value="doctor_asc">
                {t("myMedicalHistories.filters.sortOptions.doctorAsc")}
              </option>
              <option value="doctor_desc">
                {t("myMedicalHistories.filters.sortOptions.doctorDesc")}
              </option>
            </select>
          </div>

          <div className="mmh-field mmh-field-actions">
            <button
              type="button"
              className="mmh-reset-btn"
              onClick={resetFilters}
            >
              <IconReset />
              {t("myMedicalHistories.filters.reset")}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="mmh-state">
          <div className="mmh-state-icon">
            <IconFolder />
          </div>
          <div className="mmh-state-title">
            {t("myMedicalHistories.empty.title")}
          </div>
          <div className="mmh-state-text">
            {t("myMedicalHistories.empty.description")}
          </div>
        </div>
      ) : (
        <ul className="mmh-list">
          {filtered.map((history, index) => {
            const doctorName = doctorFullName(history);
            const doctorPosition = history?.doctorProfileId?.position || "";
            const doctorSpecialization =
              history?.doctorId?.specialization?.name || "";

            return (
              <li key={history._id} className="mmh-card">
                <Link
                  to={`/patient/my-medical-history-details/${history._id}`}
                  className="mmh-card-link"
                >
                  <div className="mmh-card-inner">
                    <div className="mmh-card-content">
                      <div className="mmh-card-top">
                        <div className="mmh-index">#{index + 1}</div>
                        <span className="mmh-date-chip">
                          <IconCalendar />
                          {formatDate(history.createdAt, i18n.language)}
                        </span>
                      </div>

                      <div className="mmh-diagnosis">
                        {history.diagnosis || (
                          <span className="mmh-diagnosis-empty">
                            {t("myMedicalHistories.card.diagnosisEmpty")}
                          </span>
                        )}
                      </div>

                      <div className="mmh-doctor-row">
                        <IconDoctor />
                        {doctorName ? (
                          <>
                            <span className="mmh-doctor-name">{doctorName}</span>
                            {(doctorPosition || doctorSpecialization) && (
                              <span className="mmh-doctor-meta">
                                — {doctorSpecialization}
                                {doctorPosition && `, ${doctorPosition}`}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="mmh-doctor-empty">
                            {t("myMedicalHistories.card.doctorEmpty")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mmh-more" aria-hidden="true">→</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
