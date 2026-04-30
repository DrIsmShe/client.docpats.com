// src/pages/simulation/breast/components/BreastControlPointsOverlay.jsx
//
// Phase Б.2 v3 — Manual control points overlay с popover для радиуса/силы.

import React, { useCallback, useRef, useState, useEffect } from "react";
import ControlPointPopover from "./ControlPointPopover.jsx";

const NORM_RADIUS_MIN = 0.005;
const NORM_RADIUS_MAX = 0.4;

function eventToNormalized(evt, container, preview, viewport) {
  const rect = container.getBoundingClientRect();
  const screenX = evt.clientX - rect.left;
  const screenY = evt.clientY - rect.top;
  const imgX = (screenX - viewport.tx) / viewport.scale;
  const imgY = (screenY - viewport.ty) / viewport.scale;
  return {
    x: Math.max(0, Math.min(1, imgX / preview.width)),
    y: Math.max(0, Math.min(1, imgY / preview.height)),
  };
}

function normalizedToScreen(point, preview, viewport) {
  return {
    x: point.x * preview.width * viewport.scale + viewport.tx,
    y: point.y * preview.height * viewport.scale + viewport.ty,
  };
}

function normalizedToWindow(point, preview, viewport, overlayEl) {
  const screen = normalizedToScreen(point, preview, viewport);
  if (!overlayEl) return screen;
  const rect = overlayEl.getBoundingClientRect();
  return {
    x: screen.x + rect.left,
    y: screen.y + rect.top,
  };
}

