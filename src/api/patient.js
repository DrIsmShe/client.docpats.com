// src/api/patient.js
//
// API helpers for patient-cabinet endpoints under /patient-profile.
// Sprint 3.1 — PatientConsent UI.

import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

/**
 * GET /patient-profile/my-clinics
 * Returns: { items: [{clinic, card, consent | null}], count }
 */
export async function getMyClinics() {
  const { data } = await axios.get(`${API_BASE}/patient-profile/my-clinics`, {
    withCredentials: true,
    params: { t: Date.now() }, // cache bust
    headers: { "Cache-Control": "no-cache" },
  });
  return data;
}

/**
 * POST /patient-profile/grant-consent
 * @param {object} payload
 * @param {string} payload.cardId    ClinicPatient _id
 * @param {object} payload.scopes    {encounters, allergies, chronicDiseases, operations, familyHistory, immunization, imaging}
 *
 * If active consent already exists, server merges scopes (action: "updated_existing").
 * Otherwise creates new (action: "granted").
 */
export async function grantConsent({ cardId, scopes }) {
  const { data } = await axios.post(
    `${API_BASE}/patient-profile/grant-consent`,
    { cardId, scopes },
    { withCredentials: true },
  );
  return data;
}

/**
 * PATCH /patient-profile/update-consent-scopes/:id
 * @param {string} consentId
 * @param {object} scopes — partial scopes object (merge semantics)
 */
export async function updateConsentScopes(consentId, scopes) {
  const { data } = await axios.patch(
    `${API_BASE}/patient-profile/update-consent-scopes/${consentId}`,
    { scopes },
    { withCredentials: true },
  );
  return data;
}

/**
 * DELETE /patient-profile/revoke-consent/:id
 * @param {string} consentId
 * @param {string} [reason] - optional reason text (max 500 chars on server)
 */
export async function revokeConsent(consentId, reason = null) {
  const { data } = await axios.delete(
    `${API_BASE}/patient-profile/revoke-consent/${consentId}`,
    {
      withCredentials: true,
      data: { reason }, // DELETE с body — axios нужен data в config
    },
  );
  return data;
}
