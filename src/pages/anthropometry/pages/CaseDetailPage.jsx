import React, { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import {
  fetchCase,
  updateCase,
  archiveCase,
  deleteCase,
  selectCurrentCase,
  selectCasesLoading,
  selectCasesError,
  clearCurrentCase,
} from "../store/casesSlice.js";
import * as caseApi from "../api/caseApi.js";
import EditableField from "../components/EditableField.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import StudiesSection from "../components/StudiesSection.jsx";

const STATUS_CLASS = {
  consultation: "statusConsultation",
  planned: "statusPlanned",
  operated: "statusOperated",
  follow_up: "statusFollowUp",
  closed: "statusClosed",
  cancelled: "statusCancelled",
};

const STATUS_KEYS = [
  "consultation",
  "planned",
  "operated",
  "follow_up",
  "closed",
  "cancelled",
];

/* ─── Иконки (inline SVG) ─── */
const IconArchive = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="5" rx="1" />
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

const IconTrash = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

const IconUndo = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
  </svg>
);

function CaseDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation("Anthropometry");

  const caseData = useSelector(selectCurrentCase);
  const loading = useSelector(selectCasesLoading);
  const error = useSelector(selectCasesError);

  const [archiveDialog, setArchiveDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchCase(caseId));
    return () => {
      dispatch(clearCurrentCase());
    };
  }, [caseId, dispatch]);

  const handleBack = () => {
    navigate("/doctor/anthropometry/cases");
  };

  const handleRetry = () => {
    dispatch(fetchCase(caseId));
  };

  /* ─── Save handlers ─── */
  const saveField = useCallback(
    async (fieldName, value) => {
      const result = await dispatch(
        updateCase({ caseId, updates: { [fieldName]: value } }),
      );
      if (result.error) {
        throw new Error(result.payload?.message || "Update failed");
      }
    },
    [caseId, dispatch],
  );

  const handleSaveChiefComplaint = useCallback(
    (value) => saveField("chiefComplaint", value),
    [saveField],
  );

  const handleSaveMedicalNotes = useCallback(
    (value) => saveField("medicalNotes", value),
    [saveField],
  );

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === caseData?.status) return;
    try {
      await saveField("status", newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  /* ─── Archive / Unarchive / Delete ─── */
  const handleArchiveConfirm = async (reason) => {
    const result = await dispatch(archiveCase({ caseId, reason }));
    if (result.error) {
      throw new Error(result.payload?.message || "Archive failed");
    }
    // После archive возвращаемся к списку (archived не в активном списке)
    navigate("/doctor/anthropometry/cases");
  };

  const handleUnarchive = async () => {
    try {
      // unarchive через прямой вызов API (нет thunk) + refetch
      await caseApi.unarchiveCase(caseId);
      dispatch(fetchCase(caseId));
    } catch (err) {
      console.error("Failed to unarchive:", err);
    }
  };

  const handleDeleteConfirm = async (reason) => {
    const result = await dispatch(deleteCase({ caseId, reason }));
    if (result.error) {
      throw new Error(result.payload?.message || "Delete failed");
    }
    navigate("/doctor/anthropometry/cases");
  };

  /* ─── Patient name ─── */
  const getPatientName = () => {
    if (!caseData) return t("cases.patient");
    const p = caseData.privatePatientId;
    if (p && typeof p === "object") {
      return (
        p.fullName ||
        [p.firstName, p.lastName].filter(Boolean).join(" ") ||
        t("cases.patient")
      );
    }
    const r = caseData.registeredPatientId;
    if (r && typeof r === "object") {
      return (
        [r.firstName, r.lastName].filter(Boolean).join(" ") ||
        t("cases.patient")
      );
    }
    return t("cases.patient");
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

  /* ─── States ─── */
  if (loading && !caseData) {
    return (
      <div className={styles.page}>
        <button className={styles.backLink} onClick={handleBack}>
          ← {t("common.back")}
        </button>
        <div className={styles.loadingState}>{t("common.loading")}</div>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className={styles.page}>
        <button className={styles.backLink} onClick={handleBack}>
          ← {t("common.back")}
        </button>
        <div className={styles.errorBanner}>
          <span>
            {t("common.error")}: {error.message || "Unknown error"}
          </span>
          <button className={styles.errorBannerRetry} onClick={handleRetry}>
            ↻
          </button>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className={styles.page}>
        <button className={styles.backLink} onClick={handleBack}>
          ← {t("common.back")}
        </button>
      </div>
    );
  }

  const statusClass = styles[STATUS_CLASS[caseData.status] || "statusClosed"];
  const patientName = getPatientName();
  const isActive = !caseData.isDeleted && !caseData.isArchived;

  return (
    <div className={styles.page}>
      <button className={styles.backLink} onClick={handleBack}>
        ← {t("common.back")}
      </button>

      {error && caseData && (
        <div className={styles.errorBanner}>
          <span>
            {t("common.error")}: {error.message || "Save failed"}
          </span>
        </div>
      )}

      {caseData.isArchived && (
        <div className={styles.archivedBanner}>
          <IconArchive />
          <span>
            {t("cases.archivedBanner")}
            {caseData.archiveReason ? ` — "${caseData.archiveReason}"` : ""}
          </span>
        </div>
      )}

      {/* ─── Hero ─── */}
      <div className={styles.caseHero}>
        <div className={styles.caseHeroHeader}>
          <div>
            <h1 className={styles.caseHeroName}>{patientName}</h1>
            <p className={styles.caseHeroMeta}>
              {t(`cases.procedureTypes.${caseData.procedureType}`)}
              {" · "}
              {t("cases.created")} {formatDate(caseData.createdAt)}
            </p>
          </div>

          <div className={styles.heroActions}>
            {isActive ? (
              <div className={styles.statusSelectWrapper}>
                <select
                  className={`${styles.statusSelect} ${statusClass}`}
                  value={caseData.status}
                  onChange={handleStatusChange}
                >
                  {STATUS_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {t(`cases.statuses.${key}`)}
                    </option>
                  ))}
                </select>
                <span className={styles.statusSelectArrow}>▼</span>
              </div>
            ) : (
              <span className={`${styles.statusBadge} ${statusClass}`}>
                {t(`cases.statuses.${caseData.status}`)}
              </span>
            )}

            {caseData.isArchived ? (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={handleUnarchive}
                title={t("actions.unarchive")}
              >
                <IconUndo />
              </button>
            ) : (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setArchiveDialog(true)}
                title={t("actions.archive")}
              >
                <IconArchive />
              </button>
            )}

            <button
              type="button"
              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
              onClick={() => setDeleteDialog(true)}
              title={t("actions.delete")}
            >
              <IconTrash />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Chief complaint ─── */}
      <div className={styles.caseSection}>
        <div className={styles.caseSectionHeader}>
          <h2 className={styles.caseSectionTitle}>
            {t("cases.chiefComplaint")}
          </h2>
        </div>
        <EditableField
          value={caseData.chiefComplaint || ""}
          onSave={handleSaveChiefComplaint}
          disabled={!isActive}
          minRows={3}
        />
      </div>

      {/* ─── Medical notes ─── */}
      <div className={styles.caseSection}>
        <div className={styles.caseSectionHeader}>
          <h2 className={styles.caseSectionTitle}>{t("cases.medicalNotes")}</h2>
        </div>
        <EditableField
          value={caseData.medicalNotes || ""}
          onSave={handleSaveMedicalNotes}
          disabled={!isActive}
          minRows={4}
        />
      </div>

      {/* ─── Studies ─── */}
      <StudiesSection caseId={caseId} canCreate={isActive} />

      {/* ─── Dialogs ─── */}
      <ConfirmDialog
        isOpen={archiveDialog}
        title={t("confirm.archiveTitle")}
        message={t("confirm.archiveMessage")}
        reasonLabel={t("confirm.reasonLabel")}
        reasonRequired={false}
        confirmLabel={t("actions.archive")}
        onConfirm={handleArchiveConfirm}
        onClose={() => setArchiveDialog(false)}
      />

      <ConfirmDialog
        isOpen={deleteDialog}
        title={t("confirm.deleteTitle")}
        message={t("confirm.deleteMessage")}
        warning={t("confirm.deleteWarning")}
        reasonLabel={t("confirm.reasonLabel")}
        reasonRequired={true}
        confirmLabel={t("actions.delete")}
        danger={true}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialog(false)}
      />
    </div>
  );
}

export default CaseDetailPage;
