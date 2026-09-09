// client/src/pages/feedback/FeedbackPage.jsx
//
// «Обратная связь» — одна страница для врача, пациента и клиники.
//
// ПОЧЕМУ ФОРМА И ПЕРЕПИСКА ЖИВУТ ВМЕСТЕ. Человек, которому однажды ответили,
// пишет снова: отдельная страница «мои обращения» превратила бы ответ в то,
// что надо искать. Здесь список стоит рядом с формой, и непрочитанный ответ
// видно, не открывая ничего.
//
// АДРЕС СТРАНИЦЫ ПОДСТАВЛЯЕТСЯ САМ. Спрашивать «где это случилось» —
// значит требовать от человека работы, которую браузер уже сделал. Поле
// показано и доступно для правки: подставленное молча выглядит слежкой.
//
// МОБИЛЬНАЯ РАСКЛАДКА — ОДНА КОЛОНКА. Обратную связь чаще всего пишут в тот
// момент, когда наткнулись на проблему, а натыкаются на неё с телефона.

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchFeedbackDictionary,
  sendFeedback,
  fetchMyFeedback,
  fetchFeedbackThread,
  replyToFeedback,
} from "../../api/feedback";

/* Цвет состояния. Красным не отмечено ничего: отказ — тоже ответ, и
   красная метка на нём читается как ошибка человека, а не как решение. */
const ЦВЕТ = {
  new: "#6b7b78",
  in_review: "#0e8478",
  planned: "#7a5cc4",
  in_progress: "#c4570d",
  done: "#0e8478",
  declined: "#8a8a8a",
};

const состояниеТекстом = (t, s) =>
  ({
    new: t("feedback.st.new", { defaultValue: "Получено" }),
    in_review: t("feedback.st.inReview", { defaultValue: "Рассматриваем" }),
    planned: t("feedback.st.planned", { defaultValue: "В плане" }),
    in_progress: t("feedback.st.inProgress", { defaultValue: "В работе" }),
    done: t("feedback.st.done", { defaultValue: "Сделано" }),
    declined: t("feedback.st.declined", { defaultValue: "Не будем делать" }),
  })[s] || s;

const видТекстом = (t, k) =>
  ({
    idea: t("feedback.kind.idea", { defaultValue: "Идея — чего не хватает" }),
    improvement: t("feedback.kind.improvement", {
      defaultValue: "Улучшить то, что есть",
    }),
    bug: t("feedback.kind.bug", { defaultValue: "Нашёл ошибку" }),
    question: t("feedback.kind.question", { defaultValue: "Вопрос" }),
    other: t("feedback.kind.other", { defaultValue: "Другое" }),
  })[k] || k;

const разделТекстом = (t, a) =>
  ({
    account: t("feedback.area.account", { defaultValue: "Профиль и вход" }),
    appointments: t("feedback.area.appointments", { defaultValue: "Приёмы и запись" }),
    chat: t("feedback.area.chat", { defaultValue: "Чат и звонки" }),
    video: t("feedback.area.video", { defaultValue: "Видео, DP-Tube" }),
    clinic: t("feedback.area.clinic", { defaultValue: "Клиника" }),
    patients: t("feedback.area.patients", { defaultValue: "Пациенты и карты" }),
    documents: t("feedback.area.documents", { defaultValue: "Документы" }),
    ai: t("feedback.area.ai", { defaultValue: "ИИ-разборы" }),
    billing: t("feedback.area.billing", { defaultValue: "Тарифы и оплата" }),
    mobile: t("feedback.area.mobile", { defaultValue: "Телефон, мобильная версия" }),
    other: t("feedback.area.other", { defaultValue: "Другое" }),
  })[a] || a;

const дата = (d) => (d ? new Date(d).toLocaleString() : "");

