// src/pages/simulation/breast/breastWarpGenerator.js
//
// Phase Б.2 + tuning — генератор control points с поддержкой
// warpTuning множителей.
//
// Format control points (matches applyWarp in warpMath.js):
//   { anchor: {x,y}, current: {x,y}, radius, strength }

/* ──────────────────────────────────────────────────────────────────────
   Профили имплантатов.
   ────────────────────────────────────────────────────────────────────── */
const PROFILE_MODIFIERS = {
  low: { forward: 0.7, lateral: 1.2, upward: 0.6 },
  moderate: { forward: 1.0, lateral: 1.0, upward: 1.0 },
  high: { forward: 1.3, lateral: 0.85, upward: 1.2 },
  "extra-high": { forward: 1.6, lateral: 0.7, upward: 1.4 },
};

/* ──────────────────────────────────────────────────────────────────────
   Default tuning — стартовая интенсивность.
   Все коэффициенты применяются как умножители к displacement и radius.
   ────────────────────────────────────────────────────────────────────── */
export const DEFAULT_WARP_TUNING = {
  globalStrength: 0.5, // общий множитель силы (0.1-2.0)
  globalRadius: 0.7, // множитель радиуса влияния (0.3-1.5)
  lateralBias: 1.0, // множитель горизонтальных смещений (0-2.0)
  verticalBias: 1.0, // множитель вертикальных смещений (0-2.0)
};

function getTuning(warpTuning) {
  return {
    ...DEFAULT_WARP_TUNING,
    ...(warpTuning || {}),
  };
}

/* ──────────────────────────────────────────────────────────────────────
   Volume → displacement scale.
   ────────────────────────────────────────────────────────────────────── */
function volumeToDisplacement(volumeMl) {
  if (!volumeMl || volumeMl <= 0) return 0;
  const baseline = 300;
  const ratio = Math.pow(volumeMl / baseline, 1 / 3);
  return 0.05 * ratio;
}

/* ──────────────────────────────────────────────────────────────────────
   Helper — применяет tuning к displacement vector { dx, dy }
   ────────────────────────────────────────────────────────────────────── */
function applyTuningToDisplacement(dx, dy, tuning) {
  return {
    dx: dx * tuning.globalStrength * tuning.lateralBias,
    dy: dy * tuning.globalStrength * tuning.verticalBias,
  };
}

/* ──────────────────────────────────────────────────────────────────────
   Augmentation — front view.
   ────────────────────────────────────────────────────────────────────── */
function generateAugmentationFront(anatomy, params, tuning) {
  const points = [];

  const ln = anatomy.leftNipple;
  const rn = anatomy.rightNipple;
  const sn = anatomy.sternalNotch;
  const lImf = Array.isArray(anatomy.leftIMF) ? anatomy.leftIMF : [];
  const rImf = Array.isArray(anatomy.rightIMF) ? anatomy.rightIMF : [];

  if (!ln || !rn) return points;

  const profile =
    PROFILE_MODIFIERS[params.profile] || PROFILE_MODIFIERS.moderate;

  const interNipple = Math.hypot(rn.x - ln.x, rn.y - ln.y);
  const breastRadius = interNipple * 0.45;

  const leftBaseDisplacement = volumeToDisplacement(params.leftVolumeMl);
  if (leftBaseDisplacement > 0) {
    points.push(
      ...generateBreastPoints({
        nipple: ln,
        side: "left",
        snReference: sn,
        imfPolyline: lImf,
        baseDisplacement: leftBaseDisplacement,
        breastRadius,
        profile,
        tuning,
      }),
    );
  }

  const rightBaseDisplacement = volumeToDisplacement(params.rightVolumeMl);
  if (rightBaseDisplacement > 0) {
    points.push(
      ...generateBreastPoints({
        nipple: rn,
        side: "right",
        snReference: sn,
        imfPolyline: rImf,
        baseDisplacement: rightBaseDisplacement,
        breastRadius,
        profile,
        tuning,
      }),
    );
  }

  return points;
}

