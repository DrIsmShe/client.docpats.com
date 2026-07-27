// client/src/pages/radiology/ArenaHubPage.jsx
//
// «Тренажёр диагностики» — хаб учащегося. Маршрут: /arena
// (Раньше страница называлась «Диагностическая арена» и жила на /radiology.
// И название, и путь были неверны: внутри не только радиология, но и анализы,
// и виртуальный пациент, а станций будет больше.)
//
// ГЛАВНОЕ РЕШЕНИЕ ЭТОЙ СТРАНИЦЫ — каталог не растёт вниз.
//
// Раньше кейсы выводились тремя списками подряд: все снимки, потом все
// анализы, потом все виртуальные пациенты. Пока кейсов десяток, это работает;
// на сотне страница превращается в бесконечную простыню, где невозможно найти
// ни нужное, ни новое. Причём ломается это не в тот день, когда кейсов стало
// много, а постепенно и незаметно.
//
// Поэтому здесь один каталог с фильтрами: станция, поиск по названию,
// модальность, сложность — и подгрузка порциями. Тогда число кейсов перестаёт
// влиять на удобство страницы: и на десяти, и на тысяче видно ровно то, что
// врач искал.
//
// Фильтрация клиентская сознательно: сервер отдаёт списки целиком (до 200 на
// станцию), и на этом объёме фильтровать запросами — значит ждать сеть на
// каждое нажатие клавиши. Когда упрёмся в лимит, фильтры уедут в запрос;
// форма состояния (station/query/modality/difficulty) специально совпадает с
// параметрами API, чтобы этот переход был механическим.

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchCases,
  fetchLabCases,
  fetchVpCases,
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
  DIFFICULTY_ORDER,
} from "./arenaLabels";
import "../education/education.css";
import "./radiology.css";

// Сколько кейсов показываем сразу и сколько добавляем по кнопке.
const PAGE = 12;

