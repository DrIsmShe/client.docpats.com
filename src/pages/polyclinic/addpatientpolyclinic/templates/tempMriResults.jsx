import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function TempMriResults() {
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
        `${API_BASE}/clinic/temp-mri-results`,
        formData,
        { withCredentials: true }
      );

      console.log("Server response:", response.status, response.data);

      setMessage(
        response.data.message || t("tempMRIResults.messages.submitSuccess")
      );
      setFormData({ title: "", content: "", tags: "" });

      setIsSubmitted(true);

      setTimeout(() => {
        navigate(`/dp/add-patient-medical-history/${id}`);
      }, 1000);
    } catch (error) {
      console.error("Error during data submission:", error);

      setMessage(
        error.response?.data?.message ||
          t("tempMRIResults.messages.submitError")
      );
    }
  };

  return (
    <div>
      <section className="section profile">
        <div className="row">
          <div className="col-xl-12">
            <div className="card">
              <div className="card-body pt-3">
                <h5 className="card-title">{t("tempMRIResults.title")}</h5>

                <form onSubmit={handleSubmit}>
                  {/* TITLE */}
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-2 col-form-label">
                      {t("tempMRIResults.fields.title")}
                    </label>
                    <div className="col-md-8 col-lg-10">
                      <textarea
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("tempMRIResults.placeholders.title")}
                        style={{ height: "50px" }}
                      ></textarea>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-2 col-form-label">
                      {t("tempMRIResults.fields.content")}
                    </label>
                    <div className="col-md-8 col-lg-10">
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("tempMRIResults.placeholders.content")}
                        style={{ height: "100px" }}
                      ></textarea>
                    </div>
                  </div>

                  {/* TAGS */}
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-2 col-form-label">
                      {t("tempMRIResults.fields.tags")}
                    </label>
                    <div className="col-md-8 col-lg-10">
                      <textarea
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("tempMRIResults.placeholders.tags")}
                        style={{ height: "50px" }}
                      ></textarea>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="row mb-3">
                    <div className="col-md-8 offset-md-4 col-lg-10 offset-lg-2">
                      <button type="submit" className="btn btn-primary">
                        {t("tempMRIResults.buttons.submit")}
                      </button>
                    </div>
                  </div>
                </form>

                {/* RESULT MESSAGE */}
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
