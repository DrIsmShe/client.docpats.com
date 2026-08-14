// src/pages/simulation/hooks/useIsMobile.js
//
// Определение мобильной ширины по window.innerWidth. SSR-safe.
//
// Канонический экземпляр для всего модуля симуляции. До этого таких хуков
// было три: свой в SimulationEditor, свой в breast/hooks и — хуже всего —
// свой ВНУТРИ ControlPointHandle, то есть по одному слушателю resize на
// каждую контрольную точку. При тридцати точках это тридцать подписок и
// тридцать состояний, обновляющихся синхронно и вызывающих тридцать
// перерисовок на каждое изменение ширины окна.
//
// breast/hooks/useIsMobile.js оставлен реэкспортом, чтобы не трогать его
// импортёров.

import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

export default useIsMobile;
