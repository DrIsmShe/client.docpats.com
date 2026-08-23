// client/src/pages/clinic/PublicClinicPage/PublicPublicationDetail.jsx
//
// ВИТРИНА — публичная статья врача клиники:
//   /<slug>/publications/:publicationId
//   (и /clinics/<slug>/publications/:publicationId)
// Гостевой. Грузит параллельно клинику (тема/chrome) и публикацию (контент).

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getPublicClinicPage,
  getPublicClinicPublication,
} from "../../../api/clinic";
import PublicationDetailRenderer from "../vitrina/PublicationDetailRenderer.jsx";

const STATE_CSS = `
.ppd-state-wrap { background: #faf8f4; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
.ppd-state { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; padding: 24px; color: #78716c; font-size: 15px; max-width: 460px; }
.ppd-state-ico { font-size: 48px; opacity: .4; }
.ppd-state-title { font-family: 'Lora', Georgia, serif; font-size: 22px; font-weight: 600; color: #44403c; }
.ppd-spinner { width: 46px; height: 46px; border: 3px solid #f3efe8; border-top-color: #0f766e; border-radius: 50%; animation: ppd-spin .7s linear infinite; }
@keyframes ppd-spin { to { transform: rotate(360deg); } }
`;

function StateScreen({ dir, children }) {
  return (
    <div className="ppd-state-wrap" dir={dir}>
      <style>{STATE_CSS}</style>
      <div className="ppd-state">{children}</div>
    </div>
  );
}

export default function PublicPublicationDetail() {
  const { slug, publicationId } = useParams();
  const { t, i18n } = useTranslation();
  const dir = i18n.language === "ar" ? "rtl" : "ltr";

  const [clinic, setClinic] = useState(null);
  const [publication, setPublication] = useState(null);
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
      getPublicClinicPublication(slug, publicationId),
    ])
      .then(([clinicData, pubData]) => {
        if (!alive) return;
        if (!clinicData || !pubData) {
          setNotFound(true);
        } else {
          setClinic(clinicData);
          setPublication(pubData);
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
  }, [slug, publicationId]);

  if (loading) {
    return (
      <StateScreen dir={dir}>
        <div className="ppd-spinner" />
        <span>{t("publicClinic.loading", { defaultValue: "Загрузка…" })}</span>
      </StateScreen>
    );
  }

  if (notFound) {
    return (
      <StateScreen dir={dir}>
        <span className="ppd-state-ico">📄</span>
        <div className="ppd-state-title">
          {t("publicClinic.publicationNotFoundTitle", {
            defaultValue: "Публикация не найдена",
          })}
        </div>
        <span>
          {t("publicClinic.publicationNotFoundText", {
            defaultValue:
              "Возможно, статья снята с публикации или адрес введён неверно.",
          })}
        </span>
      </StateScreen>
    );
  }

  if (error || !clinic || !publication) {
    return (
      <StateScreen dir={dir}>
        <span className="ppd-state-ico">⚠</span>
        <span>
          {t("publicClinic.publicationError", {
            defaultValue: "Не удалось загрузить публикацию. Попробуйте позже.",
          })}
        </span>
      </StateScreen>
    );
  }

  return (
    <PublicationDetailRenderer clinic={clinic} publication={publication} />
  );
}
