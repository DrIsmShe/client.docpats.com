// client/src/communication/hooks/useDialogs.js
import { useEffect, useState, useRef } from "react";
import { getDialogs } from "../api/communicationApi";
import { getSocket } from "../socket";

export function useDialogs() {
  const [dialogs, setDialogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Текущий открытый диалог — обновляется снаружи через setActiveDialogId
  const activeDialogIdRef = useRef(null);
  // Текущий userId — обновляется снаружи через setCurrentUserId
  const currentUserIdRef = useRef(null);

  // ── ПЕРВИЧНАЯ ЗАГРУЗКА ─────────────────────────────────────────────────────
  useEffect(() => {
    getDialogs()
      .then((res) => setDialogs(res.data.dialogs || []))
      .catch((err) => console.error("getDialogs error:", err))
      .finally(() => setLoading(false));
  }, []);

  // ── РЕАЛТАЙМ ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = ({ dialogId, message }) => {
      if (!dialogId || !message) return;

      const senderId =
        message.senderId ||
        message.sender?._id ||
        message.sender?.id ||
        String(message.sender || "");

      const isMyMessage =
        currentUserIdRef.current &&
        String(senderId) === String(currentUserIdRef.current);

      const isActiveDialog =
        activeDialogIdRef.current &&
        String(dialogId) === String(activeDialogIdRef.current);

      // Превью с иконкой для медиафайлов
      let preview = message.text || "";
      if (!preview && message.attachments?.length > 0) {
        const att = message.attachments[0];
        const ext = (att.url || "").split(".").pop()?.toLowerCase() || "";
        if (["mp4", "webm", "mov"].includes(ext)) preview = "🎬 Видео";
        else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
          preview = "📷 Фото";
        else if (["mp3", "wav", "ogg"].includes(ext)) preview = "🎵 Аудио";
        else preview = "📎 " + (att.originalName || "Файл");
      }

      setDialogs((prev) => {
        const updated = prev.map((d) => {
          if (String(d._id) !== String(dialogId)) return d;
          return {
            ...d,
            lastMessageAt: message.createdAt,
            lastMessagePreview: preview,
            // Не трогаем счётчик если: моё сообщение ИЛИ диалог сейчас открыт
            unreadCount:
              isMyMessage || isActiveDialog
                ? d.unreadCount || 0
                : (d.unreadCount || 0) + 1,
          };
        });
        return [...updated].sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
        );
      });
    };

    // Сервер эмитит dialog:unreadReset когда другой участник прочитал
    const handleUnreadReset = ({ dialogId }) => {
      if (!dialogId) return;
      setDialogs((prev) =>
        prev.map((d) =>
          String(d._id) === String(dialogId) ? { ...d, unreadCount: 0 } : d,
        ),
      );
    };

    // Сервер эмитит dialog:unread с точным числом (при HTTP отправке сообщения)
    const handleDialogUnread = ({ dialogId, unreadCount }) => {
      if (!dialogId) return;
      // Не обновляем если этот диалог сейчас открыт
      if (
        activeDialogIdRef.current &&
        String(dialogId) === String(activeDialogIdRef.current)
      )
        return;
      setDialogs((prev) =>
        prev.map((d) =>
          String(d._id) === String(dialogId)
            ? {
                ...d,
                unreadCount:
                  typeof unreadCount === "number"
                    ? unreadCount
                    : (d.unreadCount || 0) + 1,
              }
            : d,
        ),
      );
    };

    socket.on("message:new", handleNewMessage);
    socket.on("dialog:unread", handleDialogUnread);
    socket.on("dialog:unreadReset", handleUnreadReset);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("dialog:unread", handleDialogUnread);
      socket.off("dialog:unreadReset", handleUnreadReset);
    };
  }, []);

  // ── Вызывать при открытии диалога ─────────────────────────────────────────
  const setActiveDialog = (dialogId) => {
    activeDialogIdRef.current = dialogId || null;
    if (!dialogId) return;

    // Сбрасываем счётчик локально сразу (оптимистично)
    setDialogs((prev) =>
      prev.map((d) =>
        String(d._id) === String(dialogId) ? { ...d, unreadCount: 0 } : d,
      ),
    );

    // Эмитим на сервер — если сокет ещё не подключён, ждём connect
    const socket = getSocket();
    const emit = () => socket.emit("dialog:markRead", { dialogId });
    if (socket.connected) {
      emit();
    } else {
      socket.once("connect", emit);
    }
  };

  // ── Установить текущего юзера (вызвать один раз после загрузки) ────────────
  const setCurrentUser = (userId) => {
    currentUserIdRef.current = userId || null;
  };

  return { dialogs, loading, setDialogs, setActiveDialog, setCurrentUser };
}
