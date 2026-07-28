// client/src/pages/admin/education/ItemTranslationsPanel.jsx
//
// Переводы одного вопроса: состояние по четырём языкам, запуск перевода и
// ручная правка.
//
// Панель на русском — как и вся админка тренажёра и банка вопросов: её ведёт
// один человек, и переводить интерфейс редактора на пять языков было бы
// работой вхолостую. Переводится то, что читает врач, а не то, что читает
// редактор.
//
// Ключи вариантов ("A", "B") здесь показаны, но НЕ редактируются: ответ
// проверяется по ключу, ключи принадлежат оригиналу. Сервер такую правку и не
// примет — поле просто не даёт её начать.

import { useCallback, useEffect, useState } from "react";
import {
  fetchItemTranslations,
  translateItem,
  updateItemTranslation,
  unreviewItemTranslation,
} from "../../../api/education";

const LANG_NAMES = {
  en: "Английский",
  az: "Азербайджанский",
  tr: "Турецкий",
  ar: "Арабский",
  ru: "Русский",
};

const STATUS_LABELS = {
  missing: { text: "нет перевода", cls: "tr-badge--missing" },
  auto: { text: "автоперевод", cls: "tr-badge--auto" },
  stale: { text: "устарел", cls: "tr-badge--stale" },
  reviewed: { text: "проверено", cls: "tr-badge--ok" },
};

function readError(err, fallback) {
  return err?.response?.data?.message ?? err?.message ?? fallback;
}

