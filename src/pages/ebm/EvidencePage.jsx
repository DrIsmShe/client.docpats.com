// client/src/pages/ebm/EvidencePage.jsx
//
// Доказательная медицина. Маршрут: /doctor/evidence
//
// Врач задаёт клинический вопрос своими словами и на своём языке — страница
// показывает, ЧТО ПО НЕМУ ЕСТЬ в PubMed, разложенное по силе дизайна
// исследования.
//
// ЧЕГО ЭТА СТРАНИЦА НАМЕРЕННО НЕ ДЕЛАЕТ: она не отвечает на клинический
// вопрос. Ни «да, помогает», ни «нет, не помогает». Она показывает поле
// литературы и оставляет вывод врачу — потому что вывод по заголовкам делать
// нельзя, а выглядел бы он убедительно.
//
// Всё, что показано, приходит из PubMed: названия, журналы, годы, PMID, DOI.
// Модель участвует только в переводе вопроса в поисковый запрос, и этот запрос
// показывается врачу — он должен видеть, о чём именно спросили базу.

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import {
  askEvidence,
  searchEvidence,
  fetchStatus,
  publicationLink,
} from "../../api/ebm";
import "../education/education.css";
import "./ebm.css";

// Свежесть. 0 — без ограничения: для редких тем отсечь старое значит остаться
// ни с чем, а классические работы по многим вопросам вышли давно.
const PERIODS = [
  { value: 0, key: "periodAny" },
  { value: 5, key: "period5" },
  { value: 10, key: "period10" },
];

export default function EvidencePage() {
  const { t } = useTranslation("ebm");
  const [searchParams] = useSearchParams();

  // Вопрос может прийти ссылкой — из карточки медицинской ленты («проверить
  // доказательства по этой теме»). Заголовок новости не идеальный клинический
  // вопрос, но разбор всё равно вытащит из него термины, а врач видит поле
  // ввода и может уточнить формулировку.
  const [question, setQuestion] = useState(searchParams.get("q") || "");
  const [years, setYears] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiAvailable, setAiAvailable] = useState(true);
  // Режим «сам напишу запрос PubMed» — для тех, кто владеет синтаксисом.
  const [rawMode, setRawMode] = useState(false);

  const abortRef = useRef(null);

  useEffect(() => {
    // Без ключа модели поле свободного вопроса бесполезно — тогда страница
    // сразу открывается в режиме прямого запроса PubMed, а не даёт врачу
    // упереться в ошибку после набора текста.
    fetchStatus()
      .then((s) => {
        setAiAvailable(Boolean(s?.ask));
        if (!s?.ask) setRawMode(true);
      })
      .catch(() => {});
  }, []);

  const run = useCallback(async () => {
    const text = question.trim();
    if (text.length < 5) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const data = rawMode
        ? await searchEvidence(text, { years, signal: controller.signal })
        : await askEvidence(text, { years, signal: controller.signal });
      setResult(data);
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          t("errorGeneric"),
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [question, years, rawMode, t]);

  const onSubmit = (e) => {
    e.preventDefault();
    run();
  };

  // Пришли по ссылке с готовым вопросом — ищем сразу, не заставляя нажимать
  // кнопку ещё раз. Один раз за открытие страницы: дальше врач управляет сам.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    const fromLink = searchParams.get("q");
    if (!fromLink || fromLink.trim().length < 5) return;
    autoRan.current = true;
    run();
  }, [searchParams, run]);

  return (
    <div className="ebm-page">
      <header className="ebm-head">
        <h1>{t("title")}</h1>
        <p className="ebm-lead">{t("lead")}</p>
      </header>

      <form className="ebm-form" onSubmit={onSubmit}>
        <textarea
          className="ebm-input"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={rawMode ? t("placeholderRaw") : t("placeholderAsk")}
          onKeyDown={(e) => {
            // Enter отправляет, Shift+Enter переносит строку: вопрос обычно в
            // одну строку, и тянуться к кнопке каждый раз утомительно.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              run();
            }
          }}
        />

        <div className="ebm-controls">
          <label className="ebm-period">
            {t("period")}
            <select
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {t(p.key)}
                </option>
              ))}
            </select>
          </label>

          {aiAvailable && (
            <label className="ebm-raw-toggle">
              <input
                type="checkbox"
                checked={rawMode}
                onChange={(e) => setRawMode(e.target.checked)}
              />
              {t("rawMode")}
            </label>
          )}

          <button
            type="submit"
            className="ebm-submit"
            disabled={loading || question.trim().length < 5}
          >
            {loading ? t("searching") : t("search")}
          </button>
        </div>

        {rawMode && <p className="ebm-hint">{t("rawHint")}</p>}
      </form>

      {loading && (
        <p className="ebm-status">
          {rawMode ? t("waitSearch") : t("waitAsk")}
        </p>
      )}

      {error && <p className="ebm-error">{error}</p>}

      {result && !loading && <Result result={result} t={t} />}
    </div>
  );
}

