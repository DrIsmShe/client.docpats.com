// client/src/api/ebm.js
//
// Доказательная медицина. Серверная часть — /api/v1/ebm (server/modules/ebm).
//
// Через общий инстанс из src/axios.js: нужен withCredentials (доступ
// определяется ролью из сессии) и общий baseURL.

import api from "../axios";

const ROOT = "/api/v1/ebm";

/**
 * Ступени доказательности — их названия и порядок задаёт сервер.
 *
 * Копии списка на клиенте намеренно нет: иерархия доказательств — предметное
 * знание, и расходиться этим двум спискам нельзя. Порядок, в котором сервер
 * их вернул, и есть правильный.
 */
export async function fetchLevels() {
  const { data } = await api.get(`${ROOT}/levels`);
  return data.levels || [];
}

/**
 * Что доступно: разбор свободного вопроса требует ключа модели, поиск по
 * готовому запросу — нет.
 */
export async function fetchStatus() {
  const { data } = await api.get(`${ROOT}/status`);
  return data;
}

/**
 * Поиск по готовому запросу PubMed.
 *
 * @param {string} query   синтаксис PubMed поддерживается целиком
 * @param {object} [opts]
 * @param {number} [opts.years]     ограничить свежестью, 0 — без ограничения
 * @param {number} [opts.perLevel]  сколько работ показывать на ступени
 * @param {string[]} [opts.levels]  только эти ступени
 * @param {AbortSignal} [opts.signal]
 */
export async function searchEvidence(query, {
  years = 0,
  perLevel = 5,
  levels = null,
  signal,
} = {}) {
  const { data } = await api.get(`${ROOT}/search`, {
    params: {
      q: query,
      years: years || undefined,
      perLevel,
      levels: levels?.length ? levels.join(",") : undefined,
    },
    signal,
  });
  return data;
}

/**
 * Свободный вопрос на любом языке.
 *
 * Дольше поиска: сначала разбор вопроса моделью, потом до двенадцати обращений
 * к PubMed. Интерфейс должен показывать ожидание, а не выглядеть зависшим.
 */
export async function askEvidence(question, {
  years = 0,
  perLevel = 5,
  signal,
} = {}) {
  const { data } = await api.post(
    `${ROOT}/ask`,
    { question, years: years || undefined, perLevel },
    { signal },
  );
  return data;
}

/** Ссылка на публикацию: DOI надёжнее, но есть не у всего. */
export function publicationLink(item) {
  return item.doiUrl || item.url;
}

export default {
  fetchLevels,
  fetchStatus,
  searchEvidence,
  askEvidence,
  publicationLink,
};
