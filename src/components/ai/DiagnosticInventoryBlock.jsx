// DiagnosticInventoryBlock.jsx
import React from "react";
import { useTranslation } from "react-i18next";

const MODALITY_KEYS = [
  "ct",
  "mri",
  "usm",
  "xray",
  "pet",
  "spect",
  "eeg",
  "ekg",
  "echoEkg",
  "holter",
  "spirometry",
  "dopler",
  "gastroscopy",
  "capsuleEndoscopy",
  "ginecology",
  "angiography",
  "coronography",
  "labTests",
];

const DiagnosticInventoryBlock = ({ diagnosticInventory }) => {
  const { t } = useTranslation("PatientClinicalSummary");

  if (!diagnosticInventory) return null;

  const { total, modalities } = diagnosticInventory;

  return (
    <div className="card shadow-sm border rounded-3 p-3 mb-3">
      <h5 className="mb-2">
        📦 {t("diagnosticInventory.title")}{" "}
        <span className="text-muted">
          ({total} {t("diagnosticInventory.examinations")})
        </span>
      </h5>

      <ul className="mb-0" style={{ columns: 2 }}>
        {MODALITY_KEYS.map((key) => {
          const value = modalities?.[key];
          if (!value) return null;

          return (
            <li key={key}>
              {t(`diagnosticInventory.modalities.${key}`)}:{" "}
              <strong>{value}</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DiagnosticInventoryBlock;
