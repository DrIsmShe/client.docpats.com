import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

const CreateCategoryPage = () => {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [icon, setIcon] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}/my-articles-categories`, {
        name,
        description,
        slug,
        parentCategory,
        icon,
        metaDescription,
        metaKeywords,
      });

      setMessage(t("category_form.success"));
      navigate("/create-my-articles");
    } catch (error) {
      setMessage(t("category_form.error") + " " + error.message);
    }
  };

  return (
    <section className="section">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-body">
              <h2>{t("category_form.title")}</h2>

              <div className="alert alert-warning1" role="alert">
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <label>{t("category_form.name")}:</label>
                    <input
                      className="form-control"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row mb-3">
                    <label>{t("category_form.description")}:</label>
                    <textarea
                      className="form-control"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row mb-3">
                    <label>{t("category_form.parent")}:</label>
                    <select
                      className="form-control"
                      value={parentCategory}
                      onChange={(e) => setParentCategory(e.target.value)}
                    >
                      <option value="">
                        {t("category_form.select_parent")}
                      </option>
                      <option value="ent">Otorhinolaryngology</option>
                      <option value="surgery">General Surgery</option>
                    </select>
                  </div>

                  <div className="row mb-3">
                    <label>{t("category_form.meta_desc")}:</label>
                    <input
                      className="form-control"
                      type="text"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row mb-3">
                    <label>{t("category_form.meta_keywords")}:</label>
                    <input
                      className="form-control"
                      type="text"
                      value={metaKeywords}
                      onChange={(e) => setMetaKeywords(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">
                    {t("category_form.submit")}
                  </button>
                </form>

                {message && <p className="mt-3">{message}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateCategoryPage;
