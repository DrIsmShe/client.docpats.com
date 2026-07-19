import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaCommentDots } from "react-icons/fa6";
import { BsCalendar2DateFill } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { sh } from "../../../../lib/sanitizeHtml";

/* ====================== Страны (фиксированный список) ====================== */
const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar (Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "UAE",
  "Uganda",
  "Ukraine",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

/* ====== Алиасы стран (приводим значения из БЭКа к вариантам из селекта) ====== */
const COUNTRY_ALIASES = {
  "United Arab Emirates": "UAE",
  "U.A.E.": "UAE",
  "Cote d'Ivoire": "Ivory Coast",
  "Côte d'Ivoire": "Ivory Coast",
  "Korea, Republic of": "South Korea",
  "Republic of Korea": "South Korea",
  "Korea, South": "South Korea",
  "Korea, Democratic People's Republic of": "North Korea",
  "Democratic People's Republic of Korea": "North Korea",
  "Russian Federation": "Russia",
  "Viet Nam": "Vietnam",
  Türkiye: "Turkey",
  "Timor Leste": "Timor-Leste",
};

/* ====== Маппинг языков i18n → BCP-47 локали (для дат и localeCompare) ====== */
const LANG_TO_LOCALE = {
  ru: "ru-RU",
  en: "en-US",
  tr: "tr-TR",
  ar: "ar-SA",
  az: "az-AZ",
};

/* Сентинел, который возвращает normalizeCountryForSelect для пустой страны.
   Оставляем прежнее значение, чтобы не ломать фильтры/сортировку, —
   переводим его только на слое отображения через displayCountry(). */
const COUNTRY_RAW_FALLBACK = "Не указана";

const normalize = (s) => (s || "").toString().trim().toLowerCase();
const stripHtml = (s) => (s || "").replace(/<[^>]*>/g, " ");
const dateRu = (iso) => (iso ? new Date(iso).toLocaleDateString("ru-RU") : "—");
const normalizeCountryForSelect = (s) => {
  const raw = (s || "").trim();
  return COUNTRY_ALIASES[raw] || raw || COUNTRY_RAW_FALLBACK;
};

const fullNameOf = (d) =>
  [d?.firstName, d?.lastName].filter(Boolean).join(" ").trim();

const doctorCountry = (d) =>
  normalizeCountryForSelect(d?.country || COUNTRY_RAW_FALLBACK);

const articlesCountOf = (d) =>
  typeof d?.articles?.count === "number" ? d.articles.count : 0;

const reviewsCountOf = (d) => {
  if (typeof d?.reviewsCount === "number") return d.reviewsCount;
  if (typeof d?.commentsCount === "number") return d.commentsCount;
  if (typeof d?.articles?.comments === "number") return d.articles.comments;
  return 0;
};

const ratingOf = (d) => (typeof d?.rating === "number" ? d.rating : 0);

const likesCountOf = (d) => {
  if (typeof d?.likesCount === "number") return d.likesCount;
  if (typeof d?.articles?.likes === "number") return d.articles.likes;
  return 0;
};

/* ====================== Иконки ====================== */
const IconSearch = () => (
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
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconFilter = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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
const IconGlobe = () => (
  <svg
    width="13"
    height="13"
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
const IconClinic = () => (
  <svg
    width="13"
    height="13"
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
const IconArticle = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
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
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/* ====================== Стили ====================== */
const DAStyles = () => (
  <style>{`
    .da-wrap {
      max-width: 1240px;
      margin: 0 auto;
      padding: 32px 20px 80px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Header ── */
    .da-header {
      position: relative;
      padding: 34px 36px;
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 55%, #0369a1 100%);
      border-radius: 20px;
      color: white;
      overflow: hidden;
      margin-bottom: 22px;
      box-shadow: 0 12px 32px -14px rgba(15, 118, 110, 0.4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .da-header::before {
      content: "";
      position: absolute;
      top: -100px; right: -60px;
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%);
      pointer-events: none;
    }
    .da-header-content { position: relative; z-index: 1; }
    .da-eyebrow {
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
      border: 1px solid rgba(255,255,255,0.15);
    }
    .da-eyebrow .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.35);
    }
    .da-title {
      font-size: clamp(24px, 3.2vw, 32px);
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 6px;
      line-height: 1.15;
    }
    .da-subtitle {
      font-size: 14px;
      color: rgba(255,255,255,0.88);
      margin: 0;
      max-width: 540px;
    }
    .da-count-pill {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      padding: 12px 20px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.22);
    }
    .da-count-icon {
      width: 40px; height: 40px;
      border-radius: 10px;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .da-count-num { font-size: 22px; font-weight: 700; line-height: 1; }
    .da-count-label {
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.82);
      margin-top: 4px;
    }

    /* ── Filters ── */
    .da-filters {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px 22px;
      margin-bottom: 22px;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .da-filters-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
    }
    .da-filters-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #0f172a;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .da-filters-title svg { color: #0891b2; }
    .da-found {
      font-size: 13px;
      color: #64748b;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .da-found-badge {
      background: #ecfeff;
      color: #0e7490;
      border: 1px solid #a5f3fc;
      padding: 2px 10px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 12px;
    }
    .da-filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }
    .da-field { display: flex; flex-direction: column; }
    .da-label {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 6px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .da-label svg { color: #94a3b8; }
    .da-input, .da-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      font-size: 14px;
      color: #0f172a;
      transition: all 0.15s ease;
      font-family: inherit;
      box-sizing: border-box;
    }
    .da-input::placeholder { color: #94a3b8; }
    .da-input:hover, .da-select:hover { border-color: #cbd5e1; }
    .da-input:focus, .da-select:focus {
      outline: none;
      border-color: #0891b2;
      background: white;
      box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.15);
    }
    .da-select {
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 10px center;
      padding-right: 32px;
    }
    .da-field-actions { display: flex; align-items: flex-end; }
    .da-reset-btn {
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
    }
    .da-reset-btn:hover {
      border-color: #fda4af;
      background: #fff1f2;
      color: #be123c;
    }

    /* ── Toggles ── */
    .da-toggles {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
    }
    .da-toggle {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      background: white;
      cursor: pointer;
      font-size: 13px;
      color: #475569;
      transition: all 0.15s ease;
      font-weight: 500;
    }
    .da-toggle:hover { border-color: #cbd5e1; background: #f8fafc; }
    .da-toggle input { display: none; }
    .da-toggle-check {
      width: 16px; height: 16px;
      border: 2px solid #cbd5e1;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    .da-toggle input:checked + .da-toggle-check {
      background: #0891b2;
      border-color: #0891b2;
    }
    .da-toggle input:checked + .da-toggle-check::after {
      content: "";
      width: 4px; height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg) translate(-1px, -1px);
    }
    .da-toggle:has(input:checked) {
      border-color: #0891b2;
      background: #ecfeff;
      color: #0e7490;
    }

    /* ── Grid ── */
    .da-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 18px;
    }

    /* ── Doctor card ── */
    .da-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .da-card:hover {
      border-color: #a5f3fc;
      transform: translateY(-2px);
      box-shadow: 0 12px 28px -14px rgba(8, 145, 178, 0.25);
    }

    .da-photo-wrap {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
      background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
      padding:10px;
    }
    .da-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.4s ease;
      border-radius:10px;
    }
    .da-card:hover .da-photo { transform: scale(1.04); }
    .da-photo-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.45) 0%, transparent 50%);
      pointer-events: none;
    }
    .da-specialty-badge {
      position: absolute;
      left: 14px;
      bottom: 14px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      color: #0e7490;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid rgba(8, 145, 178, 0.25);
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
      max-width: calc(100% - 28px);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .da-card-body {
      padding: 18px 20px 14px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .da-name-link {
      text-decoration: none;
      color: inherit;
      display: inline-block;
    }
    .da-name {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 10px;
      line-height: 1.3;
      transition: color 0.15s ease;
    }
    .da-name-link:hover .da-name { color: #0891b2; }

    .da-about {
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: calc(1.6em * 3);
    }
    .da-about p, .da-about span, .da-about div { margin: 0; display: inline; }
    .da-about strong, .da-about b { color: #334155; font-weight: 600; }

    .da-meta {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-top: 10px;
      border-top: 1px dashed #e2e8f0;
    }
    .da-meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #475569;
    }
    .da-meta-row svg { color: #0891b2; flex-shrink: 0; }
    .da-meta-label { color: #94a3b8; font-weight: 500; }
    .da-meta-value { color: #0f172a; font-weight: 500; word-break: break-word; }
    .da-meta-empty { color: #94a3b8; font-style: italic; }

    /* ── Stats bar ── */
    .da-stats {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #f8fafc 0%, #f0fdfa 100%);
      border-top: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }
    .da-stat {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #475569;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .da-stat svg { flex-shrink: 0; }
    .da-stat.date { color: #64748b; }
    .da-stat.date svg { color: #64748b; }
    .da-stat.reviews { color: #0e7490; }
    .da-stat.reviews svg { color: #0891b2; }
    .da-stat.likes { color: #be185d; }
    .da-stat.likes svg { color: #ec4899; }
    .da-articles-link {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #b45309;
      font-weight: 600;
      text-decoration: none;
      padding: 4px 10px;
      border-radius: 999px;
      background: #fef3c7;
      border: 1px solid #fde68a;
      transition: all 0.15s ease;
    }
    .da-articles-link:hover {
      background: #fde68a;
      color: #92400e;
    }

    /* ── States ── */
    .da-empty {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      background: white;
      border: 1px dashed #cbd5e1;
      border-radius: 16px;
      color: #64748b;
    }
    .da-empty-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px; height: 72px;
      border-radius: 50%;
      background: #f0fdfa;
      color: #0891b2;
      margin-bottom: 14px;
    }
    .da-empty-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .da-empty-text { font-size: 14px; color: #64748b; }

    .da-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 80px 20px;
      color: #64748b;
      font-size: 14px;
    }
    .da-spinner {
      width: 20px; height: 20px;
      border: 2.5px solid #e2e8f0;
      border-top-color: #0891b2;
      border-radius: 50%;
      animation: da-spin 0.8s linear infinite;
    }
    @keyframes da-spin { to { transform: rotate(360deg); } }
    .da-error {
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
      margin: 24px 0;
    }

    @media (max-width: 640px) {
      .da-wrap { padding: 20px 14px 60px; }
      .da-header { padding: 24px 22px; }
      .da-count-pill { padding: 10px 14px; }
      .da-grid { grid-template-columns: 1fr; }
    }
  `}</style>
);

export default function DoctorsAll() {
  const { t, i18n } = useTranslation("PatuentTranslate");

  /* ── язык / локаль / направление текста ── */
  const currentLang = (i18n.language || "ru").split("-")[0];
  const locale = LANG_TO_LOCALE[currentLang] || LANG_TO_LOCALE.ru;
  const isRTL = currentLang === "ar";

  /* Локализованная дата — старый dateRu НЕ трогаем, добавили новый форматтер */
  const dateLocalized = (iso) =>
    iso ? new Date(iso).toLocaleDateString(locale) : "—";

  /* Отображение страны с переводом сентинельного fallback-значения */
  const displayCountry = (d) => {
    const c = doctorCountry(d);
    return c === COUNTRY_RAW_FALLBACK
      ? t("doctorsAll.card.countryFallback")
      : c;
  };

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  // Теперь флаг, а не строка — текст берём из t() в рендере,
  // чтобы он реактивно менялся при переключении языка.
  const [error, setError] = useState(false);

  // Фильтры / поиск / сорт
  const [nameQuery, setNameQuery] = useState(""); // поиск по имени/фамилии
  const [clinicQuery, setClinicQuery] = useState(""); // доп. поиск по клинике/описанию (от себя)
  const [country, setCountry] = useState("all"); // страна (из фиксированного списка)
  const [specialization, setSpecialization] = useState("all");
  const [minArticles, setMinArticles] = useState(0); // мин. кол-во статей (от себя)
  const [withPhoto, setWithPhoto] = useState(false); // только с фото (от себя)
  const [withClinic, setWithClinic] = useState(false); // только с указанной клиникой (от себя)
  const [sortBy, setSortBy] = useState("date_desc"); // date_desc|date_asc|reviews_desc|articles_desc|name_asc|country_asc|likes_desc

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/patient-profile/doctors-for-patient`,
          { withCredentials: true },
        );

        // ✅ Берём из res.data.data
        if (res.data?.success && Array.isArray(res.data.data)) {
          setDoctors(res.data.data);
        } else {
          console.warn("⚠️ Пустой ответ или неправильный формат:", res.data);
          setDoctors([]);
        }
      } catch (e) {
        console.error("Ошибка при загрузке докторов:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Опции селектов
  const options = useMemo(() => {
    const specSet = new Set();
    doctors.forEach((d) => {
      if (d?.specialty) specSet.add(String(d.specialty).trim());
    });

    const toSorted = (it) =>
      Array.from(it)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, currentLang));

    return {
      countries: ["all", ...COUNTRIES],
      specializations: ["all", ...toSorted(specSet)],
    };
  }, [doctors, currentLang]);

  const resetFilters = () => {
    setNameQuery("");
    setClinicQuery("");
    setCountry("all");
    setSpecialization("all");
    setMinArticles(0);
    setWithPhoto(false);
    setWithClinic(false);
    setSortBy("date_desc");
  };

  // Фильтрация + сортировка
  const filtered = useMemo(() => {
    let list = [...doctors];

    // Поиск по имени + фамилии
    const qName = normalize(nameQuery);
    if (qName) {
      list = list.filter((d) => normalize(fullNameOf(d)).includes(qName));
    }

    // Доп. поиск по клинике и описанию (по словам)
    const qClinic = normalize(clinicQuery);
    if (qClinic) {
      list = list.filter((d) => {
        const hay =
          normalize(d?.clinic) + " " + normalize(stripHtml(d?.about || ""));
        return hay.includes(qClinic);
      });
    }

    // Страна
    if (country !== "all") {
      const qCountry = normalize(country);
      list = list.filter((d) => normalize(doctorCountry(d)) === qCountry);
    }

    // Специализация
    if (specialization !== "all") {
      const qSpec = normalize(specialization);
      list = list.filter(
        (d) => normalize(String(d?.specialty || "")) === qSpec,
      );
    }

    // Мин. кол-во статей
    if (minArticles > 0) {
      list = list.filter((d) => articlesCountOf(d) >= Number(minArticles));
    }

    // Только с фото
    if (withPhoto) {
      list = list.filter(
        (d) =>
          !!d?.profileImage &&
          !/\/uploads\/default\.png$/i.test(String(d.profileImage)),
      );
    }

    // Только с указанной клиникой
    if (withClinic) {
      list = list.filter((d) => !!(d?.clinic && String(d.clinic).trim()));
    }

    // Сортировка
    list.sort((A, B) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(A.createdAt) - new Date(B.createdAt);
        case "date_desc":
          return new Date(B.createdAt) - new Date(A.createdAt);
        case "rating_desc":
          return ratingOf(B) - ratingOf(A) || reviewsCountOf(B) - reviewsCountOf(A);
        case "reviews_desc":
          return reviewsCountOf(B) - reviewsCountOf(A);
        case "articles_desc":
          return articlesCountOf(B) - articlesCountOf(A);
        case "likes_desc":
          return likesCountOf(B) - likesCountOf(A);
        case "name_asc":
          return fullNameOf(A).localeCompare(fullNameOf(B), currentLang);
        case "country_asc":
          return doctorCountry(A).localeCompare(doctorCountry(B), currentLang);
        default:
          return 0;
      }
    });

    return list;
  }, [
    doctors,
    nameQuery,
    clinicQuery,
    country,
    specialization,
    minArticles,
    withPhoto,
    withClinic,
    sortBy,
    currentLang,
  ]);

  if (loading) {
    return (
      <div className="da-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <DAStyles />
        <div className="da-loading">
          <span className="da-spinner" />
          <span>{t("doctorsAll.loading")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="da-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <DAStyles />
        <div className="da-error" role="alert">
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
          <span>{t("doctorsAll.error")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="da-wrap" dir={isRTL ? "rtl" : "ltr"}>
      <DAStyles />

      {/* ── Hero header ── */}
      <div className="da-header">
        <div className="da-header-content">
          <div className="da-eyebrow">
            <span className="dot" />
            {t("doctorsAll.header.eyebrow")}
          </div>
          <h1 className="da-title">{t("doctorsAll.header.title")}</h1>
          <p className="da-subtitle">{t("doctorsAll.header.subtitle")}</p>
        </div>
        <div className="da-count-pill">
          <div className="da-count-icon">
            <IconUsers />
          </div>
          <div>
            <div className="da-count-num">{doctors.length}</div>
            <div className="da-count-label">
              {t("doctorsAll.header.totalLabel")}
            </div>
          </div>
        </div>
      </div>

      {/* ── Панель фильтров ── */}
      <div className="da-filters">
        <div className="da-filters-head">
          <span className="da-filters-title">
            <IconFilter />
            {t("doctorsAll.filters.title")}
          </span>
          <span className="da-found">
            {t("doctorsAll.filters.found")}
            <span className="da-found-badge">{filtered.length}</span>
          </span>
        </div>

        <div className="da-filters-grid">
          {/* Имя/Фамилия */}
          <div className="da-field">
            <label className="da-label">
              <IconSearch />
              {t("doctorsAll.filters.fields.name.label")}
            </label>
            <input
              type="text"
              className="da-input"
              placeholder={t("doctorsAll.filters.fields.name.placeholder")}
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
          </div>

          {/* Клиника/описание */}
          <div className="da-field">
            <label className="da-label">
              <IconSearch />
              {t("doctorsAll.filters.fields.clinic.label")}
            </label>
            <input
              type="text"
              className="da-input"
              placeholder={t("doctorsAll.filters.fields.clinic.placeholder")}
              value={clinicQuery}
              onChange={(e) => setClinicQuery(e.target.value)}
            />
          </div>

          {/* Страна */}
          <div className="da-field">
            <label className="da-label">
              <IconGlobe />
              {t("doctorsAll.filters.fields.country.label")}
            </label>
            <select
              className="da-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {options.countries.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? t("doctorsAll.filters.fields.country.all") : c}
                </option>
              ))}
            </select>
          </div>

          {/* Специализация */}
          <div className="da-field">
            <label className="da-label">
              {t("doctorsAll.filters.fields.specialty.label")}
            </label>
            <select
              className="da-select"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            >
              {options.specializations.map((s) => (
                <option key={s} value={s}>
                  {s === "all"
                    ? t("doctorsAll.filters.fields.specialty.all")
                    : s}
                </option>
              ))}
            </select>
          </div>

          {/* Мин. кол-во статей */}
          <div className="da-field">
            <label className="da-label">
              <IconArticle />
              {t("doctorsAll.filters.fields.minArticles.label")}
            </label>
            <input
              type="number"
              min={0}
              className="da-input"
              value={minArticles}
              onChange={(e) =>
                setMinArticles(Math.max(0, Number(e.target.value || 0)))
              }
            />
          </div>

          {/* Сортировка */}
          <div className="da-field">
            <label className="da-label">
              {t("doctorsAll.filters.fields.sort.label")}
            </label>
            <select
              className="da-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="rating_desc">
                {t("doctorsAll.filters.fields.sort.ratingDesc", {
                  defaultValue: "По рейтингу (сначала лучшие)",
                })}
              </option>
              <option value="date_desc">
                {t("doctorsAll.filters.fields.sort.dateDesc")}
              </option>
              <option value="date_asc">
                {t("doctorsAll.filters.fields.sort.dateAsc")}
              </option>
              <option value="reviews_desc">
                {t("doctorsAll.filters.fields.sort.reviewsDesc")}
              </option>
              <option value="articles_desc">
                {t("doctorsAll.filters.fields.sort.articlesDesc")}
              </option>
              <option value="likes_desc">
                {t("doctorsAll.filters.fields.sort.likesDesc")}
              </option>
              <option value="name_asc">
                {t("doctorsAll.filters.fields.sort.nameAsc")}
              </option>
              <option value="country_asc">
                {t("doctorsAll.filters.fields.sort.countryAsc")}
              </option>
            </select>
          </div>

          {/* Сброс */}
          <div className="da-field da-field-actions">
            <button
              type="button"
              className="da-reset-btn"
              onClick={resetFilters}
            >
              <IconReset />
              {t("doctorsAll.filters.reset")}
            </button>
          </div>
        </div>

        {/* Тогглы */}
        <div className="da-toggles">
          <label className="da-toggle">
            <input
              type="checkbox"
              checked={withPhoto}
              onChange={(e) => setWithPhoto(e.target.checked)}
            />
            <span className="da-toggle-check" />
            {t("doctorsAll.filters.toggles.withPhoto")}
          </label>
          <label className="da-toggle">
            <input
              type="checkbox"
              checked={withClinic}
              onChange={(e) => setWithClinic(e.target.checked)}
            />
            <span className="da-toggle-check" />
            {t("doctorsAll.filters.toggles.withClinic")}
          </label>
        </div>
      </div>

      {/* ── Сетка докторов ── */}
      <section className="da-grid">
        {filtered.length > 0 ? (
          filtered.map((doctor) => (
            <article
              key={doctor.profileId || doctor.doctorId}
              className="da-card"
            >
              <div className="da-photo-wrap">
                <img
                  src={doctor.profileImage || "/images/cover/1.jpg"}
                  alt={fullNameOf(doctor) || t("doctorsAll.card.altDoctor")}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/cover/1.jpg";
                  }}
                  className="da-photo"
                />
                <div className="da-photo-overlay" />
                <div className="da-specialty-badge">
                  {doctor.specialty || t("doctorsAll.card.specialtyFallback")}
                </div>
              </div>

              <div className="da-card-body">
                <Link
                  to={`/patient/doctor-details/${doctor.profileId}`}
                  className="da-name-link"
                >
                  <h3 className="da-name">
                    {fullNameOf(doctor) || t("doctorsAll.card.nameFallback")}
                  </h3>
                </Link>

                <div
                  className="da-about"
                  dangerouslySetInnerHTML={{
                    __html: sh(doctor.about || t("doctorsAll.card.aboutFallback"),)
                  }}
                />

                <div className="da-meta">
                  <div className="da-meta-row">
                    <IconClinic />
                    <span className="da-meta-label">
                      {t("doctorsAll.card.clinicLabel")}
                    </span>
                    {doctor.clinic ? (
                      <span className="da-meta-value">{doctor.clinic}</span>
                    ) : (
                      <span className="da-meta-empty">
                        {t("doctorsAll.card.clinicFallback")}
                      </span>
                    )}
                  </div>
                  <div className="da-meta-row">
                    <IconGlobe />
                    <span className="da-meta-label">
                      {t("doctorsAll.card.countryLabel")}
                    </span>
                    <span className="da-meta-value">
                      {displayCountry(doctor)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="da-stats">
                {ratingOf(doctor) > 0 && (
                  <span
                    className="da-stat rating"
                    title={t("doctorsAll.card.stats.ratingTitle", "Рейтинг")}
                    style={{ color: "#f59e0b", fontWeight: 700 }}
                  >
                    ⭐ {ratingOf(doctor).toFixed(1)}
                  </span>
                )}
                <span
                  className="da-stat date"
                  title={t("doctorsAll.card.stats.dateTitle")}
                >
                  <BsCalendar2DateFill />
                  {dateLocalized(doctor.createdAt)}
                </span>
                <span
                  className="da-stat reviews"
                  title={t("doctorsAll.card.stats.reviewsTitle")}
                >
                  <FaCommentDots />
                  {reviewsCountOf(doctor)}
                </span>
                <span
                  className="da-stat likes"
                  title={t("doctorsAll.card.stats.likesTitle")}
                >
                  <AiFillLike />
                  {likesCountOf(doctor)}
                </span>
                <Link
                  to={`/patient/doctors-articles/${doctor.profileId}`}
                  className="da-articles-link"
                >
                  <IconArticle />
                  {t("doctorsAll.card.stats.articles")}:{" "}
                  {articlesCountOf(doctor)}
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="da-empty">
            <div className="da-empty-icon">
              <IconUsers />
            </div>
            <div className="da-empty-title">{t("doctorsAll.empty.title")}</div>
            <div className="da-empty-text">{t("doctorsAll.empty.text")}</div>
          </div>
        )}
      </section>
    </div>
  );
}
