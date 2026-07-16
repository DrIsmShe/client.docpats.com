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

// ─── Employee password ────────────────────────────────────────
//
// Восстановление идёт в две половины ОДНОГО письма: ссылка (с подписанным
// токеном) и 6-значный код. Нужны обе — см. employeePassword.service.js.

/**
 * POST /api/v1/clinic/employees/forgot-password
 * Public — просит выслать письмо со ссылкой и кодом.
 * ВСЕГДА отвечает 200, даже если такого сотрудника нет: сервер намеренно не
 * раскрывает, существует ли учётная запись. Ошибку показывать не нужно.
 */
export const employeeForgotPassword = async ({ email, language }) => {
  const res = await axios.post("/api/v1/clinic/employees/forgot-password", {
    email,
    // Язык письма = язык, выбранный на странице сейчас.
    ...(language && { language }),
  });
  return res.data;
};

/**
 * GET /api/v1/clinic/employees/reset-password?token=...
 * Public — проверить ссылку до показа формы.
 * → { valid: true, maskedEmail, expiresAt, attemptsLeft }
 * Просроченная/поддельная ссылка приходит как 409.
 */
export const getEmployeeResetContext = async (token) => {
  const res = await axios.get("/api/v1/clinic/employees/reset-password", {
    params: { token },
  });
  return res.data;
};

/**
 * POST /api/v1/clinic/employees/reset-password
 * Public — ссылка + код + новый пароль.
 * 400 → неверный код (в details.attemptsLeft осталось попыток)
 * 409 → ссылка мертва (истекла, использована или сожжена попытками)
 */
export const employeeResetPassword = async ({ token, otp, password }) => {
  const res = await axios.post("/api/v1/clinic/employees/reset-password", {
    token,
    otp,
    password,
  });
  return res.data;
};

/**
 * POST /api/v1/clinic/employees/change-password
 * Сотрудник в кабинете меняет свой пароль, зная текущий.
 */
export const employeeChangePassword = async ({
  currentPassword,
  newPassword,
}) => {
  const res = await axios.post("/api/v1/clinic/employees/change-password", {
    currentPassword,
    newPassword,
  });
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
// ═══════════════════════════════════════════════════════════════════════════
//  CONSENT REQUESTS (Sprint 3.2 — Pull Consent, clinic-side)
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Reuses the same `axios` import and `normalizeList` helper from the top.
//
// Backend module: server/modules/clinic/clinic-patients/
// Endpoints:
//   POST   /api/v1/clinic/patients/:cardId/consent-requests   create
//   GET    /api/v1/clinic/patients/:cardId/consent-requests   list history
//   DELETE /api/v1/clinic/consent-requests/:id                cancel pending
//
// ─────────────────────────────────────────────────────────────────────────
//  FLOW
// ─────────────────────────────────────────────────────────────────────────
//
// 1. Employee opens ClinicPatient card (must have linkedUserId — bridge from
//    Sprint 1 Day 12).
// 2. Clicks "Request access" → GranularRequestModal opens with 7 scope toggles.
// 3. Submit → createConsentRequest(cardId, {requestedScopes, message?}).
// 4. Patient receives in-app notification + email (HIPAA-safe, no PHI).
// 5. Patient approves/rejects in their cabinet.
// 6. Clinic sees status via listConsentRequestsForPatient(cardId).
// 7. While pending, clinic can cancelConsentRequest(requestId).
//
// ─────────────────────────────────────────────────────────────────────────
//  RATE LIMIT
// ─────────────────────────────────────────────────────────────────────────
//
// Backend enforces max 3 active pending requests per (clinic, patient).
// 4th call returns 429 RATE_LIMIT_EXCEEDED. UI should disable the button
// when 3 pending exist and explain why.

/**
 * POST /api/v1/clinic/patients/:cardId/consent-requests
 *
 * Create a new consent request from clinic to patient.
 *
 * @param {string} cardId — ClinicPatient _id (must be linked to a User account)
 * @param {object} payload
 * @param {object} payload.requestedScopes — {encounters, allergies, chronicDiseases,
 *                                            operations, familyHistory, immunization, imaging}
 * @param {string} [payload.message] — optional msg shown to patient (max 500 chars)
 *
 * Returns { request: ConsentRequest } on 201.
 *
 * Errors:
 *   400 — invalid cardId / missing requestedScopes
 *   404 — patient card not found in this clinic
 *   422 — card not linked to DocPats user / no scopes / validation
 *   429 RATE_LIMIT_EXCEEDED — already 3 pending for this patient
 */
export const createConsentRequest = async (cardId, payload) => {
  const res = await axios.post(
    `/api/v1/clinic/patients/${cardId}/consent-requests`,
    payload,
  );
  return res.data;
};

/**
 * GET /api/v1/clinic/patients/:cardId/consent-requests
 *
 * List all consent requests this clinic has made to this patient (history).
 * Includes pending + all terminal statuses.
 *
 * Returns { items, count } (normalized).
 */
export const listConsentRequestsForPatient = async (cardId) => {
  const res = await axios.get(
    `/api/v1/clinic/patients/${cardId}/consent-requests`,
  );
  return normalizeList(res.data, ["requests", "consentRequests"]);
};

/**
 * DELETE /api/v1/clinic/consent-requests/:id
 *
 * Cancel a pending request (before the patient responds).
 *
 * @param {string} requestId
 *
 * Returns { request, action: "cancelled" }.
 *
 * Errors:
 *   404 NOT_FOUND   — request doesn't exist
 *   403            — request belongs to a different clinic
 *   409 NOT_PENDING — already in terminal state, cannot cancel
 */
export const cancelConsentRequest = async (requestId) => {
  const res = await axios.delete(
    `/api/v1/clinic/consent-requests/${requestId}`,
  );
  return res.data;
};

// ═══════════════════════════════════════════════════════════════════════════
//  PRESCRIPTIONS (UMR) — Stage 2 #4
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Reuses the same `axios` import and `normalizeList` helper from the top.
//
// Backend module: server/modules/clinic/clinic-medical/
// Path prefix:    /api/v1/clinic/medical
//
// 7 endpoints:
//   POST   /medical/patients/:patientId/prescriptions    create
//   GET    /medical/patients/:patientId/prescriptions    list
//   GET    /medical/prescriptions/:id                    get one
//   PATCH  /medical/prescriptions/:id/cancel             active → cancelled
//   PATCH  /medical/prescriptions/:id/complete           active → completed
//   DELETE /medical/prescriptions/:id                    owner only
//   GET    /medical/prescriptions/:id/pdf                Level-2 PDF blank
//
// Same access chain as encounters (ownership / sharedWith / global consent
// on the "encounters" scope). Cross-clinic records carry isCrossClinic.
//
// FSM: active → cancelled | completed. No draft.
//
// Prescription shape:
//   {
//     _id, status, patientRef, encounterId,
//     diagnosis: { code, codeTitle, text },
//     generalNotes,
//     items: [{ _id, drugName, dosage, form, frequency, duration,
//               instructions, quantity, prn, note }],
//     issuedAt, closedAt, closedReason, createdAt, ...
//   }

/**
 * POST /api/v1/clinic/medical/patients/:patientId/prescriptions
 *
 * Issue a prescription. Body:
 *   {
 *     items: [{ drugName (required), dosage?, form?, frequency?,
 *               duration?, instructions?, quantity?, prn?, note? }],
 *     diagnosis?: { code?, codeTitle?, text? },
 *     generalNotes?: string,
 *     encounterId?: string,
 *     sharedWith?: [clinicId],
 *   }
 * `form` enum: tablet|capsule|syrup|spray|drops|ointment|injection|
 *              inhaler|suppository|solution|powder|other
 * Returns { prescription: {...} } on 201.
 */
export const createPrescription = async (patientId, payload) => {
  const res = await axios.post(
    `/api/v1/clinic/medical/patients/${patientId}/prescriptions`,
    payload,
  );
  return res.data;
};

/**
 * GET /api/v1/clinic/medical/patients/:patientId/prescriptions
 * Options: { status?, limit?, before? }
 * Returns { items, nextCursor, count } (normalized).
 */
export const listPrescriptions = async (patientId, options = {}) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/patients/${patientId}/prescriptions`,
    { params: options },
  );
  return normalizeList(res.data, ["prescriptions"]);
};

/**
 * GET /api/v1/clinic/medical/prescriptions/:id
 * Returns { prescription: {...} }. Carries isCrossClinic if not owner.
 */
export const getPrescription = async (prescriptionId) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/prescriptions/${prescriptionId}`,
  );
  return res.data;
};

