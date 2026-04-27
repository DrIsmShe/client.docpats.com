// MyMedicalHistoryDetail.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FaDownload } from "react-icons/fa";
import { useTranslation } from "react-i18next";

/** ───────────── Иконки ───────────── */
const IconCalendar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconUser = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconMapPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconStethoscope = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 2v2" /><path d="M5 2v2" /><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" /><path d="M8 15a6 6 0 0 0 12 0v-3" /><circle cx="20" cy="10" r="2" />
  </svg>
);

/** ───────────── Стили ───────────── */
const MHDStyles = () => (
  <style>{`
    .mhd-wrap, .mhd-wrap *, .mhd-wrap *::before, .mhd-wrap *::after {
      box-sizing: border-box;
    }

    .mhd-wrap {
      width: 100%;
      max-width: 960px;
      min-width: 0;
      margin: 0 auto;
      padding: clamp(12px, 2vw, 32px) clamp(8px, 1.5vw, 20px) clamp(40px, 6vw, 80px);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      overflow-x: clip;
      overflow-x: hidden;
    }

    /* ── Document (PDF target) ── */
    .mhd-document {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      background: white;
      border-radius: clamp(14px, 2vw, 18px);
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 12px 40px -16px rgba(15, 23, 42, 0.18);
      margin-bottom: clamp(14px, 2vw, 24px);
    }

    /* ── Document header ── */
    .mhd-doc-header {
      position: relative;
      padding: clamp(22px, 3.5vw, 34px) clamp(18px, 3vw, 40px) clamp(20px, 3vw, 30px);
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 55%, #0369a1 100%);
      color: white;
      overflow: hidden;
    }
    .mhd-doc-header::before {
      content: "";
      position: absolute;
      top: -100px; right: -60px;
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
      pointer-events: none;
    }
    .mhd-doc-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      position: relative;
      z-index: 1;
      gap: 12px;
      flex-wrap: wrap;
    }
    .mhd-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: clamp(11px, 1.2vw, 12px);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.92);
      background: rgba(255,255,255,0.14);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 5px 12px;
      border-radius: 999px;
      font-weight: 600;
    }
    .mhd-brand-mark {
      width: 18px; height: 18px;
      border-radius: 5px;
      background: white;
      color: #0891b2;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 0;
      flex-shrink: 0;
    }
    .mhd-doc-date {
      font-size: clamp(11px, 1.2vw, 12px);
      color: rgba(255,255,255,0.92);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 6px 12px;
      border-radius: 10px;
      max-width: 100%;
    }
    .mhd-doc-date svg { flex-shrink: 0; }
    .mhd-doc-date span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mhd-doc-title {
      font-size: clamp(20px, 3vw, 30px);
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0;
      position: relative;
      z-index: 1;
      line-height: 1.2;
      word-wrap: break-word;
    }
    .mhd-doc-subtitle {
      font-size: clamp(12px, 1.4vw, 13px);
      color: rgba(255,255,255,0.85);
      margin: 6px 0 0;
      position: relative;
      z-index: 1;
    }

    /* ── Body ── */
    .mhd-body {
      padding: clamp(20px, 3vw, 32px) clamp(16px, 3vw, 40px);
    }

    /* ── Patient hero ── */
    .mhd-patient-hero {
      display: flex;
      align-items: center;
      gap: clamp(14px, 2vw, 22px);
      padding: clamp(16px, 2.4vw, 22px);
      background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
      border: 1px solid #a5f3fc;
      border-radius: 14px;
      margin-bottom: clamp(20px, 3vw, 28px);
      max-width: 100%;
      min-width: 0;
    }
    .mhd-photo {
      width: clamp(72px, 12vw, 96px);
      height: clamp(72px, 12vw, 96px);
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(8, 145, 178, 0.2);
      flex-shrink: 0;
      background: white;
    }
    .mhd-patient-summary { flex: 1 1 0; min-width: 0; max-width: 100%; }
    .mhd-patient-name {
      font-size: clamp(17px, 2.4vw, 22px);
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px;
      line-height: 1.2;
      word-wrap: break-word;
    }
    .mhd-patient-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
      font-size: clamp(12px, 1.4vw, 13px);
      color: #475569;
    }
    .mhd-patient-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      max-width: 100%;
    }
    .mhd-patient-meta-item svg { color: #0891b2; flex-shrink: 0; }
    .mhd-patient-meta-item > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    @media (max-width: 560px) {
      .mhd-patient-hero {
        flex-direction: column;
        text-align: center;
      }
      .mhd-patient-meta { justify-content: center; }
    }

    /* ── Section ── */
    .mhd-section { margin-bottom: clamp(20px, 3vw, 28px); }
    .mhd-section:last-child { margin-bottom: 0; }
    .mhd-section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #0891b2;
      margin: 0 0 14px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ecfeff;
      flex-wrap: wrap;
    }
    .mhd-section-title-num {
      width: 22px; height: 22px;
      border-radius: 6px;
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0;
      flex-shrink: 0;
    }

    /* ── Grids: 3 → 2 → 1 ── */
    .mhd-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    @media (max-width: 768px) {
      .mhd-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 480px) {
      .mhd-grid-3 { grid-template-columns: minmax(0, 1fr); }
    }

    .mhd-field {
      padding: clamp(10px, 1.6vw, 12px) clamp(12px, 1.8vw, 14px);
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      min-width: 0;
      max-width: 100%;
    }
    .mhd-field-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .mhd-field-value {
      font-size: clamp(13px, 1.5vw, 14px);
      color: #0f172a;
      font-weight: 500;
      word-wrap: break-word;
      line-height: 1.5;
    }
    .mhd-field-value.empty { color: #94a3b8; font-weight: 400; font-style: italic; }

    /* ── Full-width field (длинный текст: жалобы, анамнез, статус и т.д.) ──
       КРИТИЧНО для текстовых полей с переносами строк из БД:
       - white-space: pre-line  → уважает \\n но СЖИМАЕТ множественные пробелы
       - НЕ используем pre-wrap (он рендерит каждый "\\n" как отдельную строку
         даже если в БД они стоят между короткими фразами — выглядит как столбец)
       - НЕ используем overflow-wrap: anywhere (он рвёт слова где попало)
       - НЕ ставим overflow: hidden (мешает естественному переносу) */
    .mhd-field-full {
      padding: clamp(12px, 1.8vw, 14px) clamp(14px, 2vw, 16px);
      background: white;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #0891b2;
      border-radius: 10px;
      margin-bottom: 10px;
      max-width: 100%;
    }
    .mhd-field-full:last-child { margin-bottom: 0; }
    .mhd-field-full .mhd-field-value {
      font-size: clamp(13px, 1.5vw, 14px);
      line-height: 1.7;
      white-space: normal;
      word-wrap: break-word;
      display: block;
    }

    /* Highlight (диагноз) */
    .mhd-highlight {
      padding: clamp(14px, 2vw, 16px) clamp(14px, 2.2vw, 18px);
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #fcd34d;
      border-radius: 12px;
      margin-bottom: 10px;
      max-width: 100%;
    }
    .mhd-highlight .mhd-field-label { color: #92400e; }
    .mhd-highlight .mhd-field-value {
      font-size: clamp(15px, 1.8vw, 16px);
      font-weight: 600;
      color: #78350f;
      word-wrap: break-word;
      white-space: pre-line;
    }

    /* Doctor card */
    .mhd-doctor-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: clamp(14px, 2vw, 16px) clamp(14px, 2.2vw, 18px);
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      max-width: 100%;
      min-width: 0;
    }
    .mhd-doctor-avatar {
      width: 48px; height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%);
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(30, 64, 175, 0.25);
    }
    .mhd-doctor-info { flex: 1 1 0; min-width: 0; max-width: 100%; }
    .mhd-doctor-label {
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #1e40af;
      font-weight: 700;
      margin-bottom: 3px;
    }
    .mhd-doctor-name {
      font-size: clamp(14px, 1.7vw, 16px);
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
      word-wrap: break-word;
    }
    .mhd-doctor-spec {
      font-size: clamp(12px, 1.4vw, 13px);
      color: #475569;
      font-style: italic;
      margin-top: 2px;
      word-wrap: break-word;
    }

    /* Download button (вне pdfRef) */
    .mhd-download-wrap {
      text-align: center;
      margin-top: clamp(18px, 2.5vw, 24px);
    }
    .mhd-download-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: clamp(11px, 1.6vw, 13px) clamp(20px, 3vw, 26px);
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: clamp(13px, 1.5vw, 14px);
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 6px 18px -6px rgba(8, 145, 178, 0.5);
      transition: all 0.2s ease;
      min-height: 44px;
    }
    .mhd-download-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 10px 24px -6px rgba(8, 145, 178, 0.6);
    }
    .mhd-download-btn:active:not(:disabled) { transform: translateY(0); }
    .mhd-download-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .mhd-pdf-spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: mhd-spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    /* Class added during PDF generation */
    .mhd-pdf-rendering .mhd-section,
    .mhd-pdf-rendering .mhd-field-full,
    .mhd-pdf-rendering .mhd-highlight,
    .mhd-pdf-rendering .mhd-doctor-card,
    .mhd-pdf-rendering .mhd-patient-hero {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* States */
    .mhd-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: clamp(48px, 8vw, 80px) 20px;
      color: #64748b;
      font-size: 14px;
    }
    .mhd-spinner {
      width: 20px; height: 20px;
      border: 2.5px solid #e2e8f0;
      border-top-color: #0891b2;
      border-radius: 50%;
      animation: mhd-spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    @keyframes mhd-spin { to { transform: rotate(360deg); } }

    .mhd-alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 18px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      margin: 24px 0;
      max-width: 100%;
      word-wrap: break-word;
    }
    .mhd-alert.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }
    .mhd-alert.empty {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #64748b;
      color: #334155;
    }

    @media (max-width: 380px) {
      .mhd-wrap { padding: 10px 6px 40px; }
      .mhd-doc-header { padding: 18px 14px 16px; }
      .mhd-body { padding: 16px 14px; }
      .mhd-patient-hero { padding: 14px; }
    }
  `}</style>
);

