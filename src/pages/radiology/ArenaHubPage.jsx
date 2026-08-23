// client/src/pages/radiology/ArenaHubPage.jsx
//
// «Тренажёр диагностики» — хаб учащегося. Маршрут: /arena
//
// КАТАЛОГ РАБОТАЕТ НА ЛЮБОМ ЧИСЛЕ КЕЙСОВ. Это не украшение, а исправление
// поломки: раньше страница забирала списки целиком и фильтровала их у себя.
// Сервер при этом отдавал первые 50 кейсов снимков (и 200 по другим станциям),
// никак не сообщая, что список обрезан. На семистах кейсах врач видел 50 и
// подпись «Всего кейсов: 50» — то есть интерфейс уверенно врал. Хуже: поиск
// искал по этим же 50, поэтому кейс за их пределами было невозможно найти в
// принципе, и это выглядело как «такого кейса нет».
//
// Теперь фильтрация, поиск и постраничность — на сервере, а страница показывает
// total (сколько всего подходит под фильтр) отдельно от того, сколько загружено.
//
// Почему нет вкладки «Все»: станции лежат в разных коллекциях, и честной
// объединённой постраничности по ним не бывает — либо грузить всё (то, от чего
// уходим), либо показывать «первые N каждой», что снова обман. Вкладка станции
// обязательна, а счётчики на вкладках дают ту же общую картину.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  fetchCatalogPage,
  fetchGameProfile,
  fetchLeaderboard,
  fetchDailyCase,
  fetchWeeklyCase,
  fetchReviewDue,
} from "../../api/radiology";
import { readApiError, isAuthError } from "../../api/education";
import {
  STATIONS,
  STATION_BY_KEY,
  caseHref,
  MODALITIES,
  modalityLabel,
} from "./arenaLabels";
import "../education/education.css";
import "./radiology.css";

const PAGE = 24;
// Пауза перед запросом при наборе. Меньше — и запрос уходит на каждую букву;
// больше — и поиск ощущается залипшим.
const SEARCH_DEBOUNCE_MS = 350;