export default function FeedbackPage() {
  const { t, i18n } = useTranslation();

  const [справочник, setСправочник] = useState({ kinds: [], areas: [] });
  const [обращения, setОбращения] = useState(null);
  const [открыто, setОткрыто] = useState(null); // переписка
  const [беда, setБеда] = useState("");
  const [готово, setГотово] = useState("");
  const [шлём, setШлём] = useState(false);

  const [форма, setФорма] = useState({
    kind: "idea",
    area: "other",
    subject: "",
    body: "",
    url: "",
  });
  const [ответ, setОтвет] = useState("");

  useEffect(() => {
    fetchFeedbackDictionary()
      .then(setСправочник)
      .catch(() => setСправочник({ kinds: ["idea", "bug", "other"], areas: ["other"] }));
  }, []);

  const загрузить = useCallback(async () => {
    try {
      setОбращения(await fetchMyFeedback());
    } catch {
      setОбращения([]);
    }
  }, []);

  useEffect(() => {
    загрузить();
  }, [загрузить]);

  async function отправить(e) {
    e.preventDefault();
    setБеда("");
    setГотово("");
    setШлём(true);
    try {
      await sendFeedback({ ...форма, locale: i18n.language });
      setГотово(
        t("feedback.sent", {
          defaultValue:
            "Спасибо! Обращение отправлено — ответ придёт сюда же и уведомлением.",
        }),
      );
      setФорма({ kind: "idea", area: "other", subject: "", body: "", url: "" });
      await загрузить();
    } catch (о) {
      setБеда(
        о?.response?.data?.message ||
          t("feedback.sendFailed", { defaultValue: "Не удалось отправить обращение" }),
      );
    } finally {
      setШлём(false);
    }
  }

  async function открыть(id) {
    setБеда("");
    try {
      setОткрыто(await fetchFeedbackThread(id));
      await загрузить();
    } catch {
      setБеда(t("feedback.openFailed", { defaultValue: "Не удалось открыть обращение" }));
    }
  }

  async function дописать(e) {
    e.preventDefault();
    if (!ответ.trim()) return;
    try {
      setОткрыто(await replyToFeedback(открыто._id, ответ.trim()));
      setОтвет("");
      await загрузить();
    } catch (о) {
      setБеда(
        о?.response?.data?.message ||
          t("feedback.replyFailed", { defaultValue: "Не удалось отправить сообщение" }),
      );
    }
  }

  return (
    <div style={стиль.страница}>
      <header style={стиль.шапка}>
        <h1 style={стиль.заголовок}>
          {t("feedback.title", { defaultValue: "Обратная связь" })}
        </h1>
        <p style={стиль.лид}>
          {t("feedback.lead", {
            defaultValue:
              "Напишите, чего не хватает, что улучшить или где что-то сломалось. Читаем всё и отвечаем здесь же.",
          })}
        </p>
      </header>

      {беда ? <div style={стиль.беда}>{беда}</div> : null}
      {готово ? <div style={стиль.готово}>{готово}</div> : null}

      <div style={стиль.сетка}>
        {/* ── Форма ─────────────────────────────────────────────── */}
        <form style={стиль.карта} onSubmit={отправить}>
          <h2 style={стиль.подзаголовок}>
            {t("feedback.formTitle", { defaultValue: "Новое обращение" })}
          </h2>

          <label style={стиль.метка}>
            {t("feedback.fieldKind", { defaultValue: "О чём это" })}
            <select
              style={стиль.поле}
              value={форма.kind}
              onChange={(e) => setФорма({ ...форма, kind: e.target.value })}
            >
              {(справочник.kinds || []).map((k) => (
                <option key={k} value={k}>
                  {видТекстом(t, k)}
                </option>
              ))}
            </select>
          </label>

          <label style={стиль.метка}>
            {t("feedback.fieldArea", { defaultValue: "Раздел" })}
            <select
              style={стиль.поле}
              value={форма.area}
              onChange={(e) => setФорма({ ...форма, area: e.target.value })}
            >
              {(справочник.areas || []).map((a) => (
                <option key={a} value={a}>
                  {разделТекстом(t, a)}
                </option>
              ))}
            </select>
          </label>

          <label style={стиль.метка}>
            {t("feedback.fieldSubject", { defaultValue: "Коротко — в одну строку" })}
            <input
              style={стиль.поле}
              value={форма.subject}
              maxLength={140}
              required
              onChange={(e) => setФорма({ ...форма, subject: e.target.value })}
              placeholder={t("feedback.subjectHint", {
                defaultValue: "Например: не сохраняется приём с телефона",
              })}
            />
          </label>

          <label style={стиль.метка}>
            {t("feedback.fieldBody", { defaultValue: "Подробно" })}
            <textarea
              style={{ ...стиль.поле, minHeight: 140, resize: "vertical" }}
              value={форма.body}
              maxLength={5000}
              required
              onChange={(e) => setФорма({ ...форма, body: e.target.value })}
              placeholder={t("feedback.bodyHint", {
                defaultValue:
                  "Что вы делали, что ожидали увидеть и что увидели вместо этого. Для идеи — зачем она вам и как вы этим пользовались бы.",
              })}
            />
          </label>

          <label style={стиль.метка}>
            {t("feedback.fieldUrl", { defaultValue: "Страница (можно оставить пустым)" })}
            <input
              style={стиль.поле}
              value={форма.url}
              maxLength={500}
              onChange={(e) => setФорма({ ...форма, url: e.target.value })}
              placeholder={t("feedback.urlHint", {
                defaultValue: "Подставим страницу, с которой вы пишете",
              })}
            />
          </label>

          <p style={стиль.сноска}>
            {t("feedback.privacy", {
              defaultValue:
                "Не пишите здесь сведения о здоровье — обращение читают разработчики, а не врачи.",
            })}
          </p>

          <button type="submit" style={стиль.кнопка} disabled={шлём}>
            {шлём
              ? t("feedback.sending", { defaultValue: "Отправляем…" })
              : t("feedback.send", { defaultValue: "Отправить" })}
          </button>
        </form>

        {/* ── Мои обращения ─────────────────────────────────────── */}
        <section style={стиль.карта}>
          <h2 style={стиль.подзаголовок}>
            {t("feedback.mine", { defaultValue: "Мои обращения" })}
          </h2>

          {обращения === null ? (
            <p style={стиль.тихо}>{t("feedback.loading", { defaultValue: "Загружаем…" })}</p>
          ) : обращения.length === 0 ? (
            <p style={стиль.тихо}>
              {t("feedback.empty", {
                defaultValue: "Пока пусто. Первое обращение появится здесь.",
              })}
            </p>
          ) : (
            <ul style={стиль.список}>
              {обращения.map((о) => (
                <li key={о._id}>
                  <button
                    type="button"
                    style={{
                      ...стиль.строка,
                      borderLeftColor: ЦВЕТ[о.status] || "#ccc",
                      background:
                        открыто?._id === о._id ? "rgba(14,132,120,0.08)" : "transparent",
                    }}
                    onClick={() => открыть(о._id)}
                  >
                    <span style={стиль.строкаТема}>
                      {о.subject}
                      {о.hasNewReply ? <em style={стиль.новое}>●</em> : null}
                    </span>
                    <span style={стиль.строкаНиз}>
                      <span style={{ color: ЦВЕТ[о.status] }}>
                        {состояниеТекстом(t, о.status)}
                      </span>
                      {" · "}
                      {видТекстом(t, о.kind)}
                      {" · "}
                      {дата(о.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Переписка ───────────────────────────────────────────── */}
      {открыто ? (
        <section style={{ ...стиль.карта, marginTop: 16 }}>
          <div style={стиль.перепискаШапка}>
            <h2 style={стиль.подзаголовок}>{открыто.subject}</h2>
            <button type="button" style={стиль.закрыть} onClick={() => setОткрыто(null)}>
              {t("feedback.close", { defaultValue: "Закрыть" })}
            </button>
          </div>

          <p style={стиль.сноска}>
            {состояниеТекстом(t, открыто.status)} · {разделТекстом(t, открыто.area)}
          </p>

          <ol style={стиль.переписка}>
            {(открыто.messages || []).map((м) => (
              <li
                key={м._id || м.createdAt}
                style={{
                  ...стиль.реплика,
                  ...(м.authorType === "author" ? стиль.репликаСвоя : стиль.репликаНаша),
                }}
              >
                <div style={стиль.репликаКто}>
                  {м.authorType === "author"
                    ? t("feedback.you", { defaultValue: "Вы" })
                    : t("feedback.team", { defaultValue: "DocPats" })}
                  {" · "}
                  {дата(м.createdAt)}
                </div>
                <div style={стиль.репликаТекст}>{м.text}</div>
              </li>
            ))}
          </ol>

          {["done", "declined"].includes(открыто.status) ? (
            <p style={стиль.тихо}>
              {t("feedback.closedNote", {
                defaultValue:
                  "Обращение закрыто. Если вопрос остался — создайте новое, так его точно увидят.",
              })}
            </p>
          ) : (
            <form onSubmit={дописать} style={стиль.ответФорма}>
              <textarea
                style={{ ...стиль.поле, minHeight: 80, resize: "vertical" }}
                value={ответ}
                maxLength={4000}
                onChange={(e) => setОтвет(e.target.value)}
                placeholder={t("feedback.replyHint", { defaultValue: "Добавить сообщение" })}
              />
              <button type="submit" style={стиль.кнопка} disabled={!ответ.trim()}>
                {t("feedback.replySend", { defaultValue: "Отправить" })}
              </button>
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
}

const стиль = {
  страница: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "24px 16px 64px",
    boxSizing: "border-box",
  },
  шапка: { marginBottom: 20 },
  заголовок: { margin: 0, fontSize: 26, fontWeight: 700, color: "#123" },
  лид: { margin: "8px 0 0", color: "#5b6b68", maxWidth: 680, lineHeight: 1.5 },
  сетка: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 16,
    alignItems: "start",
  },
  карта: {
    background: "#fff",
    border: "1px solid #e3e9e8",
    borderRadius: 14,
    padding: 16,
    boxSizing: "border-box",
    minWidth: 0,
  },
  подзаголовок: { margin: "0 0 12px", fontSize: 17, fontWeight: 600, color: "#123" },
  метка: {
    display: "block",
    marginBottom: 12,
    fontSize: 13,
    color: "#5b6b68",
    fontWeight: 500,
  },
  поле: {
    display: "block",
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    fontSize: 15,
    color: "#123",
    border: "1px solid #d7e0de",
    borderRadius: 10,
    boxSizing: "border-box",
    background: "#fbfdfd",
  },
  кнопка: {
    width: "100%",
    padding: "12px 16px",
    fontSize: 15,
    fontWeight: 600,
    color: "#fff",
    background: "#0e8478",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
  сноска: { margin: "0 0 12px", fontSize: 12, color: "#7b8b88", lineHeight: 1.5 },
  тихо: { color: "#7b8b88", fontSize: 14, margin: 0 },
  список: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  строка: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    border: "1px solid #e3e9e8",
    borderLeftWidth: 4,
    borderLeftStyle: "solid",
    borderRadius: 10,
    cursor: "pointer",
    font: "inherit",
  },
  строкаТема: { display: "block", fontWeight: 600, color: "#123", fontSize: 15 },
  строкаНиз: { display: "block", marginTop: 4, fontSize: 12, color: "#7b8b88" },
  новое: { marginLeft: 6, color: "#c4570d", fontStyle: "normal" },
  беда: {
    padding: "10px 14px",
    marginBottom: 12,
    borderRadius: 10,
    background: "#fdecec",
    color: "#93231f",
  },
  готово: {
    padding: "10px 14px",
    marginBottom: 12,
    borderRadius: 10,
    background: "#eaf7f4",
    color: "#0e6b60",
  },
  перепискаШапка: {
    display: "flex",
    gap: 12,
    alignItems: "baseline",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  закрыть: {
    border: "none",
    background: "transparent",
    color: "#0e8478",
    cursor: "pointer",
    font: "inherit",
  },
  переписка: { listStyle: "none", margin: "12px 0", padding: 0, display: "grid", gap: 10 },
  реплика: { padding: "10px 12px", borderRadius: 12, maxWidth: "min(680px, 100%)" },
  репликаСвоя: { background: "#f2f6f5", justifySelf: "end" },
  репликаНаша: { background: "#eaf7f4" },
  репликаКто: { fontSize: 11, color: "#7b8b88", marginBottom: 4 },
  репликаТекст: { whiteSpace: "pre-wrap", color: "#123", lineHeight: 1.5 },
  ответФорма: { display: "grid", gap: 8 },
};
