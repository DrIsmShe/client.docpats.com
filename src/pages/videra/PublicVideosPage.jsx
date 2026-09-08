// client/src/pages/videra/PublicVideosPage.jsx
//
// Витрина роликов — публичная лента. Работает без входа.
//
// ЧЕМ ОТЛИЧАЕТСЯ ОТ DP-TUBE В СТУДИИ. Та витрина живёт на стороне студии и
// показывает её примеры. Эта — наш каталог: сюда попадает то, что клиника
// или врач осознанно опубликовали, и отсюда ведут адреса в sitemap.
//
// ЧТО ЗДЕСЬ СОЗНАТЕЛЬНО СКУПО. Ни комментариев, ни подписок, ни лайков:
// соревноваться с YouTube в социальном слое бессмысленно. Ценность ленты —
// в том, что каждый ролик ведёт к врачу, который его снял.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchPublicVideos } from "../../api/video";

const R2 = process.env.REACT_APP_R2_PUBLIC_URL || "";

/** Секунды → «1:05». Длительность на превью — то, по чему выбирают. */
function длительностью(сек) {
  const s = Math.max(0, Math.round(сек || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function PublicVideosPage() {
  const { t } = useTranslation();
  const [ролики, setРолики] = useState(null);
  const [беда, setБеда] = useState("");

  useEffect(() => {
    let живо = true;
    fetchPublicVideos({ limit: 48 })
      .then((r) => живо && setРолики(r))
      .catch(() => {
        if (!живо) return;
        setБеда(
          t("videra.gallery.failed", { defaultValue: "Не удалось загрузить ленту" }),
        );
        setРолики([]);
      });
    return () => {
      живо = false;
    };
  }, [t]);

  if (ролики === null) {
    return (
      <div style={стиль.пусто}>
        {t("videra.gallery.loading", { defaultValue: "Загружаем…" })}
      </div>
    );
  }

  return (
    <div style={стиль.страница}>
      <h1 style={стиль.заголовок}>
        {t("videra.gallery.title", { defaultValue: "Медицинские ролики" })}
      </h1>
      <p style={стиль.подзаголовок}>
        {t("videra.gallery.subtitle", {
          defaultValue:
            "Короткие разъяснительные фильмы, снятые врачами и клиниками DocPats.",
        })}
      </p>

      {беда && <div style={стиль.пусто}>{беда}</div>}

      {!беда && ролики.length === 0 && (
        <div style={стиль.пусто}>
          {t("videra.gallery.empty", { defaultValue: "Пока ничего не опубликовано." })}
        </div>
      )}

      <div style={стиль.сетка}>
        {ролики.map((р) => (
          <Link key={р._id} to={`/videos/${р._id}`} style={стиль.карточка}>
            <div style={стиль.превьюОбёртка}>
              {р.media?.posterKey && R2 ? (
                <img
                  src={`${R2}/${р.media.posterKey}`}
                  alt=""
                  loading="lazy"
                  style={стиль.превью}
                />
              ) : (
                <div style={стиль.превьюПусто} />
              )}
              {р.media?.durationSec > 0 && (
                <span style={стиль.длительность}>
                  {длительностью(р.media.durationSec)}
                </span>
              )}
            </div>
            <div style={стиль.название}>{р.title}</div>
            {р.description && <div style={стиль.описание}>{р.description}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}

const стиль = {
  страница: { maxWidth: 1100, margin: "0 auto", padding: "24px 16px 64px" },
  заголовок: { fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-.02em" },
  подзаголовок: { margin: "6px 0 24px", color: "#6b7b78", fontSize: 14 },
  сетка: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 20,
  },
  карточка: { textDecoration: "none", color: "inherit", display: "block" },
  превьюОбёртка: {
    position: "relative",
    aspectRatio: "16 / 9",
    borderRadius: 10,
    overflow: "hidden",
    background: "#101a19",
  },
  превью: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  превьюПусто: { width: "100%", height: "100%", background: "#1b2625" },
  длительность: {
    position: "absolute",
    right: 8,
    bottom: 8,
    background: "rgba(0,0,0,.75)",
    color: "#fff",
    fontSize: 12,
    padding: "2px 6px",
    borderRadius: 4,
    fontVariantNumeric: "tabular-nums",
  },
  название: { fontWeight: 700, fontSize: 15, marginTop: 8, lineHeight: 1.35 },
  описание: {
    fontSize: 13,
    color: "#6b7b78",
    marginTop: 4,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  пусто: { padding: 60, textAlign: "center", color: "#6b7b78" },
};
