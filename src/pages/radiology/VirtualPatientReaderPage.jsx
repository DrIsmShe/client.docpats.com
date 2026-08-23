// client/src/pages/radiology/VirtualPatientReaderPage.jsx
//
// Режим «Виртуальный пациент». Маршрут: /arena/vp/cases/:caseId
//
// Поток: условия попытки → жалоба → ПРЕДВАРИТЕЛЬНЫЙ дифряд (в зачёте
// обязателен до обследований) → игрок НАЗНАЧАЕТ обследования (результат
// раскрывается по клику и фиксируется на сервере) → диагноз и обоснование.
// Оценка: диагноз + путь обследования + предварительная версия + обоснование.
//
// Предварительная версия называется по одной жалобе, до любых результатов, —
// это самый честный доступный признак собственного знания врача: на таком
// входе чужая модель почти не помогает. Обратной связи сразу после фиксации
// нет намеренно, иначе она превратилась бы в подсказку.

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  startVpAttempt,
  orderInvestigation,
  submitVpAttempt,
  fetchVpPolicy,
  commitVpDifferential,
} from "../../api/radiology";
import { readApiError, isAuthError } from "../../api/education";
import StationBriefing, {
  AttemptModeBadge,
  AttemptTimer,
  AttemptOutcomeNote,
  RulesText,
} from "./StationRules";
import useAttemptIntegrity from "./useAttemptIntegrity";
import "../education/education.css";
import "./radiology.css";


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

