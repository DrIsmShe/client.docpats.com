import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaGlobe,
  FaHome,
  FaBuilding,
  FaBriefcase,
  FaLanguage,
  FaCalendarAlt,
  FaSave,
} from "react-icons/fa";

const API_BASE = process.env.REACT_APP_API_URL;

/* ======= Список стран ======= */
const COUNTRY_DIALS = [
  { code: "AF", name: "Afghanistan", dial: "+93" },
  { code: "AL", name: "Albania", dial: "+355" },
  { code: "DZ", name: "Algeria", dial: "+213" },
  { code: "AD", name: "Andorra", dial: "+376" },
  { code: "AO", name: "Angola", dial: "+244" },
  { code: "AR", name: "Argentina", dial: "+54" },
  { code: "AM", name: "Armenia", dial: "+374" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "AT", name: "Austria", dial: "+43" },
  { code: "AZ", name: "Azerbaijan", dial: "+994" },
  { code: "BE", name: "Belgium", dial: "+32" },
  { code: "BR", name: "Brazil", dial: "+55" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "CN", name: "China", dial: "+86" },
  { code: "CY", name: "Cyprus", dial: "+357" },
  { code: "DK", name: "Denmark", dial: "+45" },
  { code: "EE", name: "Estonia", dial: "+372" },
  { code: "FI", name: "Finland", dial: "+358" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "GE", name: "Georgia", dial: "+995" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "GR", name: "Greece", dial: "+30" },
  { code: "HU", name: "Hungary", dial: "+36" },
  { code: "IN", name: "India", dial: "+91" },
  { code: "IR", name: "Iran", dial: "+98" },
  { code: "IQ", name: "Iraq", dial: "+964" },
  { code: "IE", name: "Ireland", dial: "+353" },
  { code: "IL", name: "Israel", dial: "+972" },
  { code: "IT", name: "Italy", dial: "+39" },
  { code: "JP", name: "Japan", dial: "+81" },
  { code: "KZ", name: "Kazakhstan", dial: "+7" },
  { code: "KR", name: "Korea, Republic of", dial: "+82" },
  { code: "KW", name: "Kuwait", dial: "+965" },
  { code: "KG", name: "Kyrgyzstan", dial: "+996" },
  { code: "LV", name: "Latvia", dial: "+371" },
  { code: "LB", name: "Lebanon", dial: "+961" },
  { code: "LT", name: "Lithuania", dial: "+370" },
  { code: "LU", name: "Luxembourg", dial: "+352" },
  { code: "MY", name: "Malaysia", dial: "+60" },
  { code: "MT", name: "Malta", dial: "+356" },
  { code: "MX", name: "Mexico", dial: "+52" },
  { code: "MD", name: "Moldova", dial: "+373" },
  { code: "MC", name: "Monaco", dial: "+377" },
  { code: "ME", name: "Montenegro", dial: "+382" },
  { code: "MA", name: "Morocco", dial: "+212" },
  { code: "NL", name: "Netherlands", dial: "+31" },
  { code: "NZ", name: "New Zealand", dial: "+64" },
  { code: "NO", name: "Norway", dial: "+47" },
  { code: "PK", name: "Pakistan", dial: "+92" },
  { code: "PL", name: "Poland", dial: "+48" },
  { code: "PT", name: "Portugal", dial: "+351" },
  { code: "RO", name: "Romania", dial: "+40" },
  { code: "RU", name: "Russia", dial: "+7" },
  { code: "SA", name: "Saudi Arabia", dial: "+966" },
  { code: "SG", name: "Singapore", dial: "+65" },
  { code: "SK", name: "Slovakia", dial: "+421" },
  { code: "SI", name: "Slovenia", dial: "+386" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "ES", name: "Spain", dial: "+34" },
  { code: "LK", name: "Sri Lanka", dial: "+94" },
  { code: "SE", name: "Sweden", dial: "+46" },
  { code: "CH", name: "Switzerland", dial: "+41" },
  { code: "SY", name: "Syrian Arab Republic", dial: "+963" },
  { code: "TR", name: "Türkiye", dial: "+90" },
  { code: "UA", name: "Ukraine", dial: "+380" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "UZ", name: "Uzbekistan", dial: "+998" },
  { code: "VN", name: "Viet Nam", dial: "+84" },
];

const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && !(typeof v === "string" && v.trim() === "")
    )
  );

