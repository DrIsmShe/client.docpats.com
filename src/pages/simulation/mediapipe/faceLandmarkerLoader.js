// client/src/pages/simulation/mediapipe/faceLandmarkerLoader.js
//
// Синглтон-загрузчик MediaPipe FaceLandmarker.
// Модель (~6MB) и wasm-runtime тянутся с CDN при первом вызове.
// Повторные вызовы возвращают один и тот же экземпляр.

import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const TASKS_VISION_VERSION = "0.10.18";
const WASM_CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_CDN =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise = null;

/**
 * Ленивая инициализация FaceLandmarker.
 * Возвращает один и тот же промис при повторных вызовах.
 *
 * Тонкости конфига:
 *  • minFaceDetectionConfidence: 0.2 — низкий порог для поддержки
 *    профильных и ¾-ракурсов. На frontal модель всё равно даёт >0.95,
 *    а на профиле часто 0.2–0.4. Если ставить 0.5 (default) — половина
 *    профильных фото детектируется как «лица нет».
 *
 *  • minFacePresenceConfidence: 0.2 — тот же принцип, но для tracking
 *    качества внутренней геометрии. На статичных фото влияет минимально.
 *
 *  • numFaces: 2 — для случаев когда на фото два лица (before/after
 *    в одном кадре). MediaPipe выберет наиболее уверенное, которое
 *    уже в useFaceDetection берётся как face[0].
 *
 *  • delegate: "GPU" — MediaPipe сам fallback'нется на CPU если WebGL
 *    недоступен, не нужно явно обрабатывать.
 *
 * @returns {Promise<FaceLandmarker>}
 */
export function loadFaceLandmarker() {
  if (landmarkerPromise) return landmarkerPromise;

  landmarkerPromise = (async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(WASM_CDN);

      const landmarker = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath: MODEL_CDN,
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numFaces: 2,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
          minFaceDetectionConfidence: 0.2,
          minFacePresenceConfidence: 0.2,
          minTrackingConfidence: 0.5,
        },
      );

      return landmarker;
    } catch (err) {
      // сбрасываем промис, чтобы следующий вызов попробовал заново
      landmarkerPromise = null;
      throw err;
    }
  })();

  return landmarkerPromise;
}

/**
 * Принудительная выгрузка. Вызывать при logout или unmount editor-страницы
 * если хочешь освободить GPU-контекст.
 */
export async function disposeFaceLandmarker() {
  if (!landmarkerPromise) return;
  try {
    const landmarker = await landmarkerPromise;
    landmarker.close?.();
  } catch {
    /* ignore */
  } finally {
    landmarkerPromise = null;
  }
}
