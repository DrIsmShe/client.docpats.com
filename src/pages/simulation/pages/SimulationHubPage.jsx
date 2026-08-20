// client/src/pages/simulation/pages/SimulationHubPage.jsx
//
// Витрина раздела «Моделирование»: врач выбирает, каким инструментом работать.
//
// Два варианта — это НЕ «старая и новая версия» и не разные области тела. Они
// отличаются способом работы, и названия отражают именно это:
//
//   Вариант 1 (/dp/simulation/face)   — PlanListPage: план строится по ОДНОМУ
//     снимку. Ориентиры, оси симметрии, локальное изменение формы.
//   Вариант 2 (/dp/simulation/breast) — BreastListPage: план собирается из
//     НЕСКОЛЬКИХ проекций одного пациента (анфас, профиль, 3/4, снизу) и
//     группируется по пациенту — объём и контур видны со всех сторон.
//
// Формулировки взяты из самих страниц, а не придуманы: обещать в витрине то,
// чего внутри нет, — худший вид «красивого» интерфейса.
//
// Карточек «скоро» здесь нет намеренно: кнопка, которую нельзя нажать, только
// занимает место.
//
// Расширение: добавить вариант = запись в VARIANTS + ключи в
// public/locales/*/Simulation.json.

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "./SimulationHubPage.module.css";

/* ─── Иконки ───────────────────────────────────────────────────────────
   Линейные SVG вместо эмодзи: эмодзи рисует системный шрифт, и в Windows,
   macOS и Android одна и та же карточка выглядит по-разному. */
const IconSinglePhoto = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="12" cy="11" r="3.2" />
    <path d="M12 4v3.8M12 14.2V20M3 11h5.8M15.2 11H21" strokeDasharray="1.5 2.5" />
  </svg>
);

const IconMultiView = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="6" width="11" height="13" rx="2.5" />
    <path d="M16 7.5h3.5a2 2 0 0 1 2 2V17" />
    <path d="M13.5 4.5h3.2a2 2 0 0 1 2 2v1" opacity="0.55" />
    <path d="M6 15.5l2.2-2.6 2 2.2 1.6-1.9" />
  </svg>
);

// Текст, превращающийся в измеримые величины: строки слева, шкала справа.
const IconPromptToPlan = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h8M3 10h6M3 14h8M3 18h5" />
    <path d="M14.5 12h6.5" opacity="0.55" />
    <circle cx="17" cy="12" r="1.9" />
    <path d="M14.5 7h6.5M14.5 17h6.5" opacity="0.55" />
    <circle cx="19.6" cy="7" r="1.4" />
    <circle cx="16.2" cy="17" r="1.4" />
  </svg>
);

const IconArrow = () => (
  <svg className={styles.cardArrow} width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5" />
  </svg>
);

const IconInfo = () => (
  <svg className={styles.noteIcon} width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
    aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.8v.4" />
  </svg>
);

/* ─── Варианты ─────────────────────────────────────────────────────────
   chips — короткие ярлыки возможностей; каждый соответствует тому, что
   действительно есть внутри соответствующего редактора. */
const VARIANTS = [
  {
    key: "variant1",
    route: "/dp/simulation/face",
    Icon: IconSinglePhoto,
    alt: false,
    kickerDefault: "Вариант 1",
    titleDefault: "Один снимок",
    leadDefault:
      "План по одной фотографии: ориентиры, оси симметрии и точная правка формы. Когда нужно быстро показать пациенту суть вмешательства.",
    chipsDefault: ["Ринопластика", "Ментопластика", "Симметрия", "До / после"],
  },
  {
    key: "variant2",
    route: "/dp/simulation/breast",
    Icon: IconMultiView,
    alt: true,
    kickerDefault: "Вариант 2",
    titleDefault: "Серия проекций",
    leadDefault:
      "План из нескольких снимков одного пациента — анфас, профиль, три четверти, снизу. Объём и контур видны со всех сторон, планы собраны по пациенту.",
    chipsDefault: [
      "Несколько проекций",
      "Объём и контур",
      "История по пациенту",
      "До / после",
    ],
  },
  {
    key: "variant3",
    route: "/dp/simulation/plan",
    Icon: IconPromptToPlan,
    alt: false,
    kickerDefault: "Вариант 3 · прототип",
    titleDefault: "Запрос словами",
    leadDefault:
      "Опишите желаемый результат обычными словами — система разложит запрос по каталогу операций, посчитает измерения «до/после» и скажет, чего в запросе не хватило. Дальше план правится ползунками.",
    chipsDefault: [
      "Свободный текст",
      "Миллиметры и градусы",
      "Таблица до / после",
      "Ринопластика, профиль",
    ],
  },
];

