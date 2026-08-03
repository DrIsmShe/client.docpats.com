import axios from "axios";
import { track } from "../../../lib/analytics";
import { DOCTOR_ARTICLE_CREATED } from "../../../lib/events";
import { useNavigate } from "react-router-dom";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

import React, { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { useTranslation } from "react-i18next";

export default function CreateArticleScientificDoctor() {
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [abstract, setAbstract] = useState("");
  const [tags, setTags] = useState("");
  const [metadesc, setMetaDesc] = useState("");
  const [metakeywords, setMetaKeywords] = useState("");
  const [references, setReferences] = useState("");
  const [authors, setAuthors] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  /* ---------------------- EDITOR ---------------------- */
  const handleEditorChange = useCallback(
    debounce((data) => {
      setContent(data);
    }, 300),
    [],
  );

  /* ---------------------- CHECK LOGIN ---------------------- */
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });

        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setUserId(response.data.user.userId);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };

    checkAuthentication();
  }, []);

  /* ---------------------- LOAD CATEGORIES ---------------------- */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/admin/my-articles-categories`,
          {
            withCredentials: true,
          },
        );
        setCategories(response.data);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length === 0) {
      setMessage(t("article_form.no_categories"));
    } else setMessage("");
  }, [categories, t]);

  /* ---------------------- SUBMIT ---------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert(t("article_form.alert_login"));
      navigate("/login");
      return;
    }

    if (!selectedCategory) {
      alert(t("article_form.alert_select_category"));
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("abstract", abstract);
    formData.append("authors", authors);
    formData.append("references", references);
    formData.append("userId", userId);
    formData.append("category", selectedCategory);
    formData.append("isPublished", isPublished);

    formData.append(
      "tags",
      JSON.stringify(
        tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    );
    formData.append(
      "metadesc",
      JSON.stringify(
        metadesc
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
      ),
    );
    formData.append(
      "metakeywords",
      JSON.stringify(
        metakeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      ),
    );

    if (selectedImage instanceof File) formData.append("image", selectedImage);

    try {
      await axios.post(
        `${API_BASE}/doctor-profile/create-my-article-scientific`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      // Вид статьи и был ли снимок. Заголовок и текст — авторский контент,
      // в счётчик он не идёт.
      track(DOCTOR_ARTICLE_CREATED, {
        kind: "scientific",
        withImage: selectedImage instanceof File,
      });

      navigate("/doctor/my-articles-scientific");
    } catch (error) {
      alert(error?.response?.data?.message || t("article_form.error"));
    }
  };

  return (
    <div>
      <section className="section">
        <div className="row">
          <div className="col-lg-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{t("article_form.create_title")}</h5>

                <form onSubmit={handleSubmit}>
                  {/* TITLE */}
                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label">
                      {t("article_form.title")}
                    </label>
                    <div className="col-sm-10">
                      <input
                        type="text"
                        className="form-control"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* AUTHORS */}
                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label">
                      {t("article_form.authors")}
                    </label>
                    <div className="col-sm-10">
                      <input
                        type="text"
                        className="form-control"
                        value={authors}
                        onChange={(e) => setAuthors(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* ABSTRACT */}
                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label">
                      {t("article_form.abstract")}
                    </label>
                    <div className="col-sm-10">
                      <input
                        type="text"
                        className="form-control"
                        value={abstract}
                        onChange={(e) => setAbstract(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* IMAGE */}
                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label">
                      {t("article_form.image")}
                    </label>
                    <div className="col-sm-10">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          document.getElementById("inputImage").click()
                        }
                      >
                        {t("article_form.choose_file")}
                      </button>

                      <input
                        type="file"
                        id="inputImage"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          setSelectedImage(e.target.files[0] || null);
                        }}
                      />

                      <small className="form-text">
                        {selectedImage
                          ? selectedImage.name
                          : t("article_form.no_file")}
                      </small>
                    </div>
                  </div>

                  {/* CATEGORY */}
                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label">
                      {t("article_form.category")}
                    </label>

                    <div className="col-sm-10">
                      <select
                        className="form-control"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        required
                      >
                        <option value="">
                          {t("article_form.select_category")}
                        </option>

                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>

                      {message && (
                        <small className="text-danger">{message}</small>
                      )}
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label">
                      {t("article_form.content")}
                    </label>
                    <div className="col-sm-10">
                      <CKEditor
                        editor={ClassicEditor}
                        data={content}
                        config={{
                          language: "ru",
                          placeholder: t("article_form.editor_placeholder"),
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
                        onChange={(event, editor) => {
                          setContent(editor.getData());
                        }}
                      />
                    </div>
                  </div>

                  {/* REFERENCES */}
                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label">
                      {t("article_form.references")}
                    </label>
                    <div className="col-sm-10">
                      <input
                        type="text"
                        className="form-control"
                        value={references}
                        onChange={(e) => setReferences(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* TAGS */}
                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label">
                      {t("article_form.tags")}
                    </label>
                    <div className="col-sm-10">
                      <input
                        type="text"
                        className="form-control"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        required
                      />
                      <small>{t("article_form.tags_hint")}</small>
                    </div>
                  </div>

                  {/* META DESC */}
                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label">
                      {t("article_form.meta_desc")}
                    </label>
                    <div className="col-sm-10">
                      <input
                        type="text"
                        className="form-control"
                        value={metadesc}
                        onChange={(e) => setMetaDesc(e.target.value)}
                        required
                      />
                      <small>{t("article_form.tags_hint")}</small>
                    </div>
                  </div>

                  {/* META KEYWORDS */}
                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label">
                      {t("article_form.meta_keywords")}
                    </label>
                    <div className="col-sm-10">
                      <input
                        type="text"
                        className="form-control"
                        value={metakeywords}
                        onChange={(e) => setMetaKeywords(e.target.value)}
                        required
                      />
                      <small>{t("article_form.tags_hint")}</small>
                    </div>
                  </div>

                  {/* PUBLISH */}
                  <div className="row mb-3">
                    <legend className="col-form-label col-sm-2 pt-0">
                      {t("article_form.publish")}
                    </legend>
                    <div className="col-sm-10">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={isPublished}
                          onChange={() => setIsPublished(!isPublished)}
                        />
                        <label className="form-check-label">
                          {t("article_form.publish_yes")}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT */}
                  <div className="row mb-3">
                    <div className="col-sm-10 offset-sm-2">
                      <button type="submit" className="btn btn-primary">
                        {t("article_form.send")}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
