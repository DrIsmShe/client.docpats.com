// client/src/components/notifications/ClinicNotificationBell.jsx
//
// Self-contained bell for the /clinic/* zone. Reuses the existing
// NotificationBell as the "list body" (same role it plays inside the doctor/
// patient Bootstrap popovers). This wrapper adds the icon, unread badge and a
// plain-React dropdown — the clinic layout has no Bootstrap popover.
//
// Single NotificationBell instance, mounted once and shown/hidden via CSS, so
// there is exactly one set of fetches + window listeners (no duplication).
// Nothing about NotificationBell or the doctor/patient headers changes.

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NotificationBell from "./NotificationBell.jsx";
import { useClinicZone } from "../../lib/useClinicZone";

export default function ClinicNotificationBell({ limit = 8 }) {
  const { t } = useTranslation("clinic");
  // Адрес зависит от зоны: у сотрудника свой префикс, и ссылка из его
  // колокольчика не должна выкидывать в зону владельца.
  const { basePath } = useClinicZone();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={wrapRef} style={styles.wrap}>
      <button
        type="button"
        style={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel — visible only when open. The NotificationBell list
          lives inside and is mounted ONCE (display toggled, not unmounted),
          so fetches/listeners are not duplicated. */}
      <div style={{ ...styles.dropdown, display: open ? "block" : "none" }}>
        <div style={styles.head}>
          {t("notifications", { defaultValue: "Уведомления" })}
        </div>
        <div style={styles.body}>
          <NotificationBell onUnreadChange={setUnreadCount} limit={limit} />
        </div>
        {/* В колокольчике помещаются только последние. Раньше отсюда никуда
            нельзя было перейти, и всё, что не поместилось, было недоступно. */}
        <Link
          to={`${basePath}/notifications`}
          style={styles.footer}
          onClick={() => setOpen(false)}
        >
          {t("notifications.viewAll", { defaultValue: "Все уведомления" })}
        </Link>
      </div>
    </div>
  );
}

const styles = {
  wrap: { position: "relative", display: "inline-block" },
  trigger: {
    position: "relative",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#475569",
    padding: 6,
    display: "inline-flex",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    padding: "0 4px",
    background: "#ef4444",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: 340,
    maxWidth: "90vw",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    boxShadow: "0 12px 32px rgba(0,0,0,.14)",
    zIndex: 2000,
    overflow: "hidden",
  },
  head: {
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 700,
    color: "#1e293b",
    borderBottom: "1px solid #f1f5f9",
  },
  body: { maxHeight: 380, overflowY: "auto" },
  footer: {
    display: "block",
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 600,
    color: "#0f766e",
    textAlign: "center",
    textDecoration: "none",
    borderTop: "1px solid #f1f5f9",
  },
};
