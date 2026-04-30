// src/pages/simulation/breast/hooks/useBreastPlan.js

import { useState, useEffect, useCallback, useRef } from "react";
import { getPlan, updatePlan } from "../../api/simulationApi.js";

const LOCAL_ONLY_AFTER_SAVE = new Set([
  "anatomy",
  "operation",
  "calibration",
  "controlPoints",
]);

export function useBreastPlan(planId) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPlan = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPlan(planId);
      setPlan(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const saveTimerRef = useRef(null);
  const pendingPatchRef = useRef({});
  const inFlightRef = useRef(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  const flushSave = useCallback(async () => {
    if (!planId) return;
    if (inFlightRef.current) return;

    const patch = pendingPatchRef.current;
    if (!patch || Object.keys(patch).length === 0) return;

    pendingPatchRef.current = {};
    inFlightRef.current = true;

    setSaveStatus("saving");
    try {
      const updated = await updatePlan(planId, patch);

      setPlan((prev) => {
        if (!prev) return updated;
        const next = { ...prev };
        const stillPending = pendingPatchRef.current || {};
        for (const field of Object.keys(updated)) {
          if (LOCAL_ONLY_AFTER_SAVE.has(field)) continue;
          if (field in stillPending) continue;
          next[field] = updated[field];
        }
        return next;
      });

      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus((s) => (s === "saved" ? "idle" : s));
      }, 1500);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[useBreastPlan] save failed:", err);
      setSaveStatus("error");
      pendingPatchRef.current = {
        ...patch,
        ...pendingPatchRef.current,
      };
    } finally {
      inFlightRef.current = false;
      if (Object.keys(pendingPatchRef.current || {}).length > 0) {
        setTimeout(() => flushSave(), 0);
      }
    }
  }, [planId]);

  const patchPlan = useCallback(
    (patch, { immediate = false } = {}) => {
      setPlan((prev) => (prev ? { ...prev, ...patch } : prev));

      pendingPatchRef.current = {
        ...pendingPatchRef.current,
        ...patch,
      };
      setSaveStatus("dirty");

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      if (immediate) {
        flushSave();
      } else {
        saveTimerRef.current = setTimeout(() => {
          flushSave();
        }, 800);
      }
    },
    [flushSave],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      flushSave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { plan, loading, error, saveStatus, patchPlan, reload: loadPlan };
}
