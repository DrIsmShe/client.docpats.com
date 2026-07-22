// client/src/api/education.js
//
// Запросы модуля подготовки к экзаменам (/api/v1/education).
// Используется общий axios-инстанс: он несёт baseURL и withCredentials,
// без которых сессионная кука не уходит на бэкенд.
//
// baseURL НЕ содержит "/api", поэтому пути пишем полностью.

import axios from "../axios";

const BASE = "/api/v1/education";

// ─── Каталог ──────────────────────────────────────────────────

/** Список программ. Без параметров — опубликованные публичные. */
export async function fetchPrograms(params = {}) {
  const { data } = await axios.get(`${BASE}/programs`, { params });
  return data.items ?? [];
}

/** Страны с количеством программ — навигация витрины. */
export async function fetchCountries() {
  const { data } = await axios.get(`${BASE}/programs/countries`);
  return data.countries ?? [];
}

/**
 * Дерево рубрик тестов (категория → подкатегория) с числом тестов.
 * scope="all" считает все статусы (для админки), по умолчанию — только
 * опубликованные публичные (витрина).
 */
export async function fetchCategories(params = {}) {
  const { data } = await axios.get(`${BASE}/categories`, { params });
  return data.categories ?? [];
}

export async function createCategory(payload) {
  const { data } = await axios.post(`${BASE}/categories`, payload);
  return data.category;
}

export async function updateCategory(categoryId, patch) {
  const { data } = await axios.patch(`${BASE}/categories/${categoryId}`, patch);
  return data.category;
}

export async function deleteCategory(categoryId) {
  const { data } = await axios.delete(`${BASE}/categories/${categoryId}`);
  return data;
}

export async function fetchProgram(programId) {
  const { data } = await axios.get(`${BASE}/programs/${programId}`);
  return data.program;
}

/** Блоки теста (деление большого экзамена по blockSize вопросов). */
export async function fetchProgramBlocks(programId) {
  const { data } = await axios.get(`${BASE}/programs/${programId}/blocks`);
  return data; // { blockSize, lang, totalCount, blocks: [{ index, from, to, count }] }
}

/** Готовность по темам blueprint. */
export async function fetchReadiness(programId) {
  const { data } = await axios.get(`${BASE}/programs/${programId}/readiness`);
  return data.readiness;
}

// ─── Попытки ──────────────────────────────────────────────────

export async function fetchAttempts(params = {}) {
  const { data } = await axios.get(`${BASE}/attempts`, { params });
  return data.items ?? [];
}

/**
 * Начать попытку.
 * @param {object} payload { programId, mode, questionCount, lang, topicCodes }
 */
export async function startAttempt(payload) {
  const { data } = await axios.post(`${BASE}/attempts`, payload);
  return data.attempt;
}

export async function fetchAttempt(attemptId) {
  const { data } = await axios.get(`${BASE}/attempts/${attemptId}`);
  return data.attempt;
}

/**
 * Отправить ответ. В режиме tutor ответ приходит с разбором,
 * в остальных — только подтверждение приёма.
 */
export async function submitAnswer(attemptId, payload) {
  const { data } = await axios.post(
    `${BASE}/attempts/${attemptId}/answer`,
    payload,
  );
  return data;
}

export async function finishAttempt(attemptId) {
  const { data } = await axios.post(`${BASE}/attempts/${attemptId}/submit`);
  return data.attempt;
}

// ─── Редакторский контур: банк вопросов ───────────────────────
//
// Все методы ниже требуют роли doctor/admin (создание, правка) или
// admin (публикация). Права проверяет бэкенд; фронтенд лишь прячет
// то, что всё равно не сработает.

/**
 * Создать программу. Используется админкой, в том числе как контейнер
 * под файл, из которого ИИ построит структуру теста: тогда достаточно
 * технического названия и пустого blueprint.
 */
