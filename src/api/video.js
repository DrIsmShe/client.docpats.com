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
  fetchPublicVideo,
  fetchPublicPlayback,
  fetchClinicVideos,
  fetchVideo,
  createVideo,
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
