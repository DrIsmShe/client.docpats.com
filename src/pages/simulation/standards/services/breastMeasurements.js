// src/pages/simulation/standards/services/breastMeasurements.js
//
// Breast measurements для мамопластики.
//
// Принимает структуру anchor points груди (ручная разметка хирурга):
//   { sternalNotch, nippleL, nippleR, imfL, imfR }
// где каждая точка — { x, y } в нормализованных координатах фото [0..1].
//
// Дополнительно требуется calibration { pixelsPerMm, imageWidth }
// для перевода нормализованных расстояний в миллиметры.
//
// Если calibration отсутствует — возвращает значения в нормализованных
// единицах с флагом `calibrated: false`. Стандарты Penn's ideal оперируют
// миллиметрами — без калибровки они не могут быть оценены, но УГЛЫ И
// СИММЕТРИЧНЫЕ ОТНОШЕНИЯ всё равно работают (асимметрия = разница, она
// безразмерна по природе).
//
// ⚠️  STATUS: SKELETON. Активная интеграция начнётся когда будет
// готова структура breast anchor points в Redux state и breast
// canvas передаст их сюда. До того момента UI стандартов мамопластики
// показывает "—" с подсказкой "Поставьте опорные точки".

/**
 * @typedef {Object} BreastAnchors
 * @property {{x:number,y:number}} sternalNotch
 * @property {{x:number,y:number}} nippleL
 * @property {{x:number,y:number}} nippleR
 * @property {{x:number,y:number}} [imfL]
 * @property {{x:number,y:number}} [imfR]
 */

/**
 * @typedef {Object} BreastCalibration
 * @property {number} pixelsPerMm
 * @property {number} imageWidth
 */

/* ────── Geometry helpers (локальные, чтобы не зависеть от mediapipe) ────── */

function dist2D(a, b) {
  if (!a || !b) return null;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

/**
 * Перевод нормализованной дистанции в миллиметры, если есть калибровка.
 * @param {number} normalized
 * @param {BreastCalibration|null} calibration
 * @returns {number|null}
 */
function toMm(normalized, calibration) {
  if (normalized == null) return null;
  if (!calibration?.pixelsPerMm || !calibration?.imageWidth) return null;
  const px = normalized * calibration.imageWidth;
  return px / calibration.pixelsPerMm;
}

function makeMeasurement(value, unit, points) {
  if (value == null || !Number.isFinite(value)) return null;
  return { value, unit, points };
}

/* ────── Individual measurements ────── */

export function computeSnToNippleL(anchors, calibration) {
  const norm = dist2D(anchors?.sternalNotch, anchors?.nippleL);
  const mm = toMm(norm, calibration);
  return makeMeasurement(mm ?? norm, mm != null ? "mm" : "norm", {
    sternalNotch: anchors?.sternalNotch,
    nippleL: anchors?.nippleL,
  });
}

export function computeSnToNippleR(anchors, calibration) {
  const norm = dist2D(anchors?.sternalNotch, anchors?.nippleR);
  const mm = toMm(norm, calibration);
  return makeMeasurement(mm ?? norm, mm != null ? "mm" : "norm", {
    sternalNotch: anchors?.sternalNotch,
    nippleR: anchors?.nippleR,
  });
}

export function computeNippleToNipple(anchors, calibration) {
  const norm = dist2D(anchors?.nippleL, anchors?.nippleR);
  const mm = toMm(norm, calibration);
  return makeMeasurement(mm ?? norm, mm != null ? "mm" : "norm", {
    nippleL: anchors?.nippleL,
    nippleR: anchors?.nippleR,
  });
}

export function computeNippleToImfL(anchors, calibration) {
  if (!anchors?.imfL) return null;
  const norm = dist2D(anchors?.nippleL, anchors.imfL);
  const mm = toMm(norm, calibration);
  return makeMeasurement(mm ?? norm, mm != null ? "mm" : "norm", {
    nippleL: anchors?.nippleL,
    imfL: anchors.imfL,
  });
}

export function computeNippleToImfR(anchors, calibration) {
  if (!anchors?.imfR) return null;
  const norm = dist2D(anchors?.nippleR, anchors.imfR);
  const mm = toMm(norm, calibration);
  return makeMeasurement(mm ?? norm, mm != null ? "mm" : "norm", {
    nippleR: anchors?.nippleR,
    imfR: anchors.imfR,
  });
}

/**
 * Симметрия — разница между SN→N левой и правой стороной.
 * Безразмерная по природе (разница расстояний).
 * Если есть калибровка, возвращаем в миллиметрах, иначе в норм. ед.
 */
export function computeTriangleSymmetry(anchors, calibration) {
  const left = dist2D(anchors?.sternalNotch, anchors?.nippleL);
  const right = dist2D(anchors?.sternalNotch, anchors?.nippleR);
  if (left == null || right == null) return null;
  const diffNorm = Math.abs(left - right);
  const mm = toMm(diffNorm, calibration);
  return makeMeasurement(mm ?? diffNorm, mm != null ? "mm" : "norm", null);
}

/* ────── Combined entry point ────── */

/**
 * Вычислить все breast measurements одним вызовом.
 * Симметрично computeAllMeasurements / computeExtendedMeasurements для лица.
 *
 * @param {BreastAnchors} anchors
 * @param {BreastCalibration|null} calibration
 * @returns {Record<string, ReturnType<typeof makeMeasurement>>}
 */
export function computeBreastMeasurements(anchors, calibration = null) {
  if (!anchors) return {};
  return {
    snToNippleL: computeSnToNippleL(anchors, calibration),
    snToNippleR: computeSnToNippleR(anchors, calibration),
    nippleToNipple: computeNippleToNipple(anchors, calibration),
    nippleToImfL: computeNippleToImfL(anchors, calibration),
    nippleToImfR: computeNippleToImfR(anchors, calibration),
    triangleSymmetry: computeTriangleSymmetry(anchors, calibration),
  };
}
