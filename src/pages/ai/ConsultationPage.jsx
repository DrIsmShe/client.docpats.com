import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

// Прокси через фронтенд (same-origin) — кука работает корректно.
// Iframe делает прямые запросы на API_BASE только для chat/epicrisis/start,
// а session-status получает через postMessage от родителя.
const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:11000"
    : "https://backend.docpats.com";

// URL для запросов с фронтенда (через прокси, same-origin cookie)
const PROXY_BASE =
  process.env.NODE_ENV === "development" ? "http://localhost:11000" : "";

export default function ConsultationPage() {
  const { t } = useTranslation("common");
  const iframeRef = useRef(null);
  const isAuthenticated = useSelector(
    (state) => state.auth?.isAuthenticated ?? false,
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Fetchим статус через same-origin прокси — кука работает.
    // Затем передаём результат в iframe через postMessage.
    async function fetchAndSend() {
      let sessionStatus = null;
      try {
        const res = await fetch(
          `${PROXY_BASE}/api/consultation/session-status`,
          {
            credentials: "include",
          },
        );
        if (res.ok) {
          sessionStatus = await res.json();
        }
      } catch (e) {
        console.warn("session-status fetch failed:", e);
      }

      try {
        iframe.contentWindow.postMessage(
          {
            isAuth: isAuthenticated,
            apiBase: API_BASE,
            // Готовый статус — iframe не будет делать повторный запрос
            sessionStatus,
          },
          "*",
        );
      } catch (e) {
        console.warn("postMessage failed:", e);
      }
    }

    const onLoad = () => {
      fetchAndSend();
      // Повторяем несколько раз на случай если iframe ещё не готов
      const interval = setInterval(fetchAndSend, 600);
      setTimeout(() => clearInterval(interval), 4000);
    };

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [isAuthenticated]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 999,
      }}
    >
      <iframe
        ref={iframeRef}
        src="/consultation.html"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        title={t("consultation.title")}
      />
    </div>
  );
}
