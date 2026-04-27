// client/src/components/admin/UserDoctorEditDetailAdmintPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MdEmail,
  MdPerson,
  MdWork,
  MdLocationOn,
  MdAccountCircle,
  MdSave,
  MdArrowBack,
} from "react-icons/md";
import { FaBuilding, FaGlobe, FaUserMd, FaCheckCircle } from "react-icons/fa";
const API_BASE = process.env.REACT_APP_API_URL;
const API_BASE_UPDATE = `${API_BASE}/admin/doctor-detail-edit`;

export default function UserDoctorEditDetailAdmintPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  /* ===== Загрузка данных пользователя ===== */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/admin/user-detail-get/${userId}`,
          {
            withCredentials: true,
          }
        );
        if (res.data?.success && res.data.user) {
          setUser(res.data.user);
        } else {
          setError("Не удалось получить данные пользователя");
        }
      } catch (err) {
        console.error("Ошибка при загрузке данных:", err);
        setError("Ошибка при загрузке данных");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  /* ===== Обновление полей ===== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value },
    }));
  };

  /* ===== Сохранение ===== */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      // ⚙️ Исключаем username, чтобы избежать 409
      const { username, ...cleanUser } = user;

      // 🧹 Удаляем пустые поля соцсетей
      const cleanSocial = {};
      if (cleanUser.socialLinks) {
        for (const [key, val] of Object.entries(cleanUser.socialLinks)) {
          if (val && val.trim() !== "") cleanSocial[key] = val.trim();
        }
        cleanUser.socialLinks = Object.keys(cleanSocial).length
          ? cleanSocial
          : undefined;
      }

      const res = await axios.patch(
        `${API_BASE_UPDATE}/${userId}`,
        { user: cleanUser },
        { withCredentials: true }
      );

      if (res.data?.ok) {
        setSuccess("✅ Профиль успешно обновлён");
        setUser(res.data.user);
      } else {
        setError(res.data?.message || "Ошибка при обновлении профиля");
      }
    } catch (err) {
      console.error("Ошибка при сохранении данных:", err);
      if (err.response?.status === 409) {
        setError("❌ Имя пользователя уже существует. Выберите другое.");
      } else {
        setError("Ошибка при сохранении данных");
      }
    } finally {
      setSaving(false);

      // Автоочистка уведомлений
      setTimeout(() => {
        setSuccess("");
        setError("");
      }, 4000);
    }
  };

  /* ===== UI состояния ===== */
  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted mt-2">Загрузка данных...</p>
      </div>
    );

  if (error && !user)
    return <div className="alert alert-danger text-center mt-5">{error}</div>;

  if (!user)
    return (
      <div className="alert alert-secondary text-center mt-5">
        Данные пользователя не найдены
      </div>
    );

  /* ===== Отображение ===== */
  return (
    <div className="container py-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaUserMd className="me-2" />
            Редактирование профиля врача
          </h5>
          <Link
            to={`/admin/user-detail-get/${userId}`}
            className="btn btn-light btn-sm"
          >
            <MdArrowBack className="me-1" /> Назад
          </Link>
        </div>

        <div className="card-body">
          <form onSubmit={handleSave}>
            <div className="row">
              {/* ===== Левая колонка ===== */}
              <div className="col-md-4 text-center">
                <img
                  src={user.avatar || "/images/default-doctor.png"}
                  alt="avatar"
                  className="rounded-circle border mb-3"
                  style={{
                    width: "130px",
                    height: "130px",
                    objectFit: "cover",
                  }}
                />
                <h6>
                  {user.firstName} {user.lastName}
                </h6>
                <p className="text-muted">@{user.username}</p>
                <span
                  className={`badge ${
                    user.isVerified ? "bg-success" : "bg-secondary"
                  }`}
                >
                  <FaCheckCircle className="me-1" />
                  {user.isVerified ? "Верифицирован" : "Не верифицирован"}
                </span>
              </div>

              {/* ===== Правая колонка ===== */}
              <div className="col-md-8">
                <div className="row g-3">
                  <Input
                    label="Имя"
                    name="firstName"
                    value={user.firstName || ""}
                    onChange={handleChange}
                    icon={<MdPerson />}
                  />
                  <Input
                    label="Фамилия"
                    name="lastName"
                    value={user.lastName || ""}
                    onChange={handleChange}
                    icon={<MdAccountCircle />}
                  />
                  <Input
                    label="Email"
                    name="email"
                    value={user.email || ""}
                    onChange={handleChange}
                    icon={<MdEmail />}
                  />
                  <Input
                    label="Страна"
                    name="country"
                    value={user.country || ""}
                    onChange={handleChange}
                    icon={<FaGlobe />}
                  />
                  <Input
                    label="Адрес"
                    name="address"
                    value={user.address || ""}
                    onChange={handleChange}
                    icon={<MdLocationOn />}
                  />
                  <Input
                    label="Компания / Клиника"
                    name="company"
                    value={user.company || ""}
                    onChange={handleChange}
                    icon={<FaBuilding />}
                  />
                  <Input
                    label="Должность / Специализация"
                    name="job"
                    value={user.job || ""}
                    onChange={handleChange}
                    icon={<MdWork />}
                  />

                  <Textarea
                    label="О себе"
                    name="about"
                    value={user.about || ""}
                    onChange={handleChange}
                  />
                  <Textarea
                    label="Биография"
                    name="bio"
                    value={user.bio || ""}
                    onChange={handleChange}
                  />

                  {/* ==== Соцсети ==== */}
                  <h6 className="fw-bold mt-3">Социальные сети</h6>
                  <div className="row g-2">
                    <Input
                      label="Twitter"
                      name="twitter"
                      value={user.socialLinks?.twitter || ""}
                      onChange={handleSocialChange}
                      placeholder="https://twitter.com/doctor_handle"
                    />
                    <Input
                      label="Instagram"
                      name="instagram"
                      value={user.socialLinks?.instagram || ""}
                      onChange={handleSocialChange}
                      placeholder="https://instagram.com/doctor_profile"
                    />
                    <Input
                      label="Facebook"
                      name="facebook"
                      value={user.socialLinks?.facebook || ""}
                      onChange={handleSocialChange}
                      placeholder="https://facebook.com/doctor.name"
                    />
                    <Input
                      label="LinkedIn"
                      name="linkedin"
                      value={user.socialLinks?.linkedin || ""}
                      onChange={handleSocialChange}
                      placeholder="https://linkedin.com/in/doctor-name"
                    />
                  </div>

                  {/* ==== Язык ==== */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Язык интерфейса
                    </label>
                    <select
                      className="form-select"
                      name="preferredLanguage"
                      value={user.preferredLanguage || "en"}
                      onChange={handleChange}
                    >
                      <option value="en">English</option>
                      <option value="ru">Русский</option>
                      <option value="az">Azərbaycan</option>
                      <option value="tr">Türkçe</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-4" />

            {/* ===== Кнопки ===== */}
            <div className="d-flex justify-content-end gap-2">
              <button
                type="submit"
                className="btn btn-success"
                disabled={saving}
              >
                <MdSave className="me-1" />
                {saving ? "Сохранение..." : "Сохранить изменения"}
              </button>
              <Link to="/admin/doctors-list" className="btn btn-secondary">
                Отмена
              </Link>
            </div>

            {/* ===== Уведомления ===== */}
            {success && (
              <div className="alert alert-success mt-3 text-center">
                {success}
              </div>
            )}
            {error && (
              <div className="alert alert-danger mt-3 text-center">{error}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

/* ==================== Подкомпоненты ==================== */
function Input({ label, name, value, onChange, icon, placeholder }) {
  return (
    <div className="col-md-6">
      <label className="form-label fw-bold">{label}</label>
      <div className="input-group">
        {icon && <span className="input-group-text bg-light">{icon}</span>}
        <input
          type="text"
          name={name}
          className="form-control"
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

function Textarea({ label, name, value, onChange }) {
  return (
    <div className="col-md-12">
      <label className="form-label fw-bold">{label}</label>
      <textarea
        name={name}
        className="form-control"
        rows="3"
        value={value}
        onChange={onChange}
      ></textarea>
    </div>
  );
}
