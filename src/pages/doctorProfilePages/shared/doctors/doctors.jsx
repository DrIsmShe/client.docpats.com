// client/modules/doctorProfile/pages/DoctorsAll.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaCommentDots } from "react-icons/fa6";
import { BsCalendar2DateFill } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import useCommentCountBulk from "../../../../components/shared/useCommentCount";
import { useTranslation } from "react-i18next";

/* helpers */
const normalize = (s) => (s || "").toString().trim().toLowerCase();
const getFullName = (d) =>
  [`${d?.user?.firstName || ""}`, `${d?.user?.lastName || ""}`]
    .filter(Boolean)
    .join(" ")
    .trim();

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
    --border2: #d6d0c6;
    --shadow-sm: 0 2px 8px rgba(28,25,23,.07), 0 1px 3px rgba(28,25,23,.04);
    --shadow-md: 0 8px 24px rgba(28,25,23,.09), 0 2px 8px rgba(28,25,23,.04);
    --shadow-hover: 0 16px 40px rgba(15,118,110,.13), 0 4px 12px rgba(28,25,23,.06);
    --radius: 16px;
    --transition: all .22s cubic-bezier(.4,0,.2,1);
    --font-display: 'Lora', Georgia, serif;
    --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  .da-wrap {
    background: var(--cream);
    min-height: 100vh;
    font-family: var(--font-body);
    color: var(--ink);
  }

  /* ── HEADER ── */
  .da-header {
    background: linear-gradient(150deg, #0c4a6e 0%, #0f766e 60%, #065f46 100%);
    padding: 52px 40px 72px;
    position: relative;
    overflow: hidden;
  }
  .da-header::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 700px 400px at 90% 40%, rgba(20,184,166,.18) 0%, transparent 65%),
      radial-gradient(ellipse 300px 500px at 5% 110%, rgba(6,95,70,.5) 0%, transparent 60%);
    pointer-events: none;
  }
  .da-header::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 56px;
    background: var(--cream);
    clip-path: ellipse(55% 100% at 50% 100%);
  }
  .da-header-inner {
    max-width: 1280px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
  }
  .da-header-tag {
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
    margin-bottom: 18px;
  }
  .da-header-tag::before {
    content: '';
    width: 6px; height: 6px;
    background: #5eead4;
    border-radius: 50%;
  }
  .da-header-title {
    font-family: var(--font-display);
    font-size: clamp(24px, 3.5vw, 40px);
    font-weight: 700;
    color: white;
    line-height: 1.2;
    letter-spacing: -.015em;
    margin: 0 0 14px;
  }
  .da-header-stats {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }
  .da-stat-chip {
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    color: rgba(255,255,255,.8);
    font-size: 12px;
    font-weight: 500;
    padding: 5px 14px;
    border-radius: 100px;
  }
  .da-stat-chip b { color: white; }
  .da-header-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .da-perpage-label {
    font-size: 12px;
    color: rgba(255,255,255,.7);
    font-weight: 500;
    white-space: nowrap;
  }
  .da-perpage-select {
    height: 36px;
    padding: 0 28px 0 12px;
    background: rgba(255,255,255,.15);
    border: 1.5px solid rgba(255,255,255,.25);
    border-radius: 8px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    backdrop-filter: blur(8px);
    transition: var(--transition);
  }
  .da-perpage-select:focus { border-color: rgba(255,255,255,.5); }
  .da-perpage-select option { background: #0f766e; color: white; }

  /* ── BODY ── */
  .da-body {
    max-width: 1280px;
    margin: -28px auto 0;
    padding: 0 32px 80px;
    position: relative;
    z-index: 2;
  }
  @media (max-width: 768px) { .da-body { padding: 0 16px 60px; } }

  /* ── FILTERS ── */
  .da-filters {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    margin-bottom: 36px;
  }
  .da-filters-head {
    background: var(--cream2);
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .da-filters-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--ink3);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .da-filters-title::before {
    content: '';
    width: 14px; height: 14px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230f766e' stroke-width='2.5'%3E%3Cpath d='M3 6h18M7 12h10M11 18h2'/%3E%3C/svg%3E") center/contain no-repeat;
  }
  .da-reset-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--ink3);
    background: none;
    border: 1.5px solid var(--border2);
    border-radius: 100px;
    padding: 5px 14px;
    cursor: pointer;
    transition: var(--transition);
    font-family: var(--font-body);
  }
  .da-reset-btn:hover { border-color: var(--teal); color: var(--teal); background: var(--teal-pale); }
  .da-filters-grid {
    padding: 22px 24px 22px;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 768px) { .da-filters-grid { grid-template-columns: 1fr; } }

  .da-field { display: flex; flex-direction: column; gap: 6px; }
  .da-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--ink3);
  }
  .da-input, .da-select {
    height: 40px;
    padding: 0 14px;
    background: var(--cream2);
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--ink);
    transition: var(--transition);
    outline: none;
    width: 100%;
  }
  .da-input::placeholder { color: var(--ink3); }
  .da-input:focus, .da-select:focus {
    border-color: var(--teal-mid);
    background: white;
    box-shadow: 0 0 0 3px rgba(15,118,110,.1);
  }

  /* ── GRID ── */
  .da-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
    margin-bottom: 48px;
  }
  @media (max-width: 640px) { .da-grid { grid-template-columns: 1fr; gap: 14px; } }

  /* ── DOCTOR CARD ── */
  .da-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    transition: var(--transition);
  }
  .da-card:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-3px);
    border-color: var(--teal-border);
  }

  /* Card top — image + info side by side */
  .da-card-top {
    display: flex;
    flex: 1;
  }
  .da-card-img-col {
    width: 130px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
  }
  .da-card-img {
    width: 100%;
    height: 100%;
    min-height: 170px;
    object-fit: cover;
    display: block;
    transition: transform .5s cubic-bezier(.4,0,.2,1);
  }
  .da-card:hover .da-card-img { transform: scale(1.05); }
  .da-card-img-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, transparent 70%, rgba(12,74,110,.1));
    pointer-events: none;
  }

  .da-card-info {
    padding: 18px 18px 14px;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .da-card-name {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--ink);
    text-decoration: none;
    line-height: 1.3;
    margin-bottom: 12px;
    display: block;
    transition: color .15s;
  }
  .da-card-name:hover { color: var(--teal); }

  .da-card-detail {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }
  .da-detail-row {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--ink3);
  }
  .da-detail-label {
    font-weight: 700;
    color: var(--ink2);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .da-detail-value {
    color: var(--ink3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* specialty pill */
  .da-specialty-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--teal-pale);
    border: 1px solid var(--teal-border);
    color: var(--teal);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 100px;
    margin-bottom: 10px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── CARD FOOTER ── */
  .da-card-footer {
    padding: 10px 18px 14px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .da-card-meta {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .da-meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--ink3);
    font-weight: 500;
  }
  .da-meta-item svg { opacity: .7; }
  .da-articles-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    color: var(--teal);
    text-decoration: none;
    padding: 4px 12px;
    border-radius: 100px;
    border: 1.5px solid var(--teal-border);
    background: var(--teal-pale);
    transition: var(--transition);
    white-space: nowrap;
  }
  .da-articles-link:hover {
    background: var(--teal);
    color: white;
    border-color: var(--teal);
  }

  /* ── EMPTY ── */
  .da-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px 20px;
    color: var(--ink3);
  }
  .da-empty-icon { font-size: 52px; opacity: .35; margin-bottom: 16px; }
  .da-empty-title {
    font-family: var(--font-display);
    font-size: 20px;
    color: var(--ink2);
    margin-bottom: 6px;
  }
  .da-empty-sub { font-size: 13px; }

  /* ── LOADING ── */
  .da-loading {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 60vh; gap: 16px;
    color: var(--ink3); font-size: 14px;
    background: var(--cream);
    font-family: var(--font-body);
  }
  .da-spinner {
    width: 44px; height: 44px;
    border: 3px solid var(--parchment);
    border-top-color: var(--teal);
    border-radius: 50%;
    animation: da-spin .7s linear infinite;
  }
  @keyframes da-spin { to { transform: rotate(360deg); } }

  /* ── PAGINATION ── */
  .da-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .da-page-btn {
    min-width: 38px; height: 38px;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 12px;
    background: white;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink2);
    cursor: pointer;
    transition: var(--transition);
    font-family: var(--font-body);
  }
  .da-page-btn:hover:not(:disabled) {
    border-color: var(--teal);
    color: var(--teal);
    background: var(--teal-pale);
  }
  .da-page-btn.active {
    background: var(--teal);
    border-color: var(--teal);
    color: white;
  }
  .da-page-btn:disabled { opacity: .35; cursor: not-allowed; }
  .da-page-ellipsis {
    color: var(--ink3); font-size: 14px;
    padding: 0 4px; line-height: 38px;
  }