/**
 * PATCH /api/v1/clinic/medical/prescriptions/:id/cancel
 * active → cancelled. Body: { reason?: string }
 */
export const cancelPrescription = async (prescriptionId, payload = {}) => {
  const res = await axios.patch(
    `/api/v1/clinic/medical/prescriptions/${prescriptionId}/cancel`,
    payload,
  );
  return res.data;
};

/**
 * PATCH /api/v1/clinic/medical/prescriptions/:id/complete
 * active → completed.
 */
export const completePrescription = async (prescriptionId) => {
  const res = await axios.patch(
    `/api/v1/clinic/medical/prescriptions/${prescriptionId}/complete`,
  );
  return res.data;
};

/**
 * DELETE /api/v1/clinic/medical/prescriptions/:id
 * Hard delete. Owner role only.
 */
export const deletePrescription = async (prescriptionId) => {
  const res = await axios.delete(
    `/api/v1/clinic/medical/prescriptions/${prescriptionId}`,
  );
  return res.data;
};

/**
 * GET /api/v1/clinic/medical/prescriptions/:id/pdf
 *
 * Returns the Level-2 prescription blank as a PDF blob. Opens in a new tab
 * or triggers download depending on caller. `lang` selects PDF language
 * (ru|en|az|tr|ar); defaults to clinic.defaultLanguage server-side.
 *
 * Usage:
 *   const blob = await getPrescriptionPdf(id, "ru");
 *   const url = URL.createObjectURL(blob);
 *   window.open(url, "_blank");
 */
export const getPrescriptionPdf = async (prescriptionId, lang) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/prescriptions/${prescriptionId}/pdf`,
    {
      params: lang ? { lang } : {},
      responseType: "blob",
    },
  );
  return res.data; // Blob
};
// ═══════════════════════════════════════════════════════════════════════════
//  GRANTED CONSENTS (Sprint 3 closure — Pull Consent, part B, clinic-side)
// ═══════════════════════════════════════════════════════════════════════════
//
// GET    /api/v1/clinic/patients/:cardId/consents   список выданных доступов
// DELETE /api/v1/clinic/consents/:id                отзыв своего consent

/**
 * GET /api/v1/clinic/patients/:cardId/consents
 * Все consent'ы, выданные пациентом этой клинике (активные + история).
 * Returns { items, count } (normalized).
 */
export const listClinicConsentsForPatient = async (cardId) => {
  const res = await axios.get(`/api/v1/clinic/patients/${cardId}/consents`);
  return normalizeList(res.data, ["consents", "items"]);
};

/**
 * DELETE /api/v1/clinic/consents/:id
 * Клиника прекращает выданный ей доступ. Только свой consent.
 * @param {string} consentId
 * @param {string} [reason] необязательная причина (<=500)
 * Returns { consent, action: "revoked" }.
 *
 * Errors: 404 NOT_FOUND, 403 (чужой consent).
 */
export const revokeClinicConsent = async (consentId, reason) => {
  const res = await axios.delete(`/api/v1/clinic/consents/${consentId}`, {
    data: reason ? { reason } : {},
  });
  return res.data;
};
// ═══════════════════════════════════════════════════════════════════════════
//  LAB RESULTS (UMR) — Stage 2 #A, Variant X
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Uses the same `import axios from "../axios"` and `normalizeList` already at
// the top of that file. Same access chain as prescriptions (ownership /
// sharedWith / global consent on the "encounters" scope). Cross-clinic
// records carry isCrossClinic.
//
// Backend path prefix: /api/v1/clinic/medical
//   POST   /medical/patients/:patientId/lab-results          create (multipart)
//   GET    /medical/patients/:patientId/lab-results          list
//   GET    /medical/patients/:patientId/lab-results/trend    trend
//   GET    /medical/lab-results/:id                          get one
//   PATCH  /medical/lab-results/:id/status                   FSM
//   POST   /medical/lab-results/:id/comments                 add comment
//   DELETE /medical/lab-results/:id                          owner only
//   GET    /medical/lab-results/:id/pdf                      PDF blob

/**
 * GET /api/v1/clinic/medical/patients/:patientId/lab-results
 * Options: { status?, panelType?, limit?, before? }
 * Returns { items, nextCursor, count } (normalized).
 */
export const listLabResults = async (patientId, options = {}) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/patients/${patientId}/lab-results`,
    { params: options },
  );
  return normalizeList(res.data, ["labResults", "items"]);
};

/**
 * POST /api/v1/clinic/medical/patients/:patientId/lab-results
 *
 * Create a lab result. The route ALWAYS uses multipart (upload.array("file",1)),
 * so we always send FormData. `parameters` and `diagnosis` are JSON-stringified
 * (server parses them via z.preprocess). `file` is optional (original PDF/photo).
 *
 * @param {string} patientId
 * @param {object} payload { panelType, panelTitle?, status?, effectiveDateTime?,
 *                           labName?, report?, encounterId?, parameters:[], diagnosis?, sharedWith?[] }
 * @param {File}   [file] optional original file
 * Returns { success, labResult: {...} } on 201.
 */
