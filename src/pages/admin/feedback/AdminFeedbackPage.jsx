// client/src/pages/admin/feedback/AdminFeedbackPage.jsx
//
// Очередь обращений: пожелания, замечания и найденные ошибки.
//
// ЭТО РАБОЧИЙ СПИСОК, А НЕ ОТЧЁТ. Открывший страницу пришёл отвечать, и по
// умолчанию он видит незакрытые обращения, отсортированные по свежести.
// Отдельный фильтр «ждут ответа» показывает те, где последнее слово осталось
// за человеком: именно они и теряются — снаружи выглядят разобранными.
//
// ОТВЕТ И СМЕНА СОСТОЯНИЯ — ДВА РАЗНЫХ ДЕЙСТВИЯ. «Взято в работу» без слов
// и «мы разобрались, вот почему» — разные сообщения, и объединять их одной
// кнопкой значило бы каждый раз выбирать между молчанием и болтовнёй.
//
// ЗАГОТОВКИ ПЕРЕВОДИТ СЕРВЕР. Здесь виден русский текст; человек получит
// его на языке, на котором писал. Свой текст, если он введён, всегда
// старше заготовки — так и на сервере.

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchFeedbackQueue,
  fetchFeedbackCard,
  fetchFeedbackTemplates,
  answerFeedback,
  setFeedbackStatus,
} from "../../../api/feedback";

const ВИДЫ = {
  idea: "Идея",
  improvement: "Улучшение",
  bug: "Ошибка",
  question: "Вопрос",
  other: "Другое",
};

const СОСТОЯНИЯ = {
  new: "Новое",
  in_review: "Рассматриваем",
  planned: "В плане",
  in_progress: "В работе",
  done: "Сделано",
  declined: "Отклонено",
};

const РАЗДЕЛЫ = {
  account: "Профиль и вход",
  appointments: "Приёмы",
  chat: "Чат и звонки",
  video: "Видео, DP-Tube",
  clinic: "Клиника",
  patients: "Пациенты",
  documents: "Документы",
  ai: "ИИ-разборы",
  billing: "Тарифы",
  mobile: "Мобильная версия",
  other: "Другое",
};

const ЦВЕТ = {
  new: "#c4570d",
  in_review: "#0e8478",
  planned: "#7a5cc4",
  in_progress: "#c4570d",
  done: "#0e8478",
  declined: "#8a8a8a",
};

const дата = (d) => (d ? new Date(d).toLocaleString() : "");

