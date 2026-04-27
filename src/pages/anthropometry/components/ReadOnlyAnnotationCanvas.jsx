import React, { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import * as photoApi from "../api/photoApi.js";
import * as annotationApi from "../api/annotationApi.js";
import {
  computeDistance,
  computeAngle,
  formatMeasurement,
} from "../utils/annotationHelpers.js";

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 10;

/* ─── ReadOnlyAnnotationCanvas ──────────────────────────────
   Props:
   - photoId
   - pixelsPerMm
   - externalView?: { normalizedCenter: {x, y}, zoomRatio }  // для sync
   - onViewChange?: (view) => void                           // для sync
   - onAnnotationLoaded?: (annotation) => void
   - label
   ──────────────────────────────────────────────────────────── */

function ReadOnlyAnnotationCanvas({
  photoId,
  pixelsPerMm,
  externalView,
  onViewChange,
  onAnnotationLoaded,
  onImageSizeChange, // ← ADD
  label,
}) {
  const { t } = useTranslation("Anthropometry");

  const [imageUrl, setImageUrl] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [annotation, setAnnotation] = useState(null);

  /* Локальные transform state */
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  /* Fit-to-screen zoom (базовый масштаб "как влезло целиком") */
  const [baseZoom, setBaseZoom] = useState(1);

  const areaRef = useRef(null);
  const imgRef = useRef(null);
  const isPanning = useRef(false);
  const panStartRef = useRef({ mouse: null, pan: null });
  const applyingExternalRef = useRef(false);

  /* ─── Load photo + annotation ─── */
  useEffect(() => {
    if (!photoId) {
      setImageUrl(null);
      setImageSize(null);
      setAnnotation(null);
      if (onAnnotationLoaded) onAnnotationLoaded(null);
      if (onImageSizeChange) onImageSizeChange(null); // ← ADD
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const urlRes = await photoApi.getPhotoSignedUrl(photoId);
        if (cancelled) return;
        setImageUrl(urlRes.url);

        try {
          const ann = await annotationApi.getCurrentAnnotation(photoId, "free");
          if (!cancelled) {
            setAnnotation(ann);
            if (onAnnotationLoaded) onAnnotationLoaded(ann);
          }
        } catch {
          if (!cancelled) {
            setAnnotation(null);
            if (onAnnotationLoaded) onAnnotationLoaded(null);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Load failed");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [photoId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Image loaded → fit to screen ─── */
  const handleImgLoad = useCallback((e) => {
    const img = e.currentTarget;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const size = { w: natW, h: natH };
    setImageSize(size);
    setLoading(false);
    if (onImageSizeChange) onImageSizeChange(size);

    const area = areaRef.current;
    if (!area) return;
    const padding = 30;
    const availW = area.clientWidth - padding * 2;
    const availH = area.clientHeight - padding * 2;
    const scale = Math.min(availW / natW, availH / natH, 1);

    setBaseZoom(scale);
    setZoom(scale);
    setPan({ x: -natW / 2, y: -natH / 2 });
  }, []);

  /* ─── Export view наружу при локальных изменениях ─── */
  const emitViewChange = useCallback(
    (z, p) => {
      if (applyingExternalRef.current || !onViewChange || !imageSize) return;
      /* Normalized center in [0..1] space фото */
      const normalizedCenter = {
        x: -p.x / imageSize.w,
        y: -p.y / imageSize.h,
      };
      /* zoomRatio = текущий zoom / fit-zoom — чтобы "1" означал fit-to-screen */
      const zoomRatio = baseZoom > 0 ? z / baseZoom : z;
      onViewChange({ normalizedCenter, zoomRatio });
    },
    [onViewChange, imageSize, baseZoom],
  );

  /* ─── Apply external view (sync from другой панели) ─── */
  useEffect(() => {
    if (!externalView || !imageSize || baseZoom === 0) return;
    applyingExternalRef.current = true;
    const { normalizedCenter, zoomRatio } = externalView;

    const newZoom = zoomRatio * baseZoom;
    const newPan = {
      x: -normalizedCenter.x * imageSize.w,
      y: -normalizedCenter.y * imageSize.h,
    };

    setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
    setPan(newPan);

    /* Unset suppress в следующем тике */
    queueMicrotask(() => {
      applyingExternalRef.current = false;
    });
  }, [externalView, imageSize, baseZoom]);

  /* ─── Wheel → zoom к курсору ─── */
  const handleWheel = useCallback(
    (e) => {
      if (!imageSize) return;
      e.preventDefault();

      const area = areaRef.current;
      if (!area) return;
      const rect = area.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - rect.width / 2;
      const cursorY = e.clientY - rect.top - rect.height / 2;

      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
      if (newZoom === zoom) return;

      const imagePointX = (cursorX - pan.x * zoom) / zoom;
      const imagePointY = (cursorY - pan.y * zoom) / zoom;
      const newPanX = (cursorX - imagePointX * newZoom) / newZoom;
      const newPanY = (cursorY - imagePointY * newZoom) / newZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
      emitViewChange(newZoom, { x: newPanX, y: newPanY });
    },
    [imageSize, zoom, pan, emitViewChange],
  );

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.addEventListener("wheel", handleWheel, { passive: false });
    return () => area.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  /* ─── Pan via drag ─── */
  const handleMouseDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    isPanning.current = true;
    panStartRef.current = {
      mouse: { x: e.clientX, y: e.clientY },
      pan: { ...pan },
    };
  };

  const handleMouseMove = (e) => {
    if (!isPanning.current) return;
    const start = panStartRef.current;
    if (!start.mouse) return;
    const dx = (e.clientX - start.mouse.x) / zoom;
    const dy = (e.clientY - start.mouse.y) / zoom;
    const newPan = { x: start.pan.x + dx, y: start.pan.y + dy };
    setPan(newPan);
    emitViewChange(zoom, newPan);
  };

  const handleMouseUp = () => {
    isPanning.current = false;
    panStartRef.current = { mouse: null, pan: null };
  };

  /* ─── Computed measurements ─── */
  const measurementsWithValues = React.useMemo(() => {
    if (!annotation || !imageSize) return [];
    const lmByKey = {};
    for (const lm of annotation.landmarks || []) lmByKey[lm.key] = lm;

    return (annotation.measurements || []).map((m) => {
      const pts = m.landmarks.map((k) => lmByKey[k]).filter(Boolean);
      if (pts.length !== m.landmarks.length)
        return { ...m, value: null, unit: null, points: [] };

      if (m.type === "distance" && pts.length === 2) {
        const { value, unit } = computeDistance(
          pts[0],
          pts[1],
          imageSize.w,
          imageSize.h,
          pixelsPerMm,
        );
        return { ...m, points: pts, value, unit };
      }
      if (m.type === "angle" && pts.length === 3) {
        const { value, unit } = computeAngle(
          pts[0],
          pts[1],
          pts[2],
          imageSize.w,
          imageSize.h,
        );
        return { ...m, points: pts, value, unit };
      }
      return { ...m, points: pts, value: null, unit: null };
    });
  }, [annotation, imageSize, pixelsPerMm]);

  /* ─── Render ─── */
  const stageTransform = imageSize
    ? `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`
    : "none";

  const lmR = 6 / zoom;
  const lmHalo = 14 / zoom;
  const lmStroke = 2.5 / zoom;
  const labelFont = 12 / zoom;
  const measureStroke = 2 / zoom;
  const measureFont = 12 / zoom;

  if (error) {
    return (
      <div className={styles.compareCanvasArea}>
        <div className={styles.annotationLoadingState}>
          {t("common.error")}: {error}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={areaRef}
      className={styles.compareCanvasArea}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {label && <div className={styles.compareCanvasLabel}>{label}</div>}

      {loading && (
        <div className={styles.annotationLoadingState}>
          {t("common.loading")}
        </div>
      )}

      {imageUrl && (
        <div
          className={styles.annotationStage}
          style={{ transform: stageTransform }}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt=""
            className={styles.annotationImg}
            onLoad={handleImgLoad}
          />
          {imageSize && (
            <svg
              className={styles.annotationSvg}
              width={imageSize.w}
              height={imageSize.h}
              viewBox={`0 0 ${imageSize.w} ${imageSize.h}`}
            >
              {/* Measurements */}
              {measurementsWithValues.map((m) => {
                if (!m.points || m.value === null) return null;
                if (m.type === "distance") {
                  const [p1, p2] = m.points;
                  const x1 = p1.x * imageSize.w;
                  const y1 = p1.y * imageSize.h;
                  const x2 = p2.x * imageSize.w;
                  const y2 = p2.y * imageSize.h;
                  const mx = (x1 + x2) / 2;
                  const my = (y1 + y2) / 2;
                  return (
                    <g key={m.key} style={{ pointerEvents: "none" }}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        className={styles.measureLine}
                        strokeWidth={measureStroke}
                      />
                      <text
                        x={mx}
                        y={my - 8 / zoom}
                        textAnchor="middle"
                        className={styles.measureLabel}
                        fontSize={measureFont}
                      >
                        {formatMeasurement(m.value, m.unit)}
                      </text>
                    </g>
                  );
                }
                if (m.type === "angle") {
                  const [p1, p2, p3] = m.points;
                  const x1 = p1.x * imageSize.w;
                  const y1 = p1.y * imageSize.h;
                  const x2 = p2.x * imageSize.w;
                  const y2 = p2.y * imageSize.h;
                  const x3 = p3.x * imageSize.w;
                  const y3 = p3.y * imageSize.h;
                  return (
                    <g key={m.key} style={{ pointerEvents: "none" }}>
                      <line
                        x1={x2}
                        y1={y2}
                        x2={x1}
                        y2={y1}
                        className={styles.measureLine}
                        strokeWidth={measureStroke}
                      />
                      <line
                        x1={x2}
                        y1={y2}
                        x2={x3}
                        y2={y3}
                        className={styles.measureLine}
                        strokeWidth={measureStroke}
                      />
                      <text
                        x={x2}
                        y={y2 - 10 / zoom}
                        textAnchor="middle"
                        className={styles.measureLabel}
                        fontSize={measureFont}
                      >
                        {formatMeasurement(m.value, m.unit)}
                      </text>
                    </g>
                  );
                }
                return null;
              })}

              {/* Landmarks */}
              {(annotation?.landmarks || []).map((lm) => {
                const cx = lm.x * imageSize.w;
                const cy = lm.y * imageSize.h;
                return (
                  <g key={lm.key} style={{ pointerEvents: "none" }}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={lmHalo}
                      className={styles.landmarkHalo}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={lmR}
                      strokeWidth={lmStroke}
                      className={styles.landmarkCircle}
                    />
                    <text
                      x={cx + lmR * 1.6}
                      y={cy - lmR * 0.6}
                      className={styles.landmarkLabel}
                      fontSize={labelFont}
                    >
                      {lm.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      )}

      {imageSize && (
        <div className={styles.annotationZoomIndicator}>
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}

export default ReadOnlyAnnotationCanvas;
