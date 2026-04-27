import React from "react";
import { useTranslation } from "react-i18next";

export default function FooterAI() {
  const { t } = useTranslation("NewsAiTranslate");
  return (
    <div
      style={{
        margin: "40px 0 0",
        padding: "28px 32px",
        background: "var(--paper2)",
        borderTop: "3px solid var(--ink)",
        borderBottom: "1px solid var(--rule)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 14,
        }}
      >
        {t("footer.about")}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            flexShrink: 0,
            background: "#b83030",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--serif)",
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          И
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 4,
            }}
          >
            {t("footer.name")}
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: ".06em",
            }}
          >
            {t("footer.role")}
          </div>
        </div>
      </div>

      <p
        style={{
          fontFamily: "var(--sans)",
          fontSize: 14,
          fontWeight: 300,
          lineHeight: 1.75,
          color: "var(--ink2)",
          margin: "0 0 12px",
        }}
      >
        {t("footer.description")}
      </p>

      <p
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--muted)",
          letterSpacing: ".04em",
          borderTop: "1px solid var(--rule)",
          paddingTop: 12,
          margin: 0,
        }}
      >
        {t("footer.disclaimer")}
      </p>
    </div>
  );
}
