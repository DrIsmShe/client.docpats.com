// client/src/pages/diagnostics/DiagnosticCasePage.jsx
//
// Рабочее место по делу. Маршрут: /diagnostics/cases/:caseId
//
// ОДНА КОЛОНКА, ЧЕТЫРЕ ШАГА. Прошлая версия была правильной, но не простой:
// три колонки, семь панелей в рамках, и у каждой — объяснение, зачем она.
// Врачу нужно другое: описать случай, принести материал, запустить разбор,
// написать своё заключение. Всё, что не помогает пройти эти шаги, мешает.
//
// Что убрано и куда:
//   — правая колонка целиком. Протокол разбора («что проверяется») — справка,
//     а не работа: открывается ссылкой, когда нужен;
//   — панель заданий свелась к одной строке состояния;
//   — кнопка «Сохранить контекст» исчезла: сохраняем при уходе из поля;
//   — рамки, тени и подпись-объяснение у каждого блока: тонкая линия и
//     заголовок делают то же самое.
//
// Что НЕ убрано, хотя добавляет шаг:
//   — два подтверждения перед отправкой материалов внешней модели. Они
//     переехали в момент нажатия «Разобрать» — туда, где решение и
//     принимается, — но остались ДВУМЯ разными утверждениями, и время
//     подтверждения по-прежнему записывается. Это не оформление, а основание,
//     на котором данные пациента ушли наружу;
//   — вывод врача остаётся последним шагом, и дело закрывается только им.
//
// Про опрос состояния: пока есть незавершённые задания, страница
// перезапрашивает дело раз в 4 секунды и останавливается сама.

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  fetchCase,
  fetchModalities,
  fetchAnalytes,
  updateCase,
  closeCase,
  reopenCase,
  addArtifact,
  removeArtifact,
  analyzeCase,
  rerunJob,
  setFindingVerdict,
} from "../../api/diagnostics";
import { readApiError, isAuthError } from "../../api/education";
import FindingCard from "./components/FindingCard";
import ArtifactComposer from "./components/ArtifactComposer";
import { CaseStatus, formatDate } from "./DiagnosticsCasesPage";
import "../education/education.css";
import "./diagnostics.css";

const POLL_MS = 4000;
// Сколько всего ждём результата, опрашивая сервер. Разбор занимает минуты;
// двадцать — с запасом. Раньше предела не было вовсе, и вкладка, открытая на
// зависшем деле, стучалась на сервер сутки: пятнадцать тысяч запросов, каждый
// из которых расшифровывает дело целиком.
const POLL_LIMIT_MS = 20 * 60 * 1000;

const KIND_LABELS = {
  text: "запись",
  report: "заключение",
  lab_panel: "панель",
  image: "снимок",
  dicom: "DICOM",
  document: "документ",
  video: "видео",
  audio: "аудио",
  signal: "сигнал",
};

