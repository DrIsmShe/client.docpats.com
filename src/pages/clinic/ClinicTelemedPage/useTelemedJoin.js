// client/src/pages/clinic/ClinicTelemedPage/useTelemedJoin.js
//
// SINGLE INTEGRATION POINT for joining a telemed visit.
//
// "Join" auto-picks a mode from the data the session carries (priority order):
//   Variant 3 — external link (meetingUrl): open it in a new tab. No WebRTC.
//   Variant 1 — native P2P over the existing chat-call stack (patientUserId):
//               get/create a doctor↔patient dialog, then initiateCall(...).
//   Variant 2 — joinKey room mode: not enabled (would require rewriting the
//               dialog-bound call gateway); falls back to a clear notice.
//
// Dependencies are INJECTED by the page (where GlobalCallProvider context and
// the chat API are available), so this hook stays a thin, swappable seam:
//
//   const { initiateCall } = useCallContext();
//   const { join } = useTelemedJoin({ initiateCall, getOrCreateDialogWithUser });
//
// Either dependency may be omitted; the matching variant then degrades to a
// notice instead of throwing.

import { useCallback } from "react";

export default function useTelemedJoin(deps = {}) {
  const { initiateCall, getOrCreateDialogWithUser } = deps;

  const join = useCallback(
    async (session) => {
      if (!session) return;

      // ── Variant 3: external meeting link ────────────────────────────
      if (session.meetingUrl) {
        window.open(session.meetingUrl, "_blank", "noopener,noreferrer");
        return;
      }

      // ── Variant 1: native call to the patient's registered user ─────
      if (session.patientUserId) {
        if (!initiateCall || !getOrCreateDialogWithUser) {
          window.alert(
            "Видеозвонок недоступен: интеграция со звонком не подключена на этой странице.",
          );
          return;
        }
        try {
          // Reuse the same dialog the chat uses (get-or-create).
          const res = await getOrCreateDialogWithUser(
            String(session.patientUserId),
          );
          const dialogId = res?.data?.dialog?._id || res?.data?._id;
          if (!dialogId) {
            window.alert("Не удалось открыть диалог с пациентом.");
            return;
          }
          // Place a video call through the existing call stack.
          initiateCall({
            targetDialogId: dialogId,
            targetPeerId: String(session.patientUserId),
            peerName: session.title || "",
            peerAvatar: null,
            type: "video",
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("[telemed] join (call) failed:", err);
          window.alert(
            "Не удалось начать видеозвонок. Проверьте, что пациент зарегистрирован в системе.",
          );
        }
        return;
      }

      // ── Variant 2: joinKey room mode (not enabled) ──────────────────
      window.alert(
        "Для этого приёма не указан способ видеосвязи.\n\n" +
          "Добавьте внешнюю ссылку (meetingUrl) при создании приёма — тогда " +
          "«Войти» откроет её. Либо привяжите зарегистрированного пациента " +
          "(patientUserId) для встроенного видеозвонка.",
      );
    },
    [initiateCall, getOrCreateDialogWithUser],
  );

  return { join };
}
