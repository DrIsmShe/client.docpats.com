import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function ComplaintDetail() {
  const { t } = useTranslation("Examinations");

  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/clinic/temp-complaints-detail/${id}`
        );
        setComplaint(response.data);
      } catch (err) {
        setError(t("complaints.messages.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id, t]);

  const handleDelete = async () => {
    if (!window.confirm(t("complaints.actions.confirmDelete"))) return;

    try {
      await axios.delete(`${API_BASE}/clinic/temp-complaint-delete/${id}`);
      alert(t("complaints.messages.deleted"));
      navigate("/dp/temp-complaints-list");
    } catch (err) {
      alert(t("complaints.messages.deleteError"));
    }
  };

  if (loading) return <p>{t("complaints.messages.loading")}</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!complaint) return <p>{t("complaints.messages.noData")}</p>;

  return (
    <div>
      <h1>{complaint.title}</h1>

      <div
        className="card-text"
        dangerouslySetInnerHTML={{ __html: complaint?.content }}
      />

      <p>
        <strong>{t("complaints.fields.createdAt")}:</strong>{" "}
        {new Date(complaint.createdAt).toLocaleString()}
      </p>

      <p>
        <strong>{t("complaints.fields.tags")}:</strong>{" "}
        {complaint.tags?.length
          ? complaint.tags.join(", ")
          : t("complaints.messages.noTags")}
      </p>

      <p>
        <strong>{t("complaints.fields.status")}:</strong>{" "}
        {complaint.isActive
          ? t("complaints.status.active")
          : t("complaints.status.inactive")}
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
        {t("complaints.actions.delete")}
      </button>

      {/* Create new template */}
      <Link to="/dp/add-complainte-template">
        <button
          style={{
            backgroundColor: "green",
            color: "white",
            padding: "10px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {t("complaints.actions.createNew")}
        </button>
      </Link>
    </div>
  );
}
