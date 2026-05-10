// client/src/api/clinic.js
//
// All API calls for the clinic module.
// All requests use the main axios instance with withCredentials: true.

import axios from "../axios";

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
  return res.data;
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
  return res.data;
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
  return res.data;
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
  return res.data;
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
