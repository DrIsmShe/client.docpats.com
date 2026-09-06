// Вход в студию медицинских фильмов DP-Videra — страница-презентация.
//
// ОДНА СТРАНИЦА НА ДВЕ ЗОНЫ. Врач и пациент видят одно и то же: фильм
// объясняет болезнь и вмешательство, и право снять его одинаковое. Разницу
// в тарифе студия читает из пропуска сама.
//
// ПРОПУСК ЗАКАЗЫВАЕТСЯ В МОМЕНТ НАЖАТИЯ. Он живёт пять минут: заготовленный
// заранее протухнет, пока человек читает. СТУДИЯ ОТКРЫВАЕТСЯ В НОВОЙ ВКЛАДКЕ.
//
// ДИЗАЙН — ТЁМНАЯ КИНОПРЕЗЕНТАЦИЯ (как макет-артефакт). Все кнопки «Открыть
// студию» ведут не по ссылке, а через настоящий заказ пропуска (открыть):
// человек уже в кабинете, повторный вход не нужен. Классы с префиксом vd-,
// стиль замкнут в .vd — чтобы тёмная тема не текла в кабинет и не сталкивалась
// с Bootstrap приложения. Кадры — статикой из public/videra.

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;
const PUB = process.env.PUBLIC_URL || "";
const GUIDE = "https://docpats.com/dp-videra/rukovodstvo.html";

const FRAMES = [
  { img: "heart.png", n: "videra.f.heart", r: "videra.r.cardio" },
  { img: "brain.png", n: "videra.f.brain", r: "videra.r.nervous" },
  { img: "lung.png", n: "videra.f.lung", r: "videra.r.resp" },
  { img: "skull.png", n: "videra.f.skull", r: "videra.r.skeletal" },
];

