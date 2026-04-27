/**
 * Anthropometry module — public API
 * ==================================
 * Этот файл экспортирует всё что нужно импортировать из модуля
 * в главный App.jsx или в другие части приложения.
 *
 * По мере добавления страниц и компонентов — добавляем сюда.
 */

// Routes configuration (для React Router)
export { default as anthropometryRoutes } from "./routes.js";

// Store slices (для регистрации в главном Redux store)
// Пока закомментировано — раскомментируем в F.3 когда slices будут готовы
// export { default as casesReducer } from "./store/casesSlice.js";
// export { default as studiesReducer } from "./store/studiesSlice.js";
// export { default as photosReducer } from "./store/photosSlice.js";
// export { default as annotationsReducer } from "./store/annotationsSlice.js";

export const ANTHROPOMETRY_MODULE_VERSION = "0.1.0-frontend-dev";
