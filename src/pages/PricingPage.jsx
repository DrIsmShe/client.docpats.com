import React, { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

// ═════════════════════════════════════════════════════════════════════
//   Цены (USD) — синхронизированы с server/common/config/aiPlanLimits.js
//   PLAN_PRICES. Если меняешь там — меняй и здесь.
// ═════════════════════════════════════════════════════════════════════
const PRICES_USD = {
  patient_std: { monthly: 5, yearly: 48 },
  patient_pro: { monthly: 11, yearly: 106 },
  doctor_basic: { monthly: 3.5, yearly: 34 },
  doctor_super: { monthly: 13, yearly: 125 },
  doctor_pro: { monthly: 29, yearly: 278 },
  clinic_start: { monthly: 59, yearly: 566 },
  clinic: { monthly: 99, yearly: 950 },
  clinic_pro: { monthly: 199, yearly: 1910 },
};

// ═════════════════════════════════════════════════════════════════════
//   СТРУКТУРЫ ПЛАНОВ
//   Каждая фича — это объект { i18nKey, vars? } для интерполяции.
//   Сами тексты приходят из переводов через t().
// ═════════════════════════════════════════════════════════════════════

const PATIENT_PLANS = [
  {
    key: "patient_free",
    free: true,
    highlight: false,
    cta: "register",
    ctaPath: "/register",
    features: [
      { i18nKey: "features.aiConsultations", vars: { count: 7 } },
      { i18nKey: "features.aiArticlesOne" },
      { i18nKey: "features.soapEpicrises", vars: { count: 7 } },
      { i18nKey: "features.viewDocuments" },
      { i18nKey: "features.bookDoctor" },
      { i18nKey: "features.paidConsultations" },
      { i18nKey: "features.consultationDiscountNo", off: true },
      { i18nKey: "features.exportPdf", off: true },
      { i18nKey: "features.translateDocs5", off: true },
    ],
  },
  {
    key: "patient_std",
    highlight: false,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=patient_std",
    features: [
      { i18nKey: "features.aiConsultations", vars: { count: 20 } },
      { i18nKey: "features.aiArticles", vars: { count: 3 } },
      { i18nKey: "features.soapEpicrises", vars: { count: 20 } },
      { i18nKey: "features.fullHistory" },
      { i18nKey: "features.exportPdf" },
      { i18nKey: "features.consultationDiscount", vars: { percent: 10 } },
      { i18nKey: "features.medReminders" },
      { i18nKey: "features.translateDocs2" },
      { i18nKey: "features.translateDocs5", off: true },
    ],
  },
  {
    key: "patient_pro",
    highlight: true,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=patient_pro",
    features: [
      { i18nKey: "features.aiConsultations", vars: { count: 60 } },
      { i18nKey: "features.aiArticles", vars: { count: 10 } },
      { i18nKey: "features.soapEpicrises", vars: { count: 60 } },
      { i18nKey: "features.fullHistoryBackup" },
      { i18nKey: "features.exportPdf" },
      { i18nKey: "features.consultationDiscount", vars: { percent: 20 } },
      { i18nKey: "features.medReminders" },
      { i18nKey: "features.doctorPriorityQueue" },
      { i18nKey: "features.translateDocs5" },
    ],
  },
];

const DOCTOR_PLANS = [
  {
    key: "doctor_basic",
    highlight: false,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=doctor_basic",
    showTrialNote: true,
    features: [
      { i18nKey: "features.doctorProfile" },
      { i18nKey: "features.aiAnalyses", vars: { count: 7 } },
      { i18nKey: "features.aiArticles", vars: { count: 3 } },
      { i18nKey: "features.soapEpicrises", vars: { count: 7 } },
      { i18nKey: "features.aiPatientConsultations", vars: { count: 5 } },
      { i18nKey: "features.patientsInOffice", vars: { count: 5 } },
      { i18nKey: "features.videoMinutes", vars: { count: 30 } },
      { i18nKey: "features.directPayments" },
      { i18nKey: "features.commission", vars: { percent: 15 } },
    ],
  },
  {
    key: "doctor_super",
    highlight: false,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=doctor_super",
    features: [
      { i18nKey: "features.doctorProfile" },
      { i18nKey: "features.aiAnalyses", vars: { count: 30 } },
      { i18nKey: "features.aiArticles", vars: { count: 10 } },
      { i18nKey: "features.soapEpicrises", vars: { count: 30 } },
      { i18nKey: "features.aiPatientConsultations", vars: { count: 30 } },
      { i18nKey: "features.patientsInOffice", vars: { count: 60 } },
      {
        i18nKey: "features.videoMinutesHours",
        vars: { count: 600, hours: 10 },
      },
      { i18nKey: "features.directPayments" },
      { i18nKey: "features.commission", vars: { percent: 12 } },
    ],
  },
  {
    key: "doctor_pro",
    highlight: true,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=doctor_pro",
    features: [
      { i18nKey: "features.doctorProfilePriority" },
      { i18nKey: "features.aiAnalyses", vars: { count: 100 } },
      { i18nKey: "features.aiArticles", vars: { count: 30 } },
      { i18nKey: "features.soapEpicrises", vars: { count: 100 } },
      { i18nKey: "features.aiConsultationsUnlimited" },
      { i18nKey: "features.patientsInOfficeUnlimited" },
      {
        i18nKey: "features.videoMinutesHours",
        vars: { count: 1500, hours: 25 },
      },
      { i18nKey: "features.aiPriority" },
      { i18nKey: "features.commission", vars: { percent: 10 } },
    ],
  },
];

const CLINIC_PLANS = [
  {
    key: "clinic_start",
    highlight: false,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=clinic_start",
    features: [
      { i18nKey: "features.doctorsInClinic", vars: { count: 5 } },
      { i18nKey: "features.allDoctorsProfiles" },
      { i18nKey: "features.unifiedSchedule" },
      { i18nKey: "features.aiAnalyses", vars: { count: 100 } },
      { i18nKey: "features.aiArticles", vars: { count: 30 } },
      { i18nKey: "features.soapEpicrises", vars: { count: 100 } },
      { i18nKey: "features.videoMinutesClinic", vars: { count: 1500 } },
      { i18nKey: "features.directPayments" },
      { i18nKey: "features.clinicAnalytics", off: true },
      { i18nKey: "features.topInRecommendations", off: true },
      { i18nKey: "features.commission", vars: { percent: 10 } },
    ],
  },
  {
    key: "clinic",
    highlight: true,
    cta: "subscribe",
    ctaPath: "/pricing/checkout?plan=clinic",
    features: [
      { i18nKey: "features.doctorsInClinic", vars: { count: 10 } },
      { i18nKey: "features.allDoctorsProfiles" },
      { i18nKey: "features.unifiedSchedule" },
      { i18nKey: "features.aiAnalysesUnlimited" },
      { i18nKey: "features.aiArticlesUnlimited" },
      { i18nKey: "features.soapEpicrisesUnlimited" },
      {
        i18nKey: "features.videoMinutesClinicHours",
        vars: { count: 5000, hours: 83 },
      },
      { i18nKey: "features.directPayments" },
      { i18nKey: "features.clinicAnalytics" },
      { i18nKey: "features.topInRecommendations" },
      { i18nKey: "features.commission", vars: { percent: 7 } },
    ],
  },
  {
    key: "clinic_pro",
    highlight: false,
    cta: "contact",
    ctaPath: "/contact?subject=clinic_pro",
    features: [
      { i18nKey: "features.doctorsInClinicUnlimited" },
      { i18nKey: "features.allDoctorsProfiles" },
      { i18nKey: "features.unifiedScheduleCrm" },
      { i18nKey: "features.allAiUnlimited" },
      { i18nKey: "features.videoMinutesUnlimited" },
      { i18nKey: "features.directPayments" },
      { i18nKey: "features.extendedAnalytics" },
      { i18nKey: "features.topInRecommendations" },
      { i18nKey: "features.personalManager" },
      { i18nKey: "features.commission", vars: { percent: 5 } },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
//                    КАРТОЧКА ТАРИФА
// ═════════════════════════════════════════════════════════════════════
function PlanCard({ plan, period, t }) {
  const navigate = useNavigate();
  const isFree = !!plan.free;
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
          plan.highlight
            ? "shadow-lg border border-primary border-2"
            : "shadow-sm"
        }`}
      >
        <div className="card-body d-flex flex-column p-4">
          {plan.highlight && (
            <span className="badge bg-primary mb-3 align-self-center px-3 py-2">
              {t("card.recommended")}
            </span>
          )}

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

          <p className="text-muted small mb-3">{t(`plans.${plan.key}.desc`)}</p>

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

          <button
            className={`btn rounded-3 mt-auto fw-semibold ${
              plan.highlight ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => {
              const path = plan.ctaPath || "/";
              // На страницу оплаты пробрасываем выбранный период (мес/год).
              navigate(
                path.startsWith("/pricing/checkout")
                  ? `${path}&period=${period}`
                  : path,
              );
            }}
          >
            {t(ctaLabelKey)}
          </button>
        </div>
      </div>
    </motion.div>
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
        onClick={() => navigate("/register")}
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
        onClick={() => navigate("/register")}
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

  const TABS = useMemo(
    () => [
      { key: "patients", label: t("tabs.patients") },
      { key: "doctors", label: t("tabs.doctors") },
      { key: "clinics", label: t("tabs.clinics") },
    ],
    [t],
  );

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
          <p className="text-muted">{t("page.subtitle")}</p>
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
            <GuestBanner t={t} />
            <div className="row g-4 justify-content-center">
              {PATIENT_PLANS.map((plan) => (
                <div key={plan.key} className="col-md-4">
                  <PlanCard plan={plan} period={period} t={t} />
                </div>
              ))}
            </div>
            <div className="text-center mt-5">
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
            <DoctorBanner t={t} />
            <div className="row g-4 justify-content-center">
              {DOCTOR_PLANS.map((plan) => (
                <div key={plan.key} className="col-md-4">
                  <PlanCard plan={plan} period={period} t={t} />
                </div>
              ))}
            </div>
            <div className="text-center mt-5">
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
                  <PlanCard plan={plan} period={period} t={t} />
                </div>
              ))}
            </div>
            <div className="text-center mt-5">
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
