// src/pages/simulation/hooks/useCanvasImage.js
import { useEffect, useState } from "react";
import { loadPreviewImage } from "../utils/imageLoader.js";

/* ──────────────────────────────────────────────────────────────────────────
   Загрузка фото по URL → { bitmap, imageData, width, height }.

   S.7.5+ — RETRY LOGIC.
   S.7.7+ — фото отдаётся через backend proxy (/api/simulation/photos/proxy),
            что обходит Cloudflare CDN propagation. Никаких blob'ов и
            IndexedDB не нужно. Настоящие 30 минут ожидания исчезают
            на этом уровне.

   Retry оставлен на случай network errors. Reduced delays потому что
   через proxy фото обычно доступно мгновенно.
   ────────────────────────────────────────────────────────────────────────── */

const RETRY_DELAYS_MS = [500, 1500, 3000];
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
            // eslint-disable-next-line no-console
            console.error(
              `[useCanvasImage] load failed (attempt ${i + 1}/${MAX_ATTEMPTS}):`,
              err,
            );
            setError(err);
            setLoading(false);
            return;
          }

          const waitMs = RETRY_DELAYS_MS[i];
          // eslint-disable-next-line no-console
          console.warn(
            `[useCanvasImage] load failed (attempt ${i + 1}/${MAX_ATTEMPTS}), retry in ${waitMs}ms:`,
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
