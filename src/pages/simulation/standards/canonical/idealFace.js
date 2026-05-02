// src/pages/simulation/standards/canonical/idealFace.js
//
// CANONICAL IDEAL FACE — Anthropometric Reference Points
// =====================================================================
//
// Карта анатомических ориентиров идеального лица в face-relative
// координатах. Все значения нормированы:
//   - Y по высоте лица (trichion → menton = 1.0)
//   - X по ширине лица (по zygion-zygion = 0.71-0.75 от высоты)
//
// Координатная система:
//   - origin (0, 0) = левый верхний угол bounding box лица
//   - X увеличивается вправо
//   - Y увеличивается вниз (как в нормальных pixel coordinates)
//   - midline X = 0.5
//
// SOURCES:
//   1. Farkas LG. Anthropometry of the Head and Face. 2nd ed.
//      New York: Raven Press; 1994.
//   2. Naini FB. Facial Aesthetics: Concepts and Clinical Diagnosis.
//      Wiley-Blackwell; 2011.
//   3. Powell N, Humphrey B. Proportions of the Aesthetic Face.
//      Thieme-Stratton; 1984.
//   4. Goode RL. A method of tip projection measurement. In: Powell &
//      Humphrey eds. Thieme-Stratton; 1984.
//   5. Marquardt SR. Diagnosis and treatment of dental and facial
//      disproportion using the GRG (Golden Ratio Geometry) technique.
//      J Esthet Restor Dent. 2002.
//
// VERTICAL THIRDS (Vitruvian + Farkas):
//   trichion (tr)  = 0.00  — линия роста волос
//   glabella (g)   = 0.33  — между бровями (1/3)
//   subnasale (sn) = 0.66  — основание носа (2/3)
//   menton (gn)    = 1.00  — подбородок
//
// GENDER DIFFERENCES (Farkas 1994 averages, slight adjustments):
//   - Мужское лицо шире (75% vs 71%)
//   - Мужской нос длиннее, нижняя треть выше
//   - Женский подбородок мягче, угол лоб-нос больше (134° vs 130°)

/**
 * @typedef {Object} CanonicalPoint
 * @property {string} key            — символическое имя
 * @property {string} role           — роль для solver
 * @property {number} mediapipeIndex — соответствующий MediaPipe index
 * @property {number} x              — face-relative X [0..1], midline=0.5
 * @property {number} y              — face-relative Y [0..1], top=0, bottom=1
 * @property {string} description    — анатомическое описание
 */

/**
 * IDEAL FEMALE FACE — Caucasian beauty norm
 *
 * Источник пропорций: Farkas 1994 + Marquardt phi mask
 * Углы профиля: Naini 2011 (nasofrontal 134°, nasofacial 36°)
 * Тонкие черты, мягкий подбородок, сужение лица книзу.
 */
