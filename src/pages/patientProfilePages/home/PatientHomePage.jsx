import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --ink:     #0d1117;
    --ink2:    #1c2333;
    --ink3:    #253047;
    --gold:    #c9a84c;
    --gold2:   #e8c97a;
    --teal:    #0fbcb0;
    --teal2:   #38e8e0;
    --rose:    #e11d48;
    --violet:  #7c3aed;
    --ice:     #e8f4f8;
    --surface: #ffffff;
    --border:  rgba(13,17,23,.09);
    --border2: rgba(13,17,23,.05);
    --muted:   #6b7a99;
    --sub:     #9aa3b5;
    --f-head:  'Fraunces', Georgia, serif;
    --f-body:  'Instrument Sans', system-ui, sans-serif;
    --f-mono:  'JetBrains Mono', monospace;
    --radius:  18px;
    --shadow:  0 2px 24px rgba(13,17,23,.07);
    --shadow2: 0 8px 48px rgba(13,17,23,.12);
  }

  .hp {
    font-family: var(--f-body);
    color: var(--ink);
    background: #f4f6fa;
    min-height: 100vh;
    background-image:
      radial-gradient(ellipse 900px 600px at 70% -10%, rgba(201,168,76,.07) 0%, transparent 70%),
      radial-gradient(ellipse 600px 400px at 10% 80%, rgba(15,188,176,.06) 0%, transparent 70%);
  }

  .hp-wrap { max-width: 1060px; margin: 0 auto; padding: 36px 28px 64px; }
  @media (max-width: 640px) { .hp-wrap { padding: 20px 16px 48px; } }

  /* ── TOPBAR ── */
  .hp-topbar {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 18px; gap: 12px; flex-wrap: wrap;
  }
  .hp-topbar-right { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .hp-eyebrow {
    font-family: var(--f-mono); font-size: 10px;
    letter-spacing: .18em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 6px;
  }
  .hp-title {
    font-family: var(--f-head); font-size: clamp(26px, 3vw, 38px);
    font-weight: 300; font-style: italic; color: var(--ink);
    line-height: 1.1; letter-spacing: -.01em;
  }
  .hp-title strong { font-weight: 600; font-style: normal; color: var(--ink); }
  .hp-datebox { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
  .hp-date {
    font-family: var(--f-mono); font-size: 11px;
    color: var(--muted); letter-spacing: .04em;
  }
  .hp-status {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--f-mono); font-size: 10px;
    letter-spacing: .08em; color: var(--teal); text-transform: uppercase;
  }
  .hp-status::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%;
    background: var(--teal); animation: hp-pulse 2.4s ease infinite;
  }
  @keyframes hp-pulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50%      { opacity: .5; transform: scale(.75); }
  }

  .hp-office-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-radius: 12px;
    background: var(--ink); color: var(--ice) !important;
    font-family: var(--f-mono); font-size: 10.5px;
    letter-spacing: .1em; text-transform: uppercase;
    text-decoration: none !important;
    transition: transform .2s, background .2s, box-shadow .2s;
    border: 1px solid var(--ink2); white-space: nowrap;
  }
  .hp-office-btn:hover {
    transform: translateY(-2px); background: var(--ink2);
    box-shadow: 0 4px 18px rgba(13,17,23,.18);
  }
  .hp-office-btn-icon { font-size: 13px; }

  /* ── GREETING ── */
  .hp-greet {
    font-family: var(--f-head); font-size: clamp(20px, 2.4vw, 28px);
    font-weight: 400; font-style: italic; color: var(--ink);
    margin-bottom: 24px; line-height: 1.2;
    opacity: 0; animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .04s forwards;
  }
  .hp-greet strong { font-style: normal; font-weight: 600; color: var(--gold); }

  /* ── SEARCH ── */
  .hp-search-wrap {
    display: flex; align-items: center; gap: 10px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 14px 18px;
    margin-bottom: 24px; box-shadow: var(--shadow);
    transition: border-color .2s, box-shadow .2s;
    opacity: 0; animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .08s forwards;
  }
  .hp-search-wrap:focus-within {
    border-color: rgba(201,168,76,.5);
    box-shadow: 0 4px 24px rgba(201,168,76,.12);
  }
  .hp-search-icon { font-size: 17px; color: var(--sub); flex-shrink: 0; }
  .hp-search-input {
    flex: 1; border: none; outline: none; background: transparent;
    font-family: var(--f-body); font-size: 14px;
    color: var(--ink); padding: 2px 0;
  }
  .hp-search-input::placeholder { color: var(--sub); }
  .hp-search-kbd {
    font-family: var(--f-mono); font-size: 9px;
    letter-spacing: .08em; color: var(--sub);
    background: var(--ice); border: 1px solid var(--border);
    padding: 3px 8px; border-radius: 6px; text-transform: uppercase;
  }

  /* ── HERO ── */
  .hp-hero {
    display: grid; grid-template-columns: 1.4fr 1fr;
    gap: 16px; margin-bottom: 24px;
    opacity: 0; animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .14s forwards;
  }
  @media (max-width: 720px) { .hp-hero { grid-template-columns: 1fr; } }

  .hp-hero-card {
    background: var(--surface); border-radius: var(--radius);
    border: 1px solid var(--border); box-shadow: var(--shadow);
    padding: 22px 24px; position: relative; overflow: hidden;
    text-decoration: none !important; color: inherit;
    display: flex; flex-direction: column; gap: 14px;
    transition: transform .2s, box-shadow .2s;
  }
  .hp-hero-card:hover { transform: translateY(-3px); box-shadow: var(--shadow2); }

  .hp-hero-appt {
    background: linear-gradient(135deg, var(--ink) 0%, var(--ink2) 100%);
    color: var(--ice); border-color: var(--ink2);
  }
  .hp-hero-appt::after {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(201,168,76,.18) 0%, transparent 70%);
    pointer-events: none;
  }
  .hp-hero-empty { background: var(--surface); }

  .hp-hero-tag {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--f-mono); font-size: 9px;
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--gold); z-index: 1;
  }
  .hp-hero-tag::before {
    content: ''; width: 5px; height: 5px;
    border-radius: 50%; background: var(--gold);
  }
  .hp-hero-empty .hp-hero-tag { color: var(--sub); }
  .hp-hero-empty .hp-hero-tag::before { background: var(--sub); }

  .hp-hero-when {
    font-family: var(--f-head); font-size: clamp(22px, 2.4vw, 30px);
    font-weight: 600; line-height: 1.1; z-index: 1;
  }
  .hp-hero-empty .hp-hero-when { color: var(--ink); }

  .hp-hero-meta { display: flex; align-items: center; gap: 12px; z-index: 1; flex-wrap: wrap; }
  .hp-hero-doctor { display: flex; align-items: center; gap: 10px; }
  .hp-hero-avatar {
    width: 38px; height: 38px; border-radius: 12px;
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold2) 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--f-head); font-weight: 600; font-size: 14px;
    color: var(--ink); flex-shrink: 0;
  }
  .hp-hero-doctor-info { line-height: 1.25; }
  .hp-hero-doctor-name { font-size: 13px; font-weight: 600; }
  .hp-hero-doctor-spec { font-size: 11px; opacity: .65; font-family: var(--f-mono); }

  .hp-hero-actions { display: flex; gap: 8px; margin-top: auto; z-index: 1; flex-wrap: wrap; }
  .hp-hero-btn {
    flex: 1; min-width: 80px; padding: 9px 12px;
    border-radius: 10px; font-family: var(--f-mono);
    font-size: 10px; letter-spacing: .08em; text-transform: uppercase;
    text-align: center; text-decoration: none !important;
    transition: transform .15s, background .15s; cursor: pointer; border: none;
  }
  .hp-hero-btn-primary { background: var(--gold); color: var(--ink); }
  .hp-hero-btn-primary:hover { background: var(--gold2); transform: translateY(-1px); }
  .hp-hero-btn-ghost {
    background: rgba(255,255,255,.08); color: var(--ice);
    border: 1px solid rgba(255,255,255,.15);
  }
  .hp-hero-btn-ghost:hover { background: rgba(255,255,255,.14); }

  .hp-hero-ai {
    background: linear-gradient(135deg, rgba(15,188,176,.08) 0%, rgba(124,58,237,.06) 100%);
    border-color: rgba(15,188,176,.2);
  }
  .hp-hero-ai .hp-hero-tag { color: var(--teal); }
  .hp-hero-ai .hp-hero-tag::before { background: var(--teal); }
  .hp-hero-ai-title {
    font-family: var(--f-head); font-size: 19px;
    font-weight: 600; color: var(--ink); line-height: 1.25; z-index: 1;
  }
  .hp-hero-ai-sub { font-size: 13px; color: var(--muted); line-height: 1.55; z-index: 1; }
  .hp-hero-ai-input { display: flex; gap: 8px; z-index: 1; margin-top: auto; }
  .hp-hero-ai-textbox {
    flex: 1; padding: 11px 14px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface);
    font-family: var(--f-body); font-size: 13px; outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .hp-hero-ai-textbox:focus {
    border-color: var(--teal);
    box-shadow: 0 0 0 3px rgba(15,188,176,.12);
  }
  .hp-hero-ai-go {
    padding: 11px 16px; border-radius: 10px;
    background: var(--teal); color: white; border: none;
    cursor: pointer; font-size: 14px; font-weight: 600;
    transition: background .15s, transform .15s;
  }
  .hp-hero-ai-go:hover { background: #0aa39a; transform: translateY(-1px); }

  /* ── PROFILE COMPLETENESS ── */
  .hp-profile {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 18px;
    background: linear-gradient(90deg, rgba(201,168,76,.08) 0%, rgba(201,168,76,.02) 100%);
    border: 1px solid rgba(201,168,76,.2); border-radius: 14px;
    margin-bottom: 24px;
    opacity: 0; animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .2s forwards;
  }
  .hp-profile-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: rgba(201,168,76,.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
  }
  .hp-profile-body { flex: 1; min-width: 0; }
  .hp-profile-text { font-size: 13px; color: var(--ink); margin-bottom: 6px; font-weight: 500; }
  .hp-profile-text strong { color: var(--gold); }
  .hp-profile-bar { height: 4px; background: rgba(201,168,76,.15); border-radius: 2px; overflow: hidden; }
  .hp-profile-fill {
    height: 100%; background: linear-gradient(90deg, var(--gold), var(--gold2));
    border-radius: 2px; transition: width .8s cubic-bezier(.22,.68,0,1.2);
  }
  .hp-profile-link {
    font-family: var(--f-mono); font-size: 10px;
    letter-spacing: .08em; text-transform: uppercase;
    color: var(--gold); text-decoration: none !important;
    padding: 8px 12px; border-radius: 8px;
    border: 1px solid rgba(201,168,76,.3);
    transition: background .15s; white-space: nowrap;
  }
  .hp-profile-link:hover { background: rgba(201,168,76,.12); }

  /* ── STATS ── */
  .hp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
  @media (max-width: 700px) { .hp-stats { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 440px) { .hp-stats { grid-template-columns: 1fr; gap: 12px; } }

  .hp-stat {
    background: var(--surface); border-radius: var(--radius);
    border: 1px solid var(--border); padding: 24px 22px 20px;
    position: relative; overflow: hidden; box-shadow: var(--shadow);
    opacity: 0; animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) forwards;
    cursor: default; transition: box-shadow .2s, transform .2s;
  }
  .hp-stat:hover { transform: translateY(-4px); box-shadow: var(--shadow2); }
  .hp-stat:nth-child(1) { animation-delay: .26s; }
  .hp-stat:nth-child(2) { animation-delay: .32s; }
  .hp-stat:nth-child(3) { animation-delay: .38s; }
  .hp-stat-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .hp-stat.gold .hp-stat-line { background: linear-gradient(90deg, var(--gold), var(--gold2)); }
  .hp-stat.teal .hp-stat-line { background: linear-gradient(90deg, var(--teal), var(--teal2)); }
  .hp-stat.ink  .hp-stat-line { background: linear-gradient(90deg, var(--ink2), var(--ink3)); }
  .hp-stat-watermark {
    position: absolute; right: 12px; bottom: 8px;
    font-family: var(--f-head); font-size: 72px; font-weight: 600;
    opacity: .04; line-height: 1; pointer-events: none;
    color: var(--ink); letter-spacing: -.04em;
  }
  .hp-stat-lbl {
    font-family: var(--f-mono); font-size: 9px;
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--sub); margin-bottom: 12px;
  }
  .hp-stat-val {
    font-family: var(--f-head); font-size: clamp(34px, 4vw, 44px);
    font-weight: 600; line-height: 1; letter-spacing: -.02em;
  }
  .hp-stat.gold .hp-stat-val { color: var(--gold); }
  .hp-stat.teal .hp-stat-val { color: var(--teal); }
  .hp-stat.ink  .hp-stat-val { color: var(--ink); }
  .hp-stat-delta {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: var(--f-mono); font-size: 10px;
    margin-top: 10px; padding: 3px 8px;
    border-radius: 20px; letter-spacing: .04em;
  }
  .hp-stat.gold .hp-stat-delta { background: rgba(201,168,76,.1); color: var(--gold); }
  .hp-stat.teal .hp-stat-delta { background: rgba(15,188,176,.1); color: var(--teal); }
  .hp-stat.ink  .hp-stat-delta { background: rgba(13,17,23,.06); color: var(--muted); }

  /* ── DOCTORS ROW ── */
  .hp-docs-section { margin-bottom: 24px; opacity: 0; animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .42s forwards; }
  .hp-docs-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .hp-docs-title { font-family: var(--f-head); font-style: italic; font-size: 16px; font-weight: 500; color: var(--ink); }
  .hp-docs-link {
    font-family: var(--f-mono); font-size: 10px;
    letter-spacing: .08em; text-transform: uppercase;
    color: var(--muted); text-decoration: none !important;
    margin-left: auto; transition: color .15s;
  }
  .hp-docs-link:hover { color: var(--gold); }
  .hp-docs-row { display: flex; gap: 12px; overflow-x: auto; padding: 4px 2px 8px; scrollbar-width: none; }
  .hp-docs-row::-webkit-scrollbar { display: none; }
  .hp-doc {
    flex-shrink: 0; display: flex; flex-direction: column;
    align-items: center; gap: 6px;
    text-decoration: none !important; color: inherit;
    width: 76px; transition: transform .2s;
  }
  .hp-doc:hover { transform: translateY(-3px); }
  .hp-doc-pic {
    width: 56px; height: 56px; border-radius: 16px;
    background: linear-gradient(135deg, var(--teal) 0%, var(--violet) 100%);
    display: flex; align-items: center; justify-content: center;
    color: white; font-family: var(--f-head); font-weight: 600; font-size: 18px;
    border: 2px solid white; box-shadow: var(--shadow);
    object-fit: cover; overflow: hidden; position: relative;
  }
  .hp-doc-pic img { width: 100%; height: 100%; object-fit: cover; border-radius: 14px; }
  .hp-doc-online {
    position: absolute; bottom: -2px; right: -2px;
    width: 14px; height: 14px;
    background: var(--teal); border: 2px solid white; border-radius: 50%;
  }
  .hp-doc-name {
    font-size: 11px; font-weight: 600; color: var(--ink);
    text-align: center; line-height: 1.2;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;
  }
  .hp-doc-spec {
    font-size: 9.5px; color: var(--sub); font-family: var(--f-mono);
    text-align: center; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; width: 100%;
  }
  .hp-doc-add { background: var(--surface); border: 2px dashed var(--border); color: var(--sub); }
  .hp-doc-add:hover { border-color: var(--gold); color: var(--gold); }

  /* ── GRID ── */
  .hp-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px; margin-bottom: 20px;
    opacity: 0; animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .48s forwards;
  }
  @media (max-width: 720px) { .hp-grid { grid-template-columns: 1fr; } }

  .hp-panel {
    background: var(--surface); border-radius: var(--radius);
    border: 1px solid var(--border); box-shadow: var(--shadow); overflow: hidden;
  }
  .hp-panel-head {
    display: flex; align-items: center; gap: 10px;
    padding: 16px 20px 14px; border-bottom: 1px solid var(--border2);
  }
  .hp-panel-icon {
    width: 32px; height: 32px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; background: rgba(201,168,76,.08);
    border: 1px solid rgba(201,168,76,.18); flex-shrink: 0;
  }
  .hp-panel-icon.teal { background: rgba(15,188,176,.08); border-color: rgba(15,188,176,.18); }
  .hp-panel-icon.violet { background: rgba(124,58,237,.08); border-color: rgba(124,58,237,.18); }
  .hp-panel-name {
    font-family: var(--f-head); font-size: 15px;
    font-weight: 400; font-style: italic; color: var(--ink);
    flex: 1; min-width: 0;
  }
  .hp-panel-badge {
    font-family: var(--f-mono); font-size: 9px;
    letter-spacing: .1em; text-transform: uppercase; color: var(--sub);
    background: rgba(13,17,23,.04); border: 1px solid var(--border);
    padding: 3px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0;
  }
  .hp-panel-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--teal); flex-shrink: 0;
    animation: hp-pulse 2.4s ease infinite;
  }

  /* ── LIST ROW ── */
  .hp-row {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 20px; border-bottom: 1px solid var(--border2);
    transition: background .15s; text-decoration: none !important;
    color: inherit; position: relative; overflow: hidden;
  }
  .hp-row:last-child { border-bottom: none; }
  .hp-row:hover { background: #fafbfc; }
  .hp-row::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 2px; background: var(--gold);
    transform: scaleY(0); transform-origin: bottom;
    transition: transform .2s cubic-bezier(.22,.68,0,1.2);
  }
  .hp-row:hover::before { transform: scaleY(1); }
  .hp-row-ico {
    width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; border: 1px solid var(--border);
    background: var(--ice); transition: transform .2s;
  }
  .hp-row:hover .hp-row-ico { transform: scale(1.07); }
  .hp-row-ico.gold   { background: rgba(201,168,76,.07);  border-color: rgba(201,168,76,.2); }
  .hp-row-ico.teal   { background: rgba(15,188,176,.07);  border-color: rgba(15,188,176,.2); }
  .hp-row-ico.violet { background: rgba(124,58,237,.06);  border-color: rgba(124,58,237,.15); }
  .hp-row-ico.rose   { background: rgba(225,29,72,.06);   border-color: rgba(225,29,72,.15); }
  .hp-row-body { flex: 1; min-width: 0; }
  .hp-row-lbl {
    font-size: 13.5px; font-weight: 600; color: var(--ink);
    margin-bottom: 2px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .hp-row-sub { font-size: 11.5px; color: var(--sub); line-height: 1.4; }
  .hp-row-ext {
    font-family: var(--f-mono); font-size: 8px;
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--gold); background: rgba(201,168,76,.1);
    border: 1px solid rgba(201,168,76,.25);
    padding: 2px 7px; border-radius: 10px;
    margin-right: 6px; white-space: nowrap;
  }
  .hp-unread-badge {
    background: var(--rose); color: white;
    font-family: var(--f-mono); font-size: 10px; font-weight: 700;
    min-width: 22px; height: 22px; padding: 0 7px;
    border-radius: 11px; display: flex; align-items: center; justify-content: center;
    margin-right: 4px; box-shadow: 0 2px 8px rgba(225,29,72,.3);
  }
  .hp-arrow { font-size: 14px; color: var(--sub); transition: transform .2s, color .2s; }
  .hp-row:hover .hp-arrow { transform: translateX(4px); color: var(--gold); }

  /* ── RECENT FILES ── */
  .hp-files {
    background: var(--surface); border-radius: var(--radius);
    border: 1px solid var(--border); box-shadow: var(--shadow);
    overflow: hidden; margin-bottom: 20px;
    opacity: 0; animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .54s forwards;
  }
  .hp-file {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 20px; border-bottom: 1px solid var(--border2);
    text-decoration: none !important; color: inherit; transition: background .15s;
  }
  .hp-file:last-child { border-bottom: none; }
  .hp-file:hover { background: #fafbfc; }
  .hp-file-ico {
    width: 40px; height: 40px; border-radius: 10px;
    background: rgba(124,58,237,.08); border: 1px solid rgba(124,58,237,.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .hp-file-body { flex: 1; min-width: 0; }
  .hp-file-name {
    font-size: 13px; font-weight: 600; color: var(--ink);
    margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .hp-file-meta { font-size: 11px; color: var(--sub); font-family: var(--f-mono); }
  .hp-file-time { font-family: var(--f-mono); font-size: 10px; color: var(--sub); white-space: nowrap; }

  /* ── AI PANEL ── */
  .hp-ai {
    background: var(--surface); border-radius: var(--radius);
    border: 1px solid var(--border); box-shadow: var(--shadow);
    overflow: hidden; margin-bottom: 20px;
    opacity: 0; animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .6s forwards;
  }
  .hp-ai-head {
    display: flex; align-items: center; gap: 10px;
    padding: 16px 20px 14px; border-bottom: 1px solid var(--border2);
    background: linear-gradient(90deg, rgba(201,168,76,.03) 0%, transparent 60%);
  }
  .hp-ai-badge {
    font-family: var(--f-mono); font-size: 9px;
    letter-spacing: .1em; text-transform: uppercase;
    color: var(--gold); background: rgba(201,168,76,.1);
    border: 1px solid rgba(201,168,76,.25);
    padding: 3px 10px; border-radius: 20px;
  }
  .hp-ai-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
  @media (max-width: 640px) { .hp-ai-grid { grid-template-columns: 1fr; } }
  .hp-ai-item {
    padding: 18px 20px; border-right: 1px solid var(--border2);
    display: flex; align-items: flex-start; gap: 12px;
  }
  .hp-ai-item:last-child { border-right: none; }
  @media (max-width: 640px) {
    .hp-ai-item { border-right: none; border-bottom: 1px solid var(--border2); }
    .hp-ai-item:last-child { border-bottom: none; }
  }
  .hp-ai-dot {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; background: rgba(201,168,76,.07);
    border: 1px solid rgba(201,168,76,.18);
  }
  .hp-ai-lbl { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 3px; line-height: 1.3; }
  .hp-ai-sub { font-size: 11px; color: var(--sub); line-height: 1.4; }

  /* ── WELLNESS ── */
  .hp-wellness {
    background: var(--surface); border-radius: var(--radius);
    border: 1px solid var(--border); box-shadow: var(--shadow);
    padding: 20px 24px; margin-bottom: 20px;
    display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
    opacity: 0; animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .66s forwards;
  }
  .hp-wellness-text { flex: 1; min-width: 200px; }
  .hp-wellness-q {
    font-family: var(--f-head); font-style: italic;
    font-size: 17px; font-weight: 500;
    color: var(--ink); margin-bottom: 4px;
  }
  .hp-wellness-sub {
    font-size: 12px; color: var(--sub);
    font-family: var(--f-mono); letter-spacing: .03em;
  }
  .hp-wellness-moods { display: flex; gap: 8px; flex-wrap: wrap; }
  .hp-mood {
    width: 48px; height: 48px; border-radius: 14px;
    border: 2px solid var(--border); background: var(--surface);
    font-size: 22px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform .15s, border-color .15s, box-shadow .15s; padding: 0;
  }
  .hp-mood:hover { transform: translateY(-2px) scale(1.06); border-color: var(--gold); }
  .hp-mood.active {
    border-color: var(--gold); background: rgba(201,168,76,.12);
    box-shadow: 0 4px 16px rgba(201,168,76,.2);
  }
  .hp-wellness-thanks { font-size: 13px; color: var(--teal); font-family: var(--f-mono); font-weight: 500; }

  /* ── NEWS ── */
  .hp-news-wrap {
    display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
    opacity: 0; animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .72s forwards;
  }
  @media (max-width: 720px) { .hp-news-wrap { grid-template-columns: 1fr; } }
  .hp-news {
    background: var(--surface); border-radius: var(--radius);
    border: 1px solid var(--border); box-shadow: var(--shadow); overflow: hidden;
  }
  .hp-news-head {
    display: flex; align-items: center; gap: 10px;
    padding: 16px 20px 14px; border-bottom: 1px solid var(--border2);
  }
  .hp-news-title {
    font-family: var(--f-head); font-size: 15px;
    font-weight: 400; font-style: italic; color: var(--ink); flex: 1;
  }
  .hp-news-badge {
    font-family: var(--f-mono); font-size: 9px;
    letter-spacing: .1em; text-transform: uppercase; color: var(--sub);
    background: rgba(13,17,23,.04); border: 1px solid var(--border);
    padding: 3px 10px; border-radius: 20px; white-space: nowrap;
  }
  .hp-news-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--teal); animation: hp-pulse 2.4s ease infinite;
  }
  .hp-article {
    display: flex; gap: 14px; padding: 14px 20px;
    border-bottom: 1px solid var(--border2);
    text-decoration: none !important; color: inherit;
    transition: background .15s; position: relative;
  }
  .hp-article:last-child { border-bottom: none; }
  .hp-article:hover { background: #fafbfc; }
  .hp-article::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 2px; background: var(--teal);
    transform: scaleY(0); transform-origin: bottom;
    transition: transform .2s cubic-bezier(.22,.68,0,1.2);
  }
  .hp-article:hover::before { transform: scaleY(1); }
  .hp-article-img {
    width: 60px; height: 60px; border-radius: 12px;
    object-fit: cover; flex-shrink: 0;
    background: var(--ice); border: 1px solid var(--border);
    display: block; transition: transform .2s;
  }
  .hp-article:hover .hp-article-img { transform: scale(1.04); }
  .hp-article-body { flex: 1; min-width: 0; }
  .hp-article-title {
    font-size: 13px; font-weight: 600; color: var(--ink);
    line-height: 1.4; margin-bottom: 4px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .hp-article-preview {
    font-size: 11.5px; color: var(--sub); line-height: 1.55;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }

  /* ── SHARE CTA ── */
  .hp-share {
    margin-top: 28px; padding: 22px 26px;
    border-radius: var(--radius);
    background: linear-gradient(135deg, rgba(13,17,23,.96) 0%, rgba(28,35,51,.94) 100%);
    color: var(--ice);
    display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
    opacity: 0; animation: hp-rise .5s cubic-bezier(.22,.68,0,1.2) .78s forwards;
    position: relative; overflow: hidden;
  }
  .hp-share::before {
    content: ''; position: absolute; bottom: -50px; left: -50px;
    width: 220px; height: 220px;
    background: radial-gradient(circle, rgba(15,188,176,.15) 0%, transparent 70%);
    pointer-events: none;
  }
  .hp-share-ico {
    width: 44px; height: 44px; border-radius: 12px;
    background: rgba(15,188,176,.18);
    display: flex; align-items: center; justify-content: center;
    font-size: 19px; flex-shrink: 0; z-index: 1;
  }
  .hp-share-body { flex: 1; min-width: 200px; z-index: 1; }
  .hp-share-title {
    font-family: var(--f-head); font-size: 17px;
    font-weight: 500; font-style: italic; margin-bottom: 4px;
  }
  .hp-share-sub { font-size: 12px; color: rgba(232,244,248,.6); line-height: 1.5; }
  .hp-share-btn {
    background: var(--teal); color: white; border: none;
    padding: 11px 22px; border-radius: 10px;
    font-family: var(--f-mono); font-size: 11px;
    letter-spacing: .08em; text-transform: uppercase;
    font-weight: 600; cursor: pointer;
    transition: background .15s, transform .15s;
    z-index: 1; text-decoration: none !important; white-space: nowrap;
  }
  .hp-share-btn:hover { background: #0aa39a; transform: translateY(-2px); }

  /* ── SKELETON ── */
  .hp-skel-row {
    display: flex; gap: 14px; padding: 14px 20px;
    border-bottom: 1px solid var(--border2); align-items: center;
  }
  .hp-skel {
    background: linear-gradient(90deg, #f0f2f7 25%, #e4e8f0 50%, #f0f2f7 75%);
    background-size: 300% 100%;
    animation: hp-shimmer 1.6s ease infinite;
    border-radius: 6px; flex-shrink: 0;
  }
  @keyframes hp-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── EMPTY ── */
  .hp-empty { padding: 32px 20px; text-align: center; color: var(--sub); }
  .hp-empty-icon { font-size: 28px; opacity: .18; margin-bottom: 8px; }
  .hp-empty-text { font-family: var(--f-head); font-style: italic; font-size: 13px; }

  /* ── DIVIDER ── */
  .hp-divider {
    display: flex; align-items: center; gap: 16px;
    margin: 24px 0 20px;
    opacity: 0; animation: hp-rise .4s ease .68s forwards;
  }
  .hp-divider-line { flex: 1; height: 1px; background: var(--border); }
  .hp-divider-text {
    font-family: var(--f-mono); font-size: 9px;
    letter-spacing: .16em; text-transform: uppercase;
    color: var(--sub); white-space: nowrap;
  }

  @keyframes hp-rise {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

 .hp-search-kbd {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    color: var(--sub);
    background: var(--ice);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    padding: 0;
    transition: background .15s, color .15s, border-color .15s, transform .15s;
  }
  .hp-search-kbd:hover {
    background: var(--gold);
    color: white;
    border-color: var(--gold);
    transform: scale(1.05);
  }
  .hp-search-kbd:active {
    transform: scale(0.95);
  }
`;

const greetingKeyByHour = (hour) => {
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
};

const todayKey = () => {
  const d = new Date();
  return `wellness:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "dateOfBirth",
  "gender",
  "bloodType",
  "allergies",
  "chronicConditions",
  "address",
];

const computeCompleteness = (user) => {
  if (!user || typeof user !== "object") return 0;
  const filled = PROFILE_FIELDS.filter((f) => {
    const v = user[f];
    if (Array.isArray(v)) return v.length > 0;
    return v !== null && v !== undefined && String(v).trim() !== "";
  }).length;
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
};

const initials = (name) => {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

const fileIconByType = (mime, name) => {
  const m = (mime || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (m.includes("pdf") || n.endsWith(".pdf")) return "📄";
  if (m.includes("image") || /\.(png|jpe?g|gif|webp)$/.test(n)) return "🖼️";
  if (m.includes("video") || /\.(mp4|mov|avi|mkv)$/.test(n)) return "🎬";
  if (/\.(doc|docx)$/.test(n)) return "📝";
  if (/\.(xls|xlsx|csv)$/.test(n)) return "📊";
  return "📁";
};

/* ─────────────────────────── COMPONENT ─────────────────────────── */

export default function ProfilePatientHomePage() {
  const { t, i18n } = useTranslation("PatientHomePage");
  const navigate = useNavigate();

  /* ── Locale-aware date formatters (используют t() и текущую локаль браузера) ── */
  const formatRelativeDate = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    const now = new Date();
    const diffDays = Math.round((date - now) / (1000 * 60 * 60 * 24));
    const time = date.toLocaleTimeString(i18n.language || undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (diffDays === 0)
      return `${t("ProfileHomePage.dates.today", { defaultValue: "Сегодня" })} · ${time}`;
    if (diffDays === 1)
      return `${t("ProfileHomePage.dates.tomorrow", { defaultValue: "Завтра" })} · ${time}`;
    if (diffDays > 1 && diffDays < 7)
      return `${t("ProfileHomePage.dates.inDays", { count: diffDays, defaultValue: "Через {{count}} дн." })} · ${time}`;
    return (
      date.toLocaleDateString(i18n.language || undefined, {
        day: "numeric",
        month: "short",
      }) + ` · ${time}`
    );
  };

  const formatFileTime = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    const now = new Date();
    const diffHours = Math.round((now - date) / (1000 * 60 * 60));
    if (diffHours < 1)
      return t("ProfileHomePage.dates.justNow", { defaultValue: "Только что" });
    if (diffHours < 24)
      return t("ProfileHomePage.dates.hoursAgo", {
        count: diffHours,
        defaultValue: "{{count}} ч. назад",
      });
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1)
      return t("ProfileHomePage.dates.yesterday", { defaultValue: "Вчера" });
    if (diffDays < 7)
      return t("ProfileHomePage.dates.daysAgo", {
        count: diffDays,
        defaultValue: "{{count}} дн. назад",
      });
    return date.toLocaleDateString(i18n.language || undefined, {
      day: "numeric",
      month: "short",
    });
  };

  /* ── State ── */
  const [articleCount, setArticleCount] = useState(0);
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);

  const [nextAppointment, setNextAppointment] = useState(null);
  const [appointmentLoading, setAppointmentLoading] = useState(true);

  const [unreadCount, setUnreadCount] = useState(0);

  const [myDoctors, setMyDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  const [recentFiles, setRecentFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);

  const [searchQ, setSearchQ] = useState("");
  const [aiQ, setAiQ] = useState("");

  const [mood, setMood] = useState(() => {
    try {
      return localStorage.getItem(todayKey()) || null;
    } catch {
      return null;
    }
  });

  const API_BASE = process.env.REACT_APP_API_URL;

  /* ── Базовые счётчики ── */
  useEffect(() => {
    axios
      .get(`${API_BASE}/doctor-profile/api/count-articles-today`)
      .then((r) => setArticleCount(r.data?.count || 0))
      .catch(console.error);
  }, []);
  useEffect(() => {
    axios
      .get(`${API_BASE}/doctor-profile/api/count-all-articles`)
      .then((r) => setTotalArticles(r.data?.count || 0))
      .catch(console.error);
  }, []);
  useEffect(() => {
    axios
      .get(`${API_BASE}/doctor-profile/api/count-all-doctors`)
      .then((r) => setTotalDoctors(r.data?.count || 0))
      .catch(console.error);
  }, []);
  useEffect(() => {
    axios
      .get(`${API_BASE}/doctor-profile/articles-all`, {
        withCredentials: true,
        params: { page: 1, perPage: 6, previewWords: 30 },
      })
      .then((r) =>
        setArticles(Array.isArray(r.data?.articles) ? r.data.articles : []),
      )
      .catch(console.error)
      .finally(() => setArticlesLoading(false));
  }, []);

  /* ── Профиль пользователя ── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        const ssUserId = sessionStorage.getItem("userId");
        if (data?.authenticated) {
          const u = data.user || {};
          setUser(u);
          const uid = u.userId || u._id || u.id || ssUserId || null;
          setUserId(uid);
        } else if (ssUserId) {
          setUserId(ssUserId);
        }
      } catch {
        const ssUserId = sessionStorage.getItem("userId");
        if (ssUserId) setUserId(ssUserId);
      }
    })();
  }, []);

  /* ── Ближайший приём ── */
  useEffect(() => {
    const tryUrls = [
      `${API_BASE}/patient/appointments/next`,
      `${API_BASE}/patient/next-appointment`,
      `${API_BASE}/patient/appointments-info?next=1&limit=1`,
    ];
    (async () => {
      for (const url of tryUrls) {
        try {
          const { data } = await axios.get(url, { withCredentials: true });
          const appt = Array.isArray(data)
            ? data[0]
            : data?.appointment ||
              data?.next ||
              (data?.items && data.items[0]) ||
              null;
          if (appt) {
            setNextAppointment(appt);
            break;
          }
        } catch {
          /* try next */
        }
      }
      setAppointmentLoading(false);
    })();
  }, []);

  /* ── Непрочитанные сообщения ── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/communication/dialogs`, {
          withCredentials: true,
        });
        const dialogs = Array.isArray(data)
          ? data
          : data?.items || data?.dialogs || [];
        const total = dialogs.reduce(
          (acc, d) => acc + (d.unreadCount || d.unread || 0),
          0,
        );
        setUnreadCount(total);
      } catch {
        /* silent */
      }
    })();
  }, []);

  /* ── Мои врачи ── */
  useEffect(() => {
    const tryUrls = [
      `${API_BASE}/patient/my-doctors-list`,
      `${API_BASE}/patient/my-doctors`,
      `${API_BASE}/patient/doctors/my`,
    ];
    (async () => {
      for (const url of tryUrls) {
        try {
          const { data } = await axios.get(url, { withCredentials: true });
          const arr = Array.isArray(data)
            ? data
            : data?.doctors || data?.items || [];
          if (arr.length > 0) {
            setMyDoctors(arr.slice(0, 8));
            break;
          }
        } catch {
          /* try next */
        }
      }
      setDoctorsLoading(false);
    })();
  }, []);

  /* ── Последние файлы ── */
  useEffect(() => {
    const tryUrls = [
      `${API_BASE}/patient/files/recent?limit=3`,
      `${API_BASE}/patient/get-patients-files?limit=3&sort=recent`,
      `${API_BASE}/patient/get-patients-files`,
    ];
    (async () => {
      for (const url of tryUrls) {
        try {
          const { data } = await axios.get(url, { withCredentials: true });
          const arr = Array.isArray(data)
            ? data
            : data?.files || data?.items || [];
          if (arr.length > 0) {
            setRecentFiles(arr.slice(0, 3));
            break;
          }
        } catch {
          /* try next */
        }
      }
      setFilesLoading(false);
    })();
  }, []);

  /* ── Производные значения ── */
  const myOfficeHref = `/patient/patient-profile/${userId ?? ""}`;
  const completeness = useMemo(() => computeCompleteness(user), [user]);

  const now = new Date();
  const dateStr = now.toLocaleDateString(i18n.language || undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = now.toLocaleTimeString(i18n.language || undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const greetKey = greetingKeyByHour(now.getHours());
  const greetText = t(`ProfileHomePage.greeting.${greetKey}`, {
    defaultValue: "Здравствуйте",
  });
  const firstName =
    user?.firstName ||
    (user?.name ? String(user.name).split(/\s+/)[0] : "") ||
    user?.fullName ||
    "";

  /* ── Search ── */

  /* ── AI quick-prompt ── */
  const handleAiSubmit = (e) => {
    e.preventDefault();
    const q = aiQ.trim();
    const url = `/patient/consultation-ai`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  /* ── Search ── */
  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQ.trim();
    if (!q) return;
    window.open(
      `/patient/news?q=${encodeURIComponent(q)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  /* ── Wellness ── */
  const handleMood = (m) => {
    setMood(m);
    try {
      localStorage.setItem(todayKey(), m);
    } catch {
      /* noop */
    }

    /* Опционально: отправляем на бэк, если доступен. Falls back silently. */
    try {
      axios
        .post(
          `${API_BASE}/patient/wellness/checkin`,
          { mood: m, date: new Date().toISOString() },
          { withCredentials: true },
        )
        .catch(() => {
          /* endpoint может ещё не существовать */
        });
    } catch {
      /* noop */
    }
  };

  /* ── Items ── */
  const healthItems = [
    {
      icon: "📋",
      color: "violet",
      label: t("ProfileHomePage.health.tests"),
      sub: t("ProfileHomePage.health.testsSub"),
      link: "/patient/get-patients-files",
    },
    {
      icon: "🧠",
      color: "teal",
      label: t("ProfileHomePage.health.exams"),
      sub: t("ProfileHomePage.health.examsSub"),
      link: "/patient/get-patients-files",
    },
    {
      icon: "💊",
      color: "gold",
      label: t("ProfileHomePage.health.prescriptions"),
      sub: t("ProfileHomePage.health.prescSub"),
      link: "/patient/my-medical-histories",
    },
    {
      icon: "📑",
      color: "rose",
      label: t("ProfileHomePage.health.history"),
      sub: t("ProfileHomePage.health.historySub"),
      link: "/patient/my-medical-histories",
    },
    {
      icon: "📰",
      color: "teal",
      label: t("AsidePatient.menu.articles"),
      sub: t("ProfileHomePage.health.articlesSub", {
        defaultValue: "Свежие медицинские публикации",
      }),
      link: "/patient/news",
    },
    // Плитка генератора обзоров (user-synthesis) убрана. Подпись обещала
    // «AI-разбор ваших медицинских данных» — ровно то, в чём генератор
    // пациенту отказывает: личные вопросы о здоровье он отклоняет и
    // отправляет к врачу. Обещание было противоположно поведению.
  ];

  const doctorItems = [
    {
      icon: "💬",
      color: "teal",
      label: t("ProfileHomePage.doctor.chat"),
      sub: t("ProfileHomePage.doctor.chatSub"),
      link: "/patient/communication",
      badge: unreadCount > 0 ? Math.min(unreadCount, 99) : null,
    },
    {
      icon: "📅",
      color: "gold",
      label: t("ProfileHomePage.doctor.visits"),
      sub: t("ProfileHomePage.doctor.visitsSub"),
      link: "/patient/appointments-info",
    },
    {
      icon: "👨‍⚕️",
      color: "violet",
      label: t("ProfileHomePage.doctor.find"),
      sub: t("ProfileHomePage.doctor.findSub"),
      link: "/patient/doctors",
    },
    {
      icon: "📤",
      color: "rose",
      label: t("ProfileHomePage.doctor.upload"),
      sub: t("ProfileHomePage.doctor.uploadSub"),
      link: "/patient/get-patients-files",
    },
    {
      icon: "🤝",
      color: "teal",
      label: t("AsidePatient.menu.myDoctors"),
      sub: t("ProfileHomePage.doctor.myDoctorsSub", {
        defaultValue: "Ваши лечащие врачи",
      }),
      link: "/patient/my-doctors",
    },
  ];

  const aiItems = [
    {
      icon: "🧪",
      label: t("ProfileHomePage.ai.vitD"),
      sub: t("ProfileHomePage.ai.vitDSub"),
    },
    {
      icon: "❤️",
      label: t("ProfileHomePage.ai.pressure"),
      sub: t("ProfileHomePage.ai.pressureSub"),
    },
    {
      icon: "🏃",
      label: t("ProfileHomePage.ai.activity"),
      sub: t("ProfileHomePage.ai.activitySub"),
    },
  ];

  const NewsColumn = () => (
    <div className="hp-news">
      <div className="hp-news-head">
        <span className="hp-news-title">{t("ProfileHomePage.news.title")}</span>
        <span className="hp-news-badge">{t("ProfileHomePage.news.badge")}</span>
        <span className="hp-news-dot" />
      </div>

      {articlesLoading ? (
        [0, 1, 2].map((i) => (
          <div className="hp-skel-row" key={i}>
            <div
              className="hp-skel"
              style={{ width: 60, height: 60, borderRadius: 12 }}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}
            >
              <div className="hp-skel" style={{ height: 13, width: "68%" }} />
              <div className="hp-skel" style={{ height: 11, width: "90%" }} />
              <div className="hp-skel" style={{ height: 11, width: "50%" }} />
            </div>
          </div>
        ))
      ) : articles.length > 0 ? (
        articles.map((a) => (
          <Link
            key={a._id}
            to={`/patient/article-detail/${a._id}`}
            className="hp-article"
          >
            <img
              className="hp-article-img"
              src={a.imageUrl || "/default-image.jpg"}
              alt={a.title}
              onError={(e) => {
                e.target.style.opacity = "0";
              }}
            />
            <div className="hp-article-body">
              <div className="hp-article-title">
                {a.title || t("ProfileHomePage.news.noTitle")}
              </div>
              <div className="hp-article-preview">
                {a.preview || t("ProfileHomePage.news.noPreview")}
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className="hp-empty">
          <div className="hp-empty-icon">📰</div>
          <div className="hp-empty-text">{t("ProfileHomePage.news.empty")}</div>
        </div>
      )}
    </div>
  );

  const renderRow = (item, i) => (
    <Link
      key={i}
      to={item.link}
      className="hp-row"
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
    >
      <div className={`hp-row-ico ${item.color}`}>{item.icon}</div>
      <div className="hp-row-body">
        <div className="hp-row-lbl">{item.label}</div>
        <div className="hp-row-sub">{item.sub}</div>
      </div>
      {item.badge != null && (
        <span className="hp-unread-badge">{item.badge}</span>
      )}
      {item.external && <span className="hp-row-ext">↗</span>}
      <span className="hp-arrow">→</span>
    </Link>
  );

  const moods = [
    { emoji: "😄", key: "great" },
    { emoji: "🙂", key: "good" },
    { emoji: "😐", key: "ok" },
    { emoji: "😕", key: "low" },
    { emoji: "😣", key: "bad" },
  ];

  return (
    <div className="hp">
      <style>{S}</style>
      <div className="hp-wrap">
        {/* ── Topbar ── */}
        <div className="hp-topbar">
          <div>
            <div className="hp-eyebrow">{t("ProfileHomePage.eyebrow")}</div>
            <div className="hp-title">
              {t("ProfileHomePage.titleItalic")}&nbsp;
              <strong>{t("ProfileHomePage.titleBold")}</strong>
            </div>
          </div>
          <div className="hp-topbar-right">
            {userId && (
              <Link to={myOfficeHref} className="hp-office-btn">
                <span className="hp-office-btn-icon">👤</span>
                <span>{t("AsidePatient.menu.myOffice")}</span>
              </Link>
            )}
            <div className="hp-datebox">
              <div className="hp-date">
                {dateStr} · {timeStr}
              </div>
              <div className="hp-status">
                {t("ProfileHomePage.statusOnline")}
              </div>
            </div>
          </div>
        </div>

        {/* ── Greeting ── */}
        <div className="hp-greet">
          {greetText}
          {firstName && (
            <>
              ,&nbsp;<strong>{firstName}</strong>
            </>
          )}
        </div>

        {/* ── Global Search ── */}
        <form className="hp-search-wrap" onSubmit={handleSearch}>
          <input
            className="hp-search-input"
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder={t("ProfileHomePage.search.placeholder", {
              defaultValue: "Поиск врачей, статей, файлов…",
            })}
          />
          <button type="submit" className="hp-search-kbd" aria-label={t("patientArea:searchPatient.search")}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </form>

        {/* ── Hero ── */}
        <div className="hp-hero">
          {appointmentLoading ? (
            <div className="hp-hero-card hp-hero-empty">
              <div className="hp-skel" style={{ height: 12, width: 80 }} />
              <div className="hp-skel" style={{ height: 22, width: "70%" }} />
              <div className="hp-skel" style={{ height: 12, width: "50%" }} />
            </div>
          ) : nextAppointment ? (
            <div className="hp-hero-card hp-hero-appt">
              <div className="hp-hero-tag">
                {t("ProfileHomePage.hero.nextVisit", {
                  defaultValue: "Ближайший приём",
                })}
              </div>
              <div className="hp-hero-when">
                {formatRelativeDate(
                  nextAppointment.date ||
                    nextAppointment.startsAt ||
                    nextAppointment.scheduledAt,
                )}
              </div>
              <div className="hp-hero-meta">
                <div className="hp-hero-doctor">
                  <div className="hp-hero-avatar">
                    {initials(
                      nextAppointment.doctorName ||
                        nextAppointment.doctor?.name ||
                        nextAppointment.doctor?.firstName,
                    )}
                  </div>
                  <div className="hp-hero-doctor-info">
                    <div className="hp-hero-doctor-name">
                      {nextAppointment.doctorName ||
                        nextAppointment.doctor?.name ||
                        `${nextAppointment.doctor?.firstName || ""} ${nextAppointment.doctor?.lastName || ""}`.trim() ||
                        t("ProfileHomePage.hero.doctor", {
                          defaultValue: "Врач",
                        })}
                    </div>
                    <div className="hp-hero-doctor-spec">
                      {nextAppointment.specialty ||
                        nextAppointment.doctor?.specialty ||
                        ""}
                    </div>
                  </div>
                </div>
              </div>
              <div className="hp-hero-actions">
                <Link
                  to="/patient/communication"
                  className="hp-hero-btn hp-hero-btn-primary"
                >
                  {t("ProfileHomePage.hero.openChat", {
                    defaultValue: "Чат с врачом",
                  })}
                </Link>
                <Link
                  to="/patient/appointments-info"
                  className="hp-hero-btn hp-hero-btn-ghost"
                >
                  {t("ProfileHomePage.hero.manage", {
                    defaultValue: "Управление",
                  })}
                </Link>
              </div>
            </div>
          ) : (
            <div className="hp-hero-card hp-hero-empty">
              <div className="hp-hero-tag">
                {t("ProfileHomePage.hero.noVisits", {
                  defaultValue: "Нет ближайших визитов",
                })}
              </div>
              <div className="hp-hero-when">
                {t("ProfileHomePage.hero.findDoctor", {
                  defaultValue: "Найдите специалиста",
                })}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  lineHeight: 1.55,
                }}
              >
                {t("ProfileHomePage.hero.findDoctorSub", {
                  defaultValue:
                    "Подберите врача по специальности и запишитесь онлайн.",
                })}
              </div>
              <div className="hp-hero-actions">
                <Link
                  to="/patient/doctors"
                  className="hp-hero-btn hp-hero-btn-primary"
                  style={{ background: "var(--ink)", color: "var(--ice)" }}
                >
                  {t("ProfileHomePage.hero.browseDoctors", {
                    defaultValue: "Все врачи",
                  })}
                </Link>
              </div>
            </div>
          )}

          <form className="hp-hero-card hp-hero-ai" onSubmit={handleAiSubmit}>
            <div className="hp-hero-tag">
              {t("ProfileHomePage.hero.aiTag", {
                defaultValue: "AI-консультация",
              })}
            </div>
            <div className="hp-hero-ai-title">
              {t("ProfileHomePage.hero.aiTitle", {
                defaultValue: "Опишите симптомы — подскажем специалиста",
              })}
            </div>
            <div className="hp-hero-ai-sub">
              {t("ProfileHomePage.hero.aiSub", {
                defaultValue:
                  "AI поможет понять, к какому врачу обратиться. Не заменяет приём.",
              })}
            </div>
            <div className="hp-hero-ai-input">
              <input
                className="hp-hero-ai-textbox"
                type="text"
                value={aiQ}
                onChange={(e) => setAiQ(e.target.value)}
                placeholder={t("ProfileHomePage.hero.aiPlaceholder", {
                  defaultValue: "Например: уже неделю болит горло…",
                })}
              />
              <button type="submit" className="hp-hero-ai-go">
                →
              </button>
            </div>
          </form>
        </div>

        {/* ── Profile completeness ── */}
        {user && completeness < 100 && (
          <div className="hp-profile">
            <div className="hp-profile-icon">⚡</div>
            <div className="hp-profile-body">
              <div className="hp-profile-text">
                {t("ProfileHomePage.profile.text", {
                  defaultValue: "Профиль заполнен на",
                })}{" "}
                <strong>{completeness}%</strong>
                {" — "}
                {t("ProfileHomePage.profile.hint", {
                  defaultValue:
                    "полные данные улучшают точность AI-рекомендаций",
                })}
              </div>
              <div className="hp-profile-bar">
                <div
                  className="hp-profile-fill"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
            {userId && (
              <Link to={myOfficeHref} className="hp-profile-link">
                {t("ProfileHomePage.profile.cta", {
                  defaultValue: "Заполнить",
                })}
              </Link>
            )}
          </div>
        )}

        {/* ── Stats ── */}
        <div className="hp-stats">
          <div className="hp-stat gold">
            <div className="hp-stat-line" />
            <div className="hp-stat-watermark">{articleCount}</div>
            <div className="hp-stat-lbl">
              {t("ProfileHomePage.stats.todayArticles")}
            </div>
            <div className="hp-stat-val">{articleCount}</div>
            <div className="hp-stat-delta">↑ 12%</div>
          </div>
          <div className="hp-stat teal">
            <div className="hp-stat-line" />
            <div className="hp-stat-watermark">{totalArticles}</div>
            <div className="hp-stat-lbl">
              {t("ProfileHomePage.stats.allArticles")}
            </div>
            <div className="hp-stat-val">{totalArticles}</div>
            <div className="hp-stat-delta">
              +{articleCount} {t("ProfileHomePage.stats.today")}
            </div>
          </div>
          <div className="hp-stat ink">
            <div className="hp-stat-line" />
            <div className="hp-stat-watermark">{totalDoctors}</div>
            <div className="hp-stat-lbl">
              {t("ProfileHomePage.stats.doctors")}
            </div>
            <div className="hp-stat-val">{totalDoctors}</div>
            <div className="hp-stat-delta">
              +{totalDoctors > 0 ? 5 : 0}% {t("ProfileHomePage.stats.new")}
            </div>
          </div>
        </div>

        {/* ── My doctors row ── */}
        <div className="hp-docs-section">
          <div className="hp-docs-head">
            <span className="hp-docs-title">
              {t("ProfileHomePage.docs.title", { defaultValue: "Мои врачи" })}
            </span>
            <Link to="/patient/my-doctors" className="hp-docs-link">
              {t("ProfileHomePage.docs.all", { defaultValue: "Все →" })}
            </Link>
          </div>
          <div className="hp-docs-row">
            {doctorsLoading ? (
              [0, 1, 2, 3, 4].map((i) => (
                <div className="hp-doc" key={i}>
                  <div
                    className="hp-skel"
                    style={{ width: 56, height: 56, borderRadius: 16 }}
                  />
                  <div className="hp-skel" style={{ width: 60, height: 10 }} />
                </div>
              ))
            ) : myDoctors.length > 0 ? (
              <>
                {myDoctors.map((d, i) => {
                  const name =
                    d.fullName ||
                    d.name ||
                    `${d.firstName || ""} ${d.lastName || ""}`.trim() ||
                    "—";
                  const dId = d._id || d.id || d.userId;
                  return (
                    <Link
                      key={dId || i}
                      to={
                        dId
                          ? `/patient/doctor-profile/${dId}`
                          : "/patient/my-doctors"
                      }
                      className="hp-doc"
                      title={name}
                    >
                      <div className="hp-doc-pic">
                        {d.avatarUrl || d.photo ? (
                          <img
                            src={d.avatarUrl || d.photo}
                            alt={name}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          initials(name)
                        )}
                        {d.online && <span className="hp-doc-online" />}
                      </div>
                      <div className="hp-doc-name">{name}</div>
                      <div className="hp-doc-spec">
                        {d.specialty || d.profession || ""}
                      </div>
                    </Link>
                  );
                })}
                <Link to="/patient/doctors" className="hp-doc">
                  <div className="hp-doc-pic hp-doc-add">+</div>
                  <div className="hp-doc-name">
                    {t("ProfileHomePage.docs.add", {
                      defaultValue: "Добавить",
                    })}
                  </div>
                  <div className="hp-doc-spec">&nbsp;</div>
                </Link>
              </>
            ) : (
              <Link to="/patient/doctors" className="hp-doc">
                <div className="hp-doc-pic hp-doc-add">+</div>
                <div className="hp-doc-name">
                  {t("ProfileHomePage.docs.findFirst", {
                    defaultValue: "Найти врача",
                  })}
                </div>
                <div className="hp-doc-spec">&nbsp;</div>
              </Link>
            )}
          </div>
        </div>

        {/* ── Two panels ── */}
        <div className="hp-grid">
          <div className="hp-panel">
            <div className="hp-panel-head">
              <div className="hp-panel-icon">🫀</div>
              <span className="hp-panel-name">
                {t("ProfileHomePage.panels.myHealth")}
              </span>
              <span className="hp-panel-badge">
                {t("ProfileHomePage.panels.section")}
              </span>
            </div>
            {healthItems.map(renderRow)}
          </div>

          <div className="hp-panel">
            <div className="hp-panel-head">
              <div className="hp-panel-icon teal">👨‍⚕️</div>
              <span className="hp-panel-name">
                {t("ProfileHomePage.panels.myDoctor")}
              </span>
              <span className="hp-panel-badge">
                {t("ProfileHomePage.panels.contacts")}
              </span>
            </div>
            {doctorItems.map(renderRow)}
          </div>
        </div>

        {/* ── Recent files ── */}
        <div className="hp-files">
          <div className="hp-panel-head">
            <div className="hp-panel-icon violet">📂</div>
            <span className="hp-panel-name">
              {t("ProfileHomePage.files.title", {
                defaultValue: "Последние медицинские файлы",
              })}
            </span>
            <Link
              to="/patient/get-patients-files"
              className="hp-panel-badge"
              style={{ textDecoration: "none" }}
            >
              {t("ProfileHomePage.files.all", { defaultValue: "Все" })}
            </Link>
          </div>
          {filesLoading ? (
            [0, 1, 2].map((i) => (
              <div className="hp-skel-row" key={i}>
                <div
                  className="hp-skel"
                  style={{ width: 40, height: 40, borderRadius: 10 }}
                />
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                  }}
                >
                  <div
                    className="hp-skel"
                    style={{ height: 12, width: "55%" }}
                  />
                  <div
                    className="hp-skel"
                    style={{ height: 10, width: "30%" }}
                  />
                </div>
              </div>
            ))
          ) : recentFiles.length > 0 ? (
            recentFiles.map((f, i) => (
              <Link
                key={f._id || f.id || i}
                to="/patient/get-patients-files"
                className="hp-file"
              >
                <div className="hp-file-ico">
                  {fileIconByType(f.mimeType || f.type, f.fileName || f.name)}
                </div>
                <div className="hp-file-body">
                  <div className="hp-file-name">
                    {f.fileName ||
                      f.name ||
                      f.title ||
                      t("ProfileHomePage.files.untitled", {
                        defaultValue: "Без названия",
                      })}
                  </div>
                  <div className="hp-file-meta">
                    {f.category || f.kind || (f.mimeType ? f.mimeType : "")}
                  </div>
                </div>
                <div className="hp-file-time">
                  {formatFileTime(f.createdAt || f.uploadedAt || f.date)}
                </div>
              </Link>
            ))
          ) : (
            <div className="hp-empty">
              <div className="hp-empty-icon">📂</div>
              <div className="hp-empty-text">
                {t("ProfileHomePage.files.empty", {
                  defaultValue: "Файлы пока не загружены",
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── AI Recommendations ── */}
        <div className="hp-ai">
          <div className="hp-ai-head">
            <div className="hp-panel-icon">✨</div>
            <span className="hp-panel-name">
              {t("ProfileHomePage.ai.title")}
            </span>
            <span className="hp-ai-badge">DocPats AI</span>
            <span className="hp-panel-dot" />
          </div>
          <div className="hp-ai-grid">
            {aiItems.map((item, i) => (
              <div className="hp-ai-item" key={i}>
                <div className="hp-ai-dot">{item.icon}</div>
                <div>
                  <div className="hp-ai-lbl">{item.label}</div>
                  <div className="hp-ai-sub">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── News ── */}
        <div className="hp-divider">
          <div className="hp-divider-line" />
          <div className="hp-divider-text">
            {t("ProfileHomePage.news.sectionLabel")}
          </div>
          <div className="hp-divider-line" />
        </div>

        <div className="hp-news-wrap">
          <NewsColumn />
          <NewsColumn />
        </div>

        {/* ── Share data CTA ── */}
        <div className="hp-share">
          <div className="hp-share-ico">📤</div>
          <div className="hp-share-body">
            <div className="hp-share-title">
              {t("ProfileHomePage.share.title", {
                defaultValue: "Поделиться медицинской картой",
              })}
            </div>
            <div className="hp-share-sub">
              {t("ProfileHomePage.share.sub", {
                defaultValue:
                  "Безопасный экспорт ваших данных для второго мнения или передачи врачу.",
              })}
            </div>
          </div>
          <Link to="/patient/get-patients-files" className="hp-share-btn">
            {t("ProfileHomePage.share.cta", { defaultValue: "Экспортировать" })}
          </Link>
        </div>
      </div>
    </div>
  );
}
