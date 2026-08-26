import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchCases, fetchWorklist, deleteCase } from "./surgerySlice";
import styles from "./Surgery.module.css";
import { API_BASE } from "../../config";
import { PROCEDURE_GROUPS } from "./surgeryConstants";

// ─── Режимы просмотра ──────────────────────────────────────────────────────
//
// Журнал операций — это регистр, а не витрина. Три режима отвечают на три
// разных вопроса, и по умолчанию открывается тот, с которого начинается день:
//   agenda  — «кого я оперирую сегодня и дальше» (лента по дням, вперёд);
//   journal — «найти запись» (плотная таблица назад по времени);
//   gallery — «до/после» (прежняя сетка карточек, нужна для портфолио).
const VIEWS = ["agenda", "journal", "gallery"];
const VIEW_KEY = "dp.surgery.view";
const PRIVACY_KEY = "dp.surgery.privacy";

const STATUS_FILTERS = [
  { value: "", labelKey: "list.filterAll" },
  { value: "planned", labelKey: "list.filterPlanned" },
  { value: "completed", labelKey: "list.filterCompleted" },
  { value: "follow_up", labelKey: "list.filterFollowUp" },
  { value: "closed", labelKey: "list.filterClosed" },
];

// Порядок как в рабочем дне: сначала то, что горит сегодня, потом долги.
const WORK_BUCKETS = [
  { key: "today", tone: "now" },
  { key: "week", tone: "soon" },
  { key: "needs_protocol", tone: "debt" },
  { key: "followup_due", tone: "alarm" },
  { key: "stale_planned", tone: "alarm" },
  { key: "no_date", tone: "muted" },
];

// Тон подсказки «что сделать дальше»: красное — просрочено, жёлтое — долг,
// синее — обычный следующий шаг. Цвет несёт срочность, а не декорацию.
const ACTION_TONE = {
  followUpDue: "alarm",
  confirmDone: "alarm",
  writeProtocol: "debt",
  setDate: "soon",
  prepare: "soon",
  scheduleFollowUp: "soon",
  rateOutcome: "muted",
};

const PER_PAGE_OPTIONS = [6, 12, 24, 36, 48];

const photoUrl = (filename) => `${API_BASE}/uploads/surgery/${filename}`;

