// src/pages/simulation/standards/data/rhinoplasty/symmetry.js

export const NOSE_SYMMETRY = {
  id: "nose-symmetry",
  name: "Nose Symmetry (Frontal)",
  category: "rhinoplasty",
  sex: null,
  applicableViews: ["frontal"],
  source:
    "Symmetry analysis based on facial midline established by glabella-menton axis. Reference: Naini FB. Facial Aesthetics: Concepts and Clinical Diagnosis. Wiley-Blackwell; 2011.",
  targets: {
    midlineDeviation: {
      ideal: 0,
      min: 0,
      max: 0.005,
      unit: "",
      label: "Tip Midline Deviation",
    },
    alarSymmetry: {
      ideal: 0,
      min: 0,
      max: 0.005,
      unit: "",
      label: "Alar L/R Symmetry",
    },
  },
};
