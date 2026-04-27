// src/pages/simulation/workers/warp.worker.js
import { applyWarp } from "../utils/warpMath.js";

/* ──────────────────────────────────────────────────────────────────────────
   Web Worker для warp-вычислений.

   Protocol:
     main → worker:
       { type: "warp", jobId, src (ArrayBuffer transfer), width, height, points }
     worker → main:
       { type: "result", jobId, buffer (ArrayBuffer transfer) }
       { type: "error",  jobId, message }

   jobId даёт main thread'у возможность игнорировать устаревшие результаты
   (если пользователь быстро двигает точку, в очереди могут быть 2-3
   результата одновременно — берём только последний).

   Transferable ArrayBuffer: src.buffer передаётся БЕЗ копирования. После
   postMessage исходный buffer в main thread становится detached — именно
   поэтому useWarpEngine всегда отправляет КОПИЮ src, не оригинал.
   Это ключевой трюк для 60fps: обычный postMessage клонировал бы 4 MB
   на каждое сообщение.

   ВАЖНО про бандлер: CRA (Webpack 5) поддерживает Web Workers через
     new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
   type: 'module' нужен чтобы import внутри worker'а работал. См.
   useWarpEngine.js — там инициализация.
   ────────────────────────────────────────────────────────────────────────── */

// eslint-disable-next-line no-restricted-globals
self.onmessage = (evt) => {
  const msg = evt.data;

  if (!msg || msg.type !== "warp") return;

  const { jobId, src, width, height, points } = msg;

  try {
    // src пришёл как ArrayBuffer. Оборачиваем в Uint8ClampedArray без копии.
    const srcView = new Uint8ClampedArray(src);

    const result = applyWarp({
      src: srcView,
      width,
      height,
      points,
    });

    // Отправляем обратно ArrayBuffer, тоже transferable.
    // eslint-disable-next-line no-restricted-globals
    self.postMessage(
      {
        type: "result",
        jobId,
        buffer: result.buffer,
        width,
        height,
      },
      [result.buffer],
    );
  } catch (err) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: "error",
      jobId,
      message: err?.message || "warp failed",
    });
  }
};
