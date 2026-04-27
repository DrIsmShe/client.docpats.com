// src/pages/simulation/mediapipe/measurements.js
//
// Чистые функции для анатомических измерений по landmarks.
// Все входные координаты — нормализованные [0..1], как везде в модуле.
//
// Возвращаемые значения:
//   - углы в градусах
//   - расстояния и проекции в нормализованных единицах [0..1]
//     (для перевода в мм нужна калибровка — см. S.7.6)
//
// Каждая функция возвращает либо результат, либо null если входных
// данных недостаточно (точки не найдены, лицо не в кадре и т.п.).
//
// ─── Анатомия ──────────────────────────────────────────────────────
//
// Nasofrontal angle (носо-лобный угол):
//   Угол между линиями glabella→nasion и nasion→pronasale (кончик носа).
//   Норма: 115°–135°. Используется для оценки спинки носа.
//
// Goode's tip projection (проекция кончика носа):
//   Отношение длины (alar groove → tip) к длине (alar groove → nasion).
//   Норма: ~0.55–0.60.
//
// Alar base width (ширина основания крыльев):
//   Расстояние между крайними точками крыльев носа.
//   Норма соответствует ширине между внутренними углами глаз.

import { NAMED_LANDMARK_SETS } from "./faceLandmarksGroups.js";

/* ────── Утилиты ────── */

/**
 * Возвращает landmark по mediapipeIndex или null.
 */
function findByIndex(landmarks, mpIndex) {
  if (!landmarks || landmarks.length === 0) return null;
  return landmarks.find((lm) => lm.mediapipeIndex === mpIndex) || null;
}

/**
 * Евклидово расстояние между двумя 2D-точками в нормализованных единицах.
 */
