import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SurgeryTab from "../surgery/SurgeryTab";
import { SCAN_TEST_TYPES, ENDPOINTS } from "./examConstants";

/* ─────────────────────────── CSS ─────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Lora:wght@600;700&display=swap');

.ppd-root {
  --teal:#0d6b5e; --teal-dark:#094d44; --teal-mid:#0f8a7a;
  --teal-pale:#e8f7f5; --teal-border:#a3ddd5; --teal-glow:rgba(13,107,94,.12);
  --bg:#eef2f6; --surface:#fff; --surface2:#f7f9fb;
  --border:#dde4ec; --ink:#1a2533; --ink2:#3d4f63; --ink3:#7089a6;
  --red:#c0392b; --red-pale:#fef2f2; --red-border:#fca5a5;
  --yellow:#b45309; --yellow-pale:#fffbeb; --yellow-border:#fcd34d;
  --green:#1a6b3c; --green-pale:#f0fdf4; --green-border:#86efac;
  --sh:0 2px 12px rgba(10,30,60,.07),0 1px 3px rgba(10,30,60,.04);
  --sh-md:0 8px 32px rgba(10,30,60,.10),0 2px 8px rgba(10,30,60,.05);
  --tr:all .18s cubic-bezier(.4,0,.2,1);
  font-family:'DM Sans',system-ui,sans-serif;
  background:var(--bg); min-height:100vh; padding-bottom:64px;
}

/* ── HERO ── */
.ppd-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:32px 40px 88px; position:relative; overflow:hidden;
}
.ppd-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 110% 50%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 400px at -5% 130%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.ppd-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:60px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.ppd-hero-inner { position:relative; z-index:1; display:flex; align-items:center; gap:24px; flex-wrap:wrap; }
.ppd-hero-avatar {
  width:80px; height:80px; border-radius:16px; object-fit:cover; flex-shrink:0;
  border:2.5px solid rgba(255,255,255,.3); box-shadow:0 4px 20px rgba(0,0,0,.25);
}
.ppd-hero-info { flex:1; min-width:0; }
.ppd-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:10px; backdrop-filter:blur(6px);
}
.ppd-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; flex-shrink:0; }
.ppd-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(18px,2.4vw,26px); font-weight:700;
  color:#fff; line-height:1.2; margin:0 0 6px; letter-spacing:-.01em;
}
.ppd-hero-sub { font-size:12px; color:rgba(255,255,255,.55); margin:0; }

/* ── BODY ── */
.ppd-body { max-width:1400px; margin:-52px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .ppd-body { padding:0 12px; margin-top:-36px; } }

/* ── FLASH MESSAGES ── */
.ppd-flash { display:flex; align-items:flex-start; gap:9px; padding:12px 16px; border-radius:10px; margin-bottom:14px; font-size:13px; line-height:1.55; animation:ppdFadeIn .2s ease; }
.ppd-flash.success { background:var(--green-pale); border:1.5px solid var(--green-border); color:var(--green); }
.ppd-flash.warning { background:var(--yellow-pale); border:1.5px solid var(--yellow-border); color:var(--yellow); }
@keyframes ppdFadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }

/* ── ACTION BAR ── */
.ppd-actions { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px; align-items:center; }
.ppd-btn {
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 20px; border:none; border-radius:100px;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  cursor:pointer; transition:var(--tr); text-decoration:none; white-space:nowrap;
}
.ppd-btn-primary {
  background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%);
  color:#fff; box-shadow:0 3px 14px rgba(13,107,94,.28);
}
.ppd-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(13,107,94,.38); color:#fff; }
.ppd-btn-primary:disabled { opacity:.5; cursor:not-allowed; transform:none; }
.ppd-btn-outline {
  background:var(--surface); color:var(--teal);
  border:1.5px solid var(--teal-border);
}
.ppd-btn-outline:hover { background:var(--teal-pale); color:var(--teal-dark); text-decoration:none; }

/* ── DROPDOWN ── */
.ppd-dropdown { position:relative; }
.ppd-dropdown-menu {
  display:none; position:absolute; left:0; z-index:100;
  background:var(--surface); border:1px solid var(--border); border-radius:12px;
  box-shadow:var(--sh-md); padding:8px; min-width:220px;
  max-height:380px; overflow-y:auto;
}
.ppd-dropdown:hover .ppd-dropdown-menu,
.ppd-dropdown-menu:hover { display:block; }
.ppd-dropdown-item {
  display:block; padding:7px 12px; border-radius:8px; font-size:12px;
  font-weight:500; color:var(--ink2); text-decoration:none; transition:var(--tr);
  white-space:nowrap;
}
.ppd-dropdown-item:hover { background:var(--teal-pale); color:var(--teal); text-decoration:none; }

