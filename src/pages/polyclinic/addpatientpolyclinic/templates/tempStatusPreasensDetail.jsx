import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

const TempStatusPreasensDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("Examinations");

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/clinic/temp-status-preasens-detail/${id}`
        );
        setTemplate(response.data);
      } catch (err) {
        setError(t("TempStatusPreasens.messages.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id, t]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      t("TempStatusPreasens.messages.confirmDelete")
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${API_BASE}/clinic/temp-status-preasens-delete/${id}`
      );
      alert(t("TempStatusPreasens.messages.deleteSuccess"));
      navigate("/dp/status-preasens-template-list");
    } catch (err) {
      alert(t("TempStatusPreasens.messages.deleteError"));
    }
  };

  if (loading) return <p>{t("TempStatusPreasens.messages.loading")}</p>;

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  if (!template) return <p>{t("TempStatusPreasens.messages.notFound")}</p>;

  return (
    <div className="container mt-4">
      <h2>{template.title}</h2>

      <div
        className="card-text mt-3"
        dangerouslySetInnerHTML={{ __html: template.content }}
      />

      <p className="mt-3">
        <strong>{t("TempStatusPreasens.labels.createdAt")}:</strong>{" "}
        {new Date(template.createdAt).toLocaleString()}
      </p>

      <p>
        <strong>{t("TempStatusPreasens.labels.tags")}:</strong>{" "}
        {template.tags?.join(", ") || t("TempStatusPreasens.labels.noTags")}
      </p>

      <p>
        <strong>{t("TempStatusPreasens.labels.status")}:</strong>{" "}
        {template.isActive
          ? t("TempStatusPreasens.labels.active")
          : t("TempStatusPreasens.labels.inactive")}
      </p>

      <div className="mt-4">
        <button onClick={handleDelete} className="btn btn-danger me-3">
          {t("TempStatusPreasens.buttons.delete")}
        </button>

        <Link to="/dp/add-status-preasens-template">
          <button className="btn btn-success">
            {t("TempStatusPreasens.buttons.createNew")}
          </button>
        </Link>
      </div>
    </div>
  );
};

export default TempStatusPreasensDetail;
