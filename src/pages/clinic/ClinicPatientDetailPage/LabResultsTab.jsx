// client/src/pages/clinic/ClinicPatientDetailPage/LabResultsTab.jsx
//
// Lab Results tab inside MedicalRecordsSection (Stage 2 #A, Variant X).
// Mirrors PrescriptionsTab: list + add + expand cards + busy-state with
// stopPropagation + blob-error parsing + PDF via blob/window.open.
//
// Lab specifics: per-parameter flag chips (norm/↑/↓/‼), status FSM
// (final → corrected | amended), attached original file link.

import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  listLabResults,
  updateLabStatus,
  deleteLabResult,
  getLabResultPdf,
} from "../../../api/clinic";
import LabResultFormModal from "./LabResultFormModal";

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

const FLAG_META = {
  normal: { sym: "", cls: "lab-flag-normal" },
  high: { sym: "↑", cls: "lab-flag-high" },
  low: { sym: "↓", cls: "lab-flag-low" },
  critical_high: { sym: "‼↑", cls: "lab-flag-crit" },
  critical_low: { sym: "‼↓", cls: "lab-flag-crit" },
  abnormal: { sym: "⚠", cls: "lab-flag-high" },
};

export default function LabResultsTab({ patient, canWrite, canDelete }) {
  const { t, i18n } = useTranslation("clinic");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await listLabResults(patient._id, { limit: 50 });
      setItems(res.items || []);
    } catch (err) {
      console.error("Failed to load lab results:", err);
      setError(
        err.response?.data?.error ||
          t("medical.labResults.loadError", {
            defaultValue: "Не удалось загрузить анализы",
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

  function handleCreated(newLab) {
    setShowForm(false);
    setItems((prev) => [newLab, ...prev]);
    setTimeout(load, 0);
  }

  async function handleStatus(lab, status) {
    setBusyId(lab._id);
    try {
      const res = await updateLabStatus(lab._id, status);
      const updated = res.labResult || res;
      setItems((prev) =>
        prev.map((p) => (String(p._id) === String(lab._id) ? updated : p)),
      );
    } catch (err) {
      const msg = await readApiError(
        err,
        t("common.actionFailed", { defaultValue: "Действие не выполнено" }),
      );
      alert(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(lab) {
    if (
      !window.confirm(
        t("medical.labResults.confirmDelete", {
          defaultValue: "Удалить анализ безвозвратно?",
        }),
      )
    )
      return;
    setBusyId(lab._id);
    try {
      await deleteLabResult(lab._id);
      setItems((prev) => prev.filter((p) => String(p._id) !== String(lab._id)));
    } catch (err) {
      const msg = await readApiError(
        err,
        t("common.actionFailed", { defaultValue: "Действие не выполнено" }),
      );
      alert(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function handlePdf(lab) {
    setBusyId(lab._id);
    try {
      const lang = (i18n.language || "ru").split("-")[0];
      const blob = await getLabResultPdf(lab._id, lang);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      const msg = await readApiError(
        err,
        t("medical.labResults.pdfError", {
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
          {t("medical.labResults.listTitle", { defaultValue: "Анализы" })}
          <span className="staff-page-count">{items.length}</span>
        </div>
        {canWrite && (
          <button
            type="button"
            className="staff-page-btn-primary med-btn-add"
            onClick={() => setShowForm(true)}
          >
            {t("medical.labResults.addButton", {
              defaultValue: "+ Новый анализ",
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
            {t("medical.labResults.emptyText", {
              defaultValue: "Пока нет ни одного анализа.",
            })}
          </p>
          {canWrite && (
            <button
              type="button"
              className="staff-page-btn-primary"
              onClick={() => setShowForm(true)}
            >
              {t("medical.labResults.addFirstButton", {
                defaultValue: "Добавить первый анализ",
              })}
            </button>
          )}
        </div>
      ) : (
        <div className="rx-list">
          {items.map((lab) => (
            <LabCard
              key={lab._id}
              lab={lab}
              expanded={String(expanded) === String(lab._id)}
              onToggle={() =>
                setExpanded((cur) =>
                  String(cur) === String(lab._id) ? null : lab._id,
                )
              }
              formatDate={formatDate}
              canWrite={canWrite}
              canDelete={canDelete}
              busy={String(busyId) === String(lab._id)}
              onStatus={(s) => handleStatus(lab, s)}
              onDelete={() => handleDelete(lab)}
              onPdf={() => handlePdf(lab)}
              t={t}
            />
          ))}
        </div>
      )}

      {showForm && (
        <LabResultFormModal
          patient={patient}
          onClose={() => setShowForm(false)}
          onSaved={handleCreated}
        />
      )}
    </div>
  );
}

function LabCard({
  lab,
  expanded,
  onToggle,
  formatDate,
  canWrite,
  canDelete,
  busy,
  onStatus,
  onDelete,
  onPdf,
  t,
}) {
  const isCross = Boolean(lab.isCrossClinic);
  const params = Array.isArray(lab.parameters) ? lab.parameters : [];
  const abnormalCount = params.filter(
    (p) => p.flag && p.flag !== "normal",
  ).length;

  const panelLabel =
    lab.panelTitle ||
    t(`medical.labResults.panels.${lab.panelType}`, {
      defaultValue: lab.panelType || "—",
    });

  const summary = isCross
    ? t("medical.labResults.hiddenCrossClinic", {
        defaultValue: "Содержимое скрыто (другая клиника)",
      })
    : panelLabel;

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
            {formatDate(lab.effectiveDateTime || lab.createdAt)}
          </span>
          <span className="rx-card-summary">{summary}</span>
        </div>
        <div className="rx-card-meta">
          {!isCross && abnormalCount > 0 && (
            <span className="lab-abnormal-badge" title="Отклонения">
              {abnormalCount} ⚠
            </span>
          )}
          {isCross && (
            <span className="med-cross-clinic-badge">
              {t("medical.crossClinicBadge", {
                defaultValue: "Другая клиника",
              })}
            </span>
          )}
          <LabStatusPill status={lab.status} t={t} />
        </div>
      </div>

      {expanded && (
        <div className="rx-card-body">
          {lab.labName && (
            <div className="lab-meta-line">
              {t("medical.labResults.fields.labName", {
                defaultValue: "Лаборатория",
              })}
              : {lab.labName}
            </div>
          )}

          {params.length > 0 && (
            <table className="lab-result-table">
              <thead>
                <tr>
                  <th>
                    {t("medical.labResults.fields.paramName", {
                      defaultValue: "Показатель",
                    })}
                  </th>
                  <th>
                    {t("medical.labResults.fields.value", {
                      defaultValue: "Значение",
                    })}
                  </th>
                  <th>
                    {t("medical.labResults.fields.ref", {
                      defaultValue: "Норма",
                    })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {params.map((p, i) => {
                  const meta = FLAG_META[p.flag] || FLAG_META.normal;
                  const ref =
                    p.referenceRange?.text ||
                    (p.referenceRange?.min != null ||
                    p.referenceRange?.max != null
                      ? `${p.referenceRange?.min ?? ""}–${p.referenceRange?.max ?? ""}`
                      : "—");
                  return (
                    <tr key={i} className={meta.cls}>
                      <td>{p.name}</td>
                      <td className="lab-val-cell">
                        <span className={meta.cls}>
                          {String(p.value)} {p.unit !== "—" ? p.unit : ""}{" "}
                          {meta.sym}
                        </span>
                      </td>
                      <td className="lab-ref-cell">{ref}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {lab.diagnosis?.text || lab.diagnosis?.code ? (
            <div className="rx-diagnosis">
              {lab.diagnosis.code && (
                <span className="med-icd-code">{lab.diagnosis.code}</span>
              )}
              <span>{lab.diagnosis.text}</span>
            </div>
          ) : null}

          {lab.report && <div className="rx-general-notes">{lab.report}</div>}

          {lab.attachedFile?.url && (
            <div className="lab-attached">
              <a
                href={lab.attachedFile.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                📎{" "}
                {lab.attachedFile.fileName ||
                  t("medical.labResults.attachedFile", {
                    defaultValue: "Прикреплённый файл",
                  })}
              </a>
            </div>
          )}

          <div className="rx-card-actions">
            <button
              type="button"
              className="staff-page-btn-secondary"
              onClick={act(onPdf)}
              disabled={busy}
            >
              {t("medical.labResults.pdfButton", { defaultValue: "PDF" })}
            </button>

            {!isCross && canWrite && lab.status === "final" && (
              <>
                <button
                  type="button"
                  className="staff-page-btn-secondary"
                  onClick={act(() => onStatus("corrected"))}
                  disabled={busy}
                >
                  {t("medical.labResults.markCorrected", {
                    defaultValue: "Исправлено",
                  })}
                </button>
                <button
                  type="button"
                  className="staff-page-btn-secondary"
                  onClick={act(() => onStatus("amended"))}
                  disabled={busy}
                >
                  {t("medical.labResults.markAmended", {
                    defaultValue: "Дополнено",
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

function LabStatusPill({ status, t }) {
  const labels = {
    preliminary: t("medical.labResults.status.preliminary", {
      defaultValue: "Предварительно",
    }),
    final: t("medical.labResults.status.final", { defaultValue: "Финальный" }),
    corrected: t("medical.labResults.status.corrected", {
      defaultValue: "Исправлен",
    }),
    amended: t("medical.labResults.status.amended", {
      defaultValue: "Дополнен",
    }),
  };
  return (
    <span className={`med-status med-status-${status || "final"}`}>
      {labels[status] || status}
    </span>
  );
}
