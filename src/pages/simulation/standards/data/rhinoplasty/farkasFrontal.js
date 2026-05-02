// src/pages/simulation/standards/data/rhinoplasty/farkasFrontal.js

export const FARKAS_FRONTAL = {
  id: "farkas-frontal",
  name: "Farkas Frontal Proportions",
  category: "rhinoplasty",
  sex: null,
  applicableViews: ["frontal", "three_quarter"],
  source:
    "Farkas LG. Anthropometry of the Head and Face. 2nd ed. New York: Raven Press; 1994.",
  targets: {
    alarToCanthalRatio: {
      ideal: 1.0,
      min: 0.95,
      max: 1.05,
      unit: "",
      label: "Alar / Inter-canthal Width",
    },
    nasalToMouthRatio: {
      ideal: 0.68,
      min: 0.65,
      max: 0.72,
      unit: "",
      label: "Nasal / Mouth Width",
    },
  },
};
