import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Button,
  Modal,
  Form,
  Table,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useTranslation } from "react-i18next"; // 🔥 добавлено

export default function DoctorAppointmentBlackDates() {
  const { t } = useTranslation(); // 🔥 i18n

  const [schedule, setSchedule] = useState({ exceptions: [] });
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [isDayOff, setIsDayOff] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/schedule/doctor-schedule/me`, {
        withCredentials: true,
      });

      if (res.data.success && res.data.data) {
        const data = res.data.data;

        setSchedule({
          ...data,
          exceptions: Array.isArray(data.exceptions) ? data.exceptions : [],
        });
      } else {
        setSchedule((prev) => ({
          ...prev,
          exceptions: prev.exceptions || [],
        }));
      }
    } catch (err) {
      console.error("❌ Ошибка при загрузке расписания:", err);
      setError(t("black_dates.load_error"));
    } finally {
      setLoading(false);
    }
  };

  // ➕ Добавление чёрной даты
  const addException = async () => {
    if (!date) {
      setMessage(t("black_dates.select_date"));
      return;
    }

    if (schedule.exceptions?.some((e) => e.date === date)) {
      setMessage(t("black_dates.already_added"));
      return;
    }

    const newException = { date, reason, isDayOff, blockedIntervals: [] };
    const updatedExceptions = [...(schedule.exceptions || []), newException];

    try {
      const res = await axios.post(
        `${API_BASE}/schedule/block/add`,
        { date, reason, isDayOff, blockedIntervals: [] },
        { withCredentials: true },
      );

      if (res.data.success) {
        setMessage(t("black_dates.success_added"));
        setSchedule({
          ...res.data.data,
          exceptions: res.data.data?.exceptions || updatedExceptions,
        });
        setShow(false);
        setDate("");
        setReason("");
        setIsDayOff(false);
      } else {
        setMessage(t("black_dates.save_failed"));
      }
    } catch (err) {
      console.error("❌ Ошибка:", err);
      setMessage(t("black_dates.add_error"));
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <Card className="shadow border-0 p-4 rounded-4">
        <h3 className="fw-bold text-danger mb-3">
          🚫 {t("black_dates.title")}
        </h3>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="primary" onClick={() => setShow(true)}>
            + {t("black_dates.add_date")}
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={loadSchedule}
            disabled={loading}
          >
            🔄 {t("black_dates.refresh")}
          </Button>
        </div>

        {message && <Alert variant="info">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>{t("black_dates.date")}</th>
              <th>{t("black_dates.reason")}</th>
              <th>{t("black_dates.full_day_off")}</th>
            </tr>
          </thead>
          <tbody>
            {schedule?.exceptions?.length > 0 ? (
              schedule.exceptions.map((e, idx) => (
                <tr key={idx}>
                  <td>{e.date}</td>
                  <td>{e.reason || "—"}</td>
                  <td>{e.isDayOff ? t("yes") : t("no")}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center text-muted">
                  {t("black_dates.no_exceptions")}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* Модалка */}
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t("black_dates.modal_title")}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>{t("black_dates.date")}</Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("black_dates.reason")}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t("black_dates.reason_placeholder")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              label={t("black_dates.full_day_off")}
              checked={isDayOff}
              onChange={(e) => setIsDayOff(e.target.checked)}
            />
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={addException}>
            {t("save")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
