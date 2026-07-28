// client/src/pages/diagnostics/DiagnosticsCasesPage.jsx
//
// Список дел + заведение нового. Маршрут: /diagnostics
//
// Одна колонка и минимум полей на входе. Прошлая версия просила пять полей и
// показывала рядом две панели с объяснениями, чего модуль умеет и как устроен.
// Это читается один раз, а мешает каждый день: длинная форма на входе означает,
// что врач заполняет её вместо работы, а половина полей остаётся пустой.
//
// Возраст и пол убраны с первого экрана НЕ потому, что они неважны — наоборот,
// они меняют трактовку почти любого показателя. Просто их естественное место —
// в описании случая, рядом с жалобами, а не в форме создания.
//
// Метка пациента вместо ФИО осталась: поле подписано так, чтобы это было
// понятно без документации. Лучший способ не потерять персональные данные —
// не собирать их.

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { fetchCases, createCase } from "../../api/diagnostics";
import { readApiError, isAuthError } from "../../api/education";
import "../education/education.css";
import "./diagnostics.css";

const STATUS_LABELS = {
  draft: "Черновик",
  analyzing: "Идёт разбор",
  ready: "Разбор готов",
  closed: "Закрыто",
};

const SEX_LABELS = { male: "мужчина", female: "женщина", other: "другое", unknown: "" };

export function CaseStatus({ status }) {
  return (
    <span className={`dg-status dg-status--${status}`}>
      {status === "analyzing" && <span className="dg-spinner" aria-hidden="true" />}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DiagnosticsCasesPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState({ items: [], total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPage(await fetchCases(filter ? { status: filter } : {}));
      setError(null);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось загрузить дела"));
    } finally {
      setLoading(false);
    }
  }, [filter, navigate]);

  async function loadMore() {
    if (loadingMore || !page.hasMore) return;
    setLoadingMore(true);
    try {
      const next = await fetchCases({
        ...(filter ? { status: filter } : {}),
        skip: page.items.length,
      });
      setPage((prev) => ({
        items: [...prev.items, ...next.items],
        total: next.total,
        hasMore: next.hasMore,
      }));
    } catch (err) {
      setError(readApiError(err, "Не удалось догрузить дела"));
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createCase({
        title: title.trim() || "Без названия",
        patient: { kind: "anonymous", label: label.trim() },
      });
      navigate(`/diagnostics/cases/${created._id}`);
    } catch (err) {
      setError(readApiError(err, "Не удалось создать дело"));
      setCreating(false);
    }
  }

  return (
    <div className="dg-page dg-page--narrow">
      <div className="arena-back">
        <Link className="edu-back-link" to="/doctor/home-page">
          ← В кабинет
        </Link>
      </div>

      <header className="dg-head">
        <div className="dg-head-main">
          <h1 className="dg-title">Второе мнение</h1>
          <p className="dg-subtitle">
            Разбор заключений, анализов и клинических случаев: что перепроверить, чего не
            хватает в данных, что нельзя пропустить. Итог по делу пишет и подписывает врач.
          </p>
        </div>
      </header>

      {error && <div className="dg-err">{error}</div>}

      {/* ─── Новое дело: два поля ──────────────────────────────────── */}
      <section className="dg-sec">
        <form className="dg-newcase" onSubmit={submit}>
          <input
            className="edu-input dg-grow"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Новое дело: например, КТ ОГК, очаговое образование"
            maxLength={300}
          />
          <input
            className="edu-input"
            style={{ width: 200 }}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Метка — не ФИО"
            maxLength={200}
            title="«Пациент К.» или номер карты. Имя не нужно: разбор от него не зависит."
          />
          <button className="edu-btn" type="submit" disabled={creating}>
            {creating ? "Создаём…" : "Завести"}
          </button>
        </form>
        <p className="dg-muted">
          Материалы, вопрос и клинические данные добавите внутри. Имя пациента не нужно нигде:
          разбор от него не зависит.
        </p>
      </section>

      {/* ─── Дела ──────────────────────────────────────────────────── */}
      <section className="dg-sec">
        <h2 className="dg-sec-title">
          Мои дела
          <select
            className="edu-filter-select dg-inline-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Фильтр по статусу"
          >
            <option value="">Все</option>
            <option value="draft">Черновики</option>
            <option value="analyzing">Идёт разбор</option>
            <option value="ready">Разбор готов</option>
            <option value="closed">Закрытые</option>
          </select>
        </h2>

        {loading ? (
          <p className="dg-empty">Загружаем…</p>
        ) : page.items.length === 0 ? (
          <p className="dg-empty">
            {filter ? "Таких дел нет." : "Дел пока нет — заведите первое."}
          </p>
        ) : (
          <div className="dg-cases">
            {page.items.map((c) => (
              <Link key={c._id} className="dg-case-row" to={`/diagnostics/cases/${c._id}`}>
                <div className="dg-case-main">
                  <p className="dg-case-title">{c.title || "Без названия"}</p>
                  <div className="dg-case-meta">
                    {c.patient?.label && <span>{c.patient.label}</span>}
                    {c.patient?.ageYears ? <span>{c.patient.ageYears} лет</span> : null}
                    {SEX_LABELS[c.patient?.sex] && <span>{SEX_LABELS[c.patient.sex]}</span>}
                    <span>{formatDate(c.updatedAt)}</span>
                  </div>
                </div>
                <CaseStatus status={c.status} />
              </Link>
            ))}
          </div>
        )}

        {page.items.length > 0 && (
          <div className="dg-actions">
            {page.hasMore ? (
              <>
                <button
                  type="button"
                  className="dg-link-btn"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Загружаем…" : "Показать ещё"}
                </button>
                <span className="dg-muted">
                  показано {page.items.length} из {page.total}
                </span>
              </>
            ) : (
              <span className="dg-muted">
                {page.total === page.items.length
                  ? `Всего дел: ${page.total}`
                  : `Показано ${page.items.length} из ${page.total}`}
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
