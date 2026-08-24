// client/src/api/procedures.js
//
// Запись на операции и обследования — отдельная сущность, не приём.
// Серверная часть: server/modules/procedures/ (там же расписано, почему
// отдельная).
//
// Через общий инстанс axios (withCredentials), а не через сырой axios с
// ручной сборкой базового URL: новая часть кода не должна повторять
// историческую ошибку остальных страниц.

import axios from "../axios";

const BASE = "/procedures";

/** Вмешательства врача. Без фильтров — только активные (архив скрыт). */
export async function listProcedures(params = {}) {
  const { data } = await axios.get(BASE, { params });
  return {
    items: data?.procedures || [],
    timezone: data?.timezone || null,
  };
}

/**
 * День врача: вмешательства + занятость приёмами.
 * `busy` — намеренно обезличенные интервалы: календарю вмешательств нужно
 * знать, что время занято, но не кем.
 */
export async function getProcedureDay(date) {
  const { data } = await axios.get(`${BASE}/day/${date}`);
  return {
    procedures: data?.procedures || [],
    busy: data?.busy || [],
    timezone: data?.timezone || null,
  };
}

/**
 * Создать запись.
 * Время уходит ЛИБО готовым инстантом (startsAt), ЛИБО наивным локальным
 * (startsAtLocal) — во втором случае зону подставит сервер: он знает
 * расписание врача, браузер может стоять в другом поясе.
 */
export async function createProcedure(payload) {
  const { data } = await axios.post(BASE, payload);
  return data;
}

export async function setProcedureStatus(id, status, cancelReason) {
  const { data } = await axios.patch(`${BASE}/${id}/status`, {
    status,
    ...(cancelReason ? { cancelReason } : {}),
  });
  return data?.procedure;
}

/** Перенос: создаёт НОВУЮ запись, старая помечается «перенесено». */
export async function postponeProcedure(id, payload) {
  const { data } = await axios.post(`${BASE}/${id}/postpone`, payload);
  return data;
}

export async function archiveProcedure(id, archived = true) {
  const { data } = await axios.patch(`${BASE}/${id}/archive`, { archived });
  return data?.procedure;
}

/**
 * Поиск среди своих пациентов. Эндпоинт общий с записью на приём: список
 * пациентов у врача один, и заводить второй ради второй формы было бы
 * ровно тем дублированием, от которого отделяли сущность записи.
 */
export async function searchMyPatients(q) {
  const { data } = await axios.get("/schedule/appointment/my-patients", {
    params: { q },
  });
  return data?.items || [];
}