export default function VideraPage() {
  const { t } = useTranslation();
  const [готова, setГотова] = useState(null);
  const [идёт, setИдёт] = useState(false);
  const [беда, setБеда] = useState("");

  useEffect(() => {
    let живо = true;
    axios
      .get(`${API_BASE}/api/v1/videra/state`, { withCredentials: true })
      .then((о) => живо && setГотова(Boolean(о.data?.enabled)))
      .catch(() => живо && setГотова(false));
    return () => {
      живо = false;
    };
  }, []);

  const открыть = async () => {
    setИдёт(true);
    setБеда("");
    try {
      const о = await axios.get(`${API_BASE}/api/v1/videra/link`, {
        withCredentials: true,
      });
      window.open(о.data.url, "_blank", "noopener,noreferrer");
    } catch {
      setБеда(t("videra.failed", { defaultValue: "Не удалось открыть студию. Попробуйте ещё раз." }));
    } finally {
      setИдёт(false);
    }
  };

  // Кнопка запуска студии. Одна и та же логика во всех местах макета.
  const Studio = ({ ghost }) => (
    <button
      type="button"
      className={"vd-btn " + (ghost ? "vd-btn-ghost" : "vd-btn-main")}
      onClick={открыть}
      disabled={готова !== true || идёт}
    >
      {ghost ? "" : "▶ "}
      {идёт
        ? t("videra.opening", { defaultValue: "Открываем…" })
        : t("videra.studioOpen", { defaultValue: "Открыть студию" })}
    </button>
  );

  const WHO = [
    ["🧑‍⚕️", "aud1", "Пациенту", "Объяснить диагноз, подготовить к операции, показать, что происходит в теле. Он поймёт и запомнит — и меньше боится того, что увидел."],
    ["🎓", "aud2", "Студенту", "Разобрать анатомию, процесс, механизм действия. Уровень «студент» — свой текст и свои структуры, глубже, чем для пациента."],
    ["🖥️", "aud3", "На лекции и докладе", "Вставьте фильм в презентацию или откройте на экране. Движущаяся анатомия держит зал лучше статичного слайда."],
    ["📄", "aud4", "В статью и публикацию", "Встройте фильм прямо в материал одной строкой разметки — читатель смотрит, не уходя со страницы."],
    ["👥", "aud5", "Коллегам", "Покажите на консилиуме или разборе случая: сложную картину быстрее показать, чем описать словами."],
    ["🏥", "aud6", "В клинике", "На экране в кабинете или холле — короткие фильмы о частых состояниях, пока пациент ждёт приёма."],
  ];

  const CAPS = [
    ["big", "6 500", "cap1", "структур", "Анатомия, физиология, гистология, молекулы, клетки, микроскопические срезы — и ваши собственные снимки."],
    ["big", "5", "cap2", "языков разом", "Русский, английский, азербайджанский, турецкий, арабский. Один фильм — пять зрителей."],
    ["ic", "🎙️", "cap3", "Голос диктора", "Текст читает синтезатор речи — или запишите свой голос. Подписи ложатся поверх кадра сами."],
    ["ic", "🎬", "cap4", "Движение камеры", "Облёт, наезд, растворение тканей. Сложное показывается так, как не покажет ни один плоский рисунок."],
    ["ic", "🔗", "cap5", "Ссылка и встраивание", "Фильм открывается у пациента без всякого входа. Или встраивается прямо в статью и кабинет."],
    ["ic", "⚡", "cap6", "Без установки монтажа", "Не нужно уметь работать с видео. Собрали, нажали — получили готовый файл."],
  ];

  const STEPS = [
    ["Соберите сцену", "Найдите структуру в справочнике на шесть с половиной тысяч моделей, задайте движение камеры, впишите, что говорит диктор."],
    ["Снимите фильм", "Программа считает видео со звуком и подписями на вашей видеокарте. Двадцать секунд фильма — секунды работы."],
    ["Поделитесь", "Готовый фильм появляется на сайте сам. Отсюда — ссылка пациенту, скачивание или встраивание в вашу страницу."],
  ];

  const GET = [
    ["Откройте студию", "из кабинета DocPats — соберите первый фильм прямо в браузере."],
    ["Скачайте программу", "для отрисовки — она считает фильм видеокартой вашего компьютера."],
    ["Снимайте и делитесь", "— готовые фильмы сами приходят на эту страницу."],
  ];

  return (
    <div className="vd">
      <style>{CSS}</style>
      <div className="vd-wrap">
        <header className="vd-top">
          <div className="vd-logo">DP-Videra <span>студия</span></div>
          <Studio ghost />
        </header>
      </div>

      {/* Герой */}
      <div className="vd-hero">
        <div className="vd-wrap">
          <p className="vd-eyebrow">{t("videra.eyebrow", { defaultValue: "Медицинские объясняющие фильмы" })}</p>
          <h1 className="vd-h1">{t("videra.headline", { defaultValue: "Показать то, что не рассказать словами" })}</h1>
          <p className="vd-lede">
            {t("videra.lede", {
              defaultValue:
                "Врач собирает короткий фильм из трёхмерной анатомии — как устроено сердце, где проходит аорта, что делает грыжа. Чтобы объяснить пациенту, разобрать со студентом, показать на докладе коллегам. Тело видно, а не пересказано — и уметь работать с видеоредактором для этого не нужно.",
            })}
          </p>
          <div className="vd-cta">
            <Studio />
            <a className="vd-btn vd-btn-ghost" href={GUIDE} target="_blank" rel="noreferrer">
              {t("videra.howItWorks", { defaultValue: "Как это работает" })}
            </a>
          </div>
          <p className="vd-note">{t("videra.note", { defaultValue: "Открывается из вашего кабинета DocPats — второй пароль не нужен." })}</p>
          {готова === false && <p className="vd-alert">{t("videra.off", { defaultValue: "Студия сейчас недоступна. Мы уже знаем об этом." })}</p>}
          {беда && <p className="vd-alert">{беда}</p>}

          <div className="vd-reel">
            {FRAMES.map((f) => (
              <div className="vd-frame" key={f.img}>
                <div className="vd-stage">
                  <img src={`${PUB}/videra/${f.img}`} alt={t(f.n)} loading="lazy" />
                  <span className="vd-label">{t(f.n)}</span>
                </div>
                <div className="vd-meta"><span>{t(f.r)}</span><span>▶</span></div>
              </div>
            ))}
            <p className="vd-reel-note">{t("videra.reelNote", { defaultValue: "Готовые структуры из библиотеки DP-Videra — 6 500 моделей по системам тела." })}</p>
          </div>
        </div>
      </div>

      {/* Три шага */}
      <section className="vd-band">
        <div className="vd-wrap">
          <p className="vd-kicker">{t("videra.stepsKicker", { defaultValue: "Три шага" })}</p>
          <h2 className="vd-title">{t("videra.stepsTitle", { defaultValue: "От пустого экрана до фильма, который можно показать" })}</h2>
          <p className="vd-sub">{t("videra.stepsSub", { defaultValue: "Ни монтажа, ни рендер-ферм, ни ожидания. Всё считает видеокарта вашего компьютера — за секунды." })}</p>
          <div className="vd-steps">
            {STEPS.map(([h, p], i) => (
              <div className="vd-step" key={i}>
                <div className="vd-n">{i + 1}</div>
                <h3>{t(`videra.step${i + 1}.h`, { defaultValue: h })}</h3>
                <p>{t(`videra.step${i + 1}.p`, { defaultValue: p })}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Кому и для чего */}
      <section className="vd-band">
        <div className="vd-wrap">
          <p className="vd-kicker">{t("videra.whoKicker", { defaultValue: "Кому и для чего" })}</p>
          <h2 className="vd-title">{t("videra.whoTitle", { defaultValue: "Один фильм — много применений" })}</h2>
          <p className="vd-sub">{t("videra.whoSub", { defaultValue: "Собрали однажды — показываете где угодно: в кабинете, на лекции, в статье, по ссылке в мессенджере." })}</p>
          <div className="vd-who">
            {WHO.map(([ic, key, h, p]) => (
              <div className="vd-aud" key={key}>
                <div className="vd-ic">{ic}</div>
                <div>
                  <h3>{t(`videra.${key}.h`, { defaultValue: h })}</h3>
                  <p>{t(`videra.${key}.p`, { defaultValue: p })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Что умеет */}
      <section className="vd-band">
        <div className="vd-wrap">
          <p className="vd-kicker">{t("videra.capsKicker", { defaultValue: "Что умеет" })}</p>
          <h2 className="vd-title">{t("videra.capsTitle", { defaultValue: "Настоящая анатомия, а не картинки из интернета" })}</h2>
          <div className="vd-grid">
            {CAPS.map(([kind, top, key, h, p]) => (
              <div className="vd-cap" key={key}>
                {kind === "big" ? <div className="vd-big">{top}</div> : <div className="vd-cic">{top}</div>}
                <h3>{t(`videra.${key}.h`, { defaultValue: h })}</h3>
                <p>{t(`videra.${key}.p`, { defaultValue: p })}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Как получить */}
      <section className="vd-band">
        <div className="vd-wrap vd-get">
          <div className="vd-txt">
            <p className="vd-kicker">{t("videra.getKicker", { defaultValue: "Как получить" })}</p>
            <h2 className="vd-title">{t("videra.getTitle", { defaultValue: "Программа ставится за минуты" })}</h2>
            <ol>
              {GET.map(([b, p], i) => (
                <li key={i}><b>{t(`videra.get${i + 1}.b`, { defaultValue: b })}</b> {t(`videra.get${i + 1}.p`, { defaultValue: p })}</li>
              ))}
            </ol>
          </div>
          <div><Studio /></div>
        </div>
      </section>

      {/* Финал */}
      <div className="vd-final">
        <div className="vd-wrap">
          <span className="vd-pill">{t("videra.free", { defaultValue: "Первые фильмы — бесплатно" })}</span>
          <h2>{t("videra.finalH", { defaultValue: "Покажите — вместо того чтобы рассказывать." })}</h2>
          <Studio />
        </div>
      </div>

      <footer className="vd-footer">
        <div className="vd-wrap">
          <span>{t("videra.foot1", { defaultValue: "DP-Videra · студия медицинских фильмов в составе DocPats" })}</span>
          <span>{t("videra.foot2", { defaultValue: "Модели: BodyParts3D · Z-Anatomy · HuBMAP — открытые лицензии" })}</span>
        </div>
      </footer>
    </div>
  );
}

const CSS = `
.vd {
  --ground:#0e1319; --ground-2:#0b1016; --panel:#131a24; --line:#1f2836;
  --ink:#e9edf3; --dim:#8a94a6; --accent:#e2622f; --accent-soft:#ff8a4d;
  --bone:#e3dac4;
  --serif:"Spectral",Georgia,"Times New Roman",serif;
  --sans:"Manrope",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  background:var(--ground); color:var(--ink); font-family:var(--sans);
  line-height:1.6; margin:-16px -16px 0; border-radius:10px; overflow:hidden;
}
.vd * { box-sizing:border-box; }
.vd .vd-wrap { max-width:1080px; margin:0 auto; padding:0 24px; }

.vd .vd-btn { display:inline-flex; align-items:center; gap:9px; padding:13px 26px;
  border-radius:10px; font-weight:600; font-size:15px; font-family:var(--sans);
  text-decoration:none; border:1px solid transparent; cursor:pointer;
  transition:transform .12s ease, background .12s ease; }
.vd .vd-btn:hover:not(:disabled) { transform:translateY(-1px); }
.vd .vd-btn:disabled { opacity:.55; cursor:default; }
.vd .vd-btn-main { background:var(--accent); color:#fff; }
.vd .vd-btn-main:hover:not(:disabled) { background:var(--accent-soft); }
.vd .vd-btn-ghost { border-color:var(--line); color:var(--ink); background:transparent; }
.vd .vd-btn-ghost:hover:not(:disabled) { border-color:var(--dim); }

.vd .vd-top { display:flex; align-items:center; justify-content:space-between;
  padding:22px 0; border-bottom:1px solid var(--line); }
.vd .vd-logo { font-family:var(--serif); font-weight:700; font-size:22px; letter-spacing:.3px; }
.vd .vd-logo span { color:var(--accent); font-family:var(--sans); font-weight:600;
  font-size:13px; margin-left:8px; letter-spacing:1.5px; text-transform:uppercase; }

.vd .vd-hero { position:relative; padding:92px 0 78px; overflow:hidden; }
.vd .vd-hero::before { content:""; position:absolute; top:-180px; right:-140px;
  width:620px; height:620px; pointer-events:none;
  background:radial-gradient(circle, rgba(226,98,47,.20), rgba(226,98,47,0) 62%); }
.vd .vd-hero::after { content:""; position:absolute; bottom:-220px; left:-160px;
  width:560px; height:560px; pointer-events:none;
  background:radial-gradient(circle, rgba(168,68,63,.14), rgba(168,68,63,0) 60%); }
.vd .vd-eyebrow { color:var(--accent); font-weight:600; font-size:13px;
  letter-spacing:2px; text-transform:uppercase; margin:0 0 18px; }
.vd .vd-h1 { font-family:var(--serif); font-weight:700; font-size:clamp(34px,5.5vw,60px);
  line-height:1.06; letter-spacing:-.5px; margin:0 0 22px; text-wrap:balance; max-width:18ch; }
.vd .vd-lede { font-size:clamp(16px,2vw,19px); color:var(--dim); max-width:58ch; margin:0 0 30px; }
.vd .vd-cta { display:flex; flex-wrap:wrap; gap:12px; }
.vd .vd-note { margin-top:18px; color:var(--dim); font-size:13px; }
.vd .vd-alert { margin-top:12px; color:#ff8a75; font-size:14px; }

.vd .vd-reel { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
  gap:16px; margin-top:60px; }
.vd .vd-frame { border:1px solid var(--line); border-radius:12px; overflow:hidden;
  background:radial-gradient(120% 80% at 50% 20%, rgba(227,218,196,.06), transparent 60%), var(--panel); }
.vd .vd-stage { aspect-ratio:4/3; display:grid; place-items:center; position:relative;
  background:radial-gradient(60% 60% at 50% 42%, rgba(227,218,196,.10), transparent 70%); }
.vd .vd-stage img { width:84%; height:84%; object-fit:contain; display:block;
  filter:drop-shadow(0 12px 26px rgba(0,0,0,.55)); }
.vd .vd-label { position:absolute; left:12px; bottom:12px; background:rgba(14,19,25,.72);
  color:var(--ink); font-size:12px; padding:4px 9px; border-radius:6px; }
.vd .vd-meta { display:flex; justify-content:space-between; padding:11px 13px;
  font-size:12px; color:var(--dim); border-top:1px solid var(--line); }
.vd .vd-reel-note { grid-column:1/-1; text-align:center; color:var(--dim); font-size:12.5px; margin:4px 0 0; }

.vd .vd-band { padding:72px 0; border-top:1px solid var(--line); }
.vd .vd-kicker { color:var(--accent); font-size:13px; font-weight:600; letter-spacing:2px;
  text-transform:uppercase; margin:0 0 14px; }
.vd .vd-title { font-family:var(--serif); font-weight:700; font-size:clamp(24px,3.2vw,34px);
  margin:0 0 14px; letter-spacing:-.3px; text-wrap:balance; }
.vd .vd-sub { color:var(--dim); max-width:60ch; margin:0 0 40px; font-size:17px; }

.vd .vd-steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:20px; }
.vd .vd-step { padding:26px 22px; border:1px solid var(--line); border-radius:14px; background:var(--panel); }
.vd .vd-n { font-family:var(--serif); font-size:15px; font-weight:700; color:var(--accent);
  border:1px solid var(--accent); width:34px; height:34px; border-radius:50%;
  display:grid; place-items:center; margin-bottom:16px; }
.vd .vd-step h3 { font-size:18px; margin:0 0 8px; font-weight:600; }
.vd .vd-step p { margin:0; color:var(--dim); font-size:15px; }

.vd .vd-who { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:18px; }
.vd .vd-aud { display:flex; gap:16px; padding:22px; border:1px solid var(--line); border-radius:14px; background:var(--panel); }
.vd .vd-ic { font-size:26px; flex:none; line-height:1; margin-top:2px; }
.vd .vd-aud h3 { font-size:17px; margin:0 0 5px; font-weight:600; }
.vd .vd-aud p { margin:0; color:var(--dim); font-size:14.5px; }

.vd .vd-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:18px; }
.vd .vd-cap { padding:22px; border:1px solid var(--line); border-radius:14px;
  background:linear-gradient(180deg, var(--panel), var(--ground-2)); }
.vd .vd-cic { font-size:22px; margin-bottom:12px; }
.vd .vd-cap h3 { font-size:16px; margin:0 0 6px; font-weight:600; }
.vd .vd-cap p { margin:0; color:var(--dim); font-size:14.5px; }
.vd .vd-big { font-family:var(--serif); font-size:30px; font-weight:700; color:var(--bone); line-height:1; margin-bottom:6px; }

.vd .vd-get { display:flex; flex-wrap:wrap; gap:30px; align-items:center; justify-content:space-between; }
.vd .vd-txt { flex:1 1 340px; }
.vd .vd-get ol { margin:0; padding-left:20px; color:var(--dim); }
.vd .vd-get ol li { margin:8px 0; }
.vd .vd-get ol b { color:var(--ink); font-weight:600; }

.vd .vd-final { text-align:center; padding:84px 0; border-top:1px solid var(--line); }
.vd .vd-final h2 { font-family:var(--serif); font-size:clamp(26px,3.6vw,40px); margin:18px 0 26px; text-wrap:balance; }
.vd .vd-pill { display:inline-block; background:rgba(226,98,47,.12); color:var(--accent-soft);
  border:1px solid rgba(226,98,47,.3); border-radius:999px; padding:3px 12px; font-size:12px; font-weight:600; }

.vd .vd-footer { border-top:1px solid var(--line); padding:30px 0 44px; color:var(--dim); font-size:13px; }
.vd .vd-footer .vd-wrap { display:flex; flex-wrap:wrap; gap:12px; justify-content:space-between; }
`;
