// src/pages/simulation/hooks/useManualLandmarkWizard.js
//
// S.7.7+ — состояние wizard'а ручной разметки (Manual Landmark Wizard).
//
// Состояние:
//   • active: boolean — wizard сейчас идёт
//   • currentStep: 0..MANUAL_POINTS_COUNT — какой anchor сейчас ставить
//   • marked: { [anchorKey]: { x, y } } — уже размеченные точки
//
// Workflow:
//   start()                        — запустить с шага 0
//   handleClick({x, y})            — записать клик на текущий шаг,
//                                     перейти на следующий. Если все
//                                     anchor'ы размечены, вызывает finish().
//                                     При каждом клике также вызывается
//                                     onPointPlaced(normPoint) — это позволяет
//                                     родителю создать control point на том
//                                     же месте, чтобы лицо реально
//                                     деформировалось.
//   undoLast()                     — откатить последнюю точку
//   cancel()                       — закрыть wizard без применения
//   finish()                       — собрать landmarks через
//                                     fitLandmarksFromManualPoints,
//                                     dispatch setLandmarksFromManualFit,
//                                     persistLandmarks. Wizard закроется.
//
// Параметры:
//   options.onPointPlaced({x, y})  — опциональный колбэк, вызываемый при
//                                     каждом клике в wizard'е. Используется
//                                     в SimulationEditor чтобы одновременно
//                                     с landmark создавать control point
//                                     для деформации лица.
//
// Все координаты — normalized [0..1] на изображении.

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setLandmarksFromManualFit,
  persistLandmarks,
  selectCurrentPlan,
} from "../store/simulationSlice.js";
import { ANCHOR_POINTS } from "../mediapipe/canonicalAnchorPoints.js";
import { fitLandmarksFromManualPoints } from "../mediapipe/manualLandmarkFit.js";

const MODEL_VERSION = "manual_fit@v1";

// S.7.7+ — Сколько точек требуется для завершения ручной разметки.
// Раньше было ANCHOR_POINTS.length (6). Теперь — 1.
// Используется первая anchor-точка из ANCHOR_POINTS.
const MANUAL_POINTS_COUNT = 1;

export function useManualLandmarkWizard(options = {}) {
  const { onPointPlaced } = options;

  const dispatch = useDispatch();
  const currentPlan = useSelector(selectCurrentPlan);

  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [marked, setMarked] = useState({}); // { [key]: {x, y} }

  // Стабильная ссылка на последний onPointPlaced —
  // не пересоздаём handleClick при каждом изменении колбэка.
  const onPointPlacedRef = useRef(onPointPlaced);
  useEffect(() => {
    onPointPlacedRef.current = onPointPlaced;
  }, [onPointPlaced]);

  // Стабильные ссылки, чтобы handleClick не пересоздавался от изменения plan
  const planIdRef = useRef(currentPlan?.id);
  const photoSizeRef = useRef({
    width: currentPlan?.photo?.width,
    height: currentPlan?.photo?.height,
  });

  // Обновляем refs при смене плана
  if (planIdRef.current !== currentPlan?.id) {
    planIdRef.current = currentPlan?.id;
    photoSizeRef.current = {
      width: currentPlan?.photo?.width,
      height: currentPlan?.photo?.height,
    };
  }

  /* ─── Управление ─── */

  const start = useCallback(() => {
    setMarked({});
    setCurrentStep(0);
    setActive(true);
  }, []);

  const cancel = useCallback(() => {
    setActive(false);
    setMarked({});
    setCurrentStep(0);
  }, []);

  const undoLast = useCallback(() => {
    if (currentStep === 0) return;
    const prevIdx = currentStep - 1;
    const prevAnchor = ANCHOR_POINTS[prevIdx];
    if (!prevAnchor) return;
    setMarked((prev) => {
      const next = { ...prev };
      delete next[prevAnchor.key];
      return next;
    });
    setCurrentStep(prevIdx);
  }, [currentStep]);

  /**
   * Финализация: преобразует marked → landmarks и применяет.
   */
  const finishWith = useCallback(
    (allMarked) => {
      const markedArray = ANCHOR_POINTS.filter((a) => allMarked[a.key]).map(
        (a) => ({
          key: a.key,
          x: allMarked[a.key].x,
          y: allMarked[a.key].y,
        }),
      );

      const fitted = fitLandmarksFromManualPoints(markedArray);
      if (fitted.length === 0) {
        // Даже если fit не дал результата — wizard всё равно закрываем.
        // Control point уже создан в handleClick.
        setActive(false);
        setMarked({});
        setCurrentStep(0);
        return;
      }

      // 1. Локальный set — мгновенный рендер
      dispatch(setLandmarksFromManualFit(fitted));

      // 2. Persist на сервере (fire-and-forget)
      const planId = planIdRef.current;
      if (planId) {
        dispatch(
          persistLandmarks({
            id: planId,
            landmarks: fitted,
            meta: {
              modelVersion: MODEL_VERSION,
              imageWidth: photoSizeRef.current.width,
              imageHeight: photoSizeRef.current.height,
              source: "manual_fit",
              anchorCount: fitted.length,
            },
          }),
        );
      }

      // 3. Закрываем wizard
      setActive(false);
      setMarked({});
      setCurrentStep(0);
    },
    [dispatch],
  );

  /**
   * Обработка клика на canvas (координаты normalized [0..1]).
   *
   * Порядок действий:
   *   1. Валидация (active + step в диапазоне + числовые координаты)
   *   2. Clamp координат в [0..1]
   *   3. Запись клика в marked
   *   4. Вызов onPointPlaced (создание control point в SimulationEditor)
   *   5. Если все точки расставлены → finishWith (создание landmark)
   *      Иначе → переход на следующий шаг
   */
  const handleClick = useCallback(
    ({ x, y }) => {
      if (!active) return;
      if (currentStep >= MANUAL_POINTS_COUNT) return;
      if (typeof x !== "number" || typeof y !== "number") return;

      const anchor = ANCHOR_POINTS[currentStep];
      if (!anchor) return;

      // Clamp в [0..1]
      const cx = Math.max(0, Math.min(1, x));
      const cy = Math.max(0, Math.min(1, y));

      const next = { ...marked, [anchor.key]: { x: cx, y: cy } };
      setMarked(next);

      // S.7.7+ — Уведомляем родителя о новой точке.
      // SimulationEditor использует это чтобы создать control point
      // на тех же координатах — без него лицо не деформируется.
      try {
        onPointPlacedRef.current?.({ x: cx, y: cy });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          "[useManualLandmarkWizard] onPointPlaced callback failed:",
          err,
        );
      }

      const newStep = currentStep + 1;
      if (newStep >= MANUAL_POINTS_COUNT) {
        // Все необходимые точки размечены — финализируем landmarks
        finishWith(next);
      } else {
        setCurrentStep(newStep);
      }
    },
    [active, currentStep, marked, finishWith],
  );

  /* ─── Производные значения для UI ─── */

  const totalSteps = MANUAL_POINTS_COUNT;
  const currentAnchor =
    active && currentStep < totalSteps ? ANCHOR_POINTS[currentStep] : null;
  const progressPercent = active
    ? Math.round((currentStep / totalSteps) * 100)
    : 0;

  return {
    active,
    currentStep,
    totalSteps,
    currentAnchor,
    marked,
    progressPercent,
    canUndo: currentStep > 0,

    start,
    cancel,
    undoLast,
    handleClick,
  };
}
