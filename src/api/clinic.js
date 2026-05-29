// client/src/api/clinic.js
//
// All API calls for the clinic module.
// All requests use the main axios instance with withCredentials: true.
//
// Backend response convention: list endpoints wrap arrays in semantic keys
// like { staff: [...] } / { doctors: [...] } / { invitations: [...] } /
// { memberships: [...] }. Frontend normalizers convert all of these to a
// uniform { items: [...] } shape so React components don't need to care.

import axios from "../axios";

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Normalize a list response to { items: [...] }.
 * Accepts: raw array, { items: [...] }, or { [knownKey]: [...] }.
 */
function normalizeList(data, knownKeys = []) {
  if (Array.isArray(data)) return { items: data };
  if (data && Array.isArray(data.items)) return data;
  if (data && typeof data === "object") {
    for (const key of knownKeys) {
      if (Array.isArray(data[key])) return { items: data[key] };
    }
  }
  return { items: [] };
}

// ─── Authenticated context ────────────────────────────────────

/**
 * GET /api/v1/clinic/me
 * Returns the current user's clinic context: authenticated, hasClinic, role,
 * permissions, features, and full clinic profile if user has membership.
 */
export const getClinicMe = async () => {
  const res = await axios.get("/api/v1/clinic/me");
  return res.data;
};

/**
 * GET /api/v1/clinic/me/memberships
 * Returns all clinics the user belongs to.
 */
export const getMyMemberships = async () => {
  const res = await axios.get("/api/v1/clinic/me/memberships");
  return normalizeList(res.data, ["memberships"]);
};

// ─── Clinic CRUD ──────────────────────────────────────────────

/**
 * POST /api/v1/clinic/clinics
 * Create a new clinic with the current user as owner.
 */
export const createClinic = async ({
  name,
  slug,
  contacts,
  timezone,
  defaultCurrency,
  defaultLanguage,
}) => {
  const res = await axios.post("/api/v1/clinic/clinics", {
    name,
    ...(slug && { slug }),
    ...(contacts && { contacts }),
    ...(timezone && { timezone }),
    ...(defaultCurrency && { defaultCurrency }),
    ...(defaultLanguage && { defaultLanguage }),
  });
  return res.data;
};

/**
 * PATCH /api/v1/clinic/clinics/:id
 * Update clinic profile. Only owner/admin can do this.
 */
export const updateClinic = async (clinicId, updates) => {
  const res = await axios.patch(`/api/v1/clinic/clinics/${clinicId}`, updates);
  return res.data;
};

/**
 * GET /api/v1/clinic/public/:slug
 * Public clinic profile by slug (no auth required).
 */
export const getClinicBySlug = async (slug) => {
  const res = await axios.get(`/api/v1/clinic/public/${slug}`);
  return res.data;
};

// ─── Staff ─────────────────────────────────────────────────────

/**
 * GET /api/v1/clinic/staff
 * List all members of the current clinic.
 */
export const listStaff = async () => {
  const res = await axios.get("/api/v1/clinic/staff");
  return normalizeList(res.data, ["staff"]);
};

/**
 * POST /api/v1/clinic/staff
 * Add an existing DocPats user (typically a doctor) directly to the clinic.
 */
export const addStaff = async ({ userId, role, customTitle }) => {
  const res = await axios.post("/api/v1/clinic/staff", {
    userId,
    role,
    ...(customTitle && { customTitle }),
  });
  return res.data;
};

/**
 * PATCH /api/v1/clinic/staff/:id/role
 * Change a staff member's role.
 */
export const changeStaffRole = async (membershipId, newRole) => {
  const res = await axios.patch(`/api/v1/clinic/staff/${membershipId}/role`, {
    role: newRole,
  });
  return res.data;
};

/**
 * DELETE /api/v1/clinic/staff/:id
 * Remove a staff member from the clinic (soft delete).
 */
export const removeStaff = async (membershipId) => {
  const res = await axios.delete(`/api/v1/clinic/staff/${membershipId}`);
  return res.data;
};

/**
 * GET /api/v1/clinic/staff/search-doctors?q=...
 * Search existing DocPats doctors who are not yet in this clinic.
 */
export const searchDoctors = async (query) => {
  const res = await axios.get("/api/v1/clinic/staff/search-doctors", {
    params: { q: query },
  });
  return normalizeList(res.data, ["doctors"]);
};

// ─── Invitations ───────────────────────────────────────────────

