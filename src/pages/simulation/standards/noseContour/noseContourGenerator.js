// src/pages/simulation/standards/noseContour/noseContourGenerator.js
//
// Генератор контурных точек носа.
// Создаёт 12 точек по спинке (nasion → pronasale) и 20 точек
// по контуру крыльев носа (10 слева + 10 справа, симметрично).
//
// На вход — landmarks пациента (нужны: nasion, pronasale, alarL, alarR).
// На выход — массив точек с ролями.

const DORSUM_COUNT = 12;
const ALAR_COUNT_PER_SIDE = 10;

const IDX = {
  NASION: 168,
  PRONASALE: 1,
  ALAR_L: 129,
  ALAR_R: 358,
  GLABELLA: 9,
};

function findByIndex(landmarks, mpIndex) {
  if (!Array.isArray(landmarks)) return null;
  return landmarks.find((lm) => lm.mediapipeIndex === mpIndex) || null;
}

/**
 * Создаёт 12 точек по спинке носа (равномерно от nasion до pronasale).
 *
 * @param {{x,y}} nasion
 * @param {{x,y}} pronasale
 * @returns {Array<{x,y,role}>}
 */
function generateDorsumPoints(nasion, pronasale) {
  const points = [];
  for (let i = 0; i < DORSUM_COUNT; i++) {
    const t = i / (DORSUM_COUNT - 1); // 0..1
    points.push({
      x: nasion.x + (pronasale.x - nasion.x) * t,
      y: nasion.y + (pronasale.y - nasion.y) * t,
      role: `dorsum_${i}`,
    });
  }
  return points;
}

/**
 * Создаёт контур крыла носа с одной стороны.
 * Контур — это половина эллипса, описывающего ноздрю+крыло:
 *   - верхняя точка: чуть выше alarPoint (где крыло переходит в спинку)
 *   - середина (наружный край): alarPoint
 *   - нижняя точка: пронасале (низ ноздри)
 *
 * Точки распределены по эллиптической дуге.
 *
 * @param {{x,y}} alarPoint  — крайняя точка крыла (alarL или alarR)
 * @param {{x,y}} pronasale  — кончик носа
 * @param {string} side      — "left" или "right"
 * @returns {Array<{x,y,role}>}
 */
function generateAlarContour(alarPoint, pronasale, side) {
  const points = [];

  // Центр эллипса — между alarPoint и pronasale
  const cx = (alarPoint.x + pronasale.x) / 2;
  const cy = (alarPoint.y + pronasale.y) / 2;

  // Полуоси эллипса
  const halfW = Math.abs(alarPoint.x - pronasale.x) / 2;
  const halfH = Math.abs(alarPoint.y - pronasale.y) / 2;
  // Делаем эллипс шире чем расстояние, чтобы контур обнимал крыло
  const radiusX = halfW * 1.2;
  const radiusY = halfH * 1.1;

  // Угловой диапазон: для левого крыла идём от верха через
  // наружу (-X для left, +X для right) к низу.
  // Для left: angle от -π/2 (верх) через -π (наружу влево) до -3π/2 = π/2 (низ)
  //   — но это против часовой; нам нужно по часовой: от -π/2 → +π/2 через -π
  //   В терминах cos/sin: x = cx + r*cos(θ), y = cy + r*sin(θ)
  //
  // Проще задать через два анкера:
  //   t=0   → верх (y=cy-radiusY, x=cx)
  //   t=0.5 → наружу (y=cy, x=cx ± radiusX)
  //   t=1   → низ (y=cy+radiusY, x=cx)
  // Используем параметрическую форму через косинус/синус с учётом стороны.

  const sideSign = side === "left" ? -1 : 1;

  for (let i = 0; i < ALAR_COUNT_PER_SIDE; i++) {
    const t = i / (ALAR_COUNT_PER_SIDE - 1); // 0..1
    // Угол от -π/2 (верх) до +π/2 (низ), через 0 (наружу)
    const angle = -Math.PI / 2 + t * Math.PI;
    const x = cx + sideSign * radiusX * Math.cos(angle);
    const y = cy + radiusY * Math.sin(angle);
    points.push({
      x,
      y,
      role: `alar_${side}_${i}`,
    });
  }

  return points;
}

/**
 * Главный генератор. Возвращает массив всех 32 точек контура носа.
 *
 * @param {Array} landmarks   — все landmarks пациента (нужны только 4 anchor)
 * @returns {{ points: Array, anchors: Object } | null}
 */
export function generateNoseContourPoints(landmarks) {
  const nasion = findByIndex(landmarks, IDX.NASION);
  const pronasale = findByIndex(landmarks, IDX.PRONASALE);
  const alarL = findByIndex(landmarks, IDX.ALAR_L);
  const alarR = findByIndex(landmarks, IDX.ALAR_R);
  const glabella = findByIndex(landmarks, IDX.GLABELLA);

  if (!nasion || !pronasale || !alarL || !alarR) {
    // eslint-disable-next-line no-console
    console.warn("[noseContourGenerator] missing required landmarks", {
      nasion: !!nasion,
      pronasale: !!pronasale,
      alarL: !!alarL,
      alarR: !!alarR,
    });
    return null;
  }

  const dorsum = generateDorsumPoints(nasion, pronasale);
  const alarContourLeft = generateAlarContour(alarL, pronasale, "left");
  const alarContourRight = generateAlarContour(alarR, pronasale, "right");

  return {
    points: [...dorsum, ...alarContourLeft, ...alarContourRight],
    anchors: { nasion, pronasale, alarL, alarR, glabella: glabella || null },
  };
}

/**
 * Хелперы для определения роли точки.
 */
export function isDorsumPoint(role) {
  return typeof role === "string" && role.startsWith("dorsum_");
}

export function isAlarContourPoint(role) {
  return typeof role === "string" && role.startsWith("alar_");
}

export function getAlarSide(role) {
  if (typeof role !== "string") return null;
  if (role.startsWith("alar_left_")) return "left";
  if (role.startsWith("alar_right_")) return "right";
  return null;
}

/**
 * Получить парную точку с другой стороны (для симметричной коррекции).
 * alar_left_3 → alar_right_3
 */
export function getMirrorRole(role) {
  if (typeof role !== "string") return null;
  if (role.startsWith("alar_left_")) {
    return role.replace("alar_left_", "alar_right_");
  }
  if (role.startsWith("alar_right_")) {
    return role.replace("alar_right_", "alar_left_");
  }
  return null;
}
