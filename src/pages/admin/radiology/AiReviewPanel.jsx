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

import { useState } from "react";

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

// Чем закончился цикл «правка → перепроверка» (server/modules/radiology/ai/autoFix.js).
const STOPPED_BY = {
  clean: "рецензент не нашёл замечаний",
  max_rounds: "исчерпан лимит кругов",
  no_progress: "правка перестала убирать замечания — спор по существу",
  error: "цикл прервался ошибкой модели",
  targeted: "точечная правка по выбранному замечанию",
  adjudicated: "спор разобран судьёй, застрявшие замечания правились точечно",
  adjudication_failed: "разбор застрявших замечаний не отработал",
  deadline: "вышел срок прогона — агент вернулся, не начав новый круг",
};

/**
 * Обрыв связи с агентом. Прогон живёт внутри HTTP-запроса и может пережить
 * само соединение: nginx рвёт его по таймауту, а сервер спокойно досчитывает
 * круги, публикует кейс и переводит его. Врач при этом видел голое «Network
 * Error» на кейсе, который на самом деле опубликован, — и делал ровно
 * противоположный вывод. Поэтому сетевую ошибку от прикладной отличаем и
 * пишем, что именно произошло.
 */
export function isConnectionLost(err) {
  if (err?.response) return false;
  const code = err?.code ?? "";
  return (
    code === "ECONNABORTED" ||
    code === "ERR_NETWORK" ||
    /network error|timeout/i.test(String(err?.message ?? ""))
  );
}

export const AGENT_LOST_NOTICE =
  "Связь с агентом оборвалась по таймауту, но на сервере он продолжает работу " +
  "и доводит её до конца. Обновите кейс через минуту-другую: правки, публикация " +
  "и перевод могли уже примениться.";

/**
 * ОТЧЁТ МАШИННОЙ ПРАВКИ. Показывается, пока правки живут в кейсе, а не только
 * сразу после нажатия кнопки: через неделю вопрос «почему здесь такая цифра»
 * возникает чаще, чем в первую минуту.
 *
 * Смысл блока — сделать правку читаемой по диффу. Кейс, который машина
 * переписала целиком и молча, автор проверять не станет: проверять там нечего,
 * кроме как перечитывать всё заново. Список «было → стало + почему» — то, ради
 * чего редактор вообще обязан отчитываться.
 *
 * @param {object|null} props.revision { rounds, stoppedBy, converged, changes, disputed }
 */
