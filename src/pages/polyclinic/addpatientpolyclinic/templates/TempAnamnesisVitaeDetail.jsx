import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function TempAnamnesisVitaeDetail() {
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
          `${API_BASE}/clinic/temp-anamnesis-vitae-detail/${id}`
        );
        setTemplate(response.data);
      } catch (err) {
        setError(t("anamnesisVitae.messages.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id, t]);

  const handleDelete = async () => {
    if (!window.confirm(t("anamnesisVitae.actions.confirmDelete"))) return;

    try {
      await axios.delete(
        `${API_BASE}/clinic/temp-anamnesis-vitae-delete/${id}`
      );
      alert(t("anamnesisVitae.messages.deleted"));
      navigate("/dp/anamnes-vitae-template-list");
    } catch (err) {
      alert(t("anamnesisVitae.messages.deleteError"));
    }
  };

  if (loading) return <p>{t("anamnesisVitae.messages.loading")}</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!template) return <p>{t("anamnesisVitae.messages.noData")}</p>;

  return (
    <div>
      <h1>{template.title}</h1>

      <div
        className="card-text"
        dangerouslySetInnerHTML={{ __html: template?.content }}
      />

      <p>
        <strong>{t("anamnesisVitae.fields.createdAt")}:</strong>{" "}
        {new Date(template.createdAt).toLocaleString()}
      </p>

      <p>
        <strong>{t("anamnesisVitae.fields.tags")}:</strong>{" "}
        {template.tags?.length
          ? template.tags.join(", ")
          : t("anamnesisVitae.messages.noTags")}
      </p>

      <p>
        <strong>{t("anamnesisVitae.fields.status")}:</strong>{" "}
        {template.isActive
          ? t("anamnesisVitae.status.active")
          : t("anamnesisVitae.status.inactive")}
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
        {t("anamnesisVitae.actions.delete")}
      </button>

      <Link to="/dp/add-anamnes-vitae-template">
        <button
          style={{
            backgroundColor: "green",
            color: "white",
            padding: "10px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {t("anamnesisVitae.actions.createNew")}
        </button>
      </Link>
    </div>
  );
}
