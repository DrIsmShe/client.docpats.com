// client/src/pages/patientProfilePages/telemed/PatientTelemedPage.jsx
//
// Unified "Онлайн-консультации" for the patient. Surfaces ALL of the patient's
// video meetings in one list, regardless of origin:
//
//   • telemed sessions    (clinic-scheduled)    → join source "telemed-patient"
//   • freelance video appts (type === "video")  → join source "appointment"
//   • consilia (patient invited, patientCanJoin) → join source "consilium-patient"
//
// All are normalized into one card shape { kind, id, title, when, durationMin,
// status, doctorName, clinicName, joinSource, joinable }. "Join" picks the
// right JitsiRoom source per card.

import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaVideo } from "react-icons/fa6";
import {
  getMyTelemedSessions,
  getMyAppointments,
  getMyConsilia,
} from "../../../api/videoApi";
import JitsiRoom from "../../communication/components/JitsiRoom";

const CSS = `
  .tm-wrap {
    max-width: 920px;
    margin: 0 auto;
    padding: 28px 20px 60px;
    font-family: 'Outfit', system-ui, sans-serif;
  }
  .tm-head { margin-bottom: 22px; }
  .tm-eyebrow {
    font-size: 10px; font-weight: 600; letter-spacing: .16em;
    text-transform: uppercase; color: #0ea5e9; margin-bottom: 4px;
  }
  .tm-title {
    font-size: 26px; font-weight: 700; color: #0f172a; line-height: 1.1;
  }
  .tm-sub { color: #64748b; font-size: 14px; margin-top: 6px; }

  .tm-list { display: flex; flex-direction: column; gap: 14px; }

  .tm-card {
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .tm-card-main { flex: 1; min-width: 200px; }
  .tm-card-title {
    font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 4px;
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .tm-kind {
    font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 999px;
  }
  .tm-kind.telemed { background: #eef2ff; color: #4f46e5; }
  .tm-kind.appointment { background: #ecfeff; color: #0891b2; }
  .tm-kind.consilium { background: #f5f3ff; color: #7c3aed; }

  .tm-meta { font-size: 13px; color: #64748b; line-height: 1.6; }
  .tm-meta b { color: #334155; font-weight: 600; }

  .tm-status {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; padding: 3px 10px;
    border-radius: 999px; margin-left: 4px;
  }
  .tm-status.scheduled, .tm-status.pending { background: #eff6ff; color: #2563eb; }
  .tm-status.live, .tm-status.confirmed, .tm-status.open { background: #ecfdf5; color: #059669; }
  .tm-status.completed, .tm-status.resolved { background: #f1f5f9; color: #64748b; }
  .tm-status.cancelled, .tm-status.no_show, .tm-status.refunded { background: #fef2f2; color: #dc2626; }

  .tm-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 10px; border: none;
    background: #0ea5e9; color: #fff; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: background .15s; white-space: nowrap;
  }
  .tm-btn:hover { background: #0284c7; }

  .tm-empty {
    text-align: center; color: #94a3b8; padding: 60px 20px; font-size: 15px;
  }
  .tm-loading { text-align: center; color: #64748b; padding: 50px 20px; }
  .tm-error { text-align: center; color: #dc2626; padding: 50px 20px; }

  /* video overlay */
  .tm-video-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(2,6,23,.78);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .tm-video-box {
    width: 100%; max-width: 1000px; height: 78vh;
    background: #0b0f1a; border-radius: 14px; overflow: hidden;
  }
`;

