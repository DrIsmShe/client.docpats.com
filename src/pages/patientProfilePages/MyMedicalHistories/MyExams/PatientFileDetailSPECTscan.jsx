// client/src/pages/patient/PatientFileDetailSPECTscan.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ===== Локализация месяцев (родительный падеж) ===== */
const RU_MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

/* ===================== Дата/возраст ===================== */
function ruYears(n) {
  const a = Math.abs(Number(n)) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return "лет";
  if (b > 1 && b < 5) return "года";
  if (b === 1) return "год";
  return "лет";
}
function calcAge(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (isNaN(d)) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
}
function fmtDOB(dateLike) {
  if (!dateLike) return "—";
  const d = new Date(dateLike);
  if (isNaN(d)) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = RU_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}
function looksEncryptedIvData(s) {
  if (typeof s !== "string") return false;
  return /^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/.test(s);
}
function normalizeDateInput(v) {
  if (!v && v !== 0) return null;
  if (typeof v === "object" && !Array.isArray(v)) {
    const d = v.day ?? v.dd ?? v.date ?? v.d;
    const m =
      v.month != null
        ? Number(v.month) - 1
        : v.mm != null
        ? Number(v.mm) - 1
        : v.m != null
        ? Number(v.m) - 1
        : null;
    const y = v.year ?? v.yyyy ?? v.yy ?? v.y;
    if (y != null && m != null && d != null) {
      const dt = new Date(Number(y), Number(m), Number(d));
      return isNaN(dt) ? null : dt;
    }
  }
  if (typeof v === "number" || /^\d+$/.test(String(v))) {
    const n = Number(v);
    const ms = n < 1e12 ? n * 1000 : n;
    const d = new Date(ms);
    return isNaN(d) ? null : d;
  }
  const s = String(v).trim();
  if (looksEncryptedIvData(s)) return null;
  const iso = new Date(s);
  if (!isNaN(iso)) return iso;
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const yyyy = m[3].length === 2 ? `19${m[3]}` : m[3];
    const d2 = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (!isNaN(d2)) return d2;
  }
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const yyyy = m[3].length === 2 ? `19${m[3]}` : m[3];
    const d2 = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (!isNaN(d2)) return d2;
  }
  m = s.match(/^(\d{4})[\/.](\d{1,2})[\/.](\d{1,2})$/);
  if (m) {
    const yyyy = m[1];
    const mm = m[2].padStart(2, "0");
    const dd = m[3].padStart(2, "0");
    const d2 = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (!isNaN(d2)) return d2;
  }
  return null;
}
function extractPatientDOB(p) {
  if (!p) return null;
  const containers = [
    p,
    p.patientId,
    p.patient,
    p.user,
    p.linkedUser,
    p.profile,
    p.demographics,
    p.data,
  ].filter(Boolean);
  const keys = [
    "dateOfBirth",
    "dateOfBirthDecrypted",
    "dob",
    "birthDate",
    "birthday",
    "birthdate",
  ];
  for (const obj of containers) {
    if (obj.birth && typeof obj.birth === "object") {
      const d = normalizeDateInput(obj.birth);
      if (d) return d;
    }
    for (const k of keys) {
      if (obj[k] != null) {
        const d = normalizeDateInput(obj[k]);
        if (d) return d;
      }
    }
    if (obj.customFields && typeof obj.customFields === "object") {
      for (const k of keys) {
        if (obj.customFields[k] != null) {
          const d = normalizeDateInput(obj.customFields[k]);
          if (d) return d;
        }
      }
    }
    if (obj.extra && typeof obj.extra === "object") {
      for (const k of keys) {
        if (obj.extra[k] != null) {
          const d = normalizeDateInput(obj.extra[k]);
          if (d) return d;
        }
      }
    }
  }
  return null;
}
function fmtDOBWithAge(p) {
  const dob =
    extractPatientDOB(p) ||
    (p?.patientId?.dateOfBirth ? new Date(p.patientId.dateOfBirth) : null);
  if (!dob) {
    const containers = [
      p,
      p?.patientId,
      p?.patient,
      p?.user,
      p?.linkedUser,
      p?.profile,
      p?.demographics,
    ].filter(Boolean);
    const ageKeys = ["age", "patientAge", "years"];
    for (const obj of containers) {
      for (const k of ageKeys) {
        const a = obj?.[k];
        if (a != null && !isNaN(Number(a))) {
          const n = Number(a);
          return `— (${n} ${ruYears(n)})`;
        }
      }
    }
    return "—";
  }
  const base = fmtDOB(dob);
  const age = calcAge(dob);
  return age != null ? `${base} (${age} ${ruYears(age)})` : base;
}

