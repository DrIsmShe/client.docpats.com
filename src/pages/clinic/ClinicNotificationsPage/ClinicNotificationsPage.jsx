// client/src/pages/clinic/ClinicNotificationsPage/ClinicNotificationsPage.jsx
//
// Все уведомления клиники. Монтируется в ОБЕИХ зонах:
//   /clinic/notifications            -> зона владельца
//   /clinic/employee/notifications   -> зона сотрудника
//
// Зачем страница. В колокольчике помещается несколько последних уведомлений,
// и до неё в зоне клиники не было ничего: «Прочитать все» гасил счётчик, а
// посмотреть, что вообще приходило, было негде — в отличие от зоны врача, где
// такая страница есть давно.
//
// Уведомления адресуются ПОЛЬЗОВАТЕЛЮ, а не клинике: эндпоинт один и тот же
// для всех зон, фильтрует по сессии. Поэтому отдельного «клинического» API
// здесь нет и не нужно.

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../../axios";
import { useClinicZone } from "../../../lib/useClinicZone";
import "./clinicNotificationsPage.css";

const TABS = [
  { key: "all", labelKey: "notifications.tabs.all" },
  { key: "unread", labelKey: "notifications.tabs.unread" },
  { key: "read", labelKey: "notifications.tabs.read" },
];

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

export default function ClinicNotificationsPage() {
  const { t } = useTranslation("clinic");
  const navigate = useNavigate();
  const { dashboardPath } = useClinicZone();

  const [tab, setTab] = useState("all");
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async (type) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/notifications/get?type=${type}`);
      if (!res.data?.success) throw new Error("bad response");
      setItems(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Не удалось загрузить уведомления",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const markAll = async () => {
    try {
      await api.patch("/notifications/mark-read", {});
      // На вкладке непрочитанных список после этого пуст по определению; на
      // остальных записи остаются и просто гаснут.
      setItems((prev) =>
        tab === "unread" ? [] : prev.map((n) => ({ ...n, isRead: true })),
      );
      setUnreadCount(0);
    } catch {
      /* счётчик останется прежним — молча, без модалки поверх страницы */
    }
  };

  const openOne = async (n) => {
    const id = n._id;
    if (!n.isRead && id) {
      setBusyId(id);
      try {
        await api.patch("/notifications/mark-read", { notificationId: id });
        setItems((prev) =>
          tab === "unread"
            ? prev.filter((x) => x._id !== id)
            : prev.map((x) => (x._id === id ? { ...x, isRead: true } : x)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        /* переход всё равно выполним: прочитанность — не условие открытия */
      } finally {
        setBusyId(null);
      }
    }
    if (n.link) navigate(n.link);
  };

  const removeOne = async (e, id) => {
    // Клик по корзине не должен открывать уведомление.
    e.stopPropagation();
    setBusyId(id);
    try {
      await api.delete(`/notifications/delete/${id}`);
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch {
      /* оставляем как есть */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="cnp-page">
      <div className="cnp-header">
        <Link to={dashboardPath} className="cnp-back">
          {t("notifications.back", { defaultValue: "← Дашборд" })}
        </Link>
        <h1>
          {t("notifications.title", { defaultValue: "Уведомления" })}
          {unreadCount > 0 && <span className="cnp-count">{unreadCount}</span>}
        </h1>
      </div>

      <div className="cnp-toolbar">
        <div className="cnp-tabs">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={"cnp-tab " + (tab === item.key ? "is-active" : "")}
              onClick={() => setTab(item.key)}
              disabled={loading}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="cnp-mark-all"
          onClick={markAll}
          disabled={loading || unreadCount === 0}
        >
          {t("notifications.markAll", {
            defaultValue: "Отметить все прочитанными",
          })}
        </button>
      </div>

      {error ? (
        <div className="cnp-error">
          <p>{error}</p>
          <button type="button" onClick={() => load(tab)}>
            {t("common.retry", { defaultValue: "Повторить" })}
          </button>
        </div>
      ) : loading ? (
        <div className="cnp-loading">
          <div className="cnp-spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="cnp-empty">
          {t("notifications.empty", { defaultValue: "Уведомлений нет" })}
        </div>
      ) : (
        <div className="cnp-list">
          {items.map((n) => (
            <div
              key={n._id}
              className={
                "cnp-item" +
                (n.isRead ? " is-read" : "") +
                (n.link ? " is-clickable" : "")
              }
              onClick={() => (n.link || !n.isRead ? openOne(n) : null)}
              role={n.link ? "button" : undefined}
              tabIndex={n.link ? 0 : undefined}
              onKeyDown={(e) => e.key === "Enter" && openOne(n)}
            >
              <div className="cnp-item-body">
                <div className="cnp-item-title">{n.title}</div>
                {n.message && <div className="cnp-item-msg">{n.message}</div>}
                <div className="cnp-item-date">{formatDate(n.createdAt)}</div>
              </div>

              <button
                type="button"
                className="cnp-del"
                onClick={(e) => removeOne(e, n._id)}
                disabled={busyId === n._id}
                title={t("notifications.delete", { defaultValue: "Удалить" })}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
