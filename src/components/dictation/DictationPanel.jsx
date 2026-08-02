// client/src/components/dictation/DictationPanel.jsx
//
// Голосовая надиктовка приёма. Врач наговаривает осмотр, панель показывает
// расшифровку и разложенный по полям черновик, врач переносит его в форму.
//
// ГЛАВНОЕ РЕШЕНИЕ: панель НЕ создаёт запись в карте сама, хотя сервер это
// умеет (POST /jobs/:id/attach). Она заполняет поля обычной формы, и врач
// сохраняет их привычной кнопкой. Причина простая: страницы редактирования
// уже созданной истории болезни в myClinic нет, поэтому запись, созданная в
// обход формы, стала бы для врача неисправимой. Заодно сохраняются шаблоны,
// автокомплит МКБ-10 и загрузка снимка — всё, что живёт в форме.
//
// ВТОРОЕ РЕШЕНИЕ: перенос никогда не затирает уже написанное. «Вставить всё»
// заполняет только пустые поля и честно говорит, какие пропустило. Заменить
// непустое поле можно лишь отдельной кнопкой у этого поля — то есть осознанно.

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getDictationStatus,
  uploadDictation,
  getDictationJob,
  discardDictationJob,
  TERMINAL_STATUSES,
} from "../../api/dictation";

// Разделы черновика в порядке показа. Подписи берутся из общего словаря
// формы (medicalHistoryForm.labels) — там они уже переведены на все пять
// языков, и заводить второй набор значило бы дать им разойтись.
const ORDER = [
  "complaints",
  "anamnesisMorbi",
  "anamnesisVitae",
  "statusPreasens",
  "statusLocalis",
  "mainDiagnosisCode",
  "mainDiagnosisText",
  "recommendations",
  "ctScanResults",
  "mriResults",
  "ultrasoundResults",
  "laboratoryTestResults",
];

/** Запасные подписи — на случай, если словарь не догрузился. */
const FALLBACK_LABELS = {
  complaints: "Complaints",
  anamnesisMorbi: "Anamnesis morbi",
  anamnesisVitae: "Anamnesis vitae",
  statusPreasens: "Status praesens",
  statusLocalis: "Status localis",
  mainDiagnosisCode: "ICD-10",
  mainDiagnosisText: "Diagnosis",
  recommendations: "Recommendations",
  ctScanResults: "CT",
  mriResults: "MRI",
  ultrasoundResults: "Ultrasound",
  laboratoryTestResults: "Laboratory tests",
};

/** Опрос статуса. Чаще 2 с незачем: распознавание идёт десятки секунд. */
const POLL_MS = 2000;
// Предохранитель от забытой записи: браузер будет писать в память, пока
// вкладка открыта, и полуторачасовая «надиктовка» не распознается никогда.
const MAX_RECORD_SEC = 15 * 60;

