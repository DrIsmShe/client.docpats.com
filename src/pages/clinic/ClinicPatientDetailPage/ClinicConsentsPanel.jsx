// client/src/pages/clinic/ClinicPatientDetailPage/ClinicConsentsPanel.jsx
//
// Sprint 3 closure (Pull Consent, part B) — clinic-side.
//
// Показывает все доступы (PatientConsent), которые пациент выдал ЭТОЙ клинике,
// и даёт прекратить активный доступ (revoke). Самодостаточный компонент —
// рендерит собственную <section>, в карточку подключается одной строкой.
//
// API:
//   listClinicConsentsForPatient(cardId) → { items, count }
//   revokeClinicConsent(consentId, reason?) → { consent, action }
//
// i18n: namespace "clinic", ключи patients.consents.* (с defaultValue —
// работает и до добавления локалей в Шаге 4).

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  listClinicConsentsForPatient,
  revokeClinicConsent,
} from "../../../api/clinic";

const SCOPE_KEYS = [
  "encounters",
  "allergies",
  "chronicDiseases",
  "operations",
  "familyHistory",
  "immunization",
  "imaging",
];

function deriveStatus(c) {
  if (c.revokedAt) return "revoked";
  if (c.expiresAt && new Date(c.expiresAt) <= new Date()) return "expired";
  return "active";
}

export default function ClinicConsentsPanel({
  cardId,
  refreshSignal = 0,
  canRevoke = true,
}) {
  const { t, i18n } = useTranslation("clinic");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    if (!cardId) return;
    try {
      setLoading(true);
      setError(false);
      const data = await listClinicConsentsForPatient(cardId);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error("[ClinicConsentsPanel] load failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    load();
  }, [load, refreshSignal]);

  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined);
    } catch {
      return "—";
    }
  };

  const statusLabel = (status) =>
    ({
      active: t("patients.consents.status.active", { defaultValue: "Активен" }),
      revoked: t("patients.consents.status.revoked", {
        defaultValue: "Отозван",
      }),
      expired: t("patients.consents.status.expired", {
        defaultValue: "Истёк",
      }),
    })[status] || status;

  const statusColor = (status) =>
    ({
      active: { bg: "#dcfce7", fg: "#14532d", bd: "#86efac" },
      revoked: { bg: "#fee2e2", fg: "#7f1d1d", bd: "#fca5a5" },
      expired: { bg: "#f1f5f9", fg: "#475569", bd: "#cbd5e1" },
    })[status] || { bg: "#f1f5f9", fg: "#475569", bd: "#cbd5e1" };

  const activeScopes = (scopes) =>
    SCOPE_KEYS.filter((k) => scopes && scopes[k]).map((k) =>
      t(`patients.consents.scopes.${k}`, { defaultValue: k }),
    );

  async function handleRevoke(consent) {
    const ok = window.confirm(
      t("patients.consents.confirmRevoke", {
        defaultValue:
          "Прекратить доступ клиники к данным этого пациента? Действие необратимо — потребуется новый consent.",
      }),
    );
    if (!ok) return;

    setRevokingId(consent._id);
    try {
      await revokeClinicConsent(consent._id);
      showToast(
        "success",
        t("patients.consents.toasts.revoked", {
          defaultValue: "Доступ прекращён",
        }),
      );
      await load();
    } catch (err) {
      console.error("[ClinicConsentsPanel] revoke failed:", err);
      const status = err?.response?.status;
      if (status === 403) {
        showToast(
          "error",
          t("patients.consents.toasts.forbidden", {
            defaultValue: "Это не ваш доступ",
          }),
        );
      } else if (status === 404) {
        showToast(
          "error",
          t("patients.consents.toasts.notFound", {
            defaultValue: "Доступ не найден",
          }),
        );
        await load();
      } else {
        showToast(
          "error",
          t("patients.consents.toasts.revokeError", {
            defaultValue: "Не удалось прекратить доступ",
          }),
        );
      }
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <section className="staff-page-section">
      <h2>
        {t("patients.consents.title", { defaultValue: "Выданные доступы" })}
      </h2>

      {loading && (
        <p style={{ color: "#64748b", fontSize: 14 }}>
          {t("common.loading", { defaultValue: "Загрузка…" })}
        </p>
      )}

      {!loading && error && (
        <p style={{ color: "#dc2626", fontSize: 14 }}>
          {t("patients.consents.error", {
            defaultValue: "Не удалось загрузить доступы.",
          })}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p style={{ color: "#64748b", fontSize: 14 }}>
          {t("patients.consents.empty", {
            defaultValue:
              "Пациент пока не выдавал вашей клинике доступ к своим данным.",
          })}
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((c) => {
            const status = deriveStatus(c);
            const colors = statusColor(status);
            const scopes = activeScopes(c.scopes);
            const isActive = status === "active";
            return (
              <div
                key={c._id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 16,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {t(`patients.consents.purpose.${c.purpose}`, {
                      defaultValue: c.purpose,
                    })}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: colors.bg,
                      color: colors.fg,
                      border: `1px solid ${colors.bd}`,
                    }}
                  >
                    {statusLabel(status)}
                  </span>
                </div>

                {/* Scopes */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  {scopes.length > 0 ? (
                    scopes.map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 12,
                          padding: "3px 9px",
                          borderRadius: 8,
                          background: "#eef2ff",
                          color: "#3730a3",
                          border: "1px solid #c7d2fe",
                        }}
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>—</span>
                  )}
                </div>

                {/* Meta */}
                <div
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 16,
                    marginBottom: isActive && canRevoke ? 12 : 0,
                  }}
                >
                  <span>
                    {t("patients.consents.signedAt", {
                      defaultValue: "Выдан",
                    })}
                    : {fmtDate(c.signedAt)}
                  </span>
                  <span>
                    {t("patients.consents.expiresAt", {
                      defaultValue: "Истекает",
                    })}
                    : {c.expiresAt ? fmtDate(c.expiresAt) : "∞"}
                  </span>
                  {c.revokedAt && (
                    <span>
                      {t("patients.consents.revokedAt", {
                        defaultValue: "Отозван",
                      })}
                      : {fmtDate(c.revokedAt)}
                    </span>
                  )}
                </div>

                {/* Revoke action — only active + allowed */}
                {isActive && canRevoke && (
                  <button
                    type="button"
                    className="staff-page-btn-primary patient-detail-btn-danger"
                    onClick={() => handleRevoke(c)}
                    disabled={revokingId === c._id}
                  >
                    {revokingId === c._id
                      ? t("common.loading", { defaultValue: "Загрузка…" })
                      : t("patients.consents.revokeButton", {
                          defaultValue: "Прекратить доступ",
                        })}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            padding: "14px 20px",
            background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
            color: toast.type === "success" ? "#14532d" : "#7f1d1d",
            border: `1px solid ${
              toast.type === "success" ? "#86efac" : "#fca5a5"
            }`,
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 9999,
            boxShadow: "0 12px 32px -8px rgba(0,0,0,0.2)",
          }}
        >
          {toast.msg}
        </div>
      )}
    </section>
  );
}
