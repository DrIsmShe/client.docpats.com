// src/pages/simulation/standards/data/rhinoplasty/idealFaceStandards.js
//
// CANONICAL IDEAL FACE STANDARDS — для UI selector.
// Эти стандарты не используют scalar measurements/evaluator —
// они тащат точки лица напрямую к anthropometric ideal через
// canonicalSolver.

export const IDEAL_FEMALE_STANDARD = {
  id: "ideal-female-canonical",
  name: "Идеальное женское лицо (Farkas)",
  category: "rhinoplasty",
  sex: "female",
  applicableViews: ["frontal", "three_quarter"],
  isCanonical: true, // флаг для useApplyStandard — использовать canonicalSolver
  canonicalSex: "female",
  source:
    "Farkas LG. Anthropometry of the Head and Face. 2nd ed. Raven Press; 1994. " +
    "Marquardt SR. J Esthet Restor Dent. 2002.",
  // Targets для evaluator (просто чтобы карточки показывались)
  // Реальные данные solver берёт из canonical mask
  targets: {
    canonicalAlignment: {
      ideal: 0,
      min: 0,
      max: 0.05,
      unit: "",
      label: "Отклонение от антропометрической нормы",
    },
  },
};

export const IDEAL_MALE_STANDARD = {
  id: "ideal-male-canonical",
  name: "Идеальное мужское лицо (Farkas)",
  category: "rhinoplasty",
  sex: "male",
  applicableViews: ["frontal", "three_quarter"],
  isCanonical: true,
  canonicalSex: "male",
  source:
    "Farkas LG. Anthropometry of the Head and Face. 2nd ed. Raven Press; 1994. " +
    "Marquardt SR. J Esthet Restor Dent. 2002.",
  targets: {
    canonicalAlignment: {
      ideal: 0,
      min: 0,
      max: 0.05,
      unit: "",
      label: "Отклонение от антропометрической нормы",
    },
  },
};
