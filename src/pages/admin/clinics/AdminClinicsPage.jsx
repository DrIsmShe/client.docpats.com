// client/src/pages/admin/clinics/AdminClinicsPage.jsx
//
// Платформенное администрирование клиник (только админ).
// Список + статистика + действия: блок/разблок, смена тарифа, верификация,
// каскадное удаление (с подтверждением имени). Все запросы идут на
// /admin/clinics/* (бэкенд под requireAdmin + HIPAA-аудит).

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;
const TIERS = ["starter", "pro", "medical_tourism", "enterprise"];

const req = (method, url, data) =>
  axios({ method, url: `${API_BASE}${url}`, data, withCredentials: true });

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (tier) params.set("tier", tier);
      if (active) params.set("active", active);
      const [list, st] = await Promise.all([
        req("get", `/admin/clinics?${params.toString()}`),
        req("get", `/admin/clinics/stats`),
      ]);
      setClinics(list.data.clinics || []);
      setTotal(list.data.total || 0);
      setStats(st.data);
    } catch (e) {
      setError(
        e.response?.status === 403
          ? "Доступ только для администратора."
          : "Не удалось загрузить клиники.",
      );
    } finally {
      setLoading(false);
    }
  }, [q, tier, active]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id, fn) {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Действие не выполнено.");
    } finally {
      setBusyId(null);
    }
  }

  const toggleActive = (c) =>
    act(c._id, () =>
      req("patch", `/admin/clinics/${c._id}/active`, { isActive: !c.isActive }),
    );

  const toggleVerified = (c) =>
    act(c._id, () =>
      req("patch", `/admin/clinics/${c._id}/verify`, {
        isVerified: !c.isVerified,
      }),
    );

  const changeTier = (c, newTier) =>
    act(c._id, () =>
      req("patch", `/admin/clinics/${c._id}/tier`, { tier: newTier }),
    );

  const remove = (c) => {
    const name = window.prompt(
      `ПОЛНОЕ удаление клиники «${c.name}» необратимо.\nВведите точное название клиники для подтверждения:`,
    );
    if (name == null) return;
    act(c._id, () =>
      axios({
        method: "delete",
        url: `${API_BASE}/admin/clinics/${c._id}`,
        data: { confirmationName: name },
        withCredentials: true,
      }),
    );
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Администрирование клиник</h1>

      {stats && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          {[
            ["Всего", stats.total],
            ["Активных", stats.active],
            ["Заблокировано", stats.blocked],
            ["Опубликовано", stats.published],
            ["Верифицировано", stats.verified],
          ].map(([label, val]) => (
            <div key={label} style={card}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
            </div>
          ))}
          {TIERS.map((t) => (
            <div key={t} style={{ ...card, background: "#f8fafc" }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {stats.byTier?.[t] ?? 0}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{t}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по названию / slug"
          style={input}
        />
        <select value={tier} onChange={(e) => setTier(e.target.value)} style={input}>
          <option value="">Все тарифы</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={active} onChange={(e) => setActive(e.target.value)} style={input}>
          <option value="">Все статусы</option>
          <option value="true">Активные</option>
          <option value="false">Заблокированные</option>
        </select>
        <button onClick={load} style={btn}>
          Обновить
        </button>
      </div>

      {error && (
        <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>
      )}
      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th style={th}>Название</th>
                <th style={th}>Slug</th>
                <th style={th}>Тариф</th>
                <th style={th}>Статус</th>
                <th style={th}>Публик.</th>
                <th style={th}>Вериф.</th>
                <th style={th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((c) => (
                <tr key={c._id} style={{ borderBottom: "1px solid #eef2f7" }}>
                  <td style={td}>{c.name}</td>
                  <td style={{ ...td, color: "#64748b" }}>/{c.slug}</td>
                  <td style={td}>
                    <select
                      value={c.tier}
                      disabled={busyId === c._id}
                      onChange={(e) => changeTier(c, e.target.value)}
                      style={{ ...input, padding: "4px 6px" }}
                    >
                      {TIERS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={td}>
                    <span style={{ color: c.isActive ? "#067647" : "#b91c1c" }}>
                      {c.isActive ? "активна" : "заблок."}
                    </span>
                  </td>
                  <td style={td}>{c.isPublished ? "✓" : "—"}</td>
                  <td style={td}>{c.isVerified ? "✓" : "—"}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <button
                      onClick={() => toggleActive(c)}
                      disabled={busyId === c._id}
                      style={smallBtn}
                    >
                      {c.isActive ? "Заблок." : "Разблок."}
                    </button>
                    <button
                      onClick={() => toggleVerified(c)}
                      disabled={busyId === c._id}
                      style={smallBtn}
                    >
                      {c.isVerified ? "Снять вериф." : "Верифиц."}
                    </button>
                    <button
                      onClick={() => remove(c)}
                      disabled={busyId === c._id}
                      style={{ ...smallBtn, color: "#b91c1c", borderColor: "#fecaca" }}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
              {clinics.length === 0 && (
                <tr>
                  <td style={td} colSpan={7}>
                    Клиники не найдены.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>
            Показано {clinics.length} из {total}
          </div>
        </div>
      )}
    </div>
  );
}

const card = {
  background: "#fff",
  border: "1px solid #e6eaf0",
  borderRadius: 10,
  padding: "12px 18px",
  minWidth: 110,
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
const smallBtn = {
  padding: "4px 10px",
  marginRight: 6,
  background: "#fff",
  border: "1px solid #d9dfe8",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
};
const th = { padding: "8px 10px", fontWeight: 600, color: "#3b445a" };
const td = { padding: "8px 10px" };
