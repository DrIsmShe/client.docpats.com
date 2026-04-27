import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function TempRecommendationsDetail() {
  const { t } = useTranslation("examinations");
  const { id } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/clinic/temp-recommendations-detail/${id}`
        );
        setTemplate(response.data);
      } catch (err) {
        setError(t("common.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [id, t]);

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${API_BASE}/clinic/temp-recommendations-delete/${id}`
      );
      alert(t("common.deleted"));
      navigate("/dp/recommendation-tests-template-list");
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
        dangerouslySetInnerHTML={{ __html: template?.content }}
      />

      <p>
        <strong>{t("fields.createdAt")}:</strong>{" "}
        {new Date(template.createdAt).toLocaleString()}
      </p>

      <p>
        <strong>{t("fields.tags")}:</strong>{" "}
        {template.tags?.length ? template.tags.join(", ") : t("common.noTags")}
      </p>

      <p>
        <strong>{t("fields.status")}:</strong>{" "}
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

      <Link to="/dp/add-recommendation-template">
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