export function distance2D(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

/**
 * Угол в вершине B треугольника ABC, в градусах [0..180].
 * Возвращает null если хотя бы один сегмент нулевой длины.
 */
export function angleAtVertex(A, B, C) {
  const v1 = { x: A.x - B.x, y: A.y - B.y };
  const v2 = { x: C.x - B.x, y: C.y - B.y };

  const len1 = Math.hypot(v1.x, v1.y);
  const len2 = Math.hypot(v2.x, v2.y);
  if (len1 === 0 || len2 === 0) return null;

  const cos = (v1.x * v2.x + v1.y * v2.y) / (len1 * len2);
  // Зажимаем чтобы избежать NaN из-за floating-point ошибок
  const clamped = Math.max(-1, Math.min(1, cos));
  return (Math.acos(clamped) * 180) / Math.PI;
}

/**
 * Скалярная проекция точки P на отрезок AB.
 * Возвращает {t, projected} где t — позиция вдоль AB [0..1 если внутри отрезка],
 * projected — точка проекции на прямую AB.
 */
export function projectOntoSegment(P, A, B) {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return null;

  const t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / lenSq;
  return {
    t,
    projected: {
      x: A.x + t * dx,
      y: A.y + t * dy,
    },
  };
}

/* ────── Измерения ────── */

/**
 * Носо-лобный угол.
 * Точки: glabella (#9), nasion (#168), pronasale (#1).
 *
 * @param {Array} landmarks
 * @returns {{
 *   value: number,           // градусы
 *   points: { glabella, nasion, pronasale },
 *   inNormalRange: boolean,  // 115..135
 * } | null}
 */
export function computeNasofrontalAngle(landmarks) {
  const { glabella, nasion, pronasale } = NAMED_LANDMARK_SETS.measurementPoints;
  const G = findByIndex(landmarks, glabella);
  const N = findByIndex(landmarks, nasion);
  const P = findByIndex(landmarks, pronasale);
  if (!G || !N || !P) return null;

  const value = angleAtVertex(G, N, P);
  if (value == null) return null;

  return {
    value,
    points: { glabella: G, nasion: N, pronasale: P },
    inNormalRange: value >= 115 && value <= 135,
  };
}

/**
 * Проекция кончика носа по Goode.
 * Соотношение: расстояние(alarGroove → tip) / расстояние(alarGroove → nasion).
 *
 * Используем alarRight (#358) как точку alar groove (можно усреднять с alarLeft —
 * это не сильно меняет соотношение, но проще брать одну сторону для стабильности).
 *
 * @param {Array} landmarks
 * @returns {{
 *   value: number,           // соотношение (безразмерное)
 *   points: { alarGroove, tip, nasion },
 *   tipLine: { from, to },
 *   nasionLine: { from, to },
 *   inNormalRange: boolean,  // 0.55..0.60
 * } | null}
 */
export function computeGoodeProjection(landmarks) {
  const { alarRight, pronasale, nasion } =
    NAMED_LANDMARK_SETS.measurementPoints;
  const alar = findByIndex(landmarks, alarRight);
  const tip = findByIndex(landmarks, pronasale);
  const nas = findByIndex(landmarks, nasion);
  if (!alar || !tip || !nas) return null;

  const tipDist = distance2D(alar, tip);
  const nasionDist = distance2D(alar, nas);
  if (nasionDist === 0) return null;

  const value = tipDist / nasionDist;
  return {
    value,
    points: { alarGroove: alar, tip, nasion: nas },
    tipLine: { from: alar, to: tip },
    nasionLine: { from: alar, to: nas },
    inNormalRange: value >= 0.55 && value <= 0.6,
  };
}

/**
 * Ширина основания крыльев носа.
 * Расстояние между alarLeft (#129) и alarRight (#358).
 * Возвращает в нормализованных единицах. Для перевода в мм
 * умножь на calibration.pixelsPerMm × imageWidth (см. S.7.6).
 *
 * @param {Array} landmarks
 * @returns {{
 *   value: number,         // нормализованное расстояние
 *   points: { left, right },
 * } | null}
 */
export function computeAlarBaseWidth(landmarks) {
  const { alarLeft, alarRight } = NAMED_LANDMARK_SETS.measurementPoints;
  const L = findByIndex(landmarks, alarLeft);
  const R = findByIndex(landmarks, alarRight);
  if (!L || !R) return null;

  return {
    value: distance2D(L, R),
    points: { left: L, right: R },
  };
}

/**
 * Полный пакет измерений. Удобно вызывать из хука одним проходом.
 *
 * @param {Array} landmarks
 * @returns {{
 *   nasofrontalAngle: ReturnType<typeof computeNasofrontalAngle>,
 *   goodeProjection: ReturnType<typeof computeGoodeProjection>,
 *   alarBaseWidth: ReturnType<typeof computeAlarBaseWidth>,
 * }}
 */
export function computeAllMeasurements(landmarks) {
  return {
    nasofrontalAngle: computeNasofrontalAngle(landmarks),
    goodeProjection: computeGoodeProjection(landmarks),
    alarBaseWidth: computeAlarBaseWidth(landmarks),
  };
}

/* ────── Калибровка (задел для S.7.6) ────── */

/**
 * Перевод нормализованного расстояния в миллиметры.
 *
 * @param {number} normalizedDistance  - расстояние в [0..1] относительно фото
 * @param {Object} calibration         - { pixelsPerMm, imageWidth }
 * @returns {number|null} миллиметры или null если калибровки нет
 */
export function normalizedToMm(normalizedDistance, calibration) {
  if (!calibration?.pixelsPerMm || !calibration?.imageWidth) return null;
  const pixels = normalizedDistance * calibration.imageWidth;
  return pixels / calibration.pixelsPerMm;
}

/**
 * Форматирует значение измерения для UI.
 *
 * @param {string} type     - 'angle' | 'ratio' | 'distance'
 * @param {number} value
 * @param {Object} [calibration]  - для 'distance' — переводит в мм если есть
 * @param {number} [imageWidth]   - для 'distance' без калибровки — в px
 * @returns {{primary: string, secondary?: string}}
 */
export function formatMeasurement(type, value, calibration, imageWidth) {
  if (value == null || !Number.isFinite(value)) {
    return { primary: "—" };
  }

  if (type === "angle") {
    return { primary: `${value.toFixed(1)}°` };
  }

  if (type === "ratio") {
    return { primary: value.toFixed(2) };
  }

  if (type === "distance") {
    const mm = normalizedToMm(value, calibration);
    if (mm != null) {
      return {
        primary: `${mm.toFixed(1)} mm`,
        secondary: `${(value * 100).toFixed(1)}% width`,
      };
    }
    if (imageWidth) {
      const px = value * imageWidth;
      return {
        primary: `${px.toFixed(0)} px`,
        secondary: `${(value * 100).toFixed(1)}% width`,
      };
    }
    return { primary: `${(value * 100).toFixed(1)}%` };
  }

  return { primary: String(value) };
}