export default function ItemTranslationsPanel({ itemId, itemStatus }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // код языка или "all"
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // { lang, id, stem, options, explanation }

  const load = useCallback(async () => {
    try {
      setState(await fetchItemTranslations(itemId));
      setError(null);
    } catch (err) {
      setError(readError(err, "Не удалось загрузить переводы"));
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    setLoading(true);
    setEditing(null);
    load();
  }, [load]);

  async function run(langs, { force = false } = {}) {
    setBusy(langs ? langs[0] : "all");
    setError(null);
    try {
      const { report } = await translateItem(itemId, { langs, force, sync: true });
      if (report?.failed?.length) {
        setError(
          report.failed.map((f) => `${LANG_NAMES[f.lang] ?? f.lang}: ${f.message}`).join("; "),
        );
      }
      await load();
    } catch (err) {
      setError(readError(err, "Перевод не удался"));
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit() {
    setBusy(editing.lang);
    setError(null);
    try {
      await updateItemTranslation(editing.id, {
        stem: editing.stem,
        explanation: editing.explanation,
        options: editing.options.map((o) => ({ key: o.key, text: o.text })),
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(readError(err, "Не удалось сохранить правку"));
    } finally {
      setBusy(null);
    }
  }

  async function allowAuto(row) {
    setBusy(row.lang);
    try {
      await unreviewItemTranslation(row.id);
      await load();
    } catch (err) {
      setError(readError(err, "Не удалось снять отметку"));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="edu-hint">Загружаем переводы…</div>;
  if (!state) return null;

  const anyWork = state.languages.some((l) => l.status !== "reviewed");

  return (
    <div className="tr-panel">
      <div className="tr-head">
        <div>
          <strong>Переводы вопроса</strong>
          <div className="edu-hint" style={{ marginTop: 2 }}>
            Оригинал — {LANG_NAMES[state.sourceLang] ?? state.sourceLang}, версия{" "}
            {state.sourceVersion}. Верный ответ и ключи вариантов у переводов те же:
            перевод не может изменить, какой ответ верен.
          </div>
        </div>
        {anyWork && (
          <button
            type="button"
            className="edu-btn"
            disabled={Boolean(busy)}
            onClick={() => run(null)}
          >
            {busy === "all" ? "Переводим…" : "Перевести недостающие"}
          </button>
        )}
      </div>

      {itemStatus !== "published" && (
        <div className="edu-hint tr-note">
          Вопрос ещё не опубликован. Перевод повторяет статус оригинала, поэтому
          врачу он не покажется, пока не опубликован сам вопрос — переводить
          заранее можно, это ни на что не влияет.
        </div>
      )}

      {error && <div className="edu-error" style={{ marginTop: 8 }}>{error}</div>}

      <div className="tr-rows">
        {state.languages.map((row) => {
          const badge = STATUS_LABELS[row.status] ?? STATUS_LABELS.missing;
          const isEditing = editing?.lang === row.lang;

          return (
            <div key={row.lang} className="tr-row">
              <div className="tr-row-head">
                <span className="tr-lang">{LANG_NAMES[row.lang] ?? row.lang}</span>
                <span className={`tr-badge ${badge.cls}`}>{badge.text}</span>

                <span className="tr-actions">
                  {row.status === "missing" && (
                    <button
                      type="button"
                      className="edu-btn edu-btn--ghost"
                      disabled={Boolean(busy)}
                      onClick={() => run([row.lang])}
                    >
                      {busy === row.lang ? "…" : "Перевести"}
                    </button>
                  )}
                  {row.status !== "missing" && !isEditing && (
                    <>
                      <button
                        type="button"
                        className="edu-btn edu-btn--ghost"
                        onClick={() =>
                          setEditing({
                            lang: row.lang,
                            id: row.id,
                            stem: row.stem ?? "",
                            explanation: row.explanation ?? "",
                            options: (row.options ?? []).map((o) => ({
                              key: o.key,
                              text: o.text,
                            })),
                          })
                        }
                      >
                        Править
                      </button>
                      {row.status === "reviewed" ? (
                        // Проверенный перевод автоперевод не трогает. Чтобы
                        // машина снова могла его обновлять, отметку надо снять
                        // явно — иначе «перевести заново» тихо стирало бы
                        // чужую работу.
                        <button
                          type="button"
                          className="edu-btn edu-btn--ghost"
                          disabled={Boolean(busy)}
                          onClick={() => allowAuto(row)}
                          title="Разрешить автопереводу обновлять этот текст"
                        >
                          Снять «проверено»
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="edu-btn edu-btn--ghost"
                          disabled={Boolean(busy)}
                          onClick={() => run([row.lang], { force: true })}
                        >
                          {busy === row.lang ? "…" : "Заново"}
                        </button>
                      )}
                    </>
                  )}
                </span>
              </div>

              {row.status === "stale" && (
                <div className="edu-hint tr-stale">
                  Оригинал изменился после перевода. Нажмите «Заново», иначе врач
                  на этом языке видит старую формулировку.
                </div>
              )}

              {isEditing ? (
                <div className="tr-edit">
                  <label className="edu-field-label">Условие</label>
                  <textarea
                    className="edu-textarea"
                    rows={3}
                    value={editing.stem}
                    onChange={(e) => setEditing({ ...editing, stem: e.target.value })}
                  />
                  {editing.options.map((o, i) => (
                    <div key={o.key} className="tr-opt">
                      {/* Ключ показан, но не редактируется — он принадлежит
                          оригиналу и определяет, какой ответ верен. */}
                      <span className="tr-opt-key">{o.key}</span>
                      <input
                        className="edu-input"
                        value={o.text}
                        onChange={(e) => {
                          const options = [...editing.options];
                          options[i] = { ...o, text: e.target.value };
                          setEditing({ ...editing, options });
                        }}
                      />
                    </div>
                  ))}
                  <label className="edu-field-label">Объяснение</label>
                  <textarea
                    className="edu-textarea"
                    rows={2}
                    value={editing.explanation}
                    onChange={(e) => setEditing({ ...editing, explanation: e.target.value })}
                  />
                  <div className="edu-btn-row" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="edu-btn"
                      disabled={Boolean(busy)}
                      onClick={saveEdit}
                    >
                      {busy === editing.lang ? "Сохраняем…" : "Сохранить и пометить проверенным"}
                    </button>
                    <button
                      type="button"
                      className="edu-btn edu-btn--ghost"
                      onClick={() => setEditing(null)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                row.status !== "missing" && (
                  <div className="tr-preview" dir={row.lang === "ar" ? "rtl" : "ltr"}>
                    <div className="tr-preview-stem">{row.stem}</div>
                    <ul className="tr-preview-opts">
                      {(row.options ?? []).map((o) => (
                        <li key={o.key}>
                          <b>{o.key}.</b> {o.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
