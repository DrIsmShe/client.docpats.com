// client/src/api/radiology.js
//
// Запросы модуля лучевой диагностики (/api/v1/radiology). Тонкий слой на
// общем axios-инстансе (несёт baseURL и withCredentials — без них сессионная
// кука не уходит на бэкенд). baseURL НЕ содержит "/api", пути пишем полностью.
//
// Бэкенд-контракт готов; UI (вьюер + инструмент авторинга на canvas из
// simulation) — следующий этап. Этот модуль фиксирует форму запросов, чтобы
// фронт строился поверх стабильного API.

import axios from "../axios";

const BASE = "/api/v1/radiology";

// ─── Конфигурация систем чтения ───────────────────────────────────────
/** Готовые системы чтения: конфиг вьюера, чек-лист протокола, порог. */
export async function fetchReadingSystems() {
  const { data } = await axios.get(`${BASE}/reading-systems`);
  return data.systems ?? [];
}

/** Полный конфиг: системы чтения + настроен ли ИИ-помощник авторинга. */
export async function fetchReadingConfig() {
  const { data } = await axios.get(`${BASE}/reading-systems`);
  return { systems: data.systems ?? [], aiEnabled: Boolean(data.aiEnabled) };
}

/**
 * ИИ-черновик кейса по снимку (роль author). Возвращает заготовку:
 * { title, clinicalContext, findings:[{key,imageIndex,label,significance,geometry,explanation}],
 *   impression:{correctText,diagnosisKeys,diagnosisSynonyms} }.
 * Всё — черновик для проверки экспертом.
 */
export async function aiDraftCase({ imageUrl, modality, hint, imageIndex = 0 }) {
  const { data } = await axios.post(`${BASE}/ai/draft`, {
    imageUrl,
    modality,
    hint,
    imageIndex,
  });
  return data.draft;
}

/**
 * ИИ-кейс ЦЕЛИКОМ по теме (роль author) — снимка ещё нет.
 * Возвращает { title, clinicalContext, difficulty,
 *   plannedFindings:[{label,significance,location,explanation}],
 *   impression:{correctText,diagnosisKeys,diagnosisSynonyms} }.
 * plannedFindings — план разметки: что должно быть на снимке и где искать.
 * Точки на кадре ставит автор, ИИ их не выдумывает.
 */
export async function aiGenerateCase({ modality, topic, difficulty, hint }) {
  const { data } = await axios.post(`${BASE}/ai/generate`, {
    modality,
    topic,
    difficulty,
    hint,
  });
  return data.draft;
}

/**
 * ИИ-проверка лучевого кейса вторым проходом (роль author).
 * Отдаёт замечания, ничего не правит: { verdict, issues:[{target,severity,issue,suggestion}], errorCount, summary }.
 */
export async function aiVerifyCase({ modality, draft, caseId }) {
  // caseId передаём, если кейс уже сохранён: тогда сервер положит рецензию в
  // кейс, и гейт публикации переживёт перезагрузку страницы.
  const { data } = await axios.post(`${BASE}/ai/verify`, { modality, draft, caseId });
  return data.review;
}

/** Отметки «разобрано» на замечаниях сохранённой рецензии (индексы). */
export async function dismissCaseAiIssues(caseId, dismissed) {
  const { data } = await axios.patch(`${BASE}/cases/${caseId}/ai-review/dismissed`, { dismissed });
  return data.aiReview;
}

// ─── Диагностическая арена (геймификация) ─────────────────────────────
/** Игровой профиль: xp, ранг, серия дней, статистика. */
export async function fetchGameProfile() {
  const { data } = await axios.get(`${BASE}/game/profile`);
  return data; // { xp, casesCompleted, bestScore, streak, longestStreak, rank }
}

/** Лидерборд по XP. */
export async function fetchLeaderboard(params = {}) {
  const { data } = await axios.get(`${BASE}/game/leaderboard`, { params });
  return data.items ?? [];
}

/** «Кейс дня» — один и тот же у всех в течение суток. */
export async function fetchDailyCase() {
  const { data } = await axios.get(`${BASE}/game/daily`);
  return data.daily ?? null;
}

