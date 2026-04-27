// src/pages/admin/categories/CreateCategoryPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreateCategoryPage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [icon, setIcon] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]); // 🔹 список всех категорий
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  // ==============================
  // 🔹 Загрузка всех категорий
  // ==============================
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/admin/my-articles-categories`, {
        withCredentials: true,
      });
      setCategories(res.data || []);
    } catch (error) {
      console.error("Ошибка при загрузке категорий:", error);
      setMessage("Не удалось загрузить категории");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ==============================
  // 🔹 Создание новой категории
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE}/admin/my-articles-categories`,
        {
          name,
          description,
          slug,
          parentCategory,
          icon,
          metaDescription,
          metaKeywords,
        },
        { withCredentials: true }
      );

      setMessage(response.data.message);
      setName("");
      setDescription("");
      setSlug("");
      setParentCategory("");
      setIcon("");
      setMetaDescription("");
      setMetaKeywords("");

      // Перезагружаем список категорий после добавления
      fetchCategories();
    } catch (error) {
      console.error("Ошибка при создании категории:", error);
      setMessage("Ошибка создания категории: " + error.message);
    }
  };

  return (
    <section className="section">
      <div className="row">
        <div className="col-lg-12">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h2 className="mb-4 fw-bold">Создать категорию</h2>

              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <label className="fw-semibold">Название категории:</label>
                  <input
                    className="form-control"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="row mb-3">
                  <label className="fw-semibold">Описание категории:</label>
                  <textarea
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="row mb-3">
                  <label className="fw-semibold">Slug (если нужно):</label>
                  <input
                    className="form-control"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="оставьте пустым для автогенерации"
                  />
                </div>

                <div className="row mb-3">
                  <label className="fw-semibold">
                    Родительская категория (если есть):
                  </label>
                  <select
                    className="form-control"
                    value={parentCategory}
                    onChange={(e) => setParentCategory(e.target.value)}
                  >
                    <option value="">Без родителя</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row mb-3">
                  <label className="fw-semibold">Иконка (опционально):</label>
                  <input
                    className="form-control"
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="например: fa-user-md"
                  />
                </div>

                <div className="row mb-3">
                  <label className="fw-semibold">Meta description:</label>
                  <input
                    className="form-control"
                    type="text"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="row mb-3">
                  <label className="fw-semibold">Meta keywords:</label>
                  <input
                    className="form-control"
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Создать категорию
                </button>
              </form>

              {message && <p className="mt-3 text-info">{message}</p>}

              {/* ===================== */}
              {/* 🔹 Таблица категорий */}
              {/* ===================== */}
              <hr className="my-4" />
              <h4 className="fw-bold mb-3">Список всех категорий</h4>

              {loading ? (
                <p>Загрузка...</p>
              ) : categories.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Название</th>
                        <th>Slug</th>
                        <th>Родитель</th>
                        <th>Описание</th>
                        <th>Meta Description</th>
                        <th>Meta Keywords</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat, idx) => (
                        <tr key={cat._id}>
                          <td>{idx + 1}</td>
                          <td>{cat.name}</td>
                          <td>{cat.slug}</td>
                          <td>{cat.parentCategory?.name || "—"}</td>
                          <td>{cat.description?.slice(0, 80) || "—"}</td>
                          <td>{cat.metaDescription || "—"}</td>
                          <td>{cat.metaKeywords || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Категорий пока нет.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateCategoryPage;
