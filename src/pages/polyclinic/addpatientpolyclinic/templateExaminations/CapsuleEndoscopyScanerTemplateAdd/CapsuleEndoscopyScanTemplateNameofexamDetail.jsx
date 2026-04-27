import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CapsuleEndoscopyScanTemplateNameofexamDetail() {
  const { t } = useTranslation("CapsuleEndoscopyScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/CapsuleEndoscopyscaner/nameofexam/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(
          t("CapsuleEndoscopyScanTemplateNameofexamDetail.messages.loadError")
        );
        setLoading(false);
      });
  }, [id, t]);

  if (loading)
    return (
      <div>
        {t("CapsuleEndoscopyScanTemplateNameofexamDetail.page.loading")}
      </div>
    );

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("CapsuleEndoscopyScanTemplateNameofexamDetail.title")}</h2>

      <p>
        <strong>
          {t("CapsuleEndoscopyScanTemplateNameofexamDetail.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("CapsuleEndoscopyScanTemplateNameofexamDetail.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <Link
        to={`/dp/update-capsule-endoscopy-scan-template-nameofexam/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("CapsuleEndoscopyScanTemplateNameofexamDetail.buttons.edit")}
      </Link>
    </div>
  );
}
