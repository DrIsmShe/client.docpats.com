import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import {
  fetchStudiesByCase,
  selectStudiesByCase,
  selectStudiesLoading,
} from "../store/studiesSlice.js";
import NewStudyModal from "./NewStudyModal.jsx";

/* ─── StudiesSection ─────────────────────────────────────────
   Список сессий антропометрии для одного case-а.
   ──────────────────────────────────────────────────────────── */

function StudiesSection({ caseId, canCreate }) {
  const { t, i18n } = useTranslation("Anthropometry");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const studies = useSelector(selectStudiesByCase(caseId));
  const loading = useSelector(selectStudiesLoading);

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (caseId) dispatch(fetchStudiesByCase(caseId));
  }, [caseId, dispatch]);

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

  const handleOpenStudy = (studyId) => {
    navigate(`/doctor/anthropometry/studies/${studyId}`);
  };

  const handleCreated = (newStudy) => {
    navigate(`/doctor/anthropometry/studies/${newStudy._id}`);
  };

  return (
    <>
      <div className={styles.caseSection}>
        <div className={styles.studiesSectionHeader}>
          <h2 className={styles.caseSectionTitle}>{t("studies.title")}</h2>
          {canCreate && (
            <button
              type="button"
              className={styles.addStudyBtn}
              onClick={() => setModalOpen(true)}
            >
              + {t("studies.new")}
            </button>
          )}
        </div>

        {loading && studies.length === 0 && (
          <div className={styles.loadingState}>{t("common.loading")}</div>
        )}

        {!loading && studies.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📋</div>
            <p className={styles.emptyStateText}>{t("studies.empty")}</p>
          </div>
        )}

        {studies.length > 0 && (
          <div>
            {studies.map((study) => {
              const photosCount =
                study.photosCount ??
                (Array.isArray(study.photos) ? study.photos.length : 0);
              const calibrated = Boolean(study.calibration?.isCalibrated);
              const typeClass = styles[study.studyType] || "";

              return (
                <div
                  key={study._id}
                  className={styles.studyCard}
                  onClick={() => handleOpenStudy(study._id)}
                >
                  <div className={styles.studyCardBody}>
                    <div className={styles.studyCardTitle}>
                      <span className={`${styles.studyTypeBadge} ${typeClass}`}>
                        {t(`studies.types.${study.studyType}`)}
                      </span>
                      {study.label && <span>{study.label}</span>}
                    </div>
                    <p className={styles.studyCardMeta}>
                      {formatDate(study.studyDate || study.createdAt)}
                      {" · "}
                      {t("studies.photosCount", { count: photosCount })}
                      {" · "}
                      {calibrated
                        ? t("studies.calibrated")
                        : t("studies.notCalibrated")}
                    </p>
                  </div>
                  <div className={styles.studyCardArrow}>→</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NewStudyModal
        isOpen={modalOpen}
        caseId={caseId}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

export default StudiesSection;
