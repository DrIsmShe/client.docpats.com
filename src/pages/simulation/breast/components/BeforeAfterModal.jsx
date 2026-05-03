// src/pages/simulation/breast/components/BeforeAfterModal.jsx
//
// Phase B fix v3 — ImageCanvas компонент сам рисует imageData при mount.
// Это исправляет баг где Рядом/Переключение/Анимация показывают пустые
// canvases (только Слайдер работал, потому что был первым активным mode).

import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";
import { exportBeforeAfter } from "../breastExportUtils.js";

const VIEW_MODES = [
  {
    key: "slider",
    labelKey: "beforeAfter.modes.slider",
    labelDefault: "Слайдер",
    icon: "◐",
  },
  {
    key: "side",
    labelKey: "beforeAfter.modes.side",
    labelDefault: "Рядом",
    icon: "▌▌",
  },
  {
    key: "toggle",
    labelKey: "beforeAfter.modes.toggle",
    labelDefault: "Переключение",
    icon: "⇄",
  },
  {
    key: "animation",
    labelKey: "beforeAfter.modes.animation",
    labelDefault: "Анимация",
    icon: "⟳",
  },
];

const EXPORT_OPTIONS = [
  {
    key: "side-by-side-png",
    labelKey: "beforeAfter.exportOptions.sideBySidePng.label",
    labelDefault: "Сравнение (PNG)",
    descKey: "beforeAfter.exportOptions.sideBySidePng.desc",
    descDefault: "Высокое качество",
  },
  {
    key: "side-by-side-jpg",
    labelKey: "beforeAfter.exportOptions.sideBySideJpg.label",
    labelDefault: "Сравнение (JPG)",
    descKey: "beforeAfter.exportOptions.sideBySideJpg.desc",
    descDefault: "Для мессенджеров",
  },
  {
    key: "before-png",
    labelKey: "beforeAfter.exportOptions.beforePng.label",
    labelDefault: "Только ДО (PNG)",
    descKey: "beforeAfter.exportOptions.beforePng.desc",
    descDefault: "Исходное фото",
  },
  {
    key: "after-png",
    labelKey: "beforeAfter.exportOptions.afterPng.label",
    labelDefault: "Только ПОСЛЕ (PNG)",
    descKey: "beforeAfter.exportOptions.afterPng.desc",
    descDefault: "Деформированное",
  },
  {
    key: "pdf",
    labelKey: "beforeAfter.exportOptions.pdf.label",
    labelDefault: "PDF отчёт",
    descKey: "beforeAfter.exportOptions.pdf.desc",
    descDefault: "3 страницы с метаданными",
  },
];

/* ──────────────────────────────────────────────────────────────────────
   ImageCanvas — самодостаточный компонент, который рисует ImageData
   на свой canvas при mount и при изменении imageData.
   ────────────────────────────────────────────────────────────────────── */
function ImageCanvas({ imageData, style, className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !imageData) return;
    const canvas = canvasRef.current;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d");
    ctx.putImageData(imageData, 0, 0);
  }, [imageData]);

  return <canvas ref={canvasRef} style={style} className={className} />;
}

