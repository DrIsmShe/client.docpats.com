// client/src/components/video/IntroVideo.jsx
//
// Видео-визитка врача на публичной карточке.
//
// НИЧЕГО НЕ РИСУЕТ, ЕСЛИ ВИЗИТКИ НЕТ. Карточка врача без ролика должна
// выглядеть ровно так же, как до появления этой возможности: пустая рамка
// с надписью «видео не добавлено» — это укор врачу на глазах у пациента.
//
// РОЛИК ЗАГРУЖАЕТСЯ ПО ПУБЛИЧНОЙ ССЫЛКЕ, а не через кабинетный маршрут:
// карточку смотрит человек с улицы, сессии у него нет.

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchPublicPlayback } from "../../api/video";

export default function IntroVideo({ videoId }) {
  const { t } = useTranslation();
  const [показ, setПоказ] = useState(null);

  useEffect(() => {
    let живо = true;
    if (!videoId) {
      setПоказ(null);
      return undefined;
    }
    fetchPublicPlayback(videoId)
      .then((п) => живо && setПоказ(п))
      // Молча: визитка — украшение карточки, а не её содержание.
      .catch(() => живо && setПоказ(null));
    return () => {
      живо = false;
    };
  }, [videoId]);

  if (!videoId || !показ) return null;

  return (
    <div style={стиль.блок}>
      <div style={стиль.подпись}>
        {t("videra.intro.title", { defaultValue: "Видео-визитка" })}
      </div>
      <video
        src={показ.url}
        poster={показ.poster || undefined}
        controls
        playsInline
        preload="none"
        style={стиль.видео}
      >
        {(показ.subtitles || []).map((д) => (
          <track
            key={д.lang}
            kind="subtitles"
            src={д.url}
            srcLang={д.lang}
            label={д.lang.toUpperCase()}
          />
        ))}
      </video>
    </div>
  );
}

const стиль = {
  блок: { marginTop: 16, maxWidth: 520 },
  подпись: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".1em",
    color: "#6b7b78",
    marginBottom: 8,
  },
  видео: { width: "100%", borderRadius: 10, background: "#000", display: "block" },
};
