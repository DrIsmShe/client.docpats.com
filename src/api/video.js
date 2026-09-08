// client/src/api/video.js
//
// Запросы каталога видео (/api/v1/video). Тонкий слой на общем axios-инстансе:
// он несёт baseURL и withCredentials, без которых сессионная кука не уезжает.
//
// ССЫЛКА НА ФАЙЛ ЖИВЁТ МИНУТЫ. Её нельзя запрашивать заранее «на всякий
// случай» и нельзя складывать в состояние надолго: к моменту нажатия на play
// заготовленная ссылка уже протухнет. Запрашиваем в момент открытия плеера,
// а при ошибке 403 от хранилища — перезапрашиваем один раз.

import axios from "../axios";
import { track } from "../lib/analytics";
import {
  VIDEO_WATCH_COMPLETED,
  VIDEO_PUBLISHED,
  VIDEO_CONSENT_SIGNED,
} from "../lib/events";

const BASE = "/api/v1/video";

/* ── Каталог ─────────────────────────────────────────────────────── */

/** Мои ролики и ролики клиники, если человек в ней работает. */
export async function fetchMyVideos(params = {}) {
  const { data } = await axios.get(BASE, { params });
  return data.items ?? [];
}

/** Витрина: опубликованное. Работает и без входа. */
export async function fetchPublicVideos(params = {}) {
  const { data } = await axios.get(`${BASE}/public`, { params });
  return data.items ?? [];
}

/**
 * Лента «по интересам».
 *
 * Гостю сервер отдаст свежее — отдельной ветки в интерфейсе не надо.
 */
export async function fetchRecommended(params = {}) {
  const { data } = await axios.get(`${BASE}/recommended`, { params });
  return data.items ?? [];
}

/**
 * Засчитать просмотр публичного ролика.
 *
 * Отдельно от reportWatch: тот пишет в журнал и требует входа, а
 * здесь всего лишь число на витрине, которое должно расти и у гостя.
 */
export async function countPublicView(id) {
  const { data } = await axios.post(`${BASE}/public/${id}/view`);
  return data;
}

/** Похожие ролики — колонка рядом с проигрывателем. */
export async function fetchRelated(id, params = {}) {
  const { data } = await axios.get(`${BASE}/public/${id}/related`, { params });
  return data.items ?? [];
}

export async function fetchVideo(id) {
  const { data } = await axios.get(`${BASE}/${id}`);
  return data.video;
}

export async function createVideo(payload) {
  const { data } = await axios.post(BASE, payload);
  return data.video;
}

export async function updateVideo(id, patch) {
  const { data } = await axios.patch(`${BASE}/${id}`, patch);
  return data.video;
}

export async function deleteVideo(id) {
  const { data } = await axios.delete(`${BASE}/${id}`);
  return data;
}

/* ── Публикация ──────────────────────────────────────────────────── */

/**
 * Открыть ролик шире круга владельца.
 * Сервер откажет, если в ролике отмечен пациент или файл ещё не готов, —
 * это не проверки интерфейса, а правила модуля.
 */
export async function publishVideo(id, visibility) {
  const { data } = await axios.post(`${BASE}/${id}/publish`, { visibility });
  track(VIDEO_PUBLISHED, { visibility, kind: data.video?.kind });
  return data.video;
}

export async function unpublishVideo(id) {
  const { data } = await axios.post(`${BASE}/${id}/unpublish`);
  return data.video;
}

/* ── Связи ───────────────────────────────────────────────────────── */

export async function attachVideo(id, entityType, entityId) {
  const { data } = await axios.post(`${BASE}/${id}/attach`, { entityType, entityId });
  return data.video;
}

export async function detachVideo(id, entityType, entityId) {
  const { data } = await axios.post(`${BASE}/${id}/detach`, { entityType, entityId });
  return data.video;
}

/** «Что показывали на этом приёме». */
export async function fetchVideosForEntity(entityType, entityId) {
  const { data } = await axios.get(`${BASE}/for/${entityType}/${entityId}`);
  return data.items ?? [];
}

/* ── Воспроизведение ─────────────────────────────────────────────── */

