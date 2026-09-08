// client/src/pages/videra/PublicVideoPage.jsx
//
// Страница ролика — то, что открывает человек из поиска или по ссылке.
//
// РАСКЛАДКА ДВУХКОЛОНОЧНАЯ, как в привычных видеосервисах: плеер, заголовок,
// строка автора с действиями, описание и обсуждение — слева; другие ролики —
// справа. Колонка «дальше» решает задачу, ради которой витрина и делается:
// пришедший за одним объяснением находит остальные.
//
// КОММЕНТАРИИ — ОБЩИЕ ДЛЯ ВСЕЙ ПЛАТФОРМЫ. Здесь стоит тот же CommentSection,
// что под статьями и профилями врачей, с targetType="Video". Своя лента
// комментариев означала бы вторую модерацию, вторые уведомления об
// упоминаниях и два места, где чинить одну и ту же ошибку.
//
// РАЗМЕТКА VideoObject СТАВИТСЯ ЗДЕСЬ ЖЕ: edge-функция Netlify про ролики
// не знает, а без разметки видео не попадает в видео-блок выдачи.

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CommentSection from "../../components/shared/CommentSection";
import {
  fetchPublicVideo,
  fetchPublicPlayback,
  fetchRelated,
  countPublicView,
  toggleVideoLike,
  toggleVideoDislike,
  toggleSubscription,
  fetchEmbedCode,
  reportContent,
} from "../../api/video";
import ReportDialog from "../../components/video/ReportDialog";
import { getSession } from "../../api/session";

const ЛИЦЕНЗИИ = {
  CC0: "CC0",
  "CC-BY-4.0": "CC BY 4.0",
  "CC-BY-SA-4.0": "CC BY-SA 4.0",
  "CC-BY-NC-4.0": "CC BY-NC 4.0",
  proprietary: "",
};

/**
 * Число коротко: 2900 → «2,9 тыс.».
 *
 * Счётчики под роликом читаются взглядом, а не разбираются по цифрам:
 * точное значение здесь никто не ищет. Формат берём из языка интерфейса —
 * в арабском и турецком сокращения свои.
 */
function коротко(n, lang) {
  const число = Number(n) || 0;
  try {
    return new Intl.NumberFormat(lang || "ru", { notation: "compact" }).format(число);
  } catch {
    return String(число);
  }
}

