// client/src/pages/clinic/ClinicPatientDetailPage/PrescriptionsTab.jsx
//
// Prescriptions tab inside MedicalRecordsSection. Stage 2 #4.
//
// Mirrors the EncountersTab pattern (list + add button + empty/error/loading
// states, shared .med-* classes).
//
// Bug fixes (2 Jun 2026):
//   1. busy-state lockup — action handlers now reset busyId reliably and
//      action buttons call e.stopPropagation() so a click never bubbles to
//      the card-head toggle (which could re-render mid-flight).
//   2. PDF blob-error parsing — when responseType:"blob" gets a 500, the
//      error body arrives as a Blob, so err.response.data.error is unreadable.
//      We now read the Blob text and parse it before showing the message.

import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  listPrescriptions,
  cancelPrescription,
  completePrescription,
  deletePrescription,
  getPrescriptionPdf,
  updatePrescription,
} from "../../../api/clinic";
import PrescriptionFormModal from "./PrescriptionFormModal";

/**
 * Extract a human-readable error message from an axios error whose response
 * body may be a Blob (happens when responseType:"blob" + non-200).
 */
async function readApiError(err, fallback) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      try {
        const json = JSON.parse(text);
        return json.error || json.message || fallback;
      } catch {
        return text || fallback;
      }
    } catch {
      return fallback;
    }
  }
  return data?.error || data?.message || fallback;
}

