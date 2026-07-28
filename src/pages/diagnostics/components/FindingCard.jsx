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
import { useTranslation } from "react-i18next";

// Ключи словаря, а не готовые подписи: раздел переводится на пять языков.
const SEVERITY_KEY = {
  critical: "severityCritical",
  important: "severityImportant",
  note: "severityNote",
};

const CONFIDENCE_KEY = {
  high: "confidenceHigh",
  moderate: "confidenceModerate",
  low: "confidenceLow",
};

const VERDICTS = ["agree", "partly", "disagree"];

export default function FindingCard({ finding, modalityTitle, disabled, onVerdict }) {
  const { t } = useTranslation("diagnostics");
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
      setError(err?.message ?? t("verdictFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <article className={`dg-finding dg-finding--${severity}`}>
      <div className="dg-finding-head">
        <span className={`dg-sev dg-sev--${severity}`}>
          {SEVERITY_KEY[severity] ? t(SEVERITY_KEY[severity]) : severity}
        </span>
        <span className="dg-conf">
          {CONFIDENCE_KEY[finding.confidence] ? t(CONFIDENCE_KEY[finding.confidence]) : ""}
        </span>
        {modalityTitle && <span className="dg-conf">· {modalityTitle}</span>}
      </div>

      <h3 className="dg-finding-title">{finding.title}</h3>
      {finding.detail && <p className="dg-finding-detail">{finding.detail}</p>}

      {finding.recommendations?.length > 0 && (
        <>
          <p className="dg-finding-sub">{t("whatToDo")}</p>
          <ul className="dg-finding-list">
            {finding.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </>
      )}

      {finding.citations?.length > 0 && (
        <>
          <p className="dg-finding-sub">{t("basis")}</p>
          <ul className="dg-finding-list">
            {finding.citations.map((c, i) => (
              <li key={i}>
                {c.source}
                {c.note ? ` — ${c.note}` : ""}
                {!c.verified && (
                  <span className="dg-conf"> {t("citationUnverified")}</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {finding.checklistItem && (
        <p className="dg-checklist-ref">{t("protocolItem", { item: finding.checklistItem })}</p>
      )}

      <div className="dg-verdict">
        <p className="dg-verdict-q">
          {finding.verdict === "pending" ? t("verdictQuestion") : t("yourVerdict")}
        </p>

        <div className="dg-verdict-btns">
          {VERDICTS.map((key) => (
            <button
              key={key}
              type="button"
              className={`dg-vbtn ${finding.verdict === key ? "dg-vbtn--on" : ""}`}
              onClick={() => send(key)}
              disabled={pending || disabled}
            >
              {t(key)}
            </button>
          ))}
          {!openCorrection && (
            <button
              type="button"
              className="dg-vbtn"
              onClick={() => setOpenCorrection(true)}
              disabled={disabled}
            >
              {t("addCorrection")}
            </button>
          )}
        </div>

        {openCorrection && (
          <div style={{ marginTop: 10 }}>
            <span className="dg-label">{t("howItShouldBe")}</span>
            <textarea
              className="edu-textarea"
              rows={3}
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              placeholder={t("correctionPlaceholder")}
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
                {pending ? t("saving") : t("saveCorrection")}
              </button>
            </div>
          </div>
        )}

        {error && <p className="dg-err" style={{ marginTop: 10, marginBottom: 0 }}>{error}</p>}

        {finding.verdict !== "pending" && !error && (
          <p className="dg-verdict-done">{t("verdictSaved")}</p>
        )}
      </div>
    </article>
  );
}
