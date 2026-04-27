import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useTranslation } from "react-i18next";

/* ─────────────────────────── CSS ─────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Lora:wght@600;700&display=swap');

.mh-root {
  --teal:#0d6b5e; --teal-dark:#094d44; --teal-mid:#0f8a7a;
  --teal-pale:#e8f7f5; --teal-border:#a3ddd5;
  --bg:#eef2f6; --surface:#fff; --surface2:#f7f9fb;
  --border:#dde4ec; --ink:#1a2533; --ink2:#3d4f63; --ink3:#7089a6;
  --red:#c0392b; --red-pale:#fef2f2; --red-border:#fca5a5;
  --sh:0 2px 12px rgba(10,30,60,.07),0 1px 3px rgba(10,30,60,.04);
  --sh-md:0 8px 32px rgba(10,30,60,.10),0 2px 8px rgba(10,30,60,.05);
  --tr:all .18s cubic-bezier(.4,0,.2,1);
  font-family:'DM Sans',system-ui,sans-serif;
  background:var(--bg); min-height:100vh; padding-bottom:64px;
}

/* ── HERO ── */
.mh-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:32px 40px 88px; position:relative; overflow:hidden;
}
.mh-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 110% 50%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 400px at -5% 130%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.mh-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:60px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.mh-hero-inner {
  position:relative; z-index:1;
  display:flex; align-items:center; gap:20px; flex-wrap:wrap; max-width:960px;
}
.mh-hero-avatar {
  width:72px; height:72px; border-radius:14px; object-fit:cover; flex-shrink:0;
  border:2.5px solid rgba(255,255,255,.3); box-shadow:0 4px 20px rgba(0,0,0,.25);
}
.mh-hero-info { flex:1; min-width:0; }
.mh-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:10px; backdrop-filter:blur(6px);
}
.mh-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; }
.mh-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(18px,2.4vw,26px); font-weight:700;
  color:#fff; line-height:1.2; margin:0 0 6px; letter-spacing:-.01em;
}
.mh-hero-sub { font-size:12px; color:rgba(255,255,255,.55); margin:0; }

/* ── BODY ── */
.mh-body { max-width:1360px; margin:-52px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .mh-body { padding:0 12px; margin-top:-36px; } }

/* ── ACTION BAR ── */
.mh-actions { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.mh-btn {
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 20px; border:none; border-radius:100px;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  cursor:pointer; transition:var(--tr); white-space:nowrap;
}
.mh-btn-primary {
  background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%);
  color:#fff; box-shadow:0 3px 14px rgba(13,107,94,.28);
}
.mh-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(13,107,94,.38); }
.mh-btn-outline {
  background:var(--surface); color:var(--teal);
  border:1.5px solid var(--teal-border);
}
.mh-btn-outline:hover { background:var(--teal-pale); }

/* ── LAYOUT ── */
.mh-layout { display:grid; grid-template-columns:1fr 220px; gap:20px; align-items:start; }
@media(max-width:860px){ .mh-layout { grid-template-columns:1fr; } }

/* ── MAIN CARD (PDF target) ── */
.mh-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:18px; box-shadow:var(--sh-md); overflow:hidden;
}
.mh-card-head {
  padding:14px 24px; background:var(--surface2); border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:10px;
}
.mh-card-head-icon {
  width:32px; height:32px; border-radius:8px; background:var(--teal-pale);
  border:1px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:15px; flex-shrink:0;
}
.mh-card-head-title { font-family:'Lora',Georgia,serif; font-size:14px; font-weight:700; color:var(--ink); flex:1; }
.mh-card-head-date { font-size:11px; color:var(--ink3); font-family:'DM Sans',sans-serif; }

/* ── SECTION DIVIDER ── */
.mh-divider {
  display:flex; align-items:center; gap:10px;
  margin:22px 24px 14px; user-select:none;
}
.mh-divider-label {
  font-size:9px; font-weight:700; letter-spacing:.13em; text-transform:uppercase;
  color:var(--ink3); white-space:nowrap;
}
.mh-divider-line { flex:1; height:1px; background:var(--border); }

/* ── ROWS ── */
.mh-row {
  display:grid; grid-template-columns:180px 1fr;
  gap:8px 16px; padding:11px 24px; border-bottom:1px solid var(--border);
  align-items:baseline;
}
.mh-row:last-child { border-bottom:none; }
@media(max-width:560px){ .mh-row { grid-template-columns:1fr; gap:3px; padding:10px 16px; } }
.mh-row-label {
  font-size:10px; font-weight:700; color:var(--ink3);
  text-transform:uppercase; letter-spacing:.07em; line-height:1.6;
}
.mh-row-value { font-size:13px; color:var(--ink); line-height:1.65; }
.mh-row-value p { margin:0 0 4px; color:var(--ink); font-size:13px; line-height:1.65; }
.mh-row-value p:last-child { margin-bottom:0; }
.mh-row-value.empty { color:var(--ink3); font-style:italic; }

