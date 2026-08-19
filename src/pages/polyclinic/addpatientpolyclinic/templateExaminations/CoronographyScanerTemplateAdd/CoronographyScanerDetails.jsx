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

.cor-root {
  --teal:#0d6b5e; --teal-dark:#094d44; --teal-mid:#0f8a7a;
  --teal-pale:#e8f7f5; --teal-border:#a3ddd5;
  --bg:#eef2f6; --surface:#fff; --surface2:#f7f9fb;
  --border:#dde4ec; --ink:#1a2533; --ink2:#3d4f63; --ink3:#7089a6;
  --red:#c0392b; --red-pale:#fef2f2;
  --sh:0 2px 12px rgba(10,30,60,.07),0 1px 3px rgba(10,30,60,.04);
  --sh-md:0 8px 32px rgba(10,30,60,.10),0 2px 8px rgba(10,30,60,.05);
  --tr:all .18s cubic-bezier(.4,0,.2,1);
  font-family:'DM Sans',system-ui,sans-serif;
  background:var(--bg); min-height:100vh; padding-bottom:64px;
}

/* ── HERO ── */
.cor-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:32px 40px 88px; position:relative; overflow:hidden;
}
.cor-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 110% 50%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 400px at -5% 130%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.cor-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:60px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.cor-hero-inner { position:relative; z-index:1; max-width:960px; }
.cor-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:12px; backdrop-filter:blur(6px);
}
.cor-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; }
.cor-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(18px,2.4vw,26px); font-weight:700;
  color:#fff; line-height:1.2; margin:0 0 8px; letter-spacing:-.01em;
}
.cor-hero-sub { font-size:12px; color:rgba(255,255,255,.55); margin:0; }

/* ── BODY ── */
.cor-body { max-width:960px; margin:-52px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .cor-body { padding:0 12px; margin-top:-36px; } }

/* ── ACTIONS ── */
.cor-actions { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.cor-btn {
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 20px; border:none; border-radius:100px;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  cursor:pointer; transition:var(--tr); white-space:nowrap;
}
.cor-btn-primary { background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%); color:#fff; box-shadow:0 3px 14px rgba(13,107,94,.28); }
.cor-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(13,107,94,.38); }
.cor-btn-outline { background:var(--surface); color:var(--teal); border:1.5px solid var(--teal-border); }
.cor-btn-outline:hover { background:var(--teal-pale); }
.cor-btn-ghost { background:var(--surface2); color:var(--ink2); border:1.5px solid var(--border); }
.cor-btn-ghost:hover { background:var(--border); }

/* ── CARD ── */
.cor-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:18px; box-shadow:var(--sh-md); overflow:hidden; margin-bottom:20px;
}
.cor-card-head {
  padding:14px 24px; background:var(--surface2); border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:10px;
}
.cor-card-head-icon {
  width:32px; height:32px; border-radius:8px; background:var(--teal-pale);
  border:1px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:15px; flex-shrink:0;
}
.cor-card-head-title { font-family:'Lora',Georgia,serif; font-size:14px; font-weight:700; color:var(--ink); flex:1; }

/* ── DIVIDER ── */
.cor-divider { display:flex; align-items:center; gap:10px; margin:20px 24px 12px; }
.cor-divider-label { font-size:9px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--ink3); white-space:nowrap; }
.cor-divider-line { flex:1; height:1px; background:var(--border); }

/* ── ROWS — label above value, no overlap ── */
.cor-row {
  display:grid; grid-template-columns:1fr;
  gap:3px; padding:12px 24px; border-bottom:1px solid var(--border);
}
.cor-row:last-child { border-bottom:none; }
.cor-row-label { font-size:10px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; line-height:1.6; }
.cor-row-value { font-size:13px; color:var(--ink); line-height:1.65; white-space:pre-wrap; }

/* ── BADGES ── */
.cor-badge-yes { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); }
.cor-badge-no  { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--surface2); border:1.5px solid var(--border); color:var(--ink3); }
.cor-diagnosis-badge { display:inline-block; padding:4px 14px; border-radius:100px; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); font-size:13px; font-weight:600; }

/* ── IMAGES ── */
.cor-images { padding:16px 24px 20px; }
.cor-images-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; }
.cor-img-wrap {
  border-radius:10px; overflow:hidden; border:1.5px solid var(--border);
  background:var(--surface2); aspect-ratio:1; cursor:pointer;
  transition:var(--tr); box-shadow:var(--sh);
}
.cor-img-wrap:hover { border-color:var(--teal-border); box-shadow:0 4px 16px rgba(13,107,94,.18); transform:translateY(-2px); }
.cor-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; }

