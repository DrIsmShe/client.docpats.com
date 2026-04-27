import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function XRAYScanTemplateNameofexamDetail() {
  const { t } = useTranslation("XRAYScanerTemplateAdd");

  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/XRAYscaner/nameofexam/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("XRAYScanerTemplateNameofexamDetails.messages.loadError"));
        setLoading(false);
      });
  }, [id, API_BASE, t]);

  if (loading)
    return (
      <div>{t("XRAYScanerTemplateNameofexamDetails.messages.loading")}</div>
    );

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("XRAYScanerTemplateNameofexamDetails.title")}</h2>

      <p>
        <strong>
          {t("XRAYScanerTemplateNameofexamDetails.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("XRAYScanerTemplateNameofexamDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <Link
        to={`/dp/update-xray-scan-template-nameofexam/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("XRAYScanerTemplateNameofexamDetails.actions.edit")}
      </Link>
    </div>
  );
}