export default function ArenaHubPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("arena");
  // Арабский — письмо справа налево. Раздел открывается вне клиникового
  // макета, который выставляет направление сам.
  const dir = i18n.language?.startsWith("ar") ? "rtl" : "ltr";

  const [profile, setProfile] = useState(null);
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [reviewDue, setReviewDue] = useState([]);
  const [board, setBoard] = useState([]);
  const [error, setError] = useState(null);

  // Каталог.
  const [station, setStation] = useState("radiology");
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [modality, setModality] = useState("");
  const [page, setPage] = useState({ items: [], total: 0, hasMore: false });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [counts, setCounts] = useState({});

  // Ответы приходят не в том порядке, в каком уходили запросы: при быстром
  // наборе ответ на «пне» может обогнать ответ на «пневмо». Считаем актуальным
  // только последний отправленный — иначе в каталоге оказывается результат
  // предыдущего запроса, и выглядит это как «поиск не работает».
  const requestSeq = useRef(0);

  /* ─── Окружение хаба: профиль, кейс дня, лидерборд ─────────────────── */
  useEffect(() => {
    (async () => {
      const [prof, day, week, rev, lb] = await Promise.all([
        fetchGameProfile().catch(() => null),
        fetchDailyCase().catch(() => null),
        fetchWeeklyCase().catch(() => null),
        fetchReviewDue().catch(() => []),
        fetchLeaderboard({ limit: 10 }).catch(() => []),
      ]);
      setProfile(prof);
      setDaily(day);
      setWeekly(week);
      setReviewDue(rev);
      setBoard(lb);
    })();
  }, []);

  /* ─── Счётчики на вкладках ─────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      // limit=1: нужен только total. Тянуть ради счётчика целую страницу
      // кейсов — то же расточительство, от которого уходим.
      const pairs = await Promise.all(
        STATIONS.map((s) =>
          fetchCatalogPage(s.key, { limit: 1 })
            .then((r) => [s.key, r.total])
            .catch(() => [s.key, null]),
        ),
      );
      setCounts(Object.fromEntries(pairs));
    })();
  }, []);

  /* ─── Поиск: пауза перед запросом ──────────────────────────────────── */
  useEffect(() => {
    const id = setTimeout(() => setQApplied(q), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [q]);

  /* ─── Первая страница при любой смене условий ──────────────────────── */
  useEffect(() => {
    const seq = ++requestSeq.current;
    setCatalogLoading(true);
    fetchCatalogPage(station, { q: qApplied, difficulty, modality, skip: 0, limit: PAGE })
      .then((res) => {
        if (seq !== requestSeq.current) return; // ответ устарел
        setPage(res);
        setError(null);
      })
      .catch((err) => {
        if (seq !== requestSeq.current) return;
        if (isAuthError(err)) return navigate("/login");
        setError(readApiError(err, t("catalogFailed")));
        setPage({ items: [], total: 0, hasMore: false });
      })
      .finally(() => {
        if (seq === requestSeq.current) setCatalogLoading(false);
      });
  }, [station, qApplied, difficulty, modality, navigate]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !page.hasMore) return;
    const seq = requestSeq.current;
    setLoadingMore(true);
    try {
      const res = await fetchCatalogPage(station, {
        q: qApplied,
        difficulty,
        modality,
        skip: page.items.length,
        limit: PAGE,
      });
      // Условия могли смениться, пока грузилась страница: дописывать её к
      // другому списку нельзя.
      if (seq !== requestSeq.current) return;
      setPage((prev) => ({
        items: [...prev.items, ...res.items],
        total: res.total,
        hasMore: res.hasMore,
      }));
    } catch (err) {
      setError(readApiError(err, t("loadMoreFailed")));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page.hasMore, page.items.length, station, qApplied, difficulty, modality]);

  const filtersActive = Boolean(qApplied.trim() || difficulty || modality);
  const activeStation = STATION_BY_KEY[station];
  const modalityOptions = useMemo(() => MODALITIES, []);

  function resetFilters() {
    setQ("");
    setQApplied("");
    setDifficulty("");
    setModality("");
  }

  return (
    <div className="rad-page" dir={dir}>
      <div className="arena-back">
        <Link className="edu-back-link" to="/doctor/home-page">
          ← {t("backToCabinet")}
        </Link>
      </div>

      <div className="arena-head">
        <div className="arena-head-main">
          <p className="edu-eyebrow">{t("eyebrow")}</p>
          <h1 className="edu-title" style={{ marginBottom: 4 }}>
            {t("title")}
          </h1>
          <p className="edu-subtitle" style={{ maxWidth: "68ch" }}>
            {t("subtitle")}
          </p>
        </div>
        <Link className="edu-btn edu-btn--ghost" to="/arena/duels">
          ⚔️ {t("duels")}
        </Link>
      </div>

      {error && <div className="edu-error">{error}</div>}

      {profile && <ArenaHero profile={profile} />}

      {(weekly || daily || reviewDue.length > 0) && (
        <div className="arena-today">
          {reviewDue.length > 0 && (
            <div className="arena-today-card arena-today-card--review">
              <div className="arena-eyebrow">🔁 {t("reviewDue")}</div>
              <strong className="arena-today-title">
                {t("reviewDueCount", { count: reviewDue.length })}
              </strong>
              <p className="arena-today-note">{t("reviewDueNote")}</p>
              <div className="arena-today-list">
                {reviewDue.slice(0, 3).map((r) => (
                  <Link key={r._id} className="arena-today-link" to={`/arena/cases/${r.caseId}`}>
                    {r.caseTitle}
                    <span className="arena-today-score">
                      {Math.round((r.lastScore || 0) * 100)}%
                    </span>
                  </Link>
                ))}
                {reviewDue.length > 3 && (
                  <span className="arena-today-note">
                    {t("andMore", { count: reviewDue.length - 3 })}
                  </span>
                )}
              </div>
            </div>
          )}

          {weekly && <TodayCase item={weekly} kind="week" />}
          {daily && <TodayCase item={daily} kind="day" />}
        </div>
      )}

      <div className="arena-cols">
        <div>
          <div className="arena-toolbar">
            <div className="arena-tabs" role="tablist" aria-label={t("stations")}>
              {STATIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={station === s.key}
                  className={`arena-tab ${station === s.key ? "arena-tab--on" : ""}`}
                  onClick={() => setStation(s.key)}
                  title={t(s.whatKey)}
                >
                  <span aria-hidden="true">{s.icon}</span> {t(s.titleKey)}
                  {counts[s.key] != null && (
                    <span className="arena-tab-count">{counts[s.key]}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="arena-filters">
              <input
                className="edu-search-input"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                maxLength={200}
              />
              {station === "radiology" && (
                <select
                  className="edu-filter-select"
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  aria-label={t("allModalities")}
                >
                  <option value="">{t("allModalities")}</option>
                  {modalityOptions.map((m) => (
                    <option key={m} value={m}>
                      {modalityLabel(t, m)}
                    </option>
                  ))}
                </select>
              )}
              <select
                className="edu-filter-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                aria-label={t("anyDifficulty")}
              >
                <option value="">{t("anyDifficulty")}</option>
                <option value="easy">{t("easy")}</option>
                <option value="medium">{t("medium")}</option>
                <option value="hard">{t("hard")}</option>
              </select>
              {filtersActive && (
                <button type="button" className="edu-btn edu-btn--ghost" onClick={resetFilters}>
                  {t("reset")}
                </button>
              )}
            </div>

            <p className="arena-station-what">{t(activeStation?.whatKey ?? "")}</p>
          </div>

          {catalogLoading ? (
            <div className="edu-state">{t("loading")}</div>
          ) : page.items.length === 0 ? (
            <div className="edu-state">
              {filtersActive ? t("nothingMatches") : t("noCasesOnStation")}
            </div>
          ) : (
            <>
              <p className="arena-count">
                {filtersActive
                  ? t("found", { total: page.total })
                  : t("casesOnStation", { total: page.total })}
                {page.items.length < page.total &&
                  ` · ${t("shown", { shown: page.items.length })}`}
              </p>

              <div className="rad-grid">
                {page.items.map((c) => (
                  <Link
                    key={c._id}
                    className="rad-card"
                    to={caseHref({ ...c, station })}
                  >
                    {station === "radiology" && (
                      <div
                        className="rad-card-thumb"
                        style={
                          c.images?.[0]?.url
                            ? { backgroundImage: `url(${c.images[0].url})` }
                            : undefined
                        }
                      />
                    )}
                    <div className="rad-card-body">
                      <div style={{ marginBottom: 8 }}>
                        <span className="rad-tag">
                          {activeStation?.icon} {t(activeStation?.titleKey ?? "")}
                        </span>
                        {station === "radiology" && c.modality && (
                          <span className="rad-tag">{modalityLabel(t, c.modality)}</span>
                        )}
                        <span className="rad-tag">{t(c.difficulty, c.difficulty)}</span>
                      </div>
                      <strong>{c.title}</strong>
                      {c.stats?.attempts > 0 && (
                        <div className="arena-card-stats">
                          {t("attempts", { count: c.stats.attempts })}
                          {c.stats.avgScore != null &&
                            ` · ${t("avgScore", { score: Math.round(c.stats.avgScore * 100) })}`}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {page.hasMore && (
                <div className="arena-more">
                  <button
                    type="button"
                    className="edu-btn edu-btn--ghost"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? t("loadingMore") : t("showMore")}
                  </button>
                  <span className="edu-hint">
                    {t("shownOf", { shown: page.items.length, total: page.total })}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="rad-panel arena-board">
          <div className="edu-card-title" style={{ fontSize: 16 }}>
            {t("leaderboard")}
          </div>
          {board.length === 0 ? (
            <div className="edu-hint">{t("leaderboardEmpty")}</div>
          ) : (
            board.map((p) => (
              <div key={p.place} className="arena-board-row">
                <span className="arena-place">{p.place}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {p.name}{" "}
                  <small style={{ color: "#8b9aab" }}>
                    · {p.rankKey ? t(`ranks.${p.rankKey}`, { defaultValue: p.rank }) : p.rank}
                  </small>
                </span>
                <strong>{p.xp} XP</strong>
              </div>
            ))
          )}

          {profile && profile.achievements?.length > 0 && (
            <>
              <div className="edu-card-title" style={{ fontSize: 15, marginTop: 18 }}>
                {t("achievements", {
                  have: profile.achievements.length,
                  total: profile.achievementsTotal,
                })}
              </div>
              <div className="arena-badges">
                {profile.achievements.map((a) => (
                  <span key={a.key} className="arena-badge" title={a.title}>
                    {a.icon} {a.title}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Кейс дня/недели — одинаковая карточка, разная подпись. */
function TodayCase({ item, kind }) {
  const { t } = useTranslation("arena");
  const isWeek = kind === "week";
  return (
    <div className={`arena-today-card ${isWeek ? "arena-today-card--week" : ""}`}>
      <div className="arena-eyebrow">
        {isWeek ? `⭐ ${t("caseOfWeek")}` : t("caseOfDay")}
      </div>
      <div
        className="arena-today-thumb"
        style={item.thumb ? { backgroundImage: `url(${item.thumb})` } : undefined}
      />
      <strong className="arena-today-title">{item.title}</strong>
      <div style={{ marginTop: 6, marginBottom: 10 }}>
        <span className="rad-tag">{modalityLabel(t, item.modality)}</span>
        <span className="rad-tag">{t(item.difficulty, item.difficulty)}</span>
      </div>
      <Link className="edu-btn" to={`/arena/cases/${item._id}`}>
        {t("play")}
      </Link>
    </div>
  );
}

function ArenaHero({ profile }) {
  const { t } = useTranslation("arena");
  const r = profile.rank;
  const toNext = r.nextAt != null ? Math.max(0, r.nextAt - profile.xp) : 0;
  return (
    <div className="arena-hero">
      <div className="arena-hero-main">
        <div className="arena-rank">
          {r.key ? t(`ranks.${r.key}`, { defaultValue: r.title }) : r.title}
        </div>
        <div className="arena-xp">{profile.xp} XP</div>
        <div className="arena-bar">
          <div
            className="arena-bar-fill"
            style={{ width: `${Math.round((r.progress || 0) * 100)}%` }}
          />
        </div>
        <div className="arena-eyebrow" style={{ marginTop: 6 }}>
          {r.nextTitle
            ? t("rankNext", {
                rank: r.nextKey
                  ? t(`ranks.${r.nextKey}`, { defaultValue: r.nextTitle })
                  : r.nextTitle,
                xp: toNext,
              })
            : t("rankMax")}
        </div>
      </div>
      <div className="arena-hero-stats">
        <div className="arena-stat">
          <div className="arena-stat-num">🔥 {profile.streak}</div>
          <div className="arena-stat-cap">{t("streak")}</div>
        </div>
        <div className="arena-stat">
          <div className="arena-stat-num">{profile.casesCompleted}</div>
          <div className="arena-stat-cap">{t("casesDone")}</div>
        </div>
        <div className="arena-stat">
          <div className="arena-stat-num">{Math.round((profile.bestScore || 0) * 100)}%</div>
          <div className="arena-stat-cap">{t("bestScore")}</div>
        </div>
      </div>
    </div>
  );
}
