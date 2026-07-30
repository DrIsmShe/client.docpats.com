// client/src/pages/admin/radiology/CaseTranslationsPanel.jsx
//
// Состояние переводов кейса — общий блок для трёх станций арены.
//
// ЗАЧЕМ ОН НУЖЕН, ЕСЛИ ПЕРЕВОД АВТОМАТИЧЕСКИЙ. Врачу кейс приходит на его
// языке сам: перевод запускается при публикации, а пропущенное догоняется при
// первом открытии. Кнопок для этого нет и не должно быть. Но у автоперевода
// есть режим отказа, невидимый из админки: модель отклоняет медицинский текст
// (травма, токсикология) или не помещается в лимит, и тогда кейс остаётся без
// перевода на один язык. Со стороны редактора всё выглядит нормально, а врач
// на арабском читает русский текст.
//
// Поэтому здесь показывается ровно то, чего не видно иначе: по каждому языку —
// есть ли перевод, свежий ли он, и главное — СВЕРОЧНЫЕ КЛЮЧИ ДИАГНОЗА. Если в
// них ошибка, врач, ответивший верно на своём языке, получает ноль, и по тексту
// кейса это никак не заметно.

import { useCallback, useEffect, useState } from "react";
import {
  fetchCaseTranslations,
  translateCaseNow,
  saveCaseTranslation,
  unreviewCaseTranslation,
} from "../../../api/radiology";

const LANG_NAMES = {
  ru: "Русский",
  en: "English",
  az: "Azərbaycan",
  tr: "Türkçe",
  ar: "العربية",
};

const STATUS = {
  missing: { label: "нет перевода", color: "#b42318", bg: "#fef3f2" },
  stale: { label: "устарел", color: "#b45309", bg: "#fffbeb" },
  auto: { label: "автоперевод", color: "#175cd3", bg: "#eff8ff" },
  reviewed: { label: "проверен", color: "#067647", bg: "#ecfdf3" },
};

