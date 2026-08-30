// client/src/pages/clinic/ClinicPatientDetailPage/DosingFields.jsx
//
// Поля дозирования рецепта: сила препарата, разовая доза, кратность,
// длительность.
//
// Раньше все четыре были свободным текстом с подсказкой вроде «1 таблетка».
// Врач писал их заново на каждом препарате, каждый по-своему — «1 таб.»,
// «1 табл», «одна таблетка», — и на бланке рядом оказывались три разные
// записи одного и того же. Аптека читает эти строки буквально.
//
// Здесь число вводится отдельно, а единица выбирается из списка. Список
// разовой дозы зависит от лекарственной формы: у спрея это впрыски, у
// капель — капли, у сиропа — миллилитры. Предлагать «таблетку» для мази
// значит предлагать ошибку.
//
// Итоговое значение остаётся строкой — модель и бланк ждут именно её, — но
// собирается из числа и единицы в правильной форме числа: «1 таблетка»,
// «2 таблетки», «5 таблеток». Поэтому подписи единиц идут через
// множественные формы i18next, а не склеиваются вручную.
//
// Свободный ввод сохранён: медицина шире любого списка. «Иное» открывает
// обычное поле, и старые рецепты со своими формулировками открываются в
// нём без потерь.

import React from "react";
import { useTranslation } from "react-i18next";

// Единицы силы препарата. Сокращения, а не слова: так пишут на упаковке и
// на бланке, и склонять их не нужно.
export const STRENGTH_UNITS = ["mg", "g", "mcg", "ml", "iu", "percent", "mg_ml"];

// Единицы разовой дозы по лекарственной форме.
const DOSE_UNITS_BY_FORM = {
  tablet: ["tablet", "piece"],
  capsule: ["capsule", "piece"],
  syrup: ["ml", "spoon"],
  solution: ["ml", "drop"],
  drops: ["drop", "ml"],
  spray: ["spray", "dose"],
  inhaler: ["inhalation", "dose"],
  injection: ["ml", "ampoule", "dose"],
  ointment: ["application", "g"],
  suppository: ["suppository", "piece"],
  powder: ["sachet", "dose"],
  other: ["dose", "piece", "ml"],
};

// Кратность приёма: готовые формулировки вместо свободного текста.
export const FREQUENCIES = [
  "qd", "bid", "tid", "qid",
  "q4h", "q6h", "q8h", "q12h",
  "qod", "qw", "prn", "once",
];

export const DURATION_UNITS = ["day", "week", "month"];

export function doseUnitsFor(form) {
  return DOSE_UNITS_BY_FORM[form] || DOSE_UNITS_BY_FORM.other;
}

// Разбор сохранённой строки на число и единицу.
//
// Нужен при правке: в модели лежит «500 мг», а показать надо «500» и
// выбранную единицу. Не разобралось — значит, строка написана вручную, и
// мы честно показываем её как свободный ввод, ничего не теряя.
export function parseAmount(value, unitKeys, labelOf) {
  const raw = String(value || "").trim();
  if (!raw) return { number: "", unit: unitKeys[0] || "", mode: "list" };

  const m = raw.match(/^([\d]+(?:[.,][\d]+)?)\s*(.*)$/);
  if (m) {
    const tail = m[2].trim();
    for (const key of unitKeys) {
      // Сравниваем со всеми формами числа: строка могла быть сохранена как
      // «2 таблетки», а ключ тот же, что и у «1 таблетка».
      for (const probe of [1, 2, 5]) {
        if (labelOf(key, probe) === tail) {
          return { number: m[1], unit: key, mode: "list" };
        }
      }
    }
  }
  return { number: "", unit: unitKeys[0] || "", mode: "free" };
}

/**
 * Число + единица. Наружу отдаёт готовую строку («7 дней»): именно её ждут
 * модель рецепта и генератор бланка.
 */
