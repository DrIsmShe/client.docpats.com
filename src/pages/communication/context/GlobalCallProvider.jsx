// client/src/pages/communication/context/GlobalCallProvider.jsx
//
// Оборачивает всё приложение — звонок работает на любой странице сайта.
// Использование в App.jsx:
//   import { GlobalCallProvider } from "./pages/communication/context/GlobalCallProvider";
//   <GlobalCallProvider currentUserId={currentUserId}>
//     ... весь BrowserRouter и Routes ...
//   </GlobalCallProvider>
//
// [VIDEO v4] Добавлены: callType, isVideoEnabled, localVideoRef, remoteVideoRef, toggleVideo

import { createContext, useContext } from "react";
import { useCall } from "../hooks/useCall";
import CallUI from "../components/CallUI";

// Контекст — позволяет любому компоненту вызвать initiateCall из любого места
const CallContext = createContext(null);

export function useCallContext() {
  return useContext(CallContext);
}

export function GlobalCallProvider({ currentUserId, children }) {
  const call = useCall(currentUserId);

  const {
    callState,
    callType, // [VIDEO]
    peerInfo,
    isMuted,
    isVideoEnabled, // [VIDEO]
    formattedDuration,
    durationSec,
    endedInfo,
    remoteAudioRef,
    localVideoRef, // [VIDEO]
    remoteVideoRef, // [VIDEO]
    acceptCall,
    declineCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleVideo, // [VIDEO]
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
        remoteAudioRef={remoteAudioRef}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
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
