import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LanguageSwitcher from "../components/LanguageSwitcher";

// ─── Тарифы пациентов ─────────────────────────────────────────────
const PATIENT_PLANS = [
  {
    key: "free",
    name: "Бесплатный",
    price: "Бесплатно",
    priceNote: "после регистрации",
    desc: "Базовый доступ для зарегистрированных пациентов",
    highlight: false,
    cta: "Зарегистрироваться",
    ctaPath: "/register",
    features: [
      { text: "5 AI консультаций в месяц", ok: true },
      { text: "3 эпикриза в формате SOAP", ok: true },
      { text: "Рекомендации врачей DocPats", ok: true },
      { text: "20 сообщений AI в день", ok: true },
      { text: "Запись к врачу через DocPats", ok: true },
      { text: "История консультаций", ok: false },
      { text: "Экспорт эпикриза в PDF", ok: false },
      { text: "Онлайн-консультация с врачом", ok: false },
      { text: "Напоминания о приёме", ok: false },
    ],
  },
  {
    key: "standard",
    name: "Стандарт",
    price: "9",
    priceNote: "AZN / мес",
    desc: "Полноценное использование AI для здоровья",
    highlight: false,
    cta: "Подключить",
    ctaPath: "/pricing/checkout?plan=standard",
    features: [
      { text: "15 AI консультаций в месяц", ok: true },
      { text: "15 эпикризов в формате SOAP", ok: true },
      { text: "Рекомендации врачей DocPats", ok: true },
      { text: "60 сообщений AI в день", ok: true },
      { text: "Запись к врачу через DocPats", ok: true },
      { text: "История консультаций (6 мес)", ok: true },
      { text: "Экспорт эпикриза в PDF", ok: true },
      { text: "Онлайн-консультация с врачом", ok: true },
      { text: "Напоминания о приёме", ok: true },
    ],
  },
  {
    key: "premium",
    name: "Премиум",
    price: "19",
    priceNote: "AZN / мес",
    desc: "Безлимитный доступ и приоритет во всём",
    highlight: true,
    cta: "Подключить",
    ctaPath: "/pricing/checkout?plan=premium",
    features: [
      { text: "Безлимитные AI консультации", ok: true },
      { text: "Безлимитные эпикризы SOAP", ok: true },
      { text: "Рекомендации врачей DocPats", ok: true },
      { text: "150 сообщений AI в день", ok: true },
      { text: "Запись к врачу через DocPats", ok: true },
      { text: "Полная история консультаций", ok: true },
      { text: "Экспорт эпикриза в PDF", ok: true },
      { text: "Онлайн-консультация с врачом", ok: true },
      { text: "Приоритетный подбор врача", ok: true },
    ],
  },
];

// ─── Тарифы врачей ────────────────────────────────────────────────
const DOCTOR_PLANS = [
  {
    key: "doctor_free",
    name: "Бесплатный",
    price: "Бесплатно",
    priceNote: "после регистрации",
    desc: "Базовое присутствие на платформе",
    highlight: false,
    cta: "Зарегистрироваться",
    ctaPath: "/register",
    features: [
      { text: "Профиль врача на DocPats", ok: true },
      { text: "До 5 записей в месяц", ok: true },
      { text: "5 AI анализов в месяц", ok: true },
      { text: "5 эпикризов в месяц", ok: true },
      { text: "30 сообщений AI в день", ok: true },
      { text: "Приоритет в рекомендациях AI", ok: false },
      { text: "Онлайн-приёмы (видео)", ok: false },
      { text: "Прямые онлайн-платежи", ok: false },
      { text: "Комиссия DocPats 15%", ok: true },
    ],
  },
  {
    key: "doctor_super",
    name: "Супер",
    price: "23",
    priceNote: "AZN / мес",
    desc: "Для врачей которые только начинают",
    highlight: false,
    cta: "Подключить",
    ctaPath: "/pricing/checkout?plan=doctor_super",
    features: [
      { text: "Профиль врача на DocPats", ok: true },
      { text: "До 30 записей в месяц", ok: true },
      { text: "30 AI анализов в месяц", ok: true },
      { text: "30 эпикризов в месяц", ok: true },
      { text: "90 сообщений AI в день", ok: true },
      { text: "Приоритет в рекомендациях AI", ok: false },
      { text: "Онлайн-приёмы (видео)", ok: true },
      { text: "Прямые онлайн-платежи", ok: true },
      { text: "Комиссия DocPats 12%", ok: true },
    ],
  },
  {
    key: "doctor_pro",
    name: "Профессионал",
    price: "49",
    priceNote: "AZN / мес",
    desc: "Полный инструментарий для частной практики",
    highlight: true,
    cta: "Подключить",
    ctaPath: "/pricing/checkout?plan=doctor_pro",
    features: [
      { text: "Приоритетный профиль врача", ok: true },
      { text: "Безлимитные записи пациентов", ok: true },
      { text: "100 AI анализов в месяц", ok: true },
      { text: "100 эпикризов SOAP в месяц", ok: true },
      { text: "200 сообщений AI в день", ok: true },
      { text: "Приоритет в рекомендациях AI", ok: true },
      { text: "Онлайн-приёмы (видео)", ok: true },
      { text: "Прямые онлайн-платежи", ok: true },
      { text: "Комиссия DocPats 10%", ok: true },
    ],
  },
];

