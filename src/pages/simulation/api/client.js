// src/pages/simulation/api/client.js
import axios from "axios";

/* ──────────────────────────────────────────────────────────────────────────
   Свой axios instance для модуля simulation.

   baseURL читаем из env. В проекте уже используется REACT_APP_API_URL —
   именно его берём первым. REACT_APP_API_BASE_URL — совместимость на
   случай переименования. Последний fallback — window.location.origin
   (защита от падения в dev, если env забыли).

   Centralized через process.env — никаких localhost-hardcoded fallback'ов
   в коде. В проде CRA подставит продакшн URL из .env.production.
   ────────────────────────────────────────────────────────────────────────── */

const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

const simulationClient = axios.create({
  baseURL: `${API_BASE}/api/simulation`,
  withCredentials: true, // session cookie
  timeout: 30000, // upload на медленных сетях может быть долгим
});

/* ──────────────────────────────────────────────────────────────────────────
   Единый error-interceptor: нормализует backend-ответы вида
   { error: 'not_found', message: '...' } в удобный объект для Redux
   rejected-action.
   ────────────────────────────────────────────────────────────────────────── */
simulationClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error.response?.data || {};
    const normalized = {
      status: error.response?.status || 0,
      code: payload.error || "network_error",
      message: payload.message || error.message || "Request failed",
      details: payload.details || null,
    };
    return Promise.reject(normalized);
  },
);

export default simulationClient;
