// client/src/pages/clinic/ClinicPatientDetailPage/SubRecordTab.jsx
//
// Universal tab component for the 5 medical sub-record models.
// Sprint 2 Phase 2D.2 — Step 3.
//
// Single component handles all 5 sub-models (allergies / chronic-diseases /
// operations / family-history / immunizations) — what differs between them
// (API functions, form fields, labels) comes through `config` from
// subRecordConfigs.js. This mirrors the backend's buildSubRecordService
// factory: one template, parameterised per resource.
//
// UX:
//   - List of records (most recent first)
//   - "+ Add new" toggles an inline form at the top
//   - Each row in the list has Edit / Delete buttons (gated)
//   - Edit transforms the row in place into a form (no modal — these
//     records are short text fields, modal is overkill)
//   - Delete asks confirm and removes; only owner role sees the button
//   - Cross-clinic records (isCrossClinic) get an amber tint + badge,
//     no Edit/Delete buttons (read-only)

import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FT } from "./subRecordConfigs";

// ─── Helpers ─────────────────────────────────────────────────────────

function buildEmptyForm(config) {
  const out = {};
  for (const f of config.fields) out[f.name] = "";
  return out;
}

function seedFormFromRecord(config, record) {
  const out = {};
  for (const f of config.fields) {
    const raw = record?.[f.name];
    if (f.type === FT.DATE && raw) {
      try {
        out[f.name] = new Date(raw).toISOString().split("T")[0];
      } catch {
        out[f.name] = "";
      }
    } else {
      out[f.name] = raw == null ? "" : String(raw);
    }
  }
  return out;
}

function trimForPayload(form, config) {
  const payload = {};
  for (const f of config.fields) {
    const value = form[f.name];
    if (f.type === FT.DATE) {
      payload[f.name] = value || null;
    } else {
      payload[f.name] = (value || "").trim();
    }
  }
  return payload;
}

function validateForm(form, config, t) {
  const errs = {};
  for (const f of config.fields) {
    if (!f.required) continue;
    const value = form[f.name];
    const isEmpty = !value || (typeof value === "string" && !value.trim());
    if (isEmpty) {
      errs[f.name] = t("medical.subRecord.errors.required", {
        defaultValue: "Заполните это поле",
      });
    }
  }
  return errs;
}

// ─── Top-level component ─────────────────────────────────────────────

