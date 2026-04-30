// src/pages/simulation/breast/BreastEditorPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";

import { useZoomPan } from "../hooks/useZoomPan.js";
import { useCanvasImage } from "../hooks/useCanvasImage.js";

import { useBreastPlan } from "./hooks/useBreastPlan.js";
import { useIsMobile } from "./hooks/useIsMobile.js";
import { useBreastWarp } from "./hooks/useBreastWarp.js";

import BreastCanvas from "./components/BreastCanvas.jsx";
import BreastEditorToolbar from "./components/BreastEditorToolbar.jsx";
import BreastOperationPanel from "./components/BreastOperationPanel.jsx";
import BreastControlPointsOverlay from "./components/BreastControlPointsOverlay.jsx";
import BeforeAfterModal from "./components/BeforeAfterModal.jsx";
import MobileBottomSheet from "./components/MobileBottomSheet.jsx";

import "./components/breastSliders.css";

function computeFitViewport({
  canvasW,
  canvasH,
  imageW,
  imageH,
  padding = 30,
}) {
  const availW = Math.max(1, canvasW - padding * 2);
  const availH = Math.max(1, canvasH - padding * 2);
  const scale = Math.min(availW / imageW, availH / imageH);
  const tx = (canvasW - imageW * scale) / 2;
  const ty = (canvasH - imageH * scale) / 2;
  return { scale, tx, ty };
}

let manualPointCounter = 0;
const newManualKey = () => `manual-${Date.now()}-${++manualPointCounter}`;

const PHOTO_VIEW_LABELS = {
  front: "Анфас",
  side_left: "Профиль L",
  side_right: "Профиль R",
  oblique_left: "3/4 L",
  oblique_right: "3/4 R",
  bottom_up: "Снизу",
};

