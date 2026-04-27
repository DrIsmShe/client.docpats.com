import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.REACT_APP_API_URL;

const DAYS = [
  { dow: 1, labelKey: "days.monday" },
  { dow: 2, labelKey: "days.tuesday" },
  { dow: 3, labelKey: "days.wednesday" },
  { dow: 4, labelKey: "days.thursday" },
  { dow: 5, labelKey: "days.friday" },
  { dow: 6, labelKey: "days.saturday" },
  { dow: 0, labelKey: "days.sunday" },
];

const DOW_EMOJI = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  0: "Sun",
};

/* ===== STYLES ===== */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  :root {
    --cream: #faf8f4;
    --cream2: #f3efe8;
    --parchment: #ede8df;
    --ink: #1c1917;
    --ink2: #44403c;
    --ink3: #78716c;
    --teal: #0f766e;
    --teal-mid: #0d9488;
    --teal-light: #14b8a6;
    --teal-pale: #f0fdfa;
    --teal-border: #99f6e4;
    --green: #16a34a;
    --green-pale: #f0fdf4;
    --green-border: #bbf7d0;
    --red: #dc2626;
    --red-pale: #fef2f2;
    --red-border: #fca5a5;
    --border: #e7e2d8;
    --border2: #d6d0c6;
    --shadow-sm: 0 2px 8px rgba(28,25,23,.07), 0 1px 3px rgba(28,25,23,.04);
    --shadow-md: 0 8px 24px rgba(28,25,23,.09), 0 2px 8px rgba(28,25,23,.04);
    --radius: 16px;
    --radius-sm: 10px;
    --transition: all .22s cubic-bezier(.4,0,.2,1);
    --font-display: 'Lora', Georgia, serif;
    --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  .dsp-wrap {
    background: var(--cream);
    min-height: 100vh;
    font-family: var(--font-body);
    color: var(--ink);
  }

  /* ── HERO ── */
  .dsp-hero {
    background: linear-gradient(150deg, #0c4a6e 0%, #0f766e 60%, #065f46 100%);
    padding: 52px 40px 80px;
    position: relative;
    overflow: hidden;
  }
  .dsp-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 700px 400px at 90% 40%, rgba(20,184,166,.18) 0%, transparent 65%),
      radial-gradient(ellipse 300px 500px at 5% 110%, rgba(6,95,70,.5) 0%, transparent 60%);
    pointer-events: none;
  }
  .dsp-hero::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 64px;
    background: var(--cream);
    clip-path: ellipse(55% 100% at 50% 100%);
  }
  .dsp-hero-inner {
    max-width: 920px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }
  .dsp-hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(255,255,255,.12);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.22);
    color: rgba(255,255,255,.88);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 100px;
    margin-bottom: 18px;
  }
  .dsp-hero-tag::before { content:''; width:6px; height:6px; background:#5eead4; border-radius:50%; }
  .dsp-hero-title {
    font-family: var(--font-display);
    font-size: clamp(24px, 3.5vw, 40px);
    font-weight: 700;
    color: white;
    line-height: 1.15;
    letter-spacing: -.015em;
    margin: 0 0 8px;
  }
  .dsp-hero-sub {
    font-size: 13px;
    color: rgba(255,255,255,.65);
    font-weight: 500;
  }

  /* ── BODY ── */
  .dsp-body {
    max-width: 920px;
    margin: -40px auto 0;
    padding: 0 32px 80px;
    position: relative;
    z-index: 2;
  }
  @media (max-width: 768px) { .dsp-body { padding: 0 16px 60px; } }

  /* ── TOAST ── */
  .dsp-toast {
    position: fixed;
    top: 24px; right: 24px;
    z-index: 9999;
    background: white;
    border: 1px solid var(--teal-border);
    border-left: 4px solid var(--teal);
    border-radius: var(--radius-sm);
    padding: 13px 20px;
    box-shadow: var(--shadow-md);
    font-size: 14px;
    font-weight: 600;
    color: var(--teal);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: dsp-toast-in .25s ease;
    max-width: 340px;
  }
  @keyframes dsp-toast-in { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform: none; } }

  /* ── DAY CARD ── */
  .dsp-day-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    margin-bottom: 16px;
    transition: var(--transition);
  }
  .dsp-day-card:hover { box-shadow: var(--shadow-md); }

  .dsp-day-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 22px;
    background: var(--cream2);
    border-bottom: 1px solid var(--border);
    gap: 12px;
    flex-wrap: wrap;
  }
  .dsp-day-name-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .dsp-day-abbr {
    width: 40px; height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-light) 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .06em;
    color: white;
    flex-shrink: 0;
  }
  .dsp-day-label {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--ink);
  }
  .dsp-day-count {
    font-size: 11px;
    font-weight: 600;
    color: var(--ink3);
    background: var(--parchment);
    border: 1px solid var(--border);
    padding: 2px 9px;
    border-radius: 100px;
  }

  .dsp-add-btns {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .dsp-add-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    padding: 7px 16px;
    border-radius: 100px;
    border: 1.5px solid transparent;
    cursor: pointer;
    transition: var(--transition);
    font-family: var(--font-body);
    white-space: nowrap;
  }
  .dsp-add-btn.offline {
    background: var(--teal-pale);
    color: var(--teal);
    border-color: var(--teal-border);
  }
  .dsp-add-btn.offline:hover { background: var(--teal); color: white; border-color: var(--teal); }
  .dsp-add-btn.video {
    background: var(--green-pale);
    color: var(--green);
    border-color: var(--green-border);
  }
  .dsp-add-btn.video:hover { background: var(--green); color: white; border-color: var(--green); }

  /* ── INTERVALS ── */
  .dsp-day-body {
    padding: 14px 22px 18px;
  }
  .dsp-no-intervals {
    font-size: 13px;
    color: var(--ink3);
    font-style: italic;
    padding: 8px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dsp-no-intervals::before { content: '—'; color: var(--border2); }

  .dsp-interval-row {
    display: grid;
    grid-template-columns: 130px 1fr 1fr 120px 38px;
    gap: 10px;
    align-items: center;
    padding: 12px 14px;
    background: var(--cream);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    margin-bottom: 10px;
    transition: var(--transition);
  }
  .dsp-interval-row:last-child { margin-bottom: 0; }
  .dsp-interval-row:hover { border-color: var(--teal-border); background: var(--teal-pale); }
  @media (max-width: 640px) {
    .dsp-interval-row {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto auto;
    }
    .dsp-interval-row > .dsp-field-type { grid-column: 1 / -1; }
    .dsp-del-btn { grid-column: 1 / -1; justify-self: end; }
  }

  .dsp-field-wrap { display: flex; flex-direction: column; gap: 4px; }
  .dsp-field-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--ink3);
  }
  .dsp-select, .dsp-input-time, .dsp-input-num {
    height: 36px;
    padding: 0 10px;
    background: white;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    transition: var(--transition);
    outline: none;
    width: 100%;
    box-sizing: border-box;
  }
  .dsp-select:focus, .dsp-input-time:focus, .dsp-input-num:focus {
    border-color: var(--teal-mid);
    background: white;
    box-shadow: 0 0 0 3px rgba(15,118,110,.1);
  }
  .dsp-select { appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2378716c' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
  }

  /* type indicator in select */
  .dsp-type-tag {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 12px; font-weight: 700;
    padding: 3px 10px; border-radius: 100px;
  }
  .dsp-type-tag.offline { background: var(--teal-pale); color: var(--teal); }
  .dsp-type-tag.video   { background: var(--green-pale); color: var(--green); }

  .dsp-del-btn {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    background: white;
    border: 1.5px solid var(--red-border);
    border-radius: 8px;
    color: var(--red);
    cursor: pointer;
    font-size: 15px;
    transition: var(--transition);
    flex-shrink: 0;
  }
  .dsp-del-btn:hover { background: var(--red-pale); border-color: var(--red); }

  /* ── SAVE SECTION ── */
  .dsp-save-wrap {
    display: flex;
    justify-content: center;
    padding: 32px 0 0;
  }
  .dsp-save-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-body);
    font-size: 15px;
    font-weight: 700;
    padding: 14px 48px;
    border-radius: 100px;
    border: none;
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-mid) 100%);
    color: white;
    cursor: pointer;
    transition: var(--transition);
    box-shadow: 0 4px 20px rgba(15,118,110,.3);
    letter-spacing: .02em;
  }
  .dsp-save-btn:hover {
    box-shadow: 0 8px 28px rgba(15,118,110,.4);
    transform: translateY(-2px);
  }
  .dsp-save-btn:active { transform: translateY(0); }

  /* ── LOADING ── */
  .dsp-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 60vh; gap: 16px;
    font-size: 14px; color: var(--ink3);
    background: var(--cream);
    font-family: var(--font-body);
  }
  .dsp-spinner {
    width: 44px; height: 44px;
    border: 3px solid var(--parchment);
    border-top-color: var(--teal);
    border-radius: 50%;
    animation: dsp-spin .7s linear infinite;
  }
  @keyframes dsp-spin { to { transform: rotate(360deg); } }
