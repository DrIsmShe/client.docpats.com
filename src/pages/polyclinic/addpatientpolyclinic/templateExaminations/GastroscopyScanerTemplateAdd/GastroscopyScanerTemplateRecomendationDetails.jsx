import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function GastroscopyScanerTemplateRecomendationDetails() {
  const { t } = useTranslation("GastroscopyScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/Gastroscopyscaner/recomandation/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(
          t("GastroscopyScanerTemplateRecomendationDetails.error.loadFailed")
        );
        setLoading(false);
      });
  }, [id, t]);

  if (loading) {
    return (
      <div>{t("GastroscopyScanerTemplateRecomendationDetails.loading")}</div>
    );
  }

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("GastroscopyScanerTemplateRecomendationDetails.title")}</h2>

      <p>
        <strong>
          {t("GastroscopyScanerTemplateRecomendationDetails.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("GastroscopyScanerTemplateRecomendationDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>
          {t("GastroscopyScanerTemplateRecomendationDetails.fields.doctor")}:
        </strong>{" "}
        {template.doctor.firstName} {template.doctor.lastName}
      </p>

      <Link
        to={`/dp/update-gastroscopy-scan-template-recomandation/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("GastroscopyScanerTemplateRecomendationDetails.buttons.edit")}
      </Link>
    </div>
  );
}
