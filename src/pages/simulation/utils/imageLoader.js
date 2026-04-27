// src/pages/simulation/utils/imageLoader.js

/* ──────────────────────────────────────────────────────────────────────────
   Preview pipeline:
   URL → HTMLImageElement → downscale в <= PREVIEW_MAX_DIM → ImageData +
   canvas-ready bitmap для быстрого drawImage.

   Зачем:
   — warp-алгоритм (S.3) работает per-pixel: O(W·H·N_points). На фото
     4000×3000 с 30 точками это 360M операций на один кадр. 1200×900
     даёт 40M — уже реалистично для 30-60 fps в Web Worker.
   — downscale делается ОДИН РАЗ при загрузке, не на каждый render.
   — оригинал НЕ хранится в памяти клиента — для export (S.6) будем
     заново тянуть с R2 и применять warp к full-res.

   Возвращаем:
     { bitmap, imageData, width, height, scaleFromOriginal }
   где scaleFromOriginal = previewDim / originalDim (для S.6 — пересчёт
   точек между preview и full-res; сейчас не нужен, но сохранится).
   ────────────────────────────────────────────────────────────────────────── */

export const PREVIEW_MAX_DIM = 1200;

/* ──────────────────────────────────────────────────────────────────────────
   Загрузка с CORS. R2 отдаёт через media.docpats.com с CORS-headers —
   без crossOrigin="anonymous" canvas будет tainted и getImageData
   упадёт с SecurityError.
   ────────────────────────────────────────────────────────────────────────── */
function loadHTMLImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Downscale до PREVIEW_MAX_DIM по длинной стороне, сохраняя aspect ratio.
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
   Главный метод. Возвращает всё что нужно редактору для работы.
   bitmap: ImageBitmap — быстрее HTMLImageElement на drawImage (GPU-path)
   imageData: для warp-процессинга в worker'е
   ────────────────────────────────────────────────────────────────────────── */
export async function loadPreviewImage(url) {
  const htmlImg = await loadHTMLImage(url);
  const { width, height, scale } = computePreviewSize(
    htmlImg.naturalWidth,
    htmlImg.naturalHeight,
  );

  // OffscreenCanvas если доступен — не блокирует main thread.
  // Fallback на обычный canvas.
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(htmlImg, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);

  // ImageBitmap для fast drawImage. На старых Safari может не быть —
  // fallback на HTMLImageElement.
  let bitmap;
  if (typeof createImageBitmap === "function") {
    bitmap = await createImageBitmap(canvas);
  } else {
    bitmap = htmlImg; // drawable, но медленнее
  }

  return {
    bitmap,
    imageData,
    width,
    height,
    scaleFromOriginal: scale,
  };
}