export default function MyMedicalHistoryDetail() {
  const { id } = useParams();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const { t, i18n } = useTranslation("PatuentTranslate");
  const pdfRef = useRef();
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!id) return setError(t("myMedicalHistoryDetail.errors.noId"));

    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/patient-profile/get-my-medical-history-details/${id}`,
          { withCredentials: true }
        );
        setHistory(res.data.data);
      } catch (err) {
        console.error("Ошибка при получении:", err);
        setError(t("myMedicalHistoryDetail.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id, API_BASE, t]);

  /**
   * 🔹 Многостраничный PDF
   */
  const downloadPDF = async () => {
    const element = pdfRef.current;
    if (!element || pdfBusy) return;

    try {
      setPdfBusy(true);

      element.classList.add("mhd-pdf-rendering");
      await new Promise((r) => requestAnimationFrame(r));

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = pdfHeight - margin * 2;

      const imgFullHeightMm = (canvas.height * contentWidth) / canvas.width;

      if (imgFullHeightMm <= contentHeight) {
        pdf.addImage(imgData, "PNG", margin, margin, contentWidth, imgFullHeightMm);
      } else {
        let heightLeftMm = imgFullHeightMm;
        let positionMm = margin;

        pdf.addImage(imgData, "PNG", margin, positionMm, contentWidth, imgFullHeightMm);
        heightLeftMm -= contentHeight;

        while (heightLeftMm > 0) {
          positionMm = positionMm - contentHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", margin, positionMm, contentWidth, imgFullHeightMm);
          heightLeftMm -= contentHeight;
        }
      }

      const safeName = (history?.diagnosis || "medical_history")
        .toString()
        .replace(/[\\/:*?"<>|\n\r]+/g, "_")
        .slice(0, 80) || "medical_history";

      pdf.save(`${safeName}.pdf`);
    } catch (e) {
      console.error("Ошибка при генерации PDF:", e);
      alert(t("myMedicalHistoryDetail.errors.pdfFailed"));
    } finally {
      element?.classList.remove("mhd-pdf-rendering");
      setPdfBusy(false);
    }
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return "—";
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} ${t("myMedicalHistoryDetail.units.years")}`;
  };

  /** Helper для рендера значения с fallback */
  const renderValue = (value) =>
    value ? (
      <span className="mhd-field-value">{value}</span>
    ) : (
      <span className="mhd-field-value empty">
        {t("myMedicalHistoryDetail.empty.notSpecified")}
      </span>
    );

  /** Loading */
  if (loading) {
    return (
      <div className="mhd-wrap">
        <MHDStyles />
        <div className="mhd-loading">
          <span className="mhd-spinner" />
          <span>{t("myMedicalHistoryDetail.states.loading")}</span>
        </div>
      </div>
    );
  }

  /** Error */
  if (error) {
    return (
      <div className="mhd-wrap">
        <MHDStyles />
        <div className="mhd-alert error" role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="mhd-wrap">
        <MHDStyles />
        <div className="mhd-alert empty">
          <span>{t("myMedicalHistoryDetail.states.notFound")}</span>
        </div>
      </div>
    );
  }

  const doctor = history.doctorId;

  // 🔧 В БД MedicalHistory поле называется `patientRef` (NewPatientPolyclinic),
  // а не `patientId`. Оставляем оба варианта для обратной совместимости.
  const patient = history.patientRef || history.patientId;

  // 🔧 User-запись, привязанная к пациенту клиники (для ФИО из User)
  const patientUser = patient?.linkedUserId || patient?.user || null;

  // 🔧 Имя / фамилия: ищем в пациенте, потом в User. Если там только *Encrypted —
  // фронт их не покажет (это должен делать бэк расшифровкой).
  const patientFirstName =
    patient?.firstName ||
    patient?.firstNameDecrypted ||
    patientUser?.firstName ||
    patientUser?.firstNameDecrypted ||
    "";
  const patientLastName =
    patient?.lastName ||
    patient?.lastNameDecrypted ||
    patientUser?.lastName ||
    patientUser?.lastNameDecrypted ||
    "";
  const patientNameStr = [patientFirstName, patientLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const patientName = patientNameStr || "—";

  // 🔧 Пол: bio содержит "Woman"/"Man" в твоей БД
  const patientGender =
    patient?.genderRu ||
    patient?.gender ||
    patient?.bio ||
    patientUser?.gender ||
    patientUser?.bio ||
    "—";

  const patientCountry =
    patient?.country ||
    patientUser?.country ||
    "—";

  // 🔧 Дата рождения: в NewPatientPolyclinic поле `birthDate`,
  // в User поле `dateOfBirth` — проверяем оба.
  const patientBirthDate =
    patient?.birthDate ||
    patient?.dateOfBirth ||
    patientUser?.birthDate ||
    patientUser?.dateOfBirth;

  // 🔧 Массивы (allergies, chronicDiseases, familyHistoryOfDisease, immunization)
  //    в БД могут прийти как массив строк или как строка — нормализуем.
  const toText = (v) => {
    if (v == null) return "";
    if (Array.isArray(v)) return v.filter(Boolean).join(", ");
    return String(v);
  };
  const patientBadHabits = toText(patient?.badHabits);
  const patientImmunization = toText(patient?.immunization);
  const patientFamilyHistory = toText(patient?.familyHistoryOfDisease);
  const patientChronic = toText(patient?.chronicDiseases);
  const patientAllergies = toText(patient?.allergies);

  return (
    <div className="mhd-wrap">
      <MHDStyles />

      {/* ───── Документ (превращается в PDF) ───── */}
      <div className="mhd-document" ref={pdfRef}>
        {/* Header */}
        <div className="mhd-doc-header">
          <div className="mhd-doc-header-top">
            <span className="mhd-brand">
              <span className="mhd-brand-mark">D</span>
              {t("myMedicalHistoryDetail.brand")}
            </span>
            <span className="mhd-doc-date">
              <IconCalendar />
              <span>
                {history.createdAt
                  ? new Date(history.createdAt).toLocaleString(i18n.language)
                  : "—"}
              </span>
            </span>
          </div>
          <h2 className="mhd-doc-title">
            {t("myMedicalHistoryDetail.header.title")}
          </h2>
          <p className="mhd-doc-subtitle">
            {t("myMedicalHistoryDetail.header.subtitle")}
          </p>
        </div>

        {/* Body */}
        <div className="mhd-body">
          {/* Patient hero */}
          <div className="mhd-patient-hero">
            <img
              className="mhd-photo"
              src={
                patient?.photo
                  ? `${API_BASE}/uploads/${patient.photo}`
                  : "/assets/img/avatars/user.png"
              }
              alt={t("myMedicalHistoryDetail.patient.photoAlt")}
              crossOrigin="anonymous"
            />
            <div className="mhd-patient-summary">
              <div className="mhd-patient-name">{patientName}</div>
              <div className="mhd-patient-meta">
                <span className="mhd-patient-meta-item">
                  <IconUser />
                  <span>{patientGender}</span>
                </span>
                <span className="mhd-patient-meta-item">
                  <IconCalendar />
                  <span>
                    {patientBirthDate
                      ? new Date(patientBirthDate).toLocaleDateString(i18n.language)
                      : "—"}{" "}
                    ({calculateAge(patientBirthDate)})
                  </span>
                </span>
                <span className="mhd-patient-meta-item">
                  <IconMapPin />
                  <span>{patientCountry}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Данные пациента */}
          <div className="mhd-section">
            <h3 className="mhd-section-title">
              <span className="mhd-section-title-num">1</span>
              {t("myMedicalHistoryDetail.sections.patientData")}
            </h3>
            <div className="mhd-grid-3">
              <div className="mhd-field">
                <div className="mhd-field-label">
                  {t("myMedicalHistoryDetail.fields.fullName")}
                </div>
                <div className="mhd-field-value">{patientName}</div>
              </div>
              <div className="mhd-field">
                <div className="mhd-field-label">
                  {t("myMedicalHistoryDetail.fields.gender")}
                </div>
                <div className="mhd-field-value">{patientGender}</div>
              </div>
              <div className="mhd-field">
                <div className="mhd-field-label">
                  {t("myMedicalHistoryDetail.fields.birthDate")}
                </div>
                <div className="mhd-field-value">
                  {patientBirthDate
                    ? new Date(patientBirthDate).toLocaleDateString(i18n.language)
                    : "—"}{" "}
                  ({calculateAge(patientBirthDate)})
                </div>
              </div>
              <div className="mhd-field">
                <div className="mhd-field-label">
                  {t("myMedicalHistoryDetail.fields.citizenship")}
                </div>
                <div className="mhd-field-value">{patientCountry}</div>
              </div>
              <div className="mhd-field">
                <div className="mhd-field-label">
                  {t("myMedicalHistoryDetail.fields.badHabits")}
                </div>
                <div className="mhd-field-value">
                  {patientBadHabits || "—"}
                </div>
              </div>
              <div className="mhd-field">
                <div className="mhd-field-label">
                  {t("myMedicalHistoryDetail.fields.immunization")}
                </div>
                <div className="mhd-field-value">
                  {patientImmunization || "—"}
                </div>
              </div>
              <div className="mhd-field">
                <div className="mhd-field-label">
                  {t("myMedicalHistoryDetail.fields.familyHistory")}
                </div>
                <div className="mhd-field-value">
                  {patientFamilyHistory || "—"}
                </div>
              </div>
              <div className="mhd-field">
                <div className="mhd-field-label">
                  {t("myMedicalHistoryDetail.fields.chronicDiseases")}
                </div>
                <div className="mhd-field-value">
                  {patientChronic || "—"}
                </div>
              </div>
              <div className="mhd-field">
                <div className="mhd-field-label">
                  {t("myMedicalHistoryDetail.fields.allergies")}
                </div>
                <div className="mhd-field-value">
                  {patientAllergies || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Диагноз */}
          <div className="mhd-section">
            <h3 className="mhd-section-title">
              <span className="mhd-section-title-num">2</span>
              {t("myMedicalHistoryDetail.sections.diagnosis")}
            </h3>
            <div className="mhd-highlight">
              <div className="mhd-field-label">
                {t("myMedicalHistoryDetail.fields.mainDiagnosis")}
              </div>
              <div className="mhd-field-value">{history.diagnosis}</div>
            </div>
            <div className="mhd-field-full">
              <div className="mhd-field-label">
                {t("myMedicalHistoryDetail.fields.additionalDiagnosis")}
              </div>
              {renderValue(history.additionalDiagnosis)}
            </div>
          </div>

          {/* Section 3: Клиническая картина */}
          <div className="mhd-section">
            <h3 className="mhd-section-title">
              <span className="mhd-section-title-num">3</span>
              {t("myMedicalHistoryDetail.sections.clinicalPicture")}
            </h3>
            <div className="mhd-field-full">
              <div className="mhd-field-label">
                {t("myMedicalHistoryDetail.fields.complaints")}
              </div>
              {renderValue(history.complaints)}
            </div>
            <div className="mhd-field-full">
              <div className="mhd-field-label">
                {t("myMedicalHistoryDetail.fields.anamnesisMorbi")}
              </div>
              {renderValue(history.anamnesisMorbi)}
            </div>
            <div className="mhd-field-full">
              <div className="mhd-field-label">
                {t("myMedicalHistoryDetail.fields.anamnesisVitae")}
              </div>
              {renderValue(history.anamnesisVitae)}
            </div>
            <div className="mhd-field-full">
              <div className="mhd-field-label">
                {t("myMedicalHistoryDetail.fields.statusPraesens")}
              </div>
              {renderValue(history.statusPreasens)}
            </div>
            <div className="mhd-field-full">
              <div className="mhd-field-label">
                {t("myMedicalHistoryDetail.fields.statusLocalis")}
              </div>
              {renderValue(history.statusLocalis)}
            </div>
          </div>

          {/* Section 4: Исследования */}
          <div className="mhd-section">
            <h3 className="mhd-section-title">
              <span className="mhd-section-title-num">4</span>
              {t("myMedicalHistoryDetail.sections.tests")}
            </h3>
            <div className="mhd-field-full">
              <div className="mhd-field-label">
                {t("myMedicalHistoryDetail.fields.ctScan")}
              </div>
              {renderValue(history.ctScanResults)}
            </div>
            <div className="mhd-field-full">
              <div className="mhd-field-label">
                {t("myMedicalHistoryDetail.fields.mri")}
              </div>
              {renderValue(history.mriResults)}
            </div>
            <div className="mhd-field-full">
              <div className="mhd-field-label">
                {t("myMedicalHistoryDetail.fields.ultrasound")}
              </div>
              {renderValue(history.ultrasoundResults)}
            </div>
            <div className="mhd-field-full">
              <div className="mhd-field-label">
                {t("myMedicalHistoryDetail.fields.laboratoryTests")}
              </div>
              {renderValue(history.laboratoryTestResults)}
            </div>
          </div>

          {/* Section 5: Рекомендации */}
          <div className="mhd-section">
            <h3 className="mhd-section-title">
              <span className="mhd-section-title-num">5</span>
              {t("myMedicalHistoryDetail.sections.recommendations")}
            </h3>
            <div className="mhd-field-full">
              <div className="mhd-field-label">
                {t("myMedicalHistoryDetail.fields.doctorRecommendations")}
              </div>
              {renderValue(history.recommendations)}
            </div>
          </div>
 
          {/* Section 6: Врач */}
          <div className="mhd-section">
            <h3 className="mhd-section-title">
              <span className="mhd-section-title-num">6</span>
              {t("myMedicalHistoryDetail.sections.attendingDoctor")}
            </h3>
            <div className="mhd-doctor-card">
              <div className="mhd-doctor-avatar">
                <IconStethoscope />
              </div>
              <div className="mhd-doctor-info">
                <div className="mhd-doctor-label">
                  {t("myMedicalHistoryDetail.doctor.label")}
                </div>
                <div className="mhd-doctor-name">
                  {doctor?.firstName} {doctor?.lastName}
                </div>
                {doctor?.specialization?.name && (
                  <div className="mhd-doctor-spec">
                    {doctor.specialization.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Кнопка скачивания (ВНЕ pdfRef) ───── */}
      <div className="mhd-download-wrap">
        <button
          className="mhd-download-btn"
          onClick={downloadPDF}
          disabled={pdfBusy}
        >
          {pdfBusy ? (
            <>
              <span className="mhd-pdf-spinner" />
              {t("myMedicalHistoryDetail.actions.preparingPdf")}
            </>
          ) : (
            <>
              <FaDownload /> {t("myMedicalHistoryDetail.actions.downloadPdf")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