/** Подписанные ссылки: сам файл, постер, дорожки субтитров. */
export async function fetchPlayback(id) {
  const { data } = await axios.get(`${BASE}/${id}/playback`);
  return data;
}

/**
 * Доложить о просмотре.
 *
 * keepalive-запрос: доклад чаще всего уходит в момент, когда человек
 * закрывает вкладку, и обычный XHR в этот момент браузер отменяет. Через
 * fetch с keepalive он доживает до сервера. Возврат — «ушло/не ушло»,
 * ошибку наверх не поднимаем: провалившийся счётчик не повод показывать
 * человеку красное окно поверх досмотренного ролика.
 */
export function reportWatch(id, watchedSec, durationSec) {
  // Досмотр — главное число всей затеи: на нём держатся и согласие, и
  // готовность к процедуре. Доля округляется до сотых, идентификатор
  // ролика наружу не уходит.
  if (durationSec > 0 && watchedSec / durationSec >= 0.9) {
    track(VIDEO_WATCH_COMPLETED, {
      duration_sec: Math.round(durationSec),
      ratio: Math.round((watchedSec / durationSec) * 100) / 100,
    });
  }
  const url = `${axios.defaults.baseURL || ""}${BASE}/${id}/watch`;
  try {
    return fetch(url, {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ watchedSec: Math.round(watchedSec) }),
    })
      .then((r) => r.ok)
      .catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}


/* ── Видео-согласие ──────────────────────────────────────────────── */

/** Кабинет пациента: что нужно посмотреть и подписать. */
export async function fetchMyConsents(status) {
  const { data } = await axios.get(`${BASE}/consents/my`, {
    params: status ? { status } : undefined,
  });
  return data.items ?? [];
}

export async function fetchConsent(id) {
  const { data } = await axios.get(`${BASE}/consents/${id}`);
  return data.consent;
}

/**
 * Подписать согласие.
 *
 * Сервер откажет, пока ролик не досмотрен, — и это не проверка интерфейса,
 * а правило модуля: кнопку мы прячем, но настоящий запрет живёт там.
 */
export async function signConsent(id) {
  const { data } = await axios.post(`${BASE}/consents/${id}/sign`);
  // Сколько прошло от досмотра до подписи — та же величина, что уходит в
  // журнал: по ней видно, подписывают ли не глядя.
  const досмотр = data.consent?.watch?.completedAt;
  track(VIDEO_CONSENT_SIGNED, {
    seconds_from_watch: досмотр
      ? Math.round((Date.now() - new Date(досмотр).getTime()) / 1000)
      : undefined,
    attempts: data.consent?.watch?.attempts,
  });
  return data.consent;
}

export async function revokeConsent(id, reason) {
  const { data } = await axios.post(`${BASE}/consents/${id}/revoke`, { reason });
  return data.consent;
}

/** Клиника: запросить согласие у пациента. */
export async function requestConsent(payload) {
  const { data } = await axios.post(`${BASE}/consents`, payload);
  return data.consent;
}

/** Клиника: история согласий по карте пациента. */
export async function fetchPatientConsents(clinicPatientId) {
  const { data } = await axios.get(`${BASE}/consents/patient/${clinicPatientId}`);
  return data.items ?? [];
}

/* ── Планы подготовки ────────────────────────────────────────────── */

export async function fetchMyAssignments() {
  const { data } = await axios.get(`${BASE}/playlists/my`);
  return data.items ?? [];
}

export async function fetchPlaylists() {
  const { data } = await axios.get(`${BASE}/playlists`);
  return data.items ?? [];
}

export async function createPlaylist(payload) {
  const { data } = await axios.post(`${BASE}/playlists`, payload);
  return data.playlist;
}

export async function assignPlaylist(payload) {
  const { data } = await axios.post(`${BASE}/playlists/assign`, payload);
  return data.assignment;
}

/** Готов ли пациент к сегодняшнему приёму. */
export async function fetchAppointmentPreparation(appointmentId) {
  const { data } = await axios.get(`${BASE}/playlists/appointment/${appointmentId}`);
  return data.items ?? [];
}

/* ── Видео-визитка врача ─────────────────────────────────────────── */

