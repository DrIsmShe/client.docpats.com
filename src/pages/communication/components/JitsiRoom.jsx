// client/src/pages/communication/components/JitsiRoom.jsx
//
// Self-contained video-call panel backed by the self-hosted Jitsi server.
// Works for a 1:1 dialog, a group consilium (doctor or patient side), a
// telemed visit (doctor or patient side), or a freelance appointment.
//
// Usage:
//   Chat:            <JitsiRoom dialogId={dialogId} displayName="Dr. X" onClose=… />
//   Consilium (doc): <JitsiRoom source="consilium" id={consiliumId} … />
//   Consilium (pat): <JitsiRoom source="consilium-patient" id={consiliumId} … />
//   Telemed (doc):   <JitsiRoom source="telemed" id={sessionId} … />
//   Telemed (pat):   <JitsiRoom source="telemed-patient" id={sessionId} … />
//   Appointment:     <JitsiRoom source="appointment" id={appointmentId} … />
//
// While idle it shows a start button; once active it embeds the Jitsi iframe
// full-size in its container. Closing disposes the call.

import React from "react";
import useVideoRoom from "../hooks/useVideoRoom";

const LABELS = {
  dialog: {
    hint: "Видеозвонок через защищённый сервер клиники",
    start: "Начать видеозвонок",
  },
  consilium: {
    hint: "Видеоконференция консилиума — защищённый сервер клиники",
    start: "Начать видеоконференцию",
  },
  "consilium-patient": {
    hint: "Видеоконсилиум — защищённый сервер DocPats",
    start: "Войти в консилиум",
  },
  telemed: {
    hint: "Видеоприём — защищённый сервер клиники",
    start: "Начать видеоприём",
  },
  "telemed-patient": {
    hint: "Онлайн-консультация — защищённый сервер DocPats",
    start: "Войти в консультацию",
  },
  appointment: {
    hint: "Видеоконсультация — защищённый сервер DocPats",
    start: "Войти в видеоконсультацию",
  },
};

export default function JitsiRoom({
  source = "dialog",
  id,
  dialogId,
  displayName,
  onClose,
}) {
  const { status, error, start, stop, containerRef } = useVideoRoom({
    source,
    id,
    dialogId,
    displayName,
  });

  const labels = LABELS[source] || LABELS.dialog;

  const handleClose = () => {
    stop();
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 360,
        background: "#0b0f1a",
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        ref={containerRef}
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          display: status === "active" ? "block" : "none",
        }}
      />

      {status !== "active" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            color: "#e2e8f0",
            padding: 24,
            textAlign: "center",
          }}
        >
          {status === "idle" && (
            <>
              <div style={{ fontSize: 15, opacity: 0.8 }}>{labels.hint}</div>
              <button
                onClick={start}
                style={{
                  padding: "10px 22px",
                  borderRadius: 8,
                  border: "none",
                  background: "#3d7fff",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {labels.start}
              </button>
            </>
          )}

          {status === "loading" && (
            <div style={{ fontSize: 14, opacity: 0.8 }}>
              Подключение к видеокомнате…
            </div>
          )}

          {status === "error" && (
            <>
              <div style={{ fontSize: 14, color: "#f87171" }}>
                Не удалось подключиться к видео
                {error?.message ? `: ${error.message}` : ""}
              </div>
              <button
                onClick={start}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "1px solid #3d7fff",
                  background: "transparent",
                  color: "#3d7fff",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Повторить
              </button>
            </>
          )}
        </div>
      )}

      <button
        onClick={handleClose}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 5,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "none",
          background: "rgba(0,0,0,.45)",
          color: "#fff",
          fontSize: 18,
          lineHeight: "32px",
          cursor: "pointer",
        }}
        aria-label="Закрыть видео"
        title="Закрыть"
      >
        ×
      </button>
    </div>
  );
}
