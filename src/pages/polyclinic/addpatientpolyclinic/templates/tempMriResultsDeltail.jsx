import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { sh } from "../../../../lib/sanitizeHtml";

export default function TempMriResultsDetail() {
  const { t } = useTranslation("Examinations"); // 🔥 подключение i18n
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
          `${API_BASE}/clinic/temp-mri-results-detail/${id}`
        );
        setTemplate(response.data);
      } catch (err) {
        setError(t("common.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id, t]);

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/clinic/temp-mri-results-delete/${id}`);
      alert(t("common.deleted"));
      navigate("/dp/mri-results-template-list");
    } catch (err) {
      alert(t("common.deleteError"));
    }
  };

  if (loading) return <p>{t("common.loading")}</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!template) return <p>{t("common.noData")}</p>;

  return (
    <div>
      <h1>{template.title}</h1>

      <div
        className="card-text"
        dangerouslySetInnerHTML={{ __html: sh(template?.content) }}
      />

      <p>
        <strong>{t("fields.createdAt")}: </strong>
        {new Date(template.createdAt).toLocaleString()}
      </p>

      <p>
        <strong>{t("fields.tags")}: </strong>
        {template.tags?.length > 0
          ? template.tags.join(", ")
          : t("common.noTags")}
      </p>

      <p>
        <strong>{t("fields.status")}: </strong>
        {template.isActive ? t("status.active") : t("status.inactive")}
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
        {t("actions.delete")}
      </button>

      <Link to="/dp/add-mri-results-template">
        <button
          style={{
            backgroundColor: "green",
            color: "white",
            padding: "10px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {t("actions.createNew")}
        </button>
      </Link>
    </div>
  );
}
