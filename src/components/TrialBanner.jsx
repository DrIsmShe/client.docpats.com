// client/src/components/TrialBanner.jsx
// ─────────────────────────────────────────────────────────────────────
//   Баннер с информацией о trial-периоде.
//
//   Показывается ТОЛЬКО:
//   - врачам (role === "doctor")
//   - которые сейчас в trial-периоде (isInTrial === true)
//   - и не имеют активной подписки
//
//   Цвет/тон зависит от того сколько осталось:
//   - 30+ дней → зелёный (OK)
//   - 8-30 дней → жёлтый (внимание)
//   - 1-7 дней → красный (срочно)
//
//   Использование:
//     import TrialBanner from "@/components/TrialBanner";
//     <TrialBanner />
//
//   Можно вставить в Aside.jsx над меню или в шапку главной страницы.
// ─────────────────────────────────────────────────────────────────────

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTrialStatus } from "../hooks/useTrialStatus";

export default function TrialBanner({ compact = false }) {
  const { t } = useTranslation("TrialBanner");
  const { trial, loading } = useTrialStatus();

  if (loading || !trial) return null;
  if (trial.role !== "doctor") return null;
  if (!trial.isInTrial) return null;
  if (trial.hasActiveSubscription) return null;

  const days = trial.daysLeft || 0;

  // Тон в зависимости от срочности
  const urgency = days >= 30 ? "ok" : days >= 8 ? "warn" : "urgent";

  const colors = {
    ok: { bg: "rgba(45,212,191,0.1)", border: "#2dd4bf", text: "#0d9488" },
    warn: { bg: "rgba(245,158,11,0.1)", border: "#f59e0b", text: "#b45309" },
    urgent: { bg: "rgba(239,68,68,0.1)", border: "#ef4444", text: "#b91c1c" },
  };
  const c = colors[urgency];

  if (compact) {
    return (
      <Link
        to="/pricing"
        style={{
          display: "block",
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          padding: "8px 12px",
          margin: "12px",
          textDecoration: "none",
          fontSize: 12,
          fontWeight: 600,
          color: c.text,
          textAlign: "center",
        }}
      >
        🎁 {t("compact", { days })}
      </Link>
    );
  }

  return (
    <Link
      to="/pricing"
      style={{
        display: "block",
        background: c.bg,
        borderLeft: `4px solid ${c.border}`,
        borderRadius: 6,
        padding: "12px 14px",
        margin: "12px",
        textDecoration: "none",
        color: c.text,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>🎁</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
            {t("title", { days })}
          </div>
          <div style={{ fontSize: 11, opacity: 0.85, lineHeight: 1.4 }}>
            {urgency === "urgent" ? t("urgentText") : t("text")}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              marginTop: 6,
              textDecoration: "underline",
            }}
          >
            {t("cta")} →
          </div>
        </div>
      </div>
    </Link>
  );
}