export default function BeforeAfterModal({
  open,
  onClose,
  beforeImageData,
  afterImageData,
  label,
  patientRef,
  photoView,
}) {
  const { t } = useTranslation("Simulation");

  const [mode, setMode] = useState("slider");
  const [sliderPos, setSliderPos] = useState(0.5);
  const [toggleShowAfter, setToggleShowAfter] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [exportError, setExportError] = useState(null);

  /* ── Animation mode ── */
  useEffect(() => {
    if (!open || mode !== "animation") return;
    const interval = setInterval(() => {
      setToggleShowAfter((v) => !v);
    }, 1500);
    return () => clearInterval(interval);
  }, [open, mode]);

  /* ── Esc to close ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") {
        if (exportMenuOpen) setExportMenuOpen(false);
        else onClose?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, exportMenuOpen]);

  /* ── Body scroll lock ── */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* ── Toggle click ── */
  const handleToggleClick = useCallback(() => {
    if (mode === "toggle") setToggleShowAfter((v) => !v);
  }, [mode]);

  /* ── Slider drag ── */
  const sliderContainerRef = useRef(null);
  const handleSliderMove = useCallback((evt) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    setSliderPos(Math.max(0, Math.min(1, x / rect.width)));
  }, []);

  const sliderDragging = useRef(false);
  const handleSliderStart = useCallback(
    (evt) => {
      sliderDragging.current = true;
      handleSliderMove(evt);
    },
    [handleSliderMove],
  );

  useEffect(() => {
    if (mode !== "slider") return;
    const move = (evt) => {
      if (sliderDragging.current) handleSliderMove(evt);
    };
    const up = () => {
      sliderDragging.current = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [mode, handleSliderMove]);

  /* ── Export ── */
  const handleExport = useCallback(
    async (format) => {
      if (!beforeImageData || !afterImageData) {
        setExportError(
          t("beforeAfter.errors.noData", {
            defaultValue: "Нет данных для экспорта",
          }),
        );
        return;
      }
      setExporting(format);
      setExportError(null);
      try {
        await exportBeforeAfter(format, {
          beforeImageData,
          afterImageData,
          label,
          patientRef,
          photoView,
        });
        setExportMenuOpen(false);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[BeforeAfterModal] export failed:", err);
        setExportError(
          err?.message ||
            t("beforeAfter.errors.exportFailed", {
              defaultValue: "Ошибка экспорта",
            }),
        );
      } finally {
        setExporting(null);
      }
    },
    [beforeImageData, afterImageData, label, patientRef, photoView, t],
  );

  if (!open) return null;

  const modalContent =
    !beforeImageData || !afterImageData ? (
      <div style={modalStyle}>
        <div style={emptyStyle}>
          <div style={emptyTitleStyle}>
            {t("beforeAfter.empty.title", {
              defaultValue: "Нет деформации для сравнения",
            })}
          </div>
          <div style={emptyHintStyle}>
            {t("beforeAfter.empty.hint", {
              defaultValue:
                'Добавьте хотя бы одну точку деформации, чтобы увидеть результат "после".',
            })}
          </div>
          <button type="button" style={primaryButtonStyle} onClick={onClose}>
            ←{" "}
            {t("beforeAfter.empty.backButton", {
              defaultValue: "Вернуться к редактированию",
            })}
          </button>
        </div>
      </div>
    ) : (
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <button type="button" style={backButtonStyle} onClick={onClose}>
            ←{" "}
            {t("beforeAfter.backButton", {
              defaultValue: "Назад к редактированию",
            })}
          </button>

          <div style={headerCenterStyle}>
            <div style={headerTitleStyle}>
              {label ||
                t("beforeAfter.fallbackLabel", { defaultValue: "План" })}
              {patientRef && (
                <span style={headerPatientStyle}> · {patientRef}</span>
              )}
            </div>
          </div>

          <div style={exportContainerStyle}>
            <button
              type="button"
              style={{
                ...exportButtonStyle,
                ...(exportMenuOpen ? exportButtonOpenStyle : {}),
              }}
              onClick={() => setExportMenuOpen((v) => !v)}
            >
              ⬇ {t("beforeAfter.downloadButton", { defaultValue: "Скачать" })}
            </button>
            {exportMenuOpen && (
              <ExportMenu
                t={t}
                onSelect={handleExport}
                onClose={() => setExportMenuOpen(false)}
                exporting={exporting}
                error={exportError}
              />
            )}
          </div>
        </div>

        {/* Mode tabs */}
        <div style={modeBarStyle}>
          <div style={modeTabsStyle}>
            {VIEW_MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                style={{
                  ...modeTabStyle,
                  ...(mode === m.key ? modeTabActiveStyle : {}),
                }}
                onClick={() => setMode(m.key)}
              >
                <span style={modeTabIconStyle}>{m.icon}</span>
                <span style={modeTabLabelStyle}>
                  {t(m.labelKey, { defaultValue: m.labelDefault })}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {mode === "side" && (
            <SideMode
              t={t}
              beforeImageData={beforeImageData}
              afterImageData={afterImageData}
            />
          )}

          {mode === "slider" && (
            <SliderMode
              t={t}
              beforeImageData={beforeImageData}
              afterImageData={afterImageData}
              sliderPos={sliderPos}
              sliderContainerRef={sliderContainerRef}
              onStart={handleSliderStart}
            />
          )}

          {mode === "toggle" && (
            <ToggleMode
              t={t}
              beforeImageData={beforeImageData}
              afterImageData={afterImageData}
              showAfter={toggleShowAfter}
              onClick={handleToggleClick}
            />
          )}

          {mode === "animation" && (
            <ToggleMode
              t={t}
              beforeImageData={beforeImageData}
              afterImageData={afterImageData}
              showAfter={toggleShowAfter}
              isAnimation
            />
          )}
        </div>
      </div>
    );

  return ReactDOM.createPortal(modalContent, document.body);
}

/* ──────────────────────────────────────────────────────────────────────
   View modes — теперь принимают imageData напрямую и используют ImageCanvas
   ────────────────────────────────────────────────────────────────────── */

function SideMode({ t, beforeImageData, afterImageData }) {
  const beforeLabel = t("beforeAfter.before", { defaultValue: "ДО" });
  const afterLabel = t("beforeAfter.after", { defaultValue: "ПОСЛЕ" });

  return (
    <div style={sideContainerStyle}>
      <div style={sidePanelStyle}>
        <div style={sideLabelStyle}>{beforeLabel}</div>
        <div style={sideImageWrapStyle}>
          <ImageCanvas imageData={beforeImageData} style={canvasStyle} />
        </div>
      </div>
      <div style={sideDividerStyle} />
      <div style={sidePanelStyle}>
        <div style={{ ...sideLabelStyle, color: "#4ade80" }}>{afterLabel}</div>
        <div style={sideImageWrapStyle}>
          <ImageCanvas imageData={afterImageData} style={canvasStyle} />
        </div>
      </div>
    </div>
  );
}

function SliderMode({
  t,
  beforeImageData,
  afterImageData,
  sliderPos,
  sliderContainerRef,
  onStart,
}) {
  const beforeLabel = t("beforeAfter.before", { defaultValue: "ДО" });
  const afterLabel = t("beforeAfter.after", { defaultValue: "ПОСЛЕ" });

  return (
    <div style={sliderModeStyle}>
      <div
        ref={sliderContainerRef}
        style={sliderImageContainerStyle}
        onPointerDown={onStart}
      >
        <ImageCanvas imageData={beforeImageData} style={sliderCanvasStyle} />
        <div
          style={{
            ...sliderClipStyle,
            clipPath: `inset(0 ${(1 - sliderPos) * 100}% 0 0)`,
          }}
        >
          <ImageCanvas imageData={afterImageData} style={sliderCanvasStyle} />
        </div>

        <div style={{ ...sliderLabelStyle, left: 16, color: "#fff" }}>
          {beforeLabel}
        </div>
        <div style={{ ...sliderLabelStyle, right: 16, color: "#4ade80" }}>
          {afterLabel}
        </div>

        <div
          style={{
            ...sliderHandleLineStyle,
            left: `${sliderPos * 100}%`,
          }}
        >
          <div style={sliderHandleKnobStyle}>
            <span style={sliderHandleArrowsStyle}>⇆</span>
          </div>
        </div>
      </div>
      <div style={sliderHintStyle}>
        {t("beforeAfter.sliderHint", {
          defaultValue: "Перетаскивайте разделитель влево/вправо для сравнения",
        })}
      </div>
    </div>
  );
}

function ToggleMode({
  t,
  beforeImageData,
  afterImageData,
  showAfter,
  onClick,
  isAnimation,
}) {
  const beforeLabel = t("beforeAfter.before", { defaultValue: "ДО" });
  const afterLabel = t("beforeAfter.after", { defaultValue: "ПОСЛЕ" });

  return (
    <div
      style={{
        ...toggleContainerStyle,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <div style={toggleImageWrapStyle}>
        <ImageCanvas
          imageData={beforeImageData}
          style={{
            ...toggleCanvasStyle,
            opacity: showAfter ? 0 : 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: showAfter ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <ImageCanvas imageData={afterImageData} style={toggleCanvasStyle} />
        </div>
      </div>
      <div style={toggleStatusStyle}>
        <div
          style={{
            ...toggleBadgeStyle,
            background: showAfter
              ? "rgba(34, 197, 94, 0.2)"
              : "rgba(255,255,255,0.1)",
            color: showAfter ? "#4ade80" : "#cbd5e1",
            borderColor: showAfter
              ? "rgba(34, 197, 94, 0.4)"
              : "rgba(255,255,255,0.15)",
          }}
        >
          {showAfter ? afterLabel : beforeLabel}
        </div>
        <div style={toggleHintStyle}>
          {isAnimation
            ? t("beforeAfter.toggleHintAnimation", {
                defaultValue: "Авто-переключение",
              })
            : t("beforeAfter.toggleHint", {
                defaultValue: "Кликните чтобы переключить",
              })}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Export menu
   ────────────────────────────────────────────────────────────────────── */

function ExportMenu({ t, onSelect, onClose, exporting, error }) {
  return (
    <>
      <div style={exportOverlayStyle} onClick={onClose} />
      <div style={exportMenuStyle}>
        <div style={exportMenuTitleStyle}>
          {t("beforeAfter.exportMenuTitle", {
            defaultValue: "Выберите формат:",
          })}
        </div>
        {EXPORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            style={{
              ...exportItemStyle,
              ...(exporting === opt.key ? exportItemBusyStyle : {}),
            }}
            onClick={() => onSelect(opt.key)}
            disabled={!!exporting}
          >
            <div style={exportItemLabelStyle}>
              {t(opt.labelKey, { defaultValue: opt.labelDefault })}
            </div>
            <div style={exportItemDescStyle}>
              {exporting === opt.key
                ? t("beforeAfter.exportBusy", {
                    defaultValue: "Создаём файл...",
                  })
                : t(opt.descKey, { defaultValue: opt.descDefault })}
            </div>
          </button>
        ))}
        {error && <div style={exportErrorStyle}>⚠ {error}</div>}
      </div>
    </>
  );
}

/* ─────── styles ─────── */

const modalStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(10, 14, 24, 0.98)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  zIndex: 2147483000,
  display: "flex",
  flexDirection: "column",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  color: "#e2e8f0",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "12px 18px",
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "rgba(255, 255, 255, 0.08)",
  flexWrap: "wrap",
  flexShrink: 0,
};

const backButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 14px",
  background: "rgba(255, 255, 255, 0.08)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.12)",
  borderRadius: 6,
  color: "#e2e8f0",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const headerCenterStyle = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
  textAlign: "center",
};

const headerTitleStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#e2e8f0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const headerPatientStyle = {
  color: "#94a3b8",
  fontWeight: 400,
};

const modeBarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 18px",
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "rgba(255, 255, 255, 0.05)",
  flexShrink: 0,
};

const modeTabsStyle = {
  display: "flex",
  gap: 4,
  background: "rgba(255, 255, 255, 0.04)",
  padding: 4,
  borderRadius: 8,
  flexWrap: "wrap",
};

const modeTabStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  background: "transparent",
  borderWidth: 0,
  borderStyle: "none",
  borderRadius: 5,
  color: "#94a3b8",
  fontSize: 12,
  fontFamily: "inherit",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const modeTabActiveStyle = {
  background: "rgba(61, 127, 255, 0.18)",
  color: "#93c5fd",
  fontWeight: 600,
};

const modeTabIconStyle = {
  fontSize: 13,
  fontFamily: "ui-monospace, monospace",
};

const modeTabLabelStyle = {};

const exportContainerStyle = {
  position: "relative",
  flexShrink: 0,
};

const exportButtonStyle = {
  padding: "9px 16px",
  background: "rgba(34, 197, 94, 0.2)",
  color: "#4ade80",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(34, 197, 94, 0.45)",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const exportButtonOpenStyle = {
  background: "rgba(34, 197, 94, 0.3)",
  borderColor: "rgba(34, 197, 94, 0.7)",
};

const exportOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483001,
};

const exportMenuStyle = {
  position: "absolute",
  top: "calc(100% + 8px)",
  insetInlineEnd: 0,
  width: 280,
  background: "rgba(15, 20, 32, 0.99)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.15)",
  borderRadius: 8,
  padding: 8,
  zIndex: 2147483002,
  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6)",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const exportMenuTitleStyle = {
  fontSize: 10,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 600,
  padding: "4px 10px 8px",
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "rgba(255, 255, 255, 0.06)",
  marginBottom: 4,
};

const exportItemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: "10px 12px",
  background: "transparent",
  borderWidth: 0,
  borderStyle: "none",
  borderRadius: 5,
  color: "#e2e8f0",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "start",
  width: "100%",
};

const exportItemBusyStyle = {
  background: "rgba(61, 127, 255, 0.15)",
  cursor: "wait",
};

const exportItemLabelStyle = {
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 2,
};

const exportItemDescStyle = {
  fontSize: 11,
  color: "#94a3b8",
};

const exportErrorStyle = {
  padding: "8px 11px",
  fontSize: 11,
  color: "#fca5a5",
  background: "rgba(239, 68, 68, 0.1)",
  borderRadius: 5,
  marginTop: 4,
};

const contentStyle = {
  flex: 1,
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
  position: "relative",
};

const sideContainerStyle = {
  display: "flex",
  alignItems: "stretch",
  justifyContent: "center",
  gap: 12,
  width: "100%",
  height: "100%",
  maxHeight: "100%",
};

const sidePanelStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
  flex: 1,
  minWidth: 0,
  maxHeight: "100%",
};

const sideLabelStyle = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  color: "#cbd5e1",
  flexShrink: 0,
};

const sideImageWrapStyle = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
};

const sideDividerStyle = {
  width: 1,
  background: "rgba(255, 255, 255, 0.08)",
};

