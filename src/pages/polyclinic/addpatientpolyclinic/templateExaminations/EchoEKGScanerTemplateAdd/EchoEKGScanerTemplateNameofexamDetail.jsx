import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EchoEKGScanTemplateNameofexamDetail() {
  const { id } = useParams();
  const API_BASE = process.env.REACT_APP_API_URL;

  const { t } = useTranslation("EchoEKGScanerTemplateAdd", {
    keyPrefix: "EchoEKGScanerTemplateNameofexamDetail",
  });

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/EchoEKGscaner/nameofexam/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("errorLoad"));
        setLoading(false);
      });
  }, [id, API_BASE, t]);

  if (loading) return <div>{t("loading")}</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ maxWidth: "700px", margin: "20px auto" }}>
      <h2>{t("pageTitle")}</h2>

      <p>
        <strong>{t("titleLabel")}:</strong> {template.title}
      </p>

      <p>
        <strong>{t("contentLabel")}:</strong> {template.content}
      </p>

      <Link
        to={`/dp/update-echo-ekg-scan-template-nameofexam/${template._id}`}
        className="btn btn-warning btn-sm mt-3"
      >
        {t("editButton")}
      </Link>
    </div>
  );
}
