import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Spinner,
  Alert,
  Card,
  Button,
  Container,
  Row,
  Col,
  Badge,
  ButtonGroup,
} from "react-bootstrap";
import { FaBell, FaCheckCircle, FaTrashAlt, FaSyncAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { notificationIcon } from "../../../utils/notificationIcon";

const API_BASE = process.env.REACT_APP_API_URL;

export default function PatientNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all | unread | read

  /* ===================== 📩 Загрузка уведомлений ===================== */
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/notifications/get-notifications-for-patient`,
        { withCredentials: true }
      );

      // 🔹 объединяем, чтобы непрочитанные были первыми
      const all = [
        ...(res.data.unreadNotifications || []),
        ...(res.data.readNotifications || []),
      ];

      setNotifications(all);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить уведомления");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  /* ===================== 🟩 Отметить одно уведомление ===================== */
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, isRead: true, justRead: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));

    try {
      await axios.patch(
        `${API_BASE}/notifications/read/${id}`,
        {},
        { withCredentials: true }
      );
    } catch (e) {
      console.error("Ошибка при отметке прочитанного:", e);
      fetchNotifications();
    }
  };

  /* ===================== ✅ Отметить все уведомления ===================== */
  const markAllAsRead = async () => {
    setMarkingAll(true);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, justRead: true }))
    );
    setUnreadCount(0);
    try {
      await axios.patch(
        `${API_BASE}/notifications/patient/read-all`,
        {},
        { withCredentials: true }
      );
    } catch (e) {
      console.error("Ошибка при отметке всех уведомлений:", e);
      fetchNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  /* ===================== 🗑️ Удалить уведомление ===================== */
  const deleteNotif = async (id) => {
    try {
      await axios.delete(`${API_BASE}/notifications/patient/delete/${id}`, {
        withCredentials: true,
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Ошибка при удалении:", err);
    }
  };

  /* ===================== 📊 Фильтрация ===================== */
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  /* ===================== ⏳ Визуализация ===================== */
  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container className="mt-4">
      <Row className="align-items-center mb-3">
        <Col md={8}>
          <h3 className="fw-bold">
            <FaBell className="me-2 text-warning" />
            Уведомления{" "}
            <Badge bg="secondary">{unreadCount} непрочитанных</Badge>
          </h3>
        </Col>
        <Col
          md={4}
          className="text-md-end mt-2 mt-md-0 d-flex justify-content-md-end gap-2"
        >
          <Button
            variant="outline-primary"
            size="sm"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              fetchNotifications();
            }}
          >
            <FaSyncAlt className={refreshing ? "fa-spin me-1" : "me-1"} />
            Обновить
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="success"
              size="sm"
              disabled={markingAll}
              onClick={markAllAsRead}
            >
              <FaCheckCircle className="me-1" />
              Отметить все как прочитанные
            </Button>
          )}
        </Col>
      </Row>

      {/* 🔹 Переключатель фильтров */}
      <Row className="mb-3">
        <Col className="text-center">
          <ButtonGroup>
            <Button
              variant={filter === "all" ? "primary" : "outline-primary"}
              onClick={() => setFilter("all")}
            >
              Все
            </Button>
            <Button
              variant={filter === "unread" ? "warning" : "outline-warning"}
              onClick={() => setFilter("unread")}
            >
              Непрочитанные
            </Button>
            <Button
              variant={filter === "read" ? "success" : "outline-success"}
              onClick={() => setFilter("read")}
            >
              Прочитанные
            </Button>
          </ButtonGroup>
        </Col>
      </Row>

      {filteredNotifications.length === 0 && (
        <Alert variant="info" className="text-center">
          Нет уведомлений (
          {filter === "all"
            ? "всех"
            : filter === "unread"
            ? "непрочитанных"
            : "прочитанных"}
          )
        </Alert>
      )}

      <AnimatePresence>
        {filteredNotifications.map((n) => (
          <motion.div
            key={n._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={`mb-3 shadow-sm transition ${
                n.isRead ? "bg-light" : "bg-warning-subtle"
              }`}
              style={{
                borderLeft: n.isRead
                  ? "5px solid #28a745"
                  : "5px solid #ffc107",
                transition: "all 0.3s ease-in-out",
              }}
            >
              <Card.Body>
                <Card.Title className="mb-2 d-flex justify-content-between align-items-center">
                  <span>
                    <span style={{ marginRight: 8 }}>{notificationIcon(n)}</span>
                    {n.title || "Уведомление"}
                  </span>
                </Card.Title>

                <Card.Text className="mb-1 text-dark">{n.message}</Card.Text>

                {n.link && (
                  <a
                    href={n.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none small text-primary"
                  >
                    Перейти →
                  </a>
                )}

                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    {new Date(n.createdAt).toLocaleString("ru-RU")}
                  </small>

                  <div className="d-flex align-items-center gap-2">
                    {!n.isRead ? (
                      <Button
                        style={{ backgroundColor: "#2484a7" }}
                        size="sm"
                        variant="success"
                        onClick={() => markAsRead(n._id)}
                        className="d-flex align-items-center gap-1"
                      >
                        <FaCheckCircle /> Не прочитано
                      </Button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge
                          pill
                          bg="success"
                          style={{
                            color: "white",
                            fontSize: "0.85rem",
                            padding: "6px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <FaCheckCircle /> Прочитано
                        </Badge>
                      </motion.div>
                    )}

                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => deleteNotif(n._id)}
                      className="d-flex align-items-center gap-1"
                    >
                      <FaTrashAlt /> Удалить
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </Container>
  );
}