function Result({ result, t }) {
  const { understood, verdict, levels = [], usedQuery, widened, query } = result;
  const shownQuery = usedQuery || query;

  return (
    <section className="ebm-result">
      {/* Как понят вопрос. Показывается ДО результатов: если вопрос понят
          неверно, читать выдачу незачем — надо переформулировать. */}
      {understood?.pico && hasPico(understood.pico) && (
        <div className="ebm-pico">
          <h2>{t("understood")}</h2>
          <dl>
            <PicoRow label={t("picoP")} value={understood.pico.population} />
            <PicoRow label={t("picoI")} value={understood.pico.intervention} />
            <PicoRow label={t("picoC")} value={understood.pico.comparison} />
            <PicoRow label={t("picoO")} value={understood.pico.outcome} />
          </dl>
          {understood.note && <p className="ebm-note">{understood.note}</p>}
        </div>
      )}

      <div className={`ebm-verdict ebm-verdict--${verdict?.kind}`}>
        <strong>{verdict?.text}</strong>
        {/* Это не оценка лечения, а описание найденного. Проговорено прямо,
            потому что страница с мета-анализами читается как приговор. */}
        <span className="ebm-verdict-note">{t("verdictNote")}</span>
      </div>

      {widened && <p className="ebm-widened">{t("widened")}</p>}

      {shownQuery && (
        <details className="ebm-query">
          <summary>{t("showQuery")}</summary>
          <code>{shownQuery}</code>
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(shownQuery)}`}
            target="_blank"
            rel="noreferrer"
          >
            {t("openInPubmed")}
          </a>
        </details>
      )}

      {levels.map((level) => (
        <Level key={level.key} level={level} t={t} />
      ))}
    </section>
  );
}

function Level({ level, t }) {
  if (!level.total) return null;

  return (
    <div className="ebm-level">
      <h3>
        {level.title}
        <span className="ebm-level-count">{level.total}</span>
      </h3>
      <p className="ebm-level-note">{level.note}</p>

      <ul className="ebm-items">
        {level.items.map((item) => (
          <li key={item.pmid} className="ebm-item">
            <a href={publicationLink(item)} target="_blank" rel="noreferrer">
              {item.title}
            </a>
            <div className="ebm-item-meta">
              {[item.journal, item.year].filter(Boolean).join(", ")}
              {item.aheadOfPrint && (
                <span className="ebm-ahead">{t("aheadOfPrint")}</span>
              )}
            </div>

            {/* Работа есть в нашем архиве целиком.
                PubMed отдаёт только аннотацию, и обычно на этом чтение
                заканчивается: у издателя половина статей за подпиской. Здесь
                же лежит полный текст — из журналов открытого доступа. */}
            {item.fullTextUrl && (
              <a className="ebm-fulltext" href={item.fullTextUrl}>
                {t("readFullHere")}
                <span className="ebm-fulltext-size">
                  {Math.round((item.fullTextLength || 0) / 1000)} {t("thousandChars")}
                </span>
              </a>
            )}
            {item.authors?.length > 0 && (
              <div className="ebm-authors">
                {item.authors.slice(0, 3).join(", ")}
                {item.authors.length > 3 && " et al."}
              </div>
            )}
          </li>
        ))}
      </ul>

      {level.total > level.items.length && (
        <p className="ebm-more">
          {/* Переменная называется n, а не count: count — служебное имя
              i18next, оно включает плюрализацию и требует ключей _one/_other.
              Без них строка молча не находится. */}
          {t("moreInPubmed", { n: level.total - level.items.length })}
        </p>
      )}
    </div>
  );
}

function PicoRow({ label, value }) {
  if (!value) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function hasPico(pico) {
  return Boolean(
    pico.population || pico.intervention || pico.comparison || pico.outcome,
  );
}