/**
 * POST /api/v1/clinic/invitations
 * Invite a new internal employee by email. Sends an email with a signed link.
 */
export const createInvitation = async ({
  email,
  role,
  customTitle,
  language,
}) => {
  const res = await axios.post("/api/v1/clinic/invitations", {
    email,
    role,
    ...(customTitle && { customTitle }),
    ...(language && { language }),
  });
  return res.data;
};

/**
 * GET /api/v1/clinic/invitations?status=pending
 * List invitations of the current clinic.
 */
export const listInvitations = async (status = "pending") => {
  const res = await axios.get("/api/v1/clinic/invitations", {
    params: { status },
  });
  return normalizeList(res.data, ["invitations"]);
};

/**
 * DELETE /api/v1/clinic/invitations/:id
 * Revoke a pending invitation.
 */
export const revokeInvitation = async (invitationId) => {
  const res = await axios.delete(`/api/v1/clinic/invitations/${invitationId}`);
  return res.data;
};

/**
 * GET /api/v1/clinic/invitations/preview?token=...
 * Public — preview invitation details before accepting.
 */
export const previewInvitation = async (token) => {
  const res = await axios.get("/api/v1/clinic/invitations/preview", {
    params: { token },
  });
  return res.data;
};

/**
 * POST /api/v1/clinic/invitations/request-otp
 * Public — request an OTP code to be sent to the invitation email.
 */
export const requestInvitationOtp = async (token) => {
  const res = await axios.post("/api/v1/clinic/invitations/request-otp", {
    token,
  });
  return res.data;
};

/**
 * POST /api/v1/clinic/invitations/accept
 * Public — verify OTP, set password, register as ClinicEmployee.
 */
export const acceptInvitation = async ({
  token,
  otp,
  password,
  firstName,
  lastName,
  phoneNumber,
  language,
}) => {
  const res = await axios.post("/api/v1/clinic/invitations/accept", {
    token,
    otp,
    password,
    firstName,
    lastName,
    ...(phoneNumber && { phoneNumber }),
    ...(language && { language }),
  });
  return res.data;
};

// ─── Employee auth ────────────────────────────────────────────

/**
 * POST /api/v1/clinic/employees/login
 * Public — log in as a ClinicEmployee.
 */
export const employeeLogin = async ({ email, password }) => {
  const res = await axios.post("/api/v1/clinic/employees/login", {
    email,
    password,
  });
  return res.data;
};

/**
 * POST /api/v1/clinic/employees/logout
 * Destroy current employee session.
 */
export const employeeLogout = async () => {
  const res = await axios.post("/api/v1/clinic/employees/logout");
  return res.data;
};

/**
 * GET /api/v1/clinic/employees/me
 * Returns current authenticated employee + clinic context.
 */
export const getEmployeeMe = async () => {
  const res = await axios.get("/api/v1/clinic/employees/me");
  return res.data;
};

// ─── Patients ──────────────────────────────────────────────────

/**
 * GET /api/v1/clinic/patients
 * List patients of the current clinic. Cursor-based pagination.
 * @param {object} options { limit?, before?, sortBy?, includeLinked? }
 */
export const listPatients = async (options = {}) => {
  const res = await axios.get("/api/v1/clinic/patients", { params: options });
  return normalizeList(res.data, ["patients"]);
};

/**
 * POST /api/v1/clinic/patients
 * Create a new patient record in the current clinic.
 */
export const createPatient = async (data) => {
  const res = await axios.post("/api/v1/clinic/patients", data);
  return res.data;
};

/**
 * GET /api/v1/clinic/patients/search
 * Exact-match on phone/email (blind index) + prefix on lastName.
 * At least one of phone/email/lastName is required.
 */
export const searchPatients = async ({ phone, email, lastName, limit }) => {
  const res = await axios.get("/api/v1/clinic/patients/search", {
    params: {
      ...(phone && { phone }),
      ...(email && { email }),
      ...(lastName && { lastName }),
      ...(limit && { limit }),
    },
  });
  return normalizeList(res.data, ["patients"]);
};

/**
 * GET /api/v1/clinic/patients/:id
 */
export const getPatient = async (patientId) => {
  const res = await axios.get(`/api/v1/clinic/patients/${patientId}`);
  return res.data;
};

/**
 * PATCH /api/v1/clinic/patients/:id
 */
export const updatePatient = async (patientId, updates) => {
  const res = await axios.patch(
    `/api/v1/clinic/patients/${patientId}`,
    updates,
  );
  return res.data;
};

