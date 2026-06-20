// src/pages/patient/AsidePatient.jsx

import React, { useEffect, useState } from "react";
import { GiPostOffice } from "react-icons/gi";
import { RiHomeOfficeFill } from "react-icons/ri";
import { GrArticle } from "react-icons/gr";
import {
  FaUsers,
  FaFacebookMessenger,
  FaCalendarCheck,
  FaComments,
  FaVideo,
} from "react-icons/fa6";
import { GoFileSubmodule } from "react-icons/go";
import { FaCommentMedical } from "react-icons/fa6";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaUserFriends, FaUserMd } from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi2";
import { getMyConsentRequests } from "../../../api/patient";

/* ─────────────── STYLES ─────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');

  .ap-sidebar {
    width: 260px;
    height: 100vh;
    background: #ffffff;
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    font-family: 'Outfit', system-ui, sans-serif;
    overflow: hidden;
  }

  /* ── LOGO / BRAND ── */
  .ap-brand {
    padding: 24px 22px 20px;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
  }
  .ap-brand-eyebrow {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 3px;
  }
  .ap-brand-name {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 600;
    color: #0f172a;
    letter-spacing: -.01em;
    line-height: 1;
  }
  .ap-brand-name span { color: #0ea5e9; }

  /* ── USER CARD ── */
  .ap-user {
    padding: 16px 22px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .ap-avatar {
    width: 38px; height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
    letter-spacing: -.02em;
  }
  .ap-user-info { flex: 1; min-width: 0; }
  .ap-user-name {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }
  .ap-user-role {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 1px;
  }
  .ap-user-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #059669;
    flex-shrink: 0;
    box-shadow: 0 0 0 2px rgba(5,150,105,.2);
  }

  /* ── NAV ── */
  .ap-nav {
    flex: 1;
    overflow-y: auto;
    padding: 12px 10px;
    scrollbar-width: thin;
    scrollbar-color: #e2e8f0 transparent;
  }
  .ap-nav::-webkit-scrollbar { width: 4px; }
  .ap-nav::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

  .ap-section-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #94a3b8;
    padding: 10px 12px 4px;
    margin-top: 4px;
  }

  .ap-link {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 9px 12px;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 500;
    color: #475569;
    text-decoration: none !important;
    transition: all .15s;
    position: relative;
    margin-bottom: 2px;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }
  .ap-link:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
  .ap-link.active {
    background: rgba(14,165,233,.08);
    color: #0ea5e9;
    font-weight: 600;
  }
  .ap-link.active .ap-icon { color: #0ea5e9; }
  .ap-link.active::before {
    content: '';
    position: absolute;
    left: 0; top: 20%; bottom: 20%;
    width: 3px;
    background: #0ea5e9;
    border-radius: 0 2px 2px 0;
  }

  /* AI Digest — особый акцент чтобы не потерялся */
  .ap-link.is-ai {
    color: #0d9488;
  }
  .ap-link.is-ai .ap-icon { color: #0d9488; }
  .ap-link.is-ai:hover {
    background: rgba(13,148,136,.08);
    color: #0d9488;
  }

  .ap-icon {
    font-size: 16px;
    color: #94a3b8;
    flex-shrink: 0;
    display: flex;
    transition: color .15s;
    width: 18px;
    justify-content: center;
  }

  /* ── BADGE (Sprint 3.2 pending count) ── */
  .ap-link-badge {
    margin-left: auto;
    background: #ef4444;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
    line-height: 1.3;
    box-shadow: 0 1px 2px rgba(239,68,68,.3);
    animation: ap-badge-pulse 2s ease-in-out infinite;
  }
  @keyframes ap-badge-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }

  /* ── LOGOUT ── */
  .ap-footer {
    padding: 10px 10px 16px;
    border-top: 1px solid #e2e8f0;
    flex-shrink: 0;
  }
  .ap-logout {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 9px 12px;
    border-radius: 10px;
    font-family: 'Outfit', system-ui, sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    color: #e11d48;
    cursor: pointer;
    transition: all .15s;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }
  .ap-logout:hover {
    background: rgba(225,29,72,.06);
  }
  .ap-logout-icon {
    font-size: 16px;
    flex-shrink: 0;
    display: flex;
    width: 18px;
    justify-content: center;
  }
`;

export default function AsidePatient() {
  const { t } = useTranslation();
  const isOpen = useSelector((state) => state.menu.isOpen);
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = process.env.REACT_APP_API_URL;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({});
  const [userId, setUserId] = useState(null);

  // Sprint 3.2 — pending consent requests count
  const [pendingConsentRequests, setPendingConsentRequests] = useState(0);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/auth/logout`,
        {},
        { withCredentials: true },
      );
      alert(t("AsidePatient.messages.logoutSuccess"));
      navigate("/login");
    } catch (error) {
      console.error("Error while logging out:", error);
      alert(t("AsidePatient.messages.logoutError"));
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });

        const ssUserId = sessionStorage.getItem("userId");

        if (data?.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user || {});
          const uid =
            data.user?.userId ||
            data.user?._id ||
            data.user?.id ||
            ssUserId ||
            null;
          setUserId(uid);
        } else {
          setIsAuthenticated(false);
          if (ssUserId) setUserId(ssUserId);
        }
      } catch (e) {
        console.error("Auth check error:", e);
        const ssUserId = sessionStorage.getItem("userId");
        if (ssUserId) setUserId(ssUserId);
      }
    })();
  }, []);

  // Sprint 3.2 — fetch pending consent requests count for badge
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchPendingCount = async () => {
      try {
        const data = await getMyConsentRequests();
        const count =
          typeof data?.count === "number"
            ? data.count
            : Array.isArray(data?.items)
              ? data.items.length
              : 0;
        setPendingConsentRequests(count);
      } catch (err) {
        // Silently ignore — badge just won't show if endpoint fails
        console.warn(
          "[AsidePatient] Failed to load pending consent count:",
          err?.message,
        );
        setPendingConsentRequests(0);
      }
    };

    fetchPendingCount();

    // Refresh on visibility change & focus (e.g. when patient returns from another tab)
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchPendingCount();
    };
    const onFocus = () => fetchPendingCount();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    // Poll every 60 seconds while tab is active
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") fetchPendingCount();
    }, 60000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const myOfficeHref = `/patient/patient-profile/${userId ?? ""}`;

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  /* Initials from name */
  const initials = (() => {
    const name = user?.firstName || user?.name || user?.fullName || "";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    return "P";
  })();

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : user?.name || user?.fullName || t("AsidePatient.menu.home");

  const navItems = [
    {
      section: null,
      items: [
        {
          to: "/patient/home-page",
          icon: <RiHomeOfficeFill />,
          label: t("AsidePatient.menu.home"),
        },
        {
          to: myOfficeHref,
          icon: <GiPostOffice />,
          label: t("AsidePatient.menu.myOffice"),
        },
      ],
    },
    // ─── Digest AI ────────────────────────────────────────────
    {
      section: t("digestAi"),
      items: [
        {
          to: "/public/user-synthesis",
          icon: <HiOutlineSparkles />,
          label: t("aiSynthesis"),
          external: true, // открывает в новой вкладке
          accent: "ai", // подсвечивает teal-цветом
        },
      ],
    },
    // ──────────────────────────────────────────────────────────
    {
      section: t("AsidePatient.sections.medicine"), // ✅ было: "Медицина"
      items: [
        {
          to: "/patient/get-patients-files",
          icon: <GoFileSubmodule />,
          label: t("AsidePatient.menu.myMedicalFiles"),
        },
        {
          to: "/patient/my-lab-results",
          icon: <GoFileSubmodule />,
          label: t("AsidePatient.menu.myLabResults", "Мои анализы"),
        },
        {
          to: "/patient/my-prescriptions",
          label: t("AsidePatient.menu.myPrescriptions", "Мои рецепты"),
        },
        {
          to: "/patient/my-medical-histories",
          icon: <FaCommentMedical />,
          label: t("AsidePatient.menu.myMedicalHistories"),
        },
      ],
    },
    {
      section: t("AsidePatient.sections.content"), // ✅ было: "Контент"
      items: [
        {
          to: "/patient/news",
          icon: <GrArticle />,
          label: t("AsidePatient.menu.articles"), // ✅ было: "Medical Feed"
        },
      ],
    },
    {
      section: t("AsidePatient.sections.content"), // ✅ было: "Контент"
      items: [
        {
          to: "/patient/consultation-ai",
          icon: <GrArticle />,
          label: t("ai_medical_consultation"), // ✅ было: "Medical Feed"
        },
      ],
    },
    {
      section: t("AsidePatient.sections.doctors"), // ✅ было: "Врачи"
      items: [
        {
          to: "/patient/doctors",
          icon: <FaUserMd />,
          label: t("AsidePatient.menu.allDoctors"),
        },
        {
          to: "/patient/my-doctors",
          icon: <FaUserFriends />,
          label: t("AsidePatient.menu.myDoctors"),
        },
        {
          to: "/patient/my-clinics",
          icon: <GiPostOffice />,
          label: t("AsidePatient.menu.myClinics"),
        },
        // Sprint 3.2 — Pull Consent: clinic-initiated access requests
        {
          to: "/patient/consent-requests",
          icon: <MdOutlineNotificationsActive />,
          label: t("AsidePatient.menu.consentRequests", "Запросы доступа"),
          badge: pendingConsentRequests,
        },
        {
          to: "/patient/appointments-info",
          icon: <FaCalendarCheck />,
          label: t("AsidePatient.menu.appointments"),
        },
        // Телемед — онлайн-консультации пациента (Jitsi)
        {
          to: "/patient/telemed",
          icon: <FaVideo />,
          label: t("AsidePatient.menu.telemed", "Онлайн-консультации"),
        },
        {
          to: "/patient/communication",
          icon: <FaComments />,
          label: t("chat"),
        },
      ],
    },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="ap-root">
      <style>{S}</style>

      <aside
        id={isOpen ? "sidebar-hidden open" : "sidebar-hidden"}
        className={`ap-sidebar ${isOpen ? "sidebar open" : "sidebar"}`}
      >
        {/* Brand */}
        <div className="ap-brand">
          <div className="ap-brand-eyebrow">
            {t("AsidePatient.brand.eyebrow")}{" "}
            {/* ✅ было: "Медицинская платформа" */}
          </div>
          <div className="ap-brand-name">
            Doc<span>Pats</span>
          </div>
        </div>

        {/* User */}
        <div className="ap-user">
          <div className="ap-avatar">{initials}</div>
          <div className="ap-user-info">
            <div className="ap-user-name">{displayName}</div>
            <div className="ap-user-role">
              {t("AsidePatient.user.role")} {/* ✅ было: "Пациент" */}
            </div>
          </div>
          {isAuthenticated && <div className="ap-user-dot" />}
        </div>

        {/* Nav */}
        <nav className="ap-nav">
          {navItems.map((group, gi) => (
            <React.Fragment key={gi}>
              {group.section && (
                <div className="ap-section-label">{group.section}</div>
              )}
              {group.items.map((item, ii) => {
                const cls =
                  `ap-link` +
                  (isActive(item.to) ? " active" : "") +
                  (item.accent === "ai" ? " is-ai" : "");
                return (
                  <Link
                    key={ii}
                    to={item.to}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className={cls}
                  >
                    <span className="ap-icon">{item.icon}</span>
                    {item.label}
                    {/* Sprint 3.2 — badge for pending consent requests */}
                    {typeof item.badge === "number" && item.badge > 0 && (
                      <span className="ap-link-badge">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* Logout */}
        <div className="ap-footer">
          <button className="ap-logout" onClick={handleLogout}>
            <span className="ap-logout-icon">
              <i className="bi bi-box-arrow-right" style={{ fontSize: 15 }} />
            </span>
            {t("AsidePatient.menu.logout")}
          </button>
        </div>
      </aside>
    </div>
  );
}
