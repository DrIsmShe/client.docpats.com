// src/pages/admin/polyclinic/PolyclinicStatistic.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, Spinner, ButtonGroup, Button } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import { Link, useParams } from "react-router-dom";
import StatCard from "../components/StatCard";
import {
  FaUserInjured,
  FaUserMd,
  FaFileMedical,
  FaHistory,
  FaEye,
  FaTrashAlt,
  FaRecycle,
} from "react-icons/fa";

import "chart.js/auto";
import PatientsChart from "../components/PatientsChart";
import PatientsChartTable from "../components/PatientsChartTable";
import DoctorsChart from "../components/DoctorsChart";
import DoctorsChartTable from "../components/DoctorsChartTable";
import PatientsChartCountry from "../components/PatientsChartCountry";
import PatientsChartCountryTable from "../components/PatientsChartCountryTable";
/* ============================================================
   API BASE
   ============================================================ */

const API_BASE = process.env.REACT_APP_API_URL;
/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const PolyclinicStatistic = () => {
  const { userId } = useParams();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(1);
  const [activeTab, setActiveTab] = useState("patients");
  const [chartPeriod, setChartPeriod] = useState("month"); // day | week | month | year

  /* ---------- FETCH DATA ---------- */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/admin/polyclinic/get-all`, {
          withCredentials: true,
        });
        setStats(res.data);
      } catch (err) {
        console.error("Ошибка при получении статистики:", err);
        setError("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totals = stats?.total || {};
  const data = stats?.data || {};
  const patients = data.patients || [];
  const medicalHistories = data.medicalHistories || [];
  const files = data.files || [];
  const doctors = data.doctorProfiles || [];

  /* ============================================================
     ФИЛЬТРАЦИЯ
     ============================================================ */
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const list =
      { patients, medicalHistories, files, doctors }[activeTab] || [];

    return list.filter((item) => {
      if (!query) return true;

      switch (activeTab) {
        case "patients":
          return (
            item.firstName?.toLowerCase().includes(query) ||
            item.lastName?.toLowerCase().includes(query) ||
            item.email?.toLowerCase().includes(query)
          );
        case "medicalHistories":
        case "files":
          return (
            item.patientId?.firstNameEncrypted?.toLowerCase().includes(query) ||
            item.patientId?.lastNameEncrypted?.toLowerCase().includes(query)
          );
        case "doctors":
          return (
            item.user?.firstName?.toLowerCase().includes(query) ||
            item.user?.lastName?.toLowerCase().includes(query)
          );
        default:
          return true;
      }
    });
  }, [activeTab, searchQuery, patients, medicalHistories, files, doctors]);

  /* ============================================================
     ПАГИНАЦИЯ
     ============================================================ */
  const total = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  /* ============================================================
     ГРУППИРОВКА ПАЦИЕНТОВ ДЛЯ ГРАФИКА
     ============================================================ */
  const patientsGrouped = useMemo(() => {
    const grouped = {};
    patients.forEach((p) => {
      const date = new Date(p.createdAt || Date.now());
      let key = "";

      switch (chartPeriod) {
        case "day":
          key = date.toLocaleDateString("ru-RU");
          break;
        case "week": {
          const weekNum = Math.ceil(date.getDate() / 7);
          const month = date.toLocaleString("ru-RU", { month: "short" });
          key = `${weekNum}-я нед. ${month}`;
          break;
        }
        case "month":
          key = date.toLocaleString("ru-RU", {
            month: "short",
            year: "numeric",
          });
          break;
        case "year":
          key = date.getFullYear().toString();
          break;
        default:
          key = "Неизвестно";
      }

      grouped[key] = (grouped[key] || 0) + 1;
    });

    return grouped;
  }, [patients, chartPeriod]);

  const chartData = useMemo(
    () => ({
      labels: Object.keys(patientsGrouped),
      datasets: [
        {
          label:
            chartPeriod === "day"
              ? "Пациенты по дням"
              : chartPeriod === "week"
                ? "Пациенты по неделям"
                : chartPeriod === "year"
                  ? "Пациенты по годам"
                  : "Пациенты по месяцам",
          data: Object.values(patientsGrouped),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderRadius: 8,
        },
      ],
    }),
    [patientsGrouped, chartPeriod],
  );

  /* ============================================================
     ДЕЙСТВИЯ
     ============================================================ */
  /* ============================================================
   ДЕЙСТВИЯ
   ============================================================ */
  const handleView = (item, type) => {
    console.log("👁 Просмотр:", type, item._id);
  };

  /* ====== УДАЛЕНИЕ ПАЦИЕНТА ====== */
  // ⚙️ Старое удаление временно отключено, но нужно для других таблиц
  const handleDelete = async (item, type) => {
    console.log(`🗑 Попытка удалить ${type}:`, item._id);
    alert(
      "Удаление временно отключено. Используйте Архивировать / Восстановить.",
    );
  };

  /* ====== АРХИВИРОВАНИЕ И ВОССТАНОВЛЕНИЕ ====== */
  const handleArchive = async (patient) => {
    const confirmed = window.confirm(
      `Архивировать пациента ${patient.firstName || ""} ${
        patient.lastName || ""
      }?`,
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(
        `${API_BASE}/admin/polyclinic-patient-delete/${patient._id}`,
        { withCredentials: true },
      );
      if (res.data.success) {
        setStats((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            patients: prev.data.patients.map((p) =>
              p._id === patient._id ? { ...p, isDeleted: true } : p,
            ),
          },
        }));
        alert("Пациент перемещён в архив ✅");
      }
    } catch (err) {
      console.error("Ошибка при архивировании пациента:", err);
      alert("Ошибка при архивировании ❌");
    }
  };

  const handleRestore = async (patient) => {
    const confirmed = window.confirm(
      `Восстановить пациента ${patient.firstName || ""} ${
        patient.lastName || ""
      }?`,
    );
    if (!confirmed) return;

    try {
      const res = await axios.patch(
        `${API_BASE}/admin/polyclinic-patient-delete/restore/${patient._id}`,
        {},
        { withCredentials: true },
      );
      if (res.data.success) {
        setStats((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            patients: prev.data.patients.map((p) =>
              p._id === patient._id ? { ...p, isDeleted: false } : p,
            ),
          },
        }));
        alert("Пациент восстановлен из архива ♻️");
      }
    } catch (err) {
      console.error("Ошибка при восстановлении пациента:", err);
      alert("Ошибка при восстановлении ❌");
    }
  };

  /* ============================================================
     СОСТОЯНИЯ
     ============================================================ */
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  if (error || !stats?.success)
    return (
      <div className="alert alert-danger text-center mt-5">
        {error || "Ошибка при загрузке данных"}
      </div>
    );

  /* ============================================================
     UI
     ============================================================ */
  return (
    <div className="container-fluid mt-4">
      <h2 className="text-center mb-4 fw-bold text-primary">
        📊 Статистика и данные поликлиники
      </h2>
      {/* ===== Карточки ===== */}
      <div className="row g-4 mb-5">
        <StatCard
          icon={<FaUserInjured className="fs-1 text-primary mb-2" />}
          label="Пациенты"
          value={totals.patients}
        />
        <StatCard
          icon={<FaHistory className="fs-1 text-success mb-2" />}
          label="Истории болезней"
          value={totals.medicalHistories}
        />
        <StatCard
          icon={<FaFileMedical className="fs-1 text-danger mb-2" />}
          label="Файлы"
          value={totals.files}
        />
        <StatCard
          icon={<FaUserMd className="fs-1 text-warning mb-2" />}
          label="Врачи"
          value={totals.doctorProfiles}
        />
      </div>
      {/* ===== Вкладки ===== */}
      <div className="d-flex justify-content-center mb-4">
        <ButtonGroup>
          {[
            ["patients", "Пациенты"],
            ["medicalHistories", "Истории болезней"],
            ["files", "Файлы"],
            ["doctors", "Врачи"],
          ].map(([key, label]) => (
            <Button
              key={key}
              variant={activeTab === key ? "primary" : "outline-primary"}
              onClick={() => {
                setActiveTab(key);
                setPage(1);
              }}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>
      </div>
      {/* ===== Поиск ===== */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="position-relative" style={{ width: "50%" }}>
          <span style={{ position: "absolute", left: 10, top: 10 }}>🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 35, borderRadius: 10 }}
          />
        </div>
      </div>
      {/* ===== Таблицы ===== */}
      <div className="table-responsive">
        {activeTab === "patients" && (
          <PatientsTable
            rows={pageRows}
            page={page}
            pageSize={pageSize}
            onView={handleView}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onRestore={handleRestore}
          />
        )}
        {activeTab === "medicalHistories" && (
          <HistoriesTable
            rows={pageRows}
            page={page}
            pageSize={pageSize}
            onView={handleView}
            onDelete={handleDelete}
          />
        )}
        {activeTab === "files" && (
          <FilesTable
            rows={pageRows}
            page={page}
            pageSize={pageSize}
            onView={handleView}
            onDelete={handleDelete}
          />
        )}
        {activeTab === "doctors" && (
          <DoctorsTable
            rows={pageRows}
            page={page}
            pageSize={pageSize}
            onView={handleView}
            onDelete={handleDelete}
          />
        )}
      </div>
      {/* ===== Пагинация ===== */}
      <Pagination
        total={total}
        totalPages={totalPages}
        currentPage={currentPage}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        onPage={(n) => setPage(n)}
      />
      {/* ===== График ===== */}
      {/* ===== График ===== */}
      <div className="flex flex-wrap justify-between gap-4">
        <div className="w-full md:w-1/2">
          <PatientsChartTable />
        </div>
        <div className="w-full md:w-1/2">
          <PatientsChartCountryTable />
        </div>

        <div className="w-full md:w-1/2">
          <DoctorsChartTable />
        </div>
      </div>
      <PatientsChart
        chartPeriod={chartPeriod}
        setChartPeriod={setChartPeriod}
        patientsGrouped={patientsGrouped}
        chartData={chartData}
      />
      <DoctorsChart
        chartPeriod={chartPeriod}
        setChartPeriod={setChartPeriod}
        patientsGrouped={patientsGrouped}
        chartData={chartData}
      />

      <PatientsChartCountry
        chartPeriod={chartPeriod}
        setChartPeriod={setChartPeriod}
        patientsGrouped={patientsGrouped}
        chartData={chartData}
      />
    </div>
  );
};

/* ============================================================
   SUBCOMPONENTS
   ============================================================ */

const Actions = ({ item, type, onView, onDelete, onArchive, onRestore }) => (
  <div className="d-flex justify-content-center gap-2">
    <button
      className="btn btn-sm btn-outline-primary"
      title="Просмотр"
      onClick={() => onView(item, type)}
    >
      <FaEye />
    </button>

    {type === "patient" &&
      (item.isDeleted ? (
        <button
          className="btn btn-sm btn-outline-success"
          title="Восстановить"
          onClick={() => onRestore(item)}
        >
          <FaRecycle />
        </button>
      ) : (
        <button
          className="btn btn-sm btn-outline-danger"
          title="Архивировать"
          onClick={() => onArchive(item)}
        >
          <FaTrashAlt />
        </button>
      ))}
  </div>
);

const PatientsTable = ({
  rows,
  page,
  pageSize,
  onView,
  onDelete,
  onArchive,
  onRestore,
}) => (
  <table className="table table-hover align-middle">
    <thead className="table-light">
      <tr>
        <th>№</th>
        <th>Имя</th>
        <th>Email</th>
        <th>Врач</th>
        <th>Статус</th> {/* ← добавь */}
        <th>Дата создания</th>
        <th className="text-center">Действия</th>
      </tr>
    </thead>

    <tbody>
      {rows.length ? (
        rows.map((p, i) => (
          <tr key={p._id}>
            <td>{(page - 1) * pageSize + i + 1}</td>
            <td>
              <Link
                to={`/admin/patient-detail/${p._id}`}
                className="text-decoration-none text-primary fw-semibold"
              >
                {p.firstName || "—"} {p.lastName || ""}
              </Link>
            </td>
            <td>{p.email || "—"}</td>
            <td>
              {p.doctors?.length ? (
                <Link
                  to={`/admin/user-detail/${p.doctors[0]?._id}`}
                  className="text-decoration-none text-success fw-semibold"
                >
                  {p.doctors[0]?.firstName || "—"}{" "}
                  {p.doctors[0]?.lastName || ""}
                </Link>
              ) : (
                "—"
              )}
            </td>
            <td>
              {p.isDeleted ? (
                <span className="badge bg-secondary">Архив</span>
              ) : (
                <span className="badge bg-success">Активен</span>
              )}
            </td>

            <td>
              {p.createdAt
                ? new Date(p.createdAt).toLocaleDateString("ru-RU")
                : "—"}
            </td>
            <td>
              <Actions
                item={p}
                type="patient"
                onView={onView}
                onDelete={onDelete}
                onArchive={onArchive}
                onRestore={onRestore}
              />
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="6" className="text-center text-muted py-3">
            Нет пациентов
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

const HistoriesTable = ({ rows, page, pageSize, onView, onDelete }) => (
  <table className="table table-hover align-middle">
    <thead className="table-light">
      <tr>
        <th>№</th>
        <th>Пациент</th>
        <th>Врач</th>
        <th>Диагноз</th>
        <th>Дата</th>
        <th className="text-center">Действия</th>
      </tr>
    </thead>
    <tbody>
      {rows.length ? (
        rows.map((h, i) => (
          <tr key={h._id}>
            <td>{(page - 1) * pageSize + i + 1}</td>
            <td>{h.patientId?.firstNameEncrypted || "—"}</td>
            <td>{h.doctorId?.username || "—"}</td>
            <td>{h.diagnosis || "—"}</td>
            <td>
              {h.createdAt
                ? new Date(h.createdAt).toLocaleDateString("ru-RU")
                : "—"}
            </td>
            <td>
              <Actions
                item={h}
                type="history"
                onView={onView}
                onDelete={onDelete}
              />
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="6" className="text-center text-muted py-3">
            Нет историй
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

const FilesTable = ({ rows, page, pageSize, onView, onDelete }) => (
  <table className="table table-hover align-middle">
    <thead className="table-light">
      <tr>
        <th>№</th>
        <th>Пациент</th>
        <th>Тип</th>
        <th>Загружено врачом</th>
        <th>Дата</th>
        <th className="text-center">Действия</th>
      </tr>
    </thead>
    <tbody>
      {rows.length ? (
        rows.map((f, i) => (
          <tr key={f._id}>
            <td>{(page - 1) * pageSize + i + 1}</td>
            <td>{f.patientId?.firstNameEncrypted || "—"}</td>
            <td>{f.fileType || "—"}</td>
            <td>{f.uploadedByDoctor?.username || "—"}</td>
            <td>
              {f.createdAt
                ? new Date(f.createdAt).toLocaleDateString("ru-RU")
                : "—"}
            </td>
            <td>
              <Actions
                item={f}
                type="file"
                onView={onView}
                onDelete={onDelete}
              />
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="6" className="text-center text-muted py-3">
            Нет файлов
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

const DoctorsTable = ({ rows = [], page, pageSize, onView, onDelete }) => {
  const safeRows = rows.filter((p) => p && p._id);

  return (
    <table className="table table-hover align-middle">
      <thead className="table-light">
        <tr>
          <th>№</th>
          <th>Имя</th>
          <th>Email</th>
          <th>Специализация</th>
          <th>Роль</th>
          <th className="text-center">Действия</th>
        </tr>
      </thead>

      <tbody>
        {safeRows.length ? (
          safeRows.map((p, i) => (
            <tr key={p._id}>
              <td>{(page - 1) * pageSize + i + 1}</td>

              <td>
                {p.user ? (
                  <Link to={`/admin/user-detail/${p.user._id}`}>
                    {p.user.firstName || "—"} {p.user.lastName || ""}
                  </Link>
                ) : (
                  <span className="text-muted">Пользователь удалён</span>
                )}
              </td>

              <td>{p.user?.email || "—"}</td>
              <td>{p.specialty || "—"}</td>
              <td>{p.user?.role || "—"}</td>

              <td>
                <Actions
                  item={p}
                  type="doctor"
                  onView={onView}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="text-center text-muted py-3">
              Нет врачей
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

const Pagination = ({
  total,
  totalPages,
  currentPage,
  onPrev,
  onNext,
  onPage,
}) => (
  <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
    <div className="text-muted small">
      Показано {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, total)}{" "}
      из {total}
    </div>
    <div>
      <button
        className="btn btn-sm btn-light me-2"
        disabled={currentPage <= 1}
        onClick={onPrev}
      >
        ← Назад
      </button>
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          onClick={() => onPage(i + 1)}
          className={`btn btn-sm ${
            i + 1 === currentPage ? "btn-primary" : "btn-outline-secondary"
          } me-1`}
        >
          {i + 1}
        </button>
      ))}
      <button
        className="btn btn-sm btn-light"
        disabled={currentPage >= totalPages}
        onClick={onNext}
      >
        Вперёд →
      </button>
    </div>
  </div>
);

export default PolyclinicStatistic;
