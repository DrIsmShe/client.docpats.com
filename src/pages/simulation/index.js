// src/pages/simulation/index.js
/* ──────────────────────────────────────────────────────────────────────────
   Публичные экспорты модуля.
   ────────────────────────────────────────────────────────────────────────── */
export { default as PlanListPage } from "./pages/PlanListPage.jsx";
export { default as PlanEditorPage } from "./pages/PlanEditorPage.jsx";
export { default as simulationReducer } from "./store/simulationSlice.js";
export { default as SimulationMenuLink } from "./components/MenuLink.jsx";

// S.8 — Phase 3B: Breast simulation list
export { default as BreastListPage } from "./breast/BreastListPage.jsx";

// S.8 — Phase 3D: Breast simulation editor
export { default as BreastEditorPage } from "./breast/BreastEditorPage.jsx";
