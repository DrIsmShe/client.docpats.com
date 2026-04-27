import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function DoplerScanerTemplateReportList() {
  const { id } = useParams();
  const { t } = useTranslation("DoplerScanerTemplateAdd");

  const [templates, setTemplates] = useState([]);
  const [message, setMessage] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  const fetchTemplates = () => {
    axios
      .get(
        `${API_BASE}/clinic/get-templates-examinations/Doplerscaner/report/${id}`,
        { withCredentials: true }
      )
      .then((res) => setTemplates(res.data))
      .catch((err) => {
        console.error("Error loading report templates:", err);
        setMessage(t("DoplerScanerTemplateReportList.messages.loadError"));
      });
  };

  useEffect(() => {
    fetchTemplates();
  }, [id]);

  const handleDelete = async (templateId) => {
    if (!window.confirm(t("DoplerScanerTemplateReportList.confirm.delete")))
      return;

    try {
      const res = await axios.delete(
        `${API_BASE}/clinic/delete-templates-examinations/Doplerscaner/report/${templateId}`,
        { withCredentials: true }
      );
      setMessage(
        res.data.message ||
          t("DoplerScanerTemplateReportList.messages.deleteSuccess")
      );
      fetchTemplates();
    } catch (err) {
      console.error("Error deleting report template:", err);
      setMessage(t("DoplerScanerTemplateReportList.messages.deleteError"));
    }
  };

  return (
    <div style={{ maxWidth: "100%", margin: "20px auto" }}>
      <h2>{t("DoplerScanerTemplateReportList.page.title")}</h2>

      {message && (
        <div
          style={{
            backgroundColor: message.startsWith("✅") ? "#d4edda" : "#f8d7da",
            color: message.startsWith("✅") ? "#155724" : "#721c24",
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
            <Link to={`/dp/detail-dopler-scan-template-report/${template._id}`}>
              <strong>{template.title}</strong>
            </Link>

            <p>{template.content}</p>

            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleDelete(template._id)}
            >
              {t("DoplerScanerTemplateReportList.buttons.delete")}
            </button>

            <Link
              to={`/dp/update-dopler-scan-template-report/${template._id}`}
              className="btn btn-warning btn-sm ms-2"
            >
              {t("DoplerScanerTemplateReportList.buttons.edit")}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
