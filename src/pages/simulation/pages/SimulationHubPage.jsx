// client/src/pages/simulation/SimulationHubPage.jsx
//
// S.8 Phase 3A — Hub-страница "Моделирование" с выбором типа.
//
// Пользователь видит карточки доступных типов симуляции:
//   • Лицо (face)         — рабочая
//   • Грудь (breast)      — рабочая, новая (S.8)
//   • Талия / Руки / ...  — Coming soon (для будущего)
//
// Расширение: добавить новый тип = добавить запись в SIMULATION_TYPES.

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
  cardDisabled: {
    cursor: "not-allowed",
    opacity: 0.55,
    background: "#f4f7f9",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: "linear-gradient(135deg,#e8f7f5 0%,#a3ddd5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    marginBottom: 14,
  },
  cardIconDisabled: {
    background: "#e8eaed",
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
  cardBadge: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "3px 8px",
    borderRadius: 100,
    marginBottom: 10,
    background: "#fff8e1",
    color: "#856404",
    border: "1px solid #ffe082",
  },
  cardBadgeAvailable: {
    background: "#e8f7f5",
    color: "#0d6b5e",
    border: "1px solid #a3ddd5",
  },
};

/* ──────────────────────────────────────────────────────────────────────────
   Список доступных типов симуляции.
   Чтобы добавить новый тип — добавь сюда запись.
   ────────────────────────────────────────────────────────────────────────── */
const SIMULATION_TYPES = [
  {
    key: "face",
    icon: "👤",
    titleKey: "simulation.hub.face.title",
    titleDefault: "Моделирование лица",
    descKey: "simulation.hub.face.description",
    descDefault:
      "Ринопластика, ментопластика, симметрия — анализ и симуляция операций на лице",
    route: "/dp/simulation/face",
    available: true,
  },
  {
    key: "breast",
    icon: "♀",
    titleKey: "simulation.hub.breast.title",
    titleDefault: "Моделирование груди",
    descKey: "simulation.hub.breast.description",
    descDefault:
      "Аугментация, редукция, мастопексия — симуляция операций на груди",
    route: "/dp/simulation/breast",
    available: true,
    isNew: true,
  },
  {
    key: "abdomen",
    icon: "⬛",
    titleKey: "simulation.hub.abdomen.title",
    titleDefault: "Моделирование талии",
    descKey: "simulation.hub.abdomen.description",
    descDefault: "Абдоминопластика, липосакция — скоро",
    route: "/dp/simulation/abdomen",
    available: false,
  },
  {
    key: "arms",
    icon: "💪",
    titleKey: "simulation.hub.arms.title",
    titleDefault: "Моделирование рук",
    descKey: "simulation.hub.arms.description",
    descDefault: "Брахиопластика — скоро",
    route: "/dp/simulation/arms",
    available: false,
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

          if (!type.available) {
            return (
              <div
                key={type.key}
                style={{ ...styles.card, ...styles.cardDisabled }}
                aria-disabled="true"
              >
                <div style={{ ...styles.cardIcon, ...styles.cardIconDisabled }}>
                  {type.icon}
                </div>
                <span style={styles.cardBadge}>
                  {t("simulation.hub.comingSoon", {
                    defaultValue: "Скоро",
                  })}
                </span>
                <h3 style={styles.cardTitle}>{title}</h3>
                <p style={styles.cardDescription}>{description}</p>
              </div>
            );
          }

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
              {type.isNew && (
                <span
                  style={{ ...styles.cardBadge, ...styles.cardBadgeAvailable }}
                >
                  {t("simulation.hub.new", { defaultValue: "Новое" })}
                </span>
              )}
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
