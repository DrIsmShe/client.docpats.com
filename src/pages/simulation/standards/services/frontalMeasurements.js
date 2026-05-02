// src/pages/simulation/standards/services/frontalMeasurements.js
//
// Frontal-view measurements for rhinoplasty.

const IDX = {
  GLABELLA: 9,
  NASION: 168,
  PRONASALE: 1,
  ALAR_L: 129,
  ALAR_R: 358,
  CHIN: 152,
  CANTHUS_INNER_L: 133,
  CANTHUS_INNER_R: 362,
  MOUTH_CORNER_L: 61,
  MOUTH_CORNER_R: 291,
};

function findByIndex(landmarks, mpIndex) {
  if (!landmarks || landmarks.length === 0) return null;
  return landmarks.find((lm) => lm.mediapipeIndex === mpIndex) || null;
}

function distance2D(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function signedDistanceToLine(P, A, B) {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return null;
  return ((P.x - A.x) * dy - (P.y - A.y) * dx) / len;
}

export function computeAlarToCanthalRatio(landmarks) {
  const alarL = findByIndex(landmarks, IDX.ALAR_L);
  const alarR = findByIndex(landmarks, IDX.ALAR_R);
  const innerL = findByIndex(landmarks, IDX.CANTHUS_INNER_L);
  const innerR = findByIndex(landmarks, IDX.CANTHUS_INNER_R);
  if (!alarL || !alarR || !innerL || !innerR) return null;

  const alarWidth = distance2D(alarL, alarR);
  const interCanthal = distance2D(innerL, innerR);
  if (interCanthal === 0) return null;

  const value = alarWidth / interCanthal;
  return {
    value,
    points: { alarL, alarR, innerL, innerR },
    inNormalRange: value >= 0.95 && value <= 1.05,
  };
}

export function computeNasalToMouthRatio(landmarks) {
  const alarL = findByIndex(landmarks, IDX.ALAR_L);
  const alarR = findByIndex(landmarks, IDX.ALAR_R);
  const mouthL = findByIndex(landmarks, IDX.MOUTH_CORNER_L);
  const mouthR = findByIndex(landmarks, IDX.MOUTH_CORNER_R);
  if (!alarL || !alarR || !mouthL || !mouthR) return null;

  const alarWidth = distance2D(alarL, alarR);
  const mouthWidth = distance2D(mouthL, mouthR);
  if (mouthWidth === 0) return null;

  const value = alarWidth / mouthWidth;
  return {
    value,
    points: { alarL, alarR, mouthL, mouthR },
    inNormalRange: value >= 0.65 && value <= 0.72,
  };
}

export function computeMidlineDeviation(landmarks) {
  const glabella = findByIndex(landmarks, IDX.GLABELLA);
  const chin = findByIndex(landmarks, IDX.CHIN);
  const tip = findByIndex(landmarks, IDX.PRONASALE);
  if (!glabella || !chin || !tip) return null;

  const signedDist = signedDistanceToLine(tip, glabella, chin);
  if (signedDist == null) return null;
  const value = Math.abs(signedDist);

  return {
    value,
    signedValue: signedDist,
    points: { glabella, chin, tip },
    inNormalRange: value < 0.005,
  };
}

export function computeAlarSymmetry(landmarks) {
  const glabella = findByIndex(landmarks, IDX.GLABELLA);
  const chin = findByIndex(landmarks, IDX.CHIN);
  const alarL = findByIndex(landmarks, IDX.ALAR_L);
  const alarR = findByIndex(landmarks, IDX.ALAR_R);
  if (!glabella || !chin || !alarL || !alarR) return null;

  const dL = signedDistanceToLine(alarL, glabella, chin);
  const dR = signedDistanceToLine(alarR, glabella, chin);
  if (dL == null || dR == null) return null;

  const value = Math.abs(Math.abs(dL) - Math.abs(dR));

  return {
    value,
    points: { glabella, chin, alarL, alarR },
    distances: { dL: Math.abs(dL), dR: Math.abs(dR) },
    inNormalRange: value < 0.005,
  };
}

export function computeFrontalMeasurements(landmarks) {
  return {
    alarToCanthalRatio: computeAlarToCanthalRatio(landmarks),
    nasalToMouthRatio: computeNasalToMouthRatio(landmarks),
    midlineDeviation: computeMidlineDeviation(landmarks),
    alarSymmetry: computeAlarSymmetry(landmarks),
  };
}
