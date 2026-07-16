// client/src/pages/admin/ops/AdminReviewsPage.jsx
//
// п.3 Модерация отзывов о клиниках. GET /admin/reviews, PATCH /admin/reviews/:id.

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const qs = status ? `?status=${status}` : "";
      const r = await axios.get(`${API_BASE}/admin/reviews${qs}`, {
        withCredentials: true,
      });
      setReviews(r.data.reviews || []);
    } catch (e) {
      setError(
        e.response?.status === 403
          ? "Доступ только для администратора."
          : "Не удалось загрузить отзывы.",
      );
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function moderate(id, action) {
    setBusy(id);
    try {
      await axios.patch(
        `${API_BASE}/admin/reviews/${id}`,
        { action },
        { withCredentials: true },
      );
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Действие не выполнено.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Модерация отзывов</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={input}>
          <option value="">Все</option>
          <option value="pending">На модерации</option>
          <option value="approved">Одобренные</option>
          <option value="rejected">Отклонённые</option>
        </select>
        <button onClick={load} style={btn}>Обновить</button>
      </div>

      {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>}

      {reviews.length === 0 ? (
        <div style={{ color: "#64748b" }}>Отзывы не найдены.</div>
      ) : (
        reviews.map((r) => (
          <div key={r._id} style={cardBox}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <b>{r.clinicName || "—"}</b>{" "}
                <span style={{ color: "#f59e0b" }}>{"★".repeat(r.rating || 0)}</span>
                {r.hasPending && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#b45309" }}>
                    есть правка на модерации
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: statusColor(r.status) }}>{r.status}</span>
            </div>
            <div style={{ margin: "8px 0", color: "#334155" }}>{r.text || "—"}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => moderate(r._id, "approve")} disabled={busy === r._id} style={{ ...smallBtn, color: "#067647" }}>Одобрить</button>
              <button onClick={() => moderate(r._id, "reject")} disabled={busy === r._id} style={{ ...smallBtn, color: "#b45309" }}>Отклонить</button>
              <button onClick={() => moderate(r._id, "hide")} disabled={busy === r._id} style={{ ...smallBtn, color: "#b91c1c" }}>Скрыть</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const statusColor = (s) => (s === "approved" ? "#067647" : s === "rejected" ? "#b91c1c" : "#b45309");
const cardBox = { background: "#fff", border: "1px solid #e6eaf0", borderRadius: 10, padding: 16, marginBottom: 12 };
const input = { padding: "8px 10px", border: "1px solid #d9dfe8", borderRadius: 8, fontSize: 14 };
const btn = { padding: "8px 16px", background: "#3d7fff", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };
const smallBtn = { padding: "4px 12px", background: "#fff", border: "1px solid #d9dfe8", borderRadius: 6, cursor: "pointer", fontSize: 13 };
