import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function GinecologyTemplateRecomendationDetails() {
  const { t } = useTranslation("GinecologyTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/Ginecology/recomandation/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("GinecologyTemplateRecomendationDetails.error"));
        setLoading(false);
      });
  }, [id, t]);

  if (loading)
    return <div>{t("GinecologyTemplateRecomendationDetails.loading")}</div>;

  if (error) return <div>{error}</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h2>{t("GinecologyTemplateRecomendationDetails.title")}</h2>

      <p>
        <strong>
          {t("GinecologyTemplateRecomendationDetails.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("GinecologyTemplateRecomendationDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>
          {t("GinecologyTemplateRecomendationDetails.fields.doctor")}:
        </strong>{" "}
        {template.doctor?.firstName} {template.doctor?.lastName}
      </p>

      <Link
        to={`/dp/update-ginecology-test-template-recomandation/${template._id}`}
        className="btn btn-warning btn-sm mt-3"
      >
        {t("GinecologyTemplateRecomendationDetails.buttons.edit")}
      </Link>
    </div>
  );
}
