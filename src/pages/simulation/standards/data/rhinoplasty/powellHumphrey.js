// src/pages/simulation/standards/data/rhinoplasty/powellHumphrey.js

export const POWELL_HUMPHREY_FEMALE = {
  id: "powell-humphrey-female",
  name: "Powell & Humphrey (Female)",
  category: "rhinoplasty",
  sex: "female",
  applicableViews: ["profile"],
  source:
    "Powell N, Humphrey B. Proportions of the Aesthetic Face. New York: Thieme-Stratton; 1984.",
  targets: {
    nasofrontalAngle: {
      ideal: 125,
      min: 115,
      max: 130,
      unit: "°",
      label: "Nasofrontal Angle",
    },
    nasofacialAngle: {
      ideal: 35,
      min: 30,
      max: 40,
      unit: "°",
      label: "Nasofacial Angle",
    },
  },
};

export const POWELL_HUMPHREY_MALE = {
  id: "powell-humphrey-male",
  name: "Powell & Humphrey (Male)",
  category: "rhinoplasty",
  sex: "male",
  applicableViews: ["profile"],
  source:
    "Powell N, Humphrey B. Proportions of the Aesthetic Face. New York: Thieme-Stratton; 1984.",
  targets: {
    nasofrontalAngle: {
      ideal: 120,
      min: 115,
      max: 130,
      unit: "°",
      label: "Nasofrontal Angle",
    },
    nasofacialAngle: {
      ideal: 36,
      min: 30,
      max: 40,
      unit: "°",
      label: "Nasofacial Angle",
    },
  },
};
