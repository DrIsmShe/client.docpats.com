// client/src/pages/radiology/LabReaderPage.jsx
//
// Станция «Анализы» — прохождение (учащийся). Маршрут:
// /radiology/labs/cases/:caseId
//
// Поток: старт → по каждому показателю отметить «норма» или «отклонение» →
// заключение и диагноз → сдача → оценка, награда арены и разбор (какие
// отклонения были значимы, эталонное заключение).

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { startLabAttempt, submitLabAttempt } from "../../api/radiology";
import { readApiError, isAuthError } from "../../api/education";
import "../education/education.css";
import "./radiology.css";

const DIFFICULTY_LABELS = { easy: "Лёгкий", medium: "Средний", hard: "Сложный" };
const SCORE_LABELS = {
  detection: "Выделение отклонений",
  diagnosis: "Диагноз",
  impression: "Заключение (текст)",
};

// Ключи для быстрой сверки: фраза целиком плюс отдельные слова. Фразу
// обрезаем по лимиту сервера (400) — развёрнутая клиническая формулировка
// бывает длиннее, и раньше сдача падала в 400, теряя ответ врача. Сама
// формулировка уходит отдельным полем diagnosisText и оценивается по
// вхождению принятого ключа или синонима.
const KEY_MAX = 400;

function diagnosisToKeys(text) {
  const phrase = String(text ?? "").trim().toLowerCase();
  if (!phrase) return [];
  const words = phrase
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 2)
    .map((w) => w.slice(0, KEY_MAX));
  return [...new Set([phrase.slice(0, KEY_MAX), ...words])];
}

