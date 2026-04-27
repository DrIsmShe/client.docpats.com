// client/src/pages/patient/PatientFileFilter.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FaDownload } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const BASE_URL = process.env.REACT_APP_API_URL;

const STUDY_TYPES = [
  "CTScan",
  "MRIScan",
  "USMScan",
  "XRayScan",
  "PETScan",
  "SPECTScan",
  "GinecologyScan",
  "EEGScan",
  "HOLTERScan",
  "SpirometryScan",
  "DoplerScan",
  "GastroscopyScan",
  "CapsuleEndoscopyScan",
  "AngiographyScan",
  "EKGScan",
  "EchoEKGScan",
  "CoronographyScan",
  "LabTest",
];

/* ── Study type visual config ── */
const TYPE_META = {
  labtest: { icon: "🧪", color: "#10b981", label: "LabTest" },
  ctscan: { icon: "🩻", color: "#6366f1", label: "CT Scan" },
  mriscan: { icon: "🧲", color: "#8b5cf6", label: "MRI" },
  usmscan: { icon: "📡", color: "#0ea5e9", label: "USM" },
  xrayscan: { icon: "☢️", color: "#f59e0b", label: "X-Ray" },
  xray: { icon: "☢️", color: "#f59e0b", label: "X-Ray" },
  petscan: { icon: "🔬", color: "#ec4899", label: "PET" },
  pet: { icon: "🔬", color: "#ec4899", label: "PET" },
  spectscan: { icon: "📊", color: "#14b8a6", label: "SPECT" },
  spect: { icon: "📊", color: "#14b8a6", label: "SPECT" },
  eegscan: { icon: "🧠", color: "#a78bfa", label: "EEG" },
  eeg: { icon: "🧠", color: "#a78bfa", label: "EEG" },
  holterscan: { icon: "💓", color: "#f43f5e", label: "Holter" },
  holter: { icon: "💓", color: "#f43f5e", label: "Holter" },
  spirometryscan: { icon: "🫁", color: "#06b6d4", label: "Spirometry" },
  spirometry: { icon: "🫁", color: "#06b6d4", label: "Spirometry" },
  ginecologyscan: { icon: "👩‍⚕️", color: "#f472b6", label: "Gynecology" },
  ginecology: { icon: "👩‍⚕️", color: "#f472b6", label: "Gynecology" },
  doplerscan: { icon: "🔊", color: "#22d3ee", label: "Doppler" },
  doppler: { icon: "🔊", color: "#22d3ee", label: "Doppler" },
  dopler: { icon: "🔊", color: "#22d3ee", label: "Doppler" },
  gastroscopyscan: { icon: "🔭", color: "#84cc16", label: "Gastroscopy" },
  gastroscopy: { icon: "🔭", color: "#84cc16", label: "Gastroscopy" },
  capsuleendoscopyscan: {
    icon: "💊",
    color: "#fb923c",
    label: "Capsule Endoscopy",
  },
  angiographyscan: { icon: "🩸", color: "#ef4444", label: "Angiography" },
  angiography: { icon: "🩸", color: "#ef4444", label: "Angiography" },
  ekgscan: { icon: "📈", color: "#f97316", label: "EKG" },
  ekg: { icon: "📈", color: "#f97316", label: "EKG" },
  echoekgscan: { icon: "🫀", color: "#e11d48", label: "Echo-EKG" },
  echoekg: { icon: "🫀", color: "#e11d48", label: "Echo-EKG" },
  "echo-ekg": { icon: "🫀", color: "#e11d48", label: "Echo-EKG" },
  coronographyscan: { icon: "🫀", color: "#dc2626", label: "Coronography" },
  coronography: { icon: "🫀", color: "#dc2626", label: "Coronography" },
};

const getTypeMeta = (typeStr) =>
  TYPE_META[typeStr] || { icon: "📁", color: "#64748b", label: typeStr || "—" };

/* ── CSS ── */
const S = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap');

