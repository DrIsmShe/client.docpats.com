import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";

/* ─────────────────────────── CSS ─────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Lora:wght@600;700&display=swap');

.cap-root {
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
.cap-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:32px 40px 88px; position:relative; overflow:hidden;
}
.cap-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 110% 50%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 400px at -5% 130%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.cap-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:60px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.cap-hero-inner { position:relative; z-index:1; max-width:960px; }
.cap-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:12px; backdrop-filter:blur(6px);
}
.cap-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; }
.cap-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(18px,2.4vw,26px); font-weight:700;
  color:#fff; line-height:1.2; margin:0 0 8px; letter-spacing:-.01em;
}
.cap-hero-sub { font-size:12px; color:rgba(255,255,255,.55); margin:0; }

/* ── BODY ── */
.cap-body { max-width:960px; margin:-52px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .cap-body { padding:0 12px; margin-top:-36px; } }

/* ── ACTIONS ── */
.cap-actions { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.cap-btn {
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 20px; border:none; border-radius:100px;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  cursor:pointer; transition:var(--tr); white-space:nowrap;
}
.cap-btn-primary { background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%); color:#fff; box-shadow:0 3px 14px rgba(13,107,94,.28); }
.cap-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(13,107,94,.38); }
.cap-btn-outline { background:var(--surface); color:var(--teal); border:1.5px solid var(--teal-border); }
.cap-btn-outline:hover { background:var(--teal-pale); }
.cap-btn-ghost { background:var(--surface2); color:var(--ink2); border:1.5px solid var(--border); }
.cap-btn-ghost:hover { background:var(--border); }

/* ── CARD ── */
.cap-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:18px; box-shadow:var(--sh-md); overflow:hidden; margin-bottom:20px;
}
.cap-card-head {
  padding:14px 24px; background:var(--surface2); border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:10px;
}
.cap-card-head-icon {
  width:32px; height:32px; border-radius:8px; background:var(--teal-pale);
  border:1px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:15px; flex-shrink:0;
}
.cap-card-head-title { font-family:'Lora',Georgia,serif; font-size:14px; font-weight:700; color:var(--ink); flex:1; }

/* ── DIVIDER ── */
.cap-divider { display:flex; align-items:center; gap:10px; margin:20px 24px 12px; }
.cap-divider-label { font-size:9px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--ink3); white-space:nowrap; }
.cap-divider-line { flex:1; height:1px; background:var(--border); }

/* ── ROWS ── */
.cap-row {
  display:grid; grid-template-columns:1fr;
  gap:3px; padding:12px 24px; border-bottom:1px solid var(--border);
}
.cap-row:last-child { border-bottom:none; }
.cap-row-label { font-size:10px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; line-height:1.6; }
.cap-row-value { font-size:13px; color:var(--ink); line-height:1.65; }

/* ── BADGE ── */
.cap-badge-yes { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); }
.cap-badge-no  { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--surface2); border:1.5px solid var(--border); color:var(--ink3); }
.cap-diagnosis-badge { display:inline-block; padding:4px 14px; border-radius:100px; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); font-size:13px; font-weight:600; }

/* ── IMAGES GRID ── */
.cap-images { padding:16px 24px 20px; }
.cap-images-title { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--ink3); margin-bottom:12px; }
.cap-images-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; }
.cap-img-wrap {
  border-radius:10px; overflow:hidden; border:1.5px solid var(--border);
  background:var(--surface2); aspect-ratio:1; cursor:pointer;
  transition:var(--tr); box-shadow:var(--sh);
}
.cap-img-wrap:hover { border-color:var(--teal-border); box-shadow:0 4px 16px rgba(13,107,94,.18); transform:translateY(-2px); }
.cap-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; }

/* ── COMMENTS ── */
.cap-comments { padding:0 24px 20px; }
.cap-comment {
  display:flex; gap:12px; padding:14px 16px; border-radius:10px;
  background:var(--surface2); border:1px solid var(--border); margin-bottom:10px;
}
.cap-comment:last-child { margin-bottom:0; }
.cap-comment-avatar {
  width:36px; height:36px; border-radius:9px; background:var(--teal-pale);
  border:1.5px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:16px; flex-shrink:0;
}
.cap-comment-body { flex:1; min-width:0; }
.cap-comment-meta { display:flex; align-items:center; gap:8px; margin-bottom:5px; flex-wrap:wrap; }
.cap-comment-name { font-size:13px; font-weight:600; color:var(--ink); }
.cap-comment-date { font-size:11px; color:var(--ink3); font-family:'DM Sans',sans-serif; }
.cap-comment-text { font-size:13px; color:var(--ink2); line-height:1.65; }

/* ── LOADING / ERROR ── */
.cap-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-size:13px; color:var(--ink3); }
.cap-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:ctSpin .7s linear infinite; }
@keyframes ctSpin { to{transform:rotate(360deg)} }
.cap-error { text-align:center; padding:60px 24px; color:var(--red); font-size:14px; }