/**
 * DELETE /api/v1/clinic/patients/:id
 * Soft delete.
 */
export const deletePatient = async (patientId) => {
  const res = await axios.delete(`/api/v1/clinic/patients/${patientId}`);
  return res.data;
};

/**
 * POST /api/v1/clinic/patients/:id/link
 * Link a patient to an existing DocPats user account.
 */
export const linkPatientToUser = async (patientId, userId) => {
  const res = await axios.post(`/api/v1/clinic/patients/${patientId}/link`, {
    userId,
  });
  return res.data;
};

/**
 * DELETE /api/v1/clinic/patients/:id/link
 */
export const unlinkPatientFromUser = async (patientId) => {
  const res = await axios.delete(`/api/v1/clinic/patients/${patientId}/link`);
  return res.data;
};

/**
 * GET /api/v1/clinic/patients/users/search
 * Search DocPats User accounts to link a patient to. Two modes:
 *   mode="email" — exact email match
 *   mode="dob"   — date of birth + optional firstName/lastName filter
 *
 * @param {object} params
 * @param {"email"|"dob"} params.mode
 * @param {string} [params.email]        required when mode="email"
 * @param {string} [params.dateOfBirth] required when mode="dob" (YYYY-MM-DD)
 * @param {string} [params.firstName]   optional name filter (mode="dob")
 * @param {string} [params.lastName]    optional name filter (mode="dob")
 */
