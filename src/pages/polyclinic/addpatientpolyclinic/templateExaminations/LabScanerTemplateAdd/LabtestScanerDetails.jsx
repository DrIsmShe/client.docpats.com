import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Lora:wght@600;700&display=swap');

.lab-root {
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
.lab-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:32px 40px 88px; position:relative; overflow:hidden;
}
.lab-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 110% 50%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 400px at -5% 130%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.lab-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:60px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.lab-hero-inner { position:relative; z-index:1; max-width:960px; }
.lab-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:12px; backdrop-filter:blur(6px);
}
.lab-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; }
.lab-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(18px,2.4vw,26px); font-weight:700;
  color:#fff; line-height:1.2; margin:0 0 8px; letter-spacing:-.01em;
}
.lab-hero-sub { font-size:12px; color:rgba(255,255,255,.55); margin:0; }
.lab-body { max-width:960px; margin:-52px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .lab-body { padding:0 12px; margin-top:-36px; } }
.lab-actions { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.lab-btn {
  display:inline-flex; align-items:center; gap:7px; padding:9px 20px;
  border:none; border-radius:100px; font-family:'DM Sans',sans-serif;
  font-size:12px; font-weight:600; cursor:pointer; transition:var(--tr); white-space:nowrap;
}
.lab-btn-primary { background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%); color:#fff; box-shadow:0 3px 14px rgba(13,107,94,.28); }
.lab-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(13,107,94,.38); }
.lab-btn-outline { background:var(--surface); color:var(--teal); border:1.5px solid var(--teal-border); }
.lab-btn-outline:hover { background:var(--teal-pale); }
.lab-btn-ghost { background:var(--surface2); color:var(--ink2); border:1.5px solid var(--border); }
.lab-btn-ghost:hover { background:var(--border); }
.lab-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:18px; box-shadow:var(--sh-md); overflow:hidden; margin-bottom:20px;
}
.lab-card-head {
  padding:14px 24px; background:var(--surface2); border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:10px;
}
.lab-card-head-icon {
  width:32px; height:32px; border-radius:8px; background:var(--teal-pale);
  border:1px solid var(--teal-border); display:flex; align-items:center;
  justify-content:center; font-size:15px; flex-shrink:0;
}
.lab-card-head-title { font-family:'Lora',Georgia,serif; font-size:14px; font-weight:700; color:var(--ink); flex:1; }
.lab-divider { display:flex; align-items:center; gap:10px; margin:20px 24px 12px; }
.lab-divider-label { font-size:9px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--ink3); white-space:nowrap; }
.lab-divider-line { flex:1; height:1px; background:var(--border); }
.lab-row { display:grid; grid-template-columns:1fr; gap:3px; padding:12px 24px; border-bottom:1px solid var(--border); }
.lab-row:last-child { border-bottom:none; }
.lab-row-label { font-size:10px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; line-height:1.6; }
.lab-row-value { font-size:13px; color:var(--ink); line-height:1.65; white-space:pre-wrap; }
.lab-diagnosis-badge { display:inline-block; padding:4px 14px; border-radius:100px; background:var(--teal-pale); border:1.5px solid var(--teal-border); color:var(--teal); font-size:13px; font-weight:600; }

/* ── PARAMS TABLE ── */
.lab-table-wrap { padding:4px 24px 20px; overflow-x:auto; }
.lab-table {
  width:100%; border-collapse:collapse; font-size:13px;
}
.lab-table th {
  text-align:left; padding:9px 14px; font-size:10px; font-weight:700;
  letter-spacing:.07em; text-transform:uppercase; color:var(--ink3);
  background:var(--surface2); border-bottom:2px solid var(--border);
}
.lab-table td {
  padding:10px 14px; border-bottom:1px solid var(--border); color:var(--ink2);
  vertical-align:middle;
}
.lab-table tr:last-child td { border-bottom:none; }
.lab-table tr:hover td { background:var(--teal-pale); }
.lab-param-name { font-weight:600; color:var(--ink); }
.lab-param-value { font-weight:700; color:var(--teal); font-size:14px; }

/* ── FILES ── */
.lab-files { padding:0 24px 20px; display:flex; flex-direction:column; gap:8px; }
.lab-file-item {
  display:flex; align-items:center; gap:10px; padding:10px 14px;
  border-radius:8px; background:var(--surface2); border:1px solid var(--border);
  text-decoration:none; color:var(--ink); transition:var(--tr);
}
.lab-file-item:hover { background:var(--teal-pale); border-color:var(--teal-border); }
.lab-file-icon { font-size:18px; flex-shrink:0; }
.lab-file-name { font-size:13px; font-weight:600; flex:1; }
.lab-file-format { font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--ink3); background:var(--border); padding:2px 7px; border-radius:4px; }

