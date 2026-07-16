import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { sh } from "../../../../lib/sanitizeHtml";

export default function TempAnamnesisMorbiDetail() {
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
          `${API_BASE}/clinic/temp-anamnesis-morbi-detail/${id}`
        );
        setTemplate(response.data);
      } catch (err) {
        setError(t("anamnesisMorbi.messages.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id, t]);

  const handleDelete = async () => {
    if (!window.confirm(t("anamnesisMorbi.actions.confirmDelete"))) return;

    try {
      await axios.delete(
        `${API_BASE}/clinic/temp-anamnesis-morbi-delete/${id}`
      );
      alert(t("anamnesisMorbi.messages.deleted"));
      navigate("/dp/anamnes-morbi-template-list");
    } catch (err) {
      alert(t("anamnesisMorbi.messages.deleteError"));
    }
  };

  if (loading) return <p>{t("anamnesisMorbi.messages.loading")}</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!template) return <p>{t("anamnesisMorbi.messages.noData")}</p>;

  return (
    <div>
      <h1>{template.title}</h1>

      <div
        className="card-text"
        dangerouslySetInnerHTML={{ __html: sh(template?.content) }}
      />

      <p>
        <strong>{t("anamnesisMorbi.fields.createdAt")}:</strong>{" "}
        {new Date(template.createdAt).toLocaleString()}
      </p>

      <p>
        <strong>{t("anamnesisMorbi.fields.tags")}:</strong>{" "}
        {template.tags?.length
          ? template.tags.join(", ")
          : t("anamnesisMorbi.messages.noTags")}
      </p>

      <p>
        <strong>{t("anamnesisMorbi.fields.status")}:</strong>{" "}
        {template.isActive
          ? t("anamnesisMorbi.status.active")
          : t("anamnesisMorbi.status.inactive")}
      </p>

      {/* Delete button */}
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
        {t("anamnesisMorbi.actions.delete")}
      </button>

      {/* Create new button */}
      <Link to="/dp/add-anamnes-morbi-template">
        <button
          style={{
            backgroundColor: "green",
            color: "white",
            padding: "10px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {t("anamnesisMorbi.actions.createNew")}
        </button>
      </Link>
    </div>
  );
}
