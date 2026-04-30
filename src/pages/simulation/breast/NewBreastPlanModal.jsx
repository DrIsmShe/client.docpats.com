// src/pages/simulation/breast/NewBreastPlanModal.jsx
//
// S.8 Phase 3C — Модалка создания breast simulation plan.
//
// 3-шаговый flow:
//   step=1 — загрузка фото (drag&drop / file input) → upload в R2
//   step=2 — выбор ракурса (front/side/oblique/bottom_up)
//   step=3 — label + patientRef → createBreastPlan → onCreated(plan)
//
// Использует прямые axios вызовы через breastSimulationApi.js,
// БЕЗ Redux. Это сознательное решение — изолирует breast логику от
// face simulationSlice (избегаем риска сломать face).
//
// Если модалку закрыть после step1 — orphan фото в R2 остаётся под
// temp/ префиксом, чистится cleanup job'ом.

import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { uploadPhoto } from "../api/photoUploadApi.js";
import { createBreastPlan } from "../api/breastSimulationApi.js";

/* ──────────────────────────────────────────────────────────────────────────
   Доступные ракурсы. Должны соответствовать BREAST_PHOTO_VIEWS на backend.
   ────────────────────────────────────────────────────────────────────────── */
const PHOTO_VIEWS = [
  {
    key: "front",
    icon: "👤",
    labelKey: "breast.viewLabel.front",
    labelDefault: "Анфас",
    descKey: "breast.viewDesc.front",
    descDefault:
      "Прямой фронтальный вид. Используется для большинства измерений.",
  },
  {
    key: "side_left",
    icon: "◐",
    labelKey: "breast.viewLabel.side_left",
    labelDefault: "Слева (профиль)",
    descKey: "breast.viewDesc.side_left",
    descDefault: "Левый профиль (90°). Для оценки проекции и птоза.",
  },
  {
    key: "side_right",
    icon: "◑",
    labelKey: "breast.viewLabel.side_right",
    labelDefault: "Справа (профиль)",
    descKey: "breast.viewDesc.side_right",
    descDefault: "Правый профиль (90°).",
  },
  {
    key: "oblique_left",
    icon: "◖",
    labelKey: "breast.viewLabel.oblique_left",
    labelDefault: "3/4 слева",
    descKey: "breast.viewDesc.oblique_left",
    descDefault: "Полу-боковой левый вид (45°).",
  },
  {
    key: "oblique_right",
    icon: "◗",
    labelKey: "breast.viewLabel.oblique_right",
    labelDefault: "3/4 справа",
    descKey: "breast.viewDesc.oblique_right",
    descDefault: "Полу-боковой правый вид (45°).",
  },
  {
    key: "bottom_up",
    icon: "↑",
    labelKey: "breast.viewLabel.bottom_up",
    labelDefault: "Снизу вверх",
    descKey: "breast.viewDesc.bottom_up",
    descDefault: "Вид снизу. Для оценки субмаммарной складки.",
  },
];

