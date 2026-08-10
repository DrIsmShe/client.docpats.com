import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Header from "../../components/newsAI/header/header";
import { getSession, clearSession } from "../../api/session";

export default function DashboardLayout() {
  const { t, i18n } = useTranslation("NewsAiTranslate");
  const isOpen = useSelector((state) => state.menu.isOpen);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [type, setType] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [locale, setLocale] = useState(
    () => localStorage.getItem("locale") || "en",
  );

  const API_BASE = process.env.REACT_APP_API_URL;

  // 🔑 Проверка авторизации через общий кэш сессии (getSession):
  // дедупликация одновременных вызовов + короткий TTL → один сетевой запрос
  // на весь shell вместо запроса из каждого компонента.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSession();
        if (cancelled) return;
        if (data?.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user);
          setUserRole(data.user?.role || "");
        }
      } catch (e) {
        // Не авторизован — оставляем значения по умолчанию,
        // публичные страницы /public/news и /public/articles работают без логина
        console.error("Auth check error (news):", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 🚪 Logout
  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/auth/logout`,
        {},
        { withCredentials: true },
      );
      clearSession(); // сбросить кэш сессии, чтобы следующий getSession() перепроверил сервер
      setIsAuthenticated(false);
      setUser(null);
      setUserRole("");
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error (news):", error);
    }
  };

  const FILTERS = [
    { value: "", label: t("filters.all") },
    { value: "news", label: t("news_ai_news") },
    { value: "research", label: t("research_ai_news") },
    { value: "publications", label: t("publications_ai_news") },
    { value: "doctors", label: t("doctors_ai_news") },
  ];

  return (
    <>
      <style>{CSS}</style>
      <Header
        isAuthenticated={isAuthenticated}
        user={user}
        userRole={userRole}
        onLogout={handleLogout}
        type={type}
        setType={setType}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        locale={locale}
        filters={FILTERS}
        t={t}
        i18n={i18n}
      />
      <main id="main">
        <Outlet />
      </main>

      {/* кнопка наверх */}
      <Link
        to="#"
        className="back-to-top d-flex align-items-center justify-content-center"
        title={t("go_to_top")}
      >
        <i className="bi bi-arrow-up-short"></i>
      </Link>
    </>
  );
}

// ── CSS (не трогать) ──────────────────────────
const CSS = `
.nl-hero-card-link {text-decoration: none;color: inherit;display: block;}
.nl-hero-card-link:hover .nl-hero-card {transform: translateY(-4px);box-shadow: 0 32px 80px rgba(28,25,23,.18);}
@import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,300;1,8..60,400&family=Nunito:wght@300;400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
.nl-root*,.nl-root *::before,.nl-root *::after{box-sizing:border-box}
.nl-root{--cream:#faf8f4;--cream2:#f3efe8;--parchment:#ede8df;--ink:#1c1917;--ink2:#44403c;--ink3:#78716c;--teal:#0f766e;--teal-light:#14b8a6;--teal-pale:#f0fdfa;--teal-border:#99f6e4;--border:#e7e2d8;--border2:#d6d0c6;--shadow-sm:0 2px 8px rgba(28,25,23,.07),0 1px 3px rgba(28,25,23,.04);--shadow-md:0 8px 24px rgba(28,25,23,.09),0 2px 8px rgba(28,25,23,.04);--shadow-lg:0 20px 48px rgba(28,25,23,.12),0 4px 16px rgba(28,25,23,.06);--font-display:'Merriweather','Source Serif 4',Georgia,serif;--font-body:'Nunito',system-ui,sans-serif;--font-card-serif:'DM Serif Display',Georgia,serif;--font-card-sans:'DM Sans',system-ui,sans-serif;background:var(--cream);color:var(--ink);font-family:var(--font-body);font-size:15px;-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column;overflow-x:hidden;}
.nl-topbar{background:var(--ink);color:rgba(255,255,255,.35);height:30px;padding:0 40px;display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:500;letter-spacing:.1em;text-transform:uppercase}
.nl-root[dir=rtl] .nl-topbar{letter-spacing:0}
.nl-topbar-left{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:rgba(255,255,255,.4)}
.nl-topbar-date{color:rgba(255,255,255,.3);white-space:nowrap;flex-shrink:0}
.nl-nav{background:linear-gradient(150deg,#0c4a6e 0%,#0f766e 60%,#065f46 100%);position:sticky;top:0;z-index:200;height:60px;border-bottom:1px solid rgba(255,255,255,.1);box-shadow:0 4px 20px rgba(12,74,110,.25)}
.nl-nav::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 600px 200px at 80% 50%,rgba(20,184,166,.15) 0%,transparent 70%);pointer-events:none}
.nl-nav-inner{display:flex;align-items:center;height:100%;padding:0 40px;position:relative}
.nl-hamburger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:8px;margin-inline-end:8px;flex-shrink:0}
.nl-hamburger span{display:block;width:20px;height:2px;background:white;border-radius:1px}
.nl-nav-link{font-family:var(--font-body);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.55);background:none;border:none;cursor:pointer;padding:0 14px;height:60px;transition:color .15s;white-space:nowrap;position:relative}
.nl-root[dir=rtl] .nl-nav-link{letter-spacing:0}
.nl-nav-link::after{content:'';position:absolute;bottom:0;inset-inline-start:14px;inset-inline-end:14px;height:3px;background:var(--teal-light);border-radius:2px 2px 0 0;transform:scaleX(0);transition:transform .15s}
.nl-nav-link:hover{color:rgba(255,255,255,.9)}
.nl-nav-link.active{color:white}
.nl-nav-link.active::after{transform:scaleX(1)}
.nl-nav-logo{position:absolute;left:50%;transform:translateX(-50%);font-family:var(--font-display);font-size:26px;font-weight:900;letter-spacing:-.02em;color:white;text-decoration:none;line-height:1;white-space:nowrap}
.nl-root[dir=rtl] .nl-nav-logo{left:auto;right:50%;transform:translateX(50%)}
.nl-nav-logo span{color:#5eead4}
.nl-nav-right{margin-inline-start:auto;display:flex;align-items:center;gap:10px}
@media (max-width: 768px){.nl-nav-inner{flex-wrap:wrap}.nl-nav-right{display:block}}
.nl-locale-switcher{display:flex;align-items:center;gap:2px}
.nl-locale-btn{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgb(3 3 3);background:none;border:1px solid transparent;border-radius:6px;padding:4px 8px;cursor:pointer;transition:all .12s}
.nl-locale-btn:hover{color:rgba(64,67,233,.85);border-color:rgba(199,222,230,.2)}
.nl-locale-btn.active{color:rgba(14,3,3,.3);border-color:rgba(14,3,3,.3);background:rgba(123,192,212,.1)}
.nl-btn-member{background:rgba(255,255,255,.12);color:white;border:1.5px solid rgba(255,255,255,.25);font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:8px 16px;cursor:pointer;white-space:nowrap;text-decoration:none;border-radius:8px;transition:all .15s;backdrop-filter:blur(8px)}
.nl-root[dir=rtl] .nl-btn-member{letter-spacing:0}
.nl-btn-member:hover{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.4)}
.nl-hero{background:linear-gradient(150deg,#0c4a6e 0%,#0f766e 60%,#065f46 100%);padding:44px 0 72px;position:relative;overflow:hidden}
.nl-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 700px 400px at 85% 40%,rgba(20,184,166,.18) 0%,transparent 65%),radial-gradient(ellipse 300px 500px at 5% 110%,rgba(6,95,70,.5) 0%,transparent 60%);pointer-events:none}
.nl-hero::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:60px;background:var(--cream);clip-path:ellipse(55% 100% at 50% 100%)}
.nl-hero-inner{padding:0 40px;position:relative;z-index:1}
.nl-hero-left{max-width:680px}
.nl-breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:14px}
.nl-root[dir=rtl] .nl-breadcrumb{letter-spacing:0}
.nl-breadcrumb a{color:inherit;text-decoration:none;transition:color .12s}
.nl-breadcrumb a:hover{color:rgba(255,255,255,.8)}
.nl-breadcrumb span{color:rgba(255,255,255,.75)}
.nl-breadcrumb svg{color:rgba(255,255,255,.3);flex-shrink:0}
.nl-header-tag{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.85);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:6px 16px;border-radius:100px;margin-bottom:16px}
.nl-header-tag::before{content:'';width:6px;height:6px;background:#5eead4;border-radius:50%}
.nl-hero-title{font-family:var(--font-display);font-size:clamp(28px,4vw,52px);font-weight:700;letter-spacing:-.015em;color:white;line-height:1.15;margin-bottom:10px}
.nl-root[dir=rtl] .nl-hero-title{letter-spacing:0;line-height:1.3}
.nl-hero-title em{font-style:italic;font-weight:600;color:#5eead4}
.nl-hero-sub{font-family:var(--font-display);font-size:17px;font-style:italic;color:rgba(255,255,255,.6);margin-bottom:16px}
.nl-hero-stats{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.nl-stat-chip{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.8);font-size:13px;font-weight:500;padding:6px 14px;border-radius:100px}
.nl-stat-chip b{color:white;font-weight:700}
.nl-chip-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.nl-chip-dot.news{background:#5eead4}
.nl-chip-dot.article{background:#86efac}
.nl-chip-dot.science{background:#93c5fd}
.nl-chip-dot.doctor{background:#c084fc}
.nl-filter-bar{background:white;border-bottom:1px solid var(--border);box-shadow:0 2px 12px rgba(28,25,23,.05);position:sticky;top:60px;z-index:100}
.nl-filter-bar-inner{padding:0 40px;display:flex;align-items:center;gap:12px;min-height:56px;flex-wrap:wrap}
.nl-filter-tabs{display:flex;align-items:center;gap:4px;flex-shrink:0;border-inline-end:1px solid var(--border);padding-inline-end:16px;margin-inline-end:4px}
.nl-filter-tab{font-family:var(--font-body);font-size:13px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink3);background:transparent;border:1.5px solid transparent;border-radius:8px;padding:7px 14px;cursor:pointer;transition:all .15s;white-space:nowrap}
.nl-root[dir=rtl] .nl-filter-tab{letter-spacing:0}
.nl-filter-tab:hover{background:var(--cream2);color:var(--ink2);border-color:var(--border)}
.nl-filter-tab.active{background:var(--teal-pale);border-color:var(--teal-border);color:var(--teal)}
.nl-filter-right{display:flex;align-items:center;gap:10px;flex:1;flex-wrap:wrap}
.nl-filter-search{position:relative;display:flex;align-items:center;flex:1;min-width:200px;max-width:380px}
.nl-filter-search-ico{position:absolute;inset-inline-start:11px;color:var(--ink3);pointer-events:none;flex-shrink:0}
.nl-filter-search-input{width:100%;font-family:var(--font-body);font-size:14px;color:var(--ink);background:var(--cream);border:1.5px solid var(--border);border-radius:8px;padding:8px 32px 8px 32px;outline:none;transition:all .15s}
.nl-filter-search-input::placeholder{color:var(--ink3)}
.nl-filter-search-input:focus{border-color:var(--teal);background:white;box-shadow:0 0 0 3px rgba(15,118,110,.08)}
.nl-filter-search-clear{position:absolute;inset-inline-end:9px;background:none;border:none;cursor:pointer;color:var(--ink3);font-size:11px;padding:2px;line-height:1}
.nl-filter-search-clear:hover{color:var(--ink)}
.nl-filter-adv-btn{display:flex;align-items:center;gap:7px;font-family:var(--font-body);font-size:13px;font-weight:600;color:var(--ink2);background:var(--cream);border:1.5px solid var(--border);border-radius:8px;padding:8px 14px;cursor:pointer;transition:all .15s;white-space:nowrap;flex-shrink:0;position:relative}
.nl-filter-adv-btn:hover{background:var(--cream2);border-color:var(--border2)}
.nl-filter-adv-btn.open{background:var(--teal-pale);border-color:var(--teal-border);color:var(--teal)}
.nl-filter-badge{background:var(--teal);color:white;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-inline-start:2px}
.nl-sort-wrap{display:flex;align-items:center;gap:7px;color:var(--ink3);flex-shrink:0}
.nl-sort-select{font-family:var(--font-body);font-size:13px;font-weight:600;color:var(--ink2);background:var(--cream);border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;cursor:pointer;outline:none;transition:all .15s;appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2378716c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-inline-end:28px}
.nl-sort-select:focus{border-color:var(--teal);background-color:white}
.nl-filter-apply-btn{font-family:var(--font-body);font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:var(--teal);color:white;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;transition:background .15s;white-space:nowrap;flex-shrink:0}
.nl-filter-apply-btn:hover{background:#0d6560}
.nl-adv-panel{border-top:1px solid var(--border);background:var(--cream2)}
.nl-adv-panel-inner{padding:20px 40px;display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end}
.nl-adv-field{display:flex;flex-direction:column;gap:6px;flex:1;min-width:180px}
.nl-adv-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.nl-root[dir=rtl] .nl-adv-label{letter-spacing:0}
.nl-adv-input,.nl-adv-select{font-family:var(--font-body);font-size:14px;color:var(--ink);background:white;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;outline:none;transition:all .15s;width:100%}
.nl-adv-input:focus,.nl-adv-select:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(15,118,110,.08)}
.nl-adv-select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2378716c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-inline-end:28px;cursor:pointer}
.nl-adv-actions{display:flex;gap:8px;align-items:center;flex-shrink:0}
.nl-adv-apply{font-family:var(--font-body);font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:var(--teal);color:white;border:none;border-radius:8px;padding:10px 24px;cursor:pointer;transition:background .15s;white-space:nowrap}
.nl-adv-apply:hover{background:#0d6560}
.nl-adv-reset{font-family:var(--font-body);font-size:13px;font-weight:600;color:var(--ink3);background:none;border:1.5px solid var(--border);border-radius:8px;padding:10px 16px;cursor:pointer;transition:all .15s;white-space:nowrap}
.nl-adv-reset:hover{border-color:var(--border2);color:var(--ink2)}
.nl-active-tags{display:flex;align-items:center;gap:8px;padding:10px 40px;flex-wrap:wrap;border-top:1px solid var(--border)}
.nl-active-tags-bar{background:var(--cream2)}
.nl-tag{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:500;color:var(--teal);background:var(--teal-pale);border:1px solid var(--teal-border);border-radius:100px;padding:4px 10px 4px 12px}
.nl-tag b{font-weight:700}
.nl-tag button{background:none;border:none;cursor:pointer;color:var(--teal);font-size:11px;padding:0;line-height:1;opacity:.7;margin-inline-start:2px}
.nl-tag button:hover{opacity:1}
.nl-tag-reset-all{font-size:12px;font-weight:600;color:var(--ink3);background:none;border:1px solid var(--border);border-radius:100px;padding:4px 12px;cursor:pointer;transition:all .12s;margin-inline-start:4px}
.nl-tag-reset-all:hover{color:var(--ink);border-color:var(--border2)}
.nl-content{flex:1;background:var(--cream)}
.nl-content-inner{padding:32px 40px 64px}
.nl-hero-card-wrap{margin-bottom:32px}
.nl-hero-card{background:white;border:1px solid var(--border);border-radius:20px;overflow:hidden;display:grid;grid-template-columns:1fr 2fr;min-height:340px;box-shadow:var(--shadow-lg);transition:box-shadow .25s,transform .25s;cursor:pointer}
.nl-hero-card:hover{box-shadow:0 28px 64px rgba(28,25,23,.14);transform:translateY(-3px)}
.nl-hero-card.nl-hero-card--noimg{grid-template-columns:1fr;min-height:0}
.nl-hero-card-img{position:relative;overflow:hidden}
.nl-hero-card-img img{width:450px;height:350px;object-fit:cover;transition:transform .4s ease}
.nl-hero-card:hover .nl-hero-card-img img{transform:scale(1.04)}
.nl-hero-card-overlay{position:absolute;inset:0;background:linear-gradient(135deg,rgba(12,74,110,.15) 0%,transparent 60%)}
.nl-hero-card-body{padding:36px 40px;display:flex;flex-direction:column;justify-content:center}
.nl-hero-card-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.nl-hero-badge{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:4px 12px;border-radius:100px;white-space:nowrap}
.nl-hero-badge-spec{background:var(--cream2);color:var(--ink3);border:1px solid var(--border)}
.nl-hero-date{font-size:12px;color:var(--ink3);margin-inline-start:auto}
.nl-hero-card-title{font-family:var(--font-display);font-size:clamp(18px,2vw,26px);font-weight:700;line-height:1.3;color:var(--ink);margin-bottom:14px;letter-spacing:-.01em}
.nl-hero-card-preview{font-size:14px;color:var(--ink3);line-height:1.7;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;flex:1;margin-bottom:20px}
.nl-hero-card-footer{display:flex;align-items:center;gap:8px;padding-top:16px;border-top:1px solid var(--border)}
.nl-hero-author{font-size:13px;font-weight:600;color:var(--ink2)}
.nl-hero-dot{color:var(--border2)}
.nl-hero-country{font-size:13px;color:var(--ink3)}
.nl-hero-stat{display:flex;align-items:center;gap:5px;font-size:13px;color:var(--ink3);font-weight:500}
.nl-hero-stat svg{opacity:.6}
.nl-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}
.nl-more-wrap{display:flex;justify-content:center;padding:40px 0 0}
.nl-btn-more{font-family:var(--font-body);font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--teal);background:white;border:2px solid var(--teal-border);border-radius:10px;padding:11px 36px;cursor:pointer;transition:all .2s;box-shadow:var(--shadow-sm)}
.nl-root[dir=rtl] .nl-btn-more{letter-spacing:0}
.nl-btn-more:hover:not(:disabled){background:var(--teal);color:white;border-color:var(--teal)}
.nl-btn-more:disabled{opacity:.4;cursor:not-allowed}
.nl-loading{display:flex;flex-direction:column;align-items:center;padding:80px 0;gap:16px}
.nl-spinner{width:44px;height:44px;border:3px solid var(--parchment);border-top-color:var(--teal);border-radius:50%;animation:nl-spin .7s linear infinite}
@keyframes nl-spin{to{transform:rotate(360deg)}}
.nl-loading-text{font-family:var(--font-display);font-size:18px;font-style:italic;color:var(--ink3)}
.nl-empty{display:flex;flex-direction:column;align-items:center;padding:80px 0;gap:16px}
.nl-empty-icon{font-size:48px;opacity:.35}
.nl-empty-title{font-family:var(--font-display);font-size:22px;color:var(--ink2);font-style:italic}
.nl-empty-reset{font-family:var(--font-body);font-size:14px;font-weight:600;color:var(--teal);background:var(--teal-pale);border:1.5px solid var(--teal-border);border-radius:8px;padding:10px 24px;cursor:pointer;transition:all .15s}
.nl-empty-reset:hover{background:var(--teal);color:white;border-color:var(--teal)}
.nl-footer{background:var(--ink);border-top:3px solid var(--teal);padding:28px 0;margin-top:auto}
.nl-footer-inner{padding:0 40px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.nl-footer-brand{display:flex;align-items:baseline;gap:14px}
.nl-footer-logo{font-family:var(--font-display);font-size:24px;font-weight:700;letter-spacing:-.02em;color:white}
.nl-footer-logo span{color:var(--teal-light)}
.nl-footer-tagline{font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.3)}
.nl-root[dir=rtl] .nl-footer-tagline{letter-spacing:0}
.nl-footer-links{display:flex;gap:4px}
.nl-footer-link{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.4);background:none;border:none;cursor:pointer;padding:5px 12px;border-radius:6px;transition:all .12s}
.nl-root[dir=rtl] .nl-footer-link{letter-spacing:0}
.nl-footer-link:hover{color:white;background:rgba(255,255,255,.08)}
@media(max-width:1023px) and (min-width:768px){.nl-nav-inner,.nl-topbar,.nl-hero-inner,.nl-filter-bar-inner,.nl-adv-panel-inner,.nl-content-inner,.nl-footer-inner,.nl-active-tags{padding-left:24px;padding-right:24px}.nl-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.nl-hero-card{grid-template-columns:1fr}.nl-hero-card-img{height:260px}.nl-hero-title{font-size:clamp(22px,3.5vw,32px)}}
@media(max-width:769px){.nl-topbar{padding:0 20px;font-size:9px}.nl-topbar-date{display:none}.nl-nav-inner{padding:0 20px}.nl-hamburger{display:flex}.nl-nav-links{display:none;position:absolute;top:60px;left:0;right:0;background:linear-gradient(135deg,#0c4a6e 0%,#0f766e 100%);flex-direction:column;align-items:flex-start;padding:8px 0;border-top:1px solid rgba(255,255,255,.1);z-index:300}.nl-nav-links.open{display:flex}.nl-nav-link{width:100%;padding:12px 20px;height:auto;font-size:11px}.nl-nav-link::after{display:none}.nl-nav-logo{font-size:20px}.nl-locale-btn{padding:3px 6px;font-size:9px}.nl-btn-member{display:none}.nl-hero{padding:28px 0 56px}.nl-hero-inner{padding:0 20px}.nl-hero-title{font-size:clamp(20px,6vw,28px)}.nl-filter-bar-inner{padding:0 16px;gap:8px}.nl-filter-tabs{border-inline-end:none;padding-inline-end:0;margin-inline-end:0;border-bottom:1px solid var(--border);padding-bottom:10px;width:100%;overflow-x:auto}.nl-filter-right{width:100%}.nl-filter-search{max-width:100%}.nl-adv-panel-inner{padding:16px 16px}.nl-active-tags{padding:8px 16px}.nl-content-inner{padding:20px 16px 48px}.nl-footer-inner{padding:0 20px}.nl-hero-card{grid-template-columns:1fr}.nl-hero-card-img{height:400px;width:400px}.nl-hero-card-body{padding:20px 18px}.nl-grid{grid-template-columns:1fr;gap:16px}}
@media(max-width:769px){.nl-topbar{display:none}.nl-nav-inner,.nl-hero-inner,.nl-content-inner,.nl-footer-inner{padding-left:14px;padding-right:14px}.nl-footer-brand{flex-direction:column;gap:2px}.nl-footer-links{flex-wrap:wrap}}
/* ── Карточка врача: та же типографика и ритм, что у карточек материалов ── */
.dc-card{background:#fff;border:1px solid var(--border);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--shadow-sm);transition:box-shadow .25s,transform .25s,border-color .2s}
.dc-card:hover{box-shadow:var(--shadow-md);transform:translateY(-4px);border-color:rgba(20,17,15,.15)}
.dc-strip{height:4px;flex-shrink:0;background:linear-gradient(90deg,#7c3d9f,#a855f7)}
.dc-head{display:flex;align-items:center;gap:14px;padding:20px 22px 0}
.dc-avatar{width:56px;height:56px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f5f3ff,#ede9fe);color:#7c3d9f;border:1px solid #e9d8fd}
.dc-head-text{min-width:0}
.dc-eyebrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.dc-type,.dc-spec{font-family:var(--font-card-sans);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:100px;white-space:nowrap;line-height:1.4}
.dc-type{background:rgba(124,61,159,.1);color:#7c3d9f}
.dc-spec{background:var(--cream2);color:var(--ink3);border:1px solid var(--border)}
.dc-name{font-family:var(--font-card-serif);font-size:21px;font-weight:400;line-height:1.3;letter-spacing:-.01em;color:#14110f}
.dc-name-link{color:inherit;text-decoration:none;background-image:linear-gradient(currentColor,currentColor);background-size:0% 1px;background-repeat:no-repeat;background-position:0 100%;transition:background-size .3s cubic-bezier(.4,0,.2,1)}
.dc-card:hover .dc-name-link{background-size:100% 1px}
.dc-clinic{display:flex;align-items:center;gap:6px;font-family:var(--font-card-sans);font-size:13px;font-style:italic;color:#7a7268;margin:12px 22px 0;line-height:1.4}
.dc-clinic svg{flex-shrink:0;opacity:.6}
.dc-about{font-family:var(--font-card-sans);font-size:15.5px;line-height:1.72;color:#3d3830;margin:12px 22px 16px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.dc-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto;padding:14px 22px 18px;border-top:1px solid var(--border)}
.dc-meta{font-family:var(--font-card-sans);font-size:12px;color:#7a7268;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-open{font-family:var(--font-card-sans);font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;text-decoration:none;color:#7c3d9f;border:1.5px solid currentColor;border-radius:100px;padding:6px 14px;white-space:nowrap;flex-shrink:0;opacity:.8;transition:background .18s,color .18s,opacity .18s}
.dc-open:hover{opacity:1;background:#7c3d9f;color:#fff}
@media(max-width:479px){.dc-name{font-size:17px}.dc-about{font-size:13px;-webkit-line-clamp:2}}
@media(hover:none) and (pointer:coarse){.nl-hero-card:hover{transform:none;box-shadow:var(--shadow-lg)}.nl-btn-more:hover:not(:disabled){background:white;color:var(--teal);border-color:var(--teal-border)}}
`;
