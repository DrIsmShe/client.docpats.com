// client/src/api/surgicalPlan.js
//
// Разбор запроса врача в типизированный план операции.
//
// Два разных по цене вызова, и это видно по названиям:
//   parsePlan    — обращается к языковой модели, стоит денег и секунд;
//   validatePlan — чистый пересчёт на сервере, дёргается на каждое
//                  движение ползунка.
//
// Клинические правила намеренно НЕ продублированы здесь. Живи они и на
// сервере, и в браузере, они бы разошлись — и врач видел бы на экране
// один вердикт, а в отчёте другой.

import axios from "../axios";

const BASE = "/api/surgical-plan";

/** Список доступных процедур. */
export async function fetchProcedures() {
  const { data } = await axios.get(`${BASE}/procedures`);
  return data.procedures;
}

/**
 * Каталог операций и измерений процедуры.
 * По нему интерфейс строит ползунки: границы и шаг приходят с сервера,
 * чтобы гранулярность задавалась клинически, а не вкусом вёрстки.
 */
export async function fetchCatalog(procedureCode) {
  const { data } = await axios.get(`${BASE}/catalog/${procedureCode}`);
  return data;
}

/** Свободный текст врача → план. Долгий вызов: показывайте ожидание. */
export async function parsePlan({
  procedureCode,
  prompt,
  measurements,
  patientGender,
}) {
  const { data } = await axios.post(`${BASE}/parse`, {
    procedureCode,
    prompt,
    measurements,
    patientGender,
  });
  return data; // { plan, validation, meta }
}

/** Пересчёт правленого плана. Быстрый вызов, модель не участвует. */
export async function validatePlan({
  procedureCode,
  plan,
  measurements,
  patientGender,
}) {
  const { data } = await axios.post(`${BASE}/validate`, {
    procedureCode,
    plan,
    measurements,
    patientGender,
  });
  return data; // { plan, validation }
}

/** Текст ошибки из ответа бэкенда — у него единый конверт { error: {...} }. */
export function errorText(err) {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    "Неизвестная ошибка"
  );
}
