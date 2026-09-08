// client/src/pages/videra/MyVideosPage.jsx
//
// «Мои ролики» — библиотека каталога DP-Videra в кабинете.
//
// ОДНА СТРАНИЦА НА ДВЕ ЗОНЫ, как и сама студия: врач и пациент видят одно и
// то же, а что именно им доступно, решает сервер по сессии. Ролики клиники
// приходят в том же списке — если человек в ней работает и роль позволяет.
//
// ЧТО ЗДЕСЬ НАМЕРЕННО СКУПО. Это не витрина и не редактор: посмотреть,
// открыть доступ, снять с публикации, удалить. Съёмка живёт в студии
// (VideraPage), связь с приёмом появится вместе с фазой привязок.

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import VideoPlayer from "../../components/video/VideoPlayer";
import {
  fetchMyVideos,
  publishVideo,
  unpublishVideo,
  deleteVideo,
} from "../../api/video";

const ЦВЕТ_ВИДИМОСТИ = {
  private: "#6b7b78",
  clinic: "#0e8478",
  link: "#c4570d",
  public: "#0e8478",
};

/** Подписи состояния и видимости — тоже интерфейс, тоже через словарь. */
const видимостьТекстом = (t, v) =>
  ({
    private: t("videra.library.visPrivate", { defaultValue: "Только я" }),
    clinic: t("videra.library.visClinic", { defaultValue: "Клиника" }),
    link: t("videra.library.visLink", { defaultValue: "По ссылке" }),
    public: t("videra.library.visPublic", { defaultValue: "Опубликован" }),
  })[v] || v;

const состояниеТекстом = (t, st) =>
  ({
    draft: t("videra.library.stDraft", { defaultValue: "черновик" }),
    processing: t("videra.library.stProcessing", { defaultValue: "рендерится" }),
    ready: t("videra.library.stReady", { defaultValue: "готов" }),
    failed: t("videra.library.stFailed", { defaultValue: "ошибка рендера" }),
  })[st] || st;