/** «Кейс недели» — один на 7 дней; о нём же идёт еженедельная рассылка. */
export async function fetchWeeklyCase() {
  const { data } = await axios.get(`${BASE}/game/weekly`);
  return data.weekly ?? null;
}

// ─── Каталог кейсов ───────────────────────────────────────────────────
export async function fetchCases(params = {}) {
  const { data } = await axios.get(`${BASE}/cases`, { params });
  return data.items ?? [];
}

/** Пути списков по станциям — форма запроса у всех одна. */
const STATION_PATH = {
  radiology: `${BASE}/cases`,
  labs: `${BASE}/labs/cases`,
  vp: `${BASE}/vp/cases`,
};

/**
 * Страница каталога станции.
 *
 * Отличается от fetchCases* тем, что возвращает не только кейсы, но и total —
 * сколько ИХ ВСЕГО подходит под фильтр. Без этого числа интерфейс не может
 * отличить «это весь каталог» от «это первая страница»: раньше он показывал
 * первые 50 кейсов и подписывал их «всего 50», хотя в базе могло быть 700.
 *
 * Поиск и фильтры уходят на сервер — искать на клиенте можно только среди
 * того, что доехало, а доезжает одна страница.
 *
 * @returns {Promise<{items: object[], total: number, hasMore: boolean, skip: number}>}
 */
export async function fetchCatalogPage(station, { q, difficulty, modality, skip = 0, limit = 24 } = {}) {
  const path = STATION_PATH[station];
  if (!path) throw new Error(`Неизвестная станция: ${station}`);

  const params = { skip, limit };
  if (q?.trim()) params.q = q.trim();
  if (difficulty) params.difficulty = difficulty;
  // Модальность есть только у снимков — на других станциях сервер отклонит
  // неизвестный параметр.
  if (modality && station === "radiology") params.modality = modality;

  const { data } = await axios.get(path, { params });
  return {
    items: data.items ?? [],
    total: data.total ?? (data.items?.length ?? 0),
    skip: data.skip ?? skip,
    hasMore: Boolean(data.hasMore),
  };
}

// Предохранитель для fetchAllCases: 20 страниц по 100 — это 2000 кейсов.
// Упереться в него означает, что списку нужна настоящая постраничность, а не
// более высокий предел, поэтому здесь стоит именно предохранитель, а не лимит.
const MAX_PAGES = 20;

/**
 * Весь список станции, страницами. Для АДМИНКИ, где нужен полный перечень
 * (в том числе черновиков), а не витрина.
 *
 * Зачем цикл: сервер больше не отдаёт «сколько влезет» — у страницы есть
 * потолок. Молча получить первую сотню и показать её как весь список — ровно та
 * ошибка, от которой мы уходили в каталоге, только теперь у редактора: он не
 * найдёт свой черновик и заведёт второй.
 *
 * @param {"radiology"|"labs"|"vp"} station
 * @param {object} params — те же фильтры плюс scope/status для редактора
 * @returns {Promise<{items: object[], total: number, truncated: boolean}>}
 */
export async function fetchAllCases(station, params = {}) {
  const path = STATION_PATH[station];
  if (!path) throw new Error(`Неизвестная станция: ${station}`);

  const items = [];
  let total = 0;
  let pages = 0;

  for (;;) {
    const { data } = await axios.get(path, {
      params: { ...params, skip: items.length, limit: 100 },
    });
    const chunk = data.items ?? [];
    items.push(...chunk);
    total = data.total ?? items.length;
    pages += 1;
    if (!data.hasMore || chunk.length === 0 || pages >= MAX_PAGES) break;
  }

  // truncated отдаём наружу, а не прячем: список, обрезанный предохранителем,
  // обязан быть отличим от полного.
  return { items, total, truncated: items.length < total };
}

/**
 * Кейс по id. Админу приходит полный (с эталоном, `full: true`), учащемуся —
 * санитизованный (без находок и заключения).
 * @returns {{ case: object, full: boolean }}
 */