// Joinable states per kind.
const TELEMED_TERMINAL = ["completed", "cancelled", "no_show"];

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PatientTelemedPage() {
  const { t } = useTranslation("clinic");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  // active = { source, id } for the JitsiRoom overlay
  const [active, setActive] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      // Fetch all sources in parallel; tolerate any one failing.
      const [telemedRes, apptRes, consiliumRes] = await Promise.allSettled([
        getMyTelemedSessions(),
        getMyAppointments(),
        getMyConsilia(),
      ]);

      const telemed =
        telemedRes.status === "fulfilled" && Array.isArray(telemedRes.value)
          ? telemedRes.value
          : [];
      const appts =
        apptRes.status === "fulfilled" && Array.isArray(apptRes.value)
          ? apptRes.value
          : [];
      const consilia =
        consiliumRes.status === "fulfilled" && Array.isArray(consiliumRes.value)
          ? consiliumRes.value
          : [];

      // Normalize telemed sessions.
      const telemedCards = telemed.map((s) => ({
        kind: "telemed",
        id: s._id,
        title:
          s.title ||
          t("patientTelemed.untitled", { defaultValue: "Консультация" }),
        when: s.scheduledAt,
        durationMin: s.durationMinutes || null,
        status: s.status,
        doctorName: s.doctorName || null,
        clinicName: s.clinicName || null,
        joinSource: "telemed-patient",
        joinable: !TELEMED_TERMINAL.includes(s.status),
      }));

      // Normalize freelance VIDEO appointments only.
      const apptCards = appts
        .filter((a) => a.type === "video")
        .map((a) => {
          const doc = a.doctorId || {};
          const docName =
            doc.firstName || doc.lastName
              ? `${doc.firstName || ""} ${doc.lastName || ""}`.trim()
              : null;
          return {
            kind: "appointment",
            id: a._id,
            title: t("patientTelemed.apptTitle", {
              defaultValue: "Видеоприём",
            }),
            when: a.startsAt,
            durationMin: null,
            status: a.status,
            doctorName: docName,
            clinicName: doc.clinic || doc.company || null,
            joinSource: "appointment",
            // freelance video joinable only when confirmed
            joinable: a.status === "confirmed",
          };
        });

      // Normalize consilia. The backend already returns ONLY consilia the
      // patient was invited into (patientCanJoin) and that aren't archived,
      // so they're joinable as-is.
      const consiliumCards = consilia.map((c) => ({
        kind: "consilium",
        id: c.id,
        title:
          c.title ||
          t("patientTelemed.consiliumTitle", { defaultValue: "Консилиум" }),
        when: c.when,
        durationMin: null,
        status: c.status,
        doctorName: c.doctorName || null,
        clinicName: c.clinicName || null,
        joinSource: "consilium-patient",
        joinable: c.joinable !== false,
      }));

      // Merge, then KEEP ONLY joinable cards (approved / active video calls).
      // Everything else (pending, offline, finished) lives on "Мои приёмы".
      const all = [...telemedCards, ...apptCards, ...consiliumCards]
        .filter((c) => c.joinable)
        .sort((x, y) => {
          const dx = x.when ? new Date(x.when).getTime() : 0;
          const dy = y.when ? new Date(y.when).getTime() : 0;
          return dy - dx;
        });

      setCards(all);
    } catch (e) {
      setErr(e?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const statusLabel = (st) =>
    t(`patientTelemed.status.${st}`, {
      defaultValue:
        st === "scheduled"
          ? "Запланирована"
          : st === "live"
            ? "Идёт"
            : st === "confirmed"
              ? "Подтверждён"
              : st === "pending"
                ? "Ожидает"
                : st === "open"
                  ? "Открыт"
                  : st === "resolved"
                    ? "Завершён"
                    : st === "completed"
                      ? "Завершена"
                      : st === "cancelled"
                        ? "Отменена"
                        : st === "no_show"
                          ? "Неявка"
                          : st === "refunded"
                            ? "Возврат"
                            : st,
    });

  const kindLabel = (k) =>
    k === "telemed"
      ? t("patientTelemed.kind.telemed", { defaultValue: "Клиника" })
      : k === "consilium"
        ? t("patientTelemed.kind.consilium", { defaultValue: "Консилиум" })
        : t("patientTelemed.kind.appointment", {
            defaultValue: "Личный приём",
          });

  return (
    <div className="tm-wrap">
      <style>{CSS}</style>

      <div className="tm-head">
        <div className="tm-eyebrow">
          {t("patientTelemed.eyebrow", { defaultValue: "Портал пациента" })}
        </div>
        <div className="tm-title">
          {t("patientTelemed.title", { defaultValue: "Онлайн-консультации" })}
        </div>
        <div className="tm-sub">
          {t("patientTelemed.subtitle", {
            defaultValue:
              "Подтверждённые видеоприёмы и консилиумы, готовые к подключению. Нажмите «Войти», когда консультация начнётся. Все записи целиком — в разделе «Записи на приём».",
          })}
        </div>
      </div>

      {loading && (
        <div className="tm-loading">
          {t("patientTelemed.loading", { defaultValue: "Загрузка…" })}
        </div>
      )}

      {!loading && err && (
        <div className="tm-error">
          {t("patientTelemed.error", { defaultValue: "Не удалось загрузить" })}:{" "}
          {err}
        </div>
      )}

      {!loading && !err && cards.length === 0 && (
        <div className="tm-empty">
          {t("patientTelemed.empty", {
            defaultValue: "У вас пока нет онлайн-консультаций.",
          })}
        </div>
      )}

      {!loading && !err && cards.length > 0 && (
        <div className="tm-list">
          {cards.map((c) => (
            <div className="tm-card" key={`${c.kind}-${c.id}`}>
              <div className="tm-card-main">
                <div className="tm-card-title">
                  {c.title}
                  <span className={`tm-kind ${c.kind}`}>
                    {kindLabel(c.kind)}
                  </span>
                  <span className={`tm-status ${c.status}`}>
                    {statusLabel(c.status)}
                  </span>
                </div>
                <div className="tm-meta">
                  <div>
                    <b>{t("patientTelemed.when", { defaultValue: "Дата" })}:</b>{" "}
                    {fmtDate(c.when)}
                    {c.durationMin ? ` · ${c.durationMin} мин` : ""}
                  </div>
                  {c.doctorName && (
                    <div>
                      <b>
                        {t("patientTelemed.doctor", { defaultValue: "Врач" })}:
                      </b>{" "}
                      {c.doctorName}
                    </div>
                  )}
                  {c.clinicName && (
                    <div>
                      <b>
                        {t("patientTelemed.clinic", {
                          defaultValue: "Клиника",
                        })}
                        :
                      </b>{" "}
                      {c.clinicName}
                    </div>
                  )}
                </div>
              </div>

              {c.joinable && (
                <button
                  className="tm-btn"
                  onClick={() => setActive({ source: c.joinSource, id: c.id })}
                >
                  <FaVideo />
                  {t("patientTelemed.join", { defaultValue: "Войти" })}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {active && (
        <div className="tm-video-overlay" onClick={() => setActive(null)}>
          <div className="tm-video-box" onClick={(e) => e.stopPropagation()}>
            <JitsiRoom
              source={active.source}
              id={active.id}
              displayName={t("patientTelemed.meName", {
                defaultValue: "Пациент",
              })}
              onClose={() => setActive(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
