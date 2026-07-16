import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { sh } from "../../../../lib/sanitizeHtml";

const TempUltrasoundResultsDetail = () => {
  const { t } = useTranslation("TempUltrasoundResultsDetail");

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
          `${API_BASE}/clinic/temp-ultrasound-results-detail/${id}`
        );
        setTemplate(response.data);
      } catch (err) {
        setError(t("messages.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id, t]);

  const handleDelete = async () => {
    const ok = window.confirm(t("actions.confirmDelete"));
    if (!ok) return;

    try {
      await axios.delete(
        `${API_BASE}/clinic/temp-ultrasound-preasens-delete/${id}`
      );
      alert(t("messages.deleted"));
      navigate("/dp/ultrasound-tests-template-list");
    } catch (err) {
      alert(t("messages.deleteError"));
    }
  };

  if (loading) return <p>{t("messages.loading")}</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!template) return <p>{t("messages.noData")}</p>;

  return (
    <div className="container mt-4">
      <h2>{template.title}</h2>

      <div
        className="card-text mt-3"
        dangerouslySetInnerHTML={{ __html: sh(template?.content) }}
      />

      <p className="mt-3">
        <strong>{t("fields.createdAt")}:</strong>{" "}
        {new Date(template.createdAt).toLocaleString()}
      </p>

      <p>
        <strong>{t("fields.tags")}:</strong>{" "}
        {template.tags?.join(", ") || t("messages.noTags")}
      </p>

      <p>
        <strong>{t("fields.status")}:</strong>{" "}
        {template.isActive ? t("status.active") : t("status.inactive")}
      </p>

      <div className="mt-4">
        <button onClick={handleDelete} className="btn btn-danger me-3">
          {t("actions.delete")}
        </button>

        <Link to="/dp/add-ultrasound-tests-template">
          <button className="btn btn-success">{t("actions.createNew")}</button>
        </Link>
      </div>
    </div>
  );
};

export default TempUltrasoundResultsDetail;
