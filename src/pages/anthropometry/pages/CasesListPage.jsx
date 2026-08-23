import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import {
  fetchCases,
  selectCases,
  selectCasesLoading,
  selectCasesError,
} from "../store/casesSlice.js";
import CaseCard from "../components/CaseCard.jsx";
import NewCaseModal from "../components/NewCaseModal.jsx";

function CasesListPage() {
  const { t } = useTranslation("Anthropometry");
  const dispatch = useDispatch();

  const cases = useSelector(selectCases);
  const loading = useSelector(selectCasesLoading);
  const error = useSelector(selectCasesError);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState("active");

  useEffect(() => {
    dispatch(fetchCases({ isArchived: view === "archived" }));
  }, [dispatch, view]);

  const handleRetry = () => {
    dispatch(fetchCases({ isArchived: view === "archived" }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInfo}>
          <h1 className={styles.pageTitle}>{t("cases.title")}</h1>
          <p className={styles.pageSubtitle}>{t("cases.subtitle")}</p>
        </div>
        <div className={styles.pageActions}>
          <button
            className={styles.btnPrimary}
            onClick={() => setIsModalOpen(true)}
          >
            + {t("cases.new")}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* FILTER TABS — Активные / Архив             */}
      {/* ═══════════════════════════════════════════ */}
      <div className={styles.filterTabs}>
        <button
          type="button"
          className={`${styles.filterTab} ${
            view === "active" ? styles.filterTabActive : ""
          }`}
          onClick={() => setView("active")}
        >
          {t("common:anthro.active")}
        </button>
        <button
          type="button"
          className={`${styles.filterTab} ${
            view === "archived" ? styles.filterTabActive : ""
          }`}
          onClick={() => setView("archived")}
        >
          {t("common:anthro.archive")}
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <span>
            {t("common.error")}: {error.message || "Unknown error"}
          </span>
          <button className={styles.errorBannerRetry} onClick={handleRetry}>
            ↻
          </button>
        </div>
      )}

      {loading && cases.length === 0 && (
        <div className={styles.loadingState}>{t("common.loading")}</div>
      )}

      {!loading && !error && cases.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            {view === "archived" ? "🗄" : "📋"}
          </div>
          <p className={styles.emptyStateText}>
            {view === "archived"
              ? "Нет архивированных случаев"
              : t("cases.empty")}
          </p>
        </div>
      )}

      {cases.length > 0 && (
        <div>
          {cases.map((caseItem) => (
            <CaseCard key={caseItem._id} caseData={caseItem} />
          ))}
        </div>
      )}

      <NewCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default CasesListPage;
