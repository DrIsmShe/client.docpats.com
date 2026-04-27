/**
 * Calibration API
 * ===============
 * Обёртки над endpoints /studies/:studyId/calibrate/*
 */

import client from "./client.js";

/**
 * POST /studies/:studyId/calibrate/ruler
 * @param {String} studyId
 * @param {Object} data — { referencePhotoId, point1, point2, knownDistanceMm }
 */
export const calibrateWithRuler = async (studyId, data) => {
  const { data: response } = await client.post(
    `/studies/${studyId}/calibrate/ruler`,
    data,
  );
  return response.data;
};

/**
 * POST /studies/:studyId/calibrate/interpupillary
 * @param {String} studyId
 * @param {Object} data — { referencePhotoId, leftPupil, rightPupil, patientGender?, assumedDistanceMm? }
 */
export const calibrateWithInterpupillary = async (studyId, data) => {
  const { data: response } = await client.post(
    `/studies/${studyId}/calibrate/interpupillary`,
    data,
  );
  return response.data;
};

/**
 * POST /studies/:studyId/recalibrate
 * @param {String} studyId
 * @param {Object} payload — { method: "ruler"|"interpupillary", data: {...} }
 */
export const recalibrate = async (studyId, payload) => {
  const { data: response } = await client.post(
    `/studies/${studyId}/recalibrate`,
    payload,
  );
  return response.data;
};

/**
 * GET /studies/:studyId/calibration
 */
export const getCalibrationInfo = async (studyId) => {
  const { data: response } = await client.get(
    `/studies/${studyId}/calibration`,
  );
  return response.data;
};

/**
 * DELETE /studies/:studyId/calibration
 */
export const uncalibrate = async (studyId) => {
  const { data: response } = await client.delete(
    `/studies/${studyId}/calibration`,
  );
  return response.data;
};
