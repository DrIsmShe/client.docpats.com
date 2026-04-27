// src/pages/simulation/utils/rbfKernel.js

/* ──────────────────────────────────────────────────────────────────────────
   Radial Basis Function (RBF) kernel с Gaussian falloff.

   Для каждой control point i с anchor=(ax,ay), radius=r, strength=s мы
   хотим: вес влияния на произвольную точку (px,py) убывает плавно с
   расстоянием и полностью исчезает где-то около 3·radius (стандартные
   3-sigma правило для Gaussian).

     w(p, i) = exp(-dist²(p, anchor_i) / (2 · radius_i²)) · |strength_i|

   Веса мы НЕ нормализуем здесь — нормализация идёт в warpMath при
   вычислении weighted sum displacement'ов.

   Все операции работают в НОРМАЛИЗОВАННЫХ координатах [0..1]. Это даёт
   одинаковое поведение на preview 1200px и на full-res 4000px export:
   radius=0.1 означает "10% от длинной стороны", что визуально одинаково.

   ВАЖНО: внутри этого файла всё чистое. Никаких React, никаких DOM, ни
   даже imports. Поэтому его можно импортировать и в main thread, и в
   Web Worker, и в будущем — на backend для server-side export (S.6+).
   ────────────────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────────────────
   Squared distance — без sqrt (экономия на N·M операциях на кадр;
   квадрат расстояния в exp() всё равно нужен).
   ────────────────────────────────────────────────────────────────────────── */
export function distSquared(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/* ──────────────────────────────────────────────────────────────────────────
   Gaussian weight. Возвращает 0..1, причём:
     distSq = 0      → 1  (в самом anchor'е максимальное влияние)
     distSq = r²     → exp(-0.5) ≈ 0.607  (на границе "радиуса" — 60% влияния)
     distSq = 9·r²   → exp(-4.5) ≈ 0.011  (3-sigma, практически ноль)

   Ранний exit когда мы далеко за 3-sigma — основная оптимизация. Без него
   каждый пиксель проходит через exp() для каждой точки, даже если она на
   другом конце изображения.
   ────────────────────────────────────────────────────────────────────────── */
export function gaussianWeight(distSq, radius) {
  const r2 = radius * radius;
  // Cut-off: за 3·radius влияние < 1%, можно считать нулём.
  if (distSq > 9 * r2) return 0;
  return Math.exp(-distSq / (2 * r2));
}

/* ──────────────────────────────────────────────────────────────────────────
   Pre-compute: для каждой точки сохраняем r² и 9·r² (cutoff squared),
   1/(2·r²) (делитель в exp). Хоть это микрооптимизации — они 
   выполняются раз на кадр на все N points, а Gaussian внутри — W·H раз
   на кадр. Убираем лишние умножения.
   ────────────────────────────────────────────────────────────────────────── */
export function precomputePoints(points) {
  const out = new Array(points.length);
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const r = Math.max(0.001, p.radius); // защита от div-by-zero
    const r2 = r * r;
    out[i] = {
      ax: p.anchor.x,
      ay: p.anchor.y,
      dx: p.current.x - p.anchor.x, // displacement vector в normalized
      dy: p.current.y - p.anchor.y,
      r2,
      cutoffSq: 9 * r2, // за этим — вес 0
      invTwoR2: 1 / (2 * r2), // делитель для exp
      strengthAbs: Math.abs(p.strength),
      // sign используется ДО weighted avg: strength<0 = инвертируем displacement
      sign: p.strength < 0 ? -1 : 1,
    };
  }
  return out;
}
