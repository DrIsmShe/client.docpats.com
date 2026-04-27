// src/pages/simulation/components/modals/DeletePlanModal.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function DeletePlanModal({
  open,
  onClose,
  onConfirm,
  deleting,
}) {
  const { t } = useTranslation("Simulation");

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          width: "100%",
          marginInline: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          {t("deleteModal.title")}
        </h3>
        <p style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
          {t("deleteModal.body")}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={deleting}
            style={{
              padding: "8px 16px",
              background: "transparent",
              color: "#475569",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {t("deleteModal.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              padding: "8px 16px",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: deleting ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 500,
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? t("deleteModal.deleting") : t("deleteModal.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
