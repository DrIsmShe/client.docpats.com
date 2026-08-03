// client/src/api/analytics.js
//
// Запросы админского дашборда посещаемости (/admin/analytics). Данные берутся
// из PostHog, но ходим мы на СВОЙ бэкенд: ключ чтения статистики даёт полный
// доступ к проекту аналитики и в браузере оказаться не может.
//
// Не путать с src/lib/analytics.js — тот ПИШЕТ события из приложения.
// Этот модуль только читает готовые агрегаты.

import axios from "../axios";

const BASE = "/admin/analytics";

/** Настроен ли модуль на сервере + куда он ходит (без ключа). */
export async function fetchAnalyticsStatus() {
  const { data } = await axios.get(`${BASE}/status`);
  return data;
}

// Каждая вкладка — свой запрос. Грузим по мере открытия: полный набор это
// под шесть десятков обращений к PostHog, и тянуть их разом ради одной
// открытой вкладки незачем.
const section = (path) => async (days) => {
  const { data } = await axios.get(`${BASE}/${path}`, { params: { days } });
  return data;
};

export const fetchOverview = section("overview");
export const fetchPages = section("pages");
export const fetchAudience = section("audience");
export const fetchAcquisition = section("acquisition");
export const fetchBehavior = section("behavior");
export const fetchPerformance = section("performance");

/** «Сейчас на сайте» — мимо кеша, поэтому без параметра периода. */
export async function fetchLive() {
  const { data } = await axios.get(`${BASE}/live`);
  return data;
}

/**
 * Детализация одного события: динамика, зоны, экраны и разбивка по его
 * собственным свойствам (станция, режим, роль — что у события есть).
 */
export async function fetchEventDetail(name, days = 30) {
  const { data } = await axios.get(`${BASE}/event`, { params: { name, days } });
  return data;
}

/** Журнал событий — аналог Activity → Explore в самом PostHog. */
export async function fetchEventLog({ days = 7, event, screen, limit = 100 } = {}) {
  const { data } = await axios.get(`${BASE}/events`, {
    params: { days, event, screen, limit },
  });
  return data;
}

/** Сбросить серверный кеш и получить свежие цифры. */
export async function refreshAnalytics() {
  const { data } = await axios.post(`${BASE}/refresh`);
  return data;
}

/**
 * Блок мог не собраться в одиночку — сервер кладёт на его место { error }.
 * Страница из полутора десятков блоков не должна гаснуть целиком из-за
 * одного упавшего запроса, поэтому проверка точечная.
 */
export function blockError(block) {
  return Array.isArray(block) ? null : block?.error || null;
}

/** Строки блока или пустой массив, если блок не собрался. */
export function rows(block) {
  return Array.isArray(block) ? block : [];
}

/** Первая строка блока-однострочника (KPI, сводки) или пустой объект. */
export function firstRow(block) {
  return Array.isArray(block) && block.length ? block[0] : {};
}