export default function BreastEditorPage() {
  const { id: planId } = useParams();
  const isMobile = useIsMobile();

  const { plan, loading, error, saveStatus, patchPlan } = useBreastPlan(planId);

  const {
    preview,
    loading: imageLoading,
    error: imageError,
    attempt,
    maxAttempts,
  } = useCanvasImage(plan?.photo?.url);

  const {
    viewport,
    handleWheel,
    startPan,
    updatePan,
    endPan,
    zoomIn,
    zoomOut,
    reset,
    setViewport,
  } = useZoomPan();

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [didInitialFit, setDidInitialFit] = useState(false);

  const handleSizeChange = useCallback((size) => {
    setCanvasSize({ width: size.width, height: size.height });
  }, []);

  const doFit = useCallback(() => {
    if (!preview || !canvasSize.width) return;
    const fitted = computeFitViewport({
      canvasW: canvasSize.width,
      canvasH: canvasSize.height,
      imageW: preview.width,
      imageH: preview.height,
      padding: 30,
    });
    setViewport(fitted);
    setDidInitialFit(true);
  }, [preview, canvasSize, setViewport]);

  useEffect(() => {
    if (preview && !didInitialFit && canvasSize.width) doFit();
  }, [preview, didInitialFit, canvasSize, doFit]);

  useEffect(() => {
    if (didInitialFit && canvasSize.width) doFit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.width, canvasSize.height]);

  const [isAddPointMode, setIsAddPointMode] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const photoView = plan?.photoView || "front";
  const photoViewLabel = PHOTO_VIEW_LABELS[photoView] || photoView;
  const controlPoints = plan?.controlPoints || [];

  const { warpedImageData, isWarping } = useBreastWarp({
    preview,
    controlPoints,
    isEnabled: true,
  });

  /* ─── Control points handlers ─── */

  const handleClearControlPoints = useCallback(() => {
    if (!window.confirm("Удалить все точки деформации?")) return;
    patchPlan({ controlPoints: [] });
  }, [patchPlan]);

  const handleToggleAddPointMode = useCallback(() => {
    setIsAddPointMode((v) => !v);
  }, []);

  const handleAddManualPoint = useCallback(
    (normPoint) => {
      const newPoint = {
        key: newManualKey(),
        anchor: { x: normPoint.x, y: normPoint.y },
        current: { x: normPoint.x, y: normPoint.y },
        radius: 0.05,
        strength: 1.0,
        label: "Точка",
        auto: false,
      };
      patchPlan({ controlPoints: [...controlPoints, newPoint] });
      setIsAddPointMode(false);
    },
    [controlPoints, patchPlan],
  );

  const handleMoveCpAnchor = useCallback(
    (key, { anchor, current }) => {
      const updated = controlPoints.map((p) =>
        p.key === key ? { ...p, anchor, current } : p,
      );
      patchPlan({ controlPoints: updated });
    },
    [controlPoints, patchPlan],
  );

  const handleMoveCpCurrent = useCallback(
    (key, current) => {
      const updated = controlPoints.map((p) =>
        p.key === key ? { ...p, current } : p,
      );
      patchPlan({ controlPoints: updated });
    },
    [controlPoints, patchPlan],
  );

  const handleResizeCp = useCallback(
    (key, radius) => {
      const updated = controlPoints.map((p) =>
        p.key === key ? { ...p, radius } : p,
      );
      patchPlan({ controlPoints: updated });
    },
    [controlPoints, patchPlan],
  );

  const handleChangeCpStrength = useCallback(
    (key, strength) => {
      const updated = controlPoints.map((p) =>
        p.key === key ? { ...p, strength } : p,
      );
      patchPlan({ controlPoints: updated });
    },
    [controlPoints, patchPlan],
  );

  const handleRemoveCp = useCallback(
    (key) => {
      const updated = controlPoints.filter((p) => p.key !== key);
      patchPlan({ controlPoints: updated });
    },
    [controlPoints, patchPlan],
  );

  /* ─── Compare handler ─── */
  const handleOpenCompare = useCallback(() => {
    setIsAddPointMode(false);
    setMobileSheetOpen(false);
    setCompareOpen(true);
  }, []);

  const canCompare = !!preview?.imageData && controlPoints.length > 0;

  /* ─── Pan/zoom handlers ─── */
  const dragStateRef = useRef(null);

  const onPointerDown = useCallback(
    (e) => {
      if (isAddPointMode) return;
      if (e.button !== undefined && e.button !== 0) return;

      dragStateRef.current = "pan";
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
      startPan(e);
    },
    [isAddPointMode, startPan],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (dragStateRef.current === "pan") {
        updatePan(e);
      }
    },
    [updatePan],
  );

  const onPointerUp = useCallback(
    (e) => {
      if (dragStateRef.current === "pan") {
        try {
          e.currentTarget.releasePointerCapture?.(e.pointerId);
        } catch {
          /* ignore */
        }
        endPan();
      }
      dragStateRef.current = null;
    },
    [endPan],
  );

  /* ─── Keyboard ─── */
  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key === "Escape") {
        if (compareOpen) return; // modal handles its own escape
        if (isAddPointMode) setIsAddPointMode(false);
        else if (mobileSheetOpen) setMobileSheetOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAddPointMode, mobileSheetOpen, compareOpen]);

  /* ─── Loading/error states ─── */
  if (error) {
    return (
      <div style={statusStateStyle}>
        <div style={statusTitleStyle}>Не удалось загрузить план</div>
        <div style={statusHintStyle}>{error.message}</div>
        <Link to="/dp/simulation/breast" style={backLinkStyle}>
          ← К списку
        </Link>
      </div>
    );
  }

  if (loading || !plan) {
    return (
      <div style={statusStateStyle}>
        <div style={statusTitleStyle}>Загрузка плана...</div>
      </div>
    );
  }

  if (imageError) {
    return (
      <div style={statusStateStyle}>
        <div style={statusTitleStyle}>Не удалось загрузить фото</div>
        <div style={statusHintStyle}>{imageError.message}</div>
        <Link to="/dp/simulation/breast" style={backLinkStyle}>
          ← К списку
        </Link>
      </div>
    );
  }

  if (imageLoading || !preview) {
    const isRetrying = attempt > 1;
    return (
      <div style={statusStateStyle}>
        <div style={statusTitleStyle}>
          {isRetrying
            ? `Загрузка фото (${attempt}/${maxAttempts})...`
            : "Загрузка фото..."}
        </div>
      </div>
    );
  }

  const operationPanel = (
    <BreastOperationPanel
      controlPointsCount={controlPoints.length}
      isAddMode={isAddPointMode}
      canCompare={canCompare}
      onClearPoints={handleClearControlPoints}
      onToggleAddMode={handleToggleAddPointMode}
      onOpenCompare={handleOpenCompare}
    />
  );

  return (
    <div style={pageStyle}>
      <div style={topBarStyle}>
        <Link to="/dp/simulation/breast" style={backLinkStyle}>
          ← {isMobile ? "" : "К списку"}
        </Link>
        <div style={planInfoStyle}>
          <span style={planLabelStyle}>{plan.label || "—"}</span>
          {plan.patientRef && !isMobile && (
            <span style={patientRefStyle}>· {plan.patientRef}</span>
          )}
          <span style={viewBadgeStyle}>{photoViewLabel}</span>
        </div>

        {/* Header compare button — desktop */}
        {!isMobile && (
          <button
            type="button"
            style={{
              ...headerCompareButtonStyle,
              ...(canCompare ? {} : headerCompareDisabledStyle),
            }}
            onClick={handleOpenCompare}
            disabled={!canCompare}
            title={
              canCompare ? "Открыть сравнение" : "Добавьте точки деформации"
            }
          >
            🔍 До / После
          </button>
        )}
      </div>

      <div style={editorRootStyle}>
        <BreastCanvas
          preview={preview}
          viewport={viewport}
          warpedImageData={warpedImageData}
          onWheel={handleWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onSizeChange={handleSizeChange}
        />

        <BreastControlPointsOverlay
          preview={preview}
          viewport={viewport}
          canvasSize={canvasSize}
          controlPoints={controlPoints}
          isAddMode={isAddPointMode}
          isVisible={true}
          onMoveAnchor={handleMoveCpAnchor}
          onMoveCurrent={handleMoveCpCurrent}
          onResize={handleResizeCp}
          onChangeStrength={handleChangeCpStrength}
          onRemove={handleRemoveCp}
          onAdd={handleAddManualPoint}
        />

        <BreastEditorToolbar
          viewport={viewport}
          saveStatus={saveStatus}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFit={doFit}
          onReset={reset}
        />

        {!isMobile && <div style={sidebarStyle}>{operationPanel}</div>}

        {isMobile && (
          <>
            <button
              type="button"
              style={fabOperationStyle}
              onClick={() => setMobileSheetOpen((v) => !v)}
              aria-label="Деформация"
            >
              {mobileSheetOpen ? "✕" : "✂"}
            </button>

            {canCompare && (
              <button
                type="button"
                style={fabCompareStyle}
                onClick={handleOpenCompare}
                aria-label="Сравнение"
              >
                🔍
              </button>
            )}

            <MobileBottomSheet
              open={mobileSheetOpen}
              onClose={() => setMobileSheetOpen(false)}
            >
              {operationPanel}
            </MobileBottomSheet>
          </>
        )}

        {!isMobile && (
          <div style={metaStyle}>
            {preview.width}×{preview.height}
            {controlPoints.length > 0 && ` · ${controlPoints.length} pts`}
            {isWarping && " · ◌"}
          </div>
        )}
      </div>

      <BeforeAfterModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        beforeImageData={preview?.imageData}
        afterImageData={warpedImageData}
        label={plan.label}
        patientRef={plan.patientRef}
        photoView={photoViewLabel}
      />
    </div>
  );
}

