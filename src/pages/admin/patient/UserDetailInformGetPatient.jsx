// client/src/pages/admin/user/userDetailInformGetPatient.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import {
  FaFileAlt,
  FaComment,
  FaHeartbeat,
  FaHospitalUser,
  FaUserMd,
  FaCalendarAlt,
  FaBirthdayCake,
  FaVenusMars,
  FaGlobe,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { MdEmail, MdPhone, MdLocationOn, MdPerson } from "react-icons/md";
const API_BASE = process.env.REACT_APP_API_URL;

/* ============================================================
   ОСНОВНОЙ КОМПОНЕНТ
   ============================================================ */
export default function UserDetailInformGetPatient() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentTab, setCommentTab] = useState("aboutPatient");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/admin/user-patient-detail-get/${userId}`,
          {
            withCredentials: true,
          }
        );
        if (res.data?.success) setData(res.data);
        else
          setError(res.data?.message || "Ошибка при получении данных пациента");
      } catch (err) {
        console.error("Ошибка при загрузке:", err);
        setError("Ошибка сервера при получении данных");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted">Загрузка данных пациента...</p>
      </div>
    );

  if (error)
    return <div className="alert alert-danger text-center mt-5">{error}</div>;

  if (!data?.user)
    return (
      <div className="alert alert-secondary text-center mt-5">
        Данные пациента не найдены.
      </div>
    );

  const {
    user,
    profile,
    stats,
    polyclinicRecords = [],
    medicalHistories = [],
    files = [],
    articles = [],
    comments = {},
  } = data;

  const commentsAboutPatient = comments.aboutPatient || [];
  const commentsByPatient = comments.byPatient || [];

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* ==== ЛЕВАЯ КОЛОНКА ==== */}
        <LeftProfileCard user={user} profile={profile} userId={userId} />

        {/* ==== ПРАВАЯ КОЛОНКА ==== */}
        <div className="col-lg-9">
          <div className="card shadow-sm mb-3">
            <div className="card-header bg-light border-bottom">
              <h5 className="mb-0">Профиль пациента</h5>
            </div>

            <div className="card-body">
              <UserMainInfo user={user} profile={profile} />
              <PatientSections
                polyclinicRecords={polyclinicRecords}
                medicalHistories={medicalHistories}
                files={files}
                articles={articles}
                commentTab={commentTab}
                setCommentTab={setCommentTab}
                commentsAboutPatient={commentsAboutPatient}
                commentsByPatient={commentsByPatient}
              />
              {stats && <StatsSection stats={stats} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ПОДКОМПОНЕНТЫ
   ============================================================ */

/* -------- Левый блок с фото -------- */
function LeftProfileCard({ user, profile, userId }) {
  const phone = user?.phoneNumber || profile?.phoneNumber || "—";
  const address = profile?.address || user?.address || "—";
  const country = profile?.country || user?.country || "—";

  const finalPhoto = useMemo(() => {
    const raw = profile?.photo || user?.photo;
    if (!raw) return "/images/default-avatar.png";

    // Если ссылка уже полная
    if (raw.startsWith("http")) return raw;

    // Если путь начинается с "/uploads"
    if (raw.startsWith("/uploads")) return `${API_BASE}${raw}`;

    // Если просто имя файла — достраиваем путь
    return `${API_BASE}/admin/user-patient-detail-get/uploads/${raw.replace(
      /^\/+/,
      ""
    )}`;
  }, [profile?.photo, user?.photo]);

  return (
    <div className="col-lg-3 mb-3">
      <div className="card text-center p-3 shadow-sm">
        <img
          key={finalPhoto}
          src={finalPhoto}
          alt={`${user?.firstName || "Пациент"} ${user?.lastName || ""}`}
          className="img-fluid rounded-circle mb-3 border"
          style={{ width: "120px", height: "120px", objectFit: "cover" }}
          onError={(e) => {
            if (e.target.src !== "/images/default-avatar.png") {
              e.target.src = "/images/default-avatar.png";
            }
          }}
        />

        <h5 className="fw-bold mb-0">
          {user?.firstName || "—"} {user?.lastName || ""}
        </h5>
        <small className="text-muted">@{user?.username || "—"}</small>

        <hr />
        <div className="text-start small">
          <p>
            <MdEmail className="text-primary me-2" />
            {user?.email || "—"}
          </p>
          <p>
            <MdPhone className="text-success me-2" />
            {phone}
          </p>
          <p>
            <MdLocationOn className="text-danger me-2" />
            {address}
          </p>
          <p>
            <FaGlobe className="text-info me-2" />
            {country}
          </p>
        </div>
        <div className="d-grid gap-2">
          <Link
            to={`/admin/user-detail-update/${userId}`}
            className="btn btn-outline-primary btn-sm"
          >
            Редактировать
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn btn-outline-secondary btn-sm"
          >
            ← Назад
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------- Основные данные -------- */
function UserMainInfo({ user, profile }) {
  const dateOfBirth = user?.dateOfBirth || null;
  const gender = user?.gender || "—";
  const phoneNumber = user?.phoneNumber || profile?.phoneNumber || "—";
  const address = profile?.address || user?.address || "—";
  const country = profile?.country || user?.country || "—";

  const formattedBirthDate = dateOfBirth
    ? new Date(dateOfBirth).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <>
      <Detail
        label="Имя"
        value={`${user?.firstName || ""} ${user?.lastName || ""}`}
        icon={<MdPerson />}
      />
      <Detail label="Email" value={user?.email || "—"} icon={<MdEmail />} />
      <Detail
        label="Дата рождения"
        value={formattedBirthDate}
        icon={<FaBirthdayCake />}
      />
      <Detail label="Пол" value={gender} icon={<FaVenusMars />} />
      <Detail label="Адрес" value={address} icon={<MdLocationOn />} />
      <Detail label="Страна" value={country} icon={<FaGlobe />} />
      <Detail label="Телефон" value={phoneNumber} icon={<MdPhone />} />
      <Detail
        label="Дата регистрации"
        value={
          user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "—"
        }
        icon={<FaCalendarAlt />}
      />
    </>
  );
}

/* -------- Остальные секции -------- */
function PatientSections({
  polyclinicRecords,
  medicalHistories,
  files,
  articles,
  commentTab,
  setCommentTab,
  commentsAboutPatient,
  commentsByPatient,
}) {
  return (
    <>
      <Section title="Посещения поликлиники" icon={<FaHospitalUser />}>
        {polyclinicRecords?.length ? (
          <ul className="list-unstyled ps-2">
            {polyclinicRecords.map((r) => {
              const visitDate = r.createdAt
                ? new Date(r.createdAt).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—";
              return (
                <li key={r._id} className="mb-2">
                  🏥{" "}
                  {r.doctors?.length
                    ? r.doctors
                        .map(
                          (d) =>
                            `${d.fullName} — ${d.specialization || "—"} (${
                              d.clinic || "—"
                            })`
                        )
                        .join(", ")
                    : "—"}
                  <br />
                  <small className="text-muted">
                    <FaCalendarAlt className="me-1" />
                    Дата посещения: {visitDate}
                  </small>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted">Нет записей о посещениях</p>
        )}
      </Section>

      <Section title="Истории болезней" icon={<FaHeartbeat />}>
        {medicalHistories?.length ? (
          <ul className="list-unstyled ps-2">
            {medicalHistories.map((h) => (
              <li key={h._id}>
                🩺 {h.diagnosis || "Без диагноза"} —{" "}
                {new Date(h.createdAt).toLocaleDateString("ru-RU")}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Истории болезни отсутствуют</p>
        )}
      </Section>

      <Section title="Файлы пациента" icon={<FaFileAlt />}>
        {files?.length ? (
          <ul className="list-unstyled ps-2">
            {files.map((f) => (
              <li key={f._id}>
                📎{" "}
                <a href={f.fileUrl} target="_blank" rel="noreferrer">
                  {f.fileName || "Без названия"}
                </a>{" "}
                {f.uploadedByDoctor && (
                  <small className="text-muted">
                    (врач: {f.uploadedByDoctor.firstName || "—"}{" "}
                    {f.uploadedByDoctor.lastName || ""})
                  </small>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Нет загруженных файлов</p>
        )}
      </Section>

      <Section title="Статьи пациента" icon={<FaUserMd />}>
        {articles?.length ? (
          <ul className="list-unstyled ps-2">
            {articles.map((a) => (
              <li key={a._id}>
                📰 <Link to={`/patient/article/${a._id}`}>{a.title}</Link>{" "}
                <small className="text-muted">
                  ({new Date(a.createdAt).toLocaleDateString("ru-RU")})
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Пациент не публиковал статьи</p>
        )}
      </Section>

      <Section title="Комментарии" icon={<FaComment />}>
        <div className="d-flex gap-2 mb-3">
          <button
            className={`btn btn-sm ${
              commentTab === "aboutPatient"
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() => setCommentTab("aboutPatient")}
          >
            💬 О пациенте ({commentsAboutPatient.length})
          </button>
          <button
            className={`btn btn-sm ${
              commentTab === "byPatient" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setCommentTab("byPatient")}
          >
            🖋 От пациента ({commentsByPatient.length})
          </button>
        </div>

        {commentTab === "aboutPatient"
          ? renderComments(commentsAboutPatient, "о пациенте")
          : renderComments(commentsByPatient, "от пациента")}
      </Section>
    </>
  );
}

/* -------- Рендер комментариев -------- */
function renderComments(list, type) {
  if (!list?.length)
    return <p className="text-muted">Комментариев {type} пока нет</p>;

  return (
    <ul className="list-group list-group-flush">
      {list.map((c) => (
        <li key={c._id} className="list-group-item small border-bottom">
          <b>
            {c.authorId?.firstName || "—"} {c.authorId?.lastName || ""}
          </b>
          <div className="text-muted" style={{ fontSize: "0.85em" }}>
            {new Date(c.createdAt).toLocaleString("ru-RU")}
          </div>
          <div>{c.content}</div>
        </li>
      ))}
    </ul>
  );
}

/* -------- Статистика -------- */
function StatsSection({ stats }) {
  return (
    <div className="mt-4">
      <h6 className="fw-bold mb-3">Статистика</h6>
      <div className="row text-center">
        <Stat label="Комментарии написаны" value={stats.totalCommentsWritten} />
        <Stat
          label="Комментарии о пациенте"
          value={stats.totalCommentsReceived}
        />
        <Stat label="Файлы" value={stats.totalFiles} />
        <Stat label="Истории болезней" value={stats.totalMedicalHistories} />
        <Stat label="Посещения" value={stats.totalPolyclinicRecords} />
        <Stat label="Статьи" value={stats.totalArticles} />
      </div>
    </div>
  );
}

/* -------- Универсальные утилиты -------- */
function Detail({ label, value, icon }) {
  return (
    <div className="row mb-2">
      <div className="col-md-4 fw-bold d-flex align-items-center">
        {icon && <span className="me-2">{icon}</span>}
        {label}
      </div>
      <div className="col-md-8">
        {value || <span className="text-muted">—</span>}
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="mt-4">
      <h6 className="fw-bold mb-3 d-flex align-items-center">
        {icon && <span className="me-2">{icon}</span>}
        {title}
      </h6>
      <div className="ps-3">{children}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="col-md-4 mb-3">
      <div className="border rounded p-2 bg-light">
        <h4 className="fw-bold mb-0 text-primary">{value ?? 0}</h4>
        <small className="text-muted">{label}</small>
      </div>
    </div>
  );
}
