// client/src/api/guide.js
//
// Агент-гид по продукту. Два входа: гостевой (до сессии) и авторизованный.
// Общий axios-инстанс уже шлёт X-Language, поэтому язык ответа отдельно
// передавать не нужно.

import axios from "../axios";

const GUEST_URL = "/api/v1/public/guide/ask";
const AUTHED_URL = "/api/v1/guide/ask";

/**
 * @param {object} p
 * @param {{role:"user"|"assistant", content:string}[]} p.messages
 * @param {boolean} [p.authed]  пробовать авторизованный вход
 * @param {string}  [p.role]    doctor | patient | clinic_staff | ...
 * @param {string}  [p.section] раздел документации, если пользователь в нём
 * @returns {Promise<{answer:string, refused:boolean, truncated:boolean}>}
 */
export async function askGuide({ messages, authed = false, role, section }) {
  const body = { messages, role, section };

  if (authed) {
    try {
      const { data } = await axios.post(AUTHED_URL, body);
      return data;
    } catch (err) {
      // Сессия могла истечь, пока страница была открыта. Гид ничего личного не
      // показывает, поэтому вопрос лучше задать как гость, чем потерять.
      if (err?.response?.status !== 401) throw err;
    }
  }

  const { data } = await axios.post(GUEST_URL, body);
  return data;
}
