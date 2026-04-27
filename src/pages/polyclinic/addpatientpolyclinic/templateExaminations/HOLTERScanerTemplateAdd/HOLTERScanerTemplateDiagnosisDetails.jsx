import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function HOLTERScanerTemplateDiagnosisDetails() {
  const { t } = useTranslation("HOLTERScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/HOLTERscaner/diagnosis/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("HOLTERScanerTemplateDiagnosisDetails.error"));
        setLoading(false);
      });
  }, [id, API_BASE, t]);

  if (loading)
    return <div>{t("HOLTERScanerTemplateDiagnosisDetails.loading")}</div>;

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("HOLTERScanerTemplateDiagnosisDetails.title")}</h2>

      <p>
        <strong>
          {t("HOLTERScanerTemplateDiagnosisDetails.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("HOLTERScanerTemplateDiagnosisDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>
          {t("HOLTERScanerTemplateDiagnosisDetails.fields.doctor")}:
        </strong>{" "}
        {template.doctor?.firstName} {template.doctor?.lastName}
      </p>

      <Link
        to={`/dp/update-holter-scan-template-diagnosis/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("HOLTERScanerTemplateDiagnosisDetails.buttons.edit")}
      </Link>
    </div>
  );
}