// ─── Тарифы клиник ────────────────────────────────────────────────
const CLINIC_PLANS = [
  {
    key: "clinic_start",
    name: "Старт",
    price: "99",
    priceNote: "AZN / мес",
    desc: "Для небольших клиник до 5 врачей",
    highlight: false,
    cta: "Подключить",
    ctaPath: "/pricing/checkout?plan=clinic_start",
    features: [
      { text: "До 5 врачей в аккаунте", ok: true },
      { text: "Профили всех врачей на DocPats", ok: true },
      { text: "Единое расписание клиники", ok: true },
      { text: "100 AI анализов в месяц", ok: true },
      { text: "100 эпикризов SOAP в месяц", ok: true },
      { text: "150 сообщений AI в день", ok: true },
      { text: "Онлайн-приёмы (видео)", ok: true },
      { text: "Прямые онлайн-платежи", ok: true },
      { text: "Аналитика по клинике", ok: false },
      { text: "Топ в рекомендациях AI", ok: false },
      { text: "Комиссия DocPats 10%", ok: true },
    ],
  },
  {
    key: "clinic",
    name: "Клиника",
    price: "149",
    priceNote: "AZN / мес",
    desc: "Для клиник до 10 врачей",
    highlight: true,
    cta: "Подключить",
    ctaPath: "/pricing/checkout?plan=clinic",
    features: [
      { text: "До 10 врачей в аккаунте", ok: true },
      { text: "Профили всех врачей на DocPats", ok: true },
      { text: "Единое расписание клиники", ok: true },
      { text: "Безлимитные AI анализы", ok: true },
      { text: "Безлимитные эпикризы SOAP", ok: true },
      { text: "500 сообщений AI в день", ok: true },
      { text: "Онлайн-приёмы (видео)", ok: true },
      { text: "Прямые онлайн-платежи", ok: true },
      { text: "Аналитика по клинике", ok: true },
      { text: "Топ в рекомендациях AI", ok: true },
      { text: "Комиссия DocPats 7%", ok: true },
    ],
  },
  {
    key: "clinic_pro",
    name: "Медцентр",
    price: "299",
    priceNote: "AZN / мес",
    desc: "Для крупных медицинских центров",
    highlight: false,
    cta: "Связаться",
    ctaPath: "/contact?subject=clinic_pro",
    features: [
      { text: "Неограниченное кол-во врачей", ok: true },
      { text: "Профили всех врачей на DocPats", ok: true },
      { text: "Единое расписание и CRM", ok: true },
      { text: "Безлимитные AI анализы", ok: true },
      { text: "Безлимитные эпикризы SOAP", ok: true },
      { text: "Безлимитные сообщения AI", ok: true },
      { text: "Онлайн-приёмы (видео)", ok: true },
      { text: "Прямые онлайн-платежи", ok: true },
      { text: "Расширенная аналитика и отчёты", ok: true },
      { text: "Топ в рекомендациях AI", ok: true },
      { text: "Комиссия DocPats 5%", ok: true },
    ],
  },
];