/* ── MAIN CARD ── */
.ppd-card { background:var(--surface); border:1px solid var(--border); border-radius:18px; box-shadow:var(--sh-md); overflow:visible; margin-bottom:20px; isolation:isolate; }
.ppd-card-head { padding:14px 24px; background:var(--surface2); border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; }
.ppd-card-head-icon { width:32px; height:32px; border-radius:8px; background:var(--teal-pale); border:1px solid var(--teal-border); display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
.ppd-card-head-title { font-family:'Lora',Georgia,serif; font-size:14px; font-weight:700; color:var(--ink); }

/* ── TABS ── */
.ppd-tabs { display:flex; gap:2px; padding:16px 20px 0; border-bottom:1px solid var(--border); overflow:visible; scrollbar-width:none; background:var(--surface2); flex-wrap:wrap; }
.ppd-tabs::-webkit-scrollbar { display:none; }
.ppd-tab {
  padding:8px 16px; font-size:12px; font-weight:600; color:var(--ink3);
  background:none; border:none; border-bottom:2.5px solid transparent;
  cursor:pointer; white-space:nowrap; transition:var(--tr); border-radius:6px 6px 0 0;
  font-family:'DM Sans',sans-serif;
}
.ppd-tab:hover { color:var(--teal); background:var(--teal-pale); }
.ppd-tab.active { color:var(--teal); border-bottom-color:var(--teal); background:var(--teal-pale); }

/* ── EXAMS DROPDOWN TAB ── */
.ppd-tab-dropdown { position:relative; }
.ppd-tab-dropdown-menu {
  display:none; position:absolute; top:100%; left:0; z-index:9999;
  background:var(--surface); border:1px solid var(--border); border-radius:12px;
  box-shadow:0 -4px 24px rgba(10,30,60,.12),0 2px 8px rgba(10,30,60,.06); padding:8px; min-width:220px;
  max-height:min(360px, 60vh); overflow-y:auto;
}
.ppd-tab-dropdown:hover .ppd-tab-dropdown-menu { display:block; }
.ppd-tab-dropdown-item {
  display:block; width:100%; text-align:left; padding:7px 12px; border-radius:7px;
  font-size:12px; font-weight:500; color:var(--ink2); background:none; border:none;
  cursor:pointer; transition:var(--tr); font-family:'DM Sans',sans-serif;
}
.ppd-tab-dropdown-item:hover { background:var(--teal-pale); color:var(--teal); }

/* ── TAB CONTENT ── */
.ppd-tab-content { padding:24px; }
.ppd-tab-pane { display:none; }
.ppd-tab-pane.active { display:block; animation:ppdFadeIn .18s ease; }

/* ── INFO ROWS ── */
.ppd-info-row { display:grid; grid-template-columns:180px 1fr; gap:8px 16px; padding:11px 0; border-bottom:1px solid var(--border); align-items:baseline; }
.ppd-info-row:last-child { border-bottom:none; }
.ppd-info-label { font-size:11px; font-weight:600; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; }
.ppd-info-value { font-size:13px; color:var(--ink); line-height:1.5; }
@media(max-width:580px){ .ppd-info-row { grid-template-columns:1fr; gap:3px; } }

/* ── TABLE ── */
.ppd-table { width:100%; border-collapse:collapse; font-size:13px; }
.ppd-table th {
  text-align:left; padding:10px 14px; font-family:'DM Sans',sans-serif;
  font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
  color:var(--ink3); background:var(--surface2); border-bottom:2px solid var(--border);
}
.ppd-table td,.ppd-table tbody th {
  padding:11px 14px; border-bottom:1px solid var(--border);
  color:var(--ink2); font-weight:400; vertical-align:middle;
}
.ppd-table tbody tr:last-child td,
.ppd-table tbody tr:last-child th { border-bottom:none; }
.ppd-table tbody tr:hover td,
.ppd-table tbody tr:hover th { background:rgba(13,107,94,.03); }
.ppd-table a { color:var(--teal); text-decoration:none; font-weight:500; }
.ppd-table a:hover { text-decoration:underline; color:var(--teal-dark); }
.ppd-table-wrap { overflow-x:auto; }

/* ── PROFILE SIDEBAR CARD ── */
.ppd-profile-card {
  background:var(--surface); border:1px solid var(--border); border-radius:18px;
  box-shadow:var(--sh); padding:28px 24px; display:flex; flex-direction:column;
  align-items:center; text-align:center; gap:12px;
}
.ppd-profile-avatar {
  width:100px; height:100px; border-radius:20px; object-fit:cover;
  border:2px solid var(--border); box-shadow:var(--sh-md);
}
.ppd-profile-name { font-family:'Lora',Georgia,serif; font-size:18px; font-weight:700; color:var(--ink); }

/* ── LAYOUT ── */
.ppd-layout { display:grid; grid-template-columns:1fr 220px; gap:20px; align-items:start; }
@media(max-width:900px){ .ppd-layout { grid-template-columns:1fr; } }

/* ── LOADING ── */
.ppd-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-size:13px; color:var(--ink3); font-family:'DM Sans',sans-serif; }
.ppd-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:ppdSpin .7s linear infinite; }
@keyframes ppdSpin { to{transform:rotate(360deg)} }