`;

export default function DoctorsAll() {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // фильтры (клиентские)
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [specialty, setSpecialty] = useState("all");

  // пагинация
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  // bulk-комментарии
  const doctorIds = useMemo(() => doctors.map((d) => d._id), [doctors]);
  const commentCounts = useCommentCountBulk(doctorIds);

  const API_BASE = process.env.REACT_APP_API_URL;

  /* ============================
        LOAD DOCTORS
  ============================ */
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/doctor-profile/doctors`, {
          withCredentials: true,
        });
        setDoctors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Ошибка при загрузке докторов:", error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  /* ============================
        FILTER OPTIONS
  ============================ */
  const options = useMemo(() => {
    const cSet = new Set();
    const sSet = new Set();

    for (const d of doctors) {
      if (d?.country) cSet.add(String(d.country).trim());
      if (d?.specialty) sSet.add(String(d.specialty).trim());
    }

    const sortAlpha = (a, b) => a.localeCompare(b, "ru");

    return {
      countries: ["all", ...Array.from(cSet).filter(Boolean).sort(sortAlpha)],
      specialties: ["all", ...Array.from(sSet).filter(Boolean).sort(sortAlpha)],
    };
  }, [doctors]);

  /* ============================
        APPLY FILTERS
  ============================ */
  const filtered = useMemo(() => {
    let list = [...doctors];

    const q = normalize(search);
    if (q) {
      list = list.filter((d) => normalize(getFullName(d)).includes(q));
    }
    if (country !== "all") {
      list = list.filter((d) => normalize(d?.country) === normalize(country));
    }
    if (specialty !== "all") {
      list = list.filter(
        (d) => normalize(d?.specialty) === normalize(specialty),
      );
    }

    return list;
  }, [doctors, search, country, specialty]);

  /* ============================
        PAGINATION
  ============================ */
  useEffect(() => {
    setPage(1);
  }, [search, country, specialty, perPage]);

  const total = filtered.length;
  const totalPages = Math.max(Math.ceil(total / perPage), 1);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const pagedDoctors = filtered.slice(start, end);

  const handlePerPageChange = (e) => {
    const v = Number(e.target.value) || 9;
    setPerPage(v);
    setPage(1);
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const buildPageItems = () => {
    const items = [];
    const maxButtons = 7;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }

    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);

    items.push(1);
    if (left > 2) items.push("…");
    for (let i = left; i <= right; i++) items.push(i);
    if (right < totalPages - 1) items.push("…");
    items.push(totalPages);

    return items;
  };

  const resetFilters = () => {
    setSearch("");
    setCountry("all");
    setSpecialty("all");
  };

  /* ============================
        LOADING SCREEN
  ============================ */
  if (loading) {
    return (
      <div className="da-wrap">
        <style>{styles}</style>
        <div className="da-loading">
          <div className="da-spinner" />
          <span>{t("doctors.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="da-wrap">
      <style>{styles}</style>

      {/* ── HEADER ── */}
      <div className="da-header">
        <div className="da-header-inner">
          <div>
            <div className="da-header-tag">DocPats · Medical Specialists</div>
            <h1 className="da-header-title">{t("doctors.title")}</h1>
            <div className="da-header-stats">
              <div className="da-stat-chip">
                {t("doctors.found")}: <b>&nbsp;{filtered.length}</b>
              </div>
              <div className="da-stat-chip">
                {t("doctors.total")}: <b>&nbsp;{doctors.length}</b>
              </div>
              <div className="da-stat-chip">
                {t("doctors.page")} <b>&nbsp;{page}&nbsp;</b>
                {t("doctors.of")} <b>&nbsp;{totalPages}</b>
              </div>
            </div>
          </div>

          <div className="da-header-controls">
            <span className="da-perpage-label">{t("doctors.perPage")}</span>
            <select
              value={perPage}
              onChange={handlePerPageChange}
              className="da-perpage-select"
            >
              {[6, 9, 12, 18, 24, 36].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="da-body">
        {/* ── FILTER PANEL ── */}
        <div className="da-filters">
          <div className="da-filters-head">
            <div className="da-filters-title">
              {t("doctors.searchLabel") || "Search & Filter"}
            </div>
            <button className="da-reset-btn" onClick={resetFilters}>
              ↺ {t("doctors.resetFilters")}
            </button>
          </div>

          <div className="da-filters-grid">
            <div className="da-field">
              <label className="da-label">{t("doctors.searchLabel")}</label>
              <input
                type="text"
                className="da-input"
                placeholder={t("doctors.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="da-field">
              <label className="da-label">{t("doctors.country")}</label>
              <select
                className="da-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {options.countries.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? t("doctors.allCountries") : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="da-field">
              <label className="da-label">{t("doctors.specialty")}</label>
              <select
                className="da-select"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                {options.specialties.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? t("doctors.allSpecialties") : s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── GRID ── */}
        <div className="da-grid">
          {pagedDoctors.length === 0 ? (
            <div className="da-empty">
              <div className="da-empty-icon">🩺</div>
              <div className="da-empty-title">{t("doctors.noResults")}</div>
              <div className="da-empty-sub">
                Попробуйте изменить параметры поиска
              </div>
            </div>
          ) : (
            pagedDoctors.map((doctor) => {
              const R2_BASE =
                process.env.REACT_APP_R2_PUBLIC_URL || "https://docpats.com";
              const DEFAULT_AVATAR = `${R2_BASE}/uploads/default/doctor_consultation_02.jpg`;

              const imgSrc = doctor?.profileImage || DEFAULT_AVATAR;

              const firstName =
                doctor?.user?.firstName || t("doctors.firstnameFallback");
              const lastName =
                doctor?.user?.lastName || t("doctors.lastnameFallback");
              const fullName = `${firstName} ${lastName}`.trim();

              const spec = doctor?.specialty || t("doctors.notSpecified");
              const clinic = doctor?.clinic || t("doctors.notSpecified");
              const ctry = doctor?.country || t("doctors.notSpecified");

              const created = doctor?.createdAt
                ? new Date(doctor.createdAt).toLocaleDateString(
                    t("lang.locale"),
                  )
                : "—";

              const likesCount = Array.isArray(doctor?.likes)
                ? doctor.likes.length
                : 0;

              const comments = commentCounts[doctor._id] || 0;
              const articlesCount = doctor?.articles?.count ?? 0;

              const articlesLink =
                localStorage.getItem("role") === "doctor"
                  ? `/patient/doctors-articles/${doctor._id}`
                  : `/doctor/doctors-articles/${doctor._id}`;

              return (
                <div key={doctor._id} className="da-card">
                  {/* Top: image + info */}
                  <div className="da-card-top">
                    {/* Image */}
                    <div className="da-card-img-col">
                      <img
                        src={imgSrc}
                        alt={fullName}
                        className="da-card-img"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_AVATAR;
                        }}
                      />
                      <div className="da-card-img-overlay" />
                    </div>

                    {/* Info */}
                    <div className="da-card-info">
                      <Link
                        to={`/doctor/doctor-details/${doctor._id}`}
                        className="da-card-name"
                      >
                        {fullName}
                      </Link>

                      {spec !== t("doctors.notSpecified") && (
                        <div className="da-specialty-pill">{spec}</div>
                      )}

                      <div className="da-card-detail">
                        <div className="da-detail-row">
                          <span className="da-detail-label">
                            {t("doctors.clinic")}:
                          </span>
                          <span className="da-detail-value" title={clinic}>
                            {clinic}
                          </span>
                        </div>
                        <div className="da-detail-row">
                          <span className="da-detail-label">
                            {t("doctors.country")}:
                          </span>
                          <span className="da-detail-value">{ctry}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="da-card-footer">
                    <div className="da-card-meta">
                      <div className="da-meta-item">
                        <BsCalendar2DateFill size={12} />
                        {created}
                      </div>
                      <div className="da-meta-item">
                        <FaCommentDots size={12} />
                        {comments}
                      </div>
                      <div className="da-meta-item">
                        <AiFillLike size={12} />
                        {likesCount}
                      </div>
                    </div>

                    <Link to={articlesLink} className="da-articles-link">
                      📄 {t("doctors.articles")}: {articlesCount}
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="da-pagination">
            <button
              className="da-page-btn"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
            >
              «
            </button>

            {buildPageItems().map((p, idx) =>
              p === "…" ? (
                <span key={`ellipsis-${idx}`} className="da-page-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  className={`da-page-btn${p === page ? " active" : ""}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ),
            )}

            <button
              className="da-page-btn"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
            >
              »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
