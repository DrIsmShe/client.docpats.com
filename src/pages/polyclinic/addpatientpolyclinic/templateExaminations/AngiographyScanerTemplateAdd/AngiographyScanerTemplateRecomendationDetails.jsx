import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AngiographyScanerTemplateRecomendationDetails() {
  const { t } = useTranslation("templateExaminationsSecond");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/Angiographyscaner/recomandation/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          t("AngiographyScanerTemplateRecomendationDetails.messages.loadError")
        );
        setLoading(false);
      });
  }, [id, t]);

  if (loading)
    return (
      <div>
        {t("AngiographyScanerTemplateRecomendationDetails.page.loading")}
      </div>
    );

  if (error) return <div>{error}</div>;

  return (
    <div style={{ maxWidth: "700px", margin: "20px auto" }}>
      <h2>{t("AngiographyScanerTemplateRecomendationDetails.title")}</h2>

      <p>
        <strong>
          {t("AngiographyScanerTemplateRecomendationDetails.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("AngiographyScanerTemplateRecomendationDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      {template.doctor && (
        <p>
          <strong>
            {t("AngiographyScanerTemplateRecomendationDetails.fields.doctor")}:
          </strong>{" "}
          {template.doctor.firstName} {template.doctor.lastName}
        </p>
      )}

      <Link
        to={`/dp/update-angiography-scan-template-recomandation/${template._id}`}
        className="btn btn-warning btn-sm mt-2"
      >
        {t("AngiographyScanerTemplateRecomendationDetails.buttons.edit")}
      </Link>
    </div>
  );
}
