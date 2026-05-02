// src/pages/simulation/standards/data/rhinoplasty/crumley.js

export const CRUMLEY = {
  id: "crumley",
  name: "Crumley 3:4:5 Triangle",
  category: "rhinoplasty",
  sex: null,
  applicableViews: ["profile"],
  source:
    "Crumley RL, Lanser M. Quantitative analysis of nasal tip projection. Laryngoscope. 1988;98(2):202-208.",
  targets: {
    crumleyTriangle: {
      ideal: [3, 4, 5],
      tolerance: 0.5,
      unit: "ratio",
      label: "Crumley Triangle",
    },
  },
};
