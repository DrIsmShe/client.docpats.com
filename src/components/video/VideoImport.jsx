// client/src/components/video/VideoImport.jsx
//
// Перенос фильма из студии DP-Videra в каталог платформы.
//
// ЗАЧЕМ ЭТА ФОРМА СУЩЕСТВУЕТ. Студия пока не сообщает платформе о снятых
// фильмах, и автор оказывается в тупике: фильм снят, но показать его
// пациенту, приложить к приёму или опубликовать нельзя. Ссылка из адресной
// строки студии — самый короткий путь оттуда сюда, пока нет вебхука.
//
// ДЛИТЕЛЬНОСТЬ ИЗМЕРЯЕМ ЗДЕСЬ ЖЕ. Сервер её узнать не может (ffprobe нет),
// а без неё не работает ни досмотр, ни согласие. Браузер читает метаданные
// по прямому адресу файла студии — тому же, что открывает её плеер.

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { importFromStudio, fetchPublishableCategories } from "../../api/video";

const СТУДИЯ = "https://docpats.com/dp-videra";

/** Идентификатор фильма из ссылки или из голого кода. */
function разобрать(строка) {
  const текст = String(строка || "").trim();
  const изСсылки = текст.match(/\/dp-videra\/film\/([A-Za-z0-9_-]{6,64})/);
  if (изСсылки) return изСсылки[1];
  return /^[A-Za-z0-9_-]{6,64}$/.test(текст) ? текст : null;
}

/** Длительность файла студии — по её же публичному адресу. */
function длительность(filmId) {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => resolve(Math.round(v.duration) || 0);
    v.onerror = () => resolve(0);
    v.src = `${СТУДИЯ}/film/${filmId}/video`;
    setTimeout(() => resolve(0), 15000);
  });
}