/* ── COMMENTS ── */
.lab-comments { padding:0 24px 20px; }
.lab-comment { display:flex; gap:12px; padding:14px 16px; border-radius:10px; background:var(--surface2); border:1px solid var(--border); margin-bottom:10px; }
.lab-comment:last-child { margin-bottom:0; }
.lab-comment-avatar { width:36px; height:36px; border-radius:9px; background:var(--teal-pale); border:1.5px solid var(--teal-border); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
.lab-comment-body { flex:1; min-width:0; }
.lab-comment-meta { display:flex; align-items:center; gap:8px; margin-bottom:5px; flex-wrap:wrap; }
.lab-comment-name { font-size:13px; font-weight:600; color:var(--ink); }
.lab-comment-date { font-size:11px; color:var(--ink3); }
.lab-comment-text { font-size:13px; color:var(--ink2); line-height:1.65; }

.lab-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-size:13px; color:var(--ink3); }
.lab-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:labSpin .7s linear infinite; }
@keyframes labSpin { to{transform:rotate(360deg)} }
.lab-error { text-align:center; padding:60px 24px; color:var(--red); font-size:14px; }
.lab-lightbox { position:fixed; inset:0; background:rgba(10,20,40,.85); z-index:9999; display:flex; align-items:center; justify-content:center; padding:24px; backdrop-filter:blur(6px); animation:labFadeIn .18s ease; }
@keyframes labFadeIn { from{opacity:0} to{opacity:1} }
.lab-lightbox img { max-width:90vw; max-height:88vh; border-radius:12px; box-shadow:0 24px 80px rgba(0,0,0,.5); }
.lab-lightbox-close { position:absolute; top:20px; right:20px; width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,.15); border:none; color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:var(--tr); }
.lab-lightbox-close:hover { background:rgba(255,255,255,.3); }
@media print {
  .lab-hero, .lab-actions { display:none !important; }
  .lab-body { margin:0; padding:0; max-width:100%; }
  .lab-card { box-shadow:none; border:none; border-radius:0; }
}
`;

export default function LabtestScanerDetails() {
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
          `${API_BASE}/clinic/get-detail-examinations/LabtestScaner/detail/${id}`,
          { withCredentials: true },
        );
        setData(response.data.data);
      } catch (err) {
        console.error(err);
        setError(t("page.errors.fetchError"));
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, t, API_BASE]);

  const downloadPDF = async () => {
    try {
      const element = document.getElementById("lab-pdf-content");
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const fileName = data?.testType || "labtest";
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`${fileName}_labtest.pdf`);
    } catch (error) {
      console.error("Error creating PDF:", error);
    }
  };

  const uploadPDF = async () => {
    try {
      const element = document.getElementById("lab-pdf-content");
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      const pdfBlob = pdf.output("blob");
      const fileName = data?.testType || "labtest";
      const pdfFile = new File([pdfBlob], `${fileName}_labtest.pdf`, {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.append("file", pdfFile);
      const response = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(
        `${t("LabtestScanerDetails.page.messages.uploadSuccess")} ${response.data.fileUrl}`,
      );
    } catch (error) {
      console.error("PDF upload error:", error);
      alert(t("LabtestScanerDetails.page.messages.uploadError"));
    }
  };

  const printPage = () => window.print();

  if (loading)
    return (
      <div className="lab-root">
        <style>{CSS}</style>
        <div className="lab-loading">
          <div className="lab-loading-spin" />
          {t("page.loading")}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="lab-root">
        <style>{CSS}</style>
        <div className="lab-error">⚠️ {error}</div>
      </div>
    );
  if (!data)
    return (
      <div className="lab-root">
        <style>{CSS}</style>
        <div className="lab-error">{t("LabtestScanerDetails.page.noData")}</div>
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
  const patientName = data.patient
    ? `${data.patient.firstName || ""} ${data.patient.lastName || ""}`.trim()
    : "—";

  return (
    <div className="lab-root">
      <style>{CSS}</style>

      <div className="lab-hero">
        <div className="lab-hero-inner">
          <div className="lab-hero-tag">DocPats · Lab Test</div>
          <h1 className="lab-hero-h1">
            {t("LabtestScanerDetails.page.title")}
          </h1>
          <p className="lab-hero-sub">
            {patientName} · {dateFormatted}
            {doctorName !== "—" && ` · ${doctorName}`}
          </p>
        </div>
      </div>

      <div className="lab-body">
        <div className="lab-actions">
          <button className="lab-btn lab-btn-primary" onClick={downloadPDF}>
            ⬇ {t("LabtestScanerDetails.buttons.download")}
          </button>
          <button className="lab-btn lab-btn-outline" onClick={uploadPDF}>
            ☁ {t("LabtestScanerDetails.buttons.upload")}
          </button>
          <button className="lab-btn lab-btn-ghost" onClick={printPage}>
            🖨 {t("LabtestScanerDetails.buttons.print")}
          </button>
        </div>

        <div className="lab-card" id="lab-pdf-content">
          <div className="lab-card-head">
            <span className="lab-card-head-icon">🧪</span>
            <span className="lab-card-head-title">
              {t("LabtestScanerDetails.page.title")}
            </span>
          </div>

          {/* General info */}
          <div className="lab-divider">
            <span className="lab-divider-label">
              👤 {t("LabtestScanerDetails.sections.general", "General Info")}
            </span>
            <span className="lab-divider-line" />
          </div>

          <div className="lab-row">
            <span className="lab-row-label">
              {t("LabtestScanerDetails.fields.patient")}
            </span>
            <span className="lab-row-value">{patientName}</span>
          </div>
          <div className="lab-row">
            <span className="lab-row-label">
              {t("LabtestScanerDetails.fields.doctor")}
            </span>
            <span className="lab-row-value">{doctorName}</span>
          </div>
          <div className="lab-row">
            <span className="lab-row-label">
              {t("LabtestScanerDetails.fields.date")}
            </span>
            <span className="lab-row-value">{dateFormatted}</span>
          </div>
          <div className="lab-row">
            <span className="lab-row-label">
              {t("LabtestScanerDetails.fields.labName")}
            </span>
            <span className="lab-row-value">{data.labName || "—"}</span>
          </div>

          {/* Findings */}
          <div className="lab-divider">
            <span className="lab-divider-label">
              🔬 {t("LabtestScanerDetails.sections.findings", "Findings")}
            </span>
            <span className="lab-divider-line" />
          </div>

          <div className="lab-row">
            <span className="lab-row-label">
              {t("LabtestScanerDetails.fields.diagnosis")}
            </span>
            <span className="lab-row-value">
              {data.diagnosis ? (
                <span className="lab-diagnosis-badge">{data.diagnosis}</span>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="lab-row">
            <span className="lab-row-label">
              {t("LabtestScanerDetails.fields.report")}
            </span>
            <span className="lab-row-value">{data.report || "—"}</span>
          </div>

          {/* Parameters table */}
          {data.testParameters?.length > 0 && (
            <>
              <div className="lab-divider">
                <span className="lab-divider-label">
                  📊 {t("LabtestScanerDetails.fields.parameters")}
                </span>
                <span className="lab-divider-line" />
              </div>
              <div className="lab-table-wrap">
                <table className="lab-table">
                  <thead>
                    <tr>
                      <th>{t("LabtestScanerDetails.fields.paramName")}</th>
                      <th>{t("LabtestScanerDetails.fields.paramValue")}</th>
                      <th>{t("LabtestScanerDetails.fields.unit")}</th>
                      <th>{t("LabtestScanerDetails.fields.reference")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.testParameters.map((param, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="lab-param-name">{param.name}</span>
                        </td>
                        <td>
                          <span className="lab-param-value">{param.value}</span>
                        </td>
                        <td>{param.unit}</td>
                        <td>
                          {param.referenceRange?.min} –{" "}
                          {param.referenceRange?.max}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Files */}
          {data.files?.length > 0 && (
            <>
              <div className="lab-divider">
                <span className="lab-divider-label">
                  📎 {t("LabtestScanerDetails.fields.files")}
                </span>
                <span className="lab-divider-line" />
              </div>
              <div className="lab-files">
                {data.files.map((file, i) => (
                  <a
                    key={i}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="lab-file-item"
                  >
                    <span className="lab-file-icon">📄</span>
                    <span className="lab-file-name">{file.fileName}</span>
                    {file.fileFormat && (
                      <span className="lab-file-format">
                        {file.fileFormat.toUpperCase()}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </>
          )}

          {/* Doctor comments */}
          {data.doctorComments?.length > 0 && (
            <>
              <div className="lab-divider">
                <span className="lab-divider-label">
                  💬 {t("LabtestScanerDetails.fields.doctorComments")}
                </span>
                <span className="lab-divider-line" />
              </div>
              <div className="lab-comments">
                {data.doctorComments.map((comment, index) => (
                  <div key={index} className="lab-comment">
                    <div className="lab-comment-avatar">👨‍⚕️</div>
                    <div className="lab-comment-body">
                      <div className="lab-comment-meta">
                        <span className="lab-comment-name">
                          {comment.doctor?.firstName} {comment.doctor?.lastName}
                        </span>
                        <span className="lab-comment-date">
                          {new Date(comment.date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <div className="lab-comment-text">{comment.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {lightboxImg && (
        <div className="lab-lightbox" onClick={() => setLightboxImg(null)}>
          <button
            className="lab-lightbox-close"
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
