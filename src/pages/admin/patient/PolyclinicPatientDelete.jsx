// src/pages/admin/polyclinic/PolyclinicPatientDelete.jsx
import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";
import { FaTrashAlt, FaArrowLeft } from "react-icons/fa";

const API_BASE = process.env.REACT_APP_API_URL;

const PolyclinicPatientDelete = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.delete(
        `${API_BASE}/admin/polyclinic-patient-delete/${id}`,
        { withCredentials: true }
      );

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => navigate("/admin/polyclinic/get-all"), 2000);
      } else {
        setError(res.data.message || "Не удалось удалить пациента.");
      }
    } catch (err) {
      console.error("Ошибка при удалении пациента:", err);
      setError(
        err.response?.data?.message || "Ошибка при удалении пациента с сервера."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <Modal
        show={showModal}
        onHide={() => navigate(-1)}
        centered
        backdrop="static"
        keyboard={false}
        className="rounded-4 shadow-lg"
      >
        <Modal.Header
          closeButton
          className="bg-danger text-white rounded-top-4"
        >
          <Modal.Title className="fw-bold">
            <FaTrashAlt className="me-2" />
            Удалить пациента
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          {error && (
            <Alert variant="danger" className="rounded-3 mb-3">
              {error}
            </Alert>
          )}
          {success ? (
            <Alert variant="success" className="rounded-3">
              Пациент успешно удалён.
            </Alert>
          ) : (
            <p className="fs-5 text-secondary text-center">
              Вы действительно хотите удалить этого пациента из поликлиники?
              <br />
              Это действие <strong>нельзя будет отменить</strong>.
            </p>
          )}
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between bg-light rounded-bottom-4">
          <Button
            variant="secondary"
            className="rounded-pill px-4"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            <FaArrowLeft className="me-2" />
            Назад
          </Button>
          <Button
            variant="danger"
            className="rounded-pill px-4"
            onClick={handleDelete}
            disabled={loading || success}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Удаление...
              </>
            ) : (
              <>
                <FaTrashAlt className="me-2" />
                Удалить
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PolyclinicPatientDelete;
