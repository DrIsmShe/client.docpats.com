// client/src/pages/doctorProfilePages/myClinics/DoctorMyClinicsPage.jsx
//
// "My clinics" + pending invitations (Variant 2). A doctor sees:
//   1. Invitations section (pending MembershipRequests) — Accept / Reject.
//   2. The clinics they already belong to.
//
// Accepting an invitation creates the membership server-side, then we refresh
// both lists so the clinic moves from "invitations" into "my clinics".

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getMyMemberships,
  getMyMembershipRequests,
  acceptMembershipRequest,
  rejectMembershipRequest,
} from "../../../api/clinic";

export default function DoctorMyClinicsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [mem, reqs] = await Promise.all([
        getMyMemberships().catch(() => ({ items: [] })),
        getMyMembershipRequests().catch(() => ({ items: [] })),
      ]);
      setItems(Array.isArray(mem?.items) ? mem.items : []);
      setRequests(Array.isArray(reqs?.items) ? reqs.items : []);
    } catch (err) {
      console.error("my-clinics load:", err?.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleLabel = (role) => t(`roles.${role}`, { defaultValue: role || "—" });

  const fmtDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  async function handleAccept(reqId) {
    setBusyId(reqId);
    try {
      await acceptMembershipRequest(reqId);
      await load();
    } catch {
      alert(
        t("myClinics.actionError", {
          defaultValue: "Не удалось выполнить действие",
        }),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(reqId) {
    setBusyId(reqId);
    try {
      await rejectMembershipRequest(reqId);
      await load();
    } catch {
      alert(
        t("myClinics.actionError", {
          defaultValue: "Не удалось выполнить действие",
        }),
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          {t("myClinics.title", { defaultValue: "Мои клиники" })}
        </h1>
        <p style={styles.subtitle}>
          {t("myClinics.subtitle", {
            defaultValue: "Клиники, в которых вы работаете",
          })}
        </p>
      </div>

      {/* ── Invitations ── */}
      {requests.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            {t("myClinics.invitations", { defaultValue: "Приглашения" })}
          </div>
          <div style={styles.list}>
            {requests.map((r) => (
              <div
                key={r.requestId}
                style={{ ...styles.card, ...styles.inviteCard }}
              >
                <div style={styles.cardLeft}>
                  <div style={{ ...styles.logo, background: "#fef3c7" }}>
                    <span style={{ ...styles.logoFallback, color: "#b45309" }}>
                      {(r.clinicName || "?").slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div style={styles.clinicName}>{r.clinicName}</div>
                    <div style={styles.meta}>
                      {t("myClinics.invitedAs", {
                        defaultValue: "Приглашение",
                      })}
                      {"  ·  "}
                      {roleLabel(r.role)}
                      {r.clinicCity ? `  ·  ${r.clinicCity}` : ""}
                    </div>
                  </div>
                </div>
                <div style={styles.inviteActions}>
                  <button
                    style={styles.acceptBtn}
                    disabled={busyId === r.requestId}
                    onClick={() => handleAccept(r.requestId)}
                  >
                    {t("myClinics.accept", { defaultValue: "Принять" })}
                  </button>
                  <button
                    style={styles.rejectBtn}
                    disabled={busyId === r.requestId}
                    onClick={() => handleReject(r.requestId)}
                  >
                    {t("myClinics.reject", { defaultValue: "Отклонить" })}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── My clinics ── */}
      {loading ? (
        <div style={styles.state}>
          {t("common.loading", { defaultValue: "Загрузка…" })}
        </div>
      ) : error ? (
        <div style={styles.state}>
          {t("myClinics.error", {
            defaultValue: "Не удалось загрузить список клиник",
          })}
        </div>
      ) : items.length === 0 ? (
        <div style={styles.state}>
          {requests.length > 0
            ? t("myClinics.emptyWithInvites", {
                defaultValue:
                  "Примите приглашение, чтобы присоединиться к клинике",
              })
            : t("myClinics.empty", {
                defaultValue: "Вы пока не состоите ни в одной клинике",
              })}
        </div>
      ) : (
        <div style={styles.list}>
          {items.map((c) => (
            <div key={c.membershipId} style={styles.card}>
              <div style={styles.cardLeft}>
                <div style={styles.logo}>
                  {c.clinicLogo ? (
                    <img
                      src={c.clinicLogo}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 12,
                      }}
                    />
                  ) : (
                    <span style={styles.logoFallback}>
                      {(c.clinicName || "?").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div style={styles.clinicName}>
                    {c.clinicName ||
                      t("myClinics.unnamed", { defaultValue: "Клиника" })}
                    {c.isPrimary && (
                      <span style={styles.primaryBadge}>
                        {t("myClinics.primary", { defaultValue: "Основная" })}
                      </span>
                    )}
                  </div>
                  <div style={styles.meta}>
                    {roleLabel(c.role)}
                    {c.clinicCity ? `  ·  ${c.clinicCity}` : ""}
                    {c.joinedAt ? `  ·  ${fmtDate(c.joinedAt)}` : ""}
                  </div>
                  {c.customTitle && (
                    <div style={styles.customTitle}>{c.customTitle}</div>
                  )}
                </div>
              </div>
              <button style={styles.goBtn} onClick={() => navigate("/clinic")}>
                {t("myClinics.open", { defaultValue: "Перейти" })} →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 760, margin: "0 auto", padding: "28px 20px 64px" },
  header: { marginBottom: 22 },
  title: { fontSize: 26, fontWeight: 700, color: "#1e293b", margin: 0 },
  subtitle: { fontSize: 14, color: "#64748b", margin: "6px 0 0" },
  section: { marginBottom: 26 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#b45309",
    marginBottom: 10,
  },
  state: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
  },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "16px 18px",
  },
  inviteCard: { borderColor: "#fcd34d", background: "#fffdf5" },
  cardLeft: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  logoFallback: { fontSize: 20, fontWeight: 700, color: "#6366f1" },
  clinicName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  primaryBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "#0369a1",
    background: "#e0f2fe",
    padding: "2px 8px",
    borderRadius: 6,
  },
  meta: { fontSize: 13, color: "#94a3b8", marginTop: 3 },
  customTitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  goBtn: {
    flexShrink: 0,
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "9px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  inviteActions: { display: "flex", gap: 8, flexShrink: 0 },
  acceptBtn: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 9,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  rejectBtn: {
    background: "#fff",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: 9,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
