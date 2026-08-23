import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { notificationIcon } from "../../utils/notificationIcon";

export default function NotificationBell({ onUnreadChange, limit = 6 }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const [notifications, setNotifications] = useState([]);
  const reloadTimer = useRef(null);

  // ── HTTP load ──────────────────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/common-for-user`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!data?.authenticated) return;

      const userId = (data.user._id ?? data.user.userId ?? "").toString();
      const userRole = data.user.role || "unknown";

      const endpoint =
        userRole === "patient"
          ? `${API_BASE}/notifications/get-notifications-for-patient`
          : `${API_BASE}/notifications/get`;

      const r2 = await fetch(endpoint, { credentials: "include" });
      const d2 = await r2.json();
      if (!d2?.success) return;

      let list =
        d2.notifications || [
          ...(d2.unreadNotifications || []),
          ...(d2.readNotifications || []),
        ] ||
        [];

      list = list
        .filter((n) => n.senderId?.toString() !== userId)
        .map((n) => ({
          ...n,
          _id: n._id?.toString(),
          isRead: n.isRead ?? false,
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Показываем ПОСЛЕДНИЕ уведомления, а не только непрочитанные.
      //
      // Раньше список был отфильтрован по !isRead, и «Прочитать все» опустошал
      // его целиком: человек нажимал кнопку и терял всё, что в нём было, — а
      // ссылки на полный список в кабинете клиники нет. Счётчик по-прежнему
      // считает только непрочитанные, прочитанные показываются приглушённо.
      const unread = list.filter((n) => !n.isRead);
      setNotifications(list.slice(0, limit));
      onUnreadChange?.(d2.unreadCount ?? unread.length);
    } catch (err) {
      console.error("❌ loadNotifications:", err);
    }
  }, [API_BASE, limit, onUnreadChange]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ── Real-time via window event (bridged from socket.js → Header.jsx → window)
  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail;
      if (!payload) return;

      const newNotif = {
        _id: payload._id || `rt-${Date.now()}`,
        type: payload.type || "system_message",
        title: payload.title || "Новое сообщение",
        message: payload.message || "",
        link: payload.link || null,
        isRead: false,
        createdAt: payload.createdAt || new Date().toISOString(),
      };

      setNotifications((prev) => {
        if (prev.some((n) => n._id === newNotif._id)) return prev;
        return [newNotif, ...prev].slice(0, limit);
      });
      onUnreadChange?.((prev) => (typeof prev === "number" ? prev + 1 : 1));

      clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(() => loadNotifications(), 800);
    };

    window.addEventListener("new_notification", handler);

    const readHandler = () => {
      clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(() => loadNotifications(), 300);
    };
    window.addEventListener("notifications:read", readHandler);

    return () => {
      window.removeEventListener("new_notification", handler);
      window.removeEventListener("notifications:read", readHandler);
      clearTimeout(reloadTimer.current);
    };
  }, [limit, onUnreadChange, loadNotifications]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/notifications/mark-read`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // без id → все
      });
    } catch {
      /* игнор */
    }
    // Пометить прочитанным — не значит скрыть: список остаётся, гаснет
    // только выделение и счётчик.
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onUnreadChange?.(0);
  };

  const openNotification = async (n) => {
    // Помечаем прочитанным (реальные id; оптимистичные rt-… пропускаем)
    if (n._id && !String(n._id).startsWith("rt-")) {
      try {
        await fetch(`${API_BASE}/notifications/mark-read`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: n._id }),
        });
      } catch {
        /* игнор */
      }
    }
    // Открытое уведомление тоже остаётся в списке — просто становится
    // прочитанным. Счётчик уменьшаем только если оно было непрочитанным.
    setNotifications((prev) =>
      prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)),
    );
    if (!n.isRead) {
      onUnreadChange?.((prev) =>
        typeof prev === "number" ? Math.max(0, prev - 1) : 0,
      );
    }
    if (n.link) navigate(n.link);
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div>
      {notifications.length === 0 ? (
        <div className="text-center text-muted small py-3">
          {t("no_notifications", { defaultValue: "Уведомлений нет" })}
        </div>
      ) : (
        <>
          {notifications.map((n, i) => (
            <div
              key={n._id || i}
              className="px-3 py-2 border-bottom"
              style={{
                cursor: n.link ? "pointer" : "default",
                opacity: n.isRead ? 0.62 : 1,
                background: n.isRead ? "transparent" : "#f6fbfa",
              }}
              onClick={() => (n.link ? openNotification(n) : null)}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, lineHeight: "20px" }}>{notificationIcon(n)}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    className={n.isRead ? "text-dark" : "fw-bold text-dark"}
                    style={{ fontSize: 14 }}
                  >
                    {n.title}
                  </div>
                  {n.message && (
                    <div
                      className="small"
                      style={{ color: n.link ? "#0d6efd" : "#6c757d" }}
                    >
                      {n.message}
                    </div>
                  )}
                  <div className="text-secondary" style={{ fontSize: 11 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={markAllRead}
            className="btn btn-link btn-sm w-100 text-decoration-none"
            style={{ padding: "8px 0" }}
          >
            {t("mark_all_read", { defaultValue: "Прочитать все" })}
          </button>
        </>
      )}
    </div>
  );
}