export const createLabResult = async (patientId, payload, file = null) => {
  const fd = new FormData();
  if (file) fd.append("file", file);
  fd.append("panelType", payload.panelType || "Other");
  if (payload.panelTitle) fd.append("panelTitle", payload.panelTitle);
  if (payload.status) fd.append("status", payload.status);
  if (payload.effectiveDateTime)
    fd.append("effectiveDateTime", payload.effectiveDateTime);
  if (payload.labName) fd.append("labName", payload.labName);
  if (payload.report) fd.append("report", payload.report);
  if (payload.encounterId) fd.append("encounterId", payload.encounterId);
  fd.append("parameters", JSON.stringify(payload.parameters || []));
  if (payload.diagnosis)
    fd.append("diagnosis", JSON.stringify(payload.diagnosis));
  if (Array.isArray(payload.sharedWith))
    payload.sharedWith.forEach((id) => fd.append("sharedWith", String(id)));

  const res = await axios.post(
    `/api/v1/clinic/medical/patients/${patientId}/lab-results`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
};

/**
 * GET /api/v1/clinic/medical/lab-results/:id
 * Returns { success, labResult: {...} }. Carries isCrossClinic if not owner.
 */
export const getLabResult = async (labResultId) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/lab-results/${labResultId}`,
  );
  return res.data;
};

/**
 * PATCH /api/v1/clinic/medical/lab-results/:id/status
 * FSM: final → corrected | amended (also corrected → amended).
 * @param {string} labResultId
 * @param {"corrected"|"amended"|"final"} status
 */
export const updateLabStatus = async (labResultId, status) => {
  const res = await axios.patch(
    `/api/v1/clinic/medical/lab-results/${labResultId}/status`,
    { status },
  );
  return res.data;
};

/**
 * POST /api/v1/clinic/medical/lab-results/:id/comments
 * @param {string} labResultId
 * @param {string} text
 */
export const addLabComment = async (labResultId, text) => {
  const res = await axios.post(
    `/api/v1/clinic/medical/lab-results/${labResultId}/comments`,
    { text },
  );
  return res.data;
};

/**
 * DELETE /api/v1/clinic/medical/lab-results/:id
 * Hard delete. Owner role only. Attached original file is queued for R2 cleanup.
 */
export const deleteLabResult = async (labResultId) => {
  const res = await axios.delete(
    `/api/v1/clinic/medical/lab-results/${labResultId}`,
  );
  return res.data;
};

/**
 * GET /api/v1/clinic/medical/lab-results/:id/pdf
 * Returns the lab report as a PDF blob.
 *
 * Usage:
 *   const blob = await getLabResultPdf(id, "ru");
 *   const url = URL.createObjectURL(blob);
 *   window.open(url, "_blank");
 */
export const getLabResultPdf = async (labResultId, lang) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/lab-results/${labResultId}/pdf`,
    {
      params: lang ? { lang } : {},
      responseType: "blob",
    },
  );
  return res.data; // Blob
};

/**
 * GET /api/v1/clinic/medical/patients/:patientId/lab-results/trend
 * Динамика одного показателя во времени (по имени или LOINC).
 * @param {string} patientId
 * @param {object} params { name?, loincCode? } — нужен хотя бы один
 * Returns { success, name, loincCode, unit, points:[{date,value,unit,flag,referenceRange}], count }.
 */
export const getLabTrend = async (patientId, { name, loincCode } = {}) => {
  const res = await axios.get(
    `/api/v1/clinic/medical/patients/${patientId}/lab-results/trend`,
    {
      params: {
        ...(name && { name }),
        ...(loincCode && { loincCode }),
      },
    },
  );
  return res.data;
};
// ═══════════════════════════════════════════════════════════════════════════
//  DEPARTMENTS (clinic org structure) — clinic-departments module
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Reuses the same `axios` import and `normalizeList` helper from the top.
//
// Backend module: server/modules/clinic/clinic-departments/
// Path prefix:    /api/v1/clinic/departments
//
//   GET    /departments?status=&branchId=&specialty=&parentDepartmentId=&q=  list
//   POST   /departments                                                       create
//   GET    /departments/:id                                                   get one
//   PATCH  /departments/:id                                                   update
//   PATCH  /departments/:id/head                                              set/unset head
//   DELETE /departments/:id                                                   soft archive

/**
 * GET /api/v1/clinic/departments
 * @param {object} [filters] { status?, branchId?, specialty?, parentDepartmentId?, q? }
 *   No `status` → returns active + archived. Pass status:"active" for dropdowns.
 * Returns { items } (normalized from { departments: [...] }).
 */
export const listDepartments = async (filters = {}) => {
  const res = await axios.get("/api/v1/clinic/departments", {
    params: filters,
  });
  return normalizeList(res.data, ["departments"]);
};

/**
 * POST /api/v1/clinic/departments
 * @param {object} payload
 *   { name (required), code?, specialty?, description?,
 *     branchId?, headMembershipId?, parentDepartmentId? }
 * Returns { department }.
 * 409 if `code` already exists in this clinic.
 */
export const createDepartment = async (payload) => {
  const res = await axios.post("/api/v1/clinic/departments", payload);
  return res.data;
};

/**
 * GET /api/v1/clinic/departments/:id
 * Returns { department }.
 */
export const getDepartment = async (departmentId) => {
  const res = await axios.get(`/api/v1/clinic/departments/${departmentId}`);
  return res.data;
};

/**
 * PATCH /api/v1/clinic/departments/:id
 * @param {string} departmentId
 * @param {object} updates subset of writable fields; `status` toggles
 *                 active/archived (restore = { status: "active" }).
 * Returns { department }.
 */
export const updateDepartment = async (departmentId, updates) => {
  const res = await axios.patch(
    `/api/v1/clinic/departments/${departmentId}`,
    updates,
  );
  return res.data;
};

/**
 * PATCH /api/v1/clinic/departments/:id/head
 * @param {string} departmentId
 * @param {string|null} headMembershipId  null clears the head (заведующий)
 * Returns { department }.
 */
export const setDepartmentHead = async (departmentId, headMembershipId) => {
  const res = await axios.patch(
    `/api/v1/clinic/departments/${departmentId}/head`,
    { headMembershipId: headMembershipId ?? null },
  );
  return res.data;
};

/**
 * DELETE /api/v1/clinic/departments/:id
 * Soft archive (status → archived). The system "General" department cannot
 * be archived (backend returns 4xx). Returns { department }.
 */
export const archiveDepartment = async (departmentId) => {
  const res = await axios.delete(`/api/v1/clinic/departments/${departmentId}`);
  return res.data;
};
// ═══════════════════════════════════════════════════════════════════════════
//  ROOMS (clinic org structure) — clinic-rooms module
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Reuses the same `axios` import and `normalizeList` helper from the top.
//
// Backend module: server/modules/clinic/clinic-rooms/
// Path prefix:    /api/v1/clinic/rooms
//
//   GET    /rooms?departmentId=&status=   list
//   POST   /rooms                          create
//   GET    /rooms/:id                      get one
//   PATCH  /rooms/:id                       update
//   DELETE /rooms/:id                       soft archive
//
// A room ALWAYS belongs to a department (departmentId required on create).
// assignedMembershipIds is an array of ClinicMembership ids of staff who
// work in the room. Code is optional but unique per clinic when present.

/**
 * GET /api/v1/clinic/rooms
 * @param {object} [filters] { departmentId?, status? }
 *   No `status` → returns active + archived. Pass status:"active" for dropdowns.
 * Returns { items } (normalized from { rooms: [...] }).
 */
export const listRooms = async (filters = {}) => {
  const res = await axios.get("/api/v1/clinic/rooms", { params: filters });
  return normalizeList(res.data, ["rooms"]);
};

/**
 * POST /api/v1/clinic/rooms
 * @param {object} payload
 *   { departmentId (required), name (required), code?, floor?, capacity?,
 *     notes?, assignedMembershipIds?: [id] }
 * Returns { room }.
 * 409 if `code` already exists in this clinic.
 */
export const createRoom = async (payload) => {
  const res = await axios.post("/api/v1/clinic/rooms", payload);
  return res.data;
};

/**
 * GET /api/v1/clinic/rooms/:id
 * Returns { room }.
 */