function generateBreastPoints({
  nipple,
  side,
  snReference,
  imfPolyline,
  baseDisplacement,
  breastRadius,
  profile,
  tuning,
}) {
  const points = [];
  const isLeft = side === "left";
  const lateralSign = isLeft ? -1 : 1;
  const r = (factor) => breastRadius * factor * tuning.globalRadius;

  const push = (anchorX, anchorY, rawDx, rawDy, radiusFactor) => {
    const { dx, dy } = applyTuningToDisplacement(rawDx, rawDy, tuning);
    points.push({
      anchor: { x: anchorX, y: anchorY },
      current: { x: anchorX + dx, y: anchorY + dy },
      radius: r(radiusFactor),
      strength: 1.0,
    });
  };

  // 1. Сосок — слегка наружу + вверх
  push(
    nipple.x,
    nipple.y,
    lateralSign * baseDisplacement * 0.3 * profile.lateral,
    -baseDisplacement * 0.3 * profile.upward,
    0.6,
  );

  // 2. Верхний полюс — вверх
  push(
    nipple.x + lateralSign * breastRadius * 0.1,
    nipple.y - breastRadius * 0.7,
    0,
    -baseDisplacement * 0.9 * profile.upward,
    0.55,
  );

  // 3. Латеральный край — наружу
  push(
    nipple.x + lateralSign * breastRadius * 0.85,
    nipple.y,
    lateralSign * baseDisplacement * 1.0 * profile.lateral,
    0,
    0.55,
  );

  // 4. Медиальный край — слегка к центру (cleavage)
  push(
    nipple.x - lateralSign * breastRadius * 0.55,
    nipple.y + breastRadius * 0.05,
    -lateralSign * baseDisplacement * 0.25,
    0,
    0.45,
  );

  // 5. Верхне-латеральная диагональ
  push(
    nipple.x + lateralSign * breastRadius * 0.55,
    nipple.y - breastRadius * 0.5,
    lateralSign * baseDisplacement * 0.6 * profile.lateral,
    -baseDisplacement * 0.6 * profile.upward,
    0.5,
  );

  // 6. Верхне-медиальная диагональ — décolleté
  push(
    nipple.x - lateralSign * breastRadius * 0.35,
    nipple.y - breastRadius * 0.55,
    0,
    -baseDisplacement * 0.5 * profile.upward,
    0.45,
  );

  // 7. Нижний полюс — IMF descent при больших объёмах
  const imfDescentFactor = Math.max(0, baseDisplacement - 0.04);
  push(
    nipple.x + lateralSign * breastRadius * 0.05,
    nipple.y + breastRadius * 0.7,
    0,
    imfDescentFactor * 0.6,
    0.55,
  );

  return points;
}

/* ──────────────────────────────────────────────────────────────────────
   Reduction
   ────────────────────────────────────────────────────────────────────── */
function generateReductionFront(anatomy, params, tuning) {
  const points = [];
  const ln = anatomy.leftNipple;
  const rn = anatomy.rightNipple;
  if (!ln || !rn) return points;

  const interNipple = Math.hypot(rn.x - ln.x, rn.y - ln.y);
  const breastRadius = interNipple * 0.45;
  const liftMm = params.nippleLiftMm || 0;
  const liftNorm = liftMm * 0.0015;
  const r = (factor) => breastRadius * factor * tuning.globalRadius;

  const push = (anchorX, anchorY, rawDx, rawDy, radiusFactor) => {
    const { dx, dy } = applyTuningToDisplacement(rawDx, rawDy, tuning);
    points.push({
      anchor: { x: anchorX, y: anchorY },
      current: { x: anchorX + dx, y: anchorY + dy },
      radius: r(radiusFactor),
      strength: 1.0,
    });
  };

  for (const side of ["left", "right"]) {
    const isLeft = side === "left";
    const lateralSign = isLeft ? -1 : 1;
    const nipple = isLeft ? ln : rn;
    const volumeMl = isLeft ? params.leftVolumeMl : params.rightVolumeMl;
    if (!volumeMl) continue;

    const shrink = volumeToDisplacement(volumeMl) * 0.8;

    // Сосок поднимается
    push(nipple.x, nipple.y, 0, -liftNorm - shrink * 0.2, 0.5);

    // Латеральный край — внутрь
    push(
      nipple.x + lateralSign * breastRadius * 0.8,
      nipple.y,
      -lateralSign * shrink,
      0,
      0.5,
    );

    // Нижний край — вверх
    push(
      nipple.x,
      nipple.y + breastRadius * 0.7,
      0,
      -shrink * 0.7 - liftNorm * 0.5,
      0.55,
    );
  }

  return points;
}

/* ──────────────────────────────────────────────────────────────────────
   Mastopexy
   ────────────────────────────────────────────────────────────────────── */