export default function VirtualPatientReaderPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("arena");
  const dir = i18n.language?.startsWith("ar") ? "rtl" : "ltr";

  const [attempt, setAttempt] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [results, setResults] = useState({}); // key -> {resultText, imageUrl, name}
  const [ordering, setOrdering] = useState(null); // key в процессе назначения
  const [review, setReview] = useState(null);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [diagnosis, setDiagnosis] = useState("");
  const [reasoning, setReasoning] = useState("");

  // Попытка не начинается при открытии страницы: сначала условия и выбор
  // режима (StationBriefing), потом старт. Зачётный таймер не должен
  // запускаться от простого любопытства.
  const [policy, setPolicy] = useState(null);
  const [mode, setMode] = useState("learn");
  const [priorText, setPriorText] = useState("");
  const [committing, setCommitting] = useState(false);

  const submitted = Boolean(review);
  const counted = Boolean(attempt?.counted);
  const committed = Boolean(attempt?.commitment?.committedAt);
  // В зачёте порядок жёсткий: своя версия по жалобе, потом обследования.
  const ordersLocked = counted && !committed && !submitted;
  const { onPaste, collect } = useAttemptIntegrity({
    active: Boolean(attempt) && !submitted,
    blockPaste: counted && !submitted,
  });

  useEffect(() => {
    (async () => {
      try {
        setPolicy(await fetchVpPolicy(caseId, { mode }));
      } catch (err) {
        if (isAuthError(err)) return navigate("/login");
        setError(readApiError(err, t("reader.openFailed")));
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId, navigate, mode, t]);

  const handleStart = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { attempt: a, case: c } = await startVpAttempt(caseId, { mode });
      setAttempt(a);
      setCaseData(c);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, t("reader.startFailed")));
    } finally {
      setBusy(false);
    }
  }, [caseId, mode, navigate, t]);

  const handleCommit = useCallback(async () => {
    setCommitting(true);
    setError(null);
    try {
      const commitment = await commitVpDifferential(attempt._id, priorText.trim());
      // Сервер возвращает только факт фиксации — «угадал или нет» будет после сдачи.
      setAttempt((a) => ({ ...a, commitment }));
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, t("vp.commitFailed")));
    } finally {
      setCommitting(false);
    }
  }, [attempt, priorText, navigate, t]);

  if (loading)
    return (
      <div className="rad-page" dir={dir}>
        <div className="edu-state">{t("loading")}</div>
      </div>
    );
  if (error && !caseData && !policy)
    return (
      <div className="rad-page" dir={dir}>
        <div className="edu-error">{error}</div>
        <Link className="edu-btn edu-btn--ghost" to="/arena">
          ← {t("backToArena")}
        </Link>
      </div>
    );

  // До старта — экран условий: что считается, что нет, что будет с результатом.
  if (!attempt) {
    return (
      <div className="rad-page" dir={dir}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
          <h1 className="edu-title" style={{ marginBottom: 4 }}>{t("vp.caseTitle")}</h1>
          <Link className="edu-btn edu-btn--ghost" to="/arena">
            ← {t("backToArena")}
          </Link>
        </div>
        <StationBriefing
          station="vp"
          policy={policy}
          mode={mode}
          onModeChange={setMode}
          onStart={handleStart}
          busy={busy}
          error={error}
        />
      </div>
    );
  }

  if (!caseData) return null;

  async function handleOrder(key) {
    if (results[key] || submitted) return;
    setOrdering(key);
    setError(null);
    try {
      const inv = await orderInvestigation(attempt._id, key);
      setResults((r) => ({ ...r, [key]: inv }));
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, t("vp.orderFailed")));
    } finally {
      setOrdering(null);
    }
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const res = await submitVpAttempt(attempt._id, {
        diagnosisKeys: diagnosisToKeys(diagnosis),
        diagnosisText: diagnosis.trim(),
        reasoningText: reasoning.trim(),
        integrity: collect(),
      });
      setAttempt(res.attempt);
      setReview(res.review);
      setGame(res.game ?? null);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, t("reader.submitFailed")));
    } finally {
      setBusy(false);
    }
  }

  const score = attempt?.score;
  const orderedCount = Object.keys(results).length;

  return (
    <div className="rad-page" dir={dir}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <div>
          <h1 className="edu-title" style={{ marginBottom: 4 }}>{caseData.title}</h1>
          <div className="edu-subtitle">
            <span className="rad-tag">{t("stationVp")}</span>
            {t(caseData.difficulty, caseData.difficulty)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <AttemptModeBadge attempt={attempt} />
          {attempt.variantLabel && (
            <span className="rules-badge" title={t("reader.variantTitle")}>
              {attempt.variantLabel}
            </span>
          )}
          {!submitted && <AttemptTimer deadlineAt={attempt.deadlineAt} />}
          <Link className="edu-btn edu-btn--ghost" to="/arena">
            ← {t("backToArena")}
          </Link>
        </div>
      </div>

      {/* Условия остаются под рукой во время попытки — свёрнутыми */}
      {!submitted && (
        <details className="rad-panel" style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            {t("reader.conditions")}
          </summary>
          <RulesText station="vp"
            policy={{
              ...policy,
              timeLimitSec: attempt.timeLimitSec,
              variantCount: caseData.variantCount,
            }} />
        </details>
      )}

      {/* Жалоба */}
      <div className="rad-panel" style={{ marginTop: 12 }}>
        <strong>{t("vp.patient")}</strong> {caseData.presentation}
      </div>

      {/* Предварительный дифряд — до обследований */}
      {!submitted && (
        <div className="rules-commit">
          <div className="edu-card-title" style={{ fontSize: 15 }}>
            {t("vp.priorH")}
          </div>
          {committed ? (
            <div className="edu-hint">
              {attempt.commitment?.orderedBefore
                ? t("vp.committedAfter", { count: attempt.commitment.orderedBefore })
                : t("vp.committedHistory")}
            </div>
          ) : (
            <>
              <div className="edu-hint" style={{ marginBottom: 6 }}>
                {t("vp.priorHint")}
                {ordersLocked && ` ${t("vp.priorLockedNote")}`}{" "}
                {t("vp.priorHint2")}
              </div>
              <textarea
                className="edu-textarea"
                rows={2}
                placeholder={t("vp.priorPlaceholder")}
                value={priorText}
                onChange={(e) => setPriorText(e.target.value)}
                onPaste={onPaste}
              />
              <div className="edu-btn-row" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="edu-btn"
                  onClick={handleCommit}
                  disabled={committing || priorText.trim().length < 2}
                >
                  {committing ? t("vp.committing") : t("vp.commitBtn")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <div className="edu-error" style={{ marginTop: 12 }}>{error}</div>}

      {/* Что стало с попыткой: в зачёт или нет и почему именно столько XP */}
      {submitted && <AttemptOutcomeNote attempt={attempt} game={game} />}

      {/* Награда */}
      {submitted && game && game.pointsAwarded > 0 && (
        <div className="rad-panel arena-reward" style={{ marginTop: 12 }}>
          <div className="arena-reward-xp">+{game.pointsAwarded} XP</div>
          <div className="arena-reward-row">
            <span>🔥 {t("reader.streakDays", { n: game.streak })}</span>
            <span>{t("reader.rank", {
                title: game.rank?.key
                  ? t(`ranks.${game.rank.key}`, { defaultValue: game.rank?.title })
                  : game.rank?.title,
              })}</span>
          </div>
          {game.rankedUp && (
            <div className="arena-reward-rankup">
              🎉 {t("reader.rankedUp", {
                title: game.rank?.key
                  ? t(`ranks.${game.rank.key}`, { defaultValue: game.rank?.title })
                  : game.rank?.title,
              })}
            </div>
          )}
          {(game.unlocked?.length ?? 0) > 0 && (
            <div className="arena-badges" style={{ marginTop: 8 }}>
              {game.unlocked.map((a) => <span key={a.key} className="arena-badge">{a.icon} {a.title}</span>)}
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
              {score.passed ? t("reader.passed") : t("reader.notPassed")}
            </span>
          </div>
          <div className="rad-score-bars">
            {["diagnosis", "workup", "prior", "reasoning"].map((k) =>
              score[k] == null ? null : (
                <div key={k} className="rad-bar">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{t(`vp.comp.${k}`)}</span><span>{Math.round(score[k] * 100)}%</span>
                  </div>
                  <div className="rad-bar-track"><div className="rad-bar-fill" style={{ width: `${Math.round(score[k] * 100)}%` }} /></div>
                </div>
              ),
            )}
          </div>
          {review.workupDetail && (
            <div className="edu-hint" style={{ marginTop: 10 }}>
              {t("vp.orderedCount", { n: review.workupDetail.orderedCount })}
              {review.workupDetail.missedNecessary?.length > 0 && (
                <> {t("vp.shouldHave", { list: review.workupDetail.missedNecessary.join(", ") })}</>
              )}
              {review.workupDetail.overordered?.length > 0 && (
                <> {t("vp.overordered", { list: review.workupDetail.overordered.join(", ") })}</>
              )}
            </div>
          )}
          {review.commitment && (
            <div style={{ marginTop: 12 }}>
              <strong>{t("vp.yourPriorH")}</strong>
              <div className="edu-hint" style={{ marginTop: 4 }}>
                «{review.commitment.text}» —{" "}
                {review.commitment.hit
                  ? t("vp.priorHit", { name: review.commitment.matched })
                  : t("vp.priorMiss")}
                {review.commitment.itemCount > 5 ? t("vp.priorTooWide") : ""}.
              </div>
            </div>
          )}
          {review.orderLog?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <strong>{t("vp.workupPathH")}</strong>
              <div className="edu-hint" style={{ marginTop: 4 }}>
                {review.orderLog
                  .map((o, i) => `${i + 1}. ${o.name}${o.necessary ? " ✓" : ` (${t("vp.extra")})`}`)
                  .join(" → ")}
              </div>
            </div>
          )}
          {review.diagnosis?.correctText && (
            <div style={{ marginTop: 12 }}>
              <strong>{t("vp.correctH")}</strong>
              <div className="edu-hint" style={{ marginTop: 4 }}>{review.diagnosis.correctText}</div>
            </div>
          )}
        </div>
      )}

      {/* Обследования */}
      <div className="rad-panel" style={{ marginTop: 12 }}>
        <div className="edu-card-title" style={{ fontSize: 15 }}>
          {t("vp.investigationsH")}{" "}
          {!submitted && (
            <small style={{ color: "#8b9aab" }}>{t("vp.orderedSmall", { n: orderedCount })}</small>
          )}
        </div>
        {!submitted && (
          <div className="edu-hint" style={{ marginBottom: 8 }}>{t("vp.orderHint")}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {caseData.investigations.map((inv) => {
            const done = Boolean(results[inv.key]);
            const necessary = submitted && review.investigations?.find((x) => x.name === inv.name)?.necessary;
            return (
              <div key={inv.key} className="vp-inv">
                <div className="vp-inv-head">
                  <span>
                    {inv.category && <span className="rad-tag">{inv.category}</span>}
                    <strong>{inv.name}</strong>
                    {necessary && (
                      <span className="rad-pass" style={{ marginInlineStart: 8, fontSize: 12 }}>
                        {t("vp.wasNeeded")}
                      </span>
                    )}
                  </span>
                  {!submitted && !done && (
                    <button
                      type="button"
                      className="edu-btn edu-btn--ghost"
                      style={{ padding: "4px 12px", fontSize: 13 }}
                      disabled={ordering === inv.key || ordersLocked}
                      title={ordersLocked ? t("vp.lockedTitle") : undefined}
                      onClick={() => handleOrder(inv.key)}
                    >
                      {ordering === inv.key ? "…" : t("vp.orderBtn")}
                    </button>
                  )}
                  {done && !submitted && (
                    <span style={{ color: "#15803d", fontSize: 13 }}>{t("vp.orderedMark")}</span>
                  )}
                </div>
                {results[inv.key] && (
                  <div className="vp-inv-result">
                    {results[inv.key].imageUrl && (
                      <img src={results[inv.key].imageUrl} alt="" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 8 }} />
                    )}
                    <div style={{ whiteSpace: "pre-wrap" }}>{results[inv.key].resultText}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Диагноз */}
      {!submitted && (
        <div className="rad-panel" style={{ marginTop: 12 }}>
          <div className="edu-card-title" style={{ fontSize: 15 }}>{t("vp.diagnosisH")}</div>
          {counted && (
            <div className="edu-hint" style={{ marginBottom: 6 }}>{t("reader.examPasteOff")}</div>
          )}
          <input className="edu-input" placeholder={t("vp.diagnosisPlaceholder")} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} onPaste={onPaste} />
          <div className="edu-field-label">{t("vp.reasoningH")}</div>
          <textarea className="edu-textarea" rows={3} placeholder={t("vp.reasoningPlaceholder")} value={reasoning} onChange={(e) => setReasoning(e.target.value)} onPaste={onPaste} />
          <div className="edu-btn-row" style={{ marginTop: 14 }}>
            <button type="button" className="edu-btn" onClick={handleSubmit} disabled={busy}>
              {busy ? t("reader.checking") : t("vp.submitBtn")}
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <div className="rad-panel" style={{ marginTop: 12 }}>
          <div className="edu-btn-row">
            <Link className="edu-btn" to="/arena">{t("backToArena")}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
