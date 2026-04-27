// src/pages/simulation/components/MenuLink.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

/* ──────────────────────────────────────────────────────────────────────────
   Готовый пункт меню для sidebar/header. Импорти в главную навигацию
   там, где удобно.
   ────────────────────────────────────────────────────────────────────────── */
export default function SimulationMenuLink({ className, activeClassName }) {
  const { t } = useTranslation("Simulation");

  return (
    <NavLink
      to="/simulation"
      className={({ isActive }) =>
        isActive
          ? `${className || ""} ${activeClassName || ""}`
          : className || ""
      }
    >
      <span style={{ marginInlineEnd: 8 }}>🎨</span>
      {t("menuItem")}
    </NavLink>
  );
}
