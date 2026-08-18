// client/src/pages/communication/components/CallUI.jsx
//
// ═══════════════════════════════════════════════════════════════════════════
// CallUI — версия под JITSI (работает с useJitsiCall)
// ═══════════════════════════════════════════════════════════════════════════
//
// Что изменилось относительно P2P-версии (v5):
//   • Убраны <audio ref={remoteAudioRef}>, <video ref={remoteVideoRef}>,
//     <video ref={localVideoRef}> и вся ручная play()-логика — теперь медиа
//     рендерит Jitsi внутри своего контейнера (jitsiContainerRef).
//   • Добавлен ОДИН контейнер <div ref={jitsiContainerRef}> — сюда
//     useJitsiCall монтирует JitsiMeetExternalAPI.
//       - АУДИОЗВОНОК: контейнер скрыт (visibility:hidden, 1px) — слышно звук,
//         а сверху рисуется твой красивый UI (аватар/таймер/кнопки).
//       - ВИДЕОЗВОНОК: контейнер на весь экран (Jitsi показывает видео),
//         сверху — панель с именем/таймером и твои кнопки управления.
//   • Кнопки mute/end/toggleVideo дёргают те же onToggleMute/onEnd/onToggleVideo,
//     но в useJitsiCall они вызывают Jitsi API (executeCommand), а не P2P-треки.
//
// ⚠️ visibility:hidden (НЕ display:none) для скрытого контейнера — чтобы Jitsi
//    продолжал прокачивать аудио. display:none может остановить медиа.
//
// Дизайн (стили, аватар, кнопки, backdrop) — сохранён 1:1 из v5.

import React, { useRef, useState, useEffect, Suspense, lazy } from "react";

// Лениво: CallUI живёт ВНЕ <Routes> и потому целиком лежит во входном
// бандле. Панель записи нужна только в активном звонке, а входной бандл
// грузят все — включая посетителей публичных страниц, у которых звонков
// нет вовсе. Локальная граница Suspense здесь безопасна: до звонка
// CallUI возвращает null и грузить нечего.
const ScribePanel = lazy(() => import("./ScribePanel"));

