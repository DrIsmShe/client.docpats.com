// client/src/pages/communication/context/GlobalCallProvider.jsx
//
// ═══════════════════════════════════════════════════════════════════════════
// GlobalCallProvider — версия под JITSI
// ═══════════════════════════════════════════════════════════════════════════
//
// Оборачивает всё приложение — звонок работает на любой странице.
// Использование в App.jsx (без изменений):
//   <GlobalCallProvider currentUserId={currentUserId}>
//     ... весь BrowserRouter и Routes ...
//   </GlobalCallProvider>
//
// Что изменилось относительно P2P-версии:
//   • useCall → useJitsiCall (медиа через Jitsi/JVB, обходит мобильный NAT)
//   • Вместо remoteAudioRef/localVideoRef/remoteVideoRef в CallUI передаётся
//     ОДИН jitsiContainerRef — контейнер, куда монтируется Jitsi.
//
// Публичный API контекста (useCallContext) — тот же: initiateCall, acceptCall,
// callState, peerInfo и т.д. Поэтому ChatPage/ChatWindow/кнопки звонка
// НЕ меняются — они продолжают вызывать call.initiateCall(...) как раньше.
//
// ⚠️ Старый useCall.js НЕ удаляется — остаётся для P2P/fallback/референса.
//    Чтобы вернуться на P2P: поменять импорт обратно на useCall и вернуть
//    старую версию CallUI.

import { createContext, useContext } from "react";
import { useJitsiCall } from "../hooks/useJitsiCall";
import CallUI from "../components/CallUI";

const CallContext = createContext(null);

export function useCallContext() {
  return useContext(CallContext);
}

export function GlobalCallProvider({ currentUserId, children }) {
  const call = useJitsiCall(currentUserId);

  const {
    callState,
    callType,
    peerInfo,
    isMuted,
    isVideoEnabled,
    formattedDuration,
    durationSec,
    endedInfo,
    jitsiContainerRef, // ← вместо remoteAudioRef/localVideoRef/remoteVideoRef
    acceptCall,
    declineCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleVideo,
    callId,
  } = call;

  return (
    <CallContext.Provider value={call}>
      {/* Дети — весь сайт */}
      {children}

      {/* Оверлей звонка — position:fixed, z-index:9999, поверх всего */}
      <CallUI
        callState={callState}
        callType={callType}
        peerInfo={peerInfo}
        isMuted={isMuted}
        isVideoEnabled={isVideoEnabled}
        formattedDuration={formattedDuration}
        durationSec={durationSec}
        endedInfo={endedInfo}
        jitsiContainerRef={jitsiContainerRef}
        onAccept={() => acceptCall(callId)}
        onDecline={() => declineCall(callId)}
        onCancel={cancelCall}
        onEnd={endCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
      />
    </CallContext.Provider>
  );
}
