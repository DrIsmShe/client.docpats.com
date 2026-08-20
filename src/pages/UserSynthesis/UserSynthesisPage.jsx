import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  generateArticle,
  getMyLimit,
  getMyArticles,
} from "../../api/userSynthesis";

// ─── Стили статей (значения для бэка не меняем — переводим только labels) ───
const STYLE_KEYS = ["analytical", "clinical", "popular", "review", "education"];

// ─── Языки контента — labels на родных языках, не локализуем ─────
const LANGUAGES = [
  { value: "ru", labelKey: "ru" },
  { value: "en", labelKey: "en" },
  { value: "az", labelKey: "az" },
  { value: "ar", labelKey: "ar" },
  { value: "tr", labelKey: "tr" },
];

function SourceCard({ source, index, onChange, onRemove, canRemove, t }) {
  return (
    <div
      style={{
        background: "var(--paper2)",
        border: "1px solid var(--rule)",
        borderRadius: 4,
        padding: "14px 16px",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          {t("form.sourceN", { n: index + 1 })}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            style={{
              background: "none",
              border: "1px solid var(--rule)",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 12,
              padding: "1px 8px",
            }}
          >
            ×
          </button>
        )}
      </div>
      <input
        type="text"
        placeholder={t("form.sourceTitle")}
        value={source.title}
        onChange={(e) => onChange("title", e.target.value)}
        style={inputStyle}
      />
      <input
        type="url"
        placeholder={t("form.sourceUrl")}
        value={source.url}
        onChange={(e) => onChange("url", e.target.value)}
        style={{ ...inputStyle, marginTop: 6 }}
      />
      <textarea
        placeholder={t("form.sourceExcerpt")}
        value={source.excerpt}
        onChange={(e) => onChange("excerpt", e.target.value)}
        rows={2}
        style={{ ...inputStyle, marginTop: 6, resize: "vertical" }}
      />
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13,
  border: "1px solid var(--rule)",
  background: "var(--paper)",
  color: "var(--ink)",
  fontFamily: "inherit",
  borderRadius: 2,
  outline: "none",
};

// ─── helper: определяем залогинен ли юзер по ответу лимита ───
function detectLoggedIn(limit) {
  if (!limit) return false;
  if (limit.role && limit.role !== "guest") return true;
  if (limit.plan && limit.plan !== "guest") {
    if (limit.limit <= 1 && limit.plan === "free") return false;
    return true;
  }
  return false;
}

// ─── Цены в USD, сетка v3 (совпадают с aiPlanLimits.js → PLAN_PRICES.monthly) ─
const PRICES = {
  patient_std: 9,
  patient_pro: 19,
  doctor_basic: 19,
  doctor_super: 49,
  doctor_pro: 99,
};

// ─── Адаптивный список секций для отображения ───
function getPlanSections({ isLoggedIn, role, plan }) {
  // Гость — обе секции
  if (!isLoggedIn) {
    return {
      showGuestTrialBanner: true,
      sections: [
        {
          title: "patients",
          items: [
            { key: "guest", isCurrent: true, isFree: true },
            { key: "patient_free", isCurrent: false, isFree: true },
            { key: "patient_std", isCurrent: false, price: PRICES.patient_std },
            { key: "patient_pro", isCurrent: false, price: PRICES.patient_pro },
          ],
        },
        {
          title: "doctors",
          items: [
            {
              key: "doctor_basic",
              isCurrent: false,
              price: PRICES.doctor_basic,
            },
            {
              key: "doctor_super",
              isCurrent: false,
              price: PRICES.doctor_super,
            },
            { key: "doctor_pro", isCurrent: false, price: PRICES.doctor_pro },
          ],
        },
      ],
    };
  }

  // Пациент — только секция пациентов, без заголовка
  const isPatient = role === "patient" || role === "user";
  if (isPatient) {
    return {
      showGuestTrialBanner: false,
      sections: [
        {
          title: null,
          items: [
            {
              key: "patient_free",
              isCurrent: plan === "patient_free",
              isFree: true,
            },
            {
              key: "patient_std",
              isCurrent: plan === "patient_std",
              price: PRICES.patient_std,
            },
            {
              key: "patient_pro",
              isCurrent: plan === "patient_pro",
              price: PRICES.patient_pro,
            },
          ],
        },
      ],
    };
  }

  // Врач
  if (role === "doctor") {
    // В trial — показываем trial-баннер + платные планы
    if (plan === "doctor_trial") {
      return {
        showGuestTrialBanner: false,
        sections: [
          {
            title: null,
            items: [
              { key: "doctor_trial", isCurrent: true, isTrial: true },
              {
                key: "doctor_basic",
                isCurrent: false,
                price: PRICES.doctor_basic,
              },
              {
                key: "doctor_super",
                isCurrent: false,
                price: PRICES.doctor_super,
              },
              { key: "doctor_pro", isCurrent: false, price: PRICES.doctor_pro },
            ],
          },
        ],
      };
    }
    return {
      showGuestTrialBanner: false,
      sections: [
        {
          title: null,
          items: [
            {
              key: "doctor_basic",
              isCurrent: plan === "doctor_basic",
              price: PRICES.doctor_basic,
            },
            {
              key: "doctor_super",
              isCurrent: plan === "doctor_super",
              price: PRICES.doctor_super,
            },
            {
              key: "doctor_pro",
              isCurrent: plan === "doctor_pro",
              price: PRICES.doctor_pro,
            },
          ],
        },
      ],
    };
  }

  // Admin / прочие — fallback
  return {
    showGuestTrialBanner: false,
    sections: [
      {
        title: null,
        items: [
          { key: "doctor_basic", isCurrent: false, price: PRICES.doctor_basic },
          { key: "doctor_super", isCurrent: false, price: PRICES.doctor_super },
          { key: "doctor_pro", isCurrent: false, price: PRICES.doctor_pro },
        ],
      },
    ],
  };
}

export default function UserSynthesisPage() {
  const { t, i18n } = useTranslation("UserSynthesis");
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("analytical");
  const [language, setLanguage] = useState(i18n.language || "ru");
  const [sources, setSources] = useState([
    { id: 1, title: "", url: "", excerpt: "" },
  ]);
  const [limit, setLimit] = useState(null);
  const [myArticles, setMyArticles] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  // Доступ к разделу: checking | allowed | guest | denied.
  const [access, setAccess] = useState("checking");

  // Роль спрашиваем у сессии напрямую: лимит генераций для пациента теперь
  // отвечает 403, и по нему нельзя отличить «не врач» от «сервер прилёг».
  useEffect(() => {
    let alive = true;
    fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:11000"}/common-for-user`,
      { credentials: "include" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        const u = data?.user || data;
        if (!data || data.authenticated === false || !u?.role) {
          return setAccess("guest");
        }
        setAccess(
          ["doctor", "admin", "superadmin"].includes(u.role)
            ? "allowed"
            : "denied",
        );
      })
      .catch(() => alive && setAccess("guest"));
    return () => {
      alive = false;
    };
  }, []);

  const isLoggedIn = detectLoggedIn(limit);
  const isPatient = limit?.role === "patient" || limit?.role === "user";
  const isTrial = limit?.plan === "doctor_trial";
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    getMyLimit()
      .then((r) => setLimit(r.data))
      .catch(() => {});
    getMyArticles({ limit: 5 })
      .then((r) => setMyArticles(r.data.articles || []))
      .catch(() => {});
  }, []);

  const addSource = () =>
    setSources((p) => [
      ...p,
      { id: Date.now(), title: "", url: "", excerpt: "" },
    ]);

  const removeSource = (id) => setSources((p) => p.filter((s) => s.id !== id));

  const updateSource = (id, field, value) =>
    setSources((p) =>
      p.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError(t("form.topicRequired"));
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await generateArticle({
        topic: topic.trim(),
        style,
        language,
        sources: sources
          .filter((s) => s.title)
          .map((s) => ({
            title: s.title,
            url: s.url,
            excerpt: s.excerpt,
          })),
      });
      navigate("/user-synthesis/result", { state: { article: res.data } });
    } catch (err) {
      const msg = err.response?.data?.message || t("form.errorGeneric");
      const isPersonalBlock =
        msg.includes("Этот генератор пишет") ||
        msg.includes("educational articles");
      if (isPersonalBlock) {
        setError(
          <span>
            {msg}{" "}
            <Link
              to="/consultation"
              style={{
                color: "#b83030",
                fontWeight: 500,
                textDecoration: "underline",
              }}
            >
              {t("form.openAiConsultation")}
            </Link>
          </span>,
        );
      } else {
        setError(msg);
      }
      setStatus("error");
    }
  };

  const limitReached = limit && !limit.allowed;
  const isDisabled = status === "loading" || limitReached;

  let buttonText;
  if (status === "loading") {
    buttonText = t("buttons.generating");
  } else if (limitReached && !isLoggedIn) {
    buttonText = t("buttons.registerToContinue");
  } else if (limitReached && isLoggedIn) {
    buttonText = t("buttons.limitMonthly");
  } else {
    buttonText = t("buttons.create");
  }

  // ─── Адаптивные секции планов ───
  const { showGuestTrialBanner, sections } = getPlanSections({
    isLoggedIn,
    role: limit?.role,
    plan: limit?.plan,
  });

  // Локаль для форматирования даты
  const dateLocaleMap = {
    ru: "ru-RU",
    en: "en-GB",
    az: "az-AZ",
    tr: "tr-TR",
    ar: "ar-AE",
  };
  const dateLocale = dateLocaleMap[i18n.language] || "ru-RU";

  // Сколько статей в месяц даёт тариф — по данным сервера.
  //
  // Раньше эти числа лежали в файлах переводов и разошлись с действительностью
  // все сразу: баннер пробного периода обещал 10 статей рядом со счётчиком
  // «2 / 4», Doctor Start продавал 3 вместо 4, Growth — 15 вместо 12, Pro —
  // «безлимит» вместо 25. Теперь витрина берёт числа оттуда же, откуда берётся
  // запрет (aiPlanLimits.js), и разойтись им больше негде.
  const planArticles = (key) => limit?.catalog?.[key]?.articles;

  const planLimitLabel = (key) => {
    const n = planArticles(key);
    if (n === undefined) return t(`plans.${key}.limit`, ""); // тариф вне каталога
    if (n === -1) return t("plans.unlimited", "безлимит");
    // Переменная называется n, а не count: имя count включает у i18next
    // правила множественного числа и требует ключей с суффиксами _one/_other,
    // которых в словарях нет — подпись просто не находилась бы.
    return t("plans.perMonthCount", { n, defaultValue: `${n} статей/мес` });
  };

  // ─── Render-функция для одного пункта плана ───
  const renderPlanItem = (p) => {
    // Trial-баннер врача (для залогиненного врача в trial)
    if (p.isTrial) {
      const trialCount = planArticles(limit?.plan) ?? limit?.limit;
      return (
        <div key={p.key} className="us-trial-banner">
          <div className="us-trial-banner-title">
            {t("plans.trialBanner.title")}
          </div>
          <div className="us-trial-banner-text">
            {t("plans.trialBanner.text", { n: trialCount })}
          </div>
          <Link to="/pricing" className="us-trial-banner-cta">
            {t("plans.trialBanner.cta")}
          </Link>
        </div>
      );
    }

    return (
      <div
        key={p.key}
        className={`us-plan-item ${p.isCurrent ? "us-plan-item-current" : ""}`}
      >
        <span className="us-plan-name">
          {t(`plans.${p.key}.name`)}
          {p.isCurrent && (
            <span className="us-plan-current-badge">
              {t("plans.currentPlan")}
            </span>
          )}
        </span>
        <span className="us-plan-limit">{planLimitLabel(p.key)}</span>
        <span className="us-plan-price">
          {p.isFree
            ? t("plans.freeForever")
            : `$${p.price}${t("plans.perMonth")}`}
        </span>
      </div>
    );
  };

  // ── Раздел только для врачей ──────────────────────────────────────────
  // Пока идёт проверка, не показываем ничего: мигнуть формой создания
  // статьи перед пациентом и тут же её отобрать — хуже, чем секунда пустоты.
  // Настоящий запрет стоит на сервере (requireDoctorRole на /api/user-synthesis);
  // здесь — объяснение, почему страница пуста.
  if (access === "checking") return null;

  if (access !== "allowed") {
    return (
      <>
        <style>{CSS}</style>
        <div className="us-page" dir={isRTL ? "rtl" : "ltr"}>
          <div className="us-topbar">
            <span>{t("topbar.brand")}</span>
            <span>{t("topbar.createArticle")}</span>
          </div>

          <div
            style={{
              maxWidth: 560,
              margin: "80px auto",
              padding: "28px 26px",
              border: "1px solid var(--rule)",
              borderRadius: 6,
              background: "var(--paper2)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 34, marginBottom: 10 }}>🩺</div>
            <h1 style={{ fontSize: 22, marginBottom: 10 }}>
              {t("gate.title", "Раздел только для врачей")}
            </h1>
            <p style={{ opacity: 0.75, lineHeight: 1.6, marginBottom: 20 }}>
              {access === "guest"
                ? t(
                    "gate.guest",
                    "Создание научной статьи по медицинским источникам доступно врачам платформы. Войдите в аккаунт врача.",
                  )
                : t(
                    "gate.denied",
                    "Создание научной статьи по медицинским источникам доступно только врачам.",
                  )}
            </p>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {access === "guest" && (
                <Link to="/login" className="us-btn-primary">
                  {t("gate.login", "Войти как врач")}
                </Link>
              )}
              <Link to="/news" className="us-nav-back">
                {t("gate.back", "К медицинским новостям")}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="us-page" dir={isRTL ? "rtl" : "ltr"}>
        <div className="us-topbar">
          <span>{t("topbar.brand")}</span>
          <span>{t("topbar.createArticle")}</span>
        </div>

        <nav className="us-nav">
          <Link to="/news" className="us-nav-back">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("nav.back")}
          </Link>
          <Link to="/news" className="us-nav-logo">
            Doc<span>Pats</span>
          </Link>
          <span className="us-nav-tag">{t("nav.tag")}</span>
        </nav>

        <header className="us-header">
          <div className="us-header-inner">
            <div className="us-label">{t("header.label")}</div>
            <h1 className="us-headline">{t("header.headline")}</h1>
            <div className="us-rule" />
            <p className="us-deck">{t("header.deck")}</p>

            {limit && (
              <div className="us-limit-bar">
                <span className="us-limit-plan">
                  {t("limit.plan")}:{" "}
                  <strong>
                    {isTrial
                      ? t("plans.doctor_super.name")
                      : t(`plans.${limit.plan}.name`, limit.plan || "free")}
                  </strong>
                  {isTrial && (
                    <span className="us-trial-pill">
                      {t("limit.trialBadge")}
                    </span>
                  )}
                </span>
                <span className="us-limit-count">
                  {t("limit.used")}: <strong>{limit.used}</strong> /{" "}
                  {limit.limit === Infinity || limit.limit === -1
                    ? "∞"
                    : limit.limit}{" "}
                  {t("limit.perMonth")}
                </span>
                {limitReached && (
                  <span className="us-limit-warn">
                    {!isLoggedIn ? (
                      <>
                        {t("limit.guestLimitReached")} ·{" "}
                        <Link to="/register">
                          {t("limit.guestRegisterCta")}
                        </Link>{" "}
                        {t("limit.guestBenefit")}
                      </>
                    ) : (
                      <>
                        {t("limit.userLimitReached")} ·{" "}
                        <Link to="/pricing">{t("limit.upgradePlanCta")}</Link>
                      </>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="us-main">
          <div className="us-main-inner">
            <div className="us-grid">
              {/* LEFT — форма */}
              <div className="us-form-col">
                <div className="us-form-section">
                  <label className="us-form-label">{t("form.topic")} *</label>
                  <input
                    type="text"
                    placeholder={t("form.topicPlaceholder")}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    style={{
                      ...inputStyle,
                      fontSize: 15,
                      padding: "12px 14px",
                    }}
                  />
                  <div className="us-form-hint">{t("form.topicHint")}</div>
                </div>

                {/* ─── Подсказка для пациентов ─── */}
                {isLoggedIn && isPatient && (
                  <div className="us-patient-hint">
                    <div className="us-patient-hint-title">
                      {t("patientHint.title")}
                    </div>
                    <div className="us-patient-hint-grid">
                      <div className="us-patient-hint-col us-patient-hint-ok">
                        <div className="us-patient-hint-label">
                          {t("patientHint.okLabel")}
                        </div>
                        <ul>
                          <li>{t("patientHint.ok1")}</li>
                          <li>{t("patientHint.ok2")}</li>
                          <li>{t("patientHint.ok3")}</li>
                          <li>{t("patientHint.ok4")}</li>
                          <li>{t("patientHint.ok5")}</li>
                          <li>{t("patientHint.ok6")}</li>
                        </ul>
                      </div>
                      <div className="us-patient-hint-col us-patient-hint-no">
                        <div className="us-patient-hint-label">
                          {t("patientHint.noLabel")}
                        </div>
                        <ul>
                          <li>{t("patientHint.no1")}</li>
                          <li>{t("patientHint.no2")}</li>
                          <li>{t("patientHint.no3")}</li>
                          <li>{t("patientHint.no4")}</li>
                        </ul>
                        <Link
                          to="/consultation"
                          className="us-patient-hint-cta"
                        >
                          {t("patientHint.ctaLink")}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <div className="us-form-row">
                  <div className="us-form-section" style={{ flex: 1 }}>
                    <label className="us-form-label">{t("form.style")}</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {STYLE_KEYS.map((s) => (
                        <option key={s} value={s}>
                          {t(`styles.${s}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="us-form-section" style={{ flex: 1 }}>
                    <label className="us-form-label">
                      {t("form.language")}
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {t(`languages.${l.labelKey}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="us-form-section">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <label className="us-form-label" style={{ margin: 0 }}>
                      {t("form.sources")}
                    </label>
                    <button onClick={addSource} className="us-add-btn">
                      {t("form.addSource")}
                    </button>
                  </div>
                  {sources.map((s, i) => (
                    <SourceCard
                      key={s.id}
                      source={s}
                      index={i}
                      onChange={(f, v) => updateSource(s.id, f, v)}
                      onRemove={() => removeSource(s.id)}
                      canRemove={sources.length > 1}
                      t={t}
                    />
                  ))}
                  <div className="us-form-hint">{t("form.sourcesHint")}</div>
                </div>

                {error && <div className="us-error">{error}</div>}

                {limitReached && !isLoggedIn ? (
                  <Link
                    to="/register"
                    className="us-generate-btn us-generate-btn-link"
                  >
                    {t("buttons.registerToContinue")}
                  </Link>
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={isDisabled}
                    className="us-generate-btn"
                  >
                    {buttonText}
                  </button>
                )}

                {limitReached && isLoggedIn && (
                  <div className="us-login-hint">
                    <Link to="/pricing">{t("buttons.upgradeHintBefore")}</Link>{" "}
                    {t("buttons.upgradeHintAfter")}
                  </div>
                )}

                {!isLoggedIn && !limitReached && (
                  <div className="us-login-hint">
                    <Link to="/login">{t("buttons.loginHintBefore")}</Link>{" "}
                    {t("buttons.loginHintAfter")}
                  </div>
                )}
              </div>

              {/* RIGHT — история и инфо */}
              <div className="us-info-col">
                <div className="us-info-card">
                  <div className="us-info-title">{t("info.whatYouGet")}</div>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="us-info-item">
                      <span className="us-info-check">✓</span>
                      <span>{t(`info.feature${i}`)}</span>
                    </div>
                  ))}
                </div>

                {/* ─── ОТДЕЛЬНАЯ КАРТОЧКА: Trial-баннер для гостя ─── */}
                {showGuestTrialBanner && (
                  <Link to="/register" className="us-guest-trial-card">
                    <div className="us-guest-trial-title">
                      {t("plans.guestTrialBanner.title")}
                    </div>
                    <div className="us-guest-trial-text">
                      {t("plans.guestTrialBanner.text")}
                    </div>
                    <div className="us-guest-trial-cta">
                      {t("plans.guestTrialBanner.cta")}
                    </div>
                  </Link>
                )}

                {/* ─── ПЛАНЫ — адаптивные секции ─── */}
                <div className="us-info-card">
                  <div className="us-info-title">{t("plans.title")}</div>

                  {sections.map((section, sectionIdx) => (
                    <div key={sectionIdx} className="us-plan-section">
                      {section.title && (
                        <div className="us-plan-section-title">
                          {section.title === "patients"
                            ? t("plans.sectionPatients")
                            : t("plans.sectionDoctors")}
                        </div>
                      )}
                      {section.items.map(renderPlanItem)}
                    </div>
                  ))}

                  <Link to="/pricing" className="us-upgrade-link">
                    {t("plans.upgradeCta")}
                  </Link>
                </div>

                {isLoggedIn && myArticles.length > 0 && (
                  <div className="us-info-card">
                    <div className="us-info-title">{t("info.myArticles")}</div>
                    {myArticles.map((a) => (
                      <Link
                        key={a._id}
                        to={`/public/user-synthesis/my/${a._id}`}
                        className="us-my-article"
                      >
                        <div className="us-my-title">{a.title}</div>
                        <div className="us-my-meta">
                          {t("info.wordsAndDate", {
                            words: a.wordCount?.toLocaleString() || 0,
                            date: new Date(a.createdAt).toLocaleDateString(
                              dateLocale,
                            ),
                          })}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
.us-page*,.us-page *::before,.us-page *::after{box-sizing:border-box}
.us-page{
  --paper:#f7f4ee;--paper2:#ede9e0;--ink:#1c1a16;--ink2:#3a3830;
  --muted:#7a7668;--rule:#cdc9bc;
  --serif:'Playfair Display',Georgia,serif;
  --mono:'IBM Plex Mono','Courier New',monospace;
  --sans:'IBM Plex Sans',-apple-system,sans-serif;
  background:var(--paper);min-height:100vh;color:var(--ink);
  font-family:var(--sans);-webkit-font-smoothing:antialiased;
}
.us-topbar{background:var(--ink);color:#6a6660;padding:0 40px;height:32px;
  display:flex;align-items:center;justify-content:space-between;
  font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.us-nav{position:sticky;top:0;z-index:200;background:var(--paper);
  border-bottom:3px double var(--ink);display:flex;align-items:center;
  justify-content:space-between;padding:0 40px;height:52px}
.us-nav-back{display:flex;align-items:center;gap:6px;text-decoration:none;
  font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);transition:color .15s}
.us-nav-back:hover{color:var(--ink)}
.us-nav-logo{font-family:'Playfair Display',Georgia,serif!important;
  font-size:26px;font-weight:900;letter-spacing:-.02em;color:var(--ink);text-decoration:none}
.us-nav-logo span{color:#b83030}
.us-nav-tag{font-family:var(--mono);font-size:10px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);border:1px solid var(--rule);padding:4px 12px}
.us-header{background:var(--paper2);border-bottom:2px solid var(--ink);padding:44px 0 0}
.us-header-inner{max-width:1000px;margin:0 auto;padding:0 40px 36px}
.us-label{font-family:var(--mono);font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.us-headline{font-family:var(--serif);font-size:clamp(26px,3.5vw,44px);font-weight:700;
  letter-spacing:-.025em;line-height:1.1;color:var(--ink);margin:0 0 18px}
.us-rule{height:4px;width:64px;background:#b83030;margin-bottom:16px}
.us-deck{font-family:var(--serif);font-size:17px;font-style:italic;
  color:var(--ink2);line-height:1.65;margin:0 0 20px}
.us-limit-bar{display:flex;align-items:center;gap:20px;flex-wrap:wrap;
  padding:10px 14px;background:var(--paper);border:1px solid var(--rule);
  font-family:var(--mono);font-size:11px;color:var(--muted)}
.us-limit-plan,.us-limit-count{color:var(--muted);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.us-limit-plan strong,.us-limit-count strong{color:var(--ink)}
.us-limit-warn{color:#b83030}
.us-limit-warn a{color:#b83030;font-weight:500}

/* ─── Trial pill в баннере лимитов ─── */
.us-trial-pill{
  display:inline-block;
  padding:2px 8px;
  font-family:var(--mono);
  font-size:9px;
  letter-spacing:.06em;
  text-transform:uppercase;
  background:#0d9488;
  color:#fff;
  border-radius:2px;
  font-weight:600;
  white-space:nowrap;
}

.us-main{padding:0}
.us-main-inner{max-width:1000px;margin:0 auto;padding:40px 40px 80px}
.us-grid{display:grid;grid-template-columns:1fr 320px;gap:32px;align-items:start}
.us-form-section{margin-bottom:20px}
.us-form-row{display:flex;gap:12px;margin-bottom:20px}
.us-form-label{display:block;font-family:var(--mono);font-size:10px;
  letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.us-form-hint{font-family:var(--sans);font-size:12px;color:var(--muted);
  margin-top:6px;line-height:1.5}
.us-add-btn{font-family:var(--mono);font-size:10px;letter-spacing:.08em;
  text-transform:uppercase;background:none;border:1px solid var(--rule);
  color:var(--muted);padding:5px 12px;cursor:pointer;transition:all .15s}
.us-add-btn:hover{color:var(--ink);border-color:var(--ink2)}
.us-error{padding:10px 14px;background:#fdf0ee;border:1px solid #f0c0bc;
  color:#b83030;font-size:13px;margin-bottom:16px;line-height:1.5}
.us-error a{color:#b83030}

/* ─── Подсказка для пациентов ─── */
.us-patient-hint{
  margin: 4px 0 24px;
  padding: 16px 18px;
  background: var(--paper2);
  border: 1px solid var(--rule);
  border-radius: 4px;
}
.us-patient-hint-title{
  font-family: var(--mono); font-size: 10px;
  letter-spacing: .12em; text-transform: uppercase;
  color: var(--muted); margin-bottom: 14px;
}
.us-patient-hint-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.us-patient-hint-col ul{margin:0;padding-inline-start:18px;
  font-size:13px;line-height:1.7;color:var(--ink2)}
.us-patient-hint-col ul li{margin-bottom:2px}
.us-patient-hint-label{font-family:var(--serif);font-size:14px;font-weight:700;
  margin-bottom:8px}
.us-patient-hint-ok .us-patient-hint-label{color:#1a6b3c}
.us-patient-hint-no .us-patient-hint-label{color:#b83030}
.us-patient-hint-cta{display:inline-block;margin-top:12px;
  font-family:var(--mono);font-size:11px;color:#b83030;
  text-decoration:none;border-bottom:1px dashed #b83030;padding-bottom:1px}
.us-patient-hint-cta:hover{border-bottom-style:solid}

.us-generate-btn{
  width:100%;padding:14px;font-family:var(--mono);font-size:12px;
  font-weight:500;letter-spacing:.1em;text-transform:uppercase;
  background:var(--ink);color:var(--paper);border:none;cursor:pointer;
  transition:background .15s;display:block;text-align:center;text-decoration:none;
  box-sizing:border-box}
.us-generate-btn:hover:not(:disabled){background:#3a3830}
.us-generate-btn:disabled{opacity:.4;cursor:not-allowed}
.us-generate-btn-link{background:#b83030;color:#fff}
.us-generate-btn-link:hover{background:#9a2828}
.us-login-hint{text-align:center;font-family:var(--mono);font-size:11px;
  color:var(--muted);margin-top:12px}
.us-login-hint a{color:#b83030}
.us-info-card{background:var(--paper2);border:1px solid var(--rule);
  padding:20px;margin-bottom:16px}
.us-info-title{font-family:var(--serif);font-size:16px;font-weight:700;
  color:var(--ink);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--rule)}
.us-info-item{display:flex;gap:10px;margin-bottom:8px;font-size:13px;color:var(--ink2)}
.us-info-check{color:#b83030;font-weight:700;flex-shrink:0}

/* ─── ОТДЕЛЬНАЯ КАРТОЧКА: Guest Trial Banner ─── */
.us-guest-trial-card{
  display:block;text-decoration:none;
  background:linear-gradient(135deg, rgba(45,212,191,.18) 0%, rgba(13,110,253,.08) 100%);
  border:2px solid #2dd4bf;
  border-radius:6px;
  padding:18px 20px;
  margin-bottom:16px;
  transition:transform .15s, box-shadow .15s;
}
.us-guest-trial-card:hover{
  transform:translateY(-2px);
  box-shadow:0 6px 20px rgba(45,212,191,.2);
}
.us-guest-trial-title{
  font-family:var(--serif);
  font-size:16px;
  font-weight:700;
  color:#0d9488;
  line-height:1.3;
  margin-bottom:8px;
}
.us-guest-trial-text{
  font-family:var(--sans);
  font-size:12px;
  color:var(--ink2);
  line-height:1.5;
  margin-bottom:12px;
}
.us-guest-trial-cta{
  font-family:var(--mono);
  font-size:11px;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:#0d9488;
  font-weight:700;
}

/* ─── Секции и тарифы ─── */
.us-plan-section{margin-bottom:8px}
.us-plan-section:last-of-type{margin-bottom:0}
.us-plan-section-title{
  font-family:var(--mono);
  font-size:9px;
  letter-spacing:.15em;
  text-transform:uppercase;
  color:var(--muted);
  font-weight:600;
  padding:10px 0 8px;
  border-bottom:1px dashed var(--rule);
  margin-bottom:4px;
}
.us-plan-section:first-of-type .us-plan-section-title{padding-top:0}

.us-plan-item{
  display:flex;align-items:center;gap:8px;padding:9px 0;
  border-bottom:1px solid var(--rule);font-size:12px;
}
.us-plan-section .us-plan-item:last-child{border-bottom:none}
.us-plan-item-current{
  background:rgba(45,212,191,.08);
  margin:0 -20px;padding-inline:20px;
  border-bottom:1px solid rgba(45,212,191,.2);
}
.us-plan-name{
  font-weight:500;color:var(--ink);flex:1;
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;
}
.us-plan-current-badge{
  font-family:var(--mono);font-size:9px;letter-spacing:.08em;
  text-transform:uppercase;background:#1a6b3c;color:white;
  padding:2px 6px;border-radius:2px;font-weight:600;
}
.us-plan-limit{color:var(--muted);font-family:var(--mono);font-size:10px}
.us-plan-price{color:var(--muted);font-family:var(--mono);font-size:10px;
  margin-inline-start:auto;font-weight:500}

/* ─── Trial banner внутри карточки планов (для залогиненного врача) ─── */
.us-trial-banner{
  background:linear-gradient(135deg, rgba(45,212,191,.12) 0%, rgba(13,110,253,.06) 100%);
  border:1px solid rgba(45,212,191,.3);
  border-radius:4px;
  padding:14px 16px;
  margin-bottom:14px;
}
.us-trial-banner-title{
  font-family:var(--serif);font-size:14px;font-weight:700;
  color:#0d9488;line-height:1.3;margin-bottom:6px;
}
.us-trial-banner-text{
  font-family:var(--sans);font-size:12px;
  color:var(--ink2);line-height:1.5;margin-bottom:10px;
}
.us-trial-banner-cta{
  display:inline-block;font-family:var(--mono);font-size:10px;
  letter-spacing:.08em;text-transform:uppercase;
  color:#0d9488;text-decoration:none;font-weight:600;
}
.us-trial-banner-cta:hover{text-decoration:underline}

.us-upgrade-link{display:block;text-align:center;margin-top:14px;
  padding-top:12px;border-top:1px solid var(--rule);
  font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;
  color:#b83030;text-decoration:none}
.us-my-article{display:block;padding:10px 0;border-bottom:1px solid var(--rule);
  text-decoration:none;transition:opacity .15s}
.us-my-article:last-child{border-bottom:none}
.us-my-article:hover{opacity:.7}
.us-my-title{font-family:var(--serif);font-size:14px;font-weight:700;
  color:var(--ink);margin-bottom:4px;line-height:1.3}
.us-my-meta{font-family:var(--mono);font-size:10px;color:var(--muted)}
@media(max-width:768px){
  .us-topbar,.us-nav{padding:0 20px}
  .us-header-inner,.us-main-inner{padding-left:20px;padding-right:20px}
  .us-grid{grid-template-columns:1fr}
  .us-nav-tag{display:none}
  .us-form-row{flex-direction:column}
  .us-patient-hint-grid{grid-template-columns:1fr;gap:14px}
}
@media(max-width:480px){
  .us-topbar{display:none}
  .us-nav{padding:0 14px}
  .us-header-inner,.us-main-inner{padding-left:14px;padding-right:14px}
}
`;