export function AmountField({
  label,
  value,
  onChange,
  unitKeys,
  unitPrefix,
  disabled,
  placeholder,
}) {
  const { t } = useTranslation("clinic");

  const labelOf = (key, count) =>
    t(`${unitPrefix}.${key}`, { count, defaultValue: key });

  const parsed = parseAmount(value, unitKeys, labelOf);
  const [mode, setMode] = React.useState(parsed.mode);
  // Число и единицу держим в состоянии: разбирать их из готовой строки на
  // каждом рендере нельзя — пока поле пустое, выбранная единица терялась бы.
  const [num, setNum] = React.useState(parsed.number);
  const [unit, setUnit] = React.useState(parsed.unit);

  const emit = (n, u) => {
    const clean = String(n).replace(",", ".").trim();
    if (!clean) return onChange("");
    const count = Number(clean);
    return onChange(`${clean} ${labelOf(u, Number.isFinite(count) ? count : 1)}`);
  };

  if (mode === "free") {
    return (
      <div className="patients-form-field">
        <label>{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="rx-unit-switch"
          onClick={() => {
            setMode("list");
            onChange("");
          }}
          disabled={disabled}
        >
          {t("medical.prescriptions.units.backToList", {
            defaultValue: "Выбрать из списка",
          })}
        </button>
      </div>
    );
  }

  return (
    <div className="patients-form-field">
      <label>{label}</label>
      <div className="rx-amount">
        <input
          type="number"
          min="0"
          step="any"
          className="rx-amount-num"
          value={num}
          onChange={(e) => {
            setNum(e.target.value);
            emit(e.target.value, unit);
          }}
          disabled={disabled}
          placeholder="0"
        />
        <select
          className="rx-amount-unit"
          value={unit}
          onChange={(e) => {
            if (e.target.value === "__free") {
              setMode("free");
              return;
            }
            setUnit(e.target.value);
            emit(num, e.target.value);
          }}
          disabled={disabled}
        >
          {unitKeys.map((key) => (
            <option key={key} value={key}>
              {/* Показываем форму для введённого числа: врач сразу видит,
                  что попадёт на бланк. */}
              {labelOf(key, Number(num) || 1)}
            </option>
          ))}
          <option value="__free">
            {t("medical.prescriptions.units.other", { defaultValue: "иное…" })}
          </option>
        </select>
      </div>
    </div>
  );
}

/**
 * Кратность приёма: готовые формулировки, а не свободный текст.
 */
export function FrequencyField({ label, value, onChange, disabled }) {
  const { t } = useTranslation("clinic");
  const labelOf = (key) =>
    t(`medical.prescriptions.freq.${key}`, { defaultValue: key });

  const known = FREQUENCIES.find(
    (k) => labelOf(k) === String(value || "").trim(),
  );
  const [mode, setMode] = React.useState(value && !known ? "free" : "list");

  if (mode === "free") {
    return (
      <div className="patients-form-field">
        <label>{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          className="rx-unit-switch"
          onClick={() => {
            setMode("list");
            onChange("");
          }}
          disabled={disabled}
        >
          {t("medical.prescriptions.units.backToList", {
            defaultValue: "Выбрать из списка",
          })}
        </button>
      </div>
    );
  }

  return (
    <div className="patients-form-field">
      <label>{label}</label>
      <select
        value={known || ""}
        onChange={(e) => {
          if (e.target.value === "__free") {
            setMode("free");
            onChange("");
            return;
          }
          onChange(e.target.value ? labelOf(e.target.value) : "");
        }}
        disabled={disabled}
      >
        <option value="">
          {t("medical.prescriptions.units.notSet", {
            defaultValue: "Не указано",
          })}
        </option>
        {FREQUENCIES.map((key) => (
          <option key={key} value={key}>
            {labelOf(key)}
          </option>
        ))}
        <option value="__free">
          {t("medical.prescriptions.units.other", { defaultValue: "иное…" })}
        </option>
      </select>
    </div>
  );
}
