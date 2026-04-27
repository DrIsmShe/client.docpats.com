import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SpirometryScanerTemplateDiagnosisList() {
  const { t } = useTranslation("SpirometryScanerTemplateAdd");

  const [templates, setTemplates] = useState([]);
  const [message, setMessage] = useState("");
  const { id } = useParams();
  const API_BASE = process.env.REACT_APP_API_URL;

  const fetchTemplates = () => {
    axios
      .get(
        `${API_BASE}/clinic/get-templates-examinations/Spirometryscaner/diagnosis/${id}`,
        { withCredentials: true }
      )
      .then((res) => setTemplates(res.data))
      .catch(() =>
        setMessage(t("SpirometryScanerTemplateDiagnosisList.loadError"))
      );
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (templateId) => {
    if (
      !window.confirm(t("SpirometryScanerTemplateDiagnosisList.confirmDelete"))
    )
      return;

    try {
      const res = await axios.delete(
        `${API_BASE}/clinic/delete-templates-examinations/Spirometryscaner/diagnosis/${templateId}`,
        { withCredentials: true }
      );
      setMessage(res.data.message);
      fetchTemplates();
    } catch (err) {
      setMessage(t("SpirometryScanerTemplateDiagnosisList.deleteError"));
    }
  };

  return (
    <div style={{ maxWidth: "100%", margin: "20px auto" }}>
      <h2>{t("SpirometryScanerTemplateDiagnosisList.pageTitle")}</h2>

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
            <Link
              to={`/dp/detail-spirometry-scan-template-diagnosis/${template._id}`}
            >
              <strong>{template.title}</strong>
            </Link>

            <p>{template.content}</p>

            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleDelete(template._id)}
            >
              {t("SpirometryScanerTemplateDiagnosisList.deleteButton")}
            </button>

            <Link
              to={`/dp/update-spirometry-scan-template-diagnosis/${template._id}`}
              className="btn btn-warning btn-sm ms-2"
            >
              {t("SpirometryScanerTemplateDiagnosisList.editButton")}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