export default function DiagnosticCasePage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [modalities, setModalities] = useState([]);
  const [analytes, setAnalytes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [context, setContext] = useState("");
  const [question, setQuestion] = useState("");
  const [summary, setSummary] = useState("");
  const [dirty, setDirty] = useState(false);

  const [pollExpired, setPollExpired] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);
  // Действие, которое ждёт подтверждения. Наружу материалы уходят из двух
  // мест — распознавание документа и разбор, — и спросить нужно там, где
  // врач нажал, а не только на шаге «Разбор».
  const pendingRef = useRef(null);

  const pollRef = useRef(null);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        const full = await fetchCase(caseId);
        setData(full);
        // Черновики не затираем, пока врач печатает: фоновый опрос состояния
        // иначе съедал бы несохранённый текст.
        setContext((prev) => (dirty ? prev : full.case?.clinicalContext ?? ""));
        setQuestion((prev) => (dirty ? prev : full.case?.question ?? ""));
        setSummary((prev) => (prev ? prev : full.case?.doctorSummary ?? ""));
        setError(null);
      } catch (err) {
        if (isAuthError(err)) return navigate("/login");
        setError(readApiError(err, "Не удалось загрузить дело"));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [caseId, dirty, navigate],
  );

  useEffect(() => {
    load();
    Promise.all([
      fetchModalities().catch(() => ({ modalities: [] })),
      fetchAnalytes().catch(() => []),
    ]).then(([guide, list]) => {
      setModalities(guide.modalities ?? []);
      setAnalytes(list);
    });
    // load зависит от dirty и меняется при наборе текста — в зависимости его
    // класть нельзя, иначе дело перезагружается во время печати.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const jobsPending = (data?.jobs ?? []).some(
    (j) => j.status === "queued" || j.status === "running",
  );
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!jobsPending) {
      setPollExpired(false);
      return undefined;
    }
    const startedAt = Date.now();
    pollRef.current = setInterval(() => {
      // Опрос обязан заканчиваться сам. Если за отведённое время задания не
      // закрылись, значит их некому закрыть — сервер починит состояние при
      // следующем открытии дела, а страница перестаёт стучаться и говорит
      // врачу прямо, что ждать больше нечего.
      if (Date.now() - startedAt > POLL_LIMIT_MS) {
        clearInterval(pollRef.current);
        setPollExpired(true);
        return;
      }
      load({ silent: true });
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [jobsPending, load]);

  async function guard(fn, fallbackMessage) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load({ silent: true });
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, fallbackMessage));
    } finally {
      setBusy(false);
    }
  }

  /** Сохранение при уходе из поля — вместо отдельной кнопки. */
  function saveContext() {
    if (!dirty) return;
    guard(async () => {
      await updateCase(caseId, { question, clinicalContext: context });
      setDirty(false);
    }, "Не удалось сохранить");
  }

  if (loading) {
    return (
      <div className="dg-page dg-page--narrow">
        <p className="dg-empty">Загружаем дело…</p>
      </div>
    );
  }

  if (!data?.case) {
    return (
      <div className="dg-page dg-page--narrow">
        {error && <div className="dg-err">{error}</div>}
        <Link className="edu-btn edu-btn--ghost" to="/diagnostics">
          ← К списку дел
        </Link>
      </div>
    );
  }

  const c = data.case;
  const closed = c.status === "closed";
  const findings = data.findings ?? [];
  const critical = findings.filter((f) => f.severity === "critical");
  const jobs = data.jobs ?? [];
  const failedJobs = jobs.filter((j) => j.status === "failed");
  const doneJobs = jobs.filter((j) => j.status === "done");
  const gatesReady = Boolean(c.deidentified && c.aiConsent?.confirmed);
  // Препятствия, не связанные с подтверждениями: их спрашивают отдельно.
  const otherBlockers = (data.blockers ?? []).filter((b) => !/обезличен|соглас/i.test(b));
  const modalityTitleOf = (key) => modalities.find((m) => m.key === key)?.title ?? key;

  /**
   * Шлюз наружу: выполнить действие, спросив подтверждения, если их ещё нет.
   *
   * Раньше подтверждения спрашивались только при нажатии «Разобрать». Врач,
   * начавший естественнее — сначала прикрепить документ, — упирался в отказ
   * сервера, и дать согласие ему было НЕГДЕ: галочек на странице нет, а до
   * кнопки разбора он ещё не дошёл. Тупик создавался ровно тем упрощением,
   * которое убрало постоянные галочки, — поэтому шлюз общий для обоих путей.
   */
  function requireGates(action) {
    if (gatesReady) return action();
    pendingRef.current = action;
    setConfirming(true);
    return undefined;
  }

  function onAnalyzeClick() {
    requireGates(() => guard(() => analyzeCase(caseId), "Не удалось запустить разбор"));
  }

  async function confirmGates() {
    setBusy(true);
    setError(null);
    try {
      await updateCase(caseId, { deidentified: true, aiConsent: true });
      setConfirming(false);
      await load({ silent: true });
      const next = pendingRef.current;
      pendingRef.current = null;
      // Продолжаем ровно то действие, ради которого спрашивали: врач нажал
      // «Прикрепить документ» — после подтверждения документ и прикрепится,
      // а не отправит его обратно искать кнопку.
      if (next) await next();
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось сохранить подтверждение"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dg-page dg-page--narrow">
      <div className="arena-back">
        <Link className="edu-back-link" to="/diagnostics">
          ← Все дела
        </Link>
        <Link className="edu-back-link" to="/doctor/home-page">
          В кабинет
        </Link>
      </div>

      <header className="dg-head">
        <div className="dg-head-main">
          <h1 className="dg-title">{c.title || "Без названия"}</h1>
          <p className="dg-subtitle">
            {[
              c.patient?.label,
              c.patient?.ageYears ? `${c.patient.ageYears} лет` : null,
              c.patient?.sex === "male"
                ? "мужчина"
                : c.patient?.sex === "female"
                  ? "женщина"
                  : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Пациент не описан"}
          </p>
        </div>
        <CaseStatus status={c.status} />
      </header>

      {error && <div className="dg-err">{error}</div>}
      {critical.length > 0 && (
        <div className="dg-err">
          Есть критические выводы ({critical.length}) — они первыми в списке.
        </div>
      )}

      {/* ─── 1. Случай ─────────────────────────────────────────────── */}
      <section className="dg-sec">
        <h2 className="dg-sec-title">Случай</h2>
        <input
          className="edu-input"
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            setDirty(true);
          }}
          onBlur={saveContext}
          placeholder="Вопрос: что именно вас смущает?"
          maxLength={2000}
          disabled={closed}
        />
        <textarea
          className="edu-textarea"
          style={{ marginTop: 8 }}
          rows={4}
          value={context}
          onChange={(e) => {
            setContext(e.target.value);
            setDirty(true);
          }}
          onBlur={saveContext}
          placeholder="Возраст, жалобы, динамика, что уже исключено."
          maxLength={20000}
          disabled={closed}
        />
        {!closed && (
          <p className="dg-muted">{dirty ? "Сохранится, когда выйдете из поля" : "Сохранено"}</p>
        )}
      </section>

      {/* ─── 2. Материалы ──────────────────────────────────────────── */}
      <section className="dg-sec">
        <h2 className="dg-sec-title">
          Материалы{data.artifacts.length > 0 ? ` · ${data.artifacts.length}` : ""}
        </h2>

        {data.artifacts.length > 0 && (
          <div className="dg-artifacts">
            {data.artifacts.map((a) => (
              <div className="dg-artifact" key={a._id}>
                <div className="dg-artifact-main">
                  <div className="dg-artifact-head">
                    <span className="dg-artifact-kind">{KIND_LABELS[a.kind] ?? a.kind}</span>
                    {a.modality && a.modality !== "clinical" && (
                      <span className="dg-conf">{modalityTitleOf(a.modality)}</span>
                    )}
                  </div>
                  {a.text && <p className="dg-artifact-text">{a.text}</p>}
                  {a.structured?.items?.length > 0 && (
                    <p className="dg-artifact-text dg-nums">
                      {a.structured.items
                        .map((i) => `${i.name}: ${i.value}${i.unit ? " " + i.unit : ""}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                {!closed && (
                  <button
                    type="button"
                    className="dg-icon-btn"
                    disabled={busy}
                    aria-label="Убрать материал"
                    onClick={() =>
                      guard(() => removeArtifact(caseId, a._id), "Не удалось убрать материал")
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {closed ? (
          <p className="dg-muted">Дело закрыто — материалы не меняются.</p>
        ) : (
          <ArtifactComposer
            caseId={caseId}
            modalities={modalities}
            analytes={analytes}
            disabled={busy}
            requireGates={requireGates}
            onAdd={(payload) => addArtifact(caseId, payload)}
          />
        )}
      </section>

      {/* ─── 3. Разбор ─────────────────────────────────────────────── */}
      {!closed && (
        <section className="dg-sec">
          <h2 className="dg-sec-title">Разбор</h2>

          {(
            <>
              <div className="dg-actions">
                <button
                  className="edu-btn"
                  type="button"
                  disabled={busy || jobsPending || otherBlockers.length > 0}
                  onClick={onAnalyzeClick}
                >
                  {jobsPending
                    ? "Разбираем…"
                    : findings.length
                      ? "Разобрать заново"
                      : "Разобрать"}
                </button>
                <button
                  type="button"
                  className="dg-link-btn"
                  onClick={() => setShowProtocol((v) => !v)}
                >
                  {showProtocol ? "Скрыть протокол" : "Что проверяется"}
                </button>
              </div>

              {pollExpired && (
                <div className="dg-blockers">
                  Разбор не отвечает дольше обычного. Скорее всего, он оборвался — обновите
                  страницу: незавершённые задания будут помечены сбойными, и их можно будет
                  запустить заново.
                </div>
              )}

              <p className="dg-muted">
                {jobsPending
                  ? `Готово ${doneJobs.length} из ${jobs.length}. Занимает минуты — страницу можно закрыть.`
                  : otherBlockers.length > 0
                    ? otherBlockers[0]
                    : gatesReady
                      ? "Направления выбираются по составу материалов."
                      : "Материалы уйдут внешней модели — перед первым запуском спросим подтверждение."}
              </p>

              {failedJobs.length > 0 && (
                <div className="dg-blockers">
                  Не удалось разобрать: {failedJobs.map((j) => j.modalityTitle).join(", ")}.
                  {failedJobs[0].message && (
                    <div className="dg-muted">{failedJobs[0].message}</div>
                  )}
                  <button
                    type="button"
                    className="dg-link-btn"
                    style={{ marginTop: 8 }}
                    disabled={busy}
                    onClick={() =>
                      guard(
                        () => Promise.all(failedJobs.map((j) => rerunJob(j._id))),
                        "Не удалось перезапустить",
                      )
                    }
                  >
                    Попробовать ещё раз
                  </button>
                </div>
              )}

              {showProtocol && (
                <div className="dg-protocol">
                  <p className="dg-muted">
                    По этим пунктам идёт проверка. Открыто до отправки: скрытый протокол
                    означал бы доверие вслепую.
                  </p>
                  {modalities.map((m) => (
                    <details key={m.key}>
                      <summary>{m.title}</summary>
                      {m.checklist?.length > 0 && (
                        <ol>
                          {m.checklist.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ol>
                      )}
                      {m.redFlags?.length > 0 && (
                        <ul className="dg-mod-flags">
                          {m.redFlags.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      )}
                      {m.binaryNote && <p className="dg-artifact-note">{m.binaryNote}</p>}
                    </details>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Подтверждение показывается поверх страницы: спрашивают его из двух
          разных мест, и оно не должно зависеть от того, докуда доскроллено. */}
      {confirming && (
        <ConfirmGates
          caseData={c}
          busy={busy}
          onCancel={() => {
            pendingRef.current = null;
            setConfirming(false);
          }}
          onConfirm={confirmGates}
        />
      )}

      {/* ─── 4. Выводы ─────────────────────────────────────────────── */}
      {findings.length > 0 && (
        <section className="dg-sec">
          <h2 className="dg-sec-title">
            Выводы · {findings.length}
            {data.advisoryNotice && <span className="dg-sec-note">{data.advisoryNotice}</span>}
          </h2>
          <div className="dg-findings">
            {findings.map((f) => (
              <FindingCard
                key={f._id}
                finding={f}
                modalityTitle={modalityTitleOf(f.modality)}
                disabled={busy}
                onVerdict={async (id, payload) => {
                  await setFindingVerdict(id, payload);
                  await load({ silent: true });
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── 5. Вывод врача ────────────────────────────────────────── */}
      <section className="dg-sec">
        <h2 className="dg-sec-title">Ваш вывод</h2>
        <textarea
          className="edu-textarea"
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={20000}
          disabled={closed}
          placeholder="К чему вы пришли и что назначено."
        />
        <div className="dg-actions">
          {closed ? (
            <>
              <button
                className="edu-btn edu-btn--ghost"
                type="button"
                disabled={busy}
                onClick={() => guard(() => reopenCase(caseId), "Не удалось переоткрыть")}
              >
                Переоткрыть
              </button>
              {c.closedAt && <span className="dg-muted">Закрыто {formatDate(c.closedAt)}</span>}
            </>
          ) : (
            <>
              <button
                className="edu-btn"
                type="button"
                disabled={busy || summary.trim().length < 3}
                onClick={() =>
                  guard(() => closeCase(caseId, summary.trim()), "Не удалось закрыть")
                }
              >
                Закрыть дело
              </button>
              <span className="dg-muted">Итог по делу пишет врач</span>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * Подтверждение перед первой отправкой материалов наружу.
 *
 * Раньше это были две галочки, постоянно висевшие в правой колонке. Теперь они
 * стоят там, где решение принимается — в момент нажатия «Разобрать», — и
 * спрашиваются один раз на дело.
 *
 * Утверждений по-прежнему ДВА, и это не формальность: «я убрал персональные
 * данные» и «я согласен на внешнюю обработку» — разные вещи и разная
 * ответственность. Свести их в одну галочку значило бы, что одно из двух врач
 * подтвердил не думая.
 */
function ConfirmGates({ caseData, busy, onCancel, onConfirm }) {
  const [deid, setDeid] = useState(Boolean(caseData.deidentified));
  const [consent, setConsent] = useState(Boolean(caseData.aiConsent?.confirmed));

  return (
    <div className="dg-modal" role="dialog" aria-modal="true" aria-label="Подтверждение отправки">
      <div className="dg-confirm">
      <p className="dg-confirm-lead">
        Материалы уйдут на обработку внешней модели. Подтвердите два условия — спросим один
        раз для этого дела.
      </p>

      <label className="dg-confirm-item">
        <input type="checkbox" checked={deid} onChange={(e) => setDeid(e.target.checked)} />
        <span>
          <strong>Материалы обезличены.</strong> Нет ФИО, дат рождения, номеров документов и
          телефонов. Шапку бланка проверьте отдельно — там имя остаётся чаще всего.
        </span>
      </label>

      <label className="dg-confirm-item">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          <strong>Согласие на обработку внешней моделью.</strong> Время подтверждения
          записывается — это часть ответа на вопрос, на каком основании данные ушли наружу.
        </span>
      </label>

      <div className="dg-actions">
        <button
          className="edu-btn"
          type="button"
          disabled={busy || !deid || !consent}
          onClick={onConfirm}
        >
          {busy ? "Запускаем…" : "Подтверждаю и запускаю"}
        </button>
        <button type="button" className="dg-link-btn" onClick={onCancel} disabled={busy}>
          Отмена
        </button>
      </div>
      </div>
    </div>
  );
}
