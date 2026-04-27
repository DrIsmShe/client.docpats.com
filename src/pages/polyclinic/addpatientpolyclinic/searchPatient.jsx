import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

/* ─────────────────────── STYLES ─────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@700&display=swap');

.sp-root {
  --teal:        #0d6b5e;
  --teal-dark:   #094d44;
  --teal-mid:    #0f8a7a;
  --teal-light:  #14b8a6;
  --teal-pale:   #e8f7f5;
  --teal-border: #a3ddd5;
  --green:       #15803d;
  --green-pale:  #f0fdf4;
  --green-border:#86efac;
  --amber:       #92400e;
  --amber-pale:  #fffbeb;
  --amber-border:#fcd34d;
  --red:         #b91c1c;
  --red-pale:    #fef2f2;
  --red-border:  #fca5a5;
  --blue:        #1d4ed8;
  --blue-pale:   #eff6ff;
  --blue-border: #93c5fd;
  --border:      #dde4ec;
  --surface:     #ffffff;
  --surface2:    #f7f9fb;
  --ink:         #1a2533;
  --ink2:        #3d4f63;
  --ink3:        #7089a6;
  --sh-sm:       0 1px 4px rgba(10,30,60,.06),0 2px 8px rgba(10,30,60,.04);
  --sh-md:       0 4px 18px rgba(10,30,60,.09),0 1px 4px rgba(10,30,60,.05);
  --tr:          all .18s cubic-bezier(.4,0,.2,1);
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── HERO HEADER ── */
.sp-hero {
  background: linear-gradient(130deg, #094d44 0%, #0d6b5e 55%, #1a7a6e 100%);
  padding: 32px 32px 72px;
  position: relative;
  overflow: hidden;
  border-radius: 16px 16px 0 0;
}
.sp-hero::before {
  content: '';
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 400px 200px at 100% 60%, rgba(20,184,166,.2) 0%, transparent 65%),
    radial-gradient(ellipse 200px 300px at -5% 120%,  rgba(4,44,38,.5)   0%, transparent 55%);
  pointer-events: none;
}
.sp-hero::after {
  content: '';
  position: absolute; bottom: -1px; left: 0; right: 0;
  height: 44px;
  background: var(--surface2);
  clip-path: ellipse(54% 100% at 50% 100%);
}
.sp-hero-inner { position: relative; z-index: 1; }
.sp-hero-tag {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 9px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase;
  color: rgba(255,255,255,.75); background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.2); padding: 4px 12px; border-radius: 100px;
  margin-bottom: 14px; backdrop-filter: blur(6px);
}
.sp-hero-tag::before { content: ''; width: 5px; height: 5px; background: #5ef4dd; border-radius: 50%; }
.sp-hero-title {
  font-family: 'Merriweather', Georgia, serif;
  font-size: clamp(18px, 2.4vw, 26px);
  font-weight: 700; color: white;
  line-height: 1.2; margin: 0 0 6px;
}
.sp-hero-sub { font-size: 13px; color: rgba(255,255,255,.6); margin: 0; }

/* ── CARD ── */
.sp-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--sh-md);
  overflow: hidden;
  max-width: 620px;
}
.sp-card-body {
  padding: 0;
  background: var(--surface2);
}

/* ── SEARCH PANEL ── */
.sp-search-panel {
  padding: 28px 28px 24px;
  background: var(--surface);
}
.sp-search-label {
  font-size: 11px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: var(--ink3); margin-bottom: 8px; display: block;
}
.sp-search-row {
  display: flex; gap: 10px; align-items: stretch;
}
.sp-input {
  flex: 1;
  height: 44px; padding: 0 14px;
  background: var(--surface2); border: 1.5px solid var(--border);
  border-radius: 10px; font-family: 'Inter', sans-serif;
  font-size: 14px; color: var(--ink); transition: var(--tr); outline: none;
}
.sp-input::placeholder { color: var(--ink3); }
.sp-input:focus {
  border-color: var(--teal-mid);
  box-shadow: 0 0 0 3px rgba(13,107,94,.1);
  background: white;
}
.sp-search-btn {
  height: 44px; padding: 0 22px;
  border: none; border-radius: 10px; cursor: pointer;
  font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
  color: white; transition: var(--tr); white-space: nowrap;
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, var(--teal) 0%, var(--teal-mid) 100%);
  box-shadow: 0 3px 12px rgba(13,107,94,.3);
}
.sp-search-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(13,107,94,.4); transform: translateY(-1px);
}
.sp-search-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }

/* ── SPINNER ── */
.sp-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.4); border-top-color: white;
  border-radius: 50%; animation: spSpin .65s linear infinite;
}
@keyframes spSpin { to { transform: rotate(360deg); } }

/* ── DIVIDER ── */
.sp-divider { height: 1px; background: var(--border); margin: 0 28px; }

