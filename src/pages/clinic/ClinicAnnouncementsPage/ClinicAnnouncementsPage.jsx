// client/src/pages/clinic/ClinicAnnouncementsPage/ClinicAnnouncementsPage.jsx
//
// Clinic corporate-portal bulletin board. The head physician / admin posts;
// every member sees the feed. Pinned announcements float to the top. Authors
// and admins see a read-receipt badge ("Прочитали N из M") — variant A.
//
// Role gating mirrors ClinicDashboardPage: role comes from the clinic layout
// outlet context. Write actions (create/pin/archive/delete) are limited to
// owner/admin/manager. Everyone else reads + auto-marks-read on open.

import React, { useEffect, useState, useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  listAnnouncements,
  pinAnnouncement,
  archiveAnnouncement,
  unarchiveAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead,
} from "../../../api/clinic";
import AnnouncementFormModal from "./AnnouncementFormModal.jsx";
import "./clinicAnnouncementsPage.css";

const WRITE_ROLES = ["owner", "admin", "manager"];

export default function ClinicAnnouncementsPage() {
  const { t, i18n } = useTranslation("clinic");
  const layoutContext = useOutletContext() || {};
  const myRole = layoutContext?.role || "member";
  const canWrite = WRITE_ROLES.includes(myRole);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await listAnnouncements(
        showArchived ? { includeArchived: true } : {},
      );
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error("listAnnouncements:", err?.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    load();
  }, [load]);

  const fmtDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  async function handleToggle(a) {
    const next = String(expanded) === String(a._id) ? null : a._id;
    setExpanded(next);
    // Auto mark-as-read when opening an unread announcement.
    if (next && !a.viewerHasRead) {
      try {
        await markAnnouncementRead(a._id);
        setItems((prev) =>
          prev.map((x) =>
            String(x._id) === String(a._id)
              ? { ...x, viewerHasRead: true, readCount: x.readCount + 1 }
              : x,
          ),
        );
      } catch {
        /* best-effort */
      }
    }
  }

  async function handlePin(a, e) {
    e.stopPropagation();
    try {
      await pinAnnouncement(a._id, !a.pinned);
      load();
    } catch {
      alert(t("announcements.errorTitle", { defaultValue: "Ошибка" }));
    }
  }

  async function handleArchive(a, e) {
    e.stopPropagation();
    try {
      await archiveAnnouncement(a._id);
      load();
    } catch {
      alert(t("announcements.errorTitle", { defaultValue: "Ошибка" }));
    }
  }
  async function handleUnarchive(a, e) {
    e.stopPropagation();
    try {
      await unarchiveAnnouncement(a._id);
      load();
    } catch {
      alert(t("announcements.errorTitle", { defaultValue: "Ошибка" }));
    }
  }
  async function handleDelete(a, e) {
    e.stopPropagation();
    if (
      !window.confirm(
        t("announcements.confirmDelete", {
          defaultValue: "Удалить объявление навсегда?",
        }),
      )
    )
      return;
    try {
      await deleteAnnouncement(a._id);
      load();
    } catch {
      alert(t("announcements.errorTitle", { defaultValue: "Ошибка" }));
    }
  }

  return (
    <div className="clinic-ann">
      <Link to="/clinic" className="clinic-ann-back">
        ← {t("announcements.back", { defaultValue: "Дашборд" })}
      </Link>
      <div className="clinic-ann-header">
        <div>
          <div className="clinic-ann-eyebrow">
            {t("announcements.title", { defaultValue: "Объявления" })}
          </div>
          <h1 className="clinic-ann-title">
            {t("announcements.title", { defaultValue: "Объявления" })}
          </h1>
          <p className="clinic-ann-subtitle">
            {t("announcements.subtitle", {
              defaultValue: "Внутренние объявления клиники для всей команды",
            })}
          </p>
        </div>
        {canWrite && (
          <button
            className="clinic-ann-create-btn"
            onClick={() => setFormOpen(true)}
          >
            + {t("announcements.create", { defaultValue: "Новое объявление" })}
          </button>
        )}
      </div>

      <label className="clinic-ann-archived-toggle">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
        />
        {t("announcements.showArchived", { defaultValue: "Архив" })}
      </label>

      {loading ? (
        <div className="clinic-ann-state">
          {t("common.loading", { defaultValue: "Загрузка…" })}
        </div>
      ) : error ? (
        <div className="clinic-ann-state">
          {t("announcements.errorTitle", {
            defaultValue: "Не удалось загрузить объявления",
          })}
        </div>
      ) : items.length === 0 ? (
        <div className="clinic-ann-state">
          {t("announcements.empty", { defaultValue: "Объявлений пока нет" })}
          {canWrite && (
            <button
              className="clinic-ann-create-btn"
              style={{ marginTop: 16 }}
              onClick={() => setFormOpen(true)}
            >
              {t("announcements.createFirst", {
                defaultValue: "Создать первое объявление",
              })}
            </button>
          )}
        </div>
      ) : (
        <div className="clinic-ann-list">
          {items.map((a) => {
            const open = String(expanded) === String(a._id);
            return (
              <div
                key={a._id}
                className={`clinic-ann-card${a.pinned ? " pinned" : ""}${
                  a.status === "archived" ? " archived" : ""
                }`}
                onClick={() => handleToggle(a)}
              >
                <div className="clinic-ann-card-head">
                  <div className="clinic-ann-card-main">
                    <div className="clinic-ann-card-title">
                      {a.pinned && (
                        <span className="clinic-ann-pin-badge">
                          📌{" "}
                          {t("announcements.pinned", {
                            defaultValue: "Закреплено",
                          })}
                        </span>
                      )}
                      {a.title}
                    </div>
                    <div className="clinic-ann-card-sub">
                      {a.authorName ||
                        t("announcements.author", { defaultValue: "Автор" })}
                      {"  ·  "}
                      {fmtDate(a.createdAt)}
                      {a.audience === "department" && (
                        <span className="clinic-ann-aud">
                          {"  ·  "}
                          {t("announcements.audienceDepartment", {
                            defaultValue: "Отделение",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  {!a.viewerHasRead && a.status !== "archived" && (
                    <span
                      className="clinic-ann-unread-dot"
                      title="Не прочитано"
                    />
                  )}
                  {a.status !== "archived" ? (
                    <button onClick={(e) => handleArchive(a, e)}>
                      {t("announcements.archive", { defaultValue: "В архив" })}
                    </button>
                  ) : (
                    <button onClick={(e) => handleUnarchive(a, e)}>
                      {t("announcements.unarchive", {
                        defaultValue: "Вернуть из архива",
                      })}
                    </button>
                  )}
                </div>

                {open && (
                  <div
                    className="clinic-ann-body"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="clinic-ann-text">{a.body}</div>

                    {canWrite && (
                      <div className="clinic-ann-receipt">
                        {t("announcements.readBy", {
                          read: a.readCount || 0,
                          total: layoutContext?.memberCount || "—",
                          defaultValue: `Прочитали ${a.readCount || 0}`,
                        })}
                      </div>
                    )}

                    {canWrite && (
                      <div className="clinic-ann-actions">
                        <button onClick={(e) => handlePin(a, e)}>
                          {a.pinned
                            ? t("announcements.unpin", {
                                defaultValue: "Открепить",
                              })
                            : t("announcements.pin", {
                                defaultValue: "Закрепить",
                              })}
                        </button>
                        {a.status !== "archived" && (
                          <button onClick={(e) => handleArchive(a, e)}>
                            {t("announcements.archive", {
                              defaultValue: "В архив",
                            })}
                          </button>
                        )}
                        <button
                          className="clinic-ann-danger"
                          onClick={(e) => handleDelete(a, e)}
                        >
                          {t("announcements.delete", {
                            defaultValue: "Удалить",
                          })}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <AnnouncementFormModal
          onClose={() => setFormOpen(false)}
          onCreated={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
