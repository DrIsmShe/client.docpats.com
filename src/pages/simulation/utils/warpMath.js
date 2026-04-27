// src/pages/simulation/utils/warpMath.js

/* ──────────────────────────────────────────────────────────────────────────
   Local Forward Warp (Liquify-style).

   Заменяет RBF/Gaussian weighted-average warp. Ключевые отличия:

   1. СТРОГАЯ ЛОКАЛЬНОСТЬ
      Каждая control point влияет ТОЛЬКО на пиксели в пределах radius.
      За границей радиуса деформация МАТЕМАТИЧЕСКИ нулевая (не "почти ноль"
      как у Gaussian). Это исключает "вырванные куски" далёких областей.

   2. SMOOTHSTEP FALLOFF
      Внутри радиуса: w = (1-t)² · (1+2t), где t = dist/radius.
      Это smooth-Hermite-затухание: w=1 в центре, w=0 на границе,
      производные плавные. Никаких резких краёв деформации.

   3. АДДИТИВНОЕ СЛОЖЕНИЕ ВКЛАДОВ
      Несколько точек СКЛАДЫВАЮТ свои displacement'ы, не усредняют.
      Каждая точка работает в своей зоне; пересечения дают сумму.
      Это интуитивное Photoshop Liquify-style поведение.

   4. ПИКСЕЛИ ВНЕ ЛЮБОЙ ЗОНЫ — IDENTITY
      Если пиксель не попал ни в один радиус — он копируется БЕЗ
      изменений. Никаких артефактов на дальнем фоне.

   ВХОД:
     src    — Uint8ClampedArray (RGBA, W·H·4 байт)
     W, H   — пиксельные размеры
     points — control points (normalized [0..1]):
                { anchor:{x,y}, current:{x,y}, radius, strength }
              radius   — нормализованное (доля от 1.0)
              strength — множитель смещения, обычно 0.5–1.0

   ВЫХОД:
     Uint8ClampedArray тех же размеров.

   Inverse mapping: для каждого target-пикселя считаем "откуда взять цвет":
     sourceCoord = targetCoord - displacement
   Если врач тянет current ВЫШЕ anchor (displacement.y отрицательный),
   sourceY = targetY - (-..) = targetY + ..,  то есть target-пиксель
   берёт цвет ИЗ-ПОД, и визуально пиксели "поднимаются вверх" — как
   и ожидается в Photoshop Liquify Forward Warp.
   ────────────────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────────────────
   Bilinear sampler. Координаты в пиксельном пространстве.
   ────────────────────────────────────────────────────────────────────────── */
function bilinearSample(src, W, H, sx, sy, target, to) {
  if (sx < 0) sx = 0;
  else if (sx > W - 1) sx = W - 1;
  if (sy < 0) sy = 0;
  else if (sy > H - 1) sy = H - 1;

  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = x0 + 1 < W ? x0 + 1 : x0;
  const y1 = y0 + 1 < H ? y0 + 1 : y0;

  const fx = sx - x0;
  const fy = sy - y0;
  const fx1 = 1 - fx;
  const fy1 = 1 - fy;

  const w00 = fx1 * fy1;
  const w10 = fx * fy1;
  const w01 = fx1 * fy;
  const w11 = fx * fy;

  const i00 = (y0 * W + x0) * 4;
  const i10 = (y0 * W + x1) * 4;
  const i01 = (y1 * W + x0) * 4;
  const i11 = (y1 * W + x1) * 4;

  target[to] =
    src[i00] * w00 + src[i10] * w10 + src[i01] * w01 + src[i11] * w11;
  target[to + 1] =
    src[i00 + 1] * w00 +
    src[i10 + 1] * w10 +
    src[i01 + 1] * w01 +
    src[i11 + 1] * w11;
  target[to + 2] =
    src[i00 + 2] * w00 +
    src[i10 + 2] * w10 +
    src[i01 + 2] * w01 +
    src[i11 + 2] * w11;
  target[to + 3] =
    src[i00 + 3] * w00 +
    src[i10 + 3] * w10 +
    src[i01 + 3] * w01 +
    src[i11 + 3] * w11;
}

