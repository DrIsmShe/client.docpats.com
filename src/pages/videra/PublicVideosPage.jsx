// client/src/pages/videra/PublicVideosPage.jsx
//
// Витрина роликов — публичная лента всех авторов. Работает без входа.
//
// РАСКЛАДКА УЗНАВАЕМАЯ НАМЕРЕННО: боковое меню слева, строка чипсов сверху,
// сетка превью 16:9 с аватаром автора под кадром. Люди приходят сюда с
// привычкой к видеосервисам, и заставлять их учиться там, где они уже
// умеют, — худшее, что можно сделать с публичной страницей.
//
// ЧИПСЫ — ЭТО ВИДЫ РОЛИКОВ, А НЕ СВОБОДНЫЕ ТЕГИ. Вид есть у каждой записи
// каталога и означает, зачем ролик снят. Свободные теги пришлось бы
// придумывать и модерировать, а первые же десять авторов развели бы их в
// разнобой.
//
// БОКОВОЕ МЕНЮ ВЕДЁТ В КАБИНЕТ, А НЕ ДУБЛИРУЕТ ЕГО. Здесь только то, что
// относится к видео: витрина, свои ролики, загрузка, студия. Полное меню
// платформы живёт в кабинете и повторять его тут незачем.

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NotificationBell from "../../components/notifications/NotificationBell";
import {
  fetchPublicVideos,
  fetchRecommended,
  fetchCategories,
  fetchMyChannels,
} from "../../api/video";

function длительностью(сек) {
  const s = Math.max(0, Math.round(сек || 0));
  const ч = Math.floor(s / 3600);
  const м = Math.floor((s % 3600) / 60);
  const c = String(s % 60).padStart(2, "0");
  return ч ? `${ч}:${String(м).padStart(2, "0")}:${c}` : `${м}:${c}`;
}

/** «11 тыс. просмотров» — как в привычных лентах, без точного числа. */
function просмотрами(n, t) {
  const число = Number(n) || 0;
  if (число >= 1000) {
    return t("videra.gallery.viewsK", {
      count: Math.round(число / 100) / 10,
      defaultValue: "{{count}} тыс. просмотров",
    });
  }
  return t("videra.gallery.views", { count: число, defaultValue: "{{count}} просмотров" });
}

function давностью(дата, t) {
  if (!дата) return "";
  const дней = Math.floor((Date.now() - new Date(дата).getTime()) / 86400000);
  if (дней < 1) return t("videra.gallery.today", { defaultValue: "сегодня" });
  if (дней < 30)
    return t("videra.gallery.daysAgo", { count: дней, defaultValue: "{{count}} дн. назад" });
  const мес = Math.floor(дней / 30);
  if (мес < 12)
    return t("videra.gallery.monthsAgo", { count: мес, defaultValue: "{{count}} мес. назад" });
  return t("videra.gallery.yearsAgo", {
    count: Math.floor(мес / 12),
    defaultValue: "{{count}} г. назад",
  });
}

