// client/src/communication/socket.js
import { io } from "socket.io-client";

let socket = null;

/**
 * Возвращает существующий сокет или создаёт новый.
 * Сокет создаётся один раз — не пересоздаётся при временном дисконнекте,
 * так как Socket.IO сам управляет переподключением (reconnection: true).
 */
export function getSocket() {
  // Если сокет мёртв (исчерпал попытки реконнекта) — пересоздаём
  if (socket && socket.disconnected && !socket.active) {
    socket.removeAllListeners();
    socket = null;
  }

  if (socket) return socket;

  socket = io(
    `${process.env.REACT_APP_API_URL || "http://localhost:11000"}/communication`,
    {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    },
  );
  socket.on("connect", () => {
    console.log("🟢 SOCKET CONNECTED:", socket.id);
  });

  // Bridge server notifications to window so NotificationBell can listen
  // without needing a direct import of this module
  socket.on("new_notification", (payload) => {
    console.log("🔔 SOCKET new_notification received:", payload);
    window.dispatchEvent(
      new CustomEvent("new_notification", { detail: payload }),
    );
  });

  socket.on("notifications:read", (payload) => {
    window.dispatchEvent(
      new CustomEvent("notifications:read", { detail: payload }),
    );
  });

  // ─── Глобальный handler rate-limit ────────────────────────────
  // Сервер шлёт error:ratelimit при превышении лимита на любом
  // socket-событии (message:send, typing:start, message:react, dialog:join).
  // Любой компонент может слушать window event "ratelimit" и реагировать.
  // payload: { type, secsLeft, message, violation }
  socket.on("error:ratelimit", (payload) => {
    console.warn("⏱ Rate limit:", payload);
    window.dispatchEvent(new CustomEvent("ratelimit", { detail: payload }));
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 SOCKET DISCONNECTED:", reason);
    // Не обнуляем socket — он сам переподключится
  });

  socket.on("connect_error", (err) => {
    console.warn("❌ SOCKET ERROR:", err.message);
  });

  return socket;
}

/**
 * Явное отключение (например при logout).
 * После вызова getSocket() создаст новый экземпляр.
 */
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log("🔌 Socket manually disconnected");
  }
}
