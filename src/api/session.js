// client/src/api/session.js
//
// Centralised, de-duplicated access to the current session
// (GET /common-for-user).
//
// PROBLEM THIS SOLVES
// -------------------
// ~47 components each call `axios.get(API_BASE + "/common-for-user")` from
// their own useEffect. On a single page load the shell alone (layout +
// header + sidebar + notification bell + the page itself) fires the request
// 5–10 times in parallel, and navigation re-fires it every time. That is
// real load on the VPS + Atlas and slows first paint.
//
// STRATEGY
// --------
//  1. In-flight de-duplication: if a request is already pending, every
//     caller awaits the SAME promise instead of starting a new one. A burst
//     of 10 simultaneous mounts collapses to ONE network round-trip.
//  2. Short TTL cache: the resolved result is reused for CACHE_TTL_MS, so
//     navigating between pages doesn't re-hit the network. Kept short so a
//     login/logout in another tab is picked up quickly.
//  3. clearSession(): call on logout to drop the cache immediately.
//
// The returned shape is IDENTICAL to the raw endpoint response
// ({ authenticated, user, ... }), so migrating a component is a one-line
// change — no logic rewrite.

import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;
const ENDPOINT = `${API_BASE}/common-for-user`;

// How long a resolved session stays fresh. Short enough that auth changes
// in another tab surface quickly; long enough to absorb a page's worth of
// concurrent mounts + immediate navigation.
const CACHE_TTL_MS = 30_000;

let cache = null; // { data, fetchedAt }
let inFlight = null; // Promise | null

/**
 * Returns the current session payload: { authenticated, user, ... }.
 *
 * @param {Object}  [opts]
 * @param {boolean} [opts.force]  Bypass the cache and refetch.
 * @returns {Promise<Object>} Resolves to the endpoint payload. On network
 *   error, resolves to { authenticated: false } (never throws) so callers
 *   can treat "not logged in" and "request failed" the same way, exactly
 *   like the old per-component try/catch did.
 */
export async function getSession({ force = false } = {}) {
  const now = Date.now();

  // 1. Fresh cache hit
  if (!force && cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  // 2. A request is already in flight — piggyback on it
  if (inFlight) return inFlight;

  // 3. Start a new request; store the promise so concurrent callers share it
  inFlight = (async () => {
    try {
      const { data } = await axios.get(ENDPOINT, { withCredentials: true });
      cache = { data, fetchedAt: Date.now() };
      return data;
    } catch (err) {
      // Match legacy behaviour: treat any failure as "not authenticated".
      // Do NOT cache errors — next call should retry.
      const fallback = { authenticated: false };
      cache = null;
      return fallback;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * Drop the cached session. Call this right after a successful logout so the
 * next getSession() re-checks against the server instead of returning a
 * stale "authenticated" payload.
 */
export function clearSession() {
  cache = null;
  inFlight = null;
}

/**
 * Convenience: returns just the user object (or null). Thin wrapper over
 * getSession() for the many components that only need `data.user`.
 */
export async function getCurrentUser(opts) {
  const data = await getSession(opts);
  return data?.authenticated ? data.user || null : null;
}