const asList = (value) => (Array.isArray(value) ? value.join(", ") : "");
const fromList = (value) =>
  String(value ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

function errText(err) {
  return err?.response?.data?.error?.message ?? err?.message ?? "не получилось";
}

/**
 * @param {"radiology"|"labs"|"vp"} props.caseType
 * @param {string} props.caseId  сохранённый кейс; для нового панель не рисуется
 */
export default function CaseTranslationsPanel({ caseType, caseId }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [open, setOpen] = useState(null); // язык, открытый на правку
  const [draft, setDraft] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setState(await fetchCaseTranslations(caseType, caseId));
    } catch (err) {
      setError(errText(err));
    }
  }, [caseType, caseId]);

  useEffect(() => {
    setState(null);
    setOpen(null);
    setDraft(null);
    if (caseId && caseId !== "new") load();
  }, [caseId, load]);

  if (!caseId || caseId === "new") return null;

  async function run(key, fn) {
    setBusy(key);
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy("");
    }
  }

  function startEdit(row) {
    setOpen(row.lang);
    setDraft({
      fields: { ...(row.fields ?? {}) },
      diagnosisKeys: asList(row.diagnosisKeys),
      diagnosisSynonyms: asList(row.diagnosisSynonyms),
    });
  }

  const rows = state?.languages ?? [];
  const missing = rows.filter((r) => r.status === "missing").length;
  const stale = rows.filter((r) => r.status === "stale").length;

  return (
    <div className="rad-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div className="edu-card-title" style={{ fontSize: 15, margin: 0 }}>
          🌐 Переводы кейса
        </div>
        <button
          type="button"
          className="edu-btn edu-btn--ghost"
          style={{ padding: "4px 10px", fontSize: 12 }}
          onClick={() => run("all", () => translateCaseNow(caseType, caseId))}
          disabled={Boolean(busy)}
        >
          {busy === "all" ? "переводим…" : "перевести недостающее"}
        </button>
      </div>

      <div className="edu-hint" style={{ marginTop: 6 }}>
        Врач получает кейс на своём языке автоматически — перевод запускается при
        публикации и догоняется при первом открытии. Здесь видно, где он не
        удался, и можно поправить формулировки.
      </div>

      {error && (
        <div className="edu-notice" style={{ marginTop: 8, color: "#b42318" }}>
          {error}
        </div>
      )}

      {!state ? (
        <div className="edu-hint" style={{ marginTop: 8 }}>Загружаем…</div>
      ) : (
        <>
          {(missing > 0 || stale > 0) && (
            <div className="edu-hint" style={{ marginTop: 8 }}>
              {missing > 0 && <>Без перевода: <b>{missing}</b>. </>}
              {stale > 0 && <>Устарело после правок: <b>{stale}</b>.</>}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {rows.map((row) => {
              const s = STATUS[row.status] ?? STATUS.auto;
              const editing = open === row.lang;
              return (
                <div
                  key={row.lang}
                  style={{
                    border: `1px solid ${s.color}33`,
                    background: s.bg,
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {LANG_NAMES[row.lang] ?? row.lang}
                      <span style={{ fontSize: 12, color: s.color, fontWeight: 500 }}>
                        {" · "}{s.label}
                      </span>
                    </span>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {/*
                        У проверенного перевода кнопки «перевести заново» нет
                        намеренно: сервис такой перевод не перезаписывает даже
                        принудительно (ручная правка дороже машинной), и кнопка
                        молча ничего бы не делала. Сначала снимается «проверен».
                      */}
                      {row.status !== "reviewed" && (
                        <button
                          type="button"
                          className="edu-btn edu-btn--ghost"
                          style={{ padding: "2px 8px", fontSize: 12 }}
                          onClick={() =>
                            run(`tr-${row.lang}`, () =>
                              translateCaseNow(caseType, caseId, {
                                langs: [row.lang],
                                // Свежий по хешу перевод иначе был бы пропущен.
                                force: row.status !== "missing",
                              }),
                            )
                          }
                          disabled={Boolean(busy)}
                        >
                          {busy === `tr-${row.lang}`
                            ? "переводим…"
                            : row.status === "missing"
                              ? "перевести"
                              : "перевести заново"}
                        </button>
                      )}
                      {row.status !== "missing" && (
                        <button
                          type="button"
                          className="edu-btn edu-btn--ghost"
                          style={{ padding: "2px 8px", fontSize: 12 }}
                          onClick={() => (editing ? setOpen(null) : startEdit(row))}
                          disabled={Boolean(busy)}
                        >
                          {editing ? "свернуть" : "править"}
                        </button>
                      )}
                      {row.status === "reviewed" && (
                        <button
                          type="button"
                          className="edu-btn edu-btn--ghost"
                          style={{ padding: "2px 8px", fontSize: 12 }}
                          onClick={() =>
                            run(`un-${row.lang}`, () =>
                              unreviewCaseTranslation(caseType, caseId, row.lang),
                            )
                          }
                          disabled={Boolean(busy)}
                        >
                          снять «проверен»
                        </button>
                      )}
                    </div>
                  </div>

                  {row.status === "reviewed" && (
                    <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
                      Правку редактора автоперевод не перезапишет. Чтобы
                      перевести заново, снимите «проверен».
                    </div>
                  )}

                  {row.status === "missing" ? (
                    <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
                      На этом языке врач увидит кейс в оригинале.
                    </div>
                  ) : (
                    <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
                      Принятые диагнозы: {asList(row.diagnosisKeys) || "— пусто, балл за диагноз не получит никто"}
                    </div>
                  )}

                  {editing && draft && (
                    <div style={{ marginTop: 8, borderTop: `1px solid ${s.color}22`, paddingTop: 8 }}>
                      {Object.entries(draft.fields).map(([path, text]) => (
                        <div key={path} style={{ marginBottom: 8 }}>
                          <div className="edu-field-label" style={{ marginTop: 0 }}>{path}</div>
                          <textarea
                            className="edu-textarea"
                            rows={text.length > 120 ? 3 : 2}
                            value={text}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                fields: { ...d.fields, [path]: e.target.value },
                              }))
                            }
                          />
                        </div>
                      ))}

                      <div className="edu-field-label">Принятые формулировки диагноза</div>
                      <input
                        className="edu-input"
                        value={draft.diagnosisKeys}
                        onChange={(e) => setDraft((d) => ({ ...d, diagnosisKeys: e.target.value }))}
                      />
                      <div className="edu-hint">
                        Через запятую. С этим списком сверяется ответ врача — не
                        оформление, а условие зачёта. Пустым быть не может.
                      </div>

                      <div className="edu-field-label">Синонимы</div>
                      <input
                        className="edu-input"
                        value={draft.diagnosisSynonyms}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, diagnosisSynonyms: e.target.value }))
                        }
                      />

                      <div className="edu-btn-row" style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className="edu-btn"
                          style={{ padding: "4px 12px", fontSize: 13 }}
                          onClick={() =>
                            run(`save-${row.lang}`, async () => {
                              await saveCaseTranslation(caseType, caseId, row.lang, {
                                fields: draft.fields,
                                diagnosisKeys: fromList(draft.diagnosisKeys),
                                diagnosisSynonyms: fromList(draft.diagnosisSynonyms),
                              });
                              setOpen(null);
                              setDraft(null);
                            })
                          }
                          disabled={Boolean(busy)}
                        >
                          {busy === `save-${row.lang}` ? "Сохраняем…" : "Сохранить как проверенный"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