const canvasStyle = {
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
  borderRadius: 4,
};

const sliderModeStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
  width: "100%",
  height: "100%",
};

const sliderImageContainerStyle = {
  position: "relative",
  flex: 1,
  minHeight: 0,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "ew-resize",
  userSelect: "none",
  touchAction: "none",
};

const sliderCanvasStyle = {
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
  borderRadius: 4,
  userSelect: "none",
  pointerEvents: "none",
};

const sliderClipStyle = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
};

const sliderLabelStyle = {
  position: "absolute",
  top: 16,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  padding: "5px 12px",
  background: "rgba(0, 0, 0, 0.6)",
  borderRadius: 4,
  pointerEvents: "none",
};

const sliderHandleLineStyle = {
  position: "absolute",
  top: 0,
  bottom: 0,
  width: 2,
  background: "#fff",
  transform: "translateX(-50%)",
  pointerEvents: "none",
  boxShadow: "0 0 8px rgba(0, 0, 0, 0.4)",
};

const sliderHandleKnobStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
};

const sliderHandleArrowsStyle = {
  fontSize: 16,
  color: "#1a1d1f",
};

const sliderHintStyle = {
  fontSize: 11,
  color: "#94a3b8",
  flexShrink: 0,
};

const toggleContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 14,
  width: "100%",
  height: "100%",
};

const toggleImageWrapStyle = {
  position: "relative",
  flex: 1,
  minHeight: 0,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const toggleCanvasStyle = {
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
  borderRadius: 4,
  transition: "opacity 0.3s ease",
};

const toggleStatusStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexShrink: 0,
};

const toggleBadgeStyle = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  padding: "6px 16px",
  borderRadius: 6,
  borderWidth: 1,
  borderStyle: "solid",
  transition: "all 0.3s ease",
};

const toggleHintStyle = {
  fontSize: 11,
  color: "#94a3b8",
};

const emptyStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  gap: 14,
  textAlign: "center",
  padding: 24,
};

const emptyTitleStyle = {
  fontSize: 18,
  fontWeight: 600,
  color: "#e2e8f0",
};

const emptyHintStyle = {
  fontSize: 13,
  color: "#94a3b8",
  maxWidth: 360,
  lineHeight: 1.5,
};

const primaryButtonStyle = {
  padding: "10px 20px",
  background: "rgba(61, 127, 255, 0.2)",
  color: "#93c5fd",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(61, 127, 255, 0.4)",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  marginTop: 12,
};
