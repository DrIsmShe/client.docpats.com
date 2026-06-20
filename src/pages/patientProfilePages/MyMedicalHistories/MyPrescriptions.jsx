// client/src/pages/patient/MyPrescriptions.jsx
//
// Кабинет пациента → «Мои рецепты». Read-only: все рецепты со всех клиник,
// где у пациента есть привязанная карта. Раскрытие деталей + скачивание PDF
// (тот же бланк, что у клиники).
//
// Стиль — тёмный pf-лист, как на странице «Мои файлы».

import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getMyPrescriptions, getMyPrescriptionPdf } from "../../../api/patient";

const FORM_RU = {
  tablet: "таблетки",
  capsule: "капсулы",
  syrup: "сироп",
  spray: "спрей",
  drops: "капли",
  ointment: "мазь",
  injection: "инъекции",
  inhaler: "ингалятор",
  suppository: "свечи",
  solution: "раствор",
  powder: "порошок",
  other: "",
};
const ROUTE_RU = {
  oral: "перорально",
  topical: "наружно",
  intramuscular: "в/м",
  intravenous: "в/в",
  subcutaneous: "п/к",
  inhalation: "ингаляционно",
  nasal: "интраназально",
  otic: "в ухо",
  ophthalmic: "в глаз",
  rectal: "ректально",
  sublingual: "под язык",
  other: "",
};
const STATUS_META = {
  active: { label: "Активный", color: "#22c55e", bg: "rgba(34,197,94,.12)" },
  completed: {
    label: "Завершён",
    color: "#94a3b8",
    bg: "rgba(148,163,184,.14)",
  },
  cancelled: {
    label: "Отменён",
    color: "#f87171",
    bg: "rgba(248,113,113,.12)",
  },
};

