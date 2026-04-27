/**
 * Case API
 * ========
 * Обёртки над endpoints /cases/*
 */

import client from "./client.js";

/**
 * POST /cases
 * Создать новый case.
 * @param {Object} data — { patientType, patientId, procedureType, ... }
 */
export const createCase = async (data) => {
  const { data: response } = await client.post("/cases", data);
  return response.data;
};

/**
 * GET /cases
 * Список case-ов текущего врача с фильтрами.
 * @param {Object} params — { status, procedureType, isArchived, limit, skip, sortBy, sortOrder }
 */
export const listCases = async (params = {}) => {
  const { data: response } = await client.get("/cases", { params });
  return response.data;
};

/**
 * GET /cases/:caseId
 * Получить детали case.
 */
export const getCase = async (caseId, params = {}) => {
  const { data: response } = await client.get(`/cases/${caseId}`, { params });
  return response.data;
};
/**
 * PATCH /cases/:caseId
 * Обновить case.
 */
export const updateCase = async (caseId, updates) => {
  const { data: response } = await client.patch(`/cases/${caseId}`, updates);
  return response.data;
};

/**
 * POST /cases/:caseId/consent
 * Зафиксировать consent пациента.
 */
export const giveConsent = async (caseId, consentDocumentUrl) => {
  const { data: response } = await client.post(`/cases/${caseId}/consent`, {
    consentDocumentUrl,
  });
  return response.data;
};

/**
 * POST /cases/:caseId/archive
 */
export const archiveCase = async (caseId, reason) => {
  const { data: response } = await client.post(`/cases/${caseId}/archive`, {
    reason,
  });
  return response.data;
};

/**
 * POST /cases/:caseId/unarchive
 */
export const unarchiveCase = async (caseId) => {
  const { data: response } = await client.post(`/cases/${caseId}/unarchive`);
  return response.data;
};

/**
 * DELETE /cases/:caseId
 * Soft-delete case с каскадным удалением studies/photos/annotations.
 */
export const deleteCase = async (caseId, reason) => {
  const { data: response } = await client.delete(`/cases/${caseId}`, {
    data: { reason },
  });
  return response.data;
};
