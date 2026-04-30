// src/pages/simulation/breast/BreastListPage.jsx
//
// S.8 Phase 3B+3C — Список breast планов с группировкой по пациенту
// + интеграция NewBreastPlanModal.

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { listBreastGrouped } from "../api/breastSimulationApi.js";
import { deletePlan as deletePlanApi } from "../api/simulationApi.js";

import { formatRelativeDate } from "../utils/dateFormat.js";
import NewBreastPlanModal from "./NewBreastPlanModal.jsx";

const VIEW_LABELS_DEFAULT = {
  front: "Анфас",
  side_left: "Слева",
  side_right: "Справа",
  oblique_left: "3/4 слева",
  oblique_right: "3/4 справа",
  bottom_up: "Снизу",
};

const VIEW_BADGE_COLORS = {
  front: { bg: "#dbeafe", color: "#1e40af" },
  side_left: { bg: "#fef3c7", color: "#92400e" },
  side_right: { bg: "#fef3c7", color: "#92400e" },
  oblique_left: { bg: "#e0e7ff", color: "#3730a3" },
  oblique_right: { bg: "#e0e7ff", color: "#3730a3" },
  bottom_up: { bg: "#fce7f3", color: "#9f1239" },
};

export default function BreastListPage() {
  const { t, i18n } = useTranslation("Simulation");
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newModalOpen, setNewModalOpen] = useState(false);

  /* ─── Load ─── */

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { groups: data } = await listBreastGrouped({ limit: 100 });
      setGroups(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  /* ─── Actions ─── */

  const handleNewPlan = useCallback(() => {
    setNewModalOpen(true);
  }, []);

  const handleCreated = useCallback(
    (plan) => {
      // После создания — редирект в editor (Phase 3D роута пока нет —
      // 404 это нормально, list обновится при следующем visit).
      navigate(`/dp/simulation/breast/plans/${plan.id}`);
    },
    [navigate],
  );

  const handleOpen = useCallback(
    (plan) => navigate(`/dp/simulation/breast/plans/${plan.id}`),
    [navigate],
  );

  const handleDelete = useCallback(
    async (plan) => {
      const confirmed = window.confirm(
        t("breast.deleteConfirm", {
          defaultValue: `Удалить план "${plan.label}"?`,
          label: plan.label,
        }),
      );
      if (!confirmed) return;
      try {
        await deletePlanApi(plan.id);
        await loadGroups();
      } catch (err) {
        alert(err.message || "Failed to delete");
      }
    },
    [loadGroups, t],
  );

  /* ─── Filter by search ─── */

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;

    return groups
      .map((g) => {
        const refMatch = (g.patientRef || "").toLowerCase().includes(q);
        if (refMatch) return g;
        const matchedPlans = g.plans.filter((p) =>
          (p.label || "").toLowerCase().includes(q),
        );
        if (matchedPlans.length === 0) return null;
        return { ...g, plans: matchedPlans };
      })
      .filter(Boolean);
  }, [groups, searchQuery]);

  const totalPlans = useMemo(
    () => groups.reduce((sum, g) => sum + g.plans.length, 0),
    [groups],
  );

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <Link to="/dp/simulation" style={backLinkStyle}>
            ← {t("breast.backToHub", { defaultValue: "К выбору типа" })}
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 0" }}>
            {t("breast.title", { defaultValue: "Моделирование груди" })}
          </h1>
          {totalPlans > 0 && (
            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
              {t("breast.summary", {
                defaultValue: "Пациентов: {{patients}} · Планов: {{plans}}",
                patients: groups.length,
                plans: totalPlans,
              })}
            </div>
          )}
        </div>

        <div style={headerActionsStyle}>
          <Link to="/dp/simulation/help" style={helpLinkStyle}>
            ? {t("help.headerLink", { defaultValue: "Помощь" })}
          </Link>
          <button style={primaryButtonStyle} onClick={handleNewPlan}>
            + {t("breast.newButton", { defaultValue: "Новый план" })}
          </button>
        </div>
      </header>

      {groups.length > 0 && (
        <div style={controlsRowStyle}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("breast.searchPlaceholder", {
              defaultValue: "Поиск по пациенту или метке плана...",
            })}
            style={searchInputStyle}
          />
        </div>
      )}

      {error && (
        <div style={errorStyle}>
          {t(`errors.${error.code}`, { defaultValue: error.message })}
        </div>
      )}

      {loading && groups.length === 0 && (
        <div style={emptyStyle}>
          {t("breast.loading", { defaultValue: "Загрузка..." })}
        </div>
      )}

      {!loading && groups.length === 0 && !error && (
        <div style={emptyStyle}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>
            {t("breast.empty", {
              defaultValue: "Пока нет планов моделирования груди",
            })}
          </div>
          <div style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>
            {t("breast.emptyHint", {
              defaultValue:
                "Создайте первый план — загрузите фото пациента и выберите ракурс",
            })}
          </div>
          <button style={primaryButtonStyle} onClick={handleNewPlan}>
            + {t("breast.newButton", { defaultValue: "Новый план" })}
          </button>
        </div>
      )}

      {!loading && groups.length > 0 && filteredGroups.length === 0 && (
        <div style={emptyStyle}>
          <div style={{ fontSize: 14, color: "#888" }}>
            {t("breast.noMatch", {
              defaultValue: 'Ничего не найдено по запросу "{{query}}"',
              query: searchQuery,
            })}
          </div>
        </div>
      )}

      {filteredGroups.map((group) => (
        <PatientGroup
          key={group.patientRef}
          group={group}
          locale={i18n.language}
          t={t}
          onOpenPlan={handleOpen}
          onDeletePlan={handleDelete}
        />
      ))}

      {/* New plan modal */}
      <NewBreastPlanModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