const styles = `
  /* Панель записи приёма. Отдельный слой над всем содержимым оверлея:
     z-index выше карточки (3) и кнопок (5), pointer-events возвращён —
     внутри карточки во время видео он выключен, и кнопка не нажималась.
     Прижата к низу: верх занят панелью самого Jitsi. */
  .call-scribe {
    position: absolute;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    z-index: 10;
    pointer-events: auto;
    width: min(560px, 92vw);
    text-align: left;
  }
  /* В аудиозвонке кнопки завершения стоят по центру снизу — поднимаем
     панель над ними, чтобы не перекрывала «положить трубку». */
  .call-overlay:not(.has-video) .call-scribe {
    bottom: 120px;
  }

  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap');

  .call-overlay {
    position: fixed;
    inset: 0;
    /* [FULLSCREEN] Гарантируем весь экран на ВСЕХ устройствах.
       На мобильных 100% высоты ломается из-за динамической адресной строки —
       используем 100dvh (dynamic viewport height), с fallback на 100vh. */
    width: 100vw;
    width: 100dvw;
    height: 100vh;
    height: 100dvh;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Nunito', sans-serif;
    animation: callFadeIn 0.3s ease;
    isolation: isolate;
    overflow: hidden;
  }
  @keyframes callFadeIn {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }
  /*
    [FIX] backdrop по умолчанию — самый нижний слой (видеозвонок).
    Для АУДИО backdrop поднимается НАД Jitsi-контейнером (класс on-top),
    чтобы непрозрачно накрыть его: Jitsi продолжает играть звук (он видим и
    полноразмерен, не заглушён), но визуально скрыт под backdrop'ом, и
    пользователь видит твой аудио-UI (аватар/кнопки).
  */
  .call-backdrop {
    position: absolute;
    inset: 0;
    background: linear-gradient(160deg, #0f2c3f 0%, #1a6b8a 50%, #0a1f2e 100%);
    z-index: 0;
  }
  .call-backdrop.on-top {
    /* аудиозвонок: backdrop поверх Jitsi-контейнера (z-index:1) */
    z-index: 2;
  }
  /*
    [FIX] Контейнер Jitsi ВСЕГДА видим и полноразмерен — и для видео, и для
    аудио. НИКОГДА не скрываем через visibility:hidden / 1px / opacity:0 —
    это глушило аудио-вывод Jitsi (звук в видео был, в аудио — нет, потому
    что там контейнер прятали). Для аудио его накрывает backdrop.on-top.
  */
  .call-jitsi-container {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: #000;
    z-index: 1;
    border: none;
  }
  /* [FULLSCREEN] iframe, который Jitsi монтирует внутрь контейнера,
     должен заполнять его целиком на всех устройствах */
  .call-jitsi-container iframe {
    width: 100% !important;
    height: 100% !important;
    border: none !important;
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
    z-index: 2;
    pointer-events: none;
  }
  .call-card {
    position: relative;
    z-index: 3;
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
    pointer-events: none;
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
    pointer-events: auto;
  }
  .call-overlay.has-video .call-buttons {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 0;
    z-index: 5;
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
    pointer-events: auto;
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
  .btn-fullscreen .call-btn-icon { background: rgba(255,255,255,0.15); }
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
  jitsiContainerRef, // ← НОВОЕ: контейнер, куда useJitsiCall монтирует Jitsi
  onAccept,
  onDecline,
  onCancel,
  onEnd,
  onToggleMute,
  onToggleVideo,
  // ─── Запись приёма (необязательные) ───
  // Без них CallUI ведёт себя ровно как раньше: панель не появляется.
  // Сделано необязательным намеренно — звонки между двумя пациентами
  // или служебные вызовы записывать нечего и незачем.
  scribeRole = null, // "doctor" | "patient"
  scribeRoom = null,
  scribePeerUserId = null,
  onScribeDraft = null,
}) {
  // [FULLSCREEN] Хуки ДОЛЖНЫ быть до раннего return (правила хуков React).
  const overlayRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Следим за выходом из fullscreen (Esc / системная кнопка) — синхронизируем иконку
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    // iOS Safari webkit-префикс
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // [FULLSCREEN] Запрос/выход настоящего полноэкранного режима (Fullscreen API).
  // Работает на десктопе и Android. На iOS Safari Fullscreen API для div
  // ограничен — там overlay и так занимает весь экран (100dvh), кнопка просто
  // не даст доп. эффекта, но и не сломает.
  const toggleFullscreen = () => {
    const el = overlayRef.current;
    if (!el) return;
    const isFs = document.fullscreenElement || document.webkitFullscreenElement;
    if (!isFs) {
      const req =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.webkitRequestFullScreen ||
        el.msRequestFullscreen;
      if (req) req.call(el).catch(() => {});
    } else {
      const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.msExitFullscreen;
      if (exit) exit.call(document).catch(() => {});
    }
  };

  if (callState === "idle") return null;

  const isRinging = callState === "ringing_in" || callState === "ringing_out";
  const name = peerInfo?.name || "Unknown";
  const avatar = peerInfo?.avatar;

  const isVideoCall = callType === "video";
  // Показываем Jitsi-видео на весь экран только в активном видеозвонке
  const showVideoStage = isVideoCall && callState === "active";

  return (
    <>
      <style>{styles}</style>

      <div
        ref={overlayRef}
        className={`call-overlay${showVideoStage ? " has-video" : ""}`}
      >
        {/*
          backdrop.
          - Видеозвонок (showVideoStage) → backdrop снизу (z-index:0),
            Jitsi-видео поверх него видно.
          - Аудио / звонок не активен → backdrop.on-top (z-index:2), НАКРЫВАЕТ
            Jitsi-контейнер непрозрачно: Jitsi звучит под ним, но не виден.
        */}
        <div className={`call-backdrop${showVideoStage ? "" : " on-top"}`} />

        {/*
          КОНТЕЙНЕР JITSI — ВСЕГДА видим и полноразмерен (и аудио, и видео).
          [FIX] Больше НЕ скрывается через audio-hidden/visibility:hidden —
          это глушило звук. Для аудио его накрывает backdrop.on-top сверху.
          ⚠️ Контейнер всегда в DOM пока звонок не idle, иначе useJitsiCall
             не сможет смонтировать в него Jitsi.
        */}
        <div ref={jitsiContainerRef} className="call-jitsi-container" />

        {showVideoStage && <div className="call-video-dim" />}

        {/* Панель записи приёма — СВОЙ слой, а не часть карточки.
            В видеозвонке у .call-card стоит pointer-events: none (она
            становится подписью поверх видео), и кнопка внутри неё не
            нажималась вовсе. Плюс карточка шириной 320px и прижата к
            верху — там же, где собственная панель Jitsi.
            Поэтому отдельный слой внизу: он кликабелен и в аудио, и в
            видео, и ни с чем не спорит за место. */}
        {scribeRole && scribeRoom && callState === "active" && (
          <div className="call-scribe">
            {/* fallback={null}: панель появляется через долю секунды, и
                заглушка «загрузка» выглядела бы поломкой. */}
            <Suspense fallback={null}>
              <ScribePanel
                role={scribeRole}
                room={scribeRoom}
                peerUserId={scribePeerUserId}
                onDraft={onScribeDraft}
              />
            </Suspense>
          </div>
        )}

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


          {isVideoCall && !showVideoStage && (
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

                {/* [FULLSCREEN] Кнопка полноэкранного режима — только в видеозвонке */}
                {isVideoCall && (
                  <button
                    className="call-btn btn-fullscreen"
                    onClick={toggleFullscreen}
                  >
                    <div className="call-btn-icon">
                      {isFullscreen ? "🗗" : "⛶"}
                    </div>
                    <span className="call-btn-label">
                      {isFullscreen ? "Свернуть" : "Во весь экран"}
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
      </div>
    </>
  );
}
