import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

const SpirometryScanerTemplateDiagnosis = () => {
  const { t } = useTranslation("SpirometryScanerTemplateAdd");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${API_BASE}/clinic/add-templates-examinations/Spirometryscaner/diagnosis`,
        { title, content },
        { withCredentials: true }
      );

      setMessage(t("SpirometryScanerTemplateDiagnosis.successMessage"));
      setTitle("");
      setContent("");

      setTimeout(() => {
        navigate(-1);
      }, 1000);
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.message ||
          t("SpirometryScanerTemplateDiagnosis.errorDefault")
        : t("SpirometryScanerTemplateDiagnosis.networkError");

      setMessage(`❌ ${errorMessage}`);
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
        <h2>{t("SpirometryScanerTemplateDiagnosis.pageTitle")}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            type="text"
            placeholder={t(
              "SpirometryScanerTemplateDiagnosis.titlePlaceholder"
            )}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              padding: "10px",
              fontSize: "16px",
              height: "50px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />

          <textarea
            placeholder={t(
              "SpirometryScanerTemplateDiagnosis.contentPlaceholder"
            )}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{
              padding: "10px",
              fontSize: "16px",
              height: "150px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />

          <button
            type="submit"
            style={{
              backgroundColor: "green",
              color: "white",
              fontSize: "16px",
              padding: "12px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {t("SpirometryScanerTemplateDiagnosis.saveButton")}
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

export default SpirometryScanerTemplateDiagnosis;
