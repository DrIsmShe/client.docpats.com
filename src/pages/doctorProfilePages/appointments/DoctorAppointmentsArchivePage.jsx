import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spinner, Alert, Table, Card, Badge, Button } from "react-bootstrap";
import { FaArchive, FaRedo } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function DoctorAppointmentsArchivePage() {
  const { t } = useTranslation();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/schedule/appointment/archived`, {
        withCredentials: true,
      });
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error("Ошибка загрузки архива:", err);
      setError(t("doctor_archive.load_error"));
    } finally {
      setLoading(false);
    }
  };

  const unarchiveAppointment = async (id) => {
    if (!window.confirm(t("doctor_archive.restore_confirm"))) return;

    try {
      await axios.put(
        `${API_BASE}/schedule/appointment/unarchive/${id}`,
        {},
        { withCredentials: true }
      );

      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Ошибка разархивирования:", err);
      alert(t("doctor_archive.restore_error"));
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <Card className="shadow-lg border-0 rounded-4 p-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary mb-0">
          <FaArchive className="me-2" />
          {t("doctor_archive.title")}
        </h3>

        <Button variant="outline-secondary" size="sm" onClick={fetchArchived}>
          <FaRedo className="me-1" /> {t("doctor_archive.refresh")}
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {appointments.length === 0 ? (
        <Alert variant="info" className="text-center">
          {t("doctor_archive.empty")}
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table bordered hover className="align-middle text-center">
            <thead className="table-light">
              <tr>
                <th>{t("doctor_archive.patient")}</th>
                <th>{t("doctor_archive.date")}</th>
                <th>{t("doctor_archive.type")}</th>
                <th>{t("doctor_archive.archived_at")}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {appointments.map((a) => (
                <tr key={a._id}>
                  <td>
                    {`${a?.patient?.firstNameEncrypted ?? ""} ${
                      a?.patient?.lastNameEncrypted ?? ""
                    }`}
                  </td>

                  <td>
                    {new Date(a.endsAt).toLocaleString(undefined, {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td>
                    <Badge bg={a.type === "video" ? "success" : "primary"}>
                      {a.type === "video"
                        ? t("doctor_archive.type_online")
                        : t("doctor_archive.type_offline")}
                    </Badge>
                  </td>

                  <td>
                    <Badge bg="secondary">
                      {new Date(a.archivedAt).toLocaleDateString(undefined)}
                    </Badge>
                  </td>

                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => unarchiveAppointment(a._id)}
                    >
                      {t("doctor_archive.restore")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Card>
  );
}
