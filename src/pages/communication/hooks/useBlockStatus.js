// client/src/communication/hooks/useBlockStatus.js

import { useState, useCallback } from "react";
import axios from "../../../axios";

export function useBlockStatus(peerId) {
  const [isBlocked, setIsBlocked] = useState(false); // я заблокировал его
  const [blockedByPeer, setBlockedByPeer] = useState(false); // он заблокировал меня
  const [loading, setLoading] = useState(false);

  // Загрузить статус блокировки (вызывать при открытии диалога)
  const fetchStatus = useCallback(async () => {
    if (!peerId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`/communication/block/status/${peerId}`);
      setIsBlocked(data.isBlocked);
      setBlockedByPeer(data.blockedByPeer);
    } catch (err) {
      console.error("fetchBlockStatus error:", err);
    } finally {
      setLoading(false);
    }
  }, [peerId]);

  // Заблокировать
  const block = useCallback(async () => {
    if (!peerId) return;
    try {
      setLoading(true);
      await axios.post(`/communication/block/${peerId}`);
      setIsBlocked(true);
    } catch (err) {
      console.error("blockUser error:", err);
    } finally {
      setLoading(false);
    }
  }, [peerId]);

  // Разблокировать
  const unblock = useCallback(async () => {
    if (!peerId) return;
    try {
      setLoading(true);
      await axios.delete(`/communication/block/${peerId}`);
      setIsBlocked(false);
    } catch (err) {
      console.error("unblockUser error:", err);
    } finally {
      setLoading(false);
    }
  }, [peerId]);

  return { isBlocked, blockedByPeer, loading, fetchStatus, block, unblock };
}
