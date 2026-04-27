import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";

/* ─────────────────────────── CSS ─────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Lora:wght@600;700&display=swap');

.dop-root {
  --teal:#0d6b5e; --teal-dark:#094d44; --teal-mid:#0f8a7a;
  --teal-pale:#e8f7f5; --teal-border:#a3ddd5;
  --bg:#eef2f6; --surface:#fff; --surface2:#f7f9fb;
  --border:#dde4ec; --ink:#1a2533; --ink2:#3d4f63; --ink3:#7089a6;
  --red:#c0392b;
  --sh:0 2px 12px rgba(10,30,60,.07),0 1px 3px rgba(10,30,60,.04);
  --sh-md:0 8px 32px rgba(10,30,60,.10),0 2px 8px rgba(10,30,60,.05);
  --tr:all .18s cubic-bezier(.4,0,.2,1);
  font-family:'DM Sans',system-ui,sans-serif;
  background:var(--bg); min-height:100vh; padding-bottom:64px;
}

/* ── HERO ── */
.dop-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:32px 40px 88px; position:relative; overflow:hidden;
}
.dop-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 110% 50%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 400px at -5% 130%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.dop-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:60px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.dop-hero-inner { position:relative; z-index:1; max-width:960px; }
.dop-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:12px; backdrop-filter:blur(6px);
}
.dop-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; }
.dop-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(18px,2.4vw,26px); font-weight:700;
  color:#fff; line-height:1.2; margin:0 0 8px; letter-spacing:-.01em;
}
.dop-hero-sub { font-size:12px; color:rgba(255,255,255,.55); margin:0; }

/* ── BODY ── */
.dop-body { max-width:960px; margin:-52px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .dop-body { padding:0 12px; margin-top:-36px; } }

/* ── ACTIONS ── */
.dop-actions { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.dop-btn {
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 20px; border:none; border-radius:100px;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  cursor:pointer; transition:var(--tr); white-space:nowrap;
}
.dop-btn-primary { background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%); color:#fff; box-shadow:0 3px 14px rgba(13,107,94,.28); }
.dop-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(13,107,94,.38); }
.dop-btn-outline { background:var(--surface); color:var(--teal); border:1.5px solid var(--teal-border); }
.dop-btn-outline:hover { background:var(--teal-pale); }
.dop-btn-ghost { background:var(--surface2); color:var(--ink2); border:1.5px solid var(--border); }
.dop-btn-ghost:hover { background:var(--border); }

/* ── CARD ── */
.dop-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:18px; box-shadow:var(--sh-md); overflow:hidden; margin-bottom:20px;
}
.dop-card-head {
  padding:14px 24px; background:var(--surface2); border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:10px;
}
.dop-card-head-icon {
  width:32px; height:32px; border-radius:8px; background:var(--teal-pale);
  border:1px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:15px; flex-shrink:0;
}
.dop-card-head-title { font-family:'Lora',Georgia,serif; font-size:14px; font-weight:700; color:var(--ink); flex:1; }

/* ── DIVIDER ── */
.dop-divider { display:flex; align-items:center; gap:10px; margin:20px 24px 12px; }
.dop-divider-label { font-size:9px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--ink3); white-space:nowrap; }
.dop-divider-line { flex:1; height:1px; background:var(--border); }

/* ── ROWS — label above value ── */
.dop-row {
  display:grid; grid-template-columns:1fr;
  gap:3px; padding:12px 24px; border-bottom:1px solid var(--border);
}
.dop-row:last-child { border-bottom:none; }
.dop-row-label { font-size:10px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; line-height:1.6; }
.dop-row-value { font-size:13px; color:var(--ink); line-height:1.65; white-space:pre-wrap; }

/* ── BADGES ── */
.dop-badge-yes { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); }
.dop-badge-no  { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--surface2); border:1.5px solid var(--border); color:var(--ink3); }
.dop-diagnosis-badge { display:inline-block; padding:4px 14px; border-radius:100px; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); font-size:13px; font-weight:600; }

/* ── IMAGES ── */
.dop-images { padding:16px 24px 20px; }
.dop-images-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; }
.dop-img-wrap {
  border-radius:10px; overflow:hidden; border:1.5px solid var(--border);
  background:var(--surface2); aspect-ratio:1; cursor:pointer;
  transition:var(--tr); box-shadow:var(--sh);
}
.dop-img-wrap:hover { border-color:var(--teal-border); box-shadow:0 4px 16px rgba(13,107,94,.18); transform:translateY(-2px); }
.dop-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; }