export default function ArenaHubPage() {
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [labCases, setLabCases] = useState([]);
  const [vpCases, setVpCases] = useState([]);
  const [profile, setProfile] = useState(null);
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [reviewDue, setReviewDue] = useState([]);
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Фильтры каталога.
  const [station, setStation] = useState("all");
  const [query, setQuery] = useState("");
  const [modality, setModality] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    (async () => {
      try {
        // Профиль/лидерборд/кейс дня не должны блокировать каталог, если
        // геймификация ещё не прогрелась — грузим устойчиво к частичным сбоям.
        const [list, labs, vp, prof, day, week, rev, lb] = await Promise.all([
          fetchCases(),
          fetchLabCases().catch(() => []),
          fetchVpCases().catch(() => []),
          fetchGameProfile().catch(() => null),
          fetchDailyCase().catch(() => null),
          fetchWeeklyCase().catch(() => null),
          fetchReviewDue().catch(() => []),
          fetchLeaderboard({ limit: 10 }).catch(() => []),
        ]);
        setCases(list);
        setLabCases(labs);
        setVpCases(vp);
        setProfile(prof);
        setDaily(day);
        setWeekly(week);
        setReviewDue(rev);
        setBoard(lb);
      } catch (err) {
        if (isAuthError(err)) return navigate("/login");
        setError(readApiError(err, "Не удалось загрузить тренажёр"));
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // Один каталог из трёх станций: у станций разные модели, но для поиска и
  // фильтрации важны одни и те же поля.
  const items = useMemo(
    () => [
      ...cases.map((c) => ({ ...c, station: "radiology" })),
      ...labCases.map((c) => ({ ...c, station: "labs" })),
      ...vpCases.map((c) => ({ ...c, station: "vp" })),
    ],
    [cases, labCases, vpCases],
  );

  const counts = useMemo(() => {
    const acc = { all: items.length };
    for (const s of STATIONS) acc[s.key] = items.filter((i) => i.station === s.key).length;
    return acc;
  }, [items]);

  // Модальности только те, что реально есть в кейсах: пустой пункт в фильтре
  // выглядит как сломанный фильтр.
  const availableModalities = useMemo(() => {
    const set = new Set(
      items.filter((i) => i.station === "radiology" && i.modality).map((i) => i.modality),
    );
    return [...set];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => (station === "all" ? true : i.station === station))
      .filter((i) => (difficulty ? i.difficulty === difficulty : true))
      .filter((i) => (modality ? i.modality === modality : true))
      .filter((i) => (q ? String(i.title ?? "").toLowerCase().includes(q) : true))
      .sort((a, b) => {
        // Сначала по сложности, внутри — новые выше: сложность важнее для
        // выбора «чем заняться», дата — для «что появилось».
        const d = (DIFFICULTY_ORDER[a.difficulty] ?? 9) - (DIFFICULTY_ORDER[b.difficulty] ?? 9);
        if (d !== 0) return d;
        return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
      });
  }, [items, station, difficulty, modality, query]);

  // Любая смена фильтра возвращает к первой порции: иначе после сужения
  // выборки «показать ещё» осталось бы нажатым от прошлого запроса.
  useEffect(() => {
    setVisible(PAGE);
  }, [station, query, modality, difficulty]);

  const shown = filtered.slice(0, visible);
  const filtersActive = Boolean(query.trim() || modality || difficulty || station !== "all");

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

      {/* Что делать сегодня — три повода зайти, компактной строкой. */}
      {(weekly || daily || reviewDue.length > 0) && (
        <div className="arena-today">
          {reviewDue.length > 0 && (
            <div className="arena-today-card arena-today-card--review">
              <div className="arena-eyebrow">🔁 Работа над ошибками</div>
              <strong className="arena-today-title">
                {reviewDue.length}{" "}
                {reviewDue.length === 1 ? "кейс ждёт" : "кейса ждут"} повтора
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
          {/* ─── Каталог с фильтрами ─────────────────────────────── */}
          <div className="arena-toolbar">
            <div className="arena-tabs" role="tablist" aria-label="Станции тренажёра">
              <button
                type="button"
                role="tab"
                aria-selected={station === "all"}
                className={`arena-tab ${station === "all" ? "arena-tab--on" : ""}`}
                onClick={() => setStation("all")}
              >
                Все
                <span className="arena-tab-count">{counts.all}</span>
              </button>
              {STATIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={station === s.key}
                  className={`arena-tab ${station === s.key ? "arena-tab--on" : ""}`}
                  onClick={() => setStation(s.key)}
                  disabled={counts[s.key] === 0}
                  title={s.what}
                >
                  <span aria-hidden="true">{s.icon}</span> {s.title}
                  <span className="arena-tab-count">{counts[s.key]}</span>
                </button>
              ))}
            </div>

            <div className="arena-filters">
              <input
                className="edu-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по названию"
                aria-label="Поиск кейса по названию"
              />
              {(station === "all" || station === "radiology") && availableModalities.length > 1 && (
                <select
                  className="edu-filter-select"
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  aria-label="Модальность"
                >
                  <option value="">Все модальности</option>
                  {availableModalities.map((m) => (
                    <option key={m} value={m}>
                      {MODALITY_LABELS[m] ?? m}
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
                <button
                  type="button"
                  className="edu-btn edu-btn--ghost"
                  onClick={() => {
                    setStation("all");
                    setQuery("");
                    setModality("");
                    setDifficulty("");
                  }}
                >
                  Сбросить
                </button>
              )}
            </div>

            {station !== "all" && (
              <p className="arena-station-what">{STATION_BY_KEY[station]?.what}</p>
            )}
          </div>

          {loading ? (
            <div className="edu-state">Загрузка…</div>
          ) : filtered.length === 0 ? (
            <div className="edu-state">
              {items.length === 0
                ? "Опубликованных кейсов пока нет. Их добавляют в админ-панели."
                : "Под эти условия ничего не подошло. Снимите часть фильтров."}
            </div>
          ) : (
            <>
              <p className="arena-count">
                {filtersActive
                  ? `Найдено: ${filtered.length} из ${items.length}`
                  : `Всего кейсов: ${items.length}`}
              </p>

              <div className="rad-grid">
                {shown.map((c) => (
                  <Link key={`${c.station}-${c._id}`} className="rad-card" to={caseHref(c)}>
                    {c.station === "radiology" && (
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
                          {STATION_BY_KEY[c.station]?.icon} {STATION_BY_KEY[c.station]?.title}
                        </span>
                        {c.station === "radiology" && c.modality && (
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

              {filtered.length > visible && (
                <div className="arena-more">
                  <button
                    type="button"
                    className="edu-btn edu-btn--ghost"
                    onClick={() => setVisible((v) => v + PAGE)}
                  >
                    Показать ещё {Math.min(PAGE, filtered.length - visible)}
                  </button>
                  <span className="edu-hint">
                    показано {shown.length} из {filtered.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─── Правая колонка ───────────────────────────────────── */}
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
