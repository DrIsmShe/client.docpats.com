import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function XRAYScanTemplateNameofexamEdit() {
  const { t } = useTranslation("XRAYScanerTemplateAdd");
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
        `${API_BASE}/clinic/details-templates-examinations/XRAYscaner/nameofexam/${id}`,
        { withCredentials: true }
      )
      .then((res) => setTemplate(res.data))
      .catch(() =>
        setMessage(t("XRAYScanerTemplateNameofexamEdit.messages.loadError"))
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
        `${API_BASE}/clinic/update-templates-examinations/XRAYscaner/nameofexam/${id}`,
        template,
        { withCredentials: true }
      );

      setMessage(t("XRAYScanerTemplateNameofexamEdit.messages.success"));

      setTimeout(
        () => navigate(`/dp/list-xray-scan-template-nameofexam/${id}`),
        2000
      );
    } catch (err) {
      setMessage(t("XRAYScanerTemplateNameofexamEdit.messages.updateError"));
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      <h2>{t("XRAYScanerTemplateNameofexamEdit.title")}</h2>

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
          <label>{t("XRAYScanerTemplateNameofexamEdit.fields.title")}</label>
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
          <label>{t("XRAYScanerTemplateNameofexamEdit.fields.content")}</label>
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
          {t("XRAYScanerTemplateNameofexamEdit.actions.update")}
        </button>
      </form>
    </div>
  );
}