export const searchUsersForLink = async ({
  mode,
  email,
  dateOfBirth,
  firstName,
  lastName,
}) => {
  const res = await axios.get("/api/v1/clinic/patients/users/search", {
    params: {
      mode,
      ...(email && { email }),
      ...(dateOfBirth && { dateOfBirth }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
    },
  });
  return normalizeList(res.data, ["users", "items"]);
};

// ─── Doctor schedule + exceptions (Sprint 1, day 1-2) ──────────
//
// Backend module: server/modules/clinic/clinic-appointments/
// Full path prefix: /api/v1/clinic/appointments
//
// Endpoints:
//   PUT    /appointments/schedule/:doctorId               weekly pattern upsert
//   GET    /appointments/schedule/:doctorId               one doctor's weekly pattern
//   POST   /appointments/exceptions/:doctorId             one date exception
//   POST   /appointments/exceptions/:doctorId/bulk-day-off   vacation range
//   GET    /appointments/exceptions/:doctorId?from=&to=   exceptions in window
//   DELETE /appointments/exceptions/entry/:exceptionId    delete one exception

/**
 * GET /api/v1/clinic/appointments/schedule/:doctorId
 * Fetch one doctor's weekly working-hours pattern.
 * Returns { schedule: {...} | null }. `null` = no schedule set yet.
 */
export const getDoctorSchedule = async (doctorId) => {
  const res = await axios.get(
    `/api/v1/clinic/appointments/schedule/${doctorId}`,
  );
  return res.data; // { schedule: {...} | null }
};

/**
 * PUT /api/v1/clinic/appointments/schedule/:doctorId
 * Create or replace a doctor's weekly working-hours pattern.
 *
 * @param {string} doctorId
 * @param {object} payload
 *   {
 *     weeklyHours: [
 *       { weekday: 0-6, intervals: [{ startMinute, endMinute }, ...] },
 *       ...
 *     ],
 *     slotDurationMinutes?: number,   // default 30
 *     bufferMinutes?: number,         // default 0
 *     isActive?: boolean,             // default true
 *   }
 * Times are minutes-from-midnight (0-1440) in clinic-local time.
 * weekday follows JS Date.getDay(): 0 = Sunday ... 6 = Saturday.
 */
export const upsertDoctorSchedule = async (doctorId, payload) => {
  const res = await axios.put(
    `/api/v1/clinic/appointments/schedule/${doctorId}`,
    payload,
  );
  return res.data; // { schedule: {...} }
};

/**
 * GET /api/v1/clinic/appointments/exceptions/:doctorId?from=&to=
 * List per-date exceptions (day-off / custom hours) for a doctor within an
 * inclusive date window. Both bounds required, format "YYYY-MM-DD".
 * Returns { items: [...] } (normalized from { exceptions: [...] }).
 */
export const listScheduleExceptions = async (doctorId, { from, to }) => {
  const res = await axios.get(
    `/api/v1/clinic/appointments/exceptions/${doctorId}`,
    { params: { from, to } },
  );
  return normalizeList(res.data, ["exceptions"]);
};

/**
 * POST /api/v1/clinic/appointments/exceptions/:doctorId
 * Create (or replace) one schedule exception for one date.
 *
 * @param {string} doctorId
 * @param {object} payload
 *   {
 *     date: "YYYY-MM-DD",            // required
 *     type: "day_off" | "custom",   // required
 *     intervals?: [{ startMinute, endMinute }, ...],  // required iff custom
 *     note?: string,                // optional, <= 200 chars
 *   }
 */
export const createScheduleException = async (doctorId, payload) => {
  const res = await axios.post(
    `/api/v1/clinic/appointments/exceptions/${doctorId}`,
    payload,
  );
  return res.data; // { exception: {...} }
};

/**
 * POST /api/v1/clinic/appointments/exceptions/:doctorId/bulk-day-off
 * Mark an inclusive date range as day-off (vacation). Expanded server-side
 * into one "day_off" exception per calendar day. Idempotent per day.
 *
 * @param {string} doctorId
 * @param {object} payload
 *   {
 *     startDate: "YYYY-MM-DD",  // required, inclusive
 *     endDate:   "YYYY-MM-DD",  // required, inclusive
 *     note?: string,            // optional, applied to every generated day
 *   }
 * Returns { created: <count>, days: ["YYYY-MM-DD", ...] }
 */
export const bulkCreateDayOff = async (doctorId, payload) => {
  const res = await axios.post(
    `/api/v1/clinic/appointments/exceptions/${doctorId}/bulk-day-off`,
    payload,
  );
  return res.data; // { created, days }
};

/**
 * DELETE /api/v1/clinic/appointments/exceptions/entry/:exceptionId
 * Delete one schedule exception by its own id (soft delete).
 * Note the "/entry/" segment — distinct from the :doctorId routes.
 */
export const deleteScheduleException = async (exceptionId) => {
  const res = await axios.delete(
    `/api/v1/clinic/appointments/exceptions/entry/${exceptionId}`,
  );
  return res.data; // { deleted: true, id }
};

// ─── Appointments (Sprint 1, day 4-5) ─────────────────────────
//
// APPEND this block to client/src/api/clinic.js, right after the
// "Doctor schedule + exceptions" section. Reuses the same axios import
// and normalizeList helper already at the top of clinic.js.
//
// Backend module: server/modules/clinic/clinic-appointments/
// Path prefix: /api/v1/clinic/appointments
//
// Endpoints (full URLs):
//   POST   /appointments                       create
//   GET    /appointments?doctorId=&from=&to=   list (doctor mode, day window)
//   GET    /appointments?patientId=&before=    list (patient mode, cursor)
//   GET    /appointments/slots-free?...        bookable slots (schedule MINUS booked)
//   GET    /appointments/:id                   one
//   PATCH  /appointments/:id/reschedule        move time
//   PATCH  /appointments/:id/reason            edit reason (any status)
//   PATCH  /appointments/:id/status            FSM transition

/**
 * POST /api/v1/clinic/appointments
 *
 * Create a new appointment.
 *
 * @param {object} payload
 *   {
 *     doctorId:  string,
 *     patientId: string,
 *     startUTC:  ISO string,         // absolute instant
 *     endUTC:    ISO string,         // absolute instant
 *     reason?:   string              // PHI, encrypted server-side
 *   }
 * Returns { appointment: {...} }
 * 409 if doctor already has an overlapping active appointment.
 */
export const createAppointment = async (payload) => {
  const res = await axios.post("/api/v1/clinic/appointments", payload);
  return res.data;
};

/**
 * GET /api/v1/clinic/appointments?doctorId=&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * List ALL appointments for a doctor in a clinic-local date window.
 * Ordered by startUTC ascending. The calendar page uses this with
 * from === to (single day).
 *
 * @param {object} params
 *   { doctorId, from, to, status? }
 * Returns { items, count } (normalized from { items: [...] }).
 */
export const listAppointmentsForDoctor = async ({
  doctorId,
  from,
  to,
  status,
}) => {
  const res = await axios.get("/api/v1/clinic/appointments", {
    params: {
      doctorId,
      from,
      to,
      ...(status && { status }),
    },
  });
  return normalizeList(res.data, ["appointments"]);
};

/**
 * GET /api/v1/clinic/appointments?patientId=...&before=ISO&limit=N
 *
 * Cursor-paginated history for one patient, most-recent first.
 *
 * Returns { items, count, nextBefore } — pass nextBefore back as
 * `before` on the next call.
 */
export const listAppointmentsForPatient = async ({
  patientId,
  before,
  limit,
  status,
}) => {
  const res = await axios.get("/api/v1/clinic/appointments", {
    params: {
      patientId,
      ...(before && { before }),
      ...(limit && { limit }),
      ...(status && { status }),
    },
  });
  // Don't normalize — patient mode returns nextBefore which would be lost.
  return res.data;
};

/**
 * GET /api/v1/clinic/appointments/slots-free?doctorId=&from=&to=
 *
 * Bookable slots = doctor's working schedule MINUS active appointments.
 * Same response shape as the day-3 /appointments/slots endpoint.
 *
 * @returns {{
 *   doctorId: string,
 *   slotDurationMinutes: number,
 *   bufferMinutes: number,
 *   timezone: string,
 *   days: Array<{ date: "YYYY-MM-DD",
 *                 slots: Array<{startMinute,endMinute,startUTC}> }>
 * }}
 */
export const listFreeSlots = async ({ doctorId, from, to }) => {
  const res = await axios.get("/api/v1/clinic/appointments/slots-free", {
    params: { doctorId, from, to },
  });
  return res.data;
};

/**
 * GET /api/v1/clinic/appointments/:id
 * Returns { appointment: {...} }
 */
export const getAppointment = async (appointmentId) => {
  const res = await axios.get(`/api/v1/clinic/appointments/${appointmentId}`);
  return res.data;
};

/**
 * PATCH /api/v1/clinic/appointments/:id/reschedule
 *
 * Move time. Only legal while status is scheduled or checked_in.
 *
 * @param {string} appointmentId
 * @param {object} payload  { startUTC, endUTC, reason? }
 */
export const rescheduleAppointment = async (appointmentId, payload) => {
  const res = await axios.patch(
    `/api/v1/clinic/appointments/${appointmentId}/reschedule`,
    payload,
  );
  return res.data;
};

/**
 * PATCH /api/v1/clinic/appointments/:id/reason
 *
 * Edit reason/notes regardless of current status. Used to correct
 * typos on completed appointments without touching their lifecycle.
 *
 * @param {string} appointmentId
 * @param {object} payload  { reason: string | null }
 */
export const updateAppointmentReason = async (appointmentId, payload) => {
  const res = await axios.patch(
    `/api/v1/clinic/appointments/${appointmentId}/reason`,
    payload,
  );
  return res.data;
};

/**
 * PATCH /api/v1/clinic/appointments/:id/status
 *
 * Lifecycle FSM transition.
 *   scheduled  → checked_in | cancelled | no_show
 *   checked_in → completed  | cancelled | no_show
 *   completed / cancelled / no_show → terminal
 *
 * @param {string} appointmentId
 * @param {object} payload  { status, cancelReason? }
 *   cancelReason only allowed when status === "cancelled".
 */
export const changeAppointmentStatus = async (appointmentId, payload) => {
  const res = await axios.patch(
    `/api/v1/clinic/appointments/${appointmentId}/status`,
    payload,
  );
  return res.data;
};

// ═══════════════════════════════════════════════════════════════════════════
//  MEDICAL HISTORY (UMR) — Sprint 2 Phase 2D.1
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Reuses the same `axios` import and `normalizeList` helper from the top of
// that file.
//
// Backend module: server/modules/clinic/clinic-medical/
// Path prefix:    /api/v1/clinic/medical
//
// 37 endpoints total:
//   - 7 encounter endpoints     (history of illness)
//   - 5 allergy endpoints
//   - 5 chronic disease endpoints
//   - 5 operation endpoints
//   - 5 family history endpoints
//   - 5 immunization endpoints
//   - 5 imaging study endpoints (multipart upload for create)
//
// ─────────────────────────────────────────────────────────────────────────
//  ACCESS CHAIN — important context for frontend
// ─────────────────────────────────────────────────────────────────────────
//
// Backend filters list/read endpoints by:
//   1. Ownership      — record belongs to current clinic
//   2. sharedWith     — patient explicitly shared this record with us
//   3. Global consent — PatientConsent.scope grants access to all records
//                       of this scope (allergies / encounters / imaging / ...)
//
// Records visible via paths (2) and (3) carry `isCrossClinic: true` in
// the response. UI should show a small badge on these (e.g. "📋 Другая
// клиника"). They are READ-ONLY — backend rejects update/delete from a
// non-owner clinic.
//
// For non-doctor/owner/admin roles, free-text PHI fields on cross-clinic
// records are stripped server-side. The structured mainDiagnosis stays.
//
// ─────────────────────────────────────────────────────────────────────────
//  ENCOUNTER STATUS WORKFLOW
// ─────────────────────────────────────────────────────────────────────────
//
//   draft → signEncounter() → signed → amendEncounter() → amended
//
// updateEncounter() works on drafts only. signed/amended are immutable
// for content — use amend (requires reason ≥ 5 chars, preserves history[]).
//
// Only owner role can deleteEncounter (HIPAA: deletion is high-stakes).

// ─── ENCOUNTER (medical history of a visit) ───────────────────────────

/**
 * POST /api/v1/clinic/medical/patients/:patientId/encounters
 *
 * Create an encounter for a patient. Body:
 *   {
 *     status: "draft" | "signed",     // default "signed"
 *     mainDiagnosis?: { code, codeTitle?, text },  // required if status="signed"
 *     additionalDiagnosis?, recommendations?,
 *     complaints?, anamnesisMorbi?, anamnesisVitae?,
 *     statusPreasens?, statusLocalis?,
 *     ctScanResults?, mriResults?, ultrasoundResults?, laboratoryTestResults?,
 *     sharedWith?: [clinicId],
 *   }
 * Returns { encounter: {...} } on 201.
 */
export const createEncounter = async (patientId, payload) => {
  const res = await axios.post(
    `/api/v1/clinic/medical/patients/${patientId}/encounters`,
    payload,
  );
  return res.data;
};

/**
 * GET /api/v1/clinic/medical/patients/:patientId/encounters
 *
 * List encounters for a patient with cursor-based pagination.
 *
 * @param {object} options { status?, limit?, before? }
 * Returns { items, nextCursor, count } (normalized).
 */
export const listEncounters = async (patientId, options = {}) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/patients/${patientId}/encounters`,
    { params: options },
  );
  return normalizeList(res.data, ["encounters"]);
};

/**
 * GET /api/v1/clinic/medical/encounters/:encounterId
 * Returns { encounter: {...} }. Carries isCrossClinic flag if not owner.
 */
export const getEncounter = async (encounterId) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/encounters/${encounterId}`,
  );
  return res.data;
};

