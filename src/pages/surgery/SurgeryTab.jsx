import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import instance from "../../axios";
import { API_BASE } from "../../config";

// Только цвета статусов — label берём из i18n по ключу statuses.*
const STATUS_COLORS = {
  planned: { bg: "#dbeafe", color: "#1d4ed8" },
  completed: { bg: "#dcfce7", color: "#15803d" },
  follow_up: { bg: "#fef3c7", color: "#92400e" },
  closed: { bg: "#f1f5f9", color: "#475569" },
};

const photoUrl = (filename) => `${API_BASE}/uploads/surgery/${filename}`;

export default function SurgeryTab({ patientId, patientType }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("Surgery");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ─── Локаль для форматирования даты ──────────────────────────────────
  const dateLocale = useMemo(() => {
    const map = {
      ru: "ru-RU",
      en: "en-US",
      tr: "tr-TR",
      az: "az-AZ",
      ar: "ar",
    };
    return map[i18n.language] || "en-US";
  }, [i18n.language]);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    instance
      .get(`/api/surgery/cases/by-patient`, {
        params: { type: patientType, id: patientId },
      })
      .then((r) => setCases(r.data.cases || []))
      .catch(() => setError(t("tab.loadError")))
      .finally(() => setLoading(false));
  }, [patientId, patientType, t]);

  const handleNew = () => {
    navigate(
      `/dp/surgery/new?patientType=${patientType}&patientId=${patientId}`,
    );
  };

  if (loading)
    return (
      <div
        style={{
          padding: "32px 0",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: 13,
        }}
      >
        {t("page.loading")}
      </div>
    );

  return (
    <div>
      {/* ─── Шапка с кнопкой ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 13, color: "#64748b" }}>
          {cases.length === 0
            ? t("tab.noCases")
            : t("tab.casesCount", { count: cases.length })}
        </span>
        <button
          onClick={handleNew}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 16px",
            borderRadius: 20,
            border: "none",
            background: "#0f172a",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {t("tab.newCase")}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#b91c1c",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* ─── Пустое состояние ─── */}
      {cases.length === 0 && !error && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            background: "#f8fafc",
            borderRadius: 12,
            border: "1px dashed #e2e8f0",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔪</div>
          <p
            style={{
              fontSize: 14,
              color: "#334155",
              fontWeight: 500,
              margin: "0 0 6px",
            }}
          >
            {t("tab.noCases")}
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 16px" }}>
            {t("tab.noCasesHint")}
          </p>
          <button
            onClick={handleNew}
            style={{
              padding: "8px 20px",
              borderRadius: 20,
              border: "none",
              background: "#0f172a",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t("tab.createCase")}
          </button>
        </div>
      )}

      {/* ─── Список кейсов ─── */}
      {cases.map((c) => {
        const st = STATUS_COLORS[c.status] || STATUS_COLORS.planned;
        const beforePhoto = c.photos?.find((p) => p.label === "before");
        const afterPhoto = c.photos?.find((p) => p.label === "after");

        return (
          <div
            key={c._id}
            onClick={() => navigate(`/dp/surgery/${c._id}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 14px",
              marginBottom: 8,
              background: "#fff",
              border: "1px solid #e8edf5",
              borderRadius: 12,
              cursor: "pointer",
              transition: "border-color .15s, box-shadow .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#c7d5e8";
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(15,23,42,.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e8edf5";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Фото до/после */}
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {[beforePhoto, afterPhoto].map((p, i) => (
                <div
                  key={i}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: "#f1f5f9",
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {p ? (
                    <img
                      src={photoUrl(p.filename)}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "#cbd5e1",
                      }}
                    >
                      {i === 0
                        ? t("photoLabels.before")
                        : t("photoLabels.after")}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Инфо */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: 2,
                }}
              >
                {t(`procedures.${c.procedure}`, c.procedure)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                {c.operationDate
                  ? new Date(c.operationDate).toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : t("tab.dateNotSet")}
                {c.photos?.length > 0 &&
                  ` · ${t("tab.photosCount", { count: c.photos.length })}`}
              </div>
            </div>

            {/* Статус */}
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                background: st.bg,
                color: st.color,
                flexShrink: 0,
              }}
            >
              {t(`statuses.${c.status}`, c.status)}
            </span>

            {/* Оценка */}
            {c.outcomeScore && (
              <span
                style={{
                  fontSize: 12,
                  color: "#92400e",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                ★ {c.outcomeScore}/10
              </span>
            )}

            <span style={{ color: "#cbd5e1", fontSize: 16, flexShrink: 0 }}>
              →
            </span>
          </div>
        );
      })}
    </div>
  );
}