/* ── DIAGNOSIS BADGE ── */
.mh-diagnosis-badge {
  display:inline-block; padding:4px 14px; border-radius:100px;
  background:var(--teal-pale); border:1.5px solid var(--teal-border);
  color:var(--teal); font-size:13px; font-weight:600; line-height:1.5;
}

/* ── SIDEBAR CARD ── */
.mh-sidebar {
  background:var(--surface); border:1px solid var(--border);
  border-radius:18px; box-shadow:var(--sh);
  padding:24px 20px; display:flex; flex-direction:column;
  align-items:center; text-align:center; gap:10px;
}
.mh-sidebar-avatar {
  width:90px; height:90px; border-radius:16px; object-fit:cover;
  border:2px solid var(--border); box-shadow:var(--sh-md);
}
.mh-sidebar-name { font-family:'Lora',Georgia,serif; font-size:16px; font-weight:700; color:var(--ink); }
.mh-sidebar-meta { font-size:11px; color:var(--ink3); line-height:1.6; }

/* ── PRINT DATE ROW ── */
.mh-print-date {
  display:flex; align-items:center; gap:8px;
  padding:10px 24px 14px; font-size:11px; color:var(--ink3);
  font-family:'DM Sans',sans-serif;
}

/* ── LOADING / ERROR ── */
.mh-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-size:13px; color:var(--ink3); }
.mh-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:mhSpin .7s linear infinite; }
@keyframes mhSpin { to{transform:rotate(360deg)} }
.mh-error { text-align:center; padding:60px 24px; color:var(--red); font-size:14px; }

