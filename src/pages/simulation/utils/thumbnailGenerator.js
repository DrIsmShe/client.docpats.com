// src/pages/simulation/utils/thumbnailGenerator.js
import { loadPreviewImage } from "./imageLoader.js";
import { applyWarp } from "./warpMath.js";

/* ──────────────────────────────────────────────────────────────────────────
   Генерация маленькой warped-превьюшки для карточки плана.

   Идея: грузим фото в уменьшенном виде (256px, не 1200px как в editor'е),
   прогоняем тот же warpMath, рисуем в off-screen canvas → data-URL.

   Почему client-side, а не server-side:
   — Не надо трогать backend (S.6+ разве что).
   — Warp-результат всегда соответствует точкам в БД (нет ситуации «точки
     обновились, а thumbnail не перегенерился»).
   — Кеш в памяти React: один раз за сессию за один id.

   Минус: на список из 50 планов — 50 warp-вычислений на открытии страницы.
   Для 10 точек каждый и 256×256 = ~20ms × 50 = 1 сек суммарно, параллельно
   в одном worker'е. Приемлемо. Если станет медленно — добавим серверный
   snapshot при save (S.6+).

   Для S.5 делаем MAIN-thread (fast-enough на 256px), БЕЗ worker'а — чтобы
   не создавать пул воркеров для каждой карточки.
   ────────────────────────────────────────────────────────────────────────── */

const THUMB_MAX_DIM = 256;

/* ──────────────────────────────────────────────────────────────────────────
   In-memory cache: ключ = `${planId}:${updatedAt}:${pointsHash}`.
   Инвалидация — при изменении updatedAt или points. План без изменений
   → берём из кеша.
   ────────────────────────────────────────────────────────────────────────── */
const cache = new Map();
const CACHE_MAX_SIZE = 100;

function simpleHashPoints(points) {
  if (!points || points.length === 0) return "0";
  // Не crypto-hash, просто stable string representation для memoize
  let acc = points.length.toString();
  for (const p of points) {
    acc += `|${p.anchor.x.toFixed(3)},${p.anchor.y.toFixed(3)}:${p.current.x.toFixed(
      3,
    )},${p.current.y.toFixed(3)}:${p.radius.toFixed(3)}:${p.strength.toFixed(2)}`;
  }
  return acc;
}

function cacheGet(key) {
  return cache.get(key) || null;
}

function cacheSet(key, value) {
  if (cache.size >= CACHE_MAX_SIZE) {
    // FIFO: удаляем самый старый ключ
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}

/* ──────────────────────────────────────────────────────────────────────────
   Downsample уже downloaded preview до THUMB_MAX_DIM.
   ────────────────────────────────────────────────────────────────────────── */
function downscaleToThumb(preview) {
  const longest = Math.max(preview.width, preview.height);
  if (longest <= THUMB_MAX_DIM) {
    return {
      imageData: preview.imageData,
      width: preview.width,
      height: preview.height,
    };
  }

  const scale = THUMB_MAX_DIM / longest;
  const w = Math.round(preview.width * scale);
  const h = Math.round(preview.height * scale);

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement("canvas"), {
          width: w,
          height: h,
        });

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "medium";
  ctx.drawImage(preview.bitmap, 0, 0, w, h);

  return {
    imageData: ctx.getImageData(0, 0, w, h),
    width: w,
    height: h,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Главный метод. Возвращает data-URL (PNG). null если генерация упала.
   ────────────────────────────────────────────────────────────────────────── */
export async function generateThumbnail({ plan }) {
  const cacheKey = `${plan.id}:${plan.updatedAt}:${simpleHashPoints(plan.controlPoints)}`;

  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const preview = await loadPreviewImage(plan.photo.url);
    const thumb = downscaleToThumb(preview);

    // Warp в thumbnail-размере
    const warped = applyWarp({
      src: thumb.imageData.data,
      width: thumb.width,
      height: thumb.height,
      points: plan.controlPoints || [],
    });

    // Рисуем в canvas → toDataURL
    const canvas = document.createElement("canvas");
    canvas.width = thumb.width;
    canvas.height = thumb.height;
    const ctx = canvas.getContext("2d");
    ctx.putImageData(new ImageData(warped, thumb.width, thumb.height), 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    // Освобождаем bitmap
    preview.bitmap?.close?.();

    cacheSet(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.warn("[simulation/thumbnail] generation failed:", err);
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Явная инвалидация — если понадобится принудительно регенерить.
   ────────────────────────────────────────────────────────────────────────── */
export function invalidateThumbnail(planId) {
  for (const key of cache.keys()) {
    if (key.startsWith(`${planId}:`)) {
      cache.delete(key);
    }
  }
}
