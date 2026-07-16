// client/src/pages/admin/ops/AdminVerificationPage.jsx
//
// п.1 Очередь верификации врачей: список ожидающих + документы + одобрить/отклонить.
// GET /admin/verification-queue, PUT /admin/verification/doctor/:profileId.

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

export default function AdminVerificationPage() {
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [comment, setComment] = useState({});

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await axios.get(`${API_BASE}/admin/verification-queue`, {
        withCredentials: true,
      });
      setQueue(r.data.queue || []);
    } catch (e) {
      setError(
        e.response?.status === 403
          ? "Доступ только для администратора."
          : "Не удалось загрузить очередь.",
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(profileId, status) {
    setBusy(profileId);
    try {
      await axios.put(
        `${API_BASE}/admin/verification/doctor/${profileId}`,
        { status, comment: comment[profileId] || "" },
        { withCredentials: true },
      );
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Не удалось изменить статус.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Верификация врачей</h1>
      <p style={{ color: "#64748b", marginBottom: 20 }}>
        Ожидают проверки: <b>{queue.length}</b>
      </p>

      {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>}

      {queue.length === 0 ? (
        <div style={{ color: "#64748b" }}>Очередь пуста — все заявки обработаны.</div>
      ) : (
        queue.map((d) => (
          <div key={d.profileId} style={cardBox}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {[d.firstName, d.lastName].filter(Boolean).join(" ") || d.username}
                </div>
                <div style={{ color: "#64748b", fontSize: 13 }}>{d.email}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {d.specialization || "—"} · {d.education || "—"} · {d.country || "—"}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                подано: {d.submittedAt ? new Date(d.submittedAt).toLocaleDateString("ru") : "—"}
              </div>
            </div>

            <div style={{ margin: "10px 0" }}>
              <b style={{ fontSize: 13 }}>Документы ({d.documentsCount}):</b>{" "}
              {d.documents.length === 0 ? (
                <span style={{ color: "#b45309" }}>не приложены</span>
              ) : (
                d.documents.map((url, i) => (
                  <a
                    key={i}
                    href={url.startsWith("http") ? url : `${API_BASE}${url}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginRight: 10, color: "#3d7fff" }}
                  >
                    Документ {i + 1}
                  </a>
                ))
              )}
            </div>

            <input
              value={comment[d.profileId] || ""}
              onChange={(e) =>
                setComment((p) => ({ ...p, [d.profileId]: e.target.value }))
              }
              placeholder="Комментарий (для отклонения)"
              style={{ ...input, width: "100%", marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => decide(d.profileId, "approved")}
                disabled={busy === d.profileId}
                style={{ ...btn, background: "#067647" }}
              >
                Одобрить
              </button>
              <button
                onClick={() => decide(d.profileId, "rejected")}
                disabled={busy === d.profileId}
                style={{ ...btn, background: "#b91c1c" }}
              >
                Отклонить
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const cardBox = {
  background: "#fff",
  border: "1px solid #e6eaf0",
  borderRadius: 10,
  padding: 16,
  marginBottom: 14,
};
const input = {
  padding: "8px 10px",
  border: "1px solid #d9dfe8",
  borderRadius: 8,
  fontSize: 14,
};
const btn = {
  padding: "8px 18px",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
};
