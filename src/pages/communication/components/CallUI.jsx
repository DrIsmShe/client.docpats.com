import React, { useEffect, useRef } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap');

  .call-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Nunito', sans-serif;
    animation: callFadeIn 0.3s ease;
  }
  @keyframes callFadeIn {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }
  .call-backdrop {
    position: absolute;
    inset: 0;
    background: linear-gradient(160deg, #0f2c3f 0%, #1a6b8a 50%, #0a1f2e 100%);
  }
  .call-remote-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    background: #000;
  }
  .call-video-dim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.35) 0%,
      transparent 35%,
      transparent 60%,
      rgba(0,0,0,0.55) 100%
    );
    z-index: 1;
    pointer-events: none;
  }
  .call-local-video-wrap {
    position: absolute;
    bottom: 130px;
    right: 20px;
    z-index: 10;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    border: 2px solid rgba(255,255,255,0.25);
    width: 110px;
    height: 160px;
    background: #111;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .call-local-video-wrap:hover { transform: scale(1.04); }
  .call-local-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
  }
  .call-local-video-off {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a2a35;
    color: rgba(255,255,255,0.4);
    font-size: 28px;
  }
  .call-card {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 48px 40px 40px;
    width: 320px;
    max-width: 92vw;
  }
  .call-overlay.has-video .call-card {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    padding-top: 28px;
    padding-bottom: 20px;
    gap: 10px;
  }
  .call-avatar-wrap {
    position: relative;
    margin-bottom: 8px;
  }
  .call-avatar-wrap.ringing::before,
  .call-avatar-wrap.ringing::after {
    content: '';
    position: absolute;
    inset: -12px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    animation: callPulse 2s ease infinite;
  }
  .call-avatar-wrap.ringing::after { animation-delay: 0.7s; }
  @keyframes callPulse {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(1.5); opacity: 0; }
  }
  .call-overlay.has-video .call-avatar-wrap { margin-bottom: 4px; }
  .call-overlay.has-video .call-avatar,
  .call-overlay.has-video .call-avatar-placeholder {
    width: 56px !important;
    height: 56px !important;
    font-size: 22px !important;
  }
  .call-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255,255,255,0.4);
  }
  .call-avatar-placeholder {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a6b8a, #2d9fc7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
    border: 3px solid rgba(255,255,255,0.4);
    color: white;
  }
  .call-name {
    font-size: 26px;
    font-weight: 700;
    color: #fff;
    text-align: center;
    letter-spacing: -0.3px;
    text-shadow: 0 1px 6px rgba(0,0,0,0.4);
  }
  .call-overlay.has-video .call-name { font-size: 18px; }
  .call-status {
    font-size: 14px;
    color: rgba(255,255,255,0.65);
    text-align: center;
    letter-spacing: 0.3px;
    min-height: 20px;
    text-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }
  .call-timer {
    font-size: 22px;
    font-weight: 300;
    color: rgba(255,255,255,0.9);
    letter-spacing: 2px;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 1px 6px rgba(0,0,0,0.5);
  }
  .call-overlay.has-video .call-timer { font-size: 15px; }
  .call-buttons {
    display: flex;
    gap: 24px;
    margin-top: 24px;
    align-items: center;
    justify-content: center;
  }
  .call-overlay.has-video .call-buttons {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 0;
    z-index: 11;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(12px);
    padding: 14px 24px;
    border-radius: 60px;
    gap: 20px;
  }
  .call-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    background: none;
    border: none;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .call-btn:hover { transform: scale(1.07); }
  .call-btn:active { transform: scale(0.96); }
  .call-btn-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
  }
  .call-overlay.has-video .call-btn-icon {
    width: 52px;
    height: 52px;
    font-size: 22px;
  }
  .call-btn-label {
    font-size: 11px;
    color: rgba(255,255,255,0.6);
    font-family: 'Nunito', sans-serif;
  }
  .btn-accept  .call-btn-icon { background: #22c55e; box-shadow: 0 4px 20px rgba(34,197,94,0.5); }
  .btn-decline .call-btn-icon { background: #ef4444; box-shadow: 0 4px 20px rgba(239,68,68,0.5); }
  .btn-end     .call-btn-icon { background: #ef4444; box-shadow: 0 4px 20px rgba(239,68,68,0.5); }
  .btn-mute    .call-btn-icon { background: rgba(255,255,255,0.15); }
  .btn-mute.active .call-btn-icon { background: rgba(239,68,68,0.3); }
  .btn-cancel  .call-btn-icon { background: #ef4444; box-shadow: 0 4px 20px rgba(239,68,68,0.5); }
  .btn-video     .call-btn-icon { background: rgba(255,255,255,0.15); }
  .btn-video.active .call-btn-icon { background: rgba(239,68,68,0.3); }
  .call-ended-info {
    font-size: 14px;
    color: rgba(255,255,255,0.55);
    text-align: center;
  }
  .call-ring-label {
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    animation: callBlink 1.2s ease infinite;
  }
  @keyframes callBlink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
  .call-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: rgba(255,255,255,0.6);
    background: rgba(255,255,255,0.1);
    padding: 3px 10px;
    border-radius: 12px;
    margin-top: -6px;
  }
  /* [MOBILE] подсказка тап для звука */
  .call-tap-hint {
    position: absolute;
    bottom: 110px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 12;
    font-size: 12px;
    color: rgba(255,255,255,0.5);
    background: rgba(0,0,0,0.3);
    padding: 4px 12px;
    border-radius: 20px;
    pointer-events: none;
    animation: callBlink 2s ease infinite;
  }
`;

function formatStatus(callState, endedInfo) {
  if (callState === "ringing_out") return "Вызов…";
  if (callState === "ringing_in") return "Входящий звонок";
  if (callState === "active") return "Звонок активен";
  if (callState === "ended") {
    if (!endedInfo) return "Звонок завершён";
    if (endedInfo.reason === "declined") return "Отклонено";
    if (endedInfo.reason === "no_answer") return "Нет ответа";
    if (endedInfo.reason === "busy") return "Абонент занят";
    if (endedInfo.reason === "failed") return "Ошибка соединения";
    return "Звонок завершён";
  }
  return "";
}

function formatDurLabel(sec) {
  if (!sec) return "";
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `Длительность: ${m}:${s}`;
}

export default function CallUI({
  callState,
  callType,
  peerInfo,
  isMuted,
  isVideoEnabled,
  formattedDuration,
  durationSec,
  endedInfo,
  remoteAudioRef,
  localVideoRef,
  remoteVideoRef,
  onAccept,
  onDecline,
  onCancel,
  onEnd,
  onToggleMute,
  onToggleVideo,
}) {
  // [MOBILE FIX] при tap на overlay — пробуем play() audio/video
  // iOS Safari блокирует autoplay без user gesture
  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    if (callState !== "active") return;

    const tryPlayAll = () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;

      if (remoteAudioRef.current && remoteAudioRef.current.paused) {
        remoteAudioRef.current.play().catch(() => {});
      }
      if (remoteVideoRef.current && remoteVideoRef.current.paused) {
        remoteVideoRef.current.play().catch(() => {});
      }
      if (localVideoRef.current && localVideoRef.current.paused) {
        localVideoRef.current.play().catch(() => {});
      }
    };

    // Сразу пробуем
    tryPlayAll();

    // На мобиле — повторяем при первом tap
    document.addEventListener("touchstart", tryPlayAll, { once: true });
    document.addEventListener("click", tryPlayAll, { once: true });

    return () => {
      document.removeEventListener("touchstart", tryPlayAll);
      document.removeEventListener("click", tryPlayAll);
    };
  }, [callState, remoteAudioRef, remoteVideoRef, localVideoRef]);

  // Сбрасываем unlock при новом звонке
  useEffect(() => {
    if (callState === "idle") {
      audioUnlockedRef.current = false;
    }
  }, [callState]);

  if (callState === "idle") return null;

  const isRinging = callState === "ringing_in" || callState === "ringing_out";
  const name = peerInfo?.name || "Unknown";
  const avatar = peerInfo?.avatar;

  const isVideoCall = callType === "video";
  const showRemoteVideo = isVideoCall && callState === "active";
  const showLocalVideo =
    isVideoCall && callState === "active" && isVideoEnabled;

  return (
    <>
      <style>{styles}</style>

      {/* [MOBILE FIX] audio: muted=false + playsInline обязательны */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        muted={false}
        style={{ display: "none" }}
      />

      <div className={`call-overlay${showRemoteVideo ? " has-video" : ""}`}>
        <div className="call-backdrop" />

        {/* remoteVideo: ВСЕГДА в DOM, muted — autoplay работает на мобиле */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted
          className="call-remote-video"
          style={{ display: showRemoteVideo ? "block" : "none" }}
        />
        {showRemoteVideo && <div className="call-video-dim" />}

        <div className="call-card">
          <div className={`call-avatar-wrap ${isRinging ? "ringing" : ""}`}>
            {avatar ? (
              <img src={avatar} alt={name} className="call-avatar" />
            ) : (
              <div className="call-avatar-placeholder">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="call-name">{name}</div>

          {isVideoCall && !showRemoteVideo && (
            <div className="call-type-badge">🎥 Видеозвонок</div>
          )}

          {callState === "active" ? (
            <div className="call-timer">{formattedDuration}</div>
          ) : callState === "ended" ? (
            <div className="call-ended-info">
              <div>{formatStatus(callState, endedInfo)}</div>
              {endedInfo?.durationSec > 0 && (
                <div style={{ marginTop: 4 }}>
                  {formatDurLabel(endedInfo.durationSec)}
                </div>
              )}
            </div>
          ) : (
            <div
              className={
                callState === "ringing_in" ? "call-ring-label" : "call-status"
              }
            >
              {formatStatus(callState, endedInfo)}
            </div>
          )}

          <div className="call-buttons">
            {callState === "ringing_in" && (
              <>
                <button className="call-btn btn-decline" onClick={onDecline}>
                  <div className="call-btn-icon">📵</div>
                  <span className="call-btn-label">Отклонить</span>
                </button>
                <button className="call-btn btn-accept" onClick={onAccept}>
                  <div className="call-btn-icon">
                    {isVideoCall ? "📹" : "📞"}
                  </div>
                  <span className="call-btn-label">Принять</span>
                </button>
              </>
            )}

            {callState === "ringing_out" && (
              <button className="call-btn btn-cancel" onClick={onCancel}>
                <div className="call-btn-icon">📵</div>
                <span className="call-btn-label">Отменить</span>
              </button>
            )}

            {callState === "active" && (
              <>
                <button
                  className={`call-btn btn-mute ${isMuted ? "active" : ""}`}
                  onClick={onToggleMute}
                >
                  <div className="call-btn-icon">{isMuted ? "🔇" : "🎙"}</div>
                  <span className="call-btn-label">
                    {isMuted ? "Включить" : "Выкл. mic"}
                  </span>
                </button>

                {isVideoCall && (
                  <button
                    className={`call-btn btn-video ${!isVideoEnabled ? "active" : ""}`}
                    onClick={onToggleVideo}
                  >
                    <div className="call-btn-icon">
                      {isVideoEnabled ? "📹" : "📷"}
                    </div>
                    <span className="call-btn-label">
                      {isVideoEnabled ? "Камера вкл" : "Камера выкл"}
                    </span>
                  </button>
                )}

                <button className="call-btn btn-end" onClick={onEnd}>
                  <div className="call-btn-icon">📵</div>
                  <span className="call-btn-label">Завершить</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* localVideo: ВСЕГДА в DOM при isVideoCall, скрыт до active */}
        {isVideoCall && (
          <div
            className="call-local-video-wrap"
            style={{
              display:
                callState === "active" || callState === "ringing_out"
                  ? "block"
                  : "none",
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="call-local-video"
              style={{ display: showLocalVideo ? "block" : "none" }}
            />
            {!showLocalVideo && <div className="call-local-video-off">📷</div>}
          </div>
        )}
      </div>
    </>
  );
}
