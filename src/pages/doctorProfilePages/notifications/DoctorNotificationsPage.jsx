import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Spinner,
  Alert,
  Card,
  Button,
  Badge,
  Row,
  Col,
  Container,
  ButtonGroup,
  Modal,
} from "react-bootstrap";
import {
  FaBell,
  FaCheckCircle,
  FaRedo,
  FaTrashAlt,
  FaPaperPlane,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL;
export default function DoctorNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [marking, setMarking] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all | unread | read | sent
  const [deleting, setDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // ====================== 🔹 Загрузка уведомлений ======================
  const fetchNotifications = async (type = "all") => {
    try {
      setLoading(true);
      setError("");

      // 🔹 1. Получаем уведомления нужного типа
      const res = await axios.get(
        `${API_BASE}/notifications/get?type=${type}`,
        {
          withCredentials: true,
        }
      );

      if (res.data?.success) {
        const list = res.data.notifications || [];
        setNotifications(list);
        setUnreadCount(res.data.unreadCount || 0);
      } else {
        setError("Не удалось получить уведомления");
      }
    } catch (err) {
      console.error("❌ Ошибка при загрузке уведомлений:", err);
      setError("Ошибка при получении уведомлений");
    } finally {
      setLoading(false);
    }
  };

  // ====================== 🔹 Отметить все как прочитанные ======================
  const markAllAsRead = async () => {
    try {
      setMarking(true);
      await axios.patch(
        `${API_BASE}/notifications/mark-read`,
        {},
        { withCredentials: true }
      );

      if (activeTab === "unread") {
        setNotifications([]); // очищаем непрочитанные
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }

      setUnreadCount(0);
      setActiveTab("all");
    } catch (err) {
      console.error("Ошибка при отметке уведомлений:", err);
      alert("Не удалось отметить уведомления как прочитанные");
    } finally {
      setMarking(false);
    }
  };

  // ====================== 🔹 Отметить одно уведомление ======================
  // ====================== 🔹 Отметить одно уведомление ======================
  const markOneAsRead = async (id) => {
    try {
      await axios.patch(
        `${API_BASE}/notifications/mark-read`,
        { notificationId: id },
        { withCredentials: true }
      );

      setNotifications((prev) => {
        // если сейчас вкладка "unread" → удаляем его из списка
        if (activeTab === "unread") {
          return prev.filter((n) => n._id !== id);
        }
        // если "all" → просто отмечаем
        return prev.map((n) => (n._id === id ? { ...n, isRead: true } : n));
      });

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Ошибка при отметке одного уведомления:", err);
    }
  };

  // ====================== 🔹 Удалить одно уведомление ======================
  const deleteNotification = async (id) => {
    try {
      setDeleting(true);
      await axios.delete(`${API_BASE}/notifications/delete/${id}`, {
        withCredentials: true,
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Ошибка при удалении уведомления:", err);
      alert("Не удалось удалить уведомление");
    } finally {
      setDeleting(false);
      setSelectedId(null);
    }
  };

  useEffect(() => {
    fetchNotifications(activeTab);
  }, [activeTab]);

  // ====================== 🔹 UI ======================
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center mt-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  if (error)
    return (
      <Container className="mt-4">
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      </Container>
    );

  return (
    <Container className="mt-4">
      {/* 🔸 Заголовок и кнопка */}
      <Row className="align-items-center mb-3">
        <Col xs="auto">
          <h3 className="d-flex align-items-center gap-2 mb-0">
            <FaBell /> Уведомления{" "}
            {unreadCount > 0 && (
              <Badge bg="danger" pill>
                {unreadCount}
              </Badge>
            )}
          </h3>
        </Col>
        <Col className="text-end">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={markAllAsRead}
            disabled={marking || unreadCount === 0}
          >
            {marking ? (
              <>
                <Spinner animation="border" size="sm" /> Обновление...
              </>
            ) : (
              <>
                <FaCheckCircle className="me-2" />
                Пометить всё как прочитанное
              </>
            )}
          </Button>
        </Col>
      </Row>

      {/* 🔸 Переключатель вкладок */}
      <Row className="mb-4">
        <Col>
          <ButtonGroup>
            <Button
              variant={activeTab === "all" ? "primary" : "outline-primary"}
              onClick={() => setActiveTab("all")}
            >
              Все
            </Button>
            <Button
              variant={activeTab === "unread" ? "primary" : "outline-primary"}
              onClick={() => setActiveTab("unread")}
            >
              Непрочитанные
            </Button>
            <Button
              variant={activeTab === "read" ? "primary" : "outline-primary"}
              onClick={() => setActiveTab("read")}
            >
              Прочитанные
            </Button>
            <Button
              variant={activeTab === "sent" ? "primary" : "outline-primary"}
              onClick={() => setActiveTab("sent")}
            >
              Отправленные <FaPaperPlane className="ms-1" />
            </Button>
          </ButtonGroup>
        </Col>
      </Row>

      {/* 🔸 Список уведомлений */}
      {notifications.length === 0 ? (
        <Card className="p-4 text-center text-muted shadow-sm border-0">
          <FaRedo className="mb-2 fs-4 text-secondary" />
          <div>Нет уведомлений</div>
        </Card>
      ) : (
        notifications.map((n) => (
          <Card
            key={n._id}
            className={`mb-3 shadow-sm border-start ${
              n.isRead ? "border-success" : "border-warning"
            }`}
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <Card.Title
                    className={`fw-bold ${
                      n.isRead ? "text-secondary" : "text-dark"
                    }`}
                  >
                    {n.title || "Уведомление"}
                  </Card.Title>

                  {/* 🔹 Активная ссылка на источник уведомления */}
                  <Card.Text className="mb-2 text-muted">
                    {n.link ? (
                      <button
                        onClick={() => navigate(n.link)}
                        className="btn btn-link p-0 text-primary fw-semibold text-decoration-none"
                      >
                        {n.message || "Перейти к событию"}
                      </button>
                    ) : (
                      n.message
                    )}
                  </Card.Text>

                  <div className="text-xs text-gray-400 small">
                    {new Date(n.createdAt).toLocaleString("ru-RU")}
                  </div>
                </div>

                <div className="d-flex flex-column align-items-end gap-2">
                  {n.isRead ? (
                    <FaCheckCircle className="text-success fs-5" />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline-success"
                      onClick={() => markOneAsRead(n._id)}
                    >
                      Отметить
                    </Button>
                  )}

                  {/* 🆕 Кнопка удаления */}
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => setSelectedId(n._id)}
                  >
                    <FaTrashAlt /> Удалить
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))
      )}

      {/* 🆕 Модальное окно подтверждения удаления */}
      <Modal show={!!selectedId} onHide={() => setSelectedId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Удалить уведомление</Modal.Title>
        </Modal.Header>
        <Modal.Body>Вы уверены, что хотите удалить это уведомление?</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setSelectedId(null)}
            disabled={deleting}
          >
            Отмена
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteNotification(selectedId)}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner animation="border" size="sm" /> Удаление...
              </>
            ) : (
              "Удалить"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
