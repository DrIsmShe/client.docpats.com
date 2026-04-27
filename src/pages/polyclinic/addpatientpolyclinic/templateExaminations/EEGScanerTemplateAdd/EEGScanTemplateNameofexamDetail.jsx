import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EEGScanTemplateNameofexamDetail() {
  const { t } = useTranslation("EEGScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/EEGscaner/nameofexam/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("EEGScanTemplateNameofexamDetail.loadError"));
        setLoading(false);
      });
  }, [id, t]);

  if (loading) return <div>{t("EEGScanTemplateNameofexamDetail.loading")}</div>;

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("EEGScanTemplateNameofexamDetail.titlePage")}</h2>

      <p>
        <strong>{t("EEGScanTemplateNameofexamDetail.titleLabel")}:</strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>{t("EEGScanTemplateNameofexamDetail.contentLabel")}:</strong>{" "}
        {template.content}
      </p>

      <Link
        to={`/dp/update-eeg-scan-template-nameofexam/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("EEGScanTemplateNameofexamDetail.edit")}
      </Link>
    </div>
  );
}