export async function fetchCase(caseId) {
  const { data } = await axios.get(`${BASE}/cases/${caseId}`);
  return data;
}

// ─── Авторинг (роль author/admin) ─────────────────────────────────────

/**
 * Загрузка снимка файлом. Сервер переэнкодит его (срезая EXIF) и кладёт в
 * хранилище. Content-Type для multipart НЕ выставляем руками — браузер сам
 * добавит boundary.
 * @returns {{ url: string, width: number|null, height: number|null }}
 */
export async function uploadCaseImage(file) {
  const form = new FormData();
  form.append("image", file);
  const { data } = await axios.post(`${BASE}/uploads`, form);
  return data;
}

export async function createCase(payload) {
  const { data } = await axios.post(`${BASE}/cases`, payload);
  return data.case;
}

export async function updateCase(caseId, patch) {
  const { data } = await axios.patch(`${BASE}/cases/${caseId}`, patch);
  return data.case;
}

export async function submitCaseForReview(caseId) {
  const { data } = await axios.post(`${BASE}/cases/${caseId}/submit`);
  return data.case;
}

/**
 * Решение рецензента.
 * @param {"approve"|"reject"} decision
 * @param {string} [reason] обязателен при reject
 */
export async function reviewCase(caseId, { decision, reason }) {
  const { data } = await axios.post(`${BASE}/cases/${caseId}/review`, {
    decision,
    ...(reason ? { reason } : {}),
  });
  return data.case;
}

export async function archiveCase(caseId) {
  const { data } = await axios.delete(`${BASE}/cases/${caseId}`);
  return data.case;
}

/**
 * Удаление кейса НАСОВСЕМ (в отличие от archiveCase, который прячет его в
 * архив). Сервер откажет для опубликованного кейса и для кейса, по которому
 * есть попытки врачей: на такой ссылаются разборы и статистика.
 * @returns {{ deleted: true, id: string }}
 */
export async function deleteCasePermanently(caseId) {
  const { data } = await axios.delete(`${BASE}/cases/${caseId}/permanent`);
  return data;
}

/**
 * Ручной запуск ночной автогенерации: по кейсу-черновику на каждую
 * модальность. Работа идёт минуты, поэтому сервер отвечает СРАЗУ, не дожидаясь
 * конца, — за результатом ходите в fetchRadiologyAutogenState.
 * @returns {{ running: boolean, enabled: boolean, lastRun: object|null }}
 */
export async function runRadiologyAutogen() {
  const { data } = await axios.post(`${BASE}/autogen/run`);
  return data;
}

/**
 * Состояние автогенерации: идёт ли прогон сейчас и чем кончился прошлый
 * (created / skipped / failed по модальностям).
 */
export async function fetchRadiologyAutogenState() {
  const { data } = await axios.get(`${BASE}/autogen/state`);
  return data;
}

// ─── Попытки (роль learner) ───────────────────────────────────────────
/**
 * Условия попытки ДО старта: пойдёт ли она в зачёт, сколько даётся времени,
 * когда откроется следующая зачётная, какой был лучший результат. Страница
 * задания печатает это врачу до первого клика — правила, о которых узнают
 * после ответа, правилами не являются.
 * @returns {object} policy
 */
export async function fetchAttemptPolicy(caseId, { mode = "learn" } = {}) {
  const { data } = await axios.get(`${BASE}/cases/${caseId}/policy`, { params: { mode } });
  return data.policy;
}

export async function fetchLabPolicy(caseId, { mode = "learn" } = {}) {
  const { data } = await axios.get(`${BASE}/labs/cases/${caseId}/policy`, { params: { mode } });
  return data.policy;
}

export async function fetchVpPolicy(caseId, { mode = "learn" } = {}) {
  const { data } = await axios.get(`${BASE}/vp/cases/${caseId}/policy`, { params: { mode } });
  return data.policy;
}

/**
 * Зафиксировать предварительный дифдиагноз (VP) — до заказа обследований.
 * Обратной связи в ответе нет намеренно: иначе это была бы подсказка.
 */
