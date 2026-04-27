import React, { useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import { uploadPhoto } from "../store/photosSlice.js";

const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 20;

function PhotoDropZone({ studyId, disabled, onAllDone }) {
  const { t } = useTranslation("Anthropometry");
  const dispatch = useDispatch();
  const inputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [queueInfo, setQueueInfo] = useState(null);
  const [error, setError] = useState(null);

  const validateFile = (file) => {
    if (!ALLOWED_MIME.includes(file.type)) {
      return t("photos.errors.invalidType", { name: file.name });
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return t("photos.errors.tooBig", {
        name: file.name,
        maxMb: MAX_SIZE_MB,
      });
    }
    return null;
  };

  const uploadFiles = useCallback(
    async (files) => {
      if (disabled || files.length === 0) return;

      setError(null);
      setQueueInfo({ current: 0, total: files.length });

      let success = 0;
      let fail = 0;
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setQueueInfo({ current: i + 1, total: files.length });

        const validationError = validateFile(file);
        if (validationError) {
          errors.push(validationError);
          fail++;
          continue;
        }

        try {
          await dispatch(
            uploadPhoto({
              studyId,
              file,
              viewType: "other",
            }),
          ).unwrap();
          success++;
        } catch (err) {
          errors.push(
            err?.message ||
              t("photos.errors.uploadFailed", { name: file.name }),
          );
          fail++;
        }
      }

      setQueueInfo(null);

      if (errors.length > 0) {
        setError(errors.join(" · "));
      }

      if (onAllDone) onAllDone(success, fail);
    },
    [studyId, disabled, dispatch, onAllDone, t],
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) uploadFiles(files);
  };

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) uploadFiles(files);
    e.target.value = "";
  };

  return (
    <>
      <div
        className={`${styles.dropZone} ${
          dragActive ? styles.dropZoneActive : ""
        } ${disabled ? styles.dropZoneDisabled : ""}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? undefined : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_MIME.join(",")}
          multiple
          className={styles.dropZoneInput}
          onChange={handleInputChange}
          disabled={disabled}
        />
        <div className={styles.dropZoneIcon}>📷</div>
        <p className={styles.dropZoneTitle}>
          {dragActive ? t("photos.dropZoneActive") : t("photos.dropZoneTitle")}
        </p>
        <p className={styles.dropZoneHint}>{t("photos.dropZoneHint")}</p>
      </div>

      {queueInfo && queueInfo.total > 1 && (
        <div className={styles.uploadQueueHint}>
          {t("photos.uploadingQueue", {
            current: queueInfo.current,
            total: queueInfo.total,
          })}
        </div>
      )}

      {error && (
        <div className={styles.uploadError}>
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              float: "right",
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

export default PhotoDropZone;
