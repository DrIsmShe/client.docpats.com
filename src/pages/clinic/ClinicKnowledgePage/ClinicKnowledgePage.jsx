// client/src/pages/clinic/ClinicKnowledgePage/ClinicKnowledgePage.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  listKnowledge,
  listDepartments,
  createKnowledge,
} from "../../../api/clinic";
import KnowledgeFormModal from "./KnowledgeFormModal";
import "./clinicKnowledgePage.css";

const CATEGORIES = [
  "protocol",
  "guideline",
  "sop",
  "onboarding",
  "faq",
  "policy",
  "template",
  "other",
];
const STATUSES = ["draft", "published", "archived"];

export default function ClinicKnowledgePage() {
  const { t } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [articles, setArticles] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const myRole = layoutContext?.role || "member";
  const canManage = ["owner", "admin", "manager"].includes(myRole);

  const deptMap = useMemo(() => {
    const m = {};
    for (const d of departments) m[String(d._id || d.id)] = d;
    return m;
  }, [departments]);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [kbRes, deptsRes] = await Promise.all([
        listKnowledge({}),
        listDepartments({}),
      ]);
      setArticles(kbRes.items || []);
      setDepartments(deptsRes.items || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load knowledge base:", err);
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(err.message || "Failed to load knowledge base");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const activeDepartments = useMemo(
    () => departments.filter((d) => d.status === "active"),
    [departments],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (!showArchived && a.status === "archived") return false;
      if (categoryFilter && a.category !== categoryFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (a.title || "").toLowerCase().includes(q) ||
        (a.summary || "").toLowerCase().includes(q) ||
        (a.tags || []).some((tg) => tg.toLowerCase().includes(q))
      );
    });
  }, [articles, showArchived, categoryFilter, statusFilter, search]);

  // Group by category. Within a group, pinned first (API already sorts so).
  const grouped = useMemo(() => {
    const groups = new Map();
    for (const a of filtered) {
      const key = a.category || "other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(a);
    }
    return CATEGORIES.filter((c) => groups.has(c)).map((c) => ({
      category: c,
      items: groups.get(c),
    }));
  }, [filtered]);

  async function handleCreate(payload) {
    const res = await createKnowledge(payload);
    setModalOpen(false);
    // jump straight into the new article
    const id = res.article?._id || res.article?.id;
    if (id) navigate(`/clinic/knowledge/${id}`);
    else loadAll();
  }

  if (loading) {
    return (
      <div className="kb-page-loading">
        <div className="kb-page-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="kb-page-error">
        <h2>{t("knowledge.errorTitle", { defaultValue: "Ошибка" })}</h2>
        <p>{error}</p>
        <button onClick={loadAll}>
          {t("common.retry", { defaultValue: "Повторить" })}
        </button>
      </div>
    );
  }

  return (
    <div className="kb-page">
      <div className="kb-page-header">
        <div className="kb-page-header-left">
          <Link to="/clinic/dashboard" className="kb-page-back">
            {t("knowledge.back", { defaultValue: "← Дашборд" })}
          </Link>
          <h1>{t("knowledge.title", { defaultValue: "База знаний" })}</h1>
          <p className="kb-page-subtitle">
            {t("knowledge.subtitle", {
              defaultValue: "Протоколы, регламенты и инструкции клиники",
            })}
          </p>
        </div>
        {canManage && (
          <div className="kb-page-header-actions">
            <button
              className="kb-page-btn-primary"
              onClick={() => setModalOpen(true)}
              type="button"
            >
              {t("knowledge.create", { defaultValue: "Новая статья" })}
            </button>
          </div>
        )}
      </div>

      <div className="kb-page-toolbar">
        <input
          className="kb-page-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("knowledge.searchPlaceholder", {
            defaultValue: "Поиск по названию, описанию, тегам…",
          })}
        />
        <select
          className="kb-page-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">
            {t("knowledge.allCategories", { defaultValue: "Все категории" })}
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`knowledge.category.${c}`, { defaultValue: c })}
            </option>
          ))}
        </select>
        <select
          className="kb-page-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">
            {t("knowledge.allStatuses", { defaultValue: "Все статусы" })}
          </option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`knowledge.status.${s}`, { defaultValue: s })}
            </option>
          ))}
        </select>
        <label className="kb-page-toggle">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          {t("knowledge.showArchived", { defaultValue: "Архив" })}
        </label>
      </div>

      <section className="kb-page-section">
        <h2>
          {t("knowledge.listTitle", { defaultValue: "Статьи" })}
          <span className="kb-page-count">{filtered.length}</span>
        </h2>

        {filtered.length === 0 ? (
          <div className="kb-page-empty">
            <p>{t("knowledge.empty", { defaultValue: "Статей пока нет" })}</p>
            {canManage && (
              <button
                className="kb-page-btn-primary"
                onClick={() => setModalOpen(true)}
                type="button"
              >
                {t("knowledge.createFirst", {
                  defaultValue: "Создать первую статью",
                })}
              </button>
            )}
          </div>
        ) : (
          <div className="kb-page-groups">
            {grouped.map(({ category, items }) => (
              <div className="kb-group" key={category}>
                <div className="kb-group-title">
                  {t(`knowledge.category.${category}`, {
                    defaultValue: category,
                  })}
                  <span className="kb-group-count">{items.length}</span>
                </div>
                <div className="kb-page-list">
                  {items.map((a) => (
                    <ArticleCard
                      key={a._id || a.id}
                      article={a}
                      deptMap={deptMap}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <KnowledgeFormModal
          article={null}
          departments={activeDepartments}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

function ArticleCard({ article, deptMap, t }) {
  const archived = article.status === "archived";
  const deptName = article.departmentId
    ? deptMap[String(article.departmentId)]?.name
    : null;

  return (
    <Link
      to={`/clinic/knowledge/${article._id || article.id}`}
      className={`kb-card ${archived ? "is-archived" : ""}`}
    >
      <div className="kb-card-main">
        <div className="kb-card-title">
          {article.pinned && <span className="kb-pin">📌</span>}
          {article.title}
          <span className={`kb-status-badge status-${article.status}`}>
            {t(`knowledge.status.${article.status}`, {
              defaultValue: article.status,
            })}
          </span>
        </div>
        {article.summary && (
          <div className="kb-card-summary">{article.summary}</div>
        )}
        <div className="kb-card-meta">
          {deptName && <span className="kb-card-dept">🏥 {deptName}</span>}
          {(article.tags || []).slice(0, 5).map((tg) => (
            <span className="kb-tag" key={tg}>
              #{tg}
            </span>
          ))}
        </div>
      </div>
      <span className="kb-card-arrow">→</span>
    </Link>
  );
}
