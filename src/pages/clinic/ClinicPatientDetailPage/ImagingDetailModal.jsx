// client/src/pages/clinic/ClinicPatientDetailPage/ImagingDetailModal.jsx
//
// Detail view for one imaging study. Sprint 2 Phase 2D.2 — Step 4.
//
// Sections:
//   - Header: studyType badge + status (validatedByDoctor) + cross-clinic
//   - Image gallery (thumbnails, click → lightbox)
//   - Lightbox: fullscreen image overlay with arrow keys for navigation
//   - Metadata: date, contrastUsed
//   - Report / diagnosis (read-only here; edit via separate modal)
//   - Footer: Close · Edit · Delete (gated by ownership + role)
//
// Lightbox is a tiny in-file component (~30 lines) — no library dep.
//
// Notes on cross-clinic records:
//   - Backend strips diagnostic free text for non-doctor/owner/admin viewers
//     of cross-clinic records — frontend just shows what came back.
//   - Edit / Delete buttons are hidden for cross-clinic (we are not the
//     owner clinic, backend would 403 anyway — UI mirror prevents 403s).

import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { deleteImagingStudy } from "../../../api/clinic";
import { studyTypeLabel } from "./ImagingTab";

export default function ImagingDetailModal({
  record,
  canWrite,
  canDelete,
  onClose,
  onEdit,
  onDeleted,
}) {
  const { t, i18n } = useTranslation("clinic");

  const [busy, setBusy] = useState(null); // "delete" | null
  const [actionError, setActionError] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(null); // null = closed

  const isCross = Boolean(record.isCrossClinic);
  const isOwnerClinic = !isCross;
  const showEdit = isOwnerClinic && canWrite;
  const showDelete = isOwnerClinic && canDelete;

  const images = Array.isArray(record.images) ? record.images : [];

  function fmtDate(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  }

  async function handleDelete() {
    if (!showDelete) return;
    if (
      !window.confirm(
        t("medical.imaging.confirmDelete", {
          defaultValue:
            "Удалить это исследование? Само исследование будет удалено, файлы снимков останутся в облачном хранилище (могут быть зачищены отдельно).",
        }),
      )
    )
      return;
    setActionError(null);
    setBusy("delete");
    try {
      await deleteImagingStudy(record._id);
      onDeleted && onDeleted(record._id);
    } catch (err) {
      console.error("Delete imaging failed:", err);
      setActionError(
        err.response?.data?.error ||
          t("medical.imaging.errors.deleteFailed", {
            defaultValue: "Не удалось удалить исследование",
          }),
      );
      setBusy(null);
    }
  }

  return (
    <>
      <div
        className="med-modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget && !busy) onClose();
        }}
      >
        <div
          className="med-modal med-modal-imaging-detail"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="med-modal-head">
            <div className="med-detail-head-titles">
              <h3>
                {studyTypeLabel(record.studyType, t)}{" "}
                <span className="med-imaging-detail-date">
                  · {fmtDate(record.date || record.createdAt)}
                </span>
              </h3>
              <div className="med-detail-meta">
                {record.validatedByDoctor && (
                  <span className="med-imaging-validated">
                    ✓{" "}
                    {t("medical.imaging.validatedFull", {
                      defaultValue: "Подтверждено врачом",
                    })}
                  </span>
                )}
                {record.contrastUsed && (
                  <span className="med-imaging-contrast">
                    {t("medical.imaging.withContrast", {
                      defaultValue: "С контрастом",
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
            {/* Gallery */}
            {images.length > 0 ? (
              <div className="med-imaging-gallery">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    className="med-imaging-gallery-item"
                    onClick={() => setLightboxIdx(i)}
                    aria-label={t("medical.imaging.viewImage", {
                      n: i + 1,
                      defaultValue: `Открыть снимок ${i + 1}`,
                    })}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="med-empty">
                <p>
                  {t("medical.imaging.noImages", {
                    defaultValue: "К этому исследованию не прикреплены снимки.",
                  })}
                </p>
              </div>
            )}

            {/* Report / diagnosis */}
            <div className="med-detail-clinical">
              {record.diagnosis && (
                <div className="med-detail-row">
                  <div className="med-detail-row-label">
                    {t("medical.imaging.fields.diagnosis", {
                      defaultValue: "Диагноз",
                    })}
                  </div>
                  <div className="med-detail-row-value">{record.diagnosis}</div>
                </div>
              )}
              {record.report && (
                <div className="med-detail-row">
                  <div className="med-detail-row-label">
                    {t("medical.imaging.fields.report", {
                      defaultValue: "Описание / заключение",
                    })}
                  </div>
                  <div className="med-detail-row-value">{record.report}</div>
                </div>
              )}
              {record.doctorNotes && (
                <div className="med-detail-row">
                  <div className="med-detail-row-label">
                    {t("medical.imaging.fields.doctorNotes", {
                      defaultValue: "Заметки врача",
                    })}
                  </div>
                  <div className="med-detail-row-value">
                    {record.doctorNotes}
                  </div>
                </div>
              )}
              {!record.diagnosis && !record.report && !record.doctorNotes && (
                <div className="med-detail-empty med-detail-no-content">
                  {t("medical.imaging.noReport", {
                    defaultValue: "Описание ещё не заполнено.",
                  })}
                </div>
              )}
            </div>

            {/* Meta footer */}
            <div className="med-detail-footer">
              <div>
                {t("medical.imaging.createdAt", {
                  defaultValue: "Загружено",
                })}
                : <strong>{fmtDate(record.createdAt)}</strong>
              </div>
              {record.updatedAt && record.updatedAt !== record.createdAt && (
                <div>
                  {t("medical.imaging.updatedAt", {
                    defaultValue: "Изменено",
                  })}
                  : <strong>{fmtDate(record.updatedAt)}</strong>
                </div>
              )}
            </div>

            {actionError && (
              <div className="patients-form-error patients-form-error-banner">
                {actionError}
              </div>
            )}
          </div>

          {/* Footer */}
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
                  : t("medical.imaging.deleteButton", {
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
                {t("medical.imaging.editButton", {
                  defaultValue: "Редактировать",
                })}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox — only rendered when an index is selected */}
      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          index={lightboxIdx}
          onChange={setLightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

// ─── Lightbox (tiny in-file component) ──────────────────────────────

function Lightbox({ images, index, onChange, onClose }) {
  const total = images.length;
  const goPrev = useCallback(() => {
    onChange((index - 1 + total) % total);
  }, [index, total, onChange]);
  const goNext = useCallback(() => {
    onChange((index + 1) % total);
  }, [index, total, onChange]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, onClose]);

  return (
    <div
      className="med-lightbox-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        className="med-lightbox-close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            className="med-lightbox-nav med-lightbox-prev"
            onClick={goPrev}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            className="med-lightbox-nav med-lightbox-next"
            onClick={goNext}
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}

      <img
        src={images[index]}
        alt=""
        className="med-lightbox-image"
        onClick={(e) => e.stopPropagation()}
      />

      {total > 1 && (
        <div className="med-lightbox-counter">
          {index + 1} / {total}
        </div>
      )}
    </div>
  );
}
