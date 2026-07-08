// client/src/pages/clinic/ClinicAnnouncementsPage/ClinicAnnouncementsPage.jsx
//
// Clinic corporate-portal bulletin board. The head physician / admin posts;
// every member sees the feed. Pinned announcements float to the top. Authors
// and admins see a read-receipt badge ("РџСЂРѕС‡РёС‚Р°Р»Рё N РёР· M") вЂ” variant A.
//
// Role gating mirrors ClinicDashboardPage: role comes from the clinic layout
// outlet context. Write actions (create/pin/archive/delete) are limited to
// owner/admin/manager. Everyone else reads + auto-marks-read on open.

import React, { useEffect, useState, useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClinicZone } from "../../../lib/useClinicZone";
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
  const { dashboardPath } = useClinicZone();
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
      alert(t("announcements.errorTitle", { defaultValue: "РћС€РёР±РєР°" }));
    }
  }

  async function handleArchive(a, e) {
    e.stopPropagation();
    try {
      await archiveAnnouncement(a._id);
      load();
    } catch {
      alert(t("announcements.errorTitle", { defaultValue: "РћС€РёР±РєР°" }));
    }
  }
  async function handleUnarchive(a, e) {
    e.stopPropagation();
    try {
      await unarchiveAnnouncement(a._id);
      load();
    } catch {
      alert(t("announcements.errorTitle", { defaultValue: "РћС€РёР±РєР°" }));
    }
  }
  async function handleDelete(a, e) {
    e.stopPropagation();
    if (
      !window.confirm(
        t("announcements.confirmDelete", {
          defaultValue: "РЈРґР°Р»РёС‚СЊ РѕР±СЉСЏРІР»РµРЅРёРµ РЅР°РІСЃРµРіРґР°?",
        }),
      )
    )
      return;
    try {
      await deleteAnnouncement(a._id);
      load();
    } catch {
      alert(t("announcements.errorTitle", { defaultValue: "РћС€РёР±РєР°" }));
    }
  }

  return (
    <div className="clinic-ann">
      <Link to={dashboardPath} className="clinic-ann-back">
        в†ђ {t("announcements.back", { defaultValue: "Р”Р°С€Р±РѕСЂРґ" })}
      </Link>
      <div className="clinic-ann-header">
        <div>
          <div className="clinic-ann-eyebrow">
            {t("announcements.title", { defaultValue: "РћР±СЉСЏРІР»РµРЅРёСЏ" })}
          </div>
          <h1 className="clinic-ann-title">
            {t("announcements.title", { defaultValue: "РћР±СЉСЏРІР»РµРЅРёСЏ" })}
          </h1>
          <p className="clinic-ann-subtitle">
            {t("announcements.subtitle", {
              defaultValue: "Р’РЅСѓС‚СЂРµРЅРЅРёРµ РѕР±СЉСЏРІР»РµРЅРёСЏ РєР»РёРЅРёРєРё РґР»СЏ РІСЃРµР№ РєРѕРјР°РЅРґС‹",
            })}
          </p>
        </div>
        {canWrite && (
          <button
            className="clinic-ann-create-btn"
            onClick={() => setFormOpen(true)}
          >
            + {t("announcements.create", { defaultValue: "РќРѕРІРѕРµ РѕР±СЉСЏРІР»РµРЅРёРµ" })}
          </button>
        )}
      </div>

      <label className="clinic-ann-archived-toggle">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
        />
        {t("announcements.showArchived", { defaultValue: "РђСЂС…РёРІ" })}
      </label>

      {loading ? (
        <div className="clinic-ann-state">
          {t("common.loading", { defaultValue: "Р—Р°РіСЂСѓР·РєР°вЂ¦" })}
        </div>
      ) : error ? (
        <div className="clinic-ann-state">
          {t("announcements.errorTitle", {
            defaultValue: "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РѕР±СЉСЏРІР»РµРЅРёСЏ",
          })}
        </div>
      ) : items.length === 0 ? (
        <div className="clinic-ann-state">
          {t("announcements.empty", { defaultValue: "РћР±СЉСЏРІР»РµРЅРёР№ РїРѕРєР° РЅРµС‚" })}
          {canWrite && (
            <button
              className="clinic-ann-create-btn"
              style={{ marginTop: 16 }}
              onClick={() => setFormOpen(true)}
            >
              {t("announcements.createFirst", {
                defaultValue: "РЎРѕР·РґР°С‚СЊ РїРµСЂРІРѕРµ РѕР±СЉСЏРІР»РµРЅРёРµ",
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
                          рџ“Њ{" "}
                          {t("announcements.pinned", {
                            defaultValue: "Р—Р°РєСЂРµРїР»РµРЅРѕ",
                          })}
                        </span>
                      )}
                      {a.title}
                    </div>
                    <div className="clinic-ann-card-sub">
                      {a.authorName ||
                        t("announcements.author", { defaultValue: "РђРІС‚РѕСЂ" })}
                      {"  В·  "}
                      {fmtDate(a.createdAt)}
                      {a.audience === "department" && (
                        <span className="clinic-ann-aud">
                          {"  В·  "}
                          {t("announcements.audienceDepartment", {
                            defaultValue: "РћС‚РґРµР»РµРЅРёРµ",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  {!a.viewerHasRead && a.status !== "archived" && (
                    <span
                      className="clinic-ann-unread-dot"
                      title="РќРµ РїСЂРѕС‡РёС‚Р°РЅРѕ"
                    />
                  )}
                  {a.status !== "archived" ? (
                    <button onClick={(e) => handleArchive(a, e)}>
                      {t("announcements.archive", { defaultValue: "Р’ Р°СЂС…РёРІ" })}
                    </button>
                  ) : (
                    <button onClick={(e) => handleUnarchive(a, e)}>
                      {t("announcements.unarchive", {
                        defaultValue: "Р’РµСЂРЅСѓС‚СЊ РёР· Р°СЂС…РёРІР°",
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
                          total: layoutContext?.memberCount || "вЂ”",
                          defaultValue: `РџСЂРѕС‡РёС‚Р°Р»Рё ${a.readCount || 0}`,
                        })}
                      </div>
                    )}

                    {canWrite && (
                      <div className="clinic-ann-actions">
                        <button onClick={(e) => handlePin(a, e)}>
                          {a.pinned
                            ? t("announcements.unpin", {
                                defaultValue: "РћС‚РєСЂРµРїРёС‚СЊ",
                              })
                            : t("announcements.pin", {
                                defaultValue: "Р—Р°РєСЂРµРїРёС‚СЊ",
                              })}
                        </button>
                        {a.status !== "archived" && (
                          <button onClick={(e) => handleArchive(a, e)}>
                            {t("announcements.archive", {
                              defaultValue: "Р’ Р°СЂС…РёРІ",
                            })}
                          </button>
                        )}
                        <button
                          className="clinic-ann-danger"
                          onClick={(e) => handleDelete(a, e)}
                        >
                          {t("announcements.delete", {
                            defaultValue: "РЈРґР°Р»РёС‚СЊ",
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
