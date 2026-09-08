// client/src/components/video/VideoPlayer.jsx
//
// Плеер каталога DocPats. Один компонент на все зоны — кабинет пациента,
// кабинет врача, зона клиники, публичная витрина: ролик везде один и тот же,
// а кто его вправе смотреть, решает сервер.
//
// ССЫЛКА БЕРЁТСЯ ПРИ ОТКРЫТИИ И ЖИВЁТ МИНУТЫ. Поэтому: не запрашиваем
// заранее, обновляем при ошибке загрузки (истёкшая подпись выглядит как
// обычная ошибка медиа) и не кэшируем в родителе.
//
// ПРОГРЕСС ДОКЛАДЫВАЕТСЯ ОДИН РАЗ ЗА СЕАНС — на паузе, в конце и при уходе
// со страницы. Слать каждую секунду значило бы писать в append-only журнал
// сотни строк на один просмотр: журнал нельзя чистить, и он раздулся бы
// быстрее всего остального в системе.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchPlayback, reportWatch } from "../../api/video";

/** Секунды → «м:сс». */
function времяСтрокой(сек) {
  const s = Math.max(0, Math.round(сек || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const СКОРОСТИ = [0.75, 1, 1.25, 1.5, 2];

export default function VideoPlayer({ videoId, autoPlay = false, onCompleted }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [данные, setДанные] = useState(null);
  const [беда, setБеда] = useState("");
  const [скорость, setСкорость] = useState(1);

  // Максимум просмотренного за сеанс. Именно максимум, а не текущая позиция:
  // отмотав назад после просмотра, человек не «разсмотрел» ролик обратно.
  const максимум = useRef(0);
  const доложено = useRef(false);

  const загрузить = useCallback(async () => {
    setБеда("");
    try {
      setДанные(await fetchPlayback(videoId));
    } catch (e) {
      const код = e?.response?.status;
      setБеда(
        код === 404
          ? t("videra.player.gone", { defaultValue: "Ролик недоступен" })
          : код === 400
            ? t("videra.player.notReady", {
                defaultValue: "Ролик ещё готовится — загляните позже",
              })
            : t("videra.player.openFailed", {
                defaultValue: "Не удалось открыть ролик",
              }),
      );
    }
  }, [videoId, t]);

  useEffect(() => {
    максимум.current = 0;
    доложено.current = false;
    загрузить();
  }, [загрузить]);

  /** Доклад о просмотре. Идемпотентен в пределах сеанса. */
  const доложить = useCallback(() => {
    if (доложено.current || максимум.current <= 0) return;
    доложено.current = true;
    reportWatch(videoId, максимум.current, данные?.durationSec);
  }, [videoId, данные]);

  // Уход со страницы — самый частый конец просмотра, и единственный, о
  // котором компонент узнаёт только из события браузера.
  useEffect(() => {
    const наУход = () => доложить();
    window.addEventListener("pagehide", наУход);
    return () => {
      window.removeEventListener("pagehide", наУход);
      доложить();
    };
  }, [доложить]);

  const наВремя = (e) => {
    максимум.current = Math.max(максимум.current, e.target.currentTime || 0);
  };

  const наКонец = () => {
    максимум.current = данные?.durationSec || максимум.current;
    доложить();
    onCompleted?.();
  };

  // Истёкшая подпись приходит как обычная ошибка загрузки медиа. Пробуем
  // обновить ссылку один раз — второй раз это уже не срок, а поломка.
  const наОшибку = () => {
    if (доложено.current) return;
    if (ref.current?.dataset.retried === "1") {
      setБеда(
        t("videra.player.loadFailed", { defaultValue: "Не удалось загрузить видео" }),
      );
      return;
    }
    if (ref.current) ref.current.dataset.retried = "1";
    загрузить();
  };

  // ── HLS ────────────────────────────────────────────────────────
  //
  // Нарезку нативно играет только Safari; остальным нужен hls.js. Он
  // подключается ДИНАМИЧЕСКИМ импортом: библиотека весит около 400 КБ, и
  // тащить её в общий бандл ради роликов, которые открывают не все и не
  // всегда, значит замедлить весь кабинет.
  useEffect(() => {
    const узел = ref.current;
    if (!узел || данные?.kind !== "hls" || !данные.url) return undefined;

    // Safari и iOS играют манифест сами — там библиотека только помешает.
    if (узел.canPlayType("application/vnd.apple.mpegurl")) {
      узел.src = данные.url;
      return undefined;
    }

    let hls = null;
    let отменено = false;
    import("hls.js")
      .then(({ default: Hls }) => {
        if (отменено || !Hls.isSupported()) return;
        hls = new Hls({ enableWorker: true });
        hls.loadSource(данные.url);
        hls.attachMedia(узел);
      })
      .catch((err) => console.warn("[video] hls.js не загрузился:", err?.message));

    return () => {
      отменено = true;
      if (hls) hls.destroy();
    };
  }, [данные]);

  const сменитьСкорость = (v) => {
    setСкорость(v);
    if (ref.current) ref.current.playbackRate = v;
  };

  if (беда) {
    return (
      <div className="dp-video-error" role="alert" style={стиль.ошибка}>
        {беда}{" "}
        <button type="button" onClick={загрузить} style={стиль.кнопкаСсылка}>
          {t("videra.player.retry", { defaultValue: "Повторить" })}
        </button>
      </div>
    );
  }

  if (!данные)
    return (
      <div style={стиль.загрузка}>
        {t("videra.player.loading", { defaultValue: "Загружаем ролик…" })}
      </div>
    );

  return (
    <div style={стиль.обёртка}>
      <video
        ref={ref}
        // При HLS источник ставит библиотека (или Safari сам) — атрибут
        // src здесь заставил бы браузер параллельно тянуть манифест как
        // обычный файл и падать с ошибкой формата.
        src={данные.kind === "hls" ? undefined : данные.url}
        poster={данные.poster || undefined}
        controls
        playsInline
        preload="metadata"
        autoPlay={autoPlay}
        onTimeUpdate={наВремя}
        onPause={доложить}
        onEnded={наКонец}
        onError={наОшибку}
        style={стиль.видео}
      >
        {(данные.subtitles || []).map((д) => (
          <track
            key={д.lang}
            kind="subtitles"
            src={д.url}
            srcLang={д.lang}
            label={д.lang.toUpperCase()}
          />
        ))}
      </video>

      {(данные.chapters || []).length > 1 && (
        <div style={стиль.главы}>
          {данные.chapters.map((г) => (
            <button
              key={г.startSec}
              type="button"
              onClick={() => {
                if (ref.current) ref.current.currentTime = г.startSec;
              }}
              style={стиль.глава}
            >
              <span style={стиль.главаВремя}>{времяСтрокой(г.startSec)}</span>
              {г.title}
            </button>
          ))}
        </div>
      )}

      <div style={стиль.панель}>
        <span style={стиль.длительность}>{времяСтрокой(данные.durationSec)}</span>
        <span style={стиль.скорость}>
          {t("videra.player.speed", { defaultValue: "Скорость:" })}{" "}
          {СКОРОСТИ.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => сменитьСкорость(v)}
              style={{
                ...стиль.кнопкаСкорости,
                ...(скорость === v ? стиль.кнопкаСкоростиАктивная : null),
              }}
            >
              {v}×
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}

// Стили держим в файле, а не в глобальном CSS: плеер вставляется в зоны с
// разными темами и своим Bootstrap, и глобальные классы там сталкиваются.
const стиль = {
  обёртка: { width: "100%", maxWidth: 900, margin: "0 auto" },
  видео: {
    width: "100%",
    borderRadius: 12,
    background: "#000",
    display: "block",
  },
  панель: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
    fontSize: 13,
    color: "#6b7b78",
    flexWrap: "wrap",
  },
  длительность: { fontVariantNumeric: "tabular-nums" },
  скорость: { display: "flex", alignItems: "center", gap: 6 },
  кнопкаСкорости: {
    border: "1px solid #d6dddb",
    background: "transparent",
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 12,
    cursor: "pointer",
    color: "inherit",
  },
  кнопкаСкоростиАктивная: {
    borderColor: "#0e8478",
    color: "#0e8478",
    fontWeight: 700,
  },
  главы: {
    marginTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    maxHeight: 180,
    overflowY: "auto",
  },
  глава: {
    display: "flex",
    gap: 10,
    alignItems: "baseline",
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: "4px 6px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    color: "inherit",
    font: "inherit",
  },
  главаВремя: {
    color: "#0e8478",
    fontVariantNumeric: "tabular-nums",
    fontSize: 12,
    flexShrink: 0,
  },
  загрузка: { padding: 24, textAlign: "center", color: "#6b7b78" },
  ошибка: {
    padding: 16,
    borderRadius: 10,
    background: "rgba(163,44,34,.08)",
    color: "#a32c22",
    textAlign: "center",
  },
  кнопкаСсылка: {
    border: "none",
    background: "none",
    color: "inherit",
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
    font: "inherit",
  },
};
