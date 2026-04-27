// src/pages/simulation/index.js
/* ──────────────────────────────────────────────────────────────────────────
   Публичные экспорты модуля. Остальное — приватное внутри.
   ────────────────────────────────────────────────────────────────────────── */
export { default as PlanListPage } from "./pages/PlanListPage.jsx";
export { default as PlanEditorPage } from "./pages/PlanEditorPage.jsx";
export { default as simulationReducer } from "./store/simulationSlice.js";
// добавить к существующим экспортам
export { default as SimulationMenuLink } from "./components/MenuLink.jsx";