`;

export default function DoctorSchedulePage() {
  const { t } = useTranslation();

  const [schedule, setSchedule] = useState({
    weekly: [],
    timezone: "Asia/Baku",
    bufferMinutes: 10,
    autoApprove: true,
    allowVideo: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* ── Load ── */
  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/schedule/doctor-schedule/me`, {
        withCredentials: true,
      });
      if (res.data?.data) setSchedule(res.data.data);
    } catch (e) {
      console.error("❌ Error loading schedule:", e);
      setMessage(t("schedule.errors.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  /* ── Add interval ── */
  const handleAddInterval = (dow, type = "offline") => {
    setSchedule((prev) => {
      const updated = { ...prev };
      const day = updated.weekly.find((d) => d.dow === dow);
      const newInterval = {
        start: "09:00",
        end: "13:00",
        slotMinutes: 20,
        type,
      };
      if (day) {
        day.intervals.push(newInterval);
      } else {
        updated.weekly.push({ dow, intervals: [newInterval] });
      }
      return { ...updated };
    });
  };

  /* ── Delete interval ── */
  const handleDeleteInterval = (dow, idx) => {
    setSchedule((prev) => {
      const updated = { ...prev };
      const day = updated.weekly.find((d) => d.dow === dow);
      if (!day) return prev;
      day.intervals.splice(idx, 1);
      if (day.intervals.length === 0) {
        updated.weekly = updated.weekly.filter((d) => d.dow !== dow);
      }
      return { ...updated };
    });
  };

  /* ── Edit interval ── */
  const handleIntervalChange = (dow, idx, field, value) => {
    setSchedule((prev) => {
      const updated = { ...prev };
      const day = updated.weekly.find((d) => d.dow === dow);
      if (!day) return prev;
      day.intervals[idx][field] = value;
      return { ...updated };
    });
  };

  /* ── Save ── */
  const handleSave = async () => {
    try {
      await axios.post(`${API_BASE}/schedule/doctor-schedule`, schedule, {
        withCredentials: true,
      });
      setMessage(t("schedule.saved"));
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Error saving:", err);
      setMessage(t("schedule.errors.save"));
    }
  };

  if (loading)
    return (
      <div className="dsp-wrap">
        <style>{styles}</style>
        <div className="dsp-state">
          <div className="dsp-spinner" />
          <span>{t("schedule.loading") || "Загрузка..."}</span>
        </div>
      </div>
    );

  return (
    <div className="dsp-wrap">
      <style>{styles}</style>

      {/* ── Toast ── */}
      {message && (
        <div className="dsp-toast">
          <span>✓</span> {message}
        </div>
      )}

      {/* ── HERO ── */}
      <div className="dsp-hero">
        <div className="dsp-hero-inner">
          <div className="dsp-hero-tag">DocPats · Schedule Manager</div>
          <h1 className="dsp-hero-title">📅 {t("schedule.title")}</h1>
          <div className="dsp-hero-sub">
            {t("schedule.subtitle") ||
              "Настройте рабочие часы и временные слоты для приёмов"}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="dsp-body">
        {DAYS.map((day) => {
          const existing = schedule.weekly.find((d) => d.dow === day.dow);
          const intervalCount = existing?.intervals?.length || 0;

          return (
            <div key={day.dow} className="dsp-day-card">
              {/* Day header */}
              <div className="dsp-day-head">
                <div className="dsp-day-name-wrap">
                  <div className="dsp-day-abbr">{DOW_EMOJI[day.dow]}</div>
                  <div className="dsp-day-label">{t(day.labelKey)}</div>
                  {intervalCount > 0 && (
                    <span className="dsp-day-count">
                      {intervalCount}{" "}
                      {intervalCount === 1 ? "интервал" : "интервала"}
                    </span>
                  )}
                </div>

                <div className="dsp-add-btns">
                  <button
                    className="dsp-add-btn offline"
                    onClick={() => handleAddInterval(day.dow, "offline")}
                  >
                    🏥 {t("schedule.offline")}
                  </button>
                  <button
                    className="dsp-add-btn video"
                    onClick={() => handleAddInterval(day.dow, "video")}
                  >
                    💻 {t("schedule.online")}
                  </button>
                </div>
              </div>

              {/* Intervals */}
              <div className="dsp-day-body">
                {existing ? (
                  existing.intervals.map((interval, idx) => (
                    <div key={idx} className="dsp-interval-row">
                      {/* Type */}
                      <div className="dsp-field-wrap dsp-field-type">
                        <span className="dsp-field-label">Тип</span>
                        <select
                          className="dsp-select"
                          value={interval.type}
                          onChange={(e) =>
                            handleIntervalChange(
                              day.dow,
                              idx,
                              "type",
                              e.target.value,
                            )
                          }
                        >
                          <option value="offline">
                            🏥 {t("schedule.offline")}
                          </option>
                          <option value="video">
                            💻 {t("schedule.online")}
                          </option>
                        </select>
                      </div>

                      {/* Start */}
                      <div className="dsp-field-wrap">
                        <span className="dsp-field-label">Начало</span>
                        <input
                          type="time"
                          className="dsp-input-time"
                          value={interval.start}
                          onChange={(e) =>
                            handleIntervalChange(
                              day.dow,
                              idx,
                              "start",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      {/* End */}
                      <div className="dsp-field-wrap">
                        <span className="dsp-field-label">Конец</span>
                        <input
                          type="time"
                          className="dsp-input-time"
                          value={interval.end}
                          onChange={(e) =>
                            handleIntervalChange(
                              day.dow,
                              idx,
                              "end",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      {/* Slot minutes */}
                      <div className="dsp-field-wrap">
                        <span className="dsp-field-label">Слот (мин)</span>
                        <input
                          type="number"
                          className="dsp-input-num"
                          min={5}
                          max={240}
                          value={interval.slotMinutes}
                          onChange={(e) =>
                            handleIntervalChange(
                              day.dow,
                              idx,
                              "slotMinutes",
                              parseInt(e.target.value),
                            )
                          }
                        />
                      </div>

                      {/* Delete */}
                      <button
                        className="dsp-del-btn"
                        onClick={() => handleDeleteInterval(day.dow, idx)}
                        title="Удалить"
                      >
                        🗑
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="dsp-no-intervals">
                    {t("schedule.noIntervals")}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* ── Save ── */}
        <div className="dsp-save-wrap">
          <button className="dsp-save-btn" onClick={handleSave}>
            💾 {t("schedule.saveBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
