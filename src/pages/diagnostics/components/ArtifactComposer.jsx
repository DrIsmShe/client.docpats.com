// client/src/pages/diagnostics/components/ArtifactComposer.jsx
//
// Добавление материала в дело. ОДНО поле ввода вместо формы.
//
// Прошлая версия спрашивала четыре вещи до того, как врач напишет хоть слово:
// что добавляем, какое направление, текст, пометка. Плюс таблица показателей
// на виду. Формально всё было нужно — на деле это форма, которую заполняют
// вместо работы.
//
// Здесь одно поле и кнопка. Всё остальное убрано в две необязательные
// возможности: прикрепить файл (распознать) и ввести показателями. Обе нужны
// не всегда, поэтому и не показываются всегда.
//
// Направление (модальность) спрашивается ОДНИМ выпадающим списком рядом с
// кнопкой, а не отдельным блоком с подписью: чаще всего подходит значение по
// умолчанию, и заставлять выбирать его каждый раз — трата внимания.
//
// Панель показателей осталась ровно потому, зачем была: цифры сравнивает код,
// а не модель, и пороги критических значений работают по ключу показателя.
// Но теперь она открывается по требованию — тем, кому нужна точность, а не
// всем подряд.

import { useMemo, useRef, useState } from "react";

import { extractDocument } from "../../../api/diagnostics";
import { readApiError } from "../../../api/education";

function emptyRow() {
  return { key: "", name: "", value: "", unit: "", refLow: "", refHigh: "" };
}

