import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function TempStatusPreasens() {
  const { t } = useTranslation("Examinations");
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
  });

  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitted(false);

    try {
      const response = await axios.post(
        `${API_BASE}/clinic/temp-status-preasens`,
        formData,
        { withCredentials: true }
      );

      setMessage(
        response.data.message || t("tempStatusPreasens.messages.submitSuccess")
      );
      setFormData({ title: "", content: "", tags: "" });
      setIsSubmitted(true);

      setTimeout(() => {
        navigate(`/dp/add-patient-medical-history/${id}`);
      }, 1000);
    } catch (error) {
      console.error("Submission error:", error);
      setMessage(
        error.response?.data?.message ||
          t("tempStatusPreasens.messages.submitError")
      );
    }
  };

  return (
    <div className="container mt-4">
      <section className="section profile">
        <div className="row">
          <div className="col-xl-12">
            <div className="card shadow-sm">
              <div className="card-body pt-3">
                <h5 className="card-title">{t("tempStatusPreasens.title")}</h5>

                <form onSubmit={handleSubmit}>
                  {/* TITLE */}
                  <div className="mb-3 row">
                    <label className="col-md-2 col-form-label">
                      {t("tempStatusPreasens.fields.title")}
                    </label>
                    <div className="col-md-10">
                      <textarea
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("tempStatusPreasens.placeholders.title")}
                        style={{ height: "50px" }}
                        required
                      />
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="mb-3 row">
                    <label className="col-md-2 col-form-label">
                      {t("tempStatusPreasens.fields.content")}
                    </label>
                    <div className="col-md-10">
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t(
                          "tempStatusPreasens.placeholders.content"
                        )}
                        style={{ height: "100px" }}
                        required
                      />
                    </div>
                  </div>

                  {/* TAGS */}
                  <div className="mb-3 row">
                    <label className="col-md-2 col-form-label">
                      {t("tempStatusPreasens.fields.tags")}
                    </label>
                    <div className="col-md-10">
                      <textarea
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("tempStatusPreasens.placeholders.tags")}
                        style={{ height: "50px" }}
                      />
                    </div>
                  </div>

                  {/* SUBMIT */}
                  <div className="text-end">
                    <button type="submit" className="btn btn-primary">
                      {t("tempStatusPreasens.buttons.submit")}
                    </button>
                  </div>
                </form>

                {/* MESSAGE */}
                {message && (
                  <div
                    className={`alert mt-3 ${
                      isSubmitted ? "alert-success" : "alert-warning"
                    }`}
                  >
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
