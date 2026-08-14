// src/pages/simulation/components/editor/SimulationEditor.jsx
//
// S.7.7+ финальная версия:
//   • Multi-face: switchFace, handleSwitchFace
//   • Manual Landmark Wizard: useManualLandmarkWizard, ManualLandmarkWizard
//   • Properties panel в правой колонке под Measurements
//   • Rotation retry: rotationUsed проброшен в LandmarksPanel для бэджа
//
//   • S.7.7+ FIX (manual point deformation): wizard создаёт ОДНОВРЕМЕННО
//     landmark + control point на каждом клике. Control points от wizard'а
//     помечаются source: "manual_wizard".
//
//   • S.7.7+ Cleanup actions:
//       1. handleUndoStep            — alias для history.undo
//       2. handleDeleteManualPoints  — «бейкает» текущий warp + удаляет
//                                       manual_wizard точки. У оставшихся
//                                       точек anchor = current (без
//                                       двойной деформации).
//       3. handleResetAll            — bake → null, points → [],
//                                       история очищается.
//
//   • S.7.7+ FIX (bake fallback flicker):
//     Раньше после bake'а через ~1сек картинка возвращалась к оригиналу.
//     Причина: SimulationCanvas при отсутствии warpedImageData падает
//     на `preview.bitmap` (оригинал, грузится один раз). Я подменял
//     только preview.imageData, но не bitmap. Теперь:
//       • bakedImageData → конвертируется в bakedBitmap через
//         createImageBitmap (async)
//       • effectivePreview.bitmap = bakedBitmap (когда готов)
//       • любой canvas fallback идёт на бакнутую картинку, не оригинал
//       • warpedImageData копируется перед bake (defensive copy против
//         мутации буфера в WebWorker'е)

import React, {
  useCallback,
  useRef,
  useEffect,
  useState,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import SimulationCanvas from "./SimulationCanvas.jsx";
import EditorToolbar from "./EditorToolbar.jsx";
import ControlPointLayer from "./ControlPointLayer.jsx";
import PointPropertiesPanel from "./PointPropertiesPanel.jsx";
import LandmarksOverlay from "./LandmarksOverlay.jsx";
import LandmarksPanel from "./LandmarksPanel.jsx";
import MeasurementsOverlay from "./MeasurementsOverlay.jsx";
import MeasurementsPanel from "./MeasurementsPanel.jsx";
import ManualLandmarkWizard from "./ManualLandmarkWizard.jsx";

import { useIsMobile } from "../../hooks/useIsMobile.js";
import { useZoomPan } from "../../hooks/useZoomPan.js";
import { useCanvasImage } from "../../hooks/useCanvasImage.js";
import { useWarpEngine } from "../../hooks/useWarpEngine.js";
import { useControlPoints } from "../../hooks/useControlPoints.js";
import { useUndoRedo } from "../../hooks/useUndoRedo.js";
import { useAutosave } from "../../hooks/useAutosave.js";
import { useLandmarksDetection } from "../../hooks/useLandmarksDetection.js";
import { useManualLandmarkWizard } from "../../hooks/useManualLandmarkWizard.js";

import {
  computeFitViewport,
  pointerToImage,
  imageToNormalized,
} from "../../utils/coordinateHelpers.js";

import {
  updatePlan,
  setCurrentControlPoints,
} from "../../store/simulationSlice.js";

import styles from "./SimulationEditor.module.css";

const MANUAL_WIZARD_SOURCE = "manual_wizard";

/**
 * Глубокая копия ImageData. Защищает от ситуации когда warp engine
 * переиспользует тот же буфер и перезаписывает его на следующем warp'е,
 * мутируя нашу «зафиксированную» картинку.
 */
function cloneImageData(imageData) {
  if (!imageData) return null;
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height,
  );
}

const PANEL_WIDTH = 290;
const PANEL_WIDTH_TABLET = 250;

const desktopLeftPanelStyle = (isTablet) => ({
  position: "absolute",
  insetInlineStart: 16,
  top: 16,
  bottom: 16,
  width: isTablet ? PANEL_WIDTH_TABLET : PANEL_WIDTH,
  overflowY: "auto",
  overflowX: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  zIndex: 8,
  WebkitOverflowScrolling: "touch",
});

