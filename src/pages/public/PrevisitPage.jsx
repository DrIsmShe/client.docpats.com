// client/src/pages/public/PrevisitPage.jsx
//
// Опрос пациента перед приёмом. Открывается по ссылке из письма —
// без входа в аккаунт: у пациента клиники его может не быть вовсе.
//
// ФОРМА, А НЕ ЧАТ. Свободный разговор с встревоженным человеком
// неизбежно приходит к «а что у меня?», и отказывать приходится снова и
// снова. Форма не создаёт этого ожидания: она собирает рассказ, а
// отвечать будет врач.
//
// ВОПРОСЫ ПРИХОДЯТ С СЕРВЕРА. Своей копии здесь нет намеренно: две
// копии одного набора однажды разойдутся, и пациент ответит на вопрос,
// которого сервер не ждёт.

import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "../../axios";
import "./previsit.css";

const API = "/api/v1/previsit";

export default function PrevisitPage() {
  const { t } = useTranslation();
  const { token } = useParams();
  const [intake, setIntake] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/${token}`);
      setIntake(data.intake);
      setAnswers(data.intake.answers || {});
      if (data.intake.status === "submitted") {
        setDone({ urgent: [] });
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          "Не удалось открыть анкету. Возможно, ссылка устарела.",
      );
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function setAnswer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function toggleMulti(id, value) {
    setAnswers((prev) => {
      const cur = Array.isArray(prev[id]) ? prev[id] : [];
      return {
        ...prev,
        [id]: cur.includes(value)
          ? cur.filter((v) => v !== value)
          : [...cur, value],
      };
    });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await axios.post(`${API}/${token}`, { answers });
      setDone({ urgent: data.urgent || [] });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Не удалось отправить анкету");
    } finally {
      setBusy(false);
    }
  }

  if (error && !intake) {
    return (
      <div className="pv-page">
        <p className="pv-error">{error}</p>
      </div>
    );
  }

  if (!intake) return <div className="pv-page">{t("previsit.loading")}</div>;

  if (done) {
    return (
      <div className="pv-page">
        <h1>{t("previsit.doneTitle")}</h1>

        {/* Срочные признаки говорим СРАЗУ, а не откладываем до приёма:
            человек, отметивший боль в груди, не должен ждать записи. */}
        {done.urgent.length > 0 && (
          <div className="pv-urgent">
            <strong>{t("previsit.urgentTitle")}</strong>
            <p>
              {t("previsit.urgentBody", {
                signs: done.urgent.join(", "),
              })}
            </p>
          </div>
        )}

        <p className="pv-lead">
          {t("previsit.doneLead")}
        </p>
      </div>
    );
  }

  return (
    <div className="pv-page">
      <h1>{t("previsit.title")}</h1>
      <p className="pv-lead">
        {t("previsit.lead")}
      </p>

      <form onSubmit={submit} className="pv-form">
        {intake.questions.map((q) => (
          <fieldset key={q.id} className="pv-q">
            <legend className="pv-q__label">
              {q.label}
              {q.required && <span className="pv-q__req"> *</span>}
            </legend>
            {q.hint && <p className="pv-q__hint">{q.hint}</p>}

            {q.type === "text" && (
              <textarea
                className="pv-textarea"
                rows={3}
                maxLength={q.maxLength || 1000}
                value={answers[q.id] || ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            )}

            {q.type === "choice" && (
              <div className="pv-options">
                {q.options.map((o) => (
                  <label key={o.value} className="pv-option">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === o.value}
                      onChange={() => setAnswer(q.id, o.value)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "multi" && (
              <div className="pv-options">
                {q.options.map((o) => (
                  <label key={o.value} className="pv-option">
                    <input
                      type="checkbox"
                      checked={(answers[q.id] || []).includes(o.value)}
                      onChange={() => toggleMulti(q.id, o.value)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        ))}

        {error && <p className="pv-error">{error}</p>}

        <button type="submit" className="pv-submit" disabled={busy}>
          {busy ? "Отправляем…" : "Отправить врачу"}
        </button>

        <p className="pv-note">
          {t("previsit.note")}
        </p>
      </form>
    </div>
  );
}
