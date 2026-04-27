import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
  FaFileAlt,
  FaComment,
  FaHeartbeat,
  FaBookMedical,
  FaHospitalUser,
  FaStethoscope,
  FaUniversity,
  FaBuilding,
  FaUserMd,
  FaLock,
  FaCalendarAlt,
  FaUserFriends,
  FaBirthdayCake,
  FaVenusMars,
  FaGlobe,
} from "react-icons/fa";
import {
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdWork,
  MdPerson,
} from "react-icons/md";

const API_BASE = process.env.REACT_APP_API_URL;
/* ============================================================
   ОСНОВНОЙ КОМПОНЕНТ
   ============================================================ */
export default function UserDetailInformGetDoktor() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentTab, setCommentTab] = useState("aboutDoctor");
  const [verificationDocs, setVerificationDocs] = useState([]);
  const [verificationProfile, setVerificationProfile] = useState(null);
  const [reviewComment, setReviewComment] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const handleVerification = async (docId, status) => {
    try {
      setProcessingId(docId);

      const res = await axios.patch(
        `${API_BASE}/admin/verification/document/${docId}`,
        {
          status,
          reviewComment: reviewComment[docId] || "",
        },
        { withCredentials: true },
      );

      if (res.data.success) {
        setVerificationDocs((prev) =>
          prev.map((doc) =>
            doc._id === docId
              ? { ...doc, status, reviewComment: reviewComment[docId] || "" }
              : doc,
          ),
        );
      }
    } catch (err) {
      console.error("Verification error:", err);
      alert("Ошибка при проверке документа");
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/admin/user-detail-get/${userId}`,
          {
            withCredentials: true,
          },
        );
        if (res.data?.success) {
          const d = res.data;
          if (Array.isArray(d.comments)) {
            d.comments = d.comments.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            );
          }
          setData(d);
          const r = d.user?.role || (d.user?.isDoctor ? "doctor" : "patient");
          setRole(r);
        } else {
          setError(res.data?.message || "Ошибка при получении данных");
        }
      } catch (err) {
        console.error("Ошибка при загрузке:", err);
        setError("Ошибка сервера при получении данных");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
    const fetchVerificationDocs = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/admin/verification/doctor/${userId}`,
          { withCredentials: true },
        );

        if (res.data?.success) {
          setVerificationDocs(res.data.documents || []);
          setVerificationProfile(res.data.doctorProfile || null);
        }
      } catch (err) {
        console.error("Ошибка загрузки документов верификации:", err);
      }
    };

    fetchVerificationDocs();
  }, [userId]);

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted">Загрузка профиля...</p>
      </div>
    );

  if (error)
    return <div className="alert alert-danger text-center mt-5">{error}</div>;

  if (!data?.user)
    return (
      <div className="alert alert-secondary text-center mt-5">
        Данные не найдены.
      </div>
    );

  const { user, stats, doctorProfile } = data || {};
  const commentsAboutDoctor = data?.commentsAboutDoctor || [];
  const commentsFromDoctor = data?.commentsFromDoctor || [];

  /* ============================================================
     РЕНДЕРИНГ
     ============================================================ */
  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* ==== ЛЕВАЯ КОЛОНКА ==== */}
        <LeftProfileCard
          user={user}
          doctorProfile={doctorProfile}
          userId={userId}
          verificationProfile={verificationProfile}
        />

        {/* ==== ПРАВАЯ КОЛОНКА ==== */}
        <div className="col-lg-9">
          <div className="card shadow-sm mb-3">
            <div className="card-header bg-light border-bottom">
              <h5 className="mb-0">
                {role === "doctor" ? "Профиль Врача" : "Профиль Пациента"}
              </h5>
            </div>

            <div className="card-body">
              <UserMainInfo user={user} doctorProfile={doctorProfile} />

              {role === "doctor" && (
                <DoctorSections
                  data={data}
                  doctorProfile={doctorProfile}
                  commentsAboutDoctor={commentsAboutDoctor}
                  commentsFromDoctor={commentsFromDoctor}
                  commentTab={commentTab}
                  setCommentTab={setCommentTab}
                  verificationDocs={verificationDocs}
                  verificationProfile={verificationProfile}
                  handleVerification={handleVerification}
                  reviewComment={reviewComment}
                  setReviewComment={setReviewComment}
                  processingId={processingId}
                />
              )}

              {role === "patient" && <PatientSections data={data} />}

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

