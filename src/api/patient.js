// src/api/patient.js
//
// API helpers for patient-cabinet endpoints under /patient-profile.
// Sprint 3.1 — PatientConsent UI (grant/update/revoke).
// Sprint 3.2 — Pull Consent (list/approve/reject consent requests).

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

// ═══════════════════════════════════════════════════════════════════════════
//  CONSENT REQUESTS (Sprint 3.2 — Pull Consent)
// ═══════════════════════════════════════════════════════════════════════════
//
// Clinic-initiated requests for patient consent. Patient sees them in their
// cabinet and decides: approve (creates PatientConsent) or reject.
//
// FSM: pending → approved | rejected | expired | cancelled.
// Expiry: 30 days default, cron-marked at 04:00 UTC daily.
//
// Approve idempotency: server uses findOneAndUpdate with status filter.
// Double-click safe — second call returns 409 NOT_PENDING.

/**
 * GET /patient-profile/consent-requests
 *
 * Returns all PENDING consent requests for the current patient.
 * Response: { items: ConsentRequest[], count }
 *
 * Each item is populated with `clinicId` (name, slug, logoUrl).
 */
export async function getMyConsentRequests() {
  const { data } = await axios.get(
    `${API_BASE}/patient-profile/consent-requests`,
    {
      withCredentials: true,
      params: { t: Date.now() }, // cache bust
      headers: { "Cache-Control": "no-cache" },
    },
  );
  return data;
}

/**
 * POST /patient-profile/consent-requests/:id/approve
 *
 * Approve a pending consent request → creates PatientConsent.
 *
 * @param {string} requestId
 * @param {object} [approvedScopes] — optional subset of requestedScopes.
 *                                    If omitted, approves all requested scopes.
 *
 * Response: { request, consent, action: "approved" }
 *
 * Errors:
 *   404 NOT_FOUND          — request doesn't exist
 *   409 NOT_PENDING        — already approved/rejected/expired/cancelled
 *   403 FORBIDDEN          — not the request owner
 *   422 SCOPES_OUT_OF_RANGE — approvedScopes ⊄ requestedScopes
 *   422 ZERO_SCOPES_APPROVED — all approvedScopes are false (use reject)
 */
export async function approveConsentRequest(requestId, approvedScopes = null) {
  const body = approvedScopes ? { approvedScopes } : {};
  const { data } = await axios.post(
    `${API_BASE}/patient-profile/consent-requests/${requestId}/approve`,
    body,
    { withCredentials: true },
  );
  return data;
}

/**
 * POST /patient-profile/consent-requests/:id/reject
 *
 * Reject a pending consent request.
 *
 * @param {string} requestId
 * @param {string} [note] — optional reason note (max 500 chars on server)
 *
 * Response: { request, action: "rejected" }
 *
 * Errors:
 *   404 NOT_FOUND   — request doesn't exist
 *   409 NOT_PENDING — already in terminal state
 *   403 FORBIDDEN   — not the request owner
 */
export async function rejectConsentRequest(requestId, note = null) {
  const body = note ? { note } : {};
  const { data } = await axios.post(
    `${API_BASE}/patient-profile/consent-requests/${requestId}/reject`,
    body,
    { withCredentials: true },
  );
  return data;
}
