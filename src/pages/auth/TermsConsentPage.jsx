import React from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const TermsConsentPage = () => {
  const { t, i18n } = useTranslation("auth");
  const isRTL = i18n.language === "ar";

  // 🔒 SAFE LIST GETTERS (ничего не ломают, даже если перевод неправильный)
  const section1List =
    t("TermsConsentPage.section1.list", { returnObjects: true }) || [];
  const section2List =
    t("TermsConsentPage.section2.list", { returnObjects: true }) || [];
  const section3List =
    t("TermsConsentPage.section3.list", { returnObjects: true }) || [];
  const section4List =
    t("TermsConsentPage.section4.list", { returnObjects: true }) || [];

  return (
    <div
      className="container py-5"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ maxWidth: "900px", margin: "0 auto" }}
    >
      <Helmet>
        <title>{t("TermsConsentPage.meta.title")}</title>
        <meta
          name="description"
          content={t("TermsConsentPage.meta.description")}
        />
      </Helmet>

      <LanguageSwitcher />

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 text-center"
      >
        <h1 className="fw-bold mb-2">{t("TermsConsentPage.header.title")}</h1>
        <p className="text-muted">{t("TermsConsentPage.header.subtitle")}</p>
      </motion.div>

      {/* CARD */}
      <motion.div
        className="card border-0 shadow-sm rounded-4 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="card-body p-4 p-md-5">
          {/* SECTION 1 */}
          <h5 className="fw-bold mb-3">
            {t("TermsConsentPage.section1.title")}
          </h5>
          <p className="text-muted">{t("TermsConsentPage.section1.text")}</p>
          <ul className="text-muted">
            {Array.isArray(section1List) &&
              section1List.map((item, idx) => (
                <li key={idx} className="mb-2">
                  {item}
                </li>
              ))}
          </ul>

          {/* SECTION 2 */}
          <h5 className="fw-bold mt-4 mb-3">
            {t("TermsConsentPage.section2.title")}
          </h5>
          <p className="text-muted">{t("TermsConsentPage.section2.text")}</p>
          <ul className="text-muted">
            {Array.isArray(section2List) &&
              section2List.map((item, idx) => (
                <li key={idx} className="mb-2">
                  {item}
                </li>
              ))}
          </ul>

          {/* SECTION 3 */}
          <h5 className="fw-bold mt-4 mb-3">
            {t("TermsConsentPage.section3.title")}
          </h5>
          <p className="text-muted">{t("TermsConsentPage.section3.text")}</p>
          <ul className="text-muted">
            {Array.isArray(section3List) &&
              section3List.map((item, idx) => (
                <li key={idx} className="mb-2">
                  {item}
                </li>
              ))}
          </ul>

          {/* SECTION 4 */}
          <h5 className="fw-bold mt-4 mb-3">
            {t("TermsConsentPage.section4.title")}
          </h5>
          <p className="text-muted">{t("TermsConsentPage.section4.text")}</p>
          <ul className="text-muted">
            {Array.isArray(section4List) &&
              section4List.map((item, idx) => (
                <li key={idx} className="mb-2">
                  {item}
                </li>
              ))}
          </ul>

          {/* SECTION 5 */}
          <h5 className="fw-bold mt-4 mb-3">
            {t("TermsConsentPage.section5.title")}
          </h5>
          <p className="text-muted">{t("TermsConsentPage.section5.text")}</p>

          <div
            className="p-3 p-md-4 rounded-4 mb-3"
            style={{ background: "#f5f7fb" }}
          >
            <p className="mb-0 fw-semibold">
              {t("TermsConsentPage.section5.highlight")}
            </p>
          </div>

          <p className="text-muted small mb-0">
            {t("TermsConsentPage.footer")}
          </p>
        </div>
      </motion.div>

      {/* ACTION AREA */}
      {/* <motion.div
        className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="consentCheckbox"
          />
          <label
            className="form-check-label text-muted"
            htmlFor="consentCheckbox"
          >
            {t("TermsConsentPage.checkbox")}
          </label>
        </div>

        <button type="button" className="btn btn-primary px-4 py-2 rounded-3">
          {t("TermsConsentPage.button")}
        </button>
      </motion.div> */}
    </div>
  );
};

export default TermsConsentPage;
