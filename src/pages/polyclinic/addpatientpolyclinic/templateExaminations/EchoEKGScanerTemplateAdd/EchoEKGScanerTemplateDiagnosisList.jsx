import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EchoEKGScanerTemplateDiagnosisList() {
  const [templates, setTemplates] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const { id } = useParams();
  const API_BASE = process.env.REACT_APP_API_URL;

  const { t } = useTranslation("EchoEKGScanerTemplateAdd", {
    keyPrefix: "EchoEKGScanerTemplateDiagnosisList",
  });

  const fetchTemplates = () => {
    axios
      .get(
        `${API_BASE}/clinic/get-templates-examinations/EchoEKGscaner/diagnosis/${id}`,
        { withCredentials: true }
      )
      .then((res) => setTemplates(res.data))
      .catch(() => {
        setIsError(true);
        setMessage(t("errorLoad"));
      });
  };

  useEffect(() => {
    fetchTemplates();
  }, [id]);

  const handleDelete = async (templateId) => {
    if (!window.confirm(t("confirmDelete"))) return;

    try {
      const res = await axios.delete(
        `${API_BASE}/clinic/delete-templates-examinations/EchoEKGscaner/diagnosis/${templateId}`,
        { withCredentials: true }
      );

      setIsError(false);
      setMessage(res.data.message || t("successDelete"));
      fetchTemplates();
    } catch (err) {
      setIsError(true);
      setMessage(t("errorDelete"));
    }
  };

  return (
    <div style={{ maxWidth: "100%", margin: "20px auto" }}>
      <h2>🧾 {t("pageTitle")}</h2>

      {message && (
        <div
          style={{
            backgroundColor: isError ? "#f8d7da" : "#d4edda",
            color: isError ? "#721c24" : "#155724",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
          }}
        >
          {message}
        </div>
      )}

      {templates.length === 0 ? (
        <p>{t("emptyList")}</p>
      ) : (
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
                to={`/dp/detail-echo-ekg-scan-template-diagnosis/${template._id}`}
              >
                <strong>{template.title}</strong>
              </Link>

              <p>{template.content}</p>

              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(template._id)}
              >
                🗑️ {t("deleteButton")}
              </button>

              <Link
                to={`/dp/update-echo-ekg-scan-template-diagnosis/${template._id}`}
                className="btn btn-warning btn-sm ms-2"
              >
                {t("editButton")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
