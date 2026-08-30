// client/src/components/newsletter/NewsletterModal.jsx
//
// Предложение подписаться на еженедельную рассылку.
//
// О поведении — оно здесь важнее вёрстки. Окно, которое выпрыгивает на
// первой секунде, читается как реклама и закрывается не глядя. Поэтому:
//
//   • только гостю. У врача и пациента подписка уже есть в настройках
//     уведомлений, и предлагать им её ещё раз — предлагать то, что есть;
//   • не сразу, а после вовлечения: человек должен успеть понять, куда
//     попал, иначе предложение не о чем;
//   • один раз. Закрыл — не показываем месяц, подписался — никогда;
//   • согласие галочкой, и она НЕ отмечена заранее. Это согласие на
//     рассылку, оно должно быть осознанным;
//   • закрыть можно всем, чем привычно: крестиком, Esc, щелчком мимо.
//     Ловушек вида «нет, я не хочу быть здоровым» здесь нет.

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./newsletterModal.css";

const API = process.env.REACT_APP_API_URL;

export default function NewsletterModal({ onClose, locale }) {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [audience, setAudience] = useState("doctor");
  const [agreed, setAgreed] = useState(false);
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const inputRef = useRef(null);
  const cardRef = useRef(null);

  // Фокус в поле и закрытие по Esc — обычные ожидания от модального окна.
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose("dismiss");
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  async function submit(e) {
    e.preventDefault();
    if (!valid || !agreed || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch(`${API}/api/v1/public/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          audience,
          locale,
          source: "modal",
        }),
      });
      if (!res.ok) throw new Error("bad response");
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div
      className="nl-overlay"
      onMouseDown={(e) => {
        // Именно mousedown и проверка цели: щелчок, начатый внутри карточки
        // и отпущенный снаружи (выделение текста), не должен закрывать окно.
        if (!cardRef.current?.contains(e.target)) onClose("dismiss");
      }}
    >
      <div
        className="nl-card"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nl-title"
      >
        <button
          type="button"
          className="nl-close"
          onClick={() => onClose("dismiss")}
          aria-label={t("newsletter.close", { defaultValue: "Закрыть" })}
        >
          ×
        </button>

        {state === "done" ? (
          <div className="nl-done">
            <div className="nl-done-mark" aria-hidden="true">
              ✓
            </div>
            <h2 id="nl-title" className="nl-title">
              {t("newsletter.doneTitle", {
                defaultValue: "Проверьте почту",
              })}
            </h2>
            <p className="nl-text">
              {t("newsletter.doneText", {
                defaultValue:
                  "Мы отправили письмо со ссылкой. Подписка начнётся после того, как вы её откроете — так мы защищаем чужие адреса от подписки без спроса.",
              })}
            </p>
            <button
              type="button"
              className="nl-submit"
              onClick={() => onClose("subscribed")}
            >
              {t("newsletter.doneCta", { defaultValue: "Понятно" })}
            </button>
          </div>
        ) : (
          <>
            <div className="nl-brand">DocPats</div>
            <h2 id="nl-title" className="nl-title">
              {t("newsletter.title", {
                defaultValue: "Коротко о главном — раз в неделю",
              })}
            </h2>
            <p className="nl-text">
              {t("newsletter.text", {
                defaultValue:
                  "Разбор медицинских новостей, исследования и предстоящие конференции. Пять материалов, отобранных редакцией, — без ежедневного потока.",
              })}
            </p>

            <form onSubmit={submit}>
              <div className="nl-audience" role="group">
                <button
                  type="button"
                  className={`nl-aud${audience === "doctor" ? " is-on" : ""}`}
                  onClick={() => setAudience("doctor")}
                >
                  {t("newsletter.asDoctor", { defaultValue: "Я врач" })}
                </button>
                <button
                  type="button"
                  className={`nl-aud${audience === "patient" ? " is-on" : ""}`}
                  onClick={() => setAudience("patient")}
                >
                  {t("newsletter.asPatient", { defaultValue: "Мне как пациенту" })}
                </button>
              </div>

              <input
                ref={inputRef}
                type="email"
                className="nl-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state === "error") setState("idle");
                }}
                placeholder={t("newsletter.placeholder", {
                  defaultValue: "you@example.com",
                })}
                autoComplete="email"
              />

              <label className="nl-agree">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>
                  {t("newsletter.agree", {
                    defaultValue:
                      "Согласен получать письма. Отписаться можно одной ссылкой в любом письме.",
                  })}
                </span>
              </label>

              {state === "error" && (
                <div className="nl-error">
                  {t("newsletter.error", {
                    defaultValue:
                      "Не получилось отправить. Попробуйте ещё раз чуть позже.",
                  })}
                </div>
              )}

              <button
                type="submit"
                className="nl-submit"
                disabled={!valid || !agreed || state === "sending"}
              >
                {state === "sending"
                  ? t("newsletter.sending", { defaultValue: "Отправляем…" })
                  : t("newsletter.cta", { defaultValue: "Подписаться" })}
              </button>
            </form>

            <button
              type="button"
              className="nl-later"
              onClick={() => onClose("dismiss")}
            >
              {t("newsletter.later", { defaultValue: "Не сейчас" })}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
