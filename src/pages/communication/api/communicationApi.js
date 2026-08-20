// client/src/communication/api/communicationApi.js
import axios from "../../../axios";

// ── Диалоги ──────────────────────────────────────────────────────────────────

export const getDialogs = () => axios.get("/communication/dialogs");

export const getOrCreateDialogWithUser = (peerUserId) =>
  axios.post("/communication/dialogs/with-user", { peerUserId });

// Групповой диалог. Он же — комната конференции: пропуск в Jitsi сервер
// выдаёт любому участнику диалога, поэтому втроём и больше разговаривать
// можно только здесь, а не в приватном диалоге на двоих.
export const createGroupDialog = ({ participantIds, title }) =>
  axios.post("/communication/dialogs", {
    type: "group",
    participantIds,
    title,
  });

// ── Сообщения ─────────────────────────────────────────────────────────────────

export const getMessages = (dialogId, params = {}) =>
  axios.get(`/communication/messages/dialog/${dialogId}`, { params });

export const sendMessageHttp = (payload) =>
  axios.post("/communication/messages", payload);

export const editMessageHttp = (messageId, text) =>
  axios.patch(`/communication/messages/${messageId}`, { text });

export const markDialogReadHttp = (dialogId, lastReadMessageId) =>
  axios.post(`/communication/messages/dialog/${dialogId}/read`, {
    lastReadMessageId,
  });