export const getRoom = async (roomId) => {
  const res = await axios.get(`/api/v1/clinic/rooms/${roomId}`);
  return res.data;
};

/**
 * PATCH /api/v1/clinic/rooms/:id
 * @param {string} roomId
 * @param {object} updates subset of writable fields; `status` toggles
 *                 active/archived (restore = { status: "active" }).
 * Returns { room }.
 */
export const updateRoom = async (roomId, updates) => {
  const res = await axios.patch(`/api/v1/clinic/rooms/${roomId}`, updates);
  return res.data;
};

/**
 * DELETE /api/v1/clinic/rooms/:id
 * Soft archive (status → archived). Returns { room }.
 */
export const archiveRoom = async (roomId) => {
  const res = await axios.delete(`/api/v1/clinic/rooms/${roomId}`);
  return res.data;
};
// ═══════════════════════════════════════════════════════════════════════════
//  EQUIPMENT (clinic org structure) — clinic-equipment module
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Reuses the same `axios` import and `normalizeList` helper from the top.
//
// Backend module: server/modules/clinic/clinic-equipment/
// Path prefix:    /api/v1/clinic/equipment
//
//   GET    /equipment?departmentId=&roomId=&category=&status=&q=  list
//   POST   /equipment                                             create
//   GET    /equipment/:id                                         get one
//   PATCH  /equipment/:id                                          update
//   DELETE /equipment/:id                                          soft archive
//
// Equipment ALWAYS belongs to a department (departmentId required on create).
// roomId is optional; when set, the room must be in the same department.
// inventoryNumber is optional but unique per clinic when present.
// status: operational | maintenance | broken | decommissioned | archived

/**
 * GET /api/v1/clinic/equipment
 * @param {object} [filters] { departmentId?, roomId?, category?, status?, q? }
 *   No `status` → returns every status incl. archived. Pass a status to narrow.
 * Returns { items } (normalized from { items: [...] }).
 */
export const listEquipment = async (filters = {}) => {
  const res = await axios.get("/api/v1/clinic/equipment", { params: filters });
  return normalizeList(res.data, ["equipment", "items"]);
};

/**
 * POST /api/v1/clinic/equipment
 * @param {object} payload
 *   { departmentId (required), name (required), roomId?, inventoryNumber?,
 *     category?, manufacturer?, model?, serialNumber?, status?,
 *     purchaseDate?, warrantyUntil?, lastServiceDate?, nextServiceDate?,
 *     assignedMembershipIds?: [id], notes? }
 * Returns { equipment }.
 * 409 if `inventoryNumber` already exists in this clinic.
 */
export const createEquipment = async (payload) => {
  const res = await axios.post("/api/v1/clinic/equipment", payload);
  return res.data;
};

/**
 * GET /api/v1/clinic/equipment/:id
 * Returns { equipment }.
 */
export const getEquipment = async (equipmentId) => {
  const res = await axios.get(`/api/v1/clinic/equipment/${equipmentId}`);
  return res.data;
};

/**
 * PATCH /api/v1/clinic/equipment/:id
 * @param {string} equipmentId
 * @param {object} updates subset of writable fields; `status` toggles the
 *                 lifecycle (restore from archive = { status: "operational" }).
 * Returns { equipment }.
 */
export const updateEquipment = async (equipmentId, updates) => {
  const res = await axios.patch(
    `/api/v1/clinic/equipment/${equipmentId}`,
    updates,
  );
  return res.data;
};

/**
 * DELETE /api/v1/clinic/equipment/:id
 * Soft archive (status → archived). Returns { equipment }.
 */
export const archiveEquipment = async (equipmentId) => {
  const res = await axios.delete(`/api/v1/clinic/equipment/${equipmentId}`);
  return res.data;
};
// ═══════════════════════════════════════════════════════════════════════════
//  KNOWLEDGE BASE (internal clinic docs) — clinic-knowledge module
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Reuses the same `axios` import and `normalizeList` helper from the top.
//
// Backend module: server/modules/clinic/clinic-knowledge/
// Path prefix:    /api/v1/clinic/knowledge
//
//   GET    /knowledge?category=&status=&departmentId=&visibility=&tag=&q=  list
//   POST   /knowledge                                                       create
//   GET    /knowledge/:id                                                   get one
//   PATCH  /knowledge/:id                                                    update
//   DELETE /knowledge/:id                                                    soft archive
//
// Articles are internal staff docs (protocols, SOPs, FAQs) — NOT patient
// data. status: draft | published | archived. visibility: all | clinical | admin.

/**
 * GET /api/v1/clinic/knowledge
 * @param {object} [filters] { category?, status?, departmentId?, visibility?, tag?, q? }
 * Returns { items } (normalized).
 */
export const listKnowledge = async (filters = {}) => {
  const res = await axios.get("/api/v1/clinic/knowledge", { params: filters });
  return normalizeList(res.data, ["articles", "items"]);
};

/**
 * POST /api/v1/clinic/knowledge
 * @param {object} payload
 *   { title (required), body?, summary?, category?, departmentId?,
 *     tags?: [string], visibility?, status?: "draft"|"published", pinned? }
 * Returns { article }.
 */
export const createKnowledge = async (payload) => {
  const res = await axios.post("/api/v1/clinic/knowledge", payload);
  return res.data;
};

/**
 * GET /api/v1/clinic/knowledge/:id
 * Returns { article }.
 */
export const getKnowledge = async (articleId) => {
  const res = await axios.get(`/api/v1/clinic/knowledge/${articleId}`);
  return res.data;
};

/**
 * PATCH /api/v1/clinic/knowledge/:id
 * @param {string} articleId
 * @param {object} updates subset of writable fields; `status` toggles the
 *                 draft/published/archived lifecycle.
 * Returns { article }.
 */
export const updateKnowledge = async (articleId, updates) => {
  const res = await axios.patch(
    `/api/v1/clinic/knowledge/${articleId}`,
    updates,
  );
  return res.data;
};

/**
 * DELETE /api/v1/clinic/knowledge/:id
 * Soft archive (status → archived). Returns { article }.
 */
export const archiveKnowledge = async (articleId) => {
  const res = await axios.delete(`/api/v1/clinic/knowledge/${articleId}`);
  return res.data;
};
// ═══════════════════════════════════════════════════════════════════════════
//  CONSILIUM (multi-doctor case discussions) — clinic-consilium module
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Reuses the same `axios` import and `normalizeList` helper from the top.
//
// Backend module: server/modules/clinic/clinic-consilium/
// Path prefix:    /api/v1/clinic/consilia
//
//   GET    /consilia?status=&patientId=&departmentId=&participantMembershipId=&q=  list
//   POST   /consilia                                                                create
//   GET    /consilia/:id                                                            get one
//   PATCH  /consilia/:id                                                             update / resolve
//   DELETE /consilia/:id                                                             soft archive
//   GET    /consilia/:id/messages                                                   thread (decrypted)
//   POST   /consilia/:id/messages                                                    post a message
//
// Message bodies are encrypted at rest server-side; the API returns/accepts
// plaintext `text`. status: open | resolved | archived.

/**
 * GET /api/v1/clinic/consilia
 * @param {object} [filters] { status?, patientId?, departmentId?, participantMembershipId?, q? }
 * Returns { items } (normalized).
 */
export const listConsilia = async (filters = {}) => {
  const res = await axios.get("/api/v1/clinic/consilia", { params: filters });
  return normalizeList(res.data, ["consilia", "items"]);
};