export async function commitVpDifferential(attemptId, text) {
  const { data } = await axios.post(`${BASE}/vp/attempts/${attemptId}/commit`, { text });
  return data.commitment;
}

// «Типовой ответ чат-бота» на кейс — образец для сигнала дословного переноса
// в заключениях врачей. Только автору; на оценку не влияет.
export async function generateCaseAiBaseline(caseId) {
  const { data } = await axios.post(`${BASE}/cases/${caseId}/ai/baseline`);
  return data.aiBaseline;
}

/**
 * ИИ-варианты кейса: тот же диагноз, другие значения. Сохраняются сразу у
 * кейса — автор дальше правит их как обычные данные. Нужны против передачи
 * ответов: пересказ «там значимы эти два показателя» перестаёт работать.
 */
export async function generateLabVariants(caseId, count = 2) {
  const { data } = await axios.post(`${BASE}/labs/cases/${caseId}/ai/variants`, { count });
  return data.variants ?? [];
}

export async function generateVpVariants(caseId, count = 2) {
  const { data } = await axios.post(`${BASE}/vp/cases/${caseId}/ai/variants`, { count });
  return data.variants ?? [];
}

export async function generateLabAiBaseline(caseId) {
  const { data } = await axios.post(`${BASE}/labs/cases/${caseId}/ai/baseline`);
  return data.aiBaseline;
}

export async function generateVpAiBaseline(caseId) {
  const { data } = await axios.post(`${BASE}/vp/cases/${caseId}/ai/baseline`);
  return data.aiBaseline;
}

/**
 * Начать попытку. Возвращает попытку и санитизованный кейс (снимок,
 * клинический контекст, конфиг системы чтения, палитра находок).
 * @returns {{ attempt: object, case: object, resumed: boolean, secondsLeft: number|null }}
 */
export async function startAttempt(caseId, { mode = "learn" } = {}) {
  const { data } = await axios.post(`${BASE}/cases/${caseId}/attempts`, { mode });
  return data;
}

/**
 * Сдать ответ. Тело: { findings, reviewedChecklist, impressionText, diagnosisKeys }.
 * findings[i] = { imageIndex, label, shape, coords } — координаты 0..1.
 * @returns {{ attempt: object, review: object }} review — эталон эксперта для разбора
 */
export async function submitAttempt(attemptId, response) {
  const { data } = await axios.post(
    `${BASE}/attempts/${attemptId}/submit`,
    response,
  );
  return data;
}

export async function fetchAttempt(attemptId) {
  const { data } = await axios.get(`${BASE}/attempts/${attemptId}`);
  return data; // { attempt, review|null }
}

/**
 * ИИ-разбор сданной попытки: ИИ читает снимок, эталон и ответ врача и
 * возвращает { diagnosis, conclusion, analysis } — диагноз, текст заключения
 * и разбор ответа. Кэшируется на сервере.
 */
export async function aiAnalyzeAttempt(attemptId) {
  const { data } = await axios.post(`${BASE}/attempts/${attemptId}/ai-analysis`);
  return data.analysis;
}

export async function fetchAttempts(params = {}) {
  const { data } = await axios.get(`${BASE}/attempts`, { params });
  return data.items ?? [];
}

// ─── Станция «Анализы» ─────────────────────────────────────────────────
export async function fetchLabCases(params = {}) {
  const { data } = await axios.get(`${BASE}/labs/cases`, { params });
  return data.items ?? [];
}

export async function fetchLabCase(caseId) {
  const { data } = await axios.get(`${BASE}/labs/cases/${caseId}`);
  return data; // { case, full }
}

/**
 * ИИ-кейс станции «Анализы» ЦЕЛИКОМ по теме (роль author).
 * @returns {{title, clinicalContext, difficulty,
 *   panel:Array<{name,value,unit,refRange,significant}>,
 *   impression:{correctText,diagnosisKeys,diagnosisSynonyms}}}
 */
export async function aiGenerateLabCase({ topic, difficulty, hint }) {
  const { data } = await axios.post(`${BASE}/labs/ai/generate`, {
    topic,
    difficulty,
    hint,
  });
  return data.draft;
}

