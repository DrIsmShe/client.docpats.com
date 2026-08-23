// client/src/components/shared/DoctorTrainingStats.jsx
//
// Учебная активность врача на профиле: сколько учебных снимков разобрал,
// сколько вопросов прошёл, с какой точностью.
//
// Сигнал, которого нет ни у одного конкурента, — просто потому, что не у
// всех есть встроенный тренажёр. Но именно поэтому его легко испортить
// неверной подачей.
//
// ЧТО ЗДЕСЬ СДЕЛАНО НАМЕРЕННО:
//
//   — блок не рисуется вовсе, если сервер вернул null. Врач не включал
//     показ, активности нет или это не врач — во всех трёх случаях
//     пустая рамка со словом «нет данных» выглядела бы как упрёк;
//   — подпись берётся с сервера, а не пишется здесь. Это утверждение о
//     человеке, и оно не должно зависеть от экрана;
//   — слово «квалификация» не употребляется. Врач, разобравший двести
//     учебных снимков, — это врач, который регулярно тренируется, а не
//     лучший рентгенолог города. Подменять одно другим значит вводить в
//     заблуждение пациента, который выбирает по этой цифре.

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "./doctorTrainingStats.css";

const API_BASE = process.env.REACT_APP_API_URL;

export default function DoctorTrainingStats({ userId }) {
  const { t } = useTranslation("common");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    axios
      .get(`${API_BASE}/api/v1/public/doctors/${userId}/competence`)
      .then((r) => alive && setData(r.data?.competence || null))
      // Молча: отсутствие блока — не ошибка страницы.
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [userId]);

  if (!data) return null;

  const { radiology, exam } = data;

  return (
    <section className="dts-card">
      <h4 className="dts-title">{t("training.regular")}</h4>

      <div className="dts-grid">
        {radiology.cases > 0 && (
          <div className="dts-item">
            <span className="dts-value">{radiology.cases}</span>
            <span className="dts-label">{t("training.imagesReviewed")}</span>
            {radiology.accuracy !== null && (
              <span className="dts-extra">
                {t("training.avgScoreWord")} {radiology.accuracy} %
              </span>
            )}
          </div>
        )}

        {exam.answered > 0 && (
          <div className="dts-item">
            <span className="dts-value">{exam.answered}</span>
            <span className="dts-label">{t("training.examQuestions")}</span>
            {exam.accuracy !== null && (
              <span className="dts-extra">{t("training.correctWord")} {exam.accuracy} %</span>
            )}
          </div>
        )}
      </div>

      <p className="dts-caption">{data.caption}</p>
    </section>
  );
}