/**
 * POST /api/v1/clinic/consilia
 * @param {object} payload
 *   { title (required), description?, patientId?, departmentId?,
 *     participantMembershipIds?: [id] }
 * Returns { consilium }.
 */
export const createConsilium = async (payload) => {
  const res = await axios.post("/api/v1/clinic/consilia", payload);
  return res.data;
};

/**
 * GET /api/v1/clinic/consilia/:id
 * Returns { consilium }.
 */
export const getConsilium = async (consiliumId) => {
  const res = await axios.get(`/api/v1/clinic/consilia/${consiliumId}`);
  return res.data;
};

/**
 * PATCH /api/v1/clinic/consilia/:id
 * @param {string} consiliumId
 * @param {object} updates subset of writable fields; set
 *                 { status: "resolved", conclusion } to close it.
 * Returns { consilium }.
 */
export const updateConsilium = async (consiliumId, updates) => {
  const res = await axios.patch(
    `/api/v1/clinic/consilia/${consiliumId}`,
    updates,
  );
  return res.data;
};

/**
 * DELETE /api/v1/clinic/consilia/:id
 * Soft archive (status → archived). Returns { consilium }.
 */
export const archiveConsilium = async (consiliumId) => {
  const res = await axios.delete(`/api/v1/clinic/consilia/${consiliumId}`);
  return res.data;
};

/**
 * GET /api/v1/clinic/consilia/:id/messages
 * Returns { items } — messages in chronological order, bodies decrypted.
 */
export const listConsiliumMessages = async (consiliumId) => {
  const res = await axios.get(
    `/api/v1/clinic/consilia/${consiliumId}/messages`,
  );
  return normalizeList(res.data, ["messages", "items"]);
};

/**
 * POST /api/v1/clinic/consilia/:id/messages
 * @param {string} consiliumId
 * @param {string} text plaintext (encrypted server-side)
 * Returns { message } with decrypted `text`.
 */
export const postConsiliumMessage = async (consiliumId, text) => {
  const res = await axios.post(
    `/api/v1/clinic/consilia/${consiliumId}/messages`,
    { text },
  );
  return res.data;
};
// ═══════════════════════════════════════════════════════════════════════════
//  TELEMEDICINE (scheduled virtual visits) — clinic-telemed module
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Reuses the same `axios` import and `normalizeList` helper from the top.
//
// Backend module: server/modules/clinic/clinic-telemed/
// Path prefix:    /api/v1/clinic/telemed
//
//   GET    /telemed?status=&patientId=&hostMembershipId=&departmentId=&from=&to=&q=  list
//   POST   /telemed                                                                  create
//   GET    /telemed/:id                                                              get one
//   PATCH  /telemed/:id                                                               update / reschedule / transition
//   DELETE /telemed/:id                                                               cancel
//
// A session carries an opaque `joinKey` consumed by the existing call layer.
// status: scheduled | live | completed | cancelled | no_show.

/**
 * GET /api/v1/clinic/telemed
 * @param {object} [filters] { status?, patientId?, hostMembershipId?, departmentId?, from?, to?, q? }
 *   from/to are ISO date strings filtering on scheduledAt.
 * Returns { items } (normalized).
 */
export const listTelemed = async (filters = {}) => {
  const res = await axios.get("/api/v1/clinic/telemed", { params: filters });
  return normalizeList(res.data, ["sessions", "items"]);
};

/**
 * POST /api/v1/clinic/telemed
 * @param {object} payload
 *   { title (required), scheduledAt (required, ISO), patientId?,
 *     hostMembershipId?, departmentId?, durationMinutes?, notes? }
 * Returns { session }.
 */
export const createTelemed = async (payload) => {
  const res = await axios.post("/api/v1/clinic/telemed", payload);
  return res.data;
};

/**
 * GET /api/v1/clinic/telemed/:id
 * Returns { session }.
 */
export const getTelemed = async (sessionId) => {
  const res = await axios.get(`/api/v1/clinic/telemed/${sessionId}`);
  return res.data;
};

/**
 * PATCH /api/v1/clinic/telemed/:id
 * @param {string} sessionId
 * @param {object} updates subset of writable fields; `status` drives the
 *                 lifecycle (e.g. { status: "live" } to start,
 *                 { status: "completed" } / { status: "no_show" } to finish).
 * Returns { session }.
 */
export const updateTelemed = async (sessionId, updates) => {
  const res = await axios.patch(`/api/v1/clinic/telemed/${sessionId}`, updates);
  return res.data;
};

/**
 * DELETE /api/v1/clinic/telemed/:id
 * Cancel (status → cancelled, stamps endedAt). Returns { session }.
 */
export const cancelTelemed = async (sessionId) => {
  const res = await axios.delete(`/api/v1/clinic/telemed/${sessionId}`);
  return res.data;
};
// ═══════════════════════════════════════════════════════════════════════════
//  ANNOUNCEMENTS (corporate-portal bulletin board) — clinic-announcements module
// ═══════════════════════════════════════════════════════════════════════════
// APPEND to client/src/api/clinic.js. Reuses the same `import axios from "../axios"`
// at the top of the file (axios instance has baseURL + withCredentials).
//
// Backend module: server/modules/clinic/clinic-announcements/
// Path prefix:    /api/v1/clinic/announcements
//   GET    /announcements?status=&departmentId=&includeArchived=   list (feed)
//   POST   /announcements                                          create
//   GET    /announcements/:id                                      get one (+auto read)
//   POST   /announcements/:id/read                                 mark read
//   GET    /announcements/:id/receipts                             who read (author view)
//   PATCH  /announcements/:id/pin       { pinned }                 pin / unpin
//   PATCH  /announcements/:id/archive                              archive
//   DELETE /announcements/:id                                      hard delete

/**
 * GET /api/v1/clinic/announcements
 * @param {object} filters { status?, departmentId?, includeArchived? }
 * Returns { items, count }.
 */
export const listAnnouncements = async (filters = {}) => {
  const res = await axios.get("/api/v1/clinic/announcements", {
    params: filters,
  });
  return res.data;
};

/**
 * POST /api/v1/clinic/announcements
 * @param {object} payload { title, body, audience?, departmentId?, pinned? }
 * Returns { announcement }.
 */
export const createAnnouncement = async (payload) => {
  const res = await axios.post("/api/v1/clinic/announcements", payload);
  return res.data;
};

/**
 * GET /api/v1/clinic/announcements/:id  (also marks read for the viewer)
 * Returns { announcement }.
 */
export const getAnnouncement = async (id) => {
  const res = await axios.get(`/api/v1/clinic/announcements/${id}`);
  return res.data;
};

/**
 * POST /api/v1/clinic/announcements/:id/read
 * Returns { announcement }.
 */
export const markAnnouncementRead = async (id) => {
  const res = await axios.post(`/api/v1/clinic/announcements/${id}/read`);
  return res.data;
};

/**
 * GET /api/v1/clinic/announcements/:id/receipts  (author/admin)
 * Returns { readCount, totalMembers, readers: [{membershipId, name, at}] }.
 */
export const getAnnouncementReceipts = async (id) => {
  const res = await axios.get(`/api/v1/clinic/announcements/${id}/receipts`);
  return res.data;
};

