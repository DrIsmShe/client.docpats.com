// src/pages/simulation/hooks/useControlPoints.js
import { useState, useCallback, useRef, useEffect } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Single source-of-truth для control points в редакторе.

   Зачем свой hook, а не sizeofless usage Redux:
   — Во время drag'а точки мы меняем state 60 раз/сек. Dispatch'ить в Redux
     каждое движение = перерисовывать весь SimulationEditor каждый кадр.
   — В конце drag'а (pointer up) делаем ОДИН commit в Redux, который
     триггерит autosave и undo-snapshot.

   State:
     points     — массив (initial из Redux, потом мутируется локально)
     selectedKey— ключ выделенной точки (для PropertiesPanel)
     mode       — 'select' (по умолчанию) | 'add' (клик по canvas = новая)
     dragging   — { key, startPoint, startPointerNorm } | null

   Почему key, а не index: при reorder/delete индексы сбиваются, а key
   стабилен. Генерируем через uuid при создании точки.

   S.7.5: addPoint принимает второй аргумент с переопределением радиуса
   и силы. Это позволяет landmark-driven workflow создавать точки с
   мягкими дефолтами, не трогая ручной workflow.

   S.7.7+ (cleanup): addPoint принимает options.source — метку источника
   создания точки (например "manual_wizard"). Хранится на point как
   поле `source`. Используется для bulk-удаления по типу источника.
   Также экспонируется commitPoints для внешних массовых мутаций
   (delete-manual, reset-all) с прохождением через onCommit
   (history + autosave + redux).
   ────────────────────────────────────────────────────────────────────────── */

let keyCounter = 0;
function genKey() {
  keyCounter += 1;
  return `cp_${Date.now().toString(36)}_${keyCounter}`;
}

// ── Дефолты ────────────────────────────────────────────────────────
// Раньше было strength=1.0, radius=0.08 — слишком агрессивно для
// косметических симуляций ринопластики. При strength=1.0 деформация
// «вырывает» большой кусок изображения. Мягкие дефолты позволяют
// получить тонкую деформацию из коробки; врач увеличит силу через
// PropertiesPanel когда понадобится.
const DEFAULT_POINT_RADIUS = 0.05; // было 0.08
const DEFAULT_POINT_STRENGTH = 0.5; // было 1.0

