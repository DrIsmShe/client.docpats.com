import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function GinecologyTemplateDiagnosisEdit() {
  const { t } = useTranslation("GinecologyTemplateAdd");
  const { id } = useParams();
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_URL;

  const [template, setTemplate] = useState({
    title: "",
    content: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/Ginecology/diagnosis/${id}`,
        { withCredentials: true }
      )
      .then((res) => setTemplate(res.data))
      .catch(() =>
        setMessage(`❌ ${t("GinecologyTemplateDiagnosisEdit.loadError")}`)
      );
  }, [id, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTemplate((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `${API_BASE}/clinic/update-templates-examinations/Ginecology/diagnosis/${id}`,
        template,
        { withCredentials: true }
      );

      setMessage(`✅ ${t("GinecologyTemplateDiagnosisEdit.success")}`);

      setTimeout(() => {
        navigate(`/dp/list-ginecology-test-template-diagnosis/${id}`);
      }, 1500);
    } catch (err) {
      setMessage(`❌ ${t("GinecologyTemplateDiagnosisEdit.updateError")}`);
      console.error("Error updating template:", err);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      <h2>{t("GinecologyTemplateDiagnosisEdit.title")}</h2>

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

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t("GinecologyTemplateDiagnosisEdit.fields.title")}</label>
          <input
            type="text"
            name="title"
            value={template.title}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label>{t("GinecologyTemplateDiagnosisEdit.fields.content")}</label>
          <textarea
            name="content"
            value={template.content}
            onChange={handleChange}
            className="form-control"
            required
            style={{ height: "300px" }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "15px" }}
        >
          {t("GinecologyTemplateDiagnosisEdit.buttons.update")}
        </button>
      </form>
    </div>
  );
}
