// client/src/pages/admin/overview/AdminDashboardPage.jsx
//
// Сводный дашборд платформы: счётчики по всем ключевым модулям. Только админ.
// Данные с GET /admin/overview (requireAdmin).

import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

function Group({ title, items }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 15, color: "#3b445a", margin: "0 0 10px" }}>{title}</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {items.map(([label, val]) => (
          <div key={label} style={card}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{val ?? 0}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/admin/overview`, { withCredentials: true })
      .then((r) => setData(r.data))
      .catch((e) =>
        setError(
          e.response?.status === 403
            ? "Доступ только для администратора."
            : "Не удалось загрузить дашборд.",
        ),
      );
  }, []);

  if (error) return <div style={{ padding: 20, color: "#b91c1c" }}>{error}</div>;
  if (!data) return <div style={{ padding: 20 }}>Загрузка…</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Обзор платформы</h1>

      <Group
        title="Пользователи"
        items={[
          ["Всего", data.users.total],
          ["Врачи", data.users.doctors],
          ["Пациенты", data.users.patients],
          ["Админы", data.users.admins],
        ]}
      />
      <Group
        title="Клиники"
        items={[
          ["Всего", data.clinics.total],
          ["Активных", data.clinics.active],
          ["Заблокир.", data.clinics.blocked],
          ["Участники", data.clinics.memberships],
          ["Пациенты клиник", data.clinics.patients],
          ["Приёмы", data.clinics.appointments],
          ["Консилиумы", data.clinics.consilia],
          ["Телемед", data.clinics.telemed],
        ]}
      />
      <Group
        title="Профили"
        items={[
          ["Профили врачей", data.profiles.doctorProfiles],
          ["Профили пациентов", data.profiles.patientProfiles],
          ["Пациенты поликлиники", data.profiles.polyclinicPatients],
        ]}
      />
      <Group
        title="Контент"
        items={[
          ["Статьи", data.content.articles],
          ["Отзывы", data.content.reviews],
          ["AI-консультации", data.content.consultations],
        ]}
      />
      <Group
        title="Прочее"
        items={[
          ["Уведомления", data.other.notifications],
          ["Симуляции", data.other.simulations],
          ["Лиды", data.other.leads],
          ["Записей аудита", data.other.auditLogs],
        ]}
      />
    </div>
  );
}

const card = {
  background: "#fff",
  border: "1px solid #e6eaf0",
  borderRadius: 10,
  padding: "14px 20px",
  minWidth: 120,
};
