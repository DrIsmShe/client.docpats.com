// client/src/pages/communication/hooks/useVideoRoom.js
//
// Hook that powers a Jitsi video call inside DocPats.
//
// Works for these room sources:
//   - dialog            → 1:1 chat call
//   - consilium         → group doctor call (DOCTOR side)
//   - consilium-patient → group call (PATIENT side)
//   - telemed           → virtual visit (clinic, DOCTOR side)
//   - telemed-patient   → virtual visit (PATIENT side)
//   - appointment       → freelance video consultation (doctor + patient, both
//                         by their own session)
//   - webinar           → встреча по ссылке: право войти определяют её
//                         правила (ссылка или список), а не диалог
//
// Backward compatible: the chat still calls useVideoRoom({ dialogId }). New
// callers use useVideoRoom({ source: "consilium"|"consilium-patient"|"telemed"|"telemed-patient"|"appointment", id }).
//
// Responsibilities:
//   1. Lazy-load the Jitsi External API script once per page.
//   2. Fetch a room-access token from our backend (session-authorized).
//   3. Expose start()/stop() + status so a component can mount the call.
//
// Jitsi origin from REACT_APP_JITSI_URL (e.g. "https://localhost:8443"
// locally, "https://meet.docpats.com" in prod).

import { useCallback, useEffect, useRef, useState } from "react";
import { getWebinarToken } from "../../../api/webinar";
import {
  getDialogVideoToken,
  getConsiliumVideoToken,
  getPatientConsiliumVideoToken,
  getTelemedVideoToken,
  getPatientTelemedVideoToken,
  getAppointmentVideoToken,
} from "../../../api/videoApi";

const JITSI_URL = process.env.REACT_APP_JITSI_URL || "https://localhost:8443";

const EXTERNAL_API_SRC = `${JITSI_URL}/external_api.js`;

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

// Resolve the right token-fetch for the requested source.
function fetchToken({ source, id, displayName }) {
  if (source === "consilium") {
    return getConsiliumVideoToken(id, displayName);
  }
  if (source === "consilium-patient") {
    return getPatientConsiliumVideoToken(id, displayName);
  }
  if (source === "telemed") {
    return getTelemedVideoToken(id, displayName);
  }
  if (source === "telemed-patient") {
    return getPatientTelemedVideoToken(id, displayName);
  }
  // Вебинар: пропуск выдаёт собственный эндпоинт встречи, потому что
  // право войти определяется её правилами (ссылка или список), а не
  // участием в диалоге.
  if (source === "webinar") {
    return getWebinarToken(id, displayName);
  }
  if (source === "appointment") {
    return getAppointmentVideoToken(id, displayName);
  }
  // default: dialog (displayName is taken from the JWT context server-side)
  return getDialogVideoToken(id);
}

/**
 * @param {object} opts
 * @param {"dialog"|"consilium"|"consilium-patient"|"telemed"|"telemed-patient"|"appointment"|"webinar"} [opts.source="dialog"]
 * @param {string} [opts.id]        Room source id.
 * @param {string} [opts.dialogId]  Back-compat alias for source="dialog".
 * @param {string} [opts.displayName]
 */
export default function useVideoRoom({
  source = "dialog",
  id,
  dialogId,
  displayName,
} = {}) {
  // Back-compat: old chat callers pass { dialogId }.
  const effectiveSource = dialogId ? "dialog" : source;
  const effectiveId = dialogId || id;

  // idle | loading | ready | active | error
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const apiRef = useRef(null);
  const containerRef = useRef(null);

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
    if (!effectiveId) {
      setError(new Error("room id is required"));
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const [data] = await Promise.all([
        fetchToken({
          source: effectiveSource,
          id: effectiveId,
          displayName,
        }),
        loadJitsiScript(),
      ]);

      const { token, domain, room } = data;
      if (!token || !domain || !room) {
        throw new Error("Invalid token response from server");
      }
      if (!containerRef.current) {
        throw new Error("Video container is not mounted");
      }

      const api = new window.JitsiMeetExternalAPI(domain, {
        roomName: room,
        jwt: token,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          // Prejoin выключаем ДВУМЯ флагами. Старый prejoinPageEnabled свежие
          // сборки Jitsi игнорируют, нужен prejoinConfig.enabled — иначе
          // участник застревает на экране «Присоединиться к встрече» и в
          // комнату не входит. В useJitsiCall это уже починено; здесь тот же
          // недосмотр оставался, а именно этим путём идёт конференция в
          // групповом диалоге.
          prejoinPageEnabled: false,
          prejoinConfig: { enabled: false },
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
  }, [effectiveSource, effectiveId, displayName, stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { status, error, start, stop, containerRef };
}
