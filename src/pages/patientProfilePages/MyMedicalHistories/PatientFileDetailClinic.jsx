// client/src/pages/patient/PatientFileDetailClinic.jsx
//
// Универсальная детальная страница для клиничных снимков (ImagingStudy).
// Одна на все типы — КТ/МРТ/рентген/УЗИ/... Открывается из списка
// "Мои медицинские файлы" для записей с source:"clinic".
//
// Endpoint: GET /patient-profile/get-my-clinic-imaging-details/files/:id

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { RU_MONTHS } from "../../../lib/ruMonths";

const BASE_URL = process.env.REACT_APP_API_URL;

/* ===================== Дата / возраст ===================== */

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
function fmtDOBWithAge(dateLike) {
  if (!dateLike) return "—";
  const d = new Date(dateLike);
  if (isNaN(d)) return "—";
  const base = `${String(d.getDate()).padStart(2, "0")} ${RU_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const age = calcAge(d);
  return age != null ? `${base} (${age} ${ruYears(age)})` : base;
}
const fmtDateTime = (v) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
};

/* ===================== Утилиты ===================== */
const resolveHref = (u = "") => {
  if (!u) return "";
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${BASE_URL}${encodeURI(path)}`;
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
const fullName = (o) => {
  if (!o) return "—";
  const n = [o.firstName, o.lastName].filter(Boolean).join(" ").trim();
  return n || "—";
};
const fmtCommentAuthor = (d) => {
  if (!d) return "—";
  if (typeof d === "string") return d;
  return fullName(d);
};

/* ===================== Мелкие компоненты ===================== */
const KV = ({ label, value, mono }) => (
  <div className="kvc-row">
    <div className="kvc-label">{label}</div>
    <div className={`kvc-value ${mono ? "kvc-mono" : ""}`}>{value ?? "—"}</div>
  </div>
);
const Empty = ({ text = "Нет данных." }) => (
  <div style={{ color: "#6b7280" }}>{text}</div>
);
const Pre = ({ value }) => {
  const s = String(value || "");
  return s.trim() ? (
    <pre
      style={{
        ...preBox,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        maxHeight: 280,
      }}
    >
      {s}
    </pre>
  ) : (
    "—"
  );
};
function Skeleton() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          style={{ ...card, height: 110, animation: "skec 1.4s infinite" }}
        />
      ))}
      <style>{`@keyframes skec{0%{opacity:.85}50%{opacity:.5}100%{opacity:.85}}`}</style>
    </div>
  );
}
const alertStyle = (type) => ({
  ...card,
  borderColor: type === "error" ? "#fecaca" : "#fde68a",
  background: type === "error" ? "#fff1f2" : "#fffbeb",
  color: "#111827",
});

