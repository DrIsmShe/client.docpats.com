// client/src/pages/admin/ops/AdminNewsEnginePage.jsx
//
// Управление фоновыми задачами движка новостей: генерация статей, перевод,
// сбор новостей, конференции.
//
// ЗАЧЕМ ЭКРАН. Выключатели этих задач до сих пор жили в переменных
// окружения: чтобы остановить генерацию, нужно было зайти на сервер,
// поправить .env и перезапустить процесс. А останавливать иногда надо
// срочно — когда кончились деньги на модели или когда пошёл брак.
//
// ПОЧЕМУ ПЕРЕКЛЮЧАТЕЛЬ НЕ МЕНЯЕТСЯ СРАЗУ ПО НАЖАТИЮ. Он показывает
// состояние, подтверждённое сервером, а не намерение пользователя. Если
// движок недоступен, галочка не должна выглядеть переключённой: владелец
// решит, что генерация остановлена, а она продолжит тратить деньги.

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

// Пояснения к задачам: что именно остановится. Без них переключатель
// «Перевод статей» выглядит безобидно, хотя это самая дорогая часть.
const HINTS = {
  ingestion: "Сбор материалов из источников. Без него не из чего делать статьи.",
  synthesis: "Написание статей. Одна в сутки, самая заметная задача.",
  translation:
    "Перевод на четыре языка после выпуска. Самая дорогая часть: четыре длинных генерации на статью.",
  conferences: "Еженедельный сбор конференций. Ничего не публикует — всё уходит в модерацию.",
  doctorArticlesTranslation:
    "Перевод статей врачей — и мнений, и научных — на пять языков. Идёт каждые десять минут по всему корпусу, то есть тратит деньги постоянно.",
};

// Где задача живёт. Владельцу это неважно при обычной работе, но важно,
// когда движок недоступен: тогда видно, что именно осталось управляемым.
const WHERE = { engine: "движок новостей", docpats: "DocPats" };

