// src/pages/simulation/standards/data/rhinoplasty/index.js

import {
  POWELL_HUMPHREY_FEMALE,
  POWELL_HUMPHREY_MALE,
} from "./powellHumphrey.js";
import { GOODE } from "./goode.js";
import { CRUMLEY } from "./crumley.js";
import { FARKAS_FRONTAL } from "./farkasFrontal.js";
import { NOSE_SYMMETRY } from "./symmetry.js";
import {
  IDEAL_FEMALE_STANDARD,
  IDEAL_MALE_STANDARD,
} from "./idealFaceStandards.js";

export {
  POWELL_HUMPHREY_FEMALE,
  POWELL_HUMPHREY_MALE,
  GOODE,
  CRUMLEY,
  FARKAS_FRONTAL,
  NOSE_SYMMETRY,
  IDEAL_FEMALE_STANDARD,
  IDEAL_MALE_STANDARD,
};

export const RHINOPLASTY_STANDARDS = {
  // Canonical (anthropometric ideal — главные)
  IDEAL_FEMALE_STANDARD,
  IDEAL_MALE_STANDARD,
  // Profile (sagittal-plane angles)
  POWELL_HUMPHREY_FEMALE,
  POWELL_HUMPHREY_MALE,
  GOODE,
  CRUMLEY,
  // Frontal (coronal-plane ratios)
  FARKAS_FRONTAL,
  NOSE_SYMMETRY,
};
