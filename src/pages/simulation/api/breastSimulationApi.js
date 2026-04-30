// src/pages/simulation/api/breastSimulationApi.js
import client from "./client.js";

/* ──────────────────────────────────────────────────────────────────────────
   S.8 — API для breast simulation.

   Использует тот же axios client что и обычный simulationApi (общий
   baseURL '/api/simulation', credentials, error interceptor). Endpoints
   определены в server/modules/simulation/routes/simulation.routes.js:

     GET  /plans?planType=breast      — список breast планов
     POST /plans/breast               — создать breast план
     GET  /breast/grouped             — группировка по пациенту
     GET  /plans/:id                  — получить план (любого типа)
     PATCH /plans/:id                 — обновить (anatomy/operation/calibration)

   Update / delete / duplicate работают через общий simulationApi —
   они уже поддерживают breast поля.
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Список breast планов (плоский).
 * Используется когда не нужна группировка по пациенту.
 */
export async function listBreastPlans({ limit, cursor, includeDeleted } = {}) {
  const params = { planType: "breast" };
  if (limit !== undefined) params.limit = limit;
  if (cursor) params.cursor = cursor;
  if (includeDeleted) params.includeDeleted = true;

  const { data } = await client.get("/plans", { params });
  return data; // { items, nextCursor, hasMore }
}

/**
 * Группированный список — все view одного пациента вместе.
 * Используется в BreastListPage как основной view.
 *
 * Response: { groups: [{ patientRef, plans: [...] }, ...] }
 */
export async function listBreastGrouped({ limit, includeDeleted } = {}) {
  const params = {};
  if (limit !== undefined) params.limit = limit;
  if (includeDeleted) params.includeDeleted = true;

  const { data } = await client.get("/breast/grouped", { params });
  return data; // { groups: [...] }
}

/**
 * Создать breast план.
 *
 * @param {Object} payload
 * @param {string} payload.label
 * @param {string} [payload.patientRef]
 * @param {Object} payload.photo               — embedded photo (от uploadPhoto)
 * @param {string} payload.photoView           — front | side_left | ...
 * @param {Object} [payload.anatomy]           — точки разметки
 * @param {Object} [payload.operation]         — параметры операции
 * @param {Object} [payload.calibration]       — px → mm
 * @param {Array}  [payload.controlPoints]
 * @returns {Promise<Object>} созданный план
 */
export async function createBreastPlan(payload) {
  const body = {
    planType: "breast",
    ...payload,
  };
  const { data } = await client.post("/plans/breast", body);
  return data.plan;
}
