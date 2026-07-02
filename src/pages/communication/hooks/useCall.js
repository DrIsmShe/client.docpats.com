// client/src/pages/communication/hooks/useCall.js
//
// WebRTC Audio/Video Call Hook — FIXED v6
// Изменения v6 (для фикса "нет звука + обрыв через ~15 сек у ПРИНИМАЮЩЕГО"):
//   • [v6-FIX] Полностью убрана ручная буферизация callee-ICE в applyOffer
//     (флаг answerSent + pendingCalleeCandidates + двойное переопределение
//     pc.onicecandidate). Она создавала race condition: ICE gathering у callee
//     стартует АСИНХРОННО по setLocalDescription(answer) и генерирует кандидаты
//     ПОЗЖЕ момента flush → буфер всегда пустой ("Flushing 0 buffered callee ICE
//     candidates"), а переопределение onicecandidate терял последующие
//     кандидаты. Итог: callee не отправлял НИ ОДНОГО ICE-кандидата, PC никогда
//     не достигал "connected", соединение рвалось по ICE-таймауту (~15 сек).
//     Симптом: звонок caller→callee работает, а callee→caller "звука нет".
//   • Правильный trickle ICE: onicecandidate ставится ОДИН раз в createPC и
//     шлёт кандидаты сразу по мере генерации; входящие кандидаты от peer
//     буферизуются на приёмной стороне через onIce + remoteDescSet.
//     applyOffer теперь НЕ трогает onicecandidate вообще.
//
// Изменения v5 (для фикса невидимого видео):
//   • [v5-FIX A] Убраны legacy флаги offerToReceiveAudio/Video из createOffer().
//     Они создавали лишние recvonly transceivers ("3 sections" в SDP)
//     и провоцировали renegotiation → задержку answer ~30 секунд.
//   • [v5-FIX B] Убрана прямая мутация el.style.display из applyVideo —
//     теперь видимостью управляет ТОЛЬКО React (через visibility/opacity).
//     Это устраняет конфликт inline-style vs JSX-style и не останавливает
//     декодирование видео, когда трек ещё ожидается.
//
// Предыдущие исправления v4:
//   1. [FIX] callTypeRef синхронизируется при onIncoming (видеозвонок не деградирует в аудио)
//   2. [FIX] durationSecRef — handleEnd читает актуальную длительность, не stale closure
//   3. [FIX] handleEnd убран из deps useCallback → нет пересоздания каждую секунду
//   4. [FIX] disconnectTimer — graceful reconnect 5 сек перед завершением звонка
//   5. [FIX] callTypeRef синхронизируется при initiateCall
//   6. [FIX] onInitiated использует callTypeRef вместо stale callType state
//   7. [NEW] Ringtone при входящем звонке
//   8. [NEW] call:sync при реконнекте сокета

import { useState, useEffect, useRef, useCallback } from "react";
import { getSocket } from "../socket";

