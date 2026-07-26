// client/src/pages/radiology/RadiologyReaderPage.jsx
//
// Ридер учащегося. Маршрут: /radiology/cases/:caseId
//
// Поток: старт попытки → осмотр снимка по протоколу → разметка находок
// (выбрал ярлык слева, отметил на снимке) → чек-лист → заключение и
// диагноз → сдача. После сдачи раскрывается разбор: эталон эксперта
// (янтарный, пунктир) поверх ответа учащегося (синий) + покомпонентная
// оценка.
//
// Эталон приходит с сервера ТОЛЬКО после сдачи (submitAttempt.review) —
// до этого его на клиенте нет.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  startAttempt,
  submitAttempt,
  aiAnalyzeAttempt,
  submitDuelResult,
  fetchAttemptPolicy,
} from "../../api/radiology";
import StationBriefing, {
  AttemptModeBadge,
  AttemptTimer,
  AttemptOutcomeNote,
  RulesText,
} from "./StationRules";
import useAttemptIntegrity from "./useAttemptIntegrity";
import { readApiError, isAuthError } from "../../api/education";
import RadiologyCanvas from "./components/RadiologyCanvas";
import { MODALITY_LABELS } from "./RadiologyCatalogPage";
import "../education/education.css";
import "./radiology.css";

const SCORE_LABELS = {
  detection: "Обнаружение находок",
  classification: "Правильность названий",
  checklist: "Полнота осмотра",
  diagnosis: "Диагноз",
  aiImpression: "Заключение (текст)",
};

// Диагноз из свободной строки → ключи: отдельные слова + вся фраза
// (в нижнем регистре). Сервер сверит их с принятым набором автора.
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