export const IDEAL_FEMALE = Object.freeze({
  id: "ideal-female-caucasian",
  name: "Эталонное женское лицо",
  sex: "female",
  description:
    "Антропометрические нормы Farkas (Caucasian) + золотое сечение Marquardt",
  source:
    "Farkas LG. Anthropometry of the Head and Face. 2nd ed. Raven Press; 1994. " +
    "Marquardt SR. J Esthet Restor Dent. 2002. " +
    "Naini FB. Facial Aesthetics. Wiley-Blackwell; 2011.",

  // Aspect ratio = width / height (Farkas: female 0.71)
  aspectRatio: 0.71,

  // Точки в face-relative координатах
  points: {
    /* ── Vertical thirds (Vitruvian) ── */
    trichion: {
      key: "trichion",
      role: "trichion",
      mediapipeIndex: 10,
      x: 0.5,
      y: 0.0,
      description: "Линия роста волос (верх лба)",
    },
    glabella: {
      key: "glabella",
      role: "glabella",
      mediapipeIndex: 9,
      x: 0.5,
      y: 0.33,
      description: "Между бровей (1/3 высоты лица)",
    },
    subnasale: {
      key: "subnasale",
      role: "subnasale",
      mediapipeIndex: 2,
      x: 0.5,
      y: 0.66,
      description: "Основание носа (2/3 высоты лица)",
    },
    menton: {
      key: "menton",
      role: "chin",
      mediapipeIndex: 152,
      x: 0.5,
      y: 1.0,
      description: "Подбородок (низ лица)",
    },

    /* ── Nose (sagittal anchors) ── */
    nasion: {
      key: "nasion",
      role: "nasion",
      mediapipeIndex: 168,
      x: 0.5,
      y: 0.36, // чуть ниже glabella, переносица
      description: "Переносица (root of nose)",
    },
    pronasale: {
      key: "pronasale",
      role: "pronasale",
      mediapipeIndex: 1,
      x: 0.5,
      y: 0.59, // tip projection per Goode 0.55-0.60
      description: "Кончик носа",
    },

    /* ── Nose alar base (frontal anchors) ── */
    // Farkas: alar base width = 25% от высоты лица
    // → halfWidth = 0.125 от высоты, в нормированных X = 0.125/0.71 ≈ 0.176
    // → midline ± 0.088
    alarLeft: {
      key: "alarLeft",
      role: "alarLeft",
      mediapipeIndex: 129,
      x: 0.5 - 0.088,
      y: 0.62,
      description: "Левое крыло носа",
    },
    alarRight: {
      key: "alarRight",
      role: "alarRight",
      mediapipeIndex: 358,
      x: 0.5 + 0.088,
      y: 0.62,
      description: "Правое крыло носа",
    },

    /* ── Eyes ── */
    // Inter-canthal width = 25% от высоты лица → halfWidth ≈ 0.176, ±0.088
    canthusInnerLeft: {
      key: "canthusInnerLeft",
      role: "canthusInnerLeft",
      mediapipeIndex: 133,
      x: 0.5 - 0.088,
      y: 0.42,
      description: "Внутренний угол левого глаза",
    },
    canthusInnerRight: {
      key: "canthusInnerRight",
      role: "canthusInnerRight",
      mediapipeIndex: 362,
      x: 0.5 + 0.088,
      y: 0.42,
      description: "Внутренний угол правого глаза",
    },
    // Outer canthus: eye fissure = 25% от высоты → outer = inner + 0.176
    canthusOuterLeft: {
      key: "canthusOuterLeft",
      role: "canthusOuterLeft",
      mediapipeIndex: 33,
      x: 0.5 - 0.264,
      y: 0.42,
      description: "Внешний угол левого глаза",
    },
    canthusOuterRight: {
      key: "canthusOuterRight",
      role: "canthusOuterRight",
      mediapipeIndex: 263,
      x: 0.5 + 0.264,
      y: 0.42,
      description: "Внешний угол правого глаза",
    },

    /* ── Mouth ── */
    // Ширина рта = 38% от высоты, halfWidth ≈ 0.268, ± 0.134
    mouthCornerLeft: {
      key: "mouthCornerLeft",
      role: "mouthCornerLeft",
      mediapipeIndex: 61,
      x: 0.5 - 0.134,
      y: 0.79,
      description: "Левый угол рта",
    },
    mouthCornerRight: {
      key: "mouthCornerRight",
      role: "mouthCornerRight",
      mediapipeIndex: 291,
      x: 0.5 + 0.134,
      y: 0.79,
      description: "Правый угол рта",
    },
  },
});

/**
 * IDEAL MALE FACE — Caucasian beauty norm
 *
 * Отличия от женского:
 * - Aspect ratio шире (0.75 vs 0.71)
 * - Нос крупнее: длиннее (39% vs 38% высоты), шире (27% vs 25%)
 * - Нижняя треть выше (более выраженный подбородок)
 * - Углы более острые: nasofrontal 130° (vs 134° у женщин)
 * - Глаза немного дальше друг от друга
 */
