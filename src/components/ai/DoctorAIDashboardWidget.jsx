import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

/* ─── DESIGN TOKENS ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

.aid-root {
  --bg: #f0ede8;
  --bg2: #e8e4dd;
  --surface: #faf8f5;
  --border: #d6d0c8;
  --ink: #1c1814;
  --ink2: #4a4540;
  --ink3: #8a8278;
  --red: #b91c1c;
  --red-pale: #fef5f5;
  --red-mid: #fca5a5;
  --orange: #c2410c;
  --orange-pale: #fff7f0;
  --yellow: #92400e;
  --yellow-pale: #fffbeb;
  --green: #166534;
  --green-pale: #f0fdf4;
  --blue: #1e40af;
  --blue-pale: #eff6ff;
  --shadow: 0 1px 3px rgba(28,24,20,.08), 0 4px 16px rgba(28,24,20,.05);
  --shadow-md: 0 2px 8px rgba(28,24,20,.1), 0 8px 32px rgba(28,24,20,.07);
  font-family: 'DM Sans', system-ui, sans-serif;
  background: var(--bg);
  min-height: 100vh;
  padding: 0 0 64px;
}

/* ── HEADER ── */
.aid-header {
  background: var(--ink);
  padding: 28px 40px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.aid-header-left { display: flex; align-items: center; gap: 16px; }
.aid-header-icon {
  width: 44px; height: 44px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.aid-header-title {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 22px;
  color: #fff;
  line-height: 1.2;
  margin: 0;
}
.aid-header-sub {
  font-size: 12px;
  color: rgba(255,255,255,.45);
  font-family: 'DM Mono', monospace;
  margin: 3px 0 0;
}
.aid-header-right { display: flex; align-items: center; gap: 10px; }
.aid-badge-cache {
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  color: rgba(255,255,255,.4);
  padding: 4px 10px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 100px;
}
.aid-refresh-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 8px;
  color: rgba(255,255,255,.85);
  font-size: 12px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
}
.aid-refresh-btn:hover { background: rgba(255,255,255,.14); }
.aid-refresh-btn:disabled { opacity: .4; cursor: not-allowed; }
.spin { animation: spin 1.2s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── STATS ROW ── */
.aid-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--border);
  border-bottom: 1px solid var(--border);
}
@media(max-width:680px){ .aid-stats { grid-template-columns: repeat(2,1fr); } }
.aid-stat {
  background: var(--surface);
  padding: 20px 24px;
  position: relative;
}
.aid-stat::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
}
.aid-stat.red::before { background: var(--red); }
.aid-stat.orange::before { background: var(--orange); }
.aid-stat.yellow::before { background: #d97706; }
.aid-stat.green::before { background: var(--green); }
.aid-stat-num {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 40px;
  line-height: 1;
  margin-bottom: 4px;
}
.aid-stat.red .aid-stat-num { color: var(--red); }
.aid-stat.orange .aid-stat-num { color: var(--orange); }
.aid-stat.yellow .aid-stat-num { color: #92400e; }
.aid-stat.green .aid-stat-num { color: var(--green); }
.aid-stat-label {
  font-size: 11px;
  color: var(--ink3);
  font-family: 'DM Mono', monospace;
  text-transform: uppercase;
  letter-spacing: .06em;
}

/* ── BODY ── */
.aid-body {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  padding: 28px 40px;
  max-width: 1400px;
  margin: 0 auto;
}
@media(max-width:900px){ .aid-body { grid-template-columns: 1fr; padding: 20px; } }

/* ── SECTION ── */
.aid-section { margin-bottom: 24px; }
.aid-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--ink3);
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.aid-section-count {
  margin-left: auto;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 2px 9px;
  font-size: 11px;
  color: var(--ink2);
}

/* ── PATIENT CARD ── */
.aid-patient-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: box-shadow .15s;
  text-decoration: none;
  color: inherit;
}
.aid-patient-card:hover { box-shadow: var(--shadow-md); border-color: #c4bdb4; }
.aid-risk-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}
.aid-risk-dot.high { background: var(--red); box-shadow: 0 0 0 3px rgba(185,28,28,.15); }
.aid-risk-dot.moderate { background: #d97706; box-shadow: 0 0 0 3px rgba(217,119,6,.15); }
.aid-risk-dot.low { background: var(--green); }
.aid-patient-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
  margin-bottom: 3px;
}
.aid-patient-risk-label {
  font-size: 12px;
  color: var(--ink3);
  margin-bottom: 4px;
}
.aid-patient-risk-label strong { color: var(--ink2); }
.aid-patient-tags { display: flex; gap: 5px; flex-wrap: wrap; }
.aid-tag {
  font-size: 10px;
  font-family: 'DM Mono', monospace;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.aid-tag.red { background: var(--red-pale); color: var(--red); border: 1px solid var(--red-mid); }
.aid-tag.orange { background: var(--orange-pale); color: var(--orange); border: 1px solid #fed7aa; }
.aid-tag.gray { background: var(--bg2); color: var(--ink3); border: 1px solid var(--border); }
.aid-patient-meta {
  margin-left: auto;
  text-align: right;
  flex-shrink: 0;
}
.aid-confidence {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: var(--ink3);
}

/* ── ALERT CARD ── */
.aid-alert-card {
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 8px;
  border-left: 3px solid;
}
.aid-alert-card.high { background: var(--red-pale); border-color: var(--red); }
.aid-alert-card.moderate { background: var(--orange-pale); border-color: var(--orange); }
.aid-alert-card.low { background: var(--yellow-pale); border-color: #d97706; }
.aid-alert-patient { font-size: 11px; font-family: 'DM Mono', monospace; color: var(--ink3); margin-bottom: 3px; }
.aid-alert-title { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
.aid-alert-msg { font-size: 12px; color: var(--ink2); }

/* ── SIDEBAR ── */
.aid-sidebar {}

/* ── PROGNOSIS BLOCK ── */
.aid-prognosis-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 18px 20px;
  margin-bottom: 16px;
}
.aid-prog-row { margin-bottom: 14px; }
.aid-prog-row:last-child { margin-bottom: 0; }
.aid-prog-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--ink2);
  margin-bottom: 5px;
}
.aid-prog-pct { font-weight: 600; font-family: 'DM Mono', monospace; }
.aid-prog-bar {
  height: 6px;
  background: var(--bg2);
  border-radius: 100px;
  overflow: hidden;
}
.aid-prog-fill {
  height: 100%;
  border-radius: 100px;
  transition: width .5s cubic-bezier(.4,0,.2,1);
}

/* ── DOMAIN RISK ── */
.aid-domain-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.aid-domain-row:last-child { border-bottom: none; }
.aid-domain-name { flex: 1; color: var(--ink2); text-transform: capitalize; }
.aid-domain-counts { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--ink3); }

