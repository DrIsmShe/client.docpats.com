// src/pages/simulation/hooks/useFullResExport.js
import { useEffect, useRef, useState, useCallback } from "react";
import {
  generateFullResExport,
  imageDataToBlob,
  composeSideBySide,
  canvasToBlob,
  downloadBlob,
} from "../utils/fullResWarp.js";

/* ──────────────────────────────────────────────────────────────────────────
   Hook для Export/BeforeAfter viewer.

   State:
     status: 'idle' | 'loading' | 'ready' | 'error'
     original, warped — ImageData в full-res (оба для viewer'а и export)
     error — объект с message

   Main methods:
     prepare()  — загружает full-res и делает warp. Долго (1-3 сек для 4000px).
     download(options) — композирует выбранный режим → blob → download.
                         НЕ грузит заново, берёт из подготовленных ImageData.

   Worker: создаётся тут же отдельно от editor'а — чтобы не блокировать
   ни editor warp, ни наоборот. Он short-lived, terminate на unmount.
   ────────────────────────────────────────────────────────────────────────── */

export function useFullResExport({ photoUrl, points }) {
  const [status, setStatus] = useState("idle");
  const [original, setOriginal] = useState(null);
  const [warped, setWarped] = useState(null);
  const [error, setError] = useState(null);

  const workerRef = useRef(null);
  const preparingRef = useRef(false);
  // lastPreparedRef = { url, pointsHash } — чтобы перезапускать только
  // если входные изменились.
  const lastPreparedRef = useRef(null);

  /* ────────── Spawn worker ────────── */
  useEffect(() => {
    let worker = null;
    try {
      worker = new Worker(
        new URL("../workers/warp.worker.js", import.meta.url),
        { type: "module" },
      );
    } catch (err) {
      console.warn(
        "[simulation/export] worker unavailable, main-thread fallback:",
        err,
      );
    }
    workerRef.current = worker;
    return () => {
      worker?.terminate();
      workerRef.current = null;
    };
  }, []);

  /* ────────── Инвалидация: если url или points изменились — сбросить ─── */
  const pointsHash = JSON.stringify(points || []);
  useEffect(() => {
    const last = lastPreparedRef.current;
    if (last && (last.url !== photoUrl || last.pointsHash !== pointsHash)) {
      setStatus("idle");
      setOriginal(null);
      setWarped(null);
      setError(null);
      lastPreparedRef.current = null;
    }
  }, [photoUrl, pointsHash]);

  /* ────────── Prepare: загрузить full-res + warp ────────── */
  const prepare = useCallback(async () => {
    if (preparingRef.current) return;
    if (status === "ready") return;
    if (!photoUrl) return;

    preparingRef.current = true;
    setStatus("loading");
    setError(null);

    try {
      const result = await generateFullResExport({
        url: photoUrl,
        points: points || [],
        worker: workerRef.current,
      });
      setOriginal(result.original);
      setWarped(result.warped);
      setStatus("ready");
      lastPreparedRef.current = { url: photoUrl, pointsHash };
    } catch (err) {
      console.error("[simulation/export] prepare failed:", err);
      setError(err);
      setStatus("error");
    } finally {
      preparingRef.current = false;
    }
  }, [photoUrl, points, pointsHash, status]);

  /* ────────── Download: композиция + blob + save ────────── */
  const download = useCallback(
    async ({
      mode = "after",
      format = "image/jpeg",
      quality = 0.92,
      labels,
    } = {}) => {
      if (!original || !warped) {
        throw new Error("Export not prepared");
      }

      const ext = format === "image/png" ? "png" : "jpg";
      const ts = new Date().toISOString().slice(0, 10);
      let blob;
      let name;

      if (mode === "before") {
        blob = await imageDataToBlob(original, { format, quality });
        name = `simulation-before-${ts}.${ext}`;
      } else if (mode === "after") {
        blob = await imageDataToBlob(warped, { format, quality });
        name = `simulation-after-${ts}.${ext}`;
      } else if (mode === "sideBySide") {
        const canvas = composeSideBySide({
          left: original,
          right: warped,
          labelLeft: labels?.before,
          labelRight: labels?.after,
        });
        blob = await canvasToBlob(canvas, { format, quality });
        name = `simulation-comparison-${ts}.${ext}`;
      } else {
        throw new Error(`Unknown export mode: ${mode}`);
      }

      downloadBlob(blob, name);
      return { filename: name, size: blob.size };
    },
    [original, warped],
  );

  return {
    status,
    original,
    warped,
    error,
    prepare,
    download,
  };
}
