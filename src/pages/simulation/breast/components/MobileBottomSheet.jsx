// src/pages/simulation/breast/components/MobileBottomSheet.jsx
//
// Reusable bottom sheet через React portal. Затемняет фон + слайдит
// snap-вверх от низа экрана.

import React from "react";
import { createPortal } from "react-dom";

export default function MobileBottomSheet({ open, onClose, children }) {
  if (!open) return null;

  return createPortal(
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={dragHandleStyle} />
        <div style={contentStyle}>{children}</div>
      </div>
    </>,
    document.body,
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.55)",
  zIndex: 99998,
  pointerEvents: "auto",
};

const sheetStyle = {
  position: "fixed",
  insetInlineStart: 0,
  insetInlineEnd: 0,
  bottom: 0,
  width: "100%",
  maxHeight: "75vh",
  background: "rgba(15, 20, 32, 0.98)",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  borderTopWidth: 1,
  borderTopStyle: "solid",
  borderTopColor: "rgba(255, 255, 255, 0.1)",
  padding: 16,
  zIndex: 99999,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
  pointerEvents: "auto",
  WebkitOverflowScrolling: "touch",
};

const dragHandleStyle = {
  width: 40,
  height: 4,
  background: "rgba(255, 255, 255, 0.25)",
  borderRadius: 2,
  margin: "-4px auto 12px",
  flexShrink: 0,
};

const contentStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};