export async function createProgram(payload) {
  const { data } = await axios.post(`${BASE}/programs`, payload);
  return data.program;
}

export async function updateProgram(programId, patch) {
  const { data } = await axios.patch(`${BASE}/programs/${programId}`, patch);
  return data.program;
}

/** Архивирует программу. Нужен для отката, если импорт сорвался. */
export async function archiveProgram(programId) {
  const { data } = await axios.delete(`${BASE}/programs/${programId}`);
  return data.program;
}

/**
 * Удаляет тест НАВСЕГДА вместе с банком вопросов. Бэкенд запрещает удаление,
 * если по тесту уже есть попытки (409, details.reason="has_attempts") —
 * тогда предлагаем архив.
 */
export async function hardDeleteProgram(programId, { force = false } = {}) {
  const url = force
    ? `${BASE}/programs/${programId}/hard?force=true`
    : `${BASE}/programs/${programId}/hard`;
  const { data } = await axios.delete(url);
  return data; // { deleted: true, id, itemsDeleted, attemptsDeleted }
}

export async function fetchItems(params = {}) {
  const { data } = await axios.get(`${BASE}/items`, { params });
  return data.items ?? [];
}

export async function fetchItem(itemId) {
  const { data } = await axios.get(`${BASE}/items/${itemId}`);
  return data.item;
}

export async function updateItem(itemId, patch) {
  const { data } = await axios.patch(`${BASE}/items/${itemId}`, patch);
  return data.item;
}

export async function submitItemForReview(itemId) {
  const { data } = await axios.post(`${BASE}/items/${itemId}/submit`);
  return data.item;
}

/**
 * Решение рецензента.
 * @param {"approve"|"reject"} decision
 * @param {string} [reason] обязателен при reject
 */
export async function reviewItem(itemId, { decision, reason }) {
  const { data } = await axios.post(`${BASE}/items/${itemId}/review`, {
    decision,
    ...(reason ? { reason } : {}),
  });
  return data.item;
}

/** Отчёт по качеству банка: какие вопросы стоит переписать. */
export async function fetchItemAnalysis(programId, params = {}) {
  const { data } = await axios.get(
    `${BASE}/programs/${programId}/item-analysis`,
    { params },
  );
  return data.report ?? [];
}

// ─── Редакторский контур: импорт ──────────────────────────────

/** Какие экстракторы доступны и настроены. */
export async function fetchExtractors() {
  const { data } = await axios.get(`${BASE}/import/extractors`);
  return data.extractors ?? [];
}

export async function fetchImportJobs(params = {}) {
  const { data } = await axios.get(`${BASE}/import/jobs`, { params });
  return data.items ?? [];
}

export async function fetchImportJob(jobId) {
  const { data } = await axios.get(`${BASE}/import/jobs/${jobId}`);
  return data.job;
}

/**
 * Удаляет задание импорта. Вопросы, уже перенесённые в банк, остаются:
 * задание — журнал распознавания, а не сам контент. Пока идёт
 * распознавание, бэкенд удалять запрещает (409).
 */
export async function deleteImportJob(jobId) {
  const { data } = await axios.delete(`${BASE}/import/jobs/${jobId}`);
  return data; // { deleted: true, id, importedItems }
}

export async function createImportJob(payload) {
  const { data } = await axios.post(`${BASE}/import/jobs`, payload);
  return data.job;
}

/**
 * Запуск извлечения.
 *
 * Два взаимоисключающих режима, как и на бэкенде:
 *   - file  → multipart, файл уходит экстрактору (ИИ-режим);
 *   - items → JSON, вопросы уже разобраны (ручной экстрактор).
 *
 * Content-Type для multipart НЕ выставляем руками: browser сам добавит
 * boundary, а ручной заголовок его затрёт и multer не разберёт тело.
 */
