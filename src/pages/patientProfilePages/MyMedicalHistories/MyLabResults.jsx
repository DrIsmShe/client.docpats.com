// client/src/pages/patient/MyLabResults.jsx
//
// Patient-side unified lab results page (Variant X).
// Shows clinic LabResult + legacy LabTest in one list, sorted by date.
// Per-parameter flags (↑/↓/‼), source badge, expandable rows, file links.
//
// Uses the same dark "pf-*" styling family as MyPrescriptions.

import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMyLabResults, getMyLabResultPdf } from "../../../api/patient";

const FLAG_META = {
  normal: { sym: "", cls: "mlab-normal" },
  high: { sym: "↑", cls: "mlab-high" },
  low: { sym: "↓", cls: "mlab-low" },
  critical_high: { sym: "‼↑", cls: "mlab-crit" },
  critical_low: { sym: "‼↓", cls: "mlab-crit" },
  abnormal: { sym: "⚠", cls: "mlab-high" },
};

const STATUS_RU = {
  preliminary: "Предварительно",
  final: "Готов",
  corrected: "Исправлен",
  amended: "Дополнен",
};

const CSS = `
  .mlab-wrap { max-width: 900px; margin: 0 auto; padding: 28px 20px 60px; color: #e2e8f0; }
  .mlab-eyebrow { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
  .mlab-title { font-size: 28px; font-weight: 700; margin-bottom: 4px; color: #f1f5f9; }
  .mlab-title span { color: #38bdf8; }
  .mlab-sub { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }

  .mlab-list { display: flex; flex-direction: column; gap: 12px; }
  .mlab-card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; }
  .mlab-head { display: flex; align-items: center; gap: 12px; padding: 16px 18px; cursor: pointer; }
  .mlab-head:hover { background: #131c2e; }
  .mlab-date { font-size: 12px; color: #64748b; min-width: 86px; }
  .mlab-main { flex: 1; min-width: 0; }
  .mlab-name { font-weight: 600; color: #f1f5f9; font-size: 15px; }
  .mlab-meta { font-size: 12px; color: #94a3b8; margin-top: 2px; }
  .mlab-badges { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  .mlab-src { font-size: 10px; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; }
  .mlab-src-clinic { background: rgba(56,189,248,.12); color: #38bdf8; border: 1px solid rgba(56,189,248,.3); }
  .mlab-src-legacy { background: rgba(148,163,184,.12); color: #94a3b8; border: 1px solid rgba(148,163,184,.3); }

  .mlab-abn { font-size: 11px; padding: 3px 8px; border-radius: 6px; background: rgba(245,158,11,.14); color: #f59e0b; font-weight: 600; }
  .mlab-status { font-size: 11px; padding: 3px 8px; border-radius: 6px; background: rgba(148,163,184,.1); color: #cbd5e1; }

  .mlab-body { padding: 0 18px 18px; border-top: 1px solid #1f2937; }
  .mlab-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  .mlab-table th { text-align: left; color: #64748b; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; padding: 6px 8px; border-bottom: 1px solid #1f2937; }
  .mlab-table td { padding: 7px 8px; border-bottom: 1px solid #161f30; color: #cbd5e1; }
  .mlab-val { font-weight: 600; }
  .mlab-ref { color: #64748b; font-size: 12px; }

  .mlab-normal {}
  .mlab-high { color: #f59e0b !important; }
  .mlab-low  { color: #60a5fa !important; }
  .mlab-crit { color: #ef4444 !important; font-weight: 700 !important; }

  .mlab-report { margin-top: 12px; padding: 12px; background: #0d1525; border-radius: 8px; color: #cbd5e1; font-size: 13px; line-height: 1.6; }
  .mlab-dx { margin-top: 10px; font-size: 13px; color: #cbd5e1; }
  .mlab-dx-code { display: inline-block; background: rgba(56,189,248,.12); color: #38bdf8; padding: 1px 7px; border-radius: 5px; margin-right: 8px; font-size: 12px; }

  .mlab-files { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
  .mlab-file-link { font-size: 13px; color: #38bdf8; text-decoration: none; padding: 6px 10px; border: 1px solid rgba(56,189,248,.3); border-radius: 8px; }
  .mlab-file-link:hover { background: rgba(56,189,248,.08); }

  .mlab-empty, .mlab-loading, .mlab-error { text-align: center; padding: 60px 20px; color: #64748b; }
  .mlab-error { color: #f87171; }
  .mlab-retry { margin-top: 12px; background: #1f2937; color: #e2e8f0; border: none; padding: 8px 18px; border-radius: 8px; cursor: pointer; }
`;

