import { useEffect, useState } from "react";
import { getSocket } from "../socket";

export function useOnlineUsers() {
  const [online, setOnline] = useState(new Set());

  useEffect(() => {
    const socket = getSocket();

    const handleOnline = ({ userId }) => {
      setOnline((prev) => new Set(prev).add(userId));
    };

    const handleOffline = ({ userId }) => {
      setOnline((prev) => {
        const copy = new Set(prev);
        copy.delete(userId);
        return copy;
      });
    };

    socket.on("user:online", handleOnline);
    socket.on("user:offline", handleOffline);

    return () => {
      socket.off("user:online", handleOnline);
      socket.off("user:offline", handleOffline);
    };
  }, []);

  return online; // Set userId'ов
}
