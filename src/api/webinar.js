// client/src/api/webinar.js
//
// Вебинар — встреча по ссылке, третий способ собрать людей рядом со
// звонком и групповым диалогом.
//
// Отличие от соседей по назначению, а не по технике:
//   звонок          — дозвон, один на один или консилиум на несколько
//                     человек. Комната эфемерная.
//   групповой диалог — постоянная комната при переписке.
//   вебинар         — адрес, время, ведущий и правила входа. Ни дозвона,
//                     ни переписки.
//
// Предел числа участников задаёт не этот модуль, а видеомост:
// MAX_PARTICIPANTS и channelLastN в конфигурации Jitsi.

import axios from "../axios";

const BASE = "/api/webinars";

/** Встречи, которые я веду или на которые позван. */
export async function listWebinars() {
  const { data } = await axios.get(BASE);
  return data.items || [];
}

/** Создать встречу. Доступно только врачу. */
export async function createWebinar(payload) {
  const { data } = await axios.post(BASE, payload);
  return data.webinar;
}

/**
 * Карточка встречи для страницы входа.
 * Приходит и тем, кого не пустят: человек, открывший ссылку, должен
 * увидеть название и понятное «вас сюда не звали», а не пустой экран.
 */
export async function getWebinar(id) {
  const { data } = await axios.get(`${BASE}/${id}`);
  return data.webinar;
}

/** Пропуск в комнату: { token, domain, room, moderator, lobbyEnabled }. */
export async function getWebinarToken(id, displayName) {
  const { data } = await axios.post(`${BASE}/${id}/token`, {
    displayName: displayName || undefined,
  });
  return data;
}

export async function updateWebinar(id, patch) {
  const { data } = await axios.patch(`${BASE}/${id}`, patch);
  return data.webinar;
}

export async function deleteWebinar(id) {
  await axios.delete(`${BASE}/${id}`);
}

/** Ссылка, которую ведущий рассылает участникам. */
export function webinarLink(id) {
  return `${window.location.origin}/webinar/${id}`;
}

export function errorText(err) {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    "Неизвестная ошибка"
  );
}
