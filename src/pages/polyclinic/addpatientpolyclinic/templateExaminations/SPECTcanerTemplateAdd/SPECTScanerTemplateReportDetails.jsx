import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SPECTScanerTemplateReportDetails() {
  const { t } = useTranslation("SPECTcanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/SPECTscaner/report/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("SPECTScanerTemplateReportDetails.messages.loadError"));
        setLoading(false);
      });
  }, [id, t]);

  if (loading) {
    return <div>{t("SPECTScanerTemplateReportDetails.messages.loading")}</div>;
  }

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("SPECTScanerTemplateReportDetails.title")}</h2>

      <p>
        <strong>{t("SPECTScanerTemplateReportDetails.fields.title")}:</strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>{t("SPECTScanerTemplateReportDetails.fields.content")}:</strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>{t("SPECTScanerTemplateReportDetails.fields.doctor")}:</strong>{" "}
        {template.doctor.firstName} {template.doctor.lastName}
      </p>

      <Link
        to={`/dp/update-spect-scan-template-report/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("SPECTScanerTemplateReportDetails.actions.edit")}
      </Link>
    </div>
  );
}
