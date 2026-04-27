import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";

/* ─── CaseCard ─────────────────────────────────────────────────
   Карточка одного case в списке.
   Принимает case объект, рендерит информацию и ведёт на детали.
   ──────────────────────────────────────────────────────────── */

const STATUS_CLASS = {
  consultation: "statusConsultation",
  planned: "statusPlanned",
  operated: "statusOperated",
  follow_up: "statusFollowUp",
  closed: "statusClosed",
  cancelled: "statusCancelled",
};

function CaseCard({ caseData }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("Anthropometry");

  const handleClick = () => {
    navigate(`/doctor/anthropometry/cases/${caseData._id}`);
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(i18n.language, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const patientName =
    caseData.patientDisplayName ||
    caseData.privatePatient?.displayName ||
    caseData.privatePatient?.fullName ||
    t("cases.patient");

  const statusClass = styles[STATUS_CLASS[caseData.status] || "statusClosed"];

  return (
    <div className={styles.caseCard} onClick={handleClick}>
      <div className={styles.caseCardBody}>
        <div className={styles.caseCardHeader}>
          <h3 className={styles.caseCardPatient}>{patientName}</h3>
          <span className={`${styles.statusBadge} ${statusClass}`}>
            {t(`cases.statuses.${caseData.status}`)}
          </span>
        </div>
        <p className={styles.caseCardMeta}>
          {t(`cases.procedureTypes.${caseData.procedureType}`)}
          {" · "}
          {formatDate(caseData.createdAt)}
        </p>
        {caseData.chiefComplaint && (
          <p className={styles.caseCardComplaint}>
            «{caseData.chiefComplaint}»
          </p>
        )}
      </div>
      <div className={styles.caseCardArrow}>→</div>
    </div>
  );
}

export default CaseCard;
