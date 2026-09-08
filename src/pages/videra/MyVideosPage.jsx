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
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import VideoPlayer from "../../components/video/VideoPlayer";
import VideoUploader from "../../components/video/VideoUploader";
import VideoImport from "../../components/video/VideoImport";
import SubtitlesPanel from "../../components/video/SubtitlesPanel";
import VideoStats from "../../components/video/VideoStats";
import {
  fetchMyVideos,
  publishVideo,
  unpublishVideo,
  deleteVideo,
  updateVideo,
  fetchCategories,
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
  const { t, i18n } = useTranslation();
  const [ролики, setРолики] = useState(null);
  const [беда, setБеда] = useState("");
  const [открыт, setОткрыт] = useState(null); // id ролика в плеере
  const [субтитрыДля, setСубтитрыДля] = useState(null); // id ролика с открытой панелью
  const [статистикаДля, setСтатистикаДля] = useState(null);
  const [разделы, setРазделы] = useState([]);
  const [занят, setЗанят] = useState(null); // id ролика, по которому идёт действие
  const [грузим, setГрузим] = useState(false);
  const [переносим, setПереносим] = useState(false);

  // Приём из студии: она открывает /doctor/videos?import=<id фильма>, и
  // страница сама разворачивает форму переноса с подставленным фильмом.
  // Студии для этого достаточно обычной ссылки — ей не нужно ни ключей,
  // ни знания нашего API, а вся работа остаётся на нашей стороне.
  const [параметры, setПараметры] = useSearchParams();
  const изСтудии = параметры.get("import") || "";

  useEffect(() => {
    if (изСтудии) setПереносим(true);
  }, [изСтудии]);

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

  // Разделы витрины заводит администратор — список тянем с сервера, а не
  // держим в коде: новая полка не должна требовать выкатки интерфейса.
  useEffect(() => {
    let живо = true;
    fetchCategories(i18n.language)
      .then((к) => живо && setРазделы(к))
      .catch(() => живо && setРазделы([]));
    return () => {
      живо = false;
    };
  }, [i18n.language]);

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
      {/* Левая колонка — про порядок работы, правая — сами ролики. Так же
          устроено рабочее место в студии, и человек, пришедший оттуда,
          не пересобирает картину заново. */}
      <aside style={стиль.колонка}>
        <div style={стиль.колонкаИмя}>DP-Videra</div>
        <p style={стиль.колонкаТекст}>
          {t("videra.library.aside1", {
            defaultValue:
              "Ролики, подключённые к платформе. Их можно показать пациенту, приложить к приёму и опубликовать в каталоге.",
          })}
        </p>

        <div style={стиль.колонкаЗаголовок}>
          {t("videra.library.asideHow", { defaultValue: "Откуда берутся ролики" })}
        </div>
        <ol style={стиль.шаги}>
          <li>
            {t("videra.library.step1", {
              defaultValue:
                "Снимите фильм в студии — она открывается из кабинета, второй пароль не нужен.",
            })}
          </li>
          <li>
            {t("videra.library.step2", {
              defaultValue:
                "Или загрузите готовый файл с компьютера, или перенесите фильм из студии по ссылке.",
            })}
          </li>
          <li>
            {t("videra.library.step3", {
              defaultValue:
                "Дальше — субтитры, показ пациенту и публикация в каталоге DP-Tube.",
            })}
          </li>
        </ol>

        <a
          href="https://docpats.com/dp-videra/"
          target="_blank"
          rel="noreferrer"
          style={стиль.ссылка}
        >
          {t("videra.library.studioLink", { defaultValue: "Открыть студию" })}
        </a>
      </aside>

      <main style={стиль.основное}>
      <div style={стиль.шапка}>
        <div>
          <h1 style={стиль.заголовок}>
            {t("videra.library.title", { defaultValue: "Мои ролики" })}
          </h1>
          <p style={стиль.подзаголовок}>
            {t("videra.library.count", {
              count: ролики.length,
              defaultValue: "Роликов: {{count}}",
            })}
          </p>
        </div>
        <Link to="../videra" style={стиль.кнопкаГлавная}>
          {t("videra.library.shoot", { defaultValue: "Снять фильм" })}
        </Link>
      </div>

      {/* Загрузка своего файла — рядом со съёмкой в студии: это два пути
          к одному и тому же, и выбирать между ними человек должен в одном
          месте, а не искать по разделам. */}
      <div style={стиль.загрузка}>
        <button
          type="button"
          onClick={() => setГрузим((v) => !v)}
          style={стиль.кнопка}
        >
          {грузим
            ? t("videra.upload.hide", { defaultValue: "Скрыть загрузку" })
            : t("videra.upload.open", { defaultValue: "Загрузить своё видео" })}
        </button>
        <button
          type="button"
          onClick={() => setПереносим((v) => !v)}
          style={стиль.кнопка}
        >
          {переносим
            ? t("videra.import.hide", { defaultValue: "Скрыть перенос" })
            : t("videra.import.open", { defaultValue: "Перенести из студии" })}
        </button>
      </div>
      {грузим && <VideoUploader onDone={загрузить} />}

      {переносим && (
        <VideoImport
          начальнаяСсылка={изСтудии}
          onDone={() => {
            // Параметр убираем после переноса: перезагрузка страницы иначе
            // предлагала бы перенести уже перенесённое.
            if (изСтудии) {
              параметры.delete("import");
              setПараметры(параметры, { replace: true });
            }
            загрузить();
          }}
        />
      )}

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
            // Своё или чужое говорит сервер: у интерфейса нет ни ownerId
            // человека, ни его роли в клинике, и гадание заканчивалось
            // кнопкой «Удалить» на чужом ролике. Старый ответ без этого
            // поля считаем своим: до разделения список и был только свой.
            const моё = р.isOwner !== false;
            return (
              <div key={р._id} style={стиль.карточка}>
                {/* Кадр решает задачу, с которой не справляется имя: у
                    роликов бывают названия вроде «ffff», и узнают их по
                    картинке. Нет превью — показываем это честно, а не
                    чёрным прямоугольником непонятного происхождения. */}
                <div
                  style={стиль.превью}
                  onClick={() => готов && setОткрыт(открыт === р._id ? null : р._id)}
                  role={готов ? "button" : undefined}
                  tabIndex={готов ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (готов && (e.key === "Enter" || e.key === " ")) {
                      setОткрыт(открыт === р._id ? null : р._id);
                    }
                  }}
                >
                  {р.posterUrl ? (
                    <img src={р.posterUrl} alt="" style={стиль.превьюКадр} />
                  ) : (
                    <span style={стиль.превьюПусто}>
                      {t("videra.library.noPoster", { defaultValue: "без кадра" })}
                    </span>
                  )}
                  {р.media?.durationSec > 0 && (
                    <span style={стиль.длительность}>
                      {Math.floor(р.media.durationSec / 60)}:
                      {String(Math.round(р.media.durationSec % 60)).padStart(2, "0")}
                    </span>
                  )}
                </div>

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

                  {/* Полка витрины. «Без раздела» — обычное состояние, а
                      не ошибка: ролик просто попадёт в общую ленту. */}
                  <select
                    disabled={занят === р._id || !моё}
                    value={р.categoryId || ""}
                    onChange={(e) =>
                      действие(р._id, () =>
                        updateVideo(р._id, { categoryId: e.target.value || null }),
                      )
                    }
                    style={стиль.раздел}
                  >
                    <option value="">
                      {t("videra.library.noCategory", { defaultValue: "Без раздела" })}
                    </option>
                    {разделы.map((к) => (
                      <option key={к._id} value={к._id}>
                        {к.title}
                      </option>
                    ))}
                  </select>

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
                    {моё && !р.phi && готов && р.visibility === "private" && (
                      <button
                        type="button"
                        disabled={занят === р._id}
                        onClick={() => действие(р._id, () => publishVideo(р._id, "public"))}
                        style={стиль.кнопка}
                      >
                        {t("videra.library.publish", { defaultValue: "Опубликовать" })}
                      </button>
                    )}
                    {моё && р.visibility !== "private" && (
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
                    {/* Субтитры делаются из речи в файле — без готового файла
                        предлагать их нечего. */}
                    {/* Статистика — только у опубликованного: у черновика
                        смотреть нечего, и кнопка обещала бы пустоту. */}
                    {моё && р.visibility !== "private" && (
                      <button
                        type="button"
                        onClick={() =>
                          setСтатистикаДля(статистикаДля === р._id ? null : р._id)
                        }
                        style={стиль.кнопка}
                      >
                        {t("videra.library.stats", { defaultValue: "Как смотрят" })}
                      </button>
                    )}

                    {моё && готов && (
                      <button
                        type="button"
                        onClick={() =>
                          setСубтитрыДля(субтитрыДля === р._id ? null : р._id)
                        }
                        style={стиль.кнопка}
                      >
                        {t("videra.library.subtitles", { defaultValue: "Субтитры" })}
                      </button>
                    )}

                    {моё && (
                    <button
                      type="button"
                      disabled={занят === р._id}
                      onClick={() => удалить(р)}
                      style={{ ...стиль.кнопка, ...стиль.кнопкаОпасная }}
                    >
                      {t("videra.library.delete", { defaultValue: "Удалить" })}
                    </button>
                    )}
                  </div>
                </div>

                {открыт === р._id && (
                  <div style={стиль.плеер}>
                    <VideoPlayer videoId={р._id} autoPlay />
                  </div>
                )}

                {субтитрыДля === р._id && (
                  <SubtitlesPanel video={р} onDone={загрузить} />
                )}

                {статистикаДля === р._id && <VideoStats videoId={р._id} />}
              </div>
            );
          })}
        </div>
      )}
      </main>
    </div>
  );
}