export default function AdminFeedbackPage() {
  const [параметры, setПараметры] = useSearchParams();

  const [фильтр, setФильтр] = useState({
    status: параметры.get("status") || "",
    kind: параметры.get("kind") || "",
    waiting: параметры.get("waiting") === "1",
  });

  const [очередь, setОчередь] = useState(null);
  const [сводка, setСводка] = useState(null);
  const [карта, setКарта] = useState(null);
  const [шаблоны, setШаблоны] = useState([]);
  const [текст, setТекст] = useState("");
  const [итог, setИтог] = useState("");
  const [приписка, setПриписка] = useState(true);
  const [беда, setБеда] = useState("");
  const [занят, setЗанят] = useState(false);

  const открытыйId = параметры.get("id") || "";

  const загрузить = useCallback(async () => {
    setБеда("");
    try {
      const о = await fetchFeedbackQueue({
        status: фильтр.status || undefined,
        kind: фильтр.kind || undefined,
        waiting: фильтр.waiting ? 1 : undefined,
      });
      setОчередь(о.items || []);
      setСводка(о.summary || null);
    } catch {
      setБеда("Не удалось загрузить очередь");
      setОчередь([]);
    }
  }, [фильтр]);

  useEffect(() => {
    загрузить();
  }, [загрузить]);

  useEffect(() => {
    fetchFeedbackTemplates()
      .then(setШаблоны)
      .catch(() => setШаблоны([]));
  }, []);

  const открытьКарту = useCallback(async (id) => {
    if (!id) {
      setКарта(null);
      return;
    }
    try {
      setКарта(await fetchFeedbackCard(id));
      setТекст("");
      setИтог("");
    } catch {
      setБеда("Не удалось открыть обращение");
    }
  }, []);

  useEffect(() => {
    открытьКарту(открытыйId);
  }, [открытыйId, открытьКарту]);

  function выбрать(id) {
    const п = new URLSearchParams(параметры);
    if (id) п.set("id", id);
    else п.delete("id");
    setПараметры(п);
  }

  async function ответить(templateKey = null) {
    setЗанят(true);
    setБеда("");
    try {
      setКарта(await answerFeedback(карта._id, { text: текст.trim(), templateKey }));
      setТекст("");
      await загрузить();
    } catch (о) {
      setБеда(о?.response?.data?.message || "Не удалось отправить ответ");
    } finally {
      setЗанят(false);
    }
  }

  async function состояние(status) {
    setЗанят(true);
    setБеда("");
    try {
      setКарта(
        await setFeedbackStatus(карта._id, {
          status,
          resolution: итог.trim() || undefined,
          autoReply: приписка,
        }),
      );
      setИтог("");
      await загрузить();
    } catch (о) {
      setБеда(о?.response?.data?.message || "Не удалось изменить состояние");
    } finally {
      setЗанят(false);
    }
  }

  return (
    <div style={стиль.страница}>
      <h1 style={стиль.заголовок}>Обратная связь</h1>
      <p style={стиль.лид}>
        Пожелания, замечания и найденные ошибки — от врачей, пациентов и клиник.
        Ответ уходит человеку в кабинет и уведомлением, на языке его обращения.
      </p>

      {сводка ? (
        <div style={стиль.сводка}>
          <b>{сводка.open}</b> открытых
          {Object.entries(сводка.byStatus).map(([с, н]) =>
            н ? (
              <span key={с} style={стиль.чип}>
                {СОСТОЯНИЯ[с] || с}: {н}
              </span>
            ) : null,
          )}
        </div>
      ) : null}

      <div style={стиль.фильтры}>
        <select
          style={стиль.поле}
          value={фильтр.status}
          onChange={(e) => setФильтр({ ...фильтр, status: e.target.value })}
        >
          <option value="">Все состояния</option>
          {Object.entries(СОСТОЯНИЯ).map(([к, н]) => (
            <option key={к} value={к}>
              {н}
            </option>
          ))}
        </select>

        <select
          style={стиль.поле}
          value={фильтр.kind}
          onChange={(e) => setФильтр({ ...фильтр, kind: e.target.value })}
        >
          <option value="">Все виды</option>
          {Object.entries(ВИДЫ).map(([к, н]) => (
            <option key={к} value={к}>
              {н}
            </option>
          ))}
        </select>

        <label style={стиль.флажок}>
          <input
            type="checkbox"
            checked={фильтр.waiting}
            onChange={(e) => setФильтр({ ...фильтр, waiting: e.target.checked })}
          />
          Ждут ответа
        </label>
      </div>

      {беда ? <div style={стиль.ошибка}>{беда}</div> : null}

      <div style={стиль.сетка}>
        <section style={стиль.колонка}>
          {очередь === null ? (
            <p style={стиль.пусто}>Загружаем…</p>
          ) : очередь.length === 0 ? (
            <p style={стиль.пусто}>Обращений нет</p>
          ) : (
            <ul style={стиль.список}>
              {очередь.map((о) => (
                <li key={о._id}>
                  <button
                    type="button"
                    style={{
                      ...стиль.строка,
                      borderLeftColor: ЦВЕТ[о.status] || "#ccc",
                      background: карта?._id === о._id ? "#f5faf9" : "#fff",
                    }}
                    onClick={() => выбрать(о._id)}
                  >
                    <span style={стиль.строкаТема}>{о.subject}</span>
                    <span style={стиль.строкаНиз}>
                      <span style={{ color: ЦВЕТ[о.status] }}>
                        {СОСТОЯНИЯ[о.status] || о.status}
                      </span>
                      {" · "}
                      {ВИДЫ[о.kind] || о.kind}
                      {" · "}
                      {РАЗДЕЛЫ[о.area] || о.area}
                      {" · "}
                      {о.authorRole || "—"}
                      {" · "}
                      {дата(о.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={стиль.колонка}>
          {!карта ? (
            <p style={стиль.пусто}>Выберите обращение слева</p>
          ) : (
            <div style={стиль.карта}>
              <h2 style={стиль.тема}>{карта.subject}</h2>
              <p style={стиль.мета}>
                {ВИДЫ[карта.kind]} · {РАЗДЕЛЫ[карта.area]} ·{" "}
                <span style={{ color: ЦВЕТ[карта.status] }}>
                  {СОСТОЯНИЯ[карта.status]}
                </span>{" "}
                · {карта.authorRole || "—"}
                {карта.author?.name ? ` · ${карта.author.name}` : ""}
                {карта.author?.email ? ` · ${карта.author.email}` : ""}
              </p>

              {/* Окружение: половина ответа на «где это случилось». */}
              {карта.context?.url || карта.context?.userAgent ? (
                <p style={стиль.окружение}>
                  {карта.context.url ? <span>{карта.context.url}</span> : null}
                  {карта.context.viewport ? <span> · {карта.context.viewport}</span> : null}
                  {карта.context.userAgent ? (
                    <span style={стиль.агент}> · {карта.context.userAgent}</span>
                  ) : null}
                </p>
              ) : null}

              <ol style={стиль.переписка}>
                {(карта.messages || []).map((м) => (
                  <li
                    key={м._id || м.createdAt}
                    style={{
                      ...стиль.реплика,
                      ...(м.authorType === "author"
                        ? стиль.репликаЧужая
                        : стиль.репликаНаша),
                    }}
                  >
                    <div style={стиль.репликаКто}>
                      {м.authorType === "author"
                        ? "Автор"
                        : м.authorType === "admin"
                          ? "Мы"
                          : "Автоответ"}
                      {" · "}
                      {дата(м.createdAt)}
                    </div>
                    <div style={стиль.репликаТекст}>{м.text}</div>
                  </li>
                ))}
              </ol>

              <div style={стиль.блок}>
                <h3 style={стиль.подзаголовок}>Ответить</h3>
                <textarea
                  style={стиль.поле2}
                  rows={4}
                  value={текст}
                  maxLength={4000}
                  onChange={(e) => setТекст(e.target.value)}
                  placeholder="Свой текст. Если оставить пустым — отправится выбранная заготовка."
                />
                <div style={стиль.кнопки}>
                  <button
                    type="button"
                    style={стиль.главная}
                    disabled={занят || !текст.trim()}
                    onClick={() => ответить(null)}
                  >
                    Отправить ответ
                  </button>
                  {шаблоны.map((ш) => (
                    <button
                      key={ш.key}
                      type="button"
                      style={стиль.обычная}
                      title={ш.preview}
                      disabled={занят}
                      onClick={() => ответить(ш.key)}
                    >
                      {ш.title}
                    </button>
                  ))}
                </div>
              </div>

              <div style={стиль.блок}>
                <h3 style={стиль.подзаголовок}>Состояние</h3>
                <textarea
                  style={стиль.поле2}
                  rows={3}
                  value={итог}
                  maxLength={2000}
                  onChange={(e) => setИтог(e.target.value)}
                  placeholder="Итог — обязателен, чтобы закрыть: что решили и почему"
                />
                <label style={стиль.флажок}>
                  <input
                    type="checkbox"
                    checked={приписка}
                    onChange={(e) => setПриписка(e.target.checked)}
                  />
                  Добавить автоответ о смене состояния
                </label>
                <div style={стиль.кнопки}>
                  {["in_review", "planned", "in_progress", "done", "declined"].map((с) => (
                    <button
                      key={с}
                      type="button"
                      style={с === "done" ? стиль.главная : стиль.обычная}
                      disabled={занят || карта.status === с}
                      onClick={() => состояние(с)}
                    >
                      {СОСТОЯНИЯ[с]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const стиль = {
  страница: { padding: 16, maxWidth: 1400, margin: "0 auto" },
  заголовок: { margin: 0, fontSize: 22, fontWeight: 700 },
  лид: { margin: "6px 0 14px", color: "#666", fontSize: 13, maxWidth: 720 },
  сводка: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 12,
    fontSize: 13,
  },
  чип: {
    background: "#f2f2f2",
    borderRadius: 14,
    padding: "3px 10px",
    fontSize: 12,
  },
  фильтры: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  поле: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "6px 10px",
    font: "inherit",
    fontSize: 13,
  },
  поле2: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "8px 10px",
    font: "inherit",
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
  },
  флажок: { display: "flex", gap: 6, alignItems: "center", fontSize: 13 },
  сетка: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
    alignItems: "start",
  },
  колонка: { minWidth: 0 },
  список: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  строка: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    border: "1px solid #eee",
    borderLeftWidth: 4,
    borderLeftStyle: "solid",
    borderRadius: 10,
    cursor: "pointer",
    font: "inherit",
  },
  строкаТема: { display: "block", fontWeight: 600, fontSize: 14 },
  строкаНиз: { display: "block", marginTop: 4, fontSize: 12, color: "#888" },
  карта: { border: "1px solid #eee", borderRadius: 12, padding: 14, background: "#fff" },
  тема: { margin: 0, fontSize: 17, fontWeight: 700 },
  мета: { margin: "6px 0", fontSize: 12, color: "#666" },
  окружение: {
    margin: "0 0 10px",
    fontSize: 11,
    color: "#888",
    wordBreak: "break-all",
  },
  агент: { color: "#aaa" },
  переписка: { listStyle: "none", margin: "10px 0", padding: 0, display: "grid", gap: 8 },
  реплика: { padding: "8px 10px", borderRadius: 10, fontSize: 13 },
  репликаЧужая: { background: "#f7f7f7" },
  репликаНаша: { background: "#eaf7f4" },
  репликаКто: { fontSize: 11, color: "#888", marginBottom: 3 },
  репликаТекст: { whiteSpace: "pre-wrap", lineHeight: 1.45 },
  блок: { marginTop: 14 },
  подзаголовок: { margin: "0 0 6px", fontSize: 14, fontWeight: 600 },
  кнопки: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 },
  главная: {
    border: "none",
    background: "#0f0f0f",
    color: "#fff",
    borderRadius: 18,
    padding: "8px 16px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  обычная: {
    border: "none",
    background: "#f2f2f2",
    color: "#0f0f0f",
    borderRadius: 18,
    padding: "8px 16px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  ошибка: {
    padding: 10,
    borderRadius: 8,
    background: "rgba(163,44,34,.08)",
    color: "#a32c22",
    fontSize: 13,
    marginBottom: 12,
  },
  пусто: { padding: "40px 0", textAlign: "center", color: "#888" },
};
