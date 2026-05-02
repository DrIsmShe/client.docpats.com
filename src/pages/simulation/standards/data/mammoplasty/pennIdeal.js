// src/pages/simulation/standards/data/mammoplasty/pennIdeal.js

export const PENN_IDEAL = {
  id: "penn-ideal",
  name: "Penn's Ideal Breast",
  category: "mammoplasty",
  sex: "female",
  // Penn's triangle определяется на ФРОНТАЛЬНОМ фото груди
  // (вид спереди, sternal notch + оба соска видны)
  requiresView: "frontal",
  source:
    "Penn J. Breast reduction. Br J Plast Surg. 1955;7(4):357-371. " +
    "Westreich M. Plast Reconstr Surg. 1997;100(2):468-479.",
  targets: {
    snToNippleL: {
      ideal: 210,
      min: 190,
      max: 230,
      unit: "mm",
      label: "Sternal Notch → Nipple (L)",
    },
    snToNippleR: {
      ideal: 210,
      min: 190,
      max: 230,
      unit: "mm",
      label: "Sternal Notch → Nipple (R)",
    },
    nippleToNipple: {
      ideal: 210,
      min: 190,
      max: 230,
      unit: "mm",
      label: "Nipple → Nipple",
    },
    nippleToImfL: {
      ideal: 60,
      min: 50,
      max: 70,
      unit: "mm",
      label: "Nipple → IMF (L)",
    },
    nippleToImfR: {
      ideal: 60,
      min: 50,
      max: 70,
      unit: "mm",
      label: "Nipple → IMF (R)",
    },
    triangleSymmetry: {
      ideal: 0,
      min: 0,
      max: 10,
      unit: "mm",
      label: "L/R Symmetry",
    },
  },
};
