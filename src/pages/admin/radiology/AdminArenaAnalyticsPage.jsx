// client/src/pages/admin/radiology/AdminArenaAnalyticsPage.jsx
//
// Админка → Аналитика «Диагностической арены». Маршрут: /admin/arena-analytics
// Замыкает цикл контент→игроки→выводы: кто играет, какие кейсы трудные,
// какие находки чаще всего пропускают.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchArenaOverview,
  fetchArenaCasesReport,
  fetchMissedFindings,
} from "../../../api/radiology";
import { readApiError, isAuthError } from "../../../api/education";
import "../../education/education.css";
import "../../radiology/radiology.css";

const pct = (x) => Math.round((x ?? 0) * 100);

export default function AdminArenaAnalyticsPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [cases, setCases] = useState([]);
  const [missed, setMissed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [ov, cs, ms] = await Promise.all([
          fetchArenaOverview(),
          fetchArenaCasesReport(),
          fetchMissedFindings().catch(() => []),
        ]);
        setOverview(ov);
        setCases(cs);
        setMissed(ms);
      } catch (err) {
        if (isAuthError(err)) return navigate("/login");
        setError(readApiError(err, "Не удалось загрузить аналитику"));
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return <div className="rad-page"><div className="edu-state">Загрузка…</div></div>;

  const played = cases.filter((c) => c.attempts > 0);
  const hardest = [...played].sort((a, b) => a.avgScore - b.avgScore).slice(0, 10);
  const popular = [...played].sort((a, b) => b.attempts - a.attempts).slice(0, 8);

  return (
    <div className="rad-page" style={{ maxWidth: 1100 }}>
      <h1 className="edu-title" style={{ marginBottom: 4 }}>Аналитика арены</h1>
      <p className="edu-subtitle">Кто играет, какие кейсы трудные и какие находки чаще всего пропускают. По этим цифрам понятно, что переписать.</p>

      {error && <div className="edu-error">{error}</div>}

      {/* Обзор */}
      {overview && (
        <div className="rad-panel" style={{ marginTop: 12 }}>
          <div className="an-cards">
            <Stat num={overview.players} cap="игроков" />
            <Stat num={overview.totalAttempts} cap="попыток всего" />
            <Stat num={overview.stations.radiology.cases} cap="кейсов: снимки" sub={`${overview.stations.radiology.attempts} попыток`} />
            <Stat num={overview.stations.labs.cases} cap="кейсов: анализы" sub={`${overview.stations.labs.attempts} попыток`} />
            <Stat num={overview.stations.vp.cases} cap="виртуальных пациентов" sub={`${overview.stations.vp.attempts} попыток`} />
          </div>
        </div>
      )}

      <div className="arena-cols" style={{ marginTop: 16 }}>
        {/* Сложные кейсы */}
        <div className="rad-panel">
          <div className="edu-card-title" style={{ fontSize: 16 }}>Самые трудные кейсы</div>
          <div className="edu-hint" style={{ marginBottom: 8 }}>Низкий средний балл — кейс либо действительно сложный, либо с неверным эталоном. Стоит перепроверить.</div>
          {hardest.length === 0 ? (
            <div className="edu-hint">Пока нет пройденных кейсов.</div>
          ) : (
            hardest.map((c) => (
              <div key={c.id} className="an-row">
                <span style={{ flex: 1, minWidth: 0 }}>
                  {c.title} <small style={{ color: "#8b9aab" }}>· {c.station}</small>
                </span>
                <span style={{ width: 80, textAlign: "right", color: "#8b9aab" }}>{c.attempts} поп.</span>
                <strong className={c.avgScore < 0.5 ? "rad-fail" : ""} style={{ width: 56, textAlign: "right" }}>{pct(c.avgScore)}%</strong>
              </div>
            ))
          )}
        </div>

        {/* Часто пропускаемые находки */}
        <div className="rad-panel">
          <div className="edu-card-title" style={{ fontSize: 16 }}>Часто пропускаемые находки</div>
          <div className="edu-hint" style={{ marginBottom: 8 }}>Станция «Снимки». Высокий % пропусков — тему стоит усилить или разметку перепроверить.</div>
          {missed.length === 0 ? (
            <div className="edu-hint">Недостаточно данных (нужно больше пройденных попыток).</div>
          ) : (
            missed.map((m) => (
              <div key={m.label} className="an-row">
                <span style={{ flex: 1, minWidth: 0 }}>{m.name}</span>
                <span style={{ width: 90, textAlign: "right", color: "#8b9aab" }}>{m.missed}/{m.total}</span>
                <strong className={m.missRate > 0.5 ? "rad-fail" : ""} style={{ width: 56, textAlign: "right" }}>{pct(m.missRate)}%</strong>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Популярные кейсы */}
      <div className="rad-panel" style={{ marginTop: 16 }}>
        <div className="edu-card-title" style={{ fontSize: 16 }}>Популярные кейсы</div>
        {popular.length === 0 ? (
          <div className="edu-hint">Пока нет пройденных кейсов.</div>
        ) : (
          popular.map((c) => (
            <div key={c.id} className="an-row">
              <span style={{ flex: 1, minWidth: 0 }}>{c.title} <small style={{ color: "#8b9aab" }}>· {c.station}</small></span>
              <strong style={{ width: 80, textAlign: "right" }}>{c.attempts} поп.</strong>
              <span style={{ width: 56, textAlign: "right", color: "#8b9aab" }}>{pct(c.avgScore)}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ num, cap, sub }) {
  return (
    <div className="an-card">
      <div className="an-card-num">{num}</div>
      <div className="an-card-cap">{cap}</div>
      {sub && <div className="an-card-sub">{sub}</div>}
    </div>
  );
}