/* -------- Левый блок -------- */
function LeftProfileCard({ user, doctorProfile, userId, verificationProfile }) {
  return (
    <div className="col-lg-3 mb-3">
      <div className="card text-center p-3 shadow-sm">
        <img
          src={doctorProfile?.profileImage || "/default-avatar.png"}
          alt="Avatar"
          className="img-fluid rounded-circle mb-3 border"
          style={{ width: "120px", height: "120px", objectFit: "cover" }}
        />
        <h5 className="fw-bold mb-0">
          {user?.firstName || "—"} {user?.lastName || ""}
        </h5>
        <small className="text-muted">@{user?.username || "—"}</small>

        <div className="mt-3">
          {verificationProfile && (
            <div className="mb-3">
              <span
                className={`badge ${
                  verificationProfile.verificationStatus === "approved"
                    ? "bg-success"
                    : verificationProfile.verificationStatus === "rejected"
                      ? "bg-danger"
                      : "bg-warning text-dark"
                }`}
              >
                Статус: {verificationProfile.verificationStatus}
              </span>
            </div>
          )}
        </div>

        <hr />
        <div className="text-start small">
          <p>
            <MdEmail className="text-primary me-2" />
            {user?.email || "—"}
          </p>
          <p>
            <MdPhone className="text-success me-2" />
            {user?.phoneNumber || doctorProfile?.phoneNumber || "—"}
          </p>
          <p>
            <MdLocationOn className="text-danger me-2" />
            {user?.country || doctorProfile?.country || "—"}
          </p>
        </div>

        <div className="d-grid gap-2">
          <Link
            to={`/admin/user-detail-update/${userId}`}
            className="btn btn-outline-primary btn-sm"
          >
            Редактировать профиль юзера
          </Link>
          <Link
            to={`/admin/doctor-detail-edit-page/${userId}`}
            className="btn btn-outline-primary btn-sm"
          >
            Редактировать профиль врача
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

      <div className="card mt-3 shadow-sm">
        <div className="card-header bg-primary text-white py-2">
          <h6 className="mb-0">О пользователе</h6>
        </div>
        <div className="card-body small">
          {user?.about || user?.bio ? (
            <p>{user.about || user.bio}</p>
          ) : (
            <p className="text-muted">Информация отсутствует</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------- Основная информация -------- */
function UserMainInfo({ user, doctorProfile }) {
  return (
    <>
      <Detail
        label="Имя"
        value={`${user?.firstName || "—"} ${user?.lastName || ""}`}
        icon={<MdPerson />}
      />
      <Detail
        label="Последняя активность"
        value={
          user?.lastActive ? new Date(user.lastActive).toLocaleString() : "—"
        }
        icon={<FaUsers className="text-info" />}
      />
      <Detail label="Email" value={user?.email} icon={<MdEmail />} />
      <Detail
        label="Телефон"
        value={user?.phoneNumber || doctorProfile?.phoneNumber || "—"}
        icon={<MdPhone />}
      />
      <Detail
        label="Специализация"
        value={user?.specialization?.name || "—"}
        icon={<MdWork />}
      />
      <Detail label="Статус" value={user?.status || "—"} icon={<MdWork />} />
      <Detail
        label="Дата рождения"
        value={
          user?.dateOfBirth
            ? new Date(user.dateOfBirth).toLocaleDateString()
            : "—"
        }
        icon={<FaBirthdayCake />}
      />
      <Detail
        label="Пол"
        value={
          user?.about || user?.bio ? (
            <p>{user.about || user.bio}</p>
          ) : (
            <p className="text-muted">Информация отсутствует</p>
          )
        }
        icon={<FaVenusMars />}
      />
      <Detail
        label="Язык"
        value={user?.preferredLanguage?.toUpperCase() || "—"}
        icon={<FaGlobe />}
      />
      <Detail
        label="Друзья"
        value={user?.friends?.length || 0}
        icon={<FaUserFriends />}
      />
      <Detail
        label="Дата регистрации"
        value={
          user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"
        }
        icon={<FaCalendarAlt />}
      />
      <Detail
        label="2FA"
        value={user?.twoFactorAuth?.enabled ? "Включена" : "Выключена"}
        icon={<FaLock />}
      />
      <Detail
        label="Заблокирован"
        value={user?.isBlocked ? "Да" : "Нет"}
        icon={
          user?.isBlocked ? (
            <FaTimesCircle className="text-danger" />
          ) : (
            <FaCheckCircle className="text-success" />
          )
        }
      />
      <Detail
        label="Компания"
        value={doctorProfile?.company || "—"}
        icon={<FaBuilding />}
      />

      <Detail
        label="Должность"
        value={doctorProfile?.specialty?.name || "—"}
        icon={<MdWork />}
      />
    </>
  );
}

function DoctorSections({
  data,
  doctorProfile = {},
  commentsAboutDoctor,
  commentsFromDoctor,
  commentTab,
  setCommentTab,
  verificationDocs,
  verificationProfile,
  handleVerification,
  reviewComment,
  setReviewComment,
  processingId,
}) {
  return (
    <>
      <Section title="Профессиональная информация" icon={<FaUserMd />}>
        <Detail
          label="Клиника"
          value={doctorProfile?.clinic || "—"}
          icon={<FaHospitalUser />}
        />
        <Detail
          label="Адрес"
          value={doctorProfile?.address || "—"}
          icon={<MdLocationOn />}
        />
        <Detail
          label="Образование"
          value={doctorProfile?.educationInstitution || "—"}
          icon={<FaUniversity />}
        />
        <Detail
          label="Период обучения"
          value={
            doctorProfile?.educationStartYear && doctorProfile?.educationEndYear
              ? `${doctorProfile.educationStartYear} — ${doctorProfile.educationEndYear}`
              : "—"
          }
          icon={<FaBookMedical />}
        />
        <Detail
          label="Специализация"
          value={doctorProfile?.specializationInstitution || "—"}
          icon={<FaBookMedical />}
        />
        <Detail
          label="Период специализации"
          value={
            doctorProfile?.specializationStartYear &&
            doctorProfile?.specializationEndYear
              ? `${doctorProfile.specializationStartYear} — ${doctorProfile.specializationEndYear}`
              : "—"
          }
          icon={<FaUniversity />}
        />
        <Detail
          label="О себе"
          value={doctorProfile?.about || "—"}
          icon={<FaUserMd />}
        />
      </Section>

      <ComplexDoctorBlocks
        data={data}
        commentsAboutDoctor={commentsAboutDoctor}
        commentsFromDoctor={commentsFromDoctor}
        commentTab={commentTab}
        setCommentTab={setCommentTab}
        verificationDocs={verificationDocs}
        verificationProfile={verificationProfile}
        handleVerification={handleVerification}
        reviewComment={reviewComment}
        setReviewComment={setReviewComment}
        processingId={processingId}
      />
    </>
  );
}

/* -------- Универсальные -------- */
function Detail({ label, value, icon }) {
  return (
    <div className="row mb-2">
      <div className="col-md-4 fw-bold d-flex align-items-center">
        {icon && <span className="me-2">{icon}</span>}
        {label}
      </div>
      <div className="col-md-8">
        {value !== undefined && value !== null && value !== "" ? value : "—"}
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

/* -------- Сложные блоки врача -------- */
function ComplexDoctorBlocks({
  data,
  commentsAboutDoctor,
  commentsFromDoctor,
  commentTab,
  setCommentTab,
  verificationDocs = [],
  verificationProfile = null,
  handleVerification,
  reviewComment,
  setReviewComment,
  processingId,
}) {
  const dp = data.doctorProfile;
  return (
    <>
      <Section title="Книги" icon={<FaBookMedical />}>
        {dp?.books?.length ? (
          <ul className="list-unstyled ps-2">
            {dp.books.map((b, i) => (
              <li key={i}>
                📚 <b>{b.title}</b> — {b.author} ({b.publishedYear || "—"})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Нет книг</p>
        )}
      </Section>

      <Section title="Видео" icon={<FaFileAlt />}>
        {dp?.videos?.length ? (
          <ul className="list-unstyled ps-2">
            {dp.videos.map((v, i) => (
              <li key={i}>
                🎥{" "}
                <a href={v.url} target="_blank" rel="noreferrer">
                  {v.title}
                </a>{" "}
                <small className="text-muted">
                  ({new Date(v.uploadedAt).toLocaleDateString()})
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Нет видео</p>
        )}
      </Section>

      <Section title="Библиотека" icon={<FaBookMedical />}>
        {dp?.library?.length ? (
          <ul className="list-unstyled ps-2">
            {dp.library.map((item, i) => (
              <li key={i}>
                📖 {item.title} <small>({item.type})</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Библиотека пуста</p>
        )}
      </Section>

      <Section title="Уроки" icon={<FaUniversity />}>
        {dp?.lessons?.length ? (
          <ul className="list-unstyled ps-2">
            {dp.lessons.map((l, i) => (
              <li key={i}>
                🧑‍🏫 <b>{l.title}</b> — {l.content.slice(0, 80)}...
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Нет уроков</p>
        )}
      </Section>

      <Section title="Консультации" icon={<FaStethoscope />}>
        {dp?.consultations?.length ? (
          <ul className="list-unstyled ps-2">
            {dp.consultations.map((c, i) => (
              <li key={i}>
                💬 Пациент: {c.patientId?.toString() || "—"} —{" "}
                {new Date(c.date).toLocaleDateString()} <br />
                <small>{c.notes}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Консультаций нет</p>
        )}
      </Section>

      <Section title="Видеоконференции" icon={<FaUsers />}>
        {dp?.videoConferences?.length ? (
          <ul className="list-unstyled ps-2">
            {dp.videoConferences.map((v, i) => (
              <li key={i}>
                🎦 <b>{v.title}</b> — {new Date(v.date).toLocaleDateString()}{" "}
                <br />
                <a href={v.link} target="_blank" rel="noreferrer">
                  {v.link}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Нет видеоконференций</p>
        )}
      </Section>

      <Section title="Рекомендации пациентов" icon={<FaUserMd />}>
        <p>
          {dp?.recommendations?.length
            ? `${dp.recommendCount} рекомендаций`
            : "Нет рекомендаций"}
        </p>
      </Section>

      <Section title="Пациенты" icon={<FaHospitalUser />}>
        {data.patients?.length ? (
          <ul className="list-unstyled ps-2">
            {data.patients.map((p) => (
              <li key={p._id}>
                👤 {p.firstName || "Пациент"} {p.lastName || ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Нет пациентов</p>
        )}
      </Section>

      <Section title="Статьи" icon={<FaBookMedical />}>
        {data.articles?.length ? (
          <ul className="list-unstyled ps-2">
            {data.articles.map((a) => (
              <li key={a._id}>
                <Link to={`/doctor/article-detail/${a._id}`}>{a.title}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Нет статей</p>
        )}
      </Section>

      {/* === Комментарии === */}
      <Section title="Комментарии" icon={<FaComment />}>
        <div className="d-flex gap-2 mb-3">
          <button
            className={`btn btn-sm ${
              commentTab === "aboutDoctor"
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() => setCommentTab("aboutDoctor")}
          >
            💬 О враче ({commentsAboutDoctor.length})
          </button>
          <button
            className={`btn btn-sm ${
              commentTab === "fromDoctor"
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() => setCommentTab("fromDoctor")}
          >
            🖋 От врача ({commentsFromDoctor.length})
          </button>
        </div>

        {commentTab === "aboutDoctor" ? (
          commentsAboutDoctor.length ? (
            <ul className="list-group list-group-flush">
              {commentsAboutDoctor.map((c) => (
                <li key={c._id} className="list-group-item small border-bottom">
                  <b>
                    {c.author?.firstName || "Без имени"}{" "}
                    {c.author?.lastName || ""}
                  </b>
                  <div className="text-muted" style={{ fontSize: "0.85em" }}>
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                  <div>{c.content}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Нет комментариев о враче</p>
          )
        ) : commentsFromDoctor.length ? (
          <ul className="list-group list-group-flush">
            {commentsFromDoctor.map((c) => (
              <li key={c._id} className="list-group-item small border-bottom">
                <b>Цель:</b>{" "}
                {c.target?.title ||
                  `${c.target?.firstName || ""} ${c.target?.lastName || ""}`}
                <div className="text-muted" style={{ fontSize: "0.85em" }}>
                  {new Date(c.createdAt).toLocaleString()}
                </div>
                <div>{c.content}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Доктор ещё не писал комментариев</p>
        )}
      </Section>

      <Section title="Файлы врача" icon={<FaFileAlt />}>
        {data.files?.length ? (
          <ul className="list-unstyled ps-2">
            {data.files.map((f) => (
              <li key={f._id}>
                📎{" "}
                <a href={f.fileUrl} target="_blank" rel="noreferrer">
                  {f.fileName || "Без названия"}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Файлы отсутствуют</p>
        )}
      </Section>

      <Section title="Истории болезней" icon={<FaHeartbeat />}>
        {data.histories?.length ? (
          <ul className="list-unstyled ps-2">
            {data.histories.map((h) => (
              <li key={h._id}>
                🩺 {h.diagnosis || "Без диагноза"} — {h.patientId?.firstName}{" "}
                {h.patientId?.lastName}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Истории отсутствуют</p>
        )}
      </Section>
      <Section title="Документы для верификации" icon={<FaFileAlt />}>
        {verificationProfile && (
          <div className="mb-3">
            <span
              className={`badge ${
                verificationProfile.verificationStatus === "approved"
                  ? "bg-success"
                  : verificationProfile.verificationStatus === "rejected"
                    ? "bg-danger"
                    : "bg-warning text-dark"
              }`}
            >
              Статус: {verificationProfile.verificationStatus}
            </span>
          </div>
        )}

        {verificationDocs.length ? (
          <div className="row">
            {verificationDocs.map((doc) => (
              <div key={doc._id} className="col-md-6 mb-3">
                <div className="card border shadow-sm p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>{doc.documentType}</strong>
                    <span
                      className={`badge ${
                        doc.status === "approved"
                          ? "bg-success"
                          : doc.status === "rejected"
                            ? "bg-danger"
                            : "bg-warning text-dark"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <small className="text-muted">
                    Загружен: {new Date(doc.createdAt).toLocaleDateString()}
                  </small>

                  <div className="mt-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >
                      Просмотреть файл
                    </a>
                  </div>

                  {doc.reviewComment && (
                    <div className="mt-2 text-danger small">
                      Комментарий: {doc.reviewComment}
                    </div>
                  )}

                  {doc.status === "pending" && (
                    <div className="mt-3">
                      <textarea
                        className="form-control mb-2"
                        placeholder="Комментарий при отказе (необязательно)"
                        onChange={(e) =>
                          setReviewComment((prev) => ({
                            ...prev,
                            [doc._id]: e.target.value,
                          }))
                        }
                      />

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm"
                          disabled={processingId === doc._id}
                          onClick={() =>
                            handleVerification(doc._id, "approved")
                          }
                        >
                          {processingId === doc._id
                            ? "Обработка..."
                            : "Подтвердить"}
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          disabled={processingId === doc._id}
                          onClick={() =>
                            handleVerification(doc._id, "rejected")
                          }
                        >
                          {processingId === doc._id
                            ? "Обработка..."
                            : "Отклонить"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">Документы не загружены</p>
        )}
      </Section>
    </>
  );
}

/* -------- Секции пациента -------- */
function PatientSections({ data }) {
  return (
    <>
      <Section title="Врачи" icon={<FaStethoscope />}>
        {data.doctors?.length ? (
          <ul className="list-unstyled ps-2">
            {data.doctors.map((d) => (
              <li key={d._id}>
                🩺 {d.firstName} {d.lastName}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Нет врачей</p>
        )}
      </Section>

      <Section title="Истории болезни" icon={<FaHeartbeat />}>
        {data.patientHistories?.length ? (
          <ul className="list-unstyled ps-2">
            {data.patientHistories.map((h) => (
              <li key={h._id}>{h.diagnosis}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Нет историй болезни</p>
        )}
      </Section>

      <Section title="Файлы" icon={<FaFileAlt />}>
        {data.files?.length ? (
          <ul className="list-unstyled ps-2">
            {data.files.map((f) => (
              <li key={f._id}>
                <a href={f.fileUrl} target="_blank" rel="noreferrer">
                  {f.fileName}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Нет файлов</p>
        )}
      </Section>
    </>
  );
}

/* -------- Статистика -------- */
function StatsSection({ stats }) {
  return (
    <div className="mt-4">
      <h6 className="fw-bold mb-3">Статистика</h6>
      <div className="row text-center">
        <Stat label="Пациенты" value={stats.totalPatients} />
        <Stat label="Статьи" value={stats.totalArticles} />
        <Stat label="Комментарии" value={stats.totalComments} />
        <Stat label="Файлы" value={stats.totalFiles} />
        <Stat label="Истории болезней" value={stats.totalHistories} />
      </div>
    </div>
  );
}