:root {
  --bg:       #0c0f1a;
  --bg2:      #111520;
  --bg3:      #161b2a;
  --border:   rgba(255,255,255,.07);
  --border2:  rgba(255,255,255,.04);
  --text:     #e2e8f8;
  --muted:    #64748b;
  --sub:      #475569;
  --f-head:   'Sora', system-ui, sans-serif;
  --f-mono:   'Fira Code', monospace;
  --r:        14px;
  --r-sm:     8px;
}

.pf {
  font-family: var(--f-head);
  color: var(--text);
  background: #3da4502e;
  min-height: 100vh;
  padding: 32px 24px 64px;
}

/* ── HEADER ── */
.pf-header {
  display: flex; align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px; flex-wrap: wrap; gap: 12px;
  opacity: 0; animation: pf-up .5s ease .04s forwards;
}
.pf-eyebrow {
  font-family: var(--f-mono);
  font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
  color: #38bdf8; margin-bottom: 6px;
}
.pf-title {
  font-size: clamp(22px, 2.8vw, 32px);
  font-weight: 700; letter-spacing: -.02em;
  line-height: 1.1; color: var(--text);
}
.pf-title span { color: #38bdf8; }
.pf-count-badge {
  font-family: var(--f-mono); font-size: 11px;
  color: #38bdf8; background: rgba(56,189,248,.1);
  border: 1px solid rgba(56,189,248,.2);
  padding: 4px 12px; border-radius: 20px;
  align-self: center;
}

/* ── FILTER BAR ── */
.pf-filters {
  background: #6095ff75;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end;
  margin-bottom: 28px;
  opacity: 0; animation: pf-up .5s ease .12s forwards;
}
.pf-filter-group { display: flex; flex-direction: column; gap: 6px; min-width: 140px; }
.pf-filter-label {
  font-family: var(--f-mono); font-size: 9px;
  letter-spacing: .12em; text-transform: uppercase; color: #010101;
}
.pf-select, .pf-date {
  padding: 9px 12px;
  background: #02414c; border: 1px solid var(--border);
  border-radius: var(--r-sm); font-family: var(--f-head); font-size: 13px;
  color: var(--text); outline: none;
  transition: border-color .15s, box-shadow .15s;
  cursor: pointer;
}
.pf-select:focus, .pf-date:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56,189,248,.12);
}
.pf-select option { background: var(--bg2); }
.pf-date::-webkit-calendar-picker-indicator { filter: invert(1) opacity(.4); cursor: pointer; }

.pf-filter-btns { display: flex; gap: 8px; align-items: flex-end; }
.pf-btn {
  padding: 9px 18px; border-radius: var(--r-sm);
  font-family: var(--f-head); font-size: 13px; font-weight: 500;
  cursor: pointer; border: none; transition: all .15s;
  display: inline-flex; align-items: center; gap: 6px;
}
.pf-btn-primary {
  background: #38bdf8; color: #0c0f1a;
}
.pf-btn-primary:hover { background: #7dd3fc; transform: translateY(-1px); }
.pf-btn-ghost {
  background: rgba(255,255,255,.06); 
  border: 1px solid var(--border);
}
.pf-btn-ghost:hover { background: rgba(255,255,255,.1); color: var(--text); }

/* ── STATES ── */
.pf-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px;
  color: var(--muted); gap: 14px;
  opacity: 0; animation: pf-up .4s ease .2s forwards;
}
.pf-state-icon { font-size: 42px; opacity: .3; }
.pf-state-text { font-family: var(--f-mono); font-size: 13px; letter-spacing: .04em; }

/* ── SPINNER ── */
.pf-spin {
  width: 24px; height: 24px;
  border: 2px solid rgba(255,255,255,.1);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: pf-rotate .7s linear infinite;
}