const desktopRightPanelStyle = (isTablet) => ({
  position: "absolute",
  insetInlineEnd: 16,
  top: 16,
  bottom: 16,
  width: isTablet ? PANEL_WIDTH_TABLET : PANEL_WIDTH,
  overflowY: "auto",
  overflowX: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  zIndex: 8,
  WebkitOverflowScrolling: "touch",
});

const portalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.55)",
  zIndex: 99998,
  pointerEvents: "auto",
};

const portalSheetStyle = {
  position: "fixed",
  insetInlineStart: 0,
  insetInlineEnd: 0,
  bottom: 0,
  width: "100%",
  maxHeight: "75vh",
  background: "rgba(15, 20, 32, 0.98)",
  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "16px 16px 0 0",
  padding: 16,
  zIndex: 99999,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
  pointerEvents: "auto",
  WebkitOverflowScrolling: "touch",
};

const mobileFabStyle = (side, color) => ({
  position: "absolute",
  bottom: 16,
  [side === "left" ? "insetInlineStart" : "insetInlineEnd"]: 16,
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: color,
  color: "white",
  border: "none",
  fontSize: 22,
  fontWeight: 700,
  zIndex: 26,
  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const mobileFab3rdStyle = {
  position: "absolute",
  bottom: 84,
  insetInlineEnd: 16,
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: "rgba(168, 85, 247, 0.95)",
  color: "white",
  border: "none",
  fontSize: 18,
  fontWeight: 700,
  zIndex: 26,
  boxShadow: "0 4px 16px rgba(168, 85, 247, 0.4)",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const mobileDragHandleStyle = {
  width: 40,
  height: 4,
  background: "rgba(255, 255, 255, 0.25)",
  borderRadius: 2,
  margin: "-4px auto 12px",
  flexShrink: 0,
};

function MobileBottomSheet({ open, onClose, children }) {
  if (!open) return null;
  return createPortal(
    <>
      <div style={portalOverlayStyle} onClick={onClose} />
      <div style={portalSheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={mobileDragHandleStyle} />
        {children}
      </div>
    </>,
    document.body,
  );
}

export default function SimulationEditor({ plan }) {
  const { t } = useTranslation("Simulation");
  const dispatch = useDispatch();
  const planId = plan?.id;
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1280 : false,
  );

  useEffect(() => {
    const onResize = () => setIsTablet(window.innerWidth <= 1280);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const {
    viewport,
    viewportRef,
    handleWheel,
    startGesture,
    updateGesture,
    endGesture,
    zoomIn,
    zoomOut,
    reset,
    setViewport,
  } = useZoomPan();

  const { preview, loading, error, attempt, maxAttempts } = useCanvasImage(
    plan?.photo?.url,
  );

  // ═══════════════════════════════════════════════════════════════════════
  // S.7.7+ — Bake state (запечённая база после удаления ручных точек)
  // ═══════════════════════════════════════════════════════════════════════
  //
  // bakedImageData — ImageData, подменяет preview.imageData как source warp'а
  // bakedBitmap    — ImageBitmap, подменяет preview.bitmap для рендера
  //                   в SimulationCanvas (когда warpedImageData отсутствует
  //                   или engine ещё не дал output, canvas делает fallback
  //                   на bitmap. БЕЗ этой подмены fallback падал на
  //                   оригинальную фотку, и результат «исчезал».)

  const [bakedImageData, setBakedImageData] = useState(null);
  const [bakedBitmap, setBakedBitmap] = useState(null);

  // Конвертируем bakedImageData → bakedBitmap асинхронно.
  // createImageBitmap возвращает Promise<ImageBitmap>.
  useEffect(() => {
    if (!bakedImageData) {
      setBakedBitmap((prev) => {
        prev?.close?.();
        return null;
      });
      return undefined;
    }

    let cancelled = false;
    createImageBitmap(bakedImageData).then(
      (bmp) => {
        if (cancelled) {
          bmp.close?.();
          return;
        }
        setBakedBitmap((prev) => {
          prev?.close?.();
          return bmp;
        });
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error("[SimulationEditor] Failed to create baked bitmap:", err);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [bakedImageData]);

  // Cleanup ImageBitmap'а при unmount, чтобы не утекала память.
  useEffect(() => {
    return () => {
      bakedBitmap?.close?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Эффективный preview — с учётом баки.
  // ВАЖНО: подменяются ОБА поля — imageData (для warp engine) и bitmap
  // (для canvas fallback). Без подмены bitmap'а canvas рисовал оригинал
  // когда warpedImageData отсутствовал → отсюда «исчезновение результата
  // через секунду».
  const effectivePreview = useMemo(() => {
    if (!preview) return null;
    if (!bakedImageData) return preview;
    return {
      ...preview,
      imageData: bakedImageData,
      // Пока bakedBitmap ещё не создан (createImageBitmap асинхронный),
      // оставляем оригинал — это ~10-50мс окно, в котором warpedImageData
      // обычно ещё не успел измениться.
      bitmap: bakedBitmap || preview.bitmap,
    };
  }, [preview, bakedImageData, bakedBitmap]);

  // Сбрасываем bake при смене плана (новая фотография — старая бака
  // уже не релевантна).
  useEffect(() => {
    setBakedImageData(null);
  }, [planId]);

  const { warpedImageData, warpRegion, isWarping, scheduleWarp } = useWarpEngine(
    { sourceImageData: effectivePreview?.imageData },
  );

  const canvasContainerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [didInitialFit, setDidInitialFit] = useState(false);

  const [mobileOpenPanel, setMobileOpenPanel] = useState(null);

  const handleSizeChange = useCallback((size) => {
    setCanvasSize({ width: size.width, height: size.height });
  }, []);

  const doFit = useCallback(() => {
    if (!preview || !canvasSize.width) return;
    const fitted = computeFitViewport({
      canvasW: canvasSize.width,
      canvasH: canvasSize.height,
      imageW: preview.width,
      imageH: preview.height,
      padding: 30,
    });
    setViewport(fitted);
    setDidInitialFit(true);
  }, [preview, canvasSize, setViewport]);

  useEffect(() => {
    if (preview && !didInitialFit && canvasSize.width) doFit();
  }, [preview, didInitialFit, canvasSize, doFit]);

  useEffect(() => {
    if (didInitialFit && canvasSize.width) doFit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.width, canvasSize.height]);

  const historyRef = useRef(null);
  const autosaveRef = useRef(null);

  const onSave = useCallback(
    async (nextPoints) => {
      if (!planId) return;
      await dispatch(
        updatePlan({ id: planId, patch: { controlPoints: nextPoints } }),
      ).unwrap();
    },
    [dispatch, planId],
  );

  const autosave = useAutosave({ onSave });
  autosaveRef.current = autosave;

  const onCommit = useCallback(
    (next) => {
      historyRef.current?.push(next);
      autosaveRef.current?.markDirty(next);
      dispatch(setCurrentControlPoints(next));
    },
    [dispatch],
  );

  const {
    points,
    selectedKey,
    mode,
    setSelectedKey,
    setMode,
    addPoint,
    deletePoint,
    updatePoint,
    startDragCurrent,
    updateDragCurrent,
    endDragCurrent,
    startDragAnchor,
    updateDragAnchor,
    endDragAnchor,
    startDragRadius,
    updateDragRadius,
    endDragRadius,
    syncFromExternal,
    commitPoints,
  } = useControlPoints({
    initialPoints: plan?.controlPoints || [],
    onCommit,
  });

  const onApply = useCallback(
    (next) => {
      syncFromExternal(next);
      autosaveRef.current?.markDirty(next);
      dispatch(setCurrentControlPoints(next));
    },
    [dispatch, syncFromExternal],
  );

  const history = useUndoRedo({
    initial: plan?.controlPoints || [],
    onApply,
  });
  historyRef.current = history;

  // Multi-face support + rotation retry
  const {
    isLoaderReady: landmarksLoaderReady,
    detect: redetectLandmarks,
    switchFace,
    rotationUsed,
  } = useLandmarksDetection({
    imageUrl: plan?.photo?.url,
    autoDetect: !plan?.landmarks || plan.landmarks.length === 0,
  });

  // S.7.7+ — wizard вызывает addPoint при каждом клике, помечая точку
  // как manual_wizard для возможности bulk-удаления потом.
  const handleWizardPointPlaced = useCallback(
    (normPoint) => {
      addPoint(normPoint, { source: MANUAL_WIZARD_SOURCE });
    },
    [addPoint],
  );

  const wizard = useManualLandmarkWizard({
    onPointPlaced: handleWizardPointPlaced,
  });

  const onLandmarkClick = useCallback(
    (normPoint) => {
      addPoint(normPoint);
      if (isMobile) setMobileOpenPanel(null);
    },
    [addPoint, isMobile],
  );

  const prevPlanIdRef = useRef(planId);
  useEffect(() => {
    if (planId !== prevPlanIdRef.current) {
      syncFromExternal(plan?.controlPoints || []);
      history.replace(plan?.controlPoints || []);
      prevPlanIdRef.current = planId;
      if (wizard.active) wizard.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  useEffect(() => {
    if (!effectivePreview) return;
    scheduleWarp(points);
  }, [effectivePreview, points, scheduleWarp]);

  useEffect(() => {
    return () => {
      autosaveRef.current?.forceSave();
    };
  }, []);

  /* ════════════════ S.7.7+ Cleanup actions ════════════════ */

  // Step-by-step undo (alias для history.undo, видимая кнопка).
  const handleUndoStep = useCallback(() => {
    historyRef.current?.undo();
  }, []);

  // Удалить только manual_wizard точки.
  // Чтобы визуальный результат не пропал — берём текущий warpedImageData
  // и делаем его новой базой (bake). У оставшихся точек anchor = current,
  // чтобы избежать двойной деформации запечённой картинки.
  const handleDeleteManualPoints = useCallback(() => {
    const hasManual = points.some((p) => p.source === MANUAL_WIZARD_SOURCE);
    if (!hasManual) return;

    if (
      !window.confirm(
        t("manualLandmarks.confirmDelete", {
          defaultValue:
            "Удалить все точки ручной разметки?\n\nТекущий результат редактирования будет зафиксирован — изображение не изменится визуально.",
        }),
      )
    ) {
      return;
    }

    // 1. Бейкаем текущий warp как новую базу.
    //    КРИТИЧНО — делаем глубокую копию ImageData, потому что warp engine
    //    может переиспользовать тот же буфер (transferable WebWorker
    //    или общий ArrayBuffer). Без копии следующий warp перезапишет
    //    нашу зафиксированную картинку → визуально она «исчезнет».
    if (warpedImageData) {
      setBakedImageData(cloneImageData(warpedImageData));
    }

    // 2. Фильтруем manual точки. У оставшихся anchor = current, чтобы
    //    они не пытались повторно деформировать уже запечённую картинку.
    const remaining = points
      .filter((p) => p.source !== MANUAL_WIZARD_SOURCE)
      .map((p) => ({
        ...p,
        anchor: { ...p.current },
      }));

    // 3. Коммитим (history.push + autosave + redux)
    commitPoints(remaining, { action: "delete-manual-points" });
  }, [points, warpedImageData, commitPoints, t]);

  // Полный сброс: bake → null, points → [], history очищается.
  const handleResetAll = useCallback(() => {
    const hasAnything = points.length > 0 || bakedImageData !== null;
    if (!hasAnything) return;

    if (
      !window.confirm(
        t("manualLandmarks.confirmResetAll", {
          defaultValue:
            "Сбросить ВСЕ правки и вернуться к исходной фотографии?\n\nЭто действие нельзя отменить.",
        }),
      )
    ) {
      return;
    }

    setBakedImageData(null);
    commitPoints([], { action: "reset-all" });
    historyRef.current?.replace([]);
    setSelectedKey(null);
  }, [points, bakedImageData, commitPoints, setSelectedKey, t]);

  /* ════════════════ End cleanup actions ════════════════ */

  /* ══════════════════════════════════════════════════════════════════════
     Указатели.

     Раньше состояние перетаскивания было ОДНОЙ переменной на весь редактор.
     Стоило коснуться экрана вторым пальцем или положить ладонь рядом со
     стилусом — приходил второй pointerdown и затирал состояние: начатое
     перетаскивание точки бросалось на полпути и превращалось в панораму.

     Теперь ведётся реестр активных указателей по pointerId, а жест —
     явная сущность:
       kind: "gesture" — панорама одним указателем и щипок двумя;
             "current" / "anchor" — перетаскивание ручки точки.

     Пока тянут точку, любые новые указатели игнорируются целиком. Это и
     есть отклонение ладони: она физически не может перехватить жест.
     ══════════════════════════════════════════════════════════════════════ */

  const surfaceRef = useRef(null); // контейнер канваса — система координат
  const pointersRef = useRef(new Map()); // pointerId → {x, y, type}
  const gestureRef = useRef(null);

  /** Центроид указателей в координатах канваса + расстояние между двумя. */
  const readGeometry = useCallback((el) => {
    const pts = [...pointersRef.current.values()];
    const n = pts.length;
    if (!n || !el) return null;
    const rect = el.getBoundingClientRect();
    let sx = 0;
    let sy = 0;
    for (const p of pts) {
      sx += p.x;
      sy += p.y;
    }
    let dist = 0;
    if (n >= 2) {
      dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
    return { cx: sx / n - rect.left, cy: sy / n - rect.top, dist, n };
  }, []);

  /** Пересобрать базу жеста — при смене числа указателей. */
  const rebaseGesture = useCallback(
    (el) => {
      const g = readGeometry(el);
      if (!g) return;
      startGesture();
      gestureRef.current = {
        kind: "gesture",
        startCx: g.cx,
        startCy: g.cy,
        startDist: g.dist,
      };
    },
    [readGeometry, startGesture],
  );

  // Живая ссылка на точки: обработчики указателя читают её вместо того,
  // чтобы держать `points` в зависимостях. Иначе колбэки пересоздавались бы
  // на каждое движение, пропсы ручек менялись бы, и мемоизация из пункта 4
  // не работала бы вовсе.
  const pointsLiveRef = useRef(points);
  pointsLiveRef.current = points;

  const releaseDrag = useCallback(() => {
    const g = gestureRef.current;
    if (!g) return false;
    gestureRef.current = null;
    if (g.kind === "gesture") endGesture();
    else if (g.kind === "current") endDragCurrent();
    else if (g.kind === "anchor") endDragAnchor();
    else if (g.kind === "radius") endDragRadius();
    return true;
  }, [endGesture, endDragCurrent, endDragAnchor, endDragRadius]);

  const getPointerNorm = useCallback(
    (evt, el) => {
      if (!effectivePreview || !el) return null;
      // viewportRef, а не viewport из state: state синхронизируется раз в
      // кадр, и при 240-герцовом стилусе точка отставала бы от пера.
      const imgPt = pointerToImage(evt, el, viewportRef.current);
      return imageToNormalized(
        imgPt.x,
        imgPt.y,
        effectivePreview.width,
        effectivePreview.height,
      );
    },
    [effectivePreview, viewportRef],
  );

  const onPointerDown = useCallback(
    (e) => {
      if (wizard.active) return;

      // Правая кнопка — аварийный сброс залипшего жеста.
      if (e.button === 2) {
        if (gestureRef.current) {
          e.preventDefault();
          e.stopPropagation();
          releaseDrag();
        }
        return;
      }
      if (e.pointerType === "mouse" && e.button !== 0) return;

      // Тянем точку — посторонние касания не принимаем вообще.
      const active = gestureRef.current;
      if (active && (active.kind === "current" || active.kind === "anchor")) {
        return;
      }

      pointersRef.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        type: e.pointerType,
      });

      if (mode === "add" && pointersRef.current.size === 1) {
        const norm = getPointerNorm(e, surfaceRef.current);
        if (norm) addPoint(norm);
        return;
      }

      if (pointersRef.current.size > 2) return; // третий палец лишний

      try {
        canvasContainerRef.current?.setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
      rebaseGesture(surfaceRef.current);
    },
    [wizard.active, mode, getPointerNorm, addPoint, releaseDrag, rebaseGesture],
  );

  const onPointerMove = useCallback(
    (e) => {
      const g = gestureRef.current;
      if (!g) return;

      if (pointersRef.current.has(e.pointerId)) {
        pointersRef.current.set(e.pointerId, {
          x: e.clientX,
          y: e.clientY,
          type: e.pointerType,
        });
      }

      if (g.kind === "gesture") {
        const geo = readGeometry(surfaceRef.current);
        if (!geo) return;
        const scaleRatio =
          g.startDist > 0 && geo.dist > 0 ? geo.dist / g.startDist : 1;
        updateGesture({
          dx: geo.cx - g.startCx,
          dy: geo.cy - g.startCy,
          scaleRatio,
          centerX: g.startCx,
          centerY: g.startCy,
        });
        return;
      }

      // Перетаскивание ручки ведёт РОВНО тот указатель, который его начал.
      if (g.pointerId !== undefined && g.pointerId !== e.pointerId) return;

      // Стилус и мышь отдают промежуточные отсчёты пачкой: браузер
      // объединяет их в одно событие, а исходные доступны только через
      // getCoalescedEvents(). Без него на 120–240 Гц теряются точки и
      // траектория выходит угловатой.
      const samples =
        typeof e.nativeEvent?.getCoalescedEvents === "function"
          ? e.nativeEvent.getCoalescedEvents()
          : null;
      const last = samples && samples.length ? samples[samples.length - 1] : e;

      const norm = getPointerNorm(last, surfaceRef.current);
      if (!norm) return;

      if (g.kind === "radius") {
        // Радиус — расстояние от привязки до указателя, в тех же единицах,
        // в которых он хранится: доля от длинной стороны кадра.
        const p = pointsLiveRef.current.find((it) => it.key === g.key);
        if (!p) return;
        const dx = norm.x - p.anchor.x;
        const dy = norm.y - p.anchor.y;
        const W = effectivePreview?.width || 1;
        const H = effectivePreview?.height || 1;
        const maxDim = Math.max(W, H);
        updateDragRadius(Math.hypot((dx * W) / maxDim, (dy * H) / maxDim));
        return;
      }

      if (g.kind === "current") updateDragCurrent(norm);
      else if (g.kind === "anchor") updateDragAnchor(norm);
    },
    [
      readGeometry,
      updateGesture,
      updateDragCurrent,
      updateDragAnchor,
      updateDragRadius,
      getPointerNorm,
      effectivePreview,
    ],
  );

  const onPointerUp = useCallback(
    (e) => {
      pointersRef.current.delete(e.pointerId);
      try {
        canvasContainerRef.current?.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }

      const g = gestureRef.current;
      if (!g) return;

      if (g.kind === "gesture") {
        if (pointersRef.current.size === 0) {
          releaseDrag();
        } else {
          // Подняли один палец из двух: без пересборки базы оставшийся
          // палец скачком утащил бы картинку на разницу центроидов.
          rebaseGesture(surfaceRef.current);
        }
        return;
      }

      if (g.pointerId === undefined || g.pointerId === e.pointerId) {
        releaseDrag();
      }
    },
    [releaseDrag, rebaseGesture],
  );

  const onDoubleClick = useCallback(
    (e) => {
      if (gestureRef.current) {
        e.preventDefault();
        e.stopPropagation();
        pointersRef.current.clear();
        releaseDrag();
      }
    },
    [releaseDrag],
  );

  const onContextMenu = useCallback(
    (e) => {
      if (gestureRef.current) {
        e.preventDefault();
        pointersRef.current.clear();
        releaseDrag();
      }
    },
    [releaseDrag],
  );

  const beginHandleDrag = useCallback(
    (e, key, kind) => {
      const norm = getPointerNorm(e, surfaceRef.current);
      if (!norm) return;
      // Панорама, если она шла, отменяется — иначе два жеста наложатся.
      if (gestureRef.current?.kind === "gesture") endGesture();
      pointersRef.current.clear();
      gestureRef.current = { kind, key, pointerId: e.pointerId };
      if (kind === "current") startDragCurrent(key, norm);
      else if (kind === "anchor") startDragAnchor(key, norm);
      else if (kind === "radius") startDragRadius(key);
      try {
        canvasContainerRef.current?.setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [
      getPointerNorm,
      startDragCurrent,
      startDragAnchor,
      startDragRadius,
      endGesture,
    ],
  );

  const onHandleCurrentDown = useCallback(
    (e, key) => beginHandleDrag(e, key, "current"),
    [beginHandleDrag],
  );

  const onHandleAnchorDown = useCallback(
    (e, key) => beginHandleDrag(e, key, "anchor"),
    [beginHandleDrag],
  );

  const onHandleRadiusDown = useCallback(
    (e, key) => beginHandleDrag(e, key, "radius"),
    [beginHandleDrag],
  );

  const onOverlayBgClick = useCallback(() => {
    if (mode === "select") setSelectedKey(null);
  }, [mode, setSelectedKey]);

  const handleSwitchFace = useCallback(
    (idx) => {
      switchFace(idx);
      if (isMobile) setMobileOpenPanel(null);
    },
    [switchFace, isMobile],
  );

  const handleStartManualWizard = useCallback(() => {
    wizard.start();
    if (isMobile) setMobileOpenPanel(null);
  }, [wizard, isMobile]);

  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape" && wizard.active) {
        wizard.cancel();
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        historyRef.current?.undo();
        return;
      }
      if (
        (mod && e.shiftKey && e.key.toLowerCase() === "z") ||
        (mod && e.key.toLowerCase() === "y")
      ) {
        e.preventDefault();
        historyRef.current?.redo();
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedKey) {
        e.preventDefault();
        deletePoint(selectedKey);
        return;
      }

      if (e.key === "Escape") {
        releaseDrag();
        setSelectedKey(null);
        setMode("select");
        if (isMobile) setMobileOpenPanel(null);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    selectedKey,
    deletePoint,
    setSelectedKey,
    setMode,
    releaseDrag,
    isMobile,
    wizard,
  ]);

  const selectedPoint = useMemo(
    () => points.find((p) => p.key === selectedKey) || null,
    [points, selectedKey],
  );

  const hasManualWizardPoints = useMemo(
    () => points.some((p) => p.source === MANUAL_WIZARD_SOURCE),
    [points],
  );
  const canResetAll = useMemo(
    () => points.length > 0 || bakedImageData !== null,
    [points.length, bakedImageData],
  );

  useEffect(() => {
    if (
      isMobile &&
      selectedPoint &&
      mobileOpenPanel === null &&
      !wizard.active
    ) {
      setMobileOpenPanel("properties");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, isMobile]);

  useEffect(() => {
    if (!selectedPoint && mobileOpenPanel === "properties") {
      setMobileOpenPanel(null);
    }
  }, [selectedPoint, mobileOpenPanel]);

  if (error) {
    return (
      <div className={styles.editorStatusState}>
        <div className={styles.editorStatusTitle}>
          {t("editor.imageLoadError")}
        </div>
        <div className={styles.editorStatusHint}>{error.message}</div>
      </div>
    );
  }

  if (loading || !preview) {
    const isRetrying = attempt > 1;
    return (
      <div className={styles.editorStatusState}>
        <div className={styles.editorStatusTitle}>
          {isRetrying
            ? t("loadingImageRetry", { attempt, max: maxAttempts })
            : t("editor.loadingImage")}
        </div>
        {isRetrying && (
          <div className={styles.editorStatusHint}>
            {t("loadingImageRetryHint")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={styles.editorRoot}
      ref={canvasContainerRef}
      style={{ touchAction: "none" }}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      /* Движение и отпускание слушаем ЗДЕСЬ, на том же элементе, на который
         ставится setPointerCapture.

         Раньше захват вешался на этот корневой div, а onPointerMove/onPointerUp
         жили на вложенном контейнере канваса. Захват перенаправляет события на
         элемент захвата — то есть сюда, — и до дочернего обработчика они не
         доходили: перетаскивание точки замирало на первом же кадре, а
         pointerup терялся, оставляя жест «залипшим». Отсюда и появились
         аварийные сбросы по двойному клику и правой кнопке.

         Корень — общий предок и канваса, и SVG-оверлея с ручками, поэтому
         сюда доходит и захваченное, и обычное всплывающее событие. */
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <SimulationCanvas
        preview={effectivePreview}
        viewport={viewport}
        warpedImageData={warpedImageData}
        warpRegion={warpRegion}
        onWheel={handleWheel}
        onPointerDown={onPointerDown}
        surfaceRef={surfaceRef}
        onSizeChange={handleSizeChange}
      />

      <LandmarksOverlay
        preview={effectivePreview}
        viewport={viewport}
        canvasSize={canvasSize}
        mode={mode}
        onLandmarkClick={onLandmarkClick}
        wizard={wizard}
      />

      <MeasurementsOverlay
        preview={effectivePreview}
        viewport={viewport}
        canvasSize={canvasSize}
      />

      <ControlPointLayer
        points={points}
        preview={effectivePreview}
        viewport={viewport}
        canvasSize={canvasSize}
        selectedKey={selectedKey}
        mode={mode}
        isMobile={isMobile}
        onBackgroundClick={onOverlayBgClick}
        onSelect={setSelectedKey}
        onCurrentPointerDown={onHandleCurrentDown}
        onAnchorPointerDown={onHandleAnchorDown}
        onRadiusPointerDown={onHandleRadiusDown}
      />

      <EditorToolbar
        viewport={viewport}
        mode={mode}
        onModeChange={setMode}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={history.undo}
        onRedo={history.redo}
        saveStatus={autosave.status}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={reset}
        onFit={doFit}
      />

      <ManualLandmarkWizard wizard={wizard} />

      {/* Desktop layout */}
      {!isMobile && (
        <>
          <div style={desktopLeftPanelStyle(isTablet)}>
            <LandmarksPanel
              onReDetect={redetectLandmarks}
              isLoaderReady={landmarksLoaderReady}
              onSwitchFace={handleSwitchFace}
              onStartManualWizard={handleStartManualWizard}
              rotationUsed={rotationUsed}
              onUndoStep={handleUndoStep}
              canUndo={history.canUndo}
              onDeleteManualPoints={handleDeleteManualPoints}
              hasManualWizardPoints={hasManualWizardPoints}
              onResetAll={handleResetAll}
              canResetAll={canResetAll}
            />
          </div>

          <div style={desktopRightPanelStyle(isTablet)}>
            <MeasurementsPanel />
            {selectedPoint && (
              <PointPropertiesPanel
                point={selectedPoint}
                onChange={(patch) =>
                  selectedKey && updatePoint(selectedKey, patch)
                }
                onDelete={() => selectedKey && deletePoint(selectedKey)}
              />
            )}
          </div>
        </>
      )}

      {/* Mobile FAB-кнопки + Bottom sheets */}
      {isMobile && (
        <>
          <button
            type="button"
            style={mobileFabStyle("left", "rgba(61, 127, 255, 0.95)")}
            onClick={() =>
              setMobileOpenPanel(
                mobileOpenPanel === "landmarks" ? null : "landmarks",
              )
            }
            aria-label={t("landmarks.title")}
          >
            {mobileOpenPanel === "landmarks" ? "✕" : "⊙"}
          </button>

          <button
            type="button"
            style={mobileFabStyle("right", "rgba(34, 197, 94, 0.95)")}
            onClick={() =>
              setMobileOpenPanel(
                mobileOpenPanel === "measurements" ? null : "measurements",
              )
            }
            aria-label={t("measurements.title")}
          >
            {mobileOpenPanel === "measurements" ? "✕" : "📐"}
          </button>

          {selectedPoint && (
            <button
              type="button"
              style={mobileFab3rdStyle}
              onClick={() =>
                setMobileOpenPanel(
                  mobileOpenPanel === "properties" ? null : "properties",
                )
              }
              aria-label="Properties"
            >
              {mobileOpenPanel === "properties" ? "✕" : "⚙"}
            </button>
          )}

          <MobileBottomSheet
            open={mobileOpenPanel === "landmarks"}
            onClose={() => setMobileOpenPanel(null)}
          >
            <LandmarksPanel
              onReDetect={redetectLandmarks}
              isLoaderReady={landmarksLoaderReady}
              onSwitchFace={handleSwitchFace}
              onStartManualWizard={handleStartManualWizard}
              rotationUsed={rotationUsed}
              onUndoStep={handleUndoStep}
              canUndo={history.canUndo}
              onDeleteManualPoints={handleDeleteManualPoints}
              hasManualWizardPoints={hasManualWizardPoints}
              onResetAll={handleResetAll}
              canResetAll={canResetAll}
            />
          </MobileBottomSheet>

          <MobileBottomSheet
            open={mobileOpenPanel === "measurements"}
            onClose={() => setMobileOpenPanel(null)}
          >
            <MeasurementsPanel />
          </MobileBottomSheet>

          <MobileBottomSheet
            open={mobileOpenPanel === "properties" && !!selectedPoint}
            onClose={() => setMobileOpenPanel(null)}
          >
            <PointPropertiesPanel
              point={selectedPoint}
              onChange={(patch) =>
                selectedKey && updatePoint(selectedKey, patch)
              }
              onDelete={() => {
                if (selectedKey) {
                  deletePoint(selectedKey);
                  setMobileOpenPanel(null);
                }
              }}
              inline
            />
          </MobileBottomSheet>
        </>
      )}

      <div className={styles.editorMeta}>
        {effectivePreview.width}×{effectivePreview.height}
        {" · "}
        {t("list.controlPointsCount", { count: points.length })}
        {isWarping && " · ◌"}
        {bakedImageData && " · ●"}
      </div>
    </div>
  );
}
