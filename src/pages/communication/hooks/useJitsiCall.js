// client/src/pages/communication/hooks/useJitsiCall.js
//
// ═══════════════════════════════════════════════════════════════════════════
// НОВАЯ ПАРАЛЛЕЛЬНАЯ СИСТЕМА ЗВОНКОВ ЧЕРЕЗ JITSI
// ═══════════════════════════════════════════════════════════════════════════
//
// Зачем: P2P-звонки (useCall.js) не работают телефон↔комп из-за мобильного NAT
// (клиент должен соединиться с клиентом напрямую — оператор за симметричным NAT
// это ломает). Jitsi обходит проблему архитектурно: клиент соединяется не с
// другим клиентом, а с JVB — сервером с ПУБЛИЧНЫМ IP. Клиент→сервер работает
// в мобильных сетях там, где клиент→клиент не работает.
//
// Что переиспользуется (НИЧЕГО не дублируется на бэкенде):
//   • Socket-сигнализация звонков (call.gateway.js): call:initiate / call:incoming
//     / call:accept / call:decline / call:cancel / call:end — те же события, что
//     и у P2P-версии. Звонок доходит и принимается — эта часть уже работает.
//   • Эндпоинт токена: POST /communication/video/token { kind:"dialog", id:dialogId }
//     → { token, domain, room }, где room = `dialog-${dialogId}`.
//     Оба участника звонка = участники диалога → оба получают токен на ОДНУ
//     комнату dialog-${dialogId} → встречаются в ней через JVB.
//   • Паттерн монтирования Jitsi — по образцу useVideoRoom.js.
//
// Что НЕ трогается:
//   • useCall.js (P2P) — остаётся как есть, для комп↔комп / fallback / референса
//   • call.gateway.js на бэкенде — без изменений
//   • video.controller.js / issueVideoTokenController — без изменений
//
// Как подключить: в звонковом компоненте (напр. ChatWindow / CallContext) заменить
//   import { useCall } from "./useCall"      →   import { useJitsiCall } from "./useJitsiCall"
//   const call = useCall(userId)             →   const call = useJitsiCall(userId)
// Публичный API хука совместим с useCall (callState, initiateCall, acceptCall,
// declineCall, cancelCall, endCall, toggleMute, peerInfo, formattedDuration...),
// поэтому UI менять почти не нужно. Отличия: вместо remoteAudioRef монтируется
// Jitsi в jitsiContainerRef; видео — в том же контейнере.
//
// ВАЖНО про токен: этот хук вызывает getDialogVideoToken(dialogId) из videoApi.
// Если у тебя функция называется иначе (getTelemedToken и т.п.) — поправь импорт
// ниже. Она должна слать POST /communication/video/token {kind:"dialog", id}
// и возвращать { token, domain, room }.

import { useState, useEffect, useRef, useCallback } from "react";
import { getSocket } from "../socket";
// ⚠️ ПОДСТАВЬ СВОЮ функцию токена из videoApi.
// Она шлёт POST /communication/video/token { kind:"dialog", id:dialogId }.
// Если называется getTelemedToken — импортируй её и переименуй вызовы ниже.
import { getDialogVideoToken } from "../../../api/videoApi";
import { startRingtone, stopRingtone } from "../lib/ringtone";
import { track } from "../../../lib/analytics";
import { CALL_STARTED } from "../../../lib/events";

const JITSI_URL = process.env.REACT_APP_JITSI_URL || "https://meet.docpats.com";
const EXTERNAL_API_SRC = `${JITSI_URL}/external_api.js`;

// Загрузка external_api.js один раз (кэшируется между звонками) — как в useVideoRoom
let externalApiPromise = null;
function loadJitsiScript() {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  if (externalApiPromise) return externalApiPromise;
  externalApiPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = EXTERNAL_API_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      externalApiPromise = null;
      reject(new Error("Failed to load Jitsi external_api.js"));
    };
    document.body.appendChild(s);
  });
  return externalApiPromise;
}

