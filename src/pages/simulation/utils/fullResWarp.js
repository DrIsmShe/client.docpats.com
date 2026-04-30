// src/pages/simulation/utils/fullResWarp.js
import { loadPreviewImage } from "./imageLoader.js";

/* ──────────────────────────────────────────────────────────────────────────
   Full-resolution warp для export.

   Workflow:
   1. Грузим оригинальное фото с R2 БЕЗ downscale (всё-таки до 4000px —
      это backend уже ограничил при upload'е в sharp).
   2. Отправляем в тот же warp.worker.js с теми же нормализованными
      точками — формула работает в [0..1] пространстве, разрешение не
      имеет значения.
   3. Получаем Uint8ClampedArray full-res.
   4. Рисуем в canvas → blob → download.

   КРИТИЧНО: НЕ используем loadPreviewImage здесь — она даунскейлит.
   Для export нужен full-res (или то, что backend положил в R2).

   S.7.7+ FIX (cross-origin auth):
   crossOrigin = "use-credentials" (а НЕ "anonymous"), потому что фото
   обслуживается backend proxy /api/simulation/photos/proxy?key=... и
   требует сессионную cookie. С "anonymous" cookie не отправляется,
   backend возвращает 401, img.onerror срабатывает.

   Backend (photoProxyController.js) отдаёт точный
   Access-Control-Allow-Origin (не "*") и Access-Control-Allow-Credentials,
   так что серверная сторона готова к use-credentials запросам.
   ────────────────────────────────────────────────────────────────────────── */

async function loadFullResImage(url) {
  // Тот же код что loadPreviewImage но БЕЗ downscale — просто читаем как есть.
  const htmlImg = await new Promise((resolve, reject) => {
    const img = new Image();
    // S.7.7+ FIX — use-credentials отправляет сессионную cookie,
    // anonymous — НЕТ. Для backend proxy с auth обязательно первое.
    img.crossOrigin = "use-credentials";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error(
          `Failed to load full-res: ${url} (check session cookie / CORS)`,
        ),
      );
    img.src = url;
  });

  const W = htmlImg.naturalWidth;
  const H = htmlImg.naturalHeight;

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(W, H)
      : Object.assign(document.createElement("canvas"), {
          width: W,
          height: H,
        });

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(htmlImg, 0, 0);
  const imageData = ctx.getImageData(0, 0, W, H);

  return { imageData, width: W, height: H };
}

/* ──────────────────────────────────────────────────────────────────────────
   Запускает warp в worker'е, возвращает Promise<ImageData>.
   worker передаётся снаружи — одинаковый singleton как в useWarpEngine.
   ────────────────────────────────────────────────────────────────────────── */
function runWarpInWorker(worker, { src, width, height, points, jobId }) {
  return new Promise((resolve, reject) => {
    const handler = (evt) => {
      const msg = evt.data;
      if (!msg || msg.jobId !== jobId) return;
      worker.removeEventListener("message", handler);
      if (msg.type === "result") {
        const arr = new Uint8ClampedArray(msg.buffer);
        resolve(new ImageData(arr, msg.width, msg.height));
      } else if (msg.type === "error") {
        reject(new Error(msg.message));
      }
    };
    worker.addEventListener("message", handler);

    // Transferable src.buffer — копируем, чтобы не detach'ить оригинал
    const srcCopy = new Uint8ClampedArray(src);

    worker.postMessage(
      {
        type: "warp",
        jobId,
        src: srcCopy.buffer,
        width,
        height,
        points,
      },
      [srcCopy.buffer],
    );
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Main-thread fallback если worker недоступен (Safari старые, тесты).
   Динамический импорт чтобы не тянуть в bundle когда worker есть.
   ────────────────────────────────────────────────────────────────────────── */
async function runWarpMainThread({ src, width, height, points }) {
  const { applyWarp } = await import("./warpMath.js");
  const result = applyWarp({ src, width, height, points });
  return new ImageData(result, width, height);
}

/* ──────────────────────────────────────────────────────────────────────────
   Главный метод. Loads → warps → возвращает { original, warped } —
   оба ImageData в full-res. Оригинал тоже отдаём, чтобы ExportPanel
   мог сделать side-by-side без повторной загрузки.
   ────────────────────────────────────────────────────────────────────────── */
export async function generateFullResExport({ url, points, worker }) {
  const { imageData, width, height } = await loadFullResImage(url);

  // Если точек нет / нулевой displacement — warp = no-op.
  const hasDeform = (points || []).some(
    (p) => p.anchor.x !== p.current.x || p.anchor.y !== p.current.y,
  );

  if (!hasDeform) {
    // Возвращаем оба как одинаковую ImageData
    return { original: imageData, warped: imageData, width, height };
  }

  let warped;
  if (worker) {
    warped = await runWarpInWorker(worker, {
      src: imageData.data,
      width,
      height,
      points,
      jobId: Date.now(),
    });
  } else {
    warped = await runWarpMainThread({
      src: imageData.data,
      width,
      height,
      points,
    });
  }

  return { original: imageData, warped, width, height };
}

/* ──────────────────────────────────────────────────────────────────────────
   ImageData → Blob (PNG / JPEG). Для скачивания.
   ────────────────────────────────────────────────────────────────────────── */
export async function imageDataToBlob(
  imageData,
  { format = "image/jpeg", quality = 0.92 } = {},
) {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      format,
      quality,
    );
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Side-by-side: рисуем два ImageData рядом на одном canvas.
   ────────────────────────────────────────────────────────────────────────── */
export function composeSideBySide({
  left,
  right,
  gap = 20,
  labelLeft,
  labelRight,
}) {
  const W = left.width + right.width + gap;
  const H =
    Math.max(left.height, right.height) + (labelLeft || labelRight ? 40 : 0);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Белый bg (приятнее на превью чем прозрачный)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Top labels (опционально)
  const labelOffset = labelLeft || labelRight ? 36 : 0;
  if (labelOffset) {
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "500 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (labelLeft) {
      ctx.fillText(labelLeft, left.width / 2, 20);
    }
    if (labelRight) {
      ctx.fillText(labelRight, left.width + gap + right.width / 2, 20);
    }
  }

  // putImageData не учитывает transform, рисуем через tmp-canvas + drawImage
  const leftCanvas = document.createElement("canvas");
  leftCanvas.width = left.width;
  leftCanvas.height = left.height;
  leftCanvas.getContext("2d").putImageData(left, 0, 0);

  const rightCanvas = document.createElement("canvas");
  rightCanvas.width = right.width;
  rightCanvas.height = right.height;
  rightCanvas.getContext("2d").putImageData(right, 0, 0);

  ctx.drawImage(leftCanvas, 0, labelOffset);
  ctx.drawImage(rightCanvas, left.width + gap, labelOffset);

  return canvas;
}

/* ──────────────────────────────────────────────────────────────────────────
   Canvas → Blob (обёртка для composeSideBySide).
   ────────────────────────────────────────────────────────────────────────── */
export function canvasToBlob(
  canvas,
  { format = "image/jpeg", quality = 0.92 } = {},
) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      format,
      quality,
    );
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Скачать blob как файл — триггерим браузерный download.
   ────────────────────────────────────────────────────────────────────────── */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Освобождаем URL через таймаут — браузер ещё может читать
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
