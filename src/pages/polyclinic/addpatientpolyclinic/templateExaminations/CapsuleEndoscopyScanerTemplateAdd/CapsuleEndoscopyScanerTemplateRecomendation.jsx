import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

const CapsuleEndoscopyScanerTemplateRecomendation = () => {
  const { t } = useTranslation("CapsuleEndoscopyScanerTemplateAdd");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${API_BASE}/clinic/add-templates-examinations/CapsuleEndoscopyscaner/recomandation`,
        { title, content },
        { withCredentials: true }
      );

      setMessage(
        t("CapsuleEndoscopyScanerTemplateRecomendation.messages.addSuccess")
      );

      setTitle("");
      setContent("");

      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      console.error(err);
      setMessage(
        err.response
          ? "❌ " +
              (err.response.data.message ||
                t(
                  "CapsuleEndoscopyScanerTemplateRecomendation.messages.addError"
                ))
          : t(
              "CapsuleEndoscopyScanerTemplateRecomendation.messages.networkError"
            )
      );
    }
  };

  return (
    <div
      className="ctscan-template-nameofexam"
      style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}
    >
      <div
        className="topbar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <h2>{t("CapsuleEndoscopyScanerTemplateRecomendation.title")}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            type="text"
            placeholder={t(
              "CapsuleEndoscopyScanerTemplateRecomendation.fields.title"
            )}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="form-control"
          />

          <textarea
            placeholder={t(
              "CapsuleEndoscopyScanerTemplateRecomendation.fields.content"
            )}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="form-control"
            style={{ height: "150px" }}
          />

          <button type="submit" className="btn btn-success">
            {t("CapsuleEndoscopyScanerTemplateRecomendation.buttons.save")}
          </button>
        </div>

        {message && (
          <p
            style={{
              marginTop: "20px",
              textAlign: "center",
              color: message.startsWith("✅") ? "green" : "red",
            }}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default CapsuleEndoscopyScanerTemplateRecomendation;
