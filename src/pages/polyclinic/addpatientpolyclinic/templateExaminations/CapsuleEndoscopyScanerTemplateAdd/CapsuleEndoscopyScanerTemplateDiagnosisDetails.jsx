import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CapsuleEndoscopyScanerTemplateDiagnosisDetails() {
  const { t } = useTranslation("CapsuleEndoscopyScanerTemplateAdd");
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/CapsuleEndoscopyscaner/diagnosis/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          t("CapsuleEndoscopyScanerTemplateDiagnosisDetails.messages.loadError")
        );
        setLoading(false);
      });
  }, [id, t]);

  if (loading)
    return (
      <div>
        {t("CapsuleEndoscopyScanerTemplateDiagnosisDetails.page.loading")}
      </div>
    );

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("CapsuleEndoscopyScanerTemplateDiagnosisDetails.title")}</h2>

      <p>
        <strong>
          {t("CapsuleEndoscopyScanerTemplateDiagnosisDetails.fields.title")}:
        </strong>{" "}
        {template.title}
      </p>

      <p>
        <strong>
          {t("CapsuleEndoscopyScanerTemplateDiagnosisDetails.fields.content")}:
        </strong>{" "}
        {template.content}
      </p>

      <p>
        <strong>
          {t("CapsuleEndoscopyScanerTemplateDiagnosisDetails.fields.doctor")}:
        </strong>{" "}
        {template.doctor.firstName} {template.doctor.lastName}
      </p>

      <Link
        to={`/dp/update-capsule-endoscopy-scan-template-diagnosis/${template._id}`}
        className="btn btn-warning btn-sm ms-2"
      >
        {t("CapsuleEndoscopyScanerTemplateDiagnosisDetails.buttons.edit")}
      </Link>
    </div>
  );
}
