// client/src/pages/clinic/ClinicPatientDetailPage/EncounterDetailModal.jsx
//
// Detail view for one encounter (medical history record).
// Sprint 2 Phase 2D.2 — Step 2 (Sign / Edit / Amend / Delete actions).
//
// Action button visibility matrix:
//   status   isOwner  canWrite  canDelete  ⇒ buttons shown
//   ───────  ───────  ────────  ─────────    ─────────────────────────
//   draft    yes      yes       *            Sign · Edit
//   draft    yes      yes       yes          Sign · Edit · Delete
//   signed   yes      yes       *            Amend
//   signed   yes      yes       yes          Amend · Delete
//   amended  yes      yes       *            Amend
//   amended  yes      yes       yes          Amend · Delete
//   *        no       *         *            (no actions — cross-clinic read-only)
//
// "isOwner" = the encounter was created by the current clinic. Backend
// enforces this on every write — we mirror the rule in UI to avoid
// confusing buttons that fail with 403.
//
// History panel: if encounter.history[] has entries (from past amends),
// show a collapsible section with each prior version + amend reason.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { signEncounter, deleteEncounter } from "../../../api/clinic";
// Styles come from medicalRecordsSection.css (imported by the parent
// MedicalRecordsSection). We share the .med-modal-* / .med-detail-*
// classes — no separate CSS file needed.

const CLINICAL_ROWS = [
  {
    key: "complaints",
    labelKey: "medical.encounters.fields.complaints",
    labelDefault: "Жалобы",
  },
  {
    key: "anamnesisMorbi",
    labelKey: "medical.encounters.fields.anamnesisMorbi",
    labelDefault: "Anamnesis morbi",
  },
  {
    key: "anamnesisVitae",
    labelKey: "medical.encounters.fields.anamnesisVitae",
    labelDefault: "Anamnesis vitae",
  },
  {
    key: "statusPreasens",
    labelKey: "medical.encounters.fields.statusPreasens",
    labelDefault: "Status praesens",
  },
  {
    key: "statusLocalis",
    labelKey: "medical.encounters.fields.statusLocalis",
    labelDefault: "Status localis",
  },
  {
    key: "additionalDiagnosis",
    labelKey: "medical.encounters.fields.additionalDiagnosis",
    labelDefault: "Сопутствующий диагноз",
  },
  {
    key: "recommendations",
    labelKey: "medical.encounters.fields.recommendations",
    labelDefault: "Рекомендации",
  },
  {
    key: "ctScanResults",
    labelKey: "medical.encounters.fields.ctScanResults",
    labelDefault: "Результаты КТ",
  },
  {
    key: "mriResults",
    labelKey: "medical.encounters.fields.mriResults",
    labelDefault: "Результаты МРТ",
  },
  {
    key: "ultrasoundResults",
    labelKey: "medical.encounters.fields.ultrasoundResults",
    labelDefault: "Результаты УЗИ",
  },
  {
    key: "laboratoryTestResults",
    labelKey: "medical.encounters.fields.laboratoryTestResults",
    labelDefault: "Лабораторные данные",
  },
];

