// client/src/pages/clinic/vitrina/theme/useThemePresets.js
//
// ВИТРИНА 2.0 (V2) — загрузка словарей темы для switcher'а.
// Тянет GET /api/v1/public/theme-presets один раз и кэширует на уровне модуля
// (несколько компонентов настроек → один сетевой запрос). Словари статичны,
// эндпоинт отдаёт Cache-Control, так что обновлять не нужно.

import { useState, useEffect } from "react";
import { getThemePresets } from "../../../../api/clinic";
const API_BASE = process.env.REACT_APP_API_URL || "";
const ENDPOINT = `${API_BASE}/api/v1/public/theme-presets`;

let _cache = null; // payload после первой успешной загрузки
let _inflight = null; // промис текущего запроса (дедуп параллельных вызовов)

export function useThemePresets() {
  const [presets, setPresets] = useState(_cache);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (_cache) {
      setPresets(_cache);
      return undefined;
    }
    let alive = true;
    if (!_inflight) {
      _inflight = fetch(ENDPOINT, { credentials: "omit" })
        .then((r) => {
          if (!r.ok) throw new Error(`theme-presets ${r.status}`);
          return r.json();
        })
        .then((data) => {
          _cache = data;
          return data;
        })
        .catch((e) => {
          _inflight = null; // дать повторить при следующем монтировании
          throw e;
        });
    }
    _inflight
      .then((data) => {
        if (alive) setPresets(data);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { presets, error, loading: !presets && !error };
}
