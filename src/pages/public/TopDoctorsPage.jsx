// client/src/pages/public/TopDoctorsPage.jsx
//
// Публичная (без авторизации) SEO-страница «Лучшие врачи» — список врачей,
// отсортированный по реальному рейтингу. Индексируется поисковиками.
// Данные: GET /api/v1/public/top-doctors?specialty=&country=

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.REACT_APP_API_URL;

function Stars({ value = 0 }) {
  const full = Math.round(value);
  return (
    <span style={{ color: "#f59e0b", letterSpacing: 1 }}>
      {"★".repeat(full)}
      <span style={{ color: "#d1d5db" }}>{"★".repeat(5 - full)}</span>
    </span>
  );
}

export default function TopDoctorsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const specialty = params.get("specialty") || "";
  const country = params.get("country") || "";

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(specialty);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (specialty) qs.set("specialty", specialty);
    if (country) qs.set("country", country);
    axios
      .get(`${API_BASE}/api/v1/public/top-doctors?${qs.toString()}`)
      .then((r) => setDoctors(r.data?.doctors || []))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [specialty, country]);

  const title = specialty ? `Лучшие врачи: ${specialty}` : "Лучшие врачи";
  const canonical = `https://docpats.com/top-doctors${
    specialty ? `?specialty=${encodeURIComponent(specialty)}` : ""
  }`;

  const applyFilter = (e) => {
    e.preventDefault();
    const p = {};
    if (q.trim()) p.specialty = q.trim();
    if (country) p.country = country;
    setParams(p);
  };

  return (
    <div style={wrap}>
      <Helmet>
        <title>{title} | DocPats</title>
        <meta
          name="description"
          content={`${title} на DocPats — рейтинг по реальным отзывам пациентов. Выберите врача и запишитесь онлайн.`}
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${title} | DocPats`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <h1 style={h1}>{title}</h1>
      <p style={sub}>
        {t("topDoctors.sub")}
      </p>

      <form onSubmit={applyFilter} style={filterRow}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("topDoctors.specialtyPlaceholder")}
          style={input}
        />
        <button type="submit" style={btn}>
          {t("topDoctors.show")}
        </button>
      </form>

      {loading ? (
        <div style={{ color: "#64748b", padding: 24 }}>{t("loading")}</div>
      ) : doctors.length === 0 ? (
        <div style={{ color: "#64748b", padding: 24 }}>
          {t("topDoctors.empty")}
        </div>
      ) : (
        <div style={grid}>
          {doctors.map((d) => (
            <Link key={d.profileId} to={d.url} style={card}>
              <img
                src={
                  d.profileImage ||
                  "https://docpats.com/uploads/default/doctor_consultation_02.jpg"
                }
                alt={d.name}
                style={img}
                loading="lazy"
              />
              <div style={{ padding: 12 }}>
                <div style={nameStyle}>{d.name}</div>
                {d.specialty && <div style={specStyle}>{d.specialty}</div>}
                {d.country && <div style={ctryStyle}>{d.country}</div>}
                {d.rating > 0 && (
                  <div style={ratingRow}>
                    <Stars value={d.rating} />
                    <b style={{ color: "#0f172a" }}>{d.rating}</b>
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>
                      ({d.reviewCount})
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const wrap = { maxWidth: 1100, margin: "0 auto", padding: "32px 16px" };
const h1 = { fontSize: 30, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" };
const sub = { color: "#64748b", marginBottom: 20 };
const filterRow = { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" };
const input = { flex: "1 1 240px", minWidth: 200, padding: "10px 12px", border: "1px solid #d9dfe8", borderRadius: 10, fontSize: 14 };
const btn = { padding: "10px 20px", background: "#0f766e", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 };
const card = { display: "block", background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, overflow: "hidden", textDecoration: "none", color: "inherit", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" };
const img = { width: "100%", height: 160, objectFit: "cover", display: "block" };
const nameStyle = { fontWeight: 700, fontSize: 16, color: "#0f172a" };
const specStyle = { color: "#0f766e", fontSize: 13, marginTop: 2 };
const ctryStyle = { color: "#94a3b8", fontSize: 12, marginTop: 2 };
const ratingRow = { display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 14 };
