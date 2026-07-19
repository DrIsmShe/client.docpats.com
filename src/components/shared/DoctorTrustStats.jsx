// client/src/components/shared/DoctorTrustStats.jsx
//
// Публичный «счётчик доверия» на профиле врача: рейтинг, отзывы, приёмы,
// пациенты, стаж на платформе, бейдж «Проверенный врач».
// Данные — GET /doctor-profile/stats/:doctorProfileId (только агрегаты, без PHI).

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.REACT_APP_API_URL;

export default function DoctorTrustStats({ doctorProfileId }) {
  const { t } = useTranslation();
  const [s, setS] = useState(null);

  useEffect(() => {
    if (!doctorProfileId) return;
    let alive = true;
    axios
      .get(`${API_BASE}/doctor-profile/stats/${doctorProfileId}`, {
        withCredentials: true,
      })
      .then((r) => alive && setS(r.data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [doctorProfileId]);

  if (!s?.success) return null;

  const items = [];
  if (s.reviewCount > 0)
    items.push({
      icon: "⭐",
      big: s.averageRating,
      small: `${s.reviewCount} ${t("trust.reviewsNoun", { defaultValue: "отзыв(ов)" })}`,
    });
  if (s.patientsServed > 0)
    items.push({
      icon: "👥",
      big: s.patientsServed,
      small: t("trust.patientsNoun", { defaultValue: "пациентов" }),
    });
  if (s.completedAppointments > 0)
    items.push({
      icon: "📅",
      big: s.completedAppointments,
      small: t("trust.appointmentsNoun", { defaultValue: "приёмов проведено" }),
    });
  if (s.memberSince) {
    const years = Math.floor((s.monthsOnPlatform || 0) / 12);
    const tenure =
      years >= 1
        ? `${years} ${t("trust.yearsNoun", { defaultValue: "г. на DocPats" })}`
        : `${s.monthsOnPlatform || 0} ${t("trust.monthsNoun", { defaultValue: "мес. на DocPats" })}`;
    items.push({ icon: "🗓", big: "", small: tenure });
  }

  if (!items.length && !s.isVerified) return null;

  return (
    <div style={wrap}>
      {s.isVerified && (
        <div style={verified}>
          ✔️ {t("trust.verified", { defaultValue: "Проверенный врач" })}
        </div>
      )}
      {items.length > 0 && (
        <div style={row}>
          {items.map((it, i) => (
            <div key={i} style={chip}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{it.icon}</span>
              <div>
                {it.big !== "" && (
                  <b style={{ fontSize: 18, color: "#0f172a" }}>{it.big}</b>
                )}
                <div style={{ fontSize: 12, color: "#64748b" }}>{it.small}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const wrap = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  margin: "16px 0",
};
const verified = {
  alignSelf: "flex-start",
  background: "#dcfce7",
  color: "#166534",
  fontWeight: 600,
  fontSize: 13,
  padding: "5px 12px",
  borderRadius: 999,
};
const row = { display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" };
const chip = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#f8fafc",
  border: "1px solid #eef2f7",
  borderRadius: 12,
  padding: "8px 14px",
};