export function AiRevisionPanel({ revision }) {
  if (!revision) return null;
  const changes = revision.changes ?? [];
  const disputed = revision.disputed ?? [];
  if (!changes.length && !disputed.length) return null;

  return (
    <div className="rad-panel">
      <div className="edu-card-title" style={{ fontSize: 15 }}>🛠 Что исправил ИИ</div>
      {/* ДАТА ПРОГОНА ОБЯЗАТЕЛЬНА. Панель заполняется из сохранённого кейса при
          его открытии, то есть показывает ПОСЛЕДНЮЮ правку — она могла быть и
          две недели назад. Без даты свежезапущенный агент, который ничего не
          изменил, выглядел как «вот что он сделал», и человек искал изменения
          там, где их не было. */}
      <div className="edu-hint" style={{ marginTop: 6 }}>
        Кругов правки: {revision.rounds ?? 0}
        {revision.stoppedBy ? ` · остановка: ${STOPPED_BY[revision.stoppedBy] ?? revision.stoppedBy}` : ""}
        {" · "}
        {revision.converged ? "замечаний не осталось" : "замечания остались"}
        {revision.revisedAt
          ? ` · ${new Date(revision.revisedAt).toLocaleString("ru-RU", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : ""}
      </div>
      <div className="edu-hint" style={{ marginTop: 4 }}>
        Правил и проверял ОДИН и тот же ИИ. Согласованность он вычищает хорошо, общее
        для обеих ролей заблуждение — нет: референс, который он считает верным, таким и
        останется. Проверьте цифры глазами.
      </div>

      {changes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {changes.map((c, i) => (
            <div
              key={i}
              style={{ border: "1px solid #e5efe5", background: "#f6fbf6", borderRadius: 8, padding: 8 }}
            >
              {c.target && (
                <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>{c.target}</div>
              )}
              <div style={{ marginTop: 2, fontSize: 13 }}>{c.change}</div>
              {c.why && (
                <div style={{ marginTop: 2, fontSize: 12, opacity: 0.8 }}>Почему: {c.why}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {disputed.length > 0 && (
        <>
          {/* Несогласие редактора с рецензентом. Это не брак работы, а самое
              интересное место кейса: две роли одной модели разошлись, и
              рассудить их может только человек. */}
          <div className="edu-field-label" style={{ marginTop: 12 }}>
            Замечания, которые ИИ считает неверными и не исправлял ({disputed.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            {disputed.map((d, i) => (
              <div
                key={i}
                style={{ border: "1px solid #e8e3f5", background: "#faf8ff", borderRadius: 8, padding: 8 }}
              >
                <div style={{ fontSize: 13 }}>{d.issue}</div>
                <div style={{ marginTop: 2, fontSize: 12, opacity: 0.85 }}>Возражение: {d.why}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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
 * @param {(i:number)=>void} [props.onFix] исправить ОДНО замечание силами ИИ
 * @param {boolean} props.busy
 * @param {boolean} [props.fixBusy]      идёт правка
 * @param {object} [props.panelRef]      ref на корень — по нему сюда прокручивают
 * @param {boolean} [props.flash]        кратко подсветить панель (пришли по ссылке)
 * @param {Array<{index:number, why:string}>} [props.agentResolved]
 *        замечания, закрытые АГЕНТОМ с обоснованием. Показываются отдельным
 *        списком: закрыла их машина, и человек должен видеть чем именно
 *        обосновано и мочь вернуть замечание обратно.
 * @param {(i:number)=>void} [props.onReopen] вернуть закрытое агентом
 * @param {import("react").ReactNode} [props.footer]
 *        дубль кнопки публикации/отправки на ревью. Разобрав последнее
 *        замечание, автор нажимает её здесь же, а не ищет низ формы заново.
 */
export default function AiReviewPanel({
  review,
  dismissed,
  onDismiss,
  onRecheck,
  onFix,
  busy,
  fixBusy,
  panelRef,
  flash,
  footer,
  agentResolved,
  onReopen,
}) {
  if (!review) return null;

  const open = review.issues.filter((_, i) => !dismissed?.has(i));
  const errors = open.filter((i) => i.severity === "error").length;

  return (
    <div className={`rad-panel${flash ? " rad-panel--flash" : ""}`} ref={panelRef}>
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
                    <div style={{ display: "flex", gap: 6 }}>
                      {/* Исправить ИМЕННО ЭТО замечание. Нужно там, где
                          рецензент предлагает два пути и выбор врачебный:
                          общая кнопка «исправить всё» выберет за автора, а
                          здесь он правит по одному и смотрит результат. */}
                      {onFix && (
                        <button
                          type="button"
                          className="edu-btn edu-btn--ghost"
                          style={{ padding: "2px 8px", fontSize: 12 }}
                          onClick={() => onFix(index)}
                          disabled={fixBusy || busy}
                        >
                          {fixBusy ? "правит…" : "🛠 исправить"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="edu-btn edu-btn--ghost"
                        style={{ padding: "2px 8px", fontSize: 12 }}
                        onClick={() => onDismiss(index)}
                      >
                        разобрано
                      </button>
                    </div>
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

      <AgentClosedIssues
        review={review}
        agentResolved={agentResolved}
        onReopen={onReopen}
      />

      {footer && <div className="rad-review-footer">{footer}</div>}
    </div>
  );
}

/**
 * Замечания, закрытые агентом. Отдельный, свёрнутый список — не в общей
 * ленте: там лежит то, что ждёт человека, а здесь то, что за него уже решила
 * машина. Смешивать их значило бы прятать решение агента среди своих же
 * галочек «разобрано».
 */
function AgentClosedIssues({ review, agentResolved, onReopen }) {
  const [open, setOpen] = useState(false);
  const rows = (agentResolved ?? [])
    .map((r) => ({ ...r, issue: review?.issues?.[r.index] }))
    .filter((r) => r.issue);
  if (!rows.length) return null;

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #e6ecf3" }}>
      <button type="button" className="rad-blocker-link" onClick={() => setOpen((v) => !v)}>
        {open ? "▾" : "▸"} Закрыто агентом: {rows.length}
      </button>
      {open && (
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((r) => (
            <div
              key={r.index}
              style={{
                padding: 8,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                  {r.issue.target ? r.issue.target : "замечание"}
                </span>
                {onReopen && (
                  <button
                    type="button"
                    className="edu-btn edu-btn--ghost"
                    style={{ padding: "2px 8px", fontSize: 12 }}
                    onClick={() => onReopen(r.index)}
                    title="Вернуть замечание в работу — публикация снова будет ждать вашего решения"
                  >
                    вернуть
                  </button>
                )}
              </div>
              <div style={{ marginTop: 4, fontSize: 13 }}>{r.issue.issue}</div>
              <div style={{ marginTop: 2, fontSize: 13, color: "#64748b" }}>
                Агент закрыл: {r.why}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Препятствия к публикации ────────────────────────────────────────────
//
// Текст блокера про замечания собирается здесь, а не в трёх страницах: по
// этому префиксу BlockerHint узнаёт пункт, который можно сделать ссылкой.
export const REVIEW_BLOCKER_PREFIX = "разберите замечания рецензента";

export function reviewBlocker(openIssues) {
  return `${REVIEW_BLOCKER_PREFIX} (${openIssues})`;
}

/**
 * Список препятствий к публикации. Пункт про замечания рецензента — кнопка:
 * она уводит к панели и подсвечивает её.
 *
 * Зачем: со дна формы кнопка «Отправить на ревью» выглядит просто сломанной.
 * Причина написана рядом серым текстом, но панель рецензента — экраном выше,
 * и подсказка называет проблему, не говоря, куда идти. Гейт при этом не
 * трогаем: «разобрано» по-прежнему ставится по одному замечанию.
 *
 * @param {string} props.prefix          вступление ("Чтобы отправить на ревью…")
 * @param {string[]} props.blockers
 * @param {()=>void} [props.onFocusReview] прокрутить к панели и подсветить
 */
export function BlockerHint({ prefix, blockers, onFocusReview, className = "edu-hint", style }) {
  if (!blockers?.length) return null;
  return (
    <div className={className} style={style}>
      {prefix ? `${prefix} ` : ""}
      {blockers.map((b, i) => (
        <span key={b}>
          {i > 0 ? "; " : ""}
          {onFocusReview && b.startsWith(REVIEW_BLOCKER_PREFIX) ? (
            <button type="button" className="rad-blocker-link" onClick={onFocusReview}>
              {b}
            </button>
          ) : (
            b
          )}
        </span>
      ))}
      .
    </div>
  );
}
