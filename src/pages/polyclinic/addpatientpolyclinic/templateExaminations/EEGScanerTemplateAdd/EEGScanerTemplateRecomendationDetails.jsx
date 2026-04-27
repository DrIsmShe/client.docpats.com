import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";

export default function EEGScanerTemplateRecomendationDetails() {
  const { id } = useParams();
  const API_BASE = process.env.REACT_APP_API_URL;

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ===================== LOAD DATA ===================== */
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `${API_BASE}/clinic/details-templates-examinations/EEGscaner/recomandation/${id}`,
          { withCredentials: true }
        );

        setTemplate(res.data);
      } catch (err) {
        console.error("Error loading EEG recommendation template:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load recommendation template"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTemplate();
    }
  }, [id, API_BASE]);

  /* ===================== RENDER STATES ===================== */

  if (loading) {
    return <div className="text-center mt-4">Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-4 text-center">{error}</div>;
  }

  if (!template) {
    return (
      <div className="alert alert-warning mt-4 text-center">
        Template not found
      </div>
    );
  }

  /* ===================== MAIN VIEW ===================== */

  return (
    <div className="container mt-4" style={{ maxWidth: "800px" }}>
      <h3 className="mb-4 text-center">EEG Recommendation Template Details</h3>

      <div className="card shadow-sm">
        <div className="card-body">
          <p>
            <strong>Title:</strong>
          </p>
          <p className="border rounded p-2 bg-light">{template.title}</p>

          <p className="mt-3">
            <strong>Content:</strong>
          </p>
          <div className="border rounded p-3 bg-light">{template.content}</div>

          {template.doctor && (
            <p className="mt-3 text-muted">
              <strong>Doctor:</strong> {template.doctor.firstName}{" "}
              {template.doctor.lastName}
            </p>
          )}

          <p className="mt-2 text-muted small">
            Created: {new Date(template.createdAt).toLocaleString()}
          </p>

          <div className="d-flex justify-content-between mt-4">
            <Link
              to="/dp/list-eeg-scan-template-recomandation"
              className="btn btn-secondary btn-sm"
            >
              ← Back to list
            </Link>

            <Link
              to={`/dp/update-eeg-scan-template-recomandation/${template._id}`}
              className="btn btn-warning btn-sm"
            >
              ✏️ Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
