// src/pages/simulation/standards/components/ApplyStandardPanel.jsx
//
// View-aware панель стандартов + кнопка manual landmark wizard.
// + кнопка «Ручная разметка опорных точек» — запускает наш standalone
//   wizard. После завершения wizard'а landmarks появляются и стандарты
//   сразу работают.

import React, { useState, useMemo } from "react";
import { listStandardsByCategory } from "../data/index.js";
import { useStandardEvaluation } from "../hooks/useStandardEvaluation.js";
import { useApplyStandard } from "../hooks/useApplyStandard.js";
import { VIEW } from "../services/viewDetection.js";
import StandardSelector from "./StandardSelector.jsx";
import StandardEvaluationCard from "./StandardEvaluationCard.jsx";
import styles from "./ApplyStandardPanel.module.css";

const CATEGORY_TITLES = {
  rhinoplasty: "Стандарты ринопластики",
  mammoplasty: "Стандарты мамопластики",
};

const EMPTY_HINT = {
  rhinoplasty:
    "Сначала детектируйте анатомические точки автоматически или используйте ручную разметку.",
  mammoplasty:
    "Поставьте опорные точки (яремная вырезка, соски, складки), затем выберите стандарт.",
};

const VIEW_LABEL = {
  [VIEW.FRONTAL]: "анфас",
  [VIEW.PROFILE]: "профиль",
  [VIEW.THREE_QUARTER]: "три-четверти",
  [VIEW.UNKNOWN]: "не определён",
};

export default function ApplyStandardPanel({
  category = "rhinoplasty",
  points,
  commitPoints,
  breastAnchors = null,
  breastCalibration = null,
  // S.10.10 — manual landmark wizard
  onStartManualWizard,
}) {
  const [standardId, setStandardId] = useState(null);

  const standards = useMemo(
    () => listStandardsByCategory(category),
    [category],
  );

  const { results, summary, standard, hasInputs, currentView } =
    useStandardEvaluation({
      standardId,
      category,
      breastAnchors,
      breastCalibration,
    });

  const applyHook = useApplyStandard({
    standardId: category === "rhinoplasty" ? standardId : null,
    points,
    commitPoints,
  });

  const handleApply = () => {
    if (category !== "rhinoplasty") return;
    const result = applyHook.apply();
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.warn("[ApplyStandardPanel] apply failed:", result.reason);
    }
  };

  const handleClear = () => applyHook.clear();

  const allUnknown =
    standardId && summary.total > 0 && summary.unknown === summary.total;

  const canApply =
    category === "rhinoplasty" &&
    hasInputs &&
    !!standardId &&
    !allUnknown &&
    typeof commitPoints === "function";

  // Кнопка manual wizard видна когда landmarks нет ИЛИ когда они есть но
  // все измерения unknown (детекция нашла лицо, но не те точки)
  const showManualWizardButton =
    category === "rhinoplasty" &&
    typeof onStartManualWizard === "function" &&
    (!hasInputs || allUnknown);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4 className={styles.title}>{CATEGORY_TITLES[category]}</h4>
        {category === "rhinoplasty" && currentView !== VIEW.UNKNOWN && (
          <div className={styles.viewBadge}>
            ракурс: <strong>{VIEW_LABEL[currentView]}</strong>
          </div>
        )}
        {summary.total > 0 && (
          <div className={styles.summary}>
            <span
              className={styles.summaryDot}
              style={{ background: "#22c55e" }}
            />
            <span>{summary.inRange}</span>
            <span className={styles.summarySep}>/</span>
            <span>{summary.total}</span>
          </div>
        )}
      </div>

      <StandardSelector
        category={category}
        value={standardId}
        onChange={setStandardId}
        currentView={currentView}
      />

      {standardId && standard?.source && (
        <div className={styles.source} title={standard.source}>
          {standard.source}
        </div>
      )}

      {/* MANUAL WIZARD BUTTON — показываем когда нет landmarks */}
      {showManualWizardButton && (
        <button
          type="button"
          className={styles.manualWizardBtn}
          onClick={onStartManualWizard}
        >
          🖱 Ручная разметка опорных точек
        </button>
      )}

      {/* MISSING LANDMARKS WARNING */}
      {category === "rhinoplasty" && standardId && allUnknown && hasInputs && (
        <div className={styles.viewWarning}>
          <div className={styles.viewWarningTitle}>
            ⚠ Ключевые точки не найдены
          </div>
          <div className={styles.viewWarningBody}>
            Не удалось определить положение нужных опорных точек. Используйте
            «Ручная разметка опорных точек» — кликните 6 точек на фото и
            стандарты заработают на любом ракурсе.
          </div>
        </div>
      )}

      {!hasInputs && <div className={styles.empty}>{EMPTY_HINT[category]}</div>}

      {hasInputs && !standardId && (
        <div className={styles.empty}>Выберите стандарт из списка выше.</div>
      )}

      {hasInputs && standardId && results.length > 0 && (
        <>
          <div className={styles.cards}>
            {results.map((r) => (
              <StandardEvaluationCard key={r.key} result={r} />
            ))}
          </div>

          {category === "rhinoplasty" && (
            <>
              {applyHook.isApplied && applyHook.summary.count > 0 && (
                <div className={styles.appliedHint}>
                  Применено: {applyHook.summary.count}{" "}
                  {applyHook.summary.count === 1 ? "точка" : "точек"} деформации
                </div>
              )}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.applyButton}
                  onClick={handleApply}
                  disabled={!canApply}
                >
                  {applyHook.isApplied ? "Пересчитать" : "Применить стандарт"}
                </button>

                {applyHook.isApplied && (
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={handleClear}
                  >
                    Сбросить
                  </button>
                )}
              </div>

              <div className={styles.warning}>
                ⚠ Эстетические стандарты — статистические нормы, не предписание.
                Финальное решение всегда за хирургом.
              </div>
            </>
          )}

          {category === "mammoplasty" && (
            <div className={styles.empty}>
              Применение стандартов мамопластики — в разработке (S.10.8+).
            </div>
          )}
        </>
      )}

      {standards.length === 0 && (
        <div className={styles.empty}>
          В этой категории пока нет доступных стандартов.
        </div>
      )}
    </div>
  );
}
