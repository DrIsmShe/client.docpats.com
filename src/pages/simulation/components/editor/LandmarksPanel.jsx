// src/pages/simulation/components/editor/LandmarksPanel.jsx
//
// S.7.7+ финальная версия (с fallback'ом на чистый ручной режим):
//
//   • Если auto-detect упал (status === "failed" / "error", либо завершился
//     без landmarks) → header card с "Перерасчитать" полностью СКРЫВАЕТСЯ,
//     остаётся только блок "Разметить вручную".
//
//   • Если landmarks помечены вручную (isManualFit) ИЛИ просто есть
//     landmarks без явного auto-source → показывается блок "Размечено
//     вручную" с кнопкой "Разметить заново" (повторный wizard).
//
//   • Если auto-detect работает корректно → ничего не меняется,
//     показывается обычный auto card.
//
//   • Multi-face switcher и группы точек — без изменений.
//
//   • Бэдж rotation retry ("Фото было повёрнуто на N°") — без изменений.

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  toggleLandmarkGroup,
  selectLandmarks,
  selectLandmarksStatus,
  selectLandmarksDetectedAt,
  selectVisibleLandmarkGroups,
  selectFaceVariants,
  selectSelectedFaceIndex,
  selectLandmarksSource,
} from "../../store/simulationSlice.js";
import styles from "./LandmarksPanel.module.css";

const GROUPS = [
  { key: "face_oval", color: "#94a3b8" },
  { key: "forehead", color: "#fbbf24" },
  { key: "nose", color: "#3d7fff" },
  { key: "lips", color: "#ef4444" },
  { key: "left_eye", color: "#22c55e" },
  { key: "right_eye", color: "#22c55e" },
  { key: "left_eyebrow", color: "#f59e0b" },
  { key: "right_eyebrow", color: "#f59e0b" },
  { key: "left_cheek", color: "#ec4899" },
  { key: "right_cheek", color: "#ec4899" },
  { key: "left_jaw", color: "#06b6d4" },
  { key: "right_jaw", color: "#06b6d4" },
  { key: "chin", color: "#8b5cf6" },
  { key: "ears", color: "#14b8a6" },
  { key: "other", color: "rgba(148, 163, 184, 0.7)" },
];

/* ────────────── Manual wizard CTA — стиль ────────────── */
const manualBlockStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(168, 85, 247, 0.1)",
  border: "1px solid rgba(168, 85, 247, 0.4)",
  borderRadius: 10,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const manualHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
  color: "#e9d5ff",
};

const manualIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "rgba(168, 85, 247, 0.25)",
  color: "#e9d5ff",
  fontSize: 14,
  fontWeight: 700,
  flexShrink: 0,
};

const manualHintStyle = {
  fontSize: 12,
  lineHeight: 1.5,
  color: "#cbd5e1",
};

const manualBtnStyle = {
  width: "100%",
  padding: "10px 12px",
  background: "linear-gradient(180deg, #a855f7 0%, #8b5cf6 100%)",
  color: "white",
  border: "none",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  letterSpacing: "0.02em",
};

const sourceBadgeStyle = {
  display: "inline-block",
  fontSize: 10,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: 4,
  background: "rgba(168, 85, 247, 0.15)",
  color: "#c4b5fd",
  border: "1px solid rgba(168, 85, 247, 0.3)",
  marginInlineStart: 6,
};

const rotationBadgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  background: "rgba(59, 130, 246, 0.1)",
  border: "1px solid rgba(59, 130, 246, 0.3)",
  borderRadius: 6,
  fontSize: 11,
  lineHeight: 1.45,
  color: "#bfdbfe",
};

/* ────────────── Multi-face switcher — стиль ────────────── */
const faceSwitcherCardStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(59, 130, 246, 0.08)",
  border: "1px solid rgba(59, 130, 246, 0.3)",
  borderRadius: 10,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const faceSwitcherTitleStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#e2e8f0",
  margin: 0,
};

const faceSwitcherHintStyle = {
  fontSize: 11,
  lineHeight: 1.45,
  color: "#94a3b8",
  margin: 0,
};

const faceTabsRowStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const faceTabBaseStyle = {
  flex: "1 1 auto",
  minWidth: 0,
  padding: "8px 10px",
  background: "rgba(15, 21, 40, 0.6)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 6,
  color: "#cbd5e1",
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  transition: "all 0.15s",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const faceTabActiveStyle = {
  ...faceTabBaseStyle,
  background: "rgba(59, 130, 246, 0.25)",
  border: "1px solid rgba(59, 130, 246, 0.6)",
  color: "#ffffff",
};

const faceTabNumberStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 18,
  height: 18,
  borderRadius: "50%",
  background: "rgba(59, 130, 246, 0.4)",
  color: "white",
  fontSize: 10,
  fontWeight: 700,
  flexShrink: 0,
};

