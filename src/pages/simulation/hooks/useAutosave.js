// src/pages/simulation/hooks/useAutosave.js
import { useEffect, useRef, useCallback, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Debounced autosave.

   Flow:
   1. User редактирует → markDirty(nextPoints)
   2. Timer на DEBOUNCE_MS. Каждый markDirty перезапускает.
   3. По истечении: save(nextPoints) — async dispatch (PATCH backend).
   4. Success → status="saved" на 2 сек → "idle"
      Failure → status="error", пользователь видит в toolbar.

   forceSave() — для случая "перед unmount'ом успеть сохранить".
   Вызывается из useEffect cleanup в SimulationEditor.

   status: idle | dirty | saving | saved | error
   ────────────────────────────────────────────────────────────────────────── */

const DEBOUNCE_MS = 2000;
const SAVED_DISPLAY_MS = 2000;

export function useAutosave({ onSave }) {
  const [status, setStatus] = useState("idle");
  const timerRef = useRef(null);
  const savedTimerRef = useRef(null);
  const pendingDataRef = useRef(null);
  const inFlightRef = useRef(false);

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
  };

  const doSave = useCallback(async () => {
    const data = pendingDataRef.current;
    if (data === null) return;
    pendingDataRef.current = null;

    inFlightRef.current = true;
    setStatus("saving");

    try {
      await onSave(data);
      // Если за время save прилетел новый markDirty — не показываем "saved",
      // сразу в "dirty" → перезапуск таймера.
      if (pendingDataRef.current !== null) {
        inFlightRef.current = false;
        setStatus("dirty");
        scheduleSave();
        return;
      }
      setStatus("saved");
      savedTimerRef.current = setTimeout(() => {
        setStatus("idle");
        savedTimerRef.current = null;
      }, SAVED_DISPLAY_MS);
    } catch (err) {
      console.error("[simulation/autosave] failed:", err);
      setStatus("error");
    } finally {
      inFlightRef.current = false;
    }
  }, [onSave]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      doSave();
    }, DEBOUNCE_MS);
  }, [doSave]);

  const markDirty = useCallback(
    (data) => {
      pendingDataRef.current = data;
      if (!inFlightRef.current) {
        setStatus("dirty");
      }
      scheduleSave();
    },
    [scheduleSave],
  );

  /* ────────── Принудительный save (на unmount / close) ────────── */
  const forceSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingDataRef.current !== null && !inFlightRef.current) {
      await doSave();
    }
  }, [doSave]);

  /* ────────── Cleanup ────────── */
  useEffect(() => () => clearTimers(), []);

  return {
    status,
    markDirty,
    forceSave,
  };
}
