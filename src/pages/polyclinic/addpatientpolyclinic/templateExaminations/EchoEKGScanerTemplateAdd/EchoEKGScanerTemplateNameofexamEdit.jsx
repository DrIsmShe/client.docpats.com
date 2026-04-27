import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EchoEKGScanTemplateNameofexamEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const { t } = useTranslation("EchoEKGScanerTemplateAdd", {
    keyPrefix: "EchoEKGScanerTemplateNameofexamEdit",
  });

  const [template, setTemplate] = useState({
    title: "",
    content: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/EchoEKGscaner/nameofexam/${id}`,
        { withCredentials: true }
      )
      .then((res) => setTemplate(res.data))
      .catch(() => {
        setIsError(true);
        setMessage(t("errorLoad"));
      });
  }, [id, API_BASE, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTemplate((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      await axios.put(
        `${API_BASE}/clinic/update-templates-examinations/EchoEKGscaner/nameofexam/${id}`,
        template,
        { withCredentials: true }
      );

      setMessage(t("successUpdate"));

      setTimeout(() => {
        navigate(`/dp/list-echo-ekg-scan-template-nameofexam/${id}`);
      }, 2000);
    } catch (err) {
      setIsError(true);
      setMessage(t("errorUpdate"));
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      <h2>{t("pageTitle")}</h2>

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

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t("titleLabel")}</label>
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
          <label>{t("contentLabel")}</label>
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
          {t("updateButton")}
        </button>
      </form>
    </div>
  );
}
