// src/pages/simulation/components/editor/EditorToolbar.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./SimulationEditor.module.css";

export default function EditorToolbar({
  viewport,
  mode,
  onModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveStatus,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
}) {
  const { t } = useTranslation("Simulation");
  const zoomPercent = Math.round(viewport.scale * 100);

  return (
    <div className={styles.toolbar}>
      {/* Mode switcher — select / add */}
      <button
        type="button"
        className={`${styles.toolbarButton} ${
          mode === "select" ? styles.toolbarButtonActive : ""
        }`}
        onClick={() => onModeChange("select")}
        title={t("toolbar.modeSelect")}
      >
        ↖
      </button>
      <button
        type="button"
        className={`${styles.toolbarButton} ${
          mode === "add" ? styles.toolbarButtonActive : ""
        }`}
        onClick={() => onModeChange("add")}
        title={t("toolbar.modeAdd")}
      >
        +●
      </button>

      <div className={styles.toolbarDivider} />

      {/* Undo/Redo */}
      <button
        type="button"
        className={styles.toolbarButton}
        onClick={onUndo}
        disabled={!canUndo}
        title={t("toolbar.undo")}
      >
        ↶
      </button>
      <button
        type="button"
        className={styles.toolbarButton}
        onClick={onRedo}
        disabled={!canRedo}
        title={t("toolbar.redo")}
      >
        ↷
      </button>

      <div className={styles.toolbarDivider} />

      {/* Zoom */}
      <button
        type="button"
        className={styles.toolbarButton}
        onClick={onZoomOut}
        title={t("toolbar.zoomOut")}
      >
        −
      </button>
      <div className={styles.toolbarZoomValue}>{zoomPercent}%</div>
      <button
        type="button"
        className={styles.toolbarButton}
        onClick={onZoomIn}
        title={t("toolbar.zoomIn")}
      >
        +
      </button>

      <div className={styles.toolbarDivider} />

      <button
        type="button"
        className={styles.toolbarButton}
        onClick={onFit}
        title={t("toolbar.fit")}
      >
        {t("toolbar.fitShort")}
      </button>
      <button
        type="button"
        className={styles.toolbarButton}
        onClick={onReset}
        title={t("toolbar.reset")}
      >
        1:1
      </button>

      <div className={styles.toolbarDivider} />

      {/* Save status */}
      <div
        className={`${styles.saveStatus} ${styles[`saveStatus_${saveStatus}`]}`}
        title={t(`editor.saveStatus.${saveStatus}`)}
      >
        {saveStatus === "saving" ? "●" : saveStatus === "error" ? "✕" : "✓"}
      </div>
    </div>
  );
}