/* ── GRID ── */
.pf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* ── CARD ── */
.pf-card {
  background: #02414c;
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  opacity: 0;
  animation: pf-up .45s cubic-bezier(.22,.68,0,1.2) forwards;
  transition: border-color .2s, transform .2s, box-shadow .2s;
  position: relative;
}
.pf-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 48px rgba(0,0,0,.35);
  border-color: rgba(255,255,255,.14);
}
.pf-card-accent {
  height: 3px; width: 100%;
}
.pf-card-head {
  padding: 18px 20px 14px;
  display: flex; align-items: center; gap: 14px;
  border-bottom: 1px solid var(--border2);
}
.pf-type-badge {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}
.pf-card-title {
  font-size: 14px; font-weight: 600;
  color: var(--text); margin-bottom: 3px;
  line-height: 1.3;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pf-card-type {
  font-family: var(--f-mono); font-size: 10px;
  letter-spacing: .08em; text-transform: uppercase;
}
.pf-card-body { padding: 14px 20px; display: flex; flex-direction: column; gap: 8px; }
.pf-row {
  display: flex; align-items: baseline; gap: 8px;
  font-size: 13px;
}
.pf-row-label {
  font-family: var(--f-mono); font-size: 9px;
  letter-spacing: .1em; text-transform: uppercase;
  color: var(--muted); flex-shrink: 0; width: 60px;
}
.pf-row-value { color: var(--text); }
.pf-row-value.muted { color: var(--sub); font-style: italic; }

.pf-card-footer {
  padding: 12px 20px 16px;
  display: flex; gap: 8px; flex-wrap: wrap;
  border-top: 1px solid var(--border2);
}

/* ── BUTTONS IN CARD ── */
.pf-action {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: var(--r-sm);
  font-family: var(--f-head); font-size: 12px; font-weight: 500;
  text-decoration: none; cursor: pointer;
  transition: all .14s; border: 1px solid transparent;
  white-space: nowrap;
}
.pf-action-detail {
  color: var(--text);
  border-color: var(--border);
  background: rgba(255,255,255,.04);
}
.pf-action-detail:hover {
  background: rgba(255,255,255,.09);
  border-color: rgba(255,255,255,.18);
  color: var(--text);
  text-decoration: none;
}
.pf-action-pdf {
  color: var(--muted);
  border-color: var(--border);
  background: transparent;
}
.pf-action-pdf:hover {
  color: var(--text);
  background: rgba(255,255,255,.05);
}

/* ── SKELETON ── */
.pf-skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px,1fr)); gap: 16px; }
.pf-skel-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 16px; padding: 20px; height: 180px;
  overflow: hidden; position: relative;
}
.pf-skel-card::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.04) 50%, transparent 100%);
  background-size: 300% 100%;
  animation: pf-shimmer 1.6s ease infinite;
}
.pf-skel-line {
  height: 11px; border-radius: 5px;
  background: rgba(255,255,255,.06); margin-bottom: 10px;
}
.pf-skel-line.w70 { width: 70%; }
.pf-skel-line.w45 { width: 45%; }
.pf-skel-line.w55 { width: 55%; }

