import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EEGScanerTemplateReportList() {
  const { t } = useTranslation("EEGScanerTemplateAdd");

  const [templates, setTemplates] = useState([]);
  const [message, setMessage] = useState("");
  const { id } = useParams();

  const API_BASE = process.env.REACT_APP_API_URL;

  const fetchTemplates = () => {
    axios
      .get(
        `${API_BASE}/clinic/get-templates-examinations/EEGscaner/report/${id}`,
        { withCredentials: true }
      )
      .then((res) => setTemplates(res.data))
      .catch(() =>
        console.error(t("EEGScanerTemplateReportList.loadingError"))
      );
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (templateId) => {
    if (!window.confirm(t("EEGScanerTemplateReportList.confirmDelete"))) return;

    try {
      await axios.delete(
        `${API_BASE}/clinic/delete-templates-examinations/EEGscaner/report/${templateId}`,
        { withCredentials: true }
      );
      fetchTemplates();
    } catch (err) {
      console.error("Delete error:", err);
      setMessage(t("EEGScanerTemplateReportList.deleteError"));
    }
  };

  return (
    <div style={{ maxWidth: "100%", margin: "20px auto" }}>
      <h2>{t("EEGScanerTemplateReportList.titlePage")}</h2>

      {message && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
          }}
        >
          {message}
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {templates.map((template) => (
          <li
            key={template._id}
            style={{
              marginBottom: "15px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          >
            <Link to={`/dp/detail-eeg-scan-template-report/${template._id}`}>
              <strong>{template.title}</strong>
            </Link>

            <p>{template.content}</p>

            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleDelete(template._id)}
            >
              {t("EEGScanerTemplateReportList.delete")}
            </button>

            <Link
              to={`/dp/update-eeg-scan-template-report/${template._id}`}
              className="btn btn-warning btn-sm ms-2"
            >
              {t("EEGScanerTemplateReportList.edit")}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
