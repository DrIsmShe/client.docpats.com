// client/src/pages/clinic/vitrina/components/Lightbox.jsx
//
// Общий лайтбокс для галерей (категория + статья). Полноэкранный просмотр фото
// со стрелками ←/→, Esc, клик по фону, счётчик, подпись и описание.
//
// Props: { items: [{image, caption, description}], index, onClose, onPrev, onNext }
// Рендерится, когда index !== null. resolveUrl применяется снаружи или тут.

import React, { useEffect } from "react";
import { resolveUrl } from "../lib/utils.js";

const CSS = `
.vt-lb { position: fixed; inset: 0; z-index: 1000; background: rgba(10,10,12,.94); display: flex; align-items: center; justify-content: center; padding: 24px; }
.vt-lb-stage { max-width: 1100px; width: 100%; max-height: 100%; display: flex; flex-direction: column; align-items: center; }
.vt-lb-imgwrap { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; width: 100%; }
.vt-lb-img { max-width: 100%; max-height: 72vh; object-fit: contain; border-radius: 8px; }
.vt-lb-meta { width: 100%; max-width: 900px; color: #fff; text-align: center; margin-top: 16px; font-family: var(--v-font-body, sans-serif); }
.vt-lb-cap { font-family: var(--v-font-heading, sans-serif); font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.vt-lb-desc { font-size: 14px; line-height: 1.6; color: #d4d4d8; white-space: pre-wrap; }
.vt-lb-count { font-size: 12px; color: #a1a1aa; margin-top: 10px; font-family: var(--v-font-body, sans-serif); }
.vt-lb-close { position: fixed; top: 18px; right: 22px; width: 42px; height: 42px; border-radius: 50%; border: none; background: rgba(255,255,255,.14); color: #fff; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.vt-lb-close:hover { background: rgba(255,255,255,.26); }
.vt-lb-nav { position: fixed; top: 50%; transform: translateY(-50%); width: 50px; height: 50px; border-radius: 50%; border: none; background: rgba(255,255,255,.14); color: #fff; font-size: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.vt-lb-nav:hover { background: rgba(255,255,255,.26); }
.vt-lb-prev { left: 20px; }
.vt-lb-next { right: 20px; }
@media (max-width: 600px) {
  .vt-lb-nav { width: 40px; height: 40px; font-size: 20px; }
  .vt-lb-prev { left: 8px; } .vt-lb-next { right: 8px; }
}
`;

export default function Lightbox({ items, index, onClose, onPrev, onNext }) {
  const open = index !== null && index !== undefined && items?.[index];

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowLeft") onPrev?.();
      else if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, onPrev, onNext]);

  if (!open) return null;
  const cur = items[index];
  const multi = items.length > 1;

  return (
    <div
      className="vt-lb"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <style>{CSS}</style>
      <button
        type="button"
        className="vt-lb-close"
        onClick={onClose}
        aria-label="close"
      >
        ✕
      </button>
      {multi && (
        <>
          <button
            type="button"
            className="vt-lb-nav vt-lb-prev"
            onClick={onPrev}
            aria-label="prev"
          >
            ‹
          </button>
          <button
            type="button"
            className="vt-lb-nav vt-lb-next"
            onClick={onNext}
            aria-label="next"
          >
            ›
          </button>
        </>
      )}
      <div className="vt-lb-stage">
        <div className="vt-lb-imgwrap">
          <img
            className="vt-lb-img"
            src={resolveUrl(cur.image)}
            alt={cur.caption || ""}
          />
        </div>
        {(cur.caption || cur.description) && (
          <div className="vt-lb-meta">
            {cur.caption && <div className="vt-lb-cap">{cur.caption}</div>}
            {cur.description && (
              <div className="vt-lb-desc">{cur.description}</div>
            )}
          </div>
        )}
        {multi && (
          <div className="vt-lb-count">
            {index + 1} / {items.length}
          </div>
        )}
      </div>
    </div>
  );
}
