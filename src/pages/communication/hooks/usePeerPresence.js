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
// Возвращает ТРИ состояния, и это важно: null — «не знаем». Пока ответ не
// пришёл или сокет молчит, запрещать звонок нельзя: отнять кнопку по
// незнанию хуже, чем позволить лишний вызов.

import { useEffect, useState } from "react";
import { getSocket } from "../socket";

export function usePeerPresence(peerId) {
  const [online, setOnline] = useState(null); // null | true | false

  useEffect(() => {
    if (!peerId) {
      setOnline(null);
      return undefined;
    }

    const socket = getSocket();
    const id = String(peerId);
    // Диалог мог смениться, пока летел ответ, — иначе присвоим чужое.
    let alive = true;

    setOnline(null);

    const ask = () =>
      socket.emit("presence:get", { userId: id }, (res) => {
        if (!alive) return;
        setOnline(res?.known ? Boolean(res.online) : null);
      });

    ask();
    // Переподключились — снимок мог устареть, пока связи не было.
    socket.on("connect", ask);

    const onOnline = ({ userId }) => {
      if (String(userId) === id) setOnline(true);
    };
    const onOffline = ({ userId }) => {
      if (String(userId) === id) setOnline(false);
    };

    socket.on("user:online", onOnline);
    socket.on("user:offline", onOffline);

    return () => {
      alive = false;
      socket.off("connect", ask);
      socket.off("user:online", onOnline);
      socket.off("user:offline", onOffline);
    };
  }, [peerId]);

  return online;
}

export default usePeerPresence;