export default function VideoImport({ onDone, начальнаяСсылка = "" }) {
  const { t, i18n } = useTranslation();
  const [ссылка, setСсылка] = useState(начальнаяСсылка);
  const [название, setНазвание] = useState("");
  const [прогресс, setПрогресс] = useState(null); // {готово, всего}
  const [описание, setОписание] = useState("");
  const [раздел, setРаздел] = useState("");
  const [разделы, setРазделы] = useState([]);
  const [идёт, setИдёт] = useState(false);
  const [беда, setБеда] = useState("");

  useEffect(() => {
    let живо = true;
    fetchPublishableCategories(i18n.language)
      .then((о) => живо && setРазделы(о.items))
      .catch(() => живо && setРазделы([]));
    return () => {
      живо = false;
    };
  }, [i18n.language]);

  const перенести = async () => {
    // Ссылок может быть несколько — по одной в строке. Автоматически
    // получить список фильмов из студии нельзя: её API отвечает отказом
    // без собственного ключа, а он нам не принадлежит.
    const строки = ссылка
      .split(/[\s,]+/)
      .map((с) => с.trim())
      .filter(Boolean);
    const фильмы = строки.map(разобрать).filter(Boolean);

    if (!фильмы.length) {
      setБеда(
        t("videra.import.badLink", {
          defaultValue: "Вставьте адрес страницы фильма из студии",
        }),
      );
      return;
    }
    // Название нужно только для одиночного переноса: у пачки оно берётся
    // из идентификатора, а переименовать можно прямо в списке.
    if (фильмы.length === 1 && !название.trim()) return;

    setИдёт(true);
    setБеда("");
    const беды = [];

    for (let i = 0; i < фильмы.length; i += 1) {
      const filmId = фильмы[i];
      setПрогресс({ готово: i, всего: фильмы.length });
      try {
        // Длительность меряем до отправки: сервер её взять неоткуда, а без
        // неё не считается ни досмотр, ни согласие.
        const сек = await длительность(filmId);
        await importFromStudio({
          source: filmId,
          title:
            фильмы.length === 1
              ? название.trim()
              : t("videra.import.autoName", {
                  id: filmId.slice(0, 8),
                  defaultValue: "Фильм {{id}}",
                }),
          description: фильмы.length === 1 ? описание.trim() : "",
          categoryId: раздел || undefined,
          durationSec: сек,
        });
      } catch (e) {
        // Один неудавшийся фильм не должен отменять остальные: чаще всего
        // это «уже перенесён», и останавливать из-за него пачку незачем.
        беды.push(e?.response?.data?.message || filmId);
      }
    }

    setПрогресс(null);
    setИдёт(false);
    if (беды.length) {
      setБеда(
        t("videra.import.partly", {
          count: беды.length,
          list: беды.slice(0, 3).join("; "),
          defaultValue: "Не перенесено: {{count}} ({{list}})",
        }),
      );
    } else {
      setСсылка("");
      setНазвание("");
      setОписание("");
    }
    onDone?.();
  };

  return (
    <div style={стиль.блок}>
      <div style={стиль.заголовок}>
        {t("videra.import.title", { defaultValue: "Перенести фильм из студии" })}
      </div>
      <div style={стиль.подпись}>
        {t("videra.import.hint2", {
          defaultValue:
            "Откройте фильм в студии и скопируйте адрес страницы — файл переедет в каталог, и его можно будет показать пациенту и опубликовать. Ссылок можно вставить несколько, по одной в строке.",
        })}
      </div>

      <textarea
        value={ссылка}
        onChange={(e) => setСсылка(e.target.value)}
        placeholder={`${СТУДИЯ}/film/…`}
        rows={2}
        style={стиль.поле}
        disabled={идёт}
      />
      <input
        value={название}
        onChange={(e) => setНазвание(e.target.value)}
        placeholder={t("videra.import.name", { defaultValue: "Название" })}
        style={стиль.поле}
        disabled={идёт}
      />
      <textarea
        value={описание}
        onChange={(e) => setОписание(e.target.value)}
        placeholder={t("videra.import.about", { defaultValue: "О чём фильм" })}
        rows={2}
        style={стиль.поле}
        disabled={идёт}
      />

      {/* Раздел витрины. «Без раздела» — не ошибка: ролик просто попадёт в
          общую ленту, а полку ему можно выбрать позже. */}
      <select
        value={раздел}
        onChange={(e) => setРаздел(e.target.value)}
        style={стиль.поле}
        disabled={идёт}
      >
        <option value="">
          {t("videra.import.noCategory", { defaultValue: "Без раздела" })}
        </option>
        {разделы.map((к) => (
          <option key={к._id} value={к._id}>
            {к.title}
          </option>
        ))}
      </select>

      {прогресс && (
        <div style={стиль.подпись}>
          {t("videra.import.progress", {
            done: прогресс.готово,
            total: прогресс.всего,
            defaultValue: "Переносим {{done}} из {{total}}…",
          })}
        </div>
      )}

      {беда && (
        <div role="alert" style={стиль.ошибка}>
          {беда}
        </div>
      )}

      <button
        type="button"
        onClick={перенести}
        disabled={идёт || !ссылка.trim() || !название.trim()}
        style={стиль.кнопка}
      >
        {идёт
          ? t("videra.import.working", { defaultValue: "Переносим…" })
          : t("videra.import.go", { defaultValue: "Перенести" })}
      </button>
    </div>
  );
}

const стиль = {
  блок: {
    border: "1px dashed #d6dddb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  заголовок: { fontWeight: 700, fontSize: 15 },
  подпись: { fontSize: 12, color: "#6b7b78", lineHeight: 1.5 },
  поле: {
    border: "1px solid #d6dddb",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 13,
    font: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  кнопка: {
    alignSelf: "flex-start",
    border: "1px solid #0e8478",
    background: "#0e8478",
    color: "#fff",
    borderRadius: 8,
    padding: "8px 16px",
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
};
