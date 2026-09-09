// client/src/api/feedback.js
//
// Обратная связь (/api/v1/feedback). Тонкий слой на общем axios-инстансе:
// он несёт baseURL и withCredentials, без которых сессионная кука не уезжает.
//
// АДРЕС СТРАНИЦЫ И РАЗМЕР ОКНА ШЛЁТ КЛИЕНТ. Одностраничное приложение не
// оставляет их ни в каком заголовке, а для разбора ошибки это половина
// ответа: «не работает кнопка» без адреса страницы — это переписка на три
// дня. Браузер сервер узнаёт сам, из User-Agent.

import axios from "../axios";

const BASE = "/api/v1/feedback";

/** Справочник видов и разделов — с сервера, чтобы списки не разошлись. */
export async function fetchFeedbackDictionary() {
  const { data } = await axios.get(`${BASE}/dictionary`);
  return data;
}

/** Отправить обращение. */
export async function sendFeedback(данные) {
  const { data } = await axios.post(BASE, {
    ...данные,
    url: данные.url ?? window.location.pathname + window.location.search,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  });
  return data.feedback;
}

/** Мои обращения — список без переписки. */
export async function fetchMyFeedback(params = {}) {
  const { data } = await axios.get(BASE, { params });
  return data.items || [];
}

/** Одно своё обращение с перепиской. Открытие считается прочтением. */
export async function fetchFeedbackThread(id) {
  const { data } = await axios.get(`${BASE}/${id}`);
  return data.feedback;
}

/** Дописать реплику в своё обращение. */
export async function replyToFeedback(id, text) {
  const { data } = await axios.post(`${BASE}/${id}/reply`, { text });
  return data.feedback;
}

/* ── Разбор (админ) ──────────────────────────────────────────────── */

export async function fetchFeedbackQueue(params = {}) {
  const { data } = await axios.get(`${BASE}/admin/queue`, { params });
  return data;
}

export async function fetchFeedbackCard(id) {
  const { data } = await axios.get(`${BASE}/admin/${id}`);
  return data.feedback;
}

export async function fetchFeedbackTemplates() {
  const { data } = await axios.get(`${BASE}/admin/templates`);
  return data.items || [];
}

/** Ответ администратора: свой текст либо заготовка (её переведёт сервер). */
export async function answerFeedback(id, { text, templateKey } = {}) {
  const { data } = await axios.post(`${BASE}/admin/${id}/reply`, {
    text,
    templateKey,
  });
  return data.feedback;
}

/** Смена состояния. autoReply=false — без казённой приписки сервера. */
export async function setFeedbackStatus(id, тело) {
  const { data } = await axios.patch(`${BASE}/admin/${id}/status`, тело);
  return data.feedback;
}