export default function PublicVideosPage() {
  const { t, i18n } = useTranslation();
  const [ролики, setРолики] = useState(null);
  const [беда, setБеда] = useState("");
  const [раздел, setРаздел] = useState("");
  const [разделы, setРазделы] = useState([]);
  const [запрос, setЗапрос] = useState("");
  const [искомое, setИскомое] = useState("");
  // Какая лента открыта: весь каталог или только каналы, на которые
  // подписан зритель.
  const [лента, setЛента] = useState("all");
  // Подборка по интересам — только пока человек ничего не выбрал.
  // Нажав «Все», он просит весь каталог — и получать в ответ
  // подборку, где нет уже просмотренного, он не должен: семь
  // роликов превращались в три, и это выглядело как потеря.
  const [подборка, setПодборка] = useState(true);
  // Открытый канал: из списка подписок. Пусто — обычная лента.
  const [канал, setКанал] = useState(null);
  const [каналы, setКаналы] = useState([]);
  // Вошёл ли человек. Нужно, чтобы не звать гостя туда, где его встретит
  // форма входа: «Мои ролики» и «Загрузить» для него — тупик.
  const [свой, setСвой] = useState(null);
  // Колокольчик: открыт ли список. Уведомления сюда приходят все, какие есть
  // у человека в DocPats, — приёмы, сообщения, согласия, подготовка к
  // процедурам. Своя лента «только про видео» означала бы, что человек
  // должен следить за двумя колокольчиками и один из них пропускать.
  const [уведомленияОткрыты, setУведомленияОткрыты] = useState(false);
  const [непрочитано, setНепрочитано] = useState(0);

  // Разделы приходят с сервера: их состав меняет администратор, и жёсткий
  // список в коде означал бы, что новая полка требует выкатки интерфейса.
  useEffect(() => {
    let живо = true;
    // Спрашиваем в лоб: витрина открыта, и ответ «нет» — обычное дело.
    fetch(`${process.env.REACT_APP_API_URL}/common-for-user`, {
      credentials: "include",
    })
      .then((о) => о.json())
      .then((д) => живо && setСвой(Boolean(д?.authenticated)))
      .catch(() => живо && setСвой(false));
    return () => {
      живо = false;
    };
  }, []);

  useEffect(() => {
    let живо = true;
    fetchCategories(i18n.language)
      .then((к) => живо && setРазделы(к))
      .catch(() => живо && setРазделы([]));
    return () => {
      живо = false;
    };
  }, [i18n.language]);

  const загрузить = useCallback(async () => {
    setБеда("");
    try {
      // Подборка — только первый экран, пока человек ничего не выбрал.
      // Любой его выбор — раздел, поиск или даже явное «Все» — это
      // вопрос, и отвечать на него надо каталогом, а не подборкой.
      const подбирать =
        подборка && лента === "all" && !раздел && !искомое;

      // Список каналов вместо роликов — на «Подписках», пока не открыт
      // конкретный канал: человек подписывался на автора и первым делом
      // хочет видеть, на кого именно.
      if (лента === "subs" && !канал) {
        setКаналы(await fetchMyChannels());
        setРолики([]);
        return;
      }

      setРолики(
        подбирать
          ? await fetchRecommended({ limit: 48, lang: i18n.language })
          : await fetchPublicVideos({
              limit: 48,
              categoryId: раздел || undefined,
              q: искомое || undefined,
              sort: лента === "popular" ? "popular" : undefined,
              feed: лента === "history" ? "history" : undefined,
              channelType: канал?.channelType,
              channelId: канал?.channelId,
            }),
      );
    } catch {
      setБеда(t("videra.gallery.failed", { defaultValue: "Не удалось загрузить ленту" }));
      setРолики([]);
    }
  }, [раздел, искомое, лента, канал, подборка, i18n.language, t]);

  useEffect(() => {
    загрузить();
  }, [загрузить]);

  // Обновление при возврате на вкладку.
  //
  // Список — снимок на момент открытия: число просмотров в карточке
  // застывало на том, каким было час назад, и человек, посмотревший
  // ролик и вернувшийся назад, видел прежнюю цифру. Кнопки «обновить»
  // тут быть не должно — это работа программы, а не читателя.
  useEffect(() => {
    const вернулись = () => {
      if (document.visibilityState === "visible") загрузить();
    };
    document.addEventListener("visibilitychange", вернулись);
    window.addEventListener("pageshow", вернулись);
    return () => {
      document.removeEventListener("visibilitychange", вернулись);
      window.removeEventListener("pageshow", вернулись);
    };
  }, [загрузить]);

  useEffect(() => {
    const прежний = document.title;
    document.title = "DP-Tube · DocPats";
    return () => {
      document.title = прежний;
    };
  }, []);

  return (
    <div className="yt">
      <style>{CSS}</style>

      <aside className="yt-side">
        <button
          type="button"
          onClick={() => {
            setЛента("all");
            setКанал(null);
          }}
          className={`yt-side-item yt-side-btn${лента === "all" ? " is-active" : ""}`}
        >
          <span className="yt-side-ico">🏠</span>
          {t("videra.gallery.navHome", { defaultValue: "Главная" })}
        </button>
        {/* Подписки — вторая лента, а не отдельная страница: набор роликов
            тот же, сужен до выбранных каналов. */}
        <button
          type="button"
          onClick={() => {
            setЛента("subs");
            setКанал(null);
          }}
          className={`yt-side-item yt-side-btn${лента === "subs" ? " is-active" : ""}`}
        >
          <span className="yt-side-ico">📺</span>
          {t("videra.gallery.navSubs", { defaultValue: "Подписки" })}
        </button>
        <button
          type="button"
          onClick={() => {
            setЛента("popular");
            setКанал(null);
            setПодборка(false);
          }}
          className={`yt-side-item yt-side-btn${лента === "popular" ? " is-active" : ""}`}
        >
          <span className="yt-side-ico">🔥</span>
          {t("videra.gallery.navPopular", { defaultValue: "Популярное" })}
        </button>

        {/* История — только вошедшему: у гостя её нет и быть не
            может, а пункт, ведущий в пустоту, читается как поломка. */}
        {свой !== false && (
          <button
            type="button"
            onClick={() => {
              setЛента("history");
              setКанал(null);
              setПодборка(false);
            }}
            className={`yt-side-item yt-side-btn${лента === "history" ? " is-active" : ""}`}
          >
            <span className="yt-side-ico">🕓</span>
            {t("videra.gallery.navHistory", { defaultValue: "История" })}
          </button>
        )}

        <div className="yt-side-sep" />

        {/* ГОСТЮ — ПРЕДЛОЖЕНИЕ, А НЕ ССЫЛКИ В ФОРМУ ВХОДА. Раздел «Вы» вёл
            его в три места, каждое из которых требует входа. Здесь же
            сказано, что публиковать может любой врач, и где посмотреть,
            сколько это даёт. */}
        {свой === false && (
          <div className="yt-invite">
            <div className="yt-invite-title">
              {t("videra.gallery.inviteTitle", {
                defaultValue: "Свои ролики",
              })}
            </div>
            <div className="yt-invite-text">
              {t("videra.gallery.inviteText", {
                defaultValue:
                  "Врач снимает объяснение в студии или загружает готовый файл и публикует его здесь.",
              })}
            </div>
            <Link to="/registration" className="yt-invite-go">
              {t("videra.gallery.inviteSignup", { defaultValue: "Начать" })}
            </Link>
            <Link to="/pricing" className="yt-invite-plans">
              {t("videra.gallery.invitePlans", { defaultValue: "Тарифы" })}
            </Link>
          </div>
        )}

        {свой !== false && (
          <div className="yt-side-head">
            {t("videra.gallery.navYou", { defaultValue: "Вы" })}
          </div>
        )}
        {свой !== false && (
          <>
            {/* Работа с роликами — в соседней вкладке, а не вместо витрины:
                человек смотрел ленту и вернётся к ней, а найти место, где
                остановился, после возврата нечем. */}
            <a
              href="/doctor/videos"
              target="_blank"
              rel="noreferrer"
              className="yt-side-item"
            >
              <span className="yt-side-ico">🎬</span>
              {t("videra.library.menu", { defaultValue: "Мои ролики" })}
            </a>
            <a
              href="/doctor/videos"
              target="_blank"
              rel="noreferrer"
              className="yt-side-item"
            >
              <span className="yt-side-ico">⬆️</span>
              {t("videra.upload.open", { defaultValue: "Загрузить своё видео" })}
            </a>
            <a
              href="/doctor/videra"
              target="_blank"
              rel="noreferrer"
              className="yt-side-item"
            >
              <span className="yt-side-ico">🎥</span>
              {t("videra.menu", { defaultValue: "Снять фильм" })}
            </a>
          </>
        )}

        <div className="yt-side-sep" />
        <div className="yt-side-head">
          {t("videra.gallery.navKinds", { defaultValue: "Разделы" })}
        </div>
        {разделы.map((к) => (
          <button
            key={к._id}
            type="button"
            onClick={() => {
              setРаздел(к._id);
              setПодборка(false);
            }}
            className={`yt-side-item yt-side-btn${раздел === к._id ? " is-active" : ""}`}
          >
            <span className="yt-side-ico">▸</span>
            {к.title}
          </button>
        ))}

        <div className="yt-side-sep" />
        <div className="yt-side-foot">
          {t("videra.gallery.footer", {
            defaultValue: "DocPats · разъяснительные медицинские фильмы",
          })}
        </div>
      </aside>

      <main className="yt-main">
        {/* Верхняя строка витрины: имя, поиск, уведомления. */}
        <div className="yt-top">
          <Link to="/videos" className="yt-brand">
            <span className="yt-brand-mark">▶</span> DP-Tube
          </Link>

          <form
            className="yt-search"
          onSubmit={(e) => {
            e.preventDefault();
            setИскомое(запрос.trim());
          }}
        >
          <input
            value={запрос}
            onChange={(e) => setЗапрос(e.target.value)}
            placeholder={t("videra.gallery.search", { defaultValue: "Поиск" })}
          />
            <button
              type="submit"
              aria-label={t("videra.gallery.search", { defaultValue: "Поиск" })}
            >
              🔍
            </button>
          </form>

          {/* Уведомления. Гостю колокольчик не показываем не из
              скромности: список для него всегда пуст, а кнопка,
              открывающая пустоту, выглядит как поломка. */}
          <div className="yt-bell-wrap">
            <button
              type="button"
              className="yt-bell"
              onClick={() => setУведомленияОткрыты((п) => !п)}
              aria-label={t("videra.gallery.bell", { defaultValue: "Уведомления" })}
            >
              🔔
              {непрочитано > 0 && (
                <span className="yt-bell-dot">{непрочитано > 99 ? "99+" : непрочитано}</span>
              )}
            </button>

            {уведомленияОткрыты && (
              <>
                {/* Подложка закрывает список по клику мимо. */}
                <div
                  className="yt-bell-veil"
                  onClick={() => setУведомленияОткрыты(false)}
                  role="presentation"
                />
                <div className="yt-bell-panel">
                  <NotificationBell onUnreadChange={setНепрочитано} limit={8} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="yt-chips">
          <button
            type="button"
            onClick={() => {
              setРаздел("");
              setПодборка(false);
            }}
            className={`yt-chip${раздел === "" && !подборка ? " is-active" : ""}`}
          >
            {t("videra.gallery.all", { defaultValue: "Все" })}
          </button>
          {разделы.map((к) => (
            <button
              key={к._id}
              type="button"
              onClick={() => {
              setРаздел(к._id);
              setПодборка(false);
            }}
              className={`yt-chip${раздел === к._id ? " is-active" : ""}`}
            >
              {к.title}
              {к.count ? ` · ${к.count}` : ""}
            </button>
          ))}
        </div>

        {ролики === null && (
          <div className="yt-empty">
            {t("videra.gallery.loading", { defaultValue: "Загружаем…" })}
          </div>
        )}
        {беда && <div className="yt-empty">{беда}</div>}
        {ролики !== null && !беда && ролики.length === 0 && (
          <div className="yt-empty">
            {/* Пустая лента подписок — не то же, что пустой каталог:
                человек должен понять, что дело в его подписках, а не в площадке. */}
            {лента === "history"
              ? t("videra.gallery.emptyHistory", {
                  defaultValue:
                    "Здесь появятся ролики, которые вы смотрели.",
                })
              : лента === "subs"
              ? t("videra.gallery.emptySubs", {
                  defaultValue:
                    "Здесь появятся ролики каналов, на которые вы подпишетесь.",
                })
              : t("videra.gallery.empty", { defaultValue: "Пока ничего не опубликовано." })}
          </div>
        )}

        {/* Открытый канал: строка возврата, чтобы человек понимал, где он
            оказался и как выйти обратно к списку. */}
        {лента === "subs" && канал && (
          <div className="yt-channel-head">
            <button type="button" onClick={() => setКанал(null)} className="yt-back">
              ←{" "}
              {t("videra.gallery.backToChannels", {
                defaultValue: "Все каналы",
              })}
            </button>
            <span className="yt-channel-name">{канал.name}</span>
          </div>
        )}

        {/* Подписки: сначала каналы, а не их ролики вперемешку. */}
        {лента === "subs" && !канал && (
          <>
            {каналы.length === 0 && (
              <div className="yt-empty">
                {t("videra.gallery.emptySubs", {
                  defaultValue:
                    "Здесь появятся ролики каналов, на которые вы подпишетесь.",
                })}
              </div>
            )}

            <div className="yt-channels">
              {каналы.map((к) => (
                <button
                  key={`${к.channelType}:${к.channelId}`}
                  type="button"
                  onClick={() => setКанал(к)}
                  className="yt-channel"
                >
                  <span className="yt-channel-ava">
                    {(к.name || "D").trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="yt-channel-body">
                    <span className="yt-channel-title">{к.name}</span>
                    <span className="yt-channel-sub">
                      {t("videra.gallery.channelVideos", {
                        count: к.videos,
                        defaultValue: "{{count}} роликов",
                      })}
                      {к.lastTitle ? ` · ${к.lastTitle}` : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="yt-grid">
          {(ролики || []).map((р) => (
            <Link key={р._id} to={`/videos/${р._id}`} className="yt-card">
              <div className="yt-thumb">
                {р.posterUrl ? (
                  <img src={р.posterUrl} alt="" loading="lazy" />
                ) : (
                  <div className="yt-thumb-empty" />
                )}
                {р.media?.durationSec > 0 && (
                  <span className="yt-dur">{длительностью(р.media.durationSec)}</span>
                )}
              </div>
              <div className="yt-info">
                <div className="yt-ava" aria-hidden="true">
                  {(р.authorName || "D").trim().charAt(0).toUpperCase()}
                </div>
                <div className="yt-text">
                  <div className="yt-title">{р.title}</div>
                  <div className="yt-author">{р.authorName || "DocPats"}</div>
                  <div className="yt-stats">
                    {просмотрами(р.stats?.views, t)}
                    {р.publishedAt ? ` · ${давностью(р.publishedAt, t)}` : ""}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

/* Раскладка целиком в CSS: сетка, обрезка названия в две строки, липкое
   боковое меню и наведение через inline-стили не выражаются. Палитра
   нейтральная — белый лист, почти чёрный текст, серый вторичный: так
   выглядит любая лента видео, и спорить с этой привычкой незачем. */
const CSS = `
.yt { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 0; background: #fff; color: #0f0f0f; }
.yt-top { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
.yt-brand { display: flex; align-items: center; gap: 6px; font-size: 20px; font-weight: 800; letter-spacing: -.5px; color: #0f0f0f; text-decoration: none; white-space: nowrap; }
.yt-brand-mark { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 19px; background: #cc0000; color: #fff; border-radius: 5px; font-size: 11px; }
.yt-top .yt-search { flex: 1; margin: 0; }
.yt-bell-wrap { position: relative; }
.yt-bell { position: relative; border: 1px solid #e5e5e5; background: #fff; border-radius: 50%; width: 40px; height: 40px; font-size: 17px; cursor: pointer; }
.yt-bell:hover { background: #f2f2f2; }
.yt-bell-dot { position: absolute; top: -4px; right: -4px; background: #cc0000; color: #fff; border-radius: 10px; font-size: 10px; font-weight: 700; padding: 1px 5px; }
.yt-bell-veil { position: fixed; inset: 0; z-index: 40; }
.yt-bell-panel { position: absolute; right: 0; top: 46px; width: 360px; max-width: 90vw; max-height: 70vh; overflow-y: auto; background: #fff; border: 1px solid #e5e5e5; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,.16); z-index: 41; }
@media (max-width: 700px) { .yt-brand span:last-child { display: none; } }
.yt-side { position: sticky; top: 0; align-self: start; padding: 12px 8px; max-height: 100vh; overflow-y: auto; }
.yt-side-item { display: flex; align-items: center; gap: 14px; padding: 9px 12px; border-radius: 10px; text-decoration: none; color: #0f0f0f; font-size: 14px; width: 100%; box-sizing: border-box; }
.yt-side-item:hover { background: #f2f2f2; }
.yt-side-item.is-active { background: #f2f2f2; font-weight: 600; }
.yt-side-btn { border: none; background: none; font: inherit; text-align: left; cursor: pointer; }
.yt-side-ico { width: 22px; text-align: center; font-size: 15px; }
.yt-side-sep { height: 1px; background: #e5e5e5; margin: 12px 8px; }
.yt-side-head { font-size: 15px; font-weight: 700; padding: 6px 12px; }
/* Приглашение гостю. Не кричит: человек пришёл смотреть, а
   не регистрироваться, — но если захочет, путь виден. */
.yt-invite { padding: 12px; margin: 4px 8px 8px; border: 1px solid #e5e5e5; border-radius: 12px; background: #fafafa; }
.yt-invite-title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
.yt-invite-text { font-size: 12px; line-height: 1.5; color: #606060; margin-bottom: 10px; }
.yt-invite-go { display: inline-block; background: #0f0f0f; color: #fff; border-radius: 16px; padding: 7px 14px; font-size: 13px; font-weight: 700; text-decoration: none; }
.yt-invite-go:hover { opacity: .85; }
.yt-invite-plans { display: inline-block; margin-left: 10px; font-size: 13px; font-weight: 600; color: #0e8478; text-decoration: none; }
.yt-invite-plans:hover { text-decoration: underline; }
.yt-side-foot { padding: 8px 12px; font-size: 12px; color: #909090; line-height: 1.5; }

.yt-main { padding: 12px 24px 64px; min-width: 0; }
.yt-search { display: flex; max-width: 560px; margin: 0 auto 16px; }
.yt-search input { flex: 1; border: 1px solid #ccc; border-right: none; border-radius: 20px 0 0 20px; padding: 9px 16px; font-size: 15px; font: inherit; min-width: 0; }
.yt-search button { border: 1px solid #ccc; background: #f8f8f8; border-radius: 0 20px 20px 0; padding: 9px 20px; cursor: pointer; font-size: 15px; }

.yt-chips { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 24px; }
.yt-chips::-webkit-scrollbar { height: 0; }
.yt-chip { border: none; background: #f2f2f2; color: #0f0f0f; border-radius: 8px; padding: 8px 12px; font-size: 14px; cursor: pointer; white-space: nowrap; font: inherit; }
.yt-chip.is-active { background: #0f0f0f; color: #fff; }

.yt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 40px 16px; }
.yt-card { text-decoration: none; color: inherit; display: block; }
.yt-thumb { position: relative; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #0f0f0f; }
.yt-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.yt-thumb-empty { width: 100%; height: 100%; background: #1f1f1f; }
.yt-dur { position: absolute; right: 8px; bottom: 8px; background: rgba(0,0,0,.8); color: #fff; font-size: 12px; font-weight: 500; padding: 3px 4px; border-radius: 4px; line-height: 1.2; font-variant-numeric: tabular-nums; }
.yt-info { display: flex; gap: 12px; margin-top: 12px; }
.yt-ava { width: 36px; height: 36px; border-radius: 50%; background: #0e8478; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px; flex-shrink: 0; }
.yt-text { min-width: 0; }
.yt-title { font-size: 16px; font-weight: 600; line-height: 1.4; color: #0f0f0f; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.yt-author { font-size: 14px; color: #606060; margin-top: 4px; }
.yt-stats { font-size: 14px; color: #606060; }
.yt-empty { padding: 60px 0; text-align: center; color: #606060; }
.yt-channels { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-bottom: 24px; }
.yt-channel { display: flex; align-items: center; gap: 12px; text-align: left; padding: 12px; border: 1px solid #e5e5e5; border-radius: 12px; background: #fff; cursor: pointer; font: inherit; }
.yt-channel:hover { background: #f8f8f8; }
.yt-channel-ava { flex: 0 0 44px; height: 44px; border-radius: 50%; background: #0e8478; color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 18px; }
.yt-channel-body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.yt-channel-title { font-weight: 600; font-size: 15px; }
.yt-channel-sub { font-size: 12px; color: #606060; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.yt-channel-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.yt-back { border: none; background: #f2f2f2; border-radius: 16px; padding: 7px 14px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.yt-back:hover { background: #e5e5e5; }
.yt-channel-name { font-size: 18px; font-weight: 700; }

@media (max-width: 1000px) {
  .yt { grid-template-columns: 1fr; }
  .yt-side { display: none; }
  .yt-main { padding: 12px 16px 64px; }
}

/* УЗКИЙ ЭКРАН. Карточка шириной от 300px плюс отступы не
   помещалась в телефон, и страница ехала вбок: горизонтальная
   прокрутка на витрине выглядит как поломка, а не как замысел. */
@media (max-width: 700px) {
  .yt { overflow-x: hidden; }
  .yt-main { padding: 10px 12px 56px; }
  .yt-grid { grid-template-columns: 1fr; gap: 26px 0; }
  /* Шапка в две строки: имя и колокольчик сверху, поиск под
     ними во всю ширину — в одну строку они не живут. */
  .yt-top { flex-wrap: wrap; gap: 10px; }
  .yt-top .yt-search { order: 3; flex: 1 1 100%; max-width: none; }
  .yt-bell-wrap { margin-left: auto; }
  .yt-chips { gap: 8px; margin-bottom: 18px; }
  .yt-card-body { gap: 10px; }
}
`;
