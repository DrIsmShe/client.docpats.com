// client/src/pages/clinic/ClinicPatientDetailPage/ImagingTab.jsx
//
// Imaging studies tab — last sub-tab of the UMR section.
// Sprint 2 Phase 2D.2 — Step 4.
//
// UX: grid of cards, each card shows
//   - studyType (CT, MRI, ...) badge
//   - study date
//   - thumbnail of the first image (if any)
//   - report / diagnosis preview (first 80 chars)
//   - cross-clinic badge if applicable
// Click a card → open ImagingDetailModal (full view + lightbox).
// "+ Новое исследование" button → open ImagingFormModal (upload flow).
//
// Why grid not table:
//   Imaging is visual — receptionists/doctors recognise studies by the
//   thumbnail at a glance. Table rows hide that signal.

import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { listImagingStudies } from "../../../api/clinic";
import ImagingFormModal from "./ImagingFormModal";
import ImagingDetailModal from "./ImagingDetailModal";
import ImagingEditModal from "./ImagingEditModal";

// studyType labels (i18n-aware). Keep in sync with backend enum:
// CT MRI USG X-Ray PET SPECT EEG ECG Holter Spirometry Doppler
// Gastroscopy Colonoscopy CapsuleEndoscopy
const STUDY_TYPE_LABELS = {
  CT: { key: "medical.imaging.types.CT", default: "КТ" },
  MRI: { key: "medical.imaging.types.MRI", default: "МРТ" },
  USG: { key: "medical.imaging.types.USG", default: "УЗИ" },
  "X-Ray": { key: "medical.imaging.types.XRay", default: "Рентген" },
  PET: { key: "medical.imaging.types.PET", default: "ПЭТ" },
  SPECT: { key: "medical.imaging.types.SPECT", default: "ОФЭКТ" },
  EEG: { key: "medical.imaging.types.EEG", default: "ЭЭГ" },
  ECG: { key: "medical.imaging.types.ECG", default: "ЭКГ" },
  Holter: { key: "medical.imaging.types.Holter", default: "Холтер" },
  Spirometry: {
    key: "medical.imaging.types.Spirometry",
    default: "Спирометрия",
  },
  Doppler: { key: "medical.imaging.types.Doppler", default: "Доплер" },
  Gastroscopy: {
    key: "medical.imaging.types.Gastroscopy",
    default: "Гастроскопия",
  },
  Colonoscopy: {
    key: "medical.imaging.types.Colonoscopy",
    default: "Колоноскопия",
  },
  CapsuleEndoscopy: {
    key: "medical.imaging.types.CapsuleEndoscopy",
    default: "Капсульная эндоскопия",
  },
};

export function studyTypeLabel(type, t) {
  const def = STUDY_TYPE_LABELS[type];
  if (!def) return type || "—";
  return t(def.key, { defaultValue: def.default });
}

