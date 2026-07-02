// client/src/pages/clinic/PublicClinicPage/PublicArticleDetail.jsx
//
// ВИТРИНА 2.0 (Часть 3) — публичный ДЕТЕЙЛ статьи:
//   /clinics/:slug/dp/:pageSlug/articles/:articleSlug
// Гостевой. Грузит параллельно клинику (тема/chrome) и статью (контент).

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getPublicClinicPage,
  getPublicArticleDetail,
} from "../../../api/clinic";
import ArticleDetailRenderer from "../vitrina/ArticleDetailRenderer.jsx";

const STATE_CSS = `
.pad-state-wrap { background: #faf8f4; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
.pad-state { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; padding: 24px; color: #78716c; font-size: 15px; max-width: 460px; }
.pad-state-ico { font-size: 48px; opacity: .4; }
.pad-state-title { font-family: 'Lora', Georgia, serif; font-size: 22px; font-weight: 600; color: #44403c; }
.pad-spinner { width: 46px; height: 46px; border: 3px solid #f3efe8; border-top-color: #0f766e; border-radius: 50%; animation: pad-spin .7s linear infinite; }
@keyframes pad-spin { to { transform: rotate(360deg); } }
`;

function StateScreen({ dir, children }) {
  return (
    <div className="pad-state-wrap" dir={dir}>
      <style>{STATE_CSS}</style>
      <div className="pad-state">{children}</div>
    </div>
  );
}

export default function PublicArticleDetail() {
  const { slug, pageSlug, articleSlug } = useParams();
  const { t, i18n } = useTranslation();
  const dir = i18n.language === "ar" ? "rtl" : "ltr";

  const [clinic, setClinic] = useState(null);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    setError(false);

    Promise.all([
      getPublicClinicPage(slug),
      getPublicArticleDetail(slug, pageSlug, articleSlug),
    ])
      .then(([clinicData, articleData]) => {
        if (!alive) return;
        if (!clinicData || !articleData) {
          setNotFound(true);
        } else {
          setClinic(clinicData);
          setArticle(articleData);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        if (err?.response?.status === 404) setNotFound(true);
        else setError(true);
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [slug, pageSlug, articleSlug]);

  if (loading) {
    return (
      <StateScreen dir={dir}>
        <div className="pad-spinner" />
        <span>{t("publicClinic.loading", { defaultValue: "Загрузка…" })}</span>
      </StateScreen>
    );
  }

  if (notFound) {
    return (
      <StateScreen dir={dir}>
        <span className="pad-state-ico">📄</span>
        <div className="pad-state-title">
          {t("publicClinic.articleNotFoundTitle", {
            defaultValue: "Статья не найдена",
          })}
        </div>
        <span>
          {t("publicClinic.articleNotFoundText", {
            defaultValue:
              "Возможно, статья ещё не опубликована или адрес введён неверно.",
          })}
        </span>
      </StateScreen>
    );
  }

  if (error || !clinic || !article) {
    return (
      <StateScreen dir={dir}>
        <span className="pad-state-ico">⚠</span>
        <span>
          {t("publicClinic.error", {
            defaultValue: "Не удалось загрузить статью. Попробуйте позже.",
          })}
        </span>
      </StateScreen>
    );
  }

  return <ArticleDetailRenderer clinic={clinic} article={article} />;
}