/**
 * PATCH /api/v1/clinic/medical/encounters/:encounterId
 *
 * Update DRAFT encounter only. signed/amended → use amend instead.
 * Body: any subset of writable fields (same shape as create).
 */
export const updateEncounter = async (encounterId, payload) => {
  const res = await axios.patch(
    `/api/v1/clinic/medical/encounters/${encounterId}`,
    payload,
  );
  return res.data;
};

/**
 * PATCH /api/v1/clinic/medical/encounters/:encounterId/sign
 *
 * Transition draft → signed. Body fields (all optional, applied at sign-time):
 *   { mainDiagnosis?, additionalDiagnosis?, recommendations? }
 * mainDiagnosis must exist (either pre-set in draft or supplied here).
 */
export const signEncounter = async (encounterId, payload = {}) => {
  const res = await axios.patch(
    `/api/v1/clinic/medical/encounters/${encounterId}/sign`,
    payload,
  );
  return res.data;
};

/**
 * PATCH /api/v1/clinic/medical/encounters/:encounterId/amend
 *
 * Transition signed/amended → amended (correction with audit trail).
 * Body:
 *   {
 *     reason: string (min 5 chars, required),
 *     ...any content fields to change
 *   }
 * Old values preserved in history[] on the document.
 */
export const amendEncounter = async (encounterId, payload) => {
  const res = await axios.patch(
    `/api/v1/clinic/medical/encounters/${encounterId}/amend`,
    payload,
  );
  return res.data;
};

