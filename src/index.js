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