/* ===================== Константы/утилиты ===================== */
const BASE_URL = process.env.REACT_APP_API_URL;
const resolveHref = (u = "") => {
  if (!u) return "";
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${BASE_URL}${encodeURI(path)}`;
};
const guessFileName = (url, fallback = "file") => {
  try {
    const u = new URL(resolveHref(url));
    const last = u.pathname.split("/").filter(Boolean).pop();
    return decodeURIComponent(last || fallback);
  } catch {
    const parts = String(url || "")
      .split("/")
      .filter(Boolean);
    return decodeURIComponent(parts.pop() || fallback);
  }
};
const fmtDateTime = (v) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
};
const bytesToHuman = (num = 0) => {
  if (!num && num !== 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = Number(num),
    i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};
const safeJoin = (arr) =>
  Array.isArray(arr) && arr.length ? arr.join(", ") : "—";

/* ===================== Презентационные мини-компоненты ===================== */
const KV = ({ label, value, mono }) => (
  <div className="kv-row">
    <div className="kv-label">{label}</div>
    <div className={`kv-value ${mono ? "kv-mono" : ""}`}>{value ?? "—"}</div>
  </div>
);
function Skeleton() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          style={{
            ...card,
            height: 110,
            background: "linear-gradient(90deg,#f3f4f6,#eef2ff,#f3f4f6)",
            animation: "ske 1.4s infinite",
          }}
        />
      ))}
      <style>{`@keyframes ske{0%{opacity:.85}50%{opacity:.5}100%{opacity:.85}}`}</style>
    </div>
  );
}
const alertStyle = (type) => ({
  ...card,
  borderColor: type === "error" ? "#fecaca" : "#fde68a",
  background: type === "error" ? "#fff1f2" : "#fffbeb",
  color: "#111827",
});
const Empty = ({ text = "Нет данных." }) => (
  <div style={{ color: "#6b7280" }}>{text}</div>
);
const Pre = ({ value }) => {
  const s = String(value || "");
  return s.trim() ? (
    <pre
      style={{
        ...preBox,
        background: "#0e1726",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowX: "auto",
        overflowY: "auto",
        maxWidth: "100%",
        maxHeight: 280,
      }}
    >
      {s}
    </pre>
  ) : (
    "—"
  );
};

/* ===================== Имя/пациент ===================== */
function decryptLike(v) {
  if (!v) return "";
  const s = String(v);
  if (s.includes(":")) return "";
  return s;
}
const pickNameParts = (obj) => {
  if (!obj || typeof obj !== "object") return { first: "", last: "" };
  const first =
    (obj.firstName ??
      obj.firstNameDecrypted ??
      (typeof obj.firstNameEncrypted === "string"
        ? decryptLike(obj.firstNameEncrypted)
        : "")) ||
    "";
  const last =
    (obj.lastName ??
      obj.lastNameDecrypted ??
      (typeof obj.lastNameEncrypted === "string"
        ? decryptLike(obj.lastNameEncrypted)
        : "")) ||
    "";
  return { first, last };
};
const extractUserObject = (u) => {
  if (!u || typeof u === "string") return null;
  return u.linkedUser && typeof u.linkedUser === "object"
    ? u.linkedUser
    : u.user && typeof u.user === "object"
    ? u.user
    : u;
};
const getDisplayName = (u) => {
  if (!u) return "—";
  if (typeof u === "string") return u;
  const cand = extractUserObject(u) || {};
  const { first, last } = pickNameParts(cand);
  const name = [first, last].filter(Boolean).join(" ").trim();
  return (
    name ||
    cand.username ||
    cand.email ||
    cand.emailDecrypted ||
    cand.emailEncrypted ||
    "—"
  );
};
const fmtUser = (u) => {
  if (!u) return "—";
  if (typeof u === "string") return u;
  const cand = extractUserObject(u) || u;
  const name = getDisplayName(cand);
  const role = cand.role ? ` (${cand.role})` : "";
  return (name || "—") + role;
};
const tmpl = (t) => (!t ? "—" : t.title || t.name || t.label || t._id || "—");

/* ===================== Утилита скачивания ===================== */
async function downloadWithAuth(url, filename) {
  const href = resolveHref(url);
  const name = filename || guessFileName(href, "file");
  const res = await axios.get(href, {
    responseType: "blob",
    withCredentials: true,
  });
  const blobUrl = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

/* ===================== Основной компонент ===================== */
export default function PatientFileDetailSPECTscan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const printRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, {
      scale: Math.max(2, window.devicePixelRatio || 2),
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: document.documentElement.scrollWidth,
    });
    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const imgW = pageW - margin * 2;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH - margin * 2) {
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", margin, margin, imgW, imgH);
      pdf.save(`spect-summary-${item?._id || "report"}.pdf`);
      return;
    }
    const pageCanvas = document.createElement("canvas");
    const pageCtx = pageCanvas.getContext("2d");
    const ratio = imgW / canvas.width;
    const sliceHpx = Math.floor((pageH - margin * 2) / ratio);
    let sY = 0;
    let pageIndex = 0;
    while (sY < canvas.height) {
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.min(sliceHpx, canvas.height - sY);
      pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageCtx.drawImage(
        canvas,
        0,
        sY,
        pageCanvas.width,
        pageCanvas.height,
        0,
        0,
        pageCanvas.width,
        pageCanvas.height
      );
      const pageImgData = pageCanvas.toDataURL("image/png");
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        pageImgData,
        "PNG",
        margin,
        margin,
        imgW,
        (pageCanvas.height * imgW) / pageCanvas.width
      );
      sY += sliceHpx;
      pageIndex++;
    }
    pdf.save(`spect-summary-${item?._id || "report"}.pdf`);
  };

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const url = `${BASE_URL}/patient-profile/get-my-spect-scan-file-details/files/${encodeURIComponent(
          id
        )}`;
        const res = await axios.get(url, { withCredentials: true });
        if (!cancelled) {
          if (res?.data?.ok && res?.data?.item) setItem(res.data.item);
          else setError(res?.data?.error || "Не удалось получить данные.");
        }
      } catch (e) {
        if (!cancelled) {
          const status = e?.response?.status;
          if (status === 401) setError("Не авторизован. Войдите в систему.");
          else if (status === 403) setError("Доступ запрещён.");
          else if (status === 404) setError("Запись не найдена.");
          else setError("Ошибка загрузки данных.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const totalSize = useMemo(() => {
    if (!item?.files?.length) return 0;
    return item.files.reduce((acc, f) => acc + (Number(f.fileSize) || 0), 0);
  }, [item]);

  const dobDisplay = useMemo(
    () => fmtDOBWithAge(item?.patientId || item?.patient || item),
    [item]
  );
  const onBack = () => navigate(-1);

  return (
    <div
      className="container"
      style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}
    >
      {/* Глобальные стили */}
      <style>{`
        .kv-row{ display:grid; grid-template-columns:220px 1fr; gap:12px; margin-bottom:8px; }
        .kv-label{ color:#6b7280; }
        .kv-value{ word-break: break-word; overflow-wrap:anywhere; white-space:pre-wrap; max-width:100%; }
        .kv-mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
        @media (max-width:640px){ .kv-row{ grid-template-columns:1fr; } .kv-label{ font-weight:600; } }
        .ct-table-wrap{ overflow-x:auto; }
        .ct-table{ width:100%; border-collapse: collapse; table-layout: fixed; }
        .ct-table th, .ct-table td{ border:1px solid #e5e7eb; padding:8px; text-align:left; word-break: break-word; }
        .ct-actions{ display:flex; gap:8px; flex-wrap:wrap; }
        @media (max-width:768px){
          .ct-table thead{ display:none; }
          .ct-table, .ct-table tbody, .ct-table tr, .ct-table td { display:block; width:100%; }
          .ct-table tr{ margin-bottom:16px; border:1px solid #e5e7eb; border-radius:8px; padding:8px; background:#fff; }
          .ct-table td{ text-align:left; padding:6px 8px; position:relative; }
          .ct-table td::before{ content: attr(data-label); font-weight:600; display:block; margin-bottom:4px; color:#6b7280; }
        }
      `}</style>

      {/* Хлебные крошки */}
      <nav style={{ marginBottom: 12, fontSize: 14 }}>
        <Link to={`/patient/patient-profile/${id}`}>Личный кабинет</Link>{" "}
        &nbsp;/&nbsp;
        <Link to="/patient/get-patients-files">Мои медицинские файлы</Link>{" "}
        &nbsp;/&nbsp;
        <span>SPECT — детали</span>
      </nav>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <button onClick={onBack} className="btn" style={btnStyle}>
          ← Назад
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          Детали SPECT-исследования
        </h1>
      </div>

      {loading && <Skeleton />}
      {!loading && error && <div style={alertStyle("error")}>{error}</div>}
      {!loading && !error && !item && (
        <div style={alertStyle("warning")}>Данные не найдены.</div>
      )}

      {!loading && !error && item && (
        <>
          {/* Кнопка скачивания PDF */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
              gap: 8,
            }}
          >
            <button
              onClick={handleDownloadPDF}
              className="btn"
              style={btnStyle}
            >
              ⤓ Скачать PDF (сводка)
            </button>
          </div>

          {/* ===== СВОДКА ===== */}
          <div ref={printRef}>
            <section style={card}>
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}
              >
                <div>
                  <h3 style={h3}>Основное</h3>
                  <KV label="ID исследования" value={item._id} mono />
                  <KV label="Дата" value={fmtDateTime(item.date)} />
                  <KV
                    label="Имя доктора (ФИО)"
                    value={getDisplayName(item.doctor)}
                  />
                  <KV
                    label="Имя пациента (ФИО)"
                    value={getDisplayName(item.patient || item.patientId)}
                  />
                  <KV label="Дата рождения" value={dobDisplay} />
                  {/* <KV label="Часть тела" value={item.bodyPart || "—"} /> */}
                  <KV
                    label="Доза излучения (мЗв)"
                    value={item.radiationDose ?? "—"}
                  />
                </div>

                <div>
                  <h3 style={h3}>Заключение</h3>
                  <KV
                    label="Наименование исследования"
                    value={item.nameofexam || "—"}
                  />
                  <KV label="Диагноз" value={item.diagnosis || "—"} />
                  <KV label="Рекомендации" value={item.recomandation || "—"} />
                  <KV label="Отчёт" value={<Pre value={item.report} />} />
                </div>
              </div>
            </section>
          </div>

          {/* Файлы */}
          <section style={card}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <h3 style={h3}>Файлы ({item.files?.length || 0})</h3>
              <div style={{ color: "#6b7280" }}>
                Суммарный размер: {bytesToHuman(totalSize)}
              </div>
            </div>

            {Array.isArray(item.files) && item.files.length > 0 ? (
              <div className="ct-table-wrap">
                <table className="ct-table">
                  <thead>
                    <tr>
                      <th>Имя</th>
                      <th>Тип</th>
                      <th>Формат</th>
                      <th>Размер</th>
                      <th>Study Type</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.files.map((f, idx) => {
                      const openHref = resolveHref(f.fileUrl);
                      return (
                        <tr key={`${f.fileUrl || f.fileName}-${idx}`}>
                          <td data-label="Имя" title={f.fileName}>
                            {f.fileName}
                          </td>
                          <td data-label="Тип">{f.fileType}</td>
                          <td data-label="Формат">{f.fileFormat}</td>
                          <td data-label="Размер">
                            {bytesToHuman(f.fileSize)}
                          </td>
                          <td data-label="Study Type">
                            {f.studyTypeReference || "—"}
                          </td>
                          <td data-label="Действия">
                            {f.fileUrl ? (
                              <div className="ct-actions">
                                <a
                                  href={openHref}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ textDecoration: "underline" }}
                                  title="Открыть в новой вкладке"
                                >
                                  <button style={{ padding: "5px" }}>
                                    Скачать
                                  </button>
                                </a>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty text="Файлы отсутствуют." />
            )}
          </section>

          {/* Медиа */}
          <section style={card}>
            <h3 style={h3}>Медиа</h3>
            <KV
              label="PACS"
              value={
                item.pacsLink ? (
                  <a
                    href={resolveHref(item.pacsLink)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {resolveHref(item.pacsLink)}
                  </a>
                ) : (
                  "—"
                )
              }
              mono
            />
            <KV
              label="DICOM / rawData"
              value={
                item.rawData ? (
                  <a
                    href={resolveHref(item.rawData)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {resolveHref(item.rawData)}
                  </a>
                ) : (
                  "—"
                )
              }
              mono
            />
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Снимки ({item.images?.length || 0})
              </div>
              {Array.isArray(item.images) && item.images.length > 0 ? (
                <div style={gridImages}>
                  {item.images.map((src, i) => {
                    const href = resolveHref(src);
                    return (
                      <a
                        key={`${src}-${i}`}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        style={thumbWrap}
                        title="Открыть снимок"
                      >
                        <img
                          src={href}
                          alt={`SPECT image ${i + 1}`}
                          style={thumbImg}
                          loading="lazy"
                        />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <Empty text="Снимки отсутствуют." />
              )}
            </div>
          </section>

          {/* AI */}
          <section style={card}>
            <h3 style={h3}>AI-анализ</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
              }}
            >
              <div>
                <KV label="AI версия" value={item.aiVersion || "—"} />
                <KV label="AI предсказание" value={item.aiPrediction || "—"} />
                <KV label="Доверие модели" value={item.aiConfidence ?? "—"} />
                <KV
                  label="Доверие предсказанию"
                  value={item.predictionConfidence ?? "—"}
                />
                <KV
                  label="Время обработки (сек)"
                  value={item.aiProcessingTime ?? "—"}
                />
                <KV
                  label="Обработано"
                  value={fmtDateTime(item.aiProcessedAt)}
                />
              </div>
              <div>
                <div style={{ marginBottom: 6, color: "#6b7280" }}>
                  AI Findings (JSON)
                </div>
                <pre style={preBox}>
                  {JSON.stringify(item.aiFindings ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          </section>

          {/* Риск/валидация */}
          <section style={card}>
            <h3 style={h3}>Оценка риска и валидация</h3>
            <KV label="Уровень риска" value={item.riskLevel || "—"} />
            <KV label="Факторы риска" value={safeJoin(item.riskFactors)} />
            <KV
              label="Валидировано врачом"
              value={item.validatedByDoctor ? "Да" : "Нет"}
            />
            <KV
              label="Заметки врача"
              value={<Pre value={item.doctorNotes} />}
            />
            <KV label="Создано" value={fmtDateTime(item.createdAt)} />
            <KV label="Обновлено" value={fmtDateTime(item.updatedAt)} />
          </section>

          {/* Шаблоны */}
          <section style={card}>
            <h3 style={h3}>Привязанные шаблоны</h3>
            <KV label="Name of exam" value={tmpl(item.nameofexamTemplate)} />
            <KV label="Report" value={tmpl(item.reportTemplate)} />
            <KV label="Diagnosis" value={tmpl(item.diagnosisTemplate)} />
            <KV
              label="Recommendation"
              value={tmpl(item.recomandationTemplate)}
            />
          </section>

          {/* Комментарии */}
          <section style={card}>
            <h3 style={h3}>
              Комментарии врача ({item.doctorComments?.length || 0})
            </h3>
            {Array.isArray(item.doctorComments) &&
            item.doctorComments.length > 0 ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {item.doctorComments.map((c, i) => (
                  <div key={i} style={comment}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{fmtUser(c.doctor)}</div>
                      <div style={{ color: "#6b7280" }}>
                        {fmtDateTime(c.date)}
                      </div>
                    </div>
                    <div
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {c.text || "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="Комментариев нет." />
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* ===================== Стили ===================== */
const btnStyle = {
  border: "1px solid #d1d5db",
  padding: "6px 10px",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
};
const h3 = { margin: "0 0 10px 0", fontSize: 16, fontWeight: 700 };
const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  background: "#fff",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};
const preBox = {
  background: "#0b1020",
  color: "#e5e7eb",
  borderRadius: 10,
  padding: 12,
  overflowX: "auto",
  fontSize: 12.5,
  lineHeight: 1.35,
};
const gridImages = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: 12,
  marginTop: 6,
};
const thumbWrap = {
  display: "block",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  overflow: "hidden",
  background: "#f9fafb",
};
const thumbImg = {
  width: "100%",
  height: 120,
  objectFit: "cover",
  display: "block",
};
const comment = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
  background: "#fafafa",
};
