// client/src/pages/diagnostics/components/FindingCard.jsx
//
// Один вывод разбора + вердикт врача.
//
// Три решения в этом файле стоит объяснить, потому что они выглядят как мелочи
// интерфейса, а на деле это правила модуля:
//
// 1. Значимость показана И полосой, И подписью. Никогда только цветом: врач с
//    нарушением цветовосприятия не должен пропустить критическое.
//
// 2. Уверенность выводится словом («средняя»), а не процентом. Процент от
//    языковой модели выглядит измерением, которым он не является.
//
// 3. Поле поправки открыто сразу при «частично» и «не согласен» — не спрятано
//    за «подробнее». Поправки врачей и есть разметка будущего датасета; если
//    их сделать неудобными, останутся только клики «согласен», по которым
//    нельзя понять ничего.

import { useState } from "react";

const SEVERITY_LABELS = {
  critical: "Критично",
  important: "Важно",
  note: "Замечание",
};

const CONFIDENCE_LABELS = {
  high: "уверенность высокая",
  moderate: "уверенность средняя",
  low: "уверенность низкая",
};

const VERDICTS = [
  { key: "agree", label: "Согласен" },
  { key: "partly", label: "Частично" },
  { key: "disagree", label: "Не согласен" },
];

export default function FindingCard({ finding, modalityTitle, disabled, onVerdict }) {
  const [correction, setCorrection] = useState(finding.correction ?? "");
  const [pending, setPending] = useState(false);
  const [openCorrection, setOpenCorrection] = useState(
    finding.verdict === "partly" || finding.verdict === "disagree",
  );
  const [error, setError] = useState(null);

  const severity = finding.severity ?? "note";

  async function send(verdict) {
    if (pending || disabled) return;
    setPending(true);
    setError(null);
    try {
      await onVerdict(finding._id, { verdict, correction: correction.trim() });
      if (verdict === "partly" || verdict === "disagree") setOpenCorrection(true);
    } catch (err) {
      setError(err?.message ?? "Не удалось сохранить вердикт");
    } finally {
      setPending(false);
    }
  }

  return (
    <article className={`dg-finding dg-finding--${severity}`}>
      <div className="dg-finding-head">
        <span className={`dg-sev dg-sev--${severity}`}>{SEVERITY_LABELS[severity] ?? severity}</span>
        <span className="dg-conf">{CONFIDENCE_LABELS[finding.confidence] ?? ""}</span>
        {modalityTitle && <span className="dg-conf">· {modalityTitle}</span>}
      </div>

      <h3 className="dg-finding-title">{finding.title}</h3>
      {finding.detail && <p className="dg-finding-detail">{finding.detail}</p>}

      {finding.recommendations?.length > 0 && (
        <>
          <p className="dg-finding-sub">Что сделать</p>
          <ul className="dg-finding-list">
            {finding.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </>
      )}

      {finding.citations?.length > 0 && (
        <>
          <p className="dg-finding-sub">Основание</p>
          <ul className="dg-finding-list">
            {finding.citations.map((c, i) => (
              <li key={i}>
                {c.source}
                {c.note ? ` — ${c.note}` : ""}
                {!c.verified && (
                  <span className="dg-conf"> (ссылка не проверена — сверьтесь с источником)</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {finding.checklistItem && (
        <p className="dg-checklist-ref">Пункт протокола: {finding.checklistItem}</p>
      )}

      <div className="dg-verdict">
        <p className="dg-verdict-q">
          {finding.verdict === "pending"
            ? "Согласны с этим выводом? Ответ нужен не для отчётности — по нему видно, где разбор ошибается."
            : "Ваш вердикт:"}
        </p>

        <div className="dg-verdict-btns">
          {VERDICTS.map((v) => (
            <button
              key={v.key}
              type="button"
              className={`dg-vbtn ${finding.verdict === v.key ? "dg-vbtn--on" : ""}`}
              onClick={() => send(v.key)}
              disabled={pending || disabled}
            >
              {v.label}
            </button>
          ))}
          {!openCorrection && (
            <button
              type="button"
              className="dg-vbtn"
              onClick={() => setOpenCorrection(true)}
              disabled={disabled}
            >
              Дополнить
            </button>
          )}
        </div>

        {openCorrection && (
          <div style={{ marginTop: 10 }}>
            <span className="dg-label">Как правильно</span>
            <textarea
              className="edu-textarea"
              rows={3}
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              placeholder="В чём вывод неверен или неполон. Пишите как коллеге — это увидит редактор модуля, а не пациент."
              maxLength={4000}
              disabled={disabled}
            />
            <div className="dg-row" style={{ marginTop: 8 }}>
              <button
                type="button"
                className="edu-btn edu-btn--ghost"
                onClick={() => send(finding.verdict === "pending" ? "partly" : finding.verdict)}
                disabled={pending || disabled || !correction.trim()}
              >
                {pending ? "Сохраняем…" : "Сохранить поправку"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="dg-err" style={{ marginTop: 10, marginBottom: 0 }}>{error}</p>}

        {finding.verdict !== "pending" && !error && (
          <p className="dg-verdict-done">Учтено. Вердикт можно изменить в любой момент.</p>
        )}
      </div>
    </article>
  );
}
