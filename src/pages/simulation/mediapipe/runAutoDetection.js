// client/src/pages/simulation/mediapipe/runAutoDetection.js
//
// Утилита для запуска автоматической детекции по URL изображения.
// Загружает картинку → создаёт ImageBitmap → передаёт в runDetection.
//
// ВАЖНО: эта функция должна вызываться ОДИН раз на план. MediaPipe
// детерминирован — повторный запуск на том же фото даст тот же результат.
// Retry имеет смысл только при network errors, не при detected:false.

/**
 * Загружает изображение по URL в ImageBitmap.
 * Использует fetch + createImageBitmap для CORS-безопасной работы.
 *
 * @param {string} imageUrl - URL картинки (R2 CDN)
 * @returns {Promise<ImageBitmap>}
 */
export async function loadImageBitmap(imageUrl) {
  const response = await fetch(imageUrl, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const blob = await response.blob();
  return createImageBitmap(blob);
}

/**
 * Полный цикл: URL → ImageBitmap → detection → landmarks.
 *
 * @param {string} imageUrl
 * @param {(imageSource: ImageBitmap) => Promise<{landmarks: Array, detected: boolean}>} runDetection
 * @returns {Promise<{landmarks: Array, detected: boolean}>}
 */
export async function detectFromUrl(imageUrl, runDetection) {
  const bitmap = await loadImageBitmap(imageUrl);
  try {
    return await runDetection(bitmap);
  } finally {
    bitmap.close?.();
  }
}
