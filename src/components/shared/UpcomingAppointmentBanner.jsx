// client/src/components/shared/UpcomingAppointmentBanner.jsx
//
// Полоса «ближайший приём» — последняя ступень лестницы напоминаний.
//
// Уведомление и пуш работают, когда человек СМОТРИТ на телефон. Баннер
// работает, когда он уже внутри кабинета и занят чем-то другим: висит поверх
// любой страницы за 15 минут до приёма, считает минуты и даёт одну кнопку —
// перейти к приёму. Серверная часть (jobs/appointmentReminders.job.js) шлёт
// −24ч / −1ч / −10мин, здесь — то, что видно без всяких разрешений браузера.
//
// Почему eager-импорт, а не lazy: компонент рендерится ВНЕ <Routes> и вне
// границы Suspense — ленивый модуль там сорвал бы первый рендер (см. CLAUDE.md).
// Поэтому он намеренно маленький и на публичных страницах не делает вообще
// ничего: без зоны /doctor или /patient сразу возвращает null, не сходив в сеть.
//
// Звонок он не инициирует специально. Врач опаздывает с предыдущего приёма, и
// автоматический вызов в 13:00 звонил бы в пустоту; кнопку жмёт человек, а
// дальше работает обычная сигнализация звонка.

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:11000";

// За сколько до приёма появляться и сколько висеть после начала.
const SHOW_BEFORE_MS = 15 * 60 * 1000;
const KEEP_AFTER_MS = 30 * 60 * 1000;

// Как часто перечитывать список и пересчитывать минуты.
const REFETCH_MS = 5 * 60 * 1000;
const TICK_MS = 20 * 1000;

const TEXT = {
  ru: {
    soon: (m) => `Приём через ${m} мин`,
    now: "Приём начался",
    withDoctor: (n) => `Врач: ${n}`,
    withPatient: (n) => `Пациент: ${n}`,
    openVideo: "Войти в приём",
    open: "Открыть",
    hide: "Скрыть",
  },
  en: {
    soon: (m) => `Appointment in ${m} min`,
    now: "Appointment has started",
    withDoctor: (n) => `Doctor: ${n}`,
    withPatient: (n) => `Patient: ${n}`,
    openVideo: "Join",
    open: "Open",
    hide: "Hide",
  },
  az: {
    soon: (m) => `${m} dəqiqədən sonra qəbul`,
    now: "Qəbul başladı",
    withDoctor: (n) => `Həkim: ${n}`,
    withPatient: (n) => `Pasiyent: ${n}`,
    openVideo: "Qoşul",
    open: "Aç",
    hide: "Gizlət",
  },
  tr: {
    soon: (m) => `${m} dakika sonra randevu`,
    now: "Randevu başladı",
    withDoctor: (n) => `Doktor: ${n}`,
    withPatient: (n) => `Hasta: ${n}`,
    openVideo: "Katıl",
    open: "Aç",
    hide: "Gizle",
  },
  ar: {
    soon: (m) => `موعد بعد ${m} دقيقة`,
    now: "بدأ الموعد",
    withDoctor: (n) => `الطبيب: ${n}`,
    withPatient: (n) => `المريض: ${n}`,
    openVideo: "انضم",
    open: "فتح",
    hide: "إخفاء",
  },
};

// Язык берётся через useTranslation, а не из синглтона i18next напрямую:
// хук подписан на смену языка, и полоса переводится сразу, а не после
// перехода на другую страницу.
function dict(lang) {
  return TEXT[String(lang || "ru").slice(0, 2)] || TEXT.ru;
}

function fullName(...parts) {
  return parts.filter(Boolean).join(" ").trim();
}

const styles = `
  .appt-banner {
    position: fixed;
    right: 18px;
    bottom: 18px;
    /* Ниже оверлея звонка (9999): во время разговора напоминание о том же
       приёме не должно лезть поверх собеседника. */
    z-index: 9000;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    border-radius: 14px;
    background: linear-gradient(135deg, #0f2c3f 0%, #1a6b8a 100%);
    color: #fff;
    box-shadow: 0 10px 30px rgba(0,0,0,0.28);
    font-family: 'Nunito', system-ui, sans-serif;
    max-width: min(420px, calc(100vw - 24px));
    animation: apptBannerIn 0.25s ease;
  }
  @keyframes apptBannerIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .appt-banner__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #22c55e;
    flex: 0 0 auto;
    animation: apptBannerPulse 1.6s ease infinite;
  }
  @keyframes apptBannerPulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.35; }
  }
  .appt-banner__text { min-width: 0; }
  .appt-banner__title {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.2;
  }
  .appt-banner__sub {
    font-size: 12.5px;
    opacity: 0.75;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .appt-banner__go {
    flex: 0 0 auto;
    border: none;
    border-radius: 10px;
    padding: 9px 14px;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
    background: #22c55e;
    color: #06281a;
  }
  .appt-banner__go:hover { filter: brightness(1.06); }
  .appt-banner__close {
    flex: 0 0 auto;
    background: none;
    border: none;
    color: rgba(255,255,255,0.6);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    padding: 2px 4px;
  }
  .appt-banner__close:hover { color: #fff; }

  /* На телефоне — полосой снизу во всю ширину: угол экрана там занят
     системными жестами, и карточка в нём не нажимается. */
  @media (max-width: 640px) {
    .appt-banner {
      right: 10px;
      left: 10px;
      bottom: 10px;
      max-width: none;
    }
  }
`;

