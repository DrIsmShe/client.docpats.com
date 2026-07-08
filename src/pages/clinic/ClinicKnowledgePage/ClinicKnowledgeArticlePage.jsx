// client/src/pages/clinic/ClinicKnowledgePage/ClinicKnowledgeArticlePage.jsx

import React, { useEffect, useState, useCallback } from "react";
import {
  Link,
  useParams,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClinicZone } from "../../../lib/useClinicZone";
import {
  getKnowledge,
  updateKnowledge,
  archiveKnowledge,
  listDepartments,
} from "../../../api/clinic";
import MiniMarkdown from "./MiniMarkdown";
import KnowledgeFormModal from "./KnowledgeFormModal";
import "./clinicKnowledgePage.css";

export default function ClinicKnowledgeArticlePage() {
  const { t, i18n } = useTranslation("clinic");
  const { id } = useParams();
  const navigate = useNavigate();
  const layoutContext = useOutletContext();
  const { basePath, loginPath } = useClinicZone();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [article, setArticle] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const myRole = layoutContext?.role || "member";
  const canManage = ["owner", "admin", "manager"].includes(myRole);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [res, deptsRes] = await Promise.all([
        getKnowledge(id),
        listDepartments({}).catch(() => ({ items: [] })),
      ]);
      setArticle(res.article || null);
      setDepartments(deptsRes.items || []);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate(loginPath, { replace: true });
        return;
      }
      setError(
        err.response?.status === 404
          ? t("knowledge.notFound", { defaultValue: "РЎС‚Р°С‚СЊСЏ РЅРµ РЅР°Р№РґРµРЅР°" })
          : err.message || "Failed to load article",
      );
      setLoading(false);
    }
  }, [id, navigate, loginPath, t]);

  useEffect(() => {
    load();
  }, [load]);

  const deptName =
    article?.departmentId &&
    departments.find((d) => String(d._id) === String(article.departmentId))
      ?.name;

  async function handleEditSubmit(payload) {
    const res = await updateKnowledge(id, payload);
    setArticle(res.article);
    setEditing(false);
  }

  async function handlePublishToggle() {
    if (!article) return;
    const next = article.status === "published" ? "draft" : "published";
    setBusy(true);
    try {
      const res = await updateKnowledge(id, { status: next });
      setArticle(res.article);
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function handlePinToggle() {
    if (!article) return;
    setBusy(true);
    try {
      const res = await updateKnowledge(id, { pinned: !article.pinned });
      setArticle(res.article);
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive() {
    if (
      !window.confirm(
        t("knowledge.confirmArchive", {
          name: article?.title,
          defaultValue: `РђСЂС…РёРІРёСЂРѕРІР°С‚СЊ В«${article?.title}В»?`,
        }),
      )
    )
      return;
    setBusy(true);
    try {
      await archiveKnowledge(id);
      navigate(`${basePath}/knowledge`);
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
      setBusy(false);
    }
  }

  const fmtDate = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined);
    } catch {
      return null;
    }
  };

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
        <h2>{t("knowledge.errorTitle", { defaultValue: "РћС€РёР±РєР°" })}</h2>
        <p>{error}</p>
        <Link to={`${basePath}/knowledge`} className="kb-page-btn-primary">
          {t("knowledge.back", { defaultValue: "в†ђ Р‘Р°Р·Р° Р·РЅР°РЅРёР№" })}
        </Link>
      </div>
    );
  }

  if (!article) return null;

  const activeDepartments = departments.filter((d) => d.status === "active");

  return (
    <div className="kb-article">
      <div className="kb-article-topbar">
        <Link to={`${basePath}/knowledge`} className="kb-page-back">
          {t("knowledge.backToList", { defaultValue: "в†ђ Рљ СЃРїРёСЃРєСѓ" })}
        </Link>
        {canManage && (
          <div className="kb-article-actions">
            <button
              className="kb-article-btn"
              onClick={handlePinToggle}
              disabled={busy}
              type="button"
            >
              {article.pinned
                ? t("knowledge.unpin", { defaultValue: "РћС‚РєСЂРµРїРёС‚СЊ" })
                : t("knowledge.pin", { defaultValue: "Р—Р°РєСЂРµРїРёС‚СЊ" })}
            </button>
            <button
              className="kb-article-btn"
              onClick={handlePublishToggle}
              disabled={busy || article.status === "archived"}
              type="button"
            >
              {article.status === "published"
                ? t("knowledge.unpublish", { defaultValue: "Р’ С‡РµСЂРЅРѕРІРёРє" })
                : t("knowledge.publish", { defaultValue: "РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ" })}
            </button>
            <button
              className="kb-article-btn"
              onClick={() => setEditing(true)}
              disabled={busy}
              type="button"
            >
              {t("common.edit", { defaultValue: "РР·РјРµРЅРёС‚СЊ" })}
            </button>
            <button
              className="kb-article-btn is-danger"
              onClick={handleArchive}
              disabled={busy || article.status === "archived"}
              type="button"
            >
              {t("knowledge.archive", { defaultValue: "Р’ Р°СЂС…РёРІ" })}
            </button>
          </div>
        )}
      </div>

      <header className="kb-article-header">
        <div className="kb-article-badges">
          <span className="kb-article-category">
            {t(`knowledge.category.${article.category}`, {
              defaultValue: article.category,
            })}
          </span>
          <span className={`kb-status-badge status-${article.status}`}>
            {t(`knowledge.status.${article.status}`, {
              defaultValue: article.status,
            })}
          </span>
          {article.pinned && <span className="kb-pin">рџ“Њ</span>}
        </div>
        <h1 className="kb-article-title">{article.title}</h1>
        {article.summary && (
          <p className="kb-article-summary">{article.summary}</p>
        )}
        <div className="kb-article-meta">
          {deptName && <span>рџЏҐ {deptName}</span>}
          <span>
            {t("knowledge.version", { defaultValue: "РІРµСЂСЃРёСЏ" })}{" "}
            {article.version}
          </span>
          {fmtDate(article.updatedAt) && (
            <span>
              {t("knowledge.updated", { defaultValue: "РѕР±РЅРѕРІР»РµРЅРѕ" })}{" "}
              {fmtDate(article.updatedAt)}
            </span>
          )}
          {(article.tags || []).map((tg) => (
            <span className="kb-tag" key={tg}>
              #{tg}
            </span>
          ))}
        </div>
      </header>

      <article className="kb-article-body">
        {article.body ? (
          <MiniMarkdown source={article.body} />
        ) : (
          <p className="kb-article-empty-body">
            {t("knowledge.emptyBody", { defaultValue: "РЎРѕРґРµСЂР¶РёРјРѕРµ РїСѓСЃС‚Рѕ" })}
          </p>
        )}
      </article>

      {editing && (
        <KnowledgeFormModal
          article={article}
          departments={activeDepartments}
          onClose={() => setEditing(false)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}