const readStore = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const writeStore = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* приватный режим браузера — настройка просто не запомнится */
  }
};

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
    worklist,
    total,
    pages: totalPages,
    loading,
  } = useSelector((s) => s.surgery);

  const [view, setView] = useState(() => {
    const saved = readStore(VIEW_KEY, "agenda");
    return VIEWS.includes(saved) ? saved : "agenda";
  });
  // Приватность по умолчанию включена: журнал открывают в ординаторской и на
  // общем мониторе, а лицо пациента — те же персональные данные, что и имя.
  // Один клик снимает размытие, и выбор запоминается.
  const [privacy, setPrivacy] = useState(
    () => readStore(PRIVACY_KEY, "on") !== "off",
  );

  const [bucket, setBucket] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProcedure, setFilterProcedure] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [menuId, setMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const dateLocale = useMemo(() => {
    const map = { ru: "ru-RU", en: "en-US", tr: "tr-TR", az: "az-AZ", ar: "ar" };
    return map[i18n.language] || "en-US";
  }, [i18n.language]);

  // В расписании смотрят вперёд от сегодняшнего дня; как только врач сам
  // выбрал корзину, статус или начал искать — ограничение снимается, иначе
  // найденная прошлогодняя операция не покажется в результатах поиска.
  const effectiveBucket = useMemo(() => {
    if (bucket) return bucket;
    if (view === "agenda" && !q && !filterStatus) return "upcoming";
    return "";
  }, [bucket, view, q, filterStatus]);

  const sort = view === "agenda" ? "date_asc" : "date_desc";

  // ─── Сброс страницы при смене фильтров ───
  // Без этого: на стр.5 переключил фильтр → результатов 1 страница → пустой экран
  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterProcedure, effectiveBucket, q, perPage, view]);

  // ─── Поиск с задержкой ───
  // Запрос уходит не на каждую букву: имена пациентов ищутся по blind index,
  // и каждый промежуточный запрос — это лишний проход по двум коллекциям.
  useEffect(() => {
    const id = setTimeout(() => setQ(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const loadCases = useCallback(() => {
    dispatch(
      fetchCases({
        status: filterStatus,
        procedure: filterProcedure,
        bucket: effectiveBucket,
        q,
        sort,
        page,
        limit: perPage,
      }),
    );
  }, [
    dispatch,
    filterStatus,
    filterProcedure,
    effectiveBucket,
    q,
    sort,
    page,
    perPage,
  ]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    dispatch(fetchWorklist());
  }, [dispatch]);

  // Меню действий закрывается по клику где угодно — включая клик по строке.
  useEffect(() => {
    if (!menuId) return undefined;
    const close = () => setMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuId]);

  const chooseView = (next) => {
    setView(next);
    writeStore(VIEW_KEY, next);
  };

  const togglePrivacy = () => {
    setPrivacy((prev) => {
      writeStore(PRIVACY_KEY, prev ? "off" : "on");
      return !prev;
    });
  };

  // Корзина и статус отвечают на разные вопросы и вместе почти всегда дают
  // пустой список («нет протокола» + «запланирована» = ноль). Выбор одного
  // сбрасывает другой — это честнее, чем показывать пустой экран.
  const chooseBucket = (key) => {
    setBucket((prev) => (prev === key ? "" : key));
    setFilterStatus("");
  };
  const chooseStatus = (value) => {
    setFilterStatus(value);
    setBucket("");
  };

  const resetAll = () => {
    setBucket("");
    setFilterStatus("");
    setFilterProcedure("");
    setSearchInput("");
    setQ("");
  };

  const hasFilters = Boolean(bucket || filterStatus || filterProcedure || q);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setMenuId(null);
    if (!window.confirm(t("list.confirmDelete"))) return;

    // Запоминаем длину ДО удаления
    const wasLastOnPage = cases.length === 1 && page > 1;

    setDeletingId(id);
    await dispatch(deleteCase(id));
    setDeletingId(null);
    dispatch(fetchWorklist());

    if (wasLastOnPage) {
      setPage(page - 1); // useEffect сам перезагрузит
    } else {
      // Перезагрузим текущую страницу — чтобы подтянулся кейс с другой страницы
      loadCases();
    }
  };

  // ─── Формат дат ───
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString(dateLocale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const formatDayTitle = (d) =>
    new Date(d).toLocaleDateString(dateLocale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  const formatTime = (d) => {
    const date = new Date(d);
    // Время 00:00 почти всегда означает «время не указали», а не полночь.
    if (date.getHours() === 0 && date.getMinutes() === 0) return "";
    return date.toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const relativeLabel = (days) => {
    if (days === null || days === undefined) return t("list.noDate");
    if (days === 0) return t("list.today");
    if (days === 1) return t("list.tomorrow");
    if (days === -1) return t("list.yesterday");
    if (days > 1) return t("list.inDays", { count: days });
    return t("list.daysAgo", { count: Math.abs(days) });
  };

  // ─── Пациент ───
  // Имя пациента — первое, что должно быть в строке журнала: врач ищет запись
  // по человеку, а не по названию операции.
  const patientName = (c) => {
    if (c.patient) {
      const name = [c.patient.lastName, c.patient.firstName]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (name) return name;
    }
    if (c.patientIdHash) return c.patientIdHash;
    return t("list.noPatient");
  };

  const patientSub = (c) => {
    if (c.patient?.patientId) return c.patient.patientId;
    if (c.patient?.externalId) return c.patient.externalId;
    if (c.patientType === "anonymous") return t("list.anonymous");
    return "";
  };

  const openCase = (id) => navigate(`/dp/surgery/${id}`);

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

  // ─── Группировка расписания по дням ───
  const agendaGroups = useMemo(() => {
    const groups = [];
    const index = new Map();
    cases.forEach((c) => {
      const key = c.operationDate
        ? new Date(c.operationDate).toDateString()
        : "nodate";
      if (!index.has(key)) {
        index.set(key, groups.length);
        groups.push({ key, date: c.operationDate || null, items: [] });
      }
      groups[index.get(key)].items.push(c);
    });
    return groups;
  }, [cases]);

  // ─── Мелкие блоки ───
  const StatusBadge = ({ status }) => (
    <span className={`${styles.statusBadge} ${styles["status_" + status]}`}>
      {t(`statuses.${status}`, status)}
    </span>
  );

  const NextAction = ({ flags }) => {
    if (!flags?.nextAction) return null;
    const tone = ACTION_TONE[flags.nextAction] || "soon";
    const overdue = flags.followUpOverdueDays;
    return (
      <span className={`${styles.nextAction} ${styles["tone_" + tone]}`}>
        {t(`actions.${flags.nextAction}`)}
        {flags.nextAction === "followUpDue" && overdue > 0 && (
          <> · {t("list.overdueDays", { count: overdue })}</>
        )}
      </span>
    );
  };

  const Readiness = ({ flags, status }) => {
    if (status !== "planned" || !flags) return null;
    if (flags.ready === flags.readyOf) return null;
    return (
      <span
        className={styles.readiness}
        title={flags.missing.map((m) => t(`missing.${m}`)).join(", ")}
      >
        {t("list.readiness", { done: flags.ready, total: flags.readyOf })}
      </span>
    );
  };

  const RowMenu = ({ c }) => (
    <div className={styles.menuWrap} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={styles.menuBtn}
        aria-label={t("list.moreActions")}
        aria-haspopup="menu"
        aria-expanded={menuId === c._id}
        onClick={(e) => {
          e.stopPropagation();
          setMenuId(menuId === c._id ? null : c._id);
        }}
      >
        ⋯
      </button>
      {menuId === c._id && (
        <div className={styles.menu} role="menu">
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => openCase(c._id)}
          >
            {t("list.open")}
          </button>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => navigate(`/dp/surgery/${c._id}?tab=plan`)}
          >
            {t("list.openProtocol")}
          </button>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => navigate(`/dp/surgery/${c._id}?tab=photos`)}
          >
            {t("list.openPhotos")}
          </button>
          <div className={styles.menuSep} />
          <button
            type="button"
            className={`${styles.menuItem} ${styles.menuItemDanger}`}
            disabled={deletingId === c._id}
            onClick={(e) => handleDelete(c._id, e)}
          >
            {deletingId === c._id ? "…" : t("list.delete")}
          </button>
        </div>
      )}
    </div>
  );

  const Avatar = ({ c }) => {
    const src = c.patient?.photo;
    const initials = patientName(c).slice(0, 1).toUpperCase();
    if (!src) return <div className={styles.avatarStub}>{initials}</div>;
    return (
      <img
        src={src}
        alt=""
        className={`${styles.avatar} ${privacy ? styles.blurred : ""}`}
      />
    );
  };

  // ─── Строка расписания ───
  const AgendaRow = ({ c }) => (
    <div
      className={styles.agendaRow}
      role="button"
      tabIndex={0}
      onClick={() => openCase(c._id)}
      onKeyDown={(e) => e.key === "Enter" && openCase(c._id)}
    >
      <div className={styles.agendaTime}>
        {formatTime(c.operationDate) || (
          <span className={styles.timeStub}>{t("list.timeNotSet")}</span>
        )}
      </div>
      <Avatar c={c} />
      <div className={styles.agendaMain}>
        <div className={styles.agendaTop}>
          <span className={styles.patientName}>{patientName(c)}</span>
          {patientSub(c) && (
            <span className={styles.patientSub}>{patientSub(c)}</span>
          )}
        </div>
        <div className={styles.agendaSub}>
          <span className={styles.procedure}>
            {t(`procedures.${c.procedure}`, c.procedure)}
          </span>
          {c.hasComplication && (
            <span className={styles.complicationFlag}>
              {t("list.complication")}
            </span>
          )}
        </div>
      </div>
      <div className={styles.agendaSide}>
        <Readiness flags={c.flags} status={c.status} />
        <NextAction flags={c.flags} />
        <StatusBadge status={c.status} />
      </div>
      <RowMenu c={c} />
    </div>
  );

  // ─── Строка журнала ───
  const JournalRow = ({ c }) => (
    <tr
      className={styles.tRow}
      onClick={() => openCase(c._id)}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && openCase(c._id)}
    >
      <td className={styles.tPatient}>
        <div className={styles.tPatientCell}>
          <Avatar c={c} />
          <div>
            <div className={styles.patientName}>{patientName(c)}</div>
            {patientSub(c) && (
              <div className={styles.patientSub}>{patientSub(c)}</div>
            )}
          </div>
        </div>
      </td>
      <td>
        <div className={styles.procedure}>
          {t(`procedures.${c.procedure}`, c.procedure)}
        </div>
        {c.interventionCode?.code && (
          <div className={styles.codeCell}>
            {c.interventionCode.system} {c.interventionCode.code}
          </div>
        )}
      </td>
      <td>
        <div>{formatDate(c.operationDate)}</div>
        <div className={styles.relCell}>
          {relativeLabel(c.flags?.daysUntil)}
        </div>
      </td>
      <td>
        <StatusBadge status={c.status} />
      </td>
      <td>
        <Readiness flags={c.flags} status={c.status} />
        <NextAction flags={c.flags} />
      </td>
      <td className={styles.tResult}>
        {c.outcomeScore ? (
          <span className={styles.scoreVal}>{c.outcomeScore}/10</span>
        ) : (
          <span className={styles.photoCount}>{t("list.noScore")}</span>
        )}
        {c.hasComplication && (
          <div className={styles.complicationFlag}>{t("list.complication")}</div>
        )}
      </td>
      <td className={styles.tActions}>
        <RowMenu c={c} />
      </td>
    </tr>
  );

  // ─── Карточка витрины ───
  const GalleryCard = ({ c }) => {
    const beforePhoto = c.photos?.find((p) => p.label === "before");
    const afterPhoto = c.photos?.find((p) => p.label === "after");
    const slot = (photo, labelKey) => (
      <div className={styles.photoSlot}>
        {photo ? (
          <img
            src={photoUrl(photo.filename)}
            alt={t(labelKey)}
            className={`${styles.photoThumb} ${privacy ? styles.blurred : ""}`}
          />
        ) : (
          <div className={styles.photoEmpty}>
            <div className={styles.photoEmptyIcon} />
            <span className={styles.photoEmptyLbl}>{t(labelKey)}</span>
          </div>
        )}
      </div>
    );

    return (
      <div className={styles.caseCard} onClick={() => openCase(c._id)}>
        <div className={styles.cardHead}>
          <Avatar c={c} />
          <div className={styles.cardHeadText}>
            <div className={styles.patientName}>{patientName(c)}</div>
            <div className={styles.patientSub}>
              {formatDate(c.operationDate)}
              {patientSub(c) ? ` · ${patientSub(c)}` : ""}
            </div>
          </div>
          <RowMenu c={c} />
        </div>

        <div className={styles.cardPhotos}>
          {slot(beforePhoto, "photoLabels.before")}
          <div className={styles.photoArrow}>→</div>
          {slot(afterPhoto, "photoLabels.after")}
        </div>

        <div className={styles.cardBody}>
          <div className={styles.cardTop}>
            <span className={styles.procedure}>
              {t(`procedures.${c.procedure}`, c.procedure)}
            </span>
            <StatusBadge status={c.status} />
          </div>

          <div className={styles.cardMeta}>
            <span>{relativeLabel(c.flags?.daysUntil)}</span>
            {c.photos?.length > 0 && (
              <>
                <span className={styles.metaDot} />
                <span>{t("tab.photosCount", { count: c.photos.length })}</span>
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
              <span className={styles.photoCount}>{t("list.noScore")}</span>
            )}
            <NextAction flags={c.flags} />
          </div>
        </div>
      </div>
    );
  };

  // ─── Разметка ───
  const buckets = worklist?.buckets || {};
  const debtTotal = WORK_BUCKETS.reduce(
    (sum, b) => sum + (buckets[b.key] || 0),
    0,
  );

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
                  {t("list.pagePosition", { current: page, total: totalPages })}
                </>
              )}
            </p>
          )}
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={togglePrivacy}
            title={t("list.privacyHint")}
          >
            {privacy ? t("list.privacyOn") : t("list.privacyOff")}
          </button>
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
      </div>

      {/* ── Рабочий список ──
          Раньше здесь стояла плашка «Всего кейсов: 3» — цифра, которая уже
          написана в подзаголовке и ничего не требует от врача. Теперь это
          шесть кликабельных долгов: каждый открывает свой срез журнала. */}
      {worklist && (
        <div className={styles.workRow}>
          {debtTotal === 0 ? (
            <div className={styles.workClean}>{t("work.clean")}</div>
          ) : (
            WORK_BUCKETS.filter((b) => buckets[b.key] > 0).map((b) => (
              <button
                key={b.key}
                type="button"
                className={`${styles.workChip} ${styles["tone_" + b.tone]} ${
                  bucket === b.key ? styles.workChipActive : ""
                }`}
                onClick={() => chooseBucket(b.key)}
                aria-pressed={bucket === b.key}
              >
                <span className={styles.workNum}>{buckets[b.key]}</span>
                <span className={styles.workLbl}>{t(`work.${b.key}`)}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* ── Панель управления ── */}
      <div className={styles.toolbar}>
        <div className={styles.viewSwitch}>
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              className={`${styles.viewBtn} ${view === v ? styles.viewBtnActive : ""}`}
              onClick={() => chooseView(v)}
              aria-pressed={view === v}
            >
              {t(`list.view_${v}`)}
            </button>
          ))}
        </div>

        <div className={styles.searchWrap}>
          <input
            type="search"
            className={styles.search}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("list.searchPlaceholder")}
            aria-label={t("list.searchPlaceholder")}
          />
        </div>
      </div>

      <div className={styles.filters}>
        {STATUS_FILTERS.map(({ value, labelKey }) => (
          <button
            key={value}
            className={`${styles.chip} ${filterStatus === value && !bucket ? styles.chipActive : ""}`}
            onClick={() => chooseStatus(value)}
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

        <select
          className={styles.select}
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          aria-label={t("list.perPage")}
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {t("list.perPageOption", { count: n })}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            className={styles.btnGhost}
            onClick={resetAll}
          >
            {t("list.clearFilters")}
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.emptyBox}>
          <p className={styles.empty}>{t("page.loading")}</p>
        </div>
      ) : cases.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyTitle}>
            {hasFilters ? t("list.nothingFound") : t("list.noCases")}
          </p>
          <p className={styles.emptyText}>
            {hasFilters ? t("list.nothingFoundHint") : t("list.noCasesHint")}
          </p>
          {hasFilters ? (
            <button className={styles.btnSecondary} onClick={resetAll}>
              {t("list.clearFilters")}
            </button>
          ) : (
            <button
              className={styles.btnPrimary}
              onClick={() => navigate("/dp/surgery/new")}
            >
              {t("list.createFirst")}
            </button>
          )}
        </div>
      ) : (
        <>
          {view === "agenda" && (
            <div className={styles.agenda}>
              {agendaGroups.map((g) => (
                <div key={g.key} className={styles.agendaGroup}>
                  <div className={styles.agendaDay}>
                    {g.date ? (
                      <>
                        <span className={styles.agendaDayName}>
                          {formatDayTitle(g.date)}
                        </span>
                        <span className={styles.agendaDayRel}>
                          {relativeLabel(g.items[0]?.flags?.daysUntil)}
                        </span>
                      </>
                    ) : (
                      <span className={styles.agendaDayName}>
                        {t("list.groupNoDate")}
                      </span>
                    )}
                    <span className={styles.agendaDayCount}>
                      {g.items.length}
                    </span>
                  </div>
                  {g.items.map((c) => (
                    <AgendaRow key={c._id} c={c} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {view === "journal" && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("list.colPatient")}</th>
                    <th>{t("list.colProcedure")}</th>
                    <th>{t("list.colDate")}</th>
                    <th>{t("list.colStatus")}</th>
                    <th>{t("list.colNext")}</th>
                    <th>{t("list.colResult")}</th>
                    <th aria-label={t("list.moreActions")} />
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <JournalRow key={c._id} c={c} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "gallery" && (
            <div className={styles.caseGrid}>
              {cases.map((c) => (
                <GalleryCard key={c._id} c={c} />
              ))}
            </div>
          )}

          {/* ── ПАГИНАЦИЯ ── */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                aria-label={t("list.prevPage")}
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
                aria-label={t("list.nextPage")}
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