export default function UpcomingAppointmentBanner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  // Зона определяется путём — так же, как весь остальной роутинг приложения.
  // Заодно это гарантия, что на публичных страницах не будет ни одного запроса.
  const zone = location.pathname.startsWith("/doctor")
    ? "doctor"
    : location.pathname.startsWith("/patient")
      ? "patient"
      : null;

  const [items, setItems] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(() => new Set());

  // ── Загрузка списка ──────────────────────────────────────────────────
  useEffect(() => {
    if (!zone) {
      setItems([]);
      return undefined;
    }

    let alive = true;
    const url =
      zone === "doctor"
        ? `${API_BASE}/schedule/appointment/appointments`
        : `${API_BASE}/appointment-for-patient/my`;

    const load = async () => {
      try {
        const res = await axios.get(url, { withCredentials: true });
        if (!alive) return;
        setItems(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch {
        // Молча: баннер — подсказка, а не функция. Ошибка сети не должна
        // ничего показывать поверх работы врача.
        if (alive) setItems([]);
      }
    };

    load();
    const id = setInterval(load, REFETCH_MS);

    // Серверное напоминание — повод перечитать список немедленно: приём мог
    // быть подтверждён или перенесён минуту назад.
    const onNotification = (e) => {
      if (e?.detail?.type === "appointment_reminder") load();
    };
    window.addEventListener("new_notification", onNotification);

    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("new_notification", onNotification);
    };
  }, [zone]);

  // ── Тик времени ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!zone) return undefined;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [zone]);

  // ── Ближайший подходящий приём ───────────────────────────────────────
  const upcoming = useMemo(() => {
    if (!zone || !items.length) return null;

    return (
      items
        .filter((a) => {
          if (!a?.startsAt || a.isArchived) return false;
          if (!["pending", "confirmed"].includes(a.status)) return false;
          if (dismissed.has(String(a._id))) return false;
          const diff = new Date(a.startsAt).getTime() - now;
          return diff <= SHOW_BEFORE_MS && diff >= -KEEP_AFTER_MS;
        })
        .sort(
          (x, y) => new Date(x.startsAt).getTime() - new Date(y.startsAt).getTime(),
        )[0] || null
    );
  }, [items, now, dismissed, zone]);

  if (!zone || !upcoming) return null;

  const d = dict(i18n.language);
  const diffMs = new Date(upcoming.startsAt).getTime() - now;
  const minutesLeft = Math.max(0, Math.round(diffMs / 60000));
  const started = diffMs <= 0;

  const peer =
    zone === "doctor"
      ? fullName(upcoming?.patient?.firstName, upcoming?.patient?.lastName)
      : fullName(
          upcoming?.doctorId?.userId?.firstName,
          upcoming?.doctorId?.userId?.lastName,
        );

  const isVideo = upcoming.type === "video";
  const target =
    zone === "doctor" ? "/doctor/doctor-appointment" : "/patient/my-appointment";

  return (
    <>
      <style>{styles}</style>
      <div className="appt-banner" role="status" aria-live="polite">
        <span className="appt-banner__dot" />

        <div className="appt-banner__text">
          <div className="appt-banner__title">
            {started ? d.now : d.soon(minutesLeft)}
          </div>
          {peer && (
            <div className="appt-banner__sub">
              {zone === "doctor" ? d.withPatient(peer) : d.withDoctor(peer)}
            </div>
          )}
        </div>

        <button
          type="button"
          className="appt-banner__go"
          onClick={() => navigate(target)}
        >
          {isVideo ? d.openVideo : d.open}
        </button>

        <button
          type="button"
          className="appt-banner__close"
          title={d.hide}
          aria-label={d.hide}
          onClick={() =>
            setDismissed((prev) => new Set(prev).add(String(upcoming._id)))
          }
        >
          ×
        </button>
      </div>
    </>
  );
}