function PatientGroup({ group, locale, t, onOpenPlan, onDeletePlan }) {
  const noPatient = !group.patientRef || group.patientRef === "(no patient)";

  return (
    <section style={groupSectionStyle}>
      <div style={groupHeaderStyle}>
        <span style={groupIconStyle}>{noPatient ? "○" : "👤"}</span>
        <span style={groupTitleStyle}>
          {noPatient
            ? t("breast.noPatient", {
                defaultValue: "Без указания пациента",
              })
            : group.patientRef}
        </span>
        <span style={groupCountStyle}>
          {t("breast.viewsCount", {
            defaultValue: "{{count}} ракурсов",
            count: group.plans.length,
          })}
        </span>
      </div>

      <div style={gridStyle}>
        {group.plans.map((plan) => (
          <BreastPlanCard
            key={plan.id}
            plan={plan}
            locale={locale}
            t={t}
            onOpen={() => onOpenPlan(plan)}
            onDelete={() => onDeletePlan(plan)}
          />
        ))}
      </div>
    </section>
  );
}

function BreastPlanCard({ plan, locale, t, onOpen, onDelete }) {
  const viewLabel = t(`breast.viewLabel.${plan.photoView}`, {
    defaultValue: VIEW_LABELS_DEFAULT[plan.photoView] || plan.photoView,
  });
  const viewColors = VIEW_BADGE_COLORS[plan.photoView] || {
    bg: "#f3f4f6",
    color: "#374151",
  };

  const anatomy = plan.anatomy || {};
  const hasAnatomy =
    !!anatomy.leftNipple ||
    !!anatomy.rightNipple ||
    !!anatomy.sternalNotch ||
    (anatomy.leftIMF || []).length > 0 ||
    (anatomy.rightIMF || []).length > 0;

  const hasOperation = !!plan.operation?.type;

  return (
    <div style={cardStyle}>
      <div style={thumbnailWrapperStyle}>
        <div
          style={{
            ...thumbnailStyle,
            backgroundImage: plan.photo?.url
              ? `url(${plan.photo.url})`
              : "none",
          }}
          onClick={onOpen}
          role="button"
          tabIndex={0}
        />
        <span
          style={{
            ...viewBadgeStyle,
            background: viewColors.bg,
            color: viewColors.color,
          }}
        >
          {viewLabel}
        </span>
      </div>

      <div style={{ padding: 12 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 6,
            cursor: "pointer",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          onClick={onOpen}
          title={plan.label}
        >
          {plan.label || "—"}
        </div>

        <div style={statusRowStyle}>
          {hasAnatomy ? (
            <span style={statusOkStyle}>
              ● {t("breast.status.anatomy", { defaultValue: "Размечено" })}
            </span>
          ) : (
            <span style={statusPendingStyle}>
              ○{" "}
              {t("breast.status.noAnatomy", {
                defaultValue: "Не размечено",
              })}
            </span>
          )}
          {hasOperation && (
            <span style={statusInfoStyle}>
              ✓{" "}
              {t(`breast.operation.${plan.operation.type}`, {
                defaultValue: plan.operation.type,
              })}
            </span>
          )}
        </div>

        <div style={{ fontSize: 11, color: "#999", marginBottom: 10 }}>
          {formatRelativeDate(plan.updatedAt, locale, t)}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button style={ghostButtonStyle} onClick={onOpen}>
            {t("itemMenu.open", { defaultValue: "Открыть" })}
          </button>
          <button
            style={{ ...ghostButtonStyle, color: "#dc2626" }}
            onClick={onDelete}
          >
            {t("itemMenu.delete", { defaultValue: "Удалить" })}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────── styles ─────── */

const pageStyle = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "24px 20px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 16,
  gap: 16,
  flexWrap: "wrap",
};

const backLinkStyle = {
  fontSize: 13,
  color: "#0d6b5e",
  textDecoration: "none",
  fontWeight: 500,
};

const headerActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const helpLinkStyle = {
  padding: "8px 14px",
  color: "#3d7fff",
  border: "1px solid #3d7fff",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 500,
  background: "transparent",
  cursor: "pointer",
};

const controlsRowStyle = {
  display: "flex",
  gap: 12,
  marginBottom: 24,
};

const searchInputStyle = {
  flex: 1,
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  fontFamily: "inherit",
  background: "#fff",
};

const groupSectionStyle = {
  marginBottom: 32,
};

const groupHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: "1px solid #e5e7eb",
};

const groupIconStyle = {
  fontSize: 16,
};

const groupTitleStyle = {
  fontSize: 15,
  fontWeight: 600,
  color: "#1a1d1f",
};

const groupCountStyle = {
  fontSize: 12,
  color: "#888",
  marginInlineStart: "auto",
  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 14,
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  overflow: "hidden",
  transition: "box-shadow 0.15s",
};

const thumbnailWrapperStyle = {
  position: "relative",
};

const thumbnailStyle = {
  width: "100%",
  height: 160,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundColor: "#f3f4f6",
  cursor: "pointer",
};

const viewBadgeStyle = {
  position: "absolute",
  top: 8,
  insetInlineStart: 8,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  padding: "3px 8px",
  borderRadius: 4,
  pointerEvents: "none",
};

const statusRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 8,
  fontSize: 11,
  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
};

const statusOkStyle = { color: "#16a34a" };
const statusPendingStyle = { color: "#a16207" };
const statusInfoStyle = { color: "#3d7fff" };

const emptyStyle = {
  textAlign: "center",
  padding: "60px 20px",
  color: "#555",
};

const errorStyle = {
  padding: "10px 14px",
  background: "#fee",
  border: "1px solid #fbb",
  borderRadius: 6,
  fontSize: 13,
  color: "#c33",
  marginBottom: 16,
};

const primaryButtonStyle = {
  padding: "8px 16px",
  background: "#3d7fff",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

const ghostButtonStyle = {
  padding: "6px 10px",
  background: "transparent",
  border: "1px solid #e5e7eb",
  borderRadius: 5,
  cursor: "pointer",
  fontSize: 12,
  flex: 1,
};
