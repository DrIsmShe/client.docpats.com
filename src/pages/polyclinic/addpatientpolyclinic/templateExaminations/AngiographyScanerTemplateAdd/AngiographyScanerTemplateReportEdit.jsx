import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AngiographyScanerTemplateReportEdit() {
  const { t } = useTranslation("templateExaminationsSecond");
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
        `${API_BASE}/clinic/details-templates-examinations/Angiographyscaner/report/${id}`,
        { withCredentials: true }
      )
      .then((res) => setTemplate(res.data))
      .catch((err) => {
        console.error(err);
        setMessage(t("AngiographyScanerTemplateReportEdit.messages.loadError"));
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
        `${API_BASE}/clinic/update-templates-examinations/Angiographyscaner/report/${id}`,
        template,
        { withCredentials: true }
      );

      setMessage(
        t("AngiographyScanerTemplateReportEdit.messages.updateSuccess")
      );

      setTimeout(
        () => navigate(`/dp/list-angiography-scan-template-report/${id}`),
        1500
      );
    } catch (err) {
      console.error(err);
      setMessage(t("AngiographyScanerTemplateReportEdit.messages.updateError"));
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      <h2>{t("AngiographyScanerTemplateReportEdit.title")}</h2>

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
          <label>{t("AngiographyScanerTemplateReportEdit.fields.title")}</label>
          <input
            type="text"
            name="title"
            value={template.title}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-group mt-3">
          <label>
            {t("AngiographyScanerTemplateReportEdit.fields.content")}
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
          {t("AngiographyScanerTemplateReportEdit.buttons.update")}
        </button>
      </form>
    </div>
  );
}
