// client/src/pages/clinic/ClinicPatientDetailPage/ConsentRequestsList.jsx
//
// Sprint 3.2 (Pull Consent) — clinic-side history + cancel.
//
// Показывает все запросы консента, которые клиника отправила этому пациенту:
// pending + терминальные (approved/rejected/cancelled/expired). На pending
// есть кнопка [Отменить] (window.confirm → DELETE /clinic/consent-requests/:id).
//
// DTO из listConsentRequestsForPatient (backend listByClinicAndPatient —
// .find().sort().limit() БЕЗ populate). Каждый item:
//   { _id, status, requestedScopes{7}, approvedScopes{7}, message,
//     respondedNote, requestedAt, respondedAt, expiresAt, createdAt,
//     requestedBy{userId, employeeId} }  ← requestedBy = сырые ObjectId,
//   поэтому "кем запрошено" НЕ показываем (нечем — только id).
//
// Управление состоянием: компонент сам грузит список (loadRequests из props
// или fetch внутри). Родитель передаёт refreshSignal — инкремент после
// create, чтобы список перезагрузился без размонтирования.

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  listConsentRequestsForPatient,
  cancelConsentRequest,
} from "../../../api/clinic";

/* ─── 7 scopes (порядок отображения) ─── */
const SCOPE_KEYS = [
  "encounters",
  "allergies",
  "chronicDiseases",
  "operations",
  "familyHistory",
  "immunization",
  "imaging",
];

/* ─── status → визуальный токен ─── */
const STATUS_META = {
  pending: { cls: "crl-status-pending", dot: "#f59e0b" },
  approved: { cls: "crl-status-approved", dot: "#22c55e" },
  rejected: { cls: "crl-status-rejected", dot: "#ef4444" },
  cancelled: { cls: "crl-status-cancelled", dot: "#94a3b8" },
  expired: { cls: "crl-status-expired", dot: "#94a3b8" },
};

/* ─── Styles (self-contained, паттерн .crm-* из ConsentRequestModal) ─── */
const ListStyles = () => (
  <style>{`
    .crl-section { margin-top: 8px; }
    .crl-list { display: flex; flex-direction: column; gap: 12px; }
    .crl-empty {
      padding: 20px 16px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      background: #f8fafc;
    }
    .crl-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      background: white;
      transition: border-color 0.15s;
    }
    .crl-card.is-pending { border-color: #fde68a; background: #fffbeb; }
    .crl-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }
    .crl-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .crl-status::before {
      content: "";
      width: 7px; height: 7px; border-radius: 50%;
      background: currentColor;
    }
    .crl-status-pending  { color: #b45309; background: #fef3c7; }
    .crl-status-approved { color: #15803d; background: #dcfce7; }
    .crl-status-rejected { color: #b91c1c; background: #fee2e2; }
    .crl-status-cancelled{ color: #475569; background: #f1f5f9; }
    .crl-status-expired  { color: #475569; background: #f1f5f9; }

    .crl-date {
      font-size: 12px;
      color: #94a3b8;
      white-space: nowrap;
    }

    .crl-scopes {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }
    .crl-chip {
      font-size: 12px;
      padding: 3px 9px;
      border-radius: 6px;
      background: #eef2ff;
      color: #4338ca;
      border: 1px solid #e0e7ff;
    }
    /* approved-чип — что реально одобрено */
    .crl-chip.is-approved { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
    /* requested-but-not-approved — приглушённый */
    .crl-chip.is-dropped { background: #f8fafc; color: #94a3b8; border-color: #e2e8f0; text-decoration: line-through; }

    .crl-scopes-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 5px 0;
    }

    .crl-message {
      font-size: 13px;
      color: #475569;
      background: #f8fafc;
      border-left: 3px solid #cbd5e1;
      padding: 8px 12px;
      border-radius: 6px;
      margin: 8px 0;
      line-height: 1.5;
    }
    .crl-note {
      font-size: 13px;
      color: #7f1d1d;
      background: #fef2f2;
      border-left: 3px solid #fca5a5;
      padding: 8px 12px;
      border-radius: 6px;
      margin: 8px 0;
      line-height: 1.5;
    }

    .crl-card-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 10px;
    }
    .crl-expiry {
      font-size: 12px;
      color: #94a3b8;
    }
    .crl-expiry.is-soon { color: #b45309; font-weight: 600; }

    .crl-cancel-btn {
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid #fca5a5;
      background: white;
      color: #b91c1c;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .crl-cancel-btn:hover:not(:disabled) { background: #fef2f2; }
    .crl-cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .crl-loading { padding: 16px; text-align: center; color: #94a3b8; font-size: 14px; }
    .crl-error {
      padding: 12px 14px;
      background: #fee2e2;
      border-left: 3px solid #ef4444;
      border-radius: 6px;
      color: #7f1d1d;
      font-size: 13px;
      margin-bottom: 8px;
    }
  `}</style>
);

