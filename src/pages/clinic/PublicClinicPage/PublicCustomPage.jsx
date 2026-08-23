// client/src/pages/clinic/PublicClinicPage/PublicCustomPage.jsx
//
// ВИТРИНА 2.0 (Часть 2) — публичная КАСТОМНАЯ страница /clinics/:slug/dp/:pageSlug.
// Гостевая, без авторизации. Грузит ПАРАЛЛЕЛЬНО:
//   - клинику (getPublicClinicPage)        → тема, данные блоков, chrome
//   - контент страницы (getPublicCustomPage) → page.layout.blocks
// и отдаёт оба в CustomPageRenderer.
//
// Состояния loading / not-found / error — автономные (тема ещё не загружена).

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPublicClinicPage, getPublicCustomPage } from "../../../api/clinic";
import CustomPageRenderer from "../vitrina/CustomPageRenderer.jsx";

const STATE_CSS = `
.pcp-state-wrap { background: #faf8f4; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
.pcp-state { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; padding: 24px; color: #78716c; font-size: 15px; max-width: 460px; }
.pcp-state-ico { font-size: 48px; opacity: .4; }
.pcp-state-title { font-family: 'Lora', Georgia, serif; font-size: 22px; font-weight: 600; color: #44403c; }
.pcp-spinner { width: 46px; height: 46px; border: 3px solid #f3efe8; border-top-color: #0f766e; border-radius: 50%; animation: pcp-spin .7s linear infinite; }
@keyframes pcp-spin { to { transform: rotate(360deg); } }
`;

function StateScreen({ dir, children }) {
  return (
    <div className="pcp-state-wrap" dir={dir}>
      <style>{STATE_CSS}</style>
      <div className="pcp-state">{children}</div>
    </div>
  );
}

export default function PublicCustomPage() {
  const { slug, pageSlug } = useParams();
  const { t, i18n } = useTranslation();
  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  // Двухбуквенный код: i18n может отдать "ru-RU", сервер ждёт "ru".
  const lang = String(i18n.language || "ru").slice(0, 2).toLowerCase();

  const [clinic, setClinic] = useState(null);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    setError(false);

    Promise.all([
      getPublicClinicPage(slug, lang),
      getPublicCustomPage(slug, pageSlug),
    ])
      .then(([clinicData, pageData]) => {
        if (!alive) return;
        if (!clinicData || !pageData) {
          setNotFound(true);
        } else {
          setClinic(clinicData);
          setPage(pageData);
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
  }, [slug, pageSlug]);

  if (loading) {
    return (
      <StateScreen dir={dir}>
        <div className="pcp-spinner" />
        <span>{t("publicClinic.loading", { defaultValue: "Загрузка…" })}</span>
      </StateScreen>
    );
  }

  if (notFound) {
    return (
      <StateScreen dir={dir}>
        <span className="pcp-state-ico">📄</span>
        <div className="pcp-state-title">
          {t("publicClinic.pageNotFoundTitle", {
            defaultValue: "Страница не найдена",
          })}
        </div>
        <span>
          {t("publicClinic.pageNotFoundText", {
            defaultValue:
              "Возможно, страница ещё не опубликована или адрес введён неверно.",
          })}
        </span>
      </StateScreen>
    );
  }

  if (error || !clinic || !page) {
    return (
      <StateScreen dir={dir}>
        <span className="pcp-state-ico">⚠</span>
        <span>
          {t("publicClinic.error", {
            defaultValue: "Не удалось загрузить страницу. Попробуйте позже.",
          })}
        </span>
      </StateScreen>
    );
  }

  return <CustomPageRenderer clinic={clinic} page={page} />;
}