export default function ArtifactComposer({ caseId, modalities, analytes, disabled, onAdd }) {
  const fileRef = useRef(null);
  const [text, setText] = useState("");
  const [modality, setModality] = useState("clinical");
  const [panelOpen, setPanelOpen] = useState(false);
  const [rows, setRows] = useState([emptyRow()]);
  const [reading, setReading] = useState(false);
  const [recognized, setRecognized] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const analyteByKey = useMemo(
    () => Object.fromEntries((analytes ?? []).map((a) => [a.key, a])),
    [analytes],
  );
  const activeModality = modalities.find((m) => m.key === modality) ?? null;

  function setRow(i, patch) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function pickAnalyte(i, key) {
    const a = analyteByKey[key];
    // Название и единицу подставляем, референс — нет: он с конкретного бланка.
    setRow(i, { key, name: a ? a.label : "", unit: a ? a.unit : "" });
  }

  async function pickFile(file) {
    if (!file || reading || disabled) return;
    setReading(true);
    setError(null);
    setRecognized(null);
    try {
      const res = await extractDocument(caseId, file);
      // Распознанное кладём в то же поле ввода: врач правит его здесь и
      // добавляет сам. Автоматически нельзя — ошибка в цифре меняет вывод.
      setText((prev) => (prev.trim() ? `${prev.trim()}\n\n${res.text}` : res.text));
      setRecognized(res);
    } catch (err) {
      setError(readApiError(err, "Не удалось распознать документ"));
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (busy || disabled) return;
    setError(null);

    let payload;
    if (panelOpen) {
      const items = rows
        .filter((r) => String(r.value).trim() !== "" && (r.key || r.name.trim()))
        .map((r, idx) => ({
          key: r.key || `custom${idx + 1}`,
          name: r.name.trim() || r.key || `Показатель ${idx + 1}`,
          value: String(r.value).trim(),
          unit: r.unit.trim() || undefined,
          refLow: r.refLow === "" ? null : Number(String(r.refLow).replace(",", ".")),
          refHigh: r.refHigh === "" ? null : Number(String(r.refHigh).replace(",", ".")),
        }));
      if (!items.length) {
        setError("Заполните хотя бы один показатель со значением");
        return;
      }
      payload = { kind: "lab_panel", modality: "labs", structured: { items } };
    } else {
      if (!text.trim()) {
        setError("Добавьте текст или прикрепите документ");
        return;
      }
      payload = {
        // Заключение или запись — различие для протокола разбора; определяем
        // по выбранному направлению, а не отдельным вопросом врачу.
        kind: modality === "clinical" ? "text" : "report",
        modality,
        text: text.trim(),
      };
    }

    setBusy(true);
    try {
      await onAdd(payload);
      setText("");
      setRows([emptyRow()]);
      setRecognized(null);
      setPanelOpen(false);
    } catch (err) {
      setError(err?.message ?? "Не удалось добавить материал");
    } finally {
      setBusy(false);
    }
  }

  const unknownRows = rows.filter((r) => !r.key && r.name.trim());

  return (
    <form onSubmit={submit}>
      {!panelOpen ? (
        <>
          <textarea
            className="edu-textarea"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Вставьте текст заключения или опишите случай. Можно прикрепить фото бланка — распознаем."
            maxLength={60000}
            disabled={disabled || reading}
          />

          {recognized && (
            <div className="dg-scan-result">
              <strong>Распознано{recognized.pages > 1 ? ` · ${recognized.pages} стр.` : ""}.</strong>{" "}
              Сверьте числа и единицы — считать будем по ним.
              {recognized.unreadable.length > 0 && (
                <div className="dg-artifact-note">
                  Не прочиталось: {recognized.unreadable.join("; ")} — впишите вручную.
                </div>
              )}
              {recognized.hasPatientIdentity && (
                <div className="dg-artifact-note">
                  Видны данные пациента — уберите их из текста.
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="dg-panel-rows">
          {rows.map((r, i) => (
            <div className="dg-row" key={i} style={{ gap: 6, alignItems: "flex-end" }}>
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
                    style={{ marginTop: 5 }}
                    value={r.name}
                    onChange={(e) => setRow(i, { name: e.target.value })}
                    placeholder="Название"
                    maxLength={160}
                    disabled={disabled}
                  />
                )}
              </div>
              <input
                className="edu-input dg-nums"
                style={{ width: 92 }}
                value={r.value}
                onChange={(e) => setRow(i, { value: e.target.value })}
                placeholder="значение"
                maxLength={60}
                disabled={disabled}
                aria-label="Значение"
              />
              <input
                className="edu-input"
                style={{ width: 78 }}
                value={r.unit}
                onChange={(e) => setRow(i, { unit: e.target.value })}
                placeholder="ед."
                maxLength={40}
                disabled={disabled}
                aria-label="Единица"
              />
              <input
                className="edu-input dg-nums"
                style={{ width: 76 }}
                value={r.refLow}
                onChange={(e) => setRow(i, { refLow: e.target.value })}
                placeholder="норма от"
                disabled={disabled}
                aria-label="Норма от"
              />
              <input
                className="edu-input dg-nums"
                style={{ width: 62 }}
                value={r.refHigh}
                onChange={(e) => setRow(i, { refHigh: e.target.value })}
                placeholder="до"
                disabled={disabled}
                aria-label="Норма до"
              />
              <button
                type="button"
                className="dg-icon-btn"
                onClick={() =>
                  setRows((prev) =>
                    prev.length === 1 ? [emptyRow()] : prev.filter((_, idx) => idx !== i),
                  )
                }
                disabled={disabled}
                aria-label="Убрать показатель"
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            className="dg-link-btn"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
            disabled={disabled}
          >
            + показатель
          </button>

          <p className="dg-muted">
            Норму переписывайте с бланка — у лабораторий она разная. Без неё сравнивать не с
            чем. Точкой ● отмечены показатели с порогом немедленных действий; свои показатели
            разбираются, но без порогов.
            {unknownRows.length > 0 && " Сейчас таких: " + unknownRows.length + "."}
          </p>
        </div>
      )}

      {error && <div className="dg-err" style={{ margin: "10px 0 0" }}>{error}</div>}

      {/* Действия одной строкой — то, что делают часто, и то, что изредка. */}
      <div className="dg-actions">
        <button className="edu-btn" type="submit" disabled={busy || disabled || reading}>
          {busy ? "Добавляем…" : "Добавить в дело"}
        </button>

        {!panelOpen && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => pickFile(e.target.files?.[0])}
              disabled={disabled || reading}
            />
            <button
              type="button"
              className="dg-link-btn"
              onClick={() => fileRef.current?.click()}
              disabled={disabled || reading}
              title="Фото бланка или PDF. Файл не сохраняется — в дело попадёт только текст."
            >
              {reading ? "Распознаём…" : "Прикрепить документ"}
            </button>
          </>
        )}

        <button
          type="button"
          className="dg-link-btn"
          onClick={() => setPanelOpen((v) => !v)}
          disabled={disabled}
        >
          {panelOpen ? "Вернуться к тексту" : "Ввести показателями"}
        </button>

        {!panelOpen && (
          <select
            className="edu-select dg-inline-select"
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            disabled={disabled}
            aria-label="Направление"
          >
            {modalities.map((m) => (
              <option key={m.key} value={m.key}>
                {m.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {activeModality?.binaryNote && !panelOpen && modality !== "clinical" && (
        <p className="dg-muted" style={{ marginTop: 8 }}>
          {activeModality.binaryNote}
        </p>
      )}
    </form>
  );
}
