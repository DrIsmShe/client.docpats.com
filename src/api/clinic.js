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
