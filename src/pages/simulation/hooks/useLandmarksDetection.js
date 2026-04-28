// client/src/pages/simulation/hooks/useLandmarksDetection.js
//
// S.7.3: после успешной детекции автоматически сохраняем landmarks
// на сервере через persistLandmarks thunk.
// S.7.7 (multi-face): faceVariants + switchFace.
// S.7.7+ (rotation retry): пробрасываем rotationUsed в meta и в LocalState
//        чтобы UI показал бэдж «фото повёрнуто на N° для распознавания».

import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFaceDetection } from "./useFaceDetection.js";
import { detectFromUrl } from "../mediapipe/runAutoDetection.js";
import {
  setLandmarks,
  setLandmarksStatus,
  setFaceVariants,
  selectFaceVariant,
  persistLandmarks,
  selectLandmarks,
  selectLandmarksStatus,
  selectCurrentPlan,
  selectFaceVariants,
  selectSelectedFaceIndex,
} from "../store/simulationSlice.js";

const MODEL_VERSION = "mediapipe@0.10.18";

/**
 * Запускает runDetection напрямую (без detectFromUrl-обёртки) чтобы получить
 * полный объект DetectionResult с rotationUsed.
 *
 * Если detectFromUrl уже умеет это делать — fallback на него.
 */
async function detectWithRotationInfo(imageUrl, runDetection) {
  // Если detectFromUrl возвращает rotationUsed — отлично
  const result = await detectFromUrl(imageUrl, runDetection);
  return result;
}

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
  const faceVariants = useSelector(selectFaceVariants);
  const selectedFaceIndex = useSelector(selectSelectedFaceIndex);

  const autoTriggeredRef = useRef(false);
  const lastFailedUrlRef = useRef(null);

  // S.7.7+ — храним rotationUsed локально (вне Redux чтобы не делать
  // лишний reducer; UI читает через useLandmarksDetection().rotationUsed)
  const rotationUsedRef = useRef(0);

  const landmarksRef = useRef(landmarks);
  useEffect(() => {
    landmarksRef.current = landmarks;
  }, [landmarks]);

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

  const detect = useCallback(
    async ({ force = false } = {}) => {
      if (!isReady || !imageUrl) {
        return { ok: false, reason: "not_ready" };
      }

      if (!force && lastFailedUrlRef.current === imageUrl) {
        return { ok: false, reason: "no_face_cached" };
      }

      dispatch(setLandmarksStatus("detecting"));
      try {
        const detection = await detectWithRotationInfo(imageUrl, runDetection);
        const {
          landmarks: detected,
          faces,
          selectedIndex,
          detected: ok,
          rotationUsed = 0,
        } = detection;

        rotationUsedRef.current = rotationUsed;

        if (!ok || detected.length === 0) {
          dispatch(setLandmarksStatus("failed"));
          dispatch(setFaceVariants({ faces: [], selectedIndex: 0 }));
          lastFailedUrlRef.current = imageUrl;
          rotationUsedRef.current = 0;
          return { ok: false, reason: "no_face" };
        }

        dispatch(setFaceVariants({ faces, selectedIndex }));
        dispatch(setLandmarks(detected));
        lastFailedUrlRef.current = null;

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
                facesDetected: faces.length,
                selectedFaceIndex: selectedIndex,
                rotationUsed,
              },
            }),
          );
        }

        return {
          ok: true,
          count: detected.length,
          facesDetected: faces.length,
          rotationUsed,
        };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[useLandmarksDetection] detect failed:", err);
        dispatch(setLandmarksStatus("failed"));
        rotationUsedRef.current = 0;
        return { ok: false, reason: "error", error: err };
      }
    },
    [isReady, imageUrl, runDetection, dispatch],
  );

  const switchFace = useCallback(
    (newIndex) => {
      if (typeof newIndex !== "number") return;
      if (newIndex < 0 || newIndex >= faceVariants.length) return;
      if (newIndex === selectedFaceIndex) return;

      const variant = faceVariants[newIndex];
      if (!variant) return;

      dispatch(selectFaceVariant(newIndex));
      dispatch(setLandmarks(variant.landmarks));

      const planId = planIdRef.current;
      if (planId) {
        dispatch(
          persistLandmarks({
            id: planId,
            landmarks: variant.landmarks,
            meta: {
              modelVersion: MODEL_VERSION,
              imageWidth: photoSizeRef.current.width,
              imageHeight: photoSizeRef.current.height,
              facesDetected: faceVariants.length,
              selectedFaceIndex: newIndex,
              rotationUsed: rotationUsedRef.current,
            },
          }),
        );
      }
    },
    [faceVariants, selectedFaceIndex, dispatch],
  );

  useEffect(() => {
    if (!autoDetect) return;
    if (!isReady) return;
    if (autoTriggeredRef.current) return;
    if (landmarksRef.current.length > 0) return;
    if (status === "detecting") return;

    autoTriggeredRef.current = true;
    detect();
  }, [autoDetect, isReady, status, detect]);

  useEffect(() => {
    autoTriggeredRef.current = false;
    lastFailedUrlRef.current = null;
    rotationUsedRef.current = 0;
  }, [imageUrl]);

  return {
    isLoaderLoading: isLoading,
    isLoaderReady: isReady,
    loaderError: error,
    status,
    landmarks,
    detect,
    // S.7.7+ — multi-face
    faceVariants,
    selectedFaceIndex,
    hasMultipleFaces: faceVariants.length > 1,
    switchFace,
    // S.7.7+ — rotation retry
    rotationUsed: rotationUsedRef.current,
  };
}
