// client/src/components/video/AttachedVideos.jsx
//
// Ролики, прикреплённые к сущности: «что показывали на этом приёме», «что
// объясняли этому пациенту».
//
// ОДИН КОМПОНЕНТ НА ВСЕ МЕСТА. Приём, карта пациента, случай радиологии —
// вопрос везде один и тот же, и различаются только два параметра. Отдельные
// списки в каждой странице разъехались бы по поведению уже через месяц.
//
// ПУСТОЙ СПИСОК НИЧЕГО НЕ РИСУЕТ. Блок «Роликов нет» на каждой карточке
// приёма — это шум на всех приёмах, где видео и не предполагалось.

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import VideoPlayer from "./VideoPlayer";
import { fetchVideosForEntity } from "../../api/video";

export default function AttachedVideos({ entityType, entityId, title = null }) {
  const { t } = useTranslation();
  const [ролики, setРолики] = useState([]);
  const [открыт, setОткрыт] = useState(null);

  const загрузить = useCallback(async () => {
    if (!entityId) return;
    try {
      setРолики(await fetchVideosForEntity(entityType, entityId));
    } catch {
      // Молча: ролики — дополнение к карточке, а не её содержимое, и
      // красное окно поверх приёма из-за них неуместно.
      setРолики([]);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    загрузить();
  }, [загрузить]);

  if (!ролики.length) return null;

  return (
    <div style={стиль.блок}>
      <div style={стиль.заголовок}>
        {title || t("videra.attached.title", { defaultValue: "Показанные ролики" })}
      </div>
      {ролики.map((р) => (
        <div key={р._id} style={стиль.строка}>
          <div style={стиль.описание}>
            <div style={стиль.название}>{р.title}</div>
            <div style={стиль.мета}>
              {р.media?.durationSec > 0 && (
                <span>
                  {t("videra.attached.seconds", {
                    count: Math.round(р.media.durationSec),
                    defaultValue: "{{count}} с",
                  })}
                </span>
              )}
              {р.stats?.completions > 0 && (
                <span style={стиль.досмотр}>
                  {t("videra.attached.watched", { defaultValue: "досмотрен" })}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setОткрыт(открыт === р._id ? null : р._id)}
            style={стиль.кнопка}
            disabled={р.status !== "ready"}
          >
            {открыт === р._id
              ? t("videra.attached.collapse", { defaultValue: "Свернуть" })
              : t("videra.attached.watch", { defaultValue: "Смотреть" })}
          </button>
          {открыт === р._id && (
            <div style={стиль.плеер}>
              <VideoPlayer videoId={р._id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const стиль = {
  блок: {
    border: "1px solid #d6dddb",
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    background: "#fff",
  },
  заголовок: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".1em",
    color: "#6b7b78",
    marginBottom: 10,
  },
  строка: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    padding: "8px 0",
    borderTop: "1px solid #e4e9e8",
  },
  описание: { flex: 1, minWidth: 0 },
  название: { fontWeight: 600, fontSize: 14 },
  мета: { display: "flex", gap: 8, fontSize: 12, color: "#6b7b78", marginTop: 2 },
  досмотр: { color: "#0e8478", fontWeight: 600 },
  кнопка: {
    border: "1px solid #d6dddb",
    background: "transparent",
    borderRadius: 8,
    padding: "4px 12px",
    fontSize: 13,
    cursor: "pointer",
    color: "inherit",
  },
  плеер: { flexBasis: "100%", marginTop: 10 },
};
