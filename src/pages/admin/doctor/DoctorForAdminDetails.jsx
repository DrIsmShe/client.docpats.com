import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  FaUserMd,
  FaCheckCircle,
  FaTimesCircle,
  FaBook,
  FaVideo,
  FaStar,
} from "react-icons/fa";
import { MdEmail, MdPhone, MdLocationOn, MdWork } from "react-icons/md";
const API_BASE = process.env.REACT_APP_API_URL;

export default function DoctorForAdminDetails() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await axios.get(`${API_BASE}/admin/doctor-detail/${id}`, {
          withCredentials: true,
        });
        if (res.data?.success) setDoctor(res.data.data);
        else setError(res.data?.message || "Failed to load doctor data");
      } catch (err) {
        console.error("Error fetching doctor:", err);
        setError("Server error while fetching doctor details");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading)
    return (
      <div className="text-center mt-5 text-muted">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Загрузка профиля врача...</p>
      </div>
    );

  if (error)
    return <div className="alert alert-danger text-center mt-5">{error}</div>;

  if (!doctor)
    return (
      <div className="alert alert-secondary text-center mt-5">
        Данные о враче не найдены.
      </div>
    );

  const p = doctor.profile || {};

  return (
    <div className="container-fluid py-4 doctor-profile-page">
      <div className="row">
        {/* === Левая колонка === */}
        <div className="col-md-3">
          <div className="card card-primary card-outline">
            <div className="card-body box-profile text-center">
              <img
                className="profile-user-img img-fluid img-circle"
                src={doctor.avatar || "/images/default-doctor.png"}
                alt="Doctor profile"
              />
              <h3 className="profile-username mt-2">
                {doctor.firstName} {doctor.lastName}
              </h3>
              <p className="text-muted mb-1">
                {doctor.specialization || "Врач"}
              </p>
              <p className="text-muted small">@{doctor.username}</p>

              {doctor.isVerified ? (
                <span className="badge bg-success mb-3">
                  <FaCheckCircle className="me-1" /> Верифицирован
                </span>
              ) : (
                <span className="badge bg-secondary mb-3">
                  <FaTimesCircle className="me-1" /> Не верифицирован
                </span>
              )}

              <ul className="list-group list-group-unbordered mb-3 text-start">
                <li className="list-group-item">
                  <b>Email</b>
                  <span className="float-end">
                    <MdEmail className="me-1 text-primary" />
                    {doctor.email || "—"}
                  </span>
                </li>
                <li className="list-group-item">
                  <b>Телефон</b>
                  <span className="float-end">
                    <MdPhone className="me-1 text-success" />
                    {p.phoneNumber || "—"}
                  </span>
                </li>
                <li className="list-group-item">
                  <b>Клиника</b>
                  <span className="float-end">
                    <MdWork className="me-1 text-warning" />
                    {p.clinic || "—"}
                  </span>
                </li>
                <li className="list-group-item">
                  <b>Страна</b>
                  <span className="float-end">
                    <MdLocationOn className="me-1 text-danger" />
                    {p.country || doctor.country || "—"}
                  </span>
                </li>
              </ul>

              <Link to="/admin/doctors-list" className="btn btn-primary w-100">
                Назад к списку
              </Link>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">О враче</h5>
            </div>
            <div className="card-body">
              {doctor.bio ? (
                <p>{doctor.bio}</p>
              ) : (
                <p className="text-muted">Биография не указана</p>
              )}
            </div>
          </div>
        </div>

        {/* === Правая колонка === */}
        <div className="col-md-9">
          <div className="card">
            <div className="card-header border-bottom-0 bg-light">
              <ul className="nav nav-pills" id="profile-tabs">
                <li className="nav-item">
                  <a
                    className="nav-link active"
                    data-bs-toggle="tab"
                    href="#education"
                  >
                    Образование
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" data-bs-toggle="tab" href="#activity">
                    Активность
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" data-bs-toggle="tab" href="#stats">
                    Статистика
                  </a>
                </li>
              </ul>
            </div>

            <div className="card-body tab-content">
              {/* === Вкладка 1: Образование === */}
              <div className="tab-pane fade show active" id="education">
                {p.education?.institution ? (
                  <div>
                    <h5 className="fw-bold mb-2">{p.education.institution}</h5>
                    <p className="text-muted">
                      {p.education.startYear || "—"} –{" "}
                      {p.education.endYear || "—"}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted">Нет данных об образовании</p>
                )}
              </div>

              {/* === Вкладка 2: Активность === */}
              <div className="tab-pane fade" id="activity">
                <p>
                  Зарегистрирован:{" "}
                  <b>
                    {doctor.registeredAt
                      ? new Date(doctor.registeredAt).toLocaleDateString()
                      : "—"}
                  </b>
                </p>
                <p>
                  Последняя активность:{" "}
                  <b>
                    {doctor.lastActive
                      ? new Date(doctor.lastActive).toLocaleString()
                      : "—"}
                  </b>
                </p>
              </div>

              {/* === Вкладка 3: Статистика === */}
              <div className="tab-pane fade" id="stats">
                <div className="row text-center">
                  <StatCard
                    icon={<FaBook />}
                    color="primary"
                    label="Книги"
                    value={p.books?.length || 0}
                  />
                  <StatCard
                    icon={<FaVideo />}
                    color="info"
                    label="Видео"
                    value={p.videos?.length || 0}
                  />
                  <StatCard
                    icon={<FaStar />}
                    color="success"
                    label="Рекомендации"
                    value={p.recommendCount || 0}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* === Подкомпонент карточки статистики === */
function StatCard({ icon, label, value, color }) {
  return (
    <div className="col-md-4 col-12 mb-3">
      <div className={`card text-center border-${color}`}>
        <div className={`card-body text-${color}`}>
          <div className="display-6 mb-2">{icon}</div>
          <h6 className="fw-bold">{label}</h6>
          <p className="mb-0 fs-5">{value}</p>
        </div>
      </div>
    </div>
  );
}
