// src/pages/simulation/utils/coordinateHelpers.js

/* ──────────────────────────────────────────────────────────────────────────
   Три системы координат в редакторе — разобраться один раз, пользоваться
   везде одинаково:

   1. IMAGE — пиксели исходного изображения. (0,0) — левый верх, (W,H) —
      правый низ. Preview downscale = 1200px max, но все IMAGE-координаты
      остаются в масштабе "того, что реально показывается", т.е. для
      фото 4000×3000 IMAGE = координаты downscaled 1200×900.
      Важно: для S.6 export мы возьмём ТЕ ЖЕ normalized-координаты и
      применим к full-res — вот почему храним в [0..1].

   2. NORMALIZED — [0..1] по обеим осям. Именно это хранится в БД
      (controlPoints.anchor, controlPoints.current). Разрешение-
      независимо.

   3. CANVAS (= screen) — пиксели на экране после viewport-трансформации
      (scale, tx, ty). Мышь приходит в CANVAS-координатах (относительно
      canvas), кликами по canvas пользователь общается с миром в CANVAS.

   Все конверсии — чистые функции. Никакого глобального state.
   ────────────────────────────────────────────────────────────────────────── */

export function normalizedToImage(nx, ny, imageW, imageH) {
  return { x: nx * imageW, y: ny * imageH };
}

export function imageToNormalized(ix, iy, imageW, imageH) {
  return { x: ix / imageW, y: iy / imageH };
}

/* ──────────────────────────────────────────────────────────────────────────
   Viewport matrix:
     canvasX = imageX * scale + tx
     canvasY = imageY * scale + ty
   ────────────────────────────────────────────────────────────────────────── */
export function imageToCanvas(ix, iy, viewport) {
  return {
    x: ix * viewport.scale + viewport.tx,
    y: iy * viewport.scale + viewport.ty,
  };
}

export function canvasToImage(cx, cy, viewport) {
  return {
    x: (cx - viewport.tx) / viewport.scale,
    y: (cy - viewport.ty) / viewport.scale,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Convenience: мышь-событие → image-координаты одним вызовом.
   element — canvas DOM node, нужен для getBoundingClientRect.
   ────────────────────────────────────────────────────────────────────────── */
export function pointerToImage(evt, element, viewport) {
  const rect = element.getBoundingClientRect();
  const cx = evt.clientX - rect.left;
  const cy = evt.clientY - rect.top;
  return canvasToImage(cx, cy, viewport);
}

/* ──────────────────────────────────────────────────────────────────────────
   Fit-to-view: вычисляет viewport (scale, tx, ty), при котором изображение
   целиком помещается в canvas с padding по краям.
   ────────────────────────────────────────────────────────────────────────── */
export function computeFitViewport({
  canvasW,
  canvasH,
  imageW,
  imageH,
  padding = 20,
}) {
  if (!imageW || !imageH || !canvasW || !canvasH) {
    return { scale: 1, tx: 0, ty: 0 };
  }

  const availW = Math.max(1, canvasW - padding * 2);
  const availH = Math.max(1, canvasH - padding * 2);

  const scale = Math.min(availW / imageW, availH / imageH);

  // Центрируем
  const tx = (canvasW - imageW * scale) / 2;
  const ty = (canvasH - imageH * scale) / 2;

  return { scale, tx, ty };
}

/* ──────────────────────────────────────────────────────────────────────────
   Clamp-helper для scale — не даём зумить в никуда.
   ────────────────────────────────────────────────────────────────────────── */
export function clampScale(scale, min = 0.1, max = 10) {
  return Math.max(min, Math.min(max, scale));
}
