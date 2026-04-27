// src/pages/simulation/components/editor/ControlPointHandle.jsx
import React, { useCallback, useEffect, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Одна control point визуально:

   1. Radius circle    — dashed круг, область влияния
   2. Anchor handle    — квадрат + невидимый hit-area вокруг (для touch)
   3. Arrow            — line от anchor к current
   4. Current handle   — круг + невидимый hit-area вокруг (для touch)

   S.7.5+ Mobile patches:
     • style={{ touchAction: "none" }} — браузер не делает свой scroll/zoom
     • невидимые hit-area элементы (r=22) — ловят пальцем мимо центра
     • на mobile handles рисуются крупнее (хорошая видимость)
     • data-handle="true" — атрибут для CSS-селектора (на всякий случай)
   ────────────────────────────────────────────────────────────────────────── */

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

const HANDLE_TOUCH_STYLE = {
  touchAction: "none",
  WebkitTapHighlightColor: "transparent",
  cursor: "grab",
};

const ANCHOR_TOUCH_STYLE = {
  touchAction: "none",
  WebkitTapHighlightColor: "transparent",
  cursor: "pointer",
};

export default function ControlPointHandle({
  point,
  pixelAnchor,
  pixelCurrent,
  pixelRadius,
  isSelected,
  onCurrentPointerDown,
  onAnchorPointerDown,
  onSelect,
}) {
  const isMobile = useIsMobile();

  // На mobile делаем handles крупнее для удобного попадания пальцем
  const currentRadius = isMobile ? 12 : 8;
  const anchorSize = isMobile ? 14 : 10;
  // Невидимая hit-area вокруг handle — большая, ловит палец мимо центра
  const currentHitRadius = isMobile ? 28 : 18;
  const anchorHitRadius = isMobile ? 26 : 16;

  const handleCurrentDown = useCallback(
    (e) => {
      e.stopPropagation();
      onCurrentPointerDown?.(e, point.key);
    },
    [onCurrentPointerDown, point.key],
  );

  const handleAnchorDown = useCallback(
    (e) => {
      e.stopPropagation();
      if (e.altKey) {
        onAnchorPointerDown?.(e, point.key);
      } else {
        onSelect?.(point.key);
      }
    },
    [onAnchorPointerDown, onSelect, point.key],
  );

  // На mobile (touch) альтернативный жест для anchor drag — long press.
  // Но сейчас просто опираемся на onSelect: тапнул anchor → выбрал точку,
  // далее тащишь current. Drag anchor через Alt — desktop only.

  const currentFill = isSelected ? "#3d7fff" : "#60a5fa";
  const currentStroke = "#ffffff";
  const anchorFill = isSelected ? "#fbbf24" : "#94a3b8";
  const radiusStroke = isSelected
    ? "rgba(61, 127, 255, 0.55)"
    : "rgba(148, 163, 184, 0.35)";

  return (
    <g>
      {/* Radius circle — область влияния */}
      <circle
        cx={pixelAnchor.x}
        cy={pixelAnchor.y}
        r={pixelRadius}
        fill="none"
        stroke={radiusStroke}
        strokeWidth={1}
        strokeDasharray="4 4"
        pointerEvents="none"
      />

      {/* Vector arrow */}
      <line
        x1={pixelAnchor.x}
        y1={pixelAnchor.y}
        x2={pixelCurrent.x}
        y2={pixelCurrent.y}
        stroke={isSelected ? "#3d7fff" : "#94a3b8"}
        strokeWidth={1.5}
        strokeDasharray="2 3"
        pointerEvents="none"
      />

      {/* ═══ ANCHOR HANDLE ═══ */}
      {/* Невидимая hit-area вокруг anchor — большая для пальца */}
      <circle
        cx={pixelAnchor.x}
        cy={pixelAnchor.y}
        r={anchorHitRadius}
        fill="transparent"
        style={ANCHOR_TOUCH_STYLE}
        data-handle="true"
        data-handle-anchor="true"
        onPointerDown={handleAnchorDown}
      />
      {/* Видимый квадрат — НЕ принимает события (они на hit-area выше) */}
      <rect
        x={pixelAnchor.x - anchorSize / 2}
        y={pixelAnchor.y - anchorSize / 2}
        width={anchorSize}
        height={anchorSize}
        fill={anchorFill}
        stroke="#ffffff"
        strokeWidth={1.5}
        pointerEvents="none"
      />

      {/* ═══ CURRENT HANDLE ═══ */}
      {/* Невидимая hit-area вокруг current — большая для пальца */}
      <circle
        cx={pixelCurrent.x}
        cy={pixelCurrent.y}
        r={currentHitRadius}
        fill="transparent"
        style={HANDLE_TOUCH_STYLE}
        data-handle="true"
        data-handle-current="true"
        onPointerDown={handleCurrentDown}
      />
      {/* Видимый круг — НЕ принимает события */}
      <circle
        cx={pixelCurrent.x}
        cy={pixelCurrent.y}
        r={currentRadius}
        fill={currentFill}
        stroke={currentStroke}
        strokeWidth={2}
        pointerEvents="none"
      />
    </g>
  );
}