/* ===================== Компонент ===================== */
export default function PatientFileDetailClinic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const printRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const url = `${BASE_URL}/patient-profile/get-my-clinic-imaging-details/files/${encodeURIComponent(id)}`;
        const res = await axios.get(url, { withCredentials: true });
        if (cancelled) return;
        if (res?.data?.ok && res?.data?.item) setItem(res.data.item);
        else setError(res?.data?.error || "Не удалось получить данные.");
      } catch (e) {
        if (cancelled) return;
        const s = e?.response?.status;
        if (s === 401) setError("Не авторизован. Войдите в систему.");
        else if (s === 403) setError("Доступ запрещён.");
        else if (s === 404) setError("Запись не найдена.");
        else setError("Ошибка загрузки данных.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const totalSize = useMemo(() => {
    if (!item?.files?.length) return 0;
    return item.files.reduce((acc, f) => acc + (Number(f.fileSize) || 0), 0);
  }, [item]);

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
    const margin = 20;
    const imgW = pageW - margin * 2;
    const imgH = (canvas.height * imgW) / canvas.width;
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      margin,
      margin,
      imgW,
      imgH,
    );
    pdf.save(`imaging-${item?._id || "report"}.pdf`);
  };

  const title = item?.studyTypeLabel
    ? `Детали исследования — ${item.studyTypeLabel}`
    : "Детали исследования";

  return (
    <div
      className="container"
      style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}
    >
      <style>{`
        .kvc-row{ display:grid; grid-template-columns:220px 1fr; gap:12px; margin-bottom:8px; }
        .kvc-label{ color:#6b7280; }
        .kvc-value{ word-break:break-word; overflow-wrap:anywhere; white-space:pre-wrap; max-width:100%; }
        .kvc-mono{ font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; }
        @media (max-width:640px){ .kvc-row{ grid-template-columns:1fr; } .kvc-label{ font-weight:600; } }
        .clt-wrap{ overflow-x:auto; }
        .clt{ width:100%; border-collapse:collapse; table-layout:fixed; }
        .clt th,.clt td{ border:1px solid #e5e7eb; padding:8px; text-align:left; word-break:break-word; }
        @media (max-width:768px){
          .clt thead{ display:none; }
          .clt, .clt tbody, .clt tr, .clt td{ display:block; width:100%; }
          .clt tr{ margin-bottom:16px; border:1px solid #e5e7eb; border-radius:8px; padding:8px; background:#fff; }
          .clt td::before{ content:attr(data-label); font-weight:600; display:block; margin-bottom:4px; color:#6b7280; }
        }
      `}</style>

      <nav style={{ marginBottom: 12, fontSize: 14 }}>
        <Link to="/patient/get-patients-files">Мои медицинские файлы</Link>
        &nbsp;/&nbsp;
        <span>{item?.studyTypeLabel || "Исследование"} — детали</span>
      </nav>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <button onClick={() => navigate(-1)} style={btnStyle}>
          ← Назад
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h1>
      </div>

      {loading && <Skeleton />}
      {!loading && error && <div style={alertStyle("error")}>{error}</div>}
      {!loading && !error && !item && (
        <div style={alertStyle("warning")}>Данные не найдены.</div>
      )}

      {!loading && !error && item && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
            }}
          >
            <button onClick={handleDownloadPDF} style={btnStyle}>
              ⤓ Скачать PDF (сводка)
            </button>
          </div>

          <div ref={printRef}>
            <section style={card}>
              <h3 style={h3}>Основное</h3>
              <KV label="ID исследования" value={item._id} mono />
              <KV label="Тип" value={item.studyTypeLabel} />
              <KV label="Дата" value={fmtDateTime(item.date)} />
              <KV label="Врач / источник" value={fullName(item.doctor)} />
              <KV label="Пациент (ФИО)" value={fullName(item.patient)} />
              <KV
                label="Дата рождения"
                value={fmtDOBWithAge(item.patientId?.dateOfBirth)}
              />
              <KV
                label="Контраст использован"
                value={item.contrastUsed ? "Да" : "Нет"}
              />
            </section>

            <section style={card}>
              <h3 style={h3}>Заключение</h3>
              <KV label="Наименование" value={item.nameofexam || "—"} />
              <KV label="Диагноз" value={item.diagnosis || "—"} />
              <KV label="Отчёт" value={<Pre value={item.report} />} />
            </section>
          </div>

          {/* Снимки (images[]) — основное содержимое clinic-загрузки */}
          <section style={card}>
            <h3 style={h3}>Снимки ({item.images?.length || 0})</h3>
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
                        alt={`image ${i + 1}`}
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
          </section>

          {/* Файлы (files[] субдоки, если есть) */}
          {Array.isArray(item.files) && item.files.length > 0 && (
            <section style={card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <h3 style={h3}>Файлы ({item.files.length})</h3>
                <div style={{ color: "#6b7280" }}>
                  Суммарный размер: {bytesToHuman(totalSize)}
                </div>
              </div>
              <div className="clt-wrap">
                <table className="clt">
                  <thead>
                    <tr>
                      <th>Имя</th>
                      <th>Тип</th>
                      <th>Размер</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.files.map((f, idx) => (
                      <tr key={`${f.fileUrl || f.fileName}-${idx}`}>
                        <td data-label="Имя" title={f.fileName}>
                          {f.fileName || "—"}
                        </td>
                        <td data-label="Тип">{f.fileType || "—"}</td>
                        <td data-label="Размер">{bytesToHuman(f.fileSize)}</td>
                        <td data-label="Действия">
                          {f.fileUrl ? (
                            <a
                              href={resolveHref(f.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <button style={{ padding: 5 }}>Скачать</button>
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Медиа-ссылки */}
          <section style={card}>
            <h3 style={h3}>Медиа</h3>
            <KV
              label="PACS"
              mono
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
            />
            <KV
              label="DICOM (rawData)"
              mono
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
            />
            <KV
              label="3D-модель"
              mono
              value={
                item.threeDModel ? (
                  <a
                    href={resolveHref(item.threeDModel)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {resolveHref(item.threeDModel)}
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </section>

          {/* AI */}
          {(item.aiVersion ||
            item.aiPrediction ||
            item.aiConfidence != null) && (
            <section style={card}>
              <h3 style={h3}>AI-анализ</h3>
              <KV label="AI версия" value={item.aiVersion || "—"} />
              <KV label="AI предсказание" value={item.aiPrediction || "—"} />
              <KV label="Доверие модели" value={item.aiConfidence ?? "—"} />
              <KV
                label="Доверие предсказанию"
                value={item.predictionConfidence ?? "—"}
              />
              <KV label="Обработано" value={fmtDateTime(item.aiProcessedAt)} />
            </section>
          )}

          {/* Риск / валидация */}
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
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 4,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {fmtCommentAuthor(c.doctor)}
                      </div>
                      <div style={{ color: "#6b7280" }}>
                        {fmtDateTime(c.date)}
                      </div>
                    </div>
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
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