/* ── ANIMATIONS ── */
@keyframes pf-up { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
@keyframes pf-rotate { to { transform: rotate(360deg); } }
@keyframes pf-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;

/* ── utils ── */
const normalizeType = (scan) =>
  String(scan?.type || "")
    .trim()
    .toLowerCase();

const pickDetailId = (scan, aliases = []) => {
  const chain = [
    scan?.studyReference,
    scan?.studyId,
    ...aliases.map((k) => scan?.[k]),
    scan?.sourceId,
    scan?._id,
  ];
  return chain.find((v) => v != null && String(v).trim() !== "") || null;
};

/* ══════════════════════════════════════════════════════ */
export default function PatientFileFilter() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [scans, setScans] = useState([]);
  const [studyType, setStudyType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const scanRefs = useRef({});

  /* ── Auth ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/common-for-user`, {
          withCredentials: true,
        });
        const user = res.data?.user;
        if (res.data?.authenticated && user?.role === "patient") {
          if (!cancelled) setUserId(user.userId);
        } else {
          if (!cancelled) setError(t("pf.notAuthorized"));
        }
      } catch {
        if (!cancelled) setError(t("pf.authError"));
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Fetch ── */
  const fetchScans = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/patient-profile/get-my-medical-files/files/${userId}`,
        { withCredentials: true, params: { studyType, startDate, endDate } },
      );
      const payload = res?.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      setScans(list);
    } catch {
      navigate(`/patient/patient-profile/${userId}`);
      setScans([]);
    } finally {
      setLoading(false);
    }
  }, [userId, studyType, startDate, endDate]);

  useEffect(() => {
    if (userId) fetchScans();
  }, [userId, fetchScans]);

  const resetFilters = () => {
    setStudyType("");
    setStartDate("");
    setEndDate("");
  };


  /* ── Early returns ── */
  if (authLoading)
    return (
      <div
        className="pf"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 14,
        }}
      >
        <style>{S}</style>
        <div className="pf-spin" />
        <span
          style={{
            fontFamily: "'Fira Code',monospace",
            fontSize: 13,
            color: "#64748b",
          }}
        >
          {t("pf.checkingAuth")}
        </span>
      </div>
    );

  if (error || !userId)
    return (
      <div className="pf">
        <style>{S}</style>
        <div className="pf-state">
          <div className="pf-state-icon">⛔</div>
          <div className="pf-state-text">{error || t("pf.noAccess")}</div>
        </div>
      </div>
    );

  return (
    <div className="pf">
      <style>{S}</style>

      {/* ── Header ── */}
      <div className="pf-header">
        <div>
          <div className="pf-eyebrow">{t("pf.eyebrow")}</div>
          <div className="pf-title">
            {t("pf.titlePart1")} <span>{t("pf.titlePart2")}</span>
          </div>
        </div>
        {!loading && scans.length > 0 && (
          <div className="pf-count-badge">
            {scans.length} {t("pf.records")}
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="pf-filters">
        <div className="pf-filter-group">
          <span className="pf-filter-label">{t("pf.filterType")}</span>
          <select
            className="pf-select"
            value={studyType}
            onChange={(e) => setStudyType(e.target.value)}
          >
            <option value="">{t("pf.allTypes")}</option>
            {STUDY_TYPES.map((type) => (
              <option key={type} value={type}>
                {getTypeMeta(type.toLowerCase()).label}
              </option>
            ))}
          </select>
        </div>

        <div className="pf-filter-group">
          <span className="pf-filter-label">{t("pf.filterFrom")}</span>
          <input
            type="date"
            className="pf-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="pf-filter-group">
          <span className="pf-filter-label">{t("pf.filterTo")}</span>
          <input
            type="date"
            className="pf-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="pf-filter-btns">
          <button
            className="pf-btn pf-btn-primary"
            onClick={() => fetchScans()}
          >
            🔍 {t("pf.filter")}
          </button>
          <button className="pf-btn pf-btn-ghost" onClick={resetFilters}>
            ↺ {t("pf.reset")}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="pf-skeleton-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="pf-skel-card"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div
                className="pf-skel-line w70"
                style={{ height: 14, marginBottom: 16 }}
              />
              <div className="pf-skel-line w45" />
              <div className="pf-skel-line w55" />
              <div className="pf-skel-line w45" />
            </div>
          ))}
        </div>
      ) : scans.length === 0 ? (
        <div className="pf-state">
          <div className="pf-state-icon">📭</div>
          <div className="pf-state-text">{t("pf.noRecords")}</div>
        </div>
      ) : (
        <div className="pf-grid">
          {scans.map((scan, idx) => {
            const typeStr = normalizeType(scan);
            const meta = getTypeMeta(typeStr);
            const scanKey = String(scan._id || scan.sourceId || Math.random());

            // detail IDs
            const gastroscopyDetailId = pickDetailId(scan, ["gastroscopyId"]);
            const doplerDetailId = pickDetailId(scan, [
              "doplerId",
              "dopplerId",
            ]);
            const holterDetailId = pickDetailId(scan, ["holterId"]);
            const spirometryDetailId = pickDetailId(scan, ["spirometryId"]);
            const capsuleDetailId = pickDetailId(scan, [
              "capsuleEndoscopyId",
              "capsuleId",
            ]);
            const angiographyDetailId = pickDetailId(scan, ["angiographyId"]);
            const ekgDetailId = pickDetailId(scan, [
              "ekgId",
              "EKGScanId",
              "ekgScanId",
              "studyId",
            ]);
            const echoEKGDetailId = pickDetailId(scan, [
              "echoEKGId",
              "echoekgId",
              "echoEKGScanId",
              "echoId",
              "studyId",
            ]);
            const coronographyDetailId = pickDetailId(scan, [
              "coronographyId",
              "coronographyScanId",
              "studyId",
            ]);

            // type booleans
            const isLabTest = typeStr === "labtest";
            const isCTScan = typeStr === "ctscan";
            const isMRIScan = typeStr === "mriscan";
            const isUSMScan = typeStr === "usmscan";
            const isXRAYScan = typeStr === "xrayscan" || typeStr === "xray";
            const isPETScan = typeStr === "petscan" || typeStr === "pet";
            const isSPECTScan = typeStr === "spectscan" || typeStr === "spect";
            const isEEGScan = typeStr === "eegscan" || typeStr === "eeg";
            const isSpirometryScan =
              typeStr === "spirometryscan" || typeStr === "spirometry";
            const isHolterScan =
              typeStr === "holterscan" || typeStr === "holter";
            const isGinecologyScan =
              typeStr === "ginecologyscan" || typeStr === "ginecology";
            const isDoplerScan =
              typeStr === "doplerscan" ||
              typeStr === "doppler" ||
              typeStr === "dopler";
            const isGastroscopyScan =
              typeStr === "gastroscopyscan" || typeStr === "gastroscopy";
            const isCapsuleEndoscopy = typeStr === "capsuleendoscopyscan";
            const isAngiographyScan =
              typeStr === "angiographyscan" || typeStr === "angiography";
            const isEKGScan = typeStr === "ekgscan" || typeStr === "ekg";
            const isEchoEKGScan =
              typeStr === "echoekgscan" ||
              typeStr === "echoekg" ||
              typeStr === "echo-ekg";
            const isCoronographyScan =
              typeStr === "coronographyscan" || typeStr === "coronography";

            const detailLink = (() => {
              if (isLabTest && scan._id)
                return {
                  to: `/patient/get-patient-file-detail-lab/${scan._id}`,
                  label: t("pf.openLab"),
                };
              if (isCTScan && scan._id)
                return {
                  to: `/patient/get-patient-file-detail-ct/${scan._id}`,
                  label: t("pf.openCT"),
                };
              if (isXRAYScan && scan._id)
                return {
                  to: `/patient/get-patient-file-detail-xray/${scan._id}`,
                  label: t("pf.openXRay"),
                };
              if (isMRIScan && scan._id)
                return {
                  to: `/patient/get-patient-file-detail-mri/${scan._id}`,
                  label: t("pf.openMRI"),
                };
              if (isUSMScan && scan._id)
                return {
                  to: `/patient/get-patient-file-detail-usm/${scan._id}`,
                  label: t("pf.openUSM"),
                };
              if (isPETScan && scan._id)
                return {
                  to: `/patient/get-patient-file-detail-pet-scan/${scan._id}`,
                  label: t("pf.openPET"),
                };
              if (isSPECTScan && scan._id)
                return {
                  to: `/patient/get-patient-file-detail-spect-scan/${scan._id}`,
                  label: t("pf.openSPECT"),
                };
              if (isEEGScan && scan._id)
                return {
                  to: `/patient/get-patient-file-detail-eeg-scan/${scan._id}`,
                  label: t("pf.openEEG"),
                };
              if (isGinecologyScan && scan._id)
                return {
                  to: `/patient/get-patient-file-detail-ginecology/${scan._id}`,
                  label: t("pf.openGynecology"),
                };
              if (isHolterScan && holterDetailId)
                return {
                  to: `/patient/get-patient-file-detail-holter/${holterDetailId}`,
                  label: t("pf.openHolter"),
                };
              if (isSpirometryScan && spirometryDetailId)
                return {
                  to: `/patient/get-patient-file-detail-spirometry/${spirometryDetailId}`,
                  label: t("pf.openSpirometry"),
                };
              if (isDoplerScan && doplerDetailId)
                return {
                  to: `/patient/get-patient-file-detail-dopler/${doplerDetailId}`,
                  label: t("pf.openDoppler"),
                };
              if (isGastroscopyScan && gastroscopyDetailId)
                return {
                  to: `/patient/get-patient-file-detail-gastroscopy/${gastroscopyDetailId}`,
                  label: t("pf.openGastroscopy"),
                };
              if (isCapsuleEndoscopy && capsuleDetailId)
                return {
                  to: `/patient/get-patient-file-detail-capsule-endoscopy/${capsuleDetailId}`,
                  label: t("pf.openCapsule"),
                };
              if (isAngiographyScan && angiographyDetailId)
                return {
                  to: `/patient/get-patient-file-detail-angiography-scan/${angiographyDetailId}`,
                  label: t("pf.openAngiography"),
                };
              if (isEKGScan && (ekgDetailId || scan._id))
                return {
                  to: `/patient/get-patient-file-detail-ekg-scan/${ekgDetailId}`,
                  label: t("pf.openEKG"),
                };
              if (isEchoEKGScan && (echoEKGDetailId || scan._id))
                return {
                  to: `/patient/get-patient-file-detail-echo-ekg-scan/${encodeURIComponent(echoEKGDetailId ?? scan._id)}`,
                  label: t("pf.openEchoEKG"),
                };
              if (isCoronographyScan && (coronographyDetailId || scan._id))
                return {
                  to: `/patient/get-patient-file-detail-coronography-scan/${encodeURIComponent(coronographyDetailId ?? scan._id)}`,
                  label: t("pf.openCoronography"),
                };
              return null;
            })();

            const delay = Math.min(idx * 0.05, 0.6);

            return (
              <div
                key={scanKey}
                ref={(el) => (scanRefs.current[scanKey] = el)}
                className="pf-card"
                style={{ animationDelay: `${delay}s` }}
              >
                {/* Accent line */}
                <div
                  className="pf-card-accent"
                  style={{ background: meta.color }}
                />

                {/* Head */}
                <div className="pf-card-head">
                  <div
                    className="pf-type-badge"
                    style={{
                      background: `${meta.color}1a`,
                      border: `1px solid ${meta.color}40`,
                    }}
                  >
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pf-card-title">
                      {scan.nameofexam || t("pf.noName")}
                    </div>
                    <div className="pf-card-type" style={{ color: meta.color }}>
                      {meta.label}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="pf-card-body">
                  <div className="pf-row">
                    <span className="pf-row-label">{t("pf.doctor")}</span>
                    <span className="pf-row-value">
                      {scan.doctor?.firstName ? (
                        `${scan.doctor.firstName} ${scan.doctor.lastName || ""}`.trim()
                      ) : (
                        <span className="pf-row-value muted">
                          {t("pf.unknown")}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="pf-row">
                    <span className="pf-row-label">{t("pf.date")}</span>
                    <span
                      className="pf-row-value"
                      style={{ fontFamily: "var(--f-mono)", fontSize: 12 }}
                    >
                      {scan.createdAt ? (
                        new Date(scan.createdAt).toLocaleDateString()
                      ) : (
                        <span className="pf-row-value muted">—</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pf-card-footer">
                  {detailLink && (
                    <Link
                      to={detailLink.to}
                      className="pf-action pf-action-detail"
                      style={{
                        borderColor: `${meta.color}40`,
                        color: meta.color,
                      }}
                    >
                      {detailLink.label} →
                    </Link>
                  )}
               
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
