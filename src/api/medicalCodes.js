// client/src/api/medicalCodes.js
//
// Справочник медицинских кодов. Серверная часть — /api/v1/medical-codes
// (server/modules/medicalCodes).
//
// Через общий инстанс из src/axios.js: нужен withCredentials (доступ к
// справочнику определяется ролью из сессии) и общий baseURL. Язык подставляет
// перехватчик в axios.js из i18n — отдельно передавать его не нужно, сервер
// читает X-Language.

import api from "../axios";

const ROOT = "/api/v1/medical-codes";

/** Системы кодирования. Значения совпадают с серверными — они уезжают в записи. */
export const CODE_SYSTEMS = {
  ICD10CM: "icd10cm",
  ICD10WHO: "icd10who",
  ICHI: "ichi",
};

/**
 * Поиск кода по фрагменту кода или названию.
 *
 * @param {string} query
 * @param {object} [options]
 * @param {string} [options.system] ограничить системой
 * @param {number} [options.limit]
 * @param {AbortSignal} [options.signal] отмена предыдущего запроса при вводе
 * @returns {Promise<{items: Array, strategy: string}>}
 */
export async function searchCodes(query, { system, limit = 20, signal } = {}) {
  const trimmed = String(query || "").trim();
  // Сервер всё равно вернёт пустой ответ на короткий запрос — не тратим сеть.
  if (trimmed.length < 2) return { items: [], strategy: "none" };

  const { data } = await api.get(`${ROOT}/search`, {
    params: { q: trimmed, system, limit },
    signal,
  });

  return data;
}

/** Точное получение кода — чтобы подставить название к уже известному коду. */
export async function getCode(code, { system = CODE_SYSTEMS.ICD10CM } = {}) {
  const { data } = await api.get(
    `${ROOT}/${system}/${encodeURIComponent(code)}`,
  );
  return data;
}

/** Что загружено в справочник и сколько переведено. */
export async function getCodesStats() {
  const { data } = await api.get(`${ROOT}/stats`);
  return data;
}