export default function AdminNewsEnginePage() {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [engineError, setEngineError] = useState("");

  const apply = useCallback((data) => {
    setJobs(data.jobs || []);
    setMeta({
      updatedBy: data.updatedBy,
      lastChange: data.lastChange,
      updatedAt: data.updatedAt,
    });
    setEngineError(data.engineError || "");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/admin/news-engine/jobs`, {
        withCredentials: true,
      });
      apply(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось получить состояние");
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(job) {
    setBusy(job.id);
    setError("");
    try {
      const res = await axios.put(
        `${API_BASE}/admin/news-engine/jobs`,
        { [job.id]: !job.enabled },
        { withCredentials: true },
      );
      // Состояние берём из ответа, а не выставляем сами: показывать надо
      // то, что подтвердил сервер.
      apply(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось переключить");
    } finally {
      setBusy(null);
    }
  }

  const stopped = jobs.filter((j) => !j.enabled);

  return (
    <div className="ane-root">
      <style>{styles}</style>

      <div className="ane-head">
        <div>
          <h1 className="ane-title">Движок новостей</h1>
          <p className="ane-sub">
            Фоновые задачи, которые делают статьи на docpats.com/articles.
            Переключение действует сразу, перезапуск не нужен.
          </p>
        </div>
        <button className="ane-refresh" onClick={load} disabled={loading}>
          {loading ? "Обновляю…" : "Обновить"}
        </button>
      </div>

      {error && (
        <div className="ane-error">
          <b>Ошибка.</b> {error}
        </div>
      )}

      {engineError && (
        <div className="ane-error">
          <b>Движок новостей недоступен.</b> {engineError} Задачами движка
          сейчас управлять нельзя — показаны только задачи DocPats.
        </div>
      )}

      {stopped.length > 0 && (
        <div className="ane-warn">
          <b>Остановлено: {stopped.map((j) => j.title.toLowerCase()).join(", ")}.</b>{" "}
          Пока задача выключена, она пропускается по расписанию и ничего не
          делает.
        </div>
      )}

      {loading && jobs.length === 0 ? (
        <div className="ane-empty">Загружаю состояние…</div>
      ) : (
        <div className="ane-list">
          {jobs.map((job) => (
            <div key={job.id} className="ane-row">
              <div className="ane-row-main">
                <div className="ane-row-title">
                  <span
                    className={`ane-dot ${job.enabled ? "on" : "off"}`}
                    aria-hidden="true"
                  />
                  {job.title}
                  {job.where && (
                    <span className="ane-where">{WHERE[job.where] || job.where}</span>
                  )}
                </div>
                <div className="ane-row-hint">{HINTS[job.id] || ""}</div>
              </div>

              <button
                className={`ane-toggle ${job.enabled ? "on" : "off"}`}
                onClick={() => toggle(job)}
                disabled={busy === job.id}
                type="button"
              >
                {busy === job.id
                  ? "…"
                  : job.enabled
                    ? "Остановить"
                    : "Запустить"}
              </button>
            </div>
          ))}
        </div>
      )}

      {meta.lastChange && (
        <div className="ane-meta">
          Последнее изменение: {meta.lastChange}
          {meta.updatedAt
            ? ` · ${new Date(meta.updatedAt).toLocaleString("ru-RU")}`
            : ""}
        </div>
      )}

      <div className="ane-note">
        <b>Что переключатель не делает.</b> Он не останавливает то, что уже
        начало выполняться: запущенная генерация статьи доработает до конца.
        Остановка означает, что следующий запуск по расписанию будет
        пропущен.
      </div>
    </div>
  );
}

const styles = `
.ane-root { padding: 26px 28px 60px; max-width: 860px; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #0f172a; }

.ane-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
.ane-title { font-size: 24px; font-weight: 700; margin: 0 0 6px; }
.ane-sub { font-size: 14px; color: #64748b; margin: 0; line-height: 1.55; max-width: 60ch; }

.ane-refresh { border: 1px solid #cbd5e1; background: #fff; color: #334155; border-radius: 8px; padding: 8px 16px; font-size: 14px; cursor: pointer; white-space: nowrap; }
.ane-refresh:hover:not(:disabled) { background: #f1f5f9; }
.ane-refresh:disabled { opacity: .55; cursor: not-allowed; }

.ane-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 8px; padding: 12px 14px; font-size: 14px; margin-bottom: 18px; }
.ane-warn { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 8px; padding: 12px 14px; font-size: 14px; margin-bottom: 18px; line-height: 1.55; }
.ane-empty { color: #64748b; font-size: 14px; padding: 20px 0; }

.ane-list { display: flex; flex-direction: column; gap: 1px; background: #e2e8f0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }

.ane-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; background: #fff; padding: 16px 18px; }

.ane-row-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 9px; }
.ane-row-hint { font-size: 13px; color: #64748b; margin-top: 4px; line-height: 1.5; max-width: 58ch; }

.ane-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
.ane-dot.on { background: #16a34a; }
.ane-dot.off { background: #dc2626; }

.ane-toggle { border-radius: 8px; padding: 8px 18px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; border: 1px solid transparent; }
.ane-toggle.on { background: #fff; border-color: #cbd5e1; color: #334155; }
.ane-toggle.on:hover:not(:disabled) { border-color: #dc2626; color: #dc2626; }
.ane-toggle.off { background: #0f766e; color: #fff; }
.ane-toggle.off:hover:not(:disabled) { background: #0e6b63; }
.ane-toggle:disabled { opacity: .55; cursor: not-allowed; }

.ane-where { font-size: 11px; font-weight: 500; color: #64748b; background: #f1f5f9; border-radius: 4px; padding: 2px 7px; letter-spacing: .02em; }

.ane-meta { margin-top: 16px; font-size: 13px; color: #64748b; }

.ane-note { margin-top: 26px; padding: 14px 16px; background: #f8fafc; border-left: 3px solid #94a3b8; font-size: 13.5px; color: #475569; line-height: 1.6; max-width: 64ch; }
`;
