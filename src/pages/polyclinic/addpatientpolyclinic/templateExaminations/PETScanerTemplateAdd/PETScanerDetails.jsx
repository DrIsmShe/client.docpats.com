import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  savePdfFromElement,
  uploadPdfFromElement,
} from "../../../../../lib/pdfExport";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Lora:wght@600;700&display=swap');

.pet-root {
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
.pet-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:32px 40px 88px; position:relative; overflow:hidden;
}
.pet-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 110% 50%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 400px at -5% 130%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.pet-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:60px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.pet-hero-inner { position:relative; z-index:1; max-width:960px; }
.pet-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:12px; backdrop-filter:blur(6px);
}
.pet-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; }
.pet-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(18px,2.4vw,26px); font-weight:700;
  color:#fff; line-height:1.2; margin:0 0 8px; letter-spacing:-.01em;
}
.pet-hero-sub { font-size:12px; color:rgba(255,255,255,.55); margin:0; }
.pet-body { max-width:960px; margin:-52px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .pet-body { padding:0 12px; margin-top:-36px; } }
.pet-actions { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.pet-btn {
  display:inline-flex; align-items:center; gap:7px; padding:9px 20px;
  border:none; border-radius:100px; font-family:'DM Sans',sans-serif;
  font-size:12px; font-weight:600; cursor:pointer; transition:var(--tr); white-space:nowrap;
}
.pet-btn-primary { background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%); color:#fff; box-shadow:0 3px 14px rgba(13,107,94,.28); }
.pet-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(13,107,94,.38); }
.pet-btn-outline { background:var(--surface); color:var(--teal); border:1.5px solid var(--teal-border); }
.pet-btn-outline:hover { background:var(--teal-pale); }
.pet-btn-ghost { background:var(--surface2); color:var(--ink2); border:1.5px solid var(--border); }
.pet-btn-ghost:hover { background:var(--border); }
.pet-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:18px; box-shadow:var(--sh-md); overflow:hidden; margin-bottom:20px;
}
.pet-card-head {
  padding:14px 24px; background:var(--surface2); border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:10px;
}
.pet-card-head-icon {
  width:32px; height:32px; border-radius:8px; background:var(--teal-pale);
  border:1px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:15px; flex-shrink:0;
}
.pet-card-head-title { font-family:'Lora',Georgia,serif; font-size:14px; font-weight:700; color:var(--ink); flex:1; }
.pet-divider { display:flex; align-items:center; gap:10px; margin:20px 24px 12px; }
.pet-divider-label { font-size:9px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--ink3); white-space:nowrap; }
.pet-divider-line { flex:1; height:1px; background:var(--border); }
.pet-row { display:grid; grid-template-columns:1fr; gap:3px; padding:12px 24px; border-bottom:1px solid var(--border); }
.pet-row:last-child { border-bottom:none; }
.pet-row-label { font-size:10px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; line-height:1.6; }
.pet-row-value { font-size:13px; color:var(--ink); line-height:1.65; white-space:pre-wrap; }
.pet-badge-yes { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); }
.pet-badge-no  { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--surface2); border:1.5px solid var(--border); color:var(--ink3); }
.pet-diagnosis-badge { display:inline-block; padding:4px 14px; border-radius:100px; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); font-size:13px; font-weight:600; }
.pet-images { padding:16px 24px 20px; }
.pet-images-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; }
.pet-img-wrap { border-radius:10px; overflow:hidden; border:1.5px solid var(--border); background:var(--surface2); aspect-ratio:1; cursor:pointer; transition:var(--tr); box-shadow:var(--sh); }
.pet-img-wrap:hover { border-color:var(--teal-border); box-shadow:0 4px 16px rgba(13,107,94,.18); transform:translateY(-2px); }
.pet-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; }
.pet-comments { padding:0 24px 20px; }
.pet-comment { display:flex; gap:12px; padding:14px 16px; border-radius:10px; background:var(--surface2); border:1px solid var(--border); margin-bottom:10px; }
.pet-comment:last-child { margin-bottom:0; }
.pet-comment-avatar { width:36px; height:36px; border-radius:9px; background:var(--teal-pale); border:1.5px solid var(--teal-border); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
.pet-comment-body { flex:1; min-width:0; }
.pet-comment-meta { display:flex; align-items:center; gap:8px; margin-bottom:5px; flex-wrap:wrap; }
.pet-comment-name { font-size:13px; font-weight:600; color:var(--ink); }
.pet-comment-date { font-size:11px; color:var(--ink3); }
.pet-comment-text { font-size:13px; color:var(--ink2); line-height:1.65; }
.pet-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-size:13px; color:var(--ink3); }
.pet-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:petSpin .7s linear infinite; }
@keyframes petSpin { to{transform:rotate(360deg)} }
.pet-error { text-align:center; padding:60px 24px; color:var(--red); font-size:14px; }
.pet-lightbox { position:fixed; inset:0; background:rgba(10,20,40,.85); z-index:9999; display:flex; align-items:center; justify-content:center; padding:24px; backdrop-filter:blur(6px); animation:petFadeIn .18s ease; }
@keyframes petFadeIn { from{opacity:0} to{opacity:1} }
.pet-lightbox img { max-width:90vw; max-height:88vh; border-radius:12px; box-shadow:0 24px 80px rgba(0,0,0,.5); }
.pet-lightbox-close { position:absolute; top:20px; right:20px; width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,.15); border:none; color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:var(--tr); }
.pet-lightbox-close:hover { background:rgba(255,255,255,.3); }
@media print {
  .pet-hero, .pet-actions { display:none !important; }
  .pet-body { margin:0; padding:0; max-width:100%; }
  .pet-card { box-shadow:none; border:none; border-radius:0; }
}
`;

export default function PETScanerDetails() {
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
          `${API_BASE}/clinic/get-detail-examinations/PETscaner/detail/${id}`,
          { withCredentials: true },
        );
        setCtData(response.data);
      } catch (err) {
        setError(t("page.errors.fetchError"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, t]);

  const pdfBaseName = () =>
    `${ctData?.diagnosis || "medical_history"}_medical_history`;

  const downloadPDF = async () => {
    try {
      await savePdfFromElement("pet-pdf-content", pdfBaseName());
    } catch (error) {
      console.error("Error creating PDF:", error);
    }
  };

  const uploadPDF = async () => {
    try {
      const link = await uploadPdfFromElement("pet-pdf-content", pdfBaseName());
      alert(`${t("buttons.upload")}: ${link}`);
    } catch (error) {
      console.error("PDF upload error:", error);
      alert(t("page.errors.uploadError"));
    }
  };

  const printPage = () => window.print();

  if (loading)
    return (
      <div className="pet-root">
        <style>{CSS}</style>
        <div className="pet-loading">
          <div className="pet-loading-spin" />
          {t("PETScanerDetails.page.loading")}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="pet-root">
        <style>{CSS}</style>
        <div className="pet-error">⚠️ {error}</div>
      </div>
    );
  if (!ctData)
    return (
      <div className="pet-root">
        <style>{CSS}</style>
        <div className="pet-error">{t("PETScanerDetails.page.noData")}</div>
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
    ctData?.patientId?.fullName || t("PETScanerDetails.fields.date");

  return (
    <div className="pet-root">
      <style>{CSS}</style>

      <div className="pet-hero">
        <div className="pet-hero-inner">
          <div className="pet-hero-tag">{t("common:dp.pageTitle.pet")}</div>
          <h1 className="pet-hero-h1">{t("PETScanerDetails.page.title")}</h1>
          <p className="pet-hero-sub">
            {patientName} · {dateFormatted}
            {doctorName !== "—" && ` · ${doctorName}`}
          </p>
        </div>
      </div>

      <div className="pet-body">
        <div className="pet-actions">
          <button className="pet-btn pet-btn-primary" onClick={downloadPDF}>
            ⬇ {t("PETScanerDetails.buttons.download")}
          </button>
          <button className="pet-btn pet-btn-outline" onClick={uploadPDF}>
            ☁ {t("PETScanerDetails.buttons.upload")}
          </button>
          <button className="pet-btn pet-btn-ghost" onClick={printPage}>
            🖨 {t("PETScanerDetails.buttons.print")}
          </button>
        </div>

        <div className="pet-card" id="pet-pdf-content">
          <div className="pet-card-head">
            <span className="pet-card-head-icon">⚛️</span>
            <span className="pet-card-head-title">
              {t("PETScanerDetails.page.title")}
            </span>
          </div>

          <div className="pet-divider">
            <span className="pet-divider-label">
              👤 {t("sections.general", "General Info")}
            </span>
            <span className="pet-divider-line" />
          </div>

          <div className="pet-row">
            <span className="pet-row-label">
              {t("PETScanerDetails.fields.patient")}
            </span>
            <span className="pet-row-value">{patientName}</span>
          </div>
          <div className="pet-row">
            <span className="pet-row-label">
              {t("PETScanerDetails.fields.doctor")}
            </span>
            <span className="pet-row-value">{doctorName}</span>
          </div>
          <div className="pet-row">
            <span className="pet-row-label">
              {t("PETScanerDetails.fields.date")}
            </span>
            <span className="pet-row-value">{dateFormatted}</span>
          </div>
          <div className="pet-row">
            <span className="pet-row-label">
              {t("PETScanerDetails.fields.nameofexam")}
            </span>
            <span className="pet-row-value">{ctData.nameofexam || "—"}</span>
          </div>
          <div className="pet-row">
            <span className="pet-row-label">
              {t("PETScanerDetails.fields.contrastUsed")}
            </span>
            <span className="pet-row-value">
              {ctData.contrastUsed ? (
                <span className="pet-badge-yes">
                  ✓ {t("PETScanerDetails.fields.yes")}
                </span>
              ) : (
                <span className="pet-badge-no">
                  ✗ {t("PETScanerDetails.fields.no")}
                </span>
              )}
            </span>
          </div>

          <div className="pet-divider">
            <span className="pet-divider-label">
              🔬 {t("sections.findings", "Findings")}
            </span>
            <span className="pet-divider-line" />
          </div>

          <div className="pet-row">
            <span className="pet-row-label">
              {t("PETScanerDetails.fields.diagnosis")}
            </span>
            <span className="pet-row-value">
              {ctData.diagnosis ? (
                <span className="pet-diagnosis-badge">{ctData.diagnosis}</span>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="pet-row">
            <span className="pet-row-label">
              {t("PETScanerDetails.fields.report")}
            </span>
            <span className="pet-row-value">{ctData.report || "—"}</span>
          </div>
          <div className="pet-row">
            <span className="pet-row-label">
              {t("PETScanerDetails.fields.recommendations")}
            </span>
            <span className="pet-row-value">{ctData.recomandation || "—"}</span>
          </div>

          {ctData?.images?.length > 0 && (
            <>
              <div className="pet-divider">
                <span className="pet-divider-label">
                  🖼 {t("PETScanerDetails.fields.images")}
                </span>
                <span className="pet-divider-line" />
              </div>
              <div className="pet-images">
                <div className="pet-images-grid">
                  {ctData.images.map((img, index) => (
                    <div
                      key={index}
                      className="pet-img-wrap"
                      onClick={() => setLightboxImg(img)}
                    >
                      <img src={img} alt={`img-${index}`} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {ctData?.doctorComments?.length > 0 && (
            <>
              <div className="pet-divider">
                <span className="pet-divider-label">
                  💬 {t("PETScanerDetails.fields.doctorComments")}
                </span>
                <span className="pet-divider-line" />
              </div>
              <div className="pet-comments">
                {ctData.doctorComments.map((comment, index) => (
                  <div key={index} className="pet-comment">
                    <div className="pet-comment-avatar">👨‍⚕️</div>
                    <div className="pet-comment-body">
                      <div className="pet-comment-meta">
                        <span className="pet-comment-name">
                          {comment.doctor?.firstName} {comment.doctor?.lastName}
                        </span>
                        <span className="pet-comment-date">
                          {new Date(comment.date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <div className="pet-comment-text">{comment.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {lightboxImg && (
        <div className="pet-lightbox" onClick={() => setLightboxImg(null)}>
          <button
            className="pet-lightbox-close"
            onClick={() => setLightboxImg(null)}
          >
            ✕
          </button>
          <img
            src={lightboxImg}
            alt={t("common:dp.scan.fullSize")}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
