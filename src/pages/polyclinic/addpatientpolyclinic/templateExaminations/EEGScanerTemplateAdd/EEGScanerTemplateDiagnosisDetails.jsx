import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EEGScanerTemplateDiagnosisDetails() {
  const { t } = useTranslation("EEGScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/EEGscaner/diagnosis/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("EEGScanerTemplateDiagnosisDetails.error"));
        setLoading(false);
      });
  }, [id, API_BASE, t]);

  if (loading) {
    return <div>{t("EEGScanerTemplateDiagnosisDetails.loading")}</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      <h2>{t("EEGScanerTemplateDiagnosisDetails.title")}</h2>

      <p>
        <strong>{t("EEGScanerTemplateDiagnosisDetails.fields.title")}:</strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("EEGScanerTemplateDiagnosisDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>{t("EEGScanerTemplateDiagnosisDetails.fields.doctor")}:</strong>{" "}
        {template.doctor.firstName} {template.doctor.lastName}
      </p>

      <Link
        to={`/dp/update-eeg-scan-template-diagnosis/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("EEGScanerTemplateDiagnosisDetails.actions.edit")}
      </Link>
    </div>
  );
}