const CSS = `
.dct-wrap{border:1px solid #e2e8f0;border-radius:14px;background:#fff;margin-bottom:22px;overflow:hidden}
.dct-head{display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(90deg,#f8fafc,#fff)}
.dct-title{font-weight:700;font-size:15px;color:#0f172a;margin:0}
.dct-sub{font-size:12.5px;color:#64748b;margin:2px 0 0}
.dct-spacer{flex:1}
.dct-btn{border:0;border-radius:10px;padding:9px 16px;font-size:13.5px;font-weight:600;cursor:pointer;transition:.15s}
.dct-btn:disabled{opacity:.55;cursor:not-allowed}
.dct-rec{background:#dc2626;color:#fff}
.dct-rec:hover:not(:disabled){background:#b91c1c}
.dct-stop{background:#0f172a;color:#fff}
.dct-ghost{background:#f1f5f9;color:#334155}
.dct-ghost:hover:not(:disabled){background:#e2e8f0}
.dct-primary{background:#2563eb;color:#fff}
.dct-primary:hover:not(:disabled){background:#1d4ed8}
.dct-dot{width:10px;height:10px;border-radius:50%;background:#dc2626;animation:dct-pulse 1s infinite}
@keyframes dct-pulse{0%,100%{opacity:1}50%{opacity:.25}}
.dct-timer{font-variant-numeric:tabular-nums;font-weight:700;color:#dc2626;font-size:14px}
.dct-body{padding:0 16px 16px}
.dct-note{font-size:13px;color:#475569;background:#f8fafc;border-radius:10px;padding:10px 12px}
.dct-err{font-size:13px;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px 12px}
.dct-transcript{font-size:13px;color:#334155;background:#f8fafc;border-radius:10px;padding:12px;white-space:pre-wrap;max-height:180px;overflow:auto;margin-bottom:14px}
.dct-row{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid #f1f5f9}
.dct-row-label{width:170px;flex:none;font-size:12.5px;font-weight:600;color:#475569;padding-top:3px}
.dct-row-text{flex:1;font-size:13px;color:#0f172a;white-space:pre-wrap}
.dct-row-btn{flex:none;border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;color:#334155}
.dct-row-btn:hover{background:#f1f5f9}
.dct-row-btn.taken{border-color:#bbf7d0;background:#f0fdf4;color:#15803d;cursor:default}
.dct-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.dct-skipped{font-size:12.5px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:9px 12px;margin-top:10px}
@media(max-width:640px){.dct-row{flex-wrap:wrap}.dct-row-label{width:100%}}
`;

const fmt = (sec) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

/** Формат записи, который поддерживает конкретный браузер. */
function pickMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4", // Safari, в том числе iOS
  ];
  if (typeof MediaRecorder === "undefined") return "";
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
}

/**
 * @param {object} props
 * @param {string} props.patientId
 * @param {(fields: object) => object} props.onApply
 *   Переносит поля в форму. Должен вернуть объект вида
 *   { applied: string[], skipped: string[], notes?: string[] } — какие поля
 *   принял, какие пропустил как непустые и что нужно сказать врачу.
 * @param {(field: string, value: string) => {applied: boolean, note?: string}}
 *   props.onApplyField
 *   Перенос одного поля с заменой — по отдельной кнопке. Пояснение и отказ
 *   разделены намеренно: подстановка кода МКБ-10 срабатывает и при этом
 *   требует пояснения, а текст диагноза без кода — наоборот, не срабатывает.
 */
