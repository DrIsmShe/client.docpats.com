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
// While idle it shows a start button inside its parent container. Once the
// call is ACTIVE the whole component pins itself to the viewport
// (position: fixed, 100dvh) so the parent/modal size no longer matters, and
// a Fullscreen-API button gives true immersive mode.

import React, { useCallback, useEffect, useRef, useState } from "react";
import useVideoRoom from "../hooks/useVideoRoom";
import { useCurrentUser } from "../hooks/useCurrentUserId";
import ScribePanel from "./ScribePanel";
import { canRecordHere } from "../hooks/useScribeRecorder";

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

function getFsElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

export default function JitsiRoom({
  source = "dialog",
  id,
  dialogId,
  displayName,
  onClose,
  // Запись приёма. Необязательный: без собеседника врач не сможет
  // начать сеанс, и панель просто не появится — консилиум на несколько
  // человек записывать этим механизмом нельзя, там у каждого свой
  // микрофон и «вторая сторона» не одна.
  scribePeerUserId = null,
  scribePeerName = "",
  onScribeDraft = null,
}) {
  // Роль решает, что показать: врачу кнопку, пациенту запрос согласия.
  // Берём здесь, а не пропсом: комната используется из трёх мест, и
  // прокидывать роль через каждое значило бы забыть в одном.
  const { role } = useCurrentUser();
  const { status, error, start, stop, containerRef } = useVideoRoom({
    source,
    id,
    dialogId,
    displayName,
  });

  const rootRef = useRef(null);
  const [isFs, setIsFs] = useState(false);

  const labels = LABELS[source] || LABELS.dialog;
  const active = status === "active";

  // ── Keep local state in sync with the browser's native fullscreen ──
  useEffect(() => {
    const onFsChange = () => setIsFs(Boolean(getFsElement()));
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  const enterFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) {
      try {
        const p = req.call(el);
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch (_) {
        /* ignore */
      }
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (!getFsElement()) return;
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) {
      try {
        const p = exit.call(document);
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch (_) {
        /* ignore */
      }
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFs) exitFullscreen();
    else enterFullscreen();
  }, [isFs, enterFullscreen, exitFullscreen]);

  const handleClose = useCallback(() => {
    exitFullscreen();
    stop();
    if (onClose) onClose();
  }, [exitFullscreen, stop, onClose]);

  // ── Lock body scroll while the fixed overlay covers the viewport ──
  useEffect(() => {
    if (!active) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  const rootStyle = active
    ? {
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 9999,
        background: "#0b0f1a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }
    : {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 360,
        background: "#0b0f1a",
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
      };

  const iconBtn = {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,.45)",
    color: "#fff",
    fontSize: 16,
    lineHeight: "34px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div ref={rootRef} style={rootStyle}>
      <div
        ref={containerRef}
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          display: active ? "block" : "none",
        }}
      />

      {/* Панель записи приёма. Внутри комнаты, а не в оверлее звонка:
          на этом экране Jitsi занимает всё, и оверлей CallUI не
          участвует вовсе — панель, встроенная туда, здесь никогда бы не
          появилась.

          Прижата к низу над собственной панелью Jitsi и с большим
          z-index: iframe перекрывает всё, что лежит ниже него. */}
      {active &&
        role &&
        // Панель нужна там, где есть ВТОРАЯ СТОРОНА: либо звонок из
        // переписки (знаем собеседника), либо телемед-приём (пациента
        // знает сам приём). Консилиум на несколько человек этим
        // механизмом не записывается — там сторон больше двух.
        ((dialogId && scribePeerUserId) ||
          // Телемед-приём: пациента и карту знает сам приём. Обе стороны
          // получают ОДИН И ТОТ ЖЕ идентификатор сеанса — он и служит
          // ключом комнаты записи. Имя комнаты Jitsi (telemed-<joinKey>)
          // для этого не годится: у пациента joinKey нет.
          ((source === "telemed" || source === "telemed-patient") && id)) && (
        // Позиция — в scribePanel.css (.scribe-dock), а не здесь: на
        // телефоне панель обязана уходить наверх, чтобы не накрыть полосу
        // управления Jitsi с кнопкой микрофона, а inline-стиль медиа-запрос
        // выразить не умеет.
        <div className="scribe-dock">
          <ScribePanel
            role={role === "doctor" ? "doctor" : "patient"}
            room={dialogId ? `dialog-${dialogId}` : `telemed-${id}`}
            peerUserId={scribePeerUserId}
            peerName={scribePeerName}
            /* Идентификатор приёма шлёт только врач: сеанс записи
               создаёт он, и карту сервер берёт оттуда. Пациент лишь
               находит уже созданный сеанс по комнате. */
            telemedSessionId={source === "telemed" ? id : null}
            onDraft={onScribeDraft}
          />
        </div>
      )}

      {!active && (
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
              {/* Предупреждение ДО звонка, а не в нём: врач, узнавший о
                  недоступности записи посреди приёма, приём уже потерял. */}
              {role === "doctor" && !canRecordHere() && (
                <div style={{ fontSize: 13, opacity: 0.65, maxWidth: 420 }}>
                  Запись приёма ведётся только с компьютера: на телефоне
                  микрофон занят звонком.
                </div>
              )}
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

      {/* Top-right controls */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 5,
          display: "flex",
          gap: 8,
        }}
      >
        {active && (
          <button
            onClick={toggleFullscreen}
            style={iconBtn}
            aria-label={isFs ? "Выйти из полного экрана" : "На весь экран"}
            title={isFs ? "Выйти из полного экрана" : "На весь экран"}
          >
            {isFs ? "🗗" : "⛶"}
          </button>
        )}
        <button
          onClick={handleClose}
          style={{ ...iconBtn, fontSize: 18 }}
          aria-label="Закрыть видео"
          title="Закрыть"
        >
          ×
        </button>
      </div>
    </div>
  );
}