/* ── EMPTY STATE ── */
.aid-empty {
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 28px 20px;
  text-align: center;
  color: var(--ink3);
  font-size: 13px;
}

/* ── NO DATA ── */
.aid-no-cache {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 40px 32px;
  text-align: center;
  margin: 32px auto;
  max-width: 480px;
}
.aid-no-cache h3 {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 22px;
  color: var(--ink);
  margin-bottom: 10px;
}
.aid-no-cache p { font-size: 14px; color: var(--ink3); line-height: 1.6; }

/* ── LOADING ── */
.aid-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  gap: 16px;
  color: var(--ink3);
  font-size: 14px;
}
.aid-pulse {
  width: 48px; height: 48px;
  border: 3px solid var(--border);
  border-top-color: var(--ink);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
`;

/* ─── HELPERS ─── */
const DOMAIN_LABELS = {
  cardiology: "Кардиология",
  pulmonology: "Пульмонология",
  neurology: "Неврология",
  gastroenterology: "Гастроэнтерология",
  hepatology: "Гепатология",
  nephrology: "Нефрология",
  endocrinology: "Эндокринология",
  hematology: "Гематология",
  infectious: "Инфекционные",
  rheumatology: "Ревматология",
  oncology: "Онкология",
};

const riskDotClass = (level) => {
  if (level === "high") return "high";
  if (level === "moderate") return "moderate";
  return "low";
};

const progColor = (pct) => {
  if (pct >= 50) return "#b91c1c";
  if (pct >= 30) return "#c2410c";
  if (pct >= 15) return "#d97706";
  return "#166534";
};

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/* ─── SUB-COMPONENTS ─── */
function PatientCard({ snapshot }) {
  const highCount = snapshot.highRisks?.length || 0;

  return (
    <Link
      to="/dp/polyclinic"
      state={{ patientId: snapshot.patientId }}
      className="aid-patient-card"
    >
      <span className={`aid-risk-dot ${riskDotClass(snapshot.topRiskLevel)}`} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="aid-patient-name">
          {snapshot.patientName || "Пациент"}
        </div>
        <div className="aid-patient-risk-label">
          {snapshot.topRiskDomain ? (
            <>
              <strong>
                {DOMAIN_LABELS[snapshot.topRiskDomain] ||
                  snapshot.topRiskDomain}
              </strong>{" "}
              — {snapshot.topRiskReason}
            </>
          ) : (
            <span style={{ color: "#a09890" }}>Нет приоритетного риска</span>
          )}
        </div>
        <div className="aid-patient-tags">
          {snapshot.clinicalSeverity === "high" && (
            <span className="aid-tag red">Высокая тяжесть</span>
          )}
          {highCount > 0 && (
            <span className="aid-tag red">
              {highCount} риск{highCount > 1 ? "а" : ""}
            </span>
          )}
          {snapshot.clinicalAlerts?.length > 0 && (
            <span className="aid-tag orange">
              {snapshot.clinicalAlerts.length} alert
            </span>
          )}
          {snapshot.daysSinceLastExam > 180 && (
            <span className="aid-tag gray">
              {snapshot.daysSinceLastExam}д без обследования
            </span>
          )}
        </div>
      </div>
      <div className="aid-patient-meta">
        <div className="aid-confidence">
          {Math.round((snapshot.aiConfidence || 0) * 100)}%
        </div>
        <div style={{ fontSize: 10, color: "#a09890", marginTop: 2 }}>
          AI confidence
        </div>
      </div>
    </Link>
  );
}

function AlertCard({ snapshot }) {
  const topAlert = snapshot.clinicalAlerts?.[0];
  if (!topAlert) return null;
  return (
    <div className={`aid-alert-card ${topAlert.level}`}>
      <div className="aid-alert-patient">{snapshot.patientName}</div>
      <div className="aid-alert-title">{topAlert.title}</div>
      {topAlert.message && (
        <div className="aid-alert-msg">{topAlert.message}</div>
      )}
    </div>
  );
}

function PrognosisBlock({ aggregated }) {
  if (!aggregated) return null;
  const hospPct = Math.round((aggregated.avgHospitalizationRisk || 0) * 100);
  const detPct = Math.round((aggregated.avgDeteriorationRisk || 0) * 100);

  return (
    <div className="aid-prognosis-card">
      <div className="aid-section-title" style={{ marginBottom: 14 }}>
        📈 Прогноз осложнений
      </div>
      <div className="aid-prog-row">
        <div className="aid-prog-label">
          <span>Госпитализация (30д)</span>
          <span className="aid-prog-pct">{hospPct}%</span>
        </div>
        <div className="aid-prog-bar">
          <div
            className="aid-prog-fill"
            style={{ width: `${hospPct}%`, background: progColor(hospPct) }}
          />
        </div>
        {aggregated.highHospitalizationCount > 0 && (
          <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 4 }}>
            {aggregated.highHospitalizationCount} пациентов с высоким риском
          </div>
        )}
      </div>
      <div className="aid-prog-row">
        <div className="aid-prog-label">
          <span>Ухудшение (72ч)</span>
          <span className="aid-prog-pct">{detPct}%</span>
        </div>
        <div className="aid-prog-bar">
          <div
            className="aid-prog-fill"
            style={{ width: `${detPct}%`, background: progColor(detPct) }}
          />
        </div>
        {aggregated.highDeteriorationCount > 0 && (
          <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 4 }}>
            {aggregated.highDeteriorationCount} пациентов с высоким риском
          </div>
        )}
      </div>
    </div>
  );
}

function DomainRiskBlock({ domainSummary }) {
  if (!domainSummary?.length) return null;
  return (
    <div className="aid-prognosis-card">
      <div className="aid-section-title" style={{ marginBottom: 12 }}>
        🧬 Распределение рисков
      </div>
      {domainSummary.map((d) => (
        <div key={d.domain} className="aid-domain-row">
          <span className="aid-domain-name">
            {DOMAIN_LABELS[d.domain] || d.domain}
          </span>
          <span className="aid-domain-counts">
            {d.highCount > 0 && (
              <span style={{ color: "#b91c1c" }}>{d.highCount}↑ </span>
            )}
            {d.moderateCount > 0 && (
              <span style={{ color: "#d97706" }}>{d.moderateCount}~ </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function DoctorAIDashboardWidget() {
  const API_BASE = process.env.REACT_APP_API_URL;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
        `${API_BASE}/ai/generate-clinical-summary/doctor-dashboard`,
        {
          withCredentials: true,
        },
      );
      setData(res.data);
    } catch (err) {
      setError("Не удалось загрузить AI-анализ");
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await axios.post(
        `${API_BASE}/ai/generate-clinical-summary/doctor-dashboard/refresh`,
        {},
        {
          withCredentials: true,
        },
      );
      setData(res.data);
    } catch {
      setError("Ошибка обновления");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const d = data?.dashboard;

  return (
    <div className="aid-root">
      <style>{CSS}</style>

      {/* HEADER */}
      <div className="aid-header">
        <div className="aid-header-left">
          <div className="aid-header-icon">🧠</div>
          <div>
            <h2 className="aid-header-title">AI Аналитика практики</h2>
            <div className="aid-header-sub">
              {d?.generatedAt
                ? `Обновлено ${formatDate(d.generatedAt)}`
                : "Персональный медицинский аналитик"}
              {data?.fromCache && " · из кэша"}
            </div>
          </div>
        </div>
        <div className="aid-header-right">
          {data?.fromCache && <span className="aid-badge-cache">кэш 24ч</span>}
          <button
            className="aid-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <span className={refreshing ? "spin" : ""}>↻</span>
            {refreshing ? "Обновление..." : "Обновить"}
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="aid-loading">
          <div className="aid-pulse" />
          <span>Анализируем пациентов...</span>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div style={{ padding: "40px", textAlign: "center", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {/* NO DATA */}
      {!loading && !error && d && d.totalPatientsWithCache === 0 && (
        <div style={{ padding: "40px" }}>
          <div className="aid-no-cache">
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔬</div>
            <h3>Нет AI-анализа</h3>
            <p>
              Откройте карточку пациента и сгенерируйте AI Clinical Summary.
              После этого здесь появится аналитика по всей практике.
            </p>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {!loading && !error && d && d.totalPatientsWithCache > 0 && (
        <>
          {/* STATS ROW */}
          <div className="aid-stats">
            <div className="aid-stat red">
              <div className="aid-stat-num">
                {d.highRiskPatients?.length || 0}
              </div>
              <div className="aid-stat-label">Высокий риск</div>
            </div>
            <div className="aid-stat orange">
              <div className="aid-stat-num">
                {d.patientsWithAlerts?.length || 0}
              </div>
              <div className="aid-stat-label">Активные alerts</div>
            </div>
            <div className="aid-stat yellow">
              <div className="aid-stat-num">
                {d.patientsWithoutRecentExams?.length || 0}
              </div>
              <div className="aid-stat-label">Без обследований</div>
            </div>
            <div className="aid-stat green">
              <div className="aid-stat-num">{d.totalPatientsWithCache}</div>
              <div className="aid-stat-label">
                Проанализировано из {d.totalPatientsAnalyzed}
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="aid-body">
            {/* LEFT COLUMN */}
            <div>
              {/* HIGH RISK PATIENTS */}
              <div className="aid-section">
                <div className="aid-section-title">
                  🔴 Пациенты с высоким риском
                  <span className="aid-section-count">
                    {d.highRiskPatients?.length || 0}
                  </span>
                </div>
                {d.highRiskPatients?.length > 0 ? (
                  d.highRiskPatients.map((s, i) => (
                    <PatientCard key={i} snapshot={s} />
                  ))
                ) : (
                  <div className="aid-empty">
                    Пациентов с высоким риском нет
                  </div>
                )}
              </div>

              {/* CLINICAL ALERTS */}
              {d.patientsWithAlerts?.length > 0 && (
                <div className="aid-section">
                  <div className="aid-section-title">
                    ⚡ Клинические алерты
                    <span className="aid-section-count">
                      {d.patientsWithAlerts.length}
                    </span>
                  </div>
                  {d.patientsWithAlerts.map((s, i) => (
                    <AlertCard key={i} snapshot={s} />
                  ))}
                </div>
              )}

              {/* WITHOUT RECENT EXAMS */}
              <div className="aid-section">
                <div className="aid-section-title">
                  🗓 Без обследований ({">"}6 мес.)
                  <span className="aid-section-count">
                    {d.patientsWithoutRecentExams?.length || 0}
                  </span>
                </div>
                {d.patientsWithoutRecentExams?.length > 0 ? (
                  d.patientsWithoutRecentExams.map((s, i) => (
                    <PatientCard key={i} snapshot={s} />
                  ))
                ) : (
                  <div className="aid-empty">
                    Все пациенты прошли обследование в последние 6 месяцев
                  </div>
                )}
              </div>

              {/* MODERATE RISK */}
              {d.moderateRiskPatients?.length > 0 && (
                <div className="aid-section">
                  <div className="aid-section-title">
                    🟡 Умеренный риск
                    <span className="aid-section-count">
                      {d.moderateRiskPatients.length}
                    </span>
                  </div>
                  {d.moderateRiskPatients.map((s, i) => (
                    <PatientCard key={i} snapshot={s} />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="aid-sidebar">
              <PrognosisBlock aggregated={d.aggregatedPrognosis} />
              <DomainRiskBlock domainSummary={d.domainRiskSummary} />

              {/* Coverage info */}
              <div
                className="aid-prognosis-card"
                style={{ fontSize: 12, color: "#8a8278", lineHeight: 1.7 }}
              >
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    marginBottom: 8,
                    color: "#a09890",
                  }}
                >
                  ℹ️ О дашборде
                </div>
                Аналитика строится на основе сохранённых AI Summary. Пациенты
                без сгенерированного Summary не включаются в анализ. Данные
                обновляются раз в 24 часа или по кнопке «Обновить».
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
