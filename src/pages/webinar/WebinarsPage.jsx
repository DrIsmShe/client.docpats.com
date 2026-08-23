// client/src/pages/webinar/WebinarsPage.jsx
//
// Встречи по ссылке: создать, скопировать адрес, завершить.
//
// Здесь нет выбора участников из списка контактов — и это осознанно.
// Вебинар собирают рассылкой ссылки: перечислять полсотни человек
// по одному значит делать руками то, ради чего ссылка и придумана.
// Закрытый режим («только по списку») в модели есть и работает, но
// экран для него нужен другой — с поиском и импортом, а не с чекбоксами.

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
  createWebinar,
  deleteWebinar,
  errorText,
  listWebinars,
  updateWebinar,
  webinarLink,
} from "../../api/webinar";
import styles from "./WebinarsPage.module.css";

const STATUS_LABEL = {
  scheduled: "запланирована",
  live: "идёт",
  ended: "завершена",
};

function formatWhen(value) {
  if (!value) return "без времени";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "без времени";
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WebinarsPage() {
  const { t } = useTranslation("common");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [lobbyEnabled, setLobbyEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    try {
      setItems(await listWebinars());
      setError(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createWebinar({
        title: title.trim(),
        lobbyEnabled,
        // Пустая строка из <input type="datetime-local"> — это «без
        // времени», а не «эпоха»: отправляем null, иначе на сервере
        // окажется 1970 год.
        scheduledAt: scheduledAt
          ? new Date(scheduledAt).toISOString()
          : null,
      });
      setTitle("");
      setScheduledAt("");
      setLobbyEnabled(false);
      await reload();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (id) => {
    try {
      await navigator.clipboard.writeText(webinarLink(id));
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Буфер обмена недоступен (не https, отказ в правах) — показываем
      // адрес, чтобы его можно было выделить руками.
      window.prompt("Скопируйте ссылку:", webinarLink(id));
    }
  };

  const handleEnd = async (id) => {
    try {
      await updateWebinar(id, { status: "ended" });
      await reload();
    } catch (err) {
      setError(errorText(err));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteWebinar(id);
      await reload();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>{t("webinars.video")}</span>
        <h1 className={styles.title}>{t("webinars.byLink")}</h1>
        <p className={styles.lead}>
          {t("webinars.note")}
        </p>
      </header>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>{t("webinars.new")}</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <label className={styles.field}>
            <span className={styles.label}>{t("webinars.name")}</span>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("webinars.namePlaceholder")}
              maxLength={200}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>{t("webinars.when")}</span>
            <input
              className={styles.input}
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </label>

          <label className={styles.check}>
            <input
              type="checkbox"
              checked={lobbyEnabled}
              onChange={(e) => setLobbyEnabled(e.target.checked)}
            />
            <span>
              {t("webinars.waitingRoom")}
            </span>
          </label>

          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={saving || title.trim().length < 2}
          >
            {saving ? "Создаём…" : "Создать встречу"}
          </button>
        </form>
      </section>

      {error ? <div className={styles.alertError}>{error}</div> : null}

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>{t("webinars.title")}</h2>

        {loading ? (
          <p className={styles.muted}>{t("common.loadingDots")}</p>
        ) : items.length === 0 ? (
          <p className={styles.muted}>
            {t("webinars.empty")}
          </p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item._id} className={styles.item}>
                <div className={styles.itemMain}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemMeta}>
                    {formatWhen(item.scheduledAt)}
                    {" · "}
                    <span
                      className={
                        item.status === "live" ? styles.live : undefined
                      }
                    >
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                    {item.lobbyEnabled ? " · с комнатой ожидания" : ""}
                  </span>
                </div>

                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => handleCopy(item._id)}
                  >
                    {copied === item._id ? "Скопировано" : "Ссылка"}
                  </button>
                  <Link className={styles.btn} to={`/webinar/${item._id}`}>
                    {t("auth.signIn")}
                  </Link>
                  {item.status !== "ended" ? (
                    <button
                      type="button"
                      className={styles.btn}
                      onClick={() => handleEnd(item._id)}
                    >
                      {t("webinars.finish")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDanger}`}
                      onClick={() => handleDelete(item._id)}
                    >
                      {t("common.deleteBtn")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
