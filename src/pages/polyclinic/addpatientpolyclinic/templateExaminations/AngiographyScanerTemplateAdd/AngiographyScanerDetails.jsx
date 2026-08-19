import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  savePdfFromElement,
  uploadPdfFromElement,
} from "../../../../../lib/pdfExport";

/* ─────────────────────────── CSS ─────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Lora:wght@600;700&display=swap');

.ang-root {
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
.ang-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:32px 40px 88px; position:relative; overflow:hidden;
}
.ang-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 110% 50%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 400px at -5% 130%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.ang-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:60px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.ang-hero-inner { position:relative; z-index:1; max-width:960px; }
.ang-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:12px; backdrop-filter:blur(6px);
}
.ang-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; }
.ang-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(18px,2.4vw,26px); font-weight:700;
  color:#fff; line-height:1.2; margin:0 0 8px; letter-spacing:-.01em;
}
.ang-hero-sub { font-size:12px; color:rgba(255,255,255,.55); margin:0; }

/* ── BODY ── */
.ang-body { max-width:960px; margin:-52px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .ang-body { padding:0 12px; margin-top:-36px; } }

/* ── ACTIONS ── */
.ang-actions { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.ang-btn {
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 20px; border:none; border-radius:100px;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  cursor:pointer; transition:var(--tr); white-space:nowrap;
}
.ang-btn-primary { background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%); color:#fff; box-shadow:0 3px 14px rgba(13,107,94,.28); }
.ang-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(13,107,94,.38); }
.ang-btn-outline { background:var(--surface); color:var(--teal); border:1.5px solid var(--teal-border); }
.ang-btn-outline:hover { background:var(--teal-pale); }
.ang-btn-ghost { background:var(--surface2); color:var(--ink2); border:1.5px solid var(--border); }
.ang-btn-ghost:hover { background:var(--border); }

/* ── CARD ── */
.ang-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:18px; box-shadow:var(--sh-md); overflow:hidden; margin-bottom:20px;
}
.ang-card-head {
  padding:14px 24px; background:var(--surface2); border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:10px;
}
.ang-card-head-icon {
  width:32px; height:32px; border-radius:8px; background:var(--teal-pale);
  border:1px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:15px; flex-shrink:0;
}
.ang-card-head-title { font-family:'Lora',Georgia,serif; font-size:14px; font-weight:700; color:var(--ink); flex:1; }

/* ── DIVIDER ── */
.ang-divider { display:flex; align-items:center; gap:10px; margin:20px 24px 12px; }
.ang-divider-label { font-size:9px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--ink3); white-space:nowrap; }
.ang-divider-line { flex:1; height:1px; background:var(--border); }

/* ── ROWS ── */
.ang-row {
  display:grid; grid-template-columns:200px 1fr;
  gap:8px 16px; padding:11px 24px; border-bottom:1px solid var(--border);
  align-items:baseline;
}
.ang-row:last-child { border-bottom:none; }
@media(max-width:560px){ .ang-row { grid-template-columns:1fr; gap:3px; padding:10px 16px; } }
.ang-row-label { font-size:10px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; line-height:1.6; }
.ang-row-value { font-size:13px; color:var(--ink); line-height:1.65; }

/* ── BADGE ── */
.ang-badge-yes { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); }
.ang-badge-no  { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--surface2); border:1.5px solid var(--border); color:var(--ink3); }
.ang-diagnosis-badge { display:inline-block; padding:4px 14px; border-radius:100px; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); font-size:13px; font-weight:600; }

/* ── IMAGES GRID ── */
.ang-images { padding:16px 24px 20px; }
.ang-images-title { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--ink3); margin-bottom:12px; }
.ang-images-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; }
.ang-img-wrap {
  border-radius:10px; overflow:hidden; border:1.5px solid var(--border);
  background:var(--surface2); aspeang-ratio:1; cursor:pointer;
  transition:var(--tr); box-shadow:var(--sh);
}
.ang-img-wrap:hover { border-color:var(--teal-border); box-shadow:0 4px 16px rgba(13,107,94,.18); transform:translateY(-2px); }
.ang-img-wrap img { width:100%; height:100%; objeang-fit:cover; display:block; }

/* ── COMMENTS ── */
.ang-comments { padding:0 24px 20px; }
.ang-comment {
  display:flex; gap:12px; padding:14px 16px; border-radius:10px;
  background:var(--surface2); border:1px solid var(--border); margin-bottom:10px;
}
.ang-comment:last-child { margin-bottom:0; }
.ang-comment-avatar {
  width:36px; height:36px; border-radius:9px; background:var(--teal-pale);
  border:1.5px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:16px; flex-shrink:0;
}
.ang-comment-body { flex:1; min-width:0; }
.ang-comment-meta { display:flex; align-items:center; gap:8px; margin-bottom:5px; flex-wrap:wrap; }
.ang-comment-name { font-size:13px; font-weight:600; color:var(--ink); }
.ang-comment-date { font-size:11px; color:var(--ink3); font-family:'DM Sans',sans-serif; }
.ang-comment-text { font-size:13px; color:var(--ink2); line-height:1.65; }