export default function LabReaderPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [review, setReview] = useState(null);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [flags, setFlags] = useState({}); // {key: true} — отмечено как отклонение
  const [impressionText, setImpressionText] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  const submitted = Boolean(review);

  useEffect(() => {
    (async () => {
      try {
        const { attempt: a, case: c } = await startLabAttempt(caseId);
        setAttempt(a);
        setCaseData(c);
      } catch (err) {
        if (isAuthError(err)) return navigate("/login");
        setError(readApiError(err, "Не удалось открыть кейс"));
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId, navigate]);

  if (loading) return <div className="rad-page"><div className="edu-state">Загрузка…</div></div>;
  if (error && !caseData)
    return (
      <div className="rad-page">
        <div className="edu-error">{error}</div>
        <Link className="edu-btn edu-btn--ghost" to="/radiology">← В арену</Link>
      </div>
    );
  if (!caseData) return null;

  const abnormalKeys = new Set((review?.significantAbnormal ?? []).map((a) => a.key));

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const res = await submitLabAttempt(attempt._id, {
        flags: Object.keys(flags).filter((k) => flags[k]),
        impressionText: impressionText.trim(),
        diagnosisKeys: diagnosisToKeys(diagnosis),
        diagnosisText: diagnosis.trim(),
      });
      setAttempt(res.attempt);
      setReview(res.review);
      setGame(res.game ?? null);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось сдать попытку"));
    } finally {
      setBusy(false);
    }
  }

  const score = attempt?.score;

  return (
    <div className="rad-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <div>
          <h1 className="edu-title" style={{ marginBottom: 4 }}>{caseData.title}</h1>
          <div className="edu-subtitle">
            <span className="rad-tag">Анализы</span>
            {DIFFICULTY_LABELS[caseData.difficulty] ?? caseData.difficulty}
          </div>
        </div>
        <Link className="edu-btn edu-btn--ghost" to="/radiology">← В арену</Link>
      </div>

      {caseData.clinicalContext && (
        <div className="rad-panel" style={{ marginTop: 12 }}>
          <strong>Клинический контекст.</strong> {caseData.clinicalContext}
        </div>
      )}

      {error && <div className="edu-error" style={{ marginTop: 12 }}>{error}</div>}

      {/* Награда */}
      {submitted && game && (
        <div className="rad-panel arena-reward" style={{ marginTop: 12 }}>
          <div className="arena-reward-xp">+{game.pointsAwarded} XP</div>
          <div className="arena-reward-row">
            <span>🔥 Серия: {game.streak} дн.</span>
            <span>Ранг: {game.rank?.title}</span>
          </div>
          {game.rankedUp && <div className="arena-reward-rankup">🎉 Новый ранг: {game.rank?.title}!</div>}
          {(game.unlocked?.length ?? 0) > 0 && (
            <div className="arena-badges" style={{ marginTop: 8 }}>
              {game.unlocked.map((a) => (
                <span key={a.key} className="arena-badge">{a.icon} {a.title}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Результат */}
      {submitted && score && (
        <div className="rad-panel" style={{ marginTop: 12 }}>
          <div className="rad-score-total">
            {Math.round(score.total * 100)}%{" "}
            <span className={score.passed ? "rad-pass" : "rad-fail"} style={{ fontSize: 15 }}>
              {score.passed ? "— зачёт" : "— не сдано"}
            </span>
          </div>
          <div className="rad-score-bars">
            {["detection", "diagnosis", "impression"].map((k) =>
              score[k] == null ? null : (
                <div key={k} className="rad-bar">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{SCORE_LABELS[k]}</span>
                    <span>{Math.round(score[k] * 100)}%</span>
                  </div>
                  <div className="rad-bar-track"><div className="rad-bar-fill" style={{ width: `${Math.round(score[k] * 100)}%` }} /></div>
                </div>
              ),
            )}
          </div>
          <div className="edu-hint" style={{ marginTop: 10 }}>Ложных отметок: {attempt.falsePositives ?? 0}</div>
          {review.impression?.correctText && (
            <div style={{ marginTop: 12 }}>
              <strong>Эталонное заключение</strong>
              <div className="edu-hint" style={{ marginTop: 4 }}>{review.impression.correctText}</div>
            </div>
          )}
        </div>
      )}

      {/* Панель анализов */}
      <div className="rad-panel" style={{ marginTop: 12 }}>
        <div className="edu-card-title" style={{ fontSize: 15 }}>Лабораторная панель</div>
        {!submitted && (
          <div className="edu-hint" style={{ marginBottom: 8 }}>Отметьте показатели со значимым отклонением.</div>
        )}
        <div className="lab-table">
          <div className="lab-row lab-row--head">
            <span>Показатель</span>
            <span>Значение</span>
            <span>Референс</span>
            <span style={{ textAlign: "right" }}>Ваша оценка</span>
          </div>
          {caseData.panel.map((p) => {
            const flagged = Boolean(flags[p.key]);
            const isSignificant = submitted && abnormalKeys.has(p.key);
            return (
              <div key={p.key} className={`lab-row ${submitted && isSignificant ? "lab-row--significant" : ""}`}>
                <span>{p.name}</span>
                <span><strong>{p.value}</strong> {p.unit}</span>
                <span style={{ color: "#8b9aab" }}>{p.refRange || "—"}</span>
                <span style={{ textAlign: "right" }}>
                  {submitted ? (
                    <>
                      {flagged ? "отмечено" : "норма"}
                      {isSignificant && <span className="rad-fail"> · значимо ✓</span>}
                    </>
                  ) : (
                    <button
                      type="button"
                      className={`rad-ans ${flagged ? "rad-ans--finding" : "rad-ans--normal"}`}
                      onClick={() => setFlags((f) => ({ ...f, [p.key]: !f[p.key] }))}
                    >
                      {flagged ? "Отклонение" : "Норма"}
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Заключение */}
      {!submitted && (
        <div className="rad-panel" style={{ marginTop: 12 }}>
          <div className="edu-card-title" style={{ fontSize: 15 }}>Заключение</div>
          <textarea
            className="edu-textarea"
            rows={3}
            placeholder="Интерпретация: какой синдром/картина, чего не хватает…"
            value={impressionText}
            onChange={(e) => setImpressionText(e.target.value)}
          />
          <div className="edu-field-label">Диагноз</div>
          <input
            className="edu-input"
            placeholder="Напр.: железодефицитная анемия"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
          <div className="edu-btn-row" style={{ marginTop: 14 }}>
            <button type="button" className="edu-btn" onClick={handleSubmit} disabled={busy}>
              {busy ? "Проверяем…" : "Сдать и посмотреть разбор"}
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <div className="rad-panel" style={{ marginTop: 12 }}>
          <div className="edu-btn-row"><Link className="edu-btn" to="/radiology">В арену</Link></div>
        </div>
      )}
    </div>
  );
}