export default function EncounterDetailModal({
  encounter,
  canWrite = false,
  canDelete = false,
  myRole,
  onClose,
  onEdit,
  onAmend,
  onChanged,
  onDeleted,
}) {
  const { t, i18n } = useTranslation("clinic");
  const [busy, setBusy] = useState(null); // "sign" | "delete" | null
  const [actionError, setActionError] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  function fmtDate(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString(i18n.language || undefined);
    } catch {
      return "—";
    }
  }

  const dx = encounter.mainDiagnosis;
  const isCrossClinic = Boolean(encounter.isCrossClinic);
  // Owner clinic = the encounter belongs to us. The backend signals this
  // by NOT setting isCrossClinic. (Filtered cross-clinic shape also strips
  // sensitive content for non-doctor/owner/admin viewers — but the status
  // and structural fields are always present.)
  const isOwnerClinic = !isCrossClinic;

  // Visible only if owner-clinic + write perm. canDelete additionally gates Delete.
  const showSign = isOwnerClinic && canWrite && encounter.status === "draft";
  const showEdit = isOwnerClinic && canWrite && encounter.status === "draft";
  const showAmend =
    isOwnerClinic &&
    canWrite &&
    (encounter.status === "signed" || encounter.status === "amended");
  const showDelete = isOwnerClinic && canDelete;

  const history = Array.isArray(encounter.history) ? encounter.history : [];
  const hasHistory = history.length > 0;

  // Build list of clinical content fields actually present
  const clinicalRows = CLINICAL_ROWS.filter(
    (row) => encounter[row.key] && String(encounter[row.key]).trim(),
  );

  // ─── Action handlers ───

  async function handleSign() {
    if (!showSign) return;
    if (!dx || !dx.code?.trim() || !dx.text?.trim()) {
      setActionError(
        t("medical.encounters.errors.signNeedsDx", {
          defaultValue:
            "Перед подписанием заполните основной диагноз (Edit → код МКБ + текст).",
        }),
      );
      return;
    }
    setActionError(null);
    setBusy("sign");
    try {
      const res = await signEncounter(encounter._id, {});
      const updated = res.encounter || res;
      onChanged && onChanged(updated);
    } catch (err) {
      console.error("Sign failed:", err);
      setActionError(
        err.response?.data?.error ||
          t("medical.encounters.errors.signFailed", {
            defaultValue: "Не удалось подписать запись",
          }),
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!showDelete) return;
    if (
      !window.confirm(
        t("medical.encounters.confirmDelete", {
          defaultValue:
            "Удалить эту запись приёма? Это действие нельзя отменить.",
        }),
      )
    )
      return;
    setActionError(null);
    setBusy("delete");
    try {
      await deleteEncounter(encounter._id);
      onDeleted && onDeleted(encounter._id);
    } catch (err) {
      console.error("Delete failed:", err);
      setActionError(
        err.response?.data?.error ||
          t("medical.encounters.errors.deleteFailed", {
            defaultValue: "Не удалось удалить запись",
          }),
      );
      setBusy(null);
    }
  }

  return (
    <div
      className="med-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="med-modal med-modal-detail"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="med-modal-head">
          <div className="med-detail-head-titles">
            <h3>
              {t("medical.encounters.detailTitle", {
                defaultValue: "Запись приёма",
              })}
            </h3>
            <div className="med-detail-meta">
              <span className={`med-status med-status-${encounter.status}`}>
                {t(`medical.encounters.status.${encounter.status}`, {
                  defaultValue: encounter.status,
                })}
              </span>
              {isCrossClinic && (
                <span className="med-cross-clinic-badge">
                  {t("medical.crossClinicBadge", {
                    defaultValue: "Другая клиника",
                  })}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="med-modal-close"
            onClick={onClose}
            aria-label="Close"
            disabled={busy !== null}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="med-modal-body">
          {/* Diagnosis card */}
          <div className="med-detail-dx">
            <div className="med-detail-dx-label">
              {t("medical.encounters.mainDiagnosisTitle", {
                defaultValue: "Основной диагноз",
              })}
            </div>
            {dx && (dx.code || dx.text) ? (
              <div className="med-detail-dx-body">
                {dx.code && <span className="med-icd-code">{dx.code}</span>}
                <span className="med-detail-dx-text">{dx.text || "—"}</span>
                {dx.codeTitle && (
                  <div className="med-detail-dx-title">{dx.codeTitle}</div>
                )}
              </div>
            ) : (
              <div className="med-detail-dx-body med-detail-empty">
                {t("medical.encounters.noDiagnosis", {
                  defaultValue: "Диагноз не указан",
                })}
              </div>
            )}
          </div>

          {/* Clinical content rows */}
          {clinicalRows.length > 0 && (
            <div className="med-detail-clinical">
              {clinicalRows.map((row) => (
                <div key={row.key} className="med-detail-row">
                  <div className="med-detail-row-label">
                    {t(row.labelKey, { defaultValue: row.labelDefault })}
                  </div>
                  <div className="med-detail-row-value">
                    {encounter[row.key]}
                  </div>
                </div>
              ))}
            </div>
          )}

          {clinicalRows.length === 0 && (
            <div className="med-detail-empty med-detail-no-content">
              {t("medical.encounters.noContent", {
                defaultValue: "Клинический текст не заполнен.",
              })}
            </div>
          )}

          {/* History (amend log) */}
          {hasHistory && (
            <div className="med-history">
              <button
                type="button"
                className="med-history-toggle"
                onClick={() => setHistoryOpen((o) => !o)}
              >
                {historyOpen ? "▼" : "▶"}{" "}
                {t("medical.encounters.historyTitle", {
                  defaultValue: "История изменений",
                })}
                <span className="staff-page-count">{history.length}</span>
              </button>
              {historyOpen && (
                <ol className="med-history-list">
                  {history
                    .slice()
                    .reverse()
                    .map((h, i) => (
                      <li key={i} className="med-history-item">
                        <div className="med-history-meta">
                          <strong>{fmtDate(h.amendedAt)}</strong>
                          {h.reason && (
                            <span className="med-history-reason">
                              {h.reason}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                </ol>
              )}
            </div>
          )}

          {/* Meta footer (audit info) */}
          <div className="med-detail-footer">
            <div>
              {t("medical.encounters.createdAt", { defaultValue: "Создана" })}:{" "}
              <strong>{fmtDate(encounter.createdAt)}</strong>
            </div>
            {encounter.signedAt && (
              <div>
                {t("medical.encounters.signedAt", {
                  defaultValue: "Подписана",
                })}
                : <strong>{fmtDate(encounter.signedAt)}</strong>
              </div>
            )}
            {encounter.updatedAt &&
              encounter.updatedAt !== encounter.createdAt && (
                <div>
                  {t("medical.encounters.updatedAt", {
                    defaultValue: "Изменена",
                  })}
                  : <strong>{fmtDate(encounter.updatedAt)}</strong>
                </div>
              )}
          </div>

          {actionError && (
            <div className="patients-form-error patients-form-error-banner">
              {actionError}
            </div>
          )}
        </div>

        {/* Footer — action buttons */}
        <div className="med-modal-foot">
          <button
            type="button"
            className="staff-page-btn-secondary"
            onClick={onClose}
            disabled={busy !== null}
          >
            {t("common.close", { defaultValue: "Закрыть" })}
          </button>

          {showDelete && (
            <button
              type="button"
              className="staff-page-btn-primary patient-detail-btn-danger"
              onClick={handleDelete}
              disabled={busy !== null}
            >
              {busy === "delete"
                ? t("common.loading", { defaultValue: "..." })
                : t("medical.encounters.deleteButton", {
                    defaultValue: "Удалить",
                  })}
            </button>
          )}

          {showEdit && (
            <button
              type="button"
              className="staff-page-btn-secondary"
              onClick={onEdit}
              disabled={busy !== null}
            >
              {t("medical.encounters.editButton", {
                defaultValue: "Редактировать",
              })}
            </button>
          )}

          {showAmend && (
            <button
              type="button"
              className="staff-page-btn-secondary"
              onClick={onAmend}
              disabled={busy !== null}
            >
              {t("medical.encounters.amendButton", {
                defaultValue: "Исправить",
              })}
            </button>
          )}

          {showSign && (
            <button
              type="button"
              className="staff-page-btn-primary"
              onClick={handleSign}
              disabled={busy !== null}
            >
              {busy === "sign"
                ? t("common.submitting", { defaultValue: "Подписание..." })
                : t("medical.encounters.signButton", {
                    defaultValue: "Подписать",
                  })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
