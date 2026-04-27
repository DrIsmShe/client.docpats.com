import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";

/* ─────────────────────────── CSS ─────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Lora:wght@600;700&display=swap');

.ct-root {
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
.ct-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:32px 40px 88px; position:relative; overflow:hidden;
}
.ct-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 110% 50%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 400px at -5% 130%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.ct-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:60px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.ct-hero-inner { position:relative; z-index:1; max-width:960px; }
.ct-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:12px; backdrop-filter:blur(6px);
}
.ct-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; }
.ct-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(18px,2.4vw,26px); font-weight:700;
  color:#fff; line-height:1.2; margin:0 0 8px; letter-spacing:-.01em;
}
.ct-hero-sub { font-size:12px; color:rgba(255,255,255,.55); margin:0; }

/* ── BODY ── */
.ct-body { max-width:960px; margin:-52px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .ct-body { padding:0 12px; margin-top:-36px; } }

/* ── ACTIONS ── */
.ct-actions { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.ct-btn {
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 20px; border:none; border-radius:100px;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  cursor:pointer; transition:var(--tr); white-space:nowrap;
}
.ct-btn-primary { background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%); color:#fff; box-shadow:0 3px 14px rgba(13,107,94,.28); }
.ct-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(13,107,94,.38); }
.ct-btn-outline { background:var(--surface); color:var(--teal); border:1.5px solid var(--teal-border); }
.ct-btn-outline:hover { background:var(--teal-pale); }
.ct-btn-ghost { background:var(--surface2); color:var(--ink2); border:1.5px solid var(--border); }
.ct-btn-ghost:hover { background:var(--border); }

/* ── CARD ── */
.ct-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:18px; box-shadow:var(--sh-md); overflow:hidden; margin-bottom:20px;
}
.ct-card-head {
  padding:14px 24px; background:var(--surface2); border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:10px;
}
.ct-card-head-icon {
  width:32px; height:32px; border-radius:8px; background:var(--teal-pale);
  border:1px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:15px; flex-shrink:0;
}
.ct-card-head-title { font-family:'Lora',Georgia,serif; font-size:14px; font-weight:700; color:var(--ink); flex:1; }

/* ── DIVIDER ── */
.ct-divider { display:flex; align-items:center; gap:10px; margin:20px 24px 12px; }
.ct-divider-label { font-size:9px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--ink3); white-space:nowrap; }
.ct-divider-line { flex:1; height:1px; background:var(--border); }

/* ── ROWS ── */
.ct-row {
  display:grid; grid-template-columns:200px 1fr;
  gap:8px 16px; padding:11px 24px; border-bottom:1px solid var(--border);
  align-items:baseline;
}
.ct-row:last-child { border-bottom:none; }
@media(max-width:560px){ .ct-row { grid-template-columns:1fr; gap:3px; padding:10px 16px; } }
.ct-row-label { font-size:10px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; line-height:1.6; }
.ct-row-value { font-size:13px; color:var(--ink); line-height:1.65; }

/* ── BADGE ── */
.ct-badge-yes { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); }
.ct-badge-no  { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--surface2); border:1.5px solid var(--border); color:var(--ink3); }
.ct-diagnosis-badge { display:inline-block; padding:4px 14px; border-radius:100px; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); font-size:13px; font-weight:600; }

/* ── IMAGES GRID ── */
.ct-images { padding:16px 24px 20px; }
.ct-images-title { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--ink3); margin-bottom:12px; }
.ct-images-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; }
.ct-img-wrap {
  border-radius:10px; overflow:hidden; border:1.5px solid var(--border);
  background:var(--surface2); aspect-ratio:1; cursor:pointer;
  transition:var(--tr); box-shadow:var(--sh);
}
.ct-img-wrap:hover { border-color:var(--teal-border); box-shadow:0 4px 16px rgba(13,107,94,.18); transform:translateY(-2px); }
.ct-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; }

/* ── COMMENTS ── */
.ct-comments { padding:0 24px 20px; }
.ct-comment {
  display:flex; gap:12px; padding:14px 16px; border-radius:10px;
  background:var(--surface2); border:1px solid var(--border); margin-bottom:10px;
}
.ct-comment:last-child { margin-bottom:0; }
.ct-comment-avatar {
  width:36px; height:36px; border-radius:9px; background:var(--teal-pale);
  border:1.5px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:16px; flex-shrink:0;
}
.ct-comment-body { flex:1; min-width:0; }
.ct-comment-meta { display:flex; align-items:center; gap:8px; margin-bottom:5px; flex-wrap:wrap; }
.ct-comment-name { font-size:13px; font-weight:600; color:var(--ink); }
.ct-comment-date { font-size:11px; color:var(--ink3); font-family:'DM Sans',sans-serif; }
.ct-comment-text { font-size:13px; color:var(--ink2); line-height:1.65; }

