import axios from "axios";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useTranslation } from "react-i18next";

export default function EditMyArticleDoctor() {
  const { t } = useTranslation(); // ← i18n

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    title = "",
    content = "",
    category: initialCategory = "",
    tags = "",
    metaDescription = "",
    metaKeywords = "",
    isPublished = false,
  } = location.state || {};

  const [articleData, setArticleData] = useState({
    title,
    content,
    tags,
    metaDescription,
    metaKeywords,
    isPublished,
    category: initialCategory,
    image: null,
    imageUrl: location.state?.imageUrl || null,
  });

  const [categories, setCategories] = useState([]);

  const API_BASE = process.env.REACT_APP_API_URL;

  /* ---------------------- Load categories ---------------------- */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/admin/my-articles-categories`,
          { withCredentials: true }
        );
        setCategories(response.data);
      } catch (error) {
        console.error("❌ Load categories error:", error);
        alert(t("article_edit.load_error"));
      }
    };

    fetchCategories();
  }, [API_BASE, t]);

  /* ---------------------- Handle Input Change ---------------------- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setArticleData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ---------------------- Handle Image Change ---------------------- */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setArticleData((prev) => ({
      ...prev,
      image: file,
    }));
  };

  /* ---------------------- Handle CKEditor Change ---------------------- */
  const handleEditorChange = (data) => {
    setArticleData((prev) => ({
      ...prev,
      content: data,
    }));
  };

  /* ---------------------- Handle Submit ---------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("title", articleData.title);
    formData.append("content", articleData.content);
    formData.append("tags", articleData.tags);
    formData.append("metaDescription", articleData.metaDescription);
    formData.append("metaKeywords", articleData.metaKeywords);
    formData.append("isPublished", articleData.isPublished);
    formData.append("category", articleData.category);

    if (articleData.image) {
      formData.append("image", articleData.image);
    }

    try {
      await axios.put(
        `${API_BASE}/doctor-profile/update-my-article/${id}`,
        formData,
        { withCredentials: true }
      );

      alert(t("article_edit.updated_success"));
      // Публичная страница — доступна и врачу-автору, и админу
      // (докторская /doctor/... выкидывает админа на /login).
      navigate(`/public/doctor-profile/article-detail-for-all/${id}`);
      window.location.reload();
    } catch (error) {
      console.error("❌ Update error:", error);
      alert(t("article_edit.update_error"));
    }
  };

  /* ---------------------- RENDER ---------------------- */
  return (
    <form onSubmit={handleSubmit} className="container mt-4">
      <h2 className="mb-4">{t("article_edit.title")}</h2>

      {/* ---------------------- TITLE ---------------------- */}
      <div className="mb-3">
        <label className="form-label">{t("article_edit.field_title")}</label>
        <input
          type="text"
          name="title"
          value={articleData.title}
          onChange={handleInputChange}
          placeholder={t("article_edit.field_title_placeholder")}
          className="form-control"
        />
      </div>

      {/* ---------------------- IMAGE ---------------------- */}
      <div className="row mb-3">
        <label className="col-md-4 col-lg-3 col-form-label">
          {t("article_edit.field_image")}
        </label>

        <div className="col-md-8 col-lg-9">
          <img
            src={
              articleData.image
                ? URL.createObjectURL(articleData.image)
                : articleData.imageUrl &&
                  !articleData.imageUrl.includes("undefined")
                ? articleData.imageUrl
                : "/images/avatar/1.jpg"
            }
            alt="Article"
            style={{ maxWidth: "150px", borderRadius: "8px" }}
          />

          <div className="pt-2 d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => document.getElementById("articleImage").click()}
            >
              📁 {t("article_edit.choose_photo")}
            </button>

            <span className="text-muted small">
              {articleData.image
                ? articleData.image.name
                : t("article_edit.no_photo")}
            </span>
          </div>

          <input
            type="file"
            id="articleImage"
            accept="image/*"
            onChange={handleFileChange}
            className="form-control"
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* ---------------------- CONTENT ---------------------- */}
      <div className="mb-3">
        <label className="form-label">{t("article_edit.field_content")}</label>

        <CKEditor
          editor={ClassicEditor}
          data={articleData.content}
          config={{
            language: "ru",
            placeholder: t("article_edit.field_content"),
            mediaEmbed: { previewsInData: true },
            toolbar: [
              "heading",
              "|",
              "bold",
              "italic",
              "link",
              "|",
              "bulletedList",
              "numberedList",
              "uploadImage",
              "mediaEmbed",
              "insertTable",
              "|",
              "undo",
              "redo",
            ],
            ckfinder: {
              uploadUrl: `${API_BASE}/uploads`,
              withCredentials: true,
            },
          }}
          onChange={(event, editor) => handleEditorChange(editor.getData())}
        />
      </div>

      {/* ---------------------- CATEGORY ---------------------- */}
      <div className="mb-3">
        <label className="form-label">{t("article_edit.field_category")}</label>

        <select
          name="category"
          value={articleData.category}
          onChange={handleInputChange}
          className="form-control"
        >
          <option value="">{t("article_edit.select_category")}</option>

          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* ---------------------- TAGS ---------------------- */}
      <div className="mb-3">
        <label className="form-label">{t("article_edit.field_tags")}</label>
        <input
          type="text"
          name="tags"
          value={articleData.tags}
          onChange={handleInputChange}
          placeholder={t("article_edit.tags_placeholder")}
          className="form-control"
        />
      </div>

      {/* ---------------------- META DESCRIPTION ---------------------- */}
      <div className="mb-3">
        <label className="form-label">
          {t("article_edit.field_meta_desc")}
        </label>
        <input
          type="text"
          name="metaDescription"
          value={articleData.metaDescription}
          onChange={handleInputChange}
          placeholder={t("article_edit.meta_desc_placeholder")}
          className="form-control"
        />
      </div>

      {/* ---------------------- META KEYWORDS ---------------------- */}
      <div className="mb-3">
        <label className="form-label">
          {t("article_edit.field_meta_keywords")}
        </label>
        <input
          type="text"
          name="metaKeywords"
          value={articleData.metaKeywords}
          onChange={handleInputChange}
          placeholder={t("article_edit.meta_keywords_placeholder")}
          className="form-control"
        />
      </div>

      {/* ---------------------- SUBMIT ---------------------- */}
      <button type="submit" className="btn btn-primary mt-3">
        {t("article_edit.submit")}
      </button>
    </form>
  );
}
