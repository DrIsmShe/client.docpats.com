// client/src/api/videoApi.js
//
// Frontend API for the Jitsi video integration. The backend checks (by
// session) that the current user is allowed into the room, then returns a
// short-lived Jitsi JWT.
//
// Room sources supported:
//   - dialog            → 1:1 chat call     POST /communication/video/token
//   - consilium         → group doctor call POST /api/v1/clinic/consilia/:id/video-token
//   - consilium-patient → group call, PATIENT side
//                         POST /appointment-for-patient/consilium-video/:id/video-token
//   - telemed           → virtual visit (DOCTOR / clinic side)
//                         POST /api/v1/clinic/telemed/:id/video-token
//   - telemed-patient   → virtual visit (PATIENT side)
//                         POST /appointment-for-patient/telemed-video/:id/video-token
//   - appointment       → freelance video   POST /appointment-for-patient/video/:id/token
//
// All go through the shared axios instance (baseURL = backend origin,
// withCredentials) so the session cookie is sent automatically.
import axios from "../axios";
import { track } from "../lib/analytics";
import { VIDEO_ROOM_JOINED } from "../lib/events";
/**
 * Token for a 1:1 dialog video call.
 * @param {string} dialogId
 */
export const getDialogVideoToken = (dialogId) =>
  axios
    .post("/communication/video/token", { kind: "dialog", id: dialogId })
    .then((res) => {
      track(VIDEO_ROOM_JOINED, { context: "dialog" });
      return res.data;
    });
/**
 * Token for a consilium group video call — DOCTOR / clinic side.
 * @param {string} consiliumId
 * @param {string} [displayName]
 */
export const getConsiliumVideoToken = (consiliumId, displayName) =>
  axios
    .post(
      `/api/v1/clinic/consilia/${consiliumId}/video-token`,
      displayName ? { displayName } : {},
    )
    .then((res) => {
      track(VIDEO_ROOM_JOINED, { context: "consilium" });
      return res.data;
    });
/**
 * Token for a consilium group video call — PATIENT side.
 * Authenticated by session (no clinic membership); the backend authorizes the
 * patient via patientId -> ClinicPatient.linkedUserId AND consilium.patientCanJoin.
 * @param {string} consiliumId
 * @param {string} [displayName]
 */
export const getPatientConsiliumVideoToken = (consiliumId, displayName) =>
  axios
    .post(
      `/appointment-for-patient/consilium-video/${consiliumId}/video-token`,
      displayName ? { displayName } : {},
    )
    .then((res) => {
      track(VIDEO_ROOM_JOINED, { context: "consilium_patient" });
      return res.data;
    });
/**
 * List the consilia the current patient has been invited into.
 * GET /appointment-for-patient/consilium-video/my  → { success, items: [...] }
 * @returns {Promise<Array>}
 */
export const getMyConsilia = () =>
  axios
    .get(`/appointment-for-patient/consilium-video/my`)
    .then((res) => res.data?.items || []);
/**
 * Token for a telemed session video call — DOCTOR / clinic side.
 * Requires a clinic membership (runs under the clinic tenant).
 * @param {string} sessionId
 * @param {string} [displayName]
 */
export const getTelemedVideoToken = (sessionId, displayName) =>
  axios
    .post(
      `/api/v1/clinic/telemed/${sessionId}/video-token`,
      displayName ? { displayName } : {},
    )
    .then((res) => {
      track(VIDEO_ROOM_JOINED, { context: "telemed" });
      return res.data;
    });
/**
 * Token for a telemed session video call — PATIENT side.
 * Authenticated by session (no clinic membership); the backend authorizes the
 * patient via patientUserId / the session's ClinicPatient.linkedUserId.
 * @param {string} sessionId
 * @param {string} [displayName]
 */
export const getPatientTelemedVideoToken = (sessionId, displayName) =>
  axios
    .post(
      `/appointment-for-patient/telemed-video/${sessionId}/video-token`,
      displayName ? { displayName } : {},
    )
    .then((res) => {
      track(VIDEO_ROOM_JOINED, { context: "telemed_patient" });
      return res.data;
    });
/**
 * List the current patient's telemed sessions (cards with clinic/doctor names).
 * GET /appointment-for-patient/telemed-video/my
 * @returns {Promise<Array>}
 */
export const getMyTelemedSessions = () =>
  axios
    .get(`/appointment-for-patient/telemed-video/my`)
    .then((res) => res.data?.data || []);
/**
 * List the current patient's freelance appointments.
 * GET /appointment-for-patient/my  → { success, count, data: [...] }
 * Used by the unified "Online consultations" page to surface video appts.
 * @returns {Promise<Array>}
 */
export const getMyAppointments = () =>
  axios.get(`/appointment-for-patient/my`).then((res) => res.data?.data || []);
/**
 * Token for a freelance appointment video consultation.
 * Both the doctor and the patient call this from their own session; the
 * backend decides moderator (doctor) vs participant (patient).
 * @param {string} appointmentId
 * @param {string} [displayName]
 */
export const getAppointmentVideoToken = (appointmentId, displayName) =>
  axios
    .post(
      `/appointment-for-patient/video/${appointmentId}/token`,
      displayName ? { displayName } : {},
    )
    .then((res) => {
      track(VIDEO_ROOM_JOINED, { context: "appointment" });
      return res.data;
    });
export default {
  getDialogVideoToken,
  getConsiliumVideoToken,
  getPatientConsiliumVideoToken,
  getMyConsilia,
  getTelemedVideoToken,
  getPatientTelemedVideoToken,
  getMyTelemedSessions,
  getMyAppointments,
  getAppointmentVideoToken,
};
