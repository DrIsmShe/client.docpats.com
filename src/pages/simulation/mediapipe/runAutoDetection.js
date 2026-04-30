// client/src/pages/simulation/mediapipe/runAutoDetection.js
//
// Утилита для запуска автоматической детекции по URL изображения.
// Загружает картинку → создаёт ImageBitmap → передаёт в runDetection.
//
// ВАЖНО: эта функция должна вызываться ОДИН раз на план. MediaPipe
// детерминирован — повторный запуск на том же фото даст тот же результат.
// Retry имеет смысл только при network errors, не при detected:false.
//
// S.7.7+ FIX: для cross-origin запросов к photo proxy
// (https://backend.docpats.com/api/simulation/photos/proxy?key=...)
// fetch обязан слать сессионную cookie, иначе backend вернёт 401.
// Дефолт fetch с mode:"cors" — credentials:"same-origin", что
// блокирует cookie на cross-origin. Поэтому явно указываем
// credentials:"include".

/**
 * Загружает изображение по URL в ImageBitmap.
 * Использует fetch + createImageBitmap для CORS-безопасной работы.
 *
 * Для cross-origin запросов (когда image URL — это backend proxy
 * на другом домене или порту) обязательно слать cookie сессии,
 * иначе backend вернёт 401.
 *
 * Backend должен ответить:
 *   • Access-Control-Allow-Origin: <точный origin>  (не "*")
 *   • Access-Control-Allow-Credentials: true
 *   • Vary: Origin
 *
 * Эти headers уже настроены в photoProxyController.js.
 *
 * @param {string} imageUrl - URL картинки (R2 CDN или backend proxy)
 * @returns {Promise<ImageBitmap>}
 */
export async function loadImageBitmap(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("Failed to fetch image: no URL provided");
  }

  let response;
  try {
    response = await fetch(imageUrl, {
      mode: "cors",
      credentials: "include", // ← обязательно для cookie сессии cross-origin
      cache: "no-store", // не кешируем — иначе 401 может закрепиться
    });
  } catch (err) {
    // Network-level ошибка (DNS, CORS preflight failed, offline)
    throw new Error(
      `Failed to fetch image: network error (${err?.message || "unknown"})`,
    );
  }

  if (!response.ok) {
    // 401 имеет специфичную причину — невалидная или отсутствующая сессия
    if (response.status === 401) {
      throw new Error(
        "Failed to fetch image: 401 (session cookie missing or expired)",
      );
    }
    if (response.status === 403) {
      throw new Error("Failed to fetch image: 403 (forbidden — wrong owner)");
    }
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