export default function PrescriptionsTab({ patient, canWrite, canDelete }) {
  const { t, i18n } = useTranslation("clinic");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  // Какой рецепт правим. null — форма открыта на создание.
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null); // prescriptionId
  const [busyId, setBusyId] = useState(null); // row with in-flight action

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await listPrescriptions(patient._id, { limit: 50 });
      setItems(res.items || []);
    } catch (err) {
      console.error("Failed to load prescriptions:", err);
      setError(
        err.response?.data?.error ||
          t("medical.prescriptions.loadError", {
            defaultValue: "Не удалось загрузить рецепты",
          }),
      );
    } finally {
      setLoading(false);
    }
  }, [patient._id, t]);

  useEffect(() => {
    load();
  }, [load]);

  function formatDate(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  function handleCreated(newRx) {
    setShowForm(false);
    setItems((prev) => [newRx, ...prev]);
    setTimeout(load, 0);
  }

  async function handleCancel(rx) {
    if (
      !window.confirm(
        t("medical.prescriptions.confirmCancel", {
          defaultValue: "Отменить этот рецепт?",
        }),
      )
    )
      return;
    setBusyId(rx._id);
    try {
      const res = await cancelPrescription(rx._id);
      const updated = res.prescription || res;
      setItems((prev) =>
        prev.map((p) => (String(p._id) === String(rx._id) ? updated : p)),
      );
    } catch (err) {
      console.error("Cancel failed:", err);
      const msg = await readApiError(
        err,
        t("common.actionFailed", { defaultValue: "Действие не выполнено" }),
      );
      alert(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function handleComplete(rx) {
    setBusyId(rx._id);
    try {
      const res = await completePrescription(rx._id);
      const updated = res.prescription || res;
      setItems((prev) =>
        prev.map((p) => (String(p._id) === String(rx._id) ? updated : p)),
      );
    } catch (err) {
      console.error("Complete failed:", err);
      const msg = await readApiError(
        err,
        t("common.actionFailed", { defaultValue: "Действие не выполнено" }),
      );
      alert(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(rx) {
    if (
      !window.confirm(
        t("medical.prescriptions.confirmDelete", {
          defaultValue: "Удалить рецепт безвозвратно?",
        }),
      )
    )
      return;
    setBusyId(rx._id);
    try {
      await deletePrescription(rx._id);
      setItems((prev) => prev.filter((p) => String(p._id) !== String(rx._id)));
    } catch (err) {
      console.error("Delete failed:", err);
      const msg = await readApiError(
        err,
        t("common.actionFailed", { defaultValue: "Действие не выполнено" }),
      );
      alert(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function handlePdf(rx) {
    setBusyId(rx._id);
    try {
      const lang = (i18n.language || "ru").split("-")[0];
      const blob = await getPrescriptionPdf(rx._id, lang);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("PDF failed:", err);
      const msg = await readApiError(
        err,
        t("medical.prescriptions.pdfError", {
          defaultValue: "Не удалось сформировать PDF",
        }),
      );
      alert(msg);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="med-pane">
      <div className="med-pane-head">
        <div className="med-pane-title">
          {t("medical.prescriptions.listTitle", { defaultValue: "Рецепты" })}
          <span className="staff-page-count">{items.length}</span>
        </div>
        {canWrite && (
          <button
            type="button"
            className="staff-page-btn-primary med-btn-add"
            onClick={() => setShowForm(true)}
          >
            {t("medical.prescriptions.addButton", {
              defaultValue: "+ Новый рецепт",
            })}
          </button>
        )}
      </div>

      {loading ? (
        <div className="med-empty">
          <div className="staff-page-spinner" />
        </div>
      ) : error ? (
        <div className="med-error">
          <p>{error}</p>
          <button
            type="button"
            className="staff-page-btn-secondary"
            onClick={load}
          >
            {t("common.retry", { defaultValue: "Повторить" })}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="med-empty">
          <p>
            {t("medical.prescriptions.emptyText", {
              defaultValue: "Пока нет ни одного рецепта.",
            })}
          </p>
          {canWrite && (
            <button
              type="button"
              className="staff-page-btn-primary"
              onClick={() => setShowForm(true)}
            >
              {t("medical.prescriptions.addFirstButton", {
                defaultValue: "Выписать первый рецепт",
              })}
            </button>
          )}
        </div>
      ) : (
        <div className="rx-list">
          {items.map((rx) => (
            <PrescriptionCard
              key={rx._id}
              rx={rx}
              expanded={String(expanded) === String(rx._id)}
              onToggle={() =>
                setExpanded((cur) =>
                  String(cur) === String(rx._id) ? null : rx._id,
                )
              }
              formatDate={formatDate}
              canWrite={canWrite}
              canDelete={canDelete}
              busy={String(busyId) === String(rx._id)}
              onCancel={() => handleCancel(rx)}
              onComplete={() => handleComplete(rx)}
              onDelete={() => handleDelete(rx)}
              onPdf={() => handlePdf(rx)}
              onEdit={() => setEditing(rx)}
              t={t}
            />
          ))}
        </div>
      )}

      {showForm && (
        <PrescriptionFormModal
          patient={patient}
          onClose={() => setShowForm(false)}
          onSaved={handleCreated}
        />
      )}

      {/* Правка выписанного. Та же форма: врач исправляет опечатку в тех же
          полях, в которых её сделал. Сервер разрешит её только пока рецепт
          активен и по нему ничего не отпущено. */}
      {editing && (
        <PrescriptionFormModal
          patient={patient}
          initial={editing}
          submit={updatePrescription}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            setItems((prev) =>
              prev.map((x) =>
                String(x._id) === String(saved._id) ? saved : x,
              ),
            );
          }}
        />
      )}
    </div>
  );
}

function PrescriptionCard({
  rx,
  expanded,
  onToggle,
  formatDate,
  canWrite,
  canDelete,
  busy,
  onCancel,
  onComplete,
  onEdit,
  onDelete,
  onPdf,
  t,
}) {
  const isCross = Boolean(rx.isCrossClinic);
  const items = Array.isArray(rx.items) ? rx.items : [];
  const summary =
    items.length > 0
      ? items
          .map((it) => it.inn)
          .filter(Boolean)
          .join(", ")
      : isCross
        ? t("medical.prescriptions.hiddenCrossClinic", {
            defaultValue: "Содержимое скрыто (другая клиника)",
          })
        : "—";
  const isActive = rx.status === "active";

  // Wrap each action so the click never bubbles up to the card-head toggle.
  const act = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className={`rx-card ${isCross ? "is-cross-clinic" : ""}`}>
      <div
        className="rx-card-head"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="rx-card-main">
          <span className="rx-card-date">
            {formatDate(rx.issuedAt || rx.createdAt)}
          </span>
          <span className="rx-card-summary">{summary}</span>
        </div>
        <div className="rx-card-meta">
          {isCross && (
            <span
              className="med-cross-clinic-badge"
              title={t("medical.crossClinicHint", {
                defaultValue:
                  "Рецепт выписан другой клиникой — доступ через согласие пациента",
              })}
            >
              {t("medical.crossClinicBadge", {
                defaultValue: "Другая клиника",
              })}
            </span>
          )}
          <RxStatusPill status={rx.status} t={t} />
        </div>
      </div>

      {expanded && (
        <div className="rx-card-body">
          {rx.diagnosis?.text || rx.diagnosis?.code ? (
            <div className="rx-diagnosis">
              {rx.diagnosis.code && (
                <span className="med-icd-code">{rx.diagnosis.code}</span>
              )}
              <span>{rx.diagnosis.text}</span>
            </div>
          ) : null}

          {items.length > 0 ? (
            <ol className="rx-items-detail">
              {items.map((it, i) => (
                <li key={it._id || i}>
                  <strong>{it.inn}</strong>
                  {it.brandName ? ` (${it.brandName})` : ""}
                  {it.strength ? ` · ${it.strength}` : ""}
                  {it.form
                    ? ` · ${t(`medical.prescriptions.forms.${it.form}`, {
                        defaultValue: it.form,
                      })}`
                    : ""}
                  {it.route
                    ? ` · ${t(`medical.prescriptions.routes.${it.route}`, {
                        defaultValue: it.route,
                      })}`
                    : ""}
                  <div className="rx-item-sub">
                    {it.dose && (
                      <span>
                        {t("medical.prescriptions.fields.dose", {
                          defaultValue: "Доза",
                        })}
                        : {it.dose}
                      </span>
                    )}
                    {it.frequency && (
                      <span>
                        {t("medical.prescriptions.fields.frequency", {
                          defaultValue: "Приём",
                        })}
                        : {it.frequency}
                      </span>
                    )}
                    {it.duration && (
                      <span>
                        {t("medical.prescriptions.fields.duration", {
                          defaultValue: "Длительность",
                        })}
                        : {it.duration}
                      </span>
                    )}
                    {it.quantity && (
                      <span>
                        {t("medical.prescriptions.fields.quantity", {
                          defaultValue: "Кол-во",
                        })}
                        : {it.quantity}
                      </span>
                    )}
                    {it.prn && (
                      <span>
                        {t("medical.prescriptions.fields.prn", {
                          defaultValue: "По требованию",
                        })}
                      </span>
                    )}
                  </div>
                  {it.instructions && (
                    <div className="rx-item-instr">{it.instructions}</div>
                  )}
                </li>
              ))}
            </ol>
          ) : null}

          {rx.generalNotes && (
            <div className="rx-general-notes">{rx.generalNotes}</div>
          )}

          {rx.status === "cancelled" && rx.closedReason && (
            <div className="rx-closed-reason">
              {t("medical.prescriptions.cancelledReason", {
                defaultValue: "Причина отмены",
              })}
              : {rx.closedReason}
            </div>
          )}

          {/* Actions — each stops propagation so the card-head toggle
              doesn't fire and re-render mid-click. */}
          <div className="rx-card-actions">
            <button
              type="button"
              className="staff-page-btn-secondary"
              onClick={act(onPdf)}
              disabled={busy}
            >
              {t("medical.prescriptions.pdfButton", { defaultValue: "PDF" })}
            </button>

            {!isCross && canWrite && isActive && (
              <>
                <button
                  type="button"
                  className="staff-page-btn-secondary"
                  onClick={act(onEdit)}
                  disabled={busy}
                >
                  {t("common.edit", { defaultValue: "Изменить" })}
                </button>
                <button
                  type="button"
                  className="staff-page-btn-secondary"
                  onClick={act(onComplete)}
                  disabled={busy}
                >
                  {t("medical.prescriptions.completeButton", {
                    defaultValue: "Завершить",
                  })}
                </button>
                <button
                  type="button"
                  className="staff-page-btn-secondary rx-btn-danger"
                  onClick={act(onCancel)}
                  disabled={busy}
                >
                  {t("medical.prescriptions.cancelButton", {
                    defaultValue: "Отменить",
                  })}
                </button>
              </>
            )}

            {!isCross && canDelete && (
              <button
                type="button"
                className="staff-page-btn-secondary rx-btn-danger"
                onClick={act(onDelete)}
                disabled={busy}
              >
                {t("common.delete", { defaultValue: "Удалить" })}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RxStatusPill({ status, t }) {
  const labels = {
    active: t("medical.prescriptions.status.active", {
      defaultValue: "Активный",
    }),
    cancelled: t("medical.prescriptions.status.cancelled", {
      defaultValue: "Отменён",
    }),
    completed: t("medical.prescriptions.status.completed", {
      defaultValue: "Завершён",
    }),
  };
  return (
    <span className={`med-status med-status-${status || "active"}`}>
      {labels[status] || status}
    </span>
  );
}
