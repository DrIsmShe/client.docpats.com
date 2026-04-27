import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function TempStatusLocalis() {
  const { t } = useTranslation("Examinations");
  const navigate = useNavigate();
  const { id } = useParams();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
  });

  const API_BASE = process.env.REACT_APP_API_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(
        `${API_BASE}/clinic/temp-status-localis`,
        formData,
        { withCredentials: true }
      );

      setMessage(
        response.data.message || t("tempStatusLocalis.messages.submitSuccess")
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
          t("tempStatusLocalis.messages.submitError")
      );
      setIsSubmitted(false);
    }
  };

  return (
    <div>
      <section className="section profile">
        <div className="row">
          <div className="col-xl-12">
            <div className="card">
              <div className="card-body pt-3">
                <h5 className="card-title">{t("tempStatusLocalis.title")}</h5>

                <form onSubmit={handleSubmit}>
                  {/* TITLE */}
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-2 col-form-label">
                      {t("tempStatusLocalis.fields.title")}
                    </label>
                    <div className="col-md-8 col-lg-10">
                      <textarea
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("tempStatusLocalis.placeholders.title")}
                        style={{ height: "50px" }}
                      />
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-2 col-form-label">
                      {t("tempStatusLocalis.fields.content")}
                    </label>
                    <div className="col-md-8 col-lg-10">
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t(
                          "tempStatusLocalis.placeholders.content"
                        )}
                        style={{ height: "100px" }}
                      />
                    </div>
                  </div>

                  {/* TAGS */}
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-2 col-form-label">
                      {t("tempStatusLocalis.fields.tags")}
                    </label>
                    <div className="col-md-8 col-lg-10">
                      <textarea
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("tempStatusLocalis.placeholders.tags")}
                        style={{ height: "50px" }}
                      />
                    </div>
                  </div>

                  {/* SUBMIT */}
                  <div className="row mb-3">
                    <div className="col-md-8 offset-md-4 col-lg-10 offset-lg-2">
                      <button type="submit" className="btn btn-primary">
                        {t("tempStatusLocalis.buttons.submit")}
                      </button>
                    </div>
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
