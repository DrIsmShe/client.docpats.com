// client/src/api/guide.js
//
// Агент-гид по продукту. Два входа: гостевой (до сессии) и авторизованный.
// Общий axios-инстанс уже шлёт X-Language, поэтому язык ответа отдельно
// передавать не нужно.

import axios from "../axios";
import { track } from "../lib/analytics";
import { GUIDE_QUESTION_ASKED, count } from "../lib/events";

const GUEST_URL = "/api/v1/public/guide/ask";
const AUTHED_URL = "/api/v1/guide/ask";
const CONTEXT_URL = "/api/v1/guide/context";

/**
 * Кто спрашивает — по сессии, спрашиваем у сервера.
 *
 * Раньше роль угадывалась на клиенте по префиксу адреса, и это было неверно:
 * врач, открывший помощника на лендинге, считался гостем. Роль — свойство
 * человека, а не страницы.
 *
 * Не бросает: не ответил сервер — значит гость, и помощник всё равно работает.
 */
export async function fetchGuideRole() {
  try {
    const { data } = await axios.get(CONTEXT_URL);
    return data?.role || "guest";
  } catch {
    return "guest";
  }
}

/**
 * @param {object} p
 * @param {{role:"user"|"assistant", content:string}[]} p.messages
 * @param {boolean} [p.authed]  пробовать авторизованный вход
 * @param {string}  [p.section] раздел документации, если пользователь в нём
 * @returns {Promise<{answer:string, refused:boolean, truncated:boolean}>}
 *
 * Роль здесь не передаётся: её определяет сервер по сессии. Присланной
 * браузером верить незачем, а угаданной по адресу — тем более.
 */
export async function askGuide({ messages, authed = false, section }) {
  const body = { messages, section };

  // Раздел справки и длина диалога. Текст вопроса не отправляется: гид
  // спрашивают своими словами, и там может оказаться что угодно.
  track(GUIDE_QUESTION_ASKED, { section, authed, turn: count(messages) });

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
