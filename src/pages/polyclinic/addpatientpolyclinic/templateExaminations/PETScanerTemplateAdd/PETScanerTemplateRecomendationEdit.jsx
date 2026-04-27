import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PETScanerTemplateRecomendationEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("PETScanerTemplateAdd");

  const API_BASE = process.env.REACT_APP_API_URL;

  const [template, setTemplate] = useState({
    title: "",
    content: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/PETscaner/recomandation/${id}`,
        { withCredentials: true }
      )
      .then((res) => setTemplate(res.data))
      .catch((err) => {
        console.error("Error loading template:", err);
        setMessage(t("PETScanerTemplateRecomendationEdit.messages.fetchError"));
      });
  }, [id, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTemplate((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_BASE}/clinic/update-templates-examinations/PETscaner/recomandation/${id}`,
        template,
        { withCredentials: true }
      );

      setMessage(t("PETScanerTemplateRecomendationEdit.messages.success"));

      setTimeout(() => {
        navigate(`/dp/list-pet-scan-template-recomandation/${id}`);
      }, 2000);
    } catch (err) {
      console.error("Error updating template:", err);
      setMessage(t("PETScanerTemplateRecomendationEdit.messages.updateError"));
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      <h2>{t("PETScanerTemplateRecomendationEdit.page.title")}</h2>

      {message && (
        <div
          style={{
            backgroundColor: message.startsWith("❌") ? "#f8d7da" : "#d4edda",
            color: message.startsWith("❌") ? "#721c24" : "#155724",
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
          <label>{t("PETScanerTemplateRecomendationEdit.fields.title")}</label>
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
          <label>
            {t("PETScanerTemplateRecomendationEdit.fields.content")}
          </label>
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
          {t("PETScanerTemplateRecomendationEdit.buttons.update")}
        </button>
      </form>
    </div>
  );
}
