// Вход в студию медицинских фильмов DP-Videra.
//
// ОДНА СТРАНИЦА НА ДВЕ ЗОНЫ. Врач и пациент видят одно и то же: фильм
// объясняет болезнь и вмешательство, и право снять его одинаковое. Разницу
// в тарифе студия читает из пропуска сама.
//
// ПРОПУСК ЗАКАЗЫВАЕТСЯ В МОМЕНТ НАЖАТИЯ, А НЕ ПРИ ОТКРЫТИИ СТРАНИЦЫ. Он
// живёт пять минут: заготовленный заранее протухнет, пока человек читает
// то, что написано ниже.
//
// СТУДИЯ ОТКРЫВАЕТСЯ В НОВОЙ ВКЛАДКЕ. Работа в ней длинная, и терять из-за
// неё кабинет незачем.

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuClapperboard, LuExternalLink } from "react-icons/lu";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

export default function VideraPage() {
  const { t } = useTranslation();
  const [готова, setГотова] = useState(null); // null — ещё не спросили
  const [идёт, setИдёт] = useState(false);
  const [беда, setБеда] = useState("");

  // Спрашиваем отдельно и заранее: если ключа на сервере нет, кнопка вела
  // бы в никуда. Лучше сказать об этом сразу, чем после нажатия.
  useEffect(() => {
    let живо = true;
    axios
      .get(`${API_BASE}/api/v1/videra/state`, { withCredentials: true })
      .then((о) => живо && setГотова(Boolean(о.data?.enabled)))
      .catch(() => живо && setГотова(false));
    return () => {
      живо = false;
    };
  }, []);

  const открыть = async () => {
    setИдёт(true);
    setБеда("");
    try {
      const о = await axios.get(`${API_BASE}/api/v1/videra/link`, {
        withCredentials: true,
      });
      // noopener — обязательно: открытая вкладка иначе получает доступ к
      // window.opener кабинета.
      window.open(о.data.url, "_blank", "noopener,noreferrer");
    } catch {
      setБеда(
        t("videra.failed", {
          defaultValue: "Не удалось открыть студию. Попробуйте ещё раз.",
        }),
      );
    } finally {
      setИдёт(false);
    }
  };

  return (
    <div style={{ padding: "24px 16px", maxWidth: 760 }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24 }}>
        <LuClapperboard />
        {t("videra.title", { defaultValue: "Студия медицинских фильмов" })}
      </h1>

      <p style={{ lineHeight: 1.6, marginTop: 16 }}>
        {t("videra.what", {
          defaultValue:
            "Соберите короткий объяснительный фильм: выберите, что показать — " +
            "кость, сосуд, орган или свою картинку, — задайте движение камеры и " +
            "текст. Студия сама озвучит его и соберёт видео.",
        })}
      </p>

      <p style={{ lineHeight: 1.6 }}>
        {t("videra.free", {
          defaultValue:
            "Первые три фильма — бесплатно, без ограничения по сроку.",
        })}
      </p>

      {готова === false && (
        <p style={{ color: "#c0392b", lineHeight: 1.6 }}>
          {t("videra.off", {
            defaultValue: "Студия сейчас недоступна. Мы уже знаем об этом.",
          })}
        </p>
      )}

      {беда && <p style={{ color: "#c0392b" }}>{беда}</p>}

      <button
        type="button"
        className="btn btn-primary"
        onClick={открыть}
        disabled={готова !== true || идёт}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8 }}
      >
        <LuExternalLink />
        {идёт
          ? t("videra.opening", { defaultValue: "Открываем…" })
          : t("videra.open", { defaultValue: "Снять фильм" })}
      </button>
    </div>
  );
}
