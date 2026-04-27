/**
 * Study API
 * =========
 * Обёртки над endpoints /cases/:caseId/studies/* и /studies/:studyId/*
 */

import client from "./client.js";

/**
 * POST /cases/:caseId/studies
 */
export const createStudy = async (caseId, data) => {
  const { data: response } = await client.post(
    `/cases/${caseId}/studies`,
    data,
  );
  return response.data;
};

/**
 * GET /cases/:caseId/studies
 */
export const listStudiesByCase = async (caseId, params = {}) => {
  const { data: response } = await client.get(`/cases/${caseId}/studies`, {
    params,
  });
  return response.data;
};

/**
 * GET /studies/:studyId
 */
export const getStudy = async (studyId) => {
  const { data: response } = await client.get(`/studies/${studyId}`);
  return response.data;
};

/**
 * PATCH /studies/:studyId
 */
export const updateStudy = async (studyId, updates) => {
  const { data: response } = await client.patch(`/studies/${studyId}`, updates);
  return response.data;
};

/**
 * POST /studies/:studyId/complete
 */
export const completeStudy = async (studyId) => {
  const { data: response } = await client.post(`/studies/${studyId}/complete`);
  return response.data;
};

/**
 * DELETE /studies/:studyId
 */
export const deleteStudy = async (studyId, reason) => {
  const { data: response } = await client.delete(`/studies/${studyId}`, {
    data: { reason },
  });
  return response.data;
};
