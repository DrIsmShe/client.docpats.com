import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchCases, fetchStats, deleteCase } from "./surgerySlice";
import styles from "./Surgery.module.css";
import { API_BASE } from "../../config";
import { PROCEDURE_GROUPS } from "./surgeryConstants";

const STATUS_FILTERS = [
  { value: "", labelKey: "list.filterAll" },
  { value: "planned", labelKey: "list.filterPlanned" },
  { value: "completed", labelKey: "list.filterCompleted" },
  { value: "follow_up", labelKey: "list.filterFollowUp" },
  { value: "closed", labelKey: "list.filterClosed" },
];

const PER_PAGE_OPTIONS = [6, 12, 24, 36, 48];

const photoUrl = (filename) => `${API_BASE}/uploads/surgery/${filename}`;

function ScoreBars({ score }) {
  return (
    <div className={styles.scoreRow2}>
      <div className={styles.scoreBars}>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`${styles.scoreBar} ${i < score ? styles.scoreBarFilled : ""}`}
          />
        ))}
      </div>
      <span className={styles.scoreVal}>{score}/10</span>
    </div>
  );
}

export default function SurgeryPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("Surgery");
  const {
    cases,
    stats,
    total,
    pages: totalPages,
    loading,
  } = useSelector((s) => s.surgery);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterProcedure, setFilterProcedure] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // ─── Пагинация ───
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  const dateLocale = useMemo(() => {
    const map = {
      ru: "ru-RU",
      en: "en-US",
      tr: "tr-TR",
      az: "az-AZ",
      ar: "ar",
    };
    return map[i18n.language] || "en-US";
  }, [i18n.language]);

  // ─── Сброс страницы при смене фильтров — критично ───
  // Без этого: на стр.5 переключил фильтр → результатов 1 страница → пустой экран
  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterProcedure, perPage]);

  // ─── Загрузка кейсов ───
  useEffect(() => {
    dispatch(
      fetchCases({
        status: filterStatus,
        procedure: filterProcedure,
        page,
        limit: perPage,
      }),
    );
  }, [dispatch, filterStatus, filterProcedure, page, perPage]);

  // ─── Загрузка статов — только при смене фильтров, не при смене страницы ───
  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t("list.confirmDelete"))) return;

    // Запоминаем длину ДО удаления
    const wasLastOnPage = cases.length === 1 && page > 1;

    setDeletingId(id);
    await dispatch(deleteCase(id));
    setDeletingId(null);

    if (wasLastOnPage) {
      setPage(page - 1); // useEffect сам перезагрузит
    } else {
      // Перезагрузим текущую страницу — чтобы подтянулся новый кейс с другой страницы
      dispatch(
        fetchCases({
          status: filterStatus,
          procedure: filterProcedure,
          page,
          limit: perPage,
        }),
      );
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString(dateLocale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  // ─── Умная пагинация с эллипсисом (1 … 4 5 6 … 20) ───
  const buildPageItems = () => {
    const arr = [];
    const maxButtons = 7;
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) arr.push(i);
      return arr;
    }
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    arr.push(1);
    if (left > 2) arr.push("…");
    for (let i = left; i <= right; i++) arr.push(i);
    if (right < totalPages - 1) arr.push("…");
    arr.push(totalPages);
    return arr;
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>{t("list.breadcrumb")}</div>
          <h1 className={styles.title}>{t("list.title")}</h1>
          {total > 0 && (
            <p className={styles.subtitle}>
              {t("tab.casesCount", { count: total })}
              {totalPages > 1 && (
                <>
                  {" · "}
                  {t("list.pagePosition", {
                    page,
                    total: totalPages,
                    defaultValue: `səhifə ${page} / ${totalPages}`,
                  })}
                </>
              )}
            </p>
          )}
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => navigate("/dp/surgery/new")}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M6.5 1v11M1 6.5h11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {t("list.newCase")}
        </button>
      </div>

      {stats && stats.total > 0 && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{stats.total}</span>
            <span className={styles.statLbl}>{t("list.totalCases")}</span>
            {stats.byProcedure?.length > 0 && (
              <span className={styles.statSub}>
                {t("list.proceduresTypes", { count: stats.byProcedure.length })}
              </span>
            )}
          </div>
          {stats.byProcedure?.slice(0, 3).map((s) => (
            <div key={s._id} className={styles.statCard}>
              <span className={styles.statNum}>{s.count}</span>
              <span className={styles.statLbl}>
                {t(`procedures.${s._id}`, s._id)}
              </span>
              {s.avgScore && (
                <span className={styles.statSub}>
                  {t("list.averageScore", { score: s.avgScore.toFixed(1) })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={styles.filters}>
        {STATUS_FILTERS.map(({ value, labelKey }) => (
          <button
            key={value}
            className={`${styles.chip} ${filterStatus === value ? styles.chipActive : ""}`}
            onClick={() => setFilterStatus(value)}
          >
            {t(labelKey)}
          </button>
        ))}
        <select
          className={styles.select}
          style={{ marginInlineStart: "auto" }}
          value={filterProcedure}
          onChange={(e) => setFilterProcedure(e.target.value)}
        >
          <option value="">{t("list.allProcedures")}</option>
          {PROCEDURE_GROUPS.map(({ groupKey, items }) => (
            <optgroup key={groupKey} label={t(`procedureGroups.${groupKey}`)}>
              {items.map((key) => (
                <option key={key} value={key}>
                  {t(`procedures.${key}`)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* perPage selector */}
        <select
          className={styles.select}
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          aria-label={t("list.perPage", { defaultValue: "Səhifədə" })}
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {t("list.perPageOption", {
                count: n,
                defaultValue: `${n} / səh.`,
              })}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.emptyBox}>
          <p className={styles.empty}>{t("page.loading")}</p>
        </div>
      ) : cases.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyTitle}>{t("list.noCases")}</p>
          <p className={styles.emptyText}>{t("list.noCasesHint")}</p>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/dp/surgery/new")}
          >
            {t("list.createFirst")}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.caseGrid}>
            {cases.map((c) => {
              const beforePhoto = c.photos?.find((p) => p.label === "before");
              const afterPhoto = c.photos?.find((p) => p.label === "after");

              return (
                <div
                  key={c._id}
                  className={styles.caseCard}
                  onClick={() => navigate(`/dp/surgery/${c._id}`)}
                >
                  <div className={styles.cardPhotos}>
                    <div className={styles.photoSlot}>
                      {beforePhoto ? (
                        <img
                          src={photoUrl(beforePhoto.filename)}
                          alt={t("photoLabels.before")}
                          className={styles.photoThumb}
                        />
                      ) : (
                        <div className={styles.photoEmpty}>
                          <div className={styles.photoEmptyIcon} />
                          <span className={styles.photoEmptyLbl}>
                            {t("photoLabels.before")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.photoArrow}>→</div>
                    <div className={styles.photoSlot}>
                      {afterPhoto ? (
                        <img
                          src={photoUrl(afterPhoto.filename)}
                          alt={t("photoLabels.after")}
                          className={styles.photoThumb}
                        />
                      ) : (
                        <div className={styles.photoEmpty}>
                          <div className={styles.photoEmptyIcon} />
                          <span className={styles.photoEmptyLbl}>
                            {t("photoLabels.after")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardTop}>
                      <span className={styles.procedure}>
                        {t(`procedures.${c.procedure}`, c.procedure)}
                      </span>
                      <span
                        className={`${styles.statusBadge} ${styles["status_" + c.status]}`}
                      >
                        {t(`statuses.${c.status}`, c.status)}
                      </span>
                    </div>

                    <div className={styles.cardMeta}>
                      <span>{formatDate(c.operationDate)}</span>
                      {c.photos?.length > 0 && (
                        <>
                          <span className={styles.metaDot} />
                          <span>
                            {t("tab.photosCount", { count: c.photos.length })}
                          </span>
                        </>
                      )}
                      {c.isPublic && (
                        <>
                          <span className={styles.metaDot} />
                          <span className={styles.publicBadge}>
                            {t("list.portfolioBadge")}
                          </span>
                        </>
                      )}
                    </div>

                    <div className={styles.cardFooter}>
                      {c.outcomeScore ? (
                        <ScoreBars score={c.outcomeScore} />
                      ) : (
                        <span className={styles.photoCount}>
                          {t("list.noScore")}
                        </span>
                      )}
                      <button
                        className={styles.btnDelete}
                        onClick={(e) => handleDelete(c._id, e)}
                        disabled={deletingId === c._id}
                      >
                        {deletingId === c._id ? "..." : t("list.delete")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Карточка "+" — показываем только на последней странице,
                чтобы не дублировать на каждой */}
            {page === totalPages && (
              <div
                className={styles.addCard}
                onClick={() => navigate("/dp/surgery/new")}
              >
                <span className={styles.addCardIcon}>+</span>
                <span className={styles.addCardLbl}>{t("list.newCase")}</span>
              </div>
            )}
          </div>

          {/* ── ПАГИНАЦИЯ ── */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                aria-label={t("list.prevPage", { defaultValue: "Əvvəlki" })}
              >
                ←
              </button>

              {buildPageItems().map((p, idx) =>
                p === "…" ? (
                  <span key={`e-${idx}`} className={styles.pageEllipsis}>
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
                    onClick={() => goToPage(p)}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                className={styles.pageBtn}
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                aria-label={t("list.nextPage", { defaultValue: "Sonrakı" })}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