/* ── RESULT PANEL ── */
.sp-result {
  padding: 24px 28px 28px;
  animation: spFadeIn .22s ease;
}
@keyframes spFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

/* ── ALERT CARDS ── */
.sp-alert {
  border-radius: 12px; padding: 18px 20px;
  border: 1px solid; display: flex; gap: 14px; align-items: flex-start;
  margin-bottom: 0;
}
.sp-alert-icon {
  width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.sp-alert-content { flex: 1; }
.sp-alert-title {
  font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 4px;
}
.sp-alert-text {
  font-size: 13px; line-height: 1.6; color: var(--ink2); margin: 0;
}
.sp-alert-sep { height: 1px; background: currentColor; opacity: .15; margin: 12px 0; }

/* success */
.sp-alert-success { background: var(--green-pale); border-color: var(--green-border); }
.sp-alert-success .sp-alert-icon { background: rgba(21,128,61,.1); }
.sp-alert-success .sp-alert-title { color: var(--green); }

/* warning */
.sp-alert-warning { background: var(--amber-pale); border-color: var(--amber-border); }
.sp-alert-warning .sp-alert-icon { background: rgba(146,64,14,.1); }
.sp-alert-warning .sp-alert-title { color: var(--amber); }

/* danger */
.sp-alert-danger { background: var(--red-pale); border-color: var(--red-border); }
.sp-alert-danger .sp-alert-icon { background: rgba(185,28,28,.1); }
.sp-alert-danger .sp-alert-title { color: var(--red); }

/* info */
.sp-alert-info { background: var(--blue-pale); border-color: var(--blue-border); }
.sp-alert-info .sp-alert-icon { background: rgba(29,78,216,.1); }
.sp-alert-info .sp-alert-title { color: var(--blue); }

/* ── PATIENT INFO BLOCK ── */
.sp-patient-block {
  margin-top: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.sp-patient-head {
  padding: 12px 16px;
  background: var(--teal-pale);
  border-bottom: 1px solid var(--teal-border);
  font-size: 11px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: var(--teal);
  display: flex; align-items: center; gap: 7px;
}
.sp-patient-rows { padding: 4px 0; }
.sp-patient-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-bottom: 1px solid var(--border);
}
.sp-patient-row:last-child { border-bottom: none; }
.sp-patient-key {
  font-size: 11px; font-weight: 600; color: var(--ink3);
  text-transform: uppercase; letter-spacing: .06em; width: 70px; flex-shrink: 0;
}
.sp-patient-val { font-size: 13px; color: var(--ink2); font-family: 'SFMono-Regular', Consolas, monospace; }
.sp-patient-val-plain { font-family: 'Inter', sans-serif; }

/* ── BUTTONS ── */
.sp-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 20px; border-radius: 100px; border: none;
  font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700;
  cursor: pointer; transition: var(--tr); text-decoration: none;
}
.sp-btn-teal {
  color: white;
  background: linear-gradient(135deg, var(--teal) 0%, var(--teal-mid) 100%);
  box-shadow: 0 3px 10px rgba(13,107,94,.28);
}
.sp-btn-teal:hover { box-shadow: 0 6px 18px rgba(13,107,94,.38); transform: translateY(-1px); }
.sp-btn-green {
  color: white; background: var(--green);
  box-shadow: 0 3px 10px rgba(21,128,61,.28);
}
.sp-btn-green:hover { box-shadow: 0 6px 18px rgba(21,128,61,.38); transform: translateY(-1px); }
.sp-btn-blue {
  color: white; background: var(--blue);
  box-shadow: 0 3px 10px rgba(29,78,216,.28);
}
.sp-btn-blue:hover { box-shadow: 0 6px 18px rgba(29,78,216,.38); transform: translateY(-1px); }