export default function BreastControlPointsOverlay({
  preview,
  viewport,
  canvasSize,
  controlPoints,
  isAddMode,
  isVisible,
  onMoveAnchor,
  onMoveCurrent,
  onResize,
  onChangeStrength,
  onRemove,
  onAdd,
}) {
  const overlayRef = useRef(null);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);

  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [popoverCurrent, setPopoverCurrent] = useState(null);

  const dragRef = useRef(null);
  const dragMovedRef = useRef(false);
  const justInteractedWithHandleRef = useRef(false);

  /* ────── Window-level pointermove/up ────── */
  useEffect(() => {
    const handleMove = (evt) => {
      const drag = dragRef.current;
      if (!drag || !overlayRef.current) return;
      const norm = eventToNormalized(
        evt,
        overlayRef.current,
        preview,
        viewport,
      );
      const dx = norm.x - drag.startNorm.x;
      const dy = norm.y - drag.startNorm.y;

      if (Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002) {
        dragMovedRef.current = true;
      }

      if (drag.type === "anchor") {
        onMoveAnchor?.(drag.key, {
          anchor: {
            x: Math.max(0, Math.min(1, drag.startAnchor.x + dx)),
            y: Math.max(0, Math.min(1, drag.startAnchor.y + dy)),
          },
          current: {
            x: Math.max(0, Math.min(1, drag.startCurrent.x + dx)),
            y: Math.max(0, Math.min(1, drag.startCurrent.y + dy)),
          },
        });
      } else if (drag.type === "current") {
        onMoveCurrent?.(drag.key, {
          x: Math.max(0, Math.min(1, drag.startCurrent.x + dx)),
          y: Math.max(0, Math.min(1, drag.startCurrent.y + dy)),
        });
      }
    };

    const handleUp = () => {
      const drag = dragRef.current;
      if (drag && !dragMovedRef.current) {
        setSelectedKey(drag.key);
      }
      dragRef.current = null;
      dragMovedRef.current = false;
      setTimeout(() => {
        justInteractedWithHandleRef.current = false;
      }, 0);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [preview, viewport, onMoveAnchor, onMoveCurrent]);

  const handleHandlePointerDown = useCallback(
    (evt, point, handleType) => {
      evt.stopPropagation();
      evt.preventDefault();
      justInteractedWithHandleRef.current = true;

      if (evt.shiftKey) {
        onRemove?.(point.key);
        if (selectedKey === point.key) setSelectedKey(null);
        return;
      }
      if (!overlayRef.current) return;
      dragRef.current = {
        key: point.key,
        type: handleType,
        startNorm: eventToNormalized(
          evt,
          overlayRef.current,
          preview,
          viewport,
        ),
        startAnchor: { ...point.anchor },
        startCurrent: { ...point.current },
      };
      dragMovedRef.current = false;
    },
    [onRemove, preview, viewport, selectedKey],
  );

  const handleOverlayClick = useCallback(
    (evt) => {
      if (justInteractedWithHandleRef.current) return;

      if (isAddMode) {
        const norm = eventToNormalized(
          evt,
          overlayRef.current,
          preview,
          viewport,
        );
        onAdd?.(norm);
        return;
      }

      if (selectedKey) {
        setSelectedKey(null);
      }
    },
    [isAddMode, preview, viewport, onAdd, selectedKey],
  );

  const handleWheel = useCallback(
    (evt, point) => {
      evt.preventDefault();
      evt.stopPropagation();
      const delta = evt.deltaY > 0 ? -0.005 : 0.005;
      const newRadius = Math.max(
        NORM_RADIUS_MIN,
        Math.min(NORM_RADIUS_MAX, (point.radius || 0.05) + delta),
      );
      onResize?.(point.key, newRadius);
    },
    [onResize],
  );

  useEffect(() => {
    if (!selectedKey) return;
    const handler = (e) => {
      if (e.key === "Escape") setSelectedKey(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedKey]);

  useEffect(() => {
    if (!selectedKey) {
      setPopoverAnchor(null);
      setPopoverCurrent(null);
      return;
    }
    const point = controlPoints?.find((p) => p.key === selectedKey);
    if (!point || !overlayRef.current) {
      setPopoverAnchor(null);
      setPopoverCurrent(null);
      return;
    }
    setPopoverAnchor(
      normalizedToWindow(point.anchor, preview, viewport, overlayRef.current),
    );
    setPopoverCurrent(
      normalizedToWindow(point.current, preview, viewport, overlayRef.current),
    );
  }, [selectedKey, controlPoints, preview, viewport, canvasSize]);

  if (!isVisible || !preview || !canvasSize.width) return null;

  const pointsArr = Array.isArray(controlPoints) ? controlPoints : [];
  const selectedPoint = selectedKey
    ? pointsArr.find((p) => p.key === selectedKey)
    : null;

  const overlayCatchesEvents = isAddMode || !!selectedKey;

  return (
    <>
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: overlayCatchesEvents ? "auto" : "none",
          zIndex: 10,
          cursor: isAddMode ? "crosshair" : "default",
        }}
        onClick={handleOverlayClick}
      >
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {pointsArr.map((p) => {
            const screenAnchor = normalizedToScreen(
              p.anchor,
              preview,
              viewport,
            );
            const screenRadius =
              (p.radius || 0.05) * preview.width * viewport.scale;
            const isHover = hoveredKey === p.key;
            const isSelected = selectedKey === p.key;
            return (
              <circle
                key={`r-${p.key}`}
                cx={screenAnchor.x}
                cy={screenAnchor.y}
                r={screenRadius}
                fill={
                  isSelected
                    ? "rgba(61, 127, 255, 0.1)"
                    : "rgba(61, 127, 255, 0.05)"
                }
                stroke={
                  isSelected
                    ? "rgba(61, 127, 255, 0.55)"
                    : "rgba(61, 127, 255, 0.25)"
                }
                strokeWidth={isHover || isSelected ? 1.5 : 1}
                strokeDasharray="3 3"
                pointerEvents="none"
              />
            );
          })}

          {pointsArr.map((p) => {
            const a = normalizedToScreen(p.anchor, preview, viewport);
            const c = normalizedToScreen(p.current, preview, viewport);
            const dx = c.x - a.x;
            const dy = c.y - a.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 3) return null;

            const t1 = 8 / dist;
            const t2 = (dist - 8) / dist;
            if (t2 <= t1) return null;

            const x1 = a.x + dx * t1;
            const y1 = a.y + dy * t1;
            const x2 = a.x + dx * t2;
            const y2 = a.y + dy * t2;

            return (
              <g key={`arr-${p.key}`} pointerEvents="none">
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#3d7fff"
                  strokeWidth={1.5}
                  opacity={0.7}
                />
                <ArrowHead x={c.x} y={c.y} angle={Math.atan2(dy, dx)} />
              </g>
            );
          })}

          {pointsArr.map((p) => {
            const a = normalizedToScreen(p.anchor, preview, viewport);
            const c = normalizedToScreen(p.current, preview, viewport);
            const isHover = hoveredKey === p.key;
            const isSelected = selectedKey === p.key;
            const sizeBoost = isHover || isSelected ? 1.2 : 1;

            return (
              <g
                key={`pt-${p.key}`}
                onMouseEnter={() => setHoveredKey(p.key)}
                onMouseLeave={() =>
                  setHoveredKey((k) => (k === p.key ? null : k))
                }
              >
                <g
                  style={{ pointerEvents: "auto", cursor: "grab" }}
                  onPointerDown={(e) => handleHandlePointerDown(e, p, "anchor")}
                  onClick={(e) => e.stopPropagation()}
                  onWheel={(e) => handleWheel(e, p)}
                >
                  <circle cx={a.x} cy={a.y} r={12} fill="transparent" />
                  <circle
                    cx={a.x}
                    cy={a.y}
                    r={5 * sizeBoost}
                    fill="#22c55e"
                    stroke={isSelected ? "#fbbf24" : "#fff"}
                    strokeWidth={isSelected ? 2 : 1.5}
                    pointerEvents="none"
                  />
                </g>

                <g
                  style={{ pointerEvents: "auto", cursor: "grab" }}
                  onPointerDown={(e) =>
                    handleHandlePointerDown(e, p, "current")
                  }
                  onClick={(e) => e.stopPropagation()}
                  onWheel={(e) => handleWheel(e, p)}
                >
                  <circle cx={c.x} cy={c.y} r={14} fill="transparent" />
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={7 * sizeBoost}
                    fill="#3d7fff"
                    stroke={isSelected ? "#fbbf24" : "#fff"}
                    strokeWidth={isSelected ? 2.5 : 2}
                    pointerEvents="none"
                  />
                </g>

                {isHover && !isSelected && p.label && (
                  <text
                    x={c.x + 12}
                    y={c.y - 10}
                    fontSize={10}
                    fontWeight={600}
                    fill="#fff"
                    style={{
                      paintOrder: "stroke",
                      stroke: "rgba(0, 0, 0, 0.7)",
                      strokeWidth: 3,
                    }}
                    pointerEvents="none"
                  >
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {selectedPoint && popoverAnchor && popoverCurrent && (
        <ControlPointPopover
          point={selectedPoint}
          screenAnchor={popoverAnchor}
          screenCurrent={popoverCurrent}
          onChangeRadius={onResize}
          onChangeStrength={onChangeStrength}
          onRemove={(key) => {
            onRemove?.(key);
            setSelectedKey(null);
          }}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </>
  );
}

function ArrowHead({ x, y, angle }) {
  const size = 6;
  const a = angle;
  const x1 = x - Math.cos(a - Math.PI / 6) * size;
  const y1 = y - Math.sin(a - Math.PI / 6) * size;
  const x2 = x - Math.cos(a + Math.PI / 6) * size;
  const y2 = y - Math.sin(a + Math.PI / 6) * size;
  return (
    <polygon
      points={`${x},${y} ${x1},${y1} ${x2},${y2}`}
      fill="#3d7fff"
      opacity={0.85}
    />
  );
}