function длительностью(сек) {
  const s = Math.max(0, Math.round(сек || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function PublicVideoPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [ролик, setРолик] = useState(null);
  const [показ, setПоказ] = useState(null);
  const [другие, setДругие] = useState([]);
  const [беда, setБеда] = useState("");
  const [userId, setUserId] = useState(null);
  const [отметки, setОтметки] = useState({
    liked: false,
    disliked: false,
    likes: 0,
    dislikes: 0,
  });
  const [канал, setКанал] = useState(null);
  const [ждёмПодписку, setЖдёмПодписку] = useState(false);
  const [жалоба, setЖалоба] = useState(null);
  const [встраивание, setВстраивание] = useState(null);
  const [встраиваниеСкопировано, setВстраиваниеСкопировано] = useState(false);
  const [субтитры, setСубтитры] = useState("");
  // Широкая раскладка: колонка «дальше» уходит под плеер. Выбор запоминаем —
  // это привычка человека, а не свойство ролика.
  const [широко, setШироко] = useState(() => {
    try {
      return localStorage.getItem("dp.video.wide") === "1";
    } catch {
      return false;
    }
  });
  const [поделились, setПоделились] = useState(false);
  const [описаниеРаскрыто, setОписаниеРаскрыто] = useState(false);

  useEffect(() => {
    let живо = true;
    setБеда("");
    setРолик(null);
    setПоказ(null);
    window.scrollTo(0, 0);

    Promise.all([fetchPublicVideo(id), fetchPublicPlayback(id)])
      .then(([в, п]) => {
        if (!живо) return;
        setРолик(в);
        setПоказ(п);
        setОтметки({
          liked: Boolean(в.likedByMe),
          disliked: Boolean(в.dislikedByMe),
          likes: в.likes || 0,
          dislikes: в.dislikes || 0,
        });
        setКанал(в.channel || null);
      })
      .catch(() => живо && setБеда(t("videra.public.gone", { defaultValue: "Ролик недоступен" })));

    // Колонка «дальше» и сессия грузятся отдельно: их отсутствие не должно
    // мешать смотреть сам ролик. Список — соседи по разделу и автору, а не
    // просто последние загруженные: человек, досмотревший разбор, ищет
    // продолжение темы.
    fetchRelated(id, { limit: 12 })
      .then((р) => живо && setДругие(р.filter((x) => x._id !== id)))
      .catch(() => {});
    getSession()
      .then((s) => живо && setUserId(s?.user?._id || s?.userId || null))
      .catch(() => {});

    return () => {
      живо = false;
    };
  }, [id, t]);

  useEffect(() => {
    if (!ролик) return undefined;
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
      thumbnailUrl: ролик.posterUrl || undefined,
      inLanguage: ролик.lang,
    });
    document.head.appendChild(узел);

    return () => {
      document.title = прежний;
      узел.remove();
    };
  }, [ролик]);

  /**
   * Отметка «полезно» или «не помогло».
   *
   * Взаимоисключение считает сервер и возвращает оба состояния: если бы
   * интерфейс считал их сам, две вкладки быстро разошлись бы в цифрах.
   */
  const отметить = async (вид) => {
    if (!userId) return;
    try {
      const итог =
        вид === "like" ? await toggleVideoLike(id) : await toggleVideoDislike(id);
      setОтметки(итог);
    } catch {
      /* отметка — не то, ради чего показывают ошибку поверх ролика */
    }
  };

  /** Подписка на канал автора или клиники. */
  const подписаться = async () => {
    if (!userId || !канал?.id || ждёмПодписку) return;
    setЖдёмПодписку(true);
    try {
      const итог = await toggleSubscription({
        channelType: канал.type,
        channelId: канал.id,
      });
      setКанал((п) => ({
        ...п,
        subscribedByMe: итог.subscribed,
        subscribers: итог.subscribers,
      }));
    } catch {
      /* отказ в подписке не должен перекрывать просмотр */
    } finally {
      setЖдёмПодписку(false);
    }
  };

  /**
   * Поделиться. Сначала системное окно (на телефоне это привычный путь),
   * иначе — копирование ссылки в буфер с подтверждением.
   */
  const поделиться = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: ролик?.title || "DocPats", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setПоделились(true);
      setTimeout(() => setПоделились(false), 2000);
    } catch {
      /* человек закрыл окно «поделиться» — это не ошибка */
    }
  };

  // Свой же канал подписки не предлагает: счётчик, который автор
  // накручивает сам себе, перестаёт что-либо значить.
  const этоМойКанал =
    канал?.type === "user" && userId && String(канал.id) === String(userId);

  // Просмотр засчитываем после пяти секунд показа, а не при открытии:
  // человек, закрывший вкладку через секунду, ролик не смотрел. Один
  // раз на открытие — перемотка и пауза не должны накручивать счётчик.
  useEffect(() => {
    if (!ролик) return undefined;
    let засчитан = false;
    const таймер = setTimeout(() => {
      if (засчитан) return;
      засчитан = true;
      countPublicView(id)
        .then((итог) => {
          if (итог?.views) {
            setРолик((п) =>
              п ? { ...п, stats: { ...п.stats, views: итог.views } } : п,
            );
          }
        })
        .catch(() => {
          /* счётчик — не то, ради чего прерывают просмотр */
        });
    }, 5000);
    return () => clearTimeout(таймер);
  }, [id, ролик]);

  /** Широкая раскладка. Запись в хранилище может быть запрещена — не беда. */
  const переключитьШирину = () => {
    setШироко((п) => {
      try {
        localStorage.setItem("dp.video.wide", п ? "0" : "1");
      } catch {
        /* приватное окно — выбор просто не переживёт перезагрузку */
      }
      return !п;
    });
  };

  /** Код для вставки на чужой сайт. */
  const открытьВстраивание = async () => {
    if (встраивание) {
      setВстраивание(null);
      return;
    }
    try {
      setВстраивание(await fetchEmbedCode(id));
    } catch (e) {
      setВстраивание({
        error:
          e?.response?.data?.message ||
          t("videra.public.embedFailed", {
            defaultValue: "Этот ролик встроить нельзя",
          }),
      });
    }
  };

  const скопироватьКод = async () => {
    if (!встраивание?.html) return;
    try {
      await navigator.clipboard.writeText(встраивание.html);
      setВстраиваниеСкопировано(true);
      setTimeout(() => setВстраиваниеСкопировано(false), 2000);
    } catch {
      /* буфер недоступен — код виден в поле, его можно выделить руками */
    }
  };

  /**
   * Субтитры. Переключаем режим дорожек сами, а не полагаемся на меню
   * плеера: в части браузеров оно спрятано, а человеку со сниженным слухом
   * субтитры нужны с первой секунды.
   */
  const переключитьСубтитры = (язык) => {
    setСубтитры(язык);
    const video = document.querySelector(".vp-player video");
    if (!video) return;
    for (const дорожка of video.textTracks || []) {
      дорожка.mode = дорожка.language === язык ? "showing" : "disabled";
    }
  };

  if (беда) return <div className="vp-empty">{беда}</div>;
  if (!ролик || !показ) {
    return (
      <div className="vp-empty">
        {t("videra.public.loading", { defaultValue: "Загружаем…" })}
      </div>
    );
  }

  return (
    <div className="vp">
      <style>{CSS}</style>

      {/* Шапка с возвратом в каталог. Сюда попадают по ссылке из
          мессенджера и из соцсети, минуя витрину, — и без этой строки человек
          досматривал ролик и не имел куда пойти дальше. */}
      <div className="vp-top">
        <Link to="/videos" className="vp-brand">
          <span className="vp-brand-mark">▶</span> DP-Tube
        </Link>
        <Link to="/videos" className="vp-top-all">
          {t("videra.public.allVideos", { defaultValue: "Все ролики" })}
        </Link>
      </div>

      <div className={`vp-layout${широко ? " is-wide" : ""}`}>
        <div className="vp-col">
          <div className="vp-player">
            <video
              src={показ.url}
              poster={показ.poster || undefined}
              controls
              autoPlay
              playsInline
              preload="metadata"
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

          {/* Полоса управления показом: ширина и субтитры. Стоит между
              плеером и заголовком — там, где её ищут. */}
          <div className="vp-view-bar">
            <button
              type="button"
              onClick={переключитьШирину}
              className="vp-ghost"
              title={t("videra.public.wideTitle", {
                defaultValue: "Широкий проигрыватель",
              })}
            >
              {широко ? "⤡" : "⤢"}{" "}
              {широко
                ? t("videra.public.wideOff", { defaultValue: "Обычный вид" })
                : t("videra.public.wideOn", { defaultValue: "Во всю ширину" })}
            </button>

            {(показ.subtitles || []).length > 0 && (
              <div className="vp-cc">
                <span className="vp-cc-label">
                  {t("videra.public.cc", { defaultValue: "Субтитры" })}
                </span>
                <button
                  type="button"
                  onClick={() => переключитьСубтитры("")}
                  className={`vp-ghost${субтитры === "" ? " is-on" : ""}`}
                >
                  {t("videra.public.ccOff", { defaultValue: "Выкл." })}
                </button>
                {показ.subtitles.map((д) => (
                  <button
                    key={д.lang}
                    type="button"
                    onClick={() => переключитьСубтитры(д.lang)}
                    className={`vp-ghost${субтитры === д.lang ? " is-on" : ""}`}
                  >
                    {д.lang.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <h1 className="vp-title">{ролик.title}</h1>

          <div className="vp-row">
            <div className="vp-owner">
              <div className="vp-ava" aria-hidden="true">
                {(ролик.authorName || "D").trim().charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="vp-author">{ролик.authorName || "DocPats"}</div>
                <div className="vp-sub">
                  {t("videra.public.subscribers", {
                    count: канал?.subscribers || 0,
                    defaultValue: "{{count}} подписчиков",
                  })}
                </div>
              </div>

              {/* На себя не подписываются, поэтому автору кнопки просто нет:
                  кнопка, которая всегда отвечает отказом, хуже отсутствующей. */}
              {канал?.id && !этоМойКанал && (
                <button
                  type="button"
                  onClick={подписаться}
                  disabled={!userId || ждёмПодписку}
                  className={`vp-sub-btn${канал.subscribedByMe ? " is-on" : ""}`}
                  title={
                    userId
                      ? ""
                      : t("videra.public.needLoginSub", {
                          defaultValue: "Войдите, чтобы подписаться",
                        })
                  }
                >
                  {канал.subscribedByMe
                    ? t("videra.public.subscribed", { defaultValue: "Вы подписаны" })
                    : t("videra.public.subscribe", { defaultValue: "Подписаться" })}
                </button>
              )}
            </div>

            <div className="vp-actions">
              {/* Пара отметок — одна деталь с разделителем, а не две кнопки:
                  так видно, что это один выбор с двумя сторонами. */}
              <div className="vp-seg">
                <button
                  type="button"
                  onClick={() => отметить("like")}
                  disabled={!userId}
                  className={`vp-seg-btn${отметки.liked ? " is-on" : ""}`}
                  title={
                    userId
                      ? t("videra.public.likeTitle", { defaultValue: "Это помогло" })
                      : t("videra.public.needLogin", {
                          defaultValue: "Войдите, чтобы отметить",
                        })
                  }
                >
                  👍 {коротко(отметки.likes || 0, i18n.language)}
                </button>
                <span className="vp-seg-div" aria-hidden="true" />
                {/* Счётчик минусов не показываем: под медицинским разбором
                    публичное число «не помогло» работает не как оценка, а
                    как повод для налёта на автора. Своё нажатие человек
                    видит по подсветке. */}
                <button
                  type="button"
                  onClick={() => отметить("dislike")}
                  disabled={!userId}
                  className={`vp-seg-btn${отметки.disliked ? " is-on" : ""}`}
                  title={
                    userId
                      ? t("videra.public.dislikeTitle", {
                          defaultValue: "Это не помогло",
                        })
                      : t("videra.public.needLogin", {
                          defaultValue: "Войдите, чтобы отметить",
                        })
                  }
                >
                  👎
                </button>
              </div>

              <button type="button" onClick={поделиться} className="vp-pill">
                ↗{" "}
                {поделились
                  ? t("videra.public.copied", { defaultValue: "Ссылка скопирована" })
                  : t("videra.public.share", { defaultValue: "Поделиться" })}
              </button>

              <button type="button" onClick={открытьВстраивание} className="vp-pill">
                {"<>"} {t("videra.public.embed", { defaultValue: "Встроить" })}
              </button>

              {/* Пожаловаться может только вошедший: жалоба — заявление
                  конкретного человека, и разбирать анонимный поток
                  невозможно. */}
              {userId && (
                <button
                  type="button"
                  onClick={() => setЖалоба({ targetType: "video", targetId: id })}
                  className="vp-pill"
                  title={t("videra.public.report", { defaultValue: "Пожаловаться" })}
                >
                  ⚑
                </button>
              )}
            </div>
          </div>

          {встраивание && (
            <div className="vp-embed">
              {встраивание.error ? (
                <div className="vp-embed-err">{встраивание.error}</div>
              ) : (
                <>
                  <div className="vp-embed-head">
                    {t("videra.public.embedHead", {
                      defaultValue: "Код для вставки на сайт",
                    })}
                  </div>
                  <textarea
                    className="vp-embed-code"
                    readOnly
                    rows={3}
                    value={встраивание.html}
                    onFocus={(e) => e.target.select()}
                  />
                  <button type="button" onClick={скопироватьКод} className="vp-pill">
                    {встраиваниеСкопировано
                      ? t("videra.public.copied", { defaultValue: "Скопировано" })
                      : t("videra.public.copyCode", { defaultValue: "Копировать код" })}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Серый блок: сначала цифры (просмотры и дата), потом текст —
              так же, как в привычных видеосервисах, где эта строка и
              отвечает на вопрос «свежее ли это и смотрят ли». */}
          <div
              className={`vp-desc${описаниеРаскрыто ? " is-open" : ""}`}
              onClick={() => setОписаниеРаскрыто((v) => !v)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setОписаниеРаскрыто((v) => !v);
              }}
            >
              <div className="vp-desc-stats">
                {t("videra.public.views", {
                  count: ролик.stats?.views || 0,
                  defaultValue: "{{count}} просмотров",
                })}
                {ролик.publishedAt
                  ? ` · ${new Date(ролик.publishedAt).toLocaleDateString()}`
                  : ""}
              </div>

              {ролик.description ? (
                <div className="vp-desc-text">{ролик.description}</div>
              ) : (
                <div className="vp-desc-none">
                  {t("videra.public.noDesc", {
                    defaultValue: "У этого ролика нет описания.",
                  })}
                </div>
              )}

              {(ролик.attribution || []).length > 0 && (
                <div className="vp-lic">
                  <div className="vp-lic-head">
                    {t("videra.public.sources", { defaultValue: "Использованные материалы" })}
                  </div>
                  {ролик.attribution.map((а, i) => (
                    <div key={i}>
                      {а.title}
                      {а.author ? ` — ${а.author}` : ""}
                      {ЛИЦЕНЗИИ[а.license] ? ` · ${ЛИЦЕНЗИИ[а.license]}` : ""}
                    </div>
                  ))}
                </div>
              )}

              <span className="vp-desc-more">
                {описаниеРаскрыто
                  ? t("videra.public.less", { defaultValue: "Свернуть" })
                  : t("videra.public.more2", { defaultValue: "Ещё" })}
              </span>
          </div>

          {/* Обсуждение — общий компонент платформы. Гостю показываем без
              формы: предложить написать и отказать на отправке хуже, чем
              честно не предлагать. */}
          <div className="vp-comments">
            <CommentSection
              refId={id}
              userId={userId}
              targetType="Video"
              readOnly={!userId}
              showHeader
              publicUrl={`${process.env.REACT_APP_API_URL}/api/v1/video/public/${id}/comments`}
              onReport={
                userId
                  ? (commentId) =>
                      setЖалоба({ targetType: "comment", targetId: commentId })
                  : undefined
              }
            />
          </div>
        </div>

        <aside className="vp-side">
          <div className="vp-side-head">
            {t("videra.public.more", { defaultValue: "Другие ролики" })}
          </div>
          {другие.map((р) => (
            <Link key={р._id} to={`/videos/${р._id}`} className="vp-item">
              <div className="vp-item-thumb">
                {р.posterUrl && <img src={р.posterUrl} alt="" loading="lazy" />}
                {р.media?.durationSec > 0 && (
                  <span className="vp-item-dur">{длительностью(р.media.durationSec)}</span>
                )}
              </div>
              <div>
                <div className="vp-item-title">{р.title}</div>
                <div className="vp-item-sub">{р.authorName || "DocPats"}</div>
                <div className="vp-item-sub">
                  {t("videra.public.views", {
                    count: р.stats?.views || 0,
                    defaultValue: "{{count}} просмотров",
                  })}
                </div>
              </div>
            </Link>
          ))}
        </aside>
      </div>

      {жалоба && (
        <ReportDialog
          target={жалоба}
          onClose={() => setЖалоба(null)}
          onSend={reportContent}
        />
      )}
    </div>
  );
}

const CSS = `
.vp { max-width: 1600px; margin: 0 auto; padding: 20px 24px 64px; color: #0f0f0f; }
.vp-top { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.vp-brand { display: flex; align-items: center; gap: 6px; font-size: 20px; font-weight: 800; letter-spacing: -.5px; color: #0f0f0f; text-decoration: none; }
.vp-brand-mark { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 19px; background: #cc0000; color: #fff; border-radius: 5px; font-size: 11px; }
.vp-top-all { margin-left: auto; font-size: 14px; font-weight: 600; color: #0f0f0f; text-decoration: none; background: #f2f2f2; border-radius: 18px; padding: 8px 16px; }
.vp-top-all:hover { background: #e5e5e5; }
.vp-empty { padding: 60px; text-align: center; color: #606060; }
.vp-layout { display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 24px; }
/* Широкий режим: колонка «дальше» уходит под плеер, а не сжимается — на
   узкой полосе карточки нечитаемы. */
.vp-layout.is-wide { grid-template-columns: minmax(0, 1fr); }
.vp-layout.is-wide .vp-side { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; position: static; max-height: none; }
.vp-layout.is-wide .vp-side-head { grid-column: 1 / -1; }
.vp-view-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
.vp-cc { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.vp-cc-label { font-size: 12px; color: #606060; }
.vp-ghost { border: 1px solid #e5e5e5; background: #fff; border-radius: 16px; padding: 5px 12px; font: inherit; font-size: 12px; font-weight: 600; color: #0f0f0f; cursor: pointer; }
.vp-ghost:hover { background: #f2f2f2; }
.vp-ghost.is-on { background: #0f0f0f; color: #fff; border-color: #0f0f0f; }
.vp-embed { margin-top: 12px; padding: 12px 14px; background: #f2f2f2; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.vp-embed-head { font-size: 13px; font-weight: 600; }
.vp-embed-code { width: 100%; box-sizing: border-box; font-family: ui-monospace, monospace; font-size: 12px; border: 1px solid #d9d9d9; border-radius: 8px; padding: 8px; resize: vertical; }
.vp-embed-err { font-size: 13px; color: #a32c22; }
.vp-col { min-width: 0; }
.vp-player { border-radius: 12px; overflow: hidden; background: #000; }
.vp-player video { width: 100%; display: block; max-height: 72vh; }
.vp-title { font-size: 20px; font-weight: 700; margin: 12px 0; line-height: 1.4; }
.vp-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.vp-owner { display: flex; gap: 12px; align-items: center; }
.vp-ava { width: 40px; height: 40px; border-radius: 50%; background: #0e8478; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.vp-author { font-weight: 600; font-size: 16px; }
.vp-sub { font-size: 12px; color: #606060; }
.vp-actions { display: flex; gap: 8px; align-items: center; }
.vp-sub-btn { border: none; background: #0f0f0f; color: #fff; border-radius: 18px; padding: 10px 16px; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; margin-left: 12px; white-space: nowrap; }
.vp-sub-btn:hover { opacity: .85; }
.vp-sub-btn.is-on { background: #f2f2f2; color: #0f0f0f; }
.vp-sub-btn:disabled { opacity: .5; cursor: default; }
.vp-seg { display: flex; align-items: center; background: #f2f2f2; border-radius: 18px; overflow: hidden; }
.vp-seg-btn { border: none; background: transparent; padding: 9px 16px; font: inherit; font-size: 14px; font-weight: 600; color: #0f0f0f; cursor: pointer; }
.vp-seg-btn:hover { background: #e5e5e5; }
.vp-seg-btn.is-on { background: #d9d9d9; }
.vp-seg-btn:disabled { opacity: .5; cursor: default; }
.vp-seg-div { width: 1px; height: 24px; background: #d0d0d0; }
.vp-pill { border: none; background: #f2f2f2; border-radius: 18px; padding: 9px 16px; font-size: 14px; font-weight: 600; cursor: pointer; font: inherit; color: #0f0f0f; }
.vp-pill:hover { background: #e5e5e5; }
.vp-pill.is-on { background: #0f0f0f; color: #fff; }
.vp-pill:disabled { opacity: .5; cursor: default; }
.vp-desc { background: #f2f2f2; border-radius: 12px; padding: 12px 14px; margin-top: 14px; font-size: 14px; line-height: 1.5; cursor: pointer; max-height: 96px; overflow: hidden; position: relative; }
.vp-desc.is-open { max-height: none; }
.vp-desc-stats { font-weight: 600; margin-bottom: 6px; }
.vp-desc-text { white-space: pre-line; }
.vp-desc-none { color: #606060; font-style: italic; }
.vp-desc-more { display: inline-block; margin-top: 8px; font-weight: 600; color: #0f0f0f; }
.vp-lic { margin-top: 10px; font-size: 12px; color: #606060; line-height: 1.6; }
.vp-lic-head { font-weight: 700; color: #0f0f0f; margin-bottom: 2px; }
.vp-comments { margin-top: 24px; }
.vp-side-head { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #606060; margin-bottom: 12px; }
.vp-item { display: flex; gap: 8px; margin-bottom: 8px; text-decoration: none; color: inherit; padding: 4px; border-radius: 10px; }
.vp-item:hover { background: #f2f2f2; }
.vp-item-thumb { position: relative; width: 168px; flex-shrink: 0; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; background: #0f0f0f; }
.vp-item-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.vp-item-dur { position: absolute; right: 4px; bottom: 4px; background: rgba(0,0,0,.8); color: #fff; font-size: 11px; padding: 1px 4px; border-radius: 3px; }
.vp-item-title { font-size: 14px; font-weight: 600; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.vp-item-sub { font-size: 12px; color: #606060; margin-top: 2px; }
@media (max-width: 1100px) { .vp-layout { grid-template-columns: 1fr; } .vp-item-thumb { width: 140px; } }
`;
