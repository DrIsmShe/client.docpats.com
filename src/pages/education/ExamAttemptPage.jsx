// client/src/pages/education/ExamAttemptPage.jsx
//
// Прохождение попытки и разбор результата. /education/attempts/:attemptId
//
// Страница работает в двух состояниях:
//   in_progress — тренажёр: вопрос, варианты, ответ;
//   завершено   — итог: балл, разбивка по темам, разбор каждого вопроса.
//
// Правильные ответы приходят с бэкенда ТОЛЬКО после ответа (в режиме
// tutor) или после сдачи. Проверка ответа целиком на сервере — здесь мы
// лишь отображаем то, что он вернул.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  fetchAttempt,
  submitAnswer,
  finishAttempt,
  readApiError,
  isAuthError,
} from "../../api/education";
import "./education.css";

function formatTimeLeft(ms) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function ExamAttemptPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("education");
  // Арабский разворачивает страницу — своего layout у зоны /education нет.
  // На тексты самих вопросов не влияет: они приходят на языке теста.
  const dir = i18n.language?.startsWith("ar") ? "rtl" : "ltr";

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null); // разбор в режиме tutor
  const [sending, setSending] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(null);

  // Момент показа текущего вопроса — из него считается время на ответ.
  const questionShownAt = useRef(Date.now());

  const handleApiError = useCallback(
    (err, fallback) => {
      if (isAuthError(err)) {
        navigate("/login");
        return;
      }
      setError(readApiError(err, fallback));
    },
    [navigate],
  );

  const load = useCallback(async () => {
    try {
      const data = await fetchAttempt(attemptId);
      setAttempt(data);

      // Продолжаем с первого неотвеченного вопроса.
      if (data.status === "in_progress") {
        const firstUnanswered = data.questions.findIndex((q) => !q.response);
        setCurrentIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
      }
      return data;
    } catch (err) {
      handleApiError(err, t("attempt.errors.load"));
      return null;
    } finally {
      setLoading(false);
    }
  }, [attemptId, handleApiError, t]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Таймер ───
  // Дедлайн принадлежит серверу; здесь только отображение и авто-сдача,
  // чтобы учащийся не завис на экране после истечения времени.
  useEffect(() => {
    if (!attempt?.expiresAt || attempt.status !== "in_progress") return undefined;

    const deadline = new Date(attempt.expiresAt).getTime();
    const tick = () => {
      const left = deadline - Date.now();
      setTimeLeftMs(left);
      if (left <= 0) {
        finishAttempt(attemptId)
          .then(() => load())
          .catch((err) => handleApiError(err, t("attempt.errors.finish")));
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [attempt?.expiresAt, attempt?.status, attemptId, load, handleApiError, t]);

  const question = attempt?.questions?.[currentIndex];
  const isTutor = attempt?.mode === "tutor";
  const isFinished = attempt && attempt.status !== "in_progress";

  // Восстанавливаем ранее данный ответ при переходе между вопросами.
  useEffect(() => {
    setFeedback(null);
    setSelected(question?.response?.selectedKeys ?? []);
    questionShownAt.current = Date.now();
  }, [currentIndex, question?.id, question?.response?.selectedKeys]);

  const answeredCount = useMemo(
    () => attempt?.questions?.filter((q) => q.response).length ?? 0,
    [attempt],
  );

  function toggleOption(key) {
    if (feedback) return; // разбор уже показан — ответ зафиксирован
    const multi = question?.type === "multi";
    setSelected((prev) => {
      if (!multi) return [key];
      return prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
    });
  }

  async function handleAnswer() {
    if (!question || selected.length === 0) return;
    setSending(true);
    setError(null);
    try {
      const result = await submitAnswer(attemptId, {
        itemId: question.id,
        selectedKeys: selected,
        timeSpentMs: Date.now() - questionShownAt.current,
      });

      if (isTutor) {
        // Разбор показываем сразу — это и есть суть режима.
        setFeedback(result);
      } else {
        await goNext();
      }
    } catch (err) {
      // Время вышло — сервер сам зафиксировал попытку, перечитываем её.
      if (err?.response?.status === 409) {
        await load();
      } else {
        handleApiError(err, t("attempt.errors.submit"));
      }
    } finally {
      setSending(false);
    }
  }

  async function goNext() {
    setFeedback(null);
    if (currentIndex + 1 < (attempt?.questions?.length ?? 0)) {
      setCurrentIndex((i) => i + 1);
      // Локально помечаем вопрос отвеченным, чтобы прогресс не отставал.
      setAttempt((prev) => {
        if (!prev) return prev;
        const questions = prev.questions.map((q, i) =>
          i === currentIndex && !q.response
            ? { ...q, response: { selectedKeys: selected } }
            : q,
        );
        return { ...prev, questions };
      });
    } else {
      await load();
    }
  }

  async function handleFinish() {
    setSending(true);
    try {
      await finishAttempt(attemptId);
      await load();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      handleApiError(err, t("attempt.errors.finish"));
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="edu-page" dir={dir}>
        <div className="edu-state">{t("attempt.loading")}</div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="edu-page" dir={dir}>
        {error && <div className="edu-error">{error}</div>}
        <Link to="/education" className="edu-btn">
          {t("attempt.toCatalog")}
        </Link>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  //  Результат
  // ─────────────────────────────────────────────────────────────
  if (isFinished) {
    const score = attempt.score ?? {};
    const passed = score.passed;

    return (
      <div className="edu-page" dir={dir}>
        <Link
          to={`/education/programs/${attempt.programId}`}
          className="edu-back"
        >
          ← {t("attempt.toProgram")}
        </Link>

        {error && <div className="edu-error">{error}</div>}

        <div className="edu-card">
          <div className="edu-score">
            <div
              className={`edu-score-value ${passed ? "edu-score-value--pass" : "edu-score-value--fail"}`}
            >
              {score.percent}%
            </div>
            <div className="edu-score-caption">
              {t("attempt.result.score", {
                correct: score.correct,
                total: score.total,
              })}
              {score.passingScorePercent != null && (
                <>
                  {" · "}
                  {passed
                    ? t("attempt.result.thresholdPassed", {
                        percent: score.passingScorePercent,
                      })
                    : t("attempt.result.thresholdFailed", {
                        percent: score.passingScorePercent,
                      })}
                </>
              )}
            </div>
            {attempt.status === "expired" && (
              <div className="edu-score-caption">
                {t("attempt.result.expired")}
              </div>
            )}
          </div>

          {Array.isArray(score.byTopic) && score.byTopic.length > 0 && (
            <>
              <div className="edu-section-title">
                {t("attempt.result.byTopic")}
              </div>
              {score.byTopic.map((topic) => (
                <div key={topic.topicCode ?? "none"} className="edu-topic">
                  <div className="edu-topic-head">
                    <span className="edu-topic-name">
                      {topic.title ?? t("attempt.result.noTopic")}
                    </span>
                    <span className="edu-topic-value">
                      {topic.percent}% · {topic.correct}/{topic.total}
                    </span>
                  </div>
                  <div className="edu-bar">
                    <div
                      className={`edu-bar-fill ${
                        topic.percent < 50
                          ? "edu-bar-fill--bad"
                          : topic.percent < 70
                            ? "edu-bar-fill--weak"
                            : ""
                      }`}
                      style={{ width: `${topic.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Разбор каждого вопроса */}
        <div className="edu-card">
          <h2 className="edu-card-title">{t("attempt.review.title")}</h2>
          {attempt.questions.map((q, i) => {
            const answered = Boolean(q.response);
            const correct = q.response?.isCorrect;
            return (
              <div key={q.id} className="edu-review-item">
                <div className="edu-review-stem">
                  <strong>{i + 1}.</strong> {q.stem}
                </div>
                <div
                  className="edu-review-verdict"
                  style={{
                    color: !answered ? "#8b9aab" : correct ? "#1c7a42" : "#b3352a",
                  }}
                >
                  {!answered
                    ? t("attempt.verdict.unanswered")
                    : correct
                      ? t("attempt.verdict.correct")
                      : t("attempt.verdict.incorrect")}
                </div>

                {q.correctKeys && (
                  <div className="edu-explain" style={{ marginTop: 10 }}>
                    <p>
                      <strong>{t("attempt.review.correctAnswer")}</strong>{" "}
                      {q.correctKeys.join(", ")}
                    </p>
                    {q.explanation && <p>{q.explanation}</p>}
                    {q.optionExplanations?.map((o) => (
                      <div key={o.key} className="edu-explain-option">
                        <strong>{o.key}.</strong> {o.explanation}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="edu-btn-row">
          <Link
            to={`/education/programs/${attempt.programId}`}
            className="edu-btn"
          >
            {t("attempt.toProgram")}
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  //  Прохождение
  // ─────────────────────────────────────────────────────────────
  const total = attempt.questions.length;
  const progressPercent = Math.round((answeredCount / total) * 100);

  return (
    <div className="edu-page" dir={dir}>
      <div className="edu-runner-head">
        <span>
          {t("attempt.runner.progress", {
            current: currentIndex + 1,
            total,
            answered: answeredCount,
          })}
        </span>
        {timeLeftMs != null && (
          <span
            className={`edu-timer ${timeLeftMs < 60000 ? "edu-timer--low" : ""}`}
          >
            {formatTimeLeft(timeLeftMs)}
          </span>
        )}
      </div>

      <div className="edu-progress">
        <div
          className="edu-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {error && <div className="edu-error">{error}</div>}

      {question && (
        <div className="edu-card">
          <p className="edu-stem">{question.stem}</p>
          {question.stemImageUrl && (
            <img
              src={question.stemImageUrl}
              alt=""
              style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 16 }}
            />
          )}

          <div className="edu-options">
            {question.options.map((option) => {
              const isSelected = selected.includes(option.key);
              // Подсветка верного/неверного — только после разбора.
              let stateClass = "";
              if (feedback) {
                if (feedback.correctKeys?.includes(option.key)) {
                  stateClass = "edu-option--correct";
                } else if (isSelected) {
                  stateClass = "edu-option--wrong";
                }
              } else if (isSelected) {
                stateClass = "edu-option--selected";
              }

              return (
                <button
                  key={option.key}
                  type="button"
                  className={`edu-option ${stateClass}`}
                  disabled={Boolean(feedback) || sending}
                  onClick={() => toggleOption(option.key)}
                >
                  <span className="edu-option-key">{option.key}</span>
                  <span>{option.text}</span>
                </button>
              );
            })}
          </div>

          {/* Разбор в режиме тренировки */}
          {feedback && (
            <div className="edu-explain">
              <div
                className={`edu-explain-verdict ${
                  feedback.isCorrect
                    ? "edu-explain-verdict--ok"
                    : "edu-explain-verdict--no"
                }`}
              >
                {feedback.isCorrect
                  ? t("attempt.verdict.correct")
                  : t("attempt.verdict.incorrect")}
              </div>
              {feedback.explanation && <p>{feedback.explanation}</p>}
              {feedback.optionExplanations?.map((o) => (
                <div key={o.key} className="edu-explain-option">
                  <strong>{o.key}.</strong> {o.explanation}
                </div>
              ))}
              {feedback.references?.length > 0 && (
                <div className="edu-explain-refs">
                  {t("attempt.explain.sources")}{" "}
                  {feedback.references
                    .map((r) => [r.title, r.year].filter(Boolean).join(", "))
                    .join(" · ")}
                </div>
              )}
            </div>
          )}

          <div className="edu-btn-row">
            {!feedback && (
              <button
                type="button"
                className="edu-btn"
                disabled={selected.length === 0 || sending}
                onClick={handleAnswer}
              >
                {sending
                  ? t("attempt.runner.sending")
                  : t("attempt.runner.answer")}
              </button>
            )}

            {feedback && (
              <button type="button" className="edu-btn" onClick={goNext}>
                {currentIndex + 1 < total
                  ? t("attempt.runner.next")
                  : t("attempt.runner.toResult")}
              </button>
            )}

            {currentIndex > 0 && (
              <button
                type="button"
                className="edu-btn edu-btn--ghost"
                onClick={() => setCurrentIndex((i) => i - 1)}
                disabled={sending}
              >
                {t("shared.actions.back")}
              </button>
            )}

            {!feedback && currentIndex + 1 < total && (
              <button
                type="button"
                className="edu-btn edu-btn--ghost"
                onClick={() => setCurrentIndex((i) => i + 1)}
                disabled={sending}
              >
                {t("attempt.runner.skip")}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="edu-btn-row">
        <button
          type="button"
          className="edu-btn edu-btn--ghost"
          onClick={handleFinish}
          disabled={sending}
        >
          {t("attempt.runner.finish")}
        </button>
      </div>
      <p className="edu-subtitle" style={{ marginTop: 10, fontSize: 13 }}>
        {t("attempt.runner.finishHint")}
      </p>
    </div>
  );
}
