import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Spinner,
  Alert,
  Image,
  Badge,
  Table,
  Button,
  Row,
  Col,
  Accordion,
} from "react-bootstrap";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaFlag,
  FaStethoscope,
  FaHeartbeat,
  FaFileMedical,
  FaUserMd,
  FaArrowLeft,
  FaUserEdit,
  FaExternalLinkAlt,
} from "react-icons/fa";
const API_BASE = process.env.REACT_APP_API_URL;

const PolyclinicPatientDetail = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/admin/polyclinic-patient-detail-get/${id}`,
          { withCredentials: true }
        );
        if (res.data.success) setPatient(res.data.data);
        else setError("Пациент не найден или ошибка при загрузке данных.");
      } catch (err) {
        console.error("Ошибка загрузки:", err);
        setError("Ошибка при получении данных с сервера.");
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  const groupedExaminations = useMemo(() => {
    if (!patient?.examinations) return {};
    return patient.examinations.reduce((acc, ex) => {
      const key = ex.studyTypeReference || "Другое";
      if (!acc[key]) acc[key] = [];
      acc[key].push(ex);
      return acc;
    }, {});
  }, [patient]);

  if (loading)
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Загрузка данных пациента...</p>
      </div>
    );

  if (error)
    return (
      <Alert variant="danger" className="mt-4 text-center shadow-sm rounded-4">
        {error}
      </Alert>
    );

  if (!patient)
    return (
      <Alert variant="warning" className="mt-4 text-center shadow-sm rounded-4">
        Данные о пациенте отсутствуют.
      </Alert>
    );

  return (
    <div className="container py-4 animate-fade">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
        {/* ======= HEADER ======= */}
        <div
          className="card-header border-0 text-white d-flex justify-content-between align-items-center py-3"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,100,255,1) 0%, rgba(0,80,200,1) 100%)",
          }}
        >
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <FaUser /> {patient.fullName || "Без имени"}
          </h4>
          <Badge
            bg={patient.isVerified ? "success" : "light"}
            text={patient.isVerified ? "light" : "dark"}
            className="fs-6 py-2 px-3"
          >
            {patient.isVerified ? "Верифицирован" : "Не верифицирован"}
          </Badge>
        </div>

        <div className="card-body p-4 bg-white">
          {/* ======= PROFILE SECTION ======= */}
          <Row className="align-items-center mb-4">
            <Col md={4} className="text-center">
              <Image
                src={
                  patient.photo
                    ? patient.photo.startsWith("http")
                      ? patient.photo
                      : `${API_BASE}/uploads/${patient.photo.replace(
                          /^\/+/,
                          ""
                        )}`
                    : "https://cdn-icons-png.flaticon.com/512/147/147144.png"
                }
                roundedCircle
                width={180}
                height={180}
                className="shadow-sm border border-3 border-light-subtle"
                style={{ objectFit: "cover" }}
              />
            </Col>
            <Col md={8}>
              <Row>
                <Col sm={6} className="mb-3">
                  <FaEnvelope className="text-primary me-2" />
                  <strong>Email:</strong> {patient.email || "—"}
                </Col>
                <Col sm={6} className="mb-3">
                  <FaPhone className="text-primary me-2" />
                  <strong>Телефон:</strong> {patient.phoneNumber || "—"}
                </Col>
                <Col sm={6} className="mb-3">
                  <FaCalendarAlt className="text-primary me-2" />
                  <strong>Дата рождения:</strong>{" "}
                  {patient.birthDate
                    ? new Date(patient.birthDate).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </Col>
                <Col sm={6} className="mb-3">
                  <FaFlag className="text-primary me-2" />
                  <strong>Страна:</strong> {patient.country || "—"}
                </Col>
              </Row>
            </Col>
          </Row>

          {/* ======= МЕДИЦИНСКИЕ ДАННЫЕ ======= */}
          {/* ======= МЕДИЦИНСКАЯ ИНФОРМАЦИЯ (Editable) ======= */}
          <section className="mt-4">
            <h5 className="text-primary fw-bold border-bottom pb-2 mb-3">
              🩺 Медицинская информация
            </h5>

            <form className="p-3 bg-light rounded-4 shadow-sm">
              {[
                ["chronicDiseases", "Хронические болезни"],
                ["operations", "Перенесённые операции"],
                ["familyHistoryOfDisease", "Семейный анамнез"],
                ["allergies", "Аллергии"],
                ["immunization", "Иммунизация"],
                ["badHabits", "Вредные привычки"],
                ["about", "О пациенте"],
              ].map(([field, label], idx) => (
                <div key={idx} className="mb-3">
                  <label
                    htmlFor={field}
                    className="form-label fw-semibold text-secondary mb-1"
                  >
                    {label}:
                  </label>
                  <textarea
                    id={field}
                    name={field}
                    rows={field === "about" ? 3 : 2}
                    className="form-control rounded-3 shadow-sm border-light-subtle"
                    placeholder={`Введите данные для поля "${label}"`}
                    value={patient?.[field] || ""}
                    onChange={(e) =>
                      setPatient((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}

              <div className="d-flex justify-content-end mt-4">
                <Button
                  variant="primary"
                  className="px-4 rounded-pill"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("Сохранить изменения:", patient);
                    // TODO: axios.patch(`${API_BASE}/admin/patient-update/${id}`, patient)
                  }}
                >
                  💾 Сохранить изменения
                </Button>
              </div>
            </form>
          </section>

          {/* ======= ИСТОРИИ БОЛЕЗНЕЙ ======= */}
          {patient.histories?.length > 0 && (
            <section className="mt-5">
              <h5 className="text-danger fw-bold border-bottom pb-2 mb-3">
                <FaHeartbeat className="me-2" />
                Истории болезней пациента
              </h5>
              {patient.histories.map((h, i) => (
                <div
                  key={h._id || i}
                  className="border rounded-4 p-3 mb-3 bg-light shadow-sm"
                >
                  <p className="mb-2">
                    <FaUserMd className="text-primary me-2" />
                    <strong>Врач:</strong>{" "}
                    {h.doctorId
                      ? `${h.doctorId.firstName || ""} ${
                          h.doctorId.lastName || ""
                        }`
                      : "Не указан"}
                  </p>
                  <p className="mb-1">
                    <FaCalendarAlt className="text-secondary me-2" />
                    <strong>Дата:</strong>{" "}
                    {h.createdAt
                      ? new Date(h.createdAt).toLocaleDateString("ru-RU")
                      : "—"}
                  </p>
                  <p className="mb-1">
                    <strong>Диагноз:</strong> {h.diagnosis || "—"}
                  </p>
                </div>
              ))}
            </section>
          )}

          {/* ======= ОБСЛЕДОВАНИЯ ======= */}
          {Object.keys(groupedExaminations).length > 0 && (
            <section className="mt-5">
              <h5 className="text-success fw-bold border-bottom pb-2 mb-3">
                <FaFileMedical className="me-2" />
                Все обследования пациента
              </h5>

              <Accordion alwaysOpen>
                {Object.entries(groupedExaminations).map(([type, exams]) => (
                  <Accordion.Item eventKey={type} key={type}>
                    <Accordion.Header>
                      {type === "CTScan"
                        ? "КТ (Компьютерная томография)"
                        : type === "Angiography"
                        ? "Ангиография"
                        : type === "MRIScan"
                        ? "МРТ (Магнитно-резонансная томография)"
                        : type === "PETScan"
                        ? "ПЭТ скан"
                        : type === "DopplerScan"
                        ? "Допплерография"
                        : type}
                    </Accordion.Header>
                    <Accordion.Body>
                      {exams.map((ex, i) => (
                        <div
                          key={ex._id || i}
                          className="border rounded-4 p-3 mb-3 bg-light shadow-sm"
                        >
                          <p className="mb-2">
                            <FaUserMd className="text-primary me-2" />
                            <strong>Врач:</strong>{" "}
                            {ex.doctorId
                              ? `${ex.doctorId.firstName || ""} ${
                                  ex.doctorId.lastName || ""
                                }`
                              : "Не указан"}
                          </p>
                          <p className="mb-1">
                            <FaCalendarAlt className="text-secondary me-2" />
                            <strong>Дата:</strong>{" "}
                            {ex.createdAt
                              ? new Date(ex.createdAt).toLocaleDateString(
                                  "ru-RU"
                                )
                              : "—"}
                          </p>
                          <p className="mb-1">
                            <strong>Заключение врача:</strong>{" "}
                            {ex.report || "—"}
                          </p>
                          <p className="mb-1">
                            <strong>Рекомендации:</strong>{" "}
                            {ex.recomandation || "—"}
                          </p>
                          {ex.fileUrl && (
                            <p className="mb-0">
                              <a
                                href={ex.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline-primary mt-2"
                              >
                                <FaExternalLinkAlt className="me-1" />
                                Открыть файл
                              </a>
                            </p>
                          )}
                        </div>
                      ))}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </section>
          )}

          {/* ======= BUTTONS ======= */}
          <div className="d-flex justify-content-end align-items-center gap-3 mt-4">
            <Link
              to="/admin/polyclinic/get-all"
              className="btn btn-outline-secondary rounded-pill px-4 d-flex align-items-center gap-2"
            >
              <FaArrowLeft /> Назад
            </Link>
            <Button
              variant="primary"
              as={Link}
              to={`/admin/patient-edit/${id}`}
              className="rounded-pill px-4 d-flex align-items-center gap-2"
            >
              <FaUserEdit /> Редактировать
            </Button>
          </div>
        </div>
      </div>

      {/* ======= STYLES ======= */}
      <style>{`
        .animate-fade { animation: fadeIn 0.6s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .card { background-color: #fff !important; border-radius: 1.5rem !important; }
        .table td, .table th { vertical-align: middle; }
        .table-hover tbody tr:hover { background-color: rgba(0,123,255,0.05); transition: 0.2s; }
      `}</style>
    </div>
  );
};

export default PolyclinicPatientDetail;
