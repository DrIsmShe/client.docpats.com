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
  MODALITY_LABELS,
  DIFFICULTY_LABELS,
} from "./arenaLabels";
import "../education/education.css";
import "./radiology.css";

const PAGE = 24;
// Пауза перед запросом при наборе. Меньше — и запрос уходит на каждую букву;
// больше — и поиск ощущается залипшим.
const SEARCH_DEBOUNCE_MS = 350;

export default function ArenaHubPage() {
  const navigate = useNavigate();

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
        setError(readApiError(err, "Не удалось загрузить каталог"));
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
      setError(readApiError(err, "Не удалось догрузить кейсы"));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page.hasMore, page.items.length, station, qApplied, difficulty, modality]);

  const filtersActive = Boolean(qApplied.trim() || difficulty || modality);
  const activeStation = STATION_BY_KEY[station];
  const modalityOptions = useMemo(() => Object.keys(MODALITY_LABELS), []);

  function resetFilters() {
    setQ("");
    setQApplied("");
    setDifficulty("");
    setModality("");
  }

  return (
    <div className="rad-page">
      <div className="arena-back">
        <Link className="edu-back-link" to="/doctor/home-page">
          ← В кабинет
        </Link>
      </div>

      <div className="arena-head">
        <div className="arena-head-main">
          <p className="edu-eyebrow">Тренировка · без реальных пациентов</p>
          <h1 className="edu-title" style={{ marginBottom: 4 }}>
            Тренажёр диагностики
          </h1>
          <p className="edu-subtitle" style={{ maxWidth: "68ch" }}>
            Учебные случаи как в жизни: найти патологию на снимке, разобрать анализы, довести
            виртуального пациента до диагноза. За точность — очки и ранг.
          </p>
        </div>
        <Link className="edu-btn edu-btn--ghost" to="/arena/duels">
          ⚔️ Дуэли 1×1
        </Link>
      </div>

      {error && <div className="edu-error">{error}</div>}

      {profile && <ArenaHero profile={profile} />}

      {(weekly || daily || reviewDue.length > 0) && (
        <div className="arena-today">
          {reviewDue.length > 0 && (
            <div className="arena-today-card arena-today-card--review">
              <div className="arena-eyebrow">🔁 Работа над ошибками</div>
              <strong className="arena-today-title">
                {reviewDue.length} {reviewDue.length === 1 ? "кейс ждёт" : "кейса ждут"} повтора
              </strong>
              <p className="arena-today-note">
                Вы их не сдали или пропустили находки. Сдадите чисто — интервал вырастет.
              </p>
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
                  <span className="arena-today-note">и ещё {reviewDue.length - 3}</span>
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
            <div className="arena-tabs" role="tablist" aria-label="Станции тренажёра">
              {STATIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={station === s.key}
                  className={`arena-tab ${station === s.key ? "arena-tab--on" : ""}`}
                  onClick={() => setStation(s.key)}
                  title={s.what}
                >
                  <span aria-hidden="true">{s.icon}</span> {s.title}
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
                placeholder="Поиск по названию"
                aria-label="Поиск кейса по названию"
                maxLength={200}
              />
              {station === "radiology" && (
                <select
                  className="edu-filter-select"
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  aria-label="Модальность"
                >
                  <option value="">Все модальности</option>
                  {modalityOptions.map((m) => (
                    <option key={m} value={m}>
                      {MODALITY_LABELS[m]}
                    </option>
                  ))}
                </select>
              )}
              <select
                className="edu-filter-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                aria-label="Сложность"
              >
                <option value="">Любая сложность</option>
                <option value="easy">Лёгкий</option>
                <option value="medium">Средний</option>
                <option value="hard">Сложный</option>
              </select>
              {filtersActive && (
                <button type="button" className="edu-btn edu-btn--ghost" onClick={resetFilters}>
                  Сбросить
                </button>
              )}
            </div>

            <p className="arena-station-what">{activeStation?.what}</p>
          </div>

          {catalogLoading ? (
            <div className="edu-state">Загрузка…</div>
          ) : page.items.length === 0 ? (
            <div className="edu-state">
              {filtersActive
                ? "Под эти условия ничего не подошло. Снимите часть фильтров."
                : "На этой станции опубликованных кейсов пока нет."}
            </div>
          ) : (
            <>
              <p className="arena-count">
                {filtersActive
                  ? `Найдено: ${page.total}`
                  : `Кейсов на станции: ${page.total}`}
                {page.items.length < page.total && ` · показано ${page.items.length}`}
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
                          {activeStation?.icon} {activeStation?.title}
                        </span>
                        {station === "radiology" && c.modality && (
                          <span className="rad-tag">
                            {MODALITY_LABELS[c.modality] ?? c.modality}
                          </span>
                        )}
                        <span className="rad-tag">
                          {DIFFICULTY_LABELS[c.difficulty] ?? c.difficulty}
                        </span>
                      </div>
                      <strong>{c.title}</strong>
                      {c.stats?.attempts > 0 && (
                        <div className="arena-card-stats">
                          {c.stats.attempts}{" "}
                          {c.stats.attempts === 1 ? "прохождение" : "прохождений"}
                          {c.stats.avgScore != null &&
                            ` · средний балл ${Math.round(c.stats.avgScore * 100)}%`}
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
                    {loadingMore ? "Загружаем…" : "Показать ещё"}
                  </button>
                  <span className="edu-hint">
                    показано {page.items.length} из {page.total}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="rad-panel arena-board">
          <div className="edu-card-title" style={{ fontSize: 16 }}>
            Лидерборд
          </div>
          {board.length === 0 ? (
            <div className="edu-hint">Пока никто не набрал очков. Будьте первым!</div>
          ) : (
            board.map((p) => (
              <div key={p.place} className="arena-board-row">
                <span className="arena-place">{p.place}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {p.name} <small style={{ color: "#8b9aab" }}>· {p.rank}</small>
                </span>
                <strong>{p.xp} XP</strong>
              </div>
            ))
          )}

          {profile && profile.achievements?.length > 0 && (
            <>
              <div className="edu-card-title" style={{ fontSize: 15, marginTop: 18 }}>
                Достижения {profile.achievements.length} из {profile.achievementsTotal}
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
  const isWeek = kind === "week";
  return (
    <div className={`arena-today-card ${isWeek ? "arena-today-card--week" : ""}`}>
      <div className="arena-eyebrow">{isWeek ? "⭐ Кейс недели" : "Кейс дня"}</div>
      <div
        className="arena-today-thumb"
        style={item.thumb ? { backgroundImage: `url(${item.thumb})` } : undefined}
      />
      <strong className="arena-today-title">{item.title}</strong>
      <div style={{ marginTop: 6, marginBottom: 10 }}>
        <span className="rad-tag">{MODALITY_LABELS[item.modality] ?? item.modality}</span>
        <span className="rad-tag">{DIFFICULTY_LABELS[item.difficulty] ?? item.difficulty}</span>
      </div>
      <Link className="edu-btn" to={`/arena/cases/${item._id}`}>
        Пройти →
      </Link>
    </div>
  );
}

function ArenaHero({ profile }) {
  const r = profile.rank;
  const toNext = r.nextAt != null ? Math.max(0, r.nextAt - profile.xp) : 0;
  return (
    <div className="arena-hero">
      <div className="arena-hero-main">
        <div className="arena-rank">{r.title}</div>
        <div className="arena-xp">{profile.xp} XP</div>
        <div className="arena-bar">
          <div
            className="arena-bar-fill"
            style={{ width: `${Math.round((r.progress || 0) * 100)}%` }}
          />
        </div>
        <div className="arena-eyebrow" style={{ marginTop: 6 }}>
          {r.nextTitle ? `До ранга «${r.nextTitle}»: ${toNext} XP` : "Максимальный ранг достигнут"}
        </div>
      </div>
      <div className="arena-hero-stats">
        <div className="arena-stat">
          <div className="arena-stat-num">🔥 {profile.streak}</div>
          <div className="arena-stat-cap">дней подряд</div>
        </div>
        <div className="arena-stat">
          <div className="arena-stat-num">{profile.casesCompleted}</div>
          <div className="arena-stat-cap">кейсов пройдено</div>
        </div>
        <div className="arena-stat">
          <div className="arena-stat-num">{Math.round((profile.bestScore || 0) * 100)}%</div>
          <div className="arena-stat-cap">лучший балл</div>
        </div>
      </div>
    </div>
  );
}
