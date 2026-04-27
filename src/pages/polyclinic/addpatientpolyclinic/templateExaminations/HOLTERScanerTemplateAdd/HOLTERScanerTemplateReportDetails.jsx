import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function HOLTERScanerTemplateReportDetails() {
  const { t } = useTranslation("HOLTERScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/HOLTERscaner/report/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("HOLTERScanerTemplateReportDetails.error"));
        setLoading(false);
      });
  }, [id, API_BASE, t]);

  if (loading) {
    return <div>{t("HOLTERScanerTemplateReportDetails.loading")}</div>;
  }

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("HOLTERScanerTemplateReportDetails.title")}</h2>

      <p>
        <strong>{t("HOLTERScanerTemplateReportDetails.fields.title")}:</strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("HOLTERScanerTemplateReportDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>{t("HOLTERScanerTemplateReportDetails.fields.doctor")}:</strong>{" "}
        {template.doctor?.firstName} {template.doctor?.lastName}
      </p>

      <Link
        to={`/dp/update-holter-scan-template-report/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("HOLTERScanerTemplateReportDetails.buttons.edit")}
      </Link>
    </div>
  );
}