export function useCall(currentUserId) {
  const socket = getSocket();

  // ─── REFS (стабильны между рендерами) ───────────────────────────────────────
  const callTypeRef = useRef("audio"); // [FIX #1,#5,#6] единственный источник правды для типа звонка
  const durationSecRef = useRef(0); // [FIX #2] актуальная длительность для handleEnd
  const callIdRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);
  const disconnectTimerRef = useRef(null); // [FIX #4] graceful disconnect
  const ringtoneRef = useRef(null); // [NEW #7] ringtone при входящем

  // Буферизация WebRTC race conditions (из v3 — не трогаем)
  const pendingOfferRef = useRef(null);
  const pendingAnswerRef = useRef(null);
  const iceCandidateBuffer = useRef([]);
  const remoteDescSet = useRef(false);

  // ─── STATE (только для UI) ───────────────────────────────────────────────────
  const [callState, setCallState] = useState("idle");
  const [callId, setCallId] = useState(null);
  const [callType, setCallType] = useState("audio"); // только для UI/JSX
  const [peerId, setPeerId] = useState(null);
  const [peerInfo, setPeerInfo] = useState(null);
  const [dialogId, setDialogId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [endedInfo, setEndedInfo] = useState(null);

  // ─── СИНХРОНИЗАЦИЯ REFS ──────────────────────────────────────────────────────
  useEffect(() => {
    callIdRef.current = callId;
  }, [callId]);

  // [FIX #2] держим ref актуальным каждую секунду
  useEffect(() => {
    durationSecRef.current = durationSec;
  }, [durationSec]);

  // ─── TIMER ───────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setDurationSec(0);
    durationSecRef.current = 0;
    timerRef.current = setInterval(() => {
      setDurationSec((s) => s + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // ─── [NEW #7] RINGTONE ────────────────────────────────────────────────────────
  useEffect(() => {
    if (callState === "ringing_in") {
      try {
        // Положи файл в public/sounds/ringtone.mp3
        ringtoneRef.current = new Audio("/sounds/ringtone.mp3");
        ringtoneRef.current.loop = true;
        ringtoneRef.current.volume = 0.7;
        ringtoneRef.current.play().catch(() => {
          // Браузер может заблокировать до первого взаимодействия — ок
        });
      } catch (_) {}
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
        ringtoneRef.current = null;
      }
    }
  }, [callState]);

  // ─── CLEANUP ─────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    stopTimer();
    clearTimeout(disconnectTimerRef.current); // [FIX #4]
    disconnectTimerRef.current = null;

    pendingOfferRef.current = null;
    pendingAnswerRef.current = null;
    iceCandidateBuffer.current = [];
    remoteDescSet.current = false;

    if (pcRef.current) {
      pcRef.current.onconnectionstatechange = null; // предотвращаем handleEnd после cleanup
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef._fallbackEl) {
      try {
        remoteAudioRef._fallbackEl.remove();
      } catch (_) {}
      remoteAudioRef._fallbackEl = null;
    }
    setIsMuted(false);
  }, [stopTimer]);

  // ─── ICE FLUSH ───────────────────────────────────────────────────────────────
  const flushIceCandidates = useCallback(async (pc) => {
    const buf = iceCandidateBuffer.current;
    if (buf.length === 0) return;
    console.log(`🧊 Flushing ${buf.length} buffered ICE candidates`);
    iceCandidateBuffer.current = [];
    for (const candidate of buf) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("flushIce error:", err);
      }
    }
  }, []);

  // ─── APPLY OFFER ─────────────────────────────────────────────────────────────
  // [v6-FIX] Убрана вся ручная буферизация callee-ICE с флагом answerSent.
  // Она ломала соединение у ПРИНИМАЮЩЕЙ стороны: ICE gathering у callee стартует
  // асинхронно по setLocalDescription(answer) и генерирует кандидаты ПОЗЖЕ
  // момента flush → flush всегда пустой ("Flushing 0"), а переопределение
  // pc.onicecandidate терял последующие кандидаты → PC не достигал "connected"
  // → обрыв по ICE-таймауту (~15 сек), "звука нет".
  //
  // Правильный trickle ICE: callee-кандидаты шлём сразу как появляются — это
  // уже делает handler, установленный ОДИН раз в createPC. Входящие кандидаты
  // caller'а буферизуются на приёмной стороне через onIce + remoteDescSet.
  // Поэтому здесь onicecandidate НЕ трогаем вообще.
  const applyOffer = useCallback(
    async (pc, offer, cId) => {
      try {
        console.log("📥 Applying offer to PC...");
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSet.current = true;
        // применяем входящие ICE-кандидаты caller'а, накопленные до setRemoteDescription
        await flushIceCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("📤 Sending answer");
        socket.emit("call:answer", { callId: cId, answer });
        // onicecandidate уже установлен в createPC и шлёт callee-кандидаты
        // немедленно по мере их генерации — ручной буфер не нужен.
      } catch (err) {
        console.error("applyOffer error:", err);
      }
    },
    [socket, flushIceCandidates],
  );

  // ─── HANDLE END ──────────────────────────────────────────────────────────────
  // [FIX #2,#3] handleEnd больше не зависит от durationSec state
  // → не пересоздаётся каждую секунду → нет утечки обработчиков
  const handleEnd = useCallback(
    (cId, reason) => {
      const id = cId || callIdRef.current;
      if (id) socket.emit("call:end", { callId: id });
      stopTimer();
      cleanup();
      // [FIX #2] читаем ref — всегда актуальное значение
      const finalDuration = durationSecRef.current;
      setCallState("ended");
      setEndedInfo({ durationSec: finalDuration, reason });
      setTimeout(() => {
        setCallState("idle");
        setCallId(null);
        setPeerId(null);
        setPeerInfo(null);
        setDurationSec(0);
        durationSecRef.current = 0;
        setEndedInfo(null);
      }, 4000); // увеличено до 4 сек чтобы успеть прочитать
    },
    // [FIX #3] durationSec убран из deps — читаем через ref
    [socket, stopTimer, cleanup],
  );

  // ─── CREATE PC ───────────────────────────────────────────────────────────────
  const createPC = useCallback(
    (cId) => {
      // Собираем только валидные ICE серверы (пропускаем undefined из .env)
      const iceServers = [];

      if (process.env.REACT_APP_STUN_URL) {
        iceServers.push({ urls: process.env.REACT_APP_STUN_URL });
      } else {
        // Fallback: публичный Google STUN для локальной разработки
        iceServers.push({ urls: "stun:stun.l.google.com:19302" });
      }

      const turnUrls = [
        process.env.REACT_APP_TURN_URL1,
        process.env.REACT_APP_TURN_URL2,
        process.env.REACT_APP_TURN_URL3,
        process.env.REACT_APP_TURN_URL4,
      ].filter(Boolean); // убираем undefined/null/""

      for (const url of turnUrls) {
        iceServers.push({
          urls: url,
          username: process.env.REACT_APP_TURN_USERNAME,
          credential: process.env.REACT_APP_TURN_CREDENTIAL,
        });
      }

      console.log(
        "🧊 ICE servers:",
        iceServers.map((s) => s.urls),
      );

      const pc = new RTCPeerConnection({ iceServers });

      // Единственный источник ICE-кандидатов для ОБЕИХ ролей (caller и callee).
      // [v6-FIX] applyOffer больше НЕ переопределяет этот handler.
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit("call:ice", { callId: cId, candidate });
        }
      };

      // Храним remote стримы по треку — каждый элемент получает свой MediaStream
      const remoteAudioStream = new MediaStream();
      const remoteVideoStream = new MediaStream();

      pc.ontrack = (event) => {
        const track = event.track;
        console.log(
          "🎞 ontrack kind:",
          track.kind,
          "| id:",
          track.id.slice(0, 8),
        );

        if (track.kind === "video") {
          // Видео трек → только remoteVideoRef (отдельный MediaStream)
          remoteVideoStream.addTrack(track);

          const applyVideo = (attempt = 0) => {
            const el = remoteVideoRef.current;
            if (el) {
              el.srcObject = remoteVideoStream;
              el.muted = true; // звук идёт через remoteAudioRef
              el.autoplay = true;
              el.playsInline = true;
              // iOS Safari требует setAttribute для playsInline
              el.setAttribute("playsinline", "");
              el.setAttribute("webkit-playsinline", "");
              // [v5-FIX B] УБРАНО: el.style.display = "block";
              // Видимостью теперь управляет ТОЛЬКО React через visibility/opacity.
              // visibility:hidden (в отличие от display:none) не останавливает
              // декодирование видео, поэтому prinuditelno показывать элемент
              // отсюда больше не требуется.

              el.play()
                .then(() => {
                  console.log("📹 Remote video play() OK");
                })
                .catch((e) => {
                  console.warn("📹 play() blocked:", e?.message);
                  // iOS: retry on first gesture
                  const retryVideo = () => {
                    el.play().catch(() => {});
                    document.removeEventListener("touchstart", retryVideo);
                    document.removeEventListener("click", retryVideo);
                  };
                  document.addEventListener("touchstart", retryVideo, {
                    once: true,
                  });
                  document.addEventListener("click", retryVideo, {
                    once: true,
                  });
                });
            } else if (attempt < 30) {
              console.warn("⏳ remoteVideoRef not ready, retry", attempt + 1);
              setTimeout(() => applyVideo(attempt + 1), 100);
            } else {
              console.error("❌ remoteVideoRef never mounted");
            }
          };
          applyVideo();
        } else if (track.kind === "audio") {
          // Аудио трек → только remoteAudioRef (отдельный MediaStream)
          remoteAudioStream.addTrack(track);

          const applyAudio = (attempt = 0) => {
            const el = remoteAudioRef.current;
            if (el) {
              el.srcObject = remoteAudioStream;
              el.muted = false;
              el.volume = 1.0;
              el.autoplay = true;
              el.playsInline = true;

              const doPlay = () =>
                el
                  .play()
                  .then(() => console.log("🔊 Remote audio play() OK"))
                  .catch((e) => {
                    console.warn("🔊 play() blocked:", e?.message);
                    // iOS Safari: разблокируем через AudioContext при первом gesture
                    try {
                      const AudioCtx =
                        window.AudioContext || window.webkitAudioContext;
                      if (AudioCtx) {
                        const ctx = new AudioCtx();
                        const src =
                          ctx.createMediaStreamSource(remoteAudioStream);
                        src.connect(ctx.destination);
                        console.log("🔊 iOS AudioContext fallback applied");
                      }
                    } catch (ctxErr) {
                      console.warn("AudioContext fallback failed:", ctxErr);
                    }
                    // Повторяем play() при первом касании
                    const retryOnGesture = () => {
                      el.play().catch(() => {});
                      document.removeEventListener(
                        "touchstart",
                        retryOnGesture,
                      );
                      document.removeEventListener("click", retryOnGesture);
                    };
                    document.addEventListener("touchstart", retryOnGesture, {
                      once: true,
                    });
                    document.addEventListener("click", retryOnGesture, {
                      once: true,
                    });
                  });

              doPlay();
            } else if (attempt < 30) {
              setTimeout(() => applyAudio(attempt + 1), 100);
            } else {
              // Fallback: создаём Audio() вне React
              console.warn(
                "⚠️ remoteAudioRef never mounted — fallback Audio()",
              );
              const audio = document.createElement("audio");
              audio.srcObject = remoteAudioStream;
              audio.autoplay = true;
              audio.playsInline = true;
              audio.muted = false;
              audio.volume = 1.0;
              document.body.appendChild(audio);
              audio.play().catch(() => {});
              remoteAudioRef._fallbackEl = audio;
            }
          };
          applyAudio();
        }
      };

      // [FIX #4] graceful disconnect: ждём 5 сек перед завершением
      // (например при кратковременной потере сети — не рвём звонок сразу)
      pc.onconnectionstatechange = () => {
        console.log("🔗 PC state:", pc.connectionState);

        if (pc.connectionState === "connected") {
          console.log("✅ WebRTC P2P CONNECTED — audio should flow!");
          // Если был таймер отложенного завершения — отменяем
          clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
        }

        if (pc.connectionState === "disconnected") {
          console.warn("⚠️ PC disconnected — waiting 5s for recovery...");
          // [FIX #4] не завершаем сразу — даём шанс переподключиться
          disconnectTimerRef.current = setTimeout(() => {
            if (
              pcRef.current &&
              pcRef.current.connectionState !== "connected"
            ) {
              console.error("❌ PC recovery failed — ending call");
              handleEnd(cId, "failed");
            }
          }, 5000);
        }

        if (pc.connectionState === "failed") {
          clearTimeout(disconnectTimerRef.current);
          handleEnd(cId, "failed");
        }
      };

      pc.onicegatheringstatechange = () =>
        console.log("🧊 ICE gathering:", pc.iceGatheringState);
      pc.onsignalingstatechange = () =>
        console.log("📡 Signaling:", pc.signalingState);
      pc.oniceconnectionstatechange = () =>
        console.log("🧊 ICE conn:", pc.iceConnectionState);

      pcRef.current = pc;
      return pc;
    },
    // [FIX #3] handleEnd теперь стабилен — можно добавить в deps без проблем
    [socket, handleEnd],
  );

  // ─── GET LOCAL STREAM ────────────────────────────────────────────────────────
  const getLocalStream = useCallback(async (withVideo = false) => {
    console.log("🎤 Requesting media...", { withVideo });
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: withVideo,
    });
    console.log(
      "✅ Media granted:",
      stream.getAudioTracks().length,
      "audio",
      stream.getVideoTracks().length,
      "video",
    );
    localStreamRef.current = stream;
    if (withVideo) {
      setIsVideoEnabled(true);
      // Назначаем стрим с retry — React может ещё не отрендерить <video ref={localVideoRef}>
      const applyLocalStream = (attempt = 0) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.autoplay = true;
          localVideoRef.current.playsInline = true;
          localVideoRef.current.play?.().catch(() => {});
          console.log("📹 Local video stream applied");
        } else if (attempt < 20) {
          setTimeout(() => applyLocalStream(attempt + 1), 150);
        } else {
          console.warn("⚠️ localVideoRef never mounted");
        }
      };
      applyLocalStream();
    } else {
      setIsVideoEnabled(false);
    }
    return stream;
  }, []);

  // ─── TOGGLE VIDEO ────────────────────────────────────────────────────────────
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const tracks = localStreamRef.current.getVideoTracks();
    if (tracks.length === 0) return;
    const enabled = !tracks[0].enabled;
    tracks.forEach((t) => (t.enabled = enabled));
    setIsVideoEnabled(enabled);
  }, []);

  // ─── INITIATE CALL ───────────────────────────────────────────────────────────
  const initiateCall = useCallback(
    async ({
      targetDialogId,
      targetPeerId,
      peerName,
      peerAvatar,
      type = "audio",
    }) => {
      if (callState !== "idle") return;
      try {
        console.log("📞 Initiating call to:", targetPeerId, "type:", type);
        // [FIX #5] синхронизируем ref с type до любых async операций
        callTypeRef.current = type;
        setCallState("ringing_out");
        setPeerId(targetPeerId);
        setPeerInfo({ name: peerName, avatar: peerAvatar });
        setDialogId(targetDialogId);
        setCallType(type);
        setEndedInfo(null);
        socket.emit("call:initiate", {
          dialogId: targetDialogId,
          calleeId: targetPeerId,
          type,
        });
      } catch (err) {
        console.error("initiateCall error:", err);
        setCallState("idle");
      }
    },
    [callState, socket],
  );

  // ─── CANCEL CALL ─────────────────────────────────────────────────────────────
  const cancelCall = useCallback(() => {
    const cId = callIdRef.current;
    if (cId) socket.emit("call:cancel", { callId: cId });
    cleanup();
    setCallState("idle");
    setCallId(null);
  }, [socket, cleanup]);

  // ─── ACCEPT CALL ─────────────────────────────────────────────────────────────
  const acceptCall = useCallback(
    async (incomingCallId) => {
      try {
        console.log(
          "✅ Accepting call:",
          incomingCallId,
          "type:",
          callTypeRef.current,
        );
        socket.emit("call:accept", { callId: incomingCallId });
        setCallState("active");
        startTimer();

        let stream;
        try {
          // callTypeRef.current гарантированно актуален благодаря FIX #1
          const withVideo = callTypeRef.current === "video";
          stream = await getLocalStream(withVideo);
          if (withVideo && localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (err) {
          if (err.name === "NotReadableError" || err.name === "NotFoundError") {
            console.warn(
              "⚠️ Camera busy/unavailable — audio only, UI stays video mode",
            );
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
            // НЕ меняем callType — UI остаётся в video режиме,
            // чтобы remoteVideoRef был в DOM для приёма видео от собеседника
            setIsVideoEnabled(false);
          } else {
            throw err;
          }
        }

        const pc = createPC(incomingCallId);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        console.log("🎤 Callee: tracks added to PC");

        if (pendingOfferRef.current) {
          console.log("🔄 Applying buffered offer immediately!");
          const { offer, callId: offerCallId } = pendingOfferRef.current;
          pendingOfferRef.current = null;
          await applyOffer(pc, offer, offerCallId);
        } else {
          console.log("⏳ Waiting for offer from caller...");
        }
      } catch (err) {
        console.error("acceptCall error:", err);
        declineCall(incomingCallId);
      }
    },
    [socket, startTimer, getLocalStream, createPC, applyOffer],
  );

  // ─── DECLINE CALL ────────────────────────────────────────────────────────────
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

  // ─── END CALL (публичный) ────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    handleEnd(callIdRef.current, "ended");
  }, [handleEnd]);

  // ─── TOGGLE MUTE ─────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((m) => !m);
  }, []);

  // ─── SOCKET EVENTS ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // CALLER: получил callId → создаёт offer
    const onInitiated = async ({ callId: cId }) => {
      console.log("📞 call:initiated:", cId);
      setCallId(cId);
      callIdRef.current = cId;
      try {
        // [FIX #6] используем ref, а не stale callType state
        const isVideo = callTypeRef.current === "video";
        const stream = await getLocalStream(isVideo);
        // [FIX #6] и здесь тоже ref
        if (isVideo && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        const pc = createPC(cId);
        if (pendingAnswerRef.current) {
          console.log("🔄 Applying buffered answer");
          await pc.setRemoteDescription(
            new RTCSessionDescription(pendingAnswerRef.current),
          );
          pendingAnswerRef.current = null;
        }
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        console.log("📤 Creating offer...");
        // [v5-FIX A] createOffer() БЕЗ legacy флагов offerToReceiveAudio/Video.
        // Эти флаги — pre-unified-plan API (Chrome <72), они создают лишние
        // recvonly transceivers ("3 m=sections" вместо нужных 2),
        // что провоцирует Chrome на munged renegotiation и задержку answer.
        // Bidirectional передача обеспечивается уже добавленными pc.addTrack().
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call:offer", { callId: cId, offer });
        console.log("📤 Offer sent");
      } catch (err) {
        console.error("onInitiated error:", err);
        cancelCall();
      }
    };

    // CALLEE: входящий звонок
    const onIncoming = ({
      callId: cId,
      dialogId: dId,
      callerId,
      callerInfo,
      type,
    }) => {
      console.log("📲 call:incoming:", cId, "from:", callerId, "type:", type);
      if (callState !== "idle") {
        socket.emit("call:decline", { callId: cId });
        return;
      }
      const resolvedType = type || "audio";
      // [FIX #1] ОБЯЗАТЕЛЬНО синхронизируем ref при входящем звонке
      callTypeRef.current = resolvedType;

      setCallId(cId);
      callIdRef.current = cId;
      setDialogId(dId);
      setPeerId(callerId);
      if (callerInfo) {
        setPeerInfo({
          name: callerInfo.name || callerInfo.firstName,
          avatar: callerInfo.avatar,
        });
      }
      setCallType(resolvedType);
      setCallState("ringing_in");
      setEndedInfo(null);
    };

    // CALLER: callee принял
    const onAccepted = () => {
      console.log("✅ call:accepted — caller starts timer");
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

    // CALLEE: получает offer
    const onOffer = async ({ callId: cId, offer }) => {
      console.log("📥 call:offer received, PC exists:", !!pcRef.current);
      if (!pcRef.current) {
        console.log("🔄 Buffering offer — waiting for acceptCall to create PC");
        pendingOfferRef.current = { offer, callId: cId };
        return;
      }
      await applyOffer(pcRef.current, offer, cId);
    };

    // CALLER: получает answer
    const onAnswer = async ({ answer }) => {
      console.log("📥 call:answer received");
      const pc = pcRef.current;
      if (!pc) {
        console.log("⏳ Buffering answer — waiting for PC");
        pendingAnswerRef.current = answer;
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        remoteDescSet.current = true;
        console.log("✅ Remote desc set (caller)");
        await flushIceCandidates(pc);
      } catch (err) {
        console.error("onAnswer error:", err);
      }
    };

    // ICE candidates
    const onIce = async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc || !candidate) return;
      if (!remoteDescSet.current) {
        iceCandidateBuffer.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("onIce error:", err);
      }
    };

    const onEnded = ({ durationSec: dur, reason }) => {
      stopTimer();
      cleanup();
      setCallState("ended");
      setEndedInfo({ durationSec: dur ?? 0, reason: reason || "ended" });
      setTimeout(() => {
        setCallState("idle");
        setCallId(null);
        setPeerId(null);
        setPeerInfo(null);
        setDurationSec(0);
        durationSecRef.current = 0;
        setEndedInfo(null);
      }, 4000);
    };

    // [NEW #8] При реконнекте сокета — сбрасываем зависший стейт
    const onReconnect = () => {
      console.log("🔄 Socket reconnected");
      // Если были в звонке — сервер потерял сессию, сбрасываем на клиенте
      if (callIdRef.current) {
        console.warn("⚠️ Call state reset after socket reconnect");
        cleanup();
        setCallState("idle");
        setCallId(null);
        setPeerId(null);
        setPeerInfo(null);
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
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice", onIce);
    socket.on("call:ended", onEnded);
    socket.on("connect", onReconnect); // [NEW #8]

    return () => {
      socket.off("call:initiated", onInitiated);
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:declined", onDeclined);
      socket.off("call:cancelled", onCancelled);
      socket.off("call:no_answer", onNoAnswer);
      socket.off("call:busy", onBusy);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice", onIce);
      socket.off("call:ended", onEnded);
      socket.off("connect", onReconnect); // [NEW #8]
    };
  }, [
    socket,
    callState,
    startTimer,
    stopTimer,
    cleanup,
    createPC,
    getLocalStream,
    cancelCall,
    applyOffer,
    flushIceCandidates,
    // handleEnd убран — он теперь стабилен и используется внутри createPC
  ]);

  // ─── FORMAT DURATION ─────────────────────────────────────────────────────────
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
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
    remoteAudioRef,
    initiateCall,
    acceptCall,
    declineCall,
    cancelCall,
    endCall,
    toggleMute,
    localVideoRef,
    remoteVideoRef,
    isVideoEnabled,
    toggleVideo,
  };
}
