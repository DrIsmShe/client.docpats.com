// client/src/pages/communication/hooks/useVideoRoom.js
//
// Hook that powers a Jitsi video call inside DocPats.
//
// Responsibilities:
//   1. Lazy-load the Jitsi External API script from the Jitsi server
//      (external_api.js) exactly once per page.
//   2. Fetch a room-access token from our backend (session-authorized).
//   3. Expose start()/stop() and status so a component can mount the call
//      into a container div.
//
// The Jitsi server origin is read from REACT_APP_JITSI_URL (e.g.
// "https://localhost:8443" locally, "https://meet.docpats.com" in prod).
// The backend's token already encodes domain + room; we use the API's
// `jwt` option so only holders of a valid token can join (matches the
// AUTH_TYPE=jwt setup on the server).
//
// Self-contained: the OLD native call (useCall) is untouched. This is a
// parallel path we wire into the UI behind a button, so the working P2P
// call stays as a fallback until Jitsi is proven.

import { useCallback, useEffect, useRef, useState } from "react";
import { getDialogVideoToken } from "../api/videoApi";

// Where the Jitsi server lives. Local dev default; override via env in prod.
const JITSI_URL = process.env.REACT_APP_JITSI_URL || "https://localhost:8443";

// external_api.js is served by the Jitsi web container at this path.
const EXTERNAL_API_SRC = `${JITSI_URL}/external_api.js`;

// Module-level promise so the script loads only once even across components.
let scriptPromise = null;

function loadJitsiScript() {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${EXTERNAL_API_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Jitsi external_api.js")),
      );
      return;
    }
    const s = document.createElement("script");
    s.src = EXTERNAL_API_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Jitsi external_api.js"));
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/**
 * @param {object} opts
 * @param {string} opts.dialogId  Dialog whose room we join.
 * @param {string} [opts.displayName]
 */
export default function useVideoRoom({ dialogId, displayName } = {}) {
  // idle | loading | ready | active | error
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const apiRef = useRef(null); // JitsiMeetExternalAPI instance
  const containerRef = useRef(null); // DOM node to render into

  const stop = useCallback(() => {
    if (apiRef.current) {
      try {
        apiRef.current.dispose();
      } catch {
        /* ignore */
      }
      apiRef.current = null;
    }
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (!dialogId) {
      setError(new Error("dialogId is required"));
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      // 1. token (session-authorized) + 2. script — in parallel
      const [data] = await Promise.all([
        getDialogVideoToken(dialogId),
        loadJitsiScript(),
      ]);

      const { token, domain, room } = data;
      if (!token || !domain || !room) {
        throw new Error("Invalid token response from server");
      }

      if (!containerRef.current) {
        throw new Error("Video container is not mounted");
      }

      // domain from backend is like "localhost:8443" or "meet.docpats.com".
      // JitsiMeetExternalAPI takes the bare domain (with port) as first arg.
      const api = new window.JitsiMeetExternalAPI(domain, {
        roomName: room,
        jwt: token,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        userInfo: displayName ? { displayName } : undefined,
      });

      apiRef.current = api;
      setStatus("active");

      api.addEventListener("readyToClose", () => {
        stop();
      });
    } catch (err) {
      setError(err);
      setStatus("error");
    }
  }, [dialogId, displayName, stop]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { status, error, start, stop, containerRef };
}
