// client/src/pages/radiology/components/RadiologyCanvas.jsx
//
// Общий холст модуля: показывает снимок с zoom/pan и накладывает разметку.
// Используется и ридером учащегося, и инструментом авторинга — разница
// только в режиме (view/draw) и в том, что за аннотации ему передают.
//
// Переиспользует движок из simulation: useZoomPan (колесо-зум относительно
// курсора, drag-pan) и координатные хелперы. Координаты аннотаций —
// НОРМАЛИЗОВАНЫ к 0..1, как и на бэкенде: одна система координат у эталона
// эксперта и у ответа учащегося.
//
// Слои: снимок рисуется в «мире» через CSS-transform (translate+scale), а
// разметка — в экранных координатах в SVG поверх (проекцией через
// viewport), чтобы маркеры оставались чёткими и одинакового размера на
// любом зуме.

import { useCallback, useEffect, useRef, useState } from "react";
import { useZoomPan } from "../../simulation/hooks/useZoomPan.js";
import {
  computeFitViewport,
  imageToCanvas,
  pointerToImage,
} from "../../simulation/utils/coordinateHelpers.js";

const clamp01 = (x) => Math.max(0, Math.min(1, x));

export default function RadiologyCanvas({
  imageUrl,
  annotations = [], // ответ учащегося / находки автора (синие)
  overlays = [], // эталон эксперта в разборе (янтарные, пунктир)
  mode = "view", // "view" | "draw"
  tool = "pan", // "pan" | "point" | "rect"
  onCreate, // (annotation{shape,coords}) => void — при разметке
  height = 480,
}) {
  const containerRef = useRef(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [draft, setDraft] = useState(null); // прямоугольник в процессе рисования (img px)
  const [imgError, setImgError] = useState(false);
  const dragging = useRef(false);

  // Сбрасываем ошибку загрузки при смене снимка — иначе сообщение зависало бы
  // с прошлого битого URL на новом, рабочем.
  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const {
    viewport,
    attachWheelListener,
    startPan,
    updatePan,
    endPan,
    zoomIn,
    zoomOut,
    setViewport,
  } = useZoomPan();

  // Замер контейнера (для fit-to-view и размера SVG-оверлея).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Колесо-зум с { passive:false } — иначе preventDefault не сработает.
  useEffect(
    () => attachWheelListener(containerRef.current),
    [attachWheelListener],
  );

  const fit = useCallback(() => {
    if (!natural.w || !size.w) return;
    setViewport(
      computeFitViewport({
        canvasW: size.w,
        canvasH: size.h,
        imageW: natural.w,
        imageH: natural.h,
        padding: 16,
      }),
    );
  }, [natural, size, setViewport]);

  // Вписываем при смене снимка/размеров.
  useEffect(() => {
    fit();
  }, [natural.w, natural.h, size.w, size.h, imageUrl, fit]);

  const project = (nx, ny) =>
    imageToCanvas(nx * natural.w, ny * natural.h, viewport);

  // ─── Указатель ───
  function onDown(e) {
    // Средняя/правая кнопка — всегда pan (удобно при разметке).
    if (e.button !== 0 || mode !== "draw" || tool === "pan") {
      startPan(e);
      dragging.current = "pan";
      return;
    }
    const p = pointerToImage(e, containerRef.current, viewport);
    if (tool === "point") {
      emitPoint(p);
      dragging.current = false;
      return;
    }
    if (tool === "rect") {
      setDraft({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
      dragging.current = "rect";
    }
  }

  function onMove(e) {
    if (dragging.current === "pan") {
      updatePan(e);
      return;
    }
    if (dragging.current === "rect") {
      const p = pointerToImage(e, containerRef.current, viewport);
      setDraft((d) => (d ? { ...d, x1: p.x, y1: p.y } : d));
    }
  }

  function onUp() {
    if (dragging.current === "rect" && draft) {
      finalizeRect(draft);
      setDraft(null);
    }
    if (dragging.current === "pan") endPan();
    dragging.current = false;
  }

  function emitPoint(pImg) {
    if (!natural.w) return;
    onCreate?.({
      shape: "point",
      coords: { x: clamp01(pImg.x / natural.w), y: clamp01(pImg.y / natural.h) },
    });
  }

  function finalizeRect(d) {
    if (!natural.w) return;
    const x0 = clamp01(Math.min(d.x0, d.x1) / natural.w);
    const y0 = clamp01(Math.min(d.y0, d.y1) / natural.h);
    const x1 = clamp01(Math.max(d.x0, d.x1) / natural.w);
    const y1 = clamp01(Math.max(d.y0, d.y1) / natural.h);
    const w = x1 - x0;
    const h = y1 - y0;
    if (w < 0.01 || h < 0.01) return; // случайный клик — не находка
    onCreate?.({ shape: "rect", coords: { x: x0, y: y0, w, h } });
  }

  // ─── Отрисовка одной аннотации в экранных координатах ───
  function renderAnn(a, key, isOverlay) {
    const color = a.color || (isOverlay ? "#f59e0b" : "#2563eb");
    const dash = isOverlay ? "5 4" : undefined;
    if (a.shape === "point") {
      const c = project(a.coords.x, a.coords.y);
      return (
        <g key={key}>
          <circle cx={c.x} cy={c.y} r={8} fill="none" stroke={color} strokeWidth={2} strokeDasharray={dash} />
          <circle cx={c.x} cy={c.y} r={2.5} fill={color} />
          {a.label && (
            <text x={c.x + 11} y={c.y - 7} fontSize="12" fill={color} style={labelStyle}>
              {a.label}
            </text>
          )}
        </g>
      );
    }
    if (a.shape === "rect") {
      const p0 = project(a.coords.x, a.coords.y);
      const p1 = project(a.coords.x + a.coords.w, a.coords.y + a.coords.h);
      return (
        <g key={key}>
          <rect x={p0.x} y={p0.y} width={p1.x - p0.x} height={p1.y - p0.y} fill="none" stroke={color} strokeWidth={2} strokeDasharray={dash} />
          {a.label && (
            <text x={p0.x} y={p0.y - 5} fontSize="12" fill={color} style={labelStyle}>
              {a.label}
            </text>
          )}
        </g>
      );
    }
    if (a.shape === "ellipse") {
      const c = project(a.coords.cx, a.coords.cy);
      const e = project(a.coords.cx + a.coords.rx, a.coords.cy + a.coords.ry);
      return (
        <ellipse key={key} cx={c.x} cy={c.y} rx={Math.abs(e.x - c.x)} ry={Math.abs(e.y - c.y)} fill="none" stroke={color} strokeWidth={2} strokeDasharray={dash} />
      );
    }
    if (a.shape === "polygon") {
      const pts = (a.coords.points || [])
        .map((p) => {
          const q = project(p.x, p.y);
          return `${q.x},${q.y}`;
        })
        .join(" ");
      return <polygon key={key} points={pts} fill="none" stroke={color} strokeWidth={2} strokeDasharray={dash} />;
    }
    return null;
  }

  // Прямоугольник, который сейчас рисуют.
  const draftScreen = draft
    ? (() => {
        const a = imageToCanvas(Math.min(draft.x0, draft.x1), Math.min(draft.y0, draft.y1), viewport);
        const b = imageToCanvas(Math.max(draft.x0, draft.x1), Math.max(draft.y0, draft.y1), viewport);
        return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
      })()
    : null;

  const cursor = mode === "draw" && tool !== "pan" ? "crosshair" : "grab";

  return (
    <div className="rad-canvas-wrap">
      <div className="rad-canvas-toolbar">
        <button type="button" title="Приблизить" onClick={zoomIn}>＋</button>
        <button type="button" title="Отдалить" onClick={zoomOut}>－</button>
        <button type="button" title="Вписать" onClick={fit}>⤢</button>
      </div>
      <div
        ref={containerRef}
        className="rad-canvas"
        style={{ height, cursor }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: `translate(${viewport.tx}px, ${viewport.ty}px) scale(${viewport.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              onLoad={(e) => {
                setImgError(false);
                setNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight });
              }}
              onError={() => setImgError(true)}
              style={{ display: "block", userSelect: "none", pointerEvents: "none" }}
            />
          )}
        </div>

        {/* Подсказки поверх пустого/битого холста */}
        {!imageUrl && (
          <div style={placeholderStyle}>Добавьте снимок — загрузите файл или вставьте URL</div>
        )}
        {imageUrl && imgError && (
          <div style={placeholderStyle}>
            Снимок не загрузился по этому URL.<br />
            Проверьте, что ссылка ведёт прямо на картинку и доступна публично.
          </div>
        )}
        <svg className="rad-overlay" width={size.w} height={size.h}>
          {overlays.map((a, i) => renderAnn(a, `o${i}`, true))}
          {annotations.map((a, i) => renderAnn(a, `a${i}`, false))}
          {draftScreen && (
            <rect
              x={draftScreen.x}
              y={draftScreen.y}
              width={draftScreen.w}
              height={draftScreen.h}
              fill="rgba(37,99,235,0.12)"
              stroke="#2563eb"
              strokeWidth={2}
            />
          )}
        </svg>
      </div>
    </div>
  );
}

const labelStyle = {
  paintOrder: "stroke",
  stroke: "rgba(0,0,0,0.6)",
  strokeWidth: 3,
  strokeLinejoin: "round",
  fontWeight: 600,
};

const placeholderStyle = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  color: "#94a3b8",
  fontSize: 14,
  padding: 24,
  pointerEvents: "none",
};
