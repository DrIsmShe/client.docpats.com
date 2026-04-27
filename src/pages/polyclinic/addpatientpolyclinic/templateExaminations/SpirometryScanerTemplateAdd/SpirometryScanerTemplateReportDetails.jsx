import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SpirometryScanerTemplateReportDetails() {
  const { t } = useTranslation("SpirometryScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/Spirometryscaner/report/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("SpirometryScanerTemplateReportDetails.loadError"));
        setLoading(false);
      });
  }, [id, t]);

  if (loading)
    return <div>{t("SpirometryScanerTemplateReportDetails.loading")}</div>;

  if (error) return <div>{error}</div>;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      <h2>{t("SpirometryScanerTemplateReportDetails.pageTitle")}</h2>

      <p>
        <strong>
          {t("SpirometryScanerTemplateReportDetails.titleLabel")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("SpirometryScanerTemplateReportDetails.contentLabel")}:
        </strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>
          {t("SpirometryScanerTemplateReportDetails.doctorLabel")}:
        </strong>{" "}
        {template.doctor?.firstName} {template.doctor?.lastName}
      </p>

      <Link
        to={`/dp/update-spirometry-scan-template-report/${template._id}`}
        className="btn btn-warning btn-sm mt-3"
      >
        {t("SpirometryScanerTemplateReportDetails.editButton")}
      </Link>
    </div>
  );
}
