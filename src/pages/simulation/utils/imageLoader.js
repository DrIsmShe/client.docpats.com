// src/pages/simulation/utils/imageLoader.js
//
// Preview pipeline:
// URL → HTMLImageElement → downscale в <= PREVIEW_MAX_DIM → ImageData +
// canvas-ready bitmap для быстрого drawImage.
//
// S.7.7+ — поддержка относительных URL:
//   После перехода на backend proxy (/api/simulation/photos/proxy?key=...)
//   URL приходит как относительный путь. Браузер сам по себе понимает
//   относительные URL для <img>, НО на dev-сервере localhost:3000 такие
//   URL улетают на frontend-host вместо backend-host (localhost:11000).
//
//   Решение: resolveUrl() — превращает относительный /api/... в
//   абсолютный {API_BASE}/api/... используя config.js. Полные URL
//   (CDN media.docpats.com) проходят без изменений.

import { API_BASE } from "../../../config.js";

export const PREVIEW_MAX_DIM = 1200;

/* ──────────────────────────────────────────────────────────────────────────
   S.7.7+ — Resolves relative URLs to absolute backend URLs.
   "/api/foo" + "http://localhost:11000" → "http://localhost:11000/api/foo"
   "https://media.docpats.com/foo" → unchanged
   ────────────────────────────────────────────────────────────────────────── */
function resolveUrl(url) {
  if (!url) return url;
  // Полные URL — пропускаем без изменений
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Относительный путь /api/... → абсолютный {API_BASE}/api/...
  if (url.startsWith("/")) {
    const base = (API_BASE || "").replace(/\/$/, "");
    return `${base}${url}`;
  }
  return url;
}

/* ──────────────────────────────────────────────────────────────────────────
   Загрузка картинки.
   crossOrigin="anonymous" нужен для CDN URL (media.docpats.com) чтобы
   canvas не стал tainted. Для same-origin proxy URL он тоже безопасен —
   браузер просто игнорирует CORS-проверку для same-origin.
   
   credentials: include НЕ устанавливаем напрямую через crossOrigin —
   для proxy нужны куки (session). Используем 'use-credentials' если
   URL same-origin, иначе 'anonymous'.
   ────────────────────────────────────────────────────────────────────────── */
function loadHTMLImage(url) {
  return new Promise((resolve, reject) => {
    const resolved = resolveUrl(url);

    // S.7.7+ — crossOrigin для всех URL:
    //   • Proxy URL (cross-origin localhost:3000 → localhost:11000):
    //     "use-credentials" — куки сессии шлются + canvas читаемый.
    //     Backend настроен в photoProxyController отдавать корректные
    //     CORS headers (Allow-Origin: req.origin, Allow-Credentials: true).
    //   • CDN URL (media.docpats.com): "anonymous" — public CORS.
    const isProxy = resolved.includes("/api/simulation/photos/proxy");

    const img = new Image();
    img.crossOrigin = isProxy ? "use-credentials" : "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${resolved}`));
    img.src = resolved;
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Downscale до PREVIEW_MAX_DIM по длинной стороне.
   ────────────────────────────────────────────────────────────────────────── */
function computePreviewSize(origW, origH) {
  const longest = Math.max(origW, origH);
  if (longest <= PREVIEW_MAX_DIM) {
    return { width: origW, height: origH, scale: 1 };
  }
  const scale = PREVIEW_MAX_DIM / longest;
  return {
    width: Math.round(origW * scale),
    height: Math.round(origH * scale),
    scale,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Главный метод. Возвращает всё что нужно редактору.
   ────────────────────────────────────────────────────────────────────────── */
export async function loadPreviewImage(url) {
  const htmlImg = await loadHTMLImage(url);
  const { width, height, scale } = computePreviewSize(
    htmlImg.naturalWidth,
    htmlImg.naturalHeight,
  );

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(htmlImg, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);

  let bitmap;
  if (typeof createImageBitmap === "function") {
    bitmap = await createImageBitmap(canvas);
  } else {
    bitmap = htmlImg;
  }

  return {
    bitmap,
    imageData,
    width,
    height,
    scaleFromOriginal: scale,
  };
}
