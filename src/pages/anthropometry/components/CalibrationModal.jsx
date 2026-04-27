import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import * as photoApi from "../api/photoApi.js";
import * as calibrationApi from "../api/calibrationApi.js";
import { fetchStudy } from "../store/studiesSlice.js";

/* ─── Популярные варианты (подсказки) ─── */
const HINT_PRESETS = [
  { key: "ruler50", labelKey: "calibration.hints.ruler50", mm: 50 },
  { key: "ruler100", labelKey: "calibration.hints.ruler100", mm: 100 },
  { key: "ipd", labelKey: "calibration.hints.ipd", mm: 63 },
  { key: "creditCard", labelKey: "calibration.hints.creditCard", mm: 85.6 },
];

/* ─── CalibrationModal ───────────────────────────────────────
   Универсальная калибровка: клик двух точек на фото + ввод
   реального расстояния в миллиметрах.

   Координаты точек сохраняются в "pixel space" выбранного
   фото (не container), чтобы backend получил точные pixelX/pixelY
   независимо от размера превью на экране.
   ──────────────────────────────────────────────────────────── */

function CalibrationModal({ isOpen, studyId, photos, onClose }) {
  const { t } = useTranslation("Anthropometry");
  const dispatch = useDispatch();

  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState(null); // {w, h}

  /* points в pixel space фото (не экранного preview) */
  const [points, setPoints] = useState([]); // [{x, y}, {x, y}]
  const [distanceMm, setDistanceMm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const imgRef = useRef(null);
  const svgRef = useRef(null);

  /* ─── Reset при открытии ─── */
  useEffect(() => {
    if (isOpen) {
      setSelectedPhotoId(null);
      setImageUrl(null);
      setImageNaturalSize(null);
      setPoints([]);
      setDistanceMm("");
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  /* ─── Escape для закрытия ─── */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, submitting, onClose]);

  /* ─── Загрузка signed URL выбранного фото ─── */
  useEffect(() => {
    if (!selectedPhotoId) return;
    let cancelled = false;

    async function loadPhoto() {
      setImageLoading(true);
      try {
        const res = await photoApi.getPhotoSignedUrl(selectedPhotoId);
        if (!cancelled) {
          setImageUrl(res.url);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load photo");
          setImageLoading(false);
        }
      }
    }
    loadPhoto();
    return () => {
      cancelled = true;
    };
  }, [selectedPhotoId]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  const handleSelectPhoto = (photo) => {
    setSelectedPhotoId(photo._id);
    setImageUrl(null);
    setImageNaturalSize(null);
    setPoints([]);
    setError(null);
  };

  const handleImgLoad = (e) => {
    const img = e.currentTarget;
    setImageNaturalSize({
      w: img.naturalWidth,
      h: img.naturalHeight,
    });
    setImageLoading(false);
  };

  /* ─── Клик на overlay: пересчитываем экранные координаты в
     координаты самого фото (naturalWidth/Height) ─── */
  const handleOverlayClick = (e) => {
    if (!imageNaturalSize || points.length >= 2) return;

    const svg = svgRef.current;
    const img = imgRef.current;
    if (!svg || !img) return;

    /* Экранные координаты клика внутри SVG */
    const rect = svg.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    /* Размер отрисованного img (учитывая object-fit: contain) */
    const imgRect = img.getBoundingClientRect();
    const offsetX = imgRect.left - rect.left;
    const offsetY = imgRect.top - rect.top;

    /* Координаты относительно видимой области фото */
    const relX = screenX - offsetX;
    const relY = screenY - offsetY;

    /* Клик был ВНЕ самого фото — игнорируем */
    if (relX < 0 || relY < 0 || relX > imgRect.width || relY > imgRect.height) {
      return;
    }

    /* Пересчёт в "настоящие" пиксели фото */
    const scaleX = imageNaturalSize.w / imgRect.width;
    const scaleY = imageNaturalSize.h / imgRect.height;

    const pixelX = Math.round(relX * scaleX);
    const pixelY = Math.round(relY * scaleY);

    setPoints((prev) => [...prev, { x: pixelX, y: pixelY }]);
  };

  const handleResetPoints = () => {
    setPoints([]);
  };

  const handleHintClick = (mm) => {
    setDistanceMm(String(mm));
  };

  /* ─── Пересчёт точек обратно в screen-координаты для отрисовки ─── */
  const getScreenPoints = () => {
    if (!imageNaturalSize || !imgRef.current || !svgRef.current) return [];
    const imgRect = imgRef.current.getBoundingClientRect();
    const svgRect = svgRef.current.getBoundingClientRect();
    const offsetX = imgRect.left - svgRect.left;
    const offsetY = imgRect.top - svgRect.top;
    const scaleX = imgRect.width / imageNaturalSize.w;
    const scaleY = imgRect.height / imageNaturalSize.h;

    return points.map((p) => ({
      x: offsetX + p.x * scaleX,
      y: offsetY + p.y * scaleY,
    }));
  };

  const canSubmit =
    selectedPhotoId &&
    points.length === 2 &&
    parseFloat(distanceMm) > 0 &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      /* Backend ожидает нормализованные координаты [0..1].
       Наши points хранятся в pixel space фото — делим на naturalWidth/Height. */
      const normalize = (p) => ({
        x: p.x / imageNaturalSize.w,
        y: p.y / imageNaturalSize.h,
      });

      await calibrationApi.calibrateWithRuler(studyId, {
        referencePhotoId: selectedPhotoId,
        point1: normalize(points[0]),
        point2: normalize(points[1]),
        knownDistanceMm: parseFloat(distanceMm),
      });

      /* Обновим study в redux — status-bar сразу станет зелёным */
      await dispatch(fetchStudy(studyId));

      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Calibration failed",
      );
      setSubmitting(false);
    }
  };
  /* ─── Screen-координаты для SVG overlay ─── */
  const screenPoints = getScreenPoints();

  const step1Done = Boolean(selectedPhotoId);
  const step2Done = points.length === 2;
  const step3Done = parseFloat(distanceMm) > 0;

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={`${styles.modal} ${styles.calibrationModal}`}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{t("calibration.modalTitle")}</h2>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <div className={styles.calibrationBodyScroll}>
          {/* ─── Step 1: выбор фото ─── */}
          <div className={styles.calibrationStep}>
            <div className={styles.calibrationStepHeader}>
              <div
                className={`${styles.calibrationStepNum} ${
                  step1Done
                    ? styles.calibrationStepNumDone
                    : styles.calibrationStepNumActive
                }`}
              >
                {step1Done ? "✓" : "1"}
              </div>
              <div className={styles.calibrationStepTitle}>
                {t("calibration.step1Title")}
              </div>
            </div>
            <div className={styles.calibPhotoChoice}>
              {photos.map((photo) => (
                <CalibPhotoThumb
                  key={photo._id}
                  photo={photo}
                  selected={selectedPhotoId === photo._id}
                  onClick={() => handleSelectPhoto(photo)}
                />
              ))}
            </div>
          </div>

          {/* ─── Step 2: поставить точки ─── */}
          <div
            className={`${styles.calibrationStep} ${
              !step1Done ? styles.calibrationStepDisabled : ""
            }`}
          >
            <div className={styles.calibrationStepHeader}>
              <div
                className={`${styles.calibrationStepNum} ${
                  step2Done
                    ? styles.calibrationStepNumDone
                    : step1Done
                      ? styles.calibrationStepNumActive
                      : ""
                }`}
              >
                {step2Done ? "✓" : "2"}
              </div>
              <div className={styles.calibrationStepTitle}>
                {t("calibration.step2Title")}
                {points.length > 0 && (
                  <button
                    type="button"
                    className={styles.calibResetBtn}
                    onClick={handleResetPoints}
                  >
                    {t("calibration.reset")}
                  </button>
                )}
              </div>
            </div>

            {selectedPhotoId && (
              <>
                <div className={styles.calibCanvasWrap}>
                  {imageLoading && !imageUrl && (
                    <div style={{ color: "#94a3b8" }}>⋯</div>
                  )}
                  {imageUrl && (
                    <>
                      <img
                        ref={imgRef}
                        src={imageUrl}
                        alt="calibration"
                        className={styles.calibCanvasImg}
                        onLoad={handleImgLoad}
                      />
                      {imageNaturalSize && (
                        <svg
                          ref={svgRef}
                          className={styles.calibCanvasOverlay}
                          onClick={handleOverlayClick}
                        >
                          {/* Линия между точками */}
                          {screenPoints.length === 2 && (
                            <line
                              x1={screenPoints[0].x}
                              y1={screenPoints[0].y}
                              x2={screenPoints[1].x}
                              y2={screenPoints[1].y}
                              className={styles.calibLine}
                            />
                          )}
                          {/* Точки */}
                          {screenPoints.map((p, idx) => (
                            <g key={idx}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={14}
                                className={styles.calibPointHalo}
                              />
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={6}
                                className={styles.calibPoint}
                              />
                            </g>
                          ))}
                        </svg>
                      )}
                    </>
                  )}
                </div>
                <div
                  className={`${styles.calibHint} ${
                    points.length < 2 ? styles.calibHintActive : ""
                  }`}
                >
                  {points.length === 0 && t("calibration.hint0")}
                  {points.length === 1 && t("calibration.hint1")}
                  {points.length === 2 && t("calibration.hint2")}
                </div>
              </>
            )}
          </div>

          {/* ─── Step 3: расстояние ─── */}
          <div
            className={`${styles.calibrationStep} ${
              !step2Done ? styles.calibrationStepDisabled : ""
            }`}
          >
            <div className={styles.calibrationStepHeader}>
              <div
                className={`${styles.calibrationStepNum} ${
                  step3Done
                    ? styles.calibrationStepNumDone
                    : step2Done
                      ? styles.calibrationStepNumActive
                      : ""
                }`}
              >
                {step3Done ? "✓" : "3"}
              </div>
              <div className={styles.calibrationStepTitle}>
                {t("calibration.step3Title")}
              </div>
            </div>
            <div className={styles.calibDistanceRow}>
              <input
                type="number"
                step="0.1"
                min="0"
                className={styles.calibDistanceInput}
                value={distanceMm}
                onChange={(e) => setDistanceMm(e.target.value)}
                placeholder="50"
                disabled={!step2Done || submitting}
              />
              <span className={styles.calibDistanceUnit}>мм</span>
            </div>

            {/* Подсказки */}
            <div className={styles.calibHintsBox}>
              <h4 className={styles.calibHintsTitle}>
                {t("calibration.hintsTitle")}
              </h4>
              <div>
                {HINT_PRESETS.map((hint) => (
                  <button
                    key={hint.key}
                    type="button"
                    className={styles.calibHintChip}
                    onClick={() => handleHintClick(hint.mm)}
                  >
                    {t(hint.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <div className={styles.formErrorBanner}>{error}</div>}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={submitting}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? t("common.loading") : t("calibration.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Вспомогательный: thumbnail фото в Step 1 ─── */
function CalibPhotoThumb({ photo, selected, onClick }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    photoApi
      .getThumbnailSignedUrl(photo._id)
      .then((res) => {
        if (!cancelled) setUrl(res.url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [photo._id]);

  return (
    <div
      className={`${styles.calibPhotoThumb} ${
        selected ? styles.calibPhotoThumbSelected : ""
      }`}
      onClick={onClick}
    >
      {url ? (
        <img src={url} alt="" className={styles.calibPhotoThumbImg} />
      ) : (
        <div className={styles.calibPhotoThumbLoading}>⋯</div>
      )}
    </div>
  );
}

export default CalibrationModal;
