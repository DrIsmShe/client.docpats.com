import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toggleMenu, closeMenu } from "../../../slices/menuSlice.js";
import { useLocation } from "react-router-dom";

import { Link } from "react-router-dom";
import axios from "axios";
// Выход: сбросить кэш сессии и разорвать связь событий счётчика с человеком.
import { clearSession } from "../../../api/session";
import { useNavigate } from "react-router-dom";
import { PiVideoFill } from "react-icons/pi";
import { FaFacebookMessenger } from "react-icons/fa6";
import NotificationBell from "../../../components/notifications/NotificationBell.jsx";
import { getSocket } from "../../../pages/communication/socket.js";
import LanguageSwitcher from "../../LanguageSwitcher.jsx";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../../../pages/communication/components/LanguageSelector";
import { IoSearch } from "react-icons/io5";
export default function Header() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Состояние для проверки аутентификации
  const [user, setUser] = useState("");
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0); // 🟢 добавляем состояние
  const { t, i18n } = useTranslation();
  const [verificationStatus, setVerificationStatus] = useState("not_submitted");

  const location = useLocation();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isHeaderShrunk, setIsHeaderShrunk] = useState(false);
  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setIsSearching(true);

        const { data } = await axios.get(`${API_BASE}/search/global-search`, {
          params: { q: query },
          withCredentials: true,
        });

        setResults(data);
        setIsOpen(true);
      } catch (e) {
        console.error("Global search error:", e);
        setResults(null);
        setIsOpen(false);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderShrunk(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    if (window.innerWidth < 768) {
      document.body.classList.remove("toggle-sidebar");
    }
  }, [location.pathname]);

  // вверху компонента
  const API_BASE = process.env.REACT_APP_API_URL;
  useEffect(() => {
    if (!user?.userId) return;

    (async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/doctor-profile/get-verification/status`,
          { withCredentials: true },
        );

        setVerificationStatus(
          data?.verification?.overallStatus || "not_submitted",
        );
      } catch (error) {
        console.error("Verification status error:", error);
      }
    })();
  }, [user?.userId]);

  const toFileUrl = (p) =>
    !p
      ? `${API_BASE}/uploads/default.png`
      : /^https?:\/\//i.test(p)
        ? p
        : `${API_BASE}/${String(p).replace(/^\/+/, "")}`;

  const [profiledata, setProfiledata] = useState(
    `${API_BASE}/uploads/default.png`,
  );
  const [docProfileId, setDocProfileId] = useState("");
  const [specName, setSpecName] = useState("");

  // 1) кто залогинен
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // 2) профиль врача по userId → картинка + запоминаем ID профиля врача
  useEffect(() => {
    const userId = user?.userId;
    if (!userId) return;
    (async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/doctor-profile/get-profile-doctor/${userId}`,
          { withCredentials: true },
        );
        const prof = data?.profile;
        setProfiledata(
          prof?.profileImage ? toFileUrl(prof.profileImage) : profiledata,
        );
        setDocProfileId(prof?._id || ""); // <<< важное место
      } catch (e) {
        console.error(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  // 3) берём спец-сть через doctor-detail/:id (id = _id профиля врача)
  useEffect(() => {
    if (!docProfileId) return;
    (async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/doctor-profile/doctor-detail/${docProfileId}`,
          { withCredentials: true },
        );
        const name =
          data?.user?.specializationName ||
          data?.user?.specialization?.name ||
          data?.specializationName || // если добавите в контроллер корневое поле
          data?.specialization?.name ||
          "";
        setSpecName(name);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [docProfileId]);

  // 🔌 Socket: init on auth
  // socket.js уже слушает "new_notification" и сам форвардит в window —
  // дополнительный листенер здесь не нужен, иначе window получит событие дважды
  useEffect(() => {
    if (!isAuthenticated) return;
    console.log("🔌 Header: socket init, user =", user?.userId);
    getSocket();
  }, [isAuthenticated]);

  // 🔹 Получение количества непрочитанных уведомлений
  useEffect(() => {
    const header = document.getElementById("header");
    if (header) {
      document.documentElement.style.setProperty(
        "--header-height",
        `${header.offsetHeight}px`,
      );
    }
  }, [isHeaderShrunk]);
  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/auth/logout`,
        {},
        { withCredentials: true },
      );
      clearSession();
      alert("You have successfully logged out");
      navigate("/login"); // Redirect to login page after logging out
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out");
    }
  };
  if (!isAuthenticated) {
    return null; // Возвращаем null, пока идет проверка
  }

  // сверху файла

  let verificationBadge;

  if (verificationStatus === "approved") {
    verificationBadge = (
      <span className="badge bg-success" style={{ fontSize: "0.65rem" }}>
        ✔ Verified
      </span>
    );
  } else if (verificationStatus === "pending") {
    verificationBadge = (
      <span
        className="badge bg-warning text-dark"
        style={{ fontSize: "0.65rem" }}
      >
        ⏳ Pending
      </span>
    );
  } else if (verificationStatus === "rejected") {
    verificationBadge = (
      <span className="badge bg-danger" style={{ fontSize: "0.65rem" }}>
        ✖ Rejected
      </span>
    );
  } else {
    verificationBadge = (
      <span className="badge bg-secondary" style={{ fontSize: "0.65rem" }}>
        — Not verified
      </span>
    );
  }
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
        className={`header fixed-top d-flex align-items-center justify-content-between px-2 px-md-3 glass-header ${
          isHeaderShrunk ? "header-shrink" : ""
        }`}
      >
        {/* ЛЕВАЯ ЧАСТЬ: логотип + бургер */}
        <div className="d-flex align-items-center justify-content-start flex-shrink-0">
          <Link
            to="/doctor/home-page"
            className="logo d-flex align-items-center"
          >
            <img
              src={`${process.env.PUBLIC_URL}/logo_docpats.png`}
              alt="Docpats Logo"
              style={{ height: 34, objectFit: "contain" }}
            />

            <span className="d-none d-lg-block ms-2">DOCPATS</span>
          </Link>

          <button
            type="button"
            className="btn p-0 ms-2 border-0 bg-transparent toggle-sidebar-btn"
            onClick={() => document.body.classList.toggle("toggle-sidebar")}
            style={{ fontSize: "26px" }}
          >
            <i className="bi bi-list"></i>
          </button>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: язык, мобильный поиск, уведомления, профиль */}
        <nav className="header-nav ms-auto header-nav-flex">
          <ul className="header-nav-items d-flex align-items-center gap-2 mb-0">
            {/* Language */}
            {/* DESKTOP VERSION */}
            <li className="d-none d-md-flex align-items-center">
              <LanguageSwitcher />
            </li>

            {/* MOBILE VERSION */}
            <li className="d-md-none">
              <select
                value={i18n.language}
                onChange={handleLanguageChange}
                className="form-select form-select-sm mobile-lang-select"
                style={{
                  width: 90,
                  fontSize: "0.8rem",
                  padding: "2px 6px",
                }}
              >
                <option value="en">EN</option>
                <option value="ru">RU</option>
                <option value="tr">TR</option>
                <option value="az">AZ</option>
                <option value="ar">AR</option>
              </select>
            </li>

            {/* Уведомления */}
            <li className="nav-item dropdown notification-wrapper">
              <button
                className="nav-link nav-icon position-relative btn p-0 border-0 bg-transparent"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-bell fs-5"></i>

                {unreadCount > 0 && (
                  <span className="badge bg-primary position-absolute top-0 start-100 translate-middle rounded-pill">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="dropdown-menu notification-dropdown dropdown-menu-end p-0 shadow">
                <div className="notification-header text-center fw-semibold py-2">
                  {t("notifications")}
                </div>

                <div className="px-2 py-2 notification-body">
                  <NotificationBell onUnreadChange={setUnreadCount} limit={3} />
                </div>

                <div className="notification-footer px-2 pb-2">
                  <Link
                    to="/doctor/notifications"
                    onClick={autoCloseMobileSidebar}
                    className="notification-view-all"
                  >
                    {t("view_all_notifications")}
                    <span className="ms-2">→</span>
                  </Link>
                </div>
              </div>
            </li>

            {/* Профиль */}
            <li className="nav-item dropdown pe-3">
              <Link
                to="/"
                className="nav-link nav-profile d-flex align-items-center pe-0"
                data-bs-toggle="dropdown"
                onClick={(e) => e.preventDefault()}
              >
                <img
                  src={toFileUrl(profiledata)}
                  alt="Profile"
                  className="rounded-circle"
                  style={{
                    width: window.innerWidth < 768 ? 34 : 40,
                    height: window.innerWidth < 768 ? 34 : 40,
                    objectFit: "cover",
                  }}
                />
                <span className="d-none d-md-block dropdown-toggle ps-2">
                  {t("welcome")}, {user.firstName}
                </span>
              </Link>

              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
                <li className="dropdown-header">
                  <h6 className="d-flex align-items-center gap-2">
                    {user?.firstName} {user?.lastName}
                    {verificationBadge}
                  </h6>

                  <span>
                    {t("registration_date")}:{" "}
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <Link
                    className="dropdown-item d-flex align-items-center"
                    to={`/doctor/doctor-profile/${user.userId}`}
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

      {/* 🔻 MOBILE SLIDE-DOWN SEARCH ПАНЕЛЬ */}
      {isMobileSearchOpen && (
        <div className="mobile-search-bar d-md-none">
          <form
            className="search-form d-flex align-items-center px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <input
              type="text"
              name="query"
              placeholder={t("search")}
              title={t("search")}
              className="form-control me-2"
            />
            <button type="submit" title="Search" className="btn btn-primary">
              <i className="bi bi-search"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
