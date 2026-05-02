// src/pages/simulation/standards/data/index.js

import { RHINOPLASTY_STANDARDS } from "./rhinoplasty/index.js";
import { MAMMOPLASTY_STANDARDS } from "./mammoplasty/index.js";

export { RHINOPLASTY_STANDARDS, MAMMOPLASTY_STANDARDS };

export const STANDARDS = {
  ...RHINOPLASTY_STANDARDS,
  ...MAMMOPLASTY_STANDARDS,
};

export const CATEGORIES = Object.freeze({
  RHINOPLASTY: "rhinoplasty",
  MAMMOPLASTY: "mammoplasty",
});

export function getStandardById(id) {
  if (!id) return null;
  for (const std of Object.values(STANDARDS)) {
    if (std?.id === id) return std;
  }
  return null;
}

export function listStandardsByCategory(category) {
  return Object.values(STANDARDS).filter((s) => s?.category === category);
}

export function listAllStandards() {
  return Object.values(STANDARDS);
}

// Re-export view helpers, чтобы хуки могли импортировать их из ../data/index.js
// (некоторые хуки исторически делают это, не из services/viewDetection напрямую).
export {
  VIEW,
  detectFaceView,
  isViewApplicable,
  isStandardApplicableToView,
  isViewCompatible,
} from "../services/viewDetection.js";
