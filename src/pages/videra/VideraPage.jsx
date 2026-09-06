// Вход в студию медицинских фильмов DP-Videra.
//
// ОДНА СТРАНИЦА НА ДВЕ ЗОНЫ. Врач и пациент видят одно и то же: фильм
// объясняет болезнь и вмешательство, и право снять его одинаковое. Разницу
// в тарифе студия читает из пропуска сама.
//
// ПРОПУСК ЗАКАЗЫВАЕТСЯ В МОМЕНТ НАЖАТИЯ, А НЕ ПРИ ОТКРЫТИИ СТРАНИЦЫ. Он
// живёт пять минут: заготовленный заранее протухнет, пока человек читает
// то, что написано ниже.
//
// СТУДИЯ ОТКРЫВАЕТСЯ В НОВОЙ ВКЛАДКЕ. Работа в ней длинная, и терять из-за
// неё кабинет незачем.
//
// ОФОРМЛЕНИЕ — ПОД КАБИНЕТ, А НЕ ЛЕНДИНГ. Страница живёт внутри приложения
// (шапка, меню, светлая тема), и человек здесь уже вошёл. Поэтому никаких
// «зарегистрироваться/прайс» — только показать, что умеет студия, и дать
// рабочую кнопку. Кадры — настоящие структуры из библиотеки (public/videra).

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuClapperboard, LuExternalLink } from "react-icons/lu";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;
const PUB = process.env.PUBLIC_URL || "";

const FRAMES = [
  { img: "heart.png", nameKey: "videra.f.heart", rubricKey: "videra.r.cardio" },
  { img: "brain.png", nameKey: "videra.f.brain", rubricKey: "videra.r.nervous" },
  { img: "lung.png", nameKey: "videra.f.lung", rubricKey: "videra.r.resp" },
  { img: "skull.png", nameKey: "videra.f.skull", rubricKey: "videra.r.skeletal" },
];

const STEPS = ["step1", "step2", "step3"];
const CANS = ["can1", "can2", "can3", "can4"];

