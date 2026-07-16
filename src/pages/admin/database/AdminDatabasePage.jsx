// client/src/pages/admin/database/AdminDatabasePage.jsx
//
// Раздел «База данных» — сводная аналитика платформы + экспорт в PDF
// (скачать / отправить на email), целиком или по выбранным разделам.

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

const SECTIONS = [
  { key: "patients", label: "Пациенты" },
  { key: "articles", label: "Статьи" },
  { key: "doctors", label: "Врачи" },
  { key: "users", label: "Пользователи" },
];

export default function AdminDatabasePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // выбор разделов для экспорта (по умолчанию — все)
  const [picked, setPicked] = useState({
    patients: true,
    articles: true,
    doctors: true,
    users: true,
  });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(null); // 'download' | 'email' | section key
  const [notice, setNotice] = useState(null); // { type, text }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await axios.get(`${API_BASE}/admin/database/analytics`, {
        withCredentials: true,
      });
      setData(r.data);
    } catch (e) {
      setError(
        e.response?.status === 403 || e.response?.status === 401
          ? "Доступ только для администратора."
          : "Не удалось загрузить аналитику.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pickedList = () => SECTIONS.filter((s) => picked[s.key]).map((s) => s.key);
  const sectionsParam = (list) => (list.length === SECTIONS.length ? "all" : list.join(","));

  const downloadPdf = async (list, tag) => {
    const secs = list && list.length ? list : pickedList();
    if (!secs.length) {
      setNotice({ type: "err", text: "Выберите хотя бы один раздел." });
      return;
    }
    setBusy(tag || "download");
    setNotice(null);
    try {
      const r = await axios.get(`${API_BASE}/admin/database/export/pdf`, {
        params: { sections: sectionsParam(secs) },
        withCredentials: true,
        responseType: "blob",
      });
      const url = URL.createObjectURL(
        new Blob([r.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `docpats-analytics-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setNotice({ type: "err", text: "Не удалось скачать PDF." });
    } finally {
      setBusy(null);
    }
  };

  const emailPdf = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotice({ type: "err", text: "Введите корректный email." });
      return;
    }
    const secs = pickedList();
    if (!secs.length) {
      setNotice({ type: "err", text: "Выберите хотя бы один раздел." });
      return;
    }
    setBusy("email");
    setNotice(null);
    try {
      await axios.post(
        `${API_BASE}/admin/database/email`,
        { email, sections: sectionsParam(secs) },
        { withCredentials: true },
      );
      setNotice({ type: "ok", text: `Отчёт отправлен на ${email}.` });
    } catch (e) {
      setNotice({
        type: "err",
        text: e.response?.data?.message || "Не удалось отправить отчёт.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <div style={head}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>База данных — аналитика</h1>
          {data?.generatedAt && (
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Обновлено: {new Date(data.generatedAt).toLocaleString("ru-RU")}
            </div>
          )}
        </div>
        <button onClick={load} style={btn} disabled={loading}>
          {loading ? "Загрузка…" : "Обновить"}
        </button>
      </div>

      {/* ---------- Панель экспорта ---------- */}
      <div style={exportBar}>
        <div style={{ fontWeight: 700, color: "#334155" }}>Экспорт в PDF</div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {SECTIONS.map((s) => (
            <label key={s.key} style={chk}>
              <input
                type="checkbox"
                checked={!!picked[s.key]}
                onChange={(e) =>
                  setPicked((p) => ({ ...p, [s.key]: e.target.checked }))
                }
              />
              {s.label}
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => downloadPdf(null, "download")}
            style={btn}
            disabled={busy === "download"}
          >
            {busy === "download" ? "Готовим…" : "⬇ Скачать выбранное"}
          </button>

          <span style={{ color: "#cbd5e1" }}>|</span>

          <input
            type="email"
            placeholder="email для отправки"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />
          <button
            onClick={emailPdf}
            style={btnGreen}
            disabled={busy === "email"}
          >
            {busy === "email" ? "Отправляем…" : "✉ Отправить на email"}
          </button>
        </div>

        {notice && (
          <div style={{ color: notice.type === "ok" ? "#067647" : "#b91c1c", fontSize: 13 }}>
            {notice.text}
          </div>
        )}
      </div>

      {error && <div style={errBox}>{error}</div>}
      {!data && !error && <div style={{ marginTop: 20 }}>Загрузка…</div>}

      {data && (
        <>
          {/* ---------- Сводка ---------- */}
          <div style={cardsWrap}>
            <Stat title="Карт пациентов" value={data.patients.totalCards} accent="#3d7fff" />
            <Stat title="Пациентов (аккаунты)" value={data.patients.registeredUsers} accent="#0ea5e9" />
            <Stat title="Статей всего" value={data.articles.total} accent="#8b5cf6" />
            <Stat title="Опубликовано" value={data.articles.published} accent="#16a34a" />
            <Stat title="Черновики" value={data.articles.draft} accent="#f59e0b" />
            <Stat title="Просмотры статей" value={data.articles.totalViews} accent="#ec4899" />
            <Stat title="Пользователей всего" value={data.users.total} accent="#0f766e" />
          </div>

          {/* ---------- Пациенты ---------- */}
          <Section title="Пациенты" onDownload={() => downloadPdf(["patients"], "patients")} busy={busy === "patients"}>
            <BarList title="По возрасту" rows={data.patients.byAge} color="#3d7fff" />
            <BarList title="По странам" rows={data.patients.byCountry} color="#0ea5e9" />
            <BarList title="По полу" rows={data.patients.byGender} color="#8b5cf6" />
            <BarList title="По статусу карты" rows={data.patients.byStatus} color="#f59e0b" />
            <BarList title="По диагнозам (топ-20)" rows={data.patients.byDiagnosis} color="#e11d48" wide />
          </Section>

          {/* ---------- Статьи ---------- */}
          <Section title="Статьи" onDownload={() => downloadPdf(["articles"], "articles")} busy={busy === "articles"}>
            <BarList title="По категориям" rows={data.articles.byCategory} color="#8b5cf6" />
            <BarList title="По специальностям авторов" rows={data.articles.bySpecialization} color="#0ea5e9" />
            <BarList title="По странам авторов" rows={data.articles.byAuthorCountry} color="#16a34a" />
            <BarList title="По языкам" rows={data.articles.byLanguage} color="#f59e0b" />
            <BarList title="Топ авторов" rows={data.articles.topAuthors} color="#ec4899" />
          </Section>

          {/* ---------- Врачи ---------- */}
          <Section title="Врачи" onDownload={() => downloadPdf(["doctors"], "doctors")} busy={busy === "doctors"}>
            <BarList title="По верификации" rows={data.doctors.byVerification} color="#16a34a" />
            <BarList title="По специальностям" rows={data.doctors.bySpecialization} color="#3d7fff" />
            <BarList title="По странам" rows={data.doctors.byCountry} color="#0ea5e9" />
          </Section>

          {/* ---------- Пользователи ---------- */}
          <Section title="Пользователи" onDownload={() => downloadPdf(["users"], "users")} busy={busy === "users"}>
            <BarList title="По ролям" rows={data.users.byRole} color="#0f766e" />
            <BarList title="Регистрации по месяцам (12 мес)" rows={data.users.registrationsByMonth} color="#8b5cf6" wide />
          </Section>
        </>
      )}
    </div>
  );
}

function Stat({ title, value, accent }) {
  return (
    <div style={{ ...statCard, borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
        {Number(value ?? 0).toLocaleString("ru-RU")}
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{title}</div>
    </div>
  );
}

function Section({ title, children, onDownload, busy }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, margin: 0, color: "#0f172a" }}>{title}</h2>
        {onDownload && (
          <button onClick={onDownload} style={smallBtn} disabled={busy}>
            {busy ? "Готовим…" : "⬇ PDF раздела"}
          </button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function BarList({ title, rows, color, wide }) {
  const list = Array.isArray(rows) ? rows : [];
  const max = list.reduce((m, r) => Math.max(m, r.count || 0), 0) || 1;
  return (
    <div style={{ ...panel, gridColumn: wide ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#334155" }}>
        {title}
      </div>
      {list.length === 0 ? (
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Нет данных</div>
      ) : (
        list.map((r, i) => (
          <div key={i} style={{ marginBottom: 9 }}>
            <div style={rowTop}>
              <span style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "78%" }}>
                {r.label}
              </span>
              <b style={{ color: "#0f172a" }}>{Number(r.count).toLocaleString("ru-RU")}</b>
            </div>
            <div style={barTrack}>
              <div style={{ ...barFill, width: `${(r.count / max) * 100}%`, background: color }} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const head = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 };
const btn = { padding: "9px 18px", background: "#3d7fff", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 };
const btnGreen = { padding: "9px 18px", background: "#067647", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 };
const smallBtn = { padding: "6px 12px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#334155" };
const input = { padding: "8px 12px", border: "1px solid #d9dfe8", borderRadius: 8, fontSize: 14, minWidth: 200 };
const chk = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "#334155", cursor: "pointer" };
const exportBar = { marginTop: 18, padding: 16, background: "#f8fafc", border: "1px solid #e6eaf0", borderRadius: 12, display: "flex", flexDirection: "column", gap: 12 };
const errBox = { color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginTop: 16 };
const cardsWrap = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14, marginTop: 20 };
const statCard = { background: "#fff", border: "1px solid #e6eaf0", borderRadius: 12, padding: "16px 18px" };
const panel = { background: "#fff", border: "1px solid #e6eaf0", borderRadius: 12, padding: 16 };
const rowTop = { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 };
const barTrack = { height: 8, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" };
const barFill = { height: "100%", borderRadius: 999, transition: "width .3s" };
