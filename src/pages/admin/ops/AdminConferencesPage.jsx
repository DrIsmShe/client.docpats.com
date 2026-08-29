// client/src/pages/admin/ops/AdminConferencesPage.jsx
//
// Модерация конференций. GET/POST /admin/conferences, PATCH /admin/conferences/:id.
//
// Экран существует потому, что автопубликация здесь недопустима: индустрия
// хищнических конференций рассылает врачам приглашения на мероприятия,
// которых нет, и по тексту сайта они выглядят убедительнее настоящих.
// Модель их не отличит — отличит человек, посмотрев на организатора.
//
// Поэтому главное на карточке — не красота, а ПРЕДУПРЕЖДЕНИЯ: что именно не
// сошлось при автоматических проверках. Модератор должен смотреть в
// конкретное поле, а не перепроверять всё подряд.

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

// Коды категорий совпадают с движком и с common/config/conferenceCategories.js
// на бэкенде. Здесь к ним добавлены человеческие подписи.
const CATEGORIES = [
  ["therapeutic", "Терапевтические"],
  ["surgical", "Хирургические"],
  ["diagnostics", "Диагностика"],
  ["rehabilitation", "Реабилитация"],
  ["dentistry", "Стоматология"],
  ["womens-health", "Женское здоровье"],
  ["pediatrics", "Педиатрия"],
  ["mental-health", "Психическое здоровье"],
  ["ophthalmology-ent", "Офтальмология и ЛОР"],
  ["sports-medicine", "Спортивная медицина"],
  ["oncology", "Онкология"],
  ["emergency", "Неотложная помощь"],
  ["mens-health", "Мужское здоровье"],
  ["pharmacy", "Фармация"],
];

const FLAG_LABELS = {
  no_title: "нет названия",
  no_start_date: "нет даты начала",
  date_in_past: "дата в прошлом",
  end_before_start: "конец раньше начала",
  deadline_after_start: "дедлайн позже начала",
  no_organizer: "не указан организатор",
  untrusted_domain: "домен не из списка источников",
  bad_url: "ссылка не разбирается",
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) : "—";

const EMPTY_FORM = {
  title: "",
  url: "",
  organizer: "",
  startDate: "",
  endDate: "",
  registrationDeadline: "",
  abstractDeadline: "",
  city: "",
  country: "",
  format: "onsite",
  price: "",
  cmeCredits: "",
  categories: [],
};

