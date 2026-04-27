import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function GastroscopyScanerTemplateReportDetails() {
  const { t } = useTranslation("GastroscopyScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/Gastroscopyscaner/report/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("GastroscopyScanerTemplateReportDetails.error.loadFailed"));
        setLoading(false);
      });
  }, [id, t]);

  if (loading) {
    return <div>{t("GastroscopyScanerTemplateReportDetails.loading")}</div>;
  }

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("GastroscopyScanerTemplateReportDetails.title")}</h2>

      <p>
        <strong>
          {t("GastroscopyScanerTemplateReportDetails.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("GastroscopyScanerTemplateReportDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>
          {t("GastroscopyScanerTemplateReportDetails.fields.doctor")}:
        </strong>{" "}
        {template.doctor.firstName} {template.doctor.lastName}
      </p>

      <Link
        to={`/dp/update-gastroscopy-scan-template-report/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("GastroscopyScanerTemplateReportDetails.buttons.edit")}
      </Link>
    </div>
  );
}