/* ── LOADING / ERROR ── */
.ct-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-size:13px; color:var(--ink3); }
.ct-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:ctSpin .7s linear infinite; }
@keyframes ctSpin { to{transform:rotate(360deg)} }
.ct-error { text-align:center; padding:60px 24px; color:var(--red); font-size:14px; }

/* ── LIGHTBOX ── */
.ct-lightbox {
  position:fixed; inset:0; background:rgba(10,20,40,.85); z-index:9999;
  display:flex; align-items:center; justify-content:center; padding:24px;
  backdrop-filter:blur(6px); animation:ctFadeIn .18s ease;
}
@keyframes ctFadeIn { from{opacity:0} to{opacity:1} }
.ct-lightbox img { max-width:90vw; max-height:88vh; border-radius:12px; box-shadow:0 24px 80px rgba(0,0,0,.5); }
.ct-lightbox-close {
  position:absolute; top:20px; right:20px; width:36px; height:36px;
  border-radius:50%; background:rgba(255,255,255,.15); border:none;
  color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center;
  justify-content:center; transition:var(--tr);
}
.ct-lightbox-close:hover { background:rgba(255,255,255,.3); }

/* ── PRINT ── */
@media print {
  .ct-hero, .ct-actions { display:none !important; }
  .ct-body { margin:0; padding:0; max-width:100%; }
  .ct-card { box-shadow:none; border:none; border-radius:0; }
}
`;

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function CTScanerDetails() {
  const { id } = useParams();
  const { t } = useTranslation("templateExaminations");

  const [ctData, setCtData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  /* ── Fetch ── */
  useEffect(() => {
    const fetchCTScanDetails = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/clinic/get-detail-examinations/CTscaner/detail/${id}`,
          { withCredentials: true },
        );
        setCtData(response.data);
      } catch (err) {
        setError(t("CTScanerDetails.page.errors.fetchError"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCTScanDetails();
  }, [id, t]);

  /* ── PDF download ── */
  const downloadPDF = async () => {
    try {
      const element = document.getElementById("ct-pdf-content");
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
      pdf.save(`${ctData?.diagnosis || "ct_scan"}_medical_history.pdf`);
    } catch (error) {
      console.error("Error creating PDF: ", error);
    }
  };

  /* ── PDF upload ── */
  const uploadPDF = async () => {
    try {
      const element = document.getElementById("ct-pdf-content");
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File(
        [pdfBlob],
        `${ctData?.diagnosis || "ct_scan"}_medical_history.pdf`,
        { type: "application/pdf" },
      );
      const formData = new FormData();
      formData.append("file", pdfFile);
      const response = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(
        `${t("CTScanerDetails.page.messages.uploadSuccess")} ${response.data.fileUrl}`,
      );
    } catch (error) {
      console.error("PDF upload error:", error);
      alert(t("CTScanerDetails.page.messages.uploadError"));
    }
  };

  const printPage = () => window.print();

  /* ── Guards ── */
  if (loading)
    return (
      <div className="ct-root">
        <style>{CSS}</style>
        <div className="ct-loading">
          <div className="ct-loading-spin" />
          {t("CTScanerDetails.page.loading")}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="ct-root">
        <style>{CSS}</style>
        <div className="ct-error">⚠️ {error}</div>
      </div>
    );
  if (!ctData)
    return (
      <div className="ct-root">
        <style>{CSS}</style>
        <div className="ct-error">{t("CTScanerDetails.page.noData")}</div>
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
    ctData?.patientId?.fullName || t("CTScanerDetails.page.noData");

  return (
    <div className="ct-root">
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <div className="ct-hero">
        <div className="ct-hero-inner">
          <div className="ct-hero-tag">DocPats · CT Scan</div>
          <h1 className="ct-hero-h1">{t("CTScanerDetails.page.title")}</h1>
          <p className="ct-hero-sub">
            {patientName} · {dateFormatted}
            {doctorName !== "—" && ` · ${doctorName}`}
          </p>
        </div>
      </div>

      <div className="ct-body">
        {/* ── Actions ── */}
        <div className="ct-actions">
          <button className="ct-btn ct-btn-primary" onClick={downloadPDF}>
            ⬇ {t("CTScanerDetails.buttons.download")}
          </button>
          <button className="ct-btn ct-btn-outline" onClick={uploadPDF}>
            ☁ {t("CTScanerDetails.buttons.upload")}
          </button>
          <button className="ct-btn ct-btn-ghost" onClick={printPage}>
            🖨 {t("CTScanerDetails.buttons.print")}
          </button>
        </div>

        {/* ── Main card (PDF target) ── */}
        <div className="ct-card" id="ct-pdf-content">
          <div className="ct-card-head">
            <span className="ct-card-head-icon">🖥️</span>
            <span className="ct-card-head-title">
              {t("CTScanerDetails.page.title")}
            </span>
          </div>

          {/* General info */}
          <div className="ct-divider">
            <span className="ct-divider-label">
              👤 {t("CTScanerDetails.sections.general", "General Info")}
            </span>
            <span className="ct-divider-line" />
          </div>

          <div className="ct-row">
            <span className="ct-row-label">
              {t("CTScanerDetails.fields.patient")}
            </span>
            <span className="ct-row-value">{patientName}</span>
          </div>
          <div className="ct-row">
            <span className="ct-row-label">
              {t("CTScanerDetails.fields.doctor")}
            </span>
            <span className="ct-row-value">{doctorName}</span>
          </div>
          <div className="ct-row">
            <span className="ct-row-label">
              {t("CTScanerDetails.fields.date")}
            </span>
            <span className="ct-row-value">{dateFormatted}</span>
          </div>
          <div className="ct-row">
            <span className="ct-row-label">
              {t("CTScanerDetails.fields.nameofexam")}
            </span>
            <span className="ct-row-value">{ctData.nameofexam || "—"}</span>
          </div>
          <div className="ct-row">
            <span className="ct-row-label">
              {t("CTScanerDetails.fields.contrastUsed")}
            </span>
            <span className="ct-row-value">
              {ctData.contrastUsed ? (
                <span className="ct-badge-yes">
                  ✓ {t("CTScanerDetails.fields.yes")}
                </span>
              ) : (
                <span className="ct-badge-no">
                  ✗ {t("CTScanerDetails.fields.no")}
                </span>
              )}
            </span>
          </div>

          {/* Findings */}
          <div className="ct-divider">
            <span className="ct-divider-label">
              🔬 {t("CTScanerDetails.sections.findings", "Findings")}
            </span>
            <span className="ct-divider-line" />
          </div>

          <div className="ct-row">
            <span className="ct-row-label">
              {t("CTScanerDetails.fields.diagnosis")}
            </span>
            <span className="ct-row-value">
              {ctData.diagnosis ? (
                <span className="ct-diagnosis-badge">{ctData.diagnosis}</span>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="ct-row">
            <span className="ct-row-label">
              {t("CTScanerDetails.fields.report")}
            </span>
            <span className="ct-row-value" style={{ whiteSpace: "pre-wrap" }}>
              {ctData.report || "—"}
            </span>
          </div>
          <div
            className="ct-row"
            style={{
              borderBottom: ctData?.images?.length
                ? "1px solid var(--border)"
                : "none",
            }}
          >
            <span className="ct-row-label">
              {t("CTScanerDetails.fields.recomandation")}
            </span>
            <span className="ct-row-value" style={{ whiteSpace: "pre-wrap" }}>
              {ctData.recomandation || "—"}
            </span>
          </div>

          {/* Images */}
          {ctData?.images?.length > 0 && (
            <>
              <div className="ct-divider">
                <span className="ct-divider-label">
                  🖼 {t("CTScanerDetails.fields.images")}
                </span>
                <span className="ct-divider-line" />
              </div>
              <div className="ct-images">
                <div className="ct-images-grid">
                  {ctData.images.map((img, index) => (
                    <div
                      key={index}
                      className="ct-img-wrap"
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
              <div className="ct-divider">
                <span className="ct-divider-label">
                  💬 {t("CTScanerDetails.fields.doctorComments")}
                </span>
                <span className="ct-divider-line" />
              </div>
              <div className="ct-comments">
                {ctData.doctorComments.map((comment, index) => (
                  <div key={index} className="ct-comment">
                    <div className="ct-comment-avatar">👨‍⚕️</div>
                    <div className="ct-comment-body">
                      <div className="ct-comment-meta">
                        <span className="ct-comment-name">
                          {comment.doctor?.firstName} {comment.doctor?.lastName}
                        </span>
                        <span className="ct-comment-date">
                          {new Date(comment.date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <div className="ct-comment-text">{comment.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {/* end ct-card */}
      </div>

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div className="ct-lightbox" onClick={() => setLightboxImg(null)}>
          <button
            className="ct-lightbox-close"
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