export default function NewBreastPlanModal({ open, onClose, onCreated }) {
  const { t } = useTranslation("Simulation");

  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState(null); // embedded-photo от backend
  const [photoView, setPhotoView] = useState("front");
  const [label, setLabel] = useState("");
  const [patientRef, setPatientRef] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  /* ─── Reset / close ─── */

  const reset = useCallback(() => {
    setStep(1);
    setPhoto(null);
    setPhotoView("front");
    setLabel("");
    setPatientRef("");
    setDragOver(false);
    setUploadProgress(0);
    setUploading(false);
    setCreating(false);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  /* ─── Step 1: file upload ─── */

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    try {
      const uploadedPhoto = await uploadPhoto(file, {
        onProgress: setUploadProgress,
      });
      setPhoto(uploadedPhoto);
      setStep(2);
    } catch (err) {
      setError(err);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  /* ─── Step 3: create plan ─── */

  const handleCreate = useCallback(async () => {
    if (!photo || !label.trim() || !photoView) return;
    setError(null);
    setCreating(true);
    try {
      const plan = await createBreastPlan({
        label: label.trim(),
        patientRef: patientRef.trim() || null,
        photo,
        photoView,
      });
      onCreated?.(plan);
      handleClose();
    } catch (err) {
      setError(err);
    } finally {
      setCreating(false);
    }
  }, [photo, label, patientRef, photoView, onCreated, handleClose]);

  if (!open) return null;

  const errorMessage = error
    ? t(`errors.${error.code}`, {
        defaultValue: error.message || "Произошла ошибка",
      })
    : null;

  /* ─── Render ─── */

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>
          {t("breast.newModal.title", {
            defaultValue: "Новый план — моделирование груди",
          })}
        </h2>

        {/* Step indicator */}
        <div style={stepIndicatorStyle}>
          <StepDot active={step >= 1} done={step > 1} num={1} />
          <StepLine done={step > 1} />
          <StepDot active={step >= 2} done={step > 2} num={2} />
          <StepLine done={step > 2} />
          <StepDot active={step >= 3} done={false} num={3} />
        </div>

        <div style={subtitleStyle}>
          {step === 1 &&
            t("breast.newModal.step1Subtitle", {
              defaultValue: "Шаг 1 из 3 — загрузка фотографии",
            })}
          {step === 2 &&
            t("breast.newModal.step2Subtitle", {
              defaultValue: "Шаг 2 из 3 — выбор ракурса фотографии",
            })}
          {step === 3 &&
            t("breast.newModal.step3Subtitle", {
              defaultValue: "Шаг 3 из 3 — детали плана",
            })}
        </div>

        {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

        {/* ─── STEP 1: Upload ─── */}
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
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.6 }}>
                📷
              </div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                {uploading
                  ? t("breast.newModal.uploading", {
                      defaultValue: "Загрузка... {{progress}}%",
                      progress: uploadProgress,
                    })
                  : t("breast.newModal.dropZoneHint", {
                      defaultValue:
                        "Перетащите фото сюда или нажмите чтобы выбрать",
                    })}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>
                {t("breast.newModal.dropZoneFormats", {
                  defaultValue: "JPEG, PNG, WebP — до 20 МБ",
                })}
              </div>

              {uploading && (
                <div style={progressBarTrackStyle}>
                  <div
                    style={{
                      ...progressBarFillStyle,
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>
              )}
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

        {/* ─── STEP 2: Select view ─── */}
        {step === 2 && (
          <>
            {photo && (
              <div style={photoPreviewStyle}>
                <img
                  src={photo.url}
                  alt="preview"
                  style={photoPreviewImgStyle}
                />
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  ✓{" "}
                  {t("breast.newModal.uploadSuccess", {
                    defaultValue: "Загружено",
                  })}{" "}
                  — {photo.width}×{photo.height}
                </div>
              </div>
            )}

            <div style={viewGridStyle}>
              {PHOTO_VIEWS.map((view) => {
                const selected = photoView === view.key;
                return (
                  <button
                    key={view.key}
                    type="button"
                    onClick={() => setPhotoView(view.key)}
                    style={{
                      ...viewOptionStyle,
                      ...(selected ? viewOptionSelectedStyle : {}),
                    }}
                  >
                    <span style={viewIconStyle}>{view.icon}</span>
                    <div style={viewLabelStyle}>
                      {t(view.labelKey, { defaultValue: view.labelDefault })}
                    </div>
                    <div style={viewDescStyle}>
                      {t(view.descKey, { defaultValue: view.descDefault })}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ─── STEP 3: Details ─── */}
        {step === 3 && (
          <>
            <label style={labelStyle}>
              {t("breast.newModal.labelField", {
                defaultValue: "Метка плана",
              })}
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t("breast.newModal.labelPlaceholder", {
                  defaultValue: "Например: Аугментация — пред. оценка",
                })}
                maxLength={200}
                autoFocus
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              {t("breast.newModal.patientRefField", {
                defaultValue: "Пациент (опционально)",
              })}
              <input
                type="text"
                value={patientRef}
                onChange={(e) => setPatientRef(e.target.value)}
                placeholder={t("breast.newModal.patientRefPlaceholder", {
                  defaultValue: "Иванова И.А., карта №12345",
                })}
                maxLength={200}
                style={inputStyle}
              />
            </label>

            <div style={summaryBoxStyle}>
              <div style={summaryRowStyle}>
                <span style={summaryLabelStyle}>
                  {t("breast.newModal.summaryView", {
                    defaultValue: "Ракурс",
                  })}
                  :
                </span>
                <span style={summaryValueStyle}>
                  {t(`breast.viewLabel.${photoView}`, {
                    defaultValue:
                      PHOTO_VIEWS.find((v) => v.key === photoView)
                        ?.labelDefault || photoView,
                  })}
                </span>
              </div>
              {photo && (
                <div style={summaryRowStyle}>
                  <span style={summaryLabelStyle}>
                    {t("breast.newModal.summaryPhoto", {
                      defaultValue: "Фото",
                    })}
                    :
                  </span>
                  <span style={summaryValueStyle}>
                    {photo.width}×{photo.height} · {photo.mimeType}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── Buttons ─── */}
        <div style={buttonsRowStyle}>
          {step > 1 && (
            <button
              onClick={() => {
                setStep(step - 1);
                setError(null);
              }}
              style={secondaryButtonStyle}
              disabled={uploading || creating}
            >
              ←{" "}
              {t("breast.newModal.back", {
                defaultValue: "Назад",
              })}
            </button>
          )}

          <button
            onClick={handleClose}
            style={secondaryButtonStyle}
            disabled={creating}
          >
            {t("breast.newModal.cancel", { defaultValue: "Отмена" })}
          </button>

          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              style={primaryButtonStyle}
              disabled={!photoView}
            >
              {t("breast.newModal.next", { defaultValue: "Далее" })} →
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleCreate}
              disabled={!label.trim() || creating}
              style={{
                ...primaryButtonStyle,
                ...(!label.trim() || creating ? disabledStyle : {}),
              }}
            >
              {creating
                ? t("breast.newModal.creating", {
                    defaultValue: "Создание...",
                  })
                : t("breast.newModal.create", {
                    defaultValue: "Создать план",
                  })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   StepDot / StepLine — индикатор прогресса
   ────────────────────────────────────────────────────────────────────────── */
function StepDot({ active, done, num }) {
  const bg = done ? "#22c55e" : active ? "#3d7fff" : "#e5e7eb";
  const color = done || active ? "#fff" : "#888";
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {done ? "✓" : num}
    </div>
  );
}

function StepLine({ done }) {
  return (
    <div
      style={{
        flex: 1,
        height: 2,
        background: done ? "#22c55e" : "#e5e7eb",
        transition: "background 0.2s",
      }}
    />
  );
}

/* ─────── styles ─────── */

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
  maxWidth: 580,
  maxHeight: "90vh",
  overflowY: "auto",
  marginInline: 16,
  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
};

const titleStyle = {
  fontSize: 20,
  fontWeight: 600,
  marginBottom: 16,
  margin: 0,
};

const stepIndicatorStyle = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginTop: 16,
  marginBottom: 12,
};

const subtitleStyle = {
  fontSize: 13,
  color: "#888",
  marginBottom: 20,
};

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

const progressBarTrackStyle = {
  marginTop: 12,
  height: 4,
  background: "#e5e7eb",
  borderRadius: 2,
  overflow: "hidden",
};

const progressBarFillStyle = {
  height: "100%",
  background: "#3d7fff",
  transition: "width 0.2s",
};

const photoPreviewStyle = {
  textAlign: "center",
  marginBottom: 16,
};

const photoPreviewImgStyle = {
  maxWidth: 140,
  maxHeight: 100,
  borderRadius: 6,
  border: "1px solid #e5e7eb",
  objectFit: "cover",
};

const viewGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: 8,
};

const viewOptionStyle = {
  background: "#fff",
  border: "2px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  cursor: "pointer",
  textAlign: "start",
  fontFamily: "inherit",
  transition: "all 0.15s",
};

const viewOptionSelectedStyle = {
  borderColor: "#3d7fff",
  background: "#eef4ff",
};

const viewIconStyle = {
  fontSize: 22,
  display: "block",
  marginBottom: 6,
};

const viewLabelStyle = {
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 4,
};

const viewDescStyle = {
  fontSize: 11,
  color: "#666",
  lineHeight: 1.4,
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
  boxSizing: "border-box",
};

const summaryBoxStyle = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "10px 14px",
  marginTop: 8,
};

const summaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 12,
  marginBottom: 4,
};

const summaryLabelStyle = {
  color: "#666",
};

const summaryValueStyle = {
  fontWeight: 500,
  color: "#1a1d1f",
};

const buttonsRowStyle = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
  marginTop: 20,
  flexWrap: "wrap",
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
