// client/src/pages/admin/video/AdminVideosPage.jsx
//
// Управление каталогом роликов: весь DP-Tube в одном списке — свои, чужие,
// черновики, архив.
//
// ПОЧЕМУ ПРИЧИНА СПРАШИВАЕТСЯ ОКНОМ, А НЕ ПОЛЕМ В ФОРМЕ. Архив и удаление
// касаются чужого материала, и вопрос «почему убрали» задают первым.
// Отдельный шаг с обязательным текстом делает решение осознанным, а не
// случайным нажатием в списке.
//
// АРХИВ ВМЕСТО УДАЛЕНИЯ — предпочтительный путь: ошибку модерации можно
// отменить, удаление необратимо и уносит файл.

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import VideoPlayer from "../../../components/video/VideoPlayer";
import AdminVideoCategories from "./AdminVideoCategories";
import {
  adminFetchVideos,
  adminUpdateVideo,
  adminArchiveVideo,
  adminUnarchiveVideo,
  adminDeleteVideo,
} from "../../../api/video";

const ВИДИМОСТЬ = ["private", "clinic", "link", "public"];

export default function AdminVideosPage() {
  const { t } = useTranslation();
  const [ролики, setРолики] = useState(null);
  const [беда, setБеда] = useState("");
  const [фильтр, setФильтр] = useState({ q: "", archived: "false" });
  const [открыт, setОткрыт] = useState(null);
  const [правка, setПравка] = useState(null); // {id, title, description}
  const [занят, setЗанят] = useState(null);

  const загрузить = useCallback(async () => {
    setБеда("");
    try {
      setРолики(
        await adminFetchVideos({
          q: фильтр.q || undefined,
          archived: фильтр.archived,
          limit: 200,
        }),
      );
    } catch (e) {
      setБеда(
        e?.response?.data?.message ||
          t("videra.admin.loadFailed", { defaultValue: "Не удалось загрузить каталог" }),
      );
      setРолики([]);
    }
  }, [фильтр, t]);

  useEffect(() => {
    загрузить();
  }, [загрузить]);

  const действие = async (id, работа) => {
    setЗанят(id);
    setБеда("");
    try {
      await работа();
      await загрузить();
    } catch (e) {
      setБеда(e?.response?.data?.message || "Не удалось выполнить действие");
    } finally {
      setЗанят(null);
    }
  };

  /** Причина обязательна — сервер откажет без неё, спрашиваем заранее. */
  const спроситьПричину = (вопрос) => {
    const причина = window.prompt(вопрос);
    if (причина === null) return null;
    if (!причина.trim()) {
      setБеда(t("videra.admin.needReason", { defaultValue: "Нужна причина" }));
      return null;
    }
    return причина.trim();
  };

  const архивировать = (р) => {
    const причина = спроситьПричину(
      t("videra.admin.archivePrompt", {
        title: р.title,
        defaultValue: "Почему убираем «{{title}}» в архив?",
      }),
    );
    if (причина) действие(р._id, () => adminArchiveVideo(р._id, причина));
  };

  const удалить = (р) => {
    const причина = спроситьПричину(
      t("videra.admin.deletePrompt", {
        title: р.title,
        defaultValue: "Удалить «{{title}}» безвозвратно. Причина?",
      }),
    );
    if (причина) действие(р._id, () => adminDeleteVideo(р._id, причина));
  };

  const сохранить = () => {
    const { id, title, description } = правка;
    действие(id, () => adminUpdateVideo(id, { title, description })).then(() =>
      setПравка(null),
    );
  };

  if (ролики === null) {
    return (
      <div style={стиль.пусто}>
        {t("videra.admin.loading", { defaultValue: "Загружаем…" })}
      </div>
    );
  }

  return (
    <div style={стиль.страница}>
      <h1 style={стиль.заголовок}>
        {t("videra.admin.title", { defaultValue: "Каталог видео" })}
      </h1>
      <p style={стиль.подзаголовок}>
        {t("videra.admin.subtitle", {
          defaultValue:
            "Все ролики платформы: чужие, черновики и архив. Архив можно отменить, удаление — нет.",
        })}
      </p>

      {/* Разделы витрины — над списком роликов: сначала полки, потом
          то, что на них лежит. */}
      <AdminVideoCategories />

      <div style={стиль.панель}>
        <input
          value={фильтр.q}
          onChange={(e) => setФильтр({ ...фильтр, q: e.target.value })}
          placeholder={t("videra.admin.search", { defaultValue: "Поиск по названию" })}
          style={стиль.поле}
        />
        <select
          value={фильтр.archived}
          onChange={(e) => setФильтр({ ...фильтр, archived: e.target.value })}
          style={стиль.поле}
        >
          <option value="false">
            {t("videra.admin.filterLive", { defaultValue: "Без архива" })}
          </option>
          <option value="true">
            {t("videra.admin.filterArchived", { defaultValue: "Только архив" })}
          </option>
          <option value="all">
            {t("videra.admin.filterAll", { defaultValue: "Всё" })}
          </option>
        </select>
        <span style={стиль.счётчик}>
          {t("videra.admin.count", {
            count: ролики.length,
            defaultValue: "{{count}} роликов",
          })}
        </span>
      </div>

      {беда && (
        <div role="alert" style={стиль.ошибка}>
          {беда}
        </div>
      )}

      {ролики.length === 0 && (
        <div style={стиль.пусто}>
          {t("videra.admin.empty", { defaultValue: "Ничего не найдено." })}
        </div>
      )}

      <div style={стиль.список}>
        {ролики.map((р) => (
          <div key={р._id} style={стиль.карточка}>
            <div style={стиль.строка}>
              <div style={стиль.описание}>
                {правка?.id === р._id ? (
                  <>
                    <input
                      value={правка.title}
                      onChange={(e) => setПравка({ ...правка, title: e.target.value })}
                      style={{ ...стиль.поле, width: "100%" }}
                    />
                    <textarea
                      value={правка.description}
                      onChange={(e) =>
                        setПравка({ ...правка, description: e.target.value })
                      }
                      rows={2}
                      style={{ ...стиль.поле, width: "100%", marginTop: 6 }}
                    />
                  </>
                ) : (
                  <>
                    <div style={стиль.название}>{р.title}</div>
                    {р.description && <div style={стиль.текст}>{р.description}</div>}
                  </>
                )}
                <div style={стиль.мета}>
                  <span>{р.status}</span>
                  <span>·</span>
                  <span>{р.visibility}</span>
                  {р.phi && <span style={стиль.phi}>PHI</span>}
                  {р.archivedAt && (
                    <span style={стиль.архив}>
                      {t("videra.admin.archived", { defaultValue: "в архиве" })}
                    </span>
                  )}
                  {р.media?.durationSec > 0 && <span>{Math.round(р.media.durationSec)} с</span>}
                </div>
                {р.archiveReason && (
                  <div style={стиль.причина}>{р.archiveReason}</div>
                )}
              </div>

              <div style={стиль.кнопки}>
                {правка?.id === р._id ? (
                  <>
                    <button type="button" onClick={сохранить} style={стиль.кнопкаГлавная}>
                      {t("videra.admin.save", { defaultValue: "Сохранить" })}
                    </button>
                    <button type="button" onClick={() => setПравка(null)} style={стиль.кнопка}>
                      {t("videra.admin.cancel", { defaultValue: "Отмена" })}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={р.status !== "ready"}
                      onClick={() => setОткрыт(открыт === р._id ? null : р._id)}
                      style={стиль.кнопка}
                    >
                      {t("videra.admin.watch", { defaultValue: "Смотреть" })}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setПравка({
                          id: р._id,
                          title: р.title || "",
                          description: р.description || "",
                        })
                      }
                      style={стиль.кнопка}
                    >
                      {t("videra.admin.edit", { defaultValue: "Править" })}
                    </button>
                    <select
                      value={р.visibility}
                      disabled={занят === р._id}
                      onChange={(e) =>
                        действие(р._id, () =>
                          adminUpdateVideo(р._id, { visibility: e.target.value }),
                        )
                      }
                      style={стиль.поле}
                    >
                      {ВИДИМОСТЬ.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                    {р.archivedAt ? (
                      <button
                        type="button"
                        disabled={занят === р._id}
                        onClick={() =>
                          действие(р._id, () => adminUnarchiveVideo(р._id))
                        }
                        style={стиль.кнопка}
                      >
                        {t("videra.admin.unarchive", { defaultValue: "Из архива" })}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={занят === р._id}
                        onClick={() => архивировать(р)}
                        style={стиль.кнопка}
                      >
                        {t("videra.admin.archive", { defaultValue: "В архив" })}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={занят === р._id}
                      onClick={() => удалить(р)}
                      style={{ ...стиль.кнопка, ...стиль.кнопкаОпасная }}
                    >
                      {t("videra.admin.delete", { defaultValue: "Удалить" })}
                    </button>
                  </>
                )}
              </div>
            </div>

            {открыт === р._id && (
              <div style={стиль.плеер}>
                <VideoPlayer videoId={р._id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const стиль = {
  страница: { maxWidth: 1100, margin: "0 auto", padding: "24px 16px 64px" },
  заголовок: { fontSize: 24, fontWeight: 800, margin: 0 },
  подзаголовок: { margin: "6px 0 18px", color: "#6b7b78", fontSize: 14 },
  панель: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 },
  поле: {
    border: "1px solid #d6dddb",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 13,
    font: "inherit",
  },
  счётчик: { color: "#6b7b78", fontSize: 13 },
  список: { display: "flex", flexDirection: "column", gap: 10 },
  карточка: { border: "1px solid #d6dddb", borderRadius: 10, padding: 14, background: "#fff" },
  строка: { display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" },
  описание: { flex: 1, minWidth: 260 },
  название: { fontWeight: 700, fontSize: 15 },
  текст: { fontSize: 13, color: "#3b4b49", marginTop: 2 },
  мета: { display: "flex", gap: 8, fontSize: 12, color: "#6b7b78", marginTop: 6, flexWrap: "wrap" },
  phi: { color: "#a32c22", fontWeight: 700 },
  архив: { color: "#c4570d", fontWeight: 700 },
  причина: { fontSize: 12, color: "#6b7b78", marginTop: 4, fontStyle: "italic" },
  кнопки: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start" },
  кнопка: {
    border: "1px solid #d6dddb",
    background: "transparent",
    borderRadius: 8,
    padding: "5px 10px",
    fontSize: 12,
    cursor: "pointer",
    color: "inherit",
  },
  кнопкаГлавная: {
    border: "1px solid #0e8478",
    background: "#0e8478",
    color: "#fff",
    borderRadius: 8,
    padding: "5px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 700,
  },
  кнопкаОпасная: { borderColor: "rgba(163,44,34,.4)", color: "#a32c22" },
  плеер: { marginTop: 12 },
  пусто: { padding: 40, textAlign: "center", color: "#6b7b78" },
  ошибка: {
    padding: 12,
    borderRadius: 10,
    background: "rgba(163,44,34,.08)",
    color: "#a32c22",
    marginBottom: 14,
    fontSize: 14,
  },
};
