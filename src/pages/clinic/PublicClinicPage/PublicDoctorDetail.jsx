// client/src/pages/clinic/PublicClinicPage/PublicDoctorDetail.jsx
//
// ВИТРИНА — публичный профиль врача клиники:
//   /<slug>/doctors/:doctorId   (и /clinics/<slug>/doctors/:doctorId)
// Гостевой. Грузит параллельно клинику (тема/chrome) и врача (контент) —
// тем же способом, что PublicArticleDetail.

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPublicClinicPage, getPublicClinicDoctor } from "../../../api/clinic";
import DoctorDetailRenderer from "../vitrina/DoctorDetailRenderer.jsx";

const STATE_CSS = `
.pdd-state-wrap { background: #faf8f4; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
.pdd-state { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; padding: 24px; color: #78716c; font-size: 15px; max-width: 460px; }
.pdd-state-ico { font-size: 48px; opacity: .4; }
.pdd-state-title { font-family: 'Lora', Georgia, serif; font-size: 22px; font-weight: 600; color: #44403c; }
.pdd-spinner { width: 46px; height: 46px; border: 3px solid #f3efe8; border-top-color: #0f766e; border-radius: 50%; animation: pdd-spin .7s linear infinite; }
@keyframes pdd-spin { to { transform: rotate(360deg); } }
`;

function StateScreen({ dir, children }) {
  return (
    <div className="pdd-state-wrap" dir={dir}>
      <style>{STATE_CSS}</style>
      <div className="pdd-state">{children}</div>
    </div>
  );
}

export default function PublicDoctorDetail() {
  const { slug, doctorId } = useParams();
  const { t, i18n } = useTranslation();
  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  // Двухбуквенный код: i18n может отдать "ru-RU", сервер ждёт "ru".
  const lang = String(i18n.language || "ru").slice(0, 2).toLowerCase();

  const [clinic, setClinic] = useState(null);
  const [doctor, setDoctor] = useState(null);
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
      getPublicClinicDoctor(slug, doctorId),
    ])
      .then(([clinicData, doctorData]) => {
        if (!alive) return;
        if (!clinicData || !doctorData) {
          setNotFound(true);
        } else {
          setClinic(clinicData);
          setDoctor(doctorData);
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
  }, [slug, doctorId, lang]);

  if (loading) {
    return (
      <StateScreen dir={dir}>
        <div className="pdd-spinner" />
        <span>{t("publicClinic.loading", { defaultValue: "Загрузка…" })}</span>
      </StateScreen>
    );
  }

  if (notFound) {
    return (
      <StateScreen dir={dir}>
        <span className="pdd-state-ico">👤</span>
        <div className="pdd-state-title">
          {t("publicClinic.doctorNotFoundTitle", {
            defaultValue: "Врач не найден",
          })}
        </div>
        <span>
          {t("publicClinic.doctorNotFoundText", {
            defaultValue:
              "Возможно, врач больше не работает в клинике или адрес введён неверно.",
          })}
        </span>
      </StateScreen>
    );
  }

  if (error || !clinic || !doctor) {
    return (
      <StateScreen dir={dir}>
        <span className="pdd-state-ico">⚠</span>
        <span>
          {t("publicClinic.doctorError", {
            defaultValue: "Не удалось загрузить профиль врача. Попробуйте позже.",
          })}
        </span>
      </StateScreen>
    );
  }

  return <DoctorDetailRenderer clinic={clinic} doctor={doctor} />;
}
