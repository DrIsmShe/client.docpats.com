// client/src/pages/admin/radiology/AiReviewPanel.jsx
//
// Замечания ИИ-рецензента (второй проход) — общий блок для трёх станций
// арены: /admin/radiology, /admin/labs, /admin/vp.
//
// Замысел: рецензент НЕ правит кейс, он показывает автору, куда смотреть.
// Поэтому замечание живёт в двух местах сразу — в этом списке (чек-лист) и
// подсказкой у самой строки показателя/обследования (указатель). Без второго
// проверка превращается в «прочитать 14 строк панели заново», а с ним — в
// «посмотреть на три отмеченные».
//
// «Разобрано» ничего не исправляет: это отметка автора, что он посмотрел.
// Пока есть неразобранные замечания, публикация заблокирована — иначе список
// становится декоративным. Блокируют ВСЕ замечания, а не только severity
// "error": почему именно так — см. unresolvedIssues ниже.

const norm = (s) => String(s ?? "").trim().toLowerCase();

// Служебные значения target, которые не относятся к конкретной строке.
const GENERAL_TARGETS = new Set([
  "impression",
  "context",
  "title",
  "findings",
  "case",
  "diagnosis",
]);

/**
 * Замечания, относящиеся к конкретной строке (показателю/обследованию).
 * Модель пишет target названием строки, поэтому сверяем по имени: точное
 * совпадение либо вхождение (она может дописать уточнение в скобках).
 */
export function issuesForRow(review, dismissed, rowName) {
  const name = norm(rowName);
  if (!review?.issues?.length || !name) return [];
  return review.issues
    .map((issue, index) => ({ issue, index }))
    .filter(({ issue, index }) => {
      if (dismissed?.has(index)) return false;
      const t = norm(issue.target);
      if (!t || GENERAL_TARGETS.has(t)) return false;
      if (t === name) return true;
      // Вхождение — только для достаточно длинных строк, иначе «Т4» совпадёт
      // со «Свободный Т4» и с «ТТГ» одновременно.
      return t.length > 3 && (t.includes(name) || name.includes(t));
    })
    .map(({ issue, index }) => ({ ...issue, index }));
}

/**
 * Неразобранные замечания — они блокируют публикацию.
 *
 * Почему ВСЕ, а не только severity="error": на калибровке (11 кейсов, 42
 * замечания) модель раз за разом метила клинически опасное как warning —
 * «нитраты противопоказаны» и «калий 5,9 без контроля ЭКГ» шли не как error.
 * Промптом это не выправилось, поэтому вешать защитный гейт на severity от
 * модели нельзя. Точность замечаний при этом высокая (выдуманных в выборке не
 * было), так что «разобрать всё» — не борьба с шумом. severity остаётся
 * подсказкой приоритета, а не предохранителем.
 */
export function unresolvedIssues(review, dismissed) {
  if (!review?.issues?.length) return [];
  return review.issues.filter((_, index) => !dismissed?.has(index));
}

const SEVERITY = {
  error: { label: "ошибка", color: "#dc2626", bg: "#fef2f2" },
  warning: { label: "внимание", color: "#b45309", bg: "#fffbeb" },
};

/** Компактная подсказка под строкой показателя/обследования. */
export function AiRowIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
      {issues.map((i) => {
        const s = SEVERITY[i.severity] ?? SEVERITY.warning;
        return (
          <div key={i.index} style={{ fontSize: 12, color: s.color, lineHeight: 1.35 }}>
            ⚠ {i.issue}
            {i.suggestion ? <span style={{ opacity: 0.85 }}> → {i.suggestion}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * @param {object|null} props.review     { verdict, issues, errorCount, summary }
 * @param {Set<number>} props.dismissed  индексы разобранных замечаний
 * @param {(i:number)=>void} props.onDismiss
 * @param {()=>void} props.onRecheck     повторная проверка (после правок)
 * @param {boolean} props.busy
 */
export default function AiReviewPanel({ review, dismissed, onDismiss, onRecheck, busy }) {
  if (!review) return null;

  const open = review.issues.filter((_, i) => !dismissed?.has(i));
  const errors = open.filter((i) => i.severity === "error").length;

  return (
    <div className="rad-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div className="edu-card-title" style={{ fontSize: 15, margin: 0 }}>
          🔍 Проверка ИИ-рецензентом
        </div>
        {onRecheck && (
          <button type="button" className="edu-btn edu-btn--ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={onRecheck} disabled={busy}>
            {busy ? "проверяем…" : "проверить снова"}
          </button>
        )}
      </div>

      {review.summary && (
        <div className="edu-hint" style={{ marginTop: 6 }}>{review.summary}</div>
      )}

      {open.length === 0 ? (
        <div className="edu-notice" style={{ marginTop: 8 }}>
          {review.issues.length === 0
            ? "Замечаний нет: рецензент считает кейс согласованным. Это не отменяет вашей проверки — модель та же, что генерировала кейс, и общие для неё ошибки она может не увидеть."
            : "Все замечания разобраны."}
        </div>
      ) : (
        <>
          <div className="edu-hint" style={{ marginTop: 8 }}>
            Замечаний: {open.length} — все требуют разбора до публикации
            {errors > 0 && <> · критичных: <b>{errors}</b></>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {review.issues.map((issue, index) => {
              if (dismissed?.has(index)) return null;
              const s = SEVERITY[issue.severity] ?? SEVERITY.warning;
              return (
                <div
                  key={index}
                  style={{
                    border: `1px solid ${s.color}33`,
                    background: s.bg,
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>
                      {s.label}
                      {issue.target ? ` · ${issue.target}` : ""}
                    </span>
                    <button
                      type="button"
                      className="edu-btn edu-btn--ghost"
                      style={{ padding: "2px 8px", fontSize: 12 }}
                      onClick={() => onDismiss(index)}
                    >
                      разобрано
                    </button>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13 }}>{issue.issue}</div>
                  {issue.suggestion && (
                    <div style={{ marginTop: 2, fontSize: 13, opacity: 0.85 }}>
                      Предложение: {issue.suggestion}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