export default function SubRecordTab({ patient, config, canWrite, canDelete }) {
  const { t, i18n } = useTranslation("clinic");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [addingOpen, setAddingOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await config.api.list(patient._id, { limit: 50 });
      setItems(res.items || []);
    } catch (err) {
      console.error("Failed to load sub-records:", err);
      setError(
        err.response?.data?.error ||
          t("medical.subRecord.errors.loadFailed", {
            defaultValue: "Не удалось загрузить записи",
          }),
      );
    } finally {
      setLoading(false);
    }
  }, [patient._id, config.api, t]);

  useEffect(() => {
    load();
  }, [load]);

  function handleCreated(record) {
    setAddingOpen(false);
    setItems((prev) => [record, ...prev]);
    setTimeout(load, 0);
  }

  function handleUpdated(updated) {
    setEditingId(null);
    setItems((prev) =>
      prev.map((r) => (String(r._id) === String(updated._id) ? updated : r)),
    );
    setTimeout(load, 0);
  }

  function handleDeleted(recordId) {
    setItems((prev) => prev.filter((r) => String(r._id) !== String(recordId)));
  }

  function fmtDate(d) {
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

  // ─── Render ─────

  return (
    <div className="med-pane">
      <div className="med-pane-head">
        <div className="med-pane-title">
          {t(config.titleKey, { defaultValue: config.titleDefault })}
          <span className="staff-page-count">{items.length}</span>
        </div>
        {canWrite && !addingOpen && (
          <button
            type="button"
            className="staff-page-btn-primary med-btn-add"
            onClick={() => {
              setAddingOpen(true);
              setEditingId(null);
            }}
          >
            {t(config.addLabelKey, { defaultValue: config.addLabelDefault })}
          </button>
        )}
      </div>

      {/* Inline add form */}
      {addingOpen && (
        <SubRecordForm
          patient={patient}
          config={config}
          mode="create"
          onCancel={() => setAddingOpen(false)}
          onSaved={handleCreated}
          t={t}
        />
      )}

      {/* List */}
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
      ) : items.length === 0 && !addingOpen ? (
        <div className="med-empty">
          <p>{t(config.emptyKey, { defaultValue: config.emptyDefault })}</p>
        </div>
      ) : (
        <div className="med-subrec-list">
          {items.map((record) =>
            String(record._id) === String(editingId) ? (
              <SubRecordForm
                key={record._id}
                patient={patient}
                config={config}
                mode="edit"
                record={record}
                onCancel={() => setEditingId(null)}
                onSaved={handleUpdated}
                t={t}
              />
            ) : (
              <SubRecordRow
                key={record._id}
                record={record}
                config={config}
                canWrite={canWrite}
                canDelete={canDelete}
                onEdit={() => {
                  setEditingId(record._id);
                  setAddingOpen(false);
                }}
                onDeleted={handleDeleted}
                fmtDate={fmtDate}
                t={t}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ─── Row (read-only display) ─────────────────────────────────────────

function SubRecordRow({
  record,
  config,
  canWrite,
  canDelete,
  onEdit,
  onDeleted,
  fmtDate,
  t,
}) {
  const isCross = Boolean(record.isCrossClinic);
  // Owner-clinic can edit / delete. Foreign clinic via consent → read-only.
  const isOwner = !isCross;
  const showEdit = isOwner && canWrite;
  const showDelete = isOwner && canDelete;

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function handleDelete() {
    if (
      !window.confirm(
        t("medical.subRecord.confirmDelete", {
          defaultValue: "Удалить эту запись?",
        }),
      )
    )
      return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await config.api.remove(record._id);
      onDeleted(record._id);
    } catch (err) {
      console.error("Delete sub-record failed:", err);
      setDeleteError(
        err.response?.data?.error ||
          t("medical.subRecord.errors.deleteFailed", {
            defaultValue: "Не удалось удалить",
          }),
      );
      setDeleting(false);
    }
  }

  return (
    <div className={`med-subrec-row ${isCross ? "is-cross-clinic" : ""}`}>
      <div className="med-subrec-body">
        {/* Primary summary line: depends on summaryField */}
        <SubRecordSummary record={record} config={config} />

        {/* Secondary fields (everything else with a value) */}
        <SubRecordDetails record={record} config={config} t={t} />

        {/* Meta footer */}
        <div className="med-subrec-meta">
          {record.createdAt && <span>{fmtDate(record.createdAt)}</span>}
          {isCross && (
            <span className="med-cross-clinic-badge">
              {t("medical.crossClinicBadge", {
                defaultValue: "Другая клиника",
              })}
            </span>
          )}
        </div>

        {deleteError && (
          <div className="patients-form-error patients-form-error-banner">
            {deleteError}
          </div>
        )}
      </div>

      {/* Actions */}
      {(showEdit || showDelete) && (
        <div className="med-subrec-actions">
          {showEdit && (
            <button
              type="button"
              className="staff-page-btn-secondary"
              onClick={onEdit}
              disabled={deleting}
            >
              {t("common.edit", { defaultValue: "Изменить" })}
            </button>
          )}
          {showDelete && (
            <button
              type="button"
              className="staff-page-btn-secondary med-btn-danger-soft"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting
                ? t("common.loading", { defaultValue: "..." })
                : t("common.delete", { defaultValue: "Удалить" })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Main heading line — uses config.summaryField. */
function SubRecordSummary({ record, config }) {
  const text = record[config.summaryField];
  if (!text) {
    return <div className="med-subrec-summary med-detail-empty">—</div>;
  }
  // family-history: "Father — IHD"
  if (config.summaryField === "diseaseName" && record.relative) {
    return (
      <div className="med-subrec-summary">
        <span className="med-subrec-relative">{record.relative}</span>
        <span className="med-subrec-summary-sep">—</span>
        <span>{text}</span>
      </div>
    );
  }
  return <div className="med-subrec-summary">{text}</div>;
}

/**
 * Show fields BEYOND the summary field that have a non-empty value.
 * For allergy/chronic/operation this is empty (single-field model).
 * For family/immunization this may show "content" or "dateGiven".
 */
function SubRecordDetails({ record, config, t }) {
  const extras = config.fields.filter((f) => {
    if (f.name === config.summaryField) return false;
    if (config.summaryField === "diseaseName" && f.name === "relative") {
      // relative is rendered inline in the summary already
      return false;
    }
    const value = record[f.name];
    return value !== null && value !== undefined && String(value).trim() !== "";
  });

  if (extras.length === 0) return null;

  return (
    <div className="med-subrec-details">
      {extras.map((f) => {
        let value = record[f.name];
        if (f.type === FT.DATE && value) {
          try {
            value = new Date(value).toLocaleDateString();
          } catch {
            /* keep as-is */
          }
        }
        return (
          <div key={f.name} className="med-subrec-detail">
            <span className="med-subrec-detail-label">
              {t(f.labelKey, { defaultValue: f.labelDefault })}:
            </span>{" "}
            <span className="med-subrec-detail-value">{value}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Inline form (create + edit share this) ──────────────────────────

function SubRecordForm({
  patient,
  config,
  mode,
  record,
  onCancel,
  onSaved,
  t,
}) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(
    isEdit ? seedFormFromRecord(config, record) : buildEmptyForm(config),
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateForm(form, config, t);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const payload = trimForPayload(form, config);
      let res;
      if (isEdit) {
        res = await config.api.update(record._id, payload);
      } else {
        res = await config.api.create(patient._id, payload);
      }
      // Backend returns the record wrapped under various keys depending on
      // resource — service unifies on { success, <resource>: doc } but list
      // endpoints flatten. We accept either: prefer the first object value
      // that has an _id.
      const saved = extractRecord(res);
      onSaved(saved);
    } catch (err) {
      console.error("Save sub-record failed:", err);
      setErrors({
        _form:
          err.response?.data?.error ||
          t("common.saveFailed", { defaultValue: "Не удалось сохранить" }),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="med-subrec-form" onSubmit={handleSubmit}>
      <div className="med-subrec-form-title">
        {isEdit
          ? t("medical.subRecord.editTitle", { defaultValue: "Редактирование" })
          : t(config.addLabelKey, { defaultValue: config.addLabelDefault })}
      </div>

      {config.fields.map((field) => (
        <div key={field.name} className="patients-form-field">
          <label>
            {t(field.labelKey, { defaultValue: field.labelDefault })}
            {!field.required && (
              <span className="patients-form-optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            )}
          </label>
          {field.type === FT.TEXTAREA ? (
            <textarea
              rows={field.rows || 3}
              value={form[field.name]}
              onChange={(e) => setField(field.name, e.target.value)}
              placeholder={
                field.placeholderKey
                  ? t(field.placeholderKey, {
                      defaultValue: field.placeholderDefault || "",
                    })
                  : ""
              }
              className={errors[field.name] ? "has-error" : ""}
              disabled={submitting}
            />
          ) : field.type === FT.DATE ? (
            <input
              type="date"
              value={form[field.name]}
              onChange={(e) => setField(field.name, e.target.value)}
              className={errors[field.name] ? "has-error" : ""}
              disabled={submitting}
            />
          ) : (
            <input
              type="text"
              value={form[field.name]}
              onChange={(e) => setField(field.name, e.target.value)}
              placeholder={
                field.placeholderKey
                  ? t(field.placeholderKey, {
                      defaultValue: field.placeholderDefault || "",
                    })
                  : ""
              }
              className={errors[field.name] ? "has-error" : ""}
              disabled={submitting}
            />
          )}
          {errors[field.name] && (
            <span className="patients-form-error">{errors[field.name]}</span>
          )}
        </div>
      ))}

      {errors._form && (
        <div className="patients-form-error patients-form-error-banner">
          {errors._form}
        </div>
      )}

      <div className="patients-form-actions">
        <button
          type="button"
          className="staff-page-btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          {t("common.cancel", { defaultValue: "Отмена" })}
        </button>
        <button
          type="submit"
          className="staff-page-btn-primary"
          disabled={submitting}
        >
          {submitting
            ? t("common.submitting", { defaultValue: "Сохранение..." })
            : t("common.save", { defaultValue: "Сохранить" })}
        </button>
      </div>
    </form>
  );
}

/**
 * Backend create/update wraps the record under a resource-specific key
 * ({ success: true, allergy: {...} } / { chronicDisease: {...} } etc.).
 * Find the first value that looks like a saved document (has _id).
 */
function extractRecord(res) {
  if (!res) return null;
  if (res._id) return res;
  for (const key of Object.keys(res)) {
    const val = res[key];
    if (val && typeof val === "object" && val._id) return val;
  }
  return res;
}