const S = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
.rxp { font-family:'Sora',system-ui,sans-serif; color:#e2e8f8; background:#3da4502e; min-height:100vh; padding:32px 24px 64px; }
.rxp-header { margin-bottom:28px; }
.rxp-eyebrow { font-family:'Fira Code',monospace; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:#38bdf8; margin-bottom:6px; }
.rxp-title { font-size:clamp(22px,2.8vw,32px); font-weight:700; letter-spacing:-.02em; line-height:1.1; }
.rxp-title span { color:#38bdf8; }
.rxp-count { font-family:'Fira Code',monospace; font-size:11px; color:#38bdf8; background:rgba(56,189,248,.1); border:1px solid rgba(56,189,248,.2); padding:4px 12px; border-radius:20px; display:inline-block; margin-top:10px; }
.rxp-list { display:flex; flex-direction:column; gap:14px; max-width:760px; }
.rxp-card { background:#02414c; border:1px solid rgba(255,255,255,.08); border-radius:16px; overflow:hidden; }
.rxp-card-head { padding:16px 20px; display:flex; align-items:center; gap:14px; cursor:pointer; }
.rxp-card-head:hover { background:rgba(255,255,255,.03); }
.rxp-card-main { flex:1; min-width:0; }
.rxp-card-summary { font-size:14px; font-weight:600; color:#e2e8f8; line-height:1.35; }
.rxp-card-sub { font-family:'Fira Code',monospace; font-size:11px; color:#7c93a8; margin-top:4px; }
.rxp-pill { font-size:11px; font-weight:600; padding:4px 10px; border-radius:20px; white-space:nowrap; }
.rxp-body { padding:0 20px 18px; border-top:1px solid rgba(255,255,255,.06); }
.rxp-dx { font-size:13px; color:#cbd5e1; margin:14px 0 4px; }
.rxp-dx code { font-family:'Fira Code',monospace; background:rgba(56,189,248,.12); color:#7dd3fc; padding:1px 7px; border-radius:5px; margin-right:8px; }
.rxp-items { list-style:none; padding:0; margin:10px 0 0; display:flex; flex-direction:column; gap:10px; }
.rxp-item { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:10px; padding:11px 14px; }
.rxp-item-name { font-size:14px; font-weight:600; color:#e2e8f8; }
.rxp-item-sub { font-size:12px; color:#94a3b8; margin-top:3px; display:flex; flex-wrap:wrap; gap:10px; }
.rxp-item-instr { font-size:12px; color:#cbd5e1; margin-top:5px; font-style:italic; }
.rxp-notes { font-size:13px; color:#cbd5e1; margin-top:12px; padding:10px 12px; background:rgba(255,255,255,.03); border-left:3px solid #38bdf8; border-radius:6px; }
.rxp-actions { margin-top:14px; }
.rxp-pdf-btn { display:inline-flex; align-items:center; gap:7px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:500; cursor:pointer; border:1px solid rgba(56,189,248,.4); background:rgba(56,189,248,.1); color:#7dd3fc; transition:all .15s; font-family:inherit; }
.rxp-pdf-btn:hover:not(:disabled) { background:rgba(56,189,248,.2); }
.rxp-pdf-btn:disabled { opacity:.5; cursor:not-allowed; }
.rxp-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 20px; gap:14px; color:#64748b; }
.rxp-state-icon { font-size:42px; opacity:.35; }
.rxp-state-text { font-family:'Fira Code',monospace; font-size:13px; }
.rxp-spin { width:24px; height:24px; border:2px solid rgba(255,255,255,.1); border-top-color:#38bdf8; border-radius:50%; animation:rxp-rot .7s linear infinite; }
@keyframes rxp-rot { to { transform:rotate(360deg); } }
`;

export default function MyPrescriptions() {
  const { t, i18n } = useTranslation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getMyPrescriptions();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error("getMyPrescriptions:", err?.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  async function handlePdf(rx) {
    setPdfBusy(rx._id);
    try {
      const lang = (i18n.language || "ru").split("-")[0];
      const blob = await getMyPrescriptionPdf(rx._id, lang);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("prescription pdf:", err?.message);
      alert(
        t("myRx.pdfError", { defaultValue: "Не удалось открыть PDF рецепта" }),
      );
    } finally {
      setPdfBusy(null);
    }
  }

  const summaryOf = (rx) => {
    const names = (rx.items || []).map((it) => it.inn).filter(Boolean);
    if (names.length === 0)
      return t("myRx.noDrugs", { defaultValue: "Рецепт" });
    return names.join(", ");
  };

  return (
    <div className="rxp">
      <style>{S}</style>

      <div className="rxp-header">
        <div className="rxp-eyebrow">
          {t("myRx.eyebrow", { defaultValue: "Медкарта" })}
        </div>
        <div className="rxp-title">
          {t("myRx.titleA", { defaultValue: "Мои" })}{" "}
          <span>{t("myRx.titleB", { defaultValue: "рецепты" })}</span>
        </div>
        {!loading && items.length > 0 && (
          <div className="rxp-count">
            {items.length} {t("myRx.records", { defaultValue: "записей" })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="rxp-state">
          <div className="rxp-spin" />
          <div className="rxp-state-text">
            {t("common.loading", { defaultValue: "Загрузка…" })}
          </div>
        </div>
      ) : error ? (
        <div className="rxp-state">
          <div className="rxp-state-icon">⚠️</div>
          <div className="rxp-state-text">
            {t("myRx.loadError", {
              defaultValue: "Не удалось загрузить рецепты",
            })}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rxp-state">
          <div className="rxp-state-icon">💊</div>
          <div className="rxp-state-text">
            {t("myRx.empty", { defaultValue: "У вас пока нет рецептов" })}
          </div>
        </div>
      ) : (
        <div className="rxp-list">
          {items.map((rx) => {
            const open = String(expanded) === String(rx._id);
            const st = STATUS_META[rx.status] || STATUS_META.active;
            return (
              <div className="rxp-card" key={rx._id}>
                <div
                  className="rxp-card-head"
                  onClick={() =>
                    setExpanded((cur) =>
                      String(cur) === String(rx._id) ? null : rx._id,
                    )
                  }
                >
                  <div className="rxp-card-main">
                    <div className="rxp-card-summary">{summaryOf(rx)}</div>
                    <div className="rxp-card-sub">
                      {fmtDate(rx.issuedAt || rx.createdAt)}
                      {rx.clinicName ? `  ·  ${rx.clinicName}` : ""}
                    </div>
                  </div>
                  <span
                    className="rxp-pill"
                    style={{ color: st.color, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </div>

                {open && (
                  <div className="rxp-body">
                    {(rx.diagnosis?.code || rx.diagnosis?.text) && (
                      <div className="rxp-dx">
                        {rx.diagnosis.code && <code>{rx.diagnosis.code}</code>}
                        {rx.diagnosis.text}
                      </div>
                    )}

                    <ul className="rxp-items">
                      {(rx.items || []).map((it, i) => {
                        const form = FORM_RU[it.form] ?? it.form;
                        const route = ROUTE_RU[it.route] ?? it.route;
                        const sub = [
                          it.strength,
                          form,
                          route,
                          it.dose && `Доза: ${it.dose}`,
                          it.frequency && `Приём: ${it.frequency}`,
                          it.duration && `Длит.: ${it.duration}`,
                          it.quantity && `Кол-во: ${it.quantity}`,
                          it.prn && "по требованию",
                        ].filter(Boolean);
                        return (
                          <li className="rxp-item" key={it._id || i}>
                            <div className="rxp-item-name">
                              {it.inn}
                              {it.brandName ? ` (${it.brandName})` : ""}
                            </div>
                            {sub.length > 0 && (
                              <div className="rxp-item-sub">
                                {sub.map((s, j) => (
                                  <span key={j}>{s}</span>
                                ))}
                              </div>
                            )}
                            {it.instructions && (
                              <div className="rxp-item-instr">
                                {it.instructions}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {rx.generalNotes && (
                      <div className="rxp-notes">{rx.generalNotes}</div>
                    )}

                    {rx.status === "cancelled" && rx.closedReason && (
                      <div
                        className="rxp-notes"
                        style={{ borderLeftColor: "#f87171" }}
                      >
                        {t("myRx.cancelReason", {
                          defaultValue: "Причина отмены",
                        })}
                        : {rx.closedReason}
                      </div>
                    )}

                    <div className="rxp-actions">
                      <button
                        type="button"
                        className="rxp-pdf-btn"
                        onClick={() => handlePdf(rx)}
                        disabled={pdfBusy === rx._id}
                      >
                        {pdfBusy === rx._id
                          ? t("common.loading", { defaultValue: "Загрузка…" })
                          : `📄 ${t("myRx.pdf", { defaultValue: "Скачать PDF" })}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