export async function setIntroVideo(id) {
  const { data } = await axios.post(`${BASE}/${id}/intro`);
  return data;
}

export async function clearIntroVideo() {
  const { data } = await axios.post(`${BASE}/intro/clear`);
  return data;
}


/* ── Публичная витрина ───────────────────────────────────────────── */

/** Один публичный ролик. Работает без входа. */
export async function fetchPublicVideo(id) {
  const { data } = await axios.get(`${BASE}/public/${id}`);
  return data.video;
}

/** Ссылки для проигрывания публичного ролика. Без входа. */
export async function fetchPublicPlayback(id) {
  const { data } = await axios.get(`${BASE}/public/${id}/playback`);
  return data;
}

/** Канал клиники — её ролики на публичной странице. */
export async function fetchClinicVideos(clinicId) {
  const { data } = await axios.get(`${BASE}/public/clinic/${clinicId}`);
  return data.items ?? [];
}

/* ── Администратор платформы ─────────────────────────────────────── */

/** Весь каталог: чужое, черновики, архив. Только для роли admin. */
export async function adminFetchVideos(params = {}) {
  const { data } = await axios.get(`${BASE}/admin`, { params });
  return data.items ?? [];
}

export async function adminFetchVideo(id) {
  const { data } = await axios.get(`${BASE}/admin/${id}`);
  return data.video;
}

/** Правка любого ролика, включая видимость: этим админ и снимает с витрины. */
export async function adminUpdateVideo(id, patch) {
  const { data } = await axios.patch(`${BASE}/admin/${id}`, patch);
  return data.video;
}

/** Архив: ролик исчезает из показа, но остаётся в базе. Причина обязательна. */
export async function adminArchiveVideo(id, reason) {
  const { data } = await axios.post(`${BASE}/admin/${id}/archive`, { reason });
  return data.video;
}

export async function adminUnarchiveVideo(id) {
  const { data } = await axios.post(`${BASE}/admin/${id}/unarchive`);
  return data.video;
}

/** Удаление необратимо и уносит файл — сервер требует причину. */
export async function adminDeleteVideo(id, reason) {
  const { data } = await axios.delete(`${BASE}/admin/${id}`, { data: { reason } });
  return data;
}

/* ── Загрузка своего файла ───────────────────────────────────────── */

/**
 * Заявка на загрузку: сервер проверяет пределы и квоту, заводит черновик и
 * выдаёт подписанные ссылки на запись в хранилище.
 */
export async function prepareUpload(payload) {
  const { data } = await axios.post(`${BASE}/upload/prepare`, payload);
  return data;
}

/**
 * Файл долит — сервер сверяет реальный размер с хранилищем и открывает
 * ролик к показу. Без этого шага запись остаётся в состоянии обработки, а
 * файл со временем заберёт уборщик сирот.
 */
export async function completeUpload(videoId) {
  const { data } = await axios.post(`${BASE}/upload/complete`, { videoId });
  return data.video;
}

/* ── Отклик ──────────────────────────────────────────────────────── */

/** Отметка «полезно» — переключателем: сервер сам решает, ставить или снять. */
export async function toggleVideoLike(id) {
  const { data } = await axios.post(`${BASE}/${id}/like`);
  return data;
}

/**
 * Отметка «не помогло». Сервер сам снимет противоположную отметку,
 * поэтому ответ содержит оба состояния сразу — пересчитывать их в
 * интерфейсе не надо.
 */
export async function toggleVideoDislike(id) {
  const { data } = await axios.post(`${BASE}/${id}/dislike`);
  return data;
}

/** Подписаться на канал или отписаться — одно действие. */
export async function toggleSubscription({ channelType, channelId }) {
  const { data } = await axios.post(`${BASE}/subscriptions/toggle`, {
    channelType,
    channelId,
  });
  return data;
}

/** Код для вставки ролика на чужой сайт. */
export async function fetchEmbedCode(id) {
  const { data } = await axios.get(`${BASE}/public/${id}/embed`);
  return data;
}

/** Пожаловаться на ролик или комментарий. */
export async function reportContent(payload) {
  const { data } = await axios.post(`${BASE}/reports`, payload);
  return data;
}

