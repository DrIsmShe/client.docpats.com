import React, { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import CalibrationModal from "../components/CalibrationModal.jsx";
import {
  fetchStudy,
  selectCurrentStudy,
  selectStudiesLoading,
  clearCurrentStudy,
} from "../store/studiesSlice.js";
import {
  fetchPhotosByStudy,
  selectPhotosByStudy,
  selectUploading,
  selectUploadProgress,
} from "../store/photosSlice.js";
import PhotoDropZone from "../components/PhotoDropZone.jsx";
import PhotoTile from "../components/PhotoTile.jsx";

const STUDY_TYPE_CLASS = {
  pre_op: "pre_op",
  post_op: "post_op",
  follow_up: "follow_up",
};

function StudyDetailPage() {
  const [calibModalOpen, setCalibModalOpen] = React.useState(false);
  const { studyId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation("Anthropometry");

  const study = useSelector(selectCurrentStudy);
  const loading = useSelector(selectStudiesLoading);

  const photos = useSelector(selectPhotosByStudy(studyId));
  const uploading = useSelector(selectUploading);
  const uploadProgress = useSelector(selectUploadProgress);

  useEffect(() => {
    if (studyId) {
      dispatch(fetchStudy(studyId));
      dispatch(fetchPhotosByStudy(studyId));
    }
    return () => {
      dispatch(clearCurrentStudy());
    };
  }, [studyId, dispatch]);

  const handleBackToCase = () => {
    if (study?.caseId) {
      navigate(`/doctor/anthropometry/cases/${study.caseId}`);
    } else {
      navigate("/doctor/anthropometry/cases");
    }
  };

  const handlePhotoClick = useCallback(
    (photo) => {
      navigate(`/doctor/anthropometry/photos/${photo._id}/annotate`);
    },
    [navigate],
  );

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

  if (loading && !study) {
    return (
      <div className={styles.page}>
        <button className={styles.backLink} onClick={handleBackToCase}>
          ← {t("common.back")}
        </button>
        <div className={styles.loadingState}>{t("common.loading")}</div>
      </div>
    );
  }

  if (!study) {
    return (
      <div className={styles.page}>
        <button className={styles.backLink} onClick={handleBackToCase}>
          ← {t("common.back")}
        </button>
      </div>
    );
  }

  const isCalibrated = Boolean(study.calibration?.isCalibrated);
  const pixelsPerMm = study.calibration?.pixelsPerMm;
  const typeClass = styles[STUDY_TYPE_CLASS[study.studyType]] || "";
  const hasPhotos = photos.length > 0;

  return (
    <div className={styles.page}>
      <button className={styles.backLink} onClick={handleBackToCase}>
        ← {t("studies.backToCase")}
      </button>

      <div className={styles.studyHero}>
        <div className={styles.studyHeroHeader}>
          <div className={styles.studyHeroBody}>
            <div className={styles.studyHeroTitle}>
              <span className={`${styles.studyTypeBadge} ${typeClass}`}>
                {t(`studies.types.${study.studyType}`)}
              </span>
              {study.label && (
                <h1 className={styles.studyHeroTitleText}>{study.label}</h1>
              )}
            </div>
            <p className={styles.studyHeroMeta}>
              {formatDate(study.studyDate || study.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {isCalibrated ? (
        <div
          className={`${styles.calibrationBar} ${styles.calibrationBarCalibrated}`}
        >
          <div className={styles.calibrationBarLeft}>
            <div
              className={`${styles.calibrationBarIcon} ${styles.calibrationBarIconCal}`}
            >
              ✓
            </div>
            <div className={styles.calibrationBarText}>
              <strong>{t("calibration.calibrated")}</strong>
              <span>
                {pixelsPerMm?.toFixed(2)} px/mm
                {study.calibration?.method
                  ? ` · ${t(
                      `calibration.methods.${study.calibration.method}`,
                      study.calibration.method,
                    )}`
                  : ""}
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.calibrationBarBtn}
            onClick={() => setCalibModalOpen(true)}
          >
            {t("calibration.change")}
          </button>
        </div>
      ) : (
        <div
          className={`${styles.calibrationBar} ${styles.calibrationBarUncalibrated}`}
        >
          <div className={styles.calibrationBarLeft}>
            <div
              className={`${styles.calibrationBarIcon} ${styles.calibrationBarIconUncal}`}
            >
              ⚡
            </div>
            <div className={styles.calibrationBarText}>
              <strong>{t("calibration.notCalibrated")}</strong>
              <span>{t("calibration.notCalibratedHint")}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.calibrationBarBtn}
            disabled={!hasPhotos}
            onClick={() => setCalibModalOpen(true)}
          >
            {t("calibration.start")}
          </button>
        </div>
      )}

      <div className={styles.photosSection}>
        <div className={styles.photosSectionHeader}>
          <h2 className={styles.photosSectionTitle}>
            {t("photos.title")}
            {hasPhotos && ` (${photos.length})`}
          </h2>
        </div>

        <PhotoDropZone studyId={studyId} disabled={uploading} />

        {!hasPhotos && !uploading && (
          <div className={styles.photosEmpty}>{t("photos.empty")}</div>
        )}

        {(hasPhotos || uploading) && (
          <div className={styles.photoGrid}>
            {photos.map((photo) => (
              <PhotoTile
                key={photo._id}
                photo={photo}
                onClick={handlePhotoClick}
                disabled={uploading}
              />
            ))}

            {uploading && (
              <div
                className={`${styles.photoTile} ${styles.photoTileUploading}`}
              >
                <div className={styles.photoTilePlaceholder}>⬆</div>
                <div className={styles.photoTileProgress}>
                  <div
                    className={styles.photoTileProgressFill}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className={styles.photoTileProgressText}>
                  {uploadProgress}%
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <CalibrationModal
        isOpen={calibModalOpen}
        studyId={studyId}
        photos={photos}
        onClose={() => setCalibModalOpen(false)}
      />
    </div>
  );
}

export default StudyDetailPage;
