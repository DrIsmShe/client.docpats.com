// src/pages/simulation/standards/data/rhinoplasty/goode.js

export const GOODE = {
  id: "goode",
  name: "Goode's Tip Projection",
  category: "rhinoplasty",
  sex: null,
  applicableViews: ["profile"],
  source:
    "Goode RL. A method of tip projection measurement. In: Powell N, Humphrey B, eds. Proportions of the Aesthetic Face. Thieme-Stratton; 1984.",
  targets: {
    goodeProjection: {
      ideal: 0.575,
      min: 0.55,
      max: 0.6,
      unit: "",
      label: "Goode's Ratio",
    },
  },
};
