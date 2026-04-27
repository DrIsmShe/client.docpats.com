import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";

export default function StickyHeader() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header
      className="docpats-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1030,
        backdropFilter: "blur(14px)",
        backgroundColor:
          theme === "dark"
            ? "rgba(5, 10, 25, 0.9)"
            : "rgba(255, 255, 255, 0.85)",
        borderBottom:
          theme === "dark"
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(0,0,0,0.05)",
      }}
    >
      <div className="container py-2 d-flex align-items-center justify-content-between">
        <div
          className="d-flex align-items-center"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <span
            className="fw-bold me-2"
            style={{ color: "#0d6efd", fontSize: "1.3rem" }}
          >
            DOCPATS
          </span>
          <span className="text-muted d-none d-md-inline">MedConnect</span>
        </div>

        <nav className="d-flex align-items-center gap-3">
          <NavLink to="/pricing" className="nav-link px-2">
            Pricing
          </NavLink>
          <NavLink to="/demo" className="nav-link px-2">
            Live Demo
          </NavLink>
          <NavLink to="/login" className="nav-link px-2">
            Sign in
          </NavLink>
          <Link to="/registration" className="btn btn-primary btn-sm px-3">
            Get started
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-outline-secondary btn-sm ms-2"
            aria-label="Toggle theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </nav>
      </div>
    </header>
  );
}
