// src/pages/simulation/hooks/usePlanThumbnail.js
import { useEffect, useState } from "react";
import { generateThumbnail } from "../utils/thumbnailGenerator.js";

/* ──────────────────────────────────────────────────────────────────────────
   Hook для карточки плана. Асинхронно генерит thumbnail, показывает
   оригинальное фото пока идёт генерация.

   Возвращает { thumbUrl, isGenerating }:
     thumbUrl  — data-URL с warp или null (тогда используй plan.photo.url)
     isGenerating — true пока идёт первая генерация
   ────────────────────────────────────────────────────────────────────────── */

export function usePlanThumbnail(plan) {
  const [thumbUrl, setThumbUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!plan) {
      setThumbUrl(null);
      return undefined;
    }

    // Если нет точек с displacement'ом — warp = no-op, используй оригинал.
    const hasDeformation = (plan.controlPoints || []).some(
      (p) => p.anchor.x !== p.current.x || p.anchor.y !== p.current.y,
    );
    if (!hasDeformation) {
      setThumbUrl(null); // fallback на plan.photo.url
      return undefined;
    }

    let cancelled = false;
    setIsGenerating(true);

    generateThumbnail({ plan })
      .then((url) => {
        if (cancelled) return;
        setThumbUrl(url);
        setIsGenerating(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [plan]);

  return { thumbUrl, isGenerating };
}
