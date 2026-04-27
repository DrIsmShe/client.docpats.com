// client/src/pages/simulation/mediapipe/faceLandmarksGroups.js
//
// Маппинг индексов MediaPipe Face Mesh (468 точек) на анатомические группы.
// ВСЕ 468 индексов получают группу — нет невидимых точек.
// Не вошедшие в специальные группы → group="other" (нейтрально-серый).
//
// Группы:
//   face_oval, forehead, nose, lips,
//   left_eye, right_eye, left_eyebrow, right_eyebrow,
//   left_cheek, right_cheek, left_jaw, right_jaw, chin,
//   ears,        // ← S.7.5+ — крайние латеральные точки (перед ушами)
//   manual,      // ручные пользовательские точки
//   other.
//
// Примечание про уши: MediaPipe Face Landmarker НЕ детектирует точки
// на ушных раковинах — модель тренирована на лицах. Точки 234, 454,
// 127, 356, 162, 389 — самые латеральные на черепе (за глазом, перед
// козелком уха). Это максимум что доступно без дополнительной ML модели.

export const LANDMARK_GROUPS = {
  FACE_OVAL: "face_oval",
  FOREHEAD: "forehead",
  NOSE: "nose",
  LIPS: "lips",
  LEFT_EYE: "left_eye",
  RIGHT_EYE: "right_eye",
  LEFT_EYEBROW: "left_eyebrow",
  RIGHT_EYEBROW: "right_eyebrow",
  LEFT_CHEEK: "left_cheek",
  RIGHT_CHEEK: "right_cheek",
  LEFT_JAW: "left_jaw",
  RIGHT_JAW: "right_jaw",
  CHIN: "chin",
  EARS: "ears",
  MANUAL: "manual",
  OTHER: "other",
};

export const ANATOMY_GROUPS_FOR_UI = [
  LANDMARK_GROUPS.FACE_OVAL,
  LANDMARK_GROUPS.FOREHEAD,
  LANDMARK_GROUPS.NOSE,
  LANDMARK_GROUPS.LIPS,
  LANDMARK_GROUPS.LEFT_EYE,
  LANDMARK_GROUPS.RIGHT_EYE,
  LANDMARK_GROUPS.LEFT_EYEBROW,
  LANDMARK_GROUPS.RIGHT_EYEBROW,
  LANDMARK_GROUPS.LEFT_CHEEK,
  LANDMARK_GROUPS.RIGHT_CHEEK,
  LANDMARK_GROUPS.LEFT_JAW,
  LANDMARK_GROUPS.RIGHT_JAW,
  LANDMARK_GROUPS.CHIN,
  LANDMARK_GROUPS.EARS,
  LANDMARK_GROUPS.OTHER,
];

// ─── FACE OVAL (контур лица — расширенный) ─────────────────────
// Полный канонический face_oval из MediaPipe + дополнительные
// промежуточные точки для плотности.
const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
  // Дополнительные точки overlap'ом (промежуточные между крайними)
  151, 9, 8, 168, 6,
];

// ─── FOREHEAD (лоб) ────────────────────────────────────────────
const FOREHEAD_INDICES = [
  9, 8, 107, 336, 151, 337, 299, 333, 298, 301, 368, 264, 447, 366, 401, 435,
  367, 364, 416, 376, 411, 425, 280, 352, 345, 372, 383, 300, 293, 334, 296,
  108, 69, 104, 68, 71, 139, 34, 227, 137, 177, 215, 138, 192, 213, 147, 187,
  205, 36, 142, 100, 101, 50, 123,
];

// ─── NOSE (нос) — РАСШИРЕННЫЙ ──────────────────────────────────
// Bridge (спинка): переносица → кончик, плотнее
const NOSE_BRIDGE = [168, 6, 197, 195, 5, 4, 1, 19, 94];

// Tip (кончик): основная точка + латеральные кончика
const NOSE_TIP = [1, 4, 19, 94, 2, 164];

// Sidewalls (боковые стенки) — слева и справа от спинки
const NOSE_SIDEWALLS = [
  45, 51, 220, 115, 48, 64, 102, 49, 275, 281, 440, 344, 278, 294, 331, 279,
];

// Alar base (основание крыльев)
const NOSE_ALAR_BASE = [98, 327, 131, 360, 49, 279, 209, 429];

// Ala (крылья носа) — обе стороны
const NOSE_ALA = [219, 166, 129, 126, 142, 439, 392, 358, 355, 371];

// Nostril sills (под ноздрями)
const NOSE_NOSTRILS = [64, 294, 102, 331, 240, 460, 75, 305];

// Subnasale (под кончиком, переход к губам)
const NOSE_SUBNASALE = [2, 326, 97, 99, 328, 167, 393];

const NOSE_INDICES = [
  ...NOSE_BRIDGE,
  ...NOSE_TIP,
  ...NOSE_SIDEWALLS,
  ...NOSE_ALAR_BASE,
  ...NOSE_ALA,
  ...NOSE_NOSTRILS,
  ...NOSE_SUBNASALE,
];

// ─── LIPS ──────────────────────────────────────────────────────
const LIPS_OUTER = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37,
  39, 40, 185,
];
const LIPS_INNER = [
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82,
  81, 80, 191,
];
const LIPS_INDICES = [...LIPS_OUTER, ...LIPS_INNER];

// ─── EYES ──────────────────────────────────────────────────────
const LEFT_EYE_INDICES = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
];
const RIGHT_EYE_INDICES = [
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384,
  398,
];

