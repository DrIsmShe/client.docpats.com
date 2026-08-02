// client/src/api/dictation.js
//
// Голосовая надиктовка истории болезни. Серверная часть — /api/v1/dictation
// (server/modules/dictation).
//
// Через общий инстанс из src/axios.js, а не сырым axios с ручной сборкой URL:
// нужен withCredentials (весь модуль опирается на сессию врача) и baseURL.

import api from "../axios";

const ROOT = "/api/v1/dictation";

/** Поля черновика — ровно те, что отдаёт сервер и принимает PATCH. */
export const DRAFT_FIELDS = [
  "complaints",
  "anamnesisMorbi",
  "anamnesisVitae",
  "statusPreasens",
  "statusLocalis",
  "mainDiagnosisText",
  "mainDiagnosisCode",
  "recommendations",
  "ctScanResults",
  "mriResults",
  "ultrasoundResults",
  "laboratoryTestResults",
];

/**
 * Готов ли модуль: без ключей распознавания или модели интерфейс не должен
 * показывать кнопку записи — врач бы записал приём и потерял его.
 */
export async function getDictationStatus() {
  const { data } = await api.get(`${ROOT}/status`);
  return data;
}

/** MIME записи → расширение файла, понятное и multer, и распознавателю. */
function extFor(mime = "") {
  const m = String(mime).toLowerCase();
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac")) return "mp4";
  if (m.includes("wav")) return "wav";
  if (m.includes("mpeg")) return "mp3";
  return "webm";
}

/**
 * Отправляет запись. Возвращает задание в статусе "uploaded" — дальше его
 * подхватывает фоновый воркер, а интерфейс опрашивает getJob.
 *
 * @param {string} patientId
 * @param {Blob} blob
 * @param {object} [opts]
 * @param {string} [opts.lang] язык надиктовки; не задан — определяет сам
 * @param {number} [opts.durationSec]
 */
export async function uploadDictation(patientId, blob, { lang, durationSec } = {}) {
  const form = new FormData();
  // Расширение обязано соответствовать содержимому: и multer (ALLOWED_EXT), и
  // распознаватель определяют формат по имени файла. Safari на iOS отдаёт
  // audio/mp4, Chrome — audio/webm; назвать mp4-данные «.webm» значит получить
  // отказ распознавания на ровном месте.
  form.append("audio", blob, `dictation.${extFor(blob.type)}`);
  if (lang) form.append("lang", lang);
  if (durationSec) form.append("durationSec", String(Math.round(durationSec)));

  const { data } = await api.post(`${ROOT}/patients/${patientId}/upload`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.job;
}

export async function getDictationJob(jobId) {
  const { data } = await api.get(`${ROOT}/jobs/${jobId}`);
  return data.job;
}

export async function listDictationJobs(limit = 20) {
  const { data } = await api.get(`${ROOT}/jobs`, { params: { limit } });
  return data.items ?? [];
}

/** Правка черновика до того, как он уйдёт в карту. */
export async function updateDictationDraft(jobId, draft) {
  const { data } = await api.patch(`${ROOT}/jobs/${jobId}/draft`, { draft });
  return data.job;
}

/**
 * Отказ от задания. Стирает аудио немедленно.
 *
 * Вызывается и при отказе врача, и после того, как черновик перенесён в форму:
 * задание своё отработало, держать голос пациента дольше незачем.
 */
export async function discardDictationJob(jobId) {
  const { data } = await api.delete(`${ROOT}/jobs/${jobId}`);
  return data;
}

/** Терминальные статусы — на них опрос прекращается. */
export const TERMINAL_STATUSES = ["drafted", "attached", "failed", "expired"];
