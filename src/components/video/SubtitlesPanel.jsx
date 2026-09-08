// client/src/components/video/SubtitlesPanel.jsx
//
// Субтитры для ролика: распознать речь и перевести на выбранные языки.
//
// ЯЗЫКИ ВЫБИРАЕТ АВТОР, А НЕ МЫ. Каждый перевод — отдельный вызов модели,
// то есть время и деньги; кнопка «на все языки» рядом есть, но нажимает её
// человек, понимая, что заказывает. Молча переводить на пять языков каждый
// загруженный ролик значило бы тратить чужой бюджет по умолчанию.
//
// ОЖИДАНИЕ ЧЕСТНОЕ. Распознавание идёт минуты, и вместо неподвижной кнопки
// здесь написано, что именно происходит: иначе человек нажмёт второй раз.
//
// ЧАСТИЧНЫЙ УСПЕХ ПОКАЗЫВАЕМ КАК ЧАСТИЧНЫЙ. Если два языка из четырёх не
// вышли, об этом сказано прямо — «готово» на половине работы хуже отказа.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { transcribeVideo } from "../../api/video";

const ЯЗЫКИ = [
  ["ru", "Русский"],
  ["en", "English"],
  ["az", "Azərbaycan"],
  ["tr", "Türkçe"],
  ["ar", "العربية"],
];

export default function SubtitlesPanel({ video, onDone }) {
  const { t } = useTranslation();
  const исходный = video.lang || "ru";

  const [выбраны, setВыбраны] = useState([]);
  const [идёт, setИдёт] = useState(false);
  const [итог, setИтог] = useState(null);
  const [беда, setБеда] = useState("");

  const естьДорожки = (video.locales || []).filter((л) => л.subtitleKey).length;

  const переключить = (код) =>
    setВыбраны((п) => (п.includes(код) ? п.filter((к) => к !== код) : [...п, код]));

  const запустить = async () => {
    setИдёт(true);
    setБеда("");
    setИтог(null);
    try {
      const ответ = await transcribeVideo(video._id, {
        lang: исходный,
        targets: выбраны,
      });
      setИтог(ответ);
      onDone?.();
    } catch (e) {
      setБеда(
        e?.response?.data?.message ||
          t("videra.subs.failed", {
            defaultValue: "Не удалось распознать речь в ролике",
          }),
      );
    } finally {
      setИдёт(false);
    }
  };

  return (
    <div style={стиль.блок}>
      <div style={стиль.заголовок}>
        {t("videra.subs.title", { defaultValue: "Субтитры из речи" })}
      </div>
      <div style={стиль.подпись}>
        {t("videra.subs.hint", {
          defaultValue:
            "Речь из ролика распознаётся в текст, из него собираются субтитры. Отметьте языки, на которые их перевести.",
        })}
      </div>

      {естьДорожки > 0 && (
        <div style={стиль.заметка}>
          {t("videra.subs.existing", {
            count: естьДорожки,
            defaultValue: "Уже есть дорожек: {{count}}. Повторный запуск их заменит.",
          })}
        </div>
      )}

      <div style={стиль.языки}>
        {ЯЗЫКИ.filter(([код]) => код !== исходный).map(([код, имя]) => (
          <label key={код} style={стиль.язык}>
            <input
              type="checkbox"
              checked={выбраны.includes(код)}
              onChange={() => переключить(код)}
              disabled={идёт}
            />
            <span>{имя}</span>
          </label>
        ))}

        <button
          type="button"
          onClick={() =>
            setВыбраны(
              выбраны.length ? [] : ЯЗЫКИ.map(([к]) => к).filter((к) => к !== исходный),
            )
          }
          disabled={идёт}
          style={стиль.ссылка}
        >
          {выбраны.length
            ? t("videra.subs.none", { defaultValue: "Снять все" })
            : t("videra.subs.all", { defaultValue: "Все языки" })}
        </button>
      </div>

      {беда && (
        <div role="alert" style={стиль.ошибка}>
          {беда}
        </div>
      )}

      {итог && (
        <div style={стиль.готово}>
          {t("videra.subs.done", {
            langs: (итог.langs || []).join(", ").toUpperCase(),
            defaultValue: "Готовы дорожки: {{langs}}",
          })}
          {итог.failed?.length > 0 && (
            <div style={стиль.частично}>
              {t("videra.subs.partial", {
                langs: итог.failed.join(", ").toUpperCase(),
                defaultValue: "Не получилось перевести: {{langs}}. Можно повторить.",
              })}
            </div>
          )}
        </div>
      )}

      <button type="button" onClick={запустить} disabled={идёт} style={стиль.кнопка}>
        {идёт
          ? t("videra.subs.working", {
              defaultValue: "Распознаём речь — это занимает минуты…",
            })
          : t("videra.subs.start", { defaultValue: "Сделать субтитры" })}
      </button>
    </div>
  );
}

const стиль = {
  блок: {
    border: "1px dashed #d6dddb",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  заголовок: { fontWeight: 700, fontSize: 14 },
  подпись: { fontSize: 12, color: "#6b7b78", lineHeight: 1.5 },
  заметка: { fontSize: 12, color: "#0e8478" },
  языки: { display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" },
  язык: { display: "flex", gap: 6, alignItems: "center", fontSize: 13, cursor: "pointer" },
  ссылка: {
    border: "none",
    background: "none",
    color: "#0e8478",
    font: "inherit",
    fontSize: 12,
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
  },
  кнопка: {
    alignSelf: "flex-start",
    border: "1px solid #0e8478",
    background: "#0e8478",
    color: "#fff",
    borderRadius: 8,
    padding: "8px 16px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  ошибка: {
    padding: 10,
    borderRadius: 8,
    background: "rgba(163,44,34,.08)",
    color: "#a32c22",
    fontSize: 13,
  },
  готово: { fontSize: 13, color: "#0e8478" },
  частично: { fontSize: 12, color: "#a06000", marginTop: 4 },
};
