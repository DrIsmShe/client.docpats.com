// client/src/pages/diagnostics/components/ArtifactComposer.jsx
//
// Добавление материала в дело: текст/заключение или лабораторная панель.
//
// Панель вводится ПОКАЗАТЕЛЯМИ, а не сплошным текстом, потому что на сервере
// цифры считает код, а не модель: сравнение с референсом и пороги критических
// значений должны быть воспроизводимыми. Текстом можно тоже — тогда разбор
// пойдёт по словам, и врачу это сказано прямо, а не умолчано.
//
// Референсы вводит врач с бланка и не обязан их знать наизусть: лаборатории
// отличаются, и подставлять «общепринятые» интервалы вместо напечатанных —
// прямой путь к неверному выводу. Без референса показатель помечается
// неинтерпретируемым, а не сравнивается с выдуманной нормой.

import { useMemo, useState } from "react";

const KINDS = [
  {
    key: "text",
    label: "Запись врача",
    hint: "Анамнез, жалобы, ваши наблюдения — всё, что не является готовым документом.",
  },
  {
    key: "report",
    label: "Текст заключения",
    hint: "Расшифровка КТ/МРТ/УЗИ/ЭКГ. Разбирается по протоколу выбранного направления.",
  },
  {
    key: "lab_panel",
    label: "Лабораторная панель",
    hint: "Показателями — тогда сравнение с референсом и пороги считает код, а не модель.",
  },
];

function emptyRow() {
  return { key: "", name: "", value: "", unit: "", refLow: "", refHigh: "" };
}