// ─── EYEBROWS ──────────────────────────────────────────────────
const LEFT_EYEBROW_INDICES = [46, 53, 52, 65, 55, 70, 63, 105, 66, 107];
const RIGHT_EYEBROW_INDICES = [
  276, 283, 282, 295, 285, 300, 293, 334, 296, 336,
];

// ─── EARS (крайние латеральные точки около ушей) ────────────────
// MediaPipe не даёт точки на самих ушах. Это самые "ушные" точки
// которые есть — латеральная граница между лицом и областью уха.
// Если врач хочет помечать точки на ушах — пусть использует режим
// "Добавить" для ручной разметки.
const EARS_INDICES = [
  234, // нижний край слева (перед козелком)
  454, // нижний край справа
  127, // средний слева
  356, // средний справа
  162, // верхний слева
  389, // верхний справа
  93, // под левым ухом
  323, // под правым ухом
  21, // выше виска слева
  251, // выше виска справа
];

// ─── CHEEKS ────────────────────────────────────────────────────
const LEFT_CHEEK_INDICES = [
  117, 118, 119, 120, 121, 47, 121, 126, 142, 36, 205, 207, 187, 192, 213, 216,
  212, 202, 169, 170, 140, 171,
];
const RIGHT_CHEEK_INDICES = [
  346, 347, 348, 349, 350, 277, 350, 355, 371, 266, 425, 427, 411, 416, 433,
  436, 432, 422, 394, 395, 369, 396,
];

// ─── JAW ───────────────────────────────────────────────────────
const LEFT_JAW_INDICES = [
  172, 136, 169, 150, 149, 176, 148, 138, 215, 177, 137,
];
const RIGHT_JAW_INDICES = [
  397, 365, 394, 379, 378, 400, 377, 367, 435, 401, 366,
];

// ─── CHIN ──────────────────────────────────────────────────────
const CHIN_INDICES = [
  152, 175, 199, 200, 18, 83, 313, 421, 32, 262, 369, 396, 140, 171, 208, 428,
];

// ─── Построение карты: индекс → группа ─────────────────────────
const INDEX_TO_GROUP = new Map();

function registerGroup(indices, groupName) {
  indices.forEach((idx) => {
    if (!INDEX_TO_GROUP.has(idx)) {
      INDEX_TO_GROUP.set(idx, groupName);
    }
  });
}

// Порядок: специфичные группы регистрируются первыми, чтобы выиграть
// при пересечениях (например, точка 234 сначала уйдёт в EARS,
// потом FACE_OVAL не перетрёт).
registerGroup(EARS_INDICES, LANDMARK_GROUPS.EARS);
registerGroup(NOSE_INDICES, LANDMARK_GROUPS.NOSE);
registerGroup(LIPS_INDICES, LANDMARK_GROUPS.LIPS);
registerGroup(LEFT_EYE_INDICES, LANDMARK_GROUPS.LEFT_EYE);
registerGroup(RIGHT_EYE_INDICES, LANDMARK_GROUPS.RIGHT_EYE);
registerGroup(LEFT_EYEBROW_INDICES, LANDMARK_GROUPS.LEFT_EYEBROW);
registerGroup(RIGHT_EYEBROW_INDICES, LANDMARK_GROUPS.RIGHT_EYEBROW);
registerGroup(CHIN_INDICES, LANDMARK_GROUPS.CHIN);
registerGroup(LEFT_JAW_INDICES, LANDMARK_GROUPS.LEFT_JAW);
registerGroup(RIGHT_JAW_INDICES, LANDMARK_GROUPS.RIGHT_JAW);
registerGroup(LEFT_CHEEK_INDICES, LANDMARK_GROUPS.LEFT_CHEEK);
registerGroup(RIGHT_CHEEK_INDICES, LANDMARK_GROUPS.RIGHT_CHEEK);
registerGroup(FOREHEAD_INDICES, LANDMARK_GROUPS.FOREHEAD);
registerGroup(FACE_OVAL_INDICES, LANDMARK_GROUPS.FACE_OVAL);

// Все остальные индексы (0..467) → OTHER. 100% покрытие.
const TOTAL_LANDMARKS = 468;
for (let idx = 0; idx < TOTAL_LANDMARKS; idx++) {
  if (!INDEX_TO_GROUP.has(idx)) {
    INDEX_TO_GROUP.set(idx, LANDMARK_GROUPS.OTHER);
  }
}

export function getLandmarkGroup(mediapipeIndex) {
  return INDEX_TO_GROUP.get(mediapipeIndex) || LANDMARK_GROUPS.OTHER;
}

export function getIndicesByGroup(groupName) {
  const result = [];
  INDEX_TO_GROUP.forEach((group, idx) => {
    if (group === groupName) result.push(idx);
  });
  return result;
}

export const NAMED_LANDMARK_SETS = {
  nose: {
    bridge: NOSE_BRIDGE,
    tip: NOSE_TIP,
    sidewalls: NOSE_SIDEWALLS,
    alarBase: NOSE_ALAR_BASE,
    ala: NOSE_ALA,
    nostrils: NOSE_NOSTRILS,
    subnasale: NOSE_SUBNASALE,
  },
  measurementPoints: {
    glabella: 9,
    nasion: 168,
    pronasale: 1,
    subnasale: 2,
    alarLeft: 129,
    alarRight: 358,
    alaTip: 94,
  },
};
