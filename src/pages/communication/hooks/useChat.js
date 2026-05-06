// client/src/communication/hooks/useChat.js

import { useEffect, useState, useCallback } from "react";
import { getMessages, sendMessageHttp } from "../api/communicationApi";
import { getSocket } from "../socket";

export function useChat(dialogId) {
  const [messages, setMessages] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const socket = getSocket();

  // =====================================================
  // JOIN / LEAVE ROOM + NEW MESSAGE LISTENER
  // =====================================================
  useEffect(() => {
    if (!dialogId || !socket) return;

    const joinRoom = () => {
      console.log("🔌 Joining dialog room:", dialogId);
      socket.emit("dialog:join", { dialogId });
      // Помечаем chat_message уведомления этого диалога как прочитанные
      fetch(`${process.env.REACT_APP_API_URL}/notifications/mark-read`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dialogId }),
      })
        .then(() =>
          window.dispatchEvent(
            new CustomEvent("notifications:read", { detail: { dialogId } }),
          ),
        )
        .catch(() => {});
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    const handleNewMessage = (payload) => {
      if (!payload || payload.dialogId !== dialogId) return;
      if (!payload.message) return;

      const { message } = payload;

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== message.id);
        return [...filtered, message];
      });
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      console.log("🚪 Leaving dialog room:", dialogId);
      socket.emit("dialog:leave", { dialogId });

      socket.off("message:new", handleNewMessage);
      socket.off("connect", joinRoom);
    };
  }, [dialogId, socket]);

  // =====================================================
  // TYPING EVENTS
  // =====================================================
  useEffect(() => {
    if (!dialogId || !socket) return;

    const handleTypingStart = ({ dialogId: dId, userId }) => {
      if (dId !== dialogId) return;

      setTypingUsers((prev) => {
        const copy = new Set(prev);
        copy.add(userId);
        return copy;
      });
    };

    const handleTypingStop = ({ dialogId: dId, userId }) => {
      if (dId !== dialogId) return;

      setTypingUsers((prev) => {
        const copy = new Set(prev);
        copy.delete(userId);
        return copy;
      });
    };

    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [dialogId, socket]);

  // =====================================================
  // MESSAGE DELETE EVENT
  // =====================================================
  useEffect(() => {
    if (!dialogId || !socket) return;

    const handleMessageDeleted = ({ dialogId: dId, messageId }) => {
      if (dId !== dialogId) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, text: "" } : m,
        ),
      );
    };

    socket.on("message:deleted", handleMessageDeleted);

    return () => {
      socket.off("message:deleted", handleMessageDeleted);
    };
  }, [dialogId, socket]);

  // =====================================================
  // LOAD HISTORY (HTTP)
  // Защита от race condition при переключении диалогов
  // =====================================================
  useEffect(() => {
    if (!dialogId) return;

    let isCurrent = true;

    setIsReady(false);
    setMessages([]);

    console.log("📥 Loading messages for dialog:", dialogId);

    getMessages(dialogId)
      .then((res) => {
        if (!isCurrent) return;

        setMessages(res.data?.items || []);
        setIsReady(true);
      })
      .catch((err) => {
        if (!isCurrent) return;

        if (err?.name === "CanceledError" || err?.name === "AbortError") {
          return;
        }

        console.error("getMessages error:", err);
        setIsReady(true);
      });

    return () => {
      isCurrent = false;
    };
  }, [dialogId]);

  // =====================================================
  // SEND MESSAGE (HTTP)
  //
  // При ошибке 429 (rate limit) диспатчим window event "ratelimit",
  // тот же что и для socket-уровня. ChatWindow слушает оба источника
  // через один обработчик и блокирует input.
  // =====================================================
  const sendMessage = useCallback(
    async ({ text, replyToId = null, attachment = null, onError = null }) => {
      if (!dialogId) return;
      if (!text?.trim() && !attachment) return;

      try {
        const response = await sendMessageHttp({
          dialogId,
          type: "text",
          text: text || "",
          attachments: attachment ? [attachment] : [],
          replyToId,
        });

        const message = response.data;

        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== message.id);
          return [...filtered, message];
        });
      } catch (err) {
        console.error("❌ sendMessageHttp error:", err);

        // ── HTTP 429: rate limit от backend ─────────────────────
        // Парсим сообщение из тела ответа и диспатчим тот же event
        // что и socket-уровень. Если в ответе есть число секунд — берём его.
        if (err?.response?.status === 429) {
          const errorMsg =
            err.response.data?.error || "Слишком много сообщений";
          // Пытаемся извлечь число секунд из сообщения "Подождите ещё N сек."
          const secsMatch = errorMsg.match(/(\d+)\s*(сек|sec)/i);
          // Или из "на N мин" → конвертируем в секунды
          const minsMatch = errorMsg.match(/(\d+)\s*(мин|min)/i);
          const secsLeft = secsMatch
            ? Number(secsMatch[1])
            : minsMatch
              ? Number(minsMatch[1]) * 60
              : 60;

          window.dispatchEvent(
            new CustomEvent("ratelimit", {
              detail: {
                type: "message:send (HTTP)",
                secsLeft,
                message: errorMsg,
              },
            }),
          );

          if (onError) onError(errorMsg);
          return;
        }

        // Остальные ошибки — отдаём в callback если есть
        if (onError) {
          const msg =
            err?.response?.data?.error ||
            err?.message ||
            "Ошибка отправки сообщения";
          onError(msg);
        }
      }
    },
    [dialogId],
  );

  // =====================================================
  // EMIT TYPING
  // =====================================================
  const emitTyping = useCallback(
    (type) => {
      if (!socket || !dialogId) return;
      socket.emit(`typing:${type}`, { dialogId });
    },
    [socket, dialogId],
  );

  return {
    messages,
    isReady,
    sendMessage,
    typingUsers,
    emitTyping,
  };
}