function generateMastopexyFront(anatomy, params, tuning) {
  const points = [];
  const ln = anatomy.leftNipple;
  const rn = anatomy.rightNipple;
  if (!ln || !rn) return points;

  const interNipple = Math.hypot(rn.x - ln.x, rn.y - ln.y);
  const breastRadius = interNipple * 0.45;
  const liftMm = params.nippleLiftMm || 0;
  const liftNorm = liftMm * 0.0018;
  const r = (factor) => breastRadius * factor * tuning.globalRadius;

  const push = (anchorX, anchorY, rawDx, rawDy, radiusFactor) => {
    const { dx, dy } = applyTuningToDisplacement(rawDx, rawDy, tuning);
    points.push({
      anchor: { x: anchorX, y: anchorY },
      current: { x: anchorX + dx, y: anchorY + dy },
      radius: r(radiusFactor),
      strength: 1.0,
    });
  };

  const sides = [];
  if (params.side === "both" || params.side === "left") sides.push(ln);
  if (params.side === "both" || params.side === "right") sides.push(rn);

  for (const nipple of sides) {
    push(nipple.x, nipple.y, 0, -liftNorm, 0.5);
    push(nipple.x, nipple.y + breastRadius * 0.5, 0, -liftNorm * 0.5, 0.55);
  }

  return points;
}

/* ──────────────────────────────────────────────────────────────────────
   Asymmetry
   ────────────────────────────────────────────────────────────────────── */
function generateAsymmetryFront(anatomy, params, tuning) {
  const ln = anatomy.leftNipple;
  const rn = anatomy.rightNipple;
  if (!ln || !rn) return [];

  const interNipple = Math.hypot(rn.x - ln.x, rn.y - ln.y);
  const breastRadius = interNipple * 0.45;
  const isLeft = params.targetSide === "left";
  const lateralSign = isLeft ? -1 : 1;
  const nipple = isLeft ? ln : rn;

  const liftNorm = (params.nippleLiftMm || 0) * 0.0018;

  if (params.correctionType === "augment") {
    const baseDisplacement = volumeToDisplacement(params.volumeMl);
    const profile = PROFILE_MODIFIERS.moderate;
    const points = generateBreastPoints({
      nipple,
      side: params.targetSide,
      snReference: anatomy.sternalNotch,
      imfPolyline: [],
      baseDisplacement,
      breastRadius,
      profile,
      tuning,
    });

    if (liftNorm > 0 && points.length > 0) {
      points[0].current.y -=
        liftNorm * tuning.globalStrength * tuning.verticalBias;
    }
    return points;
  }

  // Reduction
  const points = [];
  const r = (factor) => breastRadius * factor * tuning.globalRadius;
  const shrink = volumeToDisplacement(params.volumeMl) * 0.8;

  const push = (anchorX, anchorY, rawDx, rawDy, radiusFactor) => {
    const { dx, dy } = applyTuningToDisplacement(rawDx, rawDy, tuning);
    points.push({
      anchor: { x: anchorX, y: anchorY },
      current: { x: anchorX + dx, y: anchorY + dy },
      radius: r(radiusFactor),
      strength: 1.0,
    });
  };

  push(nipple.x, nipple.y, 0, -liftNorm - shrink * 0.2, 0.5);
  push(
    nipple.x + lateralSign * breastRadius * 0.8,
    nipple.y,
    -lateralSign * shrink,
    0,
    0.5,
  );

  return points;
}

/* ──────────────────────────────────────────────────────────────────────
   PUBLIC API
   ────────────────────────────────────────────────────────────────────── */

export function generateBreastControlPoints({
  anatomy,
  operation,
  photoView,
  warpTuning,
}) {
  if (!operation || !operation.type || operation.enabled === false) {
    return [];
  }

  const params = operation.params || {};
  const tuning = getTuning(warpTuning);

  if (photoView !== "front") return [];

  switch (operation.type) {
    case "augmentation":
      return generateAugmentationFront(anatomy, params, tuning);
    case "reduction":
      return generateReductionFront(anatomy, params, tuning);
    case "mastopexy":
      return generateMastopexyFront(anatomy, params, tuning);
    case "asymmetry":
      return generateAsymmetryFront(anatomy, params, tuning);
    default:
      return [];
  }
}

export function isWarpReady(anatomy, photoView) {
  if (photoView !== "front") return false;
  return !!(anatomy?.leftNipple && anatomy?.rightNipple);
}
