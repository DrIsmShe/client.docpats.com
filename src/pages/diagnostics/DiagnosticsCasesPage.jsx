// client/src/pages/diagnostics/DiagnosticsCasesPage.jsx
//
// Список дел + заведение нового. Маршрут: /diagnostics
//
// Одна колонка и минимум полей на входе: длинная форма на входе означает, что
// врач заполняет её вместо работы, а половина полей остаётся пустой. Возраст и
// пол не выброшены, а переехали в описание случая, где им место рядом с
// жалобами.
//
// Метка пациента вместо ФИО: лучший способ не потерять персональные данные —
// не собирать их.
//
// УДАЛЕНИЕ НАСТОЯЩЕЕ, а не «скрыть из списка». Врач убирает дело, потому что
// оно больше не нужно; оставлять данные пациента в базе «на всякий случай» —
// не нейтральное решение. Поэтому подтверждение обязательно и говорит прямо,
// что отменить нельзя. След об удалении остаётся в HIPAA-журнале.
//
// Про язык: тексты живут в public/locales/<lang>/diagnostics.json. Арабский —
// письмо справа налево, поэтому направление выставляется на самой странице:
// раздел открывается вне клиникового макета, который это делает сам.

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { fetchCases, createCase, deleteCase } from "../../api/diagnostics";
import { readApiError, isAuthError } from "../../api/education";
import "../education/education.css";
import "./diagnostics.css";

/** Ключ подписи статуса — сами подписи в словаре. */
const STATUS_KEY = {
  draft: "statusDraft",
  analyzing: "statusAnalyzing",
  ready: "statusReady",
  closed: "statusClosed",
};

const SEX_KEY = { male: "sexMale", female: "sexFemale", other: "sexOther" };

/** Направление письма для активного языка. Арабский — справа налево. */
export function useDir() {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith("ar") ? "rtl" : "ltr";
}

export function CaseStatus({ status }) {
  const { t } = useTranslation("diagnostics");
  return (
    <span className={`dg-status dg-status--${status}`}>
      {status === "analyzing" && <span className="dg-spinner" aria-hidden="true" />}
      {STATUS_KEY[status] ? t(STATUS_KEY[status]) : status}
    </span>
  );
}

export function formatDate(value, locale = "ru-RU") {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DiagnosticsCasesPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("diagnostics");
  const dir = useDir();

  const [page, setPage] = useState({ items: [], total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);

  // Дело, которое врач собирается удалить. null — окна нет.
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPage(await fetchCases(filter ? { status: filter } : {}));
      setError(null);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, t("loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [filter, navigate, t]);

  useEffect(() => {
    load();
  }, [load]);

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
      setError(readApiError(err, t("loadMoreFailed")));
    } finally {
      setLoadingMore(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createCase({
        title: title.trim() || t("untitled"),
        patient: { kind: "anonymous", label: label.trim() },
      });
      navigate(`/diagnostics/cases/${created._id}`);
    } catch (err) {
      setError(readApiError(err, t("createFailed")));
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCase(pendingDelete._id);
      // Убираем из списка на месте, не перезагружая страницу: перезагрузка
      // сбросила бы догруженные страницы и врач потерял бы место в списке.
      setPage((prev) => ({
        items: prev.items.filter((i) => i._id !== pendingDelete._id),
        total: Math.max(0, prev.total - 1),
        hasMore: prev.hasMore,
      }));
      setPendingDelete(null);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, t("deleteFailed")));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="dg-page dg-page--narrow" dir={dir}>
      <div className="arena-back">
        <Link className="edu-back-link" to="/doctor/home-page">
          ← {t("backToCabinet")}
        </Link>
      </div>

      <header className="dg-head">
        <div className="dg-head-main">
          <h1 className="dg-title">{t("title")}</h1>
          <p className="dg-subtitle">{t("subtitle")}</p>
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
            placeholder={t("newCasePlaceholder")}
            maxLength={300}
          />
          <input
            className="edu-input"
            style={{ width: 200 }}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("labelPlaceholder")}
            maxLength={200}
            title={t("labelHint")}
          />
          <button className="edu-btn" type="submit" disabled={creating}>
            {creating ? t("creating") : t("create")}
          </button>
        </form>
        <p className="dg-muted">{t("newCaseNote")}</p>
      </section>

      {/* ─── Дела ──────────────────────────────────────────────────── */}
      <section className="dg-sec">
        <h2 className="dg-sec-title">
          {t("myCases")}
          <select
            className="edu-filter-select dg-inline-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label={t("myCases")}
          >
            <option value="">{t("filterAll")}</option>
            <option value="draft">{t("statusDraft")}</option>
            <option value="analyzing">{t("statusAnalyzing")}</option>
            <option value="ready">{t("statusReady")}</option>
            <option value="closed">{t("statusClosed")}</option>
          </select>
        </h2>

        {loading ? (
          <p className="dg-empty">{t("loading")}</p>
        ) : page.items.length === 0 ? (
          <p className="dg-empty">{filter ? t("noCasesFiltered") : t("noCases")}</p>
        ) : (
          <div className="dg-cases">
            {page.items.map((c) => (
              <div className="dg-case-row" key={c._id}>
                <Link className="dg-case-main dg-case-link" to={`/diagnostics/cases/${c._id}`}>
                  <p className="dg-case-title">{c.title || t("untitled")}</p>
                  <div className="dg-case-meta">
                    {c.patient?.label && <span>{c.patient.label}</span>}
                    {c.patient?.ageYears ? (
                      <span>{t("years", { count: c.patient.ageYears })}</span>
                    ) : null}
                    {SEX_KEY[c.patient?.sex] && <span>{t(SEX_KEY[c.patient.sex])}</span>}
                    <span>{formatDate(c.updatedAt, i18n.language)}</span>
                  </div>
                </Link>
                <div className="dg-case-side">
                  <CaseStatus status={c.status} />
                  <button
                    type="button"
                    className="dg-icon-btn"
                    aria-label={t("deleteCase")}
                    title={t("deleteCase")}
                    onClick={() => setPendingDelete(c)}
                  >
                    ×
                  </button>
                </div>
              </div>
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
                  {loadingMore ? t("loading") : t("showMore")}
                </button>
                <span className="dg-muted">
                  {t("shownOf", { shown: page.items.length, total: page.total })}
                </span>
              </>
            ) : (
              <span className="dg-muted">
                {page.total === page.items.length
                  ? t("totalCases", { total: page.total })
                  : t("shownOf", { shown: page.items.length, total: page.total })}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Подтверждение удаления. Отдельным окном, потому что действие
          необратимо, а промах по крестику рядом со статусом — вопрос
          нескольких пикселей. */}
      {pendingDelete && (
        <div className="dg-modal" role="dialog" aria-modal="true" dir={dir}>
          <div className="dg-confirm">
            <p className="dg-confirm-lead">
              <strong>{t("deleteTitle")}</strong>
            </p>
            <p className="dg-confirm-lead">
              {t("deleteBody", { title: pendingDelete.title || t("untitled") })}
            </p>
            <div className="dg-actions">
              <button
                type="button"
                className="edu-btn edu-btn--danger"
                disabled={deleting}
                onClick={confirmDelete}
              >
                {deleting ? t("deleting") : t("deleteConfirm")}
              </button>
              <button
                type="button"
                className="dg-link-btn"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