export default function ArtifactComposer({ modalities, analytes, disabled, onAdd }) {
  const [kind, setKind] = useState("text");
  const [modality, setModality] = useState("clinical");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState([emptyRow()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const analyteByKey = useMemo(
    () => Object.fromEntries((analytes ?? []).map((a) => [a.key, a])),
    [analytes],
  );

  const kindInfo = KINDS.find((k) => k.key === kind);
  const activeModality = modalities.find((m) => m.key === modality) ?? null;

  function setRow(i, patch) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function pickAnalyte(i, key) {
    const a = analyteByKey[key];
    // Подставляем название и единицу выбранного показателя, но НЕ референс:
    // он берётся с конкретного бланка, а не из головы интерфейса.
    setRow(i, {
      key,
      name: a ? a.label : "",
      unit: a ? a.unit : "",
    });
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(i) {
    setRows((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((_, idx) => idx !== i)));
  }

  function buildPayload() {
    if (kind === "lab_panel") {
      const items = rows
        .filter((r) => String(r.value).trim() !== "" && (r.key || r.name.trim()))
        .map((r, idx) => ({
          // Ключ из справочника, если выбран. Свой показатель получает
          // технический ключ: он попадёт в разбор, но без порогов и связок.
          key: r.key || `custom${idx + 1}`,
          name: r.name.trim() || r.key || `Показатель ${idx + 1}`,
          value: String(r.value).trim(),
          unit: r.unit.trim() || undefined,
          refLow: r.refLow === "" ? null : Number(String(r.refLow).replace(",", ".")),
          refHigh: r.refHigh === "" ? null : Number(String(r.refHigh).replace(",", ".")),
        }));
      if (!items.length) throw new Error("Заполните хотя бы один показатель со значением");
      return {
        kind: "lab_panel",
        modality: "labs",
        structured: { items },
        note: note.trim() || undefined,
      };
    }

    if (!text.trim()) throw new Error("Текст пуст");
    return {
      kind,
      modality: modality || undefined,
      text: text.trim(),
      note: note.trim() || undefined,
    };
  }

  async function submit(e) {
    e.preventDefault();
    if (busy || disabled) return;
    setError(null);
    let payload;
    try {
      payload = buildPayload();
    } catch (err) {
      setError(err.message);
      return;
    }
    setBusy(true);
    try {
      await onAdd(payload);
      setText("");
      setNote("");
      setRows([emptyRow()]);
    } catch (err) {
      setError(err?.message ?? "Не удалось добавить материал");
    } finally {
      setBusy(false);
    }
  }

  const unknownRows = rows.filter((r) => !r.key && r.name.trim());

  return (
    <form className="dg-stack" onSubmit={submit}>
      <div>
        <span className="dg-label">Что добавляем</span>
        <div className="dg-verdict-btns">
          {KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              className={`dg-vbtn ${kind === k.key ? "dg-vbtn--on" : ""}`}
              onClick={() => setKind(k.key)}
              disabled={disabled}
            >
              {k.label}
            </button>
          ))}
        </div>
        <p className="dg-muted" style={{ marginTop: 7 }}>
          {kindInfo?.hint}
        </p>
      </div>

      {kind !== "lab_panel" && (
        <div>
          <span className="dg-label">Направление</span>
          <select
            className="edu-select"
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            disabled={disabled}
          >
            {modalities.map((m) => (
              <option key={m.key} value={m.key}>
                {m.title}
              </option>
            ))}
          </select>
          {activeModality?.binaryNote && (
            <p className="dg-artifact-note">{activeModality.binaryNote}</p>
          )}
        </div>
      )}

      {kind === "lab_panel" ? (
        <div>
          <span className="dg-label">Показатели</span>
          <div className="dg-stack" style={{ gap: 7 }}>
            {rows.map((r, i) => (
              <div className="dg-row" key={i} style={{ gap: 7, alignItems: "flex-end" }}>
                <div className="dg-grow">
                  <select
                    className="edu-select"
                    value={r.key}
                    onChange={(e) => pickAnalyte(i, e.target.value)}
                    disabled={disabled}
                    aria-label="Показатель"
                  >
                    <option value="">— свой показатель —</option>
                    {(analytes ?? []).map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.label}
                        {a.critical ? " ●" : ""}
                      </option>
                    ))}
                  </select>
                  {!r.key && (
                    <input
                      className="edu-input"
                      style={{ marginTop: 6 }}
                      value={r.name}
                      onChange={(e) => setRow(i, { name: e.target.value })}
                      placeholder="Название показателя"
                      maxLength={160}
                      disabled={disabled}
                    />
                  )}
                </div>
                <input
                  className="edu-input dg-nums"
                  style={{ width: 100 }}
                  value={r.value}
                  onChange={(e) => setRow(i, { value: e.target.value })}
                  placeholder="значение"
                  maxLength={60}
                  disabled={disabled}
                  aria-label="Значение"
                />
                <input
                  className="edu-input"
                  style={{ width: 90 }}
                  value={r.unit}
                  onChange={(e) => setRow(i, { unit: e.target.value })}
                  placeholder="ед."
                  maxLength={40}
                  disabled={disabled}
                  aria-label="Единица измерения"
                />
                <input
                  className="edu-input dg-nums"
                  style={{ width: 84 }}
                  value={r.refLow}
                  onChange={(e) => setRow(i, { refLow: e.target.value })}
                  placeholder="норма от"
                  disabled={disabled}
                  aria-label="Референс, нижняя граница"
                />
                <input
                  className="edu-input dg-nums"
                  style={{ width: 84 }}
                  value={r.refHigh}
                  onChange={(e) => setRow(i, { refHigh: e.target.value })}
                  placeholder="до"
                  disabled={disabled}
                  aria-label="Референс, верхняя граница"
                />
                <button
                  type="button"
                  className="edu-btn edu-btn--ghost"
                  onClick={() => removeRow(i)}
                  disabled={disabled}
                  aria-label="Убрать показатель"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="dg-row" style={{ marginTop: 9 }}>
            <button
              type="button"
              className="edu-btn edu-btn--ghost"
              onClick={addRow}
              disabled={disabled}
            >
              + показатель
            </button>
          </div>

          <p className="dg-muted" style={{ marginTop: 9 }}>
            Референс переписывайте с бланка: у лабораторий он разный. Без референса показатель
            попадёт в разбор, но сравнивать его будет не с чем — норму сервер не выдумывает.
            Точкой ● отмечены показатели, у которых есть порог немедленных действий.
          </p>
          {unknownRows.length > 0 && (
            <p className="dg-artifact-note">
              Показатели не из списка ({unknownRows.map((r) => r.name).join(", ")}) будут разобраны
              относительно вашего референса, но пороги критических значений и связки к ним не
              применяются — сервер их не узнаёт.
            </p>
          )}
        </div>
      ) : (
        <div>
          <span className="dg-label">
            {kind === "report" ? "Текст заключения" : "Запись"}
          </span>
          <textarea
            className="edu-textarea"
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              kind === "report"
                ? "Вставьте текст заключения целиком, включая описание, а не только вывод: расхождение между описанием и выводом — частая и дорогая ошибка, и разбор её ищет."
                : "Анамнез, жалобы, динамика, что уже исключено."
            }
            maxLength={60000}
            disabled={disabled}
          />
        </div>
      )}

      <div>
        <span className="dg-label">Пометка к материалу (необязательно)</span>
        <input
          className="edu-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Например: снимок от 12.03, до лечения"
          maxLength={2000}
          disabled={disabled}
        />
      </div>

      {error && <div className="dg-err" style={{ marginBottom: 0 }}>{error}</div>}

      <div>
        <button className="edu-btn" type="submit" disabled={busy || disabled}>
          {busy ? "Добавляем…" : "Добавить в дело"}
        </button>
      </div>
    </form>
  );
}
