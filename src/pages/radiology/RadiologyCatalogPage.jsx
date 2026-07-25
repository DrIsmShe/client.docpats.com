// client/src/pages/radiology/RadiologyCatalogPage.jsx
//
// Хаб «Диагностическая арена» (учащийся). Маршрут: /radiology
// Единая точка входа в игру: профиль/ранг, «кейс дня», лидерборд и каталог
// кейсов. Пока станция одна — снимки; УЗИ/ЭКГ/анализы добавятся как новые
// плагины reading-system, а хаб останется тем же.

import { useEffect, useState } from "react";
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
import "../education/education.css";
import "./radiology.css";

export const MODALITY_LABELS = {
  cxr: "Рентген ОГК",
  ct: "КТ",
  mri: "МРТ",
  us: "УЗИ",
  ecg: "ЭКГ",
  mammography: "Маммография",
  other: "Другое",
};

const DIFFICULTY_LABELS = { easy: "Лёгкий", medium: "Средний", hard: "Сложный" };

export default function RadiologyCatalogPage() {
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
        setError(readApiError(err, "Не удалось загрузить арену"));
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  return (
    <div className="rad-page">
      <h1 className="edu-title" style={{ marginBottom: 4 }}>🎯 Диагностическая арена</h1>
      <p className="edu-subtitle">
        Тренируйте чтение исследований как в жизни: находите патологию, называйте,
        осматривайте по протоколу и ставьте диагноз. За точность — очки и ранг.
      </p>
      <div className="edu-btn-row" style={{ marginBottom: 4 }}>
        <Link className="edu-btn edu-btn--ghost" to="/radiology/duels">⚔️ Дуэли 1×1</Link>
      </div>

      {error && <div className="edu-error">{error}</div>}

      {/* Профиль игрока */}
      {profile && <ArenaHero profile={profile} />}

      {/* Достижения */}
      {profile && profile.achievements?.length > 0 && (
        <div className="rad-panel">
          <div className="edu-card-title" style={{ fontSize: 15 }}>
            Достижения ({profile.achievements.length} из {profile.achievementsTotal})
          </div>
          <div className="arena-badges">
            {profile.achievements.map((a) => (
              <span key={a.key} className="arena-badge" title={a.title}>{a.icon} {a.title}</span>
            ))}
          </div>
        </div>
      )}

      {/* Кейс недели */}
      {weekly && (
        <div className="rad-panel arena-daily" style={{ borderColor: "#d8c48c", background: "#fbf6e9" }}>
          <div
            className="arena-daily-thumb"
            style={weekly.thumb ? { backgroundImage: `url(${weekly.thumb})` } : undefined}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="arena-eyebrow" style={{ color: "#a2802f" }}>⭐ Кейс недели</div>
            <strong style={{ fontSize: 17 }}>{weekly.title}</strong>
            <div style={{ marginTop: 6 }}>
              <span className="rad-tag">{MODALITY_LABELS[weekly.modality] ?? weekly.modality}</span>
              <span className="rad-tag">{DIFFICULTY_LABELS[weekly.difficulty] ?? weekly.difficulty}</span>
            </div>
          </div>
          <Link className="edu-btn" to={`/radiology/cases/${weekly._id}`}>Играть →</Link>
        </div>
      )}

      {/* Кейс дня */}
      {daily && (
        <div className="rad-panel arena-daily">
          <div
            className="arena-daily-thumb"
            style={daily.thumb ? { backgroundImage: `url(${daily.thumb})` } : undefined}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="arena-eyebrow">Кейс дня</div>
            <strong style={{ fontSize: 17 }}>{daily.title}</strong>
            <div style={{ marginTop: 6 }}>
              <span className="rad-tag">{MODALITY_LABELS[daily.modality] ?? daily.modality}</span>
              <span className="rad-tag">{DIFFICULTY_LABELS[daily.difficulty] ?? daily.difficulty}</span>
            </div>
          </div>
          <Link className="edu-btn" to={`/radiology/cases/${daily._id}`}>Играть →</Link>
        </div>
      )}

      {/* Работа над ошибками */}
      {reviewDue.length > 0 && (
        <div className="rad-panel" style={{ marginTop: 12, borderColor: "#dc2626", background: "#fff5f5" }}>
          <div className="edu-card-title" style={{ fontSize: 15 }}>🔁 Работа над ошибками ({reviewDue.length})</div>
          <div className="edu-hint" style={{ marginBottom: 8 }}>Эти кейсы пора повторить — вы их не сдали или пропустили находки. Сдадите чисто — интервал вырастет, освоите — уйдут.</div>
          {reviewDue.map((r) => (
            <div key={r._id} className="an-row">
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{r.caseTitle}</strong>{" "}
                <small style={{ color: "#8b9aab" }}>· {MODALITY_LABELS[r.modality] ?? r.modality} · прошлый балл {Math.round((r.lastScore || 0) * 100)}%</small>
              </span>
              <Link className="edu-btn edu-btn--ghost" to={`/radiology/cases/${r.caseId}`}>Повторить</Link>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="edu-state">Загрузка…</div>
      ) : (
        <div className="arena-cols">
          {/* Каталог кейсов */}
          <div>
            <div className="edu-card-title" style={{ fontSize: 16, marginBottom: 10 }}>Кейсы</div>
            {cases.length === 0 ? (
              <div className="edu-state">Опубликованных кейсов пока нет. Их добавляют в админ-панели.</div>
            ) : (
              <div className="rad-grid">
                {cases.map((c) => (
                  <Link key={c._id} className="rad-card" to={`/radiology/cases/${c._id}`}>
                    <div
                      className="rad-card-thumb"
                      style={c.images?.[0]?.url ? { backgroundImage: `url(${c.images[0].url})` } : undefined}
                    />
                    <div className="rad-card-body">
                      <div style={{ marginBottom: 8 }}>
                        <span className="rad-tag">{MODALITY_LABELS[c.modality] ?? c.modality}</span>
                        <span className="rad-tag">{DIFFICULTY_LABELS[c.difficulty] ?? c.difficulty}</span>
                      </div>
                      <strong>{c.title}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Станция: Анализы */}
            {labCases.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div className="edu-card-title" style={{ fontSize: 16, marginBottom: 10 }}>🧪 Станция: Анализы</div>
                <div className="rad-grid">
                  {labCases.map((c) => (
                    <Link key={c._id} className="rad-card" to={`/radiology/labs/cases/${c._id}`}>
                      <div className="rad-card-body">
                        <div style={{ marginBottom: 8 }}>
                          <span className="rad-tag">Анализы</span>
                          <span className="rad-tag">{DIFFICULTY_LABELS[c.difficulty] ?? c.difficulty}</span>
                        </div>
                        <strong>{c.title}</strong>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Виртуальный пациент */}
            {vpCases.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div className="edu-card-title" style={{ fontSize: 16, marginBottom: 10 }}>🩺 Виртуальный пациент</div>
                <div className="rad-grid">
                  {vpCases.map((c) => (
                    <Link key={c._id} className="rad-card" to={`/radiology/vp/cases/${c._id}`}>
                      <div className="rad-card-body">
                        <div style={{ marginBottom: 8 }}>
                          <span className="rad-tag">Клинический разбор</span>
                          <span className="rad-tag">{DIFFICULTY_LABELS[c.difficulty] ?? c.difficulty}</span>
                        </div>
                        <strong>{c.title}</strong>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Лидерборд */}
          <div className="rad-panel arena-board">
            <div className="edu-card-title" style={{ fontSize: 16 }}>Лидерборд</div>
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
          </div>
        </div>
      )}
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
          <div className="arena-bar-fill" style={{ width: `${Math.round((r.progress || 0) * 100)}%` }} />
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