/* ──────────────────────────────────────────────────────────────────────────
   Препроцессинг: валидация + кэш квадрата радиуса и обратного радиуса.
   Заменяет старый precomputePoints из rbfKernel.js (RBF math не нужна).
   ────────────────────────────────────────────────────────────────────────── */
function preprocessPoints(points) {
  if (!Array.isArray(points)) return [];
  const result = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!p || !p.anchor || !p.current) continue;

    const ax = p.anchor.x;
    const ay = p.anchor.y;
    const cx = p.current.x;
    const cy = p.current.y;
    const radius =
      typeof p.radius === "number" && p.radius > 0 ? p.radius : 0.05;
    const strength = typeof p.strength === "number" ? p.strength : 1.0;

    const dx = cx - ax;
    const dy = cy - ay;

    // Identity points (нулевой displacement) пропускаем — экономим работу.
    if (dx === 0 && dy === 0) continue;

    result.push({
      ax,
      ay,
      dx,
      dy,
      radius,
      radiusSq: radius * radius,
      invRadius: 1 / radius,
      strength,
    });
  }
  return result;
}

/* ──────────────────────────────────────────────────────────────────────────
   Главный метод. Forward Warp с локальным smoothstep falloff'ом.
   ────────────────────────────────────────────────────────────────────────── */
export function applyWarp({ src, width, height, points }) {
  const W = width;
  const H = height;
  const dst = new Uint8ClampedArray(src.length);

  const pts = preprocessPoints(points);

  // Нет точек или все identity — тождественное преобразование, копируем.
  if (pts.length === 0) {
    dst.set(src);
    return dst;
  }

  const invW = 1 / W;
  const invH = 1 / H;
  const N = pts.length;

  for (let ty = 0; ty < H; ty++) {
    const ny = ty * invH;
    const rowOffset = ty * W * 4;

    for (let tx = 0; tx < W; tx++) {
      const nx = tx * invW;

      // Аккумулятор смещений (в normalized space)
      let dispX = 0;
      let dispY = 0;
      let anyContribution = false;

      // Накапливаем вклады всех точек
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        const ddx = nx - p.ax;
        const ddy = ny - p.ay;
        const distSq = ddx * ddx + ddy * ddy;

        // СТРОГАЯ ЛОКАЛЬНОСТЬ: за радиусом — нулевой вклад.
        if (distSq >= p.radiusSq) continue;

        const dist = Math.sqrt(distSq);
        const t = dist * p.invRadius; // ∈ [0..1)

        // Smoothstep-Hermite: (1-t)² · (1+2t)
        // в центре (t=0) → w=1, на границе (t=1) → w=0, гладко.
        const oneMinusT = 1 - t;
        const w = oneMinusT * oneMinusT * (1 + 2 * t);

        const k = w * p.strength;
        // АДДИТИВНОЕ СЛОЖЕНИЕ (не усреднение): каждая точка добавляет
        // свой вклад. Нет деления на den.
        dispX += k * p.dx;
        dispY += k * p.dy;
        anyContribution = true;
      }

      const targetIdx = rowOffset + tx * 4;

      if (!anyContribution) {
        // Пиксель вне всех зон влияния — копируем как есть.
        dst[targetIdx] = src[targetIdx];
        dst[targetIdx + 1] = src[targetIdx + 1];
        dst[targetIdx + 2] = src[targetIdx + 2];
        dst[targetIdx + 3] = src[targetIdx + 3];
        continue;
      }

      // Inverse mapping: какой source-пиксель окажется на месте target?
      const srcNx = nx - dispX;
      const srcNy = ny - dispY;
      const srcPx = srcNx * W;
      const srcPy = srcNy * H;

      bilinearSample(src, W, H, srcPx, srcPy, dst, targetIdx);
    }
  }

  return dst;
}
