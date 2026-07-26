// client/src/pages/simulation/SimulationHubPage.jsx
//
// Hub-страница "Моделирование" с выбором варианта симулятора.
//
// Два варианта одного и того же инструмента: виртуальная пластика лица и
// других частей тела. Врач выбирает, в каком варианте работать, — поэтому
// карточки называются «Вариант 1» и «Вариант 2», а не по областям тела.
//
// Карточек «скоро» здесь нет намеренно: обещания в интерфейсе, которые
// нельзя нажать, только занимают место и вызывают вопросы.
//
// Расширение: добавить вариант = добавить запись в SIMULATION_TYPES.

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const styles = {
  page: {
    padding: "32px 24px",
    maxWidth: 1100,
    margin: "0 auto",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#1a1d1f",
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    margin: 0,
    color: "#0d6b5e",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: 14,
    color: "#7089a6",
    marginTop: 6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 16,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "20px 22px",
    background: "white",
    border: "1px solid #dde4ec",
    borderRadius: 12,
    textDecoration: "none",
    color: "inherit",
    transition: "all 0.2s ease",
    cursor: "pointer",
    minHeight: 160,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: "linear-gradient(135deg,#e8f7f5 0%,#a3ddd5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // В плитке теперь номер варианта, а не эмодзи: нужен вес и цвет, иначе
    // цифра выглядит случайной.
    fontSize: 22,
    fontWeight: 700,
    color: "#0d6b5e",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: "#7089a6",
    margin: 0,
    lineHeight: 1.45,
  },
};

/* ──────────────────────────────────────────────────────────────────────────
   Варианты симулятора. Описание у них одно и то же — отличается только
   вариант реализации, и честнее сказать об этом прямо, чем придумывать двум
   картам разные обещания.

   Маршруты остались прежними (face/breast): это те же две рабочие страницы,
   поменялась только их подача врачу.
   ────────────────────────────────────────────────────────────────────────── */
const VARIANT_DESCRIPTION =
  "Ринопластика, ментопластика, виртуальная пластика лица и других частей " +
  "тела, симметрия — анализ и симуляция операций.";

const SIMULATION_TYPES = [
  {
    key: "variant1",
    // Цифра вместо пиктограммы: карточки различаются только номером варианта,
    // и любая «говорящая» иконка обещала бы разницу, которой нет.
    icon: "1",
    titleKey: "simulation.hub.variant1.title",
    titleDefault: "Вариант 1",
    descKey: "simulation.hub.variant1.description",
    descDefault: VARIANT_DESCRIPTION,
    route: "/dp/simulation/face",
  },
  {
    key: "variant2",
    icon: "2",
    titleKey: "simulation.hub.variant2.title",
    titleDefault: "Вариант 2",
    descKey: "simulation.hub.variant2.description",
    descDefault: VARIANT_DESCRIPTION,
    route: "/dp/simulation/breast",
  },
];

const SimulationHubPage = () => {
  const { t } = useTranslation("Simulation");

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          {t("simulation.hub.title", { defaultValue: "Моделирование" })}
        </h1>
        <div style={styles.subtitle}>
          {t("simulation.hub.subtitle", {
            defaultValue: "Выберите тип симуляции",
          })}
        </div>
      </div>

      <div style={styles.grid}>
        {SIMULATION_TYPES.map((type) => {
          const title = t(type.titleKey, { defaultValue: type.titleDefault });
          const description = t(type.descKey, {
            defaultValue: type.descDefault,
          });

          return (
            <Link
              key={type.key}
              to={type.route}
              style={styles.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#0d6b5e";
                e.currentTarget.style.boxShadow =
                  "0 4px 14px rgba(13,107,94,.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#dde4ec";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={styles.cardIcon}>{type.icon}</div>
              <h3 style={styles.cardTitle}>{title}</h3>
              <p style={styles.cardDescription}>{description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SimulationHubPage;