/** Очередь жалоб — администратору площадки. */
export async function adminFetchReports(params = {}) {
  const { data } = await axios.get(`${BASE}/admin/reports`, { params });
  return data.items ?? [];
}

/** Решение по жалобе. */
export async function adminResolveReport(id, payload) {
  const { data } = await axios.post(`${BASE}/admin/reports/${id}/resolve`, payload);
  return data;
}

/**
 * Распознать речь и собрать субтитры.
 *
 * Ожидание долгое: файл скачивается, распознаётся и переводится
 * на каждый выбранный язык — это минуты, а не секунды.
 */
export async function transcribeVideo(id, payload = {}) {
  const { data } = await axios.post(`${BASE}/${id}/transcribe`, payload, {
    timeout: 600000,
  });
  return data;
}

/** Мои каналы. */
export async function fetchMySubscriptions() {
  const { data } = await axios.get(`${BASE}/subscriptions`);
  return data.items ?? [];
}

/**
 * Перенести готовый фильм из студии в каталог.
 *
 * Ответа ждём дольше обычного: сервер действительно скачивает файл к
 * себе, а не запоминает чужую ссылку, которая однажды перестанет отвечать.
 */
export async function importFromStudio(payload) {
  const { data } = await axios.post(`${BASE}/import/studio`, payload, {
    timeout: 300000,
  });
  return data;
}

/**
 * Правила публикации и текущая редакция.
 *
 * Тянем с сервера, а не держим копию в интерфейсе: два списка в двух местах
 * разъедутся при первой же правке, а согласие тогда будет дано под текст,
 * которого сервер не знает.
 */
export async function fetchUploadRules() {
  const { data } = await axios.get(`${BASE}/upload/rules`);
  return data;
}

/* ── Разделы витрины ─────────────────────────────────────────────── */

/**
 * Разделы для ленты. Приходят с сервера, а не заданы в коде: их состав —
 * решение владельца площадки, и добавление полки не должно требовать
 * выкатки интерфейса.
 */
export async function fetchCategories(lang) {
  const { data } = await axios.get(`${BASE}/categories`, {
    params: { lang, counts: "true" },
  });
  return data.items ?? [];
}

export async function adminFetchCategories() {
  const { data } = await axios.get(`${BASE}/admin/categories`);
  return data.items ?? [];
}

export async function adminCreateCategory(payload) {
  const { data } = await axios.post(`${BASE}/admin/categories`, payload);
  return data.category;
}

export async function adminUpdateCategory(id, patch) {
  const { data } = await axios.patch(`${BASE}/admin/categories/${id}`, patch);
  return data.category;
}

/** Удаление снимает полку; ролики остаются и уходят в общую ленту. */
export async function adminDeleteCategory(id) {
  const { data } = await axios.delete(`${BASE}/admin/categories/${id}`);
  return data;
}

export default {
  fetchMyVideos,
  fetchMyConsents,
  fetchConsent,
  signConsent,
  revokeConsent,
  requestConsent,
  fetchPatientConsents,
  fetchMyAssignments,
  fetchPlaylists,
  createPlaylist,
  assignPlaylist,
  fetchAppointmentPreparation,
  setIntroVideo,
  clearIntroVideo,
  fetchPublicVideos,
  fetchRecommended,
  fetchRelated,
  countPublicView,
  fetchPublicVideo,
  fetchPublicPlayback,
  fetchClinicVideos,
  adminFetchVideos,
  adminFetchVideo,
  adminUpdateVideo,
  adminArchiveVideo,
  adminUnarchiveVideo,
  adminDeleteVideo,
  fetchVideo,
  createVideo,
  prepareUpload,
  toggleVideoLike,
  toggleVideoDislike,
  toggleSubscription,
  fetchMySubscriptions,
  fetchEmbedCode,
  reportContent,
  adminFetchReports,
  adminResolveReport,
  transcribeVideo,
  importFromStudio,
  fetchUploadRules,
  fetchCategories,
  adminFetchCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  completeUpload,
  updateVideo,
  deleteVideo,
  publishVideo,
  unpublishVideo,
  attachVideo,
  detachVideo,
  fetchVideosForEntity,
  fetchPlayback,
  reportWatch,
};
