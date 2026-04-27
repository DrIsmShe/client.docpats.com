import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spinner, Alert } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next"; // 🔥 добавлено

export default function DoctorAppointmentAuditId() {
  const { id } = useParams();
  const { t } = useTranslation(); // 🔥 i18n

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/dashboard/app/audit/${id}`, {
          withCredentials: true,
        });
        setHistory(res.data.data);
      } catch (err) {
        setError(t("audit.load_error"));
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [id, t]);

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>{t("audit.loading_history")}</p>
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
      <h3>🧾 {t("audit.appointment_history")}</h3>

      {history.length ? (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>{t("audit.date")}</th>
              <th>{t("audit.action")}</th>
              <th>{t("audit.user")}</th>
              <th>{t("audit.reason")}</th>
            </tr>
          </thead>

          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td>{new Date(h.createdAt).toLocaleString("ru-RU")}</td>
                <td>{t(`audit.actions.${h.action}`, h.action)}</td>
                <td>{h.byUserId?.role || "—"}</td>
                <td>{h.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Alert variant="info">{t("audit.no_history")}</Alert>
      )}
    </div>
  );
}