export const IDEAL_MALE = Object.freeze({
  id: "ideal-male-caucasian",
  name: "Эталонное мужское лицо",
  sex: "male",
  description:
    "Антропометрические нормы Farkas (Caucasian male) + золотое сечение",
  source:
    "Farkas LG. Anthropometry of the Head and Face. 2nd ed. Raven Press; 1994. " +
    "Marquardt SR. J Esthet Restor Dent. 2002. " +
    "Naini FB. Facial Aesthetics. Wiley-Blackwell; 2011.",

  aspectRatio: 0.75,

  points: {
    trichion: {
      key: "trichion",
      role: "trichion",
      mediapipeIndex: 10,
      x: 0.5,
      y: 0.0,
      description: "Линия роста волос",
    },
    glabella: {
      key: "glabella",
      role: "glabella",
      mediapipeIndex: 9,
      x: 0.5,
      y: 0.33,
      description: "Между бровей",
    },
    subnasale: {
      key: "subnasale",
      role: "subnasale",
      mediapipeIndex: 2,
      x: 0.5,
      y: 0.66,
      description: "Основание носа",
    },
    menton: {
      key: "menton",
      role: "chin",
      mediapipeIndex: 152,
      x: 0.5,
      y: 1.0,
      description: "Подбородок",
    },

    nasion: {
      key: "nasion",
      role: "nasion",
      mediapipeIndex: 168,
      x: 0.5,
      y: 0.36,
      description: "Переносица",
    },
    pronasale: {
      key: "pronasale",
      role: "pronasale",
      mediapipeIndex: 1,
      // Мужской нос: длинее, проекция чуть выше Goode 0.575
      x: 0.5,
      y: 0.6,
      description: "Кончик носа",
    },

    // Мужская ширина носа: 27% высоты → halfW = 0.135 → в норм X ≈ 0.180/0.75 = 0.090
    alarLeft: {
      key: "alarLeft",
      role: "alarLeft",
      mediapipeIndex: 129,
      x: 0.5 - 0.09,
      y: 0.625,
      description: "Левое крыло носа",
    },
    alarRight: {
      key: "alarRight",
      role: "alarRight",
      mediapipeIndex: 358,
      x: 0.5 + 0.09,
      y: 0.625,
      description: "Правое крыло носа",
    },

    // Inter-canthal у мужчин чуть шире (26% высоты)
    canthusInnerLeft: {
      key: "canthusInnerLeft",
      role: "canthusInnerLeft",
      mediapipeIndex: 133,
      x: 0.5 - 0.087,
      y: 0.42,
      description: "Внутренний угол левого глаза",
    },
    canthusInnerRight: {
      key: "canthusInnerRight",
      role: "canthusInnerRight",
      mediapipeIndex: 362,
      x: 0.5 + 0.087,
      y: 0.42,
      description: "Внутренний угол правого глаза",
    },
    canthusOuterLeft: {
      key: "canthusOuterLeft",
      role: "canthusOuterLeft",
      mediapipeIndex: 33,
      x: 0.5 - 0.26,
      y: 0.42,
      description: "Внешний угол левого глаза",
    },
    canthusOuterRight: {
      key: "canthusOuterRight",
      role: "canthusOuterRight",
      mediapipeIndex: 263,
      x: 0.5 + 0.26,
      y: 0.42,
      description: "Внешний угол правого глаза",
    },

    // Мужской рот: 40% высоты, halfW ≈ 0.133
    mouthCornerLeft: {
      key: "mouthCornerLeft",
      role: "mouthCornerLeft",
      mediapipeIndex: 61,
      x: 0.5 - 0.133,
      y: 0.8,
      description: "Левый угол рта",
    },
    mouthCornerRight: {
      key: "mouthCornerRight",
      role: "mouthCornerRight",
      mediapipeIndex: 291,
      x: 0.5 + 0.133,
      y: 0.8,
      description: "Правый угол рта",
    },
  },
});

/**
 * Получить идеальное лицо по полу.
 *
 * @param {'female' | 'male'} sex
 * @returns {Object} canonical face object (IDEAL_FEMALE / IDEAL_MALE)
 */
export function getIdealFace(sex) {
  if (sex === "male") return IDEAL_MALE;
  return IDEAL_FEMALE; // default
}

/**
 * Список всех canonical faces для UI selector.
 */
export const IDEAL_FACES = [IDEAL_FEMALE, IDEAL_MALE];
