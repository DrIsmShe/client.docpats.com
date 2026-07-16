// client/src/pages/admin/overview/AdminAuditPage.jsx
//
// Просмотр HIPAA аудит-лога платформы (кто/что/когда). Только админ.
// GET /admin/audit-log с фильтрами. metadata по правилам проекта без PHI.

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

const OUTCOMES = ["success", "failure", "denied"];

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [outcome, setOutcome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (action.trim()) params.set("action", action.trim());
      if (resourceType.trim()) params.set("resourceType", resourceType.trim());
      if (outcome) params.set("outcome", outcome);
      const r = await axios.get(
        `${API_BASE}/admin/audit-log?${params.toString()}`,
        { withCredentials: true },
      );
      setLogs(r.data.logs || []);
      setTotal(r.data.total || 0);
    } catch (e) {
      setError(
        e.response?.status === 403
          ? "Доступ только для администратора."
          : "Не удалось загрузить аудит-лог.",
      );
    } finally {
      setLoading(false);
    }
  }, [action, resourceType, outcome]);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (d) => {
    try {
      return new Date(d).toLocaleString("ru");
    } catch {
      return d;
    }
  };
  const color = (o) =>
    o === "success" ? "#067647" : o === "denied" ? "#b45309" : "#b91c1c";

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>HIPAA аудит-лог</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Действие (напр. auth.login)"
          style={input}
        />
        <input
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          placeholder="Тип ресурса (напр. clinic-patient)"
          style={input}
        />
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)} style={input}>
          <option value="">Любой исход</option>
          {OUTCOMES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <button onClick={load} style={btn}>
          Обновить
        </button>
      </div>

      {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>}
      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th style={th}>Время</th>
                <th style={th}>Действие</th>
                <th style={th}>Ресурс</th>
                <th style={th}>Пользователь</th>
                <th style={th}>Роль</th>
                <th style={th}>Исход</th>
                <th style={th}>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} style={{ borderBottom: "1px solid #eef2f7" }}>
                  <td style={td}>{fmt(l.createdAt)}</td>
                  <td style={td}>{l.action}</td>
                  <td style={td}>
                    {l.resourceType}
                    {l.resourceId ? ` #${l.resourceId.slice(-6)}` : ""}
                  </td>
                  <td style={{ ...td, color: "#64748b" }}>
                    {l.userId ? l.userId.slice(-6) : "—"}
                  </td>
                  <td style={td}>{l.actorRole || "—"}</td>
                  <td style={{ ...td, color: color(l.outcome), fontWeight: 600 }}>
                    {l.outcome}
                    {l.failureReason ? ` (${l.failureReason})` : ""}
                  </td>
                  <td style={{ ...td, color: "#64748b" }}>{l.ipAddress || "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td style={td} colSpan={7}>
                    Записи не найдены.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>
            Показано {logs.length} из {total}
          </div>
        </div>
      )}
    </div>
  );
}

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
const td = { padding: "6px 10px" };
