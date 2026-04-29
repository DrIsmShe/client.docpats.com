// src/pages/simulation/hooks/useCanvasImage.js
//
// Загрузка фото по URL → { bitmap, imageData, width, height }.
//
// S.7.5+ — RETRY LOGIC для R2 eventual consistency.
// S.7.7+ — INSTANT BLOB PREVIEW из IndexedDB:
//   Если у плана есть свежий blob в IndexedDB (загруженный во время
//   создания плана) — он показывается МГНОВЕННО, не дожидаясь R2/CDN.
//   Параллельно идут retry-попытки на CDN. Когда CDN отдаёт 200 →
//   переключаемся на CDN preview, blob чистится из IndexedDB.
//
// Контракт preview (СОХРАНЁН ИЗ СТАРОЙ ВЕРСИИ):
//   {
//     bitmap:    ImageBitmap,    // для drawImage в SimulationCanvas
//     imageData: ImageData,      // для warp engine
//     width:     number,
//     height:    number,
//   }
//
// Поведение retry:
//   • Попытка 1 — сразу
//   • 2 — через 2 сек, 3 — через 4, 4 — через 8, 5 — через 15 сек
//   • Итого ~30 секунд retry перед окончательным failure

import { useEffect, useState } from "react";
import { loadPreviewImage } from "../utils/imageLoader.js";
import { loadPhotoBlob, removePhotoBlob } from "../utils/photoBlobCache.js";

const RETRY_DELAYS_MS = [2000, 4000, 8000, 15000];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

function isRetryableError(err) {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();

  if (msg.includes("failed to fetch")) return true;
  if (msg.includes("network")) return true;
  if (msg.includes("load")) return true;

  if (err.status === 404) return true;
  if (err.status === 403) return true;
  if (err.status === 502) return true;
  if (err.status === 503) return true;
  if (err.status === 504) return true;

  if (msg.includes("decode")) return false;
  if (msg.includes("corrupt")) return false;
  if (msg.includes("unsupported")) return false;

  return true;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Преобразует Blob в { bitmap, imageData, width, height }.
 * Использует createImageBitmap (нативный, быстрый) и потом канвас для
 * получения ImageData нужного для warp engine.
 */
async function blobToPreview(blob) {
  const bitmap = await createImageBitmap(blob);

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(bitmap.width, bitmap.height)
      : Object.assign(document.createElement("canvas"), {
          width: bitmap.width,
          height: bitmap.height,
        });

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

  return {
    bitmap,
    imageData,
    width: bitmap.width,
    height: bitmap.height,
  };
}

/**
 * @param {string}  url    - публичный URL фото с CDN
 * @param {string} [planId] - ID плана для поиска blob preview в IndexedDB
 */
export function useCanvasImage(url, planId) {
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
    let activeBitmap = null;
    let loadedFromBlob = false;

    setLoading(true);
    setError(null);
    setAttempt(0);

    /* ─── Шаг 1. Попробовать blob из IndexedDB (мгновенно) ─── */
    const tryInstantBlob = async () => {
      if (!planId) return false;
      try {
        const cached = await loadPhotoBlob(planId);
        if (cancelled || !cached || !cached.blob) return false;

        const result = await blobToPreview(cached.blob);
        if (cancelled) {
          result.bitmap?.close?.();
          // Cleanup объект который дала loadPhotoBlob
          if (cached.blobUrl) URL.revokeObjectURL(cached.blobUrl);
          return false;
        }

        // Cleanup временный blobUrl от loadPhotoBlob (мы его не используем,
        // потому что у нас есть Blob для createImageBitmap)
        if (cached.blobUrl) URL.revokeObjectURL(cached.blobUrl);

        activeBitmap = result.bitmap;
        loadedFromBlob = true;
        setPreview(result);
        setLoading(false);
        // eslint-disable-next-line no-console
        console.log(
          `[useCanvasImage] ⚡ Instant preview from IndexedDB (${result.width}×${result.height})`,
        );
        return true;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[useCanvasImage] blob preview failed:", err);
        return false;
      }
    };

    /* ─── Шаг 2. CDN с retry ─── */
    const loadFromCdnWithRetry = async () => {
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (cancelled) return;

        setAttempt(i + 1);

        try {
          const result = await loadPreviewImage(url);
          if (cancelled) {
            result.bitmap?.close?.();
            return;
          }

          // CDN успешно — закрываем старый bitmap (был из blob), переключаемся
          if (activeBitmap && activeBitmap !== result.bitmap) {
            activeBitmap.close?.();
          }
          activeBitmap = result.bitmap;

          setPreview(result);
          setLoading(false);
          setError(null);

          // Чистим blob из IndexedDB — он больше не нужен
          if (planId) {
            removePhotoBlob(planId).catch(() => {});
          }

          // eslint-disable-next-line no-console
          console.log("[useCanvasImage] ✓ CDN load successful");
          return;
        } catch (err) {
          if (cancelled) return;

          const isLastAttempt = i === MAX_ATTEMPTS - 1;
          const canRetry = isRetryableError(err) && !isLastAttempt;

          if (!canRetry) {
            // eslint-disable-next-line no-console
            console.error(
              `[useCanvasImage] CDN load failed (attempt ${i + 1}/${MAX_ATTEMPTS}):`,
              err,
            );
            // Если у нас есть blob preview — НЕ показываем ошибку, blob
            // продолжает работать. Иначе — фатальная ошибка.
            if (!loadedFromBlob) {
              setError(err);
              setLoading(false);
            }
            return;
          }

          const waitMs = RETRY_DELAYS_MS[i];
          // eslint-disable-next-line no-console
          console.warn(
            `[useCanvasImage] CDN failed (attempt ${i + 1}/${MAX_ATTEMPTS}), retry in ${waitMs}ms:`,
            err.message || err,
          );
          await delay(waitMs);
        }
      }
    };

    /* ─── Run ─── */
    (async () => {
      await tryInstantBlob();
      if (cancelled) return;
      // CDN ретраи запускаем ВСЕГДА:
      //  • Если blob дошёл — для последующего переключения на CDN и cleanup
      //  • Если нет — это единственный путь
      loadFromCdnWithRetry();
    })();

    return () => {
      cancelled = true;
      activeBitmap?.close?.();
    };
  }, [url, planId]);

  return { preview, loading, error, attempt, maxAttempts: MAX_ATTEMPTS };
}
