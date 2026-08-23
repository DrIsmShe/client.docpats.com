// ✅ src/pages/patient/PatientAppointmentsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaCalendarAlt,
  FaClock,
  FaVideo,
  FaHospital,
  FaFilter,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.REACT_APP_API_URL;

/* ====================== Иконки ====================== */
const IconCheck = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
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
const IconSearch = () => (
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
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconReset = () => (
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
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);
const IconUser = () => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/* ====================== Стили ====================== */
const PAStyles = () => (
  <style>{`
    /* ===== Глобальный reset для защиты от overflow ===== */
    .pa-wrap, .pa-wrap *, .pa-wrap *::before, .pa-wrap *::after {
      box-sizing: border-box;
    }

    /* ===== Base ===== */
    .pa-wrap {
      width: 100%;
      max-width: 1100px;
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
    .pa-header {
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
    }
    .pa-header::before {
      content: "";
      position: absolute;
      top: -100px; right: -60px;
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%);
      pointer-events: none;
    }
    .pa-header-content { position: relative; z-index: 1; min-width: 0; }
    .pa-eyebrow {
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
    .pa-eyebrow .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.35);
    }
    .pa-title {
      font-size: clamp(20px, 3vw, 30px);
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 6px;
      line-height: 1.2;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .pa-title svg { flex-shrink: 0; }
    .pa-subtitle {
      font-size: clamp(12px, 1.4vw, 14px);
      color: rgba(255,255,255,0.88);
      margin: 0;
    }

    /* ===== Alerts ===== */
    .pa-alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 12px;
      font-size: clamp(13px, 1.5vw, 14px);
      font-weight: 500;
      margin-bottom: clamp(12px, 2vw, 16px);
      max-width: 100%;
      word-break: break-word;
    }
    .pa-alert svg { flex-shrink: 0; margin-top: 1px; }
    .pa-alert.success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #22c55e;
      color: #166534;
    }
    .pa-alert.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }

    /* ===== Card ===== */
    .pa-card {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: clamp(12px, 2vw, 18px);
      padding: clamp(14px, 2.4vw, 24px);
      margin-bottom: clamp(12px, 2vw, 18px);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }

    .pa-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
    }
    .pa-card-title {
      font-size: clamp(13px, 1.6vw, 14px);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #0f172a;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    .pa-card-title svg { color: #0891b2; flex-shrink: 0; }

    /* ===== Filters grid ===== */
    .pa-filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 10px;
      max-width: 100%;
    }

    /* ===== Form controls ===== */
    .pa-field { display: flex; flex-direction: column; min-width: 0; max-width: 100%; }
    .pa-label {
      font-size: clamp(12px, 1.4vw, 13px);
      font-weight: 600;
      color: #475569;
      margin-bottom: 6px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .pa-label svg { color: #94a3b8; flex-shrink: 0; }
    .pa-input, .pa-select {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      font-size: clamp(13px, 1.5vw, 14px);
      color: #0f172a;
      transition: all 0.15s ease;
      font-family: inherit;
      min-height: 42px;
    }
    .pa-input::placeholder { color: #94a3b8; }
    .pa-input:hover, .pa-select:hover { border-color: #cbd5e1; }
    .pa-input:focus, .pa-select:focus {
      outline: none;
      border-color: #0891b2;
      background: white;
      box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.15);
    }
    .pa-select {
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 10px center;
      padding-right: 32px;
    }

    /* ===== Buttons ===== */
    .pa-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: clamp(12px, 1.4vw, 13px);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      text-decoration: none;
      border: 1px solid transparent;
      min-height: 42px;
      max-width: 100%;
    }
    .pa-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .pa-btn svg { flex-shrink: 0; }

    .pa-btn-primary {
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
      color: white;
      box-shadow: 0 4px 12px -4px rgba(8, 145, 178, 0.4);
    }
    .pa-btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px -4px rgba(8, 145, 178, 0.55);
    }

    .pa-btn-outline {
      background: white;
      color: #475569;
      border-color: #e2e8f0;
    }
    .pa-btn-outline:hover:not(:disabled) {
      border-color: #fda4af;
      background: #fff1f2;
      color: #be123c;
    }

    .pa-btn-book {
      width: 100%;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      box-shadow: 0 4px 10px -3px rgba(0, 150, 255, 0.4);
      font-weight: 700;
    }
    .pa-btn-book:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 18px -4px rgba(0, 150, 255, 0.55);
    }

    /* ===== Type radio (pill style) ===== */
    .pa-radios {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .pa-radio {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      background: white;
      cursor: pointer;
      font-size: clamp(12px, 1.4vw, 13px);
      font-weight: 600;
      color: #475569;
      transition: all 0.15s ease;
      min-height: 42px;
    }
    .pa-radio:hover:not(.disabled) { border-color: #cbd5e1; background: #f8fafc; }
    .pa-radio input { display: none; }
    .pa-radio-dot {
      width: 16px; height: 16px;
      border: 2px solid #cbd5e1;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    .pa-radio input:checked + .pa-radio-dot {
      border-color: #0891b2;
    }
    .pa-radio input:checked + .pa-radio-dot::after {
      content: "";
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #0891b2;
    }
    .pa-radio:has(input:checked) {
      border-color: #0891b2;
      background: #ecfeff;
      color: #0e7490;
    }
    .pa-radio.disabled { opacity: 0.5; cursor: not-allowed; }

    .pa-radio-hint {
      margin-top: 8px;
      font-size: 12px;
      color: #64748b;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    /* ===== Date row ===== */
    .pa-date-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: flex-end;
    }
    .pa-date-row .pa-field { flex: 1 1 180px; min-width: 0; }

    .pa-small-note {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: #64748b;
    }

    /* ===== Slots ===== */
    .pa-slots-title {
      font-size: clamp(14px, 1.7vw, 16px);
      font-weight: 700;
      margin: clamp(18px, 2.5vw, 24px) 0 12px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .pa-slots-title svg { color: #0891b2; flex-shrink: 0; }

    .pa-slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: clamp(10px, 1.5vw, 14px);
      max-width: 100%;
    }

    .pa-slot-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: clamp(12px, 1.8vw, 16px);
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }
    .pa-slot-card:hover {
      border-color: #a5f3fc;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px -8px rgba(8, 145, 178, 0.25);
    }
    .pa-slot-time {
      font-size: clamp(14px, 1.6vw, 16px);
      font-weight: 700;
      color: #0f172a;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .pa-slot-time-dash { color: #94a3b8; font-weight: 400; }
    .pa-slot-date {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }

    .pa-no-slots {
      padding: clamp(24px, 4vw, 40px) 20px;
      text-align: center;
      background: white;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      color: #64748b;
      font-size: 14px;
      margin-top: 16px;
    }

    /* ===== Loading ===== */
    .pa-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: clamp(24px, 4vw, 48px) 20px;
      color: #64748b;
      font-size: 14px;
    }
    .pa-spinner {
      width: 22px; height: 22px;
      border: 2.5px solid #e2e8f0;
      border-top-color: #0891b2;
      border-radius: 50%;
      animation: pa-spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    @keyframes pa-spin { to { transform: rotate(360deg); } }

    /* ===== Mobile (≤560) ===== */
    @media (max-width: 560px) {
      .pa-filters-grid { grid-template-columns: 1fr; }
      .pa-slots-grid { grid-template-columns: 1fr; }
      .pa-date-row .pa-field { flex: 1 1 100%; }
    }

    /* ===== XS (≤380) ===== */
    @media (max-width: 380px) {
      .pa-wrap { padding: 10px 6px 40px; }
      .pa-card { padding: 12px; }
      .pa-header { padding: 18px 14px; }
      .pa-radio { padding: 9px 12px; gap: 6px; font-size: 12px; }
      .pa-btn { padding: 10px 12px; font-size: 12px; }
    }
  `}</style>
);

export default function PatientAppointmentsPage() {
  const { t, i18n } = useTranslation("patient_appointments_page");

  /* ── язык / направление текста ── */
  const currentLang = (i18n.language || "ru").split("-")[0];
  const isRTL = currentLang === "ar";

  // Сегодня в формате поля <input type="date"> — "YYYY-MM-DD".
  //
  // Локаль "sv-SE" выбрана не ради шведского: она единственная из ходовых
  // даёт ровно ISO-формат и делает это в МЕСТНОЙ зоне. toISOString() здесь
  // не годится — он переводит в UTC, и для пациента восточнее Гринвича
  // вечером «сегодня» превращается во вчера.
  const todayStr = new Date().toLocaleDateString("sv-SE");

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [type, setType] = useState("offline");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    country: "",
    specialty: "",
    minRating: "",
    minReviews: "",
    sort: "",
  });

  const [specialties, setSpecialties] = useState([]);
  const [countries, setCountries] = useState([]);

  /* ============================================================
     🔹 Загрузка врачей
  ============================================================ */
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        const res = await axios.get(
          `${API_BASE}/patient-profile/doctors-for-patient?${params.toString()}`,
          { withCredentials: true },
        );

        const list = Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];

        setDoctors(list);
        setError("");

        if (res.data.filters) {
          setSpecialties(res.data.filters.specialties || []);
          setCountries(res.data.filters.countries || []);
        }
      } catch (err) {
        setError(t("error_load_doctors"));
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [filters, t]);

  /* ============================================================
     🔹 Загрузка слотов
  ============================================================ */
  const loadSlots = async (doctorUserId, date, type) => {
    if (!doctorUserId || !date) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/schedule/doctor-schedule/public-slots/${date}/${type}?doctorId=${doctorUserId}`,
        { withCredentials: true },
      );

      setSlots(res.data.slots || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || t("error_load_slots"));
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     🔹 Запись
  ============================================================ */
  const handleBook = async (slot) => {
    // Требование номера WhatsApp для онлайн-приёма убрано вместе с самим
    // каналом: приём идёт в видеокомнате платформы, номер для него не нужен
    // и был обязательным барьером на пути к записи.
    if (!selectedDoctor) {
      setError(t("error_select_doctor"));
      return;
    }

    const doctorId =
      selectedDoctor.userId ||
      selectedDoctor.profileId ||
      selectedDoctor._id ||
      selectedDoctor.doctorId;

    try {
      await axios.post(
        `${API_BASE}/appointment-for-patient/book`,
        {
          doctorId,
          startsAt: slot.start,
          endsAt: slot.end,
          type,
        },
        { withCredentials: true },
      );

      setMessage(t("success_created"));
      setError("");
      setSlots([]);
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || t("error_create"));
    }
  };

  /* ============================================================
     🔹 UI
  ============================================================ */
  return (
    <div className="pa-wrap" dir={isRTL ? "rtl" : "ltr"}>
      <PAStyles />

      {/* ===== Hero ===== */}
      <div className="pa-header">
        <div className="pa-header-content">
          <span className="pa-eyebrow">
            <span className="dot" />
            {t("patientArea:common.booking")}
          </span>
          <h1 className="pa-title">
            <FaCalendarAlt />
            {t("page_title")}
          </h1>
          <p className="pa-subtitle">
            {t("filters_title")} → {t("select_doctor")} → {t("select_date")}
          </p>
        </div>
      </div>

      {/* ===== Alerts ===== */}
      {message && (
        <div className="pa-alert success" role="status">
          <IconCheck />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="pa-alert error" role="alert">
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      {/* ===== Фильтры ===== */}
      <div className="pa-card">
        <div className="pa-card-head">
          <span className="pa-card-title">
            <FaFilter />
            {t("filters_title")}
          </span>
          <button
            type="button"
            className="pa-btn pa-btn-outline"
            onClick={() =>
              setFilters({
                country: "",
                specialty: "",
                minRating: "",
                minReviews: "",
                sort: "",
              })
            }
          >
            <IconReset />
            {t("clear_filters")}
          </button>
        </div>

        <div className="pa-filters-grid">
          <div className="pa-field">
            <select
              className="pa-select"
              value={filters.country}
              onChange={(e) =>
                setFilters({ ...filters, country: e.target.value })
              }
            >
              <option value="">{t("all_countries")}</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="pa-field">
            <select
              className="pa-select"
              value={filters.specialty}
              onChange={(e) =>
                setFilters({ ...filters, specialty: e.target.value })
              }
            >
              <option value="">{t("all_specialties")}</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="pa-field">
            <input
              type="number"
              className="pa-input"
              placeholder={t("min_rating")}
              value={filters.minRating}
              onChange={(e) =>
                setFilters({ ...filters, minRating: e.target.value })
              }
            />
          </div>

          <div className="pa-field">
            <input
              type="number"
              className="pa-input"
              placeholder={t("min_reviews")}
              value={filters.minReviews}
              onChange={(e) =>
                setFilters({ ...filters, minReviews: e.target.value })
              }
            />
          </div>

          <div className="pa-field">
            <select
              className="pa-select"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            >
              <option value="">{t("sort")}</option>
              <option value="priceAsc">{t("sort_price_asc")}</option>
              <option value="priceDesc">{t("sort_price_desc")}</option>
              <option value="ratingDesc">{t("sort_rating")}</option>
              <option value="reviewsDesc">{t("sort_reviews")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===== Выбор врача ===== */}
      <div className="pa-card">
        <div className="pa-field">
          <label className="pa-label">
            <IconUser />
            {t("select_doctor")}
          </label>
          <select
            className="pa-select"
            value={selectedDoctor?.userId || ""}
            onChange={(e) => {
              const id = e.target.value;
              const doctor = doctors.find(
                (d) =>
                  d.userId?.toString() === id ||
                  d.profileId?.toString() === id ||
                  d._id?.toString() === id,
              );
              setSelectedDoctor(doctor || null);
              setSlots([]);
              setDate("");
              setError("");
            }}
          >
            <option value="">{t("not_selected")}</option>
            {doctors.map((doc) => (
              <option
                key={doc.userId || doc.profileId || doc._id}
                value={doc.userId || doc.profileId || doc._id}
              >
                {doc.firstName
                  ? `${doc.firstName} ${doc.lastName || ""}`
                  : t("no_name")}{" "}
                — {doc.specialty || t("no_specialty")} ({doc.country || "—"}) |
                ⭐ {doc.rating || 0} | 💬 {doc.reviewsCount || 0}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== Тип приёма и дата ===== */}
      {selectedDoctor && (
        <div className="pa-card">
          {/* Тип */}
          <div className="pa-field" style={{ marginBottom: 16 }}>
            <label className="pa-label">{t("appointment_type")}</label>
            <div className="pa-radios">
              <label className="pa-radio">
                <input
                  type="radio"
                  name="type"
                  value="offline"
                  checked={type === "offline"}
                  onChange={(e) => setType(e.target.value)}
                />
                <span className="pa-radio-dot" />
                <FaHospital />
                {t("offline")}
              </label>

              <label
                className={`pa-radio ${selectedDoctor.allowVideo === false ? "disabled" : ""}`}
              >
                <input
                  type="radio"
                  name="type"
                  value="video"
                  checked={type === "video"}
                  onChange={(e) => setType(e.target.value)}
                  disabled={selectedDoctor.allowVideo === false}
                />
                <span className="pa-radio-dot" />
                <FaVideo />
                {t("online")}
              </label>
            </div>

            {selectedDoctor.allowVideo === false && (
              <span className="pa-radio-hint">🔒 {t("online_disabled")}</span>
            )}
          </div>

          {/* Дата */}
          <div className="pa-field" style={{ marginBottom: 16 }}>
            <label className="pa-label">{t("select_date")}</label>
            <div className="pa-date-row">
              <div className="pa-field">
                <input
                  type="date"
                  className="pa-input"
                  value={date}
                  // Прошедший день выбрать нельзя: приём, который уже
                  // «прошёл», не проведёшь и не отменишь осмысленно.
                  // Это лишь удобство — тем же занят сервер: слоты в
                  // прошлом не выдаются, а запись на них отклоняется.
                  min={todayStr}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="pa-btn pa-btn-primary"
                // min у поля браузер соблюдает не везде (и не мешает
                // вписать дату руками) — повторяем проверку здесь.
                disabled={!date || date < todayStr}
                onClick={() => loadSlots(selectedDoctor.userId, date, type)}
              >
                <IconSearch />
                {t("show_slots")}
              </button>
            </div>
          </div>

          {/* Поле номера WhatsApp удалено: онлайн-приём проходит в
              видеокомнате платформы, и телефон для него не требуется. */}
        </div>
      )}

      {/* ===== Слоты ===== */}
      {slots.length > 0 && (
        <div>
          <h3 className="pa-slots-title">
            <FaClock />
            {t("available_slots")}
          </h3>

          <div className="pa-slots-grid">
            {slots.map((slot, i) => (
              <div key={i} className="pa-slot-card">
                <div className="pa-slot-time">
                  <span>
                    {new Date(slot.start).toLocaleTimeString(i18n.language, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="pa-slot-time-dash">–</span>
                  <span>
                    {new Date(slot.end).toLocaleTimeString(i18n.language, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="pa-slot-date">
                  {new Date(slot.start).toLocaleDateString(i18n.language)}
                </p>
                <button
                  type="button"
                  className="pa-btn pa-btn-book"
                  onClick={() => handleBook(slot)}
                >
                  {t("book")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {slots.length === 0 && date && !loading && (
        <div className="pa-no-slots">❌ {t("no_slots")}</div>
      )}

      {loading && (
        <div className="pa-loading">
          <span className="pa-spinner" />
          <span>{t("loading")}</span>
        </div>
      )}
    </div>
  );
}
