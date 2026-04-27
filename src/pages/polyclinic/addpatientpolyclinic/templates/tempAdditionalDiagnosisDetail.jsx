import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function TempAdditionalDiagnosisDetail() {
  const { t } = useTranslation("Examinations");

  const { id } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/clinic/temp-additionalDiagnosis-detail/${id}`
        );
        setTemplate(response.data);
      } catch (err) {
        setError(t("additionalDiagnosisDetails.messages.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id, t]);

  const handleDelete = async () => {
    if (!window.confirm(t("additionalDiagnosisDetails.actions.confirmDelete")))
      return;

    try {
      await axios.delete(
        `${API_BASE}/clinic/temp-additionalDiagnosis-delete/${id}`
      );

      alert(t("additionalDiagnosisDetails.messages.deleted"));
      navigate("/dp/list-additional-diagnosis-template");
    } catch (err) {
      alert(t("additionalDiagnosisDetails.messages.deleteError"));
    }
  };

  if (loading) return <p>{t("additionalDiagnosisDetails.messages.loading")}</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!template)
    return <p>{t("additionalDiagnosisDetails.messages.noData")}</p>;

  return (
    <div>
      <h1>{template.title}</h1>

      <div
        className="card-text"
        dangerouslySetInnerHTML={{ __html: template?.content }}
      />

      <p>
        <strong>{t("additionalDiagnosisDetails.fields.createdAt")}:</strong>{" "}
        {new Date(template.createdAt).toLocaleString()}
      </p>

      <p>
        <strong>{t("additionalDiagnosisDetails.fields.tags")}:</strong>{" "}
        {template.tags?.length
          ? template.tags.join(", ")
          : t("additionalDiagnosisDetails.messages.noTags")}
      </p>

      <p>
        <strong>{t("additionalDiagnosisDetails.fields.status")}:</strong>{" "}
        {template.isActive
          ? t("additionalDiagnosisDetails.status.active")
          : t("additionalDiagnosisDetails.status.inactive")}
      </p>

      <button
        onClick={handleDelete}
        style={{
          backgroundColor: "red",
          color: "white",
          padding: "10px",
          border: "none",
          cursor: "pointer",
          marginRight: "10px",
        }}
      >
        {t("additionalDiagnosisDetails.actions.delete")}
      </button>

      <Link to="/dp/add-additional-diagnosis-template">
        <button
          style={{
            backgroundColor: "green",
            color: "white",
            padding: "10px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {t("additionalDiagnosisDetails.actions.createNew")}
        </button>
      </Link>
    </div>
  );
}