const UserDetail = () => {
  const { userId } = useParams();
  const [userForm, setUserForm] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    company: "",
    job: "",
    about: "",
    bio: "",
    country: "",
    address: "",
    preferredLanguage: "en",
    role: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleUserChange = (e) => {
    const { id, value } = e.target;
    setUserForm((s) => ({ ...s, [id]: value }));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${API_BASE}/admin/users/user-detail/${userId}`,
          { withCredentials: true }
        );
        if (cancelled) return;
        const u = data?.user || {};
        setUserForm({
          email: u.email ?? "",
          username: u.username ?? "",
          firstName: u.firstName ?? "",
          lastName: u.lastName ?? "",
          dateOfBirth: u.dateOfBirth ? String(u.dateOfBirth).slice(0, 10) : "",
          company: u.company ?? "",
          job: u.job ?? "",
          about: u.about ?? "",
          bio: u.bio ?? "",
          country: u.country ?? "",
          address: u.address ?? "",
          preferredLanguage: u.preferredLanguage ?? "en",
          role: u.role ?? "patient",
        });
      } catch (e) {
        console.error("Load user detail failed:", e?.response?.data || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userPayload = clean({
        username: userForm.username,
        country: userForm.country,
        address: userForm.address,
        company: userForm.company,
        job: userForm.job,
        about: userForm.about,
        bio: userForm.bio,
        preferredLanguage: userForm.preferredLanguage,
        dateOfBirth: userForm.dateOfBirth || undefined,
        email: userForm.email,
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        role: userForm.role, // ← добавь эту строку
      });

      if (Object.keys(userPayload).length === 0) {
        alert("Нет данных для обновления");
        setSaving(false);
        return;
      }

      const resp = await axios.patch(
        `${API_BASE}/admin/user/edit-profile/profile/${userId}`,
        { user: userPayload },
        { withCredentials: true }
      );

      alert(resp?.data?.message || "Сохранено");
    } catch (error) {
      const msg =
        error?.response?.status === 409
          ? "Конфликт уникальности (username/email уже заняты)"
          : error?.response?.data?.message || "Ошибка сохранения";
      console.error("Update error:", error?.response?.data || error);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-primary">
          <FaUser className="me-2" /> User Profile
        </h4>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="btn btn-outline-secondary btn-sm"
        >
          ← Back
        </button>
      </div>

      <div className="card shadow border-0 rounded-3">
        <div
          className="card-header bg-gradient text-white"
          style={{
            background: "linear-gradient(135deg, #007bff 0%, #00bcd4 100%)",
          }}
        >
          <h5 className="mb-0">Edit Profile</h5>
        </div>

        <div className="card-body p-4">
          {loading ? (
            <div className="text-muted text-center py-5">Загрузка…</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                {/* Email */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <FaEnvelope className="me-2 text-primary" /> Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="form-control shadow-sm"
                    value={userForm.email}
                    onChange={handleUserChange}
                  />
                </div>

                {/* Username */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <FaUser className="me-2 text-success" /> Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    className="form-control shadow-sm"
                    value={userForm.username}
                    onChange={handleUserChange}
                  />
                </div>

                {/* Имя / Фамилия / Дата */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    <FaUser className="me-2 text-warning" /> First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="form-control shadow-sm"
                    value={userForm.firstName}
                    onChange={handleUserChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    <FaUser className="me-2 text-warning" /> Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="form-control shadow-sm"
                    value={userForm.lastName}
                    onChange={handleUserChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    <FaCalendarAlt className="me-2 text-danger" /> Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    className="form-control shadow-sm"
                    value={userForm.dateOfBirth}
                    onChange={handleUserChange}
                  />
                </div>

                {/* Страна / Адрес */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <FaGlobe className="me-2 text-info" /> Country
                  </label>
                  <select
                    id="country"
                    className="form-select shadow-sm"
                    value={userForm.country}
                    onChange={handleUserChange}
                  >
                    <option value="">Select country...</option>
                    {COUNTRY_DIALS.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <FaHome className="me-2 text-secondary" /> Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    className="form-control shadow-sm"
                    value={userForm.address}
                    onChange={handleUserChange}
                  />
                </div>

                {/* Компания / Работа */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <FaBuilding className="me-2 text-primary" /> Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    className="form-control shadow-sm"
                    value={userForm.company}
                    onChange={handleUserChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <FaBriefcase className="me-2 text-success" /> Job
                  </label>
                  <input
                    type="text"
                    id="job"
                    className="form-control shadow-sm"
                    value={userForm.job}
                    onChange={handleUserChange}
                  />
                </div>

                {/* About */}
                <div className="col-md-12">
                  <label className="form-label fw-semibold">
                    <FaUser className="me-2 text-danger" /> About (max 1200)
                  </label>
                  <textarea
                    id="about"
                    className="form-control shadow-sm"
                    rows={3}
                    value={userForm.about}
                    onChange={handleUserChange}
                  />
                </div>

                {/* Язык / Роль */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <FaLanguage className="me-2 text-primary" /> Language
                  </label>
                  <select
                    id="preferredLanguage"
                    className="form-select shadow-sm"
                    value={userForm.preferredLanguage}
                    onChange={handleUserChange}
                  >
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                    <option value="az">Azərbaycanca</option>
                    <option value="tr">Türkçe</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <FaUser className="me-2 text-dark" /> Role
                  </label>
                  <select
                    id="role"
                    className="form-select shadow-sm"
                    value={userForm.role}
                    onChange={handleUserChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>
              </div>

              <div className="text-end mt-4">
                <button
                  type="submit"
                  className="btn btn-lg text-white fw-semibold shadow"
                  style={{
                    background:
                      "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
                  }}
                  disabled={saving}
                >
                  <FaSave className="me-2" />
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
