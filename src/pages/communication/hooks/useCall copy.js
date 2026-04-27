// client/src/pages/communication/hooks/useCall.js
//
// WebRTC Audio Call Hook — FIXED v3
// Ключевые фиксы:
//   1. Offer буферизуется если PC ещё не создан (offer приходит ДО acceptCall)
//   2. ICE кандидаты буферизуются пока remoteDescription не установлен
//   3. Fallback Audio() если remoteAudioRef не в DOM в момент ontrack

import { useState, useEffect, useRef, useCallback } from "react";
import { getSocket } from "../socket";

export function useCall(currentUserId) {
  const socket = getSocket();
  const callTypeRef = useRef("audio");
  const [callState, setCallState] = useState("idle");
  const [callId, setCallId] = useState(null);
  const [callType, setCallType] = useState("audio");
  const [peerId, setPeerId] = useState(null);
  const [peerInfo, setPeerInfo] = useState(null);
  const [dialogId, setDialogId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [endedInfo, setEndedInfo] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);
  const callIdRef = useRef(null);

  // ✅ FIX 1: буферизуем offer если PC ещё не создан
  const pendingOfferRef = useRef(null);
  const pendingAnswerRef = useRef(null);
  // ✅ FIX 2: буферизуем ICE если remoteDescription не установлен
  const iceCandidateBuffer = useRef([]);
  const remoteDescSet = useRef(false);

  useEffect(() => {
    callIdRef.current = callId;
  }, [callId]);

  const startTimer = useCallback(() => {
    setDurationSec(0);
    timerRef.current = setInterval(() => {
      setDurationSec((s) => s + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  const cleanup = useCallback(() => {
    stopTimer();
    pendingOfferRef.current = null;
    iceCandidateBuffer.current = [];
    remoteDescSet.current = false;
    if (pcRef.current) {
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
    // Убрать fallback audio если был создан
    if (remoteAudioRef._fallbackEl) {
      try {
        remoteAudioRef._fallbackEl.remove();
      } catch (_) {}
      remoteAudioRef._fallbackEl = null;
    }
    setIsMuted(false);
  }, [stopTimer]);

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

  const applyOffer = useCallback(
    async (pc, offer, cId) => {
      try {
        console.log("📥 Applying offer to PC...");
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSet.current = true;
        await flushIceCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("📤 Sending answer");
        socket.emit("call:answer", { callId: cId, answer });
      } catch (err) {
        console.error("applyOffer error:", err);
      }
    },
    [socket, flushIceCandidates],
  );

  const createPC = useCallback(
    (cId) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: process.env.REACT_APP_STUN_URL },

          {
            urls: process.env.REACT_APP_TURN_URL1,
            username: process.env.REACT_APP_TURN_USERNAME,
            credential: process.env.REACT_APP_TURN_CREDENTIAL,
          },
          {
            urls: process.env.REACT_APP_TURN_URL2,
            username: process.env.REACT_APP_TURN_USERNAME,
            credential: process.env.REACT_APP_TURN_CREDENTIAL,
          },
          {
            urls: process.env.REACT_APP_TURN_URL3,
            username: process.env.REACT_APP_TURN_USERNAME,
            credential: process.env.REACT_APP_TURN_CREDENTIAL,
          },
          {
            urls: process.env.REACT_APP_TURN_URL4,
            username: process.env.REACT_APP_TURN_USERNAME,
            credential: process.env.REACT_APP_TURN_CREDENTIAL,
          },
        ],
      });

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit("call:ice", { callId: cId, candidate });
        }
      };

      // ✅ FIX 3: fallback Audio() если ref не в DOM
      pc.ontrack = (event) => {
        console.log(
          "🔊 ontrack! streams:",
          event.streams?.length || 0,
          "kind:",
          event.track?.kind,
        );

        let stream = event.streams?.[0] || new MediaStream([event.track]);

        if (!stream && event.track) {
          stream = new MediaStream([event.track]);
        }

        if (!stream) return;

        if (event.track.kind === "video") {
          console.log("📹 Remote video received");

          const stream = event.streams?.[0] || new MediaStream([event.track]);

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            remoteVideoRef.current.autoplay = true;
            remoteVideoRef.current.playsInline = true;
            remoteVideoRef.current.muted = true;

            setTimeout(() => {
              remoteVideoRef.current
                .play()
                .catch((e) => console.warn("video play blocked:", e?.message));
            }, 0);
          }

          return;
        }
        // AUDIO
        if (remoteAudioRef.current) {
          console.log("✅ Playing audio via remoteAudioRef");

          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.autoplay = true;
          remoteAudioRef.current.playsInline = true;
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1.0;

          remoteAudioRef.current
            .play()
            .then(() => console.log("🔊 remote audio play() success"))
            .catch((e) => console.warn("⚠️ play() blocked:", e.message));
        } else {
          console.warn("⚠️ remoteAudioRef null — fallback Audio()");

          const audio = document.createElement("audio");
          audio.srcObject = stream;
          audio.autoplay = true;
          audio.playsInline = true;
          audio.muted = false;
          audio.volume = 1.0;

          document.body.appendChild(audio);

          audio.play().catch(() => {});

          remoteAudioRef._fallbackEl = audio;
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("🔗 PC state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          console.log("✅ WebRTC P2P CONNECTED — audio should flow!");
        }
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
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
    [socket],
  );

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

    if (withVideo && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      localVideoRef.current.autoplay = true;
      localVideoRef.current.playsInline = true;

      localVideoRef.current.play?.().catch(() => {});

      setIsVideoEnabled(true);
    } else {
      setIsVideoEnabled(false);
    }

    return stream;
  }, []);
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;

    const tracks = localStreamRef.current.getVideoTracks();

    if (tracks.length === 0) return;

    const enabled = !tracks[0].enabled;

    tracks.forEach((t) => (t.enabled = enabled));

    setIsVideoEnabled(enabled);
  }, []);
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
        console.log("📞 Initiating call to:", targetPeerId);
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

  const cancelCall = useCallback(() => {
    const cId = callIdRef.current;
    if (cId) socket.emit("call:cancel", { callId: cId });
    cleanup();
    setCallState("idle");
    setCallId(null);
  }, [socket, cleanup]);

  // ✅ FIX: acceptCall создаёт PC и сразу применяет pendingOffer если уже пришёл
  const acceptCall = useCallback(
    async (incomingCallId) => {
      try {
        console.log("✅ Accepting call:", incomingCallId);
        socket.emit("call:accept", { callId: incomingCallId });
        setCallState("active");
        startTimer();
        let stream;

        try {
          const withVideo = callTypeRef.current === "video";
          stream = await getLocalStream(withVideo);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (err) {
          if (err.name === "NotReadableError") {
            console.warn("Camera busy, falling back to audio");

            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });

            setCallType("audio");
          } else {
            throw err;
          }
        }
        const pc = createPC(incomingCallId);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        console.log("🎤 Callee: tracks added to PC");

        // ✅ КЛЮЧЕВОЙ ФИX: если offer уже пришёл пока мы принимали — применяем сразу
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

  const handleEnd = useCallback(
    (cId, reason) => {
      const id = cId || callIdRef.current;
      if (id) socket.emit("call:end", { callId: id });
      stopTimer();
      cleanup();
      setCallState("ended");
      setEndedInfo({ durationSec, reason });
      setTimeout(() => {
        setCallState("idle");
        setCallId(null);
        setPeerId(null);
        setPeerInfo(null);
        setDurationSec(0);
        setEndedInfo(null);
      }, 3000);
    },
    [socket, stopTimer, cleanup, durationSec],
  );

  const endCall = useCallback(() => {
    handleEnd(callIdRef.current, "ended");
  }, [handleEnd]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((m) => !m);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // CALLER: получил callId → создаёт offer
    const onInitiated = async ({ callId: cId }) => {
      console.log("📞 call:initiated:", cId);
      setCallId(cId);
      callIdRef.current = cId;
      try {
        const stream = await getLocalStream(callTypeRef.current === "video");
        if (callType === "video" && localVideoRef.current) {
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
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
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
      console.log("📲 call:incoming:", cId, "from:", callerId);
      if (callState !== "idle") {
        socket.emit("call:decline", { callId: cId });
        return;
      }
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
      setCallType(type || "audio");
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
      }, 3000);
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
      }, 3000);
    };

    const onBusy = () => {
      cleanup();
      setCallState("ended");
      setEndedInfo({ durationSec: 0, reason: "busy" });
      setTimeout(() => {
        setCallState("idle");
        setCallId(null);
        setEndedInfo(null);
      }, 3000);
    };

    // CALLEE: получает offer
    const onOffer = async ({ callId: cId, offer }) => {
      console.log("📥 call:offer received, PC exists:", !!pcRef.current);
      if (!pcRef.current) {
        // ✅ ФИX: PC ещё не создан (пользователь не нажал "Принять") — буферизуем offer
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

    // ICE candidates — буферизуем если remoteDesc не установлен
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
        setEndedInfo(null);
      }, 3000);
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
  ]);

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
