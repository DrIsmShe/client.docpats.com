// client/src/pages/admin/entities/AdminDoctorsPage.jsx
//
// Admin: обзор врачей + сводка приёмов + рассылка системных уведомлений.
// Только админ. GET /admin/doctors, /admin/appointments-overview,
// POST /admin/notifications/broadcast.

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [total, setTotal] = useState(0);
  const [appts, setAppts] = useState(null);
  const [q, setQ] = useState("");
  const [verified, setVerified] = useState("");
  const [error, setError] = useState(null);

  // broadcast
  const [bTitle, setBTitle] = useState("");
  const [bMsg, setBMsg] = useState("");
  const [bRole, setBRole] = useState("");
  const [bResult, setBResult] = useState(null);
  const [bBusy, setBBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (verified) params.set("verified", verified);
      const [d, a] = await Promise.all([
        axios.get(`${API_BASE}/admin/doctors?${params.toString()}`, {
          withCredentials: true,
        }),
        axios.get(`${API_BASE}/admin/appointments-overview`, {
          withCredentials: true,
        }),
      ]);
      setDoctors(d.data.doctors || []);
      setTotal(d.data.total || 0);
      setAppts(a.data);
    } catch (e) {
      setError(
        e.response?.status === 403
          ? "Доступ только для администратора."
          : "Не удалось загрузить данные.",
      );
    }
  }, [q, verified]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendBroadcast(e) {
    e.preventDefault();
    setBBusy(true);
    setBResult(null);
    try {
      const r = await axios.post(
        `${API_BASE}/admin/notifications/broadcast`,
        { title: bTitle, message: bMsg, role: bRole || undefined },
        { withCredentials: true },
      );
      setBResult(`Отправлено ${r.data.recipients} получателям.`);
      setBTitle("");
      setBMsg("");
    } catch (e) {
      setBResult(e.response?.data?.message || "Ошибка отправки.");
    } finally {
      setBBusy(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Врачи и приёмы</h1>

      {appts && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          {[
            ["Приёмы (клиники)", appts.clinic.total],
            ["Запланировано", appts.clinic.scheduled],
            ["Завершено", appts.clinic.completed],
            ["Отменено", appts.clinic.cancelled],
            ["Приёмы (legacy)", appts.legacy.total],
          ].map(([l, v]) => (
            <div key={l} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Broadcast */}
      <form onSubmit={sendBroadcast} style={broadcastBox}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Рассылка уведомления</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <input
            value={bTitle}
            onChange={(e) => setBTitle(e.target.value)}
            placeholder="Заголовок"
            style={{ ...input, flex: 1, minWidth: 200 }}
          />
          <select value={bRole} onChange={(e) => setBRole(e.target.value)} style={input}>
            <option value="">Всем</option>
            <option value="doctor">Только врачам</option>
            <option value="patient">Только пациентам</option>
          </select>
        </div>
        <textarea
          value={bMsg}
          onChange={(e) => setBMsg(e.target.value)}
          placeholder="Текст уведомления"
          rows={2}
          style={{ ...input, width: "100%", marginBottom: 8, resize: "vertical" }}
        />
        <button type="submit" disabled={bBusy} style={btn}>
          {bBusy ? "Отправка…" : "Отправить"}
        </button>
        {bResult && (
          <span style={{ marginLeft: 12, color: "#067647" }}>{bResult}</span>
        )}
      </form>

      <div style={{ display: "flex", gap: 8, margin: "20px 0 12px", flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск врача (username)"
          style={input}
        />
        <select value={verified} onChange={(e) => setVerified(e.target.value)} style={input}>
          <option value="">Все</option>
          <option value="true">Верифицированные</option>
          <option value="false">Не верифиц.</option>
        </select>
        <button onClick={load} style={btn}>
          Обновить
        </button>
      </div>

      {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
              <th style={th}>Имя</th>
              <th style={th}>Email</th>
              <th style={th}>Специализация</th>
              <th style={th}>Вериф.</th>
              <th style={th}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d._id} style={{ borderBottom: "1px solid #eef2f7" }}>
                <td style={td}>
                  {[d.firstName, d.lastName].filter(Boolean).join(" ") ||
                    d.username}
                </td>
                <td style={{ ...td, color: "#64748b" }}>{d.email || "—"}</td>
                <td style={td}>{d.specialization || "—"}</td>
                <td style={td}>{d.isVerified ? "✓" : "—"}</td>
                <td style={{ ...td, color: d.isBlocked ? "#b91c1c" : "#067647" }}>
                  {d.isBlocked ? "заблок." : "активен"}
                </td>
              </tr>
            ))}
            {doctors.length === 0 && (
              <tr>
                <td style={td} colSpan={5}>
                  Врачи не найдены.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>
          Показано {doctors.length} из {total}
        </div>
      </div>
    </div>
  );
}

const card = {
  background: "#fff",
  border: "1px solid #e6eaf0",
  borderRadius: 10,
  padding: "12px 18px",
  minWidth: 130,
};
const broadcastBox = {
  background: "#f8fafc",
  border: "1px solid #e6eaf0",
  borderRadius: 10,
  padding: 16,
};
const input = {
  padding: "8px 10px",
  border: "1px solid #d9dfe8",
  borderRadius: 8,
  fontSize: 14,
};
const btn = {
  padding: "8px 16px",
  background: "#3d7fff",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};
const th = { padding: "8px 10px", fontWeight: 600, color: "#3b445a" };
const td = { padding: "8px 10px" };
