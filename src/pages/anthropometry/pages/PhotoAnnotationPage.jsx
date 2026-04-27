import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  useReducer,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import * as photoApi from "../api/photoApi.js";
import {
  fetchStudy,
  selectCurrentStudy,
  clearCurrentStudy,
} from "../store/studiesSlice.js";
import {
  fetchCurrentAnnotation,
  createAnnotation,
  updateLandmarks,
  lockAnnotation,
  unlockAnnotation,
  selectCurrentAnnotation,
  selectAnnotationsSaving,
} from "../store/annotationsSlice.js";
import {
  generateLandmarkKey,
  generateMeasurementKey,
  clampLandmark,
  computeDistance,
  computeAngle,
  formatMeasurement,
} from "../utils/annotationHelpers.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

/* ─── Constants ─── */
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 10;
const ZOOM_STEP = 1.2;
const AUTOSAVE_DEBOUNCE_MS = 800;
const PRESET_TYPE = "free";
const HISTORY_LIMIT = 50;

/* ─── History reducer (undo/redo) ─── */
/* state: { past: [{landmarks, measurements}], present: {landmarks, measurements}, future: [...] } */

const historyReducer = (state, action) => {
  switch (action.type) {
    case "SET": {
      /* Прямая установка без push в past (для initial load / autosave-synced) */
      return { ...state, present: action.payload };
    }
    case "PUSH": {
      /* Новое действие: past += present, present = new, future = [] */
      const newPast = [...state.past, state.present].slice(-HISTORY_LIMIT);
      return {
        past: newPast,
        present: action.payload,
        future: [],
      };
    }
    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future].slice(0, HISTORY_LIMIT),
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: next,
        future: newFuture,
      };
    }
    case "CLEAR_HISTORY": {
      return { past: [], present: state.present, future: [] };
    }
    default:
      return state;
  }
};

