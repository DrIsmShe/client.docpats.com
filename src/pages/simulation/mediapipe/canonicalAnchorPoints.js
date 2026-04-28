// src/pages/simulation/mediapipe/canonicalAnchorPoints.js
//
// Шесть опорных точек canonical face mesh от MediaPipe для 6-точечной
// ручной разметки лица (Manual Landmark Wizard, S.7.7+).
//
// Координаты — в собственной системе MediaPipe canonical_face_model:
//   • X: ≈ -0.5..0.5 (отрицательные = слева на лице, положительные = справа)
//   • Y: ≈ -1..1 (отрицательные = вверх к темени, положительные = вниз к подбородку)
//
// Источник: canonical_face_model.obj из MediaPipe репозитория, индексы
// сверены с MediaPipe FaceMesh canonical (тот же индекс что в группах
// faceLandmarksGroups.js → measurementPoints).
//
// Эти 6 точек выбраны потому что:
//   1. Они анатомически чёткие (врач не путается куда кликать)
//   2. Распределены по вертикали (лоб → подбородок) и горизонтали
//      (левое крыло — правое крыло) — это даёт устойчивый Procrustes
//   3. Совпадают с точками использующимися в measurements.js
//      (nasion, pronasale, alarL, alarR) — т.е. измерения работают
//      на 100% от пользовательских кликов

/**
 * @typedef {Object} AnchorPoint
 * @property {string} key            - стабильный ключ для UI
 * @property {number} mediapipeIndex - индекс в canonical mesh MediaPipe
 * @property {{x: number, y: number}} canonical - нормированные координаты
 * @property {string} promptKey      - i18n ключ для подсказки врачу
 */

/**
 * @type {AnchorPoint[]}
 *
 * Координаты получены из canonical_face_model.obj:
 *   - X: горизонталь, центр лица = 0
 *   - Y: вертикаль, центр глаз ≈ 0
 * Знаки выбраны чтобы соответствовать стандарту MediaPipe (Y растёт вниз
 * на 2D-плоскости, как и в нормированных координатах детектора).
 *
 * Для подгонки в Procrustes используется только 2D (X,Y) — Z игнорируется,
 * потому что пользователь кликает на 2D-фото.
 */
export const ANCHOR_POINTS = [
  {
    key: "glabella",
    mediapipeIndex: 9,
    canonical: { x: 0.0, y: -0.46 },
    promptKey: "manualLandmarks.prompts.glabella",
    promptDefault: "Кликните на лоб (между бровей)",
  },
  {
    key: "nasion",
    mediapipeIndex: 168,
    canonical: { x: 0.0, y: -0.32 },
    promptKey: "manualLandmarks.prompts.nasion",
    promptDefault: "Кликните на переносицу (самая глубокая точка)",
  },
  {
    key: "pronasale",
    mediapipeIndex: 1,
    canonical: { x: 0.0, y: 0.0 },
    promptKey: "manualLandmarks.prompts.pronasale",
    promptDefault: "Кликните на кончик носа",
  },
  {
    key: "alarLeft",
    mediapipeIndex: 129,
    canonical: { x: -0.18, y: 0.13 },
    promptKey: "manualLandmarks.prompts.alarLeft",
    promptDefault: "Кликните на левое крыло носа",
  },
  {
    key: "alarRight",
    mediapipeIndex: 358,
    canonical: { x: 0.18, y: 0.13 },
    promptKey: "manualLandmarks.prompts.alarRight",
    promptDefault: "Кликните на правое крыло носа",
  },
  {
    key: "chin",
    mediapipeIndex: 152,
    canonical: { x: 0.0, y: 0.85 },
    promptKey: "manualLandmarks.prompts.chin",
    promptDefault: "Кликните на подбородок (самая нижняя точка)",
  },
];

/**
 * Группа в которую попадает каждый ручной landmark.
 * Используется для совместимости с существующими фильтрами групп.
 */
export const ANCHOR_GROUPS = {
  glabella: "forehead",
  nasion: "nose",
  pronasale: "nose",
  alarLeft: "nose",
  alarRight: "nose",
  chin: "chin",
};