export function useJitsiCall(currentUserId, { displayName = "" } = {}) {
  const socket = getSocket();

  // ─── REFS ─────────────────────────────────────────────────────────────────
  // Своё имя — подпись участника в комнате Jitsi. В ref, а не в зависимости
  // mountJitsiRoom: приходит асинхронно (запрос профиля) и не должен
  // пересобирать функцию монтирования посреди звонка.
  const selfNameRef = useRef(displayName);
  const callTypeRef = useRef("audio"); // "audio" | "video"
  const durationSecRef = useRef(0);
  const callIdRef = useRef(null);
  const dialogIdRef = useRef(null);
  const timerRef = useRef(null);

  // Jitsi
  const jitsiApiRef = useRef(null); // JitsiMeetExternalAPI instance
  const jitsiContainerRef = useRef(null); // <div> куда монтируется Jitsi
  const joinedRef = useRef(false);

  // ─── STATE (UI) ─────────────────────────────────────────────────────────────
  const [callState, setCallState] = useState("idle"); // idle|ringing_out|ringing_in|active|ended
  const [callId, setCallId] = useState(null);
  const [callType, setCallType] = useState("audio");
  const [peerId, setPeerId] = useState(null);
  const [peerInfo, setPeerInfo] = useState(null);
  const [dialogId, setDialogId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [endedInfo, setEndedInfo] = useState(null);

  // ─── SYNC REFS ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (displayName) selfNameRef.current = displayName;
  }, [displayName]);
  useEffect(() => {
    callIdRef.current = callId;
  }, [callId]);
  useEffect(() => {
    dialogIdRef.current = dialogId;
  }, [dialogId]);
  useEffect(() => {
    durationSecRef.current = durationSec;
  }, [durationSec]);

  // ─── TIMER ──────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setDurationSec(0);
    durationSecRef.current = 0;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setDurationSec((s) => s + 1), 1000);
  }, []);
  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // ─── RINGTONE (входящий) ─────────────────────────────────────────────────────
  // Мелодия синтезируется в ringtone.js: файла /sounds/ringtone.mp3 в сборке
  // нет, и прежний Audio(...).play() молча отваливался 404 — входящий вызов
  // приходил беззвучно.
  useEffect(() => {
    if (callState === "ringing_in") startRingtone();
    else stopRingtone();
    return stopRingtone;
  }, [callState]);

  // ─── JITSI: DISPOSE ──────────────────────────────────────────────────────────
  const disposeJitsi = useCallback(() => {
    joinedRef.current = false;
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch (_) {}
      jitsiApiRef.current = null;
    }
    if (jitsiContainerRef.current) {
      jitsiContainerRef.current.innerHTML = "";
    }
  }, []);

  // ─── CLEANUP ─────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    stopTimer();
    disposeJitsi();
    setIsMuted(false);
  }, [stopTimer, disposeJitsi]);

  // ─── HANDLE END ──────────────────────────────────────────────────────────────
  const handleEnd = useCallback(
    (cId, reason) => {
      const id = cId || callIdRef.current;
      if (id) socket.emit("call:end", { callId: id });
      stopTimer();
      cleanup();
      const finalDuration = durationSecRef.current;
      setCallState("ended");
      setEndedInfo({ durationSec: finalDuration, reason });
      setTimeout(() => {
        setCallState("idle");
        setCallId(null);
        setPeerId(null);
        setPeerInfo(null);
        setDialogId(null);
        setDurationSec(0);
        durationSecRef.current = 0;
        setEndedInfo(null);
      }, 4000);
    },
    [socket, stopTimer, cleanup],
  );

  // ─── JITSI: MOUNT ROOM ───────────────────────────────────────────────────────
  // Монтирует Jitsi-комнату dialog-${dialogId}. Оба участника звонка вызывают
  // это с одним dialogId → попадают в одну комнату → медиа через JVB.
  const mountJitsiRoom = useCallback(
    async (dId, isVideo) => {
      try {
        await loadJitsiScript();

        // Токен на комнату dialog-${dId} через СУЩЕСТВУЮЩИЙ эндпоинт.
        // getDialogVideoToken шлёт POST /communication/video/token {kind:"dialog", id:dId}.
        const { token, domain, room } = await getDialogVideoToken(dId);

        // Ждём, пока контейнер появится в DOM (React мог ещё не отрендерить)
        const waitContainer = (attempt = 0) =>
          new Promise((resolve, reject) => {
            if (jitsiContainerRef.current)
              return resolve(jitsiContainerRef.current);
            if (attempt > 40)
              return reject(new Error("jitsiContainerRef never mounted"));
            setTimeout(
              () => waitContainer(attempt + 1).then(resolve, reject),
              75,
            );
          });
        const parentNode = await waitContainer();
        parentNode.innerHTML = "";

        // eslint-disable-next-line no-undef
        const api = new window.JitsiMeetExternalAPI(domain, {
          roomName: room,
          jwt: token,
          parentNode,
          width: "100%",
          height: "100%",
          userInfo: {
            // СВОЁ имя, а не собеседника: подпись видит вторая сторона.
            displayName: selfNameRef.current || "User",
          },
          configOverwrite: {
            // [FIX] Отключаем prejoin ДВУМЯ способами — старый флаг
            // prejoinPageEnabled в свежих версиях Jitsi игнорируется, нужен
            // prejoinConfig.enabled. Без этого участник застревал на экране
            // "Присоединиться к встрече" и НЕ входил в комнату → тишина.
            prejoinPageEnabled: false,
            prejoinConfig: { enabled: false },
            startWithAudioMuted: false,
            startWithVideoMuted: !isVideo, // аудиозвонок = видео замьючено
            // [FIX] startAudioOnly УБРАН — на мобильных он ломал аудио-дорожку.
            // Для аудиозвонка достаточно startWithVideoMuted: камера не
            // транслируется, а звук идёт нормально (как в видеозвонке).
            disableDeepLinking: true,
            disableInviteFunctions: true,
            toolbarButtons: isVideo
              ? ["microphone", "camera", "hangup", "tileview"]
              : ["microphone", "hangup"],
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            HIDE_INVITE_MORE_HEADER: true,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          },
        });

        jitsiApiRef.current = api;

        api.addEventListener("videoConferenceJoined", () => {
          joinedRef.current = true;
          console.log("📞 [jitsi-call] joined room:", room);
        });

        api.addEventListener("participantJoined", () => {
          console.log("📞 [jitsi-call] peer joined");
        });

        api.addEventListener("audioMuteStatusChanged", ({ muted }) => {
          setIsMuted(muted);
        });

        // Собеседник вышел / комната закрылась → завершаем звонок
        api.addEventListener("participantLeft", () => {
          console.log("📞 [jitsi-call] peer left → ending");
          handleEnd(callIdRef.current, "ended");
        });
        api.addEventListener("readyToClose", () => {
          console.log("📞 [jitsi-call] readyToClose → ending");
          handleEnd(callIdRef.current, "ended");
        });
        api.addEventListener("videoConferenceLeft", () => {
          console.log("📞 [jitsi-call] conference left");
        });
      } catch (err) {
        console.error("mountJitsiRoom error:", err);
        setEndedInfo({ durationSec: 0, reason: "failed" });
        setCallState("ended");
        cleanup();
        setTimeout(() => setCallState("idle"), 3000);
      }
    },
    // Имя участника берётся из ref — peerInfo здесь больше не нужен, и без
    // него функция не пересобирается посреди звонка (а вместе с ней и
    // подписка на socket-события ниже).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cleanup],
  );

  // ─── INITIATE (caller) ────────────────────────────────────────────────────────
  const initiateCall = useCallback(
    async ({
      targetDialogId,
      targetPeerId,
      peerName,
      peerAvatar,
      type = "audio",
    }) => {
      if (callState !== "idle") return;
      callTypeRef.current = type;
      setCallState("ringing_out");
      setPeerId(targetPeerId);
      setPeerInfo({ name: peerName, avatar: peerAvatar });
      setDialogId(targetDialogId);
      dialogIdRef.current = targetDialogId;
      setCallType(type);
      setIsVideoEnabled(type === "video");
      setEndedInfo(null);
      // Та же сигнализация, что и в P2P-версии — call.gateway это уже умеет
      socket.emit("call:initiate", {
        dialogId: targetDialogId,
        calleeId: targetPeerId,
        type,
      });
        track(CALL_STARTED, { callType: type, transport: "jitsi" });
    },
    [callState, socket],
  );

  // ─── ACCEPT (callee) ──────────────────────────────────────────────────────────
  const acceptCall = useCallback(
    async (incomingCallId) => {
      socket.emit("call:accept", { callId: incomingCallId });
      setCallState("active");
      startTimer();
      const isVideo = callTypeRef.current === "video";
      // Монтируем Jitsi-комнату dialog-${dialogId} — callee
      await mountJitsiRoom(dialogIdRef.current, isVideo);
    },
    [socket, startTimer, mountJitsiRoom],
  );

  // ─── DECLINE / CANCEL ──────────────────────────────────────────────────────────
  const declineCall = useCallback(
    (incomingCallId) => {
      const cId = incomingCallId || callIdRef.current;
      if (cId) socket.emit("call:decline", { callId: cId });
      cleanup();
      setCallState("idle");
      setCallId(null);
    },
    [socket, cleanup],
  );

  const cancelCall = useCallback(() => {
    const cId = callIdRef.current;
    if (cId) socket.emit("call:cancel", { callId: cId });
    cleanup();
    setCallState("idle");
    setCallId(null);
  }, [socket, cleanup]);

  // ─── END (public) ──────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    handleEnd(callIdRef.current, "ended");
  }, [handleEnd]);

  // ─── MUTE / VIDEO toggles (через Jitsi API) ─────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleAudio");
      // isMuted обновится в audioMuteStatusChanged
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleVideo");
      setIsVideoEnabled((v) => !v);
    }
  }, []);

  // ─── SOCKET EVENTS (сигнализация — совместима с call.gateway) ────────────────────
  useEffect(() => {
    if (!socket) return;

    // CALLER: получил callId → монтирует Jitsi (caller заходит в комнату)
    const onInitiated = async ({ callId: cId }) => {
      setCallId(cId);
      callIdRef.current = cId;
      const isVideo = callTypeRef.current === "video";
      // caller тоже заходит в dialog-${dialogId}; ждём пока callee примет —
      // но можно зайти сразу, Jitsi-комната ждёт второго участника
      await mountJitsiRoom(dialogIdRef.current, isVideo);
    };

    // CALLEE: входящий
    const onIncoming = ({
      callId: cId,
      dialogId: dId,
      callerId,
      callerInfo,
      type,
    }) => {
      if (callState !== "idle") {
        socket.emit("call:decline", { callId: cId });
        return;
      }
      const resolvedType = type || "audio";
      callTypeRef.current = resolvedType;
      setCallId(cId);
      callIdRef.current = cId;
      setDialogId(dId);
      dialogIdRef.current = dId;
      setPeerId(callerId);
      if (callerInfo) {
        setPeerInfo({
          name: callerInfo.name || callerInfo.firstName,
          avatar: callerInfo.avatar,
        });
      }
      setCallType(resolvedType);
      setIsVideoEnabled(resolvedType === "video");
      setCallState("ringing_in");
      setEndedInfo(null);
    };

    const onAccepted = () => {
      // callee принял — caller уже в комнате (зашёл на onInitiated), просто
      // переводим UI в active и стартуем таймер
      setCallState("active");
      startTimer();
    };

    const onDeclined = () => {
      cleanup();
      setCallState("ended");
      setEndedInfo({ durationSec: 0, reason: "declined" });
      setTimeout(() => {
        setCallState("idle");
        setCallId(null);
        setEndedInfo(null);
      }, 4000);
    };

    const onCancelled = () => {
      cleanup();
      setCallState("idle");
      setCallId(null);
    };

    const onNoAnswer = () => {
      cleanup();
      setCallState("ended");
      setEndedInfo({ durationSec: 0, reason: "no_answer" });
      setTimeout(() => {
        setCallState("idle");
        setCallId(null);
        setEndedInfo(null);
      }, 4000);
    };

    const onBusy = () => {
      cleanup();
      setCallState("ended");
      setEndedInfo({ durationSec: 0, reason: "busy" });
      setTimeout(() => {
        setCallState("idle");
        setCallId(null);
        setEndedInfo(null);
      }, 4000);
    };

    const onEnded = ({ durationSec: dur, reason }) => {
      stopTimer();
      cleanup();
      setCallState("ended");
      setEndedInfo({
        durationSec: dur ?? durationSecRef.current,
        reason: reason || "ended",
      });
      setTimeout(() => {
        setCallState("idle");
        setCallId(null);
        setPeerId(null);
        setPeerInfo(null);
        setDialogId(null);
        setDurationSec(0);
        durationSecRef.current = 0;
        setEndedInfo(null);
      }, 4000);
    };

    const onReconnect = () => {
      if (callIdRef.current) {
        cleanup();
        setCallState("idle");
        setCallId(null);
        setPeerId(null);
        setPeerInfo(null);
        setDialogId(null);
        setDurationSec(0);
        durationSecRef.current = 0;
        setEndedInfo(null);
        callTypeRef.current = "audio";
      }
    };

    socket.on("call:initiated", onInitiated);
    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:declined", onDeclined);
    socket.on("call:cancelled", onCancelled);
    socket.on("call:no_answer", onNoAnswer);
    socket.on("call:busy", onBusy);
    socket.on("call:ended", onEnded);
    socket.on("connect", onReconnect);

    return () => {
      socket.off("call:initiated", onInitiated);
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:declined", onDeclined);
      socket.off("call:cancelled", onCancelled);
      socket.off("call:no_answer", onNoAnswer);
      socket.off("call:busy", onBusy);
      socket.off("call:ended", onEnded);
      socket.off("connect", onReconnect);
    };
  }, [socket, callState, startTimer, stopTimer, cleanup, mountJitsiRoom]);

  // ─── FORMAT DURATION ─────────────────────────────────────────────────────────
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
    // состояние (совместимо с useCall)
    callState,
    callId,
    callType,
    peerId,
    peerInfo,
    dialogId,
    isMuted,
    durationSec,
    endedInfo,
    formattedDuration: formatDuration(durationSec),
    isVideoEnabled,
    // действия (совместимы с useCall)
    initiateCall,
    acceptCall,
    declineCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleVideo,
    // НОВОЕ: сюда монтируется Jitsi. В UII повесь <div ref={jitsiContainerRef} />
    // вместо <audio ref={remoteAudioRef} />. Для аудиозвонка div можно скрыть
    // (visibility:hidden — НЕ display:none, чтобы медиа не останавливалось),
    // для видео — показать на весь экран.
    jitsiContainerRef,
  };
}