export async function runImportJob(jobId, { file, items } = {}) {
  if (file) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await axios.post(
      `${BASE}/import/jobs/${jobId}/run`,
      form,
    );
    return data.job;
  }

  const { data } = await axios.post(`${BASE}/import/jobs/${jobId}/run`, {
    items: items ?? [],
  });
  return data.job;
}

export async function updateImportDraft(jobId, index, patch) {
  const { data } = await axios.patch(
    `${BASE}/import/jobs/${jobId}/drafts/${index}`,
    patch,
  );
  return data.job;
}

/**
 * Перенос черновиков в банк вопросов.
 * @param {number[]|null} indexes null = всё неотбракованное
 */
export async function importJobDrafts(jobId, indexes = null) {
  const { data } = await axios.post(`${BASE}/import/jobs/${jobId}/import`, {
    ...(indexes ? { indexes } : {}),
  });
  return data;
}

// ─── Общее ────────────────────────────────────────────────────

// Понятные названия полей вместо путей из zod: "file.mimeType" ничего не
// говорит человеку, заполняющему форму.
const FIELD_LABELS = {
  "file.mimeType": "тип файла",
  "file.originalName": "имя файла",
  "defaults.source.url": "ссылка на оригинал",
  "defaults.source.authority": "орган / издание",
  "defaults.source.licenseNote": "условия лицензии",
  "defaults.topicCode": "тема",
  sourceUrl: "ссылка на оригинал",
  code: "код программы",
  title: "название",
  country: "страна",
  region: "регион",
  examType: "тип экзамена",
  stem: "текст вопроса",
  options: "варианты ответа",
  correctKeys: "правильный ответ",
  explanation: "объяснение",
};

/**
 * Достаёт человекочитаемое сообщение из ошибки axios.
 *
 * Бэкенд отдаёт { error, code, details } через common/middlewares/errorHandler,
 * а для zod-ошибок кладёт в details.issues список [{ path, message }].
 * Без разворачивания issues пользователь видит только «Validation failed»
 * и не знает, какое поле чинить — так и было, пока это не всплыло на
 * реальной загрузке.
 */
export function readApiError(err, fallback = "Что-то пошло не так") {
  const payload = err?.response?.data;
  const base = payload?.error || payload?.message || err?.message || fallback;

  const issues = payload?.details?.issues;
  if (Array.isArray(issues) && issues.length > 0) {
    const parts = issues.slice(0, 5).map((issue) => {
      const path = Array.isArray(issue.path)
        ? issue.path.join(".")
        : String(issue.path ?? "");
      const label = FIELD_LABELS[path] ?? path;
      return label ? `${label}: ${issue.message}` : issue.message;
    });
    return `${base} — ${parts.join("; ")}`;
  }

  // Не-zod детали (например { resource: "..." }) выводим как есть.
  if (payload?.details && typeof payload.details === "object") {
    const flat = Object.entries(payload.details)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => `${FIELD_LABELS[k] ?? k}: ${v}`);
    if (flat.length) return `${base} — ${flat.join("; ")}`;
  }

  return base;
}

/**
 * Приводит введённую ссылку к валидному URL или возвращает null.
 *
 * Человек в поле «ссылка» пишет `minzdrav.gov.ru` без схемы — это
 * нормальное поведение, и отклонять его 400-й ошибкой невежливо.
 * А вот строку, которая URL-ом не является в принципе, надо отсечь
 * до отправки, иначе сервер вернёт невнятную ошибку валидации.
 *
 * @returns {{ ok: true, value: string|null } | { ok: false }}
 */
export function normalizeUrl(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return { ok: true, value: null };

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    // Должен быть хотя бы домен с точкой — иначе "SSSS" превратится
    // в https://SSSS и пройдёт как валидный URL.
    if (!parsed.hostname.includes(".")) return { ok: false };
    return { ok: true, value: parsed.toString() };
  } catch {
    return { ok: false };
  }
}

/** Требуется ли повторный вход (сессия истекла). */
export function isAuthError(err) {
  return err?.response?.status === 401;
}
