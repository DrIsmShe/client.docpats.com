import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AngiographyScanTemplateNameofexamDetail() {
  const { t } = useTranslation("templateExaminationsSecond");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/Angiographyscaner/nameofexam/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          t("AngiographyScanerTemplateNameofexamDetail.messages.loadError")
        );
        setLoading(false);
      });
  }, [id, t]);

  if (loading)
    return (
      <div>{t("AngiographyScanerTemplateNameofexamDetail.page.loading")}</div>
    );

  if (error) return <div>{error}</div>;

  return (
    <div style={{ maxWidth: "700px", margin: "20px auto" }}>
      <h2>{t("AngiographyScanerTemplateNameofexamDetail.title")}</h2>

      <p>
        <strong>
          {t("AngiographyScanerTemplateNameofexamDetail.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("AngiographyScanerTemplateNameofexamDetail.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <Link
        to={`/dp/update-angiography-scan-template-nameofexam/${template._id}`}
        className="btn btn-warning btn-sm mt-2"
      >
        {t("AngiographyScanerTemplateNameofexamDetail.buttons.edit")}
      </Link>
    </div>
  );
}
