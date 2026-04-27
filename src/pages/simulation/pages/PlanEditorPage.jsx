// src/pages/simulation/pages/PlanEditorPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import {
  fetchPlanById,
  clearCurrent,
  selectCurrentPlan,
  selectLoading,
  selectError,
} from "../store/simulationSlice.js";

import SimulationEditor from "../components/editor/SimulationEditor.jsx";
import BeforeAfterViewer from "../components/viewer/BeforeAfterViewer.jsx";

/* ──────────────────────────────────────────────────────────────────────
   S.7.5+ — full-screen layout.
   Page занимает 100vh, header — фиксированной высоты, content — flex:1
   с overflow:hidden чтобы editor мог занять всё оставшееся пространство.

   Раньше было maxWidth:1400 + padding:24px + minHeight:600 — это зажимало
   editor в маленький блок. Теперь — на всю ширину и высоту окна.
   ────────────────────────────────────────────────────────────────────── */

export default function PlanEditorPage() {
  const { t } = useTranslation("Simulation");
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const plan = useSelector(selectCurrentPlan);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  const [activeTab, setActiveTab] = useState("editor");

  useEffect(() => {
    dispatch(fetchPlanById(id));
    return () => dispatch(clearCurrent());
  }, [dispatch, id]);

  if (loading.current && !plan) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        {t("list.loading")}
      </div>
    );
  }

  if (error?.code === "not_found") {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 18, marginBottom: 16 }}>
          {t("errors.not_found")}
        </div>
        <button onClick={() => navigate("/dp/simulation")}>
          {t("editor.backToList")}
        </button>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={headerLeftStyle}>
          <button
            onClick={() => navigate("/dp/simulation")}
            style={backButtonStyle}
          >
            ← {t("editor.backToList")}
          </button>
          <h1 style={titleStyle}>{plan.label}</h1>
          {plan.patientRef && (
            <div style={patientRefStyle}>{plan.patientRef}</div>
          )}
        </div>

        <div style={rightBlockStyle}>
          <Link
            to="/dp/simulation/help"
            target="_blank"
            rel="noopener noreferrer"
            style={helpLinkStyle}
            title={t("help.pageTitle")}
          >
            ? {t("help.headerLink")}
          </Link>

          <div style={tabsStyle}>
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              style={{
                ...tabStyle,
                ...(activeTab === "editor" ? tabActiveStyle : {}),
              }}
            >
              {t("tabs.editor")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("viewer")}
              style={{
                ...tabStyle,
                ...(activeTab === "viewer" ? tabActiveStyle : {}),
              }}
            >
              {t("tabs.viewer")}
            </button>
          </div>
        </div>
      </header>

      <div style={contentContainerStyle}>
        {activeTab === "editor" ? (
          <SimulationEditor plan={plan} />
        ) : (
          <BeforeAfterViewer plan={plan} />
        )}
      </div>
    </div>
  );
}

/* ─────── styles — full-screen layout ─────── */

const pageStyle = {
  // На всю ширину окна — НЕТ maxWidth, НЕТ боковых padding'ов на десктопе
  width: "100%",
  // Page занимает ровно высоту viewport — flex column распределит дочерние
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#f8fafc",
  // overflow:hidden чтобы случайные скроллы child'ов не растягивали page
  overflow: "hidden",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  // Header padding'и — компактные но не убогие
  padding: "12px 20px",
  flexWrap: "wrap",
  flexShrink: 0,
  background: "#fff",
  borderBottom: "1px solid #e5e7eb",
  zIndex: 5,
};

const headerLeftStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  flex: 1,
  minWidth: 0, // чтобы text-overflow работал в title
};

const titleStyle = {
  fontSize: 20,
  fontWeight: 700,
  margin: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const patientRefStyle = {
  fontSize: 12,
  color: "#666",
};

const rightBlockStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexShrink: 0,
};

const helpLinkStyle = {
  padding: "6px 12px",
  color: "#3d7fff",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 500,
  background: "#fff",
  cursor: "pointer",
};

const backButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#3d7fff",
  cursor: "pointer",
  fontSize: 12,
  padding: 0,
  textAlign: "start",
  alignSelf: "flex-start",
};

const tabsStyle = {
  display: "flex",
  gap: 4,
  background: "#f1f5f9",
  padding: 4,
  borderRadius: 8,
};

const tabStyle = {
  padding: "8px 16px",
  background: "transparent",
  color: "#64748b",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.1s",
};

const tabActiveStyle = {
  background: "#fff",
  color: "#1a1a1a",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

// КЛЮЧЕВОЙ FIX: flex:1 + minHeight:0 — стандартный паттерн
// "child fills remaining flex space, can shrink below content size".
// Без minHeight:0 child не может сжаться меньше своего contentSize и
// flex:1 не работает корректно.
const contentContainerStyle = {
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  display: "flex",
};
