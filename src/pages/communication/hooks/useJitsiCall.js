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
//   • Эндпоинт токена: POST /communication/video/token { kind:"call", id:callId }
//     → { token, domain, room }, где room = `call-${callId}`.
//     Комната принадлежит ЗВОНКУ, а не диалогу: список допущенных ведёт
//     сигнализация и пополняет его при каждом приглашении. На dialog-комнате
//     конференция была невозможна — пропуск туда получают только участники
//     переписки, а приглашённый третий в чужой переписке не состоит.
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
// ВАЖНО про токен: хук вызывает getCallVideoToken(callId) из videoApi —
// POST /communication/video/token {kind:"call", id} → { token, domain, room }.

import { useState, useEffect, useRef, useCallback } from "react";
import { getSocket } from "../socket";
import { getCallVideoToken } from "../../../api/videoApi";
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
  // Судьба приглашений — ПО КАЖДОМУ человеку, а не одна на всех.
  // Одно общее поле врало начиная с четвёртого участника: позвали
  // второго — статус первого терялся, его кнопка снова становилась
  // активной, и «в разговоре» рядом с ним не показывалось.
  // { [userId]: "ringing" | "joined" | "declined" | "no_answer" | "busy" | ... }
  const [inviteStatus, setInviteStatus] = useState({});
  // Сколько человек в разговоре. Приходит с сервера: считать на клиенте
  // нельзя — приглашённый не получает события о собственном входе и
  // остался бы с единицей, сидя втроём.
  const [participantCount, setParticipantCount] = useState(1);

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

  // Состояние конференции сбрасываем в одном месте, а не в каждом из
  // четырёх путей завершения звонка — иначе счётчик участников однажды
  // переживёт звонок и следующий разговор начнётся с «трое в комнате».
  useEffect(() => {
    if (callState === "idle") {
      setParticipantCount(1);
      setInviteStatus({});
    }
  }, [callState]);

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
    async (cId, isVideo) => {
      try {
        await loadJitsiScript();

        // Комната ЗВОНКА, а не диалога: POST /communication/video/token
        // {kind:"call", id:callId}.
        //
        // Раньше здесь была dialog-${dialogId}, и это делало конференцию
        // невозможной: пропуск в такую комнату выдаётся только участникам
        // переписки, а приглашённый третий человек в чужой личной переписке
        // не состоит. Список допущенных в комнату звонка ведёт сигнализация
        // и пополняет его при каждом приглашении.
        const { token, domain, room } = await getCallVideoToken(cId);

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
            // Приглашение средствами Jitsi ОСТАЁТСЯ выключенным, и это не
            // недосмотр. Наш Jitsi поднят с JWT-авторизацией: пропуск в
            // комнату выдаёт только сервер и только участнику диалога
            // (video.controller.js). Ссылка из джитсёвого «Пригласить»
            // токена не несёт, и приглашённый упрётся в отказ. Кнопка,
            // ведущая в тупик, хуже отсутствующей.
            // Третий участник добавляется групповым диалогом — там пропуск
            // получает каждый участник.
            disableInviteFunctions: true,

            // Панель — родная джитсёвая, а не четыре кнопки. Убраны
            // запись и трансляция: разговор врача с пациентом — это PHI,
            // и его запись мимо нашего аудита и шифрования недопустима.
            // Запись приёма в проекте своя, со своим согласием и хранением.
            //
            // УБРАН ТАКЖЕ ПОЛНЫЙ ЭКРАН, и это не вкусовщина. Кнопка Jitsi
            // разворачивает документ ВНУТРИ iframe, а браузер поднимает
            // сам iframe в top layer: всё, что мы рисуем рядом с ним —
            // панель записи приёма и кнопка «+ Участник» — просто
            // перестаёт отрисовываться. Врач жал полный экран и терял
            // запись приёма. Полный экран даёт своя кнопка в CallUI: она
            // разворачивает оверлей целиком, вместе с панелью.
            toolbarButtons: isVideo
              ? [
                  "microphone",
                  "camera",
                  "desktop",
                  "tileview",
                  "participants-pane",
                  "raisehand",
                  "videoquality",
                  "filmstrip",
                  "settings",
                  "hangup",
                ]
              : [
                  "microphone",
                  "participants-pane",
                  "raisehand",
                  "settings",
                  "hangup",
                ],
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

        // Кто-то вышел. Завершаем звонок, только когда в комнате не осталось
        // никого, кроме нас.
        //
        // Раньше здесь стоял безусловный handleEnd, и это делало разговор
        // строго парным: в конференции втроём выход одного клал связь у
        // оставшихся двоих. Для звонка один-на-один поведение не меняется —
        // ушёл собеседник, счётчик стал 1, звонок завершается как прежде.
        api.addEventListener("participantLeft", () => {
          let left = 0;
          try {
            left = api.getNumberOfParticipants();
          } catch (_) {
            // Метода нет в этой сборке Jitsi — считаем комнату пустой,
            // то есть ведём себя как раньше. Хуже прежнего не станет.
            left = 1;
          }
          console.log("📞 [jitsi-call] participant left, осталось:", left);
          if (left <= 1) handleEnd(callIdRef.current, "ended");
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
      // Комната звонка — та же и у звонящего, и у принявшего.
      await mountJitsiRoom(incomingCallId, isVideo);
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
      // Звонящий заходит в комнату сразу, не дожидаясь ответа: Jitsi
      // спокойно ждёт остальных.
      await mountJitsiRoom(cId, isVideo);
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

    const markInvite = (who, state) =>
      setInviteStatus((prev) => ({ ...prev, [String(who)]: state }));

    // Состав приходит с сервера целиком — он единственный, кто знает
    // правду обо всех сторонах разговора.
    const onParticipants = ({ count }) => {
      if (typeof count === "number") setParticipantCount(Math.max(1, count));
    };
    const onParticipantJoined = ({ userId: who }) => markInvite(who, "joined");
    const onParticipantLeft = ({ userId: who }) => markInvite(who, "left");
    const onParticipantDeclined = ({ userId: who }) =>
      markInvite(who, "declined");
    const onParticipantNoAnswer = ({ userId: who }) =>
      markInvite(who, "no_answer");
    const onInviteFailed = ({ userId: who, reason }) =>
      markInvite(who, reason || "failed");

    socket.on("call:participants", onParticipants);
    socket.on("call:participant_joined", onParticipantJoined);
    socket.on("call:participant_left", onParticipantLeft);
    socket.on("call:participant_declined", onParticipantDeclined);
    socket.on("call:participant_no_answer", onParticipantNoAnswer);
    socket.on("call:invite_failed", onInviteFailed);
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
      socket.off("call:participants", onParticipants);
      socket.off("call:participant_joined", onParticipantJoined);
      socket.off("call:participant_left", onParticipantLeft);
      socket.off("call:participant_declined", onParticipantDeclined);
      socket.off("call:participant_no_answer", onParticipantNoAnswer);
      socket.off("call:invite_failed", onInviteFailed);
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

  // ─── ПРИГЛАШЕНИЕ В ИДУЩИЙ РАЗГОВОР ──────────────────────────────────────────
  //
  // dialogId здесь — личная переписка С ПРИГЛАШАЕМЫМ, а не диалог, из
  // которого начали звонок. По ней сервер и проверяет право позвать:
  // добавить можно того, с кем переписка уже есть. Без этой привязки
  // кнопка «добавить» стала бы способом звонить кому угодно по id.
  const inviteParticipant = useCallback(
    ({ userId: inviteeId, dialogId: peerDialogId }) => {
      const cId = callIdRef.current;
      if (!cId || !inviteeId || !peerDialogId) return;
      socket.emit("call:invite", {
        callId: cId,
        userId: inviteeId,
        dialogId: peerDialogId,
      });
      setInviteStatus((prev) => ({ ...prev, [String(inviteeId)]: "ringing" }));
    },
    [socket],
  );

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
    // Конференция
    inviteParticipant,
    inviteStatus,
    participantCount,
    // НОВОЕ: сюда монтируется Jitsi. В UII повесь <div ref={jitsiContainerRef} />
    // вместо <audio ref={remoteAudioRef} />. Для аудиозвонка div можно скрыть
    // (visibility:hidden — НЕ display:none, чтобы медиа не останавливалось),
    // для видео — показать на весь экран.
    jitsiContainerRef,
  };
}
