// src/pages/simulation/hooks/useMeasurements.js
//
// Хук, вычисляющий измерения по текущим landmarks.
// Мемоизирован — пересчёт только при изменении массива landmarks.
//
// Возвращает null'ы для измерений, которые невозможно вычислить
// (нет landmarks, лицо не детектировано, нужные точки отсутствуют).

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { computeAllMeasurements } from "../mediapipe/measurements.js";
import {
  selectLandmarks,
  selectCurrentPlan,
} from "../store/simulationSlice.js";

export function useMeasurements() {
  const landmarks = useSelector(selectLandmarks);
  const plan = useSelector(selectCurrentPlan);

  const measurements = useMemo(
    () => computeAllMeasurements(landmarks),
    [landmarks],
  );

  // Калибровка из плана (для S.7.6 — пока опционально)
  const calibration = plan?.calibration || null;
  const imageWidth = plan?.photo?.width || null;
  const imageHeight = plan?.photo?.height || null;

  return {
    measurements,
    calibration,
    imageWidth,
    imageHeight,
    hasLandmarks: landmarks.length > 0,
  };
}