const стиль = {
  страница: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "24px 16px 64px",
    display: "grid",
    // Колонка с порядком работы фиксированной ширины: она читается один
    // раз, а место нужно карточкам.
    gridTemplateColumns: "minmax(0, 260px) minmax(0, 1fr)",
    gap: 28,
    alignItems: "start",
  },
  колонка: {
    position: "sticky",
    top: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  колонкаИмя: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: ".08em",
    textTransform: "uppercase",
    color: "#0e8478",
  },
  колонкаТекст: { margin: 0, fontSize: 13, lineHeight: 1.6, color: "#4b5563" },
  колонкаЗаголовок: { fontSize: 13, fontWeight: 700, marginTop: 6 },
  шаги: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    lineHeight: 1.6,
    color: "#4b5563",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  основное: { minWidth: 0 },
  шапка: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  заголовок: { fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-.02em" },
  подзаголовок: { margin: "6px 0 0", color: "#6b7b78", fontSize: 14, maxWidth: 620 },
  ссылка: { color: "#0e8478", fontWeight: 600, textDecoration: "none" },
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
  загрузка: { marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" },
  список: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
  карточка: {
    border: "1px solid #d6dddb",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  превью: {
    position: "relative",
    aspectRatio: "16 / 9",
    borderRadius: 10,
    overflow: "hidden",
    background: "#111",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  превьюКадр: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  превьюПусто: { color: "#8b9a97", fontSize: 12 },
  длительность: {
    position: "absolute",
    right: 6,
    bottom: 6,
    background: "rgba(0,0,0,.75)",
    color: "#fff",
    borderRadius: 4,
    padding: "1px 5px",
    fontSize: 11,
    fontWeight: 600,
  },
  строка: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
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
  раздел: {
    border: "1px solid #d6dddb",
    borderRadius: 8,
    padding: "6px 8px",
    font: "inherit",
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
  },
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
