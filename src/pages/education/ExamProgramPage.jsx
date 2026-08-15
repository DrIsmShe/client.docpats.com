// client/src/pages/education/ExamProgramPage.jsx
//
// Страница программы: карта тем, готовность по темам, запуск попытки,
// история прошлых попыток. /education/programs/:programId

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  fetchProgram,
  fetchReadiness,
  fetchAttempts,
  fetchProgramBlocks,
  fetchQuota,
  startAttempt,
  readApiError,
  isAuthError,
} from "../../api/education";
import BackToCabinet from "./BackToCabinet";
import "./education.css";

// Названия режимов берём из shared.modes, пояснения — из program.modeHints.
const MODES = ["tutor", "timed", "mock", "drill"];

// Цвет полосы: ниже 50% — красный, ниже 70% — оранжевый.
function barClass(percent, untested) {
  if (untested) return "";
  if (percent < 50) return "edu-bar-fill--bad";
  if (percent < 70) return "edu-bar-fill--weak";
  return "";
}

export default function ExamProgramPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("education");
  // Арабский разворачивает страницу — своего layout у зоны /education нет.
  const dir = i18n.language?.startsWith("ar") ? "rtl" : "ltr";

  const [program, setProgram] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [blocksInfo, setBlocksInfo] = useState(null);
  // null — список ещё не приехал: до этого момента ничего не блокируем,
  // иначе страница на секунду показывала бы всё запертым.
  const [allowedModes, setAllowedModes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [p, r, a, b, q] = await Promise.all([
          fetchProgram(programId),
          fetchReadiness(programId),
          fetchAttempts({ programId, limit: 50 }),
          fetchProgramBlocks(programId),
          // Режимы приезжают вместе с квотой: без них страница предлагала бы
          // кнопки, на которые сервер отвечает отказом.
          fetchQuota().catch(() => null),
        ]);
        if (cancelled) return;
        setProgram(p);
        setReadiness(r);
        setAttempts(a);
        setBlocksInfo(b);
        setAllowedModes(Array.isArray(q?.modes) ? q.modes : null);
      } catch (err) {
        if (!cancelled) handleApiError(err, t("program.errors.loadProgram"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [programId, handleApiError, t]);

  async function handleStart(mode, blockIndex = null) {
    const key = blockIndex == null ? mode : `block-${blockIndex}-${mode}`;
    setStarting(key);
    setError(null);
    try {
      const payload = { programId, mode };
      if (blockIndex != null) payload.blockIndex = blockIndex;
      const attempt = await startAttempt(payload);
      navigate(`/education/attempts/${attempt.id}`);
    } catch (err) {
      // Незавершённая попытка — не ошибка, а повод её продолжить. Ищем именно
      // ту, что совпадает по блоку (или незаблочную для режимов по всему тесту).
      const unfinished = attempts.find(
        (a) =>
          a.status === "in_progress" &&
          (blockIndex == null
            ? a.blockIndex == null
            : a.blockIndex === blockIndex),
      );
      if (err?.response?.status === 409 && unfinished) {
        navigate(`/education/attempts/${unfinished._id}`);
        return;
      }
      handleApiError(err, t("program.errors.startAttempt"));
      setStarting(null);
    }
  }

  if (loading) {
    return (
      <div className="edu-page" dir={dir}>
        <div className="edu-state">{t("program.loading")}</div>
      </div>
    );
  }

  // Незавершённая попытка по всему тесту (обычные режимы) и отдельно —
  // незавершённые блоки: блоки проходятся независимо друг от друга.
  const inProgress = attempts.find(
    (a) => a.status === "in_progress" && a.blockIndex == null,
  );
  const inProgressBlock = new Map();
  for (const a of attempts) {
    if (a.status === "in_progress" && a.blockIndex != null) {
      inProgressBlock.set(a.blockIndex, a);
    }
  }

  const blocks = blocksInfo?.blocks ?? [];
  const hasBlocks = Boolean(blocksInfo?.blockSize) && blocks.length > 0;

  return (
    <div className="edu-page" dir={dir}>
      {/* На страницу теста заходят и по прямой ссылке, минуя каталог,
          поэтому рядом с возвратом в каталог — выход из модуля. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Link to="/education" className="edu-back">
          ← {t("program.allExams")}
        </Link>
        <BackToCabinet />
      </div>

      {error && <div className="edu-error">{error}</div>}

      {program && (
        <>
          <h1 className="edu-title">{program.title}</h1>
          <p className="edu-subtitle">{program.description}</p>
        </>
      )}

      {inProgress && (
        <div className="edu-card">
          <h2 className="edu-card-title">{t("program.inProgress.title")}</h2>
          <p className="edu-subtitle" style={{ margin: 0 }}>
            {t("program.inProgress.hint")}
          </p>
          <div className="edu-btn-row">
            <Link
              className="edu-btn"
              to={`/education/attempts/${inProgress._id}`}
            >
              {t("program.continue")}
            </Link>
          </div>
        </div>
      )}

      {/* ─── Готовность ─── */}
      {readiness && (
        <div className="edu-card">
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <div>
              <div className="edu-readiness-value">
                {readiness.readinessPercent}%
              </div>
              <div className="edu-readiness-label">
                {t("program.readiness.label")}
              </div>
            </div>
            {readiness.passingScorePercent != null && (
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div className="edu-readiness-label">
                  {t("program.readiness.passingScore")}
                </div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>
                  {readiness.passingScorePercent}%
                </div>
              </div>
            )}
          </div>

          <div className="edu-section-title">{t("program.topics.title")}</div>
          {readiness.topics.map((topic) => (
            <div
              key={topic.topicCode}
              className={`edu-topic ${topic.untested ? "edu-topic--untested" : ""}`}
            >
              <div className="edu-topic-head">
                <span className="edu-topic-name">
                  {topic.title}{" "}
                  <span style={{ color: "#8b9aab", fontWeight: 400 }}>
                    ·{" "}
                    {t("program.topics.weight", {
                      percent: topic.weightPercent,
                    })}
                  </span>
                </span>
                <span className="edu-topic-value">
                  {topic.untested
                    ? t("program.topics.noData")
                    : `${topic.percent}% · ${topic.correct}/${topic.answered}`}
                </span>
              </div>
              <div className="edu-bar">
                <div
                  className={`edu-bar-fill ${barClass(topic.percent, topic.untested)}`}
                  style={{ width: `${topic.untested ? 100 : topic.percent}%` }}
                />
              </div>
            </div>
          ))}
          <p className="edu-subtitle" style={{ margin: "12px 0 0", fontSize: 13 }}>
            {t("program.topics.note")}
          </p>
        </div>
      )}

      {/* ─── Блоки ─── */}
      {hasBlocks && (
        <div className="edu-card">
          <h2 className="edu-card-title">{t("program.blocks.title")}</h2>
          <p className="edu-subtitle" style={{ margin: "0 0 6px" }}>
            {t("program.blocks.hint", {
              blockSize: blocksInfo.blockSize,
              totalCount: blocksInfo.totalCount,
            })}
          </p>
          {blocks.map((b) => {
            const running = inProgressBlock.get(b.index);
            return (
              <div key={b.index} className="edu-block-row">
                <div className="edu-block-info">
                  <div className="edu-block-name">
                    {t("program.blocks.name", { number: b.index + 1 })}
                  </div>
                  <div className="edu-block-range">
                    {t("program.blocks.range", {
                      from: b.from,
                      to: b.to,
                      count: b.count,
                    })}
                  </div>
                </div>
                <div className="edu-block-actions">
                  {running ? (
                    <Link
                      className="edu-btn"
                      to={`/education/attempts/${running._id}`}
                    >
                      {t("program.continue")}
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="edu-btn edu-btn--ghost"
                        disabled={Boolean(starting)}
                        onClick={() => handleStart("tutor", b.index)}
                      >
                        {starting === `block-${b.index}-tutor`
                          ? "…"
                          : t("shared.modes.tutor")}
                      </button>
                      <button
                        type="button"
                        className="edu-btn edu-btn--ghost"
                        disabled={Boolean(starting)}
                        onClick={() => handleStart("timed", b.index)}
                      >
                        {starting === `block-${b.index}-timed`
                          ? "…"
                          : t("shared.modes.timed")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Режимы ─── */}
      <div className="edu-card">
        <h2 className="edu-card-title">
          {hasBlocks ? t("program.start.titleWhole") : t("program.start.title")}
        </h2>
        {MODES.map((modeKey) => {
          // Режим заперт, только когда список уже приехал и его там нет.
          const locked =
            Array.isArray(allowedModes) && !allowedModes.includes(modeKey);
          return (
            <div
              key={modeKey}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "12px 0",
                borderTop: "1px solid #eef2f7",
                opacity: locked ? 0.55 : 1,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>
                  {t(`shared.modes.${modeKey}`)}
                </div>
                <div style={{ fontSize: 13.5, color: "#5a6b7f" }}>
                  {locked
                    ? t("program.modeLocked", {
                        defaultValue:
                          "Входит в Exam Prep и в тарифы Growth и Pro",
                      })
                    : t(`program.modeHints.${modeKey}`)}
                </div>
              </div>
              <button
                type="button"
                className="edu-btn edu-btn--ghost"
                disabled={locked || Boolean(starting) || Boolean(inProgress)}
                onClick={() => handleStart(modeKey)}
              >
                {locked
                  ? t("program.start.locked", { defaultValue: "Недоступно" })
                  : starting === modeKey
                    ? t("program.start.preparing")
                    : t("program.start.action")}
              </button>
            </div>
          );
        })}
      </div>

      {/* ─── История ─── */}
      {attempts.length > 0 && (
        <div className="edu-card">
          <h2 className="edu-card-title">{t("program.history.title")}</h2>
          {attempts
            .filter((a) => a.status !== "in_progress")
            .map((attempt) => (
              <Link
                key={attempt._id}
                to={`/education/attempts/${attempt._id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderTop: "1px solid #eef2f7",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span>
                  {t(`shared.modes.${attempt.mode}`, {
                    defaultValue: attempt.mode,
                  })}{" "}
                  <span style={{ color: "#8b9aab" }}>
                    ·{" "}
                    {new Date(attempt.createdAt).toLocaleDateString(
                      i18n.language,
                    )}
                  </span>
                </span>
                <strong>
                  {attempt.score?.correct}/{attempt.score?.total} ·{" "}
                  {attempt.score?.percent}%
                </strong>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
