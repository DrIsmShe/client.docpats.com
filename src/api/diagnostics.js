// client/src/api/diagnostics.js
//
// Запросы модуля диагностической помощи (/api/v1/diagnostics) — раздел для
// врача: разбор материалов живого пациента.
//
// НЕ ПУТАТЬ с api/radiology.js. Там учебная арена: выдуманные кейсы, баллы,
// рейтинг. Здесь — данные реальных пациентов, другие коллекции на сервере,
// другие права и другая ответственность. Общего кода у них нет сознательно:
// правка ради тренажёра не должна менять поведение в работе с пациентом.
//
// Тонкий слой на общем axios-инстансе: он несёт baseURL и withCredentials,
// без которых сессионная кука не уходит на бэкенд. baseURL не содержит "/api",
// поэтому путь пишем полностью.
import axios from "../axios";
// Язык врача уходит на сервер вместе с разбором: модель пишет выводы на нём.
import i18n from "../i18n";
import { track } from "../lib/analytics";
import {
  DIAGNOSTICS_CASE_CREATED, DIAGNOSTICS_DOCUMENT_EXTRACTED,
  DIAGNOSTICS_CASE_ANALYZED, DIAGNOSTICS_CASE_EXPORTED, count,
} from "../lib/events";

const BASE = "/api/v1/diagnostics";

/* ─── Справочник модальностей ─────────────────────────────────────────── */

/**
 * Что умеет каждый подмодуль: протокол разбора (checklist), красные флаги и
 * честная оговорка о нечитаемых машиной материалах (binaryNote).
 *
 * Врач должен видеть протокол ДО отправки материала, поэтому справочник
 * грузится вместе со страницей, а не прячется в подсказку.
 */
export async function fetchModalities() {
  const { data } = await axios.get(`${BASE}/modalities`);
  return {
    modalities: data.modalities ?? [],
    advisoryNotice: data.advisoryNotice ?? "",
  };
}

/**
 * Показатели, которые сервер узнаёт по ключу.
 *
 * Форма ввода лабораторной панели строится ИЗ ЭТОГО списка, а не из своего:
 * ключ — рабочее поле, по нему на сервере срабатывают пороги критических
 * значений и связки показателей. Показатель с ключом «hb» вместо «hgb» для
 * кода не существует, и гемоглобин 55 г/л не будет помечен критическим.
 */
export async function fetchAnalytes() {
  const { data } = await axios.get(`${BASE}/labs/analytes`);
  return data.analytes ?? [];
}

/* ─── Дела ────────────────────────────────────────────────────────────── */

/**
 * Дела врача — страницей.
 *
 * total обязателен: без него интерфейс не отличает «это все дела» от «это
 * первая страница». Раньше сервер отдавал первые 50 без признака усечения, и
 * на 200+ делах врач переставал видеть часть своих, не узнав об этом.
 *
 * @returns {Promise<{items: object[], total: number, hasMore: boolean}>}
 */
export async function fetchCases({ status, skip = 0, limit = 24 } = {}) {
  const params = { skip, limit };
  if (status) params.status = status;
  const { data } = await axios.get(`${BASE}/cases`, { params });
  return {
    items: data.items ?? [],
    total: data.total ?? (data.items?.length ?? 0),
    hasMore: Boolean(data.hasMore),
  };
}

/**
 * Дело целиком: материалы, задания, выводы.
 *
 * blockers/canAnalyze считает сервер — те же условия, которые он применит при
 * запуске. Интерфейс их только показывает и НЕ вычисляет сам: две копии одного
 * правила расходятся молча.
 */
export async function fetchCase(caseId) {
  const { data } = await axios.get(`${BASE}/cases/${caseId}`);
  return {
    case: data.case ?? null,
    artifacts: data.artifacts ?? [],
    jobs: data.jobs ?? [],
    findings: data.findings ?? [],
    blockers: data.blockers ?? [],
    canAnalyze: Boolean(data.canAnalyze),
    advisoryNotice: data.advisoryNotice ?? "",
  };
}

export async function createCase(payload) {
  const { data } = await axios.post(`${BASE}/cases`, payload);
  track(DIAGNOSTICS_CASE_CREATED);
  return data.case;
}

export async function updateCase(caseId, patch) {
  const { data } = await axios.patch(`${BASE}/cases/${caseId}`, patch);
  return data.case;
}

/** Закрыть дело выводом врача. Сервер не примет пустой summary — так и надо. */
export async function closeCase(caseId, summary) {
  const { data } = await axios.post(`${BASE}/cases/${caseId}/close`, { summary });
  return data.case;
}

/**
 * Удалить дело со всем содержимым.
 *
 * Удаление настоящее: материалы, задания и выводы уходят вместе с делом.
 * Отменить нельзя — поэтому в интерфейсе это отдельное подтверждение, а не
 * крестик «на всякий случай».
 */
export async function deleteCase(caseId) {
  const { data } = await axios.delete(`${BASE}/cases/${caseId}`);
  return data;
}

export async function reopenCase(caseId) {
  const { data } = await axios.post(`${BASE}/cases/${caseId}/reopen`);
  return data.case;
}

/* ─── Материалы ───────────────────────────────────────────────────────── */

export async function addArtifact(caseId, payload) {
  const { data } = await axios.post(`${BASE}/cases/${caseId}/artifacts`, payload);
  return data.artifact;
}

export async function removeArtifact(caseId, artifactId) {
  const { data } = await axios.delete(`${BASE}/cases/${caseId}/artifacts/${artifactId}`);
  return data;
}