/* ─────── styles ─────── */

const pageStyle = {
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 64px)",
  background: "#f5f5f5",
};

const topBarStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 14px",
  background: "#fff",
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "#e5e7eb",
  flexShrink: 0,
};

const backLinkStyle = {
  fontSize: 14,
  color: "#0d6b5e",
  textDecoration: "none",
  fontWeight: 500,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const planInfoStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flex: 1,
  flexWrap: "wrap",
  fontSize: 13,
  minWidth: 0,
};

const planLabelStyle = {
  fontWeight: 600,
  color: "#1a1d1f",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const patientRefStyle = { color: "#666" };

const viewBadgeStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  padding: "3px 8px",
  borderRadius: 4,
  background: "#dbeafe",
  color: "#1e40af",
  flexShrink: 0,
};

const headerCompareButtonStyle = {
  padding: "8px 14px",
  background: "rgba(34, 197, 94, 0.12)",
  color: "#16a34a",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(34, 197, 94, 0.3)",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const headerCompareDisabledStyle = {
  opacity: 0.4,
  cursor: "not-allowed",
};

const editorRootStyle = {
  position: "relative",
  flex: 1,
  background: "#0f1420",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const sidebarStyle = {
  position: "absolute",
  insetInlineEnd: 16,
  top: 16,
  width: 260,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  zIndex: 8,
};

const fabBaseStyle = {
  position: "absolute",
  width: 56,
  height: 56,
  borderRadius: "50%",
  borderWidth: 0,
  borderStyle: "none",
  color: "#fff",
  fontSize: 22,
  fontWeight: 700,
  zIndex: 26,
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const fabOperationStyle = {
  ...fabBaseStyle,
  bottom: 16,
  insetInlineEnd: 16,
  background: "rgba(168, 85, 247, 0.95)",
  boxShadow: "0 4px 16px rgba(168, 85, 247, 0.45)",
};

const fabCompareStyle = {
  ...fabBaseStyle,
  bottom: 16,
  insetInlineStart: 16,
  background: "rgba(34, 197, 94, 0.95)",
  boxShadow: "0 4px 16px rgba(34, 197, 94, 0.45)",
};

const metaStyle = {
  position: "absolute",
  bottom: 12,
  left: "50%",
  transform: "translateX(-50%)",
  padding: "6px 10px",
  background: "rgba(20, 20, 30, 0.85)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.08)",
  borderRadius: 6,
  fontSize: 11,
  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
  color: "#94a3b8",
  zIndex: 10,
  pointerEvents: "none",
};

const statusStateStyle = {
  position: "relative",
  width: "100%",
  height: "calc(100vh - 64px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  background: "#f5f5f5",
  color: "#374151",
};

const statusTitleStyle = { fontSize: 16, fontWeight: 500 };
const statusHintStyle = {
  fontSize: 13,
  color: "#888",
  maxWidth: 400,
  textAlign: "center",
};
