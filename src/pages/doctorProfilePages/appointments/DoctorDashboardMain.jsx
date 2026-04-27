import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Row,
  Col,
  Spinner,
  Button,
  Table,
  Badge,
  Alert,
} from "react-bootstrap";
import {
  FaCalendarAlt,
  FaUserClock,
  FaBan,
  FaCheckCircle,
  FaClipboardList,
  FaComments,
  FaTimesCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NotificationBell from "../../../components/notifications/NotificationBell";

export default function DoctorDashboardMain() {
  const { t } = useTranslation();

  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, upcomingRes] = await Promise.all([
          axios.get(`${API_BASE}/dashboard/api/stats`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE}/dashboard/api/upcoming`, {
            withCredentials: true,
          }),
        ]);
        setStats(statsRes.data);
        setUpcoming(upcomingRes.data.data || []);
      } catch (err) {
        console.error("Loading error:", err);
        setError(t("doctor_dashboard.load_error"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  /* ===================== ⏳ Loading ===================== */
  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" /> <p>{t("doctor_dashboard.loading")}</p>
      </div>
    );

  if (error)
    return (
      <Alert variant="danger" className="mt-5 text-center">
        {error}
      </Alert>
    );

  /* ===================== 🧱 Content ===================== */
  return (
    <div className="container mt-4">
      <h3 className="fw-bold text-primary mb-4">
        🩺 {t("doctor_dashboard.title")}
      </h3>

      {/* === Statistics === */}
      {stats && (
        <Row className="mb-4 g-3">
          <Col md={3}>
            <Card className="shadow-sm border-success h-100 text-center p-3">
              <FaCheckCircle className="text-success fs-2 mb-2" />
              <h6>{t("doctor_dashboard.stats_confirmed")}</h6>
              <h3>
                {stats.stats.find((s) => s._id === "confirmed")?.count || 0}
              </h3>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="shadow-sm border-warning h-100 text-center p-3">
              <FaUserClock className="text-warning fs-2 mb-2" />
              <h6>{t("doctor_dashboard.stats_pending")}</h6>
              <h3>
                {stats.stats.find((s) => s._id === "pending")?.count || 0}
              </h3>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="shadow-sm border-danger h-100 text-center p-3">
              <FaBan className="text-danger fs-2 mb-2" />
              <h6>{t("doctor_dashboard.stats_cancelled")}</h6>
              <h3>
                {stats.stats.find((s) => s._id === "cancelled")?.count || 0}
              </h3>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="shadow-sm border-primary h-100 text-center p-3">
              <FaCalendarAlt className="text-primary fs-2 mb-2" />
              <h6>{t("doctor_dashboard.stats_total")}</h6>
              <h3>{stats.total}</h3>
            </Card>
          </Col>
        </Row>
      )}

      {/* === Quick Links === */}
      <h5 className="fw-bold mb-3">🔗 {t("doctor_dashboard.quick_links")}</h5>

      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="shadow-sm border-0 hover-shadow text-center p-3">
            <FaClipboardList className="text-primary fs-2 mb-2" />
            <h5>{t("doctor_dashboard.quick_appointments_title")}</h5>
            <p className="text-muted small">
              {t("doctor_dashboard.quick_appointments_desc")}
            </p>
            <Link
              to="/doctor/doctor-appointment"
              className="btn btn-outline-primary"
            >
              {t("doctor_dashboard.go")}
            </Link>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm border-0 hover-shadow text-center p-3">
            <FaTimesCircle className="text-danger fs-2 mb-2" />
            <h5>{t("doctor_dashboard.quick_black_dates_title")}</h5>
            <p className="text-muted small">
              {t("doctor_dashboard.quick_black_dates_desc")}
            </p>
            <Link to="/doctor/black-dates" className="btn btn-outline-danger">
              {t("doctor_dashboard.go")}
            </Link>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm border-0 hover-shadow text-center p-3">
            <FaComments className="text-info fs-2 mb-2" />
            <h5>{t("doctor_dashboard.quick_messages_title")}</h5>
            <p className="text-muted small">
              {t("doctor_dashboard.quick_messages_desc")}
            </p>
            <Link to="/doctor/messages" className="btn btn-outline-info">
              {t("doctor_dashboard.go")}
            </Link>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card className="shadow-sm border-0 hover-shadow text-center p-3">
            <FaClipboardList className="text-primary fs-2 mb-2" />
            <h5>{t("doctor_dashboard.quick_schedule_title")}</h5>
            <p className="text-muted small">
              {t("doctor_dashboard.quick_schedule_desc")}
            </p>
            <Link
              to="/doctor/doctor-schedule"
              className="btn btn-outline-primary"
            >
              {t("doctor_dashboard.go")}
            </Link>
          </Card>
        </Col>
      </Row>

      {/* === Upcoming Appointments === */}
      <h5 className="fw-bold mb-3 text-secondary">
        ⏰ {t("doctor_dashboard.upcoming_title")}
      </h5>

      {upcoming.length > 0 ? (
        <Card className="shadow-sm border-0">
          <Table hover responsive className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>{t("doctor_dashboard.date_time")}</th>
                <th>{t("doctor_dashboard.appointment_type")}</th>
                <th>{t("doctor_dashboard.appointment_status")}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {upcoming.map((a) => (
                <tr key={a._id}>
                  <td>
                    {new Date(a.startsAt).toLocaleString(undefined, {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td>
                    {a.type === "video" ? (
                      <Badge bg="success" className="px-3 py-2 rounded-pill">
                        {t("doctor_dashboard.online")}
                      </Badge>
                    ) : (
                      <Badge bg="primary" className="px-3 py-2 rounded-pill">
                        {t("doctor_dashboard.offline")}
                      </Badge>
                    )}
                  </td>

                  <td>
                    <Badge
                      bg={
                        a.status === "confirmed"
                          ? "success"
                          : a.status === "pending"
                            ? "warning"
                            : a.status === "cancelled"
                              ? "danger"
                              : "secondary"
                      }
                      className="px-3 py-2 text-uppercase"
                    >
                      {t("doctor_dashboard.status_" + a.status)}
                    </Badge>
                  </td>

                  <td className="text-end">
                    <Link
                      to={`/doctor/audit/${a._id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      {t("doctor_dashboard.history")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <Alert variant="info" className="text-center">
          {t("doctor_dashboard.upcoming_empty")}
        </Alert>
      )}
    </div>
  );
}