// ─── Карточка тарифа ─────────────────────────────────────────────
function PlanCard({ plan }) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 250 }}
      className="h-100"
    >
      <div
        className={`card border-0 rounded-4 h-100 ${
          plan.highlight
            ? "shadow-lg border border-primary border-2"
            : "shadow-sm"
        }`}
      >
        <div className="card-body d-flex flex-column p-4">
          {plan.highlight && (
            <span className="badge bg-primary mb-3 align-self-center px-3 py-2">
              Рекомендуется
            </span>
          )}

          <h4 className="fw-bold mb-1">{plan.name}</h4>

          <div className="mb-1">
            <span className="fs-2 fw-bold">{plan.price}</span>
            {plan.priceNote && (
              <span className="text-muted fs-6 ms-2">{plan.priceNote}</span>
            )}
          </div>

          <p className="text-muted small mb-3">{plan.desc}</p>

          <hr className="my-2" />

          <ul className="list-unstyled mt-2 mb-4 flex-grow-1">
            {plan.features.map((f, i) => (
              <li key={i} className="mb-2 d-flex align-items-start gap-2">
                <span style={{ fontSize: 13, marginTop: 2, flexShrink: 0 }}>
                  {f.ok ? "✅" : "⬜"}
                </span>
                <span
                  className={f.ok ? "" : "text-muted"}
                  style={{ fontSize: 13, lineHeight: 1.45 }}
                >
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <button
            className={`btn rounded-3 mt-auto fw-semibold ${
              plan.highlight ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => navigate(plan.ctaPath)}
          >
            {plan.cta}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Баннер для гостя ─────────────────────────────────────────────
function GuestBanner() {
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
        <strong>Попробуй бесплатно</strong>
        <div className="text-muted small mt-1">
          Без регистрации — 2 пробные консультации. После регистрации —
          бесплатный план с 5 консультациями каждый месяц.
        </div>
      </div>
      <button
        className="btn btn-primary rounded-3 flex-shrink-0"
        onClick={() => navigate("/register")}
      >
        Зарегистрироваться
      </button>
    </motion.div>
  );
}

// ─── Главная страница ─────────────────────────────────────────────
export default function PricingPage() {
  const location = useLocation();
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [activeTab, setActiveTab] = useState("patients");

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

  const TABS = [
    { key: "patients", label: "Для пациентов" },
    { key: "doctors", label: "Для врачей" },
    { key: "clinics", label: "Для клиник" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)",
        padding: "40px 0 80px",
      }}
    >
      <Helmet>
        <title>Тарифы — DocPats</title>
        <meta
          name="description"
          content="Выберите подходящий тариф DocPats для врачей, пациентов и клиник"
        />
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
            <strong>Лимит консультаций исчерпан</strong>
            <div className="mt-1 text-muted small">
              Выберите тариф чтобы продолжить
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
            ← Назад
          </Link>
        </div>

        {/* HEADER */}
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="fw-bold mb-2">Тарифы DocPats</h1>
          <p className="text-muted">
            Выберите план для пациентов, врачей или клиник
          </p>
        </motion.div>

        {/* TABS */}
        <div className="d-flex justify-content-center mb-5">
          <div
            className="d-flex rounded-pill p-1 gap-1"
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(0,0,0,0.08)",
              backdropFilter: "blur(8px)",
            }}
          >
            {TABS.map((tab) => (
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

        {/* PATIENTS */}
        {activeTab === "patients" && (
          <motion.div
            key="patients"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GuestBanner />
            <div className="row g-4 justify-content-center">
              {PATIENT_PLANS.map((plan) => (
                <div key={plan.key} className="col-md-4">
                  <PlanCard plan={plan} />
                </div>
              ))}
            </div>
            <div className="text-center mt-5">
              <p className="text-muted small">
                💡 Регистрация бесплатна и занимает 1 минуту. После регистрации
                лимиты привязываются к аккаунту.
              </p>
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
            <div className="row g-4 justify-content-center">
              {DOCTOR_PLANS.map((plan) => (
                <div key={plan.key} className="col-md-4">
                  <PlanCard plan={plan} />
                </div>
              ))}
            </div>
            <div className="text-center mt-5">
              <p className="text-muted small">
                💡 Чем выше тариф — тем ниже комиссия DocPats с каждой записи.
                Врач окупает подписку уже с 2-3 пациентов в месяц.
              </p>
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
                  <PlanCard plan={plan} />
                </div>
              ))}
            </div>
            <div className="text-center mt-5">
              <p className="text-muted small">
                💡 Тариф Медцентр включает персонального менеджера и
                индивидуальную настройку под нужды вашей клиники. Свяжитесь с
                нами для обсуждения деталей.
              </p>
            </div>
          </motion.div>
        )}

        {/* FOOTER */}
        <div className="text-center mt-5">
          <p className="text-muted small">
            Все тарифы включают базовую поддержку. Вопросы?{" "}
            <a href="mailto:support@docpats.com" className="text-primary">
              support@docpats.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