/**
 * DELETE /api/v1/clinic/medical/encounters/:encounterId
 * Hard delete. Owner role only (RBAC + ROLE_PERMISSIONS).
 */
export const deleteEncounter = async (encounterId) => {
  const res = await axios.delete(
    `/api/v1/clinic/medical/encounters/${encounterId}`,
  );
  return res.data;
};

// ─── ALLERGY ──────────────────────────────────────────────────────────
// Sub-record. Body: { content: string }
// Final URLs:
//   POST   /medical/patients/:patientId/allergies
//   GET    /medical/patients/:patientId/allergies
//   GET    /medical/allergies/:recordId
//   PATCH  /medical/allergies/:recordId
//   DELETE /medical/allergies/:recordId   (owner only)

export const createAllergy = async (patientId, payload) => {
  const res = await axios.post(
    `/api/v1/clinic/medical/patients/${patientId}/allergies`,
    payload,
  );
  return res.data;
};

export const listAllergies = async (patientId, options = {}) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/patients/${patientId}/allergies`,
    { params: options },
  );
  return normalizeList(res.data, ["allergies"]);
};

export const getAllergy = async (recordId) => {
  const res = await axios.get(`/api/v1/clinic/medical/allergies/${recordId}`);
  return res.data;
};

export const updateAllergy = async (recordId, payload) => {
  const res = await axios.patch(
    `/api/v1/clinic/medical/allergies/${recordId}`,
    payload,
  );
  return res.data;
};

export const deleteAllergy = async (recordId) => {
  const res = await axios.delete(
    `/api/v1/clinic/medical/allergies/${recordId}`,
  );
  return res.data;
};

// ─── CHRONIC DISEASE ──────────────────────────────────────────────────
// Body: { content: string }
// URL segment: chronic-diseases

export const createChronicDisease = async (patientId, payload) => {
  const res = await axios.post(
    `/api/v1/clinic/medical/patients/${patientId}/chronic-diseases`,
    payload,
  );
  return res.data;
};

export const listChronicDiseases = async (patientId, options = {}) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/patients/${patientId}/chronic-diseases`,
    { params: options },
  );
  return normalizeList(res.data, ["chronicDiseases"]);
};

