// src/pages/patient/layout/HeaderPatient.jsx
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toggleMenu, closeMenu } from "../../../slices/menuSlice.js";
import { useLocation } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import NotificationBell from "../../../components/notifications/NotificationBell.jsx";
import LanguageSwitcher from "../../LanguageSwitcher.jsx";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../../../pages/communication/components/LanguageSelector";
export default function HeaderPatient() {
  const dispatch = useDispatch();
  const { t } = useTranslation("headerPatient");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth < 768) {
      document.body.classList.remove("toggle-sidebar");
    }
  }, [location.pathname]);

  const API_BASE = process.env.REACT_APP_API_URL;

  /* ========================= 🔑 Проверка авторизации ========================= */
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });

        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setUser(response.data.user);

          console.log("✅ Patient authenticated:", response.data.user.username);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuthentication();
  }, []);

  /* ========================= 🚪 Выход ========================= */
  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/auth/logout`,
        {},
        { withCredentials: true },
      );

      alert(t("logout_success"));
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert(t("logout_error"));
    }
  };

  if (!isAuthenticated) return null;
  const autoCloseMobileSidebar = () => {
    if (window.innerWidth < 992) {
      const btn = document.getElementById("mobileSidebarToggle");
      if (btn) btn.click();
    }
  };
  return (
    <div>
      <header
        id="header"
        className="header fixed-top d-flex align-items-center"
      >
        {/* ============= LOGO + TOGGLE ============= */}
        <div className="d-flex align-items-center justify-content-between">
          <Link
            to="/patient/home-page"
            className="logo d-flex align-items-center"
          >
            <img
              src={`${process.env.PUBLIC_URL}/logo_docpats.png`}
              alt="Docpats Logo"
            />
            <span className="d-none d-lg-block">DOCPATS</span>
          </Link>

          <button
            type="button"
            className="btn p-0 border-0 bg-transparent toggle-sidebar-btn"
            onClick={() => document.body.classList.toggle("toggle-sidebar")}
            style={{ fontSize: "28px" }}
          >
            <i className="bi bi-list"></i>
          </button>
        </div>

        {/* ============= SEARCH ============= */}
        <div className="search-bar">
          <form className="search-form d-flex align-items-center">
            <input
              type="text"
              name="query"
              placeholder={t("search")}
              title={t("search")}
            />
            <button type="submit" title="Search">
              <i className="bi bi-search"></i>
            </button>
          </form>
        </div>

        {/* ============= NAVIGATION ============= */}
        <nav className="header-nav ms-auto header-nav-flex">
          {/* 🌍 MULTI-LANGUAGE */}
          <LanguageSwitcher />

          <ul className="header-nav-items d-flex align-items-center">
            {/* 🔔 УВЕДОМЛЕНИЯ */}
            <li className="nav-item dropdown">
              <span
                className="nav-link nav-icon"
                data-bs-toggle="dropdown"
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-bell"></i>

                {unreadCount > 0 && (
                  <span className="badge bg-primary badge-number">
                    {unreadCount}
                  </span>
                )}
              </span>

              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications">
                <li className="dropdown-header fw-semibold">
                  {unreadCount > 0
                    ? t("you_have_notifications", { count: unreadCount })
                    : t("no_notifications")}
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>

                {/* <li className="px-2">
                  <NotificationBell onUnreadChange={setUnreadCount} limit={5} />
                </li> */}
                <li className="nav-item d-flex align-items-center">
                  <NotificationBell
                    viewAllLink="/patient/notification-for-patient"
                    limit={8}
                  />
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li className="dropdown-footer text-center">
                  <Link
                    to="/patient/notification-for-patient"
                    onClick={autoCloseMobileSidebar}
                  >
                    <span className="badge bg-primary p-2">
                      {t("view_all")}
                    </span>
                  </Link>
                </li>
              </ul>
            </li>

            {/* 👤 PATIENT PROFILE */}
            <li className="nav-item dropdown pe-3">
              <span
                className="nav-link nav-profile d-flex align-items-center pe-0"
                data-bs-toggle="dropdown"
                style={{ cursor: "pointer" }}
              >
                <img
                  src="../assets/img/profile-img.jpg"
                  alt="Profile"
                  className="rounded-circle"
                  style={{ width: 40 }}
                />
                <span className="d-none d-md-block dropdown-toggle ps-2">
                  {t("welcome")}, {user?.firstName}
                </span>
              </span>

              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
                <li className="dropdown-header">
                  <h6>
                    {user.firstName} {user.lastName}
                  </h6>
                  <span>
                    {t("nickname")}: <strong>{user?.username ?? "—"}</strong>
                  </span>
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <Link
                    className="dropdown-item d-flex align-items-center"
                    to={`/patient/patient-profile/${user.userId}`}
                    onClick={autoCloseMobileSidebar}
                  >
                    <i className="bi bi-person"></i>
                    <span>{t("my_profile")}</span>
                  </Link>
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                {/* <li className="px-3 py-2">
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6c757d",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    🌐 Translation language
                  </div>
                  <LanguageSelector
                    value={user?.preferredLanguage || "ru"}
                    onChange={(lang) =>
                      setUser((prev) => ({ ...prev, preferredLanguage: lang }))
                    }
                  />
                </li> */}
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    <span>{t("sign_out")}</span>
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </header>

      {/* ===== EXTRA BUTTONS ===== */}
      <div className="patients-block">
        <div className="patients-block-1">
          <Link
            to="http://localhost:3001/"
            target="_blank"
            onClick={autoCloseMobileSidebar}
          >
            <button className="btn btn-primary w-100 mb-1">
              {t("polyclinic")}
            </button>
          </Link>
        </div>
        <div className="patients-block-2">
          <Link
            to="http://localhost:3001/"
            target="_blank"
            onClick={autoCloseMobileSidebar}
          >
            <button className="btn btn-primary w-100">{t("hospital")}</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
