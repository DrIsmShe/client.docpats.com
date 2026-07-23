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

/**
 * Список программ. Без параметров — опубликованные публичные.
 * Гостю отдаются только витринные тесты (isFree) — см. orGuest ниже.
 */
export async function fetchPrograms(params = {}) {
  return orGuest(
    async () => {
      const { data } = await axios.get(`${BASE}/programs`, { params });
      return data.items ?? [];
    },
    () => fetchGuestPrograms(),
  );
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
  return orGuest(
    async () => {
      const { data } = await axios.get(`${BASE}/categories`, { params });
      return data.categories ?? [];
    },
    // Рубрики гостю не нужны: витринных тестов единицы, дерево над ними
    // было бы навигацией ради навигации.
    async () => [],
  );
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
  return orGuest(
    async () => {
      const { data } = await axios.get(`${BASE}/programs/${programId}`);
      return data.program;
    },
    () => fetchGuestProgram(programId),
  );
}

/**
 * Блоки теста (деление большого экзамена по blockSize вопросов).
 * Гостю блоки недоступны: демо — это 20 вопросов тренировки.
 */
export async function fetchProgramBlocks(programId) {
  return orGuest(
    async () => {
      const { data } = await axios.get(`${BASE}/programs/${programId}/blocks`);
      return data; // { blockSize, lang, totalCount, blocks: [...] }
    },
    async () => ({ blockSize: null, totalCount: 0, blocks: [] }),
  );
}

/** Готовность по темам blueprint. У гостя истории нет — и готовности тоже. */
export async function fetchReadiness(programId) {
  return orGuest(
    async () => {
      const { data } = await axios.get(
        `${BASE}/programs/${programId}/readiness`,
      );
      return data.readiness;
    },
    async () => null,
  );
}

// ─── Квота тарифа ─────────────────────────────────────────────
//
// Сколько вопросов осталось в этом месяце. Гостю тот же ответ отдаёт
// демо-контур, но лимит там разовый (20 вопросов, без периода), поэтому
// запросы разные — см. GUEST ниже.

/** Остаток квоты: месячной у авторизованного, демо-квоты у гостя. */
export async function fetchQuota() {
  return orGuest(
    async () => {
      const { data } = await axios.get(`${BASE}/quota`);
      return data;
    },
    () => fetchGuestQuota(),
  );
}

// ─── Демо-доступ без регистрации ──────────────────────────────
//
// Отдельный префикс, потому что основной контур закрыт авторизацией и
// без сессии отдаёт 401. Гость опознаётся по сессионной куке, поэтому
// withCredentials из общего инстанса здесь так же обязателен.

const GUEST = `${BASE}/guest`;

// Режим гостя выясняется по первому 401 и запоминается до перезагрузки
// страницы. Иначе каждая страница модуля (витрина → тест → прохождение)
// была бы обязана сама помнить, авторизован человек или нет, и дублировать
// разбор 401 в трёх местах. Здесь это одно место, а страницы просто
// вызывают fetchProgram/startAttempt, как раньше.
let guestMode = false;

/** Работает ли модуль в демо-режиме без регистрации. */
export function isGuestMode() {
  return guestMode;
}

/**
 * Вызывает авторизованный вариант, а при 401 — гостевой, и запоминает
 * выбор. Всё, что не 401 (например 403 «тест не для гостей» или 402
 * «квота исчерпана»), пробрасывается наверх нетронутым.
 */
async function orGuest(authCall, guestCall) {
  if (guestMode) return guestCall();
  try {
    return await authCall();
  } catch (err) {
    if (!isAuthError(err)) throw err;
    guestMode = true;
    return guestCall();
  }
}

/** Витринные тесты, открытые без регистрации (ExamProgram.isFree). */
export async function fetchGuestPrograms() {
  const { data } = await axios.get(`${GUEST}/programs`);
  return data.items ?? [];
}

export async function fetchGuestProgram(programId) {
  const { data } = await axios.get(`${GUEST}/programs/${programId}`);
  return data;
}

/** Остаток демо-квоты (20 вопросов, разово). */
export async function fetchGuestQuota() {
  const { data } = await axios.get(`${GUEST}/quota`);
  return data;
}

