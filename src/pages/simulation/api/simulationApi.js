// src/pages/simulation/api/simulationApi.js
import client from "./client.js";

/* ──────────────────────────────────────────────────────────────────────────
   Тонкие обёртки над endpoints. Никакой логики — только HTTP.
   Все ошибки нормализованы в client.js (interceptor).

   ВАЖНО: все функции используют ОДИН и тот же `client` instance.
   client.js настроен с baseURL='/api/simulation' (или подобным),
   поэтому пути здесь короткие: '/plans', '/plans/:id/landmarks' и т.п.

   S.7.3: добавлены saveLandmarks и clearLandmarksRemote для управления
   автоматическими anatomical landmarks через тот же endpoint что и план.
   ────────────────────────────────────────────────────────────────────────── */

export async function listPlans({ limit, cursor, includeDeleted } = {}) {
  const params = {};
  if (limit !== undefined) params.limit = limit;
  if (cursor) params.cursor = cursor;
  if (includeDeleted) params.includeDeleted = true;

  const { data } = await client.get("/plans", { params });
  return data; // { items, nextCursor, hasMore }
}

export async function getPlan(id) {
  const { data } = await client.get(`/plans/${id}`);
  return data.plan;
}

export async function createPlan(payload) {
  const { data } = await client.post("/plans", payload);
  return data.plan;
}

export async function updatePlan(id, patch) {
  const { data } = await client.patch(`/plans/${id}`, patch);
  return data.plan;
}

export async function deletePlan(id) {
  const { data } = await client.delete(`/plans/${id}`);
  return data.plan;
}

export async function duplicatePlan(id, { label } = {}) {
  const body = label ? { label } : {};
  const { data } = await client.post(`/plans/${id}/duplicate`, body);
  return data.plan;
}

/* ─────── S.7.3 — landmarks ─────── */

/**
 * Сохранить landmarks для плана.
 * @param {string} planId
 * @param {Array}  landmarks  — массив длиной 0 или 468
 * @param {Object} meta       — { modelVersion?, imageWidth?, imageHeight? }
 * @returns {Promise<Object>} — обновлённый план
 */
export async function saveLandmarks(planId, landmarks, meta = {}) {
  const { data } = await client.put(`/plans/${planId}/landmarks`, {
    landmarks,
    meta,
  });
  // Сервер возвращает план в зависимости от структуры ответа.
  // У getPlan/updatePlan: response { plan: {...} } → return data.plan.
  // landmarksController может возвращать план напрямую → fallback на data.
  return data.plan ?? data;
}

/**
 * Очистить landmarks (например при смене фото).
 * @param {string} planId
 */
export async function clearLandmarksRemote(planId) {
  const { data } = await client.delete(`/plans/${planId}/landmarks`);
  return data.plan ?? data;
}
