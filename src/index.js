import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { HelmetProvider } from "react-helmet-async";

import App from "./App";
import { store } from "./store/store";

import { ThemeProvider } from "./theme/ThemeContext";

// Side-effect import: registers a global axios response interceptor
// that catches HTTP 403 with code "provisional_must_complete" and
// redirects to /complete-registration. Must run BEFORE any axios
// requests fire — hence importing it at the application root.
import "./api/provisionalInterceptor";

// Side-effect импорт: вешает на ГЛОБАЛЬНЫЙ axios заголовок с языком врача.
// Файл подключают лишь 44 модуля из пяти с лишним сотен, поэтому надеяться
// на транзитную загрузку нельзя — без этой строки сервер не узнает язык на
// большинстве запросов, и переводить его сообщения будет бессмысленно.
import "./axios";

// Side-effect импорт: инициализирует i18next и сразу выставляет
// <html lang>/<html dir> по сохранённому языку. До этого i18n
// подтягивался транзитом через axios.js — то есть когда повезёт
// с порядком импортов. Направление письма не должно зависеть от везения.
import "./i18n";

// Счётчик продуктовых событий. Без REACT_APP_POSTHOG_KEY не делает ничего и
// не тянет библиотеку — импорт внутри initAnalytics динамический.
import { initAnalytics } from "./lib/analytics";

initAnalytics();

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <HelmetProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HelmetProvider>
  </Provider>,
);

// PWA: регистрируем service worker (устанавливаемость «на телефон») —
// он же обслуживает web-push. Идемпотентно с регистрацией из webPush.js.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
