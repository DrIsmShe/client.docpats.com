import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function TempCScanerResults() {
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
        `${API_BASE}/clinic/temp-ct-scan`,
        formData,
        { withCredentials: true }
      );

      console.log("Server response:", response.status, response.data);

      setMessage(
        response.data.message || t("tempCTScanResults.messages.submitSuccess")
      );

      setFormData({ title: "", content: "", tags: "" });
      setIsSubmitted(true);

      setTimeout(() => {
        navigate(`/dp/add-patient-medical-history/${id}`);
      }, 1000);
    } catch (error) {
      console.error("Error while submitting data:", error);
      setMessage(
        error.response?.data?.message ||
          t("tempCTScanResults.messages.submitError")
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
                <h5 className="card-title">{t("tempCTScanResults.title")}</h5>

                <form onSubmit={handleSubmit}>
                  {/* TITLE */}
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-2 col-form-label">
                      {t("tempCTScanResults.fields.title")}
                    </label>
                    <div className="col-md-8 col-lg-10">
                      <textarea
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("tempCTScanResults.placeholders.title")}
                        style={{ height: "50px" }}
                      ></textarea>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-2 col-form-label">
                      {t("tempCTScanResults.fields.content")}
                    </label>
                    <div className="col-md-8 col-lg-10">
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t(
                          "tempCTScanResults.placeholders.content"
                        )}
                        style={{ height: "100px" }}
                      ></textarea>
                    </div>
                  </div>

                  {/* TAGS */}
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-2 col-form-label">
                      {t("tempCTScanResults.fields.tags")}
                    </label>
                    <div className="col-md-8 col-lg-10">
                      <textarea
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("tempCTScanResults.placeholders.tags")}
                        style={{ height: "50px" }}
                      ></textarea>
                    </div>
                  </div>

                  {/* SUBMIT */}
                  <div className="row mb-3">
                    <div className="col-md-8 offset-md-4 col-lg-10 offset-lg-2">
                      <button type="submit" className="btn btn-primary">
                        {t("tempCTScanResults.buttons.submit")}
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
