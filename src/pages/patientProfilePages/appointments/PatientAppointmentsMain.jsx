import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { FaCalendarPlus, FaCalendarCheck, FaHistory } from "react-icons/fa";
import { useTranslation } from "react-i18next";

/* ====================== Стили ====================== */
const PAStyles = () => (
  <style>{`
    @keyframes pa-fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .pa-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 50%, #eff6ff 100%);
      padding: 32px 20px 80px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .pa-wrap {
      max-width: 1100px;
      margin: 0 auto;
    }

    /* ── Hero header ── */
    .pa-header {
      position: relative;
      padding: 34px 36px;
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 55%, #0369a1 100%);
      border-radius: 22px;
      color: white;
      overflow: hidden;
      margin-bottom: 22px;
      box-shadow: 0 14px 36px -16px rgba(15, 118, 110, 0.45);
      text-align: center;
    }
    .pa-header::before {
      content: "";
      position: absolute;
      top: -120px; right: -80px;
      width: 340px; height: 340px;
      background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%);
      pointer-events: none;
    }
    .pa-header::after {
      content: "";
      position: absolute;
      bottom: -100px; left: -60px;
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
      pointer-events: none;
    }
    .pa-header-content { position: relative; z-index: 1; }
    .pa-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.92);
      background: rgba(255,255,255,0.14);
      padding: 5px 14px;
      border-radius: 999px;
      margin-bottom: 14px;
      border: 1px solid rgba(255,255,255,0.18);
    }
    .pa-eyebrow .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.35);
    }
    .pa-title {
      font-size: clamp(24px, 3.4vw, 34px);
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 8px;
      line-height: 1.15;
    }
    .pa-subtitle {
      font-size: 15px;
      color: rgba(255,255,255,0.88);
      margin: 0 auto;
      max-width: 520px;
    }

    /* ── Tabs ── */
    .pa-tabs {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 22px;
    }
    @media (max-width: 760px) {
      .pa-tabs { grid-template-columns: 1fr; }
    }

    .pa-tab-link { text-decoration: none; color: inherit; }
    .pa-tab {
      position: relative;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 22px 22px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(.4,0,.2,1);
      overflow: hidden;
      min-height: 170px;
    }
    .pa-tab::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .pa-tab:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 28px -14px rgba(15, 23, 42, 0.2);
      border-color: transparent;
    }
    .pa-tab:hover::before { opacity: 1; }

    /* Accent colors per tab */
    .pa-tab.tab-book::before { background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%); }
    .pa-tab.tab-my::before { background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%); }
    .pa-tab.tab-history::before { background: linear-gradient(90deg, #f7971e 0%, #ffd200 100%); }

    /* Icon circle */
    .pa-tab-icon {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      margin-bottom: 14px;
      transition: all 0.25s ease;
    }
    .pa-tab.tab-book .pa-tab-icon { background: #ecfeff; color: #0891b2; }
    .pa-tab.tab-my .pa-tab-icon { background: #dcfce7; color: #15803d; }
    .pa-tab.tab-history .pa-tab-icon { background: #fef3c7; color: #b45309; }

    .pa-tab-label {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
      letter-spacing: -0.01em;
    }
    .pa-tab-desc {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      margin: 0;
    }

    /* Active state */
    .pa-tab.active {
      color: white;
      border-color: transparent;
      transform: translateY(-2px);
    }
    .pa-tab.tab-book.active {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      box-shadow: 0 14px 30px -10px rgba(0, 150, 255, 0.55);
    }
    .pa-tab.tab-my.active {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      box-shadow: 0 14px 30px -10px rgba(67, 233, 123, 0.55);
    }
    .pa-tab.tab-history.active {
      background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
      box-shadow: 0 14px 30px -10px rgba(247, 151, 30, 0.55);
    }
    .pa-tab.active::before { opacity: 0; }
    .pa-tab.active .pa-tab-icon {
      background: rgba(255, 255, 255, 0.25);
      color: white;
      backdrop-filter: blur(6px);
    }
    .pa-tab.active .pa-tab-label { color: white; }
    .pa-tab.active .pa-tab-desc { color: rgba(255, 255, 255, 0.92); }

    .pa-tab-active-dot {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.35);
    }

    /* ── Content area ── */
    .pa-content {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 28px;
      min-height: 320px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      animation: pa-fadeIn 0.4s ease-in-out;
    }

    @media (max-width: 640px) {
      .pa-page { padding: 20px 14px 60px; }
      .pa-header { padding: 26px 22px; border-radius: 18px; }
      .pa-content { padding: 20px; border-radius: 16px; }
    }
  `}</style>
);

export default function PatientAppointmentsMain() {
  const { t, i18n } = useTranslation("PatuentTranslate");
  const location = useLocation();

  /* ── язык / направление текста ── */
  const currentLang = (i18n.language || "ru").split("-")[0];
  const isRTL = currentLang === "ar";

  const tabs = [
    {
      path: "/patient/appointment",
      label: t("patientAppointments.tabs.book.label"),
      icon: <FaCalendarPlus className="me-2" />,
      desc: t("patientAppointments.tabs.book.desc"),
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    {
      path: "/patient/my-appointment",
      label: t("patientAppointments.tabs.my.label"),
      icon: <FaCalendarCheck className="me-2" />,
      desc: t("patientAppointments.tabs.my.desc"),
      color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    },
    {
      path: "/patient/my-appointment-history",
      label: t("patientAppointments.tabs.history.label"),
      icon: <FaHistory className="me-2" />,
      desc: t("patientAppointments.tabs.history.desc"),
      color: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
    },
  ];

  // Маппинг пути → CSS-класс для цветового акцента
  const tabClassByPath = {
    "/patient/appointment": "tab-book",
    "/patient/my-appointment": "tab-my",
    "/patient/my-appointment-history": "tab-history",
  };

  return (
    <div className="pa-page" dir={isRTL ? "rtl" : "ltr"}>
      <PAStyles />

      <div className="pa-wrap">
        {/* ── Hero header ── */}
        <div className="pa-header">
          <div className="pa-header-content">
            <div className="pa-eyebrow">
              <span className="dot" />
              {t("patientAppointments.header.eyebrow")}
            </div>
            <h1 className="pa-title">
              {t("patientAppointments.header.title")}
            </h1>
            <p className="pa-subtitle">
              {t("patientAppointments.header.subtitle")}
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="pa-tabs">
          {tabs.map((tab) => {
            const active = location.pathname === tab.path;
            const variantClass = tabClassByPath[tab.path] || "";
            return (
              <Link key={tab.path} to={tab.path} className="pa-tab-link">
                <div
                  className={`pa-tab ${variantClass} ${active ? "active" : ""}`}
                >
                  {active && <span className="pa-tab-active-dot" />}
                  <div className="pa-tab-icon">{tab.icon}</div>
                  <h3 className="pa-tab-label">{tab.label}</h3>
                  <p className="pa-tab-desc">{tab.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Контент под вкладками ── */}
        <div className="pa-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
