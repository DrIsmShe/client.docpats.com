// src/pages/simulation/breast/breastControlPointsGenerator.js
//
// Phase Б.2 v3 — Генератор preset control points по периметру ареолы.
//
// Логика:
//   1. Если разметили leftAreolaEdge / rightAreolaEdge как polyline — берём
//      эти точки напрямую как anchor'ы.
//   2. Если ареолу не разметили, но есть сосок — рисуем виртуальный круг
//      вокруг соска радиусом ≈ 5% normalized.
//   3. Каждая точка получает displacement в зависимости от:
//      • Своего положения относительно соска (наружу/внутрь/вверх/вниз)
//      • Operation params (volume → магнитуда, profile → распределение)
//   4. Радиус влияния на каждую точку — подобранный, чтобы зоны не
//      перекрывались слишком сильно.

const PROFILE_MODIFIERS = {
  low: { forward: 0.7, lateral: 1.2, upward: 0.6 },
  moderate: { forward: 1.0, lateral: 1.0, upward: 1.0 },
  high: { forward: 1.3, lateral: 0.85, upward: 1.2 },
  "extra-high": { forward: 1.6, lateral: 0.7, upward: 1.4 },
};

/* ──────────────────────────────────────────────────────────────────────
   Volume → displacement.
   Возвращает базовое нормализованное смещение в долях изображения.
   ────────────────────────────────────────────────────────────────────── */
function volumeToDisplacement(volumeMl) {
  if (!volumeMl || volumeMl <= 0) return 0;
  const baseline = 300;
  const ratio = Math.pow(volumeMl / baseline, 1 / 3);
  return 0.04 * ratio;
}

/* ──────────────────────────────────────────────────────────────────────
   Если ареола не размечена — генерируем виртуальный круг вокруг соска.
   ────────────────────────────────────────────────────────────────────── */
function generateVirtualAreola(nipple, radius = 0.05, count = 8) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2; // start from top
    points.push({
      x: nipple.x + Math.cos(angle) * radius,
      y: nipple.y + Math.sin(angle) * radius,
    });
  }
  return points;
}

/* ──────────────────────────────────────────────────────────────────────
   Если ареола размечена меньшим количеством точек, чем нужно —
   досемплируем по периметру равномерно.

   На вход: массив точек polyline (минимум 3, замкнутый по логике).
   На выход: массив из desiredCount точек.
   ────────────────────────────────────────────────────────────────────── */
function resamplePolyline(points, desiredCount = 8) {
  if (points.length === 0) return [];
  if (points.length === 1) return [points[0]];

  // Замыкаем polyline (первая точка = последняя)
  const closed = [...points, points[0]];

  // Считаем длины сегментов
  const segments = [];
  let total = 0;
  for (let i = 1; i < closed.length; i++) {
    const dx = closed[i].x - closed[i - 1].x;
    const dy = closed[i].y - closed[i - 1].y;
    const len = Math.hypot(dx, dy);
    segments.push({ from: closed[i - 1], to: closed[i], len, cumStart: total });
    total += len;
  }

  if (total === 0) return [points[0]];

  const result = [];
  for (let i = 0; i < desiredCount; i++) {
    const targetDist = (i / desiredCount) * total;
    // Находим сегмент в котором лежит targetDist
    let seg = segments[0];
    for (const s of segments) {
      if (s.cumStart + s.len >= targetDist) {
        seg = s;
        break;
      }
    }
    const t = (targetDist - seg.cumStart) / Math.max(seg.len, 1e-9);
    result.push({
      x: seg.from.x + (seg.to.x - seg.from.x) * t,
      y: seg.from.y + (seg.to.y - seg.from.y) * t,
    });
  }
  return result;
}

/* ──────────────────────────────────────────────────────────────────────
   Для одной точки на ареоле — рассчитываем displacement вектор.

   Правило:
   • Точка относительно соска имеет угол angle и dist от соска.
   • Augmentation: точка ВЫТАЛКИВАЕТСЯ радиально от соска
     (наружу = расширение объёма).
   • При этом верхние точки получают доп. вертикальный подъём (upper pole),
     нижние — почти не двигаются (avoid IMF descent).
   • Латеральные точки получают усиление наружу (форма "наружу+вверх").
   ────────────────────────────────────────────────────────────────────── */
function computeAugmentationDisplacement({
  point,
  nipple,
  side,
  baseDisplacement,
  profile,
}) {
  const dx = point.x - nipple.x;
  const dy = point.y - nipple.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return { dx: 0, dy: 0 };

  // Радиальное направление от соска
  const ux = dx / dist;
  const uy = dy / dist;

  const isLeft = side === "left";
  const lateralSign = isLeft ? -1 : 1;

  // Проверяем — латеральная это точка или медиальная (по знаку x относительно соска)
  const isLateralSide = ux * lateralSign > 0;
  const lateralBoost = isLateralSide ? profile.lateral : 0.6; // медиальные слабее
  const upperBoost = uy < 0 ? profile.upward : 0.4; // нижние почти не двигаются

  // Радиальный outward push, масштабированный по позиции
  const outwardMag = baseDisplacement * lateralBoost * upperBoost;

  // Доп. вертикальный лифт для верхних точек
  const verticalLift = uy < -0.3 ? -baseDisplacement * 0.4 * profile.upward : 0;

  return {
    dx: ux * outwardMag,
    dy: uy * outwardMag + verticalLift,
  };
}

function computeReductionDisplacement({
  point,
  nipple,
  baseDisplacement,
  liftNorm,
}) {
  const dx = point.x - nipple.x;
  const dy = point.y - nipple.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return { dx: 0, dy: -liftNorm };

  const ux = dx / dist;
  const uy = dy / dist;

  // Все точки тянутся К соску (схлопывание) + сосок поднимается
  return {
    dx: -ux * baseDisplacement,
    dy: -uy * baseDisplacement - liftNorm * 0.5,
  };
}

