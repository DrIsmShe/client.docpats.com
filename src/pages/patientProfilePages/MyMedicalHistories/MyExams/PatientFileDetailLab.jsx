// PatientFileDetailLab.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const BASE_URL = process.env.REACT_APP_API_URL;

/* ——— хелпер для относительных/абсолютных ссылок ——— */
const resolveHref = (u = "") => {
  if (!u) return "";
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${BASE_URL}${encodeURI(path)}`;
};

export default function PatientFileDetailLab() {
  const { t } = useTranslation("patientExam");
  const { id } = useParams();
  const [labTest, setLabTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/patient-profile/get-my-lab-file-details/files/${encodeURIComponent(
            id
          )}`,
          { withCredentials: true }
        );
        // ожидаем структуру { ok, data } или { data }
        setLabTest(res?.data?.data || res?.data || null);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Ошибка загрузки лабораторного анализа."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const downloadPDF = async () => {
    const element = document.getElementById("labtest-details");
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
    pdf.save(`${labTest?.testType || "labtest"}_report.pdf`);
  };

  const printPage = () => window.print();

  if (loading) return <p style={{ padding: 20 }}>{t("common.loading")}</p>;
  if (error) return <p style={{ padding: 20, color: "#b91c1c" }}>{error}</p>;
  if (!labTest) return <p style={{ padding: 20 }}>{t("common.noData")}</p>;

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      {/* Адаптивные стили: таблица превращается в карточки на узких экранах */}
      <style>{`
        .lab-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 1px 2px rgba(0,0,0,.04);
        }
        .kv {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 12px;
          margin: 6px 0;
        }
        .kv-label { color: #6b7280; }
        .kv-value { word-break: break-word; overflow-wrap: anywhere; white-space: pre-wrap; }

        /* Таблица по умолчанию (десктоп) */
        .lab-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          word-break: break-word;
        }
        .lab-table th,
        .lab-table td {
          border: 1px solid #e5e7eb;
          padding: 10px;
          vertical-align: top;
        }
        .lab-table thead th {
          background: #f9fafb;
          font-weight: 600;
          text-align: left;
        }

        /* Файлы — список */
        .files ul { margin: 0; padding-left: 18px; }
        .files a { text-decoration: underline; }

        /* Комментарии — список */
        .comments ul { margin: 0; padding-left: 18px; }

        /* ✅ Мобильная адаптация: ≤640px — превращаем таблицу в карточки */
        @media (max-width: 640px) {
          .kv { grid-template-columns: 1fr; }
          .kv-label { font-weight: 600; }

          .lab-table {
            border: 0;
          }
          .lab-table thead {
            display: none; /* прячем заголовок */
          }
          .lab-table tr {
            display: grid;
            grid-template-columns: 1fr 1fr; /* подпись / значение */
            gap: 8px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px;
            margin-bottom: 10px;
            background: #fff;
          }
          .lab-table td {
            border: 0; /* уже обрамлено карточкой */
            padding: 0; /* карточка задаёт общий паддинг */
          }
          /* Проставляем подписи колонок через атрибут data-label */
          .lab-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #374151;
            display: block;
            margin-bottom: 2px;
          }
        }
      `}</style>

      <h2 style={{ margin: "0 0 12px 0" }}>
        {t("params.labAnalysis")} {labTest.testType || "—"}
      </h2>

      <div id="labtest-details" className="lab-card">
        {/* Основная информация */}
        <div className="kv">
          <div className="kv-label">{t("card.patient")}</div>
          <div className="kv-value">
            {labTest?.patient?.firstName || "—"}{" "}
            {labTest?.patient?.lastName || ""}
          </div>
        </div>

        <div className="kv">
          <div className="kv-label">{t("card.doctor")}</div>
          <div className="kv-value">
            {labTest?.doctor?.firstName || "—"}{" "}
            {labTest?.doctor?.lastName || ""}
          </div>
        </div>

        <div className="kv">
          <div className="kv-label">{t("card.date")}</div>
          <div className="kv-value">
            {labTest?.date ? new Date(labTest.date).toLocaleDateString() : "—"}
          </div>
        </div>

        <div className="kv">
          <div className="kv-label">{t("card.lab")}</div>
          <div className="kv-value">{labTest.labName || "—"}</div>
        </div>

        <div className="kv">
          <div className="kv-label">{t("report.preliminaryDiagnosis")}</div>
          <div className="kv-value">{labTest.diagnosis || "—"}</div>
        </div>

        <div className="kv">
          <div className="kv-label">{t("report.doctorConclusion")}</div>
          <div className="kv-value">{labTest.report || "—"}</div>
        </div>

        {/* 🧪 Показатели анализа */}
        <h4 style={{ marginTop: 20, marginBottom: 10 }}>
          {t("params.labValues")}
        </h4>

        <table className="lab-table">
          <thead>
            <tr>
              <th>{t("table.parameter")}</th>
              <th>{t("table.value")}</th>
              <th>{t("table.unit")}</th>
              <th>{t("table.norm")}</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(labTest.testParameters) &&
            labTest.testParameters.length > 0 ? (
              labTest.testParameters.map((param, idx) => {
                const isText = param?.valueType === "text";
                const value = isText
                  ? String(param?.value ?? "")
                  : param?.value ?? "—";
                const unit = isText ? "—" : param?.unit || "ед.";
                const rangeMin = param?.referenceRange?.min ?? "—";
                const rangeMax = param?.referenceRange?.max ?? "—";
                return (
                  <tr key={idx}>
                    <td data-label="Параметр">{param.name}</td>
                    <td data-label="Значение">{value}</td>
                    <td data-label="Ед. изм.">{unit}</td>
                    <td data-label="Норма">
                      {rangeMin} – {rangeMax}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td data-label="Параметр">—</td>
                <td data-label="Значение">—</td>
                <td data-label="Ед. изм.">—</td>
                <td data-label="Норма">—</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 📎 Файлы */}
        {Array.isArray(labTest.files) && labTest.files.length > 0 && (
          <div className="files" style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 8 }}>{t("media.attachedFiles")}</h4>
            <ul>
              {labTest.files.map((file, i) => (
                <li key={i}>
                  <a
                    href={resolveHref(file.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {file.fileName || "Файл"}
                    {file.fileFormat
                      ? ` (${String(file.fileFormat).toUpperCase()})`
                      : ""}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 💬 Комментарии */}
        {Array.isArray(labTest.doctorComments) &&
          labTest.doctorComments.length > 0 && (
            <div className="comments" style={{ marginTop: 20 }}>
              <h4 style={{ marginBottom: 8 }}>{t("media.doctorComments")}</h4>
              <ul>
                {labTest.doctorComments.map((comment, idx) => (
                  <li key={idx} style={{ marginBottom: 8 }}>
                    <p style={{ margin: 0 }}>
                      <strong>
                        {comment.doctor?.firstName || "—"}{" "}
                        {comment.doctor?.lastName || ""}
                      </strong>{" "}
                      (
                      {comment.date
                        ? new Date(comment.date).toLocaleDateString()
                        : "—"}
                      ):
                    </p>
                    <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>
                      {comment.text || "—"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>

      {/* Действия */}
      <div
        style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}
      >
        <button onClick={downloadPDF} className="btn btn-primary">
          {t("common.downloadPdf")}
        </button>
        <button onClick={printPage} className="btn btn-secondary">
          {t("common.print")}
        </button>
      </div>
    </div>
  );
}
