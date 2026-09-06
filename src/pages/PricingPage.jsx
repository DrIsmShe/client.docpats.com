import React, { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { track } from "../lib/analytics";
import { BILLING_WAITLIST_JOINED } from "../lib/events";

// ═════════════════════════════════════════════════════════════════════
//   Цены (USD) — синхронизированы с server/common/config/aiPlanLimits.js
//   PLAN_PRICES. Если меняешь там — меняй и здесь.
// ═════════════════════════════════════════════════════════════════════
const PRICES_USD = {
  patient_std: { monthly: 9, yearly: 90 },
  // 9 $, не 3 $: см. пояснение в server/common/config/aiPlanLimits.js —
  // при 3 $ постоянные расходы (комиссия эквайринга + инфраструктура)
  // съедали треть тарифа ещё до первого обращения к модели.
  doctor_lite: { monthly: 9, yearly: 90 },
  doctor_basic: { monthly: 19, yearly: 190 },
  doctor_super: { monthly: 49, yearly: 490 },
  doctor_pro: { monthly: 99, yearly: 990 },
  clinic_start: { monthly: 99, yearly: 990 },
  clinic: { monthly: 249, yearly: 2490 },
  clinic_pro: { monthly: 499, yearly: 4990 },
  // Аддон подготовки к экзаменам: покупается ПОВЕРХ любого плана,
  // включая бесплатный, поэтому в сетке планов его нет.
  exam_plus: { monthly: 7, yearly: 70 },
  exam_unlimited: { monthly: 15, yearly: 150 },
};

// ═════════════════════════════════════════════════════════════════════
//   СТРУКТУРЫ ПЛАНОВ
//   Каждая фича — это объект { i18nKey, vars? } для интерполяции.
//   Сами тексты приходят из переводов через t().
// ═════════════════════════════════════════════════════════════════════

// ═══ Тарифы, пересмотр от 16.08.2026 ═══════════════════════════════
//
// ПРАВИЛО: на карточке остаётся только то, за чем стоит работающий код.
// Продавать несуществующее опаснее, чем не иметь функции — купивший
// обнаружит подмену на второй день, и вернуть его доверие будет нечем.
//
// Убрано как невыполнимое:
//   «Скидка 10/20 % на приём» — платформа не проводит оплату приёма,
//   применять скидку не к чему.
//   «Приоритетная очередь к врачам» — расписанием владеет врач; и
//   продавать приоритет в доступе к помощи не стоит даже при
//   технической возможности.
//
// Убрано как непостроенное (функции нет ни для кого):
//   SOAP-эпикризы у врача и клиники, профили близких, напоминания о
//   лекарствах, автобэкап истории, перевод документов. Всё это было в
//   прайсе, но ни одной строки кода за этим не стоит. Вернём на карточки
//   вместе с самими функциями, а не раньше.
//
// Минуты видео убраны с ПАЦИЕНТСКИХ карточек: приём назначает врач, и
// минуты списываются с его тарифа. У пациента остаётся одна платная ось —
// консультации помощника; всё остальное (история, документы, выгрузка,
// запись к врачу, переписка) бесплатно на любом тарифе.
const PATIENT_PLANS = [
  {
    key: "patient_free",
    free: true,
    highlight: false,
    cta: "register",
    ctaPath: "/registration",
    // Плашка про пробный период. Видео из пациентских тарифов убрано:
    // приём назначает и ведёт врач, минуты считаются с его тарифа.
    // Ограничивать пациента значило бы не пустить его на приём, который
    // ему назначили и за который он заплатил врачу.
    showTrialNote: true,
    features: [
      { i18nKey: "features.pFullHistory" },
      { i18nKey: "features.pLabResults" },
      { i18nKey: "features.pPrescriptions" },
      { i18nKey: "features.pStudyFiles" },
      { i18nKey: "features.pBooking" },
      { i18nKey: "features.pVideoUnlimited" },
      { i18nKey: "features.pChat" },
      { i18nKey: "features.pConsent" },
      { i18nKey: "features.pRevoke" },
      { i18nKey: "features.pMyDoctors" },
      { i18nKey: "features.pExport" },
      { i18nKey: "features.pArticles" },
      { i18nKey: "features.pLangs" },
      { i18nKey: "features.pInvite" },
      { i18nKey: "features.aiConsultations", vars: { count: 2 } },
      { i18nKey: "features.videraFilms", vars: { count: 3 } },
    ],
  },
  {
    key: "patient_std",
    highlight: true,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=patient_std",
    features: [
      { i18nKey: "features.pFullHistory" },
      { i18nKey: "features.pLabResults" },
      { i18nKey: "features.pPrescriptions" },
      { i18nKey: "features.pStudyFiles" },
      { i18nKey: "features.pBooking" },
      { i18nKey: "features.pVideoUnlimited" },
      { i18nKey: "features.pChat" },
      { i18nKey: "features.pConsent" },
      { i18nKey: "features.pRevoke" },
      { i18nKey: "features.pMyDoctors" },
      { i18nKey: "features.pExport" },
      { i18nKey: "features.pArticles" },
      { i18nKey: "features.pLangs" },
      { i18nKey: "features.pInvite" },
      { i18nKey: "features.aiConsultations", vars: { count: 15 } },
      { i18nKey: "features.videraFilmsUnlimited" },
    ],
  },
];

const DOCTOR_PLANS = [
  {
    // Free (тарифная сетка v5) — бесплатный вход для врачей, заменил платный
    // Lite. Рабочие не-ИИ функции на уровне бывшего Lite + 3 фильма, но ВЕСЬ
    // ИИ выключен (жёсткий гейт planHasAI на сервере). Регистрация, не оплата.
    key: "doctor_free",
    free: true,
    highlight: false,
    cta: "register",
    ctaPath: "/registration",
    showTrialNote: true,
    features: [
      { i18nKey: "features.examQuestions", vars: { count: 500 } },
      { i18nKey: "features.doctorProfile" },
      { i18nKey: "features.patientsInOffice", vars: { count: 30 } },
      { i18nKey: "features.storedFiles", vars: { count: 400 } },
      { i18nKey: "features.videoMinutes", vars: { count: 60 } },
      { i18nKey: "features.anthropometryTools" },
      { i18nKey: "features.directPayments" },
      { i18nKey: "features.videraFilms", vars: { count: 3 } },
      // Единственная зачёркнутая строка — честная граница тарифа: ИИ здесь нет.
      { i18nKey: "features.noAi", off: true },
    ],
  },
  {
    key: "doctor_basic",
    highlight: false,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=doctor_basic",
    // Плашка про пробный период стоит здесь, потому что бесплатные три
    // месяца дают ЛИМИТЫ ИМЕННО ЭТОГО тарифа. Раньше она висела на Growth —
    // пока пробный давал его лимиты; вместе с сокращением пробного до трёх
    // месяцев на лимитах Start переехала и она. На Lite своя формулировка:
    // туда аккаунт переходит по окончании пробного.
    showTrialNote: true,
    features: [
      { i18nKey: "features.examQuestions", vars: { count: 1500 } },
      { i18nKey: "features.doctorProfile" },
      { i18nKey: "features.aiAnalyses", vars: { count: 15 } },
      { i18nKey: "features.aiArticles", vars: { count: 4 } },
      { i18nKey: "features.aiPatientConsultations", vars: { count: 8 } },
      { i18nKey: "features.patientsInOffice", vars: { count: 100 } },
      { i18nKey: "features.storedFiles", vars: { count: 1500 } },
      { i18nKey: "features.videoMinutes", vars: { count: 240 } },
      { i18nKey: "features.anthropometryTools" },
      { i18nKey: "features.directPayments" },
      { i18nKey: "features.aiSimulations", vars: { count: 15 } },
      { i18nKey: "features.videraFilmsUnlimited" },
    ],
  },
  {
    key: "doctor_super",
    highlight: false,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=doctor_super",
    showTrialNote: false,
    features: [
      { i18nKey: "features.examQuestionsUnlimited" },
      { i18nKey: "features.doctorProfile" },
      { i18nKey: "features.aiAnalyses", vars: { count: 40 } },
      { i18nKey: "features.aiArticles", vars: { count: 12 } },
      { i18nKey: "features.aiPatientConsultations", vars: { count: 30 } },
      { i18nKey: "features.patientsInOffice", vars: { count: 600 } },
      { i18nKey: "features.storedFiles", vars: { count: 6000 } },
      {
        i18nKey: "features.videoMinutesHours",
        vars: { count: 600, hours: 10 },
      },
      { i18nKey: "features.anthropometryTools" },
      { i18nKey: "features.directPayments" },
      { i18nKey: "features.aiSimulations", vars: { count: 40 } },
      { i18nKey: "features.videraFilmsUnlimited" },
    ],
  },
  {
    key: "doctor_pro",
    highlight: true,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=doctor_pro",
    features: [
      // Безлимиты заменены потолками. Обещать «без ограничений» на обращения
      // к модели можно, только пока платформа берёт процент с приёмов и
      // перерасход тяжёлого врача покрывается его же оборотом. Процента
      // больше нет: подписка — единственный доход, а расход на разборы не
      // ограничен ничем. Числа выбраны с запасом к реальной практике.
      // «Приоритетный профиль врача» и «Приоритет в AI-рекомендациях»
      // отсюда убраны: ни того, ни другого в коде нет. Каталога врачей с
      // ранжированием в проекте не существует — профили отдаются
      // сортировкой по дате, — а «приоритет в AI» не значил вообще
      // ничего: очередь к модели одна для всех. Продавать различие,
      // которого нет, хуже, чем показать тариф короче.
      { i18nKey: "features.examQuestionsUnlimited" },
      { i18nKey: "features.aiAnalyses", vars: { count: 100 } },
      { i18nKey: "features.aiArticles", vars: { count: 25 } },
      { i18nKey: "features.aiPatientConsultations", vars: { count: 60 } },
      { i18nKey: "features.patientsInOffice", vars: { count: 2000 } },
      { i18nKey: "features.storedFiles", vars: { count: 20000 } },
      {
        i18nKey: "features.videoMinutesHours",
        vars: { count: 1200, hours: 20 },
      },
      { i18nKey: "features.anthropometryTools" },
      { i18nKey: "features.aiSimulations", vars: { count: 100 } },
      { i18nKey: "features.videraFilmsUnlimited" },
    ],
  },
];

const CLINIC_PLANS = [
  {
    key: "clinic_start",
    // Пометка о пробном периоде на всех трёх клинических карточках:
    // бесплатного клинического уровня нет, но начать не заплатив можно.
    // Сказать об этом обязаны здесь — иначе через месяц клиника узнаёт
    // о заморозке, упершись в неё посреди приёма.
    showTrialNote: true,
    highlight: false,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=clinic_start",
    features: [
      { i18nKey: "features.doctorsInClinic", vars: { count: 5 } },
      { i18nKey: "features.storedFiles", vars: { count: 7000 } },
      { i18nKey: "features.allDoctorsProfiles" },
      { i18nKey: "features.unifiedSchedule" },
      { i18nKey: "features.aiAnalyses", vars: { count: 120 } },
      { i18nKey: "features.aiArticles", vars: { count: 25 } },
      { i18nKey: "features.videoMinutesClinic", vars: { count: 1500 } },
      { i18nKey: "features.directPayments" },
      { i18nKey: "features.clinicAnalytics", off: true },
      { i18nKey: "features.aiSimulations", vars: { count: 100 } },
      { i18nKey: "features.videraFilmsUnlimited" },
    ],
  },
  {
    key: "clinic",
    showTrialNote: true,
    highlight: true,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=clinic",
    features: [
      { i18nKey: "features.doctorsInClinic", vars: { count: 15 } },
      { i18nKey: "features.storedFiles", vars: { count: 20000 } },
      { i18nKey: "features.allDoctorsProfiles" },
      { i18nKey: "features.unifiedSchedule" },
      { i18nKey: "features.aiAnalyses", vars: { count: 280 } },
      { i18nKey: "features.aiArticles", vars: { count: 80 } },
      {
        i18nKey: "features.videoMinutesClinicHours",
        vars: { count: 5000, hours: 83 },
      },
      { i18nKey: "features.directPayments" },
      { i18nKey: "features.clinicAnalytics" },
      { i18nKey: "features.aiSimulations", vars: { count: 250 } },
      { i18nKey: "features.videraFilmsUnlimited" },
    ],
  },
  {
    key: "clinic_pro",
    showTrialNote: true,
    highlight: false,
    cta: "contact",
    ctaPath: "mailto:support@docpats.com?subject=Clinic%20Enterprise",
    features: [
      // Штат по-прежнему не ограничен — врачи денег платформе не стоят.
      // А вот «весь ИИ без ограничений» при неограниченном штате означало
      // расход, не связанный с выручкой вообще ничем: это был единственный
      // тариф, где потолок отсутствовал сразу по обеим осям.
      { i18nKey: "features.doctorsInClinic", vars: { count: 50 } },
      { i18nKey: "features.storedFiles", vars: { count: 60000 } },
      { i18nKey: "features.allDoctorsProfiles" },
      { i18nKey: "features.unifiedScheduleCrm" },
      { i18nKey: "features.aiAnalyses", vars: { count: 480 } },
      { i18nKey: "features.aiArticles", vars: { count: 150 } },
      {
        i18nKey: "features.videoMinutesClinicHours",
        vars: { count: 15000, hours: 250 },
      },
      { i18nKey: "features.directPayments" },
      { i18nKey: "features.extendedAnalytics" },
      { i18nKey: "features.personalManager" },
      { i18nKey: "features.aiSimulations", vars: { count: 500 } },
      { i18nKey: "features.videraFilmsUnlimited" },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
//   ЛИСТ ОЖИДАНИЯ — заменяет кнопку оплаты, пока касса закрыта
//
//   Показывать «Подключить», которая ничего не подключает, — обман;
//   прятать тарифы целиком — терять спрос. Собираем контакт: кто и каким
//   тарифом интересуется. К запуску это готовый список для рассылки.
//
//   Появление формы определяет сервер (paymentsEnabled), а не флаг в
//   коде: включение кассы не должно требовать правки этой страницы.
// ═════════════════════════════════════════════════════════════════════
function WaitlistButton({ planKey, period, t, className = "" }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error

  async function submit(e) {
    e.preventDefault();
    setState("sending");
    try {
      const r = await fetch(
        `${process.env.REACT_APP_API_URL}/api/payments/waitlist`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, planKey, period, source: "pricing" }),
        },
      );
      setState(r.ok ? "done" : "error");
      // Пока оплата не запущена, лист ожидания — главный сигнал спроса:
      // какой тариф и какой период вообще собираются брать. Почту, которую
      // человек только что ввёл, счётчик не получает.
      if (r.ok) track(BILLING_WAITLIST_JOINED, { plan: planKey, period });
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className={`alert alert-success py-2 px-3 mb-0 small ${className}`}>
        ✓{" "}
        {t("waitlist.done", {
          defaultValue: "Спасибо! Напишем, как только откроем оплату.",
        })}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        className={`btn btn-outline-primary w-100 ${className}`}
        onClick={() => setOpen(true)}
      >
        {t("waitlist.cta", { defaultValue: "Сообщить о запуске" })}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className={className}>
      <input
        type="email"
        required
        autoFocus
        className="form-control mb-2"
        placeholder={t("waitlist.placeholder", { defaultValue: "Ваш email" })}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        type="submit"
        className="btn btn-primary w-100"
        disabled={state === "sending"}
      >
        {state === "sending"
          ? t("waitlist.sending", { defaultValue: "Отправляем…" })
          : t("waitlist.submit", { defaultValue: "Сообщить мне" })}
      </button>
      {state === "error" && (
        <div className="text-danger small mt-2">
          {t("waitlist.error", {
            defaultValue: "Не получилось отправить. Попробуйте ещё раз.",
          })}
        </div>
      )}
    </form>
  );
}

// ═════════════════════════════════════════════════════════════════════
//                    КАРТОЧКА ТАРИФА
// ═════════════════════════════════════════════════════════════════════
function PlanCard({ plan, period, t, currentPlanKey, paymentsEnabled }) {
  const navigate = useNavigate();
  const isFree = !!plan.free;
  const isCurrent = !!currentPlanKey && plan.key === currentPlanKey;
  const price = isFree ? null : PRICES_USD[plan.key]?.[period];

  // Для годового — посчитаем "≈ X $/мес" (округление до десятых)
  const approxPerMonth =
    period === "yearly" && price
      ? (Math.round((price / 12) * 10) / 10).toFixed(1)
      : null;

  const ctaLabelKey =
    plan.cta === "register"
      ? "card.ctaRegister"
      : plan.cta === "contact"
        ? "card.ctaContact"
        : "card.ctaSubscribe";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 250 }}
      className="h-100"
    >
      <div
        className={`card border-0 rounded-4 h-100 ${
          isCurrent
            ? "shadow-lg border border-success border-2"
            : plan.highlight
              ? "shadow-lg border border-primary border-2"
              : "shadow-sm"
        }`}
      >
        <div className="card-body d-flex flex-column p-4">
          {isCurrent ? (
            <span className="badge bg-success mb-3 align-self-center px-3 py-2">
              ✓ {t("card.currentPlan")}
            </span>
          ) : plan.highlight ? (
            <span className="badge bg-primary mb-3 align-self-center px-3 py-2">
              {t("card.recommended")}
            </span>
          ) : null}

          <h4 className="fw-bold mb-1">{t(`plans.${plan.key}.name`)}</h4>

          <div className="mb-1">
            {isFree ? (
              <>
                <span className="fs-2 fw-bold">{t("card.free")}</span>
              </>
            ) : (
              <>
                <span className="fs-2 fw-bold">${price}</span>
                <span className="text-muted fs-6 ms-2">
                  {period === "monthly"
                    ? t("period.perMonth")
                    : t("period.perYear")}
                </span>
              </>
            )}
          </div>

          {approxPerMonth && (
            <div className="text-success small mb-1">
              💰 {t("period.approxPerMonth", { amount: approxPerMonth })}
            </div>
          )}

          {t(`plans.${plan.key}.desc`) && (
            <p className="text-muted small mb-3">
              {t(`plans.${plan.key}.desc`)}
            </p>
          )}

          {plan.showTrialNote && (
            <div
              className="small mb-3 px-3 py-2 rounded-3"
              style={{
                background: "rgba(13,110,253,0.07)",
                color: "#0d6efd",
                border: "1px solid rgba(13,110,253,0.15)",
              }}
            >
              ⏱ {t(`plans.${plan.key}.trialNote`)}
            </div>
          )}

          <hr className="my-2" />

          <ul className="list-unstyled mt-2 mb-4 flex-grow-1">
            {plan.features.map((f, i) => (
              <li key={i} className="mb-2 d-flex align-items-start gap-2">
                <span style={{ fontSize: 13, marginTop: 2, flexShrink: 0 }}>
                  {f.off ? "⬜" : "✅"}
                </span>
                <span
                  className={f.off ? "text-muted" : ""}
                  style={{ fontSize: 13, lineHeight: 1.45 }}
                >
                  {t(f.i18nKey, f.vars || {})}
                </span>
              </li>
            ))}
          </ul>

          {/* Касса закрыта — вместо оплаты собираем контакт. Регистрация
              на бесплатный тариф при этом работает как обычно: она не про
              деньги. */}
          {!paymentsEnabled && !isFree && !isCurrent ? (
            <div className="mt-auto">
              <WaitlistButton planKey={plan.key} period={period} t={t} />
            </div>
          ) : (
          <button
            disabled={isCurrent}
            className={`btn rounded-3 mt-auto fw-semibold ${
              isCurrent
                ? "btn-success"
                : plan.highlight
                  ? "btn-primary"
                  : "btn-outline-primary"
            }`}
            onClick={() => {
              if (isCurrent) return;
              const path = plan.ctaPath || "/";
              // mailto/внешние ссылки — обычным переходом, не через роутер.
              if (path.startsWith("mailto:") || path.startsWith("http")) {
                window.location.href = path;
                return;
              }
              // На страницу оплаты пробрасываем выбранный период (мес/год).
              navigate(
                path.startsWith("/pricing/checkout")
                  ? `${path}&period=${period}`
                  : path,
              );
            }}
          >
            {isCurrent ? t("card.currentPlan") : t(ctaLabelKey)}
          </button>
          )}

          {/* Оплата по счёту — ПАРАЛЛЕЛЬНЫЙ канал, а не замена онлайну.
              Показываем всегда: и пока касса закрыта, и после запуска
              эквайринга. Бухгалтерия клиники не платит корпоративной
              картой, и для чека в 99–499 $ счёт с закрывающими
              документами — основной способ, а не запасной.
              На бесплатном тарифе счёт не нужен. */}
          {!isFree && !isCurrent && (
            <InvoiceButton planKey={plan.key} period={period} t={t} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//   ОПЛАТА ПО СЧЁТУ
//
//   Форма намеренно короткая: название организации, email и налоговый
//   номер. Всё остальное выясняется перепиской — длинная форма на этом
//   шаге теряет клиента вернее, чем недостающее поле.
// ═════════════════════════════════════════════════════════════════════
function InvoiceButton({ planKey, period, t }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    taxId: "",
    note: "",
  });
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [result, setResult] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/payments/invoice-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...form,
            planKey,
            period,
            months: period === "yearly" ? 12 : 1,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "error");
      setResult(data);
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="alert alert-success small mt-2 mb-0 py-2">
        ✓ {result?.message}
        {result?.amount != null && (
          <div className="fw-semibold mt-1">
            {result.planName} — ${result.amount}
          </div>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-link btn-sm w-100 mt-2 text-decoration-none"
        onClick={() => setOpen(true)}
      >
        {t("invoice.cta", { defaultValue: "Оплатить по счёту" })}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2">
      <input
        className="form-control form-control-sm mb-2"
        placeholder={t("invoice.company", {
          defaultValue: "Организация или ваше имя",
        })}
        value={form.companyName}
        onChange={set("companyName")}
        required
      />
      <input
        type="email"
        className="form-control form-control-sm mb-2"
        placeholder={t("invoice.email", { defaultValue: "Email для счёта" })}
        value={form.email}
        onChange={set("email")}
        required
      />
      <input
        className="form-control form-control-sm mb-2"
        placeholder={t("invoice.taxId", {
          defaultValue: "Налоговый номер (если есть)",
        })}
        value={form.taxId}
        onChange={set("taxId")}
      />
      <button
        type="submit"
        className="btn btn-outline-secondary btn-sm w-100"
        disabled={state === "sending"}
      >
        {state === "sending"
          ? t("invoice.sending", { defaultValue: "Отправляем…" })
          : t("invoice.submit", { defaultValue: "Запросить счёт" })}
      </button>
      {state === "error" && (
        <div className="text-danger small mt-2">
          {t("invoice.error", {
            defaultValue: "Не удалось отправить. Попробуйте ещё раз.",
          })}
        </div>
      )}
    </form>
  );
}

// ═════════════════════════════════════════════════════════════════════
//                    БАННЕРЫ
// ═════════════════════════════════════════════════════════════════════
function GuestBanner({ t }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="alert rounded-4 border-0 shadow-sm mb-5 d-flex align-items-center gap-3"
      style={{
        background: "rgba(13,110,253,0.06)",
        borderLeft: "4px solid #0d6efd",
      }}
    >
      <div style={{ fontSize: 28 }}>💡</div>
      <div className="flex-grow-1">
        <strong>{t("guestBanner.title")}</strong>
        <div className="text-muted small mt-1">{t("guestBanner.text")}</div>
      </div>
      <button
        className="btn btn-primary rounded-3 flex-shrink-0"
        onClick={() => navigate("/registration")}
      >
        {t("guestBanner.cta")}
      </button>
    </motion.div>
  );
}

