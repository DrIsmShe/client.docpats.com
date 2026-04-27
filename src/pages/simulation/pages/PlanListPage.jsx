// src/pages/simulation/pages/PlanListPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  fetchPlans,
  deletePlan,
  duplicatePlan,
  selectPlans,
  selectHasMore,
  selectLoading,
  selectError,
} from "../store/simulationSlice.js";

import { usePlanThumbnail } from "../hooks/usePlanThumbnail.js";
import { formatRelativeDate } from "../utils/dateFormat.js";

import NewPlanModal from "../components/modals/NewPlanModal.jsx";
import DeletePlanModal from "../components/modals/DeletePlanModal.jsx";

export default function PlanListPage() {
  const { t, i18n } = useTranslation("Simulation");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const plans = useSelector(selectPlans);
  const hasMore = useSelector(selectHasMore);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | label

  useEffect(() => {
    dispatch(fetchPlans({ reset: true }));
  }, [dispatch]);

  const handleLoadMore = useCallback(() => {
    dispatch(fetchPlans({ reset: false }));
  }, [dispatch]);

  const handleOpen = useCallback(
    (plan) => navigate(`/dp/simulation/plans/${plan.id}`),
    [navigate],
  );

  const handleDuplicate = useCallback(
    (plan) => dispatch(duplicatePlan({ id: plan.id })),
    [dispatch],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await dispatch(deletePlan(deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget, dispatch]);

  const handleCreated = useCallback(
    (plan) => navigate(`/dp/simulation/plans/${plan.id}`),
    [navigate],
  );

  const filteredPlans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = !q
      ? plans
      : plans.filter((p) => {
          const label = (p.label || "").toLowerCase();
          const ref = (p.patientRef || "").toLowerCase();
          return label.includes(q) || ref.includes(q);
        });

    const sorted = [...filtered];
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "label") {
      sorted.sort((a, b) => (a.label || "").localeCompare(b.label || ""));
    }
    return sorted;
  }, [plans, searchQuery, sortBy]);

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          {t("list.title")}
        </h1>

        {/* ─── Правый блок header'а: Help-ссылка + Новый план ─── */}
        <div style={headerActionsStyle}>
          <Link to="/dp/simulation/help" style={helpLinkStyle}>
            ? {t("help.headerLink")}
          </Link>
          <button
            style={primaryButtonStyle}
            onClick={() => setNewModalOpen(true)}
          >
            + {t("list.newButton")}
          </button>
        </div>
      </header>

      {/* Search + sort row */}
      {plans.length > 0 && (
        <div style={controlsRowStyle}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("list.searchPlaceholder")}
            style={searchInputStyle}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={sortSelectStyle}
          >
            <option value="newest">{t("list.sort.newest")}</option>
            <option value="oldest">{t("list.sort.oldest")}</option>
            <option value="label">{t("list.sort.label")}</option>
          </select>
        </div>
      )}

      {error && (
        <div style={errorStyle}>
          {t(`errors.${error.code}`, { defaultValue: error.message })}
        </div>
      )}

      {loading.list && plans.length === 0 && (
        <div style={emptyStyle}>{t("list.loading")}</div>
      )}

      {!loading.list && plans.length === 0 && (
        <div style={emptyStyle}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>{t("list.empty")}</div>
          <div style={{ fontSize: 14, color: "#888" }}>
            {t("list.emptyHint")}
          </div>
        </div>
      )}

      {!loading.list && plans.length > 0 && filteredPlans.length === 0 && (
        <div style={emptyStyle}>
          <div style={{ fontSize: 14, color: "#888" }}>
            {t("list.noMatch", { query: searchQuery })}
          </div>
        </div>
      )}

      <div style={gridStyle}>
        {filteredPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            locale={i18n.language}
            t={t}
            onOpen={() => handleOpen(plan)}
            onDuplicate={() => handleDuplicate(plan)}
            onDelete={() => setDeleteTarget(plan)}
          />
        ))}
      </div>

      {hasMore && !searchQuery && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            style={secondaryButtonStyle}
            onClick={handleLoadMore}
            disabled={loading.list}
          >
            {loading.list ? t("list.loading") : t("list.loadMore")}
          </button>
        </div>
      )}

      <NewPlanModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onCreated={handleCreated}
      />

      <DeletePlanModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={loading.delete}
      />
    </div>
  );
}

function PlanCard({ plan, locale, t, onOpen, onDuplicate, onDelete }) {
  const { thumbUrl } = usePlanThumbnail(plan);
  const displayUrl = thumbUrl || plan.photo.url;

  return (
    <div style={cardStyle}>
      <div
        style={{ ...thumbnailStyle, backgroundImage: `url(${displayUrl})` }}
        onClick={onOpen}
        role="button"
        tabIndex={0}
      />
      <div style={{ padding: 12 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 4,
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
        {plan.patientRef && (
          <div
            style={{
              fontSize: 12,
              color: "#666",
              marginBottom: 6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={plan.patientRef}
          >
            {plan.patientRef}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>
          {t("list.controlPointsCount", {
            count: plan.controlPoints?.length || 0,
          })}
        </div>
        <div style={{ fontSize: 11, color: "#999", marginBottom: 10 }}>
          {formatRelativeDate(plan.updatedAt, locale, t)}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={ghostButtonStyle} onClick={onOpen}>
            {t("itemMenu.open")}
          </button>
          <button style={ghostButtonStyle} onClick={onDuplicate}>
            {t("itemMenu.duplicate")}
          </button>
          <button
            style={{ ...ghostButtonStyle, color: "#dc2626" }}
            onClick={onDelete}
          >
            {t("itemMenu.delete")}
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
  alignItems: "center",
  marginBottom: 16,
};

// NEW
const headerActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

// NEW
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
  transition: "all 0.15s",
};

const controlsRowStyle = {
  display: "flex",
  gap: 12,
  marginBottom: 20,
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

const sortSelectStyle = {
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  fontFamily: "inherit",
  background: "#fff",
  cursor: "pointer",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 16,
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  overflow: "hidden",
  transition: "box-shadow 0.15s",
};

const thumbnailStyle = {
  width: "100%",
  height: 180,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundColor: "#f3f4f6",
  cursor: "pointer",
};

const emptyStyle = {
  textAlign: "center",
  padding: "80px 20px",
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

const secondaryButtonStyle = {
  padding: "8px 16px",
  background: "transparent",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
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