/* ── COMMENTS ── */
.cor-comments { padding:0 24px 20px; }
.cor-comment {
  display:flex; gap:12px; padding:14px 16px; border-radius:10px;
  background:var(--surface2); border:1px solid var(--border); margin-bottom:10px;
}
.cor-comment:last-child { margin-bottom:0; }
.cor-comment-avatar {
  width:36px; height:36px; border-radius:9px; background:var(--teal-pale);
  border:1.5px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:16px; flex-shrink:0;
}
.cor-comment-body { flex:1; min-width:0; }
.cor-comment-meta { display:flex; align-items:center; gap:8px; margin-bottom:5px; flex-wrap:wrap; }
.cor-comment-name { font-size:13px; font-weight:600; color:var(--ink); }
.cor-comment-date { font-size:11px; color:var(--ink3); }
.cor-comment-text { font-size:13px; color:var(--ink2); line-height:1.65; }

/* ── LOADING / ERROR ── */
.cor-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-size:13px; color:var(--ink3); }
.cor-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:corSpin .7s linear infinite; }
@keyframes corSpin { to{transform:rotate(360deg)} }
.cor-error { text-align:center; padding:60px 24px; color:var(--red); font-size:14px; }

/* ── LIGHTBOX ── */
.cor-lightbox {
  position:fixed; inset:0; background:rgba(10,20,40,.85); z-index:9999;
  display:flex; align-items:center; justify-content:center; padding:24px;
  backdrop-filter:blur(6px); animation:corFadeIn .18s ease;
}
@keyframes corFadeIn { from{opacity:0} to{opacity:1} }
.cor-lightbox img { max-width:90vw; max-height:88vh; border-radius:12px; box-shadow:0 24px 80px rgba(0,0,0,.5); }
.cor-lightbox-close {
  position:absolute; top:20px; right:20px; width:36px; height:36px;
  border-radius:50%; background:rgba(255,255,255,.15); border:none;
  color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center;
  justify-content:center; transition:var(--tr);
}
.cor-lightbox-close:hover { background:rgba(255,255,255,.3); }