export default function ConsentRequestsList({ cardId, refreshSignal = 0 }) {
  const { t, i18n } = useTranslation("clinic");

  const [items, setItems] = useState(null); // null = ещё не грузили
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    if (!cardId) return;
    setLoadError(null);
    try {
      const res = await listConsentRequestsForPatient(cardId);
      // Сортировка с бэка уже createdAt desc — оставляем как есть.
      setItems(res.items || []);
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
          t("patients.consentRequests.errors.loadFailed", {
            defaultValue: "Не удалось загрузить запросы",
          }),
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [cardId, t]);

  // Перезагрузка при mount и при инкременте refreshSignal (после create в родителе)
  useEffect(() => {
    load();
  }, [load, refreshSignal]);

  function fmtDate(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  }

  /** Дней до истечения (для pending). null если нет даты. */
  function daysLeft(expiresAt) {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (Number.isNaN(ms)) return null;
    return Math.ceil(ms / (24 * 60 * 60 * 1000));
  }

  function scopesToArray(scopesObj) {
    if (!scopesObj || typeof scopesObj !== "object") return [];
    return SCOPE_KEYS.filter((k) => scopesObj[k] === true);
  }

  function scopeLabel(key) {
    return t(`patients.consentRequests.scopes.${key}`, {
      defaultValue: key,
    });
  }

  async function handleCancel(requestId) {
    if (
      !window.confirm(
        t("patients.consentRequests.confirmCancel", {
          defaultValue:
            "Отменить запрос доступа? Пациент его больше не увидит.",
        }),
      )
    ) {
      return;
    }
    setActionError(null);
    setCancellingId(requestId);
    try {
      await cancelConsentRequest(requestId);
      await load();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        // Уже не pending — пациент успел ответить / истёк. Перегружаем чтобы
        // показать актуальный статус.
        setActionError(
          t("patients.consentRequests.errors.notPending", {
            defaultValue: "Запрос уже изменил статус — обновляю список.",
          }),
        );
        await load();
      } else {
        setActionError(
          err.response?.data?.message ||
            t("patients.consentRequests.errors.cancelFailed", {
              defaultValue: "Не удалось отменить запрос",
            }),
        );
      }
    } finally {
      setCancellingId(null);
    }
  }

  if (loading && items === null) {
    return (
      <div className="crl-loading">
        {t("common.loading", { defaultValue: "Загрузка…" })}
      </div>
    );
  }

  return (
    <div className="crl-section">
      <ListStyles />

      {loadError && <div className="crl-error">{loadError}</div>}
      {actionError && <div className="crl-error">{actionError}</div>}

      {items && items.length === 0 ? (
        <div className="crl-empty">
          {t("patients.consentRequests.empty", {
            defaultValue: "Запросов доступа к этому пациенту пока нет.",
          })}
        </div>
      ) : (
        <div className="crl-list">
          {(items || []).map((req) => {
            const meta = STATUS_META[req.status] || STATUS_META.cancelled;
            const requested = scopesToArray(req.requestedScopes);
            const approved = scopesToArray(req.approvedScopes);
            const isPending = req.status === "pending";
            const isApproved = req.status === "approved";
            const dLeft = isPending ? daysLeft(req.expiresAt) : null;

            return (
              <div
                key={req._id}
                className={`crl-card ${isPending ? "is-pending" : ""}`}
              >
                {/* Head: status + date */}
                <div className="crl-card-head">
                  <span className={`crl-status ${meta.cls}`}>
                    {t(`patients.consentRequests.status.${req.status}`, {
                      defaultValue: req.status,
                    })}
                  </span>
                  <span className="crl-date">
                    {fmtDate(req.requestedAt || req.createdAt)}
                  </span>
                </div>

                {/* Scopes */}
                <div className="crl-scopes-label">
                  {isApproved
                    ? t("patients.consentRequests.approvedLabel", {
                        defaultValue: "Одобрено:",
                      })
                    : t("patients.consentRequests.requestedLabel", {
                        defaultValue: "Запрошено:",
                      })}
                </div>
                <div className="crl-scopes">
                  {isApproved
                    ? // approved: показываем requested, помечая что одобрено / отброшено
                      requested.map((k) => {
                        const ok = approved.includes(k);
                        return (
                          <span
                            key={k}
                            className={`crl-chip ${
                              ok ? "is-approved" : "is-dropped"
                            }`}
                            title={
                              ok
                                ? t("patients.consentRequests.scopeApproved", {
                                    defaultValue: "Одобрено пациентом",
                                  })
                                : t("patients.consentRequests.scopeDropped", {
                                    defaultValue: "Не одобрено",
                                  })
                            }
                          >
                            {scopeLabel(k)}
                          </span>
                        );
                      })
                    : requested.map((k) => (
                        <span key={k} className="crl-chip">
                          {scopeLabel(k)}
                        </span>
                      ))}
                </div>

                {/* Message от клиники */}
                {req.message && (
                  <div className="crl-message">{req.message}</div>
                )}

                {/* Note от пациента при reject */}
                {req.status === "rejected" && req.respondedNote && (
                  <div className="crl-note">
                    {t("patients.consentRequests.patientNote", {
                      defaultValue: "Ответ пациента:",
                    })}{" "}
                    {req.respondedNote}
                  </div>
                )}

                {/* Foot: expiry + cancel (только pending) */}
                {isPending && (
                  <div className="crl-card-foot">
                    <span
                      className={`crl-expiry ${
                        dLeft !== null && dLeft <= 3 ? "is-soon" : ""
                      }`}
                    >
                      {dLeft !== null && dLeft > 0
                        ? t("patients.consentRequests.expiresIn", {
                            defaultValue: "Истекает через {{count}} дн.",
                            count: dLeft,
                          })
                        : t("patients.consentRequests.expiresSoon", {
                            defaultValue: "Истекает сегодня",
                          })}
                    </span>
                    <button
                      type="button"
                      className="crl-cancel-btn"
                      onClick={() => handleCancel(req._id)}
                      disabled={cancellingId === req._id}
                    >
                      {cancellingId === req._id
                        ? t("common.loading", { defaultValue: "…" })
                        : t("patients.consentRequests.cancel", {
                            defaultValue: "Отменить",
                          })}
                    </button>
                  </div>
                )}

                {/* respondedAt для терминальных */}
                {!isPending && req.respondedAt && (
                  <div className="crl-card-foot">
                    <span className="crl-expiry">
                      {t("patients.consentRequests.respondedAt", {
                        defaultValue: "Ответ: {{date}}",
                        date: fmtDate(req.respondedAt),
                      })}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
