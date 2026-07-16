// client/src/pages/admin/ops/AdminSystemPage.jsx
//
// п.5 Статус системы: MongoDB, Redis, размеры коллекций, uptime.
// GET /admin/system-health.

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

export default function AdminSystemPage() {
  const [h, setH] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await axios.get(`${API_BASE}/admin/system-health`, {
        withCredentials: true,
      });
      setH(r.data);
    } catch (e) {
      setError(
        e.response?.status === 403
          ? "Доступ только для администратора."
          : "Не удалось загрузить статус.",
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dot = (ok) => (
    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: ok ? "#067647" : "#b91c1c", marginRight: 8 }} />
  );

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>Статус системы</h1>
        <button onClick={load} style={btn}>Обновить</button>
      </div>

      {error && <div style={{ color: "#b91c1c", margin: "12px 0" }}>{error}</div>}
      {!h ? (
        <div style={{ marginTop: 16 }}>Загрузка…</div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div style={row}>
            {dot(h.mongo?.ok)} <b style={{ width: 120 }}>MongoDB</b>
            <span style={{ color: "#64748b" }}>{h.mongo?.state}</span>
          </div>
          <div style={row}>
            {dot(h.redis?.ok)} <b style={{ width: 120 }}>Redis</b>
            <span style={{ color: "#64748b" }}>{h.redis?.reply}</span>
          </div>
          <div style={{ ...row, borderBottom: "none" }}>
            <b style={{ width: 130 }}>Node / uptime</b>
            <span style={{ color: "#64748b" }}>
              {h.node} · {Math.floor((h.uptimeSec || 0) / 3600)}ч {Math.floor(((h.uptimeSec || 0) % 3600) / 60)}м
            </span>
          </div>

          <h2 style={{ fontSize: 15, margin: "24px 0 10px" }}>Размеры коллекций</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.entries(h.collections || {}).map(([name, count]) => (
              <div key={name} style={card}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{count ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const row = { display: "flex", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #eef2f7" };
const card = { background: "#fff", border: "1px solid #e6eaf0", borderRadius: 10, padding: "12px 16px", minWidth: 120 };
const btn = { padding: "8px 16px", background: "#3d7fff", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };
