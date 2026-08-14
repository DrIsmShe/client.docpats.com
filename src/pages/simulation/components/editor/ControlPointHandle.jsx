// src/pages/simulation/components/editor/ControlPointHandle.jsx
import React, { useCallback, useEffect, useRef } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Одна control point визуально:

   1. Radius circle    — пунктирный круг, область влияния. ТЕПЕРЬ ТЯНЕТСЯ:
                         на самом круге лежит кольцевая зона захвата.
   2. Anchor handle    — квадрат + невидимая зона захвата
   3. Arrow            — линия от anchor к current
   4. Current handle   — круг + невидимая зона захвата

   КООРДИНАТЫ — В ПРОСТРАНСТВЕ ИЗОБРАЖЕНИЯ

   Группа-родитель несёт transform viewport'а, поэтому сюда приходят
   координаты кадра, а не экрана. Всё, что должно сохранять экранный размер
   при зуме (радиусы ручек, толщина штрихов), умножается на invScale.

   ЖЕСТЫ
   • current — тянется сразу, любым указателем.
   • anchor  — Alt+перетаскивание на десктопе, ДОЛГОЕ НАЖАТИЕ на тач-экране
               и стилусе. Раньше был только Alt, а на планшете клавиши Alt
               нет — точка привязки была недостижима в принципе.
   • радиус  — перетаскивание пунктирного круга.

   Компонент мемоизирован: при панораме его пропсы не меняются (двигается
   transform группы), поэтому перерисовки не происходит вовсе.
   ────────────────────────────────────────────────────────────────────────── */

const LONG_PRESS_MS = 420;

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

const RADIUS_TOUCH_STYLE = {
  touchAction: "none",
  WebkitTapHighlightColor: "transparent",
  cursor: "nwse-resize",
};

function ControlPointHandle({
  point,
  imgAnchor,
  imgCurrent,
  imgRadius,
  invScale,
  isMobile,
  isSelected,
  onCurrentPointerDown,
  onAnchorPointerDown,
  onRadiusPointerDown,
  onSelect,
}) {
  const pressTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  // Экранные размеры → размеры в пространстве изображения.
  const k = invScale;
  const currentRadius = (isMobile ? 12 : 8) * k;
  const anchorSize = (isMobile ? 14 : 10) * k;
  const currentHitRadius = (isMobile ? 28 : 18) * k;
  const anchorHitRadius = (isMobile ? 26 : 16) * k;
  const radiusHitWidth = (isMobile ? 26 : 16) * k;

  const cancelPress = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const handleCurrentDown = useCallback(
    (e) => {
      e.stopPropagation();
      onCurrentPointerDown?.(e, point.key);
    },
    [onCurrentPointerDown, point.key],
  );

  const handleRadiusDown = useCallback(
    (e) => {
      e.stopPropagation();
      onRadiusPointerDown?.(e, point.key);
    },
    [onRadiusPointerDown, point.key],
  );

  const handleAnchorDown = useCallback(
    (e) => {
      e.stopPropagation();

      if (e.altKey) {
        onAnchorPointerDown?.(e, point.key);
        return;
      }

      onSelect?.(point.key);

      // На мыши длинное нажатие не нужно — там есть Alt.
      if (e.pointerType === "mouse") return;

      // Снимок полей: обработчик сработает уже после того, как React
      // отпустит это событие.
      const snapshot = {
        pointerId: e.pointerId,
        clientX: e.clientX,
        clientY: e.clientY,
        pointerType: e.pointerType,
      };
      cancelPress();
      pressTimerRef.current = setTimeout(() => {
        pressTimerRef.current = null;
        try {
          navigator.vibrate?.(12); // короткий отклик: «захватил привязку»
        } catch {
          /* вибрация недоступна — не важно */
        }
        onAnchorPointerDown?.(snapshot, point.key);
      }, LONG_PRESS_MS);
    },
    [onAnchorPointerDown, onSelect, point.key, cancelPress],
  );

  const currentFill = isSelected ? "#3d7fff" : "#60a5fa";
  const currentStroke = "#ffffff";
  const anchorFill = isSelected ? "#fbbf24" : "#94a3b8";
  const radiusStroke = isSelected
    ? "rgba(61, 127, 255, 0.55)"
    : "rgba(148, 163, 184, 0.35)";

  return (
    <g>
      {/* ═══ ЗОНА ЗАХВАТА РАДИУСА ═══
          Кольцо по самому пунктиру: pointerEvents="stroke" ловит только
          толщину штриха, поэтому середина круга остаётся «прозрачной»
          для панорамы. */}
      {imgRadius > 0 && (
        <circle
          cx={imgAnchor.x}
          cy={imgAnchor.y}
          r={imgRadius}
          fill="none"
          stroke="transparent"
          strokeWidth={radiusHitWidth}
          pointerEvents="stroke"
          style={RADIUS_TOUCH_STYLE}
          data-handle="true"
          data-handle-radius="true"
          onPointerDown={handleRadiusDown}
        />
      )}

      {/* Radius circle — область влияния (видимая часть) */}
      <circle
        cx={imgAnchor.x}
        cy={imgAnchor.y}
        r={imgRadius}
        fill="none"
        stroke={radiusStroke}
        strokeWidth={(isSelected ? 2 : 1) * k}
        strokeDasharray={`${4 * k} ${4 * k}`}
        pointerEvents="none"
      />

      {/* Vector arrow */}
      <line
        x1={imgAnchor.x}
        y1={imgAnchor.y}
        x2={imgCurrent.x}
        y2={imgCurrent.y}
        stroke={isSelected ? "#3d7fff" : "#94a3b8"}
        strokeWidth={1.5 * k}
        strokeDasharray={`${2 * k} ${3 * k}`}
        pointerEvents="none"
      />

      {/* ═══ ANCHOR HANDLE ═══ */}
      <circle
        cx={imgAnchor.x}
        cy={imgAnchor.y}
        r={anchorHitRadius}
        fill="transparent"
        style={ANCHOR_TOUCH_STYLE}
        data-handle="true"
        data-handle-anchor="true"
        onPointerDown={handleAnchorDown}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
      />
      <rect
        x={imgAnchor.x - anchorSize / 2}
        y={imgAnchor.y - anchorSize / 2}
        width={anchorSize}
        height={anchorSize}
        fill={anchorFill}
        stroke="#ffffff"
        strokeWidth={1.5 * k}
        pointerEvents="none"
      />

      {/* ═══ CURRENT HANDLE ═══ */}
      <circle
        cx={imgCurrent.x}
        cy={imgCurrent.y}
        r={currentHitRadius}
        fill="transparent"
        style={HANDLE_TOUCH_STYLE}
        data-handle="true"
        data-handle-current="true"
        onPointerDown={handleCurrentDown}
      />
      <circle
        cx={imgCurrent.x}
        cy={imgCurrent.y}
        r={currentRadius}
        fill={currentFill}
        stroke={currentStroke}
        strokeWidth={2 * k}
        pointerEvents="none"
      />
    </g>
  );
}

export default React.memo(ControlPointHandle);