/* ── LIGHTBOX ── */
.cap-lightbox {
  position:fixed; inset:0; background:rgba(10,20,40,.85); z-index:9999;
  display:flex; align-items:center; justify-content:center; padding:24px;
  backdrop-filter:blur(6px); animation:ctFadeIn .18s ease;
}
@keyframes ctFadeIn { from{opacity:0} to{opacity:1} }
.cap-lightbox img { max-width:90vw; max-height:88vh; border-radius:12px; box-shadow:0 24px 80px rgba(0,0,0,.5); }
.cap-lightbox-close {
  position:absolute; top:20px; right:20px; width:36px; height:36px;
  border-radius:50%; background:rgba(255,255,255,.15); border:none;
  color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center;
  justify-content:center; transition:var(--tr);
}
.cap-lightbox-close:hover { background:rgba(255,255,255,.3); }

/* ── PRINT ── */
@media print {
  .cap-hero, .cap-actions { display:none !important; }
  .cap-body { margin:0; padding:0; max-width:100%; }
  .cap-card { box-shadow:none; border:none; border-radius:0; }
}
`;

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function CapsuleEndoscopyScanerDetails() {
  const { id } = useParams();
  const { t } = useTranslation("CapsuleEndoscopyScanerTemplateAdd");

  const [gastroscopyData, setGastroscopyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  /* ── Fetch ── */
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/clinic/get-detail-examinations/CapsuleEndoscopyScaner/detail/${id}`,
          { withCredentials: true },
        );
        setGastroscopyData(response.data);
      } catch (err) {
        setError(t("CapsuleEndoscopyScanerDetails.page.errors.fetchError"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, t]);

  /* ── PDF download ── */
  const downloadPDF = async () => {
    try {
      const element = document.getElementById("cap-pdf-content");
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(
        `${gastroscopyData?.diagnosis || "medical_history"}_medical_history.pdf`,
      );
    } catch (error) {
      console.error("Error creating PDF: ", error);
    }
  };

  /* ── PDF upload ── */
  const uploadPDF = async () => {
    try {
      const element = document.getElementById("cap-pdf-content");
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File(
        [pdfBlob],
        `${gastroscopyData?.diagnosis || "medical_history"}_medical_history.pdf`,
        { type: "application/pdf" },
      );
      const formData = new FormData();
      formData.append("file", pdfFile);
      const response = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(
        `${t("CapsuleEndoscopyScanerDetails.page.messages.uploadSuccess")} ${response.data.fileUrl}`,
      );
    } catch (error) {
      console.error("PDF upload error:", error);
      alert(t("CapsuleEndoscopyScanerDetails.page.messages.uploadError"));
    }
  };

  const printPage = () => window.print();

  /* ── Guards ── */
  if (loading)
    return (
      <div className="cap-root">
        <style>{CSS}</style>
        <div className="cap-loading">
          <div className="cap-loading-spin" />
          {t("CapsuleEndoscopyScanerDetails.page.loading")}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="cap-root">
        <style>{CSS}</style>
        <div className="cap-error">⚠️ {error}</div>
      </div>
    );
  if (!gastroscopyData)
    return (
      <div className="cap-root">
        <style>{CSS}</style>
        <div className="cap-error">
          {t("CapsuleEndoscopyScanerDetails.page.noData")}
        </div>
      </div>
    );

  const dateFormatted = gastroscopyData.date
    ? new Date(gastroscopyData.date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";
  const doctorName = gastroscopyData.doctor
    ? `${gastroscopyData.doctor.firstName || ""} ${gastroscopyData.doctor.lastName || ""}`.trim()
    : "—";
  const patientName =
    gastroscopyData?.patientId?.fullName ||
    t("CapsuleEndoscopyScanerDetails.page.noData");

  return (
    <div className="cap-root">
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <div className="cap-hero">
        <div className="cap-hero-inner">
          <div className="cap-hero-tag">DocPats · Capsule Endoscopy</div>
          <h1 className="cap-hero-h1">
            {t("CapsuleEndoscopyScanerDetails.page.title")}
          </h1>
          <p className="cap-hero-sub">
            {patientName} · {dateFormatted}
            {doctorName !== "—" && ` · ${doctorName}`}
          </p>
        </div>
      </div>

      <div className="cap-body">
        {/* ── Actions ── */}
        <div className="cap-actions">
          <button className="cap-btn cap-btn-primary" onClick={downloadPDF}>
            ⬇ {t("CapsuleEndoscopyScanerDetails.buttons.download")}
          </button>
          <button className="cap-btn cap-btn-outline" onClick={uploadPDF}>
            ☁ {t("CapsuleEndoscopyScanerDetails.buttons.upload")}
          </button>
          <button className="cap-btn cap-btn-ghost" onClick={printPage}>
            🖨 {t("CapsuleEndoscopyScanerDetails.buttons.print")}
          </button>
        </div>

        {/* ── Main card (PDF target) ── */}
        <div className="cap-card" id="cap-pdf-content">
          <div className="cap-card-head">
            <span className="cap-card-head-icon">💊</span>
            <span className="cap-card-head-title">
              {t("CapsuleEndoscopyScanerDetails.page.title")}
            </span>
          </div>

          {/* General info */}
          <div className="cap-divider">
            <span className="cap-divider-label">
              👤{" "}
              {t(
                "CapsuleEndoscopyScanerDetails.sections.general",
                "General Info",
              )}
            </span>
            <span className="cap-divider-line" />
          </div>

          <div className="cap-row">
            <span className="cap-row-label">
              {t("CapsuleEndoscopyScanerDetails.fields.patient")}
            </span>
            <span className="cap-row-value">{patientName}</span>
          </div>
          <div className="cap-row">
            <span className="cap-row-label">
              {t("CapsuleEndoscopyScanerDetails.fields.doctor")}
            </span>
            <span className="cap-row-value">{doctorName}</span>
          </div>
          <div className="cap-row">
            <span className="cap-row-label">
              {t("CapsuleEndoscopyScanerDetails.fields.date")}
            </span>
            <span className="cap-row-value">{dateFormatted}</span>
          </div>
          <div className="cap-row">
            <span className="cap-row-label">
              {t("CapsuleEndoscopyScanerDetails.fields.nameofexam")}
            </span>
            <span className="cap-row-value">
              {gastroscopyData.nameofexam || "—"}
            </span>
          </div>
          <div className="cap-row">
            <span className="cap-row-label">
              {t("CapsuleEndoscopyScanerDetails.fields.contrastUsed")}
            </span>
            <span className="cap-row-value">
              {gastroscopyData.contrastUsed ? (
                <span className="cap-badge-yes">
                  ✓ {t("CapsuleEndoscopyScanerDetails.fields.yes")}
                </span>
              ) : (
                <span className="cap-badge-no">
                  ✗ {t("CapsuleEndoscopyScanerDetails.fields.no")}
                </span>
              )}
            </span>
          </div>

          {/* Findings */}
          <div className="cap-divider">
            <span className="cap-divider-label">
              🔬{" "}
              {t("CapsuleEndoscopyScanerDetails.sections.findings", "Findings")}
            </span>
            <span className="cap-divider-line" />
          </div>

          <div className="cap-row">
            <span className="cap-row-label">
              {t("CapsuleEndoscopyScanerDetails.fields.diagnosis")}
            </span>
            <span className="cap-row-value">
              {gastroscopyData.diagnosis ? (
                <span className="cap-diagnosis-badge">
                  {gastroscopyData.diagnosis}
                </span>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="cap-row">
            <span className="cap-row-label">
              {t("CapsuleEndoscopyScanerDetails.fields.report")}
            </span>
            <span className="cap-row-value" style={{ whiteSpace: "pre-wrap" }}>
              {gastroscopyData.report || "—"}
            </span>
          </div>
          <div
            className="cap-row"
            style={{
              borderBottom: gastroscopyData?.images?.length
                ? "1px solid var(--border)"
                : "none",
            }}
          >
            <span className="cap-row-label">
              {t("CapsuleEndoscopyScanerDetails.fields.recomandation")}
            </span>
            <span className="cap-row-value" style={{ whiteSpace: "pre-wrap" }}>
              {gastroscopyData.recomandation || "—"}
            </span>
          </div>

          {/* Images */}
          {gastroscopyData?.images?.length > 0 && (
            <>
              <div className="cap-divider">
                <span className="cap-divider-label">
                  🖼 {t("CapsuleEndoscopyScanerDetails.fields.images")}
                </span>
                <span className="cap-divider-line" />
              </div>
              <div className="cap-images">
                <div className="cap-images-grid">
                  {gastroscopyData.images.map((img, index) => (
                    <div
                      key={index}
                      className="cap-img-wrap"
                      onClick={() => setLightboxImg(img)}
                    >
                      <img src={img} alt={`Image ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Doctor comments */}
          {gastroscopyData?.doctorComments?.length > 0 && (
            <>
              <div className="cap-divider">
                <span className="cap-divider-label">
                  💬 {t("CapsuleEndoscopyScanerDetails.fields.doctorComments")}
                </span>
                <span className="cap-divider-line" />
              </div>
              <div className="cap-comments">
                {gastroscopyData.doctorComments.map((comment, index) => (
                  <div key={index} className="cap-comment">
                    <div className="cap-comment-avatar">👨‍⚕️</div>
                    <div className="cap-comment-body">
                      <div className="cap-comment-meta">
                        <span className="cap-comment-name">
                          {comment.doctor?.firstName} {comment.doctor?.lastName}
                        </span>
                        <span className="cap-comment-date">
                          {new Date(comment.date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <div className="cap-comment-text">{comment.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {/* end cap-card */}
      </div>

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div className="cap-lightbox" onClick={() => setLightboxImg(null)}>
          <button
            className="cap-lightbox-close"
            onClick={() => setLightboxImg(null)}
          >
            ✕
          </button>
          <img
            src={lightboxImg}
            alt="Full size"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
