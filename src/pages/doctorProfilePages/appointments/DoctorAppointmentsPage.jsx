import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Spinner,
  Alert,
  Badge,
  Card,
  Row,
  Col,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaUserInjured,
  FaCalendarAlt,
  FaRedo,
  FaTrashAlt,
  FaTrash,
  FaVideo,
} from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Modal } from "react-bootstrap";
import AuditTimeline from "./AuditTimelinesPage.jsx";
import { useTranslation } from "react-i18next";
import JitsiRoom from "../../communication/components/JitsiRoom.jsx";

// Statuses where joining a video call no longer makes sense.
const VIDEO_TERMINAL = ["cancelled", "completed", "no_show", "refunded"];

export default function DoctorAppointmentsPage() {
  const { t } = useTranslation();

  const [appointments, setAppointments] = useState([]);
  const [blockedDays, setBlockedDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);
  const [date, setDate] = useState(new Date());
  const [deleting, setDeleting] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const API_BASE = process.env.REACT_APP_API_URL;
  const tooltipRef = useRef(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [whatsappPhone, setWhatsappPhone] = useState("");

  // Video call modal state.
  const [videoApptId, setVideoApptId] = useState(null);

  /* ========================== 📅 Load appointments ========================== */
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/schedule/appointment/appointments`,
        { withCredentials: true },
      );

      const activeAppointments = (res.data.data || []).filter(
        (a) => !a.isArchived,
      );
      setAppointments(activeAppointments);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError(t("doctor_appointments_page.error_loading"));
    } finally {
      setLoading(false);
    }
  };

  /* ========================== 🚫 Load blocked days ========================== */
  const fetchBlockedDays = async () => {
    try {
      const res = await axios.get(`${API_BASE}/schedule/block/blackout-days`, {
        withCredentials: true,
      });
      setBlockedDays(res.data.data || []);
    } catch (err) {
      console.warn("Error loading blocked days:", err);
    }
  };

  /* ========================== 🔄 Update status ========================== */
  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      await axios.patch(
        `${API_BASE}/schedule/appointment/appointments/${id}/status`,
        { status },
        { withCredentials: true },
      );

      setMessage(
        `${t("doctor_appointments_page.status_updated")} "${t(
          "doctor_appointments_page.status_" + status,
        )}"`,
      );

      await fetchAppointments();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Status change error:", err);
      setError(t("doctor_appointments_page.status_update_error"));
      setTimeout(() => setError(""), 3000);
    } finally {
      setUpdating(null);
    }
  };

  /* ========================== 🗑 Delete one ========================== */
  const deleteAppointment = async (id) => {
    if (!window.confirm(t("doctor_appointments_page.delete_confirm"))) return;

    setDeleting(id);
    try {
      await axios.delete(`${API_BASE}/schedule/appointment/delete/${id}`, {
        withCredentials: true,
      });

      setMessage(t("doctor_appointments_page.deleted"));
      await fetchAppointments();
    } catch (err) {
      console.error("Delete error:", err);
      setError(t("doctor_appointments_page.error_loading"));
    } finally {
      setDeleting(null);
      setTimeout(() => {
        setMessage("");
        setError("");
      }, 3000);
    }
  };

  /* ========================== 🚮 Delete all ========================== */
  const deleteAllAppointments = async () => {
    if (!window.confirm(t("doctor_appointments_page.confirm_delete_all")))
      return;

    setDeleting("all");
    try {
      await axios.delete(`${API_BASE}/schedule/appointment/delete?all=true`, {
        withCredentials: true,
      });

      setMessage(t("doctor_appointments_page.delete_all_success"));
      await fetchAppointments();
    } catch (err) {
      console.error("Delete all error:", err);
      setError(t("doctor_appointments_page.error_loading"));
    } finally {
      setDeleting(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  /* ========================== 📦 Archive ========================== */
  const archiveAppointment = async (id) => {
    if (!window.confirm(t("doctor_appointments_page.archive_confirm"))) return;

    setUpdating(id);
    try {
      await axios.put(
        `${API_BASE}/schedule/appointment/archive/${id}`,
        {},
        { withCredentials: true },
      );

      setMessage(t("doctor_appointments_page.archived"));
      await fetchAppointments();
    } catch (err) {
      console.error("Archive error:", err);
      setError(t("doctor_appointments_page.archive_error"));
    } finally {
      setUpdating(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchBlockedDays();
  }, []);

  const handleDayClick = (day) => {
    const formatted = day.toISOString().slice(0, 10);
    const normalize = (d) =>
      d ? new Date(d).toISOString().slice(0, 10) : null;

    const isBlocked = blockedDays.some((d) => normalize(d.date) === formatted);

    if (isBlocked) {
      setMessage(t("doctor_appointments_page.blocked_day_message"));
      setTimeout(() => setMessage(""), 4000);
      return;
    }

    const dayAppointments = appointments.filter(
      (a) => normalize(a.startsAt) === formatted,
    );

    setSelectedDayAppointments(dayAppointments);
    setSelectedDay(day);
    setShowDayModal(true);
  };

  // Can the doctor join a video call for this appointment?
  // Video is available only after the appointment is confirmed.
  const canJoinVideo = (a) => a?.type === "video" && a?.status === "confirmed";

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
        <p className="ms-2">{t("doctor_appointments_page.loading")}</p>
      </div>
    );

  /* ========================== PAGE ========================== */
  return (
    <>
      <style>{`
        .react-calendar {
          width: 100%;
          max-width: 700px;
          margin: 20px auto;
          border: none !important;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
          padding: 18px 16px 22px;
          font-family: "Inter", "Segoe UI", sans-serif;
          transition: all 0.3s ease;
        }
        .react-calendar__tile {
          height: 70px;
          border-radius: 10px;
          font-weight: 500;
          transition: all 0.25s ease-in-out;
          position: relative;
          overflow: hidden;
        }
        .react-calendar__tile--now {
          border: 2px solid #0d6efd !important;
          border-radius: 10px;
          background-color: rgba(13, 110, 253, 0.05);
          font-weight: 600;
        }
        .react-calendar__tile:hover {
          transform: scale(1.05);
          z-index: 2;
          filter: brightness(0.97);
        }
        .calendar-busy {
          background: linear-gradient(145deg, #b6e6a2, #a7d68f);
          color: #1b4d1b !important;
          font-weight: 600;
          border: 1px solid #9fd18e;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(58, 163, 72, 0.25);
          width: 100%;
          height: 100%;
        }
        .calendar-free {
          background: linear-gradient(145deg, #e0edff, #d5e4ff);
          color: #1e3a8a !important;
          border: 1px solid #a5c8ff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 123, 255, 0.15);
          width: 100%;
          height: 100%;
        }
        .calendar-blocked {
          background: linear-gradient(145deg, #f9c5ca, #f8d7da);
          color: #842029 !important;
          font-weight: 600;
          border: 1px solid #f1aeb5;
          border-radius: 8px;
          box-shadow: 0 3px 8px rgba(255, 0, 0, 0.25);
          width: 100%;
          height: 100%;
          animation: pulseBlocked 2s infinite;
        }
        @keyframes pulseBlocked {
          0% { box-shadow: 0 0 0 0 rgba(255, 99, 132, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(255, 99, 132, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 99, 132, 0); }
        }
        .react-calendar__navigation {
          margin-bottom: 10px;
          border-radius: 10px;
          background: linear-gradient(90deg, #f8fbff, #eef5ff);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
          font-weight: 600;
        }
        .react-calendar__navigation button {
          color: #0d6efd;
          font-weight: 600;
          border-radius: 8px;
          transition: background-color 0.3s ease;
        }
        .react-calendar__navigation button:hover {
          background-color: rgba(13, 110, 253, 0.1);
        }
        .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-size: 0.8rem;
          color: #6c757d;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .table-success {
          background-color: #d1e7dd !important;
        }
        .table-light td {
          color: #6c757d;
        }

      `}</style>
      ;
      <Card className="shadow-lg border-0 rounded-4 p-4 mb-5">
        <Row className="align-items-center mb-4">
          <Col>
            <h3 className="fw-bold text-primary mb-0">
              <FaCalendarAlt className="me-2" />
              {t("doctor_appointments_page.page_title")}
            </h3>
          </Col>

          <Col className="text-end">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={fetchAppointments}
              className="me-2"
            >
              <FaRedo className="me-1" /> {t("doctor_appointments_page.update")}
            </Button>

            <Link
              to="/doctor/appointments/archive"
              className="btn btn-outline-info btn-sm me-2"
            >
              <FaCalendarAlt className="me-1" />
              {t("doctor_appointments_page.archive")}
            </Link>

            <Button
              variant="outline-danger"
              size="sm"
              onClick={deleteAllAppointments}
              disabled={deleting === "all"}
            >
              {deleting === "all" ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <FaTrash className="me-1" />
                  {t("doctor_appointments_page.delete_all")}
                </>
              )}
            </Button>
          </Col>
        </Row>

        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        {appointments.length === 0 ? (
          <Alert variant="info" className="text-center py-3">
            <FaUserInjured className="me-2" />
            {t("doctor_appointments_page.no_appointments")}
          </Alert>
        ) : (
          <div className="table-responsive">
            <Table hover bordered className="align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th>{t("doctor_appointments_page.patient")}</th>
                  <th>{t("doctor_appointments_page.time")}</th>
                  <th>{t("doctor_appointments_page.type")}</th>
                  <th>{t("doctor_appointments_page.status")}</th>
                  <th>{t("doctor_appointments_page.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((a) => {
                  const fullName = `${a?.patient?.firstName || ""} ${
                    a?.patient?.lastName || ""
                  }`.trim();

                  return (
                    <tr key={a._id}>
                      <td className="fw-semibold text-secondary">
                        {fullName || "—"}
                      </td>

                      <td>
                        {new Date(a.startsAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td>
                        {a.type === "video" ? (
                          <Badge
                            bg="success"
                            className="px-3 py-2 rounded-pill"
                          >
                            {t("doctor_appointments_page.online")}
                          </Badge>
                        ) : (
                          <Badge
                            bg="primary"
                            className="px-3 py-2 rounded-pill"
                          >
                            {t("doctor_appointments_page.offline")}
                          </Badge>
                        )}
                      </td>

                      <td>
                        <Badge
                          bg={
                            a.status === "pending"
                              ? "warning"
                              : a.status === "confirmed"
                                ? "success"
                                : a.status === "cancelled"
                                  ? "danger"
                                  : a.status === "completed"
                                    ? "info"
                                    : "secondary"
                          }
                          className="px-3 py-2 text-uppercase"
                        >
                          {t(
                            "doctor_appointments_page.status_" + a.status,
                            a.status,
                          )}
                        </Badge>
                      </td>

                      <td>
                        <div className="d-flex justify-content-center gap-2 mb-2">
                          {canJoinVideo(a) && (
                            <Button
                              size="sm"
                              variant="info"
                              className="text-white"
                              onClick={() => setVideoApptId(a._id)}
                            >
                              <FaVideo className="me-1" />
                              {t(
                                "doctor_appointments_page.join_video",
                                "Видео",
                              )}
                            </Button>
                          )}

                          {a.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                disabled={updating === a._id}
                                onClick={() => {
                                  setSelectedAppointment(a);
                                  setShowWhatsappModal(true);
                                }}
                              >
                                <FaCheckCircle className="me-1" />
                                {t("doctor_appointments_page.status_confirmed")}
                              </Button>

                              <Button
                                size="sm"
                                variant="danger"
                                disabled={updating === a._id}
                                onClick={() =>
                                  handleStatusChange(a._id, "cancelled")
                                }
                              >
                                <FaTimesCircle className="me-1" />
                                {t("doctor_appointments_page.status_cancelled")}
                              </Button>
                            </>
                          )}

                          <Button
                            size="sm"
                            variant="outline-secondary"
                            disabled={updating === a._id}
                            onClick={() => archiveAppointment(a._id)}
                          >
                            <FaTrashAlt className="me-1" />
                            {t("doctor_appointments_page.archive")}
                          </Button>
                        </div>

                        <div className="d-flex justify-content-center gap-2">
                          {a.channel === "whatsapp" &&
                            a.status === "confirmed" &&
                            a.whatsApp?.phone && (
                              <a
                                href={`https://wa.me/${a.whatsApp.phone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-success btn-sm"
                              >
                                💬 WhatsApp
                              </a>
                            )}

                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => {
                              setSelectedAppointmentId(a._id);
                              setShowAuditModal(true);
                            }}
                          >
                            {t("doctor_appointments_page.history")}
                          </Button>

                          <Button
                            variant="outline-danger"
                            size="sm"
                            disabled={deleting === a._id}
                            onClick={() => deleteAppointment(a._id)}
                          >
                            <FaTrashAlt className="me-1" />
                            {t("doctor_appointments_page.delete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}

        {/* Calendar */}
        <div className="mt-5">
          <h5 className="fw-bold mb-3 text-secondary">
            {t("doctor_appointments_page.calendar_title")}
          </h5>

          <Calendar
            value={date}
            onChange={setDate}
            onClickDay={handleDayClick}
            tileContent={({ date }) => {
              const formatted = date.toISOString().slice(0, 10);
              const normalize = (d) =>
                d ? new Date(d).toISOString().slice(0, 10) : null;

              const busyAppointments = appointments.filter(
                (a) => normalize(a.startsAt) === formatted,
              );

              const blockedDay = blockedDays.find(
                (d) => normalize(d.date) === formatted,
              );

              let className = "calendar-free";
              let tooltipText = t("doctor_appointments_page.calendar_free");

              if (blockedDay) {
                className = "calendar-blocked";
                tooltipText = `${t(
                  "doctor_appointments_page.calendar_blocked_reason",
                )} ${blockedDay.reason || ""}`;
              } else if (busyAppointments.length > 0) {
                className = "calendar-busy";
                tooltipText = t("doctor_appointments_page.calendar_busy");
              }

              return (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id={`tooltip-${formatted}`}>{tooltipText}</Tooltip>
                  }
                >
                  <div className={className}></div>
                </OverlayTrigger>
              );
            }}
          />

          <div className="mt-3 small text-muted">
            <span className="badge bg-success me-2">
              🟢 {t("doctor_appointments_page.calendar_busy")}
            </span>
            <span className="badge bg-primary me-2">
              🟦 {t("doctor_appointments_page.calendar_free")}
            </span>
            <span className="badge bg-danger">
              🔴 {t("doctor_appointments_page.calendar_blocked")}
            </span>
          </div>
        </div>

        {/* Modal Day Schedule */}
        <Modal
          show={showDayModal}
          onHide={() => setShowDayModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              {t("doctor_appointments_page.day_schedule_title")}{" "}
              {selectedDay &&
                selectedDay.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Table
              bordered
              hover
              responsive
              className="align-middle text-center"
            >
              <thead className="table-light">
                <tr>
                  <th>{t("doctor_appointments_page.time")}</th>
                  <th>{t("doctor_appointments_page.patient")}</th>
                  <th>{t("doctor_appointments_page.type")}</th>
                  <th>{t("doctor_appointments_page.status")}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }, (_, i) => {
                  const hour = 8 + i;
                  const slotTime = `${hour.toString().padStart(2, "0")}:00`;

                  const appointment = selectedDayAppointments.find((a) => {
                    return new Date(a.startsAt).getHours() === hour;
                  });

                  if (appointment) {
                    const fullName = `${
                      appointment?.patient?.firstName || ""
                    } ${appointment?.patient?.lastName || ""}`.trim();

                    return (
                      <tr key={hour} className="table-success">
                        <td>{slotTime}</td>
                        <td>{fullName}</td>
                        <td>
                          {appointment.type === "video"
                            ? t("doctor_appointments_page.online")
                            : t("doctor_appointments_page.offline")}
                        </td>
                        <td>
                          <Badge
                            bg={
                              appointment.status === "pending"
                                ? "warning"
                                : appointment.status === "confirmed"
                                  ? "success"
                                  : appointment.status === "cancelled"
                                    ? "danger"
                                    : appointment.status === "completed"
                                      ? "info"
                                      : "secondary"
                            }
                          >
                            {t(
                              "doctor_appointments_page.status_" +
                                appointment.status,
                            )}
                          </Badge>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={hour} className="table-light">
                      <td>{slotTime}</td>
                      <td colSpan="3" className="text-muted">
                        {t("doctor_appointments_page.free_slot")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDayModal(false)}>
              {t("doctor_appointments_page.close")}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Audit modal */}
        <Modal
          show={showAuditModal}
          onHide={() => setShowAuditModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton className="bg-info text-white">
            <Modal.Title>
              {t("doctor_appointments_page.history_title")}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {selectedAppointmentId ? (
              <AuditTimeline appointmentId={selectedAppointmentId} />
            ) : (
              <p className="text-muted">
                {t("doctor_appointments_page.no_history")}
              </p>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAuditModal(false)}
            >
              {t("doctor_appointments_page.close")}
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={showWhatsappModal}
          onHide={() => setShowWhatsappModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {t("doctor_appointments_page.whatsapp_title")}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <p className="text-muted">
              {t("doctor_appointments_page.whatsapp_description")}
            </p>

            <input
              className="form-control"
              value={selectedAppointment?.whatsApp?.phone || ""}
              readOnly
            />
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowWhatsappModal(false)}
            >
              {t("doctor_appointments_page.cancel")}
            </Button>

            <Button
              variant="success"
              onClick={async () => {
                await axios.patch(
                  `${API_BASE}/schedule/appointment/appointments/${selectedAppointment._id}/confirm`,
                  {},
                  { withCredentials: true },
                );

                setShowWhatsappModal(false);
                setWhatsappPhone("");
                fetchAppointments();
              }}
            >
              {t("doctor_appointments_page.confirm_and_open_whatsapp")}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Video call modal (freelance appointment) */}
        <Modal
          show={!!videoApptId}
          onHide={() => setVideoApptId(null)}
          size="lg"
          centered
          contentClassName="bg-transparent border-0"
        >
          <Modal.Body style={{ padding: 0, height: "70vh" }}>
            {videoApptId && (
              <JitsiRoom
                source="appointment"
                id={videoApptId}
                displayName="Dr. Radiolog"
                onClose={() => setVideoApptId(null)}
              />
            )}
          </Modal.Body>
        </Modal>
      </Card>
    </>
  );
}