/** ИИ-проверка кейса «Анализы» вторым проходом (роль author). */
export async function aiVerifyLabCase({ draft, caseId }) {
  const { data } = await axios.post(`${BASE}/labs/ai/verify`, { draft, caseId });
  return data.review;
}

/** Отметки «разобрано» на замечаниях сохранённой рецензии (индексы). */
export async function dismissLabAiIssues(caseId, dismissed) {
  const { data } = await axios.patch(`${BASE}/labs/cases/${caseId}/ai-review/dismissed`, { dismissed });
  return data.aiReview;
}

export async function createLabCase(payload) {
  const { data } = await axios.post(`${BASE}/labs/cases`, payload);
  return data.case;
}

export async function updateLabCase(caseId, patch) {
  const { data } = await axios.patch(`${BASE}/labs/cases/${caseId}`, patch);
  return data.case;
}

/**
 * Удаление кейса «Анализов» НАСОВСЕМ. Сервер откажет для опубликованного и
 * для кейса с попытками врачей — им положен архив.
 */
export async function deleteLabCasePermanently(caseId) {
  const { data } = await axios.delete(`${BASE}/labs/cases/${caseId}/permanent`);
  return data;
}

export async function setLabStatus(caseId, status) {
  const { data } = await axios.post(`${BASE}/labs/cases/${caseId}/status`, { status });
  return data.case;
}

export async function startLabAttempt(caseId, { mode = "learn" } = {}) {
  const { data } = await axios.post(`${BASE}/labs/cases/${caseId}/attempts`, { mode });
  return data; // { attempt, case }
}

export async function submitLabAttempt(attemptId, response) {
  const { data } = await axios.post(`${BASE}/labs/attempts/${attemptId}/submit`, response);
  return data; // { attempt, review, game }
}

export async function fetchLabAttempt(attemptId) {
  const { data } = await axios.get(`${BASE}/labs/attempts/${attemptId}`);
  return data;
}

// ─── Работа над ошибками (интервальное повторение) ────────────────────
/** Кейсы, которые пора повторить (срок наступил). */
export async function fetchReviewDue() {
  const { data } = await axios.get(`${BASE}/review/due`);
  return data.items ?? [];
}

// ─── Дуэли 1×1 ─────────────────────────────────────────────────────────
export async function fetchDuels(filter = "open") {
  const { data } = await axios.get(`${BASE}/duels`, { params: { filter } });
  return data.items ?? [];
}
export async function createDuel(caseId) {
  const { data } = await axios.post(`${BASE}/duels`, { caseId });
  return data.duel;
}
export async function submitDuelResult(duelId, attemptId) {
  const { data } = await axios.post(`${BASE}/duels/${duelId}/result`, { attemptId });
  return data.duel;
}

// ─── Аналитика арены (автор/админ) ────────────────────────────────────
export async function fetchArenaOverview() {
  const { data } = await axios.get(`${BASE}/analytics/overview`);
  return data;
}
export async function fetchArenaCasesReport() {
  const { data } = await axios.get(`${BASE}/analytics/cases`);
  return data.items ?? [];
}
export async function fetchMissedFindings() {
  const { data } = await axios.get(`${BASE}/analytics/missed-findings`);
  return data.items ?? [];
}

// ─── Виртуальный пациент ───────────────────────────────────────────────
export async function fetchVpCases(params = {}) {
  const { data } = await axios.get(`${BASE}/vp/cases`, { params });
  return data.items ?? [];
}

export async function fetchVpCase(caseId) {
  const { data } = await axios.get(`${BASE}/vp/cases/${caseId}`);
  return data; // { case, full }
}

/**
 * ИИ-сценарий «Виртуального пациента» ЦЕЛИКОМ по теме (роль author).
 * @returns {{title, presentation, difficulty,
 *   investigations:Array<{name,category,resultText,necessary}>,
 *   diagnosis:{correctText,diagnosisKeys,diagnosisSynonyms}}}
 */
export async function aiGenerateVpCase({ topic, difficulty, hint }) {
  const { data } = await axios.post(`${BASE}/vp/ai/generate`, {
    topic,
    difficulty,
    hint,
  });
  return data.draft;
}