/* ── COMMENTS ── */
.dop-comments { padding:0 24px 20px; }
.dop-comment {
  display:flex; gap:12px; padding:14px 16px; border-radius:10px;
  background:var(--surface2); border:1px solid var(--border); margin-bottom:10px;
}
.dop-comment:last-child { margin-bottom:0; }
.dop-comment-avatar {
  width:36px; height:36px; border-radius:9px; background:var(--teal-pale);
  border:1.5px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:16px; flex-shrink:0;
}
.dop-comment-body { flex:1; min-width:0; }
.dop-comment-meta { display:flex; align-items:center; gap:8px; margin-bottom:5px; flex-wrap:wrap; }
.dop-comment-name { font-size:13px; font-weight:600; color:var(--ink); }
.dop-comment-date { font-size:11px; color:var(--ink3); }
.dop-comment-text { font-size:13px; color:var(--ink2); line-height:1.65; }

/* ── LOADING / ERROR ── */
.dop-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-size:13px; color:var(--ink3); }
.dop-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:dopSpin .7s linear infinite; }
@keyframes dopSpin { to{transform:rotate(360deg)} }
.dop-error { text-align:center; padding:60px 24px; color:var(--red); font-size:14px; }

/* ── LIGHTBOX ── */
.dop-lightbox {
  position:fixed; inset:0; background:rgba(10,20,40,.85); z-index:9999;
  display:flex; align-items:center; justify-content:center; padding:24px;
  backdrop-filter:blur(6px); animation:dopFadeIn .18s ease;
}
@keyframes dopFadeIn { from{opacity:0} to{opacity:1} }
.dop-lightbox img { max-width:90vw; max-height:88vh; border-radius:12px; box-shadow:0 24px 80px rgba(0,0,0,.5); }
.dop-lightbox-close {
  position:absolute; top:20px; right:20px; width:36px; height:36px;
  border-radius:50%; background:rgba(255,255,255,.15); border:none;
  color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center;
  justify-content:center; transition:var(--tr);
}
.dop-lightbox-close:hover { background:rgba(255,255,255,.3); }

