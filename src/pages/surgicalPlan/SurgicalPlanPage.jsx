// client/src/pages/surgicalPlan/SurgicalPlanPage.jsx
//
// Разбор запроса врача в план операции: слева ввод, справа план.
//
// Главная идея экрана — модель работает ОДИН раз, на входе. Дальше врач
// правит план ползунками, а не переписыванием промта: одинаковый план
// всегда даёт одинаковую геометрию, а переписанный текст — нет.
//
// Клинические правила живут только на сервере. Ползунок дёргает дешёвый
// /validate (модель не вызывается), и таблица «до/после» пересчитывается
// оттуда же, откуда её возьмёт отчёт. Продублируй правила здесь ради
// «мгновенности» — и рано или поздно экран и отчёт разойдутся.
//
// Подписи операций и измерений приходят с сервера сразу на двух языках,
// поэтому они локализованы. Обвязка страницы пока русская: это прототип,
// и заводить namespace в public/locales/*/ под неустоявшиеся формулировки
// значило бы переводить их по три раза.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  errorText,
  fetchCatalog,
  parsePlan,
  validatePlan,
} from "../../api/surgicalPlan";
import styles from "./SurgicalPlanPage.module.css";

const PROCEDURE = "rhinoplasty_lateral";

const GENDERS = [
  { value: "female", label: "Женский" },
  { value: "male", label: "Мужской" },
  { value: "other", label: "Другой" },
  { value: "unknown", label: "Не указан" },
];

// Пересчёт ждёт паузы в движении ползунка. 250 мс — граница, за которой
// пауза уже читается как «врач остановился», но отклик ещё мгновенный.
const REVALIDATE_DELAY_MS = 250;

const STATUS_LABEL = {
  within_norm: "в норме",
  below_norm: "ниже нормы",
  above_norm: "выше нормы",
  unknown: "—",
};

const DIRECTION_SIGN = { increase: "↑", decrease: "↓", mixed: "↕" };

const pickLabel = (label, lang) =>
  (label && (label[lang] || label.ru || label.en)) || "";

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// Значение по умолчанию для операции, добавленной врачом руками:
// ноль там, где он допустим («ничего не меняем»), иначе ближайшая
// к нулю граница. Так добавленная операция не двигает профиль,
// пока врач сам не выставит величину.
function defaultParams(operation) {
  const params = {};
  for (const [name, spec] of Object.entries(operation.params)) {
    if (spec.type === "enum") {
      params[name] = spec.options[0];
    } else {
      const step = spec.step || 0.5;
      const raw = clamp(0, spec.min, spec.max);
      params[name] = Number((Math.round(raw / step) * step).toFixed(3));
    }
  }
  return params;
}

const formatDelta = (value) =>
  value == null ? "—" : value > 0 ? `+${value}` : String(value);

/* ══════════════════════════════════════════════════════════════
   Карточка операции с ползунками
   ══════════════════════════════════════════════════════════════ */