/* ── PRINT STYLES ── */
@media print {
  .mh-hero, .mh-actions, .mh-sidebar { display:none !important; }
  .mh-body { margin:0; padding:0; max-width:100%; }
  .mh-layout { grid-template-columns:1fr; }
  .mh-card { box-shadow:none; border:none; border-radius:0; }
}
`;

/* ─────────────────────── HELPERS ─────────────────────── */
const MultiLine = ({ value }) => {
  if (!value)
    return <span style={{ color: "var(--ink3)", fontStyle: "italic" }}>—</span>;
  const lines = String(value).split("\n").filter(Boolean);
  if (lines.length <= 1) return <span>{value}</span>;
  return (
    <>
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </>
  );
};

/* ─────────────────────── COMPONENT ─────────────────────── */
export default function MedicalHistory() {
  const { id } = useParams();
  const { t } = useTranslation("MedicalHistory");
  const navigate = useNavigate();

  const [medicalHistory, setMedicalHistory] = useState({});
  const [patientInfo, setPatientInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState("");
  const [doctorInfo, setDoctorInfo] = useState(null);
  const pdfRef = useRef();
  const API_BASE = process.env.REACT_APP_API_URL;

  /* ── Auth ── */
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setUserId(response.data.user);
        } else {
          setIsAuthenticated(false);
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking authorization:", error);
        setIsAuthenticated(false);
        navigate("/login");
      }
    };
    checkAuthentication();
  }, [navigate, API_BASE]);

  /* ── Fetch data ── */
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(
          `${API_BASE}/clinic/patients-medical-history-get-details/${id}`,
          { withCredentials: true },
        );
        console.log("historyId from URL:", id);
        if (!isMounted) return;
        setMedicalHistory(data || {});
        setPatientInfo(data?.patientId || {});
        setDoctorInfo(data?.createdBy || null);
      } catch (err) {
        if (err?.name === "CanceledError" || axios.isCancel?.(err)) return;
        console.error("❌ Error while getting medical history:", err);
        if (isMounted) setError(t("page.error"));
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id, API_BASE, t]);

  /* ── Photo helpers ── */
  const UPLOADS_ORIGIN = (
    process.env.REACT_APP_R2_PUBLIC_URL || "https://docpats.com"
  ).replace(/\/+$/, "");
  const normalizePath = (p) =>
    String(p || "")
      .replace(/\\/g, "/")
      .replace(/^\/+|^uploads\/+/g, "");
  const toUploadsUrl = (p) => `${UPLOADS_ORIGIN}/uploads/${normalizePath(p)}`;
  const DEFAULT_UNISEX = toUploadsUrl("default/default-patient.png");
  const getPatientPhoto = (photo) =>
    !photo || photo === "" ? DEFAULT_UNISEX : photo;

  /* ── Age ── */
  const calculateAge = (birthdate) => {
    if (!birthdate) return "";
    const b = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    return t("ageText", { age });
  };

  /* ── PDF download ── */
  const downloadPDF = async () => {
    try {
      const element = document.getElementById("mh-pdf-content");
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        logging: true,
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(
        `${medicalHistory.diagnosis || "medical_history"}_medical_history.pdf`,
      );
    } catch (error) {
      console.error("Ошибка при создании PDF: ", error);
    }
  };

  /* ── PDF upload ── */
  const uploadPDF = async () => {
    const element = document.getElementById("mh-pdf-content");
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    const pdfBlob = pdf.output("blob");
    const pdfFile = new File(
      [pdfBlob],
      `${medicalHistory.diagnosis || "history"}_medical_history.pdf`,
      { type: "application/pdf" },
    );
    const formData = new FormData();
    formData.append("file", pdfFile);
    try {
      const response = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(t("pdf.uploadSuccess", { link: response.data.fileUrl }));
    } catch (error) {
      alert(t("pdf.uploadError"));
    }
  };

  /* ── Guards ── */
  if (loading)
    return (
      <div className="mh-root">
        <style>{CSS}</style>
        <div className="mh-loading">
          <div className="mh-loading-spin" />
          {t("page.loading")}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="mh-root">
        <style>{CSS}</style>
        <div className="mh-error">⚠️ {error}</div>
      </div>
    );
  if (!isAuthenticated)
    return (
      <div className="mh-root">
        <style>{CSS}</style>
        <div className="mh-loading">
          <div className="mh-loading-spin" />
          {t("page.loading")}
        </div>
      </div>
    );

  const photoSrc = getPatientPhoto(patientInfo?.photo);
  const createdAtFormatted = medicalHistory.createdAt
    ? new Date(medicalHistory.createdAt).toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  const doctorName = medicalHistory.createdBy
    ? `${medicalHistory.createdBy.firstName || t("labels.unknownDoctor")} ${medicalHistory.createdBy.lastName || ""}`.trim()
    : t("labels.unknownDoctor");

  return (
    <div className="mh-root">
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <div className="mh-hero">
        <div className="mh-hero-inner">
          <img
            src={photoSrc}
            alt="Patient"
            className="mh-hero-avatar"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_UNISEX;
            }}
          />
          <div className="mh-hero-info">
            <div className="mh-hero-tag">DocPats · Medical History</div>
            <h1 className="mh-hero-h1">
              {patientInfo.firstName} {patientInfo.lastName}
            </h1>
            <p className="mh-hero-sub">
              {t("page.extractFrom")} {createdAtFormatted}
              {patientInfo.country && ` · ${patientInfo.country}`}
            </p>
          </div>
        </div>
      </div>

      <div className="mh-body">
        {/* ── Actions ── */}
        <div className="mh-actions">
          <button className="mh-btn mh-btn-primary" onClick={downloadPDF}>
            ⬇ {t("buttons.downloadPdf")}
          </button>
          <button className="mh-btn mh-btn-outline" onClick={uploadPDF}>
            ☁ {t("buttons.uploadPdf")}
          </button>
        </div>

        <div className="mh-layout">
          {/* ── Main content (PDF target) ── */}
          <div className="mh-card" id="mh-pdf-content">
            <div className="mh-card-head">
              <span className="mh-card-head-icon">📋</span>
              <span className="mh-card-head-title">
                {t("page.extractFrom")} {createdAtFormatted}
              </span>
              <span className="mh-card-head-date">{doctorName}</span>
            </div>

            {/* Patient info section */}
            <div className="mh-divider">
              <span className="mh-divider-label">
                👤 {t("sections.patient", "Patient Info")}
              </span>
              <span className="mh-divider-line" />
            </div>

            <div className="mh-row">
              <span className="mh-row-label">{t("labels.country")}</span>
              <span className="mh-row-value">{patientInfo.country || "—"}</span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">{t("labels.age")}</span>
              <span className="mh-row-value">
                {patientInfo.birthDate
                  ? `${new Date(patientInfo.birthDate).toLocaleDateString("ru-RU")} (${calculateAge(patientInfo.birthDate)})`
                  : "—"}
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">{t("labels.allergies")}</span>
              <span className="mh-row-value">
                {patientInfo.allergies || "—"}
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">{t("labels.immunization")}</span>
              <span className="mh-row-value">
                {patientInfo.immunization || "—"}
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">
                {t("labels.chronicDiseases")}
              </span>
              <span className="mh-row-value">
                {patientInfo.chronicDiseases || "—"}
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">{t("labels.familyHistory")}</span>
              <span className="mh-row-value">
                {patientInfo.familyHistoryOfDisease || "—"}
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">{t("labels.badHabits")}</span>
              <span className="mh-row-value">
                {patientInfo.badHabits || "—"}
              </span>
            </div>

            {/* Anamnesis section */}
            <div className="mh-divider">
              <span className="mh-divider-label">
                📖 {t("sections.anamnesis", "Anamnesis")}
              </span>
              <span className="mh-divider-line" />
            </div>

            <div className="mh-row">
              <span className="mh-row-label">{t("labels.complaints")}</span>
              <span className="mh-row-value">
                <MultiLine value={medicalHistory.complaints} />
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">{t("labels.anamnesisMorbi")}</span>
              <span className="mh-row-value">
                <MultiLine value={medicalHistory.anamnesisMorbi} />
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">{t("labels.anamnesisVitae")}</span>
              <span className="mh-row-value">
                <MultiLine value={medicalHistory.anamnesisVitae} />
              </span>
            </div>

            {/* Status section */}
            <div className="mh-divider">
              <span className="mh-divider-label">
                🩺 {t("sections.status", "Status")}
              </span>
              <span className="mh-divider-line" />
            </div>

            <div className="mh-row">
              <span className="mh-row-label">{t("labels.statusPreasens")}</span>
              <span className="mh-row-value">
                <MultiLine value={medicalHistory.statusPreasens} />
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">{t("labels.statusLocalis")}</span>
              <span className="mh-row-value">
                <MultiLine value={medicalHistory.statusLocalis} />
              </span>
            </div>

            {/* Examinations section */}
            <div className="mh-divider">
              <span className="mh-divider-label">
                🔬 {t("sections.examinations", "Examinations")}
              </span>
              <span className="mh-divider-line" />
            </div>

            <div className="mh-row">
              <span className="mh-row-label">{t("labels.ctScanResults")}</span>
              <span className="mh-row-value">
                <MultiLine value={medicalHistory.ctScanResults} />
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">{t("labels.mriResults")}</span>
              <span className="mh-row-value">
                <MultiLine value={medicalHistory.mriResults} />
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">
                {t("labels.ultrasoundResults")}
              </span>
              <span className="mh-row-value">
                <MultiLine value={medicalHistory.ultrasoundResults} />
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">{t("labels.labResults")}</span>
              <span className="mh-row-value">
                <MultiLine value={medicalHistory.laboratoryTestResults} />
              </span>
            </div>

            {/* Diagnosis section */}
            <div className="mh-divider">
              <span className="mh-divider-label">
                🏥 {t("sections.diagnosis", "Diagnosis")}
              </span>
              <span className="mh-divider-line" />
            </div>

            <div className="mh-row">
              <span className="mh-row-label">{t("labels.diagnosis")}</span>
              <span className="mh-row-value">
                {medicalHistory.diagnosis ? (
                  <span className="mh-diagnosis-badge">
                    {medicalHistory.diagnosis}
                  </span>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">
                {t("labels.additionalDiagnosis")}
              </span>
              <span className="mh-row-value">
                <MultiLine value={medicalHistory.additionalDiagnosis} />
              </span>
            </div>
            <div className="mh-row">
              <span className="mh-row-label">
                {t("labels.recommendations")}
              </span>
              <span className="mh-row-value">
                <MultiLine value={medicalHistory.recommendations} />
              </span>
            </div>

            {/* Footer rows */}
            <div className="mh-divider">
              <span className="mh-divider-label">
                ℹ {t("sections.meta", "Document Info")}
              </span>
              <span className="mh-divider-line" />
            </div>

            <div className="mh-row">
              <span className="mh-row-label">{t("labels.doctor")}</span>
              <span className="mh-row-value">{doctorName}</span>
            </div>
            <div className="mh-row" style={{ borderBottom: "none" }}>
              <span className="mh-row-label">{t("labels.printDate")}</span>
              <span className="mh-row-value">
                {new Date().toLocaleString("ru-RU", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          {/* end mh-card / pdf target */}

          {/* ── Sidebar ── */}
          <div className="mh-sidebar">
            <img
              src={photoSrc}
              alt="Patient"
              className="mh-sidebar-avatar"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_UNISEX;
              }}
            />
            <div className="mh-sidebar-name">
              {patientInfo.firstName} {patientInfo.lastName}
            </div>
            {patientInfo.country && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ink3)",
                  background: "var(--surface2)",
                  padding: "3px 12px",
                  borderRadius: 100,
                  border: "1px solid var(--border)",
                }}
              >
                {patientInfo.country}
              </span>
            )}
            {patientInfo.birthDate && (
              <span className="mh-sidebar-meta">
                🎂 {calculateAge(patientInfo.birthDate)}
              </span>
            )}
            <div
              style={{
                width: "100%",
                height: 1,
                background: "var(--border)",
                margin: "8px 0",
              }}
            />
            <div
              className="mh-sidebar-meta"
              style={{ textAlign: "left", width: "100%" }}
            >
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: "var(--ink2)" }}>
                  🩺 {t("labels.doctor")}:
                </span>
                <br />
                {doctorName}
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "var(--ink2)" }}>
                  📅 {t("page.extractFrom")}:
                </span>
                <br />
                {createdAtFormatted}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
