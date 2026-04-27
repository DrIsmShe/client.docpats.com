import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spinner, Card, Badge } from "react-bootstrap";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaUndoAlt,
  FaCalendarPlus,
  FaGlobe,
  FaUserMd,
} from "react-icons/fa";
import { useTranslation } from "react-i18next"; // 🔥 добавлено

export default function AuditTimelinesPage({ appointmentId }) {
  const { t } = useTranslation(); // 🔥 перевод
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchLogs = async () => {
      if (!appointmentId) {
        console.warn("⚠️ Нет appointmentId для загрузки аудита");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${API_BASE}/schedule/appointment/audit/${appointmentId}`,
          { withCredentials: true }
        );
        setLogs(res?.data?.data || []);
      } catch (err) {
        console.error("❌ Ошибка загрузки аудита:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [appointmentId]);

  if (loading) return <Spinner animation="border" className="mt-3" />;

  if (!logs.length)
    return <p className="text-muted mt-3">{t("audit.no_history")}</p>;

  // ===============================
  // 🎨 Иконка действия
  // ===============================
  const getActionIcon = (action) => {
    switch (action) {
      case "create":
        return <FaCalendarPlus color="#007bff" />;
      case "confirmed":
        return <FaCheckCircle color="green" />;
      case "cancelled":
        return <FaTimesCircle color="red" />;
      case "completed":
        return <FaCheckCircle color="blue" />;
      case "rescheduled":
        return <FaUndoAlt color="orange" />;
      case "update":
        return <FaEdit color="#6c757d" />;
      default:
        return <FaEdit />;
    }
  };

  // ===============================
  // 🧩 Формат имени
  // ===============================
  const fullName = (u) => {
    if (!u) return "—";
    const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return name || "—";
  };

  return (
    <div className="mt-3">
      <h5 className="mb-3 fw-bold">🕓 {t("audit.title")}</h5>

      {logs.map((log, idx) => {
        const doctor = log.byUserId || {};
        const patient = log.targetPatientId || {};

        return (
          <Card key={log._id || idx} className="mb-3 shadow-sm border-0">
            <Card.Body>
              {/* === Действие === */}
              <div className="d-flex align-items-center mb-2">
                <div className="me-3 fs-4">{getActionIcon(log.action)}</div>

                <div>
                  <Badge bg="light" text="dark" className="me-2">
                    {t(`audit.actions.${log.action}`, {
                      defaultValue: log.action?.toUpperCase(),
                    })}
                  </Badge>

                  <span className="text-muted">
                    {patient.country || t("audit.patient")}
                  </span>
                </div>
              </div>

              {/* === Врач — кто совершил действие === */}
              {doctor && doctor.firstName && (
                <div className="ms-4 text-muted small mt-2">
                  <FaUserMd className="me-1" />
                  {t("audit.action_by")}: <strong>{fullName(doctor)}</strong>{" "}
                  <span className="text-muted">
                    ({doctor.role || t("audit.doctor")})
                  </span>
                  {doctor.country && doctor.country !== "—" && (
                    <>
                      <FaGlobe className="ms-2 me-1" />
                      {doctor.country}
                    </>
                  )}
                </div>
              )}

              {/* === Причина === */}
              {log.reason && (
                <div className="text-muted mt-2 ms-4">
                  {t("audit.reason")}: {log.reason}
                </div>
              )}

              {/* === Дата === */}
              <div className="small text-secondary mt-2 ms-4">
                {new Date(log.createdAt).toLocaleString("ru-RU", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
}
