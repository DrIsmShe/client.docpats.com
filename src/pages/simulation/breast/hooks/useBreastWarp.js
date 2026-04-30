// src/pages/simulation/breast/hooks/useBreastWarp.js
//
// Phase Б.2 v3 — Простая версия. Control points приходят прямо из plan.
// Никаких генераторов, никакого алгоритмического warp. Чистая передача
// в warp engine.

import { useEffect } from "react";
import { useWarpEngine } from "../../hooks/useWarpEngine.js";

export function useBreastWarp({ preview, controlPoints, isEnabled }) {
  const sourceImageData = preview?.imageData || null;

  const { warpedImageData, isWarping, scheduleWarp } = useWarpEngine({
    sourceImageData,
  });

  // Если warp выключен — отправляем пустой массив (engine вернёт identity)
  const effectivePoints = isEnabled ? controlPoints || [] : [];

  useEffect(() => {
    if (!sourceImageData) return;
    scheduleWarp(effectivePoints);
  }, [sourceImageData, effectivePoints, scheduleWarp]);

  return {
    warpedImageData: effectivePoints.length > 0 ? warpedImageData : null,
    isWarping,
  };
}