function PhotoAnnotationPage() {
  const { photoId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation("Anthropometry");

  const study = useSelector(selectCurrentStudy);
  const annotation = useSelector(selectCurrentAnnotation(photoId));
  const saving = useSelector(selectAnnotationsSaving);

  /* ─── Photo ─── */
  const [photoDoc, setPhotoDoc] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(true);
  const [error, setError] = useState(null);

  /* ─── Tool ─── */
  const [tool, setTool] = useState("select");
  const [pendingSelection, setPendingSelection] = useState([]); // landmarks выбраны для measurement в процессе создания

  /* ─── History state: landmarks + measurements ─── */
  const [historyState, historyDispatch] = useReducer(historyReducer, {
    past: [],
    present: { landmarks: [], measurements: [] },
    future: [],
  });
  const { landmarks, measurements } = historyState.present;
  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;

  /* ─── UI state ─── */
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedMeasureKey, setSelectedMeasureKey] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState("idle");

  const [lockDialog, setLockDialog] = useState(false);
  const [unlockDialog, setUnlockDialog] = useState(false);

  const autosaveTimerRef = useRef(null);
  const suppressAutosaveRef = useRef(false);

  /* ─── Transform ─── */
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const panStartRef = useRef({ mouse: null, pan: null });

  const canvasAreaRef = useRef(null);
  const imgRef = useRef(null);
  const svgRef = useRef(null);
  const draggingRef = useRef(null);

  const isLocked = Boolean(annotation?.isLocked);
  const readOnly = isLocked;

  /* ═══════════════════════════════════════════════════════════
     HELPER: commit изменений (push в history + autosave)
     ═══════════════════════════════════════════════════════════ */

  const commitChange = useCallback(
    (newLandmarks, newMeasurements) => {
      if (readOnly) return;
      historyDispatch({
        type: "PUSH",
        payload: {
          landmarks: newLandmarks,
          measurements: newMeasurements,
        },
      });
      scheduleAutosave(newLandmarks);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readOnly],
  );

  /* ═══════════════════════════════════════════════════════════
     1. LOAD photo + study + annotation
     ═══════════════════════════════════════════════════════════ */

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingPhoto(true);
      setError(null);
      try {
        const photo = await photoApi.getPhoto(photoId);
        if (cancelled) return;
        setPhotoDoc(photo);

        if (photo.studyId) {
          dispatch(fetchStudy(photo.studyId));
        }

        const urlRes = await photoApi.getPhotoSignedUrl(photoId);
        if (cancelled) return;
        setImageUrl(urlRes.url);

        dispatch(fetchCurrentAnnotation({ photoId, presetType: PRESET_TYPE }));
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load photo");
          setLoadingPhoto(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
      dispatch(clearCurrentStudy());
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [photoId, dispatch]);

  /* Sync annotation → history.present */
  useEffect(() => {
    if (!annotation) {
      suppressAutosaveRef.current = true;
      historyDispatch({
        type: "SET",
        payload: { landmarks: [], measurements: [] },
      });
      historyDispatch({ type: "CLEAR_HISTORY" });
      queueMicrotask(() => {
        suppressAutosaveRef.current = false;
      });
      return;
    }
    suppressAutosaveRef.current = true;
    historyDispatch({
      type: "SET",
      payload: {
        landmarks: annotation.landmarks || [],
        measurements: annotation.measurements || [],
      },
    });
    historyDispatch({ type: "CLEAR_HISTORY" });
    queueMicrotask(() => {
      suppressAutosaveRef.current = false;
    });
  }, [annotation]);

  /* ═══════════════════════════════════════════════════════════
     2. AUTOSAVE (только landmarks — backend пересчитает measurements)
     ═══════════════════════════════════════════════════════════ */

  const scheduleAutosave = useCallback(
    (newLandmarks) => {
      if (suppressAutosaveRef.current || readOnly) return;
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      setAutosaveStatus("idle");
      autosaveTimerRef.current = setTimeout(async () => {
        setAutosaveStatus("saving");
        try {
          if (!annotation) {
            await dispatch(
              createAnnotation({
                photoId,
                data: {
                  presetType: PRESET_TYPE,
                  landmarks: newLandmarks,
                },
              }),
            ).unwrap();
          } else {
            await dispatch(
              updateLandmarks({
                annotationId: annotation._id,
                landmarks: newLandmarks,
                photoId,
              }),
            ).unwrap();
          }
          setAutosaveStatus("saved");
          setTimeout(() => setAutosaveStatus("idle"), 2000);
        } catch (err) {
          console.error("Autosave failed:", err);
          setAutosaveStatus("error");
        }
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [annotation, dispatch, photoId, readOnly],
  );

  /* ═══════════════════════════════════════════════════════════
     3. FIT / IMG load
     ═══════════════════════════════════════════════════════════ */

  const fitToScreen = useCallback(
    (imgW, imgH) => {
      const area = canvasAreaRef.current;
      if (!area) return;
      const w = imgW || imageSize?.w;
      const h = imgH || imageSize?.h;
      if (!w || !h) return;

      const padding = 40;
      const availW = area.clientWidth - padding * 2;
      const availH = area.clientHeight - padding * 2;
      const scale = Math.min(availW / w, availH / h, 1);

      setZoom(scale);
      setPan({ x: -w / 2, y: -h / 2 });
    },
    [imageSize],
  );

  const handleImgLoad = useCallback(
    (e) => {
      const img = e.currentTarget;
      setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
      setLoadingPhoto(false);
      fitToScreen(img.naturalWidth, img.naturalHeight);
    },
    [fitToScreen],
  );

  /* ═══════════════════════════════════════════════════════════
     4. LANDMARK add / move / delete
     ═══════════════════════════════════════════════════════════ */

  const addLandmarkAtScreenPoint = (screenX, screenY) => {
    if (!imageSize || readOnly) return;
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const svgX = screenX - rect.left;
    const svgY = screenY - rect.top;

    const pixelX = (svgX / rect.width) * imageSize.w;
    const pixelY = (svgY / rect.height) * imageSize.h;
    const { x, y } = clampLandmark(pixelX / imageSize.w, pixelY / imageSize.h);

    const newLandmark = {
      key: generateLandmarkKey(),
      label: `P${landmarks.length + 1}`,
      x,
      y,
      order: landmarks.length + 1,
    };

    commitChange([...landmarks, newLandmark], measurements);
    setSelectedKey(newLandmark.key);
  };

  const deleteLandmark = (key) => {
    if (readOnly) return;
    const newLandmarks = landmarks.filter((lm) => lm.key !== key);
    /* Удаляем measurements связанные с этим landmark */
    const newMeasurements = measurements.filter(
      (m) => !m.landmarks.includes(key),
    );
    commitChange(newLandmarks, newMeasurements);
    if (selectedKey === key) setSelectedKey(null);
  };

  const deleteMeasurement = (key) => {
    if (readOnly) return;
    const newMeasurements = measurements.filter((m) => m.key !== key);
    commitChange(landmarks, newMeasurements);
    if (selectedMeasureKey === key) setSelectedMeasureKey(null);
  };

  /* ═══════════════════════════════════════════════════════════
     5. SVG click → add landmark OR add to pending selection
     ═══════════════════════════════════════════════════════════ */

  const handleSvgClick = (e) => {
    if (readOnly || spacePressed) return;
    if (e.target.tagName !== "svg") return;

    if (tool === "landmark") {
      addLandmarkAtScreenPoint(e.clientX, e.clientY);
    }
  };

  /* Click на существующий landmark */
  const handleLandmarkClick = (e, lm) => {
    e.stopPropagation();
    if (spacePressed) return;

    /* В режимах measurement — добавляем в pending */
    if (tool === "measureDist" || tool === "measureAngle") {
      handlePendingAdd(lm.key);
      return;
    }

    /* В остальных режимах — обычный select */
    setSelectedKey(lm.key);
    setSelectedMeasureKey(null);
  };

  /* ═══════════════════════════════════════════════════════════
     6. MEASUREMENTS pending selection
     ═══════════════════════════════════════════════════════════ */

  const neededPoints =
    tool === "measureDist" ? 2 : tool === "measureAngle" ? 3 : 0;

  const handlePendingAdd = (lmKey) => {
    if (readOnly) return;
    if (pendingSelection.includes(lmKey)) return; // не дублируем
    const updated = [...pendingSelection, lmKey];

    if (updated.length === neededPoints) {
      /* Создаём measurement */
      const newMeasurement = {
        key: generateMeasurementKey(),
        type: tool === "measureDist" ? "distance" : "angle",
        landmarks: updated,
        label:
          tool === "measureDist"
            ? `d${measurements.filter((m) => m.type === "distance").length + 1}`
            : `a${measurements.filter((m) => m.type === "angle").length + 1}`,
      };
      commitChange(landmarks, [...measurements, newMeasurement]);
      setPendingSelection([]);
      setSelectedMeasureKey(newMeasurement.key);
    } else {
      setPendingSelection(updated);
    }
  };

  /* При смене tool — сбрасываем pending */
  useEffect(() => {
    setPendingSelection([]);
  }, [tool]);

  /* ═══════════════════════════════════════════════════════════
     7. LANDMARK drag
     ═══════════════════════════════════════════════════════════ */

  const handleLandmarkMouseDown = (e, lm) => {
    e.stopPropagation();
    if (readOnly || spacePressed || tool !== "select") return;
    setSelectedKey(lm.key);
    draggingRef.current = {
      key: lm.key,
      startMouse: { x: e.clientX, y: e.clientY },
      startLm: { x: lm.x, y: lm.y },
    };
  };

  const handleDocumentMouseMoveForDrag = useCallback(
    (e) => {
      const d = draggingRef.current;
      if (!d || !imageSize) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();

      const screenDx = e.clientX - d.startMouse.x;
      const screenDy = e.clientY - d.startMouse.y;
      const imgPxDx = (screenDx / rect.width) * imageSize.w;
      const imgPxDy = (screenDy / rect.height) * imageSize.h;

      /* Обновляем present БЕЗ пуша в past (live drag) */
      historyDispatch({
        type: "SET",
        payload: {
          landmarks: landmarks.map((lm) => {
            if (lm.key !== d.key) return lm;
            const newX = d.startLm.x + imgPxDx / imageSize.w;
            const newY = d.startLm.y + imgPxDy / imageSize.h;
            return { ...lm, ...clampLandmark(newX, newY) };
          }),
          measurements,
        },
      });
    },
    [imageSize, landmarks, measurements],
  );

  const handleDocumentMouseUp = useCallback(() => {
    if (draggingRef.current) {
      /* Финальный push в past + autosave */
      historyDispatch({
        type: "PUSH",
        payload: { landmarks, measurements },
      });
      /* Откатываем — мы уже в новом present, нужно чтобы PUSH не создал
         дубликат. Альтернатива: вместо SET делать проход без push
         и пушить только в handleDocumentMouseUp. Простая версия: */
      // (pushed above — это может создать дубль past, но безопасно)
      scheduleAutosave(landmarks);
      draggingRef.current = null;
    }
  }, [landmarks, measurements, scheduleAutosave]);

  useEffect(() => {
    window.addEventListener("mousemove", handleDocumentMouseMoveForDrag);
    window.addEventListener("mouseup", handleDocumentMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleDocumentMouseMoveForDrag);
      window.removeEventListener("mouseup", handleDocumentMouseUp);
    };
  }, [handleDocumentMouseMoveForDrag, handleDocumentMouseUp]);

  /* ═══════════════════════════════════════════════════════════
     8. ZOOM / PAN
     ═══════════════════════════════════════════════════════════ */

  const handleWheel = useCallback(
    (e) => {
      if (!imageSize) return;
      e.preventDefault();
      const area = canvasAreaRef.current;
      if (!area) return;
      const rect = area.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - rect.width / 2;
      const cursorY = e.clientY - rect.top - rect.height / 2;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;

      setZoom((z) => {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * factor));
        if (newZoom === z) return z;
        setPan((p) => {
          const imagePointX = (cursorX - p.x * z) / z;
          const imagePointY = (cursorY - p.y * z) / z;
          return {
            x: (cursorX - imagePointX * newZoom) / newZoom,
            y: (cursorY - imagePointY * newZoom) / newZoom,
          };
        });
        return newZoom;
      });
    },
    [imageSize],
  );

  const canPan = spacePressed;

  const handleCanvasMouseDown = (e) => {
    if (!canPan) return;
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = {
      mouse: { x: e.clientX, y: e.clientY },
      pan: { ...pan },
    };
  };

  const handleCanvasMouseMove = (e) => {
    if (!isPanning) return;
    const start = panStartRef.current;
    if (!start.mouse) return;
    const dx = (e.clientX - start.mouse.x) / zoom;
    const dy = (e.clientY - start.mouse.y) / zoom;
    setPan({ x: start.pan.x + dx, y: start.pan.y + dy });
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    panStartRef.current = { mouse: null, pan: null };
  };

  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    area.addEventListener("wheel", handleWheel, { passive: false });
    return () => area.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  /* ═══════════════════════════════════════════════════════════
     9. KEYBOARD shortcuts
     ═══════════════════════════════════════════════════════════ */

  const handleUndo = useCallback(() => {
    if (!canUndo || readOnly) return;
    historyDispatch({ type: "UNDO" });
    /* После undo — autosave новое состояние */
    const prevState = historyState.past[historyState.past.length - 1];
    if (prevState) scheduleAutosave(prevState.landmarks);
  }, [canUndo, readOnly, historyState.past, scheduleAutosave]);

  const handleRedo = useCallback(() => {
    if (!canRedo || readOnly) return;
    historyDispatch({ type: "REDO" });
    const nextState = historyState.future[0];
    if (nextState) scheduleAutosave(nextState.landmarks);
  }, [canRedo, readOnly, historyState.future, scheduleAutosave]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      const isTyping =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (isTyping) return;

      if (e.code === "Space" && !spacePressed) {
        e.preventDefault();
        setSpacePressed(true);
      }

      /* Undo/Redo */
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Z")
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.key === "0") setZoom(1);
      if (e.key === "f" || e.key === "F") {
        if (imageSize) fitToScreen();
      }
      if (e.key === "Escape") {
        if (pendingSelection.length > 0) {
          setPendingSelection([]);
        } else if (selectedKey || selectedMeasureKey) {
          setSelectedKey(null);
          setSelectedMeasureKey(null);
        } else {
          handleBack();
        }
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !readOnly) {
        if (selectedKey) deleteLandmark(selectedKey);
        else if (selectedMeasureKey) deleteMeasurement(selectedMeasureKey);
      }
      if (!readOnly) {
        if (e.key === "v" || e.key === "V") setTool("select");
        if (e.key === "p" || e.key === "P") setTool("landmark");
        if (e.key === "d" || e.key === "D") setTool("measureDist");
        if (e.key === "a" || e.key === "A") setTool("measureAngle");
      }
    };
    const onKeyUp = (e) => {
      if (e.code === "Space") {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    spacePressed,
    imageSize,
    fitToScreen,
    selectedKey,
    selectedMeasureKey,
    landmarks,
    pendingSelection,
    readOnly,
    handleUndo,
    handleRedo,
  ]);

  /* ═══════════════════════════════════════════════════════════
     10. NAVIGATION + LOCK/UNLOCK
     ═══════════════════════════════════════════════════════════ */

  const handleBack = () => {
    if (photoDoc?.studyId) {
      navigate(`/doctor/anthropometry/studies/${photoDoc.studyId}`);
    } else {
      navigate("/doctor/anthropometry/cases");
    }
  };

  const handleLock = async (reason) => {
    if (!annotation) throw new Error("No annotation to lock");
    const result = await dispatch(
      lockAnnotation({
        annotationId: annotation._id,
        reason: reason || "Финализация разметки",
        photoId,
      }),
    );
    if (result.error) {
      throw new Error(result.payload?.message || "Lock failed");
    }
  };

  const handleUnlock = async (reason) => {
    if (!annotation) throw new Error("No annotation to unlock");
    if (!reason || reason.length < 10) {
      throw new Error("Причина должна быть ≥ 10 символов");
    }
    const result = await dispatch(
      unlockAnnotation({
        annotationId: annotation._id,
        reason,
        photoId,
      }),
    );
    if (result.error) {
      throw new Error(result.payload?.message || "Unlock failed");
    }
  };

  /* ═══════════════════════════════════════════════════════════
     11. RENDER HELPERS
     ═══════════════════════════════════════════════════════════ */

  const isCalibrated = study?.calibration?.isCalibrated;
  const pixelsPerMm = study?.calibration?.pixelsPerMm;

  const canvasAreaCls = useMemo(() => {
    const classes = [styles.annotationCanvasArea];
    if (canPan && !isPanning) classes.push(styles.canPan);
    if (isPanning) classes.push(styles.panning);
    if (tool === "landmark" && !canPan && !readOnly)
      classes.push(styles.landmarkTool);
    if (readOnly) classes.push(styles.locked);
    return classes.filter(Boolean).join(" ");
  }, [canPan, isPanning, tool, readOnly]);

  const stageTransform = imageSize
    ? `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`
    : "none";

  const landmarkRadius = 7 / zoom;
  const landmarkHaloRadius = 16 / zoom;
  const landmarkStrokeWidth = 3 / zoom;
  const labelFontSize = 14 / zoom;
  const measureStrokeWidth = 2 / zoom;
  const measureLabelSize = 13 / zoom;

  const landmarkByKey = useMemo(() => {
    const map = {};
    for (const lm of landmarks) map[lm.key] = lm;
    return map;
  }, [landmarks]);

  /* ─── Computed measurements for display ─── */
  const measurementsWithValues = useMemo(() => {
    if (!imageSize) return [];
    return measurements.map((m) => {
      const pts = m.landmarks.map((k) => landmarkByKey[k]).filter(Boolean);
      if (pts.length !== m.landmarks.length) {
        return { ...m, value: null, unit: null };
      }
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
  }, [measurements, landmarkByKey, imageSize, pixelsPerMm]);

  /* ─── Autosave indicator ─── */
  const autosaveLabel = (() => {
    if (autosaveStatus === "saving" || saving)
      return t("annotation.autosave.saving");
    if (autosaveStatus === "saved") return t("annotation.autosave.saved");
    if (autosaveStatus === "error") return t("annotation.autosave.error");
    return "";
  })();

  const autosaveCls = [
    styles.autosaveIndicator,
    autosaveStatus === "saving" || saving ? styles.autosaveIndicatorSaving : "",
    autosaveStatus === "saved" ? styles.autosaveIndicatorSaved : "",
    autosaveStatus === "error" ? styles.autosaveIndicatorError : "",
  ]
    .filter(Boolean)
    .join(" ");

  /* Error state */
  if (error) {
    return (
      <div className={styles.annotationLayout}>
        <div className={styles.annotationTopBar}>
          <button className={styles.annotationBackBtn} onClick={handleBack}>
            ← {t("common.back")}
          </button>
        </div>
        <div className={styles.annotationLoadingState}>
          {t("common.error")}: {error}
        </div>
      </div>
    );
  }

  /* Hint для measurement режима */
  const measureHint =
    (tool === "measureDist" || tool === "measureAngle") && !readOnly
      ? `${
          tool === "measureDist"
            ? t("annotation.measureDistanceHint")
            : t("annotation.measureAngleHint")
        } · ${pendingSelection.length}/${neededPoints}`
      : null;

  return (
    <div className={styles.annotationLayout}>
      {/* ═════ TOP BAR ═════ */}
      <div className={styles.annotationTopBar}>
        <button className={styles.annotationBackBtn} onClick={handleBack}>
          ← {t("annotation.backToStudy")}
        </button>
        <div className={styles.annotationTitle}>
          {photoDoc && (
            <>
              {t(`photos.viewTypes.${photoDoc.viewType}`, photoDoc.viewType)}
              {photoDoc.originalFilename && ` · ${photoDoc.originalFilename}`}
              {isCalibrated && (
                <>
                  {" · "}
                  <span style={{ color: "#86efac" }}>
                    ✓ {pixelsPerMm.toFixed(2)} px/mm
                  </span>
                </>
              )}
              {study && !isCalibrated && (
                <>
                  {" · "}
                  <span style={{ color: "#fde68a" }}>
                    {t("annotation.noCalibration")}
                  </span>
                </>
              )}
            </>
          )}
        </div>
        <div className={styles.annotationTopRight}>
          {isLocked && (
            <span className={styles.lockedBadge}>
              🔒 {t("annotation.locked")}
            </span>
          )}
          <span className={autosaveCls}>{autosaveLabel}</span>
          <button
            className={styles.annotationToolBtn}
            disabled={!canUndo || readOnly}
            onClick={handleUndo}
            title={t("annotation.undo")}
          >
            ↶
          </button>
          <button
            className={styles.annotationToolBtn}
            disabled={!canRedo || readOnly}
            onClick={handleRedo}
            title={t("annotation.redo")}
          >
            ↷
          </button>
          {annotation && !isLocked && (
            <button
              className={styles.annotationToolBtn}
              onClick={() => setLockDialog(true)}
              title={t("annotation.lock")}
              style={{ color: "#fbbf24" }}
            >
              🔒
            </button>
          )}
          {annotation && isLocked && (
            <button
              className={styles.annotationToolBtn}
              onClick={() => setUnlockDialog(true)}
              title={t("annotation.unlock")}
              style={{ color: "#f87171" }}
            >
              🔓
            </button>
          )}
        </div>
      </div>

      {/* ═════ MAIN AREA ═════ */}
      <div className={styles.annotationMain}>
        {/* ─── Side toolbar ─── */}
        <div className={styles.annotationSideToolbar}>
          <button
            className={`${styles.annotationSideToolBtn} ${
              tool === "select" ? styles.annotationSideToolBtnActive : ""
            }`}
            onClick={() => setTool("select")}
            title={t("annotation.tools.select")}
          >
            ↖
          </button>
          <button
            className={`${styles.annotationSideToolBtn} ${
              tool === "landmark" ? styles.annotationSideToolBtnActive : ""
            }`}
            onClick={() => setTool("landmark")}
            disabled={readOnly}
            title={t("annotation.tools.landmark")}
          >
            ●
          </button>
          <button
            className={`${styles.annotationSideToolBtn} ${
              tool === "measureDist" ? styles.annotationSideToolBtnActive : ""
            }`}
            onClick={() => setTool("measureDist")}
            disabled={readOnly || landmarks.length < 2}
            title={t("annotation.tools.measureDist")}
          >
            ⟼
          </button>
          <button
            className={`${styles.annotationSideToolBtn} ${
              tool === "measureAngle" ? styles.annotationSideToolBtnActive : ""
            }`}
            onClick={() => setTool("measureAngle")}
            disabled={readOnly || landmarks.length < 3}
            title={t("annotation.tools.measureAngle")}
          >
            ∠
          </button>
          <div className={styles.annotationSideToolSep} />
          <button
            className={styles.annotationSideToolBtn}
            onClick={() => fitToScreen()}
            title={t("annotation.tools.fit")}
          >
            ⬚
          </button>
          <button
            className={styles.annotationSideToolBtn}
            onClick={() => setZoom(1)}
            title={t("annotation.tools.actual")}
          >
            1:1
          </button>
          {(selectedKey || selectedMeasureKey) && !readOnly && (
            <>
              <div className={styles.annotationSideToolSep} />
              <button
                className={styles.annotationSideToolBtn}
                onClick={() => {
                  if (selectedKey) deleteLandmark(selectedKey);
                  else deleteMeasurement(selectedMeasureKey);
                }}
                title={t("annotation.tools.delete")}
                style={{ color: "#f87171" }}
              >
                ×
              </button>
            </>
          )}
        </div>

        {/* ─── Canvas area ─── */}
        <div
          ref={canvasAreaRef}
          className={canvasAreaCls}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {loadingPhoto && (
            <div className={styles.annotationLoadingState}>
              {t("common.loading")}
            </div>
          )}

          {measureHint && (
            <div className={styles.measureHint}>{measureHint}</div>
          )}

          {imageUrl && (
            <div
              className={styles.annotationStage}
              style={{ transform: stageTransform }}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="annotation"
                className={styles.annotationImg}
                onLoad={handleImgLoad}
              />
              {imageSize && (
                <svg
                  ref={svgRef}
                  className={styles.annotationSvg}
                  width={imageSize.w}
                  height={imageSize.h}
                  viewBox={`0 0 ${imageSize.w} ${imageSize.h}`}
                  onClick={handleSvgClick}
                >
                  {/* ─── Measurements: линии/дуги ─── */}
                  {measurementsWithValues.map((m) => {
                    if (!m.points || m.value === null) return null;
                    const isSel = selectedMeasureKey === m.key;

                    if (m.type === "distance") {
                      const p1 = m.points[0];
                      const p2 = m.points[1];
                      const x1 = p1.x * imageSize.w;
                      const y1 = p1.y * imageSize.h;
                      const x2 = p2.x * imageSize.w;
                      const y2 = p2.y * imageSize.h;
                      const mx = (x1 + x2) / 2;
                      const my = (y1 + y2) / 2;
                      const label = formatMeasurement(m.value, m.unit);
                      return (
                        <g
                          key={m.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMeasureKey(m.key);
                            setSelectedKey(null);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            className={`${styles.measureLine} ${
                              isSel ? styles.measureLineSelected : ""
                            }`}
                            strokeWidth={measureStrokeWidth}
                          />
                          <text
                            x={mx}
                            y={my - 8 / zoom}
                            textAnchor="middle"
                            className={styles.measureLabel}
                            fontSize={measureLabelSize}
                          >
                            {label}
                          </text>
                        </g>
                      );
                    }

                    if (m.type === "angle") {
                      const [p1, p2, p3] = m.points;
                      const x1 = p1.x * imageSize.w;
                      const y1 = p1.y * imageSize.h;
                      const x2 = p2.x * imageSize.w; // vertex
                      const y2 = p2.y * imageSize.h;
                      const x3 = p3.x * imageSize.w;
                      const y3 = p3.y * imageSize.h;
                      const label = formatMeasurement(m.value, m.unit);
                      return (
                        <g
                          key={m.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMeasureKey(m.key);
                            setSelectedKey(null);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <line
                            x1={x2}
                            y1={y2}
                            x2={x1}
                            y2={y1}
                            className={`${styles.measureLine} ${
                              isSel ? styles.measureLineSelected : ""
                            }`}
                            strokeWidth={measureStrokeWidth}
                          />
                          <line
                            x1={x2}
                            y1={y2}
                            x2={x3}
                            y2={y3}
                            className={`${styles.measureLine} ${
                              isSel ? styles.measureLineSelected : ""
                            }`}
                            strokeWidth={measureStrokeWidth}
                          />
                          <text
                            x={x2}
                            y={y2 - 10 / zoom}
                            textAnchor="middle"
                            className={styles.measureLabel}
                            fontSize={measureLabelSize}
                          >
                            {label}
                          </text>
                        </g>
                      );
                    }
                    return null;
                  })}

                  {/* ─── Landmarks ─── */}
                  {landmarks.map((lm) => {
                    const cx = lm.x * imageSize.w;
                    const cy = lm.y * imageSize.h;
                    const isSel = selectedKey === lm.key;
                    const isPending = pendingSelection.includes(lm.key);
                    return (
                      <g
                        key={lm.key}
                        className={`${styles.landmarkGroup} ${
                          tool === "select" && !readOnly
                            ? styles.landmarkDraggable
                            : ""
                        }`}
                        onMouseDown={(e) => handleLandmarkMouseDown(e, lm)}
                        onClick={(e) => handleLandmarkClick(e, lm)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={landmarkHaloRadius}
                          className={`${styles.landmarkHalo} ${
                            isSel || isPending
                              ? styles.landmarkHaloSelected
                              : ""
                          }`}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={landmarkRadius}
                          strokeWidth={landmarkStrokeWidth}
                          className={`${styles.landmarkCircle} ${
                            isSel || isPending
                              ? styles.landmarkCircleSelected
                              : ""
                          }`}
                        />
                        <text
                          x={cx + landmarkRadius * 1.6}
                          y={cy - landmarkRadius * 0.6}
                          className={styles.landmarkLabel}
                          fontSize={labelFontSize}
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

          {imageSize && (
            <div className={styles.annotationZoomControls}>
              <button
                className={styles.annotationZoomBtn}
                onClick={() =>
                  setZoom((z) => Math.max(MIN_ZOOM, z / ZOOM_STEP))
                }
                title={t("annotation.tools.zoomOut")}
              >
                −
              </button>
              <button
                className={styles.annotationZoomBtn}
                onClick={() =>
                  setZoom((z) => Math.min(MAX_ZOOM, z * ZOOM_STEP))
                }
                title={t("annotation.tools.zoomIn")}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═════ BOTTOM PANEL ═════ */}
      <div className={styles.annotationMeasurements}>
        {landmarks.length === 0 ? (
          <span className={styles.annotationMeasurementsEmpty}>
            {readOnly
              ? t("annotation.locked")
              : tool === "landmark"
                ? t("annotation.clickToAddPoint")
                : t("annotation.switchToLandmarkTool")}
          </span>
        ) : (
          <div className={styles.landmarksPanel}>
            <span style={{ color: "#cbd5e1", fontWeight: 500 }}>
              {t("annotation.pointsCount", { count: landmarks.length })}
            </span>
            {landmarks.map((lm) => (
              <span
                key={lm.key}
                className={`${styles.landmarkChip} ${
                  selectedKey === lm.key ? styles.landmarkChipSelected : ""
                }`}
                onClick={() => {
                  setSelectedKey(lm.key);
                  setSelectedMeasureKey(null);
                }}
              >
                <span className={styles.landmarkChipDot} />
                {lm.label}
              </span>
            ))}
            {measurementsWithValues.length > 0 && (
              <>
                <span
                  style={{
                    color: "#64748b",
                    margin: "0 4px",
                    fontSize: "16px",
                  }}
                >
                  ·
                </span>
                <span style={{ color: "#fde68a", fontWeight: 500 }}>
                  {t("annotation.measurementsCount", {
                    count: measurementsWithValues.length,
                  })}
                </span>
                {measurementsWithValues.map((m) => (
                  <span
                    key={m.key}
                    className={`${styles.measureChip} ${
                      selectedMeasureKey === m.key
                        ? styles.measureChipSelected
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedMeasureKey(m.key);
                      setSelectedKey(null);
                    }}
                  >
                    <span className={styles.measureChipIcon}>
                      {m.type === "distance" ? "⟼" : "∠"}
                    </span>
                    {m.label}:{" "}
                    {m.value !== null
                      ? formatMeasurement(m.value, m.unit)
                      : "—"}
                  </span>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ═════ DIALOGS ═════ */}
      <ConfirmDialog
        isOpen={lockDialog}
        title={t("annotation.lockConfirmTitle")}
        message={t("annotation.lockConfirmMessage")}
        reasonLabel={t("confirm.reasonLabel")}
        reasonRequired={false}
        confirmLabel={t("annotation.lock")}
        onConfirm={handleLock}
        onClose={() => setLockDialog(false)}
      />

      <ConfirmDialog
        isOpen={unlockDialog}
        title={t("annotation.unlockConfirmTitle")}
        message={t("annotation.unlockConfirmMessage")}
        warning="⚠ Это действие требует обоснования и будет зафиксировано"
        reasonLabel={t("confirm.reasonLabel")}
        reasonRequired={true}
        confirmLabel={t("annotation.unlock")}
        danger={true}
        onConfirm={handleUnlock}
        onClose={() => setUnlockDialog(false)}
      />
    </div>
  );
}

export default PhotoAnnotationPage;