export default function DictationPanel({ patientId, onApply, onApplyField }) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(null); // null — ещё не знаем
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [taken, setTaken] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [notes, setNotes] = useState([]);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const tickRef = useRef(null);
  const pollRef = useRef(null);
  const startedAtRef = useRef(0);
  // Отмена должна отличаться от обычной остановки уже внутри onstop.
  const cancelledRef = useRef(false);

  /* ── Готовность модуля ── */
  useEffect(() => {
    let alive = true;
    getDictationStatus()
      .then((s) => alive && setReady(Boolean(s?.ready)))
      // Модуль не поднят или маршрут не отвечает — просто не показываемся.
      .catch(() => alive && setReady(false));
    return () => {
      alive = false;
    };
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks?.().forEach((tr) => tr.stop());
    streamRef.current = null;
    clearInterval(tickRef.current);
    tickRef.current = null;
  }, []);

  /* ── Уборка при уходе со страницы: микрофон обязан погаснуть ── */
  useEffect(
    () => () => {
      clearInterval(pollRef.current);
      try {
        if (recorderRef.current?.state === "recording") {
          cancelledRef.current = true;
          recorderRef.current.stop();
        }
      } catch {
        /* уже остановлен */
      }
      stopTracks();
    },
    [stopTracks],
  );

  /* ── Опрос задания до готового черновика ── */
  const poll = useCallback((jobId) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const fresh = await getDictationJob(jobId);
        setJob(fresh);
        if (TERMINAL_STATUSES.includes(fresh.status)) {
          clearInterval(pollRef.current);
          if (fresh.status === "failed") {
            setError(fresh.lastError || "Не удалось обработать запись");
          }
        }
      } catch (err) {
        clearInterval(pollRef.current);
        setError(
          err?.response?.data?.message ||
            t("dictation.errConnection", "Потеряна связь с сервером"),
        );
      }
    }, POLL_MS);
  }, [t]);

  const send = useCallback(
    async (blob, durationSec) => {
      setBusy(true);
      setError("");
      try {
        const created = await uploadDictation(patientId, blob, { durationSec });
        setJob(created);
        poll(created.id);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            t(
              "dictation.errUpload",
              "Не удалось отправить запись. Проверьте связь и попробуйте ещё раз.",
            ),
        );
      } finally {
        setBusy(false);
      }
    },
    [patientId, poll, t],
  );

  const start = useCallback(async () => {
    setError("");
    setTaken([]);
    setSkipped([]);
    setNotes([]);
    setJob(null);
    cancelledRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const seconds = Math.round((Date.now() - startedAtRef.current) / 1000);
        stopTracks();
        setRecording(false);
        setElapsed(0);
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || mimeType || "audio/webm",
        });
        chunksRef.current = [];
        if (cancelledRef.current) return;
        if (seconds < 3 || blob.size < 2000) {
          setError(
            t(
              "dictation.errTooShort",
              "Запись слишком короткая — надиктуйте осмотр целиком.",
            ),
          );
          return;
        }
        send(blob, seconds);
      };

      recorderRef.current = rec;
      startedAtRef.current = Date.now();
      // Куски по секунде: при обрыве вкладки теряется секунда, а не всё.
      rec.start(1000);
      setRecording(true);
      setElapsed(0);
      tickRef.current = setInterval(() => {
        const sec = Math.round((Date.now() - startedAtRef.current) / 1000);
        setElapsed(sec);
        if (sec >= MAX_RECORD_SEC && recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      }, 1000);
    } catch (err) {
      stopTracks();
      setError(
        err?.name === "NotAllowedError"
          ? t(
              "dictation.errMicDenied",
              "Браузер не дал доступ к микрофону. Разрешите его в настройках сайта.",
            )
          : t(
              "dictation.errMicUnavailable",
              "Микрофон недоступен. Проверьте, что он подключён и не занят другой программой.",
            ),
      );
    }
  }, [send, stopTracks, t]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    stop();
  }, [stop]);

  /* ── Закрыть задание: аудио стирается сразу ── */
  const closeJob = useCallback(
    async (jobId) => {
      clearInterval(pollRef.current);
      try {
        await discardDictationJob(jobId);
      } catch {
        // Не смогли — не беда: ретеншн всё равно уберёт аудио по сроку.
      }
      setJob(null);
      setTaken([]);
      setSkipped([]);
      setNotes([]);
    },
    [],
  );

  if (ready === false || ready === null) return null;

  const draft = job?.draft ?? null;
  const filled = draft ? ORDER.filter((k) => (draft[k] ?? "").trim()) : [];
  const working =
    job && !TERMINAL_STATUSES.includes(job.status) ? job.status : null;

  const statusText = {
    uploaded: t("dictation.statusUploaded", "Запись принята, ждёт обработки…"),
    transcribing: t("dictation.statusTranscribing", "Распознаём речь…"),
    transcribed: t(
      "dictation.statusTranscribed",
      "Речь распознана, раскладываем по разделам…",
    ),
    structuring: t("dictation.statusStructuring", "Раскладываем по разделам…"),
  };

  // Подписи разделов берём из словаря самой формы, чтобы они не разъехались.
  const labelOf = (key) => {
    if (key === "mainDiagnosisCode") return t("dictation.icdCode", "МКБ-10");
    const formKey = key === "mainDiagnosisText" ? "diagnosis" : key;
    return t(
      `medicalHistoryForm.labels.${formKey}`,
      FALLBACK_LABELS[key] ?? key,
    );
  };

  const applyAll = () => {
    const fields = {};
    filled.forEach((k) => {
      fields[k] = draft[k];
    });
    const res = onApply?.(fields) ?? { applied: [], skipped: [] };
    setTaken(res.applied ?? []);
    setSkipped(res.skipped ?? []);
    setNotes(res.notes ?? []);
  };

  return (
    <div className="dct-wrap">
      <style>{CSS}</style>

      <div className="dct-head">
        <div>
          <p className="dct-title">
            🎙 {t("dictation.title", "Надиктовать приём")}
          </p>
          <p className="dct-sub">
            {recording
              ? t(
                  "dictation.subRecording",
                  "Идёт запись. Говорите так, как диктуете в карту.",
                )
              : t(
                  "dictation.subIdle",
                  "Расшифровка ляжет в поля формы — проверьте и сохраните как обычно.",
                )}
          </p>
        </div>
        <div className="dct-spacer" />

        {recording ? (
          <>
            <span className="dct-dot" />
            <span className="dct-timer">{fmt(elapsed)}</span>
            <button type="button" className="dct-btn dct-stop" onClick={stop}>
              {t("dictation.finish", "Готово")}
            </button>
            <button
              type="button"
              className="dct-btn dct-ghost"
              onClick={cancelRecording}
            >
              {t("dictation.cancel", "Отменить")}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="dct-btn dct-rec"
            onClick={start}
            disabled={busy || Boolean(working) || Boolean(draft)}
          >
            {busy
              ? t("dictation.sending", "Отправляем…")
              : t("dictation.record", "Записать")}
          </button>
        )}
      </div>

      <div className="dct-body">
        {error && <div className="dct-err">{error}</div>}

        {working && (
          <div className="dct-note">
            {statusText[working] ?? t("dictation.statusBusy", "Обрабатываем…")}{" "}
            {t(
              "dictation.keepWorking",
              "Можно продолжать заполнять форму — черновик появится здесь сам.",
            )}
          </div>
        )}

        {job?.status === "failed" && (
          <div className="dct-actions">
            <button
              type="button"
              className="dct-btn dct-ghost"
              onClick={() => closeJob(job.id)}
            >
              {t("dictation.retry", "Убрать и записать заново")}
            </button>
          </div>
        )}

        {draft && (
          <>
            {job.transcript && (
              <div className="dct-transcript">{job.transcript}</div>
            )}

            {filled.length === 0 ? (
              <div className="dct-note">
                {t(
                  "dictation.nothingFound",
                  "В записи не нашлось ничего, что можно разложить по разделам карты. Ничего не выдумываем — надиктуйте подробнее.",
                )}
              </div>
            ) : (
              filled.map((k) => (
                <div className="dct-row" key={k}>
                  <div className="dct-row-label">{labelOf(k)}</div>
                  <div className="dct-row-text">{draft[k]}</div>
                  <button
                    type="button"
                    className={`dct-row-btn${taken.includes(k) ? " taken" : ""}`}
                    onClick={() => {
                      const res = onApplyField?.(k, draft[k]) ?? { applied: true };
                      setNotes(res.note ? [res.note] : []);
                      if (!res.applied) return;
                      setTaken((prev) =>
                        prev.includes(k) ? prev : [...prev, k],
                      );
                      setSkipped((prev) => prev.filter((f) => f !== k));
                    }}
                  >
                    {taken.includes(k)
                      ? t("dictation.inForm", "✓ в форме")
                      : t("dictation.toField", "→ в поле")}
                  </button>
                </div>
              ))
            )}

            {skipped.length > 0 && (
              <div className="dct-skipped">
                {t("dictation.skipped", {
                  defaultValue:
                    "Не тронуты, потому что вы уже что-то написали: {{fields}}. Кнопка «→ в поле» рядом с разделом заменит текст.",
                  fields: skipped.map(labelOf).join(", "),
                })}
              </div>
            )}

            {notes.map((n) => (
              <div className="dct-skipped" key={n}>
                {n}
              </div>
            ))}

            <div className="dct-actions">
              {filled.length > 0 && (
                <button
                  type="button"
                  className="dct-btn dct-primary"
                  onClick={applyAll}
                >
                  {t("dictation.applyEmpty", "Перенести в пустые поля")}
                </button>
              )}
              <button
                type="button"
                className="dct-btn dct-ghost"
                onClick={() => closeJob(job.id)}
              >
                {t("dictation.close", "Готово, убрать запись")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
