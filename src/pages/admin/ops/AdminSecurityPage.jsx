// client/src/pages/admin/ops/AdminSecurityPage.jsx
//
// п.2 Дашборд безопасности: отказы доступа, неудачные входы, блокировки,
// топ-акторы по denied, последние отказы. GET /admin/security-dashboard.

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

export default function AdminSecurityPage() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(7);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await axios.get(
        `${API_BASE}/admin/security-dashboard?days=${days}`,
        { withCredentials: true },
      );
      setData(r.data);
    } catch (e) {
      setError(
        e.response?.status === 403
          ? "Доступ только для администратора."
          : "Не удалось загрузить дашборд.",
      );
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: 22 }}>Безопасность</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={input}>
          <option value={1}>За 24 часа</option>
          <option value={7}>За 7 дней</option>
          <option value={30}>За 30 дней</option>
        </select>
      </div>

      {error && <div style={{ color: "#b91c1c", margin: "12px 0" }}>{error}</div>}
      {!data ? (
        <div style={{ marginTop: 16 }}>Загрузка…</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0 24px" }}>
            {[
              ["Отказы доступа", data.counters.deniedTotal, "#b45309"],
              ["Неудачные входы", data.counters.failedLogins, "#b91c1c"],
              ["Блокировки", data.counters.accountsLocked, "#b91c1c"],
              ["Сбои", data.counters.failuresTotal, "#64748b"],
            ].map(([l, v, color]) => (
              <div key={l} style={card}>
                <div style={{ fontSize: 26, fontWeight: 700, color }}>{v}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{l}</div>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Топ по отказам доступа</h2>
          {data.topDeniedActors.length === 0 ? (
            <div style={{ color: "#64748b", marginBottom: 20 }}>Нет отказов за период.</div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              {data.topDeniedActors.map((a) => (
                <div key={a.userId} style={{ display: "flex", gap: 12, padding: "4px 0" }}>
                  <span style={{ color: "#64748b", width: 120 }}>
                    {a.userId === "anon" ? "аноним" : a.userId.slice(-8)}
                  </span>
                  <b style={{ color: "#b45309" }}>{a.count} отказов</b>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Последние отказы</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={th}>Время</th>
                  <th style={th}>Действие</th>
                  <th style={th}>Ресурс</th>
                  <th style={th}>Причина</th>
                  <th style={th}>IP</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDenied.map((r) => (
                  <tr key={r._id} style={{ borderBottom: "1px solid #eef2f7" }}>
                    <td style={td}>{new Date(r.createdAt).toLocaleString("ru")}</td>
                    <td style={td}>{r.action}</td>
                    <td style={td}>{r.resourceType}</td>
                    <td style={{ ...td, color: "#b45309" }}>{r.failureReason || "—"}</td>
                    <td style={{ ...td, color: "#64748b" }}>{r.ipAddress || "—"}</td>
                  </tr>
                ))}
                {data.recentDenied.length === 0 && (
                  <tr>
                    <td style={td} colSpan={5}>Отказов нет.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const card = { background: "#fff", border: "1px solid #e6eaf0", borderRadius: 10, padding: "14px 20px", minWidth: 130 };
const input = { padding: "8px 10px", border: "1px solid #d9dfe8", borderRadius: 8, fontSize: 14 };
const th = { padding: "8px 10px", fontWeight: 600, color: "#3b445a" };
const td = { padding: "6px 10px" };
