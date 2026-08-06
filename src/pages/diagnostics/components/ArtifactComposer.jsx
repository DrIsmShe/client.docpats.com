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
import { useTranslation } from "react-i18next";
import { useModalityText } from "../useModalityText";

import { extractDocument } from "../../../api/diagnostics";
import { readApiError } from "../../../api/education";

function emptyRow() {
  return { key: "", name: "", value: "", unit: "", refLow: "", refHigh: "" };
}

export default function ArtifactComposer({ caseId, modalities, analytes, disabled, requireGates, onAdd }) {
  const { t } = useTranslation("diagnostics");
  // Справочник модальностей приходит с сервера по-русски (там он же служит
  // протоколом в промпте). Подписи для врача переводим здесь.
  const localizeModality = useModalityText();
  const fileRef = useRef(null);
  // Отдельный выбор файла для чтения снимка: у него другой accept (PDF сюда
  // не годится) и другое действие, поэтому переиспользовать один input нельзя.
  const imageRef = useRef(null);
  const [text, setText] = useState("");
  const [modality, setModality] = useState("clinical");
  const [panelOpen, setPanelOpen] = useState(false);
  const [rows, setRows] = useState([emptyRow()]);
  const [reading, setReading] = useState(false);
  // Какое именно чтение идёт — от этого зависит и надпись на кнопке, и то,
  // что показывать в результате.
  const [readingImage, setReadingImage] = useState(false);
  const [recognized, setRecognized] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const analyteByKey = useMemo(
    () => Object.fromEntries((analytes ?? []).map((a) => [a.key, a])),
    [analytes],
  );
  const rawActiveModality = modalities.find((m) => m.key === modality) ?? null;
  const activeModality = rawActiveModality ? localizeModality(rawActiveModality) : null;

  function setRow(i, patch) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function pickAnalyte(i, key) {
    const a = analyteByKey[key];
    // Название и единицу подставляем, референс — нет: он с конкретного бланка.
    setRow(i, { key, name: a ? a.label : "", unit: a ? a.unit : "" });
  }

  async function pickFile(file, { readImage = false } = {}) {
    if (!file || reading || disabled) return;
    // Файл уходит внешней модели — значит нужны те же подтверждения, что и для
    // разбора. Спрашиваем ЗДЕСЬ, а не отсылаем врача к кнопке «Разобрать»:
    // прикрепить документ до запуска разбора — естественный порядок работы.
    if (requireGates) return requireGates(() => runExtract(file, { readImage }));
    return runExtract(file, { readImage });
  }

  async function runExtract(file, { readImage = false } = {}) {
    setReading(true);
    setReadingImage(readImage);
    setError(null);
    setRecognized(null);
    try {
      // Модальность выбрана врачом в форме — отдаём её распознаванию, чтобы
      // осмотр снимка шёл по протоколу этого исследования, а не вообще.
      const res = await extractDocument(caseId, file, "", modality, { readImage });
      // Распознанное кладём в то же поле ввода: врач правит его здесь и
      // добавляет сам. Автоматически нельзя — ошибка в цифре меняет вывод.
      setText((prev) => (prev.trim() ? `${prev.trim()}\n\n${res.text}` : res.text));
      setRecognized(res);
    } catch (err) {
      setError(readApiError(err, t("recognizeFailed")));
    } finally {
      setReading(false);
      setReadingImage(false);
      if (fileRef.current) fileRef.current.value = "";
      if (imageRef.current) imageRef.current.value = "";
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
          name: r.name.trim() || r.key || `${t("analyteName")} ${idx + 1}`,
          value: String(r.value).trim(),
          unit: r.unit.trim() || undefined,
          refLow: r.refLow === "" ? null : Number(String(r.refLow).replace(",", ".")),
          refHigh: r.refHigh === "" ? null : Number(String(r.refHigh).replace(",", ".")),
        }));
      if (!items.length) {
        setError(t("fillOneAnalyte"));
        return;
      }
      payload = { kind: "lab_panel", modality: "labs", structured: { items } };
    } else {
      if (!text.trim()) {
        setError(t("addTextOrFile"));
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
      setError(err?.message ?? t("addFailed"));
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
            placeholder={t("addWhat")}
            maxLength={60000}
            disabled={disabled || reading}
          />

          {recognized && (
            <div className="dg-scan-result">
              <strong>
                {recognized.pages > 1
                  ? t("recognizedPages", { count: recognized.pages })
                  : t("recognized")}
              </strong>{" "}
              {t("checkNumbers")}
              {recognized.unreadable.length > 0 && (
                <div className="dg-artifact-note">
                  {t("unreadable", { list: recognized.unreadable.join("; ") })}
                </div>
              )}
              {/* Личные данные ВНУТРИ файла (теги DICOM) — принципиально
                  другой случай, чем видимые на картинке. Врач их не видит и
                  убрать из текста не может: старое «уберите их из текста»
                  здесь было невыполнимой инструкцией. Поэтому отдельный
                  текст и перечень полей — чтобы было понятно, что именно
                  лежит в файле и что с этим делать. */}
              {recognized.phiFields.length > 0 ? (
                <div className="dg-artifact-note dg-artifact-note--warn">
                  {t("identityInTags", {
                    // Ключи плоские, без точки: словари этого модуля плоские,
                    // а keySeparator у i18next по умолчанию — точка, и
                    // «phiField.patientName» он искал бы как вложенный объект.
                    list: recognized.phiFields
                      .map((f) => t(`phi_${f}`, { defaultValue: f }))
                      .join(", "),
                  })}
                </div>
              ) : (
                recognized.hasPatientIdentity && (
                  <div className="dg-artifact-note">{t("identityVisible")}</div>
                )
              )}

              {/* Прочитана выборка срезов, а не серия. Молчать об этом нельзя:
                  врач иначе решит, что модель посмотрела всё исследование. */}
              {recognized.dicom?.layout && (
                <div className="dg-artifact-note">
                  {t("dicomSampled", {
                    shown: recognized.dicom.layout.shown.length,
                    total: recognized.dicom.frames,
                  })}
                </div>
              )}

              {/* Границы осмотра снимка. Показываются ВСЕГДА, когда снимок
                  смотрели: описание увиденного без оговорок о том, чего по
                  одному кадру видно быть не может, читается как заключение —
                  а это ровно то, чем осмотр не является. */}
              {recognized.imageStudy && (
                <div className="dg-artifact-note dg-artifact-note--warn">
                  <strong>{t("imageRead")}</strong> {t("imageReadNote")}
                  {recognized.imageStudy.limits?.length > 0 && (
                    <ul className="dg-image-limits">
                      {recognized.imageStudy.limits.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  )}
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
                  aria-label={t("analyteName")}
                >
                  <option value="">{t("ownAnalyte")}</option>
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
                    placeholder={t("analyteName")}
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
                placeholder={t("value")}
                maxLength={60}
                disabled={disabled}
                aria-label={t("value")}
              />
              <input
                className="edu-input"
                style={{ width: 78 }}
                value={r.unit}
                onChange={(e) => setRow(i, { unit: e.target.value })}
                placeholder={t("unit")}
                maxLength={40}
                disabled={disabled}
                aria-label={t("unit")}
              />
              <input
                className="edu-input dg-nums"
                style={{ width: 76 }}
                value={r.refLow}
                onChange={(e) => setRow(i, { refLow: e.target.value })}
                placeholder={t("refFrom")}
                disabled={disabled}
                aria-label={t("refFrom")}
              />
              <input
                className="edu-input dg-nums"
                style={{ width: 62 }}
                value={r.refHigh}
                onChange={(e) => setRow(i, { refHigh: e.target.value })}
                placeholder={t("refTo")}
                disabled={disabled}
                aria-label={t("refTo")}
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
                aria-label={t("removeAnalyte")}
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
            {t("addAnalyte")}
          </button>

          <p className="dg-muted">
            {t("panelNote")}
            {unknownRows.length > 0 && ` ${t("unknownAnalytes", { count: unknownRows.length })}`}
          </p>
        </div>
      )}

      {error && <div className="dg-err" style={{ margin: "10px 0 0" }}>{error}</div>}

      {/* Действия одной строкой — то, что делают часто, и то, что изредка. */}
      <div className="dg-actions">
        <button className="edu-btn" type="submit" disabled={busy || disabled || reading}>
          {busy ? t("adding") : t("addToCase")}
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
              title={t("attachHint")}
            >
              {reading && !readingImage ? t("recognizing") : t("attachDocument")}
            </button>

            {/* Второе действие с тем же файлом: не «что напечатано», а «что
                видно». PDF здесь не принимается намеренно — на разбор уходит
                картинка, а не многостраничный документ. */}
            <input
              ref={imageRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/dicom,.dcm"
              style={{ display: "none" }}
              onChange={(e) => pickFile(e.target.files?.[0], { readImage: true })}
              disabled={disabled || reading}
            />
            <button
              type="button"
              className="dg-link-btn"
              onClick={() => imageRef.current?.click()}
              disabled={disabled || reading}
              title={t("readImageHint")}
            >
              {reading && readingImage ? t("readingImage") : t("readImage")}
            </button>
          </>
        )}

        <button
          type="button"
          className="dg-link-btn"
          onClick={() => setPanelOpen((v) => !v)}
          disabled={disabled}
        >
          {panelOpen ? t("backToText") : t("enterAsPanel")}
        </button>

        {!panelOpen && (
          <select
            className="edu-select dg-inline-select"
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            disabled={disabled}
            aria-label={t("analysis")}
          >
            {modalities.map((m) => (
              <option key={m.key} value={m.key}>
                {localizeModality(m).title}
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
