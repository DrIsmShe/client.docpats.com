// client/src/pages/videra/PublicVideoPage.jsx
//
// Публичная страница ролика — то, что открывает человек из поиска или по
// ссылке из Telegram-канала. Работает без входа.
//
// ЗАЧЕМ ОТДЕЛЬНАЯ СТРАНИЦА, А НЕ ССЫЛКА НА ФАЙЛ. В sitemap уходит адрес
// именно этой страницы: файл в R2 раздаётся подписанной ссылкой, которая
// живёт минуты, и поисковик по ней ничего не получит. Плюс лицензия — её
// строка обязана быть на странице, а не только в кадре.
//
// РАЗМЕТКА VideoObject СТАВИТСЯ ЗДЕСЬ ЖЕ. Edge-функция Netlify подставляет
// метатеги для статей и новостей; для роликов её правило пока не написано,
// а без разметки видео не попадает в видео-блок выдачи — ровно то, ради
// чего вся эта часть и делается.

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchPublicVideo, fetchPublicPlayback } from "../../api/video";

/** Лицензии, требующие указания автора, — их подпись обязана быть видна. */
const ЛИЦЕНЗИИ = {
  "CC0": "CC0",
  "CC-BY-4.0": "CC BY 4.0",
  "CC-BY-SA-4.0": "CC BY-SA 4.0",
  "CC-BY-NC-4.0": "CC BY-NC 4.0",
  proprietary: "",
};

export default function PublicVideoPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [ролик, setРолик] = useState(null);
  const [показ, setПоказ] = useState(null);
  const [беда, setБеда] = useState("");

  useEffect(() => {
    let живо = true;
    setБеда("");
    Promise.all([fetchPublicVideo(id), fetchPublicPlayback(id)])
      .then(([в, п]) => {
        if (!живо) return;
        setРолик(в);
        setПоказ(п);
      })
      .catch(() => {
        if (живо) setБеда(t("videra.public.gone", { defaultValue: "Ролик недоступен" }));
      });
    return () => {
      живо = false;
    };
  }, [id, t]);

  // Заголовок вкладки и разметка для поисковика. Ставятся вручную: общего
  // механизма метатегов на клиенте нет, а edge-функция про ролики не знает.
  useEffect(() => {
    if (!ролик) return;
    const прежний = document.title;
    document.title = `${ролик.title} · DocPats`;

    const узел = document.createElement("script");
    узел.type = "application/ld+json";
    узел.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: ролик.title,
      description: ролик.description || ролик.title,
      uploadDate: ролик.publishedAt,
      duration: ролик.media?.durationSec
        ? `PT${Math.round(ролик.media.durationSec)}S`
        : undefined,
      thumbnailUrl: показ?.poster || undefined,
      inLanguage: ролик.lang,
    });
    document.head.appendChild(узел);

    return () => {
      document.title = прежний;
      узел.remove();
    };
  }, [ролик, показ]);

  if (беда) {
    return <div style={стиль.пусто}>{беда}</div>;
  }
  if (!ролик || !показ) {
    return (
      <div style={стиль.пусто}>
        {t("videra.public.loading", { defaultValue: "Загружаем…" })}
      </div>
    );
  }

  return (
    <div style={стиль.страница}>
      <video
        src={показ.url}
        poster={показ.poster || undefined}
        controls
        playsInline
        preload="metadata"
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

      <h1 style={стиль.заголовок}>{ролик.title}</h1>
      {ролик.description && <p style={стиль.описание}>{ролик.description}</p>}

      <div style={стиль.мета}>
        {ролик.media?.durationSec > 0 && (
          <span>
            {t("videra.public.seconds", {
              count: Math.round(ролик.media.durationSec),
              defaultValue: "{{count}} с",
            })}
          </span>
        )}
        {ролик.stats?.views > 0 && (
          <span>
            {t("videra.public.views", {
              count: ролик.stats.views,
              defaultValue: "{{count}} просмотров",
            })}
          </span>
        )}
      </div>

      {/* Атрибуция обязательна по условиям лицензий CC — и должна быть
          читаемой, а не спрятанной под водяным знаком. */}
      {(ролик.attribution || []).length > 0 && (
        <div style={стиль.лицензии}>
          <div style={стиль.лицензииЗаголовок}>
            {t("videra.public.sources", { defaultValue: "Использованные материалы" })}
          </div>
          {ролик.attribution.map((а, i) => (
            <div key={i} style={стиль.лицензия}>
              {а.url ? (
                <a href={а.url} target="_blank" rel="noreferrer noopener">
                  {а.title}
                </a>
              ) : (
                а.title
              )}
              {а.author ? ` — ${а.author}` : ""}
              {ЛИЦЕНЗИИ[а.license] ? ` · ${ЛИЦЕНЗИИ[а.license]}` : ""}
            </div>
          ))}
        </div>
      )}

      <div style={стиль.низ}>
        <Link to="/videos" style={стиль.ссылка}>
          {t("videra.public.more", { defaultValue: "Другие ролики" })}
        </Link>
      </div>
    </div>
  );
}

const стиль = {
  страница: { maxWidth: 860, margin: "0 auto", padding: "24px 16px 64px" },
  видео: { width: "100%", borderRadius: 12, background: "#000", display: "block" },
  заголовок: { fontSize: 24, fontWeight: 800, margin: "16px 0 8px", letterSpacing: "-.02em" },
  описание: { margin: "0 0 12px", color: "#3b4b49", lineHeight: 1.6 },
  мета: { display: "flex", gap: 12, color: "#6b7b78", fontSize: 13, flexWrap: "wrap" },
  лицензии: {
    marginTop: 20,
    padding: 14,
    border: "1px solid #d6dddb",
    borderRadius: 10,
    fontSize: 13,
    color: "#6b7b78",
  },
  лицензииЗаголовок: { fontWeight: 700, marginBottom: 6, color: "#3b4b49" },
  лицензия: { lineHeight: 1.6, wordBreak: "break-word" },
  низ: { marginTop: 24 },
  ссылка: { color: "#0e8478", fontWeight: 600, textDecoration: "none" },
  пусто: { padding: 60, textAlign: "center", color: "#6b7b78" },
};
