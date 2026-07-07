// client/src/lib/can.js
//
// Client-side permission checks for the /clinic/* zone.
//
// The backend sends EFFECTIVE permissions (role defaults merged with
// per-user overrides) in the auth payload — for DocPats users via
// GET /clinic/me, for ClinicEmployees via GET /clinic/employees/me.
// ClinicLayout spreads that payload into the outlet context, so any page
// rendered under it can read `permissions` and gate UI with these helpers.
//
// UI GATING ONLY. The server enforces the same rules independently
// (common/auth/can.js + can()/require() in each route/service). Never treat
// a client-side pass as authorization — it only decides what to show.
//
// Usage:
//
//   // 1. Inside a page rendered under ClinicLayout's <Outlet>:
//   import { useClinicPermissions } from "../../lib/can";
//   const { can, role } = useClinicPermissions();
//   if (can("patient", "write")) { ... }
//   if (can("site_builder.write")) { ... }   // dot-notation also works
//
//   // 2. Pure check when you already hold a permissions map:
//   import { can } from "../../lib/can";
//   can(permissions, "review", "read");

import { useOutletContext } from "react-router-dom";

/**
 * Internal: accept ("resource", "action") or dot-notation "resource.action".
 * @returns {[string|undefined, string|undefined]}
 */
function parseArgs(resource, action) {
  if (
    action === undefined &&
    typeof resource === "string" &&
    resource.includes(".")
  ) {
    const parts = resource.split(".");
    if (parts.length !== 2) return [undefined, undefined];
    return [parts[0], parts[1]];
  }
  return [resource, action];
}

/**
 * Pure permission check against an effective-permissions map.
 * Deny-by-default: anything not explicitly granted is false.
 *
 * @param {object} permissions  Map<resource, {read,write,delete}>
 * @param {string} resource     e.g. "patient" or "patient.write"
 * @param {string} [action]     e.g. "write" (omit if dot-notation used)
 * @returns {boolean}
 */
export function can(permissions, resource, action) {
  if (!permissions || typeof permissions !== "object") return false;
  const [res, act] = parseArgs(resource, action);
  if (!res || !act) return false;
  return permissions[res]?.[act] === true;
}

/**
 * Hook: read the clinic auth context provided by ClinicLayout's <Outlet>
 * and return permission helpers bound to the current user's permissions.
 *
 * Works for both zones:
 *   - DocPats users   (context.kind === "user")
 *   - ClinicEmployees (context.kind === "employee")
 *
 * Safe outside an Outlet (returns deny-all) so it never throws.
 *
 * @returns {{
 *   can: (resource: string, action?: string) => boolean,
 *   permissions: object,
 *   role: string | null,
 *   kind: string | null,
 * }}
 */
export function useClinicPermissions() {
  const ctx = useOutletContext() || {};
  const permissions = ctx.permissions || {};
  return {
    can: (resource, action) => can(permissions, resource, action),
    permissions,
    role: ctx.role || null,
    kind: ctx.kind || null,
  };
}
