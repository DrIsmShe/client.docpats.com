import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import DoctorAIDashboardWidget from "../../../components/ai/DoctorAIDashboardWidget";
import {
  FaCalendarDay,
  FaCommentDots,
  FaNewspaper,
  FaUserNurse,
} from "react-icons/fa6";
import { AiFillLike } from "react-icons/ai";
import {
  FaUserMd,
  FaRegLightbulb,
  FaBell,
  FaArrowRight,
  FaExclamationTriangle,
  FaShieldAlt,
  FaCircle,
} from "react-icons/fa";
import {
  LuSquareUserRound,
  LuNewspaper,
  LuPencilLine,
  LuFlaskConical,
  LuFileText,
  LuGraduationCap,
  LuTarget,
  LuStethoscope,
  LuUsers,
  LuUserCheck,
  LuHospital,
  LuCalendarClock,
  LuCalendarPlus,
  LuMessagesSquare,
  LuActivity,
  LuTrendingUp,
} from "react-icons/lu";
import { HiOutlineSparkles } from "react-icons/hi2";
import { TbStethoscope } from "react-icons/tb";
import useCommentCountBulk from "../../../components/shared/useCommentCount";
import { useTranslation } from "react-i18next";

/* ─────────────── STYLES ─────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap');

  .hp {
    --accent:   #0ea5e9;
    --accent-2: #6366f1;
    --teal:     #0d9488;
    --success:  #059669;
    --danger:   #e11d48;
    --warn:     #f59e0b;
    --bg:       #f6f8fc;
    --bg-2:     #eef2f8;
    --surface:  #ffffff;
    --border:   #e2e8f0;
    --border-2: #cbd5e1;
    --text:     #0f172a;
    --sub:      #475569;
    --muted:    #94a3b8;
    --soft:     #f1f5f9;
    --f-head:   'Playfair Display', Georgia, serif;
    --f-body:   'Outfit', system-ui, sans-serif;
    font-family: var(--f-body);
    color: var(--text);
    background:
      radial-gradient(ellipse 800px 400px at 0% 0%, rgba(14,165,233,.04), transparent 60%),
      radial-gradient(ellipse 700px 400px at 100% 0%, rgba(99,102,241,.04), transparent 60%),
      var(--bg);
    background-attachment: fixed;
    min-height: 100vh;
  }

  .hp-wrap { padding: 32px 32px 56px; max-width: 1480px; margin: 0 auto; }
  @media (max-width: 768px) { .hp-wrap { padding: 18px 16px 40px; } }

  /* ─── HERO HEADER ─── */
  .hp-hero {
    background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 24px 28px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.03);
  }
  .hp-hero::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 320px; height: 100%;
    background: radial-gradient(circle at 100% 0%, rgba(99,102,241,.06), transparent 70%);
    pointer-events: none;
  }
  .hp-hero-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    position: relative;
  }
  /* Кнопки записи: собственная строка под приветствием — их должно
     быть видно раньше всего остального.
     flex + gap обязательны: без них две inline-flex кнопки встают
     вплотную друг к другу и читаются как один блок. */
  .hp-hero-cta {
    position: relative; margin-top: 18px;
    display: flex; flex-wrap: wrap; gap: 12px; align-items: stretch;
  }
  .hp-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 26px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    color: #fff !important;
    font-weight: 700;
    font-size: 16px;
    text-decoration: none;
    box-shadow: 0 8px 24px rgba(14,165,233,.28);
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .hp-cta-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 30px rgba(14,165,233,.36);
    color: #fff !important;
  }
  /* Второе действие — другая сущность, а не второй режим первого,
     поэтому и выглядит иначе: две одинаковые градиентные плашки рядом
     читаются как одна разрезанная кнопка. */
  .hp-cta-btn.is-secondary {
    background: #fff;
    color: var(--accent) !important;
    border: 1.5px solid rgba(14,165,233,.45);
    box-shadow: 0 4px 14px rgba(14,165,233,.14);
  }
  .hp-cta-btn.is-secondary:hover {
    color: var(--accent) !important;
    background: rgba(14,165,233,.06);
    box-shadow: 0 8px 20px rgba(14,165,233,.2);
  }
  .hp-cta-btn svg { width: 20px; height: 20px; }
  @media (max-width: 600px) {
    .hp-cta-btn { width: 100%; justify-content: center; }
  }
  .hp-greeting-block { display: flex; align-items: center; gap: 16px; min-width: 0; flex: 1; }
  .hp-avatar {
    width: 64px; height: 64px;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--f-head);
    font-weight: 600;
    font-size: 24px;
    flex-shrink: 0;
    box-shadow: 0 8px 24px rgba(14,165,233,.25), 0 0 0 4px rgba(14,165,233,.08);
    overflow: hidden;
    position: relative;
  }
  .hp-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .hp-avatar-online {
    position: absolute;
    bottom: 2px; right: 2px;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--success);
    border: 3px solid #fff;
    box-shadow: 0 0 8px rgba(5,150,105,.5);
  }
  .hp-greeting-text { display: flex; flex-direction: column; min-width: 0; }
  .hp-eyebrow {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: .15em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hp-title {
    font-family: var(--f-head);
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 600;
    color: var(--text);
    line-height: 1.15;
    letter-spacing: -.01em;
  }
  .hp-subtitle {
    font-size: 13px;
    color: var(--sub);
    margin-top: 4px;
  }

  .hp-status-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .hp-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 100px;
    letter-spacing: .02em;
  }
  .hp-pill.teal { color: var(--teal); background: rgba(13,148,136,.08); border: 1px solid rgba(13,148,136,.2); }
  .hp-pill.muted { color: var(--sub); background: var(--soft); border: 1px solid var(--border); }
  .hp-pill-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 6px currentColor;
    animation: hp-pulse 2.4s ease infinite;
  }
  @keyframes hp-pulse {
    0%,100% { opacity: 1; }
    50%      { opacity: .5; }
  }

  /* ─── INSIGHTS BANNER ─── */
  .hp-insights {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 14px 20px;
    margin-bottom: 24px;
    background: linear-gradient(135deg, rgba(14,165,233,.04), rgba(99,102,241,.04));
    border: 1px solid rgba(14,165,233,.18);
    border-radius: 14px;
    flex-wrap: wrap;
  }
  .hp-insights-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    box-shadow: 0 6px 14px rgba(14,165,233,.2);
  }
  .hp-insights-text { flex: 1; font-size: 13px; color: var(--sub); min-width: 200px; }
  .hp-insights-text strong { color: var(--text); font-weight: 600; }
  .hp-insights-divider {
    width: 1px; height: 16px;
    background: rgba(14,165,233,.2);
    display: inline-block;
    margin: 0 4px;
    vertical-align: middle;
  }

  /* ─── STATS GRID ─── */
  .hp-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  @media (max-width: 900px) { .hp-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 420px) { .hp-stats { grid-template-columns: 1fr; gap: 12px; } }

  .hp-stat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 22px 22px 20px;
    position: relative;
    overflow: hidden;
    transition: all .2s ease;
    box-shadow: 0 1px 2px rgba(15,23,42,.04);
  }
  .hp-stat:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(15,23,42,.06);
    border-color: var(--border-2);
  }
  .hp-stat-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .hp-stat-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    color: #fff;
    flex-shrink: 0;
  }
  .hp-stat-icon.s-blue  { background: linear-gradient(135deg, #0ea5e9, #38bdf8); }
  .hp-stat-icon.s-green { background: linear-gradient(135deg, #059669, #34d399); }
  .hp-stat-icon.s-rose  { background: linear-gradient(135deg, #e11d48, #fb7185); }
  .hp-stat-icon.s-teal  { background: linear-gradient(135deg, #0d9488, #2dd4bf); }
  .hp-stat-trend {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 100px;
    background: rgba(5,150,105,.08);
    color: var(--success);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .hp-stat-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    margin-bottom: 6px;
    letter-spacing: .02em;
  }
  .hp-stat-num {
    font-family: var(--f-head);
    font-size: clamp(28px, 3vw, 36px);
    font-weight: 600;
    line-height: 1;
    color: var(--text);
    letter-spacing: -.02em;
  }
  .hp-stat-bar {
    margin-top: 14px;
    height: 4px;
    border-radius: 4px;
    background: var(--soft);
    overflow: hidden;
    position: relative;
  }
  .hp-stat-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width .8s ease;
  }
  .hp-stat.s-blue  .hp-stat-bar-fill { background: linear-gradient(90deg, #0ea5e9, #38bdf8); }
  .hp-stat.s-green .hp-stat-bar-fill { background: linear-gradient(90deg, #059669, #34d399); }
  .hp-stat.s-rose  .hp-stat-bar-fill { background: linear-gradient(90deg, #e11d48, #fb7185); }
  .hp-stat.s-teal  .hp-stat-bar-fill { background: linear-gradient(90deg, #0d9488, #2dd4bf); }

  /* ─── SECTION ─── */
  .hp-section { margin-bottom: 28px; }
  .hp-section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 14px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .hp-section-title-block {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .hp-section-bar {
    width: 4px;
    height: 28px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .hp-section-bar.s-blue   { background: linear-gradient(180deg, #0ea5e9, #38bdf8); }
  .hp-section-bar.s-purple { background: linear-gradient(180deg, #6366f1, #a78bfa); }
  .hp-section-bar.s-rose   { background: linear-gradient(180deg, #e11d48, #fb7185); }
  .hp-section-bar.s-amber  { background: linear-gradient(180deg, #f59e0b, #fbbf24); }
  .hp-section-bar.s-teal   { background: linear-gradient(180deg, #0d9488, #2dd4bf); }
  .hp-section-bar.s-cyan   { background: linear-gradient(180deg, #06b6d4, #22d3ee); }
  .hp-section-text { display: flex; flex-direction: column; min-width: 0; }
  .hp-section-title {
    font-family: var(--f-head);
    font-size: 20px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -.01em;
    line-height: 1.1;
  }
  .hp-section-sub {
    font-size: 12px;
    color: var(--muted);
    margin-top: 2px;
  }
  .hp-section-meta {
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 4px 10px;
    border-radius: 100px;
    letter-spacing: .02em;
  }

  /* ─── NAV CARD GRID ─── */
  .hp-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }
  @media (max-width: 1100px) { .hp-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 768px)  { .hp-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 420px)  { .hp-grid { grid-template-columns: 1fr; } }

  .hp-nav {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 18px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    text-decoration: none !important;
    color: var(--text);
    cursor: pointer;
    transition: all .25s cubic-bezier(.4,0,.2,1);
    position: relative;
    overflow: hidden;
    min-width: 0;
    box-shadow: 0 1px 2px rgba(15,23,42,.04);
  }
  .hp-nav::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--c-glow, transparent);
    opacity: 0;
    transition: opacity .25s;
    pointer-events: none;
  }
  .hp-nav:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(15,23,42,.08);
    border-color: var(--border-2);
  }
  .hp-nav:hover::before { opacity: 1; }
  .hp-nav-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font-size: 19px;
    flex-shrink: 0;
    background: var(--c, var(--accent));
    box-shadow: 0 6px 14px var(--c-shadow, rgba(14,165,233,.25));
    transition: transform .25s cubic-bezier(.4,0,.2,1);
    position: relative;
    z-index: 1;
  }
  .hp-nav:hover .hp-nav-icon { transform: scale(1.06) rotate(-3deg); }

  .hp-nav.c-blue   { --c: linear-gradient(135deg,#0ea5e9,#38bdf8); --c-shadow: rgba(14,165,233,.25); --c-glow: radial-gradient(circle at 0% 0%, rgba(14,165,233,.06), transparent 60%); }
  .hp-nav.c-purple { --c: linear-gradient(135deg,#6366f1,#a78bfa); --c-shadow: rgba(99,102,241,.25); --c-glow: radial-gradient(circle at 0% 0%, rgba(99,102,241,.06), transparent 60%); }
  .hp-nav.c-cyan   { --c: linear-gradient(135deg,#06b6d4,#22d3ee); --c-shadow: rgba(6,182,212,.25); --c-glow: radial-gradient(circle at 0% 0%, rgba(6,182,212,.06), transparent 60%); }
  .hp-nav.c-green  { --c: linear-gradient(135deg,#059669,#34d399); --c-shadow: rgba(5,150,105,.25); --c-glow: radial-gradient(circle at 0% 0%, rgba(5,150,105,.06), transparent 60%); }
  .hp-nav.c-rose   { --c: linear-gradient(135deg,#e11d48,#fb7185); --c-shadow: rgba(225,29,72,.25); --c-glow: radial-gradient(circle at 0% 0%, rgba(225,29,72,.06), transparent 60%); }
  .hp-nav.c-amber  { --c: linear-gradient(135deg,#f59e0b,#fbbf24); --c-shadow: rgba(245,158,11,.25); --c-glow: radial-gradient(circle at 0% 0%, rgba(245,158,11,.06), transparent 60%); }
  .hp-nav.c-teal   { --c: linear-gradient(135deg,#0d9488,#2dd4bf); --c-shadow: rgba(13,148,136,.25); --c-glow: radial-gradient(circle at 0% 0%, rgba(13,148,136,.06), transparent 60%); }
  .hp-nav.c-violet { --c: linear-gradient(135deg,#8b5cf6,#c084fc); --c-shadow: rgba(139,92,246,.25); --c-glow: radial-gradient(circle at 0% 0%, rgba(139,92,246,.06), transparent 60%); }
  .hp-nav.c-pink   { --c: linear-gradient(135deg,#ec4899,#f472b6); --c-shadow: rgba(236,72,153,.25); --c-glow: radial-gradient(circle at 0% 0%, rgba(236,72,153,.06), transparent 60%); }
  .hp-nav.c-orange { --c: linear-gradient(135deg,#f97316,#fb923c); --c-shadow: rgba(249,115,22,.25); --c-glow: radial-gradient(circle at 0% 0%, rgba(249,115,22,.06), transparent 60%); }
  .hp-nav.c-indigo { --c: linear-gradient(135deg,#4f46e5,#6366f1); --c-shadow: rgba(79,70,229,.25); --c-glow: radial-gradient(circle at 0% 0%, rgba(79,70,229,.06), transparent 60%); }

  .hp-nav-text { display: flex; flex-direction: column; min-width: 0; flex: 1; position: relative; z-index: 1; }
  .hp-nav-title {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 4px;
  }
  .hp-nav-sub {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hp-nav-arrow {
    font-size: 12px;
    color: var(--muted);
    flex-shrink: 0;
    margin-top: 4px;
    opacity: 0;
    transition: all .2s;
  }
  .hp-nav:hover .hp-nav-arrow {
    opacity: 1;
    transform: translateX(2px);
    color: var(--text);
  }
  .hp-nav-badge {
    background: var(--danger);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    min-width: 22px;
    height: 22px;
    border-radius: 12px;
    padding: 0 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 4px;
    box-shadow: 0 2px 6px rgba(225,29,72,.3);
  }
  .hp-nav-badge.warn    { background: var(--warn); box-shadow: 0 2px 6px rgba(245,158,11,.3); }
  .hp-nav-badge.success { background: var(--success); box-shadow: 0 2px 6px rgba(5,150,105,.3); }
  .hp-nav-badge.info    { background: var(--accent); box-shadow: 0 2px 6px rgba(14,165,233,.3); }

  /* ─── TWO-COL ROW ─── */
  .hp-row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 28px;
  }
  @media (max-width: 900px) { .hp-row-2 { grid-template-columns: 1fr; } }

  /* ─── AI CARD ─── */
  .ai-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all .25s ease;
    box-shadow: 0 1px 3px rgba(15,23,42,.04);
  }
  .ai-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #0ea5e9, #6366f1, #22c55e);
  }
  .ai-card::after {
    content: '';
    position: absolute;
    top: -100px; right: -100px;
    width: 250px; height: 250px;
    background: radial-gradient(circle, rgba(99,102,241,.08), transparent 70%);
    pointer-events: none;
  }
  .ai-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(99,102,241,.12);
    border-color: rgba(99,102,241,.3);
  }
  .ai-card-header { display: flex; align-items: center; gap: 14px; position: relative; }
  .ai-card-icon {
    font-size: 22px;
    width: 44px; height: 44px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 12px;
    background: linear-gradient(135deg, #6366f1, #0ea5e9);
    color: #fff;
    box-shadow: 0 6px 16px rgba(99,102,241,.35);
  }
  .ai-card-title { font-weight: 600; font-size: 17px; color: var(--text); letter-spacing: -.01em; }
  .ai-card-subtitle { font-size: 12px; color: var(--muted); margin-top: 3px; }
  .ai-card-stats {
    margin-top: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    background: var(--soft);
    border-radius: 12px;
    border: 1px solid var(--border);
    position: relative;
  }
  .ai-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--sub);
  }
  .ai-stat-row strong { font-size: 18px; font-weight: 600; font-family: var(--f-head); }
  .ai-risk  { color: var(--danger); }
  .ai-alert { color: var(--warn); }
  .ai-card-link {
    margin-top: 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--accent);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    position: relative;
  }
  .ai-card:hover .ai-card-link { gap: 12px; }

  /* ─── ALERT FEED ─── */
  .hp-alerts {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 3px rgba(15,23,42,.04);
  }
  .hp-alerts-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 22px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(135deg, rgba(245,158,11,.05), rgba(239,68,68,.05));
  }
  .hp-alerts-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    color: #fff;
    font-size: 15px;
    flex-shrink: 0;
    box-shadow: 0 6px 14px rgba(245,158,11,.25);
  }
  .hp-alerts-title-block { flex: 1; }
  .hp-alerts-title {
    font-family: var(--f-head);
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.2;
  }
  .hp-alerts-subtitle { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .hp-alerts-count {
    font-family: var(--f-body);
    font-size: 12px;
    font-weight: 700;
    background: var(--danger);
    color: #fff;
    padding: 4px 10px;
    border-radius: 100px;
    box-shadow: 0 2px 6px rgba(225,29,72,.25);
  }
  .hp-alert-item {
    padding: 14px 22px;
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 14px;
    align-items: flex-start;
    transition: background .15s;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
  }
  .hp-alert-item:last-child { border-bottom: none; }
  .hp-alert-item:hover { background: #fffbf5; }
  .hp-alert-dot {
    width: 9px; height: 9px;
    border-radius: 50%;
    margin-top: 6px;
    flex-shrink: 0;
  }
  .hp-alert-dot.high { background: var(--danger); box-shadow: 0 0 0 3px rgba(225,29,72,.15); }
  .hp-alert-dot.med  { background: var(--warn);  box-shadow: 0 0 0 3px rgba(245,158,11,.15); }
  .hp-alert-body { flex: 1; min-width: 0; }
  .hp-alert-name { font-size: 14px; font-weight: 600; color: var(--text); }
  .hp-alert-reason {
    font-size: 12px;
    color: var(--sub);
    margin-top: 3px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .hp-alert-time {
    font-size: 10px;
    color: var(--muted);
    margin-top: 6px;
    letter-spacing: .04em;
    text-transform: uppercase;
    font-weight: 500;
  }
  .hp-alerts-empty {
    padding: 40px 24px;
    text-align: center;
    color: var(--muted);
    font-size: 13px;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .hp-alerts-empty-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    background: rgba(5,150,105,.08);
    color: var(--success);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    margin-bottom: 4px;
  }
  .hp-alerts-foot {
    padding: 12px 22px;
    border-top: 1px solid var(--border);
    text-align: right;
    background: var(--soft);
  }
  .hp-alerts-foot a {
    font-size: 12px;
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .hp-alerts-foot a:hover { gap: 6px; }

  /* ─── NEWS COLUMNS ─── */
  .hp-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  @media (max-width: 768px) { .hp-cols { grid-template-columns: 1fr; } }

  .hp-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(15,23,42,.04);
  }
  .hp-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px;
    border-bottom: 1px solid var(--border);
    gap: 10px;
    background: var(--soft);
  }
  .hp-card-head-left  { display: flex; align-items: center; gap: 10px; }
  .hp-card-head-right { display: flex; align-items: center; gap: 10px; }
  .hp-card-icon-wrap {
    width: 28px; height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
  }
  .hp-card-more {
    font-size: 12px;
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .hp-card-more:hover { gap: 6px; }
  .hp-card-title {
    font-family: var(--f-head);
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    flex: 1;
    min-width: 0;
    letter-spacing: -.01em;
  }
  .hp-card-badge {
    font-family: var(--f-body);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--muted);
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 3px 10px;
    border-radius: 100px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .hp-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 22px;
    text-decoration: none !important;
    border-bottom: 1px solid var(--border);
    transition: background .15s;
    position: relative;
  }
  .hp-item:last-child { border-bottom: none; }
  .hp-item:hover { background: var(--soft); }
  .hp-item::before {
    content: '';
    position: absolute;
    left: 0; top: 16%; bottom: 16%;
    width: 3px;
    background: var(--accent);
    border-radius: 0 3px 3px 0;
    transform: scaleY(0);
    transition: transform .2s ease;
  }
  .hp-item:hover::before { transform: scaleY(1); }
  .hp-item-img {
    width: 60px; height: 60px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    background: var(--bg);
    border: 1px solid var(--border);
    display: block;
  }
  .hp-item-body { flex: 1; min-width: 0; }
  .hp-item-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.4;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hp-item-preview {
    font-size: 12px;
    color: var(--sub);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .hp-item-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 8px;
    font-size: 11px;
    color: var(--muted);
  }
  .hp-item-meta span {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
  .hp-item-meta svg { margin-right: 2px; opacity: .7; }
  .hp-meta-author { font-weight: 600; color: var(--sub); }
  .hp-meta-category {
    background: rgba(99,102,241,.08);
    color: #4338ca;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .02em;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 768px) {
    .hp-item-meta { gap: 8px; }
    .hp-meta-category { max-width: 110px; }
  }
  @media (max-width: 480px) {
    .hp-item-meta { gap: 6px; font-size: 10px; }
    .hp-meta-category { display: none; }
    .hp-meta-author { max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
  }
  @media (max-width: 420px) {
    .hp-item { padding: 12px 16px; gap: 12px; }
    .hp-item-img { width: 48px; height: 48px; }
  }

  .hp-empty {
    padding: 48px 24px;
    text-align: center;
    color: var(--muted);
    font-size: 13px;
  }
  .hp-empty-icon { font-size: 32px; opacity: .25; margin-bottom: 10px; }

  /* ─── SKELETONS ─── */
  .hp-sk {
    background: linear-gradient(90deg, #eceef3 25%, #f5f7fa 50%, #eceef3 75%);
    background-size: 200% 100%;
    animation: hp-sk 1.4s ease infinite;
    border-radius: 8px;
  }
  @keyframes hp-sk {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .hp-sk-stat  { height: 130px; border-radius: 16px; }
  .hp-sk-nav   { height: 88px;  border-radius: 14px; }
  .hp-sk-card  { height: 280px; border-radius: 16px; }
  .hp-sk-row   { height: 18px; margin-bottom: 8px; }
  .hp-sk-hero  { height: 120px; border-radius: 20px; margin-bottom: 24px; }

  /* MODAL */
  .ai-modal {
    position: fixed;
    inset: 0;
    background: rgba(15,23,42,.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: hp-fade .2s ease;
  }
  @keyframes hp-fade { from { opacity: 0; } to { opacity: 1; } }
  .ai-modal-content {
    background: #fff;
    width: 95%;
    max-width: 1200px;
    max-height: 90vh;
    overflow: auto;
    border-radius: 16px;
    position: relative;
    box-shadow: 0 24px 64px rgba(0,0,0,.3);
  }
  .ai-modal-close {
    position: absolute;
    top: 14px; right: 14px;
    border: none;
    background: var(--soft);
    width: 36px; height: 36px;
    border-radius: 10px;
    font-size: 18px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .15s;
    z-index: 10;
  }
  .ai-modal-close:hover { background: var(--border); transform: scale(1.05); }
`;

/* ─────────────── HELPERS ─────────────── */
const greetByHour = (t) => {
  const h = new Date().getHours();
  if (h < 6)
    return t("doctor_home.greeting.night", { defaultValue: "Доброй ночи" });
  if (h < 12)
    return t("doctor_home.greeting.morning", { defaultValue: "Доброе утро" });
  if (h < 18)
    return t("doctor_home.greeting.day", { defaultValue: "Добрый день" });
  return t("doctor_home.greeting.evening", { defaultValue: "Добрый вечер" });
};

const initialsOf = (firstName, lastName) => {
  const a = (firstName || "").trim().charAt(0);
  const b = (lastName || "").trim().charAt(0);
  return (a + b).toUpperCase() || "👨‍⚕️";
};

const timeAgo = (date, t) => {
  if (!date) return "";
  const diffMs = Date.now() - new Date(date).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return t("doctor_home.time.now", { defaultValue: "только что" });
  if (min < 60)
    return `${min} ${t("doctor_home.time.min", { defaultValue: "мин назад" })}`;
  const h = Math.floor(min / 60);
  if (h < 24)
    return `${h} ${t("doctor_home.time.hour", { defaultValue: "ч назад" })}`;
  const d = Math.floor(h / 24);
  return `${d} ${t("doctor_home.time.day", { defaultValue: "дн назад" })}`;
};

const buildImgResolver = (apiBase, r2Base) => (path) => {
  const DEFAULT = `${r2Base}/uploads/default/default-patient-man.png`;
  if (!path) return DEFAULT;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  if (clean.startsWith("uploads/default/")) return `${r2Base}/${clean}`;
  return `${apiBase}/${clean}`;
};

/* Локализованная дата */
const todayLocalized = (lang) => {
  const map = {
    ru: "ru-RU",
    en: "en-US",
    tr: "tr-TR",
    az: "az-AZ",
    ar: "ar-SA",
  };
  return new Date().toLocaleDateString(map[lang] || "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/* ─────────────── NAV CARD ─────────────── */
function NavCard({
  to,
  onClick,
  icon: Icon,
  color,
  title,
  subtitle,
  badge,
  badgeKind,
  external,
}) {
  const inner = (
    <>
      <div className="hp-nav-icon">
        <Icon />
      </div>
      <div className="hp-nav-text">
        <div className="hp-nav-title">{title}</div>
        {subtitle && <div className="hp-nav-sub">{subtitle}</div>}
      </div>
      {badge != null && badge !== 0 && badge !== "" ? (
        <span className={`hp-nav-badge ${badgeKind || ""}`}>{badge}</span>
      ) : (
        <span className="hp-nav-arrow">
          <FaArrowRight />
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <div
        className={`hp-nav c-${color}`}
        role="button"
        tabIndex={0}
        onClick={onClick}
      >
        {inner}
      </div>
    );
  }
  if (external) {
    return (
      <a
        className={`hp-nav c-${color}`}
        href={to}
        target="_blank"
        rel="noopener noreferrer"
      >
        {inner}
      </a>
    );
  }
  return (
    <Link className={`hp-nav c-${color}`} to={to}>
      {inner}
    </Link>
  );
}

/* ─────────────── SECTION HEADER ─────────────── */
function SectionHead({ color, title, subtitle, count, countLabel }) {
  return (
    <div className="hp-section-head">
      <div className="hp-section-title-block">
        <div className={`hp-section-bar s-${color}`} />
        <div className="hp-section-text">
          <div className="hp-section-title">{title}</div>
          {subtitle && <div className="hp-section-sub">{subtitle}</div>}
        </div>
      </div>
      {count != null && (
        <span className="hp-section-meta">
          {count} {countLabel}
        </span>
      )}
    </div>
  );
}

/* ─────────────── NEWS COLUMN ─────────────── */
function NewsColumn({
  icon: Icon,
  title,
  badge,
  viewAllText,
  viewAllLink,
  detailLinkBase,
  articles,
  commentCounts,
  emptyText,
  fallbackTitle,
  fallbackPreview,
  unknownAuthor,
}) {
  return (
    <div className="hp-card">
      <div className="hp-card-head">
        <div className="hp-card-head-left">
          <div className="hp-card-icon-wrap">
            <Icon />
          </div>
          <span className="hp-card-title">{title}</span>
        </div>
        <div className="hp-card-head-right">
          <span className="hp-card-badge">{badge}</span>
          <Link to={viewAllLink} className="hp-card-more">
            {viewAllText} <FaArrowRight />
          </Link>
        </div>
      </div>

      {articles.length > 0 ? (
        articles.map((article) => (
          <Link
            key={article._id}
            to={`${detailLinkBase}/${article._id}`}
            className="hp-item"
          >
            <img
              className="hp-item-img"
              src={article.imageUrl || "/default-image.jpg"}
              alt={article.title}
              onError={(e) => (e.target.style.opacity = "0")}
            />
            <div className="hp-item-body">
              <div className="hp-item-title">
                {article.title || fallbackTitle}
              </div>
              <div className="hp-item-preview">
                {article.preview || fallbackPreview}
              </div>
              <div className="hp-item-meta">
                <span className="hp-meta-author">
                  <FaUserMd />
                  {[article.author?.firstName, article.author?.lastName]
                    .filter(Boolean)
                    .join(" ") || unknownAuthor}
                </span>
                {article.category?.name && (
                  <span className="hp-meta-category">
                    {article.category.name}
                  </span>
                )}
                <span>
                  <AiFillLike /> {article.likes?.length || 0}
                </span>
                <span>
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
          {emptyText}
        </div>
      )}
    </div>
  );
}

/* ─────────────── COMPONENT ─────────────── */
export default function ProfileDoctorHomePage() {
  const { t, i18n } = useTranslation("DoctorHomePage");
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();

  const [openAI, setOpenAI] = useState(false);

  // user/profile
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // articles
  const [articles, setArticles] = useState([]);
  const [scientificArticles, setScientificArticles] = useState([]);
  const [articleCount, setArticleCount] = useState(0);
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [patientStats, setPatientStats] = useState({
    totalPatients: 0,
    registeredPatients: 0,
    privatePatients: 0,
  });

  // AI / alerts
  const [aiStats, setAiStats] = useState(null);

  // optional widgets
  const [unreadCount, setUnreadCount] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const articleIds = useMemo(() => articles.map((a) => a._id), [articles]);
  const commentCounts = useCommentCountBulk(articleIds);

  const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
  const R2_BASE = (process.env.REACT_APP_R2_PUBLIC_URL || "").replace(
    /\/+$/,
    "",
  );
  const getImgUrl = useMemo(
    () => buildImgResolver(API_BASE, R2_BASE),
    [API_BASE, R2_BASE],
  );

  const userId = routeUserId || user?.userId;

  /* ── auth ── */
  useEffect(() => {
    const ctrl = new AbortController();
    axios
      .get(`${API_BASE}/common-for-user`, {
        withCredentials: true,
        signal: ctrl.signal,
      })
      .then((r) => {
        if (r.data?.authenticated) setUser(r.data.user);
      })
      .catch((e) => {
        if (e.name !== "CanceledError") console.error("auth", e);
      });
    return () => ctrl.abort();
  }, [API_BASE]);

  /* ── doctor profile ── */
  useEffect(() => {
    if (!userId) return;
    const ctrl = new AbortController();
    axios
      .get(`${API_BASE}/doctor-profile/get-profile-doctor/${userId}`, {
        withCredentials: true,
        signal: ctrl.signal,
      })
      .then((r) => setProfile(r.data?.profile || null))
      .catch((e) => {
        if (e.name !== "CanceledError") console.error("profile", e);
      });
    return () => ctrl.abort();
  }, [API_BASE, userId]);

  /* ── articles (regular) ── */
  useEffect(() => {
    const ctrl = new AbortController();
    axios
      .get(`${API_BASE}/doctor-profile/articles-all`, {
        withCredentials: true,
        signal: ctrl.signal,
        params: { page: 1, perPage: 3, sortBy: "date_desc", previewWords: 30 },
        headers: { "x-language": i18n.language || "ru" },
      })
      .then((r) =>
        setArticles(Array.isArray(r.data?.articles) ? r.data.articles : []),
      )
      .catch((e) => {
        if (e.name === "CanceledError") return;
        console.error(e);
        setError(
          t("doctor_home.errors.load_articles", {
            defaultValue: "Не удалось загрузить статьи",
          }),
        );
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [API_BASE, t, i18n.language]);

  /* ── articles (scientific) ── */
  useEffect(() => {
    const ctrl = new AbortController();
    axios
      .get(`${API_BASE}/doctor-profile/articles-scientific-all`, {
        withCredentials: true,
        signal: ctrl.signal,
        params: { page: 1, perPage: 3, sortBy: "date_desc", previewWords: 30 },
        headers: { "x-language": i18n.language || "ru" },
      })
      .then((r) =>
        setScientificArticles(
          Array.isArray(r.data?.articles) ? r.data.articles : [],
        ),
      )
      .catch((e) => {
        if (e.name !== "CanceledError") console.error(e);
      });
    return () => ctrl.abort();
  }, [API_BASE, i18n.language]);

  /* ── AI dashboard ── */
  useEffect(() => {
    const ctrl = new AbortController();
    axios
      .get(`${API_BASE}/ai/generate-clinical-summary/doctor-dashboard`, {
        withCredentials: true,
        signal: ctrl.signal,
      })
      .then((res) => setAiStats(res.data?.dashboard))
      .catch((e) => {
        if (e.name !== "CanceledError") console.error(e);
      });
    return () => ctrl.abort();
  }, [API_BASE]);

  /* ── platform counts ── */
  useEffect(() => {
    const ctrl = new AbortController();
    const cfg = { signal: ctrl.signal };

    Promise.all([
      axios.get(`${API_BASE}/doctor-profile/api/count-articles-today`, cfg),
      axios.get(
        `${API_BASE}/doctor-profile/api/count-scientific-articles-today`,
        cfg,
      ),
    ])
      .then(([reg, sci]) =>
        setArticleCount((reg.data?.count || 0) + (sci.data?.count || 0)),
      )
      .catch((e) => {
        if (e.name !== "CanceledError") console.error(e);
      });

    Promise.all([
      axios.get(`${API_BASE}/doctor-profile/api/count-all-articles`, cfg),
      axios.get(
        `${API_BASE}/doctor-profile/api/count-scientific-all-articles`,
        cfg,
      ),
    ])
      .then(([reg, sci]) =>
        setTotalArticles((reg.data?.count || 0) + (sci.data?.count || 0)),
      )
      .catch((e) => {
        if (e.name !== "CanceledError") console.error(e);
      });

    axios
      .get(`${API_BASE}/doctor-profile/api/count-all-doctors`, cfg)
      .then((r) => setTotalDoctors(r.data?.count || 0))
      .catch((e) => {
        if (e.name !== "CanceledError") console.error(e);
      });

    axios
      .get(`${API_BASE}/doctor-profile/api/count-all-patients`, {
        ...cfg,
        withCredentials: true,
      })
      .then((r) => {
        if (r.data?.success) setPatientStats(r.data.data);
      })
      .catch((e) => {
        if (e.name !== "CanceledError") console.error(e);
      });

    return () => ctrl.abort();
  }, [API_BASE]);

  /* ── unread chat count (graceful) ── */
  useEffect(() => {
    const ctrl = new AbortController();
    axios
      .get(`${API_BASE}/communication/unread-count`, {
        withCredentials: true,
        signal: ctrl.signal,
      })
      .then((r) => setUnreadCount(r.data?.count || 0))
      .catch((e) => {
        if (e.name !== "CanceledError" && e.response?.status !== 404) {
          console.warn("[unread] not available:", e?.message);
        }
      });
    return () => ctrl.abort();
  }, [API_BASE]);

  /* ── today appointments (graceful) ── */
  useEffect(() => {
    const ctrl = new AbortController();
    axios
      .get(`${API_BASE}/doctor-profile/api/appointments-today`, {
        withCredentials: true,
        signal: ctrl.signal,
      })
      .then((r) =>
        setTodayAppointments(
          r.data?.count ?? r.data?.appointments?.length ?? 0,
        ),
      )
      .catch((e) => {
        if (e.name !== "CanceledError" && e.response?.status !== 404) {
          console.warn("[appointments-today] not available:", e?.message);
        }
      });
    return () => ctrl.abort();
  }, [API_BASE]);

  /* ── ESC ── */
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") setOpenAI(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  /* ── derived ── */
  const today = useMemo(() => todayLocalized(i18n.language), [i18n.language]);
  const greeting = useMemo(() => greetByHour(t), [t]);

  const firstName = profile?.firstName || user?.firstName || "";
  const lastName = profile?.lastName || user?.lastName || "";

  const doctorName = useMemo(() => {
    const full = [firstName, lastName].filter(Boolean).join(" ");
    return full
      ? `${t("doctor_home.greeting.dr", { defaultValue: "д-р" })} ${full}`
      : "";
  }, [firstName, lastName, t]);

  const initials = useMemo(
    () => initialsOf(firstName, lastName),
    [firstName, lastName],
  );

  const avatarSrc = useMemo(
    () => (profile?.profileImage ? getImgUrl(profile.profileImage) : null),
    [profile, getImgUrl],
  );

  const alerts = useMemo(() => {
    const list = aiStats?.patientsWithAlerts || [];
    return list.slice(0, 4).map((p) => ({
      id: p._id || p.patientId || p.id,
      name:
        [p.firstName, p.lastName].filter(Boolean).join(" ") ||
        p.patientName ||
        t("doctor_home.alerts.unknown_patient", { defaultValue: "Пациент" }),
      reason:
        p.lastAlert?.reason ||
        p.alertReason ||
        p.summary ||
        t("doctor_home.alerts.no_reason", { defaultValue: "Тревожный сигнал" }),
      severity: p.lastAlert?.severity || p.severity || "med",
      time: p.lastAlert?.createdAt || p.updatedAt,
    }));
  }, [aiStats, t]);

  // Insight banner: aggregate the most actionable items
  const hasInsights =
    unreadCount > 0 ||
    (aiStats?.patientsWithAlerts?.length || 0) > 0 ||
    (todayAppointments != null && todayAppointments > 0);

  if (error) {
    return (
      <div className="hp">
        <style>{S}</style>
        <div className="hp-empty" style={{ marginTop: 40 }}>
          {error}
        </div>
      </div>
    );
  }

  /* ── skeleton ── */
  if (loading) {
    return (
      <div className="hp">
        <style>{S}</style>
        <div className="hp-wrap">
          <div className="hp-sk hp-sk-hero" />
          <div className="hp-stats">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="hp-sk hp-sk-stat" />
            ))}
          </div>
          <div className="hp-grid" style={{ marginBottom: 24 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="hp-sk hp-sk-nav" />
            ))}
          </div>
          <div className="hp-row-2">
            <div className="hp-sk hp-sk-card" />
            <div className="hp-sk hp-sk-card" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hp">
      <style>{S}</style>
      <div className="hp-wrap">
        {/* ─── HERO HEADER ─── */}
        <div className="hp-hero">
          <div className="hp-hero-row">
            <div className="hp-greeting-block">
              <div className="hp-avatar" aria-hidden>
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt=""
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  initials
                )}
                <span className="hp-avatar-online" />
              </div>
              <div className="hp-greeting-text">
                <div className="hp-eyebrow">
                  {greeting}
                  {doctorName ? `, ${doctorName}` : ""}
                </div>
                <div className="hp-title">
                  {t("doctor_home.title", { defaultValue: "Главная" })}
                </div>
                <div className="hp-subtitle">{today}</div>
              </div>
            </div>

            <div className="hp-status-row">
              <span className="hp-pill teal">
                <FaShieldAlt />
                {t("doctor_home.hipaa_compliant", {
                  defaultValue: "HIPAA Compliant",
                })}
              </span>
              <span className="hp-pill muted">
                <span
                  className="hp-pill-dot"
                  style={{ color: "var(--success)" }}
                />
                {t("doctor_home.online", { defaultValue: "Онлайн" })}
              </span>
              {totalDoctors > 0 && (
                <span className="hp-pill muted">
                  <LuUsers />
                  {totalDoctors}{" "}
                  {t("doctor_home.doctors_online", {
                    defaultValue: "врачей на платформе",
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Запись пациента — главное регистратурное действие врача.
              Крупной кнопкой прямо в шапке: к нему обращаются чаще, чем
              к любому другому разделу, а искать его в меню каждый раз —
              это лишние два клика на каждого пациента. */}
          <div className="hp-hero-cta">
            <Link to="/doctor/book-patient" className="hp-cta-btn">
              <LuCalendarPlus />
              {t("doctor_home.book_patient", {
                defaultValue: "Записать пациента на приём",
              })}
            </Link>
            {/* Второе регистратурное действие рядом с первым: операция
                или обследование назначаются оттуда же, откуда и приём. */}
            <Link to="/doctor/book-procedure" className="hp-cta-btn is-secondary">
              <LuCalendarPlus />
              {t("doctor_home.book_procedure", {
                defaultValue: "Записать на операцию или обследование",
              })}
            </Link>
          </div>
        </div>

        {/* ─── INSIGHTS BANNER ─── */}
        {hasInsights && (
          <div className="hp-insights">
            <div className="hp-insights-icon">
              <LuActivity />
            </div>
            <div className="hp-insights-text">
              <strong>
                {t("doctor_home.insights.label", {
                  defaultValue: "Сегодня требует внимания",
                })}
                :
              </strong>{" "}
              {[
                unreadCount > 0 && (
                  <span key="msg">
                    <strong>{unreadCount}</strong>{" "}
                    {t("doctor_home.insights.unread", {
                      defaultValue: "непрочитанных сообщений",
                    })}
                  </span>
                ),
                (aiStats?.patientsWithAlerts?.length || 0) > 0 && (
                  <span key="alerts">
                    <strong>{aiStats.patientsWithAlerts.length}</strong>{" "}
                    {t("doctor_home.insights.alerts", {
                      defaultValue: "пациентов с алертами",
                    })}
                  </span>
                ),
                todayAppointments != null && todayAppointments > 0 && (
                  <span key="appt">
                    <strong>{todayAppointments}</strong>{" "}
                    {t("doctor_home.insights.appointments", {
                      defaultValue: "приёмов запланировано",
                    })}
                  </span>
                ),
              ]
                .filter(Boolean)
                .reduce((acc, el, idx) => {
                  if (idx > 0)
                    acc.push(
                      <span className="hp-insights-divider" key={`d${idx}`} />,
                    );
                  acc.push(el);
                  return acc;
                }, [])}
            </div>
          </div>
        )}

        {/* ─── STATS ─── */}
        <div className="hp-stats">
          <div className="hp-stat">
            <div className="hp-stat-top">
              <div className="hp-stat-icon s-blue">
                <FaUserMd />
              </div>
              <span className="hp-stat-trend">
                <LuTrendingUp size={11} />
                {t("doctor_home.stats.active", { defaultValue: "активно" })}
              </span>
            </div>
            <div className="hp-stat-label">
              {t("doctor_home.stats.total_doctors", {
                defaultValue: "Всего врачей",
              })}
            </div>
            <div className="hp-stat-num">{totalDoctors}</div>
            <div className="hp-stat-bar s-blue">
              <div className="hp-stat-bar-fill" style={{ width: "78%" }} />
            </div>
          </div>

          <div className="hp-stat">
            <div className="hp-stat-top">
              <div className="hp-stat-icon s-green">
                <FaNewspaper />
              </div>
              {articleCount > 0 && (
                <span className="hp-stat-trend">
                  +{articleCount}{" "}
                  {t("doctor_home.stats.today_short", {
                    defaultValue: "сегодня",
                  })}
                </span>
              )}
            </div>
            <div className="hp-stat-label">
              {t("doctor_home.stats.total_articles", {
                defaultValue: "Всего статей",
              })}
            </div>
            <div className="hp-stat-num">{totalArticles}</div>
            <div className="hp-stat-bar s-green">
              <div className="hp-stat-bar-fill" style={{ width: "85%" }} />
            </div>
          </div>

          <div className="hp-stat">
            <div className="hp-stat-top">
              <div className="hp-stat-icon s-rose">
                <FaCalendarDay />
              </div>
            </div>
            <div className="hp-stat-label">
              {t("doctor_home.stats.today_articles", {
                defaultValue: "Статей сегодня",
              })}
            </div>
            <div className="hp-stat-num">{articleCount}</div>
            <div className="hp-stat-bar s-rose">
              <div
                className="hp-stat-bar-fill"
                style={{ width: articleCount > 0 ? "60%" : "10%" }}
              />
            </div>
          </div>

          <div className="hp-stat">
            <div className="hp-stat-top">
              <div className="hp-stat-icon s-teal">
                <FaUserNurse />
              </div>
              <span className="hp-stat-trend">
                <LuTrendingUp size={11} />
                {t("doctor_home.stats.growth", { defaultValue: "рост" })}
              </span>
            </div>
            <div className="hp-stat-label">
              {t("doctor_home.stats.total_patients", {
                defaultValue: "Всего пациентов",
              })}
            </div>
            <div className="hp-stat-num">{patientStats.totalPatients}</div>
            <div className="hp-stat-bar s-teal">
              <div className="hp-stat-bar-fill" style={{ width: "92%" }} />
            </div>
          </div>
        </div>

        {/* ─── AI CARD + ALERT FEED ─── */}
        <div className="hp-row-2">
          <div
            className="ai-card"
            onClick={() => setOpenAI(true)}
            role="button"
            tabIndex={0}
          >
            <div className="ai-card-header">
              <div className="ai-card-icon">
                <HiOutlineSparkles />
              </div>
              <div>
                <div className="ai-card-title">
                  {t("doctor_home.ai.title", {
                    defaultValue: "AI Practice Analytics",
                  })}
                </div>
                <div className="ai-card-subtitle">
                  {t("doctor_home.ai.subtitle", {
                    defaultValue: "Клинический интеллект для ваших пациентов",
                  })}
                </div>
              </div>
            </div>

            <div className="ai-card-stats">
              <div className="ai-stat-row">
                <span>
                  {t("doctor_home.ai.high_risk", {
                    defaultValue: "Пациенты высокого риска",
                  })}
                </span>
                <strong className="ai-risk">
                  {aiStats?.highRiskPatients?.length || 0}
                </strong>
              </div>
              <div className="ai-stat-row">
                <span>
                  {t("doctor_home.ai.active_alerts", {
                    defaultValue: "Активные алерты",
                  })}
                </span>
                <strong className="ai-alert">
                  {aiStats?.patientsWithAlerts?.length || 0}
                </strong>
              </div>
            </div>

            <div className="ai-card-link">
              {t("doctor_home.ai.open", { defaultValue: "Открыть дашборд" })}
              <FaArrowRight />
            </div>
          </div>

          <div className="hp-alerts">
            <div className="hp-alerts-head">
              <div className="hp-alerts-icon">
                <FaBell />
              </div>
              <div className="hp-alerts-title-block">
                <div className="hp-alerts-title">
                  {t("doctor_home.alerts.title", {
                    defaultValue: "Тревожные сигналы",
                  })}
                </div>
                <div className="hp-alerts-subtitle">
                  {t("doctor_home.alerts.subtitle", {
                    defaultValue: "Пациенты, требующие внимания",
                  })}
                </div>
              </div>
              {alerts.length > 0 && (
                <span className="hp-alerts-count">{alerts.length}</span>
              )}
            </div>

            {alerts.length > 0 ? (
              <>
                {alerts.map((a) => (
                  <div
                    key={a.id || `${a.name}-${a.time}`}
                    className="hp-alert-item"
                    onClick={() =>
                      a.id && navigate(`/dp/patient-detail/${a.id}`)
                    }
                  >
                    <div
                      className={`hp-alert-dot ${a.severity === "high" ? "high" : "med"}`}
                    />
                    <div className="hp-alert-body">
                      <div className="hp-alert-name">{a.name}</div>
                      <div className="hp-alert-reason">{a.reason}</div>
                      {a.time && (
                        <div className="hp-alert-time">
                          {timeAgo(a.time, t)}
                        </div>
                      )}
                    </div>
                    <FaExclamationTriangle
                      style={{
                        color: "var(--warn)",
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                  </div>
                ))}
                <div className="hp-alerts-foot">
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenAI(true);
                    }}
                  >
                    {t("doctor_home.alerts.view_all", {
                      defaultValue: "Все сигналы",
                    })}
                    <FaArrowRight />
                  </a>
                </div>
              </>
            ) : (
              <div className="hp-alerts-empty">
                <div className="hp-alerts-empty-icon">✓</div>
                <div>
                  {t("doctor_home.alerts.empty", {
                    defaultValue: "Нет активных тревожных сигналов",
                  })}
                </div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {t("doctor_home.alerts.empty_sub", {
                    defaultValue: "Все пациенты под контролем",
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── СЕКЦИЯ: КЛИНИКА (приоритет — самые actionable элементы) ─── */}
        <div className="hp-section">
          <SectionHead
            color="cyan"
            title={t("my_clinic", { defaultValue: "Клиника" })}
            subtitle={t("doctor_home.sections.clinic_sub", {
              defaultValue: "Ежедневная работа с пациентами",
            })}
          />
          <div className="hp-grid">
            <NavCard
              to="/doctor/communication"
              icon={LuMessagesSquare}
              color="blue"
              title={t("chat", { defaultValue: "Чат" })}
              subtitle={t("doctor_home.nav.chat_sub", {
                defaultValue: "Сообщения с пациентами",
              })}
              badge={
                unreadCount > 0
                  ? unreadCount > 99
                    ? "99+"
                    : unreadCount
                  : null
              }
            />
            <NavCard
              onClick={() => navigate("doctor-dashboard-main")}
              icon={LuCalendarClock}
              color="green"
              title={t("appointments_dashboard", {
                defaultValue: "Расписание",
              })}
              subtitle={
                todayAppointments !== null && todayAppointments > 0
                  ? t("doctor_home.nav.appointments_today", {
                      count: todayAppointments,
                      defaultValue: "Сегодня: {{count}}",
                    })
                  : t("doctor_home.nav.appointments_sub", {
                      defaultValue: "Записи на приём",
                    })
              }
              badge={todayAppointments || null}
              badgeKind="success"
            />
            <NavCard
              to="/dp/polyclinic"
              icon={LuHospital}
              color="cyan"
              title={t("my_clinic", { defaultValue: "Поликлиника" })}
              subtitle={t("doctor_home.nav.clinic_sub", {
                defaultValue: "Управление клиникой",
              })}
            />
            <NavCard
              to={`/doctor/doctor-profile/${userId}`}
              icon={LuSquareUserRound}
              color="indigo"
              title={t("profile", { defaultValue: "Профиль" })}
              subtitle={t("doctor_home.nav.profile_sub", {
                defaultValue: "Мой кабинет",
              })}
            />
          </div>
        </div>

        {/* ─── СЕКЦИЯ: ОБУЧЕНИЕ ─── */}
        <div className="hp-section">
          <SectionHead
            color="amber"
            title={t("education", { defaultValue: "Обучение" })}
            subtitle={t("doctor_home.sections.education_sub", {
              defaultValue: "Подготовка к экзаменам и тесты",
            })}
          />
          <div className="hp-grid">
            <NavCard
              to="/education"
              icon={LuGraduationCap}
              color="amber"
              title={t("education_prep", {
                defaultValue: "Подготовка к экзаменам",
              })}
              subtitle={t("doctor_home.nav.education_sub", {
                defaultValue: "Тренировка, пробные экзамены, блоки",
              })}
            />
            {/* Тренажёр диагностики — учебные случаи: снимки, анализы,
                виртуальный пациент. Стоит в «Обучении», а не рядом со
                «Вторым мнением», хотя названия похожи: там выдуманные
                кейсы, здесь материалы живого пациента, и путать их нельзя. */}
            <NavCard
              to="/arena"
              icon={LuTarget}
              color="amber"
              title={t("doctor_home.nav.arena", {
                defaultValue: "Тренажёр диагностики",
              })}
              subtitle={t("doctor_home.nav.arena_sub", {
                defaultValue: "Снимки, анализы, виртуальный пациент",
              })}
            />
          </div>
        </div>

        {/* ─── СЕКЦИЯ: AI ДАЙДЖЕСТ ─── */}
        <div className="hp-section">
          <SectionHead
            color="purple"
            title={t("digestAi", { defaultValue: "AI Дайджест" })}
            subtitle={t("doctor_home.sections.ai_sub", {
              defaultValue: "Интеллектуальные инструменты",
            })}
          />
          <div className="hp-grid">
            <NavCard
              to="/public/user-synthesis"
              external
              icon={HiOutlineSparkles}
              color="violet"
              title={t("aiSynthesis", { defaultValue: "AI Синтез" })}
              subtitle={t("doctor_home.nav.ai_synthesis_sub", {
                defaultValue: "Синтез данных пациента",
              })}
            />
            <NavCard
              to="/doctor/news"
              icon={LuNewspaper}
              color="cyan"
              title={t("medical_feed", { defaultValue: "Лента новостей" })}
              subtitle={t("doctor_home.nav.feed_sub", {
                defaultValue: "Медицинские публикации",
              })}
            />
            <NavCard
              to="/doctor/consultation-ai"
              icon={TbStethoscope}
              color="purple"
              title={t("ai_medical_consultation", {
                defaultValue: "AI Консультация",
              })}
              subtitle={t("doctor_home.nav.consult_sub", {
                defaultValue: "Диагностический помощник",
              })}
            />
            {/* Второе мнение — материалы РЕАЛЬНОГО пациента. Стоит среди
                клинических инструментов, а не в «Обучении»: врач не должен
                путать разбор своего пациента с тренажёром. */}
            <NavCard
              to="/diagnostics"
              icon={LuStethoscope}
              color="violet"
              title={t("doctor_home.nav.second_opinion", {
                defaultValue: "Второе мнение",
              })}
              subtitle={t("doctor_home.nav.second_opinion_sub", {
                defaultValue: "Разбор материалов пациента",
              })}
            />
            <NavCard
              onClick={() => setOpenAI(true)}
              icon={FaRegLightbulb}
              color="indigo"
              title={t("doctor_home.nav.ai_analytics", {
                defaultValue: "AI-аналитика",
              })}
              subtitle={t("doctor_home.nav.ai_analytics_sub", {
                defaultValue: "Клинические сводки",
              })}
              badge={aiStats?.patientsWithAlerts?.length || 0}
              badgeKind="warn"
            />
          </div>
        </div>

        {/* ─── СЕКЦИЯ: ПУБЛИКАЦИИ ─── */}
        <div className="hp-section">
          <SectionHead
            color="rose"
            title={t("doctor_home.sections.publications", {
              defaultValue: "Публикации",
            })}
            subtitle={t("doctor_home.sections.publications_sub", {
              defaultValue: "Статьи и научные работы",
            })}
            count={totalArticles}
            countLabel={t("doctor_home.sections.total", {
              defaultValue: "всего",
            })}
          />
          <div className="hp-grid">
            <NavCard
              to="/doctor/create-my-articles"
              icon={LuPencilLine}
              color="rose"
              title={t("create_article", { defaultValue: "Новая статья" })}
              subtitle={t("doctor_home.nav.create_sub", {
                defaultValue: "Опубликовать материал",
              })}
            />
            <NavCard
              to="/doctor/my-articles"
              icon={LuFileText}
              color="pink"
              title={t("my_articles", { defaultValue: "Мои статьи" })}
              subtitle={t("doctor_home.nav.my_articles_sub", {
                defaultValue: "Мои публикации",
              })}
            />
            <NavCard
              to="/doctor/create-my-articles-scientific"
              icon={LuFlaskConical}
              color="amber"
              title={t("create_scientific_article", {
                defaultValue: "Научная работа",
              })}
              subtitle={t("doctor_home.nav.create_sci_sub", {
                defaultValue: "Создать научную статью",
              })}
            />
            <NavCard
              to="/doctor/my-articles-scientific"
              icon={LuGraduationCap}
              color="orange"
              title={t("my_scientific_articles", {
                defaultValue: "Мои научные",
              })}
              subtitle={t("doctor_home.nav.my_sci_sub", {
                defaultValue: "Научные публикации",
              })}
            />
          </div>
        </div>

        {/* ─── СЕКЦИЯ: КОЛЛЕГИ ─── */}
        <div className="hp-section">
          <SectionHead
            color="teal"
            title={t("colleagues", { defaultValue: "Коллеги" })}
            subtitle={t("doctor_home.sections.colleagues_sub", {
              defaultValue: "Сообщество врачей",
            })}
            count={totalDoctors}
            countLabel={t("doctor_home.sections.doctors", {
              defaultValue: "врачей",
            })}
          />
          <div className="hp-grid">
            <NavCard
              to="/doctor/all-doctors"
              icon={LuUsers}
              color="teal"
              title={t("colleagues", { defaultValue: "Все коллеги" })}
              subtitle={t("doctor_home.nav.colleagues_sub", {
                defaultValue: "Все врачи платформы",
              })}
            />
            <NavCard
              to="/doctor/my-friends-doctors"
              icon={LuUserCheck}
              color="green"
              title={t("my_friends_colleagues", {
                defaultValue: "Мои контакты",
              })}
              subtitle={t("doctor_home.nav.friends_sub", {
                defaultValue: "Друзья и коллеги",
              })}
            />
          </div>
        </div>

        {/* ─── AI MODAL ─── */}
        {openAI && (
          <div className="ai-modal" onClick={() => setOpenAI(false)}>
            <div
              className="ai-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="ai-modal-close"
                onClick={() => setOpenAI(false)}
                aria-label={t("close", { defaultValue: "Закрыть" })}
              >
                ✕
              </button>
              <DoctorAIDashboardWidget />
            </div>
          </div>
        )}

        {/* ─── НОВОСТИ ─── */}
        <div className="hp-section" style={{ marginBottom: 0 }}>
          <SectionHead
            color="blue"
            title={t("doctor_home.sections.feed", {
              defaultValue: "Лента дня",
            })}
            subtitle={t("doctor_home.sections.feed_sub", {
              defaultValue: "Свежие материалы платформы",
            })}
          />
          <div className="hp-cols">
            <NewsColumn
              icon={FaNewspaper}
              title={t("doctor_home.news.title", { defaultValue: "Новости" })}
              badge={t("doctor_home.news.today", { defaultValue: "Сегодня" })}
              viewAllText={t("doctor_home.news.view_all", {
                defaultValue: "Все",
              })}
              viewAllLink="/doctor/all-articles-here"
              detailLinkBase="/doctor/article-detail"
              articles={articles}
              commentCounts={commentCounts}
              emptyText={t("doctor_home.news.no_articles", {
                defaultValue: "Пока нет статей",
              })}
              fallbackTitle={t("doctor_home.news.item.no_title", {
                defaultValue: "Без названия",
              })}
              fallbackPreview={t("doctor_home.news.item.no_preview", {
                defaultValue: "Нет описания",
              })}
              unknownAuthor={t("doctor_home.news.item.unknown_author", {
                defaultValue: "Автор неизвестен",
              })}
            />
            <NewsColumn
              icon={LuFlaskConical}
              title={t("doctor_home.news.scientific_articles", {
                defaultValue: "Научные статьи",
              })}
              badge={t("doctor_home.news.today", { defaultValue: "Сегодня" })}
              viewAllText={t("doctor_home.news.view_all", {
                defaultValue: "Все",
              })}
              viewAllLink="/doctor/all-articles-scientific-here"
              detailLinkBase="/doctor/article-scientific-detail"
              articles={scientificArticles}
              commentCounts={commentCounts}
              emptyText={t("doctor_home.news.no_articles", {
                defaultValue: "Пока нет статей",
              })}
              fallbackTitle={t("doctor_home.news.item.no_title", {
                defaultValue: "Без названия",
              })}
              fallbackPreview={t("doctor_home.news.item.no_preview", {
                defaultValue: "Нет описания",
              })}
              unknownAuthor={t("doctor_home.news.item.unknown_author", {
                defaultValue: "Автор неизвестен",
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