/* ── PRINT ── */
@media print {
  .cor-hero, .cor-actions { display:none !important; }
  .cor-body { margin:0; padding:0; max-width:100%; }
  .cor-card { box-shadow:none; border:none; border-radius:0; }
}
`;

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function CoronographyScanerDetails() {
  const { id } = useParams();
  const { t } = useTranslation("templateExaminations");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchCTScanDetails = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/clinic/get-detail-examinations/Coronographyscaner/detail/${id}`,
          { withCredentials: true },
        );
        setData(response.data);
      } catch (err) {
        setError(t("CoronographyScanerDetails.page.errors.fetchError"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCTScanDetails();
  }, [id, t]);

  const pdfBaseName = () =>
    `${data?.diagnosis || "medical_history"}_medical_history`;

  const downloadPDF = async () => {
    try {
      await savePdfFromElement("cor-pdf-content", pdfBaseName());
    } catch (error) {
      console.error("Error creating PDF: ", error);
    }
  };

  const uploadPDF = async () => {
    try {
      const link = await uploadPdfFromElement("cor-pdf-content", pdfBaseName());
      alert(
        `${t("CoronographyScanerDetails.page.messages.uploadSuccess")} ${link}`,
      );
    } catch (error) {
      console.error("PDF upload error:", error);
      alert(t("CoronographyScanerDetails.page.messages.uploadError"));
    }
  };

  const printPage = () => {
    window.print();
  };

  /* ── Guards ── */
  if (loading)
    return (
      <div className="cor-root">
        <style>{CSS}</style>
        <div className="cor-loading">
          <div className="cor-loading-spin" />
          {t("CoronographyScanerDetails.page.loading")}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="cor-root">
        <style>{CSS}</style>
        <div className="cor-error">⚠️ {error}</div>
      </div>
    );
  if (!data)
    return (
      <div className="cor-root">
        <style>{CSS}</style>
        <div className="cor-error">
          {t("CoronographyScanerDetails.page.noData")}
        </div>
      </div>
    );

  const dateFormatted = data.date
    ? new Date(data.date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";
  const doctorName = data.doctor
    ? `${data.doctor.firstName || ""} ${data.doctor.lastName || ""}`.trim()
    : "—";
  const patientName =
    data?.patientId?.fullName || t("CoronographyScanerDetails.page.noData");

  return (
    <div className="cor-root">
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <div className="cor-hero">
        <div className="cor-hero-inner">
          <div className="cor-hero-tag">DocPats · Coronography</div>
          <h1 className="cor-hero-h1">
            {t("CoronographyScanerDetails.page.title")}
          </h1>
          <p className="cor-hero-sub">
            {patientName} · {dateFormatted}
            {doctorName !== "—" && ` · ${doctorName}`}
          </p>
        </div>
      </div>

      <div className="cor-body">
        {/* ── Actions ── */}
        <div className="cor-actions">
          <button className="cor-btn cor-btn-primary" onClick={downloadPDF}>
            ⬇ {t("CoronographyScanerDetails.buttons.download")}
          </button>
          <button className="cor-btn cor-btn-outline" onClick={uploadPDF}>
            ☁ {t("CoronographyScanerDetails.buttons.upload")}
          </button>
          <button className="cor-btn cor-btn-ghost" onClick={printPage}>
            🖨 {t("CoronographyScanerDetails.buttons.print")}
          </button>
        </div>

        {/* ── Main card (PDF target) ── */}
        <div className="cor-card" id="cor-pdf-content">
          <div className="cor-card-head">
            <span className="cor-card-head-icon">🫀</span>
            <span className="cor-card-head-title">
              {t("CoronographyScanerDetails.page.title")}
            </span>
          </div>

          {/* General info */}
          <div className="cor-divider">
            <span className="cor-divider-label">
              👤{" "}
              {t("CoronographyScanerDetails.sections.general", "General Info")}
            </span>
            <span className="cor-divider-line" />
          </div>

          <div className="cor-row">
            <span className="cor-row-label">
              {t("CoronographyScanerDetails.fields.patient")}
            </span>
            <span className="cor-row-value">{patientName}</span>
          </div>
          <div className="cor-row">
            <span className="cor-row-label">
              {t("CoronographyScanerDetails.fields.doctor")}
            </span>
            <span className="cor-row-value">{doctorName}</span>
          </div>
          <div className="cor-row">
            <span className="cor-row-label">
              {t("CoronographyScanerDetails.fields.date")}
            </span>
            <span className="cor-row-value">{dateFormatted}</span>
          </div>
          <div className="cor-row">
            <span className="cor-row-label">
              {t("CoronographyScanerDetails.fields.nameofexam")}
            </span>
            <span className="cor-row-value">{data.nameofexam || "—"}</span>
          </div>
          <div className="cor-row">
            <span className="cor-row-label">
              {t("CoronographyScanerDetails.fields.contrastUsed")}
            </span>
            <span className="cor-row-value">
              {data.contrastUsed ? (
                <span className="cor-badge-yes">
                  ✓ {t("CoronographyScanerDetails.fields.yes")}
                </span>
              ) : (
                <span className="cor-badge-no">
                  ✗ {t("CoronographyScanerDetails.fields.no")}
                </span>
              )}
            </span>
          </div>

          {/* Findings */}
          <div className="cor-divider">
            <span className="cor-divider-label">
              🔬 {t("CoronographyScanerDetails.sections.findings", "Findings")}
            </span>
            <span className="cor-divider-line" />
          </div>

          <div className="cor-row">
            <span className="cor-row-label">
              {t("CoronographyScanerDetails.fields.diagnosis")}
            </span>
            <span className="cor-row-value">
              {data.diagnosis ? (
                <span className="cor-diagnosis-badge">{data.diagnosis}</span>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="cor-row">
            <span className="cor-row-label">
              {t("CoronographyScanerDetails.fields.report")}
            </span>
            <span className="cor-row-value">{data.report || "—"}</span>
          </div>
          <div className="cor-row">
            <span className="cor-row-label">
              {t("CoronographyScanerDetails.fields.recomandation")}
            </span>
            <span className="cor-row-value">{data.recomandation || "—"}</span>
          </div>

          {/* Images */}
          {data?.images?.length > 0 && (
            <>
              <div className="cor-divider">
                <span className="cor-divider-label">
                  🖼 {t("CoronographyScanerDetails.fields.images")}
                </span>
                <span className="cor-divider-line" />
              </div>
              <div className="cor-images">
                <div className="cor-images-grid">
                  {data.images.map((img, index) => (
                    <div
                      key={index}
                      className="cor-img-wrap"
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
              <div className="cor-divider">
                <span className="cor-divider-label">
                  💬 {t("CoronographyScanerDetails.fields.doctorComments")}
                </span>
                <span className="cor-divider-line" />
              </div>
              <div className="cor-comments">
                {data.doctorComments.map((comment, index) => (
                  <div key={index} className="cor-comment">
                    <div className="cor-comment-avatar">👨‍⚕️</div>
                    <div className="cor-comment-body">
                      <div className="cor-comment-meta">
                        <span className="cor-comment-name">
                          {comment.doctor?.firstName} {comment.doctor?.lastName}
                        </span>
                        <span className="cor-comment-date">
                          {new Date(comment.date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <div className="cor-comment-text">{comment.text}</div>
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
        <div className="cor-lightbox" onClick={() => setLightboxImg(null)}>
          <button
            className="cor-lightbox-close"
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