/* ── PRINT ── */
@media print {
  .dop-hero, .dop-actions { display:none !important; }
  .dop-body { margin:0; padding:0; max-width:100%; }
  .dop-card { box-shadow:none; border:none; border-radius:0; }
}
`;

export default function DopleryScanerDetails() {
  const { id } = useParams();
  const { t } = useTranslation("templateExaminations");

  const [ctData, setCtData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/clinic/get-detail-examinations/Doplerscaner/detail/${id}`,
          { withCredentials: true },
        );
        setCtData(response.data);
      } catch (err) {
        setError(t("DopleryScanerDetails.page.errors.fetchError"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, t]);

  const downloadPDF = async () => {
    try {
      const element = document.getElementById("dop-pdf-content");
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const fileName = ctData?.diagnosis || "medical_history";
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`${fileName}_medical_history.pdf`);
    } catch (error) {
      console.error("Error creating PDF:", error);
    }
  };

  const uploadPDF = async () => {
    try {
      const element = document.getElementById("dop-pdf-content");
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      const pdfBlob = pdf.output("blob");
      const fileName = ctData?.diagnosis || "medical_history";
      const pdfFile = new File([pdfBlob], `${fileName}_medical_history.pdf`, {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.append("file", pdfFile);
      const response = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(
        `${t("DopleryScanerDetails.page.messages.uploadSuccess")} ${response.data.fileUrl}`,
      );
    } catch (error) {
      console.error("PDF upload error:", error);
      alert(t("DopleryScanerDetails.page.messages.uploadError"));
    }
  };

  const printPage = () => {
    window.print();
  };

  /* ── Guards ── */
  if (loading)
    return (
      <div className="dop-root">
        <style>{CSS}</style>
        <div className="dop-loading">
          <div className="dop-loading-spin" />
          {t("DopleryScanerDetails.page.loading")}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="dop-root">
        <style>{CSS}</style>
        <div className="dop-error">⚠️ {error}</div>
      </div>
    );
  if (!ctData)
    return (
      <div className="dop-root">
        <style>{CSS}</style>
        <div className="dop-error">{t("DopleryScanerDetails.page.noData")}</div>
      </div>
    );

  const dateFormatted = ctData.date
    ? new Date(ctData.date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";
  const doctorName = ctData.doctor
    ? `${ctData.doctor.firstName || ""} ${ctData.doctor.lastName || ""}`.trim()
    : "—";
  const patientName =
    ctData?.patientId?.fullName || t("DopleryScanerDetails.page.noData");

  return (
    <div className="dop-root">
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <div className="dop-hero">
        <div className="dop-hero-inner">
          <div className="dop-hero-tag">DocPats · Doppler Scan</div>
          <h1 className="dop-hero-h1">
            {t("DopleryScanerDetails.page.title")}
          </h1>
          <p className="dop-hero-sub">
            {patientName} · {dateFormatted}
            {doctorName !== "—" && ` · ${doctorName}`}
          </p>
        </div>
      </div>

      <div className="dop-body">
        {/* ── Actions ── */}
        <div className="dop-actions">
          <button className="dop-btn dop-btn-primary" onClick={downloadPDF}>
            ⬇ {t("DopleryScanerDetails.buttons.download")}
          </button>
          <button className="dop-btn dop-btn-outline" onClick={uploadPDF}>
            ☁ {t("DopleryScanerDetails.buttons.upload")}
          </button>
          <button className="dop-btn dop-btn-ghost" onClick={printPage}>
            🖨 {t("DopleryScanerDetails.buttons.print")}
          </button>
        </div>

        {/* ── Main card (PDF target) ── */}
        <div className="dop-card" id="dop-pdf-content">
          <div className="dop-card-head">
            <span className="dop-card-head-icon">🔊</span>
            <span className="dop-card-head-title">
              {t("DopleryScanerDetails.page.title")}
            </span>
          </div>

          {/* General info */}
          <div className="dop-divider">
            <span className="dop-divider-label">
              👤 {t("DopleryScanerDetails.sections.general", "General Info")}
            </span>
            <span className="dop-divider-line" />
          </div>

          <div className="dop-row">
            <span className="dop-row-label">
              {t("DopleryScanerDetails.fields.patient")}
            </span>
            <span className="dop-row-value">{patientName}</span>
          </div>
          <div className="dop-row">
            <span className="dop-row-label">
              {t("DopleryScanerDetails.fields.doctor")}
            </span>
            <span className="dop-row-value">{doctorName}</span>
          </div>
          <div className="dop-row">
            <span className="dop-row-label">
              {t("DopleryScanerDetails.fields.date")}
            </span>
            <span className="dop-row-value">{dateFormatted}</span>
          </div>
          <div className="dop-row">
            <span className="dop-row-label">
              {t("DopleryScanerDetails.fields.nameofexam")}
            </span>
            <span className="dop-row-value">{ctData.nameofexam || "—"}</span>
          </div>
          <div className="dop-row">
            <span className="dop-row-label">
              {t("DopleryScanerDetails.fields.contrastUsed")}
            </span>
            <span className="dop-row-value">
              {ctData.contrastUsed ? (
                <span className="dop-badge-yes">
                  ✓ {t("DopleryScanerDetails.fields.yes")}
                </span>
              ) : (
                <span className="dop-badge-no">
                  ✗ {t("DopleryScanerDetails.fields.no")}
                </span>
              )}
            </span>
          </div>

          {/* Findings */}
          <div className="dop-divider">
            <span className="dop-divider-label">
              🔬 {t("DopleryScanerDetails.sections.findings", "Findings")}
            </span>
            <span className="dop-divider-line" />
          </div>

          <div className="dop-row">
            <span className="dop-row-label">
              {t("DopleryScanerDetails.fields.diagnosis")}
            </span>
            <span className="dop-row-value">
              {ctData.diagnosis ? (
                <span className="dop-diagnosis-badge">{ctData.diagnosis}</span>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="dop-row">
            <span className="dop-row-label">
              {t("DopleryScanerDetails.fields.report")}
            </span>
            <span className="dop-row-value">{ctData.report || "—"}</span>
          </div>
          <div className="dop-row">
            <span className="dop-row-label">
              {t("DopleryScanerDetails.fields.recomandation")}
            </span>
            <span className="dop-row-value">{ctData.recomandation || "—"}</span>
          </div>

          {/* Images */}
          {ctData?.images?.length > 0 && (
            <>
              <div className="dop-divider">
                <span className="dop-divider-label">
                  🖼 {t("DopleryScanerDetails.fields.images")}
                </span>
                <span className="dop-divider-line" />
              </div>
              <div className="dop-images">
                <div className="dop-images-grid">
                  {ctData.images.map((img, index) => (
                    <div
                      key={index}
                      className="dop-img-wrap"
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
          {ctData?.doctorComments?.length > 0 && (
            <>
              <div className="dop-divider">
                <span className="dop-divider-label">
                  💬 {t("DopleryScanerDetails.fields.doctorComments")}
                </span>
                <span className="dop-divider-line" />
              </div>
              <div className="dop-comments">
                {ctData.doctorComments.map((comment, index) => (
                  <div key={index} className="dop-comment">
                    <div className="dop-comment-avatar">👨‍⚕️</div>
                    <div className="dop-comment-body">
                      <div className="dop-comment-meta">
                        <span className="dop-comment-name">
                          {comment.doctor?.firstName} {comment.doctor?.lastName}
                        </span>
                        <span className="dop-comment-date">
                          {new Date(comment.date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <div className="dop-comment-text">{comment.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div className="dop-lightbox" onClick={() => setLightboxImg(null)}>
          <button
            className="dop-lightbox-close"
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