export default function LandmarksPanel({
  onReDetect,
  isLoaderReady,
  onSwitchFace,
  onStartManualWizard,
  rotationUsed = 0,
}) {
  const { t } = useTranslation("Simulation");
  const dispatch = useDispatch();

  const landmarks = useSelector(selectLandmarks);
  const status = useSelector(selectLandmarksStatus);
  const detectedAt = useSelector(selectLandmarksDetectedAt);
  const visibleGroups = useSelector(selectVisibleLandmarkGroups);
  const faceVariants = useSelector(selectFaceVariants);
  const selectedFaceIndex = useSelector(selectSelectedFaceIndex);
  const landmarksSource = useSelector(selectLandmarksSource);

  const visibleSet = new Set(visibleGroups);
  const isDetecting = status === "detecting";
  const canRedetect = isLoaderReady && !isDetecting;
  const hasMultipleFaces = faceVariants.length > 1;
  const hasLandmarks = landmarks.length > 0;
  const visibleCount = landmarks.filter((lm) => !lm.hidden).length;

  // S.7.7+ — критерий "разметка ручная":
  //   • явный source === "manual_fit", ИЛИ
  //   • статус failed/idle с landmarks (значит автодетект упал, а точки
  //     появились в результате последующего ручного wizard'а)
  const isManualFit =
    landmarksSource === "manual_fit" ||
    (hasLandmarks && (status === "failed" || status === "error"));

  // Auto-detect упал:
  //   • status === "failed" / "error" → явная ошибка
  //   • либо detection прошёл, но не нашёл landmarks
  //
  // Условие НЕ требует !hasLandmarks — даже если есть точки от ручного
  // wizard'а, мы всё равно считаем что auto-detect не удался и должны
  // скрыть header card.
  const autoFailed =
    isLoaderReady &&
    !isDetecting &&
    (status === "failed" ||
      status === "error" ||
      (status === "detected" && !hasLandmarks));

  // Header card (с "Перерасчитать") показываем только когда:
  //   • auto-detect не упал
  //   • разметка не помечена как ручная
  // Иначе — полностью скрываем.
  const showAutoCard = !autoFailed && !isManualFit;

  // Manual CTA "Разметить вручную" показываем когда:
  //   • auto упал и landmarks ещё нет
  const showManualCTA = autoFailed && !isManualFit && !hasLandmarks;

  // "Размечено вручную" + кнопка "Разметить заново" показываем когда:
  //   • landmarks помечены как manual_fit, ИЛИ
  //   • landmarks есть, но auto упал (значит они от прошлого wizard'а)
  const showManualMarked = isManualFit;

  const showRotationBadge = !isManualFit && hasLandmarks && rotationUsed > 0;

  return (
    <div className={styles.panel}>
      {/* ───── Header card (auto detect) — рендерим только если авто-детект работает ───── */}
      {showAutoCard && (
        <div className={styles.headerCard}>
          <div className={styles.headerTop}>
            <h4 className={styles.title}>
              {t("landmarks.title", { defaultValue: "Анатомическая разметка" })}
            </h4>
            <span
              className={`${styles.statusPill} ${styles[`status_${status}`]}`}
              aria-live="polite"
            >
              <span className={styles.statusDot} />
              {t(`landmarks.status.${status}`)}
            </span>
          </div>

          {hasLandmarks && (
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{visibleCount}</span>
                <span className={styles.statLabel}>
                  {t("landmarks.statsVisible", { defaultValue: "точек" })}
                </span>
              </div>
            </div>
          )}

          {showRotationBadge && (
            <div style={rotationBadgeStyle} role="status">
              <span style={{ fontSize: 14, flexShrink: 0 }} aria-hidden="true">
                🔄
              </span>
              <span>
                {t("landmarks.rotationApplied", {
                  degrees: rotationUsed,
                  defaultValue: `Фото было автоматически повёрнуто на ${rotationUsed}° для распознавания`,
                })}
              </span>
            </div>
          )}

          {detectedAt && (
            <div className={styles.subtleInfo}>
              {t("landmarks.detectedAt", {
                time: new Date(detectedAt).toLocaleTimeString(),
              })}
            </div>
          )}
          {!isLoaderReady && (
            <div className={styles.subtleInfo}>
              {t("landmarks.loaderLoading", {
                defaultValue: "Загрузка модели…",
              })}
            </div>
          )}

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => onReDetect?.({ force: true })}
            disabled={!canRedetect}
          >
            {isDetecting
              ? t("landmarks.detecting", { defaultValue: "Распознавание…" })
              : t("landmarks.redetect", { defaultValue: "Перерасчитать" })}
          </button>
        </div>
      )}

      {/* ───── Manual wizard CTA — авто упал, точек нет ───── */}
      {showManualCTA && (
        <div style={manualBlockStyle}>
          <div style={manualHeaderStyle}>
            <span style={manualIconStyle} aria-hidden="true">
              ✏
            </span>
            <span>
              {t("manualLandmarks.cta.titleShort", {
                defaultValue: "Ручная разметка",
              })}
            </span>
          </div>
          <div style={manualHintStyle}>
            {t("manualLandmarks.cta.hintShort", {
              defaultValue:
                "Расставьте точки на лице вручную — это займёт меньше минуты.",
            })}
          </div>
          <button
            type="button"
            style={manualBtnStyle}
            onClick={() => onStartManualWizard?.()}
          >
            {t("manualLandmarks.cta.start", {
              defaultValue: "Разметить вручную",
            })}
          </button>
        </div>
      )}

      {/* ───── "Размечено вручную" — кнопка перезапуска wizard'а ───── */}
      {showManualMarked && (
        <div style={manualBlockStyle}>
          <div style={manualHeaderStyle}>
            <span style={manualIconStyle} aria-hidden="true">
              ✓
            </span>
            <span>
              {t("manualLandmarks.cta.markedTitle", {
                defaultValue: "Размечено вручную",
              })}
            </span>
            <span style={sourceBadgeStyle}>
              {hasLandmarks ? `${visibleCount}` : ""}
            </span>
          </div>
          <div style={manualHintStyle}>
            {t("manualLandmarks.cta.redoHint", {
              defaultValue:
                "Точки расставлены вручную. Можно изменить разметку при необходимости.",
            })}
          </div>
          <button
            type="button"
            style={manualBtnStyle}
            onClick={() => onStartManualWizard?.()}
          >
            {t("manualLandmarks.cta.redo", {
              defaultValue: "Разметить заново",
            })}
          </button>
        </div>
      )}

      {/* ───── Multi-face switcher — без изменений ───── */}
      {hasMultipleFaces && !isManualFit && (
        <div style={faceSwitcherCardStyle}>
          <h5 style={faceSwitcherTitleStyle}>
            {t("landmarks.multiFace.title", {
              count: faceVariants.length,
              defaultValue: `Найдено лиц: ${faceVariants.length}`,
            })}
          </h5>
          <p style={faceSwitcherHintStyle}>
            {t("landmarks.multiFace.hint", {
              defaultValue: "Выберите лицо для разметки",
            })}
          </p>
          <div style={faceTabsRowStyle}>
            {faceVariants.map((variant, idx) => {
              const isActive = idx === selectedFaceIndex;
              const center = variant.bbox?.centerX ?? 0.5;
              const positionKey =
                center < 0.4 ? "left" : center > 0.6 ? "right" : "center";
              const positionLabel = t(
                `landmarks.multiFace.position_${positionKey}`,
                {
                  defaultValue:
                    positionKey === "left"
                      ? "слева"
                      : positionKey === "right"
                        ? "справа"
                        : "центр",
                },
              );
              return (
                <button
                  key={idx}
                  type="button"
                  style={isActive ? faceTabActiveStyle : faceTabBaseStyle}
                  onClick={() => onSwitchFace?.(idx)}
                  title={positionLabel}
                >
                  <span style={faceTabNumberStyle}>{idx + 1}</span>
                  <span>{positionLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ───── Groups card — показываем только при auto-mode с landmarks ─────
              При ручной разметке (1 точка) фильтр групп бесполезен — там
              всего одна точка, и группа всегда "manual" / "other". */}
      {hasLandmarks && !isManualFit && showAutoCard && (
        <div className={styles.groupsCard}>
          <div className={styles.cardLabel}>
            {t("landmarks.groups.title", { defaultValue: "Группы точек" })}
          </div>
          <div className={styles.groupsScroll}>
            {GROUPS.map((g) => (
              <label key={g.key} className={styles.group}>
                <input
                  type="checkbox"
                  checked={visibleSet.has(g.key)}
                  onChange={() => dispatch(toggleLandmarkGroup(g.key))}
                />
                <span
                  className={styles.groupDot}
                  style={{ background: g.color }}
                  aria-hidden="true"
                />
                <span className={styles.groupName}>
                  {t(`landmarks.groups.${g.key}`)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
