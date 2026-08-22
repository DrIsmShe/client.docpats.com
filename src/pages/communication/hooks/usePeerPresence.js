// client/src/pages/communication/hooks/usePeerPresence.js
//
// В сети ли собеседник ПРЯМО СЕЙЧАС.
//
// Зачем отдельный хук, когда есть useOnlineUsers. Тот слушает только
// user:online / user:offline, то есть знает лишь о том, что случилось
// после подписки: открыв чат, он про собеседника не знает ничего и
// показывает «офлайн» всем подряд. Поэтому здесь два источника:
//
//   1. один вопрос серверу при открытии диалога (presence:get с ack) —
//      снимок по живым сокетам, а не по полю status в базе;
//   2. те же события user:online / user:offline — чтобы снимок не
//      устаревал, пока чат открыт.
//
// Возвращает СТРОКУ-СОСТОЯНИЕ, а не булев флаг с null. Прежний null
// склеивал два разных случая — «ответа ещё нет» и «сервер ответил, что
// не знает», — и оба молча выглядели как «звонить можно», без единого
// слова пользователю. Разделены, чтобы про второй можно было честно
// предупредить:
//
//   "none"    — личного собеседника нет вовсе (групповой диалог);
//   "pending" — вопрос задан, ответа ещё нет;
//   "unknown" — ответа не будет: сервер не знает, ack не дождались или
//               наш собственный сокет отвалился;
//   "online" / "offline" — точный ответ.
//
// Запрещать звонок можно ТОЛЬКО на "offline". На "unknown" нельзя:
// отнять кнопку по незнанию хуже, чем позволить лишний вызов.

import { useEffect, useState } from "react";
import { getSocket } from "../socket";

// Ack без таймаута при мёртвом сокете не приходит НИКОГДА, и состояние
// навсегда осталось бы "pending" — то есть визуально «ещё грузится».
const ASK_TIMEOUT_MS = 5000;

export function usePeerPresence(peerId) {
  const [status, setStatus] = useState("none");

  useEffect(() => {
    if (!peerId) {
      setStatus("none");
      return undefined;
    }

    const socket = getSocket();
    const id = String(peerId);
    // Диалог мог смениться, пока летел ответ, — иначе присвоим чужое.
    let alive = true;

    setStatus("pending");

    const ask = () =>
      socket
        .timeout(ASK_TIMEOUT_MS)
        .emit("presence:get", { userId: id }, (err, res) => {
          if (!alive) return;
          if (err || !res?.known) {
            setStatus("unknown");
            return;
          }
          setStatus(res.online ? "online" : "offline");
        });

    ask();
    // Переподключились — снимок мог устареть, пока связи не было.
    socket.on("connect", ask);

    // Упал наш собственный сокет: прежний ответ больше ничего не значит,
    // и новых user:online / user:offline мы уже не услышим.
    const onDisconnect = () => {
      if (alive) setStatus("unknown");
    };

    const onOnline = ({ userId }) => {
      if (String(userId) === id) setStatus("online");
    };
    const onOffline = ({ userId }) => {
      if (String(userId) === id) setStatus("offline");
    };

    socket.on("disconnect", onDisconnect);
    socket.on("user:online", onOnline);
    socket.on("user:offline", onOffline);

    return () => {
      alive = false;
      socket.off("connect", ask);
      socket.off("disconnect", onDisconnect);
      socket.off("user:online", onOnline);
      socket.off("user:offline", onOffline);
    };
  }, [peerId]);

  return status;
}

export default usePeerPresence;
