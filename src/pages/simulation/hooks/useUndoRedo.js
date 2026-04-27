// src/pages/simulation/hooks/useUndoRedo.js
import { useCallback, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Undo/redo через history stack.

   Состояние:
     past    — стек предыдущих snapshot'ов (нельзя undo за пустой)
     future  — стек отменённых snapshot'ов (заполняется при undo)
     current — последний committed snapshot (этот же массив НЕ в past)

   При commit:
     past.push(current), current = new, future = []
   При undo:
     future.push(current), current = past.pop()
   При redo:
     past.push(current), current = future.pop()

   Snapshot = JSON-сериализуемый объект (мы храним весь массив точек).
   Для 200 точек это ~10 KB text = пренебрежимо.

   Лимит: 50 undo-шагов. Старые отбрасываются с начала past.
   ────────────────────────────────────────────────────────────────────────── */

const HISTORY_LIMIT = 50;

export function useUndoRedo({ initial, onApply }) {
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const currentRef = useRef(initial);
  const [, forceUpdate] = useState(0);
  const rerender = () => forceUpdate((n) => n + 1);

  /* ────────── Push a new snapshot onto history ──────────
     Вызывается из useControlPoints.onCommit.
     Принимает next (новое состояние) и meta (для возможного debug/label).
  */
  const push = useCallback((next) => {
    pastRef.current = [
      ...pastRef.current.slice(-(HISTORY_LIMIT - 1)),
      currentRef.current,
    ];
    currentRef.current = next;
    futureRef.current = []; // новое действие стирает redo-ветку
    rerender();
  }, []);

  /* ────────── Undo ────────── */
  const undo = useCallback(() => {
    const past = pastRef.current;
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    pastRef.current = past.slice(0, -1);
    futureRef.current = [...futureRef.current, currentRef.current];
    currentRef.current = prev;
    onApply?.(prev, { action: "undo" });
    rerender();
  }, [onApply]);

  /* ────────── Redo ────────── */
  const redo = useCallback(() => {
    const future = futureRef.current;
    if (future.length === 0) return;
    const next = future[future.length - 1];
    futureRef.current = future.slice(0, -1);
    pastRef.current = [...pastRef.current, currentRef.current];
    currentRef.current = next;
    onApply?.(next, { action: "redo" });
    rerender();
  }, [onApply]);

  /* ────────── Replace current БЕЗ истории ──────────
     Для случая "план перезагружен с сервера" — нам не нужно добавлять
     эту перезагрузку в undo-стек, иначе undo будет "откатить загрузку",
     что бессмысленно.
  */
  const replace = useCallback((next) => {
    currentRef.current = next;
    pastRef.current = [];
    futureRef.current = [];
    rerender();
  }, []);

  return {
    push,
    undo,
    redo,
    replace,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
