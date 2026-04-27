import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EEGScanerTemplateReportDetails() {
  const { t } = useTranslation("EEGScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/EEGscaner/report/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("EEGScanerTemplateReportDetails.loadError"));
        setLoading(false);
      });
  }, [id, t]);

  if (loading) return <div>{t("EEGScanerTemplateReportDetails.loading")}</div>;

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("EEGScanerTemplateReportDetails.titlePage")}</h2>

      <p>
        <strong>{t("EEGScanerTemplateReportDetails.titleLabel")}:</strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>{t("EEGScanerTemplateReportDetails.contentLabel")}:</strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>{t("EEGScanerTemplateReportDetails.doctorLabel")}:</strong>{" "}
        {template.doctor.firstName} {template.doctor.lastName}
      </p>

      <Link
        to={`/dp/update-eeg-scan-template-report/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("EEGScanerTemplateReportDetails.edit")}
      </Link>
    </div>
  );
}