function DoctorBanner({ t }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="alert rounded-4 border-0 shadow-sm mb-5 d-flex align-items-center gap-3"
      style={{
        background: "rgba(45,212,191,0.07)",
        borderLeft: "4px solid #2dd4bf",
      }}
    >
      <div style={{ fontSize: 28 }}>🎁</div>
      <div className="flex-grow-1">
        <strong>{t("doctorBanner.title")}</strong>
        <div className="text-muted small mt-1">{t("doctorBanner.text")}</div>
      </div>
      <button
        className="btn btn-primary rounded-3 flex-shrink-0"
        onClick={() => navigate("/registration")}
      >
        {t("doctorBanner.cta")}
      </button>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//                    ГЛАВНАЯ СТРАНИЦА
// ═════════════════════════════════════════════════════════════════════
export default function PricingPage() {
  // 💎 Namespace = имя файла перевода (PricingPage.json)
  const { t, i18n } = useTranslation("PricingPage");

  const location = useLocation();
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [activeTab, setActiveTab] = useState("patients");
  const [period, setPeriod] = useState("monthly"); // monthly | yearly
  const [userRole, setUserRole] = useState(null); // null = гость/загрузка
  const [currentPlanKey, setCurrentPlanKey] = useState(null); // активная подписка
  // Открыта ли касса. Спрашиваем у сервера, а не решаем на фронте: сервер
  // знает, какой провайдер активен и есть ли у него ключи. В день запуска
  // достаточно переменной окружения — эта страница не изменится.
  const [paymentsEnabled, setPaymentsEnabled] = useState(true);

  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (location.state?.reason === "PATIENT_LIMIT_REACHED") {
      setActiveTab("patients");
      setShowLimitBanner(true);
      window.history.replaceState({}, document.title);
    }
    if (location.state?.reason === "DOCTOR_LIMIT_REACHED") {
      setActiveTab("doctors");
      setShowLimitBanner(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Роль текущего юзера — чтобы показывать только подходящие тарифы.
  useEffect(() => {
    let alive = true;
    fetch(`${process.env.REACT_APP_API_URL}/common-for-user`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => {
        if (alive && d?.authenticated) setUserRole(d.user?.role || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Текущая (оплаченная) подписка — чтобы подсветить активный тариф.
  useEffect(() => {
    let alive = true;
    fetch(`${process.env.REACT_APP_API_URL}/api/payments/my-subscription`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // ДЕЙСТВУЮЩИЙ план, а не сохранённый. У бесплатного пациента
        // subscriptionPlan в базе пустой — он и приходил в storedPlan как
        // null, поэтому карточка Free предлагала зарегистрироваться уже
        // зарегистрированному человеку. effectivePlan считается из роли,
        // подписки и пробного периода и всегда что-то означает.
        if (alive && d?.success) {
          setCurrentPlanKey(d.effectivePlan || d.storedPlan || null);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Состояние кассы. Если запрос не удался — оставляем true: показать
  // рабочую кнопку и получить ошибку при оплате честнее, чем объявить
  // приём денег закрытым из-за одной неудачной загрузки.
  useEffect(() => {
    let alive = true;
    fetch(`${process.env.REACT_APP_API_URL}/api/payments/plans`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && typeof d.paymentsEnabled === "boolean") {
          setPaymentsEnabled(d.paymentsEnabled);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const TABS = useMemo(
    () => [
      { key: "patients", label: t("tabs.patients") },
      { key: "doctors", label: t("tabs.doctors") },
      { key: "clinics", label: t("tabs.clinics") },
    ],
    [t],
  );

  // Какие вкладки доступны роли: врач — свои + клиники (может владеть клиникой),
  // пациент — только пациентские, гость/админ — весь прайс.
  const allowedTabKeys = useMemo(() => {
    if (userRole === "doctor") return ["doctors", "clinics"];
    if (userRole === "patient" || userRole === "user") return ["patients"];
    return ["patients", "doctors", "clinics"];
  }, [userRole]);

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => allowedTabKeys.includes(tab.key)),
    [TABS, allowedTabKeys],
  );

  // Подпись под заголовком обещала «для пациентов, врачей или клиник» всегда,
  // хотя вкладки фильтруются по роли: врач видел две вкладки и текст про три
  // аудитории, из которых одной на странице нет вовсе. Обещание, которого
  // страница не выполняет, читается как поломка, а не как настройка.
  const subtitleKey = useMemo(() => {
    if (userRole === "doctor") return "page.subtitleDoctor";
    if (userRole === "patient" || userRole === "user") return "page.subtitlePatient";
    return "page.subtitle";
  }, [userRole]);

  // Вкладка из адреса: /pricing?tab=clinics
  //
  // Нужна тем, кто приводит сюда человека с конкретным намерением.
  // Полоса «Пробный период клиники закончился → Оплатить» вела на общий
  // прайс, и владелец клиники попадал на тарифы ДЛЯ ВРАЧЕЙ — то есть на
  // ответ не на свой вопрос. Ссылка, открывающая не то, за чем шли,
  // читается как ошибка сайта, даже когда нужное лежит соседней
  // вкладкой.
  //
  // Права параметр НЕ расширяет: ниже стоит проверка allowedTabKeys, и
  // пациент, открывший ?tab=clinics, всё равно увидит свои тарифы.
  // Адресная строка не источник прав.
  const requestedTab = new URLSearchParams(location.search).get("tab");
  useEffect(() => {
    if (requestedTab && TABS.some((t) => t.key === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab, TABS]);

  // Если активная вкладка недоступна роли — переключаемся на первую доступную.
  useEffect(() => {
    if (!allowedTabKeys.includes(activeTab)) {
      setActiveTab(allowedTabKeys[0]);
    }
  }, [allowedTabKeys, activeTab]);

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)",
        padding: "40px 0 80px",
      }}
    >
      <Helmet>
        <title>{t("meta.title")}</title>
        <meta name="description" content={t("meta.description")} />
      </Helmet>

      <LanguageSwitcher />

      <div className="container" style={{ maxWidth: 1200 }}>
        {/* LIMIT BANNER */}
        {showLimitBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="alert alert-warning text-center shadow-sm rounded-4 mb-4"
          >
            <strong>{t("limitBanner.title")}</strong>
            <div className="mt-1 text-muted small">
              {t("limitBanner.subtitle")}
            </div>
          </motion.div>
        )}

        {/* BACK */}
        <div className="text-center mb-4">
          <Link
            to="/"
            className="px-3 py-2 rounded-pill shadow-sm text-muted fw-semibold text-decoration-none"
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            {t("page.back")}
          </Link>
        </div>

        {/* HEADER */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="fw-bold mb-2">{t("page.title")}</h1>
          <p className="text-muted">{t(subtitleKey)}</p>
        </motion.div>

        {/* PERIOD TOGGLE */}
        <div className="d-flex justify-content-center mb-4">
          <div
            className="d-flex rounded-pill p-1 gap-1"
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(0,0,0,0.08)",
              backdropFilter: "blur(8px)",
            }}
          >
            <button
              onClick={() => setPeriod("monthly")}
              className={`btn rounded-pill px-4 py-2 fw-semibold ${
                period === "monthly"
                  ? "btn-dark shadow-sm"
                  : "btn-link text-muted text-decoration-none"
              }`}
              style={{ fontSize: 14 }}
            >
              {t("period.monthly")}
            </button>
            <button
              onClick={() => setPeriod("yearly")}
              className={`btn rounded-pill px-4 py-2 fw-semibold position-relative ${
                period === "yearly"
                  ? "btn-dark shadow-sm"
                  : "btn-link text-muted text-decoration-none"
              }`}
              style={{ fontSize: 14 }}
            >
              {t("period.yearly")}
              <span className="badge bg-success ms-2" style={{ fontSize: 10 }}>
                {t("period.yearlyBadge")}
              </span>
            </button>
          </div>
        </div>

        {/* Касса закрыта — но это больше не значит «платить нельзя»:
            оплата по счёту работает. Прежний текст «оплата пока не
            подключена» противоречил кнопке «Оплатить по счёту» на каждой
            карточке и заставлял человека уйти, вместо того чтобы
            заплатить. */}
        {!paymentsEnabled && (
          <div className="alert alert-info text-center mb-4" role="status">
            {t("waitlist.notice", {
              defaultValue:
                "Оплата прямо на сайте подключается. Сейчас платят переводом: нажмите «Оплатить по счёту» — пришлём реквизиты, счёт или карту. Хотите дождаться оплаты на сайте — оставьте email.",
            })}
          </div>
        )}

        {/* TABS */}
        {visibleTabs.length > 1 && (
        <div className="d-flex justify-content-center mb-5">
          <div
            className="d-flex rounded-pill p-1 gap-1"
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(0,0,0,0.08)",
              backdropFilter: "blur(8px)",
            }}
          >
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`btn rounded-pill px-4 py-2 fw-semibold ${
                  activeTab === tab.key
                    ? "btn-primary shadow-sm"
                    : "btn-link text-muted text-decoration-none"
                }`}
                style={{ fontSize: 15 }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* PATIENTS */}
        {activeTab === "patients" && (
          <motion.div
            key="patients"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {!userRole && <GuestBanner t={t} />}
            <div className="row g-4 justify-content-center">
              {PATIENT_PLANS.map((plan) => (
                <div key={plan.key} className="col-md-4">
                  <PlanCard
                  plan={plan}
                  period={period}
                  t={t}
                  currentPlanKey={currentPlanKey}
                  paymentsEnabled={paymentsEnabled}
                />
                </div>
              ))}
            </div>            <div className="text-center mt-5">
              <p className="text-muted small">{t("patientFooter")}</p>
            </div>
          </motion.div>
        )}

        {/* DOCTORS */}
        {activeTab === "doctors" && (
          <motion.div
            key="doctors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {!currentPlanKey && <DoctorBanner t={t} />}
            <div className="row g-4 justify-content-center">
              {DOCTOR_PLANS.map((plan) => (
                <div key={plan.key} className="col-md-4">
                  <PlanCard
                  plan={plan}
                  period={period}
                  t={t}
                  currentPlanKey={currentPlanKey}
                  paymentsEnabled={paymentsEnabled}
                />
                </div>
              ))}
            </div>            <div className="text-center mt-5">
              <p className="text-muted small">{t("doctorFooter")}</p>
            </div>
          </motion.div>
        )}

        {/* CLINICS */}
        {activeTab === "clinics" && (
          <motion.div
            key="clinics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="row g-4 justify-content-center">
              {CLINIC_PLANS.map((plan) => (
                <div key={plan.key} className="col-md-4">
                  <PlanCard
                  plan={plan}
                  period={period}
                  t={t}
                  currentPlanKey={currentPlanKey}
                  paymentsEnabled={paymentsEnabled}
                />
                </div>
              ))}
            </div>            <div className="text-center mt-5">
              <p className="text-muted small">{t("clinicFooter")}</p>
            </div>
          </motion.div>
        )}

        {/* FOOTER */}
        <div className="text-center mt-5">
          <p className="text-muted small">
            {t("page.footerSupport")}{" "}
            <a href="mailto:support@docpats.com" className="text-primary">
              support@docpats.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