/** ИИ-проверка сценария «Виртуальный пациент» вторым проходом (роль author). */
export async function aiVerifyVpCase({ draft, caseId }) {
  const { data } = await axios.post(`${BASE}/vp/ai/verify`, { draft, caseId });
  return data.review;
}

/** Отметки «разобрано» на замечаниях сохранённой рецензии (индексы). */
export async function dismissVpAiIssues(caseId, dismissed) {
  const { data } = await axios.patch(`${BASE}/vp/cases/${caseId}/ai-review/dismissed`, { dismissed });
  return data.aiReview;
}

export async function createVpCase(payload) {
  const { data } = await axios.post(`${BASE}/vp/cases`, payload);
  return data.case;
}

export async function updateVpCase(caseId, patch) {
  const { data } = await axios.patch(`${BASE}/vp/cases/${caseId}`, patch);
  return data.case;
}

/** Удаление сценария «Виртуального пациента» НАСОВСЕМ (см. лаб-аналог). */
export async function deleteVpCasePermanently(caseId) {
  const { data } = await axios.delete(`${BASE}/vp/cases/${caseId}/permanent`);
  return data;
}

export async function setVpStatus(caseId, status) {
  const { data } = await axios.post(`${BASE}/vp/cases/${caseId}/status`, { status });
  return data.case;
}

export async function startVpAttempt(caseId, { mode = "learn" } = {}) {
  const { data } = await axios.post(`${BASE}/vp/cases/${caseId}/attempts`, { mode });
  return data; // { attempt, case }
}

/** Назначить обследование: раскрывает результат и фиксирует заказ. */
export async function orderInvestigation(attemptId, key) {
  const { data } = await axios.post(`${BASE}/vp/attempts/${attemptId}/order`, { key });
  return data.investigation; // { key, name, category, resultText, imageUrl }
}

export async function submitVpAttempt(attemptId, response) {
  const { data } = await axios.post(`${BASE}/vp/attempts/${attemptId}/submit`, response);
  return data; // { attempt, review, game }
}

export async function fetchVpAttempt(attemptId) {
  const { data } = await axios.get(`${BASE}/vp/attempts/${attemptId}`);
  return data;
}

// ─── Переводы кейсов (редактор) ────────────────────────────────────────
//
// Врачу эти вызовы не нужны: у него кейс приходит на его языке сам —
// перевод запускается при публикации, а пропущенное догоняется при первом
// открытии. Здесь редакторский инструмент: увидеть состояние по каждому
// языку и вмешаться, если модель отказала или перевод неточен.
//
// caseType: "radiology" | "labs" | "vp".

/** Состояние переводов кейса: по языку — missing | auto | stale | reviewed. */
export async function fetchCaseTranslations(caseType, caseId) {
  const { data } = await axios.get(`${BASE}/translations/${caseType}/${caseId}`);
  return data; // { caseType, caseId, sourceLang, languages: [...] }
}

/**
 * Перевести кейс. langs пусто — все языки, кроме языка оригинала.
 * force перезаписывает и проверенный человеком перевод — единственный способ.
 */
export async function translateCaseNow(caseType, caseId, { langs = null, force = false } = {}) {
  const { data } = await axios.post(`${BASE}/translations/${caseType}/${caseId}/translate`, {
    langs,
    force,
  });
  return data.report; // { created, updated, skipped, failed }
}

/** Ручная правка перевода. Помечает его «проверено». */
export async function saveCaseTranslation(caseType, caseId, lang, patch) {
  const { data } = await axios.put(
    `${BASE}/translations/${caseType}/${caseId}/${lang}`,
    patch, // { fields?, diagnosisKeys?, diagnosisSynonyms? }
  );
  return data.translation;
}

/** Снять «проверено», чтобы автоперевод снова мог обновлять текст. */
export async function unreviewCaseTranslation(caseType, caseId, lang) {
  const { data } = await axios.post(
    `${BASE}/translations/${caseType}/${caseId}/${lang}/unreview`,
  );
  return data.translation;
}
