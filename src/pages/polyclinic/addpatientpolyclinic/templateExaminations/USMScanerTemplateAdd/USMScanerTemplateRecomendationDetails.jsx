import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function USMScanerTemplateRecomendationDetails() {
  const { t } = useTranslation("USMScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/USMscaner/recomandation/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("USMScanerTemplateRecomendationDetails.messages.loadError"));
        setLoading(false);
      });
  }, [id, API_BASE, t]);

  if (loading)
    return (
      <div>{t("USMScanerTemplateRecomendationDetails.messages.loading")}</div>
    );

  if (error) return <div>{error}</div>;
  if (!template) return null;

  return (
    <div>
      <h2>{t("USMScanerTemplateRecomendationDetails.title")}</h2>

      <p>
        <strong>
          {t("USMScanerTemplateRecomendationDetails.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("USMScanerTemplateRecomendationDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>
          {t("USMScanerTemplateRecomendationDetails.fields.doctor")}:
        </strong>{" "}
        {template.doctor.firstName} {template.doctor.lastName}
      </p>

      <Link
        to={`/dp/update-usm-scan-template-recomendation/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("USMScanerTemplateRecomendationDetails.actions.edit")}
      </Link>
    </div>
  );
}
