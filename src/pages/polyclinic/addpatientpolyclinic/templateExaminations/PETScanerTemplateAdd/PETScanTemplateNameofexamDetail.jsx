import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PETScanTemplateNameofexamDetail() {
  const { id } = useParams();
  const { t } = useTranslation("PETScanerTemplateAdd");

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/PETscaner/nameofexam/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(
          t("PETScanerTemplateNameofexamDetails.page.errors.fetchError")
        );
        setLoading(false);
      });
  }, [id, t]);

  if (loading)
    return <div>{t("PETScanerTemplateNameofexamDetails.page.loading")}</div>;

  if (error) return <div>{error}</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h2>{t("PETScanerTemplateNameofexamDetails.page.title")}</h2>

      <p>
        <strong>{t("PETScanerTemplateNameofexamDetails.fields.title")}:</strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("PETScanerTemplateNameofexamDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <Link
        to={`/dp/update-pet-scan-template-nameofexam/${template._id}`}
        className="btn btn-warning btn-sm mt-3"
      >
        {t("PETScanerTemplateNameofexamDetails.buttons.edit")}
      </Link>
    </div>
  );
}
