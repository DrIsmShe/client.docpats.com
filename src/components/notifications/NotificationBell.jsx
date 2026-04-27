import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotificationBell({ onUnreadChange, limit = 3 }) {
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
          : `${API_BASE}/notifications/get?type=unread`;

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

      const unread = list.filter((n) => !n.isRead);
      console.log(
        "📋 loadNotifications: total=",
        list.length,
        "unread=",
        unread.length,
        "d2.unreadCount=",
        d2.unreadCount,
        "sample=",
        unread[0],
      );
      setNotifications(unread.slice(0, limit));
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
      console.log("🔔 new_notification (window):", payload);

      // Оптимистично добавляем сразу
      const newNotif = {
        _id: payload._id || `rt-${Date.now()}`,
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

      // Перезагружаем из БД через 800ms — получаем точный счётчик
      clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(() => loadNotifications(), 800);
    };

    window.addEventListener("new_notification", handler);

    // When user reads chat messages — reload to update badge
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

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div>
      {notifications.length === 0 ? (
        <div className="text-center text-muted small py-2">
          {t("no_new_notifications")}
        </div>
      ) : (
        notifications.map((n, i) => (
          <div key={n._id || i} className="px-3 py-2 border-bottom">
            <div className="fw-bold text-dark">{n.title}</div>
            {n.link ? (
              <button
                onClick={() => navigate(n.link)}
                className="btn btn-link p-0 text-primary text-decoration-none small"
              >
                {n.message || t("go_to_event")}
              </button>
            ) : (
              <div className="text-muted small">{n.message}</div>
            )}
            <div className="text-secondary small">
              {new Date(n.createdAt).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