/**
 * PATCH /api/v1/clinic/announcements/:id/pin   { pinned }
 * Returns { announcement }.
 */
export const pinAnnouncement = async (id, pinned) => {
  const res = await axios.patch(`/api/v1/clinic/announcements/${id}/pin`, {
    pinned,
  });
  return res.data;
};

/**
 * PATCH /api/v1/clinic/announcements/:id/archive
 * Returns { announcement }.
 */
export const archiveAnnouncement = async (id) => {
  const res = await axios.patch(`/api/v1/clinic/announcements/${id}/archive`);
  return res.data;
};

/**
 * DELETE /api/v1/clinic/announcements/:id
 * Returns { announcementId, deleted: true }.
 */
export const deleteAnnouncement = async (id) => {
  const res = await axios.delete(`/api/v1/clinic/announcements/${id}`);
  return res.data;
};
export const unarchiveAnnouncement = async (id) => {
  const res = await axios.patch(`/api/v1/clinic/announcements/${id}/unarchive`);
  return res.data;
};
// ─── MEMBERSHIP REQUESTS (Variant 2: invite a doctor with confirmation) ───
// Owner sends an invite; the doctor accepts/rejects in their cabinet.
//
// Owner side  (/api/v1/clinic/membership-requests)
// Doctor side (/api/v1/clinic/my-membership-requests)

// Owner: send an invitation to an existing DocPats doctor.
// payload { userId, role, customTitle?, employmentType? } → { request }
export const createMembershipRequest = async (payload) => {
  const res = await axios.post("/api/v1/clinic/membership-requests", payload);
  return res.data;
};

// Owner: list pending invitations sent by this clinic. → { items, count }
export const listClinicMembershipRequests = async () => {
  const res = await axios.get("/api/v1/clinic/membership-requests");
  return res.data;
};

// Owner: withdraw a pending invitation. → { requestId, status }
export const cancelMembershipRequest = async (id) => {
  const res = await axios.delete(`/api/v1/clinic/membership-requests/${id}`);
  return res.data;
};

// Doctor: my pending invitations across clinics. → { items, count }
export const getMyMembershipRequests = async () => {
  const res = await axios.get("/api/v1/clinic/my-membership-requests");
  return res.data;
};

// Doctor: accept an invitation (creates the membership). → { requestId, status }
export const acceptMembershipRequest = async (id) => {
  const res = await axios.post(
    `/api/v1/clinic/my-membership-requests/${id}/accept`,
  );
  return res.data;
};

// Doctor: reject an invitation. → { requestId, status }
export const rejectMembershipRequest = async (id) => {
  const res = await axios.post(
    `/api/v1/clinic/my-membership-requests/${id}/reject`,
  );
  return res.data;
};
// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC CLINIC PAGE (Clinic-as-Brand, этап A) — clinic-public module
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Reuses the same `import axios from "../axios"` at the top of the file.
//
// ВАЖНО: getPublicClinicPage бьёт по НОВОМУ публичному пути
//   GET /api/v1/public/clinics/:slug   (модуль clinic-public, БЕЗ авторизации)
// — это НЕ то же самое, что легаси getClinicBySlug() выше
//   (GET /api/v1/clinic/public/:slug, урезанный, без врачей/галереи).
//
// Описание/логотип/галерею владелец редактирует через уже существующий
// updateClinic(clinicId, { description, logo, gallery }) — отдельный метод
// не нужен. Здесь только публичное чтение + тумблер публикации.

/**
 * GET /api/v1/public/clinics/:slug
 *
 * Публичная страница клиники для гостя (без авторизации).
 * Возвращает DTO НАПРЯМУЮ (не обёрнут в { clinic }):
 *   {
 *     name, slug, isVerified,
 *     logo, description, gallery: [{ id, url, caption }],
 *     address: { country, city, street },
 *     specializations: [string],
 *     contacts: { phone, email, website },
 *     doctors: [{ userId, name, profileImage, specialization,
 *                 isVerified, about, country, role, profileUrl }],
 *   }
 *
 * 404 → клиника не найдена или не опубликована (isPublished=false).
 *
 * @param {string} slug
 */
export const getPublicClinicPage = async (slug) => {
  const res = await axios.get(
    `/api/v1/public/clinics/${encodeURIComponent(slug)}`,
  );
  return res.data; // DTO напрямую
};

/**
 * PATCH /api/v1/clinic/clinics/:id/publish
 *
 * Тумблер видимости публичной страницы /clinic/:slug. Owner/admin (clinic.write).
 * @param {string} clinicId
 * @param {boolean} isPublished
 * Returns { clinic: {...} }.
 */
export const setClinicPublished = async (clinicId, isPublished) => {
  const res = await axios.patch(`/api/v1/clinic/clinics/${clinicId}/publish`, {
    isPublished,
  });
  return res.data;
};
// ═══════════════════════════════════════════════════════════════════════════
//  CLINIC MEDIA (Clinic-as-Brand, этап B) — логотип + галерея
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Reuses `import axios from "../axios"` at the top.
//
// Backend (clinic-core, под tenantMiddleware):
//   POST   /api/v1/clinic/clinics/:id/logo            multipart, field "logo"
//   DELETE /api/v1/clinic/clinics/:id/logo
//   POST   /api/v1/clinic/clinics/:id/gallery         multipart, field "images"
//   DELETE /api/v1/clinic/clinics/:id/gallery/:itemId
//
// uploadFile() на бэке сжимает изображения в webp и возвращает абсолютный
// CDN-URL — фронт получает готовые URL (logo / gallery[].url).

/**
 * POST /api/v1/clinic/clinics/:id/logo
 * Загрузить/заменить логотип клиники.
 * @param {string} clinicId
 * @param {File} file  изображение (field "logo")
 * Returns { logo: <url> }.
 */
