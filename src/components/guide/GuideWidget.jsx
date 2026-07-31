// client/src/components/guide/GuideWidget.jsx
//
// Плавающая кнопка помощника — на всех страницах.
//
// СЛЕВА, А НЕ СПРАВА. Правый нижний угол занят ToastContainer: постоянная
// кнопка под всплывающими уведомлениями то и дело оказывалась бы перекрытой,
// причём именно в тот момент, когда что-то произошло и человек ищет помощь.
//
// НЕ ВЕЗДЕ. На экранах-редакторах (разметка снимка, симуляция, хирургия) угол
// занят инструментами, и кнопка поверх них мешает работе. Там её нет — список
// ниже, он же единственное место, где это правило записано.
//
// Роль угадывается по зоне адреса, а не запрашивается у сервера. Ошибиться
// здесь безопасно: у агента нет инструментов и доступа к данным, роль влияет
// только на тон ответа и на выбор раздела, поэтому лишний запрос к API ради
// неё не окупается.

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { askGuide, fetchGuideRole } from "../../api/guide";
import styles from "./GuideWidget.module.css";

// Зоны, где кнопка мешает: угол занят инструментами.
const HIDDEN = ["/dp/", "/simulation", "/surgery", "/arena/", "/radiology/reader"];

function sectionForPath(pathname) {
  const m = pathname.match(/^\/docs\/([a-z0-9-]+)/);
  return m ? m[1] : undefined;
}

export default function GuideWidget() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Кто спрашивает — по сессии, с сервера. До ответа считаем гостем: подсказки
  // для гостя подходят всем, а подсказки врача пациенту — нет.
  const [role, setRole] = useState("guest");

  const inputRef = useRef(null);
  const feedRef = useRef(null);

  const rtl = String(i18n.language || "").slice(0, 2) === "ar";

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Роль спрашивается один раз, при первом открытии: до этого помощник — просто
  // кнопка, и ходить за сессией на каждой странице незачем.
  const roleAsked = useRef(false);
  useEffect(() => {
    if (!open || roleAsked.current) return;
    roleAsked.current = true;
    fetchGuideRole().then(setRole);
  }, [open]);

  useEffect(() => {
    // Новый ответ должен быть виден без прокрутки руками.
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (HIDDEN.some((p) => pathname.startsWith(p) || pathname.includes(p))) return null;

  async function send(text) {
    const question = String(text ?? draft).trim();
    if (!question || busy) return;

    const next = [...messages, { role: "user", content: question }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    setError("");

    try {
      const res = await askGuide({
        messages: next,
        // Гостю незачем ходить в авторизованный вход и получать 401.
        authed: role !== "guest",
        section: sectionForPath(pathname),
      });
      setMessages([...next, { role: "assistant", content: res.answer }]);
    } catch (err) {
      const status = err?.response?.status;
      setError(
        status === 429
          ? t("guide.tooMany", { defaultValue: "Слишком много вопросов подряд. Попробуйте через минуту." })
          : t("guide.failed", { defaultValue: "Не получилось ответить. Попробуйте ещё раз." }),
      );
      // Вопрос остаётся в поле, чтобы его не пришлось набирать заново.
      setDraft(question);
      setMessages(messages);
    } finally {
      setBusy(false);
    }
  }

  // Подсказки под того, кто спрашивает: врачу в кабинете незачем предлагать
  // «кто видит мою историю болезни» — это вопрос пациента.
  //
  // ВАЖНО: подсказка обязана быть отвечаемой по корпусу. Кнопка, которая
  // приводит к «я не знаю», хуже отсутствия кнопки — она обещает и обманывает.
  // Поэтому набора ровно четыре, по числу аудиторий, которые корпус покрывает.
  const group =
    role === "doctor"
      ? "doctor"
      : role === "patient"
        ? "patient"
        : role === "clinic_admin" || role === "clinic_staff"
          ? "clinic"
          : "guest";

  const fromLocale = t(`guide.starters.${group}`, { returnObjects: true });
  const starters = Array.isArray(fromLocale)
    ? fromLocale
    : [
        "Что даёт платформа врачу?",
        "Кто видит мою медицинскую историю?",
        "Сколько это стоит?",
      ];

  return (
    <div className={styles.root} dir={rtl ? "rtl" : "ltr"}>
      {open && (
        <section
          className={styles.panel}
          role="dialog"
          aria-modal="false"
          aria-label={t("guide.title", { defaultValue: "Помощник по платформе" })}
        >
          <header className={styles.head}>
            <div>
              <div className={styles.title}>
                {t("guide.title", { defaultValue: "Помощник по платформе" })}
              </div>
              <div className={styles.sub}>
                {t("guide.subtitle", {
                  defaultValue: "Отвечает по документации. О здоровье — к врачу.",
                })}
              </div>
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label={t("guide.close", { defaultValue: "Закрыть" })}
            >
              ×
            </button>
          </header>

          <div className={styles.feed} ref={feedRef}>
            {messages.length === 0 && (
              <>
                <p className={styles.hint}>
                  {t("guide.empty", {
                    defaultValue:
                      "Спросите, что умеет платформа и как ей пользоваться.",
                  })}
                </p>
                <div className={styles.starters}>
                  {starters.map((s) => (
                    <button key={s} type="button" className={styles.starter} onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? styles.mine : styles.theirs}
              >
                {m.content}
              </div>
            ))}

            {busy && (
              <div className={styles.theirs}>
                <span className={styles.dots} aria-hidden="true" />
                <span className="visually-hidden">
                  {t("guide.thinking", { defaultValue: "Думаю…" })}
                </span>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
          </div>

          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              ref={inputRef}
              className={styles.input}
              rows={2}
              maxLength={1000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={t("guide.placeholder", { defaultValue: "Ваш вопрос…" })}
              aria-label={t("guide.placeholder", { defaultValue: "Ваш вопрос…" })}
            />
            <button type="submit" className={styles.send} disabled={busy || !draft.trim()}>
              {t("guide.send", { defaultValue: "Спросить" })}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t("guide.title", { defaultValue: "Помощник по платформе" })}
      >
        {open ? "×" : "?"}
      </button>
    </div>
  );
}