export default function MyLabResults() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getMyLabResults();
      setItems(data?.items || []);
    } catch (err) {
      console.error("Failed to load lab results:", err);
      setError(
        t("myLab.loadError", { defaultValue: "Не удалось загрузить анализы" }),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const [pdfBusyId, setPdfBusyId] = useState(null);

  async function handlePdf(lab) {
    setPdfBusyId(lab._id);
    try {
      const lang = (i18n.language || "ru").split("-")[0];
      const blob = await getMyLabResultPdf(lab._id, lang);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Lab PDF failed:", err);
      alert(
        t("myLab.pdfError", { defaultValue: "Не удалось сформировать PDF" }),
      );
    } finally {
      setPdfBusyId(null);
    }
  }

  function fmtDate(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  return (
    <div className="mlab-wrap">
      <style>{CSS}</style>

      <div className="mlab-eyebrow">
        {t("myLab.eyebrow", { defaultValue: "Портал пациента" })}
      </div>
      <div className="mlab-title">
        {t("myLab.titleA", { defaultValue: "Мои" })}{" "}
        <span>{t("myLab.titleB", { defaultValue: "анализы" })}</span>
      </div>
      <div className="mlab-sub">
        {t("myLab.records", { defaultValue: "Результатов" })}: {items.length}
      </div>

      {loading ? (
        <div className="mlab-loading">
          {t("common.loading", { defaultValue: "Загрузка..." })}
        </div>
      ) : error ? (
        <div className="mlab-error">
          {error}
          <div>
            <button className="mlab-retry" onClick={load}>
              {t("common.retry", { defaultValue: "Повторить" })}
            </button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="mlab-empty">
          {t("myLab.empty", { defaultValue: "Анализов пока нет." })}
        </div>
      ) : (
        <div className="mlab-list">
          {items.map((lab) => {
            const key = `${lab.source}:${lab._id}`;
            const isOpen = expanded === key;
            const params = Array.isArray(lab.parameters) ? lab.parameters : [];
            const abnormal = params.filter(
              (p) => p.flag && p.flag !== "normal",
            ).length;
            return (
              <div className="mlab-card" key={key}>
                <div
                  className="mlab-head"
                  onClick={() => setExpanded(isOpen ? null : key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpanded(isOpen ? null : key);
                    }
                  }}
                >
                  <div className="mlab-date">{fmtDate(lab.date)}</div>
                  <div className="mlab-main">
                    <div className="mlab-name">{lab.title || "—"}</div>
                    <div className="mlab-meta">
                      {lab.clinicName || lab.labName || ""}
                    </div>
                  </div>
                  <div className="mlab-badges">
                    {abnormal > 0 && (
                      <span className="mlab-abn">{abnormal} ⚠</span>
                    )}
                    <span
                      className={`mlab-src ${
                        lab.source === "clinic"
                          ? "mlab-src-clinic"
                          : "mlab-src-legacy"
                      }`}
                    >
                      {lab.source === "clinic"
                        ? t("myLab.sourceClinic", { defaultValue: "Клиника" })
                        : t("myLab.sourceLegacy", { defaultValue: "Архив" })}
                    </span>
                    <span className="mlab-status">
                      {STATUS_RU[lab.status] || lab.status}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div className="mlab-body">
                    {params.length > 0 && (
                      <table className="mlab-table">
                        <thead>
                          <tr>
                            <th>
                              {t("myLab.colParam", {
                                defaultValue: "Показатель",
                              })}
                            </th>
                            <th>
                              {t("myLab.colValue", {
                                defaultValue: "Значение",
                              })}
                            </th>
                            <th>
                              {t("myLab.colRef", { defaultValue: "Норма" })}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {params.map((p, i) => {
                            const meta = FLAG_META[p.flag] || FLAG_META.normal;
                            const ref =
                              p.referenceRange?.text ||
                              (p.referenceRange?.min != null ||
                              p.referenceRange?.max != null
                                ? `${p.referenceRange?.min ?? ""}–${
                                    p.referenceRange?.max ?? ""
                                  }`
                                : "—");
                            return (
                              <tr key={i}>
                                <td>{p.name}</td>
                                <td className={`mlab-val ${meta.cls}`}>
                                  {String(p.value)}{" "}
                                  {p.unit !== "—" ? p.unit : ""} {meta.sym}
                                </td>
                                <td className="mlab-ref">{ref}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {(lab.diagnosis?.text || lab.diagnosis?.code) && (
                      <div className="mlab-dx">
                        {lab.diagnosis.code && (
                          <span className="mlab-dx-code">
                            {lab.diagnosis.code}
                          </span>
                        )}
                        {lab.diagnosis.text}
                      </div>
                    )}

                    {lab.report && (
                      <div className="mlab-report">{lab.report}</div>
                    )}

                    {lab.hasPdf && (
                      <div className="mlab-files">
                        <button
                          type="button"
                          className="mlab-file-link"
                          style={{ background: "none", cursor: "pointer" }}
                          disabled={pdfBusyId === lab._id}
                          onClick={() => handlePdf(lab)}
                        >
                          {pdfBusyId === lab._id
                            ? t("common.loading", {
                                defaultValue: "Загрузка...",
                              })
                            : "⬇ PDF"}
                        </button>
                      </div>
                    )}

                    {/* clinic: direct attached-file link (its own R2 url) */}
                    {lab.source === "clinic" && lab.attachedFile?.url && (
                      <div className="mlab-files">
                        <a
                          className="mlab-file-link"
                          href={lab.attachedFile.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📎{" "}
                          {lab.attachedFile.fileName ||
                            t("myLab.attached", {
                              defaultValue: "Файл результата",
                            })}
                        </a>
                      </div>
                    )}

                    {/* legacy: has attached scans → open the detail page
                        (which renders the file with the correct URL). */}
                    {lab.source === "legacy" &&
                      Array.isArray(lab.files) &&
                      lab.files.length > 0 && (
                        <div className="mlab-files">
                          <Link
                            className="mlab-file-link"
                            to={`/patient/get-patient-file-detail-lab/${lab._id}`}
                          >
                            📎{" "}
                            {t("myLab.openDetail", {
                              defaultValue: "Открыть детали",
                            })}
                          </Link>
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
