import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../LanguageSwitcher";

export default function Header({
  isAuthenticated,
  user,
  userRole,
  onLogout,
  type,
  setType,
  menuOpen,
  setMenuOpen,
  locale,
  filters,
}) {
  // Header now owns its own translation namespace — no more t/i18n props
  const { t, i18n } = useTranslation("NewsAiTranslate");
  // Через useLocation, а не window.location: переходы внутри приложения не
  // перезагружают страницу, и подпись кнопки залипала — на новостях висело
  // «Медицинские новости», то есть ссылка на текущий же раздел.
  const location = useLocation();
  const onConferences = location.pathname.startsWith("/conferences");

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDocClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [userMenuOpen]);

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const currentLocale = locale || i18n.language;

  const today = new Date().toLocaleDateString(
    currentLocale === "ar"
      ? "ar-SA"
      : currentLocale === "tr"
        ? "tr-TR"
        : currentLocale === "az"
          ? "az-AZ"
          : currentLocale === "ru"
            ? "ru-RU"
            : "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );

  const dashboardHref =
    userRole === "doctor"
      ? "/doctor/home-page"
      : userRole === "admin"
        ? "/admin/admin-panel"
        : "/patient/home-page";

  const profileHref = user?.userId
    ? userRole === "doctor"
      ? `/doctor/doctor-profile/${user.userId}`
      : `/patient/patient-profile/${user.userId}`
    : "#";

  const roleLabel = userRole
    ? t(`role.${userRole}`, { defaultValue: userRole })
    : "";

  return (
    <>
      <style>{`
        .nl-user-menu-item { transition: background .12s; }
        .nl-user-menu-item:hover { background: #faf8f4; }

        /* Шапка на телефоне. Раньше три блока — ссылка, логотип и правый
           угол — стояли в один ряд фиксированной высоты: на узком экране
           кнопка налезала на логотип, а приветствие с переключателем языка
           уезжало за край. Теперь ряд переносится, логотип перестаёт быть
           абсолютно спозиционированным, а подписи ужимаются. */
        .dp-conf-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 999px;
          background: rgba(255,255,255,.18);
          border: 1px solid rgba(255,255,255,.38);
          color: #fff; font-size: 14px; font-weight: 600;
          text-decoration: none; white-space: nowrap;
        }
        .dp-conf-btn:hover { background: rgba(255,255,255,.3); }

      `}</style>

      {/* TOP BAR */}
      <div className="nl-topbar">
        <span className="nl-topbar-left">
          {t("brand", { defaultValue: "DocPats · Medical Intelligence" })}
        </span>
        <span className="nl-topbar-date">{today}</span>
      </div>

      {/* NAV */}
      <header className="nl-nav">
        <div className="nl-nav-inner">
          <div className="dp-nav-links">
            {/* Одна заметная кнопка вместо двух текстовых ссылок. Раньше здесь
                шли подряд «Медицинские новости и исследования · актуальные
                данные» и «Конференции» — без отбивки они слипались в одну
                строку и читались как подпись, а не как навигация.
                Кнопка ведёт туда, где посетитель сейчас НЕ находится. */}
            <Link
              to={onConferences ? "/news" : "/conferences"}
              className="dp-conf-btn"
            >
              {onConferences
                ? t("nav.newsShort", { defaultValue: "Медицинские новости" })
                : t("nav.conferencesLink", { defaultValue: "Конференции" })}
            </Link>
          </div>

          <Link to="/" className="nl-nav-logo">
            Doc<span>Pats</span>
          </Link>

          <div className="nl-nav-right">
            <div className="nl-locale-switcher">
              <ul className="header-nav-items d-flex align-items-center gap-2 mb-0">
                <li className="d-none d-md-flex align-items-center">
                  <LanguageSwitcher />
                </li>
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
              </ul>
            </div>

            {isAuthenticated && user ? (
              <div
                ref={userMenuRef}
                style={{ position: "relative", display: "inline-block" }}
              >
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="nl-btn-member"
                  aria-expanded={userMenuOpen}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,.25)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {(user.firstName || "?").charAt(0)}
                  </span>
                  <span style={{ textTransform: "none", letterSpacing: 0 }}>
                    {t("welcome", { defaultValue: "Welcome" })},{" "}
                    {user.firstName}
                  </span>
                  <i
                    className="bi bi-chevron-down"
                    style={{ fontSize: 10, opacity: 0.85 }}
                  />
                </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      insetInlineEnd: 0,
                      minWidth: 240,
                      background: "white",
                      border: "1px solid #e7e2d8",
                      borderRadius: 12,
                      boxShadow:
                        "0 20px 48px rgba(28,25,23,.12), 0 4px 16px rgba(28,25,23,.06)",
                      padding: 6,
                      zIndex: 500,
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 14px 10px",
                        borderBottom: "1px solid #f0ece4",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#1c1917",
                        }}
                      >
                        {user.firstName} {user.lastName || ""}
                      </div>
                      {user.email && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#78716c",
                            marginTop: 2,
                            wordBreak: "break-all",
                          }}
                        >
                          {user.email}
                        </div>
                      )}
                      {roleLabel && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "#0f766e",
                          }}
                        >
                          {roleLabel}
                        </div>
                      )}
                    </div>

                    <a
                      href={dashboardHref}
                      onClick={() => setUserMenuOpen(false)}
                      className="nl-user-menu-item"
                      style={menuItemStyle}
                    >
                      <i
                        className="bi bi-grid"
                        style={{ marginInlineEnd: 8 }}
                      />
                      {t("nav.dashboard", { defaultValue: "Dashboard" })}
                    </a>

                    <a
                      href={profileHref}
                      onClick={() => setUserMenuOpen(false)}
                      className="nl-user-menu-item"
                      style={menuItemStyle}
                    >
                      <i
                        className="bi bi-person"
                        style={{ marginInlineEnd: 8 }}
                      />
                      {t("nav.myProfile", { defaultValue: "My profile" })}
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (typeof onLogout === "function") onLogout();
                      }}
                      className="nl-user-menu-item"
                      style={{
                        ...menuItemStyle,
                        width: "100%",
                        textAlign: "start",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#b91c1c",
                      }}
                    >
                      <i
                        className="bi bi-box-arrow-right"
                        style={{ marginInlineEnd: 8 }}
                      />
                      {t("nav.signOut", { defaultValue: "Sign out" })}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a href="/login" className="nl-btn-member">
                {t("nav.becomeMember", { defaultValue: "Sign in" })}
              </a>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 600,
  color: "#1c1917",
  textDecoration: "none",
  borderRadius: 8,
};
