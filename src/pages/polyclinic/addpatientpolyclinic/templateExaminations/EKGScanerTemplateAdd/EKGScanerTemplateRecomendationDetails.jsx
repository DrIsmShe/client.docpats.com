import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EKGScanerTemplateRecomendationDetails() {
  const { t } = useTranslation("EKGScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/EKGscaner/recomandation/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("EKGScanerTemplateRecomendationDetails.loadError"));
        setLoading(false);
      });
  }, [id, API_BASE, t]);

  if (loading)
    return <div>{t("EKGScanerTemplateRecomendationDetails.loading")}</div>;

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("EKGScanerTemplateRecomendationDetails.titlePage")}</h2>

      <p>
        <strong>
          {t("EKGScanerTemplateRecomendationDetails.titleLabel")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("EKGScanerTemplateRecomendationDetails.contentLabel")}:
        </strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>
          {t("EKGScanerTemplateRecomendationDetails.doctorLabel")}:
        </strong>{" "}
        {template.doctor?.firstName} {template.doctor?.lastName}
      </p>

      <Link
        to={`/dp/update-ekg-scan-template-recomandation/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("EKGScanerTemplateRecomendationDetails.editButton")}
      </Link>
    </div>
  );
}
