// client/src/components/shared/DoctorReviews.jsx
//
// Отзывы пациентов о враче: средний рейтинг + список + форма отзыва.
// Форма открывается по ?review=1 (переход из уведомления после приёма).
// GET публично, POST — авторизованно (бэкенд проверяет).

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL;

function Stars({ value = 0, size = 16 }) {
  const full = Math.round(value);
  return (
    <span style={{ color: "#f59e0b", fontSize: size, letterSpacing: 1 }}>
      {"★".repeat(full)}
      <span style={{ color: "#d1d5db" }}>{"★".repeat(5 - full)}</span>
    </span>
  );
}

export default function DoctorReviews({ doctorProfileId }) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [showForm, setShowForm] = useState(searchParams.get("review") === "1");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => {
    if (!doctorProfileId) return;
    axios
      .get(`${API_BASE}/doctor-profile/reviews/${doctorProfileId}`)
      .then((r) => setData(r.data))
      .catch(() => {});
  };
  useEffect(load, [doctorProfileId]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await axios.post(
        `${API_BASE}/doctor-profile/reviews/${doctorProfileId}`,
        { rating, text },
        { withCredentials: true },
      );
      setMsg({ ok: true, text: t("doctorReview.thanks", { defaultValue: "Спасибо за отзыв!" }) });
      setShowForm(false);
      setText("");
      load();
    } catch (err) {
      setMsg({
        ok: false,
        text:
          err.response?.status === 401
            ? t("doctorReview.loginNeeded", { defaultValue: "Войдите, чтобы оставить отзыв." })
            : err.response?.data?.message ||
              t("doctorReview.error", { defaultValue: "Не удалось отправить отзыв." }),
      });
    } finally {
      setBusy(false);
    }
  };

  if (!doctorProfileId) return null;

  return (
    <div style={wrap}>
      <div style={head}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>
            {t("doctorReview.title", { defaultValue: "Отзывы пациентов" })}
          </h3>
          {data && data.count > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Stars value={data.average} />
              <b style={{ color: "#0f172a" }}>{data.average}</b>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                · {data.count} {t("doctorReview.count", { defaultValue: "отзывов" })}
              </span>
            </div>
          )}
        </div>
        <button type="button" style={btn} onClick={() => setShowForm((v) => !v)}>
          {t("doctorReview.leave", { defaultValue: "Оставить отзыв" })}
        </button>
      </div>

      {msg && (
        <div style={{ marginTop: 12, color: msg.ok ? "#067647" : "#b91c1c", fontSize: 14 }}>
          {msg.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} style={form}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 26,
                  lineHeight: 1,
                  color: n <= rating ? "#f59e0b" : "#d1d5db",
                  padding: 0,
                }}
                aria-label={`${n}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder={t("doctorReview.placeholder", {
              defaultValue: "Расскажите о приёме (необязательно)…",
            })}
            style={textarea}
          />
          <button type="submit" disabled={busy} style={submitBtn}>
            {busy
              ? t("doctorReview.sending", { defaultValue: "Отправка…" })
              : t("doctorReview.submit", { defaultValue: "Отправить отзыв" })}
          </button>
        </form>
      )}

      <div style={{ marginTop: 16 }}>
        {data && data.reviews?.length === 0 && (
          <div style={{ color: "#94a3b8", fontSize: 14 }}>
            {t("doctorReview.empty", { defaultValue: "Пока нет отзывов — будьте первым." })}
          </div>
        )}
        {data?.reviews?.map((r) => (
          <div key={r._id} style={item}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b style={{ color: "#0f172a" }}>{r.author}</b>
              <Stars value={r.rating} size={14} />
            </div>
            {r.text && <div style={{ color: "#334155", marginTop: 4, fontSize: 14 }}>{r.text}</div>}
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
              {new Date(r.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const wrap = { background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, padding: 20, marginTop: 20 };
const head = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" };
const btn = { padding: "8px 14px", background: "#0f766e", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14 };
const form = { marginTop: 14, padding: 16, background: "#f8fafc", border: "1px solid #e6eaf0", borderRadius: 12 };
const textarea = { width: "100%", minHeight: 80, padding: "10px 12px", border: "1px solid #d9dfe8", borderRadius: 10, fontSize: 14, resize: "vertical", boxSizing: "border-box" };
const submitBtn = { marginTop: 10, padding: "9px 18px", background: "#3d7fff", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600 };
const item = { padding: "12px 0", borderTop: "1px solid #eef2f7" };
