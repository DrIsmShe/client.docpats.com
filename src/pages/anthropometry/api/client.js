/**
 * Anthropometry module API client
 * ================================
 * Изолированный axios instance для модуля anthropometry.
 *
 * Все api-файлы модуля (caseApi, studyApi, photoApi, annotationApi, calibrationApi)
 * импортируют этот client и используют его для HTTP-запросов.
 *
 * Базовый URL: ${API_BASE}/api/anthropometry
 *   - dev:  http://localhost:11000/api/anthropometry
 *   - prod: https://backend.docpats.com/api/anthropometry
 *
 * withCredentials: true — отправляет session cookie для авторизации.
 */

import axios from "axios";
import { API_BASE } from "../../../config.js";

const client = axios.create({
  baseURL: `${API_BASE}/api/anthropometry`,
  withCredentials: true,
  timeout: 30000,
});

/* ============================================================
   REQUEST INTERCEPTOR
   ============================================================
   Логирование в dev для отладки. В prod — тишина. */
client.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV !== "production") {
      const method = config.method?.toUpperCase() ?? "GET";
      const url = config.url ?? "";
      console.log(`[anthro] → ${method} ${url}`);
    }
    return config;
  },
  (error) => {
    console.error("[anthro] request error:", error);
    return Promise.reject(error);
  },
);

/* ============================================================
   RESPONSE INTERCEPTOR
   ============================================================
   Единая обработка ошибок:
   - 401: эмитим глобальный event, который слушает auth-layer
     (твой useDoctorAccess hook или аналог может его поймать
     и сделать редирект на логин)
   - Остальные: просто пробрасываем reject, чтобы слайсы/компоненты
     могли обработать сами */
client.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== "production") {
      const method = response.config.method?.toUpperCase() ?? "GET";
      const url = response.config.url ?? "";
      console.log(`[anthro] ← ${response.status} ${method} ${url}`);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const method = error.config?.method?.toUpperCase() ?? "GET";

    if (process.env.NODE_ENV !== "production") {
      console.error(
        `[anthro] ✗ ${status ?? "network"} ${method} ${url}`,
        error.response?.data ?? error.message,
      );
    }

    if (status === 401) {
      // Сессия истекла или пользователь не авторизован.
      // Эмитим глобальный event — pages/auth или App.jsx могут его поймать.
      window.dispatchEvent(
        new CustomEvent("anthropometry:unauthorized", {
          detail: { url, method },
        }),
      );
    }

    return Promise.reject(error);
  },
);

export default client;
