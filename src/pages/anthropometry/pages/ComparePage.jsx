import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import ComparisonTable from "../components/ComparisonTable.jsx";
import {
  fetchStudiesByCase,
  selectStudiesByCase,
} from "../store/studiesSlice.js";
import * as photoApi from "../api/photoApi.js";
import ReadOnlyAnnotationCanvas from "../components/ReadOnlyAnnotationCanvas.jsx";

function ComparePage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation("Anthropometry");

  const studies = useSelector(selectStudiesByCase(caseId));

  const [leftStudyId, setLeftStudyId] = useState(null);
  const [rightStudyId, setRightStudyId] = useState(null);
  const [leftPhotos, setLeftPhotos] = useState([]);
  const [rightPhotos, setRightPhotos] = useState([]);
  const [leftPhotoId, setLeftPhotoId] = useState(null);
  const [rightPhotoId, setRightPhotoId] = useState(null);

  /* ─── Sync state ─── */
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [leftView, setLeftView] = useState(null); // view отправляемый в левую при sync
  const [rightView, setRightView] = useState(null);
  const [leftAnnotation, setLeftAnnotation] = useState(null);
  const [rightAnnotation, setRightAnnotation] = useState(null);
  const [leftImageSize, setLeftImageSize] = useState(null);
  const [rightImageSize, setRightImageSize] = useState(null);
  /* Флаг "кто driver-ом" чтобы избежать ping-pong */
  const lastSourceRef = useRef(null); // "left" | "right" | null

  /* ─── Load studies ─── */
  useEffect(() => {
    dispatch(fetchStudiesByCase(caseId));
  }, [caseId, dispatch]);

  useEffect(() => {
    if (studies.length >= 2) {
      if (!leftStudyId) setLeftStudyId(studies[studies.length - 1]._id);
      if (!rightStudyId) setRightStudyId(studies[0]._id);
    }
  }, [studies, leftStudyId, rightStudyId]);

  /* ─── Load photos per side ─── */
  useEffect(() => {
    if (!leftStudyId) return;
    let cancelled = false;
    photoApi.listPhotosByStudy(leftStudyId).then((res) => {
      if (cancelled) return;
      const items = res.items || res;
      setLeftPhotos(items);
      setLeftPhotoId(items[0]?._id || null);
    });
    return () => {
      cancelled = true;
    };
  }, [leftStudyId]);

  useEffect(() => {
    if (!rightStudyId) return;
    let cancelled = false;
    photoApi.listPhotosByStudy(rightStudyId).then((res) => {
      if (cancelled) return;
      const items = res.items || res;
      setRightPhotos(items);
      setRightPhotoId(items[0]?._id || null);
    });
    return () => {
      cancelled = true;
    };
  }, [rightStudyId]);

  /* ─── Sync handlers ─── */
  const handleLeftViewChange = (view) => {
    if (!syncEnabled) return;
    if (lastSourceRef.current === "right") {
      /* Это эхо от external-apply в левой — не форварди обратно */
      lastSourceRef.current = null;
      return;
    }
    lastSourceRef.current = "left";
    setRightView(view);
  };

  const handleRightViewChange = (view) => {
    if (!syncEnabled) return;
    if (lastSourceRef.current === "left") {
      lastSourceRef.current = null;
      return;
    }
    lastSourceRef.current = "right";
    setLeftView(view);
  };

  /* При отключении sync — сбрасываем переданные views */
  useEffect(() => {
    if (!syncEnabled) {
      setLeftView(null);
      setRightView(null);
      lastSourceRef.current = null;
    }
  }, [syncEnabled]);

  /* ─── Study helpers ─── */
  const leftStudy = useMemo(
    () => studies.find((s) => s._id === leftStudyId),
    [studies, leftStudyId],
  );
  const rightStudy = useMemo(
    () => studies.find((s) => s._id === rightStudyId),
    [studies, rightStudyId],
  );

  const handleBack = () => {
    navigate(`/doctor/anthropometry/cases/${caseId}`);
  };

  const formatStudyLabel = (study) => {
    if (!study) return "—";
    const typeLabel = t(`studies.types.${study.studyType}`, study.studyType);
    const date = study.studyDate
      ? new Date(study.studyDate).toLocaleDateString()
      : "";
    return `${typeLabel}${study.label ? ` · ${study.label}` : ""}${date ? ` · ${date}` : ""}`;
  };

  if (studies.length < 2) {
    return (
      <div className={styles.page}>
        <button className={styles.backLink} onClick={handleBack}>
          ← {t("common.back")}
        </button>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⇄</div>
          <p className={styles.emptyStateText}>{t("compare.needTwoStudies")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.comparePage}>
      {/* ─── Top bar ─── */}
      <div className={styles.compareTopBar}>
        <button className={styles.backLink} onClick={handleBack}>
          ← {t("compare.backToCase")}
        </button>
        <div className={styles.compareTitleText}>{t("compare.title")}</div>

        {/* Sync toggle */}
        <button
          type="button"
          className={`${styles.syncToggle} ${
            syncEnabled ? styles.syncToggleOn : ""
          }`}
          onClick={() => setSyncEnabled(!syncEnabled)}
          title={t("compare.syncToggleHint")}
        >
          <span className={styles.syncToggleIcon}>⇄</span>
          {syncEnabled ? t("compare.syncOn") : t("compare.syncOff")}
        </button>
      </div>

      {/* ─── Split panes ─── */}
      <div className={styles.compareSplit}>
        {/* Left */}
        <div className={styles.compareSide}>
          <div className={styles.compareSideHeader}>
            <select
              className={styles.compareSelect}
              value={leftStudyId || ""}
              onChange={(e) => {
                setLeftStudyId(e.target.value);
                setLeftPhotoId(null);
              }}
            >
              {studies.map((s) => (
                <option key={s._id} value={s._id}>
                  {formatStudyLabel(s)}
                </option>
              ))}
            </select>
            {leftPhotos.length > 1 && (
              <select
                className={styles.compareSelect}
                value={leftPhotoId || ""}
                onChange={(e) => setLeftPhotoId(e.target.value)}
              >
                {leftPhotos.map((p) => (
                  <option key={p._id} value={p._id}>
                    {t(`photos.viewTypes.${p.viewType}`, p.viewType)}
                    {p.originalFilename ? ` · ${p.originalFilename}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
          <ReadOnlyAnnotationCanvas
            photoId={leftPhotoId}
            pixelsPerMm={leftStudy?.calibration?.pixelsPerMm}
            externalView={syncEnabled ? leftView : null}
            onViewChange={handleLeftViewChange}
            onAnnotationLoaded={setLeftAnnotation}
            onImageSizeChange={setLeftImageSize}
            label={t("compare.before")}
          />
        </div>

        {/* Right */}
        <div className={styles.compareSide}>
          <div className={styles.compareSideHeader}>
            <select
              className={styles.compareSelect}
              value={rightStudyId || ""}
              onChange={(e) => {
                setRightStudyId(e.target.value);
                setRightPhotoId(null);
              }}
            >
              {studies.map((s) => (
                <option key={s._id} value={s._id}>
                  {formatStudyLabel(s)}
                </option>
              ))}
            </select>
            {rightPhotos.length > 1 && (
              <select
                className={styles.compareSelect}
                value={rightPhotoId || ""}
                onChange={(e) => setRightPhotoId(e.target.value)}
              >
                {rightPhotos.map((p) => (
                  <option key={p._id} value={p._id}>
                    {t(`photos.viewTypes.${p.viewType}`, p.viewType)}
                    {p.originalFilename ? ` · ${p.originalFilename}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
          <ReadOnlyAnnotationCanvas
            photoId={rightPhotoId}
            pixelsPerMm={rightStudy?.calibration?.pixelsPerMm}
            externalView={syncEnabled ? rightView : null}
            onViewChange={handleRightViewChange}
            onAnnotationLoaded={setRightAnnotation}
            onImageSizeChange={setRightImageSize}
            label={t("compare.after")}
          />
        </div>
      </div>

      {/* ─── F.8.3 placeholder ─── */}
      <div className={styles.compareBottom}>
        <ComparisonTable
          leftAnnotation={leftAnnotation}
          rightAnnotation={rightAnnotation}
          leftImageSize={leftImageSize}
          rightImageSize={rightImageSize}
          leftPixelsPerMm={leftStudy?.calibration?.pixelsPerMm}
          rightPixelsPerMm={rightStudy?.calibration?.pixelsPerMm}
        />
      </div>
    </div>
  );
}

export default ComparePage;
