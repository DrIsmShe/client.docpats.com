import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function EEGScanerTemplateRecomendationEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const [originalTemplate, setOriginalTemplate] = useState({
    title: "",
    content: "",
  });

  const [template, setTemplate] = useState({
    title: "",
    content: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/clinic/details-templates-examinations/EEGscaner/recomandation/${id}`,
        { withCredentials: true }
      )
      .then((res) => {
        setOriginalTemplate(res.data); // для placeholder
      })
      .catch((err) => console.error("Error loading template:", err));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTemplate((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      title: template.title || originalTemplate.title,
      content: template.content || originalTemplate.content,
    };

    try {
      await axios.put(
        `${API_BASE}/clinic/update-templates-examinations/EEGScaner/recomandation/${id}`,
        payload,
        { withCredentials: true }
      );

      setMessage("✅ Recommendation template successfully updated!");
      setTimeout(
        () => navigate(`/dp/list-eeg-scan-template-recomandation/${id}`),
        2000
      );
    } catch (err) {
      setMessage("❌ Error updating template");
      console.error("Error updating template:", err);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      <h2>Edit EEG Scan Recommendation Template</h2>

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
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={template.title}
            placeholder={originalTemplate.title}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Content</label>
          <textarea
            name="content"
            value={template.content}
            placeholder={originalTemplate.content}
            onChange={handleChange}
            className="form-control"
            style={{ height: "300px" }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "15px" }}
        >
          Update Template
        </button>
      </form>
    </div>
  );
}
