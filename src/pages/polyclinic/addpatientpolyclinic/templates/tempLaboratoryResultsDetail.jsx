import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function TempLaboratoryResultsDetail() {
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
          `${API_BASE}/clinic/temp-laboratory-tests-detail/${id}`
        );
        setTemplate(response.data);
      } catch (err) {
        setError(t("laboratory-detail.messages.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id, t]);

  const handleDelete = async () => {
    if (!window.confirm(t("laboratory-detail.actions.confirmDelete"))) return;

    try {
      await axios.delete(
        `${API_BASE}/clinic/temp-laboratory-tests-delete/${id}`
      );

      alert(t("laboratory-detail.messages.deleted"));
      navigate("/dp/laboratory-tests-template-list");
    } catch (err) {
      alert(t("laboratory-detail.messages.deleteError"));
    }
  };

  if (loading) return <p>{t("laboratory.messages.loading")}</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!template) return <p>{t("laboratory-detail.messages.noData")}</p>;

  return (
    <div>
      <h1>{template.title}</h1>

      <div
        className="card-text"
        dangerouslySetInnerHTML={{ __html: template?.content }}
      />

      <p>
        <strong>{t("laboratory-detail.fields.createdAt")}:</strong>{" "}
        {new Date(template.createdAt).toLocaleString()}
      </p>

      <p>
        <strong>{t("laboratory-detail.fields.tags")}:</strong>{" "}
        {template?.tags?.length
          ? template.tags.join(", ")
          : t("laboratory-detail.messages.noTags")}
      </p>

      <p>
        <strong>{t("laboratory.fields.status")}:</strong>{" "}
        {template.isActive
          ? t("laboratory-detail.status.active")
          : t("laboratory-detail.status.inactive")}
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
        {t("laboratory-detail.actions.delete")}
      </button>

      <Link to="/dp/add-laboratory-tests-template">
        <button
          style={{
            backgroundColor: "green",
            color: "white",
            padding: "10px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {t("laboratory-detail.actions.createNew")}
        </button>
      </Link>
    </div>
  );
}