export default function VideraPage() {
  const { t } = useTranslation();
  const [готова, setГотова] = useState(null); // null — ещё не спросили
  const [идёт, setИдёт] = useState(false);
  const [беда, setБеда] = useState("");

  // Спрашиваем отдельно и заранее: если ключа на сервере нет, кнопка вела
  // бы в никуда. Лучше сказать об этом сразу, чем после нажатия.
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
      // noopener — обязательно: открытая вкладка иначе получает доступ к
      // window.opener кабинета.
      window.open(о.data.url, "_blank", "noopener,noreferrer");
    } catch {
      setБеда(
        t("videra.failed", {
          defaultValue: "Не удалось открыть студию. Попробуйте ещё раз.",
        }),
      );
    } finally {
      setИдёт(false);
    }
  };

  const Кнопка = (
    <button
      type="button"
      className="btn btn-primary"
      onClick={открыть}
      disabled={готова !== true || идёт}
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      <LuExternalLink />
      {идёт
        ? t("videra.opening", { defaultValue: "Открываем…" })
        : t("videra.open", { defaultValue: "Снять фильм" })}
    </button>
  );

  return (
    <div className="videra-page">
      <style>{CSS}</style>

      {/* ── Герой ── */}
      <header className="vp-hero">
        <div className="vp-eyebrow">
          <LuClapperboard />
          {t("videra.eyebrow", { defaultValue: "Студия медицинских фильмов" })}
        </div>
        <h1 className="vp-h1">
          {t("videra.headline", {
            defaultValue: "Показать то, что не рассказать словами",
          })}
        </h1>
        <p className="vp-lede">
          {t("videra.lede", {
            defaultValue:
              "Соберите короткий фильм, где анатомия двигается и объясняет — " +
              "пациенту, студенту или коллегам. Озвучку и сборку студия берёт на себя.",
          })}
        </p>

        <div className="vp-cta">{Кнопка}</div>
        <p className="vp-note">
          {t("videra.free", {
            defaultValue:
              "Первые три фильма — бесплатно, без ограничения по сроку.",
          })}
        </p>

        {готова === false && (
          <p className="vp-alert">
            {t("videra.off", {
              defaultValue: "Студия сейчас недоступна. Мы уже знаем об этом.",
            })}
          </p>
        )}
        {беда && <p className="vp-alert">{беда}</p>}
      </header>

      {/* ── Плёнка: настоящие структуры из библиотеки ── */}
      <section className="vp-reel">
        {FRAMES.map((f) => (
          <figure className="vp-frame" key={f.img}>
            <div className="vp-stage">
              <img src={`${PUB}/videra/${f.img}`} alt={t(f.nameKey)} loading="lazy" />
            </div>
            <figcaption>
              <span className="vp-name">{t(f.nameKey)}</span>
              <span className="vp-rubric">{t(f.rubricKey)}</span>
            </figcaption>
          </figure>
        ))}
        <p className="vp-reel-note">
          {t("videra.reelNote", {
            defaultValue:
              "Готовые структуры из библиотеки — 6 500 моделей по системам тела.",
          })}
        </p>
      </section>

      {/* ── Три шага ── */}
      <section className="vp-block">
        <h2 className="vp-h2">{t("videra.stepsTitle", { defaultValue: "Три шага" })}</h2>
        <ol className="vp-steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <span className="vp-num">{i + 1}</span>
              <div>
                <h3>{t(`videra.${s}.h`)}</h3>
                <p>{t(`videra.${s}.p`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Что умеет ── */}
      <section className="vp-block">
        <h2 className="vp-h2">{t("videra.canTitle", { defaultValue: "Что умеет" })}</h2>
        <ul className="vp-cans">
          {CANS.map((c) => (
            <li key={c}>
              <h3>{t(`videra.${c}.h`)}</h3>
              <p>{t(`videra.${c}.p`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="vp-foot-cta">{Кнопка}</div>
    </div>
  );
}

const CSS = `
.videra-page { max-width: 980px; margin: 0 auto; padding: 24px 16px 48px; }
.videra-page * { box-sizing: border-box; }
.vp-hero { padding: 8px 0 28px; }
.vp-eyebrow { display: inline-flex; align-items: center; gap: 8px;
  color: #0f766e; font-weight: 600; font-size: 13px; letter-spacing: .04em;
  text-transform: uppercase; }
.vp-h1 { font-size: clamp(26px, 4vw, 38px); line-height: 1.15; margin: 12px 0 0;
  font-weight: 700; color: #0f2b2a; text-wrap: balance; }
.vp-lede { max-width: 62ch; color: #475569; font-size: 16px; line-height: 1.6;
  margin: 14px 0 22px; }
.vp-cta { display: flex; gap: 12px; flex-wrap: wrap; }
.vp-note { color: #0f766e; font-size: 13.5px; margin: 12px 0 0; }
.vp-alert { color: #c0392b; font-size: 14px; margin: 10px 0 0; }

.vp-reel { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px; margin: 8px 0 40px; }
.vp-frame { margin: 0; border: 1px solid #e6ebf0; border-radius: 14px;
  background: #fff; overflow: hidden; box-shadow: 0 1px 2px rgba(15,43,42,.04); }
.vp-stage { aspect-ratio: 4/3; display: grid; place-items: center;
  background: radial-gradient(60% 60% at 50% 42%, #f1f6f5, #fbfcfd); }
.vp-stage img { width: 82%; height: 82%; object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(15,43,42,.14)); }
.vp-frame figcaption { display: flex; flex-direction: column; gap: 2px;
  padding: 11px 13px; border-top: 1px solid #eef2f5; }
.vp-name { font-weight: 600; color: #0f2b2a; font-size: 14.5px; }
.vp-rubric { color: #64748b; font-size: 12.5px; }
.vp-reel-note { grid-column: 1/-1; text-align: center; color: #64748b;
  font-size: 12.5px; margin: 2px 0 0; }

.vp-block { margin: 0 0 40px; }
.vp-h2 { font-size: 20px; font-weight: 700; color: #0f2b2a; margin: 0 0 18px; }
.vp-steps { list-style: none; padding: 0; margin: 0; display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
.vp-steps li { display: flex; gap: 14px; }
.vp-num { flex: none; width: 30px; height: 30px; border-radius: 50%;
  background: #0f766e; color: #fff; display: grid; place-items: center;
  font-weight: 700; font-size: 14px; }
.vp-steps h3, .vp-cans h3 { font-size: 15.5px; font-weight: 600; margin: 2px 0 4px;
  color: #0f2b2a; }
.vp-steps p, .vp-cans p { margin: 0; color: #475569; font-size: 14px; line-height: 1.5; }

.vp-cans { list-style: none; padding: 0; margin: 0; display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.vp-cans li { padding: 16px 18px; border: 1px solid #e6ebf0; border-radius: 12px;
  background: #fff; }

.vp-foot-cta { display: flex; justify-content: center; padding: 8px 0 0; }
`;