export function useControlPoints({ initialPoints, onCommit }) {
  const [points, setPoints] = useState(initialPoints || []);
  const [selectedKey, setSelectedKey] = useState(null);
  const [mode, setMode] = useState("select");
  const pointsRef = useRef(points);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  /* ────────── Внешний source изменился (undo/redo/fetchPlan) ────────── */
  const syncFromExternal = useCallback((external) => {
    setPoints(external || []);
    setSelectedKey((prev) => {
      if (!prev) return null;
      return (external || []).some((p) => p.key === prev) ? prev : null;
    });
  }, []);

  const commit = useCallback(
    (next, meta = {}) => {
      setPoints(next);
      pointsRef.current = next;
      onCommit?.(next, meta);
    },
    [onCommit],
  );

  /* ────────── ADD ──────────
     Сигнатура: addPoint({x, y}, options?)
     options = { radius?, strength?, source? }
       • radius / strength — переопределяют дефолты (landmark-driven workflow)
       • source            — метка источника создания точки
                             (например "manual_wizard"), хранится на point
                             в поле `source`. Используется для bulk-удаления.
  */
  const addPoint = useCallback(
    ({ x, y }, options = {}) => {
      // Clamp в [0..1]
      const nx = Math.max(0, Math.min(1, x));
      const ny = Math.max(0, Math.min(1, y));

      const newPoint = {
        key: genKey(),
        anchor: { x: nx, y: ny },
        current: { x: nx, y: ny }, // нулевой displacement
        radius:
          typeof options.radius === "number"
            ? options.radius
            : DEFAULT_POINT_RADIUS,
        strength:
          typeof options.strength === "number"
            ? options.strength
            : DEFAULT_POINT_STRENGTH,
      };

      // Только если source явно передан — добавляем поле, иначе
      // schema у старых точек остаётся такой же (без поля source).
      if (options.source) {
        newPoint.source = options.source;
      }

      const next = [...pointsRef.current, newPoint];
      commit(next, { action: "add", key: newPoint.key });
      setSelectedKey(newPoint.key);
      setMode("select");
      return newPoint.key;
    },
    [commit],
  );

  /* ────────── DELETE ────────── */
  const deletePoint = useCallback(
    (key) => {
      const next = pointsRef.current.filter((p) => p.key !== key);
      commit(next, { action: "delete", key });
      if (selectedKey === key) setSelectedKey(null);
    },
    [commit, selectedKey],
  );

  /* ────────── UPDATE (radius / strength из PropertiesPanel) ────────── */
  const updatePoint = useCallback(
    (key, patch) => {
      const next = pointsRef.current.map((p) =>
        p.key === key ? { ...p, ...patch } : p,
      );
      commit(next, { action: "update", key });
    },
    [commit],
  );

  /* ────────── DRAG: current-handle ────────── */
  const draggingRef = useRef(null);

  const startDragCurrent = useCallback((key, pointerNorm) => {
    const target = pointsRef.current.find((p) => p.key === key);
    if (!target) return;
    draggingRef.current = {
      key,
      startCurrent: { ...target.current },
      startPointer: { ...pointerNorm },
    };
    setSelectedKey(key);
  }, []);

  const updateDragCurrent = useCallback((pointerNorm) => {
    const d = draggingRef.current;
    if (!d) return;
    const dx = pointerNorm.x - d.startPointer.x;
    const dy = pointerNorm.y - d.startPointer.y;
    const newCurrent = {
      x: Math.max(0, Math.min(1, d.startCurrent.x + dx)),
      y: Math.max(0, Math.min(1, d.startCurrent.y + dy)),
    };
    setPoints((prev) =>
      prev.map((p) => (p.key === d.key ? { ...p, current: newCurrent } : p)),
    );
  }, []);

  const endDragCurrent = useCallback(() => {
    const d = draggingRef.current;
    if (!d) return;
    draggingRef.current = null;
    setPoints((latest) => {
      commit(latest, { action: "drag", key: d.key });
      return latest;
    });
  }, [commit]);

  /* ────────── Same for ANCHOR drag ────────── */
  const anchorDraggingRef = useRef(null);

  const startDragAnchor = useCallback((key, pointerNorm) => {
    const target = pointsRef.current.find((p) => p.key === key);
    if (!target) return;
    anchorDraggingRef.current = {
      key,
      startAnchor: { ...target.anchor },
      startCurrent: { ...target.current },
      startPointer: { ...pointerNorm },
    };
    setSelectedKey(key);
  }, []);

  const updateDragAnchor = useCallback((pointerNorm) => {
    const d = anchorDraggingRef.current;
    if (!d) return;
    const dx = pointerNorm.x - d.startPointer.x;
    const dy = pointerNorm.y - d.startPointer.y;
    const newAnchor = {
      x: Math.max(0, Math.min(1, d.startAnchor.x + dx)),
      y: Math.max(0, Math.min(1, d.startAnchor.y + dy)),
    };
    const newCurrent = {
      x: Math.max(0, Math.min(1, d.startCurrent.x + dx)),
      y: Math.max(0, Math.min(1, d.startCurrent.y + dy)),
    };
    setPoints((prev) =>
      prev.map((p) =>
        p.key === d.key ? { ...p, anchor: newAnchor, current: newCurrent } : p,
      ),
    );
  }, []);

  const endDragAnchor = useCallback(() => {
    const d = anchorDraggingRef.current;
    if (!d) return;
    anchorDraggingRef.current = null;
    setPoints((latest) => {
      commit(latest, { action: "drag-anchor", key: d.key });
      return latest;
    });
  }, [commit]);

  return {
    points,
    selectedKey,
    mode,
    setSelectedKey,
    setMode,

    addPoint,
    deletePoint,
    updatePoint,

    startDragCurrent,
    updateDragCurrent,
    endDragCurrent,

    startDragAnchor,
    updateDragAnchor,
    endDragAnchor,

    syncFromExternal,

    // S.7.7+ — массовые мутации с прохождением через onCommit
    // (history + autosave + redux). Используется в SimulationEditor для
    // delete-manual-points и reset-all.
    commitPoints: commit,
  };
}

export { DEFAULT_POINT_RADIUS, DEFAULT_POINT_STRENGTH };
