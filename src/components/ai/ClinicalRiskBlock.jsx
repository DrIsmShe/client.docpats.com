import React from "react";
import { useTranslation } from "react-i18next";

const badgeClassMap = {
  low: "bg-success",
  moderate: "bg-warning text-dark",
  high: "bg-danger",
};

const RISK_DOMAIN_KEYS = [
  "cardiology",
  "pulmonology",
  "neurology",
  "gastroenterology",
  "hepatology",
  "nephrology",
  "endocrinology",
  "hematology",
  "infectious",
  "rheumatology",
  "dermatology",
  "urology",
  "gynecology",
  "ent",
  "ophthalmology",
  "oncology",
];

const normalizeNode = (node) => {
  if (!node || typeof node !== "object") {
    return {
      level: "low",
      reasons: [],
      confidence: 0,
    };
  }

  return {
    level: ["low", "moderate", "high"].includes(node.level)
      ? node.level
      : "low",
    reasons: Array.isArray(node.reasons) ? node.reasons : [],
    confidence:
      typeof node.confidence === "number" &&
      node.confidence >= 0 &&
      node.confidence <= 1
        ? node.confidence
        : 0,
  };
};

const RiskRow = ({ domain, node, t }) => {
  const normalized = normalizeNode(node);

  return (
    <div className="border rounded p-3 mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span>{t(`risk.domains.${domain}`, domain)}</span>

        <span
          className={`badge ${
            badgeClassMap[normalized.level] || "bg-secondary"
          }`}
        >
          {t(`risk.levels.${normalized.level}`, normalized.level)}
        </span>
      </div>

      {normalized.reasons.length > 0 && (
        <ul className="ps-3 mb-2">
          {normalized.reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      )}

      <div className="small text-muted">
        {t("risk.confidence", "Confidence")}{" "}
        {Math.round(normalized.confidence * 100)}%
      </div>
    </div>
  );
};

export default function ClinicalRiskBlock({
  riskAssessment,
  fullRiskAssessment,
}) {
  const { t } = useTranslation("PatientClinicalSummary");

  /* =========================
     BACKWARD COMPATIBILITY
  ========================== */

  const riskMap =
    fullRiskAssessment && typeof fullRiskAssessment === "object"
      ? fullRiskAssessment
      : riskAssessment && typeof riskAssessment === "object"
        ? riskAssessment
        : null;

  if (!riskMap) return null;

  return (
    <div className="card shadow-sm border rounded-3 p-3 mb-3">
      <h5 className="mb-3">⚠️ {t("risk.title", "Clinical Risk Assessment")}</h5>

      {RISK_DOMAIN_KEYS.map((domain) => (
        <RiskRow key={domain} domain={domain} node={riskMap?.[domain]} t={t} />
      ))}
    </div>
  );
}