export default function MyVideosPage() {
  const { t } = useTranslation();
  const [ролики, setРолики] = useState(null);
  const [беда, setБеда] = useState("");
  const [открыт, setОткрыт] = useState(null); // id ролика в плеере
  const [занят, setЗанят] = useState(null); // id ролика, по которому идёт действие

  const загрузить = useCallback(async () => {
    setБеда("");
    try {
      setРолики(await fetchMyVideos());
    } catch {
      setБеда(
        t("videra.library.listFailed", {
          defaultValue: "Не удалось загрузить список роликов",
        }),
      );
      setРолики([]);
    }
  }, [t]);

  useEffect(() => {
    загрузить();
  }, [загрузить]);

  /**
   * Действие над роликом. Отказ сервера показываем его же словами: он
   * отвечает по делу («в ролике есть пациент», «файла нет»), и переписывать
   * это в общее «что-то пошло не так» значило бы прятать причину.
   */
  const действие = async (id, работа) => {
    setЗанят(id);
    setБеда("");
    try {
      await работа();
      await загрузить();
    } catch (e) {
      setБеда(
        e?.response?.data?.message ||
          t("videra.library.actionFailed", {
            defaultValue: "Не удалось выполнить действие",
          }),
      );
    } finally {
      setЗанят(null);
    }
  };

  const удалить = (ролик) => {
    // Удаление ролика необратимо: файл уйдёт в уборку. Спрашиваем прямо,
    // без «вы уверены?» — называем, что именно исчезнет.
    const вопрос = t("videra.library.confirmDelete", {
      title: ролик.title,
      defaultValue: "Удалить «{{title}}»? Файл будет стёрт безвозвратно.",
    });
    if (!window.confirm(вопрос)) return;
    действие(ролик._id, () => deleteVideo(ролик._id));
  };

  if (ролики === null) {
    return (
      <div style={стиль.пусто}>
        {t("videra.library.loading", { defaultValue: "Загружаем…" })}
      </div>
    );
  }

  return (
    <div style={стиль.страница}>
      <div style={стиль.шапка}>
        <div>
          <h1 style={стиль.заголовок}>
            {t("videra.library.title", { defaultValue: "Мои ролики" })}
          </h1>
          <p style={стиль.подзаголовок}>
            {t("videra.library.subtitle", {
              defaultValue: "Разъяснительные фильмы, снятые в студии DP-Videra.",
            })}
          </p>
        </div>
        <Link to="../videra" style={стиль.кнопкаГлавная}>
          {t("videra.library.shoot", { defaultValue: "Снять фильм" })}
        </Link>
      </div>

      {беда && (
        <div role="alert" style={стиль.ошибка}>
          {беда}
        </div>
      )}

      {ролики.length === 0 ? (
        <div style={стиль.пусто}>
          {t("videra.library.empty", {
            defaultValue:
              "Пока ни одного ролика. Снимите первый в студии — он появится здесь.",
          })}
        </div>
      ) : (
        <div style={стиль.список}>
          {ролики.map((р) => {
            const цвет = ЦВЕТ_ВИДИМОСТИ[р.visibility] || ЦВЕТ_ВИДИМОСТИ.private;
            const готов = р.status === "ready";
            return (
              <div key={р._id} style={стиль.карточка}>
                <div style={стиль.строка}>
                  <div style={стиль.описание}>
                    <div style={стиль.название}>{р.title}</div>
                    <div style={стиль.мета}>
                      <span style={{ color: цвет }}>
                        {видимостьТекстом(t, р.visibility)}
                      </span>
                      <span>·</span>
                      <span>{состояниеТекстом(t, р.status)}</span>
                      {р.phi && (
                        <>
                          <span>·</span>
                          <span style={стиль.phi}>
                            {t("videra.library.hasPatient", {
                              defaultValue: "в кадре пациент",
                            })}
                          </span>
                        </>
                      )}
                      {р.media?.durationSec > 0 && (
                        <>
                          <span>·</span>
                          <span>
                            {t("videra.library.seconds", {
                              count: Math.round(р.media.durationSec),
                              defaultValue: "{{count}} с",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={стиль.кнопки}>
                    <button
                      type="button"
                      disabled={!готов}
                      onClick={() => setОткрыт(открыт === р._id ? null : р._id)}
                      style={стиль.кнопка}
                      title={
                        готов
                          ? ""
                          : t("videra.library.notReadyHint", {
                              defaultValue: "Файл ещё не готов",
                            })
                      }
                    >
                      {открыт === р._id
                        ? t("videra.library.collapse", { defaultValue: "Свернуть" })
                        : t("videra.library.watch", { defaultValue: "Смотреть" })}
                    </button>

                    {/* Публикация ролика с пациентом запрещена сервером —
                        кнопку не показываем вовсе, чтобы не предлагать
                        действие, которое заведомо получит отказ. */}
                    {!р.phi && готов && р.visibility === "private" && (
                      <button
                        type="button"
                        disabled={занят === р._id}
                        onClick={() => действие(р._id, () => publishVideo(р._id, "public"))}
                        style={стиль.кнопка}
                      >
                        {t("videra.library.publish", { defaultValue: "Опубликовать" })}
                      </button>
                    )}
                    {р.visibility !== "private" && (
                      <button
                        type="button"
                        disabled={занят === р._id}
                        onClick={() => действие(р._id, () => unpublishVideo(р._id))}
                        style={стиль.кнопка}
                      >
                        {t("videra.library.unpublish", {
                          defaultValue: "Закрыть доступ",
                        })}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={занят === р._id}
                      onClick={() => удалить(р)}
                      style={{ ...стиль.кнопка, ...стиль.кнопкаОпасная }}
                    >
                      {t("videra.library.delete", { defaultValue: "Удалить" })}
                    </button>
                  </div>
                </div>

                {открыт === р._id && (
                  <div style={стиль.плеер}>
                    <VideoPlayer videoId={р._id} autoPlay />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const стиль = {
  страница: { maxWidth: 900, margin: "0 auto", padding: "24px 16px 64px" },
  шапка: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  заголовок: { fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-.02em" },
  подзаголовок: { margin: "6px 0 0", color: "#6b7b78", fontSize: 14 },
  кнопкаГлавная: {
    background: "#0e8478",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 18px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  список: { display: "flex", flexDirection: "column", gap: 12 },
  карточка: {
    border: "1px solid #d6dddb",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
  },
  строка: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  описание: { minWidth: 0, flex: 1 },
  название: { fontWeight: 700, fontSize: 16 },
  мета: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 4,
    fontSize: 13,
    color: "#6b7b78",
  },
  phi: { color: "#a32c22", fontWeight: 600 },
  кнопки: { display: "flex", gap: 8, flexWrap: "wrap" },
  кнопка: {
    border: "1px solid #d6dddb",
    background: "transparent",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13,
    cursor: "pointer",
    color: "inherit",
  },
  кнопкаОпасная: { borderColor: "rgba(163,44,34,.4)", color: "#a32c22" },
  плеер: { marginTop: 14 },
  пусто: { padding: 40, textAlign: "center", color: "#6b7b78" },
  ошибка: {
    padding: 12,
    borderRadius: 10,
    background: "rgba(163,44,34,.08)",
    color: "#a32c22",
    marginBottom: 16,
    fontSize: 14,
  },
};
