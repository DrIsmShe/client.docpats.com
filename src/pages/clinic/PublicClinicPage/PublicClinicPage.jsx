// client/src/pages/clinic/PublicClinicPage/PublicClinicPage.jsx
//
// Публичная страница клиники /<prefix>/:slug — ТОНКИЙ ШЕЛЛ.
// Гостевая, БЕЗ авторизации. Данные: getPublicClinicPage(slug) →
// GET /api/v1/public/clinics/:slug (DTO напрямую).
//
// Вся вёрстка вынесена в ВИТРИНУ 2.0: рендерер сам применяет тему (cssVars,
// шрифты, dir, фон) и проходит по layout.blocks через реестр блоков.
// Здесь остаются только: загрузка данных и состояния loading / not-found / error.
//
// Состояния показываются ДО загрузки клиники (темы ещё нет) → стилизованы
// автономно дефолтными цветами витрины (cream + teal), без токенов.

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleAddressable } from "../../../lib/useLocaleAddressable";
import { getPublicClinicPage } from "../../../api/clinic";
import VitrinaRenderer from "../vitrina/VitrinaRenderer.jsx";

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

export default function PublicClinicPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  // Двухбуквенный код: i18n может отдать "ru-RU", сервер ждёт "ru".
  const lang = String(i18n.language || "ru").slice(0, 2).toLowerCase();

  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  // У витрины есть языковые адреса: переключатель языка допишет
  // ?locale=, чтобы скопированная ссылка открылась на том же языке, а не
  // на языке получателя. На языке оригинала параметр убирается — оригинал
  // живёт на голом адресе, так же его пишет карта сайта и canonical.
  useLocaleAddressable(clinic?.originalLanguage || null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    setError(false);

    // Язык — часть запроса, а не только интерфейса: описание и слоган клиники
    // приходят с сервера уже на нужном языке. При переключении языка страница
    // перезапрашивает данные — иначе шапка сменила бы язык, а текст остался.
    getPublicClinicPage(slug, lang)
      .then((data) => {
        if (!alive) return;
        setClinic(data);
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
  }, [slug, lang]);

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
        <span className="pcp-state-ico">🏥</span>
        <div className="pcp-state-title">
          {t("publicClinic.notFoundTitle", {
            defaultValue: "Клиника не найдена",
          })}
        </div>
        <span>
          {t("publicClinic.notFoundText", {
            defaultValue:
              "Возможно, страница ещё не опубликована или адрес введён неверно.",
          })}
        </span>
      </StateScreen>
    );
  }

  if (error || !clinic) {
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

  return <VitrinaRenderer clinic={clinic} />;
}
