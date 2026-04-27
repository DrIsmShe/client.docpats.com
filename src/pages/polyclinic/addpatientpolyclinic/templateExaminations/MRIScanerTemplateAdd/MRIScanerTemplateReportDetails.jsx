import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function MRIScanerTemplateReportDetails() {
  const { t } = useTranslation("MRIScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/MRIscaner/report/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("MRIScanerTemplateReportDetails.errorLoad"));
        setLoading(false);
      });
  }, [id, API_BASE, t]);

  if (loading) return <div>{t("MRIScanerTemplateReportDetails.loading")}</div>;

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("MRIScanerTemplateReportDetails.titlePage")}</h2>

      <p>
        <strong>{t("MRIScanerTemplateReportDetails.labelTitle")}:</strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>{t("MRIScanerTemplateReportDetails.labelContent")}:</strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>{t("MRIScanerTemplateReportDetails.labelDoctor")}:</strong>{" "}
        {template.doctor?.firstName} {template.doctor?.lastName}
      </p>

      <Link
        to={`/dp/update-mri-scan-template-report/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("MRIScanerTemplateReportDetails.buttonEdit")}
      </Link>
    </div>
  );
}
