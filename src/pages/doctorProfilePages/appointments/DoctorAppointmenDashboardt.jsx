import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Row, Col, Spinner, Table, Alert } from "react-bootstrap";
import {
  FaUserClock,
  FaCheckCircle,
  FaBan,
  FaCalendarAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function DoctorAppointmentDashboard() {
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
          axios.get(`${API_BASE}/dashboard/app/stats`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE}/dashboard/app/upcoming`, {
            withCredentials: true,
          }),
        ]);
        setStats(statsRes.data);
        setUpcoming(upcomingRes.data.data);
      } catch (err) {
        setError(t("doctor_dashboard.error_loading"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" /> <p>{t("doctor_dashboard.loading")}</p>
      </div>
    );

  if (error)
    return (
      <Alert variant="danger" className="mt-4 text-center">
        {error}
      </Alert>
    );

  return (
    <div className="container mt-4">
      <h3 className="mb-4">🩺 {t("doctor_dashboard.title")}</h3>

      {/* === Статистика === */}
      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="shadow-sm border-success">
              <Card.Body>
                <FaCheckCircle className="text-success fs-2 mb-2" />
                <Card.Title>{t("doctor_dashboard.stats_confirmed")}</Card.Title>
                <Card.Text>
                  {stats.stats.find((s) => s._id === "confirmed")?.count || 0}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="shadow-sm border-warning">
              <Card.Body>
                <FaUserClock className="text-warning fs-2 mb-2" />
                <Card.Title>{t("doctor_dashboard.stats_pending")}</Card.Title>
                <Card.Text>
                  {stats.stats.find((s) => s._id === "pending")?.count || 0}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="shadow-sm border-danger">
              <Card.Body>
                <FaBan className="text-danger fs-2 mb-2" />
                <Card.Title>{t("doctor_dashboard.stats_cancelled")}</Card.Title>
                <Card.Text>
                  {stats.stats.find((s) => s._id === "cancelled")?.count || 0}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="shadow-sm border-primary">
              <Card.Body>
                <FaCalendarAlt className="text-primary fs-2 mb-2" />
                <Card.Title>
                  {t("doctor_dashboard.stats_total_week")}
                </Card.Title>
                <Card.Text>{stats.total}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* === Ближайшие приёмы === */}
      <h5 className="mb-3">{t("doctor_dashboard.upcoming_title")}</h5>

      {upcoming.length ? (
        <Table striped hover bordered responsive>
          <thead>
            <tr>
              <th>{t("doctor_dashboard.date_time")}</th>
              <th>{t("doctor_dashboard.type")}</th>
              <th>{t("doctor_dashboard.status")}</th>
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
                  {a.type === "video"
                    ? t("doctor_dashboard.type_online")
                    : t("doctor_dashboard.type_offline")}
                </td>

                <td>{a.status}</td>

                <td>
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
      ) : (
        <Alert variant="info">{t("doctor_dashboard.no_upcoming")}</Alert>
      )}
    </div>
  );
}