/* ── LOADING / ERROR ── */
.ang-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-size:13px; color:var(--ink3); }
.ang-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:ctSpin .7s linear infinite; }
@keyframes ctSpin { to{transform:rotate(360deg)} }
.ang-error { text-align:center; padding:60px 24px; color:var(--red); font-size:14px; }

/* ── LIGHTBOX ── */
.ang-lightbox {
  position:fixed; inset:0; background:rgba(10,20,40,.85); z-index:9999;
  display:flex; align-items:center; justify-content:center; padding:24px;
  backdrop-filter:blur(6px); animation:ctFadeIn .18s ease;
}
@keyframes ctFadeIn { from{opacity:0} to{opacity:1} }
.ang-lightbox img { max-width:90vw; max-height:88vh; border-radius:12px; box-shadow:0 24px 80px rgba(0,0,0,.5); }
.ang-lightbox-close {
  position:absolute; top:20px; right:20px; width:36px; height:36px;
  border-radius:50%; background:rgba(255,255,255,.15); border:none;
  color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center;
  justify-content:center; transition:var(--tr);
}
.ang-lightbox-close:hover { background:rgba(255,255,255,.3); }

/* ── PRINT ── */
@media print {
  .ang-hero, .ang-actions { display:none !important; }
  .ang-body { margin:0; padding:0; max-width:100%; }
  .ang-card { box-shadow:none; border:none; border-radius:0; }
}
`;

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function AngiographyScanerDetails() {
  const { id } = useParams();
  const { t } = useTranslation("templateExaminations");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  /* ── Fetch ── */
  useEffect(() => {
    const fetchCTScanDetails = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/clinic/get-detail-examinations/Angiographyscaner/detail/${id}`,
          { withCredentials: true },
        );
        setData(response.data);
      } catch (err) {
        setError(t("page.error"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCTScanDetails();
  }, [id, t]);

  /* ── PDF download ── */
  const pdfBaseName = () =>
    `${data?.diagnosis || "angiography"}_medical_history`;

  const downloadPDF = async () => {
    try {
      await savePdfFromElement("ang-pdf-content", pdfBaseName());
    } catch (error) {
      console.error("Error creating PDF: ", error);
    }
  };

  /* ── PDF upload ── */
  const uploadPDF = async () => {
    try {
      const link = await uploadPdfFromElement("ang-pdf-content", pdfBaseName());
      alert(`PDF uploaded! Link: ${link}`);
    } catch (error) {
      console.error("PDF upload error:", error);
      alert("PDF upload error");
    }
  };

  const printPage = () => window.print();

  /* ── Guards ── */
  if (loading)
    return (
      <div className="ang-root">
        <style>{CSS}</style>
        <div className="ang-loading">
          <div className="ang-loading-spin" />
          {t("AngiographyScanerDetails.page.loading")}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="ang-root">
        <style>{CSS}</style>
        <div className="ang-error">⚠️ {error}</div>
      </div>
    );
  if (!data)
    return (
      <div className="ang-root">
        <style>{CSS}</style>
        <div className="ang-error">
          {t("AngiographyScanerDetails.page.nodata")}
        </div>
      </div>
    );

  const dateFormatted = data?.date
    ? new Date(data?.date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";
  const doctorName = data?.doctor
    ? `${data?.doctor.firstName || ""} ${data?.doctor.lastName || ""}`.trim()
    : "—";
  const patientName =
    data?.patientId?.fullName || t("AngiographyScanerDetails.page.nodata");

  return (
    <div className="ang-root">
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <div className="ang-hero">
        <div className="ang-hero-inner">
          <div className="ang-hero-tag">DocPats · Angiography</div>
          <h1 className="ang-hero-h1">
            {t("AngiographyScanerDetails.page.title")}
          </h1>
          <p className="ang-hero-sub">
            {patientName} · {dateFormatted}
            {doctorName !== "—" && ` · ${doctorName}`}
          </p>
        </div>
      </div>

      <div className="ang-body">
        {/* ── Actions ── */}
        <div className="ang-actions">
          <button className="ang-btn ang-btn-primary" onClick={downloadPDF}>
            ⬇ {t("AngiographyScanerDetails.pdf.download")}
          </button>
          <button className="ang-btn ang-btn-outline" onClick={uploadPDF}>
            ☁ {t("AngiographyScanerDetails.pdf.upload")}
          </button>
          <button className="ang-btn ang-btn-ghost" onClick={printPage}>
            🖨 {t("AngiographyScanerDetails.pdf.print")}
          </button>
        </div>

        {/* ── Main card (PDF target) ── */}
        <div className="ang-card" id="ang-pdf-content">
          <div className="ang-card-head">
            <span className="ang-card-head-icon">🫀</span>
            <span className="ang-card-head-title">
              {t("AngiographyScanerDetails.page.title")}
            </span>
          </div>

          {/* General info */}
          <div className="ang-divider">
            <span className="ang-divider-label">
              👤{" "}
              {t("AngiographyScanerDetails.sections.general", "General Info")}
            </span>
            <span className="ang-divider-line" />
          </div>

          <div className="ang-row">
            <span className="ang-row-label">
              {t("AngiographyScanerDetails.fields.patient")}
            </span>
            <span className="ang-row-value">{patientName}</span>
          </div>
          <div className="ang-row">
            <span className="ang-row-label">
              {t("AngiographyScanerDetails.fields.doctor")}
            </span>
            <span className="ang-row-value">{doctorName}</span>
          </div>
          <div className="ang-row">
            <span className="ang-row-label">
              {t("AngiographyScanerDetails.fields.date")}
            </span>
            <span className="ang-row-value">{dateFormatted}</span>
          </div>
          <div className="ang-row">
            <span className="ang-row-label">
              {t("AngiographyScanerDetails.fields.nameofexam")}
            </span>
            <span className="ang-row-value">{data?.nameofexam || "—"}</span>
          </div>
          <div className="ang-row">
            <span className="ang-row-label">
              {t("AngiographyScanerDetails.fields.contrastUsed")}
            </span>
            <span className="ang-row-value">
              {data?.contrastUsed ? (
                <span className="ang-badge-yes">
                  ✓ {t("AngiographyScanerDetails.fields.yes")}
                </span>
              ) : (
                <span className="ang-badge-no">
                  ✗ {t("AngiographyScanerDetails.fields.no")}
                </span>
              )}
            </span>
          </div>

          {/* Findings */}
          <div className="ang-divider">
            <span className="ang-divider-label">
              🔬 {t("AngiographyScanerDetails.sections.findings", "Findings")}
            </span>
            <span className="ang-divider-line" />
          </div>

          <div className="ang-row">
            <span className="ang-row-label">
              {t("AngiographyScanerDetails.fields.diagnosis")}
            </span>
            <span className="ang-row-value">
              {data?.diagnosis ? (
                <span className="ang-diagnosis-badge">{data?.diagnosis}</span>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="ang-row">
            <span className="ang-row-label">
              {t("AngiographyScanerDetails.fields.report")}
            </span>
            <span className="ang-row-value" style={{ whiteSpace: "pre-wrap" }}>
              {data?.report || "—"}
            </span>
          </div>
          <div
            className="ang-row"
            style={{
              borderBottom: data?.images?.length
                ? "1px solid var(--border)"
                : "none",
            }}
          >
            <span className="ang-row-label">
              {t("AngiographyScanerDetails.fields.recomandation")}
            </span>
            <span className="ang-row-value" style={{ whiteSpace: "pre-wrap" }}>
              {data?.recomandation || "—"}
            </span>
          </div>

          {/* Images */}
          {data?.images?.length > 0 && (
            <>
              <div className="ang-divider">
                <span className="ang-divider-label">
                  🖼 {t("AngiographyScanerDetails.fields.images")}
                </span>
                <span className="ang-divider-line" />
              </div>
              <div className="ang-images">
                <div className="ang-images-grid">
                  {data?.images.map((img, index) => (
                    <div
                      key={index}
                      className="ang-img-wrap"
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
          {data?.doctorComments?.length > 0 && (
            <>
              <div className="ang-divider">
                <span className="ang-divider-label">
                  💬 {t("AngiographyScanerDetails.fields.doctorComments")}
                </span>
                <span className="ang-divider-line" />
              </div>
              <div className="ang-comments">
                {data?.doctorComments.map((comment, index) => (
                  <div key={index} className="ang-comment">
                    <div className="ang-comment-avatar">👨‍⚕️</div>
                    <div className="ang-comment-body">
                      <div className="ang-comment-meta">
                        <span className="ang-comment-name">
                          {comment.doctor?.firstName} {comment.doctor?.lastName}
                        </span>
                        <span className="ang-comment-date">
                          {new Date(comment.date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <div className="ang-comment-text">{comment.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {/* end ang-card */}
      </div>

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div className="ang-lightbox" onClick={() => setLightboxImg(null)}>
          <button
            className="ang-lightbox-close"
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
