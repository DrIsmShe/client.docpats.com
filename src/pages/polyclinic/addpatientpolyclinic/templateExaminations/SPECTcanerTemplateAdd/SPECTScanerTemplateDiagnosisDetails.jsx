import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SPECTScanerTemplateDiagnosisDetails() {
  const { t } = useTranslation("SPECTcanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/SPECTscaner/diagnosis/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("SPECTScanerTemplateDiagnosisDetails.messages.loadError"));
        setLoading(false);
      });
  }, [id, t]);

  if (loading)
    return (
      <div>{t("SPECTScanerTemplateDiagnosisDetails.messages.loading")}</div>
    );

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("SPECTScanerTemplateDiagnosisDetails.title")}</h2>

      <p>
        <strong>
          {t("SPECTScanerTemplateDiagnosisDetails.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("SPECTScanerTemplateDiagnosisDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>
          {t("SPECTScanerTemplateDiagnosisDetails.fields.doctor")}:
        </strong>{" "}
        {template.doctor.firstName} {template.doctor.lastName}
      </p>

      <Link
        to={`/dp/update-spect-scan-template-diagnosis/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("SPECTScanerTemplateDiagnosisDetails.actions.edit")}
      </Link>
    </div>
  );
}