export async function startGuestAttempt(payload) {
  const { data } = await axios.post(`${GUEST}/attempts`, payload);
  return data.attempt;
}

export async function fetchGuestAttempt(attemptId) {
  const { data } = await axios.get(`${GUEST}/attempts/${attemptId}`);
  return data.attempt;
}

export async function submitGuestAnswer(attemptId, payload) {
  const { data } = await axios.post(
    `${GUEST}/attempts/${attemptId}/answer`,
    payload,
  );
  return data;
}

/** Завершает демо-попытку. Возвращает { attempt, quota }. */
export async function finishGuestAttempt(attemptId) {
  const { data } = await axios.post(`${GUEST}/attempts/${attemptId}/submit`);
  return data;
}

// ─── Попытки ──────────────────────────────────────────────────

/** История попыток. У гостя её нет — отдаём пустой список. */
export async function fetchAttempts(params = {}) {
  return orGuest(
    async () => {
      const { data } = await axios.get(`${BASE}/attempts`, { params });
      return data.items ?? [];
    },
    async () => [],
  );
}

/**
 * Начать попытку.
 * @param {object} payload { programId, mode, questionCount, lang, topicCodes }
 *
 * Гостю сервер в любом случае соберёт тренировку на 20 вопросов: режим и
 * длину демо задаёт он, а не клиент.
 */
export async function startAttempt(payload) {
  return orGuest(
    async () => {
      const { data } = await axios.post(`${BASE}/attempts`, payload);
      return data.attempt;
    },
    () =>
      startGuestAttempt({
        programId: payload?.programId,
        lang: payload?.lang,
      }),
  );
}

export async function fetchAttempt(attemptId) {
  return orGuest(
    async () => {
      const { data } = await axios.get(`${BASE}/attempts/${attemptId}`);
      return data.attempt;
    },
    () => fetchGuestAttempt(attemptId),
  );
}

/**
 * Отправить ответ. В режиме tutor ответ приходит с разбором,
 * в остальных — только подтверждение приёма.
 */
export async function submitAnswer(attemptId, payload) {
  return orGuest(
    async () => {
      const { data } = await axios.post(
        `${BASE}/attempts/${attemptId}/answer`,
        payload,
      );
      return data;
    },
    () => submitGuestAnswer(attemptId, payload),
  );
}

export async function finishAttempt(attemptId) {
  return orGuest(
    async () => {
      const { data } = await axios.post(`${BASE}/attempts/${attemptId}/submit`);
      return data.attempt;
    },
    // Демо-контур отдаёт ещё и остаток квоты — странице нужен результат,
    // поэтому форму ответа приводим к общей.
    async () => (await finishGuestAttempt(attemptId)).attempt,
  );
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

/**
 * Пакетное одобрение очереди одного теста. Одобряет всё, что готово к
 * публикации; вопросы с блокерами (нет правильного ответа, нет органа для
 * заимствованного материала) пропускает и возвращает списком.
 */
export async function reviewAllProgramItems(programId) {
  const { data } = await axios.post(
    `${BASE}/programs/${programId}/review-all`,
  );
  return data; // { approvedCount, skippedCount, skipped: [{itemId, reason}] }
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

/**
 * Запускает генерацию вопросов моделью по теме. Возвращает задание сразу
 * (202), генерация идёт в фоне — следить за ней опросом fetchImportJob,
 * как за распознаванием файла. Результат ложится в те же черновики.
 * @param {object} payload { programId, topic, count, lang, difficulty, sourceNote }
 */
export async function generateQuestions(payload) {
  const { data } = await axios.post(`${BASE}/import/generate`, payload);
  return data.job;
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

/**
 * Исчерпана ли квота тарифа.
 *
 * 402, а не 403: это не «нельзя», а «нельзя сейчас, но можно после
 * апгрейда» — экран должен звать к действию, а не показывать ошибку.
 * В details лежат цифры и подсказка, что предлагать: гостю регистрацию
 * (upgrade: "register"), остальным аддон (upgrade: "exam_addon").
 */
export function isQuotaError(err) {
  return err?.response?.status === 402;
}

/** Подробности исчерпанной квоты: { limit, used, upgrade, resetsAt, … }. */
export function readQuotaDetails(err) {
  return err?.response?.data?.details ?? null;
}