function OperationCard({ operation, spec, lang, onChange, onRemove }) {
  if (!spec) {
    return (
      <div className={`${styles.opCard} ${styles.opCardUnknown}`}>
        <div className={styles.opHead}>
          <span className={styles.opTitle}>{operation.code}</span>
          <button type="button" className={styles.iconBtn} onClick={onRemove}>
            Убрать
          </button>
        </div>
        <p className={styles.opNote}>Операции нет в текущем каталоге.</p>
      </div>
    );
  }

  return (
    <div className={styles.opCard}>
      <div className={styles.opHead}>
        <span className={styles.opTitle}>{pickLabel(spec.label, lang)}</span>

        {/* Различие «названо врачом» и «выведено системой» — то, ради чего
            план вообще показывается, а не применяется молча. */}
        <span
          className={
            operation.source === "explicit"
              ? `${styles.badge} ${styles.badgeExplicit}`
              : `${styles.badge} ${styles.badgeInferred}`
          }
          title={
            operation.source === "explicit"
              ? "Величину назвал врач"
              : "Величина выведена из формулировки"
          }
        >
          {operation.source === "explicit" ? "точно" : "выведено"}
          {" · "}
          {Math.round((operation.confidence ?? 0) * 100)}%
        </span>

        <button type="button" className={styles.iconBtn} onClick={onRemove}>
          Убрать
        </button>
      </div>

      {Object.entries(spec.params).map(([name, paramSpec]) => {
        const value = operation.params?.[name];

        if (paramSpec.type === "enum") {
          return (
            <div key={name} className={styles.param}>
              <div className={styles.paramLabel}>
                {pickLabel(paramSpec.label, lang)}
              </div>
              <div className={styles.segmented}>
                {paramSpec.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={
                      value === option
                        ? `${styles.segment} ${styles.segmentActive}`
                        : styles.segment
                    }
                    onClick={() => onChange(name, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={name} className={styles.param}>
            <div className={styles.paramLabel}>
              <span>{pickLabel(paramSpec.label, lang)}</span>
              <output className={styles.paramValue}>
                {value ?? "—"} {paramSpec.unit}
              </output>
            </div>

            <input
              type="range"
              className={styles.slider}
              min={paramSpec.min}
              max={paramSpec.max}
              // Шаг задаёт каталог, а не вёрстка: гранулярность здесь
              // клиническая — миллиметр резекции не то же самое, что
              // градус ротации.
              step={paramSpec.step || 0.5}
              value={value ?? paramSpec.min}
              onChange={(e) => onChange(name, Number(e.target.value))}
              aria-label={pickLabel(paramSpec.label, lang)}
            />

            <div className={styles.paramScale}>
              <span>
                {paramSpec.min} {paramSpec.unit}
              </span>
              <span>
                {paramSpec.max} {paramSpec.unit}
              </span>
            </div>
          </div>
        );
      })}

      {operation.rationale ? (
        <p className={styles.opNote}>{operation.rationale}</p>
      ) : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Таблица «до / после»
   ══════════════════════════════════════════════════════════════ */
function DeltaTable({ rows }) {
  if (!rows.length) {
    return <p className={styles.muted}>Измерения не затронуты.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Измерение</th>
            <th>До</th>
            <th>После</th>
            <th>Δ</th>
            <th>Норма</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const outOfNorm =
              row.statusAfter === "above_norm" || row.statusAfter === "below_norm";

            return (
              <tr key={row.code}>
                <td>{row.label}</td>
                <td className={styles.num}>{row.before ?? "—"}</td>

                {/* Направленная строка — там, где число вывести неоткуда.
                    Коэффициент «мм резекции → градусы угла» зависит от
                    анатомии и техники; стрелка честнее выдуманной цифры. */}
                {row.kind === "directional" ? (
                  <td className={styles.num} colSpan={2}>
                    <span className={styles.direction}>
                      {DIRECTION_SIGN[row.direction] || "?"} направление
                    </span>
                  </td>
                ) : (
                  <>
                    <td className={styles.num}>{row.after ?? "—"}</td>
                    <td className={styles.num}>{formatDelta(row.delta)}</td>
                  </>
                )}

                <td className={outOfNorm ? styles.normBad : styles.normOk}>
                  {row.norm ? `${row.norm.min}–${row.norm.max}` : "—"}
                  {row.after != null ? (
                    <span className={styles.statusText}>
                      {" "}
                      {STATUS_LABEL[row.statusAfter] || ""}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Страница
   ══════════════════════════════════════════════════════════════ */
export default function SurgicalPlanPage() {
  const { i18n } = useTranslation();
  const lang = String(i18n?.language || "ru").slice(0, 2);

  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);

  const [gender, setGender] = useState("female");
  const [measurements, setMeasurements] = useState({});
  const [prompt, setPrompt] = useState("");

  const [plan, setPlan] = useState(null);
  const [validation, setValidation] = useState(null);
  const [meta, setMeta] = useState(null);

  const [parsing, setParsing] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  // Пересчёты обгоняют друг друга: врач ведёт ползунок, ответы приходят
  // не в том порядке, в каком ушли. Применяем только последний.
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetchCatalog(PROCEDURE)
      .then((data) => !cancelled && setCatalog(data))
      .catch((err) => !cancelled && setCatalogError(errorText(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const operationSpecs = useMemo(() => {
    const map = {};
    for (const op of catalog?.operations || []) map[op.code] = op;
    return map;
  }, [catalog]);

  // Числа для сервера: пустые поля не отправляем, иначе разбор решит,
  // что измерение равно нулю.
  const numericMeasurements = useMemo(() => {
    const out = {};
    for (const [code, raw] of Object.entries(measurements)) {
      const value = Number(raw);
      if (raw !== "" && Number.isFinite(value)) out[code] = value;
    }
    return Object.keys(out).length ? out : null;
  }, [measurements]);

  const revalidate = useCallback(
    (nextPlan, nextMeasurements, nextGender) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const id = ++requestIdRef.current;
        setRevalidating(true);
        try {
          const data = await validatePlan({
            procedureCode: PROCEDURE,
            plan: nextPlan,
            measurements: nextMeasurements,
            patientGender: nextGender,
          });
          if (id === requestIdRef.current) {
            setValidation(data.validation);
            setError(null);
          }
        } catch (err) {
          if (id === requestIdRef.current) setError(errorText(err));
        } finally {
          if (id === requestIdRef.current) setRevalidating(false);
        }
      }, REVALIDATE_DELAY_MS);
    },
    [],
  );

  const applyPlan = useCallback(
    (nextPlan) => {
      setPlan(nextPlan);
      revalidate(nextPlan, numericMeasurements, gender);
    },
    [revalidate, numericMeasurements, gender],
  );

  const handleParse = async () => {
    setParsing(true);
    setError(null);
    try {
      const data = await parsePlan({
        procedureCode: PROCEDURE,
        prompt,
        measurements: numericMeasurements,
        patientGender: gender,
      });
      setPlan(data.plan);
      setValidation(data.validation);
      setMeta(data.meta);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setParsing(false);
    }
  };

  const handleParamChange = (index, name, value) => {
    const operations = plan.operations.map((op, i) =>
      i === index ? { ...op, params: { ...op.params, [name]: value } } : op,
    );
    applyPlan({ ...plan, operations });
  };

  const handleRemove = (index) => {
    applyPlan({
      ...plan,
      operations: plan.operations.filter((_, i) => i !== index),
    });
  };

  const handleAdd = (code) => {
    const spec = operationSpecs[code];
    if (!spec) return;
    applyPlan({
      ...plan,
      operations: [
        ...plan.operations,
        {
          code,
          params: defaultParams(spec),
          rationale: "Добавлено врачом вручную",
          source: "explicit",
          confidence: 1,
        },
      ],
    });
  };

  const handleMeasurementChange = (code, raw) => {
    const next = { ...measurements, [code]: raw };
    setMeasurements(next);

    if (!plan) return;
    const numeric = {};
    for (const [key, value] of Object.entries(next)) {
      const parsed = Number(value);
      if (value !== "" && Number.isFinite(parsed)) numeric[key] = parsed;
    }
    revalidate(plan, Object.keys(numeric).length ? numeric : null, gender);
  };

  const handleGenderChange = (value) => {
    setGender(value);
    // Норма назолабиального угла у мужчин и женщин разная — смена пола
    // меняет вердикт по уже посчитанному плану.
    if (plan) revalidate(plan, numericMeasurements, value);
  };

  const usedCodes = new Set((plan?.operations || []).map((op) => op.code));
  const addable = (catalog?.operations || []).filter(
    (op) => !usedCodes.has(op.code),
  );

  const findings = validation?.findings || [];
  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const infos = findings.filter((f) => f.severity === "info");

  if (catalogError) {
    return (
      <div className={styles.page}>
        <div className={styles.alertError}>
          Не удалось загрузить каталог операций: {catalogError}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Моделирование · прототип</span>
        <h1 className={styles.title}>Запрос врача → план операции</h1>
        <p className={styles.lead}>
          Опишите желаемый результат обычными словами. Система разложит запрос
          по каталогу операций, посчитает измерения «до/после» и скажет, чего в
          запросе не хватило. Дальше план правится ползунками — величины
          остаются измеримыми и воспроизводимыми.
        </p>
      </header>

      <div className={styles.columns}>
        {/* ── Ввод ──────────────────────────────────────────── */}
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Исходные данные</h2>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="sp-procedure">
              Процедура
            </label>
            <select id="sp-procedure" className={styles.select} value={PROCEDURE} disabled>
              <option value={PROCEDURE}>
                {catalog ? pickLabel(catalog.procedure.label, lang) : "Загрузка…"}
              </option>
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Пол пациента</span>
            <div className={styles.segmented}>
              {GENDERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    gender === option.value
                      ? `${styles.segment} ${styles.segmentActive}`
                      : styles.segment
                  }
                  onClick={() => handleGenderChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>
              Измерения «до»{" "}
              <span className={styles.muted}>— необязательно</span>
            </span>
            <p className={styles.hint}>
              Без них план разберётся, но таблица покажет только дельты: чтобы
              назвать значение «после», нужно знать значение «до».
            </p>

            <div className={styles.measurements}>
              {(catalog?.measurements || []).map((m) => {
                const norm = m.normByGender?.[gender] || m.norm;
                return (
                  <label key={m.code} className={styles.measurement}>
                    <span className={styles.measurementLabel}>
                      {pickLabel(m.label, lang)}
                    </span>
                    <span className={styles.measurementInput}>
                      <input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        value={measurements[m.code] ?? ""}
                        onChange={(e) =>
                          handleMeasurementChange(m.code, e.target.value)
                        }
                        placeholder={norm ? `${norm.min}–${norm.max}` : ""}
                      />
                      <span className={styles.unit}>{m.unit}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="sp-prompt">
              Что нужно сделать
            </label>
            <textarea
              id="sp-prompt"
              className={styles.textarea}
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Например: убрать горбинку 2 мм и приподнять кончик на 5 градусов"
            />
          </div>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleParse}
            disabled={parsing || prompt.trim().length < 3}
          >
            {parsing ? "Разбираем…" : "Разобрать запрос"}
          </button>

          {error ? <div className={styles.alertError}>{error}</div> : null}
        </section>

        {/* ── План ──────────────────────────────────────────── */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>План</h2>
            {validation ? (
              <span
                className={
                  validation.ok
                    ? `${styles.verdict} ${styles.verdictOk}`
                    : `${styles.verdict} ${styles.verdictBad}`
                }
              >
                {validation.ok ? "план исполним" : "исполнять нельзя"}
              </span>
            ) : null}
            {revalidating ? (
              <span className={styles.muted}>пересчёт…</span>
            ) : null}
          </div>

          {!plan ? (
            <p className={styles.placeholder}>
              Плана пока нет. Опишите задачу слева и нажмите «Разобрать запрос».
            </p>
          ) : (
            <>
              <p className={styles.summary}>{plan.summary}</p>

              {plan.operations.length === 0 ? (
                <p className={styles.muted}>
                  Ни одной операции — исполнять нечего.
                </p>
              ) : (
                plan.operations.map((operation, index) => (
                  <OperationCard
                    key={`${operation.code}-${index}`}
                    operation={operation}
                    spec={operationSpecs[operation.code]}
                    lang={lang}
                    onChange={(name, value) =>
                      handleParamChange(index, name, value)
                    }
                    onRemove={() => handleRemove(index)}
                  />
                ))
              )}

              {addable.length ? (
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="sp-add">
                    Добавить операцию
                  </label>
                  <select
                    id="sp-add"
                    className={styles.select}
                    value=""
                    onChange={(e) => e.target.value && handleAdd(e.target.value)}
                  >
                    <option value="">— выберите —</option>
                    {addable.map((op) => (
                      <option key={op.code} value={op.code}>
                        {pickLabel(op.label, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {plan.clarifications.length ? (
                <div className={styles.block}>
                  <h3 className={styles.blockTitle}>Нужно уточнить</h3>
                  {plan.clarifications.map((item, i) => (
                    <div
                      key={i}
                      className={
                        item.blocking
                          ? `${styles.note} ${styles.noteBlocking}`
                          : styles.note
                      }
                    >
                      <strong>{item.question}</strong>
                      <span>{item.why}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {plan.outOfScope.length ? (
                <div className={styles.block}>
                  <h3 className={styles.blockTitle}>Вне каталога</h3>
                  {plan.outOfScope.map((item, i) => (
                    <div key={i} className={styles.note}>
                      <strong>{item.request}</strong>
                      <span>{item.reason}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {validation ? (
                <>
                  <div className={styles.block}>
                    <h3 className={styles.blockTitle}>Измерения</h3>
                    <DeltaTable rows={validation.measurements.rows} />
                  </div>

                  {findings.length ? (
                    <div className={styles.block}>
                      <h3 className={styles.blockTitle}>Замечания</h3>
                      {[...errors, ...warnings, ...infos].map((f, i) => (
                        <div
                          key={i}
                          className={`${styles.finding} ${
                            f.severity === "error"
                              ? styles.findingError
                              : f.severity === "warning"
                                ? styles.findingWarning
                                : styles.findingInfo
                          }`}
                        >
                          {f.message}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}

              {meta ? (
                <p className={styles.meta}>
                  Разбор: {meta.model}, каталог {meta.catalogVersion}
                  {meta.usage?.outputTokens
                    ? `, ${meta.usage.outputTokens} токенов ответа`
                    : ""}
                </p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
