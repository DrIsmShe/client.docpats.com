import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AngiographyScanerTemplateDiagnosisEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ❗ Загружаем нужный JSON-файл
  const { t } = useTranslation("templateExaminations");

  const [template, setTemplate] = useState({
    title: "",
    content: "",
  });

  const [message, setMessage] = useState("");
  const API_BASE = process.env.REACT_APP_API_URL;

  // 📌 Загрузка шаблона
  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/Angiographyscaner/diagnosis/${id}`,
        { withCredentials: true }
      )
      .then((res) => setTemplate(res.data))
      .catch((err) => console.error("Error loading template:", err));
  }, [id]);

  // 📌 Обработка изменений полей
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTemplate((prev) => ({ ...prev, [name]: value }));
  };

  // 📌 Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_BASE}/clinic/update-templates-examinations/Angiographyscaner/diagnosis/${id}`,
        template,
        { withCredentials: true }
      );

      setMessage(t("AngiographyScanerTemplateDiagnosisEdit.page.success"));

      setTimeout(
        () => navigate(`/dp/list-angiography-scan-template-diagnosis/${id}`),
        2000
      );
    } catch (err) {
      setMessage(t("AngiographyScanerTemplateDiagnosisEdit.page.error"));
      console.error("Error updating template:", err);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      {/* Заголовок */}
      <h2>{t("AngiographyScanerTemplateDiagnosisEdit.page.title")}</h2>

      {/* Сообщение об успехе/ошибке */}
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

      {/* Форма */}
      <form onSubmit={handleSubmit}>
        {/* Поле Title */}
        <div className="form-group">
          <label>
            {t("AngiographyScanerTemplateDiagnosisEdit.labels.title")}
          </label>
          <input
            type="text"
            name="title"
            value={template.title}
            onChange={handleChange}
            className="form-control"
            placeholder={t(
              "AngiographyScanerTemplateDiagnosisEdit.labels.titlePlaceholder"
            )}
            required
          />
        </div>

        {/* Поле Content */}
        <div className="form-group">
          <label>
            {t("AngiographyScanerTemplateDiagnosisEdit.labels.content")}
          </label>
          <textarea
            name="content"
            value={template.content}
            onChange={handleChange}
            className="form-control"
            placeholder={t(
              "AngiographyScanerTemplateDiagnosisEdit.labels.contentPlaceholder"
            )}
            style={{ height: "300px" }}
            required
          />
        </div>

        {/* Кнопка обновления */}
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "15px" }}
        >
          {t("AngiographyScanerTemplateDiagnosisEdit.buttons.update")}
        </button>
      </form>
    </div>
  );
}
