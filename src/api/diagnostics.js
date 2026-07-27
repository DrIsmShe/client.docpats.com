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

export async function fetchCases({ status, limit } = {}) {
  const params = {};
  if (status) params.status = status;
  if (limit) params.limit = limit;
  const { data } = await axios.get(`${BASE}/cases`, { params });
  return data.items ?? [];
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

/* ─── Разбор ──────────────────────────────────────────────────────────── */

/**
 * Запуск разбора. Ответ 202: задания только поставлены в очередь, выполняются
 * в фоне. Готовность узнаём повторным fetchCase — держать HTTP-соединение всё
 * время инференса нельзя.
 */
export async function analyzeCase(caseId, modalities = []) {
  const { data } = await axios.post(`${BASE}/cases/${caseId}/analyze`, { modalities });
  return { jobs: data.jobs ?? [], message: data.message ?? "" };
}

export async function rerunJob(jobId) {
  const { data } = await axios.post(`${BASE}/jobs/${jobId}/rerun`);
  return data.job;
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
