// src/pages/simulation/workers/warp.worker.js
import { applyWarp } from "../utils/warpMath.js";

/* ──────────────────────────────────────────────────────────────────────────
   Web Worker для warp-вычислений.

   Protocol:
     main → worker:
       { type: "init",  src (ArrayBuffer transfer), width, height }
       { type: "warp",  jobId, points, roi }        // roi: {x,y,w,h} | null
       { type: "dispose" }
     worker → main:
       { type: "ready" }
       { type: "result", jobId, buffer (transfer), x, y, w, h }
       { type: "error",  jobId, message }

   ПОЧЕМУ ИСТОЧНИК ПЕРЕДАЁТСЯ ОДИН РАЗ

   Раньше main thread на КАЖДОЕ движение пальца делал копию всего исходника
   (4 МБ для превью 1200×900) и передавал её сюда — потому что transferable
   ArrayBuffer после postMessage становится detached, и оригинал переиспользовать
   уже нельзя. При 60 кадрах в секунду это четверть гигабайта memcpy в секунду
   на ровном месте.

   Теперь исходник живёт здесь: приходит один раз в "init" и больше никуда не
   уезжает. Кадровое сообщение содержит только точки и прямоугольник — сотни
   байт вместо мегабайт.

   ПОЧЕМУ ОТВЕТ — ТОЛЬКО ПРЯМОУГОЛЬНИК

   dst тоже персистентный и хранит предыдущий кадр целиком. Смещение одной
   точки меняет пиксели лишь внутри её круга влияния (см. computeDirtyRect),
   поэтому наружу отдаётся вырезка размером с этот круг, а не весь кадр.
   Main thread накладывает её на свой накопленный буфер.

   ВАЖНО: результаты обязаны применяться ВСЕ и по порядку — вырезка
   бессмысленна в отрыве от предыдущего состояния. Устаревшие ответы больше
   не отбрасываются; вместо этого main thread не шлёт новую задачу, пока не
   получил ответ на предыдущую (backpressure в useWarpEngine).

   ВАЖНО про бандлер: CRA (Webpack 5) поддерживает Web Workers через
     new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
   type: 'module' нужен чтобы import внутри worker'а работал.
   ────────────────────────────────────────────────────────────────────────── */

let srcView = null;
let dstView = null;
let W = 0;
let H = 0;

/** Вырезает прямоугольник из dst в отдельный буфер для передачи. */
function extractPatch(x, y, w, h) {
  const patch = new Uint8ClampedArray(w * h * 4);
  const rowBytes = w * 4;
  for (let row = 0; row < h; row++) {
    const from = ((y + row) * W + x) * 4;
    patch.set(dstView.subarray(from, from + rowBytes), row * rowBytes);
  }
  return patch;
}

// eslint-disable-next-line no-restricted-globals
self.onmessage = (evt) => {
  const msg = evt.data;
  if (!msg) return;

  if (msg.type === "init") {
    srcView = new Uint8ClampedArray(msg.src);
    W = msg.width;
    H = msg.height;
    dstView = new Uint8ClampedArray(srcView.length);
    dstView.set(srcView); // до первого warp'а dst == оригинал
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ type: "ready" });
    return;
  }

  if (msg.type === "dispose") {
    srcView = null;
    dstView = null;
    W = 0;
    H = 0;
    return;
  }

  if (msg.type !== "warp") return;

  const { jobId, points, roi } = msg;

  try {
    if (!srcView || !dstView) {
      throw new Error("warp before init");
    }

    // roi === null означает полный пересчёт кадра.
    const rect = roi || { x: 0, y: 0, w: W, h: H };
    if (rect.w <= 0 || rect.h <= 0) {
      // Изменений нет — отвечаем пустой вырезкой, чтобы не подвесить
      // backpressure на стороне main thread.
      // eslint-disable-next-line no-restricted-globals
      self.postMessage({ type: "result", jobId, buffer: null, ...rect });
      return;
    }

    applyWarp({
      src: srcView,
      width: W,
      height: H,
      points,
      roi: roi || null,
      dst: dstView,
    });

    const patch = extractPatch(rect.x, rect.y, rect.w, rect.h);

    // eslint-disable-next-line no-restricted-globals
    self.postMessage(
      {
        type: "result",
        jobId,
        buffer: patch.buffer,
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
      },
      [patch.buffer],
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
