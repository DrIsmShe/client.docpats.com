import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Lora:wght@600;700&display=swap');

.eek-root {
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
.eek-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:32px 40px 88px; position:relative; overflow:hidden;
}
.eek-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 110% 50%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 400px at -5% 130%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.eek-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:60px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.eek-hero-inner { position:relative; z-index:1; max-width:960px; }
.eek-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:12px; backdrop-filter:blur(6px);
}
.eek-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; }
.eek-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(18px,2.4vw,26px); font-weight:700;
  color:#fff; line-height:1.2; margin:0 0 8px; letter-spacing:-.01em;
}
.eek-hero-sub { font-size:12px; color:rgba(255,255,255,.55); margin:0; }
.eek-body { max-width:960px; margin:-52px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .eek-body { padding:0 12px; margin-top:-36px; } }
.eek-actions { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.eek-btn {
  display:inline-flex; align-items:center; gap:7px; padding:9px 20px;
  border:none; border-radius:100px; font-family:'DM Sans',sans-serif;
  font-size:12px; font-weight:600; cursor:pointer; transition:var(--tr); white-space:nowrap;
}
.eek-btn-primary { background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%); color:#fff; box-shadow:0 3px 14px rgba(13,107,94,.28); }
.eek-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(13,107,94,.38); }
.eek-btn-outline { background:var(--surface); color:var(--teal); border:1.5px solid var(--teal-border); }
.eek-btn-outline:hover { background:var(--teal-pale); }
.eek-btn-ghost { background:var(--surface2); color:var(--ink2); border:1.5px solid var(--border); }
.eek-btn-ghost:hover { background:var(--border); }
.eek-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:18px; box-shadow:var(--sh-md); overflow:hidden; margin-bottom:20px;
}
.eek-card-head {
  padding:14px 24px; background:var(--surface2); border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:10px;
}
.eek-card-head-icon {
  width:32px; height:32px; border-radius:8px; background:var(--teal-pale);
  border:1px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:15px; flex-shrink:0;
}
.eek-card-head-title { font-family:'Lora',Georgia,serif; font-size:14px; font-weight:700; color:var(--ink); flex:1; }
.eek-divider { display:flex; align-items:center; gap:10px; margin:20px 24px 12px; }
.eek-divider-label { font-size:9px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--ink3); white-space:nowrap; }
.eek-divider-line { flex:1; height:1px; background:var(--border); }
.eek-row { display:grid; grid-template-columns:1fr; gap:3px; padding:12px 24px; border-bottom:1px solid var(--border); }
.eek-row:last-child { border-bottom:none; }
.eek-row-label { font-size:10px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; line-height:1.6; }
.eek-row-value { font-size:13px; color:var(--ink); line-height:1.65; white-space:pre-wrap; }
.eek-badge-yes { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); }
.eek-badge-no  { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; background:var(--surface2); border:1.5px solid var(--border); color:var(--ink3); }
.eek-diagnosis-badge { display:inline-block; padding:4px 14px; border-radius:100px; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); font-size:13px; font-weight:600; }
.eek-images { padding:16px 24px 20px; }
.eek-images-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; }
.eek-img-wrap { border-radius:10px; overflow:hidden; border:1.5px solid var(--border); background:var(--surface2); aspect-ratio:1; cursor:pointer; transition:var(--tr); box-shadow:var(--sh); }
.eek-img-wrap:hover { border-color:var(--teal-border); box-shadow:0 4px 16px rgba(13,107,94,.18); transform:translateY(-2px); }
.eek-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; }
.eek-comments { padding:0 24px 20px; }
.eek-comment { display:flex; gap:12px; padding:14px 16px; border-radius:10px; background:var(--surface2); border:1px solid var(--border); margin-bottom:10px; }
.eek-comment:last-child { margin-bottom:0; }
.eek-comment-avatar { width:36px; height:36px; border-radius:9px; background:var(--teal-pale); border:1.5px solid var(--teal-border); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
.eek-comment-body { flex:1; min-width:0; }
.eek-comment-meta { display:flex; align-items:center; gap:8px; margin-bottom:5px; flex-wrap:wrap; }
.eek-comment-name { font-size:13px; font-weight:600; color:var(--ink); }
.eek-comment-date { font-size:11px; color:var(--ink3); }
.eek-comment-text { font-size:13px; color:var(--ink2); line-height:1.65; }
.eek-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-size:13px; color:var(--ink3); }
.eek-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:eekSpin .7s linear infinite; }
@keyframes eekSpin { to{transform:rotate(360deg)} }
.eek-error { text-align:center; padding:60px 24px; color:var(--red); font-size:14px; }
.eek-lightbox { position:fixed; inset:0; background:rgba(10,20,40,.85); z-index:9999; display:flex; align-items:center; justify-content:center; padding:24px; backdrop-filter:blur(6px); animation:eekFadeIn .18s ease; }
@keyframes eekFadeIn { from{opacity:0} to{opacity:1} }
.eek-lightbox img { max-width:90vw; max-height:88vh; border-radius:12px; box-shadow:0 24px 80px rgba(0,0,0,.5); }
.eek-lightbox-close { position:absolute; top:20px; right:20px; width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,.15); border:none; color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:var(--tr); }
.eek-lightbox-close:hover { background:rgba(255,255,255,.3); }
@media print {
  .eek-hero, .eek-actions { display:none !important; }
  .eek-body { margin:0; padding:0; max-width:100%; }
  .eek-card { box-shadow:none; border:none; border-radius:0; }
}
`;

export default function EchoEKGScanerDetails() {
  const { id } = useParams();
  const { t } = useTranslation("templateExaminations");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/clinic/get-detail-examinations/EchoEKGscaner/detail/${id}`,
          { withCredentials: true },
        );
        setData(response.data);
      } catch (err) {
        setError(t("EchoEKGScanerDetails.page.errors.fetchError"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, t]);

  const downloadPDF = async () => {
    try {
      const element = document.getElementById("eek-pdf-content");
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const fileName = data?.diagnosis || "medical_history";
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`${fileName}_medical_history.pdf`);
    } catch (error) {
      console.error("Error creating PDF:", error);
    }
  };

  const uploadPDF = async () => {
    try {
      const element = document.getElementById("eek-pdf-content");
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      const pdfBlob = pdf.output("blob");
      const fileName = data?.diagnosis || "medical_history";
      const pdfFile = new File([pdfBlob], `${fileName}_medical_history.pdf`, {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.append("file", pdfFile);
      const response = await axios.post(`${API_BASE}/api/uploadr`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(
        `${t("EchoEKGScanerDetails.page.messages.uploadSuccess")} ${response.data.fileUrl}`,
      );
    } catch (error) {
      console.error("PDF upload error:", error);
      alert(t("EchoEKGScanerDetails.page.messages.uploadError"));
    }
  };

  const printPage = () => window.print();

  if (loading)
    return (
      <div className="eek-root">
        <style>{CSS}</style>
        <div className="eek-loading">
          <div className="eek-loading-spin" />
          {t("EchoEKGScanerDetails.page.loading")}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="eek-root">
        <style>{CSS}</style>
        <div className="eek-error">⚠️ {error}</div>
      </div>
    );
  if (!data)
    return (
      <div className="eek-root">
        <style>{CSS}</style>
        <div className="eek-error">{t("EchoEKGScanerDetails.page.noData")}</div>
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
    data?.patientId?.fullName || t("EchoEKGScanerDetails.page.noData");

  return (
    <div className="eek-root">
      <style>{CSS}</style>

      <div className="eek-hero">
        <div className="eek-hero-inner">
          <div className="eek-hero-tag">DocPats · Echo EKG</div>
          <h1 className="eek-hero-h1">
            {t("EchoEKGScanerDetails.page.title")}
          </h1>
          <p className="eek-hero-sub">
            {patientName} · {dateFormatted}
            {doctorName !== "—" && ` · ${doctorName}`}
          </p>
        </div>
      </div>

      <div className="eek-body">
        <div className="eek-actions">
          <button className="eek-btn eek-btn-primary" onClick={downloadPDF}>
            ⬇ {t("EchoEKGScanerDetails.buttons.download")}
          </button>
          <button className="eek-btn eek-btn-outline" onClick={uploadPDF}>
            ☁ {t("EchoEKGScanerDetails.buttons.upload")}
          </button>
          <button className="eek-btn eek-btn-ghost" onClick={printPage}>
            🖨 {t("EchoEKGScanerDetails.buttons.print")}
          </button>
        </div>

        <div className="eek-card" id="eek-pdf-content">
          <div className="eek-card-head">
            <span className="eek-card-head-icon">📡</span>
            <span className="eek-card-head-title">
              {t("EchoEKGScanerDetails.page.title")}
            </span>
          </div>

          <div className="eek-divider">
            <span className="eek-divider-label">
              👤 {t("EchoEKGScanerDetails.sections.general", "General Info")}
            </span>
            <span className="eek-divider-line" />
          </div>

          <div className="eek-row">
            <span className="eek-row-label">
              {t("EchoEKGScanerDetails.fields.patient")}
            </span>
            <span className="eek-row-value">{patientName}</span>
          </div>
          <div className="eek-row">
            <span className="eek-row-label">
              {t("EchoEKGScanerDetails.fields.doctor")}
            </span>
            <span className="eek-row-value">{doctorName}</span>
          </div>
          <div className="eek-row">
            <span className="eek-row-label">
              {t("EchoEKGScanerDetails.fields.date")}
            </span>
            <span className="eek-row-value">{dateFormatted}</span>
          </div>
          <div className="eek-row">
            <span className="eek-row-label">
              {t("EchoEKGScanerDetails.fields.nameofexam")}
            </span>
            <span className="eek-row-value">{data.nameofexam || "—"}</span>
          </div>
          <div className="eek-row">
            <span className="eek-row-label">
              {t("EchoEKGScanerDetails.fields.contrastUsed")}
            </span>
            <span className="eek-row-value">
              {data.contrastUsed ? (
                <span className="eek-badge-yes">
                  ✓ {t("EchoEKGScanerDetails.fields.yes")}
                </span>
              ) : (
                <span className="eek-badge-no">
                  ✗ {t("EchoEKGScanerDetails.fields.no")}
                </span>
              )}
            </span>
          </div>

          <div className="eek-divider">
            <span className="eek-divider-label">
              🔬 {t("EchoEKGScanerDetails.sections.findings", "Findings")}
            </span>
            <span className="eek-divider-line" />
          </div>

          <div className="eek-row">
            <span className="eek-row-label">
              {t("EchoEKGScanerDetails.fields.diagnosis")}
            </span>
            <span className="eek-row-value">
              {data.diagnosis ? (
                <span className="eek-diagnosis-badge">{data.diagnosis}</span>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="eek-row">
            <span className="eek-row-label">
              {t("EchoEKGScanerDetails.fields.report")}
            </span>
            <span className="eek-row-value">{data.report || "—"}</span>
          </div>
          <div className="eek-row">
            <span className="eek-row-label">
              {t("EchoEKGScanerDetails.fields.recomandation")}
            </span>
            <span className="eek-row-value">{data.recomandation || "—"}</span>
          </div>

          {data?.images?.length > 0 && (
            <>
              <div className="eek-divider">
                <span className="eek-divider-label">
                  🖼 {t("EchoEKGScanerDetails.fields.images")}
                </span>
                <span className="eek-divider-line" />
              </div>
              <div className="eek-images">
                <div className="eek-images-grid">
                  {data.images.map((img, index) => (
                    <div
                      key={index}
                      className="eek-img-wrap"
                      onClick={() => setLightboxImg(img)}
                    >
                      <img src={img} alt={`Image ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {data?.doctorComments?.length > 0 && (
            <>
              <div className="eek-divider">
                <span className="eek-divider-label">
                  💬 {t("EchoEKGScanerDetails.fields.doctorComments")}
                </span>
                <span className="eek-divider-line" />
              </div>
              <div className="eek-comments">
                {data.doctorComments.map((comment, index) => (
                  <div key={index} className="eek-comment">
                    <div className="eek-comment-avatar">👨‍⚕️</div>
                    <div className="eek-comment-body">
                      <div className="eek-comment-meta">
                        <span className="eek-comment-name">
                          {comment.doctor?.firstName} {comment.doctor?.lastName}
                        </span>
                        <span className="eek-comment-date">
                          {new Date(comment.date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <div className="eek-comment-text">{comment.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {lightboxImg && (
        <div className="eek-lightbox" onClick={() => setLightboxImg(null)}>
          <button
            className="eek-lightbox-close"
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
