import React from "react";
import { useNoseContour } from "./useNoseContour.js";
import styles from "./NoseContourPanel.module.css";

function NoseContourPanel({ points, commitPoints }) {
  const {
    createContour,
    applyContour,
    clearContour,
    contourPoints,
    hasContour,
    hasAppliedContour,
  } = useNoseContour({ points, commitPoints });

  const handleCreate = () => {
    const result = createContour();
    if (!result.success) {
      let msg = "Не удалось создать контур";
      if (result.reason === "no-landmarks") {
        msg += ": сначала определите анатомические точки";
      } else if (result.reason === "missing-anchors") {
        msg += ": не найдены опорные точки носа";
      }
      // eslint-disable-next-line no-alert
      alert(msg);
    }
  };

  const handleApply = () => {
    const result = applyContour();
    if (!result.success && result.reason === "no-contour") {
      // eslint-disable-next-line no-alert
      alert("Сначала нажмите «Создать контур»");
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.title}>Контурная коррекция носа</div>
      <div className={styles.subtitle}>
        12 точек по спинке + 20 по контуру крыльев → выравнивание по средней
        линии лица
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handleCreate}
        >
          {hasContour ? "Перестроить контур" : "Создать контур носа"}
        </button>

        {hasContour && (
          <>
            <div className={styles.statusLine}>
              Контур построен: {contourPoints?.length || 0} точек
            </div>
            <button
              type="button"
              className={styles.btnApply}
              onClick={handleApply}
            >
              Выровнять по средней линии
            </button>
          </>
        )}

        {hasAppliedContour && (
          <button
            type="button"
            className={styles.btnClear}
            onClick={clearContour}
          >
            Сбросить контур
          </button>
        )}
      </div>
    </div>
  );
}

export default NoseContourPanel;