export default function AdminConferencesPage() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("draft");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await axios.get(`${API_BASE}/admin/conferences?status=${status}`, {
        withCredentials: true,
      });
      setItems(r.data.items || []);
    } catch (e) {
      setError(
        e.response?.status === 403
          ? "Доступ только для администратора."
          : e.response?.data?.message || "Не удалось загрузить конференции.",
      );
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function moderate(id, next) {
    setBusy(id);
    setError(null);
    try {
      const body = { status: next };
      if (next === "rejected") {
        const reason = window.prompt("Причина отклонения (необязательно):", "");
        if (reason === null) return;
        body.rejectedReason = reason;
      }
      await axios.patch(`${API_BASE}/admin/conferences/${id}`, body, {
        withCredentials: true,
      });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Действие не выполнено.");
    } finally {
      setBusy(null);
    }
  }

  // Обход сайтов обществ. Идёт минутами: двенадцать страниц и столько же
  // вызовов модели. Если ответ не дождётся, обход всё равно доводится в
  // движке — карточки появятся в очереди по «Обновить».
  async function runIngestion() {
    setRunning(true);
    setError(null);
    setNotice(null);
    setRunResult(null);
    try {
      const r = await axios.post(
        `${API_BASE}/admin/conferences/run-ingestion`,
        {},
        { withCredentials: true, timeout: 10 * 60 * 1000 },
      );
      setRunResult(r.data);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Обход не запустился.");
    } finally {
      setRunning(false);
    }
  }

  async function submitForm(e) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy("form");
    try {
      const payload = { ...form };
      // Пустые строки в датах mongoose прочитает как Invalid Date — убираем.
      for (const k of Object.keys(payload)) {
        if (payload[k] === "") delete payload[k];
      }
      const r = await axios.post(`${API_BASE}/admin/conferences`, payload, {
        withCredentials: true,
      });
      setNotice(
        r.data.created
          ? "Карточка добавлена в черновики."
          : "Такая конференция уже есть — обновлены только даты.",
      );
      setForm(EMPTY_FORM);
      setShowForm(false);
      setStatus("draft");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Не удалось создать карточку.");
    } finally {
      setBusy(null);
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleCategory = (code) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(code)
        ? f.categories.filter((c) => c !== code)
        : [...f.categories, code],
    }));

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Модерация конференций</h1>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
        Опубликованные карточки попадают в рубрику и в еженедельную рассылку
        врачам. Проверяйте организатора: приглашения на несуществующие
        конференции выглядят убедительнее настоящих.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={input}>
          <option value="draft">На модерации</option>
          <option value="published">Опубликованные</option>
          <option value="rejected">Отклонённые</option>
        </select>
        <button onClick={load} style={btn}>Обновить</button>
        <button onClick={() => setShowForm((v) => !v)} style={{ ...btn, background: "#0f766e" }}>
          {showForm ? "Свернуть форму" : "Добавить вручную"}
        </button>
        <button onClick={runIngestion} disabled={running} style={{ ...btn, background: "#7c3aed" }}>
          {running ? "Обхожу источники…" : "Запустить обход"}
        </button>
      </div>

      {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>}
      {notice && <div style={{ color: "#067647", marginBottom: 12 }}>{notice}</div>}

      {running && (
        <div style={{ color: "#64748b", marginBottom: 12, fontSize: 13 }}>
          Идёт обход сайтов обществ — это занимает несколько минут. Страницу
          можно не держать открытой: результат осядет в очереди.
        </div>
      )}

      {runResult && (
        <div style={runBox}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            Источников: {runResult.sources ?? 0} · найдено: {runResult.found ?? 0} ·
            новых: {runResult.created ?? 0} · обновлено: {runResult.updated ?? 0} ·
            ошибок: {runResult.errors ?? 0}
          </div>
          {/* Построчно по источникам: пустая очередь без объяснения — это
              ровно та картина, из-за которой непонятно, сломалось что-то
              или на сайтах правда нет анонсов. */}
          {(runResult.stats || []).map((st) => (
            <div key={st.slug} style={{ fontSize: 13, color: st.error ? "#b91c1c" : "#475569" }}>
              <b>{st.slug}</b>{" "}
              {st.error
                ? `— ошибка: ${st.error}`
                : `— найдено ${st.found}, новых ${st.created}, обновлено ${st.updated}, пропущено ${st.skipped}`}
            </div>
          ))}
          {/* Без ключа модели «найдено 0» значит «извлекать было нечем», а
              не «на сайтах пусто». Молчать здесь нельзя: пустая очередь
              выглядела бы как норма. */}
          {runResult.aiConfigured === false ? (
            <div style={{ fontSize: 13, color: "#b45309", marginTop: 8 }}>
              Ключ модели не задан в движке (ANTHROPIC_API_KEY) — страницы
              скачаны, но извлекать конференции было нечем. Обход прошёл
              вхолостую.
            </div>
          ) : (
            runResult.created === 0 &&
            runResult.errors === 0 && (
              <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>
                Новых карточек нет — всё, что нашлось, уже заведено.
              </div>
            )
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={submitForm} style={{ ...cardBox, marginBottom: 20 }}>
          <div style={grid2}>
            <label style={lbl}>
              Название*
              <input required value={form.title} onChange={set("title")} style={input} />
            </label>
            <label style={lbl}>
              Ссылка на сайт*
              <input required type="url" value={form.url} onChange={set("url")} style={input} />
            </label>
            <label style={lbl}>
              Организатор
              <input value={form.organizer} onChange={set("organizer")} style={input} />
            </label>
            <label style={lbl}>
              Формат
              <select value={form.format} onChange={set("format")} style={input}>
                <option value="onsite">Очно</option>
                <option value="online">Онлайн</option>
                <option value="hybrid">Очно и онлайн</option>
              </select>
            </label>
            <label style={lbl}>
              Начало
              <input type="date" value={form.startDate} onChange={set("startDate")} style={input} />
            </label>
            <label style={lbl}>
              Окончание
              <input type="date" value={form.endDate} onChange={set("endDate")} style={input} />
            </label>
            <label style={lbl}>
              Регистрация до
              <input type="date" value={form.registrationDeadline} onChange={set("registrationDeadline")} style={input} />
            </label>
            <label style={lbl}>
              Тезисы до
              <input type="date" value={form.abstractDeadline} onChange={set("abstractDeadline")} style={input} />
            </label>
            <label style={lbl}>
              Город
              <input value={form.city} onChange={set("city")} style={input} />
            </label>
            <label style={lbl}>
              Страна (код, напр. AZ)
              <input value={form.country} onChange={set("country")} style={input} />
            </label>
            <label style={lbl}>
              Стоимость
              <input value={form.price} onChange={set("price")} style={input} />
            </label>
            <label style={lbl}>
              CME-кредиты
              <input value={form.cmeCredits} onChange={set("cmeCredits")} style={input} />
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 6 }}>
              Категории — можно несколько. Ничего не отмечено = тема вне
              специальностей (ИИ, право, управление), такие доходят до всех.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {CATEGORIES.map(([code, label]) => (
                <label key={code} style={{ fontSize: 13, display: "flex", gap: 4, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={form.categories.includes(code)}
                    onChange={() => toggleCategory(code)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={busy === "form"} style={{ ...btn, marginTop: 14 }}>
            {busy === "form" ? "Сохраняю…" : "Создать черновик"}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <div style={{ color: "#64748b" }}>
          {status === "draft" ? "Очередь пуста." : "Ничего не найдено."}
        </div>
      ) : (
        items.map((c) => (
          <div key={c._id} style={cardBox}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <b style={{ fontSize: 15 }}>{c.title}</b>
              <span style={{ fontSize: 12, color: statusColor(c.status) }}>{c.status}</span>
            </div>

            <div style={{ color: "#334155", fontSize: 14, margin: "6px 0" }}>
              {c.organizer || <span style={{ color: "#b91c1c" }}>организатор не указан</span>}
            </div>

            <div style={{ fontSize: 13, color: "#475569" }}>
              {fmt(c.startDate)}
              {c.endDate ? ` — ${fmt(c.endDate)}` : ""} ·{" "}
              {c.format === "online" ? "онлайн" : [c.city, c.country].filter(Boolean).join(", ") || "—"}
              {c.format === "hybrid" ? " (очно и онлайн)" : ""}
            </div>

            <div style={{ fontSize: 13, color: "#475569" }}>
              Регистрация до {fmt(c.registrationDeadline)} · тезисы до {fmt(c.abstractDeadline)}
            </div>

            {c.categories?.length > 0 && (
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                {c.categories
                  .map((code) => CATEGORIES.find(([x]) => x === code)?.[1] || code)
                  .join(" · ")}
              </div>
            )}

            <div style={{ marginTop: 6 }}>
              <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
                {c.url}
              </a>
              {c.sourceSlug && (
                <span style={{ fontSize: 12, color: "#64748b" }}> · источник: {c.sourceSlug}</span>
              )}
            </div>

            {/* Ради этого блока экран и сделан: что именно проверить руками. */}
            {c.validationFlags?.length > 0 && (
              <div style={flagsBox}>
                Проверьте:{" "}
                {c.validationFlags.map((f) => FLAG_LABELS[f] || f).join(", ")}
              </div>
            )}

            {c.rejectedReason && (
              <div style={{ fontSize: 13, color: "#b45309", marginTop: 8 }}>
                Причина отклонения: {c.rejectedReason}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {c.status !== "published" && (
                <button onClick={() => moderate(c._id, "published")} disabled={busy === c._id} style={{ ...smallBtn, color: "#067647" }}>
                  Опубликовать
                </button>
              )}
              {c.status !== "rejected" && (
                <button onClick={() => moderate(c._id, "rejected")} disabled={busy === c._id} style={{ ...smallBtn, color: "#b91c1c" }}>
                  Отклонить
                </button>
              )}
              {c.status !== "draft" && (
                <button onClick={() => moderate(c._id, "draft")} disabled={busy === c._id} style={smallBtn}>
                  Вернуть в черновики
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const statusColor = (s) => (s === "published" ? "#067647" : s === "rejected" ? "#b91c1c" : "#b45309");
const cardBox = { background: "#fff", border: "1px solid #e6eaf0", borderRadius: 10, padding: 16, marginBottom: 12 };
const runBox = { background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: 14, marginBottom: 16 };
const flagsBox = { marginTop: 10, padding: "8px 10px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, color: "#9a3412", fontSize: 13 };
const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 };
const lbl = { display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#475569" };
const input = { padding: "8px 10px", border: "1px solid #d9dfe8", borderRadius: 8, fontSize: 14 };
const btn = { padding: "8px 16px", background: "#3d7fff", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };
const smallBtn = { padding: "4px 12px", background: "#fff", border: "1px solid #d9dfe8", borderRadius: 6, cursor: "pointer", fontSize: 13 };
