// src/pages/simulation/components/modals/NewPlanModal.jsx
import React, { useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  uploadPhoto,
  createPlan,
  selectLoading,
  selectUploadProgress,
  selectError,
  clearError,
  resetUpload,
} from "../../store/simulationSlice.js";

/* ──────────────────────────────────────────────────────────────────────────
   Двухшаговый flow:
   step=1 — drag&drop фото, upload в R2 → photo объект в local state
   step=2 — label + patientRef → createPlan → onCreated(plan) закрывает модалку

   Если модалку закрыть после step1 — orphan в R2 остаётся на 24 часа
   (temp/ префикс, будущий cleanup job S.5+). Не страшно, но учитываем.
   ────────────────────────────────────────────────────────────────────────── */
export default function NewPlanModal({ open, onClose, onCreated }) {
  const { t } = useTranslation("Simulation");
  const dispatch = useDispatch();
  const loading = useSelector(selectLoading);
  const uploadProgress = useSelector(selectUploadProgress);
  const error = useSelector(selectError);

  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState(null); // embedded-photo объект от backend
  const [label, setLabel] = useState("");
  const [patientRef, setPatientRef] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const reset = useCallback(() => {
    setStep(1);
    setPhoto(null);
    setLabel("");
    setPatientRef("");
    setDragOver(false);
    dispatch(clearError());
    dispatch(resetUpload());
  }, [dispatch]);

  const handleClose = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      const result = await dispatch(uploadPhoto(file));
      if (uploadPhoto.fulfilled.match(result)) {
        setPhoto(result.payload);
        setStep(2);
      }
    },
    [dispatch],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleCreate = useCallback(async () => {
    if (!photo || !label.trim()) return;
    const result = await dispatch(
      createPlan({
        label: label.trim(),
        patientRef: patientRef.trim() || null,
        photo,
      }),
    );
    if (createPlan.fulfilled.match(result)) {
      onCreated?.(result.payload);
      handleClose();
    }
  }, [photo, label, patientRef, dispatch, onCreated, handleClose]);

  if (!open) return null;

  const errorMessage = error
    ? t(`errors.${error.code}`, {
        defaultValue: error.message || t("errors.unknown"),
      })
    : null;

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>{t("newPlanModal.title")}</h2>
        <div style={subtitleStyle}>
          {step === 1
            ? t("newPlanModal.stepUpload")
            : t("newPlanModal.stepDetails")}
        </div>

        {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

        {step === 1 && (
          <>
            <div
              style={{
                ...dropZoneStyle,
                ...(dragOver ? dropZoneActiveStyle : {}),
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                {loading.upload
                  ? t("newPlanModal.uploading", {
                      progress: uploadProgress,
                    })
                  : t("newPlanModal.dropZoneHint")}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>
                {t("newPlanModal.dropZoneFormats")}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </>
        )}

        {step === 2 && (
          <>
            <label style={labelStyle}>
              {t("newPlanModal.labelField")}
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t("newPlanModal.labelPlaceholder")}
                maxLength={200}
                autoFocus
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              {t("newPlanModal.patientRefField")}
              <input
                type="text"
                value={patientRef}
                onChange={(e) => setPatientRef(e.target.value)}
                placeholder={t("newPlanModal.patientRefPlaceholder")}
                maxLength={200}
                style={inputStyle}
              />
            </label>

            {photo && (
              <div style={{ marginTop: 12, fontSize: 12, color: "#4a7" }}>
                ✓ {t("newPlanModal.uploadSuccess")} — {photo.width}×
                {photo.height}
              </div>
            )}
          </>
        )}

        <div style={buttonsRowStyle}>
          {step === 2 && (
            <button
              onClick={() => {
                setStep(1);
                setPhoto(null);
              }}
              style={secondaryButtonStyle}
            >
              {t("newPlanModal.back")}
            </button>
          )}
          <button onClick={handleClose} style={secondaryButtonStyle}>
            {t("newPlanModal.cancel")}
          </button>
          {step === 2 && (
            <button
              onClick={handleCreate}
              disabled={!label.trim() || loading.create}
              style={{
                ...primaryButtonStyle,
                ...(!label.trim() || loading.create ? disabledStyle : {}),
              }}
            >
              {loading.create
                ? t("newPlanModal.creating")
                : t("newPlanModal.create")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────── inline styles (S.1, перевести в CSS Modules в S.5) ─────── */

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  width: "100%",
  maxWidth: 480,
  marginInline: 16,
  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
};

const titleStyle = { fontSize: 20, fontWeight: 600, marginBottom: 4 };
const subtitleStyle = { fontSize: 13, color: "#888", marginBottom: 20 };

const errorStyle = {
  padding: "8px 12px",
  background: "#fee",
  border: "1px solid #fbb",
  borderRadius: 6,
  fontSize: 13,
  color: "#c33",
  marginBottom: 16,
};

const dropZoneStyle = {
  border: "2px dashed #cbd5e1",
  borderRadius: 10,
  padding: 36,
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.15s",
  background: "#f8fafc",
};

const dropZoneActiveStyle = {
  borderColor: "#3d7fff",
  background: "#eef4ff",
};

const labelStyle = {
  display: "block",
  marginBottom: 14,
  fontSize: 13,
  fontWeight: 500,
};

const inputStyle = {
  width: "100%",
  marginTop: 4,
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  fontFamily: "inherit",
};

const buttonsRowStyle = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
  marginTop: 20,
};

const primaryButtonStyle = {
  padding: "8px 16px",
  background: "#3d7fff",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

const secondaryButtonStyle = {
  padding: "8px 16px",
  background: "transparent",
  color: "#475569",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
};

const disabledStyle = { opacity: 0.5, cursor: "not-allowed" };
