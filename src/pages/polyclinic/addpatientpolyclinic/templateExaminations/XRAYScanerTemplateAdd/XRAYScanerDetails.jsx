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

.xry-root {
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
.xry-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:32px 40px 88px; position:relative; overflow:hidden;
}
.xry-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 110% 50%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 400px at -5% 130%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.xry-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:60px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.xry-hero-inner { position:relative; z-index:1; max-width:960px; }
.xry-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:12px; backdrop-filter:blur(6px);
}
.xry-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; }
.xry-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(18px,2.4vw,26px); font-weight:700;
  color:#fff; line-height:1.2; margin:0 0 8px; letter-spacing:-.01em;
}
.xry-hero-sub { font-size:12px; color:rgba(255,255,255,.55); margin:0; }
.xry-body { max-width:960px; margin:-52px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .xry-body { padding:0 12px; margin-top:-36px; } }
.xry-actions { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.xry-btn {
  display:inline-flex; align-items:center; gap:7px; padding:9px 20px;
  border:none; border-radius:100px; font-family:'DM Sans',sans-serif;
  font-size:12px; font-weight:600; cursor:pointer; transition:var(--tr); white-space:nowrap;
}
.xry-btn-primary { background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%); color:#fff; box-shadow:0 3px 14px rgba(13,107,94,.28); }
.xry-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(13,107,94,.38); }
.xry-btn-outline { background:var(--surface); color:var(--teal); border:1.5px solid var(--teal-border); }
.xry-btn-outline:hover { background:var(--teal-pale); }
.xry-btn-ghost { background:var(--surface2); color:var(--ink2); border:1.5px solid var(--border); }
.xry-btn-ghost:hover { background:var(--border); }
.xry-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:18px; box-shadow:var(--sh-md); overflow:hidden; margin-bottom:20px;
}
.xry-card-head {
  padding:14px 24px; background:var(--surface2); border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:10px;
}
.xry-card-head-icon {
  width:32px; height:32px; border-radius:8px; background:var(--teal-pale);
  border:1px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:15px; flex-shrink:0;
}
.xry-card-head-title { font-family:'Lora',Georgia,serif; font-size:14px; font-weight:700; color:var(--ink); flex:1; }
.xry-divider { display:flex; align-items:center; gap:10px; margin:20px 24px 12px; }
.xry-divider-label { font-size:9px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--ink3); white-space:nowrap; }
.xry-divider-line { flex:1; height:1px; background:var(--border); }
.xry-row { display:grid; grid-template-columns:1fr; gap:3px; padding:12px 24px; border-bottom:1px solid var(--border); }
.xry-row:last-child { border-bottom:none; }
.xry-row-label { font-size:10px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; line-height:1.6; }
.xry-row-value { font-size:13px; color:var(--ink); line-height:1.65; white-space:pre-wrap; }
.xry-badge-yes { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); }
.xry-badge-no  { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--surface2); border:1.5px solid var(--border); color:var(--ink3); }
.xry-diagnosis-badge { display:inline-block; padding:4px 14px; border-radius:100px; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); font-size:13px; font-weight:600; }
.xry-images { padding:16px 24px 20px; }
.xry-images-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; }
.xry-img-wrap { border-radius:10px; overflow:hidden; border:1.5px solid var(--border); background:var(--surface2); aspect-ratio:1; cursor:pointer; transition:var(--tr); box-shadow:var(--sh); }
.xry-img-wrap:hover { border-color:var(--teal-border); box-shadow:0 4px 16px rgba(13,107,94,.18); transform:translateY(-2px); }
.xry-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; }
.xry-comments { padding:0 24px 20px; }
.xry-comment { display:flex; gap:12px; padding:14px 16px; border-radius:10px; background:var(--surface2); border:1px solid var(--border); margin-bottom:10px; }
.xry-comment:last-child { margin-bottom:0; }
.xry-comment-avatar { width:36px; height:36px; border-radius:9px; background:var(--teal-pale); border:1.5px solid var(--teal-border); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
.xry-comment-body { flex:1; min-width:0; }
.xry-comment-meta { display:flex; align-items:center; gap:8px; margin-bottom:5px; flex-wrap:wrap; }
.xry-comment-name { font-size:13px; font-weight:600; color:var(--ink); }
.xry-comment-date { font-size:11px; color:var(--ink3); }
.xry-comment-text { font-size:13px; color:var(--ink2); line-height:1.65; }
.xry-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-size:13px; color:var(--ink3); }
.xry-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:xrySpin .7s linear infinite; }
@keyframes xrySpin { to{transform:rotate(360deg)} }
.xry-error { text-align:center; padding:60px 24px; color:var(--red); font-size:14px; }
.xry-lightbox { position:fixed; inset:0; background:rgba(10,20,40,.85); z-index:9999; display:flex; align-items:center; justify-content:center; padding:24px; backdrop-filter:blur(6px); animation:xryFadeIn .18s ease; }
@keyframes xryFadeIn { from{opacity:0} to{opacity:1} }
.xry-lightbox img { max-width:90vw; max-height:88vh; border-radius:12px; box-shadow:0 24px 80px rgba(0,0,0,.5); }
.xry-lightbox-close { position:absolute; top:20px; right:20px; width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,.15); border:none; color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:var(--tr); }
.xry-lightbox-close:hover { background:rgba(255,255,255,.3); }
@media print {
  .xry-hero, .xry-actions { display:none !important; }
  .xry-body { margin:0; padding:0; max-width:100%; }
  .xry-card { box-shadow:none; border:none; border-radius:0; }
}
`;

export default function XRAYScanerDetails() {
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
          `${API_BASE}/clinic/get-detail-examinations/XRAYscaner/detail/${id}`,
          { withCredentials: true },
        );
        setCtData(response.data);
      } catch (err) {
        console.error(err);
        setError(t("XRAYScanerDetails.page.errors.fetchError"));
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, t]);

  const pdfBaseName = () => ctData?.diagnosis || "xray_report";

  const downloadPDF = async () => {
    try {
      await savePdfFromElement("xry-pdf-content", pdfBaseName(), "xray_report");
    } catch (err) {
      console.error("PDF error:", err);
    }
  };

  const uploadPDF = async () => {
    try {
      await uploadPdfFromElement(
        "xry-pdf-content",
        pdfBaseName(),
        "xray_report",
      );
      alert(t("XRAYScanerDetails.buttons.upload"));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload error");
    }
  };

  const printPage = () => window.print();

  if (loading)
    return (
      <div className="xry-root">
        <style>{CSS}</style>
        <div className="xry-loading">
          <div className="xry-loading-spin" />
          {t("XRAYScanerDetails.page.loading")}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="xry-root">
        <style>{CSS}</style>
        <div className="xry-error">⚠️ {error}</div>
      </div>
    );
  if (!ctData)
    return (
      <div className="xry-root">
        <style>{CSS}</style>
        <div className="xry-error">{t("XRAYScanerDetails.page.noData")}</div>
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
    ctData?.patientId?.fullName || t("XRAYScanerDetails.fields.date");

  return (
    <div className="xry-root">
      <style>{CSS}</style>

      <div className="xry-hero">
        <div className="xry-hero-inner">
          <div className="xry-hero-tag">{t("common:dp.pageTitle.xray")}</div>
          <h1 className="xry-hero-h1">{t("XRAYScanerDetails.page.title")}</h1>
          <p className="xry-hero-sub">
            {patientName} · {dateFormatted}
            {doctorName !== "—" && ` · ${doctorName}`}
          </p>
        </div>
      </div>

      <div className="xry-body">
        <div className="xry-actions">
          <button className="xry-btn xry-btn-primary" onClick={downloadPDF}>
            ⬇ {t("XRAYScanerDetails.buttons.download")}
          </button>
          <button className="xry-btn xry-btn-outline" onClick={uploadPDF}>
            ☁ {t("XRAYScanerDetails.buttons.upload")}
          </button>
          <button className="xry-btn xry-btn-ghost" onClick={printPage}>
            🖨 {t("XRAYScanerDetails.buttons.print")}
          </button>
        </div>

        <div className="xry-card" id="xry-pdf-content">
          <div className="xry-card-head">
            <span className="xry-card-head-icon">🩻</span>
            <span className="xry-card-head-title">
              {t("XRAYScanerDetails.page.title")}
            </span>
          </div>

          <div className="xry-divider">
            <span className="xry-divider-label">
              👤 {t("XRAYScanerDetails.sections.general", "General Info")}
            </span>
            <span className="xry-divider-line" />
          </div>

          <div className="xry-row">
            <span className="xry-row-label">
              {t("XRAYScanerDetails.fields.patient")}
            </span>
            <span className="xry-row-value">{patientName}</span>
          </div>
          <div className="xry-row">
            <span className="xry-row-label">
              {t("XRAYScanerDetails.fields.doctor")}
            </span>
            <span className="xry-row-value">{doctorName}</span>
          </div>
          <div className="xry-row">
            <span className="xry-row-label">
              {t("XRAYScanerDetails.fields.date")}
            </span>
            <span className="xry-row-value">{dateFormatted}</span>
          </div>
          <div className="xry-row">
            <span className="xry-row-label">
              {t("XRAYScanerDetails.fields.nameofexam")}
            </span>
            <span className="xry-row-value">{ctData.nameofexam || "—"}</span>
          </div>
          <div className="xry-row">
            <span className="xry-row-label">
              {t("XRAYScanerDetails.fields.contrastUsed")}
            </span>
            <span className="xry-row-value">
              {ctData.contrastUsed ? (
                <span className="xry-badge-yes">
                  ✓ {t("XRAYScanerDetails.fields.yes")}
                </span>
              ) : (
                <span className="xry-badge-no">
                  ✗ {t("XRAYScanerDetails.fields.no")}
                </span>
              )}
            </span>
          </div>

          <div className="xry-divider">
            <span className="xry-divider-label">
              🔬 {t("XRAYScanerDetails.sections.findings", "Findings")}
            </span>
            <span className="xry-divider-line" />
          </div>

          <div className="xry-row">
            <span className="xry-row-label">
              {t("XRAYScanerDetails.fields.diagnosis")}
            </span>
            <span className="xry-row-value">
              {ctData.diagnosis ? (
                <span className="xry-diagnosis-badge">{ctData.diagnosis}</span>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="xry-row">
            <span className="xry-row-label">
              {t("XRAYScanerDetails.fields.report")}
            </span>
            <span className="xry-row-value">{ctData.report || "—"}</span>
          </div>
          <div className="xry-row">
            <span className="xry-row-label">
              {t("XRAYScanerDetails.fields.recommendations")}
            </span>
            <span className="xry-row-value">{ctData.recomandation || "—"}</span>
          </div>

          {ctData?.images?.length > 0 && (
            <>
              <div className="xry-divider">
                <span className="xry-divider-label">
                  🖼 {t("fields.images")}
                </span>
                <span className="xry-divider-line" />
              </div>
              <div className="xry-images">
                <div className="xry-images-grid">
                  {ctData.images.map((img, index) => (
                    <div
                      key={index}
                      className="xry-img-wrap"
                      onClick={() => setLightboxImg(img)}
                    >
                      <img src={img} alt={`Image ${index}`} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {ctData?.doctorComments?.length > 0 && (
            <>
              <div className="xry-divider">
                <span className="xry-divider-label">
                  💬 {t("XRAYScanerDetails.fields.doctorComments")}
                </span>
                <span className="xry-divider-line" />
              </div>
              <div className="xry-comments">
                {ctData.doctorComments.map((c, i) => (
                  <div key={i} className="xry-comment">
                    <div className="xry-comment-avatar">👨‍⚕️</div>
                    <div className="xry-comment-body">
                      <div className="xry-comment-meta">
                        <span className="xry-comment-name">
                          {c.doctor?.firstName} {c.doctor?.lastName}
                        </span>
                        <span className="xry-comment-date">
                          {new Date(c.date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <div className="xry-comment-text">{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {lightboxImg && (
        <div className="xry-lightbox" onClick={() => setLightboxImg(null)}>
          <button
            className="xry-lightbox-close"
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
