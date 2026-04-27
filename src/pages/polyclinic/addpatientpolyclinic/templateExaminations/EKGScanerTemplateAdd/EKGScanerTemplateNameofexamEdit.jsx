import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EKGScanTemplateNameofexamEdit() {
  const { t } = useTranslation("EKGScanerTemplateAdd");
  const { id } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState({
    title: "",
    content: "",
  });
  const [message, setMessage] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/EKGscaner/nameofexam/${id}`,
        { withCredentials: true }
      )
      .then((res) => setTemplate(res.data))
      .catch(() =>
        setMessage(`❌ ${t("EKGScanTemplateNameofexamEdit.loadError")}`)
      );
  }, [id, API_BASE, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTemplate((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_BASE}/clinic/update-templates-examinations/EKGscaner/nameofexam/${id}`,
        template,
        { withCredentials: true }
      );

      setMessage(`✅ ${t("EKGScanTemplateNameofexamEdit.success")}`);

      setTimeout(
        () => navigate(`/dp/list-ekg-scan-template-nameofexam/${id}`),
        2000
      );
    } catch (err) {
      setMessage(`❌ ${t("EKGScanTemplateNameofexamEdit.updateError")}`);
      console.error("Error updating template:", err);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      <h2>{t("EKGScanTemplateNameofexamEdit.titlePage")}</h2>

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
          <label>{t("EKGScanTemplateNameofexamEdit.titleLabel")}</label>
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
          <label>{t("EKGScanTemplateNameofexamEdit.contentLabel")}</label>
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
          {t("EKGScanTemplateNameofexamEdit.updateButton")}
        </button>
      </form>
    </div>
  );
}