export const getChronicDisease = async (recordId) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/chronic-diseases/${recordId}`,
  );
  return res.data;
};

export const updateChronicDisease = async (recordId, payload) => {
  const res = await axios.patch(
    `/api/v1/clinic/medical/chronic-diseases/${recordId}`,
    payload,
  );
  return res.data;
};

export const deleteChronicDisease = async (recordId) => {
  const res = await axios.delete(
    `/api/v1/clinic/medical/chronic-diseases/${recordId}`,
  );
  return res.data;
};

// ─── OPERATION (past surgery) ─────────────────────────────────────────
// Body: { content: string }
// URL segment: operations

export const createOperation = async (patientId, payload) => {
  const res = await axios.post(
    `/api/v1/clinic/medical/patients/${patientId}/operations`,
    payload,
  );
  return res.data;
};

export const listOperations = async (patientId, options = {}) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/patients/${patientId}/operations`,
    { params: options },
  );
  return normalizeList(res.data, ["operations"]);
};

export const getOperation = async (recordId) => {
  const res = await axios.get(`/api/v1/clinic/medical/operations/${recordId}`);
  return res.data;
};

export const updateOperation = async (recordId, payload) => {
  const res = await axios.patch(
    `/api/v1/clinic/medical/operations/${recordId}`,
    payload,
  );
  return res.data;
};

export const deleteOperation = async (recordId) => {
  const res = await axios.delete(
    `/api/v1/clinic/medical/operations/${recordId}`,
  );
  return res.data;
};

// ─── FAMILY HISTORY ───────────────────────────────────────────────────
// Body: { relative: string, diseaseName: string, content?: string }
// URL segment: family-history

export const createFamilyHistory = async (patientId, payload) => {
  const res = await axios.post(
    `/api/v1/clinic/medical/patients/${patientId}/family-history`,
    payload,
  );
  return res.data;
};

export const listFamilyHistory = async (patientId, options = {}) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/patients/${patientId}/family-history`,
    { params: options },
  );
  return normalizeList(res.data, ["familyHistory"]);
};

export const getFamilyHistoryRecord = async (recordId) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/family-history/${recordId}`,
  );
  return res.data;
};

export const updateFamilyHistoryRecord = async (recordId, payload) => {
  const res = await axios.patch(
    `/api/v1/clinic/medical/family-history/${recordId}`,
    payload,
  );
  return res.data;
};

export const deleteFamilyHistoryRecord = async (recordId) => {
  const res = await axios.delete(
    `/api/v1/clinic/medical/family-history/${recordId}`,
  );
  return res.data;
};

// ─── IMMUNIZATION ─────────────────────────────────────────────────────
// Body: { vaccineName: string, dateGiven?: Date|ISO, content?: string }
// URL segment: immunizations

export const createImmunization = async (patientId, payload) => {
  const res = await axios.post(
    `/api/v1/clinic/medical/patients/${patientId}/immunizations`,
    payload,
  );
  return res.data;
};

