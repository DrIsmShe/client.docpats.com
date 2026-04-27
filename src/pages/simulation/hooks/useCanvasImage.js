// src/pages/simulation/hooks/useCanvasImage.js
import { useEffect, useState } from "react";
import { loadPreviewImage } from "../utils/imageLoader.js";

/* ──────────────────────────────────────────────────────────────────────────
   Загрузка фото по URL → { bitmap, imageData, width, height }.

   S.7.5+ — RETRY LOGIC для Cloudflare R2 eventual consistency:
   После загрузки файла в R2, CDN edge нодам нужно 5-30 секунд чтобы
   пропагировать файл. Первая попытка может вернуть 404, но через
   несколько секунд файл становится доступным.

   Поведение:
     • Попытка 1 — сразу
     • Попытка 2 — через 2 сек
     • Попытка 3 — через 4 сек
     • Попытка 4 — через 8 сек
     • Попытка 5 — через 15 сек
   Итого ~30 секунд retry перед окончательным failure.

   Только для retry-able ошибок (404, 403, network error, timeout).
   Для других (corrupted image, unsupported format) — failure сразу.

   Возвращает дополнительно `attempt` — текущий номер попытки (для UI).
   ────────────────────────────────────────────────────────────────────────── */

const RETRY_DELAYS_MS = [2000, 4000, 8000, 15000]; // ms между попытками
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1; // 5 попыток всего

/**
 * Решает, стоит ли повторять загрузку для данной ошибки.
 * Сетевые / 404 / 403 — да. Битый файл / unsupported — нет.
 */
function isRetryableError(err) {
  if (!err) return false;

  const msg = String(err.message || err).toLowerCase();

  // Network / fetch errors
  if (msg.includes("failed to fetch")) return true;
  if (msg.includes("network")) return true;
  if (msg.includes("load")) return true;

  // HTTP status codes
  if (err.status === 404) return true;
  if (err.status === 403) return true;
  if (err.status === 502) return true;
  if (err.status === 503) return true;
  if (err.status === 504) return true;

  // Image decoding error → не retry, это битый файл
  if (msg.includes("decode")) return false;
  if (msg.includes("corrupt")) return false;
  if (msg.includes("unsupported")) return false;

  // По умолчанию — retry (лучше попробовать чем сразу провалиться)
  return true;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useCanvasImage(url) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!url) {
      setPreview(null);
      setAttempt(0);
      return undefined;
    }

    let cancelled = false;
    let currentBitmap = null;

    setLoading(true);
    setError(null);
    setAttempt(0);

    /**
     * Рекурсивный загрузчик с retry.
     */
    const loadWithRetry = async () => {
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (cancelled) return;

        setAttempt(i + 1);

        try {
          const result = await loadPreviewImage(url);

          if (cancelled) {
            result.bitmap?.close?.();
            return;
          }

          // Успех — сохраняем и выходим
          currentBitmap = result.bitmap;
          setPreview(result);
          setLoading(false);
          setError(null);
          return;
        } catch (err) {
          if (cancelled) return;

          const isLastAttempt = i === MAX_ATTEMPTS - 1;
          const canRetry = isRetryableError(err) && !isLastAttempt;

          if (!canRetry) {
            // Финальная ошибка — выходим
            // eslint-disable-next-line no-console
            console.error(
              `[simulation/useCanvasImage] load failed (attempt ${i + 1}/${MAX_ATTEMPTS}):`,
              err,
            );
            setError(err);
            setLoading(false);
            return;
          }

          // Retry — ждём backoff и пробуем снова
          const waitMs = RETRY_DELAYS_MS[i];
          // eslint-disable-next-line no-console
          console.warn(
            `[simulation/useCanvasImage] load failed (attempt ${i + 1}/${MAX_ATTEMPTS}), retry in ${waitMs}ms:`,
            err.message || err,
          );
          await delay(waitMs);
        }
      }
    };

    loadWithRetry();

    return () => {
      cancelled = true;
      currentBitmap?.close?.();
    };
  }, [url]);

  return { preview, loading, error, attempt, maxAttempts: MAX_ATTEMPTS };
}
