import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,300;1,8..60,400&family=Nunito:wght@300;400;500;600;700;800&display=swap');

  :root {
    --cream:        #faf8f4;
    --cream2:       #f3efe8;
    --parchment:    #ede8df;
    --ink:          #1c1917;
    --ink2:         #44403c;
    --ink3:         #78716c;
    --teal:         #0f766e;
    --teal-mid:     #0d9488;
    --teal-light:   #14b8a6;
    --teal-pale:    #f0fdfa;
    --teal-border:  #99f6e4;
    --gold:         #b45309;
    --border:       #e7e2d8;
    --border2:      #d6d0c6;
    --shadow-sm:    0 2px 8px rgba(28,25,23,.07), 0 1px 3px rgba(28,25,23,.04);
    --shadow-md:    0 8px 24px rgba(28,25,23,.09), 0 2px 8px rgba(28,25,23,.04);
    --shadow-hover: 0 16px 40px rgba(15,118,110,.13), 0 4px 12px rgba(28,25,23,.06);
    --radius:       16px;
    --transition:   all .22s cubic-bezier(.4,0,.2,1);
    --font-display: 'Merriweather', 'Source Serif 4', Georgia, serif;
    --font-body:    'Nunito', system-ui, sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; overflow-x: hidden; }

  .dp-auth-body {
    min-height: 100vh;
    background: var(--cream);
    color: var(--ink);
    font-family: var(--font-body);
    font-size: 15px;
    line-height: 1.6;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ════ TOP BAR ════ */
  .dp-topbar {
    background: var(--ink);
    color: rgba(255,255,255,.35);
    height: 30px;
    padding: 0 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .dp-topbar-brand { color: rgba(255,255,255,.45); white-space: nowrap; }
  .dp-topbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
    color: rgba(255,255,255,.3);
    font-size: 10px;
  }
  .dp-topbar-live {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #5eead4;
  }
  .dp-topbar-live::before {
    content: '';
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #5eead4;
    animation: dp-topbar-blink 2s ease infinite;
    flex-shrink: 0;
  }
  @keyframes dp-topbar-blink {
    0%,100% { opacity: 1; }
    50% { opacity: .3; }
  }

  /* ════ NAVBAR ════ */
  .dp-nav {
    background: linear-gradient(150deg, #0c4a6e 0%, #0f766e 60%, #065f46 100%);
    position: sticky;
    top: 0; left: 0; right: 0;
    z-index: 200;
    height: 64px;
    border-bottom: 1px solid rgba(255,255,255,.1);
    box-shadow: 0 4px 24px rgba(12,74,110,.28);
  }
  .dp-nav::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 700px 200px at 80% 50%, rgba(20,184,166,.15) 0%, transparent 70%);
    pointer-events: none;
  }
  .dp-nav-inner {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 40px;
    position: relative;
    gap: 0;
  }

  /* Logo — centred absolutely */
  .dp-nav-logo {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1;
    gap: 1px;
  }
  .dp-nav-logo-name {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -.025em;
    color: white;
    white-space: nowrap;
  }
  .dp-nav-logo-name em { color: #5eead4; font-style: normal; }
  .dp-nav-logo-sub {
    font-family: var(--font-body);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: rgba(255,255,255,.35);
  }

  /* Left nav links */
  .dp-nav-links { display: flex; align-items: center; flex: 1; }
  .dp-nav-link {
    font-family: var(--font-body);
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: rgba(255,255,255,.55);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 14px;
    height: 64px;
    text-decoration: none;
    transition: color .15s;
    white-space: nowrap;
    position: relative;
    display: flex;
    align-items: center;
  }
  .dp-nav-link::after {
    content: '';
    position: absolute;
    bottom: 0; left: 14px; right: 14px;
    height: 3px;
    background: var(--teal-light);
    border-radius: 2px 2px 0 0;
    transform: scaleX(0);
    transition: transform .15s;
  }
  .dp-nav-link:hover { color: rgba(255,255,255,.9); }
  .dp-nav-link.active { color: white; }
  .dp-nav-link.active::after { transform: scaleX(1); }

  /* Right slot */
  .dp-nav-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .dp-nav-sign-in {
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: white;
    background: rgba(255,255,255,.12);
    border: 1.5px solid rgba(255,255,255,.25);
    border-radius: 8px;
    padding: 8px 18px;
    text-decoration: none;
    white-space: nowrap;
    backdrop-filter: blur(8px);
    transition: all .15s;
  }
  .dp-nav-sign-in:hover { background: rgba(255,255,255,.22); border-color: rgba(255,255,255,.4); }

  /* Ссылка в шапке рядом с «Войти»: тише кнопки, но так же заметна. */
  .dp-nav-link {
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: rgba(255,255,255,.86);
    text-decoration: none;
    white-space: nowrap;
    padding: 8px 4px;
    transition: color .15s;
  }
  .dp-nav-link:hover { color: #fff; }
  @media (max-width: 520px) { .dp-nav-link { display: none; } }

  /* ════ HERO ════ */
  .dp-hero {
    /* background: linear-gradient(148deg, #0c4a6e 0%, #0f766e 60%, #065f46 100%); */
    background: linear-gradient(333deg, #2196F3 0%, #0f766e 60%, #718be3 100%);
    padding: 64px 0 100px;
    position: relative;
    overflow: hidden;
    width: 100%;
  }
  .dp-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 700px 400px at 85% 40%, rgba(20,184,166,.18) 0%, transparent 65%),
      radial-gradient(ellipse 300px 500px at 5% 110%, rgba(6,95,70,.5) 0%, transparent 60%);
    pointer-events: none;
  }
  .dp-hero::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 64px;
    background: var(--cream);
    clip-path: ellipse(55% 100% at 50% 100%);
  }

  .dp-hero-inner {
    position: relative; z-index: 2;
    max-width: 1280px; margin: 0 auto;
    padding: 0 40px;
    display: grid;
    grid-template-columns: 1fr 460px;
    gap: 80px;
    align-items: center;
    min-width: 0;
    overflow: hidden;
  }

  .dp-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 9px;
    background: rgba(255,255,255,.12);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.2);
    color: rgba(255,255,255,.85);
    font-size: 12px;
    font-weight: 700;
    font-family: var(--font-body);
    letter-spacing: .1em;
    text-transform: uppercase;
    padding: 6px 16px;
    border-radius: 100px;
    margin-bottom: 20px;
  }
  .dp-hero-eyebrow::before {
    content: '';
    width: 6px; height: 6px;
    background: #5eead4;
    border-radius: 50%;
    animation: dp-topbar-blink 2.5s ease infinite;
  }

  .dp-hero-title {
    font-family: var(--font-display);
    font-size: clamp(32px, 5.5vw, 68px);
    font-weight: 700;
    letter-spacing: -.02em;
    color: white;
    line-height: 1.1;
    margin-bottom: 20px;
  }
  .dp-hero-title em { font-style: italic; color: #5eead4; }
  .dp-hero-title .t-light { font-weight: 300; font-style: italic; }

  .dp-hero-sub {
    font-family: var(--font-display);
    font-size: 17px;
    font-style: italic;
    color: rgba(255,255,255,.65);
    margin-bottom: 32px;
    line-height: 1.6;
  }
  .dp-hero-sub strong { color: rgba(255,255,255,.85); font-weight: 600; font-style: normal; }

  /* Portal CTA Buttons */
  .dp-portal-ctas {
    display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
  }
  .dp-portal-btn {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 20px; border-radius: 10px;
    text-decoration: none; cursor: pointer; border: none;
    transition: all .22s; position: relative; overflow: hidden;
    flex: 1; min-width: 0; max-width: 100%;
  }
  .dp-portal-btn:hover { transform: translateY(-3px); }
  .dp-portal-btn.patient {
    background: rgba(255,255,255,.15);
    border: 1.5px solid rgba(255,255,255,.3);
    backdrop-filter: blur(10px);
  }
  .dp-portal-btn.patient:hover {
    background: rgba(255,255,255,.22);
    border-color: rgba(255,255,255,.5);
    box-shadow: 0 8px 28px rgba(0,0,0,.2);
  }
  .dp-portal-btn.doctor {
    background: white;
    border: 1.5px solid transparent;
    box-shadow: var(--shadow-md);
  }
  .dp-portal-btn.doctor:hover { box-shadow: 0 12px 32px rgba(0,0,0,.18); }
  .dp-portal-icon {
    width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }
  .dp-portal-btn.patient .dp-portal-icon { background: rgba(255,255,255,.15); }
  .dp-portal-btn.doctor  .dp-portal-icon { background: var(--teal-pale); }
  .dp-portal-info { flex: 1; text-align: left; min-width: 0; }
  .dp-portal-label {
    font-size: 9px; font-weight: 700; font-family: var(--font-body);
    letter-spacing: .12em; text-transform: uppercase; margin-bottom: 2px;
  }
  .dp-portal-btn.patient .dp-portal-label { color: rgba(255,255,255,.6); }
  .dp-portal-btn.doctor  .dp-portal-label { color: var(--ink3); }
  .dp-portal-name {
    font-size: 14px; font-weight: 800; letter-spacing: -.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    font-family: var(--font-body);
  }
  .dp-portal-btn.patient .dp-portal-name { color: white; }
  .dp-portal-btn.doctor  .dp-portal-name { color: var(--ink); }
  .dp-portal-arrow { flex-shrink: 0; opacity: .55; transition: all .2s; }
  .dp-portal-btn.patient .dp-portal-arrow { color: #5eead4; }
  .dp-portal-btn.doctor  .dp-portal-arrow { color: var(--teal); }
  .dp-portal-btn:hover .dp-portal-arrow { opacity: 1; transform: translateX(4px); }

  /* News link card */
  .dp-news-card-wrap { margin-bottom: 20px; width: 100%; min-width: 0; }
  .dp-news-card {
    display: flex; align-items: stretch; text-decoration: none;
    background: rgba(255,255,255,.1);
    border: 1.5px solid rgba(255,255,255,.18);
    border-radius: 12px; overflow: hidden;
    backdrop-filter: blur(10px);
    transition: all .2s;
    width: 100%; min-width: 0;
  }
  .dp-news-card:hover { background: rgba(255,255,255,.17); border-color: rgba(255,255,255,.35); transform: translateY(-2px); }
  .dp-news-card-accent {
    width: 4px; min-width: 4px;
    background: linear-gradient(180deg, #5eead4, #14b8a6);
    flex-shrink: 0;
  }
  .dp-news-card-body {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; flex: 1; min-width: 0;
  }
  .dp-news-card-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(255,255,255,.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
  }
  .dp-news-card-copy { flex: 1; min-width: 0; overflow: hidden; }
  .dp-news-card-tag {
    font-family: var(--font-body); font-size: 9px; letter-spacing: .12em;
    text-transform: uppercase; color: #5eead4; margin-bottom: 2px;
  }
  .dp-news-card-text {
    font-size: 13px; font-weight: 700; font-family: var(--font-body);
    color: white;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .dp-news-card-arrow { color: #5eead4; opacity: .6; flex-shrink: 0; transition: all .2s; margin-left: 4px; }
  .dp-news-card:hover .dp-news-card-arrow { opacity: 1; transform: translateX(4px); }

  /* Trust row */
  .dp-trust-row {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    margin-top: 20px;
  }
  .dp-trust-badge {
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font-body); font-size: 11px; color: rgba(255,255,255,.6);
    letter-spacing: .04em;
  }
  .dp-trust-badge svg { color: #5eead4; flex-shrink: 0; }
  .dp-trust-sep { width: 1px; height: 14px; background: rgba(255,255,255,.2); }

  /* Right stat cards */
  .dp-hero-right { display: flex; flex-direction: column; gap: 12px; }

  .dp-stat-hero {
    background: rgba(255,255,255,.1);
    border: 1px solid rgba(255,255,255,.15);
    border-radius: 14px; padding: 18px 20px;
    display: flex; align-items: center; gap: 14px;
    backdrop-filter: blur(10px);
    transition: all .22s; cursor: default;
    position: relative; overflow: hidden;
  }
  .dp-stat-hero::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 4px; border-radius: 20px 0 0 20px;
  }
  .dp-stat-hero.c-teal::before  { background: #5eead4; }
  .dp-stat-hero.c-green::before { background: #86efac; }
  .dp-stat-hero.c-gold::before  { background: #fcd34d; }
  .dp-stat-hero:hover { background: rgba(255,255,255,.16); transform: translateX(-4px); }
  .dp-stat-hero-icon {
    width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; background: rgba(255,255,255,.12);
  }
  .dp-stat-hero-num {
    font-family: var(--font-display); font-size: 24px; font-weight: 700;
    line-height: 1; color: white; margin-bottom: 3px; letter-spacing: -.02em;
  }
  .dp-stat-hero-label {
    font-family: var(--font-body); font-size: 10px; color: rgba(255,255,255,.5);
    text-transform: uppercase; letter-spacing: .1em;
  }
  .dp-stat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .dp-stat-mini {
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
    border-radius: 12px; padding: 14px 16px; backdrop-filter: blur(10px); transition: all .22s;
  }
  .dp-stat-mini:hover { background: rgba(255,255,255,.16); }
  .dp-stat-mini-num {
    font-family: var(--font-display); font-size: 22px; font-weight: 700;
    line-height: 1; color: #5eead4; margin-bottom: 4px;
  }
  .dp-stat-mini-label {
    font-family: var(--font-body); font-size: 9.5px; color: rgba(255,255,255,.45);
    text-transform: uppercase; letter-spacing: .08em;
  }

  /* Anthem */
  .dp-anthem {
    display: inline-flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,.1); border: 1.5px solid rgba(255,255,255,.2);
    border-radius: 10px; padding: 10px 16px;
    cursor: pointer; transition: all .22s;
    font-family: var(--font-body); font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,.8); backdrop-filter: blur(10px);
    max-width: 100%;
  }
  .dp-anthem:hover { background: rgba(255,255,255,.18); border-color: rgba(255,255,255,.4); transform: translateY(-2px); }
  .dp-anthem-icon {
    width: 32px; height: 32px; border-radius: 7px;
    background: rgba(255,255,255,.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
  }
  .dp-anthem-wave { display: flex; align-items: center; gap: 3px; flex-shrink: 0; }
  .dp-anthem-wave span {
    width: 3px; border-radius: 2px; background: #5eead4;
    animation: dp-wave-anim 1s ease-in-out infinite;
  }
  .dp-anthem-wave span:nth-child(1) { height: 8px; animation-delay: 0s; }
  .dp-anthem-wave span:nth-child(2) { height: 14px; animation-delay: .15s; }
  .dp-anthem-wave span:nth-child(3) { height: 10px; animation-delay: .3s; }
  .dp-anthem-wave span:nth-child(4) { height: 16px; animation-delay: .45s; }
  .dp-anthem-wave span:nth-child(5) { height: 8px; animation-delay: .6s; }
  @keyframes dp-wave-anim { 0%,100% { transform: scaleY(.6); } 50% { transform: scaleY(1.3); } }
  .dp-anthem-meta { display: flex; flex-direction: column; gap: 1px; min-width: 0; overflow: hidden; }
  .dp-anthem-title { font-size: 13px; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dp-anthem-sub { font-family: var(--font-body); font-size: 10px; color: rgba(255,255,255,.4); letter-spacing: .04em; white-space: nowrap; }

  /* ════ LOGOS BAR ════ */
  .dp-logos-bar { background: var(--ink); padding: 22px 40px; overflow: hidden; }
  .dp-logos-inner {
    max-width: 1280px; margin: 0 auto;
    display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
  }
  .dp-logos-label {
    font-family: var(--font-body); font-size: 9.5px; letter-spacing: .16em;
    text-transform: uppercase; color: rgba(255,255,255,.3); white-space: nowrap; flex-shrink: 0;
  }
  .dp-logos-sep { width: 1px; height: 28px; background: rgba(255,255,255,.1); flex-shrink: 0; }
  .dp-logos-list { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; flex: 1; }
  .dp-logo-item {
    font-family: var(--font-display); font-size: 14px; font-style: italic;
    color: rgba(255,255,255,.25); transition: color .2s; white-space: nowrap;
  }
  .dp-logo-item:hover { color: rgba(255,255,255,.55); }

  /* ════ METRICS BAR ════ */
  .dp-metrics-bar { background: white; border-bottom: 1px solid var(--border); overflow: hidden; }
  .dp-metrics-inner {
    max-width: 1280px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(4, 1fr);
  }
  .dp-metric-cell {
    padding: 28px 20px; border-right: 1px solid var(--border);
    text-align: center; cursor: default; transition: background .2s;
  }
  .dp-metric-cell:last-child { border-right: none; }
  .dp-metric-cell:hover { background: var(--cream2); }
  .dp-metric-num {
    font-family: var(--font-display); font-size: 34px; font-weight: 700;
    line-height: 1; letter-spacing: -.025em; color: var(--ink); margin-bottom: 7px;
  }
  .dp-metric-label {
    font-family: var(--font-body); font-size: 9.5px; text-transform: uppercase;
    letter-spacing: .1em; color: var(--ink3);
  }
  .dp-metric-sub { font-size: 12px; color: var(--teal); font-weight: 600; margin-top: 4px; }

  /* ════ SECTION SCAFFOLD ════ */
  .dp-section { padding: 80px 40px; }
  .dp-section-inner { max-width: 1280px; margin: 0 auto; }
  .dp-section.dp-features-bg { background: var(--cream2); }

  .dp-section-header { max-width: 600px; margin-bottom: 48px; }
  .dp-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--font-body); font-size: 10px; letter-spacing: .15em;
    text-transform: uppercase; color: var(--teal); margin-bottom: 14px;
  }
  .dp-eyebrow::before { content: ''; width: 18px; height: 1.5px; background: var(--teal); flex-shrink: 0; }
  .dp-section-title {
    font-family: var(--font-display); font-size: clamp(22px, 3vw, 42px);
    font-weight: 700; line-height: 1.1; letter-spacing: -.02em;
    color: var(--ink); margin-bottom: 14px;
  }
  .dp-section-title em { font-style: italic; color: var(--teal); }
  .dp-section-sub { font-size: 15px; color: var(--ink3); line-height: 1.75; }

  /* Feature cards */
  .dp-features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
  .dp-feature-card {
    background: white; border: 1px solid var(--border); border-radius: 14px;
    padding: 24px 20px; transition: all .22s; position: relative; overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .dp-feature-card:hover { border-color: var(--border2); transform: translateY(-4px); box-shadow: var(--shadow-hover); }
  .dp-feature-card::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    opacity: 0; transition: opacity .22s;
    background: linear-gradient(90deg, var(--teal), var(--teal-light));
  }
  .dp-feature-card:hover::after { opacity: 1; }
  .dp-feature-icon {
    width: 44px; height: 44px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; margin-bottom: 14px; background: var(--teal-pale);
  }
  .dp-feature-icon.green  { background: #f0fdf4; }
  .dp-feature-icon.gold   { background: #fffbeb; }
  .dp-feature-icon.purple { background: #f5f3ff; }
  .dp-feature-title { font-size: 15px; font-weight: 800; color: var(--ink); margin-bottom: 8px; font-family: var(--font-body); }
  .dp-feature-desc  { font-size: 13.5px; color: var(--ink3); line-height: 1.7; font-family: var(--font-body); }

  /* ════ ROLES ════ */
  .dp-roles-bg { background: var(--ink); }
  .dp-roles-bg .dp-eyebrow { color: rgba(255,255,255,.4); }
  .dp-roles-bg .dp-eyebrow::before { background: rgba(255,255,255,.3); }
  .dp-roles-bg .dp-section-title { color: white; }
  .dp-roles-bg .dp-section-title em { color: #5eead4; }
  .dp-roles-bg .dp-section-sub { color: rgba(255,255,255,.45); }

  .dp-roles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .dp-role-card {
    border-radius: 20px; padding: 36px 30px;
    position: relative; overflow: hidden;
    transition: transform .28s, box-shadow .28s;
    cursor: pointer;
  }
  .dp-role-card:hover { transform: translateY(-5px); }
  .dp-role-card.dp-role-patient {
    background: linear-gradient(145deg, #0c4a6e 0%, #0f766e 60%, #065f46 100%);
    border: 1.5px solid rgba(255,255,255,.12);
    box-shadow: 0 8px 40px rgba(12,74,110,.4);
  }
  .dp-role-card.dp-role-patient:hover { box-shadow: 0 20px 60px rgba(12,74,110,.5); }
  .dp-role-card.dp-role-doctor {
    background: linear-gradient(145deg, #1c1917 0%, #292524 60%, #1c1917 100%);
    border: 1.5px solid rgba(255,255,255,.08);
    box-shadow: 0 8px 40px rgba(0,0,0,.3);
  }
  .dp-role-card.dp-role-doctor:hover { border-color: rgba(255,255,255,.14); box-shadow: 0 20px 60px rgba(0,0,0,.4); }
  .dp-role-card.dp-role-clinic {
    background: linear-gradient(145deg, #134e48 0%, #0f3f3a 60%, #0c2f2c 100%);
    border: 1.5px solid rgba(94,234,212,.16);
    box-shadow: 0 8px 40px rgba(12,47,44,.34);
  }
  .dp-role-card.dp-role-clinic:hover { border-color: rgba(94,234,212,.3); box-shadow: 0 20px 60px rgba(12,47,44,.44); }

  .dp-role-deco {
    position: absolute; top: -60px; right: -60px;
    width: 240px; height: 240px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .dp-role-inner { position: relative; z-index: 1; }
  .dp-role-icon-wrap {
    width: 56px; height: 56px; border-radius: 13px; margin-bottom: 18px;
    display: flex; align-items: center; justify-content: center; font-size: 24px;
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
  }
  .dp-role-label {
    font-family: var(--font-body); font-size: 10px; letter-spacing: .15em;
    text-transform: uppercase; color: rgba(255,255,255,.45); margin-bottom: 7px;
  }
  .dp-role-title {
    font-family: var(--font-display); font-size: clamp(22px, 2.5vw, 28px); font-weight: 700;
    color: white; line-height: 1.05; letter-spacing: -.02em; margin-bottom: 10px;
  }
  .dp-role-title em { font-style: italic; color: #5eead4; }
  .dp-role-desc { font-size: 14px; font-family: var(--font-body); color: rgba(255,255,255,.55); line-height: 1.7; margin-bottom: 20px; max-width: 340px; }
  .dp-role-perks { display: flex; flex-direction: column; gap: 8px; margin-bottom: 28px; }
  .dp-role-perk { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-family: var(--font-body); color: rgba(255,255,255,.7); }
  .dp-role-perk-check {
    width: 16px; height: 16px; border-radius: 5px; flex-shrink: 0;
    background: rgba(94,234,212,.15); border: 1px solid rgba(94,234,212,.3);
    display: flex; align-items: center; justify-content: center; font-size: 10px; color: #5eead4;
  }
  .dp-role-cta {
    display: inline-flex; align-items: center; gap: 8px;
    background: white; border-radius: 9px; padding: 12px 20px;
    font-size: 13px; font-weight: 800; font-family: var(--font-body); border: none; cursor: pointer;
    transition: all .2s; letter-spacing: .04em; text-transform: uppercase;
    box-shadow: 0 4px 14px rgba(0,0,0,.14);
  }
  .dp-role-card.dp-role-patient .dp-role-cta { color: var(--teal); }
  .dp-role-card.dp-role-doctor  .dp-role-cta { color: var(--ink); }
  .dp-role-card.dp-role-clinic  .dp-role-cta { color: #0f3f3a; }
  .dp-role-cta:hover { transform: translateX(4px); box-shadow: 0 8px 24px rgba(0,0,0,.2); }

  /* ════ COMPLIANCE ════ */
  .dp-compliance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 52px; align-items: center; }
  .dp-compliance-badges { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .dp-compliance-badge {
    background: white; border: 1px solid var(--border); border-radius: 14px;
    padding: 20px 16px; text-align: center; transition: all .22s; box-shadow: var(--shadow-sm);
  }
  .dp-compliance-badge:hover { border-color: var(--teal-border); box-shadow: var(--shadow-hover); transform: translateY(-3px); }
  .dp-compliance-badge-icon { font-size: 24px; margin-bottom: 8px; display: block; }
  .dp-compliance-badge-name {
    font-family: var(--font-body); font-size: 11px; letter-spacing: .1em;
    text-transform: uppercase; color: var(--teal); margin-bottom: 4px; font-weight: 700;
  }
  .dp-compliance-badge-desc { font-size: 12px; color: var(--ink3); line-height: 1.5; }

  /* ════ SEO BLOCK ════ */
  .dp-seo { padding: 64px 40px; border-top: 1px solid var(--border); max-width: 860px; margin: 0 auto; }
  .dp-seo h2 { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--ink); margin-bottom: 12px; letter-spacing: -.02em; }
  .dp-seo h3 { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--ink); margin: 22px 0 8px; letter-spacing: -.01em; }
  .dp-seo p { font-size: 15px; font-family: var(--font-body); color: var(--ink3); line-height: 1.85; margin-bottom: 10px; }

  /* ════ FOOTER ════ */
  .dp-footer {
    background: var(--ink);
    border-top: 3px solid var(--teal);
    padding: 32px 40px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 14px;
  }
  .dp-footer-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
  .dp-footer-logo-name {
    font-family: var(--font-display); font-size: 22px; font-weight: 900;
    color: white; letter-spacing: -.025em;
  }
  .dp-footer-logo-name em { color: #5eead4; font-style: normal; }
  .dp-footer-links { display: flex; gap: 4px; flex-wrap: wrap; }
  .dp-footer-link {
    font-family: var(--font-body); font-size: 11px; color: rgba(255,255,255,.35);
    text-decoration: none; padding: 5px 10px; border-radius: 6px;
    transition: all .14s; text-transform: uppercase; letter-spacing: .09em;
  }
  .dp-footer-link:hover { color: rgba(255,255,255,.75); background: rgba(255,255,255,.07); }
  .dp-footer-copy {
    font-family: var(--font-body); font-size: 10.5px;
    color: rgba(255,255,255,.2); letter-spacing: .05em;
  }

  /* ════ OUTLET WRAPPER ════ */
  .dp-outlet-wrapper {
    min-height: calc(100vh - 94px);
    display: flex; align-items: center; justify-content: center;
    padding: 90px 16px; background: var(--cream);
  }

  /* ════════════════════════════════════════
     RESPONSIVE — Tablet (≤ 1100px)
  ════════════════════════════════════════ */
  @media (max-width: 1100px) {
    .dp-hero-inner {
      grid-template-columns: 1fr;
      gap: 0;
      overflow: hidden;
    }
    .dp-hero-right { display: none; }
    .dp-compliance-grid { grid-template-columns: 1fr; gap: 32px; }
    .dp-roles-grid { grid-template-columns: 1fr; }
    .dp-metrics-inner { grid-template-columns: repeat(2, 1fr); }
    .dp-metric-cell:nth-child(2) { border-right: none; }
    .dp-metric-cell:nth-child(3) { border-top: 1px solid var(--border); }
    .dp-metric-cell:nth-child(4) { border-top: 1px solid var(--border); border-right: none; }
  }

  /* ════════════════════════════════════════
     RESPONSIVE — Mobile-L / Tablet (≤ 768px)
  ════════════════════════════════════════ */
  @media (max-width: 768px) {
    /* Prevent any horizontal overflow */
    * { max-width: 100%; }
    img, video, iframe, pre, table { max-width: 100%; }

    /* Top bar */
    .dp-topbar { padding: 0 16px; font-size: 9px; gap: 8px; }
    .dp-topbar-right { gap: 10px; }

    /* Navbar */
    .dp-nav { height: 56px; }
    .dp-nav-inner { padding: 0 16px; }
    .dp-nav-links { display: none; }
    .dp-nav-logo { position: static; transform: none; margin-right: auto; }
    .dp-nav-logo-name { font-size: 22px; }
    .dp-nav-logo-sub { display: none; }
    .dp-nav-right { margin-left: 0; gap: 6px; }
    .dp-nav-sign-in { padding: 7px 12px; font-size: 11px; }

    /* Hero — critical fixes */
    .dp-hero { padding: 40px 0 80px; overflow: hidden; width: 100%; }
    .dp-hero-inner {
      padding: 0 16px;
      grid-template-columns: 1fr;
      width: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }
    .dp-hero-inner > * { min-width: 0; max-width: 100%; overflow: hidden; }
    .dp-hero-eyebrow { font-size: 10px; padding: 5px 12px; }
    .dp-hero-title { font-size: clamp(26px, 7vw, 38px); word-break: break-word; }
    .dp-hero-sub { font-size: 15px; }

    /* Portal buttons — stack */
    .dp-portal-ctas { flex-direction: column; }
    .dp-portal-btn { flex: none; width: 100%; min-width: 0; max-width: 100%; }
    .dp-portal-name { font-size: 13px; }

    /* News card */
    .dp-news-card-text { font-size: 12px; }

    /* Trust row */
    .dp-trust-row { gap: 8px; }
    .dp-trust-sep { display: none; }

    /* Anthem */
    .dp-anthem { width: 100%; box-sizing: border-box; }
    .dp-anthem-title { font-size: 12px; }

    /* Sections */
    .dp-section { padding: 52px 16px; }
    .dp-section-header { margin-bottom: 32px; }
    .dp-section-sub { font-size: 14px; }

    /* Logos bar */
    .dp-logos-bar { padding: 18px 16px; overflow: hidden; }
    .dp-logos-sep { display: none; }
    .dp-logos-inner { gap: 16px; }
    .dp-logos-list { gap: 14px; }
    .dp-logo-item { font-size: 12px; }

    /* Metrics */
    .dp-metrics-bar { overflow: hidden; }
    .dp-metrics-inner { grid-template-columns: repeat(2, 1fr); }
    .dp-metric-cell { padding: 20px 12px; }
    .dp-metric-num { font-size: 26px; }
    .dp-metric-label { font-size: 9px; }

    /* Features grid */
    .dp-features-grid { grid-template-columns: 1fr 1fr; }

    /* Roles */
    .dp-role-card { padding: 28px 20px; }
    .dp-role-title { font-size: 22px; }

    /* Compliance */
    .dp-compliance-grid { gap: 24px; }
    .dp-compliance-badges { grid-template-columns: 1fr 1fr; gap: 10px; }

    /* SEO */
    .dp-seo { padding: 40px 16px; }

    /* Footer */
    .dp-footer {
      padding: 24px 16px;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    .dp-footer-links { gap: 2px; }
    .dp-footer-copy { width: 100%; }
  }

  /* ════════════════════════════════════════
     RESPONSIVE — Mobile (≤ 480px)
  ════════════════════════════════════════ */
  @media (max-width: 480px) {
    /* Hide topbar entirely */
    .dp-topbar { display: none; }

    /* Navbar */
    .dp-nav { height: 52px; }
    .dp-nav-logo-name { font-size: 20px; }

    /* Hero */
    .dp-hero { padding: 32px 0 72px; }
    .dp-hero-title { font-size: clamp(26px, 9vw, 36px); line-height: 1.15; }
    .dp-hero-sub { font-size: 14px; margin-bottom: 24px; }
    .dp-hero-eyebrow { font-size: 9px; letter-spacing: .08em; }

    /* Anthem — shrink on very small screens */
    .dp-anthem { width: 100%; }

    /* Metrics — 2 col */
    .dp-metrics-inner { grid-template-columns: 1fr 1fr; }
    .dp-metric-num { font-size: 22px; }

    /* Features — single column */
    .dp-features-grid { grid-template-columns: 1fr; }

    /* Compliance badges — single column */
    .dp-compliance-badges { grid-template-columns: 1fr 1fr; }

    /* Roles */
    .dp-roles-grid { grid-template-columns: 1fr; }
    .dp-role-card { padding: 24px 18px; }
    .dp-role-desc { font-size: 13px; }
    .dp-role-cta { font-size: 12px; padding: 10px 16px; }

    /* Section */
    .dp-section { padding: 44px 16px; }
    .dp-section-header { margin-bottom: 24px; }

    /* SEO */
    .dp-seo { padding: 32px 16px; }
    .dp-seo h2 { font-size: 22px; }
    .dp-seo h3 { font-size: 16px; }
    .dp-seo p { font-size: 14px; }

    /* Nav sign-in button */
    .dp-nav-sign-in { padding: 6px 10px; font-size: 10px; }
  }
`;

export default function AuthLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("AuthLayout");

  const hideLanding = [
    "/registration",
    "/login",
    "/confirmationregister",
    "/forgotpassword",
    "/resetpassword",
    "/confirmationresetpassword",
    "/confirmationforgotpassword",
    "/confirmationchangepassword",
    "/changepassword",
    "/otpresetpasswordchange",
    "/resetpasswordchange",
  ].includes(location.pathname);

  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 400], [0, -40]);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };
  const fadeIn = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.75 } },
  };

  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const toggleAnthem = () => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
    setPlaying(!playing);
  };

  const features = [
    {
      icon: "🔒",
      color: "",
      title: t("feature1") || "HIPAA Compliant",
      desc: t("featureDesc1"),
    },
    {
      icon: "📊",
      color: "purple",
      title: t("feature2") || "Analytics Dashboard",
      desc: t("featureDesc2"),
    },
    {
      icon: "💬",
      color: "",
      title: t("feature3") || "Secure Messaging",
      desc: t("featureDesc3"),
    },
    {
      icon: "🏥",
      color: "green",
      title: t("feature4") || "Multi-Clinic Network",
      desc: t("featureDesc4"),
    },
    {
      icon: "⚕",
      color: "purple",
      title: t("featureAI") || "AI Консультация",
      desc:
        t("featureAIDesc") ||
        "Бесплатная предварительная медицинская оценка симптомов с генерацией эпикриза в международном формате SOAP.",
    },
  ];
  const doctorPerks = [
    t("doctorPerk1"),
    t("doctorPerk2"),
    t("doctorPerk3"),
    t("doctorPerk4"),
  ];
  const patientPerks = [
    t("patientPerk1"),
    t("patientPerk2"),
    t("patientPerk3"),
    t("patientPerk4"),
  ];
  const clinicPerks = [
    t("clinicPerk1"),
    t("clinicPerk2"),
    t("clinicPerk3"),
    t("clinicPerk4"),
  ];

  const Arrow = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const Check = () => (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path
        d="M2.5 7l3.5 3.5 5.5-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");
  // Карточка «Подготовка к экзаменам» видна всем (в т.ч. гостю без
  // регистрации). Врача клик уводит в раздел, остальным показываем заметку,
  // что доступ только для врачей.
  const [examNote, setExamNote] = useState(false);
  const handleExamPrepClick = () => {
    if (["doctor", "admin", "superadmin"].includes(userRole)) {
      navigate("/education");
    } else {
      setExamNote(true);
    }
  };
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/common-for-user`,
          {
            withCredentials: true,
          },
        );
        if (res.data?.authenticated) {
          setIsAuthenticated(true);
          setUserRole(String(res.data.user?.role || "").toLowerCase());
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuthentication();
  }, []);
  return (
    <>
      <style>{STYLES}</style>
      <div className="dp-auth-body">
        <Helmet>
          <title>DocPats MedConnect · World-Class Medical Platform</title>
          <meta name="description" content={t("metaDescription")} />
          <meta property="og:title" content={t("metaTitle")} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://docpats.com/" />
        </Helmet>

        {/* ══ TOP BAR ══ */}
        <div className="dp-topbar">
          <span className="dp-topbar-brand">DocPats · MedConnect</span>
          <div className="dp-topbar-right">
            <span className="dp-topbar-live">
              {t("platformLive", { defaultValue: "Platform Live" })}
            </span>
            <span>
              {t("topbarCountries", { defaultValue: "40+ Countries" })}
            </span>
          </div>
        </div>

        {/* ══ NAVBAR ══ */}
        <nav className="dp-nav">
          <div className="dp-nav-inner">
            {/* Left links */}
            <div className="dp-nav-links">
              <a className="dp-nav-link" href="/public/news">
                {t("nav.newsLink") || "Medical News"}
              </a>
            </div>

            {/* Centre logo */}
            <a className="dp-nav-logo" href="/">
              <div className="dp-nav-logo-name">
                Doc<em>Pats</em>
              </div>
              <div className="dp-nav-logo-sub">MedConnect · Global</div>
            </a>

            {/* Right */}
            {/* Right */}
            <div className="dp-nav-right">
              {/* Подготовка к экзаменам — раздел только для врачей, поэтому
                  ссылку показываем лишь им (гостю и пациенту раздел закрыт). */}
              {["doctor", "admin", "superadmin"].includes(userRole) && (
                <Link to="/education" className="dp-nav-link">
                  {t("nav.examPrep", { defaultValue: "Тесты" })}
                </Link>
              )}
              <LanguageSwitcher />
              {isAuthenticated ? (
                <a
                  href={
                    userRole === "doctor"
                      ? "/doctor/home-page"
                      : "/patient/home-page"
                  }
                  className="dp-nav-sign-in"
                >
                  {t("nav.dashboard") || "My Cabinet"}
                </a>
              ) : (
                <Link to="/login" className="dp-nav-sign-in">
                  {t("nav.signIn") || "Sign In"}
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* ══ OUTLET or LANDING ══ */}
        {hideLanding ? (
          <div className="dp-outlet-wrapper">
            <Outlet />
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show">
            {/* ══ HERO ══ */}
            <motion.section className="dp-hero" variants={fadeIn}>
              <div className="dp-hero-inner">
                {/* Left */}
                <div>
                  <motion.div variants={item}>
                    <div className="dp-hero-eyebrow">
                      {t("welcome") || "Now serving 40+ countries worldwide"}
                    </div>
                  </motion.div>

                  <motion.h1 className="dp-hero-title" variants={item}>
                    {t("title") || (
                      <>
                        Healthcare
                        <br />
                        <em>Reimagined</em>
                        <br />
                        <span className="t-light">for the World</span>
                      </>
                    )}
                  </motion.h1>

                  <motion.p className="dp-hero-sub" variants={item}>
                    {t("subtitle") ||
                      "The all-in-one platform connecting doctors and patients globally."}{" "}
                    <strong>
                      {t("subtitle2") ||
                        "Secure, HIPAA-compliant, and built for modern medicine."}
                    </strong>
                  </motion.p>

                  {/* Portal buttons */}
                  <motion.div className="dp-portal-ctas" variants={item}>
                    <button
                      className="dp-portal-btn patient"
                      onClick={() => navigate("/registration?role=patient")}
                    >
                      <div className="dp-portal-icon">👤</div>
                      <div className="dp-portal-info">
                        <div className="dp-portal-label">
                          {t("portalLabel", { defaultValue: "Portal" })}
                        </div>
                        <div className="dp-portal-name">
                          {t("patient") || "Patient Portal"}
                        </div>
                      </div>
                      <span className="dp-portal-arrow">
                        <Arrow size={16} />
                      </span>
                    </button>
                    <button
                      className="dp-portal-btn doctor"
                      onClick={() => navigate("/registration?role=doctor")}
                    >
                      <div className="dp-portal-icon">👨‍⚕️</div>
                      <div className="dp-portal-info">
                        <div className="dp-portal-label">
                          {t("portalLabel", { defaultValue: "Portal" })}
                        </div>
                        <div className="dp-portal-name">
                          {t("doctor") || "Doctor Portal"}
                        </div>
                      </div>
                      <span className="dp-portal-arrow">
                        <Arrow size={16} />
                      </span>
                    </button>
                  </motion.div>
                  {/* Подготовка к экзаменам. Карточка видна всем без
                      регистрации; клик гейтится по роли (см. handleExamPrepClick):
                      врач → /education, остальным — заметка ниже. */}
                  <motion.div variants={item} style={{ marginBottom: 12 }}>
                    <div
                      className="dp-news-card"
                      role="button"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                      onClick={handleExamPrepClick}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleExamPrepClick();
                        }
                      }}
                    >
                      <div
                        className="dp-news-card-accent"
                        style={{
                          background:
                            "linear-gradient(180deg, #d8c48c, #a2802f)",
                        }}
                      />
                      <div className="dp-news-card-body">
                        <div className="dp-news-card-icon">🎓</div>
                        <div className="dp-news-card-copy">
                          <div className="dp-news-card-tag">
                            {"DocPats · "}
                            {t("examPrepTag", {
                              defaultValue:
                                "Тесты и экзамены · только для врачей",
                            })}
                          </div>
                          <div className="dp-news-card-text">
                            {t("examPrepText", {
                              defaultValue:
                                "Подготовка к экзаменам: тесты и экзамены с разбором ошибок",
                            })}
                          </div>
                        </div>
                        <span className="dp-news-card-arrow">
                          <Arrow />
                        </span>
                      </div>
                    </div>
                    {examNote && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: "rgba(216,196,140,.15)",
                          border: "1px solid rgba(216,196,140,.4)",
                          color: "#e6d3a0",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        {t("examPrepDoctorsOnly", {
                          defaultValue:
                            "Раздел «Подготовка к экзаменам» доступен только врачам. Войдите как врач.",
                        })}
                      </div>
                    )}
                  </motion.div>

                  <motion.div variants={item} style={{ marginBottom: 12 }}>
                    <Link
                      to="/public/user-synthesis"
                      className="dp-news-card"
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        className="dp-news-card-accent"
                        style={{
                          background:
                            "linear-gradient(180deg, #b83030, #7f1d1d)",
                        }}
                      />
                      <div className="dp-news-card-body">
                        <div className="dp-news-card-icon">✍️</div>
                        <div className="dp-news-card-copy">
                          <div className="dp-news-card-tag">
                            {"DocPats · AI Synthesis · "}
                            {t("freeTag", { defaultValue: "Бесплатно" })}
                          </div>
                          <div className="dp-news-card-text">
                            {t("synthesisText", {
                              defaultValue:
                                "Создать научную статью по медицинским источникам",
                            })}
                          </div>
                        </div>
                        <span className="dp-news-card-arrow">
                          <Arrow />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                  <motion.div className="dp-news-card-wrap" variants={item}>
                    <a
                      href="/consultation"
                      className="dp-news-card"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div
                        className="dp-news-card-accent"
                        style={{
                          background:
                            "linear-gradient(180deg, #a78bfa, #7c3aed)",
                        }}
                      />
                      <div className="dp-news-card-body">
                        <div className="dp-news-card-icon">⚕</div>
                        <div className="dp-news-card-copy">
                          <div className="dp-news-card-tag">
                            {"AI · "}
                            {t("freeTag", { defaultValue: "Бесплатно" })}
                          </div>
                          <div className="dp-news-card-text">
                            {t("nav.aiConsult") ||
                              "AI Медицинская Консультация → Эпикриз"}
                          </div>
                        </div>
                        <span className="dp-news-card-arrow">
                          <Arrow />
                        </span>
                      </div>
                    </a>
                  </motion.div>
                  {/* News card */}
                  <motion.div className="dp-news-card-wrap" variants={item}>
                    <a href="/public/news" className="dp-news-card">
                      <div className="dp-news-card-accent" />
                      <div className="dp-news-card-body">
                        <div className="dp-news-card-icon">📰</div>
                        <div className="dp-news-card-copy">
                          <div className="dp-news-card-tag">
                            {t("newsResearchTag", {
                              defaultValue: "Latest Medical Research",
                            })}
                          </div>
                          <div className="dp-news-card-text">
                            {t("nav.newsLink") ||
                              "Medical news and research · latest data"}
                          </div>
                        </div>
                        <span className="dp-news-card-arrow">
                          <Arrow />
                        </span>
                      </div>
                    </a>
                  </motion.div>
                  {/* Аналитические статьи — отдельная страница.
                      Раньше на неё вела вкладка внутри ленты новостей, и лента
                      на ней обрывалась: человек уходил со страницы, не понимая
                      куда. Теперь вкладка листает аналитику внутри ленты, а
                      целая витрина открывается отсюда — осознанным переходом. */}
                  <motion.div className="dp-news-card-wrap" variants={item}>
                    <a href="/public/articles" className="dp-news-card">
                      <div className="dp-news-card-accent" />
                      <div className="dp-news-card-body">
                        <div className="dp-news-card-icon">🧬</div>
                        <div className="dp-news-card-copy">
                          <div className="dp-news-card-tag">
                            {t("analyticsTag", {
                              defaultValue: "DOCPATS · AI SYNTHESIS",
                            })}
                          </div>
                          <div className="dp-news-card-text">
                            {t("nav.analyticsLink", {
                              defaultValue:
                                "Аналитические статьи · синтез медицинских источников",
                            })}
                          </div>
                        </div>
                        <span className="dp-news-card-arrow">
                          <Arrow />
                        </span>
                      </div>
                    </a>
                  </motion.div>

                  {/* Anthem */}
                  <motion.div variants={item} style={{ marginBottom: 22 }}>
                    <button className="dp-anthem" onClick={toggleAnthem}>
                      <div className="dp-anthem-icon">
                        {playing ? "⏸" : "🎵"}
                      </div>
                      {playing && (
                        <div className="dp-anthem-wave">
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                        </div>
                      )}
                      <div className="dp-anthem-meta">
                        <span className="dp-anthem-title">
                          {playing
                            ? "Playing DocPats Soundtrack"
                            : "DocPats Global Soundtrack"}
                        </span>
                        <span className="dp-anthem-sub">
                          Music by Tamerlan I. · Licensed
                        </span>
                      </div>
                    </button>
                    <audio ref={audioRef}>
                      <source
                        src="/audio/nadiwijaya-cinematic-epic-orchestral-259560.wav"
                        type="audio/mpeg"
                      />
                    </audio>
                  </motion.div>

                  {/* Trust */}
                  <motion.div className="dp-trust-row" variants={item}>
                    {[
                      t("trust1") || "HIPAA Certified",
                      t("trust2") || "ISO 27001",
                      t("trust3") || "SOC 2 Type II",
                      t("trust4") || "GDPR Ready",
                    ].map((l, i, a) => (
                      <React.Fragment key={l}>
                        <div className="dp-trust-badge">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 13 13"
                            fill="none"
                          >
                            <path
                              d="M2 6.5l3 3 5.5-5.5"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {l}
                        </div>
                        {i < a.length - 1 && <div className="dp-trust-sep" />}
                      </React.Fragment>
                    ))}
                  </motion.div>
                </div>

                {/* Right stat cards */}
                <motion.div
                  className="dp-hero-right"
                  style={{ y: imageY }}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.9,
                    delay: 0.3,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className="dp-stat-hero c-teal">
                    <div className="dp-stat-hero-icon">🔒</div>
                    <div>
                      <div className="dp-stat-hero-num">HIPAA</div>
                      <div className="dp-stat-hero-label">
                        {t("stat.compliant", {
                          defaultValue: "Безопасность и приватность данных",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="dp-stat-hero c-green">
                    <div className="dp-stat-hero-icon">🤖</div>
                    <div>
                      <div className="dp-stat-hero-num">AI</div>
                      <div className="dp-stat-hero-label">
                        {t("stat.aiCare", {
                          defaultValue: "Консультации и анализ",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="dp-stat-row">
                    <div className="dp-stat-mini">
                      <div className="dp-stat-mini-num">5</div>
                      <div className="dp-stat-mini-label">
                        {t("stat.languages", { defaultValue: "языков" })}
                      </div>
                    </div>
                    <div className="dp-stat-mini">
                      <div className="dp-stat-mini-num">24/7</div>
                      <div className="dp-stat-mini-label">
                        {t("stat.access", { defaultValue: "доступ" })}
                      </div>
                    </div>
                  </div>
                  <div className="dp-stat-hero c-gold">
                    <div className="dp-stat-hero-icon">🚀</div>
                    <div>
                      <div className="dp-stat-hero-num">
                        {t("stat.betaNum", { defaultValue: "Бета" })}
                      </div>
                      <div className="dp-stat-hero-label">
                        {t("stat.beta", {
                          defaultValue:
                            "Открытый запуск — присоединяйтесь первыми",
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.section>

            {/* ══ LOGOS BAR ══ */}
            <motion.div className="dp-logos-bar" variants={item}>
              <div className="dp-logos-inner">
                <div className="dp-logos-label">
                  {t("logosLabel", { defaultValue: "Что внутри" })}
                </div>
                <div className="dp-logos-sep" />
                <div className="dp-logos-list">
                  {[
                    "HIPAA-oriented",
                    "AES-256 encryption",
                    "AI consultations",
                    "Video calls",
                    "Multi-clinic",
                    "5 languages",
                  ].map((n) => (
                    <div className="dp-logo-item" key={n}>
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ══ METRICS BAR ══ */}
            <motion.div className="dp-metrics-bar" variants={item}>
              <div className="dp-metrics-inner">
                {[
                  {
                    num: "HIPAA",
                    label: t("metric.compliance", {
                      defaultValue: "Комплаенс",
                    }),
                    sub: "Audit + encryption",
                  },
                  {
                    num: "AI",
                    label: t("metric.aiCare", {
                      defaultValue: "AI-консультации",
                    }),
                    sub: "Symptom checker + SOAP",
                  },
                  {
                    num: "5",
                    label: t("metric.languages", { defaultValue: "языков" }),
                    sub: "ru · en · az · tr · ar",
                  },
                  {
                    num: "AES-256",
                    label: t("metric.encryption", {
                      defaultValue: "Шифрование",
                    }),
                    sub: "PHI at rest",
                  },
                ].map((m) => (
                  <div className="dp-metric-cell" key={m.label}>
                    <div className="dp-metric-num">{m.num}</div>
                    <div className="dp-metric-label">{m.label}</div>
                    <div className="dp-metric-sub">{m.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ══ FEATURES ══ */}
            <motion.section
              className="dp-section dp-features-bg"
              id="features"
              variants={item}
            >
              <div className="dp-section-inner">
                <div className="dp-section-header">
                  <div className="dp-eyebrow">
                    {t("featuresTag") || "Platform Capabilities"}
                  </div>
                  <h2 className="dp-section-title">
                    {t("featuresTitle") || "Built for the demands"}
                    <br />
                    <em>{t("featuresTitle2") || "of modern medicine"}</em>
                  </h2>
                  <p className="dp-section-sub">
                    {t("seoP1") ||
                      "Every feature engineered to meet the highest standards of healthcare delivery, privacy, and interoperability."}
                  </p>
                </div>
                <div className="dp-features-grid">
                  {features.map((f) => (
                    <div className="dp-feature-card" key={f.title}>
                      <div className={`dp-feature-icon ${f.color}`}>
                        {f.icon}
                      </div>
                      <div className="dp-feature-title">{f.title}</div>
                      <div className="dp-feature-desc">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* ══ MEDICAL INSIGHTS ══ */}
            <motion.section className="dp-section" variants={item}>
              <div className="dp-section-inner">
                <div className="dp-section-header">
                  <div className="dp-eyebrow">{t("insightsTag")}</div>
                  <h2 className="dp-section-title">
                    {t("insightsTitle")}
                    <br />
                    <em>{t("insightsTitle2")}</em>
                  </h2>
                  <p className="dp-section-sub">{t("insightsDesc")}</p>
                </div>
                <div className="dp-features-grid">
                  {[
                    {
                      icon: "🧠",
                      title: t("insight1Title"),
                      desc: t("insight1Desc"),
                    },
                    {
                      icon: "🫀",
                      title: t("insight2Title"),
                      desc: t("insight2Desc"),
                    },
                    {
                      icon: "🧬",
                      title: t("insight3Title"),
                      desc: t("insight3Desc"),
                    },
                    {
                      icon: "🧑‍⚕️",
                      title: t("insight4Title"),
                      desc: t("insight4Desc"),
                    },
                  ].map((f) => (
                    <div className="dp-feature-card" key={f.title}>
                      <div className="dp-feature-icon">{f.icon}</div>
                      <div className="dp-feature-title">{f.title}</div>
                      <div className="dp-feature-desc">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* ══ ROLES ══ */}
            <motion.section
              className="dp-section dp-roles-bg"
              id="roles"
              variants={item}
            >
              <div className="dp-section-inner">
                <div className="dp-section-header">
                  <div className="dp-eyebrow">
                    {t("rolesTag") || "Choose Your Path"}
                  </div>
                  <h2 className="dp-section-title">
                    {t("rolesTitle") || "One platform,"}
                    <br />
                    <em>{t("rolesTitle2") || "two experiences"}</em>
                  </h2>
                  <p className="dp-section-sub">
                    {t("rolesSub") ||
                      "Access the right tools for your role, designed for clinicians and patients alike."}
                  </p>
                </div>
                <div className="dp-roles-grid">
                  {/* Patient */}
                  <div
                    className="dp-role-card dp-role-patient"
                    onClick={() => navigate("/patient/home-page")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="dp-role-deco" />
                    <div className="dp-role-inner">
                      <div className="dp-role-icon-wrap">👤</div>
                      <div className="dp-role-label">Patient Portal</div>
                      <div className="dp-role-title">
                        {t("rolePatient.title") || (
                          <>
                            For <em>Patients</em>
                          </>
                        )}
                      </div>
                      <p className="dp-role-desc">
                        {t("rolePatient.desc") ||
                          "Take control of your health journey. Book appointments, communicate with your care team, and access your complete medical history."}
                      </p>
                      <div className="dp-role-perks">
                        {patientPerks.map((p) => (
                          <div className="dp-role-perk" key={p}>
                            <div className="dp-role-perk-check">
                              <Check />
                            </div>
                            {p}
                          </div>
                        ))}
                      </div>
                      <button
                        className="dp-role-cta"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/patient/home-page");
                        }}
                      >
                        {t("rolePatient.cta") || "Enter Patient Portal"}{" "}
                        <Arrow />
                      </button>
                    </div>
                  </div>
                  {/* Doctor */}
                  <div
                    className="dp-role-card dp-role-doctor"
                    onClick={() => navigate("/doctor/home-page")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="dp-role-deco" />
                    <div className="dp-role-inner">
                      <div className="dp-role-icon-wrap">👨‍⚕️</div>
                      <div className="dp-role-label">Doctor Portal</div>
                      <div className="dp-role-title">
                        {t("roleDoctor.title") || (
                          <>
                            For <em>Doctors</em>
                          </>
                        )}
                      </div>
                      <p className="dp-role-desc">
                        {t("roleDoctor.desc") ||
                          "A professional-grade workspace for clinicians. Manage your practice, connect with patients, and leverage AI tools — all in one place."}
                      </p>
                      <div className="dp-role-perks">
                        {doctorPerks.map((p) => (
                          <div className="dp-role-perk" key={p}>
                            <div className="dp-role-perk-check">
                              <Check />
                            </div>
                            {p}
                          </div>
                        ))}
                      </div>
                      <button
                        className="dp-role-cta"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/doctor/home-page");
                        }}
                      >
                        {t("roleDoctor.cta") || "Enter Doctor Portal"} <Arrow />
                      </button>
                    </div>
                  </div>
                  {/* Clinic */}
                  <div
                    className="dp-role-card dp-role-clinic"
                    onClick={() => navigate("/clinic/staff-login")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="dp-role-deco" />
                    <div className="dp-role-inner">
                      <div className="dp-role-icon-wrap">🏥</div>
                      <div className="dp-role-label">Clinic Portal</div>
                      <div className="dp-role-title">
                        {t("roleClinic.title") || (
                          <>
                            For <em>Clinics</em>
                          </>
                        )}
                      </div>
                      <p className="dp-role-desc">
                        {t("roleClinic.desc") ||
                          "Run the whole clinic: branches, staff and access rights, appointment scheduling and an audit trail over medical data."}
                      </p>
                      <div className="dp-role-perks">
                        {clinicPerks.map((p) => (
                          <div className="dp-role-perk" key={p}>
                            <div className="dp-role-perk-check">
                              <Check />
                            </div>
                            {p}
                          </div>
                        ))}
                      </div>
                      <button
                        className="dp-role-cta"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/clinic/staff-login");
                        }}
                      >
                        {t("roleClinic.cta") || "Clinic Sign-In"} <Arrow />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* ══ MEDICAL KNOWLEDGE ══ */}
            <motion.section
              className="dp-section dp-features-bg"
              variants={item}
            >
              <div className="dp-section-inner">
                <div className="dp-section-header">
                  <div className="dp-eyebrow">{t("knowledgeTag")}</div>
                  <h2 className="dp-section-title">
                    {t("knowledgeTitle")}
                    <br />
                    <em>{t("knowledgeTitle2")}</em>
                  </h2>
                  <p className="dp-section-sub">{t("knowledgeDesc")}</p>
                </div>
                <div className="dp-features-grid">
                  {[
                    {
                      icon: "🧠",
                      title: t("knowledge1Title"),
                      desc: t("knowledge1Desc"),
                    },
                    {
                      icon: "🫀",
                      title: t("knowledge2Title"),
                      desc: t("knowledge2Desc"),
                    },
                    {
                      icon: "🫁",
                      title: t("knowledge3Title"),
                      desc: t("knowledge3Desc"),
                    },
                    {
                      icon: "🦠",
                      title: t("knowledge4Title"),
                      desc: t("knowledge4Desc"),
                    },
                  ].map((f) => (
                    <div className="dp-feature-card" key={f.title}>
                      <div className="dp-feature-icon green">{f.icon}</div>
                      <div className="dp-feature-title">{f.title}</div>
                      <div className="dp-feature-desc">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* ══ COMPLIANCE ══ */}
            <motion.section
              className="dp-section"
              id="compliance"
              variants={item}
            >
              <div className="dp-section-inner">
                <div className="dp-compliance-grid">
                  <div>
                    <div className="dp-eyebrow">
                      {t("complianceTag") || "Security & Compliance"}
                    </div>
                    <h2 className="dp-section-title">
                      {t("complianceTitle") || "Enterprise-grade"}
                      <br />
                      <em>{t("complianceTitle2") || "security by default"}</em>
                    </h2>
                    <p className="dp-section-sub" style={{ marginBottom: 0 }}>
                      {t("seoP2") ||
                        "Patient data is encrypted at rest and in transit. We maintain strict compliance with global healthcare regulations so you can focus on care."}
                    </p>
                  </div>
                  <div className="dp-compliance-badges">
                    {[
                      { icon: "🛡️", name: "HIPAA", desc: "§164.312 compliant" },
                      { icon: "🇪🇺", name: "GDPR", desc: "EU data protection" },
                      {
                        icon: "🔐",
                        name: "AES-256",
                        desc: "End-to-end encrypt",
                      },
                      {
                        icon: "📋",
                        name: "ISO 27001",
                        desc: "Info security mgmt",
                      },
                    ].map((b) => (
                      <div className="dp-compliance-badge" key={b.name}>
                        <span className="dp-compliance-badge-icon">
                          {b.icon}
                        </span>
                        <div className="dp-compliance-badge-name">{b.name}</div>
                        <div className="dp-compliance-badge-desc">{b.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* ══ HOW IT WORKS ══ */}
            <motion.section
              className="dp-section dp-features-bg"
              variants={item}
            >
              <div className="dp-section-inner">
                <div className="dp-section-header">
                  <div className="dp-eyebrow">{t("howTag")}</div>
                  <h2 className="dp-section-title">
                    {t("howTitle")}
                    <br />
                    <em>{t("howTitle2")}</em>
                  </h2>
                  <p className="dp-section-sub">{t("howDesc")}</p>
                </div>
                <div className="dp-features-grid">
                  {[
                    {
                      icon: "👤",
                      title: t("howStep1Title"),
                      desc: t("howStep1Desc"),
                    },
                    {
                      icon: "🔗",
                      title: t("howStep2Title"),
                      desc: t("howStep2Desc"),
                    },
                    {
                      icon: "📁",
                      title: t("howStep3Title"),
                      desc: t("howStep3Desc"),
                    },
                    {
                      icon: "🤝",
                      title: t("howStep4Title"),
                      desc: t("howStep4Desc"),
                    },
                  ].map((f) => (
                    <div className="dp-feature-card" key={f.title}>
                      <div className="dp-feature-icon purple">{f.icon}</div>
                      <div className="dp-feature-title">{f.title}</div>
                      <div className="dp-feature-desc">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* ══ SEO ══ */}
            <motion.section className="dp-seo" variants={item}>
              <h2>{t("seoTitle") || "Why DocPats MedConnect?"}</h2>
              <p>
                {t("seoP1") ||
                  "DocPats MedConnect is a next-generation telemedicine platform designed to bridge the gap between healthcare providers and patients across borders."}
              </p>
              <p>
                {t("seoP2") ||
                  "Our platform supports multi-language consultations, asynchronous messaging, and real-time video calls — all within a HIPAA-compliant infrastructure."}
              </p>
              <h3>{t("seoSubTitle") || "Trusted by Clinicians Worldwide"}</h3>
              <p>
                {t("seoP3") ||
                  "From solo practitioners to large hospital networks, DocPats scales to meet the demands of any healthcare organisation."}
              </p>
            </motion.section>

            {/* ══ REGISTER HINT ══ */}
            <motion.div
              variants={item}
              style={{ textAlign: "center", padding: "0 20px 44px" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--ink3)",
                }}
              >
                {t("registerHint") || "New to DocPats?"}{" "}
                <Link
                  to="/registration"
                  style={{
                    color: "var(--teal)",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  {t("registerLink") || "Create your account →"}
                </Link>
              </p>
            </motion.div>

            {/* ══ FOOTER ══ */}
            {/* ══ FOOTER ══ */}
            <footer className="dp-footer">
              <a className="dp-footer-logo" href="/">
                <div className="dp-footer-logo-name">
                  Doc<em>Pats</em>
                </div>
              </a>
              <div className="dp-footer-links">
                {/* Разделы про продукт идут первыми: это то, зачем сюда
                    приходит человек, который ещё не зарегистрировался.
                    Тексты — client/public/docs/for-{doctors,patients}/ */}
                <Link className="dp-footer-link" to="/docs/for-doctors">
                  {t("footer.forDoctors") || "Врачам"}
                </Link>
                <Link className="dp-footer-link" to="/docs/for-patients">
                  {t("footer.forPatients") || "Пациентам"}
                </Link>
                <a className="dp-footer-link" href="/consultation">
                  {t("footer.aiConsult") || "AI Консультация"}
                </a>
                <a className="dp-footer-link" href="/terms-consent-page">
                  {t("footer.terms") || "Terms"}
                </a>
                <a className="dp-footer-link" href="#">
                  {t("footer.privacy") || "Privacy"}
                </a>
                <a className="dp-footer-link" href="#">
                  {t("footer.hipaa") || "HIPAA"}
                </a>
                <a className="dp-footer-link" href="#">
                  {t("footer.contact") || "Contact"}
                </a>
                <a className="dp-footer-link" href="/public/about">
                  {t("footer.about") || "О проекте"}
                </a>
                <Link className="dp-footer-link" to="/clinic/staff-login">
                  {t("footer.staffLogin") || "Вход для клиник"}
                </Link>
              </div>
              <div className="dp-footer-copy">
                © {new Date().getFullYear()}{" "}
                {t("footer.copyright") ||
                  "DocPats MedConnect · All rights reserved"}
              </div>
            </footer>
          </motion.div>
        )}
      </div>
    </>
  );
}