export const listImmunizations = async (patientId, options = {}) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/patients/${patientId}/immunizations`,
    { params: options },
  );
  return normalizeList(res.data, ["immunizations"]);
};

export const getImmunization = async (recordId) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/immunizations/${recordId}`,
  );
  return res.data;
};

export const updateImmunization = async (recordId, payload) => {
  const res = await axios.patch(
    `/api/v1/clinic/medical/immunizations/${recordId}`,
    payload,
  );
  return res.data;
};

export const deleteImmunization = async (recordId) => {
  const res = await axios.delete(
    `/api/v1/clinic/medical/immunizations/${recordId}`,
  );
  return res.data;
};

// ─── IMAGING STUDY ────────────────────────────────────────────────────
//
// CT / MRI / USG / X-Ray / etc. Stored with attached image files.
//
// CREATE uses MULTIPART form-data (different from text sub-records):
//   - text fields: studyType, date?, report?, diagnosis?,
//                  contrastUsed?, sharedWith?
//   - file array under field name "images" (up to 20 files, max 150MB each
//     per common upload middleware; sharp compresses images → webp server-side)
//
// LIST / GET / UPDATE / DELETE use plain JSON.
//
// URL segment: imaging

/**
 * POST /api/v1/clinic/medical/patients/:patientId/imaging
 *
 * Multipart upload. Pass a FormData instance (already constructed by caller)
 * OR an object {body, files} which we'll wrap into FormData here.
 *
 * Example (caller-built FormData):
 *   const fd = new FormData();
 *   fd.append("studyType", "CT");
 *   fd.append("report", "...");
 *   for (const f of fileList) fd.append("images", f);
 *   await createImagingStudy(patientId, fd);
 *
 * Example (object form — convenience):
 *   await createImagingStudy(patientId, {
 *     body: { studyType: "MRI", diagnosis: "..." },
 *     files: [file1, file2],
 *   });
 *
 * Returns { success, imaging: {...} } with images[] populated with R2 URLs.
 */
export const createImagingStudy = async (patientId, formDataOrObj) => {
  let formData;

  if (formDataOrObj instanceof FormData) {
    formData = formDataOrObj;
  } else {
    formData = new FormData();
    const { body = {}, files = [] } = formDataOrObj || {};

    // Append text fields
    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        // sharedWith: send as repeated fields — backend's zod preprocessor
        // accepts both arrays and comma-joined strings.
        value.forEach((v) => formData.append(key, String(v)));
      } else if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else {
        formData.append(key, String(value));
      }
    });

    // Append files — multer expects "images" field name (see backend
    // imaging.routes.js: upload.array("images", 20))
    files.forEach((f) => formData.append("images", f));
  }

  const res = await axios.post(
    `/api/v1/clinic/medical/patients/${patientId}/imaging`,
    formData,
    {
      // Don't set Content-Type manually — let axios set the multipart
      // boundary automatically. Setting it explicitly breaks the upload.
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data;
};

/**
 * GET /api/v1/clinic/medical/patients/:patientId/imaging
 * Options: { studyType?, limit?, before? }
 */
export const listImagingStudies = async (patientId, options = {}) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/patients/${patientId}/imaging`,
    { params: options },
  );
  return normalizeList(res.data, ["imaging"]);
};

export const getImagingStudy = async (recordId) => {
  const res = await axios.get(`/api/v1/clinic/medical/imaging/${recordId}`);
  return res.data;
};

/**
 * PATCH /api/v1/clinic/medical/imaging/:recordId
 *
 * Update text fields only — images are immutable post-create (delete the
 * study and re-create to replace files). Editable fields:
 *   { report?, diagnosis?, doctorNotes?, contrastUsed?,
 *     validatedByDoctor?, sharedWith? }
 */
export const updateImagingStudy = async (recordId, payload) => {
  const res = await axios.patch(
    `/api/v1/clinic/medical/imaging/${recordId}`,
    payload,
  );
  return res.data;
};

/**
 * DELETE /api/v1/clinic/medical/imaging/:recordId
 *
 * Returns { deleted: true, orphanedImages: [...urls] }. The image files in
 * R2 are NOT removed server-side (intentional — orphan cleanup is a
 * separate task). orphanedImages is informational for now.
 */
export const deleteImagingStudy = async (recordId) => {
  const res = await axios.delete(`/api/v1/clinic/medical/imaging/${recordId}`);
  return res.data;
};