.sp-btn-row { margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; }
`;

export default function SearchPatient() {
  const { t } = useTranslation("SearchPatient");

  // ── ВСЯ ОРИГИНАЛЬНАЯ ЛОГИКА — БЕЗ ИЗМЕНЕНИЙ ──
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const handleSearch = async () => {
    if (!query.trim()) {
      alert(t("alerts.emptyQuery"));
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/clinic/search-patients-polyclinic`,
        { params: { query: query.trim() }, withCredentials: true },
      );
      console.log("🔍 Search result:", data);
      setResult(data);
    } catch (error) {
      console.error("Search error:", error.response?.data || error.message);
      setResult({ status: "error", message: t("alerts.searchError") });
    } finally {
      setLoading(false);
    }
  };

  const goToPatientProfile = (patientId) => {
    navigate(`/dp/polyclinic`);
  };
  // ────────────────────────────────────────────

  return (
    <div className="sp-root">
      <style>{CSS}</style>

      <div className="sp-card">
        {/* ── HERO ── */}
        <div className="sp-hero">
          <div className="sp-hero-inner">
            <div className="sp-hero-tag">{t("searchPatient.tag")}</div>
            <h1 className="sp-hero-title">🔍&nbsp;{t("page.title")}</h1>
            <p className="sp-hero-sub">{t("searchPatient.heroSub")}</p>
          </div>
        </div>

        <div className="sp-card-body">
          {/* ── SEARCH PANEL ── */}
          <div className="sp-search-panel">
            <span className="sp-search-label">
              {t("input.placeholder") || "Поиск пациента"}
            </span>
            <div className="sp-search-row">
              <input
                type="text"
                className="sp-input"
                placeholder={t("input.placeholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                className="sp-search-btn"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="sp-spinner" />
                    {t("searchPatient.loadingSearch")}
                  </>
                ) : (
                  t("buttons.search")
                )}
              </button>
            </div>
          </div>

          {/* ── RESULTS ── */}
          {result && (
            <>
              <div className="sp-divider" />
              <div className="sp-result">
                {/* ── ATTACHED ── */}
                {result.status === "attached" && (
                  <div className="sp-alert sp-alert-success">
                    <div className="sp-alert-icon">✅</div>
                    <div className="sp-alert-content">
                      <div className="sp-alert-title">
                        {t("statuses.attached.title")}
                      </div>
                      <p className="sp-alert-text">
                        {result.message || t("statuses.attached.message")}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── NEEDS PATIENT ACTIVATION ── */}
                {result.status === "needsPatientActivation" && (
                  <div className="sp-alert sp-alert-warning">
                    <div className="sp-alert-icon">⏳</div>
                    <div className="sp-alert-content">
                      <div className="sp-alert-title">
                        {t("statuses.needsPatientActivation.title")}
                      </div>
                      <p className="sp-alert-text">{result.message}</p>
                      <div className="sp-alert-sep" />
                      <p className="sp-alert-text">
                        {t("statuses.needsPatientActivation.instruction")}{" "}
                        <strong>
                          {t("statuses.needsPatientActivation.highlight")}
                        </strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* ── NOT FOUND ── */}
                {result.status === "notFound" && (
                  <div className="sp-alert sp-alert-danger">
                    <div className="sp-alert-icon">❌</div>
                    <div className="sp-alert-content">
                      <div className="sp-alert-title">
                        {t("statuses.notFound.title")}
                      </div>
                      <p className="sp-alert-text">
                        {t("statuses.notFound.instruction")}
                      </p>
                      <div className="sp-btn-row">
                        <button
                          className="sp-btn sp-btn-green"
                          onClick={() =>
                            navigate("/dp/add-private-patient-polyclinic")
                          }
                        >
                          ➕&nbsp;{t("buttons.addPatient")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PATIENT INFO (ONLY ATTACHED) ── */}
                {result.status === "attached" && result.patient && (
                  <div className="sp-patient-block">
                    <div className="sp-patient-head">
                      🫀&nbsp;{t("patientInfo.title")}
                    </div>
                    <div className="sp-patient-rows">
                      <div className="sp-patient-row">
                        <span className="sp-patient-key">
                          {t("patientInfo.email")}
                        </span>
                        <span className="sp-patient-val sp-patient-val-plain">
                          {result.patient.email ||
                            t("patientInfo.notSpecified")}
                        </span>
                      </div>
                      <div className="sp-patient-row">
                        <span className="sp-patient-key">
                          {t("patientInfo.phone")}
                        </span>
                        <span className="sp-patient-val sp-patient-val-plain">
                          {result.patient.phone ||
                            t("patientInfo.notSpecified")}
                        </span>
                      </div>
                      <div className="sp-patient-row">
                        <span className="sp-patient-key">
                          {t("patientInfo.uuid")}
                        </span>
                        <span className="sp-patient-val">
                          {result.patient.patientUUID ||
                            t("patientInfo.notSpecified")}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "14px 16px",
                        borderTop: "1px solid #dde4ec",
                      }}
                    >
                      <button
                        className="sp-btn sp-btn-teal"
                        onClick={() =>
                          goToPatientProfile(result.patient.patientId)
                        }
                      >
                        🏥&nbsp;{t("buttons.openDashboard")}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── PRIVATE FOUND ── */}
                {result.status === "privateFound" && (
                  <div className="sp-alert sp-alert-info">
                    <div className="sp-alert-icon">ℹ️</div>
                    <div className="sp-alert-content">
                      <div className="sp-alert-title">
                        {t("searchPatient.alert.title")}
                      </div>
                      <p className="sp-alert-text">
                        {t("searchPatient.alert.text")}
                      </p>
                      <div className="sp-btn-row">
                        <button
                          className="sp-btn sp-btn-blue"
                          onClick={() => navigate(`/dp/polyclinic`)}
                        >
                          📋&nbsp;{t("searchPatient.openCard")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
