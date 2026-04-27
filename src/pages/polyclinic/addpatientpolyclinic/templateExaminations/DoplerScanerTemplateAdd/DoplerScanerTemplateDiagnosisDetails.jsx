import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function DoplerScanerTemplateDiagnosisDetails() {
  const { id } = useParams();
  const { t } = useTranslation("DoplerScanerTemplateAdd");

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/Doplerscaner/diagnosis/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("DoplerScanerTemplateDiagnosisDetails.messages.loadError"));
        setLoading(false);
      });
  }, [id, t]);

  if (loading) return <div>{t("common.loading")}</div>;

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("DoplerScanerTemplateDiagnosisDetails.page.title")}</h2>

      <p>
        <strong>
          {t("DoplerScanerTemplateDiagnosisDetails.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("DoplerScanerTemplateDiagnosisDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>
          {t("DoplerScanerTemplateDiagnosisDetails.fields.doctor")}:
        </strong>{" "}
        {template.doctor?.firstName} {template.doctor?.lastName}
      </p>

      <Link
        to={`/dp/update-dopler-scan-template-diagnosis/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("DoplerScanerTemplateDiagnosisDetails.buttons.edit")}
      </Link>
    </div>
  );
}
