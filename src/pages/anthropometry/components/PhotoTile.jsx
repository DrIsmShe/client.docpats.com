import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import * as photoApi from "../api/photoApi.js";
import { deletePhoto } from "../store/photosSlice.js";

const VIEW_TYPES = [
  "frontal",
  "lateral_left",
  "lateral_right",
  "three_quarter_left",
  "three_quarter_right",
  "superior",
  "inferior",
  "other",
];

function PhotoTile({ photo, onClick, disabled }) {
  const { t } = useTranslation("Anthropometry");
  const dispatch = useDispatch();

  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [viewType, setViewType] = useState(photo.viewType || "other");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadThumbnail() {
      try {
        const res = await photoApi.getThumbnailSignedUrl(photo._id);
        if (!cancelled) {
          setThumbnailUrl(res.url);
          setLoadingUrl(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load thumbnail:", err);
          setLoadingUrl(false);
        }
      }
    }
    loadThumbnail();
    return () => {
      cancelled = true;
    };
  }, [photo._id]);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(t("photos.deleteConfirm"))) return;
    setDeleting(true);
    try {
      await dispatch(
        deletePhoto({ photoId: photo._id, reason: "user deleted from UI" }),
      ).unwrap();
    } catch (err) {
      console.error("Failed to delete photo:", err);
      setDeleting(false);
    }
  };

  const handleViewTypeChange = (e) => {
    e.stopPropagation();
    setViewType(e.target.value);
    // TODO F.6.2.1: PATCH /photos/:id с новым viewType
  };

  const handleTileClick = () => {
    if (disabled || deleting) return;
    if (onClick) onClick(photo);
  };

  return (
    <div
      className={styles.photoTile}
      onClick={handleTileClick}
      style={{ opacity: deleting ? 0.4 : 1 }}
    >
      <div className={styles.photoTileContent}>
        <div className={styles.photoTileImgWrapper}>
          {loadingUrl ? (
            <div className={styles.photoTileLoading}>⋯</div>
          ) : thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={photo.viewType || "photo"}
              className={styles.photoTileImg}
              onError={() => setThumbnailUrl(null)}
            />
          ) : (
            <div className={styles.photoTilePlaceholder}>🖼</div>
          )}

          {!disabled && (
            <button
              type="button"
              className={styles.photoTileDeleteBtn}
              onClick={handleDelete}
              title="Удалить"
            >
              ×
            </button>
          )}
        </div>

        <select
          className={styles.photoTileViewSelect}
          value={viewType}
          onChange={handleViewTypeChange}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled || deleting}
        >
          {VIEW_TYPES.map((vt) => (
            <option key={vt} value={vt}>
              {t(`photos.viewTypes.${vt}`, vt)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default PhotoTile;
