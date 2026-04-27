import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import {
  fetchStudiesByCase,
  selectStudiesByCase,
} from "../store/studiesSlice.js";

/* ─── CompareButton ─────────────────────────────────────────
   Появляется на CaseDetailPage когда у case ≥ 2 studies.
   Ведёт на /cases/:caseId/compare
   ──────────────────────────────────────────────────────────── */

function CompareButton({ caseId }) {
  const { t } = useTranslation("Anthropometry");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const studies = useSelector(selectStudiesByCase(caseId));

  useEffect(() => {
    if (caseId && studies.length === 0) {
      dispatch(fetchStudiesByCase(caseId));
    }
  }, [caseId, studies.length, dispatch]);

  if (studies.length < 2) return null;

  const handleClick = () => {
    navigate(`/doctor/anthropometry/cases/${caseId}/compare`);
  };

  return (
    <div className={styles.compareButtonWrap}>
      <button
        type="button"
        className={styles.compareButton}
        onClick={handleClick}
      >
        <span className={styles.compareButtonIcon}>⇄</span>
        {t("compare.button")}
        <span className={styles.compareButtonHint}>
          {t("compare.hint", { count: studies.length })}
        </span>
      </button>
    </div>
  );
}

export default CompareButton;