export default function ImagingTab({ patient, canWrite, canDelete }) {
  const { t, i18n } = useTranslation("clinic");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state:
  //   { type: "create" }
  //   { type: "detail", record }
  //   { type: "edit", record }
  //   null
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await listImagingStudies(patient._id, { limit: 50 });
      setItems(res.items || []);
    } catch (err) {
      console.error("Failed to load imaging studies:", err);
      setError(
        err.response?.data?.error ||
          t("medical.imaging.errors.loadFailed", {
            defaultValue: "Не удалось загрузить исследования",
          }),
      );
    } finally {
      setLoading(false);
    }
  }, [patient._id, t]);

  useEffect(() => {
    load();
  }, [load]);

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

  function handleCreated(record) {
    setModal(null);
    setItems((prev) => [record, ...prev]);
    setTimeout(load, 0);
  }

  function handleUpdated(record) {
    setItems((prev) =>
      prev.map((r) => (String(r._id) === String(record._id) ? record : r)),
    );
    // Stay on detail view of the refreshed record
    setModal({ type: "detail", record });
    setTimeout(load, 0);
  }

  function handleDeleted(recordId) {
    setModal(null);
    setItems((prev) => prev.filter((r) => String(r._id) !== String(recordId)));
  }

  return (
    <div className="med-pane">
      <div className="med-pane-head">
        <div className="med-pane-title">
          {t("medical.imaging.listTitle", { defaultValue: "Исследования" })}
          <span className="staff-page-count">{items.length}</span>
        </div>
        {canWrite && (
          <button
            type="button"
            className="staff-page-btn-primary med-btn-add"
            onClick={() => setModal({ type: "create" })}
          >
            {t("medical.imaging.addButton", {
              defaultValue: "+ Новое исследование",
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
            {t("medical.imaging.emptyText", {
              defaultValue: "Пока нет загруженных исследований.",
            })}
          </p>
          {canWrite && (
            <button
              type="button"
              className="staff-page-btn-primary"
              onClick={() => setModal({ type: "create" })}
            >
              {t("medical.imaging.addFirstButton", {
                defaultValue: "Загрузить первое исследование",
              })}
            </button>
          )}
        </div>
      ) : (
        <div className="med-imaging-grid">
          {items.map((rec) => (
            <ImagingCard
              key={rec._id}
              record={rec}
              fmtDate={fmtDate}
              t={t}
              onClick={() => setModal({ type: "detail", record: rec })}
            />
          ))}
        </div>
      )}

      {/* Modals */}

      {modal?.type === "create" && (
        <ImagingFormModal
          patient={patient}
          onClose={() => setModal(null)}
          onSaved={handleCreated}
        />
      )}

      {modal?.type === "detail" && modal.record && (
        <ImagingDetailModal
          record={modal.record}
          canWrite={canWrite}
          canDelete={canDelete}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: "edit", record: modal.record })}
          onDeleted={handleDeleted}
        />
      )}

      {modal?.type === "edit" && modal.record && (
        <ImagingEditModal
          record={modal.record}
          onClose={() => setModal({ type: "detail", record: modal.record })}
          onSaved={handleUpdated}
        />
      )}
    </div>
  );
}

// ─── Card in the grid ───────────────────────────────────────────────

function ImagingCard({ record, fmtDate, t, onClick }) {
  const isCross = Boolean(record.isCrossClinic);
  const images = Array.isArray(record.images) ? record.images : [];
  const firstThumb = images[0] || null;
  const extraCount = images.length > 1 ? images.length - 1 : 0;

  // Short preview line for report/diagnosis (first non-empty wins)
  const previewSource =
    (record.diagnosis && String(record.diagnosis).trim()) ||
    (record.report && String(record.report).trim()) ||
    "";
  const preview =
    previewSource.length > 90
      ? previewSource.slice(0, 87).trimEnd() + "…"
      : previewSource;

  return (
    <div
      className={`med-imaging-card ${isCross ? "is-cross-clinic" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="med-imaging-thumb">
        {firstThumb ? (
          <>
            <img
              src={firstThumb}
              alt=""
              loading="lazy"
              onError={(e) => {
                // If R2 image failed to load, replace with the fallback box
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (
                  parent &&
                  !parent.querySelector(".med-imaging-thumb-fallback")
                ) {
                  const fb = document.createElement("div");
                  fb.className = "med-imaging-thumb-fallback";
                  fb.textContent = "🖼";
                  parent.appendChild(fb);
                }
              }}
            />
            {extraCount > 0 && (
              <span className="med-imaging-count">+{extraCount}</span>
            )}
          </>
        ) : (
          <div className="med-imaging-thumb-fallback">📋</div>
        )}
      </div>

      <div className="med-imaging-card-body">
        <div className="med-imaging-card-head">
          <span className="med-imaging-type">
            {studyTypeLabel(record.studyType, t)}
          </span>
          <span className="med-imaging-date">
            {fmtDate(record.date || record.createdAt)}
          </span>
        </div>

        {preview && <div className="med-imaging-preview">{preview}</div>}

        <div className="med-imaging-card-meta">
          {record.validatedByDoctor && (
            <span className="med-imaging-validated">
              ✓{" "}
              {t("medical.imaging.validatedShort", {
                defaultValue: "Подтверждено",
              })}
            </span>
          )}
          {isCross && (
            <span className="med-cross-clinic-badge">
              {t("medical.crossClinicBadge", {
                defaultValue: "Другая клиника",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
