// Единый источник базового URL бэкенда. Приоритет — REACT_APP_API_URL: её
// использует ВЕСЬ остальной код и .env. REACT_APP_API_BASE оставлен как
// legacy-фолбэк, чтобы старые сборки не сломались.
// ⚠️ НЕ включает "/api" — для роутов под /api вызывайте `${API_BASE}/api/...`.
export const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:11000"
    : "https://backend.docpats.com");

export const NEWS_API_BASE =
  process.env.REACT_APP_NEWS_API ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:5010"
    : "https://news-api.docpats.com");

export const config = {
  path: [
    "/articles/*",
    "/news/*",
    "/doctor/article-detail/*",
    "/doctor/article-scientific-detail/*",
    "/doctor/profile/*",
  ],
};
