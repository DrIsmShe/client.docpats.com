// client/src/pages/admin/radiology/AgentReportPanel.jsx
//
// Отчёт агента-доводчика — общий для трёх админок арены.
//
// Раньше отчёт умещался в две строки («поправлено, кругов N» и «осталось
// сделать вам»), потому что агент почти ничего и не решал. Теперь он может
// ЗАКРЫТЬ замечание рецензента своим решением (server/.../issueAdjudicator.js)
// и опубликовать кейс — а значит, обязан отчитаться так, чтобы человек мог
// это решение проверить и отменить.
//
// Что здесь показано и почему именно это:
//
//   — ЗАКРЫТО АГЕНТОМ. Главный список. Замечание плюс обоснование, по
//     которому машина сочла его неверным. Свёрнут по умолчанию только когда
//     кейс уже опубликован: до публикации это то, что человек должен
//     прочитать, а не то, что он может свернуть не глядя;
//   — СУДЬЯ СЧЁЛ ВЕРНЫМИ. То, что осталось людям. Это не «агент не смог», а
//     «агент считает, что здесь настоящая ошибка» — и она держит публикацию;
//   — ПЕРЕВОДЫ. После публикации агент дожидается перевода, и здесь стоит,
//     на каких языках кейс реально появился. «Поставлено в очередь» тут
//     бесполезно: именно молчаливо провалившийся перевод и оставлял кейсы
//     без языков.
//
// Оговорку про общее заблуждение модели пишем прямо в отчёте: судья — та же
// модель, что писала кейс и рецензировала его, и «замечаний не осталось»
// означает «противоречий не осталось», а не «кейс верен».

import { useState } from "react";

const LANG_LABELS = {
  en: "English",
  az: "Azərbaycan",
  tr: "Türkçe",
  ar: "العربية",
  ru: "Русский",
};

const langList = (codes) =>
  (codes ?? []).map((c) => LANG_LABELS[c] ?? c).join(", ");

function headline(report) {
  if (report.published) return "опубликовано";
  if (report.fixed) return `текст поправлен, кругов ${report.rounds?.length ?? 0}`;
  return "правка не запускалась";
}

/**
 * @param {object|null} props.report отчёт с сервера (runCaseAgent)
 */
export default function AgentReportPanel({ report }) {
  const closed = report?.resolvedByAgent ?? [];
  const founded = report?.unresolvedFounded ?? [];
  const tr = report?.translation;
  // Разбор виден сразу, пока кейс не опубликован: это ровно тот случай, когда
  // человек ещё может вмешаться.
  const [openClosed, setOpenClosed] = useState(!report?.published);

  if (!report) return null;

  return (
    <div
      className="edu-hint"
      style={{
        marginTop: 10,
        padding: 10,
        borderRadius: 8,
        border: "1px solid #dbe4f0",
        background: "#f7faff",
      }}
    >
      <div style={{ fontWeight: 600, color: "#0f172a" }}>
        🤖 Прогон агента: {headline(report)}
      </div>

      {report.fixed && (
        <div style={{ marginTop: 4 }}>
          Замечаний осталось: {report.review?.issues?.length ?? 0}
          {" · "}
          внесено правок: {report.changes?.length ?? 0}
          {report.disputed?.length
            ? ` · редактор возразил: ${report.disputed.length}`
            : ""}
        </div>
      )}

      {/* ─── Что агент закрыл своим решением ─── */}
      {closed.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            className="rad-blocker-link"
            onClick={() => setOpenClosed((v) => !v)}
          >
            {openClosed ? "▾" : "▸"} Агент закрыл замечаний: {closed.length}
          </button>
          {openClosed && (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
              {closed.map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                  }}
                >
                  <div style={{ color: "#334155" }}>{c.issue}</div>
                  <div style={{ marginTop: 2, color: "#64748b" }}>
                    Почему закрыто: {c.why}
                  </div>
                </div>
              ))}
              <div style={{ color: "#94a3b8" }}>
                Решение принимала та же модель, что писала и рецензировала кейс:
                «замечаний не осталось» здесь значит «противоречий не осталось»,
                а не «кейс верен». Любое из них можно вернуть в панели
                рецензента.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Что агент оставил человеку ─── */}
      {founded.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 600, color: "#b45309" }}>
            Агент считает верными и не смог исправить: {founded.length}
          </div>
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
            {founded.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #fde68a",
                  background: "#fffbeb",
                }}
              >
                <div style={{ color: "#334155" }}>{f.issue}</div>
                {f.why && (
                  <div style={{ marginTop: 2, color: "#92400e" }}>{f.why}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {report.adjudicationError && (
        <div style={{ marginTop: 6, color: "#b45309" }}>
          Разбор замечаний не отработал ({report.adjudicationError}) — замечания
          остались вам.
        </div>
      )}

      {/* ─── Переводы ─── */}
      {tr && (
        <div style={{ marginTop: 6 }}>
          {tr.pending ? (
            <span style={{ color: "#64748b" }}>
              Перевод на остальные языки продолжается в фоне — он длиннее, чем
              стоит держать ответ. Загляните в «Переводы кейса» через
              минуту-другую.
            </span>
          ) : tr.error ? (
            <span style={{ color: "#b45309" }}>
              Перевод не запустился ({tr.error}) — догонится при первом открытии
              кейса врачом или кнопкой «перевести недостающее».
            </span>
          ) : (
            <>
              {(tr.created?.length ?? 0) + (tr.updated?.length ?? 0) > 0 && (
                <div>
                  Переведено: {langList([...(tr.created ?? []), ...(tr.updated ?? [])])}.
                </div>
              )}
              {tr.skipped?.length > 0 && (
                <div style={{ color: "#94a3b8" }}>
                  Уже были свежими: {langList(tr.skipped)}.
                </div>
              )}
              {tr.failed?.length > 0 && (
                <div style={{ color: "#b45309" }}>
                  Не перевелись: {langList(tr.failed)} — догонятся при первом
                  открытии кейса врачом или кнопкой «перевести недостающее».
                </div>
              )}
            </>
          )}
        </div>
      )}

      {report.blockers?.length > 0 && (
        <div style={{ marginTop: 6 }}>
          Осталось сделать вам: {report.blockers.join("; ")}.
        </div>
      )}
    </div>
  );
}
