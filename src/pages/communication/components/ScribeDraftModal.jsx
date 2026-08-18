// client/src/pages/communication/components/ScribeDraftModal.jsx
//
// Черновик приёма, собранный из разговора: врач правит и сохраняет.
//
// ПОЯВЛЯЕТСЯ СРАЗУ ПОСЛЕ ЗАПИСИ, а не ждёт, когда врач откроет карту.
// Пока приём в памяти, правки занимают минуту; через час — полчаса, а
// через день черновик станет чужим текстом, который проще переписать
// заново. Инструмент, экономящий время, обязан приходить вовремя.
//
// ─── ЧТО ЗДЕСЬ УСТРОЕНО НАМЕРЕННО ───────────────────────────────────
//
// ПОЛЯ РЕДАКТИРУЕМЫ ВСЕ. Черновик — предложение, а не результат.
// Сохраняется то, что осталось в полях после правки врача, а не то, что
// собрала модель.
//
// «НЕ ПРОЗВУЧАЛО» — ОТДЕЛЬНЫМ БЛОКОМ И СВЕРХУ. Это главное, что модель
// может сказать полезного: чего в разговоре не было. Врач не станет
// искать пропуск, о котором не знает, а список пропусков превращает
// черновик из «перечитай и поверь» в «допиши недостающее».
//
// РАСШИФРОВКА РЯДОМ, ПОД СПОЙЛЕРОМ. Черновик без первоисточника нечем
// проверить, а развёрнутая расшифровка забирает весь экран.
//
// ЗАКРЫТЬ БЕЗ СОХРАНЕНИЯ МОЖНО. Навязанный диалог, из которого нет
// выхода, кончается тем, что в карту попадает непроверенный текст.

import { useState } from "react";
import axios from "../../../axios";
import "./scribeDraftModal.css";

const FIELDS = [
  { key: "complaints", label: "Жалобы", rows: 3 },
  { key: "anamnesisMorbi", label: "Анамнез заболевания", rows: 3 },
  { key: "anamnesisVitae", label: "Анамнез жизни", rows: 2 },
  { key: "statusPreasens", label: "Объективный осмотр", rows: 3 },
  { key: "diagnosisText", label: "Диагноз", rows: 2 },
  { key: "recommendations", label: "Назначения и рекомендации", rows: 3 },
];

export default function ScribeDraftModal({ data, onClose }) {
  const [values, setValues] = useState(() => {
    const d = data?.draft || {};
    const out = {};
    for (const f of FIELDS) out[f.key] = d[f.key] || "";
    return out;
  });
  const [patientId, setPatientId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [saved, setSaved] = useState(false);

  const notHeard = data?.draft?.notHeard || [];
  const dialogue = data?.dialogue || [];

  async function save() {
    if (!patientId.trim()) {
      setNotice("Укажите карту пациента, в которую сохранить запись");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await axios.post(
        `/api/v1/clinic/medical/patients/${patientId.trim()}/from-scribe/${data.sessionId}`,
        values,
      );
      setSaved(true);
    } catch (err) {
      setNotice(err?.response?.data?.message ?? "Не удалось сохранить запись");
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    return (
      <div className="sdm-overlay" role="dialog" aria-modal="true">
        <div className="sdm">
          <h2>Черновик сохранён в карту</h2>
          <p className="sdm-lead">
            Запись создана черновиком — подпишите её в карте пациента, когда
            перечитаете.
          </p>
          <div className="sdm-actions">
            <button type="button" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sdm-overlay" role="dialog" aria-modal="true">
      <div className="sdm">
        <h2>Черновик приёма</h2>
        <p className="sdm-lead">
          Собран из разговора. Проверьте и поправьте — в карту попадёт то,
          что останется в полях. Запись сохранится черновиком, подпись —
          отдельным действием.
        </p>

        {/* Чего в разговоре не было — до полей, а не после: это то,
            что врачу предстоит дописать. */}
        {notHeard.length > 0 && (
          <div className="sdm-gaps">
            <strong>В разговоре не прозвучало:</strong>
            <ul>
              {notHeard.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="sdm-fields">
          {FIELDS.map((f) => (
            <label key={f.key} className="sdm-field">
              <span>{f.label}</span>
              <textarea
                rows={f.rows}
                value={values[f.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                placeholder="не прозвучало"
              />
            </label>
          ))}
        </div>

        {dialogue.length > 0 && (
          <details className="sdm-transcript">
            <summary>Расшифровка разговора ({dialogue.length} реплик)</summary>
            <ul>
              {dialogue.map((d, i) => (
                <li key={i} className={`sdm-line sdm-line--${d.speaker}`}>
                  <strong>{d.speaker === "doctor" ? "Врач" : "Пациент"}:</strong>{" "}
                  {d.text}
                </li>
              ))}
            </ul>
          </details>
        )}

        <label className="sdm-field sdm-field--patient">
          <span>Карта пациента (идентификатор)</span>
          <input
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="в какую карту сохранить"
          />
        </label>

        {notice && <p className="sdm-notice">{notice}</p>}

        <div className="sdm-actions">
          <button type="button" disabled={busy} onClick={save}>
            {busy ? "Сохраняем…" : "Сохранить в карту"}
          </button>
          {/* Выход без сохранения обязателен: навязанный диалог кончается
              тем, что в карту попадает непроверенный текст. */}
          <button type="button" className="ghost" onClick={onClose}>
            Закрыть без сохранения
          </button>
        </div>
      </div>
    </div>
  );
}
