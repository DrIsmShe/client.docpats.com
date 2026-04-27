import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CoronographyScanTemplateNameofexamDetail() {
  const { id } = useParams();
  const { t } = useTranslation("CoronographyScanerTemplateAdd");

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/Coronographyscaner/nameofexam/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(
          t("CoronographyScanTemplateNameofexamDetail.messages.loadError")
        );
        setLoading(false);
      });
  }, [id, API_BASE, t]);

  if (loading) return <div>{t("common.loading")}</div>;

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("CoronographyScanTemplateNameofexamDetail.title")}</h2>

      <p>
        <strong>
          {t("CoronographyScanTemplateNameofexamDetail.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("CoronographyScanTemplateNameofexamDetail.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <Link
        to={`/dp/update-coronography-scan-template-nameofexam/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("buttons.edit")}
      </Link>
    </div>
  );
}
