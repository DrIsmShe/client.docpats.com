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

import { createContext, useContext, useState, Suspense, lazy } from "react";
import { useJitsiCall } from "../hooks/useJitsiCall";
import { useCurrentUser } from "../hooks/useCurrentUserId";
import CallUI from "../components/CallUI";

// Лениво по той же причине, что и панель: провайдер вне <Routes>, а
// окно черновика открывается один раз в конце приёма.
const ScribeDraftModal = lazy(() =>
  import("../components/ScribeDraftModal"),
);

const CallContext = createContext(null);

export function useCallContext() {
  return useContext(CallContext);
}

export function GlobalCallProvider({ currentUserId, children }) {
  // Роль нужна записи приёма: панель показывается врачу и пациенту
  // по-разному. Имя — подпись в комнате звонка. Запрос тот же самый, что
  // и за userId, — лишнего похода на сервер нет.
  const { role, name } = useCurrentUser();

  const call = useJitsiCall(currentUserId, { displayName: name });

  // Черновик, собранный из разговора. Показывается врачу поверх всего
  // СРАЗУ после завершения записи: пока приём в памяти, правки занимают
  // минуту, а через час — полчаса.
  const [scribeDraft, setScribeDraft] = useState(null);

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
    peerId,
    dialogId,
    acceptCall,
    declineCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleVideo,
    callId,
    // Конференция: приглашение третьего и далее прямо из разговора.
    inviteParticipant,
    inviteStatus,
    participantCount,
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
        onInvite={inviteParticipant}
        inviteStatus={inviteStatus}
        participantCount={participantCount}
        /* Запись приёма.
           Роль определяется ролью аккаунта: врач — тот, у кого она
           doctor, остальные участники звонка — пациенты. Записывать
           разговор двух пациентов между собой незачем, и панель у них
           не появится: scribeRole останется null.
           Комната та же, в которой идёт звонок, — она общая у обеих
           сторон и единственное, что связывает их в момент разговора. */
        scribeRole={
          role === "doctor" ? "doctor" : role ? "patient" : null
        }
        scribeRoom={dialogId ? `dialog-${dialogId}` : null}
        scribePeerUserId={peerId}
        /* Имя собеседника — чтобы завести карту одним нажатием, а не
           переписывать его с экрана звонка. */
        scribePeerName={peerInfo?.name || ""}
        onScribeDraft={setScribeDraft}
      />

      {/* Черновик приёма — врачу, поверх всего, сразу после записи. */}
      {scribeDraft && (
        <Suspense fallback={null}>
          <ScribeDraftModal
            data={scribeDraft}
            onClose={() => setScribeDraft(null)}
          />
        </Suspense>
      )}
    </CallContext.Provider>
  );
}