/* ─── Распознавание документа ─────────────────────────────────────────── */

/**
 * Фото бланка или PDF → текст.
 *
 * Файл НЕ сохраняется ни на сервере, ни в хранилище: он уходит в модель и
 * забывается, а в дело попадает только текст — отдельным действием врача,
 * после того как тот его проверил. Поэтому здесь нет ни ссылки на файл, ни
 * идентификатора: возвращать нечего, кроме распознанного.
 *
 * @returns {Promise<{text: string, docKind: string, unreadable: string[],
 *   hasPatientIdentity: boolean, phiFields: string[], dicom: object|null,
 *   fileName: string, pages: number}>}
 */
export async function extractDocument(caseId, file, hint = "", modality = "") {
  const form = new FormData();
  form.append("file", file);
  if (hint) form.append("hint", hint);
  // Модальность нужна серверу, чтобы вести осмотр снимка по протоколу именно
  // этого исследования. Без неё снимок всё равно прочитается — сервер поймёт
  // по факту отсутствия текста, — но осмотр будет общим, а не по чек-листу.
  if (modality) form.append("modality", modality);
  // Описание снимка модель пишет сразу на языке врача — оно кладётся в дело
  // текстом и потом уже не переводится.
  form.append("lang", i18n.language);

  const { data } = await axios.post(`${BASE}/cases/${caseId}/extract`, form, {
    // Content-Type не задаём: его должен выставить браузер вместе с boundary.
    // Заданный вручную заголовок ломает разбор multipart на сервере.
    timeout: 180000,
  });
  // Тип документа и флаг «в файле нашлись данные пациента» — структурные
  // признаки. Сам распознанный текст, разумеется, никуда не отправляется.
  track(DIAGNOSTICS_DOCUMENT_EXTRACTED, {
    modality: modality || undefined,
    docKind: data.docKind,
    hadPatientIdentity: Boolean(data.hasPatientIdentity),
  });
  return {
    text: data.text ?? "",
    docKind: data.docKind ?? "other",
    unreadable: data.unreadable ?? [],
    hasPatientIdentity: Boolean(data.hasPatientIdentity),
    // Ключи полей, а не готовые строки: подписи переводятся на клиенте.
    // Для DICOM это единственный способ узнать, ЧТО именно лежит в тегах —
    // на самой картинке этих данных не видно.
    phiFields: data.phiFields ?? [],
    // Технические данные DICOM: сколько кадров в файле и какие показаны.
    // Нужны, чтобы честно сказать врачу, что прочитана выборка, а не серия.
    dicom: data.dicom ?? null,
    fileName: data.fileName ?? "",
    pages: data.pages ?? 1,
  };
}

/* ─── Разбор ──────────────────────────────────────────────────────────── */

/**
 * Запуск разбора. Ответ 202: задания только поставлены в очередь, выполняются
 * в фоне. Готовность узнаём повторным fetchCase — держать HTTP-соединение всё
 * время инференса нельзя.
 */
export async function analyzeCase(caseId, modalities = []) {
  // Язык врача едет вместе с заданием и сохраняется в нём: разбор выполняет
  // фоновый воркер, где ни запроса, ни языка интерфейса уже нет.
  const { data } = await axios.post(`${BASE}/cases/${caseId}/analyze`, {
    modalities,
    lang: i18n.language,
  });
  track(DIAGNOSTICS_CASE_ANALYZED, { modalities: count(modalities), jobs: count(data.jobs) });
  return { jobs: data.jobs ?? [], message: data.message ?? "" };
}

/**
 * Перезапуск задания. Язык передаётся текущий — это единственный способ
 * получить уже разобранное дело на другом языке: выводы лежат в базе готовым
 * текстом и задним числом не переводятся.
 */
export async function rerunJob(jobId) {
  const { data } = await axios.post(`${BASE}/jobs/${jobId}/rerun`, {
    lang: i18n.language,
  });
  return data.job;
}

/* ─── Выгрузка ────────────────────────────────────────────────────────── */

/**
 * Скачать протокол разбора одним файлом.
 *
 * Не открываем ссылку напрямую (window.open): запрос должен уйти с
 * сессионной кукой через общий axios-инстанс, а сервер отдаёт файл
 * вложением — ссылка в новой вкладке потеряла бы и то, и другое.
 */
export async function exportCase(caseId) {
  const res = await axios.get(`${BASE}/cases/${caseId}/export`, { responseType: "blob" });
  track(DIAGNOSTICS_CASE_EXPORTED);

  const disposition = res.headers?.["content-disposition"] ?? "";
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const fileName = match ? match[1] : `razbor-${caseId}.html`;

  const url = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return fileName;
}

/* ─── Обратная связь врача ────────────────────────────────────────────── */

/**
 * Вердикт по выводу: согласен / частично / не согласен + поправка.
 *
 * Это не «лайк». Поправки врачей — единственный источник разметки, по которой
 * потом будет видно, где разбор ошибается систематически. Поэтому поле
 * поправки в интерфейсе всегда рядом, а не спрятано за «подробнее».
 */
export async function setFindingVerdict(findingId, { verdict, correction }) {
  const { data } = await axios.post(`${BASE}/findings/${findingId}/verdict`, {
    verdict,
    correction,
  });
  return data.finding;
}

export async function fetchFeedbackStats() {
  const { data } = await axios.get(`${BASE}/stats`);
  return data.byModality ?? {};
}
