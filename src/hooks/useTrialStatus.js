// client/src/hooks/useTrialStatus.js
// ─────────────────────────────────────────────────────────────────────
//   Хук для получения trial-статуса текущего юзера.
//   Кэширует результат на 5 минут, чтобы не дёргать API при каждом
//   рендере компонентов.
//
//   Использование:
//     const { trial, loading } = useTrialStatus();
//     if (trial?.isInTrial) { ... }
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:11000";

// Простой in-memory кэш (общий для всех инстансов хука)
let cache = { data: null, ts: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

export function useTrialStatus() {
  const [trial, setTrial] = useState(cache.data);
  const [loading, setLoading] = useState(!cache.data);

  useEffect(() => {
    const now = Date.now();

    // Если кэш свежий — используем его
    if (cache.data && now - cache.ts < CACHE_TTL) {
      setTrial(cache.data);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    axios
      .get(`${API_URL}/api/me/trial-status`, { withCredentials: true })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success) {
          cache = { data: res.data, ts: Date.now() };
          setTrial(res.data);
        }
      })
      .catch(() => {
        // 401 для гостей — это норма, ничего не делаем
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { trial, loading };
}

// Опционально — функция для принудительного сброса кэша
// (например, после оплаты подписки)
export function clearTrialStatusCache() {
  cache = { data: null, ts: 0 };
}
