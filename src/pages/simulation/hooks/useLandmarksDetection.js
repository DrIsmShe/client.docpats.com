// src/pages/simulation/hooks/useLandmarksDetection.js
//
// S.7.3: после успешной детекции автоматически сохраняем landmarks
// на сервере через persistLandmarks thunk. Сохранение fire-and-forget —
// не блокирует UI и не задерживает рендер 468 точек.

import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFaceDetection } from "./useFaceDetection.js";
import { detectFromUrl } from "../mediapipe/runAutoDetection.js";
import {
  setLandmarks,
  setLandmarksStatus,
  persistLandmarks,
  selectLandmarks,
  selectLandmarksStatus,
  selectCurrentPlan,
} from "../store/simulationSlice.js";

const MODEL_VERSION = "mediapipe@0.10.18";

/**
 * @param {Object}  options
 * @param {string}  options.imageUrl
 * @param {boolean} options.autoDetect
 */
export function useLandmarksDetection({ imageUrl, autoDetect = true }) {
  const dispatch = useDispatch();
  const { isReady, isLoading, error, runDetection } = useFaceDetection();

  const landmarks = useSelector(selectLandmarks);
  const status = useSelector(selectLandmarksStatus);
  const currentPlan = useSelector(selectCurrentPlan);

  const autoTriggeredRef = useRef(false);
  const landmarksRef = useRef(landmarks);
  useEffect(() => {
    landmarksRef.current = landmarks;
  }, [landmarks]);

  // Стабильная ссылка на planId, чтобы detect() не пересоздавался
  // при каждом изменении плана
  const planIdRef = useRef(currentPlan?.id);
  const photoSizeRef = useRef({
    width: currentPlan?.photo?.width,
    height: currentPlan?.photo?.height,
  });
  useEffect(() => {
    planIdRef.current = currentPlan?.id;
    photoSizeRef.current = {
      width: currentPlan?.photo?.width,
      height: currentPlan?.photo?.height,
    };
  }, [currentPlan?.id, currentPlan?.photo?.width, currentPlan?.photo?.height]);

  /**
   * Запускает детекцию и сохраняет результат на сервере.
   */
  const detect = useCallback(async () => {
    if (!isReady || !imageUrl) {
      return { ok: false, reason: "not_ready" };
    }

    dispatch(setLandmarksStatus("detecting"));
    try {
      const { landmarks: detected, detected: ok } = await detectFromUrl(
        imageUrl,
        runDetection,
      );
      if (!ok || detected.length === 0) {
        dispatch(setLandmarksStatus("failed"));
        return { ok: false, reason: "no_face" };
      }

      // 1) Локальный setLandmarks — мгновенно рендерим на canvas
      dispatch(setLandmarks(detected));

      // 2) Fire-and-forget persist на сервере
      const planId = planIdRef.current;
      if (planId) {
        dispatch(
          persistLandmarks({
            id: planId,
            landmarks: detected,
            meta: {
              modelVersion: MODEL_VERSION,
              imageWidth: photoSizeRef.current.width,
              imageHeight: photoSizeRef.current.height,
            },
          }),
        );
        // unwrap не нужен — ошибки persist не блокируют UI,
        // status в стейте остаётся 'detected' (точки видны),
        // повторный re-detect возможен в любой момент.
      }

      return { ok: true, count: detected.length };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[useLandmarksDetection] detect failed:", err);
      dispatch(setLandmarksStatus("failed"));
      return { ok: false, reason: "error", error: err };
    }
  }, [isReady, imageUrl, runDetection, dispatch]);

  // Auto-detect при первой готовности landmarker'а
  useEffect(() => {
    if (!autoDetect) return;
    if (!isReady) return;
    if (autoTriggeredRef.current) return;
    if (landmarksRef.current.length > 0) return;
    if (status === "detecting") return;

    autoTriggeredRef.current = true;
    detect();
  }, [autoDetect, isReady, status, detect]);

  // Сброс auto-trigger при смене imageUrl (новый план)
  useEffect(() => {
    autoTriggeredRef.current = false;
  }, [imageUrl]);

  return {
    isLoaderLoading: isLoading,
    isLoaderReady: isReady,
    loaderError: error,
    status,
    landmarks,
    detect,
  };
}
