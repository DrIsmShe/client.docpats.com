// client/src/components/shared/TrainingVisibilityToggle.jsx
//
// Переключатель «показывать мою учебную активность на профиле».
//
// По умолчанию ВЫКЛЮЧЕНО, и это главное в этом компоненте.
// Автоматическая публикация точности наказывает того, кто тренируется и
// ошибается, — то есть ровно того, ради кого тренажёр сделан. Врач,
// увидевший невысокий процент на публичном профиле, перестанет
// тренироваться.
//
// Поэтому здесь же, рядом с переключателем, врач видит СВОИ цифры —
// именно те, которые увидят пациенты. Решение «показывать или нет»
// принимается со знанием того, что будет показано, а не вслепую.

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "../../axios";
import "./doctorTrainingStats.css";

export default function TrainingVisibilityToggle() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: res } = await axios.get("/api/me/competence");
      setData(res.competence || null);
      setEnabled(res.competence?.enabled === true);
    } catch {
      /* блок необязательный — молчим */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(next) {
    setBusy(true);
    setSaved(false);
    try {
      await axios.put("/api/me/competence", { enabled: next });
      setEnabled(next);
      setSaved(true);
    } catch {
      /* оставляем прежнее состояние переключателя */
    } finally {
      setBusy(false);
    }
  }

  // Активности нет — переключать нечего, и предлагать показать пустоту
  // незачем.
  if (!data) return null;

  return (
    <div className="tvt">
      <label className="tvt-row">
        <input
          type="checkbox"
          checked={enabled}
          disabled={busy}
          onChange={(e) => toggle(e.target.checked)}
        />
        <span>{t("training.toggleLabel")}</span>
      </label>

      {/* Ровно то, что увидят пациенты. Решение принимается со знанием
          того, что будет показано. */}
      <div className="tvt-preview">
        {data.radiology.cases > 0 && (
          <span>
            {t("training.casesReviewed")} <b>{data.radiology.cases}</b>
            {data.radiology.accuracy !== null &&
              t("training.avgScore", { value: data.radiology.accuracy })}
          </span>
        )}
        {data.exam.answered > 0 && (
          <span>
            {t("training.questionsAnswered")} <b>{data.exam.answered}</b>
            {data.exam.accuracy !== null &&
              t("training.correct", { value: data.exam.accuracy })}
          </span>
        )}
        {data.radiology.accuracy === null && data.radiology.cases > 0 && (
          <span className="tvt-hint">
            {t("training.accuracyHint")}
          </span>
        )}
      </div>

      {saved && <span className="tvt-saved">{t("training.saved")}</span>}
    </div>
  );
}
