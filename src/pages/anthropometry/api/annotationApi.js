/**
 * Annotation API
 * ==============
 * Обёртки над endpoints /photos/:photoId/annotations/* и /annotations/:id/*
 */

import client from "./client.js";

/**
 * POST /photos/:photoId/annotations
 * Создать первую версию annotation для фото.
 * @param {String} photoId
 * @param {Object} data — { presetType, landmarks, description? }
 */
export const createAnnotation = async (photoId, data) => {
  const { data: response } = await client.post(
    `/photos/${photoId}/annotations`,
    data,
  );
  return response.data;
};

/**
 * GET /photos/:photoId/annotations/current?presetType=...
 * Получить текущую активную annotation для фото.
 * Возвращает null если аннотации ещё нет.
 */
export const getCurrentAnnotation = async (photoId, presetType) => {
  const { data: response } = await client.get(
    `/photos/${photoId}/annotations/current`,
    { params: { presetType } },
  );
  return response.data;
};

/**
 * GET /photos/:photoId/annotations/history?presetType=...
 * История всех версий annotation для фото и preset.
 */
export const getAnnotationHistory = async (photoId, presetType) => {
  const { data: response } = await client.get(
    `/photos/${photoId}/annotations/history`,
    { params: { presetType } },
  );
  return response.data;
};

/**
 * POST /photos/:photoId/annotations/version
 * Создать новую версию annotation (предыдущая помечается как не-current).
 */
export const createNewVersion = async (photoId, data) => {
  const { data: response } = await client.post(
    `/photos/${photoId}/annotations/version`,
    data,
  );
  return response.data;
};

/**
 * GET /annotations/:annotationId
 */
export const getAnnotation = async (annotationId) => {
  const { data: response } = await client.get(`/annotations/${annotationId}`);
  return response.data;
};

/**
 * PATCH /annotations/:annotationId
 * Обновить landmarks текущей annotation (с автоматическим пересчётом measurements).
 */
export const updateLandmarks = async (annotationId, landmarks) => {
  const { data: response } = await client.patch(
    `/annotations/${annotationId}`,
    { landmarks },
  );
  return response.data;
};

/**
 * POST /annotations/:annotationId/lock
 * Зафиксировать annotation (юридическая финализация).
 */
export const lockAnnotation = async (annotationId, reason) => {
  const { data: response } = await client.post(
    `/annotations/${annotationId}/lock`,
    { reason },
  );
  return response.data;
};

/**
 * POST /annotations/:annotationId/unlock
 * Разлочить annotation (требует reason ≥ 10 символов).
 */
export const unlockAnnotation = async (annotationId, reason) => {
  const { data: response } = await client.post(
    `/annotations/${annotationId}/unlock`,
    { reason },
  );
  return response.data;
};

/**
 * DELETE /annotations/:annotationId
 */
export const deleteAnnotation = async (annotationId, reason) => {
  const { data: response } = await client.delete(
    `/annotations/${annotationId}`,
    { data: { reason } },
  );
  return response.data;
};
