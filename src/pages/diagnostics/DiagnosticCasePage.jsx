// client/src/pages/diagnostics/DiagnosticCasePage.jsx
//
// Рабочее место по одному делу. Маршрут: /diagnostics/cases/:caseId
//
// Порядок на странице повторяет порядок работы: контекст → материалы → гейты →
// разбор → выводы → вывод врача. Он же — порядок ответственности, поэтому
// вывод врача стоит последним и без него дело не закрывается.
//
// Два места, где интерфейс намеренно неудобен, и это не недоделка:
//
//   1. Гейты (обезличено / согласие) не запоминаются «навсегда» и не
//      проставляются сами. Это два разных подтверждения по каждому делу, и
//      автоматизировать их — значит превратить осознанное действие в галочку
//      по умолчанию. Материалы уходят внешней модели: врач должен решать это
//      каждый раз.
//
//   2. Закрыть дело можно только собственным текстом. Кнопки «принять разбор
//      как заключение» нет и не будет: итог по пациенту пишет врач.
//
// Про опрос состояния: пока есть незавершённые задания, страница
// перезапрашивает дело раз в 4 секунды и останавливается сама. Инференс идёт
// минутами — держать ради него соединение нельзя, а сокет здесь избыточен.

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

const JOB_LABELS = {
  queued: "в очереди",
  running: "разбирается",
  done: "готово",
  failed: "сбой",
  skipped: "пропущено",
};

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
  const [openModality, setOpenModality] = useState(null);

  // Черновики полей дела — правятся локально, сохраняются по кнопке.
  const [context, setContext] = useState("");
  const [question, setQuestion] = useState("");
  const [summary, setSummary] = useState("");
  const [dirty, setDirty] = useState(false);

  const pollRef = useRef(null);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        const full = await fetchCase(caseId);
        setData(full);
        // Черновики не затираем, пока врач печатает: иначе фоновый опрос
        // состояния съедал бы несохранённый текст.
        setContext((prev) => (dirty ? prev : full.case?.clinicalContext ?? ""));
        setQuestion((prev) => (dirty ? prev : full.case?.question ?? ""));
        setSummary((prev) => (prev ? prev : full.case?.doctorSummary ?? ""));
        setError(null);
      } catch (err) {
        if (isAuthError(err)) {
          navigate("/login");
          return;
        }
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
    // load намеренно не в зависимостях: он меняется при каждом наборе символа
    // (зависит от dirty), и дело перезагружалось бы во время печати.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // Опрос, пока есть незавершённые задания.
  const jobsPending = (data?.jobs ?? []).some(
    (j) => j.status === "queued" || j.status === "running",
  );
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!jobsPending) return undefined;
    pollRef.current = setInterval(() => load({ silent: true }), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [jobsPending, load]);

  async function guard(fn, fallbackMessage) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load({ silent: true });
    } catch (err) {
      if (isAuthError(err)) {
        navigate("/login");
        return;
      }
      setError(readApiError(err, fallbackMessage));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="dg-page">
        <p className="dg-empty">Загружаем дело…</p>
      </div>
    );
  }

  if (!data?.case) {
    return (
      <div className="dg-page">
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

  const modalityTitleOf = (key) =>
    modalities.find((m) => m.key === key)?.title ?? key;

  return (
    <div className="dg-page">
      <div className="edu-back">
        <Link className="edu-back-link" to="/diagnostics">
          ← Все дела
        </Link>
      </div>

      <header className="dg-head">
        <div className="dg-head-main">
          <p className="edu-eyebrow">Дело · {formatDate(c.createdAt)}</p>
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

      {data.advisoryNotice && (
        <div className="dg-advisory">
          <span className="dg-advisory-mark">!</span>
          <span>{data.advisoryNotice}</span>
        </div>
      )}

      {error && <div className="dg-err">{error}</div>}

      {critical.length > 0 && (
        <div className="dg-err">
          В разборе есть {critical.length}{" "}
          {critical.length === 1 ? "критический вывод" : "критических вывода"} — они показаны
          первыми и не скрываются.
        </div>
      )}

      <div className="dg-layout">
        <div className="dg-col">
          {/* ─── Клинический контекст ─────────────────────────────── */}
          <section className="dg-panel">
            <h2 className="dg-panel-title">Клинический контекст</h2>
            <p className="dg-panel-note">
              Возраст, жалобы, динамика, что уже исключено. Разбор без контекста — это разбор
              строчек, а не пациента.
            </p>

            <div className="dg-stack">
              <div>
                <span className="dg-label">Вопрос</span>
                <textarea
                  className="edu-textarea"
                  rows={2}
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    setDirty(true);
                  }}
                  maxLength={2000}
                  disabled={closed}
                />
              </div>
              <div>
                <span className="dg-label">Данные</span>
                <textarea
                  className="edu-textarea"
                  rows={6}
                  value={context}
                  onChange={(e) => {
                    setContext(e.target.value);
                    setDirty(true);
                  }}
                  maxLength={20000}
                  disabled={closed}
                />
              </div>
              {!closed && (
                <div>
                  <button
                    className="edu-btn edu-btn--ghost"
                    type="button"
                    disabled={busy || !dirty}
                    onClick={() =>
                      guard(async () => {
                        await updateCase(caseId, { question, clinicalContext: context });
                        setDirty(false);
                      }, "Не удалось сохранить контекст")
                    }
                  >
                    {dirty ? "Сохранить контекст" : "Сохранено"}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ─── Материалы ────────────────────────────────────────── */}
          <section className="dg-panel">
            <h2 className="dg-panel-title">Материалы · {data.artifacts.length}</h2>
            <p className="dg-panel-note">
              Заключения, анализы, записи. Разбирается то, что здесь лежит, — ничего из
              карточки пациента модуль сам не подтягивает.
            </p>

            {data.artifacts.length > 0 && (
              <div className="dg-artifacts" style={{ marginBottom: 16 }}>
                {data.artifacts.map((a) => (
                  <div className="dg-artifact" key={a._id}>
                    <div className="dg-artifact-main">
                      <div className="dg-artifact-head">
                        <span className="dg-artifact-kind">{KIND_LABELS[a.kind] ?? a.kind}</span>
                        {a.modality && (
                          <span className="dg-conf">{modalityTitleOf(a.modality)}</span>
                        )}
                        {a.structured?.items?.length ? (
                          <span className="dg-conf">
                            {a.structured.items.length} показател
                            {a.structured.items.length === 1 ? "ь" : "ей"}
                          </span>
                        ) : null}
                      </div>
                      {a.text && <p className="dg-artifact-text">{a.text}</p>}
                      {a.structured?.items?.length > 0 && (
                        <p className="dg-artifact-text dg-nums">
                          {a.structured.items
                            .map((i) => `${i.name}: ${i.value}${i.unit ? " " + i.unit : ""}`)
                            .join(" · ")}
                        </p>
                      )}
                      {a.note && <p className="dg-checklist-ref">{a.note}</p>}
                    </div>
                    {!closed && (
                      <button
                        type="button"
                        className="edu-btn edu-btn--ghost"
                        disabled={busy}
                        onClick={() =>
                          guard(
                            () => removeArtifact(caseId, a._id),
                            "Не удалось убрать материал",
                          )
                        }
                      >
                        Убрать
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
                modalities={modalities}
                analytes={analytes}
                disabled={busy}
                onAdd={(payload) => addArtifact(caseId, payload)}
              />
            )}
          </section>

          {/* ─── Выводы ───────────────────────────────────────────── */}
          <section className="dg-panel">
            <h2 className="dg-panel-title">Выводы разбора · {findings.length}</h2>
            {findings.length === 0 ? (
              <p className="dg-muted">
                Пока пусто. Разбор запускается справа — после подтверждения двух условий.
              </p>
            ) : (
              <>
                <p className="dg-panel-note">
                  Отсортированы по значимости. Рядом с каждым — вопрос, согласны ли вы: по этим
                  ответам видно, где разбор ошибается систематически.
                </p>
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
              </>
            )}
          </section>

          {/* ─── Вывод врача ──────────────────────────────────────── */}
          <section className="dg-panel">
            <h2 className="dg-panel-title">Вывод врача</h2>
            <p className="dg-panel-note">
              Итог по делу пишете вы. Кнопки «принять разбор как заключение» здесь нет
              намеренно: ответственность за решение не передаётся программе.
            </p>
            <textarea
              className="edu-textarea"
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={20000}
              disabled={closed}
              placeholder="К чему вы пришли и что назначено."
            />
            <div className="dg-row" style={{ marginTop: 10 }}>
              {closed ? (
                <button
                  className="edu-btn edu-btn--ghost"
                  type="button"
                  disabled={busy}
                  onClick={() => guard(() => reopenCase(caseId), "Не удалось переоткрыть дело")}
                >
                  Переоткрыть дело
                </button>
              ) : (
                <button
                  className="edu-btn"
                  type="button"
                  disabled={busy || summary.trim().length < 3}
                  onClick={() =>
                    guard(() => closeCase(caseId, summary.trim()), "Не удалось закрыть дело")
                  }
                >
                  Закрыть дело
                </button>
              )}
              {closed && c.closedAt && (
                <span className="dg-muted">Закрыто {formatDate(c.closedAt)}</span>
              )}
            </div>
          </section>
        </div>

        {/* ─── Правая колонка: запуск и протокол ──────────────────── */}
        <aside className="dg-col">
          <section className="dg-gates">
            <h2 className="dg-panel-title">Запуск разбора</h2>
            <p className="dg-panel-note">
              Материалы уходят на обработку внешней модели. Два подтверждения ниже — про разные
              вещи, поэтому их два, и они запрашиваются по каждому делу заново.
            </p>

            <div className="dg-gate">
              <input
                id="gate-deid"
                type="checkbox"
                checked={Boolean(c.deidentified)}
                disabled={closed || busy}
                onChange={(e) =>
                  guard(
                    () => updateCase(caseId, { deidentified: e.target.checked }),
                    "Не удалось сохранить подтверждение",
                  )
                }
              />
              <div className="dg-gate-body">
                <label className="dg-gate-label" htmlFor="gate-deid">
                  Материалы обезличены
                </label>
                <p className="dg-gate-why">
                  В тексте и на бланках нет ФИО, дат рождения, номеров документов и телефонов.
                  Шапку бланка проверьте отдельно — там имя остаётся чаще всего.
                </p>
              </div>
            </div>

            <div className="dg-gate">
              <input
                id="gate-consent"
                type="checkbox"
                checked={Boolean(c.aiConsent?.confirmed)}
                disabled={closed || busy}
                onChange={(e) =>
                  guard(
                    () => updateCase(caseId, { aiConsent: e.target.checked }),
                    "Не удалось сохранить согласие",
                  )
                }
              />
              <div className="dg-gate-body">
                <label className="dg-gate-label" htmlFor="gate-consent">
                  Согласие на обработку внешней моделью
                </label>
                <p className="dg-gate-why">
                  Подтверждение фиксируется с датой и временем: это часть ответа на вопрос, на
                  каком основании данные ушли наружу.
                  {c.aiConsent?.at && ` Подтверждено ${formatDate(c.aiConsent.at)}.`}
                </p>
              </div>
            </div>

            {data.blockers.length > 0 && (
              <div className="dg-blockers">
                Разбор не запустится, пока не сделано:
                <ul>
                  {data.blockers.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="dg-row" style={{ marginTop: 14 }}>
              <button
                className="edu-btn"
                type="button"
                disabled={busy || !data.canAnalyze || jobsPending}
                onClick={() => guard(() => analyzeCase(caseId), "Не удалось запустить разбор")}
              >
                {jobsPending ? "Идёт разбор…" : "Разобрать материалы"}
              </button>
            </div>
            <p className="dg-muted" style={{ marginTop: 9 }}>
              Направления выбираются по составу материалов. Занимает минуты — страницу можно
              закрыть, результат сохранится в деле.
            </p>
          </section>

          {data.jobs.length > 0 && (
            <section className="dg-panel">
              <h2 className="dg-panel-title">Задания</h2>
              <div className="dg-jobs">
                {data.jobs.map((j) => (
                  <div className="dg-job" key={j._id}>
                    <div style={{ minWidth: 0 }}>
                      <div className="dg-job-name">{j.modalityTitle}</div>
                      {j.message && <div className="dg-job-msg">{j.message}</div>}
                      {j.provenance?.model && (
                        <div className="dg-job-msg">
                          {j.provenance.model} · {j.findingsCount ?? 0} выводов
                        </div>
                      )}
                    </div>
                    <div className={`dg-job-state dg-job-state--${j.status}`}>
                      {(j.status === "queued" || j.status === "running") && (
                        <span className="dg-spinner" aria-hidden="true" />
                      )}
                      {JOB_LABELS[j.status] ?? j.status}
                      {j.status === "failed" && !closed && (
                        <button
                          type="button"
                          className="edu-btn edu-btn--ghost"
                          style={{ marginLeft: 8 }}
                          disabled={busy}
                          onClick={() =>
                            guard(() => rerunJob(j._id), "Не удалось перезапустить задание")
                          }
                        >
                          Ещё раз
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="dg-panel">
            <h2 className="dg-panel-title">Протокол разбора</h2>
            <p className="dg-panel-note">
              По этим пунктам идёт проверка материала. Открыто до отправки — скрытый протокол
              означал бы доверие вслепую.
            </p>
            {modalities.map((m) => (
              <div className="dg-mod" key={m.key}>
                <button
                  type="button"
                  className="dg-mod-head"
                  onClick={() => setOpenModality(openModality === m.key ? null : m.key)}
                  aria-expanded={openModality === m.key}
                >
                  <span className="dg-mod-name">{m.title}</span>
                  <span className="dg-mod-cap">{openModality === m.key ? "скрыть" : "протокол"}</span>
                </button>
                {openModality === m.key && (
                  <div className="dg-mod-body">
                    <p className="dg-mod-purpose">{m.purpose}</p>
                    {m.checklist?.length > 0 && (
                      <>
                        <p className="dg-finding-sub">Проверяется</p>
                        <ol>
                          {m.checklist.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ol>
                      </>
                    )}
                    {m.redFlags?.length > 0 && (
                      <>
                        <p className="dg-finding-sub">Нельзя пропустить</p>
                        <ul className="dg-mod-flags">
                          {m.redFlags.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {m.binaryNote && <p className="dg-artifact-note">{m.binaryNote}</p>}
                  </div>
                )}
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