const STEPS = [
  { key: "photo", defaultValue: "Загрузите снимки пациента" },
  { key: "marks", defaultValue: "Расставьте ориентиры" },
  { key: "compare", defaultValue: "Сравните «до» и «после»" },
];

const SimulationHubPage = () => {
  const { t } = useTranslation("Simulation");

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>
          {t("simulation.hub.eyebrow", { defaultValue: "Виртуальная пластика" })}
        </span>
        <h1 className={styles.heroTitle}>
          {t("simulation.hub.title", { defaultValue: "Моделирование" })}
        </h1>
        <p className={styles.heroLead}>
          {t("simulation.hub.lead", {
            defaultValue:
              "Ринопластика, ментопластика, пластика лица и других частей тела, оценка симметрии — анализ по фотографии и симуляция результата операции. Выберите, как будете работать.",
          })}
        </p>

        <div className={styles.steps}>
          {STEPS.map((step, i) => (
            <div className={styles.step} key={step.key}>
              <span className={styles.stepNum}>{i + 1}</span>
              {t(`simulation.hub.steps.${step.key}`, {
                defaultValue: step.defaultValue,
              })}
            </div>
          ))}
        </div>
      </section>

      <div className={styles.grid}>
        {VARIANTS.map((v) => {
          // Ярлыки берём массивом целиком (returnObjects), а не по индексам:
          // так не зависим от того, как i18next разбирает путь с числом.
          // Если перевода нет или он не массив — показываем значения по
          // умолчанию, а не пустую строку.
          const translated = t(`simulation.hub.${v.key}.chips`, {
            returnObjects: true,
            defaultValue: v.chipsDefault,
          });
          const chips = Array.isArray(translated) ? translated : v.chipsDefault;

          return (
            <Link
              key={v.key}
              to={v.route}
              className={`${styles.card} ${v.alt ? styles["card--alt"] : ""}`}
            >
              <div className={styles.cardIcon}>
                <v.Icon />
              </div>

              <div className={styles.cardKicker}>
                {t(`simulation.hub.${v.key}.kicker`, {
                  defaultValue: v.kickerDefault,
                })}
              </div>
              <h2 className={styles.cardTitle}>
                {t(`simulation.hub.${v.key}.title`, {
                  defaultValue: v.titleDefault,
                })}
              </h2>
              <p className={styles.cardLead}>
                {t(`simulation.hub.${v.key}.lead`, {
                  defaultValue: v.leadDefault,
                })}
              </p>

              <div className={styles.chips}>
                {chips.map((chip) => (
                  <span className={styles.chip} key={chip}>
                    {chip}
                  </span>
                ))}
              </div>

              <span className={styles.cardAction}>
                {t("simulation.hub.open", { defaultValue: "Перейти к планам" })}
                <IconArrow />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Медицинская оговорка: симуляция показывает замысел операции, а не её
          исход. Пациент видит эти картинки, и это должно быть написано, а не
          подразумеваться. */}
      <div className={styles.note}>
        <IconInfo />
        <span>
          {t("simulation.hub.note", {
            defaultValue:
              "Симуляция иллюстрирует план вмешательства и не является гарантией результата: итог зависит от анатомии, состояния тканей и заживления.",
          })}
        </span>
      </div>
    </div>
  );
};

export default SimulationHubPage;
