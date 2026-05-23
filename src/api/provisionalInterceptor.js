// client/src/api/provisionalInterceptor.js
//
// Global axios interceptor for the provisional-User activation flow.
//
// When the backend's blockUnfinishedRegistration middleware detects an
// authenticated user with mustCompleteRegistration === true, it returns:
//
//     HTTP 403  {"error": "...", "code": "provisional_must_complete",
//                "redirectTo": "/complete-registration"}
//
// on EVERY request except the small allowlist (auth endpoints,
// /common-for-user, static assets). The frontend must catch that signal
// and force-redirect the user to the activation page — otherwise they'd
// see a stream of 403s scattered across the UI with no obvious path forward.
//
// We attach the interceptor to BOTH:
//   - the project's shared axios instance (client/src/axios.js)
//   - the global default axios (used directly by Login.jsx and a few
//     other pages that don't import the instance)
//
// Both call sites need coverage — Login itself can return this code if
// somehow a provisional user re-attempts auth from another tab while
// blockUnfinishedRegistration is active.
//
// Protection against redirect loops:
//   - if we're already on /complete-registration, do nothing
//   - if the failed request was TO the completion endpoint itself, do nothing
//   - if we just redirected within the last 2 seconds, do nothing
//     (covers the case where multiple in-flight requests all return 403)

import axios from "axios";
import instance from "../axios";

const REDIRECT_PATH = "/complete-registration";

// Debounce so a barrage of 403s from in-flight requests doesn't cause
// multiple redirects (and reset any state on the destination page).
let lastRedirectAt = 0;
const REDIRECT_COOLDOWN_MS = 2000;

function shouldHandle(error) {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;
  if (status !== 403) return false;
  if (code !== "provisional_must_complete") return false;

  // Avoid acting on the response from the completion endpoint itself —
  // if THAT 403s for any reason, the page handles its own error UI.
  const url = error?.config?.url || "";
  if (url.includes("complete-provisional-registration")) return false;

  // Avoid loop: if we're already on the destination page, don't redirect
  if (typeof window !== "undefined") {
    if (window.location.pathname === REDIRECT_PATH) return false;
  }

  // Debounce against multiple parallel failures
  const now = Date.now();
  if (now - lastRedirectAt < REDIRECT_COOLDOWN_MS) return false;
  lastRedirectAt = now;

  return true;
}

function handler(error) {
  if (shouldHandle(error)) {
    const redirectTo = error.response?.data?.redirectTo || REDIRECT_PATH;
    // Use assign (not replace) so the browser back button still works —
    // user can deliberately navigate back to whatever they were doing
    // before this triggered, even though their UI will still 403 there.
    // assign also forces a full page reload which clears any stale React
    // state from the page that just hit the wall.
    window.location.assign(redirectTo);
  }
  return Promise.reject(error);
}

// Attach to BOTH default axios and the project instance.
// Order matters only in that we want the SAME handler on both —
// any 403 on either gets handled identically.
axios.interceptors.response.use((res) => res, handler);
instance.interceptors.response.use((res) => res, handler);

// No default export — this module is imported purely for side effects.
// See index.js: `import "./api/provisionalInterceptor";`