export const uploadClinicLogo = async (clinicId, file) => {
  const fd = new FormData();
  fd.append("logo", file);
  const res = await axios.post(`/api/v1/clinic/clinics/${clinicId}/logo`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data; // { logo }
};

/**
 * DELETE /api/v1/clinic/clinics/:id/logo
 * Убрать логотип.
 * Returns { logo: null }.
 */
export const deleteClinicLogo = async (clinicId) => {
  const res = await axios.delete(`/api/v1/clinic/clinics/${clinicId}/logo`);
  return res.data;
};

/**
 * POST /api/v1/clinic/clinics/:id/gallery
 * Добавить фото в галерею (несколько за раз).
 * @param {string} clinicId
 * @param {File[]} files  массив изображений (field "images")
 * Returns { gallery: [{ id, url, caption, order }] }.
 */
export const uploadClinicGallery = async (clinicId, files) => {
  const fd = new FormData();
  (files || []).forEach((f) => fd.append("images", f));
  const res = await axios.post(
    `/api/v1/clinic/clinics/${clinicId}/gallery`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data; // { gallery }
};

/**
 * DELETE /api/v1/clinic/clinics/:id/gallery/:itemId
 * Удалить одно фото из галереи.
 * @param {string} clinicId
 * @param {string} itemId  _id элемента галереи
 * Returns { gallery: [...] }.
 */
export const deleteClinicGalleryItem = async (clinicId, itemId) => {
  const res = await axios.delete(
    `/api/v1/clinic/clinics/${clinicId}/gallery/${itemId}`,
  );
  return res.data;
};
export const listClinicReviews = async (clinicId, opts = {}) => {
  const params = {};
  if (opts.status) params.status = opts.status;
  if (opts.limit != null) params.limit = opts.limit;
  if (opts.skip != null) params.skip = opts.skip;
  const res = await axios.get(`/api/v1/clinic/clinics/${clinicId}/reviews`, {
    params,
  });
  return res.data;
};

export const moderateClinicReview = async (
  clinicId,
  reviewId,
  action,
  note,
) => {
  const res = await axios.patch(
    `/api/v1/clinic/clinics/${clinicId}/reviews/${reviewId}`,
    { action, note },
  );
  return res.data;
};
// ─── COVER (ВИТРИНА 2.0 V4: обложка hero) ───
// Reuses `import axios from "../axios"` at the top.

export const uploadClinicCover = async (clinicId, file) => {
  const fd = new FormData();
  fd.append("cover", file);
  const res = await axios.post(`/api/v1/clinic/clinics/${clinicId}/cover`, fd, {
    // Don't set Content-Type manually — let axios set the multipart boundary
  });
  return res.data;
};

export const deleteClinicCover = async (clinicId) => {
  const res = await axios.delete(`/api/v1/clinic/clinics/${clinicId}/cover`);
  return res.data;
};
// ВИТРИНА 2.0 — словари тем (публичные, без авторизации)
export const getThemePresets = async () => {
  const res = await axios.get("/api/v1/public/theme-presets");
  return res.data;
};
// ВИТРИНА 2.0 — фон всей страницы (отдельно от обложки hero)
export const uploadClinicPageBg = async (clinicId, file) => {
  const fd = new FormData();
  fd.append("pageBg", file);
  const res = await axios.post(
    `/api/v1/clinic/clinics/${clinicId}/page-bg`,
    fd,
  );
  return res.data; // { pageBackground }
};

export const deleteClinicPageBg = async (clinicId) => {
  const res = await axios.delete(`/api/v1/clinic/clinics/${clinicId}/page-bg`);
  return res.data; // { pageBackground: null }
};
// ВИТРИНА 2.0 (Путь 1) — универсальная загрузка картинки в R2 (баннеры
// страниц-разделов и пр.). Возвращает { url } — фронт кладёт в config блока.
export const uploadClinicAsset = async (clinicId, file) => {
  const fd = new FormData();
  fd.append("asset", file);
  const res = await axios.post(`/api/v1/clinic/clinics/${clinicId}/asset`, fd);
  return res.data; // { url }
};
// ВИТРИНА 2.0 (Часть 2) — контент кастомной страницы (публично, без авторизации).
export const getPublicCustomPage = async (slug, pageSlug) => {
  const res = await axios.get(
    `/api/v1/public/clinics/${encodeURIComponent(slug)}/pages/${encodeURIComponent(pageSlug)}`,
  );
  return res.data; // { slug, title, seo, layout:{blocks} }
};
// ВИТРИНА 2.0 (Часть 2) — CRUD кастомных страниц (админ, под сессией клиники).
export const listCustomPages = async (status) => {
  const res = await axios.get("/api/v1/clinic/pages", {
    params: status ? { status } : {},
  });
  return res.data; // { items: [...] }
};
export const getCustomPage = async (id) => {
  const res = await axios.get(`/api/v1/clinic/pages/${id}`);
  return res.data; // { page }
};
export const createCustomPage = async (payload) => {
  const res = await axios.post("/api/v1/clinic/pages", payload);
  return res.data; // { page }
};
export const updateCustomPage = async (id, updates) => {
  const res = await axios.patch(`/api/v1/clinic/pages/${id}`, updates);
  return res.data; // { page }
};
export const publishCustomPage = async (id, status) => {
  const res = await axios.patch(`/api/v1/clinic/pages/${id}/publish`, {
    status,
  });
  return res.data; // { page }
};
export const deleteCustomPage = async (id) => {
  const res = await axios.delete(`/api/v1/clinic/pages/${id}`);
  return res.data; // { id, deleted }
};
export const getPublicCategoryArticles = (slug, pageSlug) =>
  axios
    .get(`/api/v1/public/clinics/${slug}/dp/${pageSlug}/articles`)
    .then((r) => r.data); // → { items: [...] }

export const getPublicArticleDetail = (slug, pageSlug, articleSlug) =>
  axios
    .get(
      `/api/v1/public/clinics/${slug}/dp/${pageSlug}/articles/${articleSlug}`,
    )
    .then((r) => r.data); // → полный объект статьи
export const listArticles = (params) =>
  axios.get(`/api/v1/clinic/articles`, { params }).then((r) => r.data);
export const getArticle = (id) =>
  axios.get(`/api/v1/clinic/articles/${id}`).then((r) => r.data);
export const createArticle = (data) =>
  axios.post(`/api/v1/clinic/articles`, data).then((r) => r.data);
export const updateArticle = (id, data) =>
  axios.patch(`/api/v1/clinic/articles/${id}`, data).then((r) => r.data);
export const publishArticle = (id, status) =>
  axios
    .patch(`/api/v1/clinic/articles/${id}/publish`, { status })
    .then((r) => r.data);
export const deleteArticle = (id) =>
  axios.delete(`/api/v1/clinic/articles/${id}`).then((r) => r.data);
export const getPublicCategoryGallery = (slug, pageSlug) =>
  axios
    .get(`/api/v1/public/clinics/${slug}/dp/${pageSlug}/gallery`)
    .then((r) => r.data); // → { items: [...] }
export const listGalleryItems = (params) =>
  axios.get(`/api/v1/clinic/gallery`, { params }).then((r) => r.data);
export const createGalleryItem = (data) =>
  axios.post(`/api/v1/clinic/gallery`, data).then((r) => r.data);
export const updateGalleryItem = (id, data) =>
  axios.patch(`/api/v1/clinic/gallery/${id}`, data).then((r) => r.data);
export const deleteGalleryItem = (id) =>
  axios.delete(`/api/v1/clinic/gallery/${id}`).then((r) => r.data);
export const getPublicParentArticles = (slug, pageSlug) =>
  axios
    .get(`/api/v1/public/clinics/${slug}/dp/${pageSlug}/all-articles`)
    .then((r) => r.data); // → { articles, subcategories }
// ── ВИТРИНА 2.0 (V4.2) — услуги клиники ────────────────────────────────
// Добавить в client/src/api/clinic.js рядом с хелперами departments.
// axios-инстанс тот же, что используют listCustomPages и пр. (api/http).
// REACT_APP_API_URL = http://localhost:11000 (БЕЗ /api/v1) — поэтому путь
// пишем С префиксом /api/v1/clinic (clinicRouter смонтирован на /api/v1/clinic).

// ── ВИТРИНА 2.0 (V4.2) — услуги клиники ────────────────────────────────
// Reuses `import axios from "../axios"` at the top. Backend whitelists list
// responses в { services: [...] }; здесь нормализуем к массиву (для ServicesPage).
//
// Backend module: server/modules/clinic/clinic-services/
//   GET    /api/v1/clinic/services?status=&departmentId=&branchId=&q=  list
//   POST   /api/v1/clinic/services                                     create
//   GET    /api/v1/clinic/services/:id                                 get one
//   PATCH  /api/v1/clinic/services/:id                                 update
//   DELETE /api/v1/clinic/services/:id                                 soft archive

// GET /api/v1/clinic/services
// Возвращает МАССИВ услуг (ServicesPage ждёт массив, не { items }).
export const listServices = async (params = {}) => {
  const res = await axios.get("/api/v1/clinic/services", { params });
  return Array.isArray(res.data?.services) ? res.data.services : [];
};

// GET /api/v1/clinic/services/:id  → { service }
export const getService = async (id) => {
  const res = await axios.get(`/api/v1/clinic/services/${id}`);
  return res.data?.service;
};

// POST /api/v1/clinic/services  → { service }
export const createService = async (body) => {
  const res = await axios.post("/api/v1/clinic/services", body);
  return res.data?.service;
};

// PATCH /api/v1/clinic/services/:id  → { service }
export const updateService = async (id, body) => {
  const res = await axios.patch(`/api/v1/clinic/services/${id}`, body);
  return res.data?.service;
};

// DELETE /api/v1/clinic/services/:id  (soft archive) → { service }
export const archiveService = async (id) => {
  const res = await axios.delete(`/api/v1/clinic/services/${id}`);
  return res.data?.service;
};

// ═══════════════════════════════════════════════════════════════════════════
//  MEMBERSHIP INVITES (admin — User + ClinicMembership) — clinic-staff module
// ═══════════════════════════════════════════════════════════════════════════
//
// APPEND this block to the END of client/src/api/clinic.js.
// Reuses `import axios from "../axios"` at the top.
//
// Distinct from the EMPLOYEE invite helpers above (createInvitation /
// listInvitations / revokeInvitation / previewInvitation / acceptInvitation)
// which target ClinicEmployee via OTP. These target a DocPats User who becomes
// an admin ("near-owner") via ClinicMembership. Names are prefixed
// "MembershipInvite" to avoid colliding with the employee-invite exports.
//
// Backend module: server/modules/clinic/clinic-staff/
// Path prefix:    /api/v1/clinic
//   POST   /membership-invitations            create (owner-only in practice)
//   GET    /membership-invitations?status=    list
//   DELETE /membership-invitations/:id         revoke
//   GET    /membership-invitations/preview?token=   preview (public)
//   POST   /membership-invitations/accept      accept (authenticated user)
//
// Owner endpoints run in the owner zone (tenant context). preview is public.
// accept requires the person to be logged in (session userId), but NOT to have
// clinic context yet. A brand-new person registers via the link and the
// registration flow binds the membership (confirmationController) — no accept
// call from the client is needed in that case.

/**
 * POST /api/v1/clinic/membership-invitations
 * Invite a DocPats user (by email) to become an admin. Sends a signed link.
 * @param {object} payload { email, role?, customTitle?, language? }
 *   role defaults to "admin" server-side.
 * Returns { invitation, emailSent }.
 */
export const createMembershipInvite = async ({
  email,
  role,
  customTitle,
  language,
}) => {
  const res = await axios.post("/api/v1/clinic/membership-invitations", {
    email,
    ...(role && { role }),
    ...(customTitle && { customTitle }),
    ...(language && { language }),
  });
  return res.data;
};

/**
 * GET /api/v1/clinic/membership-invitations?status=pending
 * List membership invites of the current clinic.
 * Returns { items } (normalized from { invitations: [...] }).
 */
export const listMembershipInvites = async (status = "pending") => {
  const res = await axios.get("/api/v1/clinic/membership-invitations", {
    params: { status },
  });
  return normalizeList(res.data, ["invitations"]);
};

/**
 * DELETE /api/v1/clinic/membership-invitations/:id
 * Revoke a pending membership invite. Returns { invitation: { id, status } }.
 */
export const revokeMembershipInvite = async (inviteId) => {
  const res = await axios.delete(
    `/api/v1/clinic/membership-invitations/${inviteId}`,
  );
  return res.data;
};

/**
 * GET /api/v1/clinic/membership-invitations/preview?token=...
 * Public — preview invite details (clinic, role, email) before acting.
 * Returns { email, role, customTitle, clinic:{id,name,slug}, expiresAt, language }.
 */
export const previewMembershipInvite = async (token) => {
  const res = await axios.get("/api/v1/clinic/membership-invitations/preview", {
    params: { token },
  });
  return res.data;
};

/**
 * POST /api/v1/clinic/membership-invitations/accept
 * Authenticated — the logged-in user accepts the invite; a ClinicMembership
 * (actorType "user", role admin) is created.
 * @param {string} token
 * Returns { membershipId, clinicId, role, status, alreadyMember, message }.
 */
export const acceptMembershipInvite = async (token) => {
  const res = await axios.post("/api/v1/clinic/membership-invitations/accept", {
    token,
  });
  return res.data;
};
export const deleteClinic = async (clinicId, confirmationName) => {
  const res = await axios.delete(`/api/v1/clinic/clinics/${clinicId}`, {
    data: { confirmationName },
  });
  return res.data;
};

/**
 * GET /api/v1/clinic/analytics/overview?range=<preset>
 * Read-only clinic analytics for the manager/owner/admin (RBAC: analytics.read).
 * `range` is one of: day | week | month | half_year | year | three_years |
 * five_years | all. Omit for the backend default ("month").
 * Returns { overview: { range, appointments, noShow, doctorLoad, dailyTrend,
 * newPatients, generatedAt } }.
 */
export const getAnalyticsOverview = async (range) => {
  const res = await axios.get("/api/v1/clinic/analytics/overview", {
    params: range ? { range } : {},
  });
  return res.data;
};

// ═══════════════════════════════════════════════════════════════════════════
//  LEADS (clinic contact requests) — clinic-leads module
// ═══════════════════════════════════════════════════════════════════════════
//
// Public submit (vitrina contact form) + private manager inbox.
//   POST  /api/v1/public/clinics/:slug/leads   submit (no auth)
//   GET   /api/v1/clinic/leads?status=&limit=&skip=   list (manager)
//   PATCH /api/v1/clinic/leads/:leadId   update status (manager)

/**
 * POST /api/v1/public/clinics/:slug/leads
 * Public — a visitor leaves a contact request on the clinic's vitrina.
 * @param {string} slug
 * @param {object} payload { name, phone, message?, type? }  type: callback|message
 * Returns { ok, leadId, status }.
 */
export const submitLead = async (slug, payload) => {
  const res = await axios.post(
    `/api/v1/public/clinics/${encodeURIComponent(slug)}/leads`,
    payload,
  );
  return res.data;
};

/**
 * GET /api/v1/clinic/leads?status=&limit=&skip=
 * Manager inbox. status: new|in_progress|closed (omit for all).
 * Returns { leads, total }.
 */
export const listLeads = async (opts = {}) => {
  const params = {};
  if (opts.status) params.status = opts.status;
  if (opts.limit != null) params.limit = opts.limit;
  if (opts.skip != null) params.skip = opts.skip;
  const res = await axios.get("/api/v1/clinic/leads", { params });
  return res.data; // { leads, total }
};

/**
 * PATCH /api/v1/clinic/leads/:leadId
 * @param {string} leadId
 * @param {object} payload { status, note? }  status: new|in_progress|closed
 * Returns { lead }.
 */
export const updateLeadStatus = async (leadId, payload) => {
  const res = await axios.patch(`/api/v1/clinic/leads/${leadId}`, payload);
  return res.data;
};