function computeMastopexyDisplacement({ point, nipple, liftNorm }) {
  const dy = point.y - nipple.y;
  // Подъём пропорционален расстоянию от соска вниз
  const isBelow = dy > 0;
  const liftAmount = isBelow
    ? liftNorm * (1 - Math.min(1, dy / 0.15))
    : liftNorm;

  return {
    dx: 0,
    dy: -liftAmount,
  };
}

/* ──────────────────────────────────────────────────────────────────────
   Главная функция — генерирует array control points для одной груди.

   Каждая точка имеет:
     key       — стабильный ID (нужен для merge с manually-edited)
     anchor    — исходная позиция точки
     current   — куда тянем (anchor + displacement)
     radius    — радиус влияния
     strength  — 1.0
     label     — человекочитаемое имя (для UI)
     auto      — true (помечаем что preset, чтобы при regenerate знать что
                  безопасно перезаписывать)
   ────────────────────────────────────────────────────────────────────── */
function generatePointsForBreast({
  side,
  nipple,
  areolaPolyline,
  operation,
  pointCount = 8,
  pointRadius = 0.06,
}) {
  if (!nipple) return [];

  // 1. Получаем перимтер ареолы
  let perimeterPoints = [];
  if (Array.isArray(areolaPolyline) && areolaPolyline.length >= 3) {
    perimeterPoints = resamplePolyline(areolaPolyline, pointCount);
  } else {
    perimeterPoints = generateVirtualAreola(nipple, 0.05, pointCount);
  }

  if (perimeterPoints.length === 0) return [];

  const params = operation?.params || {};
  const opType = operation?.type;
  const profileName = params.profile || "moderate";
  const profile = PROFILE_MODIFIERS[profileName] || PROFILE_MODIFIERS.moderate;

  const volumeMl =
    side === "left"
      ? (params.leftVolumeMl ?? params.volumeMl ?? 0)
      : (params.rightVolumeMl ?? params.volumeMl ?? 0);
  const baseDisplacement = volumeToDisplacement(volumeMl);
  const liftNorm = (params.nippleLiftMm || 0) * 0.0015;

  const points = [];

  // Сама центральная точка соска
  points.push({
    key: `${side}-nipple`,
    anchor: { x: nipple.x, y: nipple.y },
    current: { x: nipple.x, y: nipple.y - liftNorm },
    radius: pointRadius * 0.7,
    strength: 1.0,
    label: `${side === "left" ? "Левый" : "Правый"} сосок`,
    auto: true,
    side,
  });

  // Точки по периметру ареолы
  perimeterPoints.forEach((p, idx) => {
    let dx = 0;
    let dy = 0;

    if (opType === "augmentation") {
      const disp = computeAugmentationDisplacement({
        point: p,
        nipple,
        side,
        baseDisplacement,
        profile,
      });
      dx = disp.dx;
      dy = disp.dy;
    } else if (opType === "reduction") {
      const disp = computeReductionDisplacement({
        point: p,
        nipple,
        baseDisplacement: baseDisplacement * 0.8,
        liftNorm,
      });
      dx = disp.dx;
      dy = disp.dy;
    } else if (opType === "mastopexy") {
      const sideMatch =
        params.side === "both" ||
        (params.side === "left" && side === "left") ||
        (params.side === "right" && side === "right");
      if (sideMatch) {
        const disp = computeMastopexyDisplacement({
          point: p,
          nipple,
          liftNorm,
        });
        dx = disp.dx;
        dy = disp.dy;
      }
    } else if (opType === "asymmetry") {
      const targetSideMatch = params.targetSide === side;
      if (targetSideMatch) {
        if (params.correctionType === "augment") {
          const disp = computeAugmentationDisplacement({
            point: p,
            nipple,
            side,
            baseDisplacement: volumeToDisplacement(params.volumeMl || 0),
            profile,
          });
          dx = disp.dx;
          dy = disp.dy;
        } else {
          const disp = computeReductionDisplacement({
            point: p,
            nipple,
            baseDisplacement: volumeToDisplacement(params.volumeMl || 0) * 0.8,
            liftNorm,
          });
          dx = disp.dx;
          dy = disp.dy;
        }
      }
    }

    points.push({
      key: `${side}-areola-${idx}`,
      anchor: { x: p.x, y: p.y },
      current: { x: p.x + dx, y: p.y + dy },
      radius: pointRadius,
      strength: 1.0,
      label: `${side === "left" ? "L" : "R"} ареола ${idx + 1}`,
      auto: true,
      side,
    });
  });

  return points;
}

/* ──────────────────────────────────────────────────────────────────────
   PUBLIC — generate preset для всего плана.
   ────────────────────────────────────────────────────────────────────── */
export function generatePresetControlPoints({ anatomy, operation, photoView }) {
  if (photoView !== "front") return [];
  if (!operation || !operation.type) return [];

  const result = [];

  if (anatomy.leftNipple) {
    result.push(
      ...generatePointsForBreast({
        side: "left",
        nipple: anatomy.leftNipple,
        areolaPolyline: anatomy.leftAreolaEdge,
        operation,
      }),
    );
  }

  if (anatomy.rightNipple) {
    result.push(
      ...generatePointsForBreast({
        side: "right",
        nipple: anatomy.rightNipple,
        areolaPolyline: anatomy.rightAreolaEdge,
        operation,
      }),
    );
  }

  return result;
}

/**
 * Проверка — можно ли сгенерировать preset.
 */
export function canGeneratePreset(anatomy, photoView) {
  if (photoView !== "front") return false;
  return !!(anatomy?.leftNipple || anatomy?.rightNipple);
}