/* ── ERROR BOX ── */
.ppd-error-box { display:flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; background:var(--red-pale); border:1.5px solid var(--red-border); color:var(--red); font-size:12px; margin-top:8px; }
`;

/* ─────────────────────── EXPORTED SUB-COMPONENTS ─────────────────────── */
export const Section = ({ title, children }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 12,
      padding: 16,
      boxShadow: "0 2px 8px rgba(10,30,60,.06)",
    }}
  >
    <h3 style={{ fontWeight: 600, marginBottom: 12 }}>{title}</h3>
    <div>{children}</div>
  </div>
);

export const SeverityBadge = ({ level }) => {
  const colors = { low: "#1a6b3c", moderate: "#b45309", high: "#c0392b" };
  const bgs = { low: "#f0fdf4", moderate: "#fffbeb", high: "#fef2f2" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        color: colors[level] || "#666",
        background: bgs[level] || "#f5f5f5",
      }}
    >
      Clinical Severity: {level}
    </span>
  );
};

/* ─────────────────────── SCAN TABLE ─────────────────────── */

const ScanTable = ({
  scans,
  detailPath,
  t,
  dateKey = "createdAt",
  nameKey = "diagnosis",
  extraCol = null,
}) => (
  <div className="ppd-table-wrap">
    <table className="ppd-table">
      <thead>
        <tr>
          <th>{t("tables.dateOfAdmission")}</th>
          <th>{t("tables.examName")}</th>
          <th>{extraCol ? t("tables.examResult") : t("tables.doctor")}</th>
        </tr>
      </thead>
      <tbody>
        {Array.isArray(scans) &&
          [...scans]
            .sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]))
            .map((scan) => (
              <tr key={scan._id}>
                <th
                  scope="row"
                  style={{
                    fontWeight: 500,
                    color: "var(--ink3)",
                    fontSize: 12,
                  }}
                >
                  {new Date(scan[dateKey]).toLocaleDateString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </th>
                <td>
                  <Link to={`${detailPath}/${scan._id}`}>
                    {nameKey === "testType"
                      ? SCAN_TEST_TYPES.find((tt) => tt.value === scan.testType)
                          ?.label ||
                        scan.testType ||
                        "—"
                      : scan[nameKey] || "—"}
                  </Link>
                </td>
                {extraCol && <td>{scan[extraCol] || "—"}</td>}
                {!extraCol && (
                  <td>
                    {scan.doctor?.firstName && scan.doctor?.lastName ? (
                      <Link
                        to={`/doctor/doctor-details/${scan.doctor._id}`}
                        target="_blank"
                      >
                        {scan.doctor.firstName} {scan.doctor.lastName}
                      </Link>
                    ) : (
                      <span style={{ color: "var(--ink3)" }}>
                        {t("values.unknown")}
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
      </tbody>
    </table>
  </div>
);

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
export default function PatientDetail() {
  const location = useLocation();
  const [flashMessage, setFlashMessage] = useState("");
  const [flashWarning, setFlashWarning] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation("patientDetail");
  const [patient, setPatient] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [doctorProfileInfo, setDoctorProfileInfo] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [doctorSpesilisation, setDoctorSpesilisation] = useState(null);
  const [userId, setUserId] = useState("");
  const { id } = useParams();
  const API_BASE = process.env.REACT_APP_API_URL;

  const [activeTab, setActiveTab] = useState("overview");
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [ctScans, setCtScans] = useState([]);
  const [mriScans, setMRIScans] = useState([]);
  const [usmScans, setUSMScans] = useState([]);
  const [xrayScans, setXRAYScans] = useState([]);
  const [petScans, setPETScans] = useState([]);
  const [specScans, setSPECScans] = useState([]);
  const [eegScans, setSEEGScans] = useState([]);
  const [ginecologyScans, setGinecologyScans] = useState([]);
  const [holterScans, setHolterScans] = useState([]);
  const [spirometryScans, setSpirometryScans] = useState([]);
  const [doplerScans, setDoplerScans] = useState([]);
  const [gastroscopyScans, setGastroscopyrScans] = useState([]);
  const [capsuleendoscopyScans, setCapsuleEndoscopyScans] = useState([]);
  const [angiographyScans, setAngiographyScans] = useState([]);
  const [ekgScans, setEKGScans] = useState([]);
  const [echoekgScans, setEchoEKGScans] = useState([]);
  const [coronographyScans, setCoronographyScans] = useState([]);
  const [labtestScans, setLabtestScans] = useState([]);

  const [authLoading, setAuthLoading] = useState(true);
  const [patientLoading, setPatientLoading] = useState(true);
  const [scansLoading, setScansLoading] = useState(true);
  const [error, setError] = useState(null);

  const TEST_TYPES = [
    { value: "BloodTestGeneral", label: "Общий анализ крови" },
    { value: "BloodTestBiochemistry", label: "Биохимия" },
    { value: "UrineTest", label: "Анализ мочи" },
    { value: "StoolTest", label: "Анализ кала" },
    { value: "HormonePanel", label: "Гормоны" },
    { value: "TumorMarkers", label: "Онкомаркеры" },
    { value: "PCR", label: "ПЦР" },
    { value: "Immunology", label: "Иммунология" },
    { value: "GeneticScreening", label: "Генетический скрининг" },
    { value: "Other", label: "Другое" },
  ];

  const printGender = (v) => {
    const raw = String(v ?? "")
      .trim()
      .toLowerCase();
    if (!raw) return "—";
    if (
      ["male", "man", "m", "erkek", "kişi", "м", "муж", "мужчина"].includes(raw)
    )
      return "Man";
    if (
      [
        "female",
        "woman",
        "f",
        "kadin",
        "qadın",
        "ж",
        "жен",
        "женщина",
      ].includes(raw)
    )
      return "Woman";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return "";
    const b = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    return `${age} лет`;
  };

  const UPLOADS_ORIGIN = (process.env.REACT_APP_R2_PUBLIC_URL || "").replace(
    /\/+$/,
    "",
  );
  const normalizePath = (p) =>
    String(p || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/^uploads\/+/, "");
  const toUploadsUrl = (p) => `${UPLOADS_ORIGIN}/uploads/${normalizePath(p)}`;
  const DEFAULT_UNISEX = toUploadsUrl("default/default-patient.png");

  function getPatientPhotoSrc(pat) {
    const p = pat?.photo;
    if (!p || typeof p !== "string" || p.trim() === "") return DEFAULT_UNISEX;
    const isAbsolute = /^https?:\/\//i.test(p);
    const isR2 = /r2\.dev|cloudflarestorage\.com/i.test(p);
    if (isAbsolute && isR2) return p;
    if (isAbsolute && !isR2) return DEFAULT_UNISEX;
    return toUploadsUrl(p);
  }
  /* ── Открыть чат с пациентом ── */
  const [chatLoading, setChatLoading] = useState(false);

  const openChatWithPatient = async () => {
    const peerUserId =
      patient?.linkedUserId?._id || patient?.linkedUserId || null;

    if (!peerUserId) {
      setFlashWarning(
        "У пациента нет привязанного аккаунта DocPats — чат недоступен.",
      );
      return;
    }

    try {
      setChatLoading(true);
      const { data } = await axios.post(
        `${API_BASE}/communication/dialogs/with-user`,
        { peerUserId },
        { withCredentials: true },
      );
      const dialogId = data?.dialog?._id;
      if (!dialogId) {
        setFlashWarning("Не удалось получить диалог.");
        return;
      }
      navigate(`/doctor/communication/${dialogId}`);
    } catch (err) {
      console.error("Ошибка открытия чата:", err);
      setFlashWarning("Ошибка при открытии чата с пациентом.");
    } finally {
      setChatLoading(false);
    }
  };
  /* ── Effects ── */
  useEffect(() => {
    if (location.state?.success) setFlashMessage(t("examAddedSuccess"));
    if (location.state?.warning) setFlashWarning(location.state.warning);
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (!res.data.authenticated) {
          navigate("/login");
          return;
        }
        setIsAuthenticated(true);
        setUserId(res.data.user);
      } catch {
        navigate("/login");
      } finally {
        setAuthLoading(false);
      }
    };
    check();
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchPatient = async () => {
      try {
        setPatientLoading(true);
        const { data } = await axios.get(
          `${API_BASE}/clinic/patient-details/${id}`,
          { withCredentials: true },
        );
        setPatient(data);
      } finally {
        setPatientLoading(false);
      }
    };
    fetchPatient();
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!patient?._id || !id) return;
    let isMounted = true;
    const fetchScans = async () => {
      setScansLoading(true);
      setError("");
      try {
        const endpoints = ENDPOINTS;
        const results = await Promise.allSettled(
          endpoints.map((e) =>
            axios.get(`${API_BASE}/clinic/get-examinations/${e}/list/${id}`, {
              withCredentials: true,
            }),
          ),
        );
        if (!isMounted) return;
        const g = (i) =>
          results[i]?.status === "fulfilled"
            ? results[i].value?.data?.data || []
            : [];
        setCtScans(g(0));
        setMRIScans(g(1));
        setUSMScans(g(2));
        setXRAYScans(g(3));
        setPETScans(g(4));
        setSPECScans(g(5));
        setSEEGScans(g(6));
        setGinecologyScans(g(7));
        setHolterScans(g(8));
        setSpirometryScans(g(9));
        setDoplerScans(g(10));
        setGastroscopyrScans(g(11));
        setCapsuleEndoscopyScans(g(12));
        setAngiographyScans(g(13));
        setEKGScans(g(14));
        setEchoEKGScans(g(15));
        setCoronographyScans(g(16));
        setLabtestScans(g(17));
      } catch (err) {
        if (isMounted) setError("Failed to load examinations");
      } finally {
        if (isMounted) setScansLoading(false);
      }
    };
    fetchScans();
    return () => {
      isMounted = false;
    };
  }, [patient?._id, id, API_BASE]);

  useEffect(() => {
    if (!id) return;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/clinic/patients-medical-history-get/${id}`,
          { withCredentials: true },
        );
        setMedicalHistory(res.data.medicalHistory || []);
        setDoctorInfo(res.data.doctor || null);
        setDoctorProfileInfo(res.data.doctorProfile || null);
        setDoctorSpesilisation(res.data.doctorSpecialization || null);
      } catch {}
    };
    fetchHistory();
  }, [id]);

  /* ── Guards ── */
  if (authLoading || patientLoading) {
    return (
      <div className="ppd-root">
        <style>{CSS}</style>
        <div className="ppd-loading">
          <div className="ppd-loading-spin" />
          {t("buttons.loadingPatient")}...
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (!patient) {
    return (
      <div className="ppd-root">
        <style>{CSS}</style>
        <div className="ppd-loading">{t("buttons.PatientNotFound")}</div>
      </div>
    );
  }

  const photoSrc = getPatientPhotoSrc(patient);
  const pid = patient?._id || "defaultPatientId";

  /* ── Exam tabs config ── */
  const examTabs = [
    {
      id: "ct",
      label: t("tabs.ctScan"),
      scans: ctScans,
      path: "/dp/details-ct-scan-results",
    },
    {
      id: "mri",
      label: t("tabs.mri"),
      scans: mriScans,
      path: "/dp/details-mri-scan-results",
    },
    {
      id: "usm",
      label: t("tabs.ultrasound"),
      scans: usmScans,
      path: "/dp/details-usm-scan-results",
    },
    {
      id: "xray",
      label: t("tabs.xray"),
      scans: xrayScans,
      path: "/dp/details-xray-scan-results",
    },
    {
      id: "pet",
      label: t("tabs.petScan"),
      scans: petScans,
      path: "/dp/details-pet-scan-results",
    },
    {
      id: "spect",
      label: t("tabs.spectScan"),
      scans: specScans,
      path: "/dp/details-spect-scan-results",
    },
    {
      id: "eeg",
      label: t("tabs.eeg"),
      scans: eegScans,
      path: "/dp/details-eeg-scan-results",
    },
    {
      id: "gynecology",
      label: t("tabs.gynecology"),
      scans: ginecologyScans,
      path: "/dp/details-ginecology-test-results",
    },
    {
      id: "holter",
      label: t("tabs.holterMonitor"),
      scans: holterScans,
      path: "/dp/details-holter-scan-results",
    },
    {
      id: "spirometry",
      label: t("tabs.spirometry"),
      scans: spirometryScans,
      path: "/dp/details-spirometry-scan-results",
    },
    {
      id: "doppler",
      label: t("tabs.dopplerScan"),
      scans: doplerScans,
      path: "/dp/details-dopler-scan-results",
    },
    {
      id: "gastroscopy",
      label: t("tabs.gastroscopy"),
      scans: gastroscopyScans,
      path: "/dp/details-gastroscopy-scan-results",
    },
    {
      id: "capsule",
      label: t("tabs.capsuleEndoscopy"),
      scans: capsuleendoscopyScans,
      path: "/dp/details-capsule-endoscopy-scan-results",
    },
    {
      id: "angiography",
      label: t("tabs.angiography"),
      scans: angiographyScans,
      path: "/dp/details-angiography-scan-results",
    },
    {
      id: "ekg",
      label: t("tabs.ekg"),
      scans: ekgScans,
      path: "/dp/details-ekg-scan-results",
    },
    {
      id: "echoekg",
      label: t("tabs.echoEkg"),
      scans: echoekgScans,
      path: "/dp/details-echo-ekg-scan-results",
    },
    {
      id: "coronography",
      label: t("tabs.coronography"),
      scans: coronographyScans,
      path: "/dp/details-coronography-scan-results",
    },
    {
      id: "labtest",
      label: t("tabs.labTests"),
      scans: labtestScans,
      path: "/dp/details-labtest-scan-results",
      dateKey: "date",
      nameKey: "testType",
      extraCol: "labName",
    },
  ];

  const examAddLinks = [
    {
      label: t("tabs.ctScan"),
      to: `/dp/add-ct-scan-upload/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.mri"),
      to: `/dp/add-mri-scan-upload/NewPatientPolyclinic/${pid}`,
    },
    { label: t("tabs.ultrasound"), to: `/dp/add-usm-scan-results/${pid}` },
    { label: t("tabs.xray"), to: `/dp/add-xray-scan-results/${pid}` },
    { label: t("tabs.petScan"), to: `/dp/add-pet-scan-results/${pid}` },
    {
      label: t("tabs.spectScan"),
      to: `/dp/add-spect-scan/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.eeg"),
      to: `/dp/add-eeg-scan-results/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.gynecology"),
      to: `/dp/add-ginecology-test-results/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.holterMonitor"),
      to: `/dp/add-holter-scan-results/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.spirometry"),
      to: `/dp/add-spirometry-scan-results/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.dopplerScan"),
      to: `/dp/add-dopler-scan-results/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.gastroscopyColonoscopy"),
      to: `/dp/add-gastroscopy-scan-results/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.capsuleEndoscopy"),
      to: `/dp/add-capsule-endoscopy-scan-results/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.angiography"),
      to: `/dp/add-angiography-scan-results/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.ekg"),
      to: `/dp/add-ekg-scan-results/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.echoEkg"),
      to: `/dp/add-echo-ekg-scan-results/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.coronography"),
      to: `/dp/add-coronography-scan-results/NewPatientPolyclinic/${pid}`,
    },
    {
      label: t("tabs.labTests"),
      to: `/dp/add-labtest-results/NewPatientPolyclinic/${pid}`,
    },
  ];

  return (
    <div className="ppd-root">
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <div className="ppd-hero">
        <div className="ppd-hero-inner">
          <img
            src={photoSrc}
            alt="Profile"
            className="ppd-hero-avatar"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_UNISEX;
            }}
          />
          <div className="ppd-hero-info">
            <div className="ppd-hero-tag">DocPats · Patient</div>
            <h1 className="ppd-hero-h1">
              {t("titles.moreAboutPatient", {
                firstName: patient.firstName,
                lastName: patient.lastName,
              })}
            </h1>
            <p className="ppd-hero-sub">
              {patient.country && `${patient.country} · `}
              {calculateAge(patient.birthDate)}
              {patient.bio && ` · ${printGender(patient.bio)}`}
            </p>
          </div>
        </div>
      </div>

      <div className="ppd-body">
        {/* ── Flash messages ── */}
        {flashWarning && (
          <div className="ppd-flash warning">⚠️ {flashWarning}</div>
        )}
        {flashMessage && (
          <div className="ppd-flash success">✓ {flashMessage}</div>
        )}

        {/* ── Action bar ── */}
        <div className="ppd-actions">
          <Link
            to={`/dp/add-patient-medical-history/${id}`}
            className="ppd-btn ppd-btn-primary"
          >
            📋 {t("buttons.addMedicalHistory")}
          </Link>

          <div className="ppd-dropdown">
            <button className="ppd-btn ppd-btn-outline">
              🔬 {t("buttons.addMedicalExamination")} ▾
            </button>
            <div className="ppd-dropdown-menu">
              {examAddLinks.map((item) => (
                <Link key={item.to} to={item.to} className="ppd-dropdown-item">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <button
            className="ppd-btn ppd-btn-primary"
            onClick={() => navigate(`/dp/patient/${id}/clinical-summary`)}
            disabled={scansLoading}
          >
            🧠{" "}
            {scansLoading
              ? t("buttons.loadingExaminations")
              : t("buttons.addGenerateClinicalSummary")}
          </button>
          <button
            className="ppd-btn ppd-btn-outline"
            onClick={() =>
              navigate(
                `/dp/surgery/new?patientType=registered&patientId=${pid}`,
              )
            }
          >
            🔪 Создать хирургический кейс
          </button>
          <button
            className="ppd-btn ppd-btn-outline"
            onClick={openChatWithPatient}
            disabled={chatLoading}
          >
            💬 {chatLoading ? "Открываю…" : "Написать пациенту"}
          </button>
          {error && <div className="ppd-error-box">⚠ {error}</div>}
        </div>

        {/* ── Main layout ── */}
        <div className="ppd-layout">
          {/* ── Left: tabbed card ── */}
          <div className="ppd-card">
            <div className="ppd-card-head">
              <div className="ppd-card-head-icon">📁</div>
              <span className="ppd-card-head-title">
                {t("titles.patientCard")}
              </span>
            </div>

            {/* Tabs */}
            <div className="ppd-tabs">
              {[
                { id: "overview", label: t("tabs.generalInfo") },
                { id: "clinical", label: t("tabs.clinicalInfo") },
                { id: "history", label: t("tabs.caseHistories") },
                { id: "surgery", label: "Хирургия" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`ppd-tab${activeTab === tab.id ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}

              {/* Examinations dropdown tab */}
              <div className="ppd-tab-dropdown">
                <button
                  className={`ppd-tab${examTabs.some((e) => e.id === activeTab) ? " active" : ""}`}
                >
                  {t("tabs.conductedExaminations")} ▾
                </button>
                <div className="ppd-tab-dropdown-menu">
                  {examTabs.map((tab) => (
                    <button
                      key={tab.id}
                      className="ppd-tab-dropdown-item"
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab content */}
            <div className="ppd-tab-content">
              {/* General Info */}
              <div
                className={`ppd-tab-pane${activeTab === "overview" ? " active" : ""}`}
              >
                {[
                  {
                    label: t("generalInfo.firstName"),
                    value: patient.firstName,
                  },
                  { label: t("generalInfo.lastName"), value: patient.lastName },
                  {
                    label: t("generalInfo.gender"),
                    value: printGender(
                      patient.bio ??
                        patient.sex ??
                        patient.Sex ??
                        patient.Gender,
                    ),
                  },
                  {
                    label: t("generalInfo.age"),
                    value: `${new Date(patient.birthDate).toLocaleDateString("ru-RU")} (${t("generalInfo.ageWithYears", { count: calculateAge(patient.birthDate) })})`,
                  },
                  { label: t("generalInfo.country"), value: patient.country },
                  { label: t("generalInfo.phone"), value: patient.phoneNumber },
                  {
                    label: t("generalInfo.dpMessengerNumber"),
                    value: patient.phoneNumber,
                  },
                  { label: t("generalInfo.email"), value: patient.email },
                ].map(({ label, value }) => (
                  <div className="ppd-info-row" key={label}>
                    <span className="ppd-info-label">{label}</span>
                    <span className="ppd-info-value">{value || "—"}</span>
                  </div>
                ))}
              </div>

              {/* Clinical Info */}
              <div
                className={`ppd-tab-pane${activeTab === "clinical" ? " active" : ""}`}
              >
                <div style={{ marginBottom: 16 }}>
                  <span
                    style={{
                      fontFamily: "'Lora',Georgia,serif",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    {t("tabs.clinicalInfo")}
                  </span>
                </div>
                {[
                  {
                    label: t("clinicalInfo.chronicDiseases"),
                    value: patient.chronicDiseases,
                  },
                  {
                    label: t("clinicalInfo.operations"),
                    value: patient.operations,
                  },
                  {
                    label: t("clinicalInfo.familyHistory"),
                    value: patient.familyHistoryOfDisease,
                  },
                  {
                    label: t("clinicalInfo.allergies"),
                    value: patient.allergies,
                  },
                  {
                    label: t("clinicalInfo.immunization"),
                    value: patient.immunization,
                  },
                  {
                    label: t("clinicalInfo.badHabits"),
                    value: patient.badHabits,
                  },
                ].map(({ label, value }) => (
                  <div className="ppd-info-row" key={label}>
                    <span className="ppd-info-label">{label}</span>
                    <span className="ppd-info-value">{value || "—"}</span>
                  </div>
                ))}
              </div>
              {activeTab === "surgery" && (
                <SurgeryTab patientId={pid} patientType="registered" />
              )}
              {/* Case Histories */}
              <div
                className={`ppd-tab-pane${activeTab === "history" ? " active" : ""}`}
              >
                <div className="ppd-table-wrap">
                  <table className="ppd-table">
                    <thead>
                      <tr>
                        <th>{t("tables.date")}</th>
                        <th>{t("tables.diagnosis")}</th>
                        <th>{t("tables.doctor")}</th>
                        <th>{t("tables.speciality")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicalHistory.map((mh) => (
                        <tr key={mh._id}>
                          <th
                            scope="row"
                            style={{
                              fontWeight: 500,
                              color: "var(--ink3)",
                              fontSize: 12,
                            }}
                          >
                            {new Date(mh.createdAt).toLocaleDateString(
                              "ru-RU",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )}
                          </th>
                          <td>
                            <Link
                              to={`/dp/patient-polyclinic-medical-history/${mh._id}`}
                            >
                              {mh.diagnosis}
                            </Link>
                          </td>
                          <td>
                            <Link
                              to={`/doctor/doctor-details/${mh.createdBy?._id}`}
                              target="_blank"
                            >
                              {mh.createdBy?.firstName} {mh.createdBy?.lastName}
                            </Link>
                          </td>
                          <td style={{ color: "var(--ink3)" }}>
                            {mh.createdBy?.specialization ||
                              t("values.unknown")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exam tabs — rendered from config */}
              {examTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`ppd-tab-pane${activeTab === tab.id ? " active" : ""}`}
                >
                  <ScanTable
                    scans={tab.scans}
                    detailPath={tab.path}
                    t={t}
                    dateKey={tab.dateKey || "createdAt"}
                    nameKey={tab.nameKey || "diagnosis"}
                    extraCol={tab.extraCol || null}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: profile sidebar ── */}
          <div>
            <div className="ppd-profile-card">
              <img
                src={photoSrc}
                alt="Profile"
                className="ppd-profile-avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_UNISEX;
                }}
              />
              <div className="ppd-profile-name">
                {patient?.firstName} {patient?.lastName}
              </div>
              {patient.country && (
                <div style={{ fontSize: 12, color: "var(--ink3)" }}>
                  {patient.country}
                </div>
              )}
              {patient.birthDate && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink3)",
                    background: "var(--teal-pale)",
                    padding: "4px 12px",
                    borderRadius: 100,
                    border: "1px solid var(--teal-border)",
                  }}
                >
                  {calculateAge(patient.birthDate)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