export default function RadiologyReaderPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duelId = searchParams.get("duel");
  const [duelNote, setDuelNote] = useState(null);

  const [attempt, setAttempt] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [activeImg, setActiveImg] = useState(0);
  const [tool, setTool] = useState("point");
  const [activeLabel, setActiveLabel] = useState(null);
  const [findings, setFindings] = useState([]); // {imageIndex,label,shape,coords}
  const [areaStatus, setAreaStatus] = useState({}); // {areaKey: "normal"|"finding"}
  const [impressionText, setImpressionText] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [gameReward, setGameReward] = useState(null);

  // Попытка не начинается при открытии страницы: сначала врач читает условия
  // (StationBriefing) и выбирает режим — зачётный таймер не должен запускаться
  // от простого любопытства, а слот «зачёт раз в 24 часа» тратится с начала.
  const [policy, setPolicy] = useState(null);
  const [mode, setMode] = useState("learn");

  const submitted = Boolean(review);
  const counted = Boolean(attempt?.counted);
  const { onPaste, collect } = useAttemptIntegrity({
    active: Boolean(attempt) && !submitted,
    blockPaste: counted && !submitted,
  });

  useEffect(() => {
    (async () => {
      try {
        setPolicy(await fetchAttemptPolicy(caseId, { mode }));
      } catch (err) {
        if (isAuthError(err)) return navigate("/login");
        setError(readApiError(err, "Не удалось открыть кейс"));
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId, navigate, mode]);

  const handleStart = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      // Дуэль — всегда зачётная: соревноваться тренировочными прогонами,
      // где разрешён ИИ и разбор уже виден, было бы бессмысленно.
      const { attempt: a, case: c } = await startAttempt(caseId, {
        mode: duelId ? "exam" : mode,
      });
      setAttempt(a);
      setCaseData(c);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось начать попытку"));
    } finally {
      setBusy(false);
    }
  }, [caseId, mode, duelId, navigate]);

  // Ключ находки → человекочитаемый ярлык (для подписей на снимке и в списке).
  const labelOf = useMemo(() => {
    const map = new Map(
      (caseData?.findingPalette ?? []).map((t) => [t.key, t.label]),
    );
    return (key) => map.get(key) ?? key;
  }, [caseData]);

  if (loading) return <div className="rad-page"><div className="edu-state">Загрузка…</div></div>;
  if (error && !caseData && !policy)
    return (
      <div className="rad-page">
        <div className="edu-error">{error}</div>
        <Link className="edu-btn edu-btn--ghost" to="/radiology">← К каталогу</Link>
      </div>
    );

  // До старта — экран условий: что считается, что нет, что будет с результатом.
  if (!attempt) {
    return (
      <div className="rad-page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
          <h1 className="edu-title" style={{ marginBottom: 4 }}>Кейс станции «Снимки»</h1>
          <Link className="edu-btn edu-btn--ghost" to="/radiology">← К каталогу</Link>
        </div>
        {duelId && (
          <div className="rules-warn" style={{ marginTop: 12 }}>
            Это дуэль: попытка пойдёт как зачётная, с таймером. Тренировочный режим
            здесь недоступен — иначе сравнивать результаты было бы нечестно.
          </div>
        )}
        <StationBriefing
          station="radiology"
          policy={policy}
          mode={duelId ? "exam" : mode}
          onModeChange={duelId ? () => {} : setMode}
          onStart={handleStart}
          busy={busy}
          error={error}
        />
      </div>
    );
  }

  if (!caseData) return null;

  const rs = caseData.readingSystem;
  const images = caseData.images ?? [];
  const image = images[activeImg];

  // Аннотации активного кадра: ответ учащегося (синий) + эталон в разборе.
  const myAnn = findings
    .filter((f) => f.imageIndex === activeImg)
    .map((f) => ({ shape: f.shape, coords: f.coords, label: labelOf(f.label) }));
  const expertAnn = submitted
    ? (review.findings ?? [])
        .filter((f) => f.imageIndex === activeImg)
        .map((f) => ({
          shape: f.geometry.shape,
          coords: f.geometry.coords,
          label: labelOf(f.label),
        }))
    : [];

  function handleCreate(ann) {
    if (submitted) return;
    if (!activeLabel) {
      setError("Сначала выберите находку из списка справа, затем отметьте её на снимке");
      return;
    }
    setError(null);
    setFindings((prev) => [
      ...prev,
      { imageIndex: activeImg, label: activeLabel, shape: ann.shape, coords: ann.coords },
    ]);
  }

  function removeFinding(idx) {
    setFindings((prev) => prev.filter((_, i) => i !== idx));
  }

  // Явный ответ по каждой системе осмотра: «норма» или «есть находка». Это и
  // есть структурированная «система нормального ответа» — врач не просто
  // «посмотрел», а фиксирует результат по каждой области. В зачёт полноты
  // осмотра идёт любая область, по которой дан ответ. Повторный клик по тому
  // же ответу снимает его.
  function setArea(key, status) {
    setAreaStatus((prev) => ({
      ...prev,
      [key]: prev[key] === status ? undefined : status,
    }));
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const result = await submitAttempt(attempt._id, {
        findings,
        reviewedChecklist: Object.keys(areaStatus).filter((k) => areaStatus[k]),
        impressionText: impressionText.trim(),
        diagnosisKeys: diagnosisToKeys(diagnosis),
        diagnosisText: diagnosis.trim(),
        integrity: collect(),
      });
      setAttempt(result.attempt);
      setReview(result.review);
      setGameReward(result.game ?? null);

      // Если это дуэль — засчитываем результат.
      if (duelId) {
        try {
          const duel = await submitDuelResult(duelId, result.attempt._id);
          if (duel.status === "completed") {
            const meWon =
              (duel.winner === "challenger" && duel.challenger.isMe) ||
              (duel.winner === "opponent" && duel.opponent.isMe);
            setDuelNote(
              duel.winner === "draw"
                ? "⚔️ Дуэль: ничья!"
                : meWon
                  ? "🏆 Дуэль: победа! (+40 XP)"
                  : "⚔️ Дуэль: поражение.",
            );
          } else {
            setDuelNote("⚔️ Результат засчитан в дуэль. Ждём соперника.");
          }
        } catch {
          /* засчёт в дуэль не критичен для результата */
        }
      }
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось сдать попытку"));
    } finally {
      setBusy(false);
    }
  }

  async function handleAiAnalysis() {
    setAiBusy(true);
    setError(null);
    try {
      setAiAnalysis(await aiAnalyzeAttempt(attempt._id));
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "ИИ не смог составить разбор"));
    } finally {
      setAiBusy(false);
    }
  }

  const score = attempt?.score;

  return (
    <div className="rad-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <div>
          <h1 className="edu-title" style={{ marginBottom: 4 }}>{caseData.title}</h1>
          <div className="edu-subtitle">
            <span className="rad-tag">{MODALITY_LABELS[caseData.modality] ?? caseData.modality}</span>
            {rs?.title}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <AttemptModeBadge attempt={attempt} />
          {!submitted && <AttemptTimer deadlineAt={attempt.deadlineAt} />}
          <Link className="edu-btn edu-btn--ghost" to="/radiology">← К каталогу</Link>
        </div>
      </div>

      {/* Условия остаются под рукой во время попытки — свёрнутыми */}
      {!submitted && (
        <details className="rad-panel" style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            Условия этой попытки
          </summary>
          <RulesText
            station="radiology"
            policy={{ ...policy, timeLimitSec: attempt.timeLimitSec }}
          />
        </details>
      )}

      {submitted && <AttemptOutcomeNote attempt={attempt} game={gameReward} />}

      {caseData.clinicalContext && (
        <div className="rad-panel" style={{ marginTop: 12 }}>
          <strong>Клинический контекст.</strong> {caseData.clinicalContext}
        </div>
      )}

      {error && <div className="edu-error" style={{ marginTop: 12 }}>{error}</div>}

      <div className="rad-layout" style={{ marginTop: 16 }}>
        {/* ─── Снимок ─── */}
        <div>
          <div className="rad-panel">
            <div className="rad-tools">
              <button type="button" className={`rad-chip ${tool === "pan" ? "rad-chip--on" : ""}`} onClick={() => setTool("pan")}>✋ Перемещать</button>
              <button type="button" className={`rad-chip ${tool === "point" ? "rad-chip--on" : ""}`} onClick={() => setTool("point")} disabled={submitted}>• Точка</button>
              <button type="button" className={`rad-chip ${tool === "rect" ? "rad-chip--on" : ""}`} onClick={() => setTool("rect")} disabled={submitted}>▭ Область</button>
            </div>

            <RadiologyCanvas
              imageUrl={image?.url}
              annotations={myAnn}
              overlays={expertAnn}
              mode={submitted ? "view" : "draw"}
              tool={tool}
              onCreate={handleCreate}
              height={520}
            />

            {images.length > 1 && (
              <div className="rad-slices">
                {images.map((img, i) => (
                  <button key={i} type="button" className={`rad-slice ${i === activeImg ? "rad-slice--active" : ""}`} onClick={() => setActiveImg(i)}>
                    {img.label || `Снимок ${i + 1}`}
                  </button>
                ))}
              </div>
            )}
            {submitted && (
              <div className="edu-hint" style={{ marginTop: 10 }}>
                Синим — ваши отметки, <span style={{ color: "#f59e0b" }}>янтарным пунктиром</span> — эталон эксперта.
              </div>
            )}
          </div>
        </div>

        {/* ─── Панель ответа / разбора ─── */}
        <div>
          {submitted && duelNote && (
            <div className="rad-panel" style={{ borderColor: "#a2802f", background: "#fbf3dd" }}>
              <strong style={{ fontSize: 16 }}>{duelNote}</strong>
              <div style={{ marginTop: 6 }}><Link className="edu-btn edu-btn--ghost" to="/radiology/duels">К дуэлям</Link></div>
            </div>
          )}

          {submitted && gameReward && <RewardPanel game={gameReward} />}

          {submitted && score && <ScorePanel score={score} attempt={attempt} labelOf={labelOf} review={review} />}

          {submitted && (
            <div className="rad-panel">
              <div className="edu-card-title" style={{ fontSize: 15 }}>Разбор с ИИ</div>
              {!aiAnalysis ? (
                <>
                  <div className="edu-hint" style={{ marginBottom: 8 }}>
                    ИИ прочитает снимок, сверит с эталоном и вашим ответом и даст диагноз, грамотное заключение и разбор.
                  </div>
                  <button type="button" className="edu-btn" onClick={handleAiAnalysis} disabled={aiBusy}>
                    {aiBusy ? "ИИ разбирает снимок…" : "🔎 Получить разбор от ИИ"}
                  </button>
                </>
              ) : (
                <>
                  {aiAnalysis.diagnosis && (
                    <div style={{ marginBottom: 10 }}>
                      <strong>Диагноз ИИ:</strong> {aiAnalysis.diagnosis}
                    </div>
                  )}
                  {aiAnalysis.conclusion && (
                    <div style={{ marginBottom: 10 }}>
                      <strong>Заключение:</strong>
                      <div className="edu-hint" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{aiAnalysis.conclusion}</div>
                    </div>
                  )}
                  {aiAnalysis.analysis && (
                    <div>
                      <strong>Разбор вашего ответа:</strong>
                      <div className="edu-hint" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{aiAnalysis.analysis}</div>
                    </div>
                  )}
                  <div className="edu-hint" style={{ marginTop: 10, fontStyle: "italic" }}>
                    ИИ-разбор — вспомогательный, не заменяет заключение врача.
                  </div>
                </>
              )}
            </div>
          )}

          {!submitted && (
            <>
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>Находки</div>
                <div className="edu-hint" style={{ marginBottom: 8 }}>
                  Выберите находку и отметьте её на снимке. Если патологии нет — поставьте «Норма».
                </div>
                <div className="rad-palette">
                  {(caseData.findingPalette ?? []).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className={activeLabel === t.key ? "rad-palette--on" : ""}
                      onClick={() => setActiveLabel(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {findings.length > 0 && (
                  <div className="rad-marks" style={{ marginTop: 12 }}>
                    {findings.map((f, i) => (
                      <div key={i} className="rad-mark">
                        <span>
                          {labelOf(f.label)} <small>· {images[f.imageIndex]?.label || `снимок ${f.imageIndex + 1}`}</small>
                        </span>
                        <button type="button" className="edu-btn edu-btn--danger" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => removeFinding(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>Систематический осмотр</div>
                <div className="edu-hint" style={{ marginBottom: 8 }}>
                  По каждой области дайте ответ: норма или есть находка. Патологию отметьте ещё и на снимке выше.
                </div>
                <div className="rad-review">
                  {(rs?.checklist ?? []).map((c) => (
                    <div key={c.key} className="rad-review-row">
                      <span className="rad-review-label">{c.label}</span>
                      <div className="rad-review-btns">
                        <button
                          type="button"
                          className={`rad-ans ${areaStatus[c.key] === "normal" ? "rad-ans--normal" : ""}`}
                          onClick={() => setArea(c.key, "normal")}
                        >
                          Норма
                        </button>
                        <button
                          type="button"
                          className={`rad-ans ${areaStatus[c.key] === "finding" ? "rad-ans--finding" : ""}`}
                          onClick={() => setArea(c.key, "finding")}
                        >
                          Есть находка
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>Заключение</div>
                {counted && (
                  <div className="edu-hint" style={{ marginBottom: 6 }}>
                    Зачётная попытка: вставка текста в поля отключена — пишите своими
                    словами.
                  </div>
                )}
                <textarea
                  className="edu-textarea"
                  rows={4}
                  placeholder="Опишите картину: что видите, где, характер изменений…"
                  value={impressionText}
                  onChange={(e) => setImpressionText(e.target.value)}
                  onPaste={onPaste}
                />
                <div className="edu-field-label">Диагноз</div>
                <input
                  className="edu-input"
                  placeholder="Напр.: правосторонний пневмоторакс"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  onPaste={onPaste}
                />
                <div className="edu-btn-row" style={{ marginTop: 14 }}>
                  <button type="button" className="edu-btn" onClick={handleSubmit} disabled={busy}>
                    {busy ? "Проверяем…" : "Сдать и посмотреть разбор"}
                  </button>
                </div>
              </div>
            </>
          )}

          {submitted && (
            <div className="rad-panel">
              <div className="edu-btn-row">
                <Link className="edu-btn" to="/radiology">К другим кейсам</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Панель награды «Диагностической арены» ───
function RewardPanel({ game }) {
  return (
    <div className="rad-panel arena-reward">
      <div className="arena-reward-xp">+{game.pointsAwarded} XP</div>
      <div className="arena-reward-row">
        <span>🔥 Серия: {game.streak} дн.</span>
        <span>Ранг: {game.rank?.title}</span>
      </div>
      {game.rankedUp && (
        <div className="arena-reward-rankup">🎉 Новый ранг: {game.rank?.title}!</div>
      )}
      {(game.unlocked?.length ?? 0) > 0 && (
        <div style={{ marginTop: 8 }}>
          <strong>Новые достижения:</strong>
          <div className="arena-badges" style={{ marginTop: 6 }}>
            {game.unlocked.map((a) => (
              <span key={a.key} className="arena-badge" title={a.title}>
                {a.icon} {a.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Панель результата и разбора ───
function ScorePanel({ score, attempt, labelOf, review }) {
  const pct = Math.round((score.total ?? 0) * 100);
  const components = ["detection", "classification", "checklist", "diagnosis", "aiImpression"];

  return (
    <div className="rad-panel">
      <div className="edu-card-title" style={{ fontSize: 15 }}>Результат</div>
      <div className="rad-score-total">
        {pct}% <span className={score.passed ? "rad-pass" : "rad-fail"} style={{ fontSize: 15 }}>
          {score.passed ? "— зачёт" : "— не сдано"}
        </span>
      </div>

      <div className="rad-score-bars">
        {components.map((k) =>
          score[k] == null ? null : (
            <div key={k} className="rad-bar">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{SCORE_LABELS[k]}</span>
                <span>{Math.round(score[k] * 100)}%</span>
              </div>
              <div className="rad-bar-track">
                <div className="rad-bar-fill" style={{ width: `${Math.round(score[k] * 100)}%` }} />
              </div>
            </div>
          ),
        )}
      </div>

      <div className="edu-hint" style={{ marginTop: 12 }}>
        Ложных отметок (где патологии нет): {attempt.falseAlarms ?? 0}
      </div>

      {/* Что нашли / что пропустили */}
      {(attempt.matches ?? []).length > 0 && (
        <div style={{ marginTop: 12 }}>
          <strong>Находки эксперта</strong>
          <div className="rad-marks" style={{ marginTop: 6 }}>
            {attempt.matches.map((m, i) => (
              <div key={i} className="rad-mark">
                <span>
                  {labelOf(m.label)}{" "}
                  <small>· {m.significance}</small>
                </span>
                <span className={m.outcome === "hit" ? "rad-pass" : "rad-fail"}>
                  {m.outcome === "hit" ? (m.labelCorrect ? "найдено ✓" : "найдено, но не так названо") : "пропущено"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Пояснения эксперта */}
      {(review.findings ?? []).some((f) => f.explanation) && (
        <div style={{ marginTop: 12 }}>
          <strong>Разбор находок</strong>
          {review.findings.filter((f) => f.explanation).map((f, i) => (
            <div key={i} className="edu-hint" style={{ marginTop: 6 }}>
              <b>{labelOf(f.label)}:</b> {f.explanation}
            </div>
          ))}
        </div>
      )}

      {review.impression?.correctText && (
        <div style={{ marginTop: 12 }}>
          <strong>Эталонное заключение</strong>
          <div className="edu-hint" style={{ marginTop: 6 }}>{review.impression.correctText}</div>
        </div>
      )}

      {attempt.aiFeedback?.rationale && (
        <div className="edu-hint" style={{ marginTop: 12 }}>
          <b>По вашему заключению:</b> {attempt.aiFeedback.rationale}
        </div>
      )}
    </div>
  );
}
