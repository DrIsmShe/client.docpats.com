// client/src/pages/payments/SubscriptionPlansPage.jsx
// ─────────────────────────────────────────────────────────────────────
//   Страница тарифов. Тянет планы (GET /payments/plans) и текущую
//   подписку (GET /payments/my-subscription), показывает планы для роли
//   юзера, кнопка «Оформить» → POST /payments/subscribe → редирект на
//   checkoutUrl провайдера.
// ─────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL;
const TEAL = "#2484a7";

// Короткие подписи ключевых лимитов для карточки.
function featureLines(plan) {
  const l = plan.limits || {};
  const rows = [];
  const num = (v) => (v === -1 ? "∞" : v);
  if (plan.audience === "doctor") {
    if (l.aiAnalyses != null) rows.push(`AI-анализы: ${num(l.aiAnalyses)}/мес`);
    if (l.videoMinutes != null) rows.push(`Видео: ${num(l.videoMinutes)} мин/мес`);
    if (l.patientsInOffice != null)
      rows.push(`Пациентов в кабинете: ${num(l.patientsInOffice)}`);
    if (l.docpatsCommissionPct != null)
      rows.push(`Комиссия DocPats: ${l.docpatsCommissionPct}%`);
  } else if (plan.audience === "patient") {
    if (l.aiConsultations != null)
      rows.push(`AI-консультации: ${num(l.aiConsultations)}/мес`);
    if (l.soapEpicrises != null) rows.push(`Эпикризы: ${num(l.soapEpicrises)}/мес`);
    if (l.bookingDiscount) rows.push(`Скидка на видео-приём: ${l.bookingDiscount}%`);
  } else if (plan.audience === "clinic") {
    if (l.doctors != null) rows.push(`Врачей: ${num(l.doctors)}`);
    if (l.videoMinutes != null) rows.push(`Видео: ${num(l.videoMinutes)} мин/мес`);
    if (l.analytics) rows.push("Аналитика клиники");
    if (l.topInRecommendations) rows.push("Топ в рекомендациях");
  }
  return rows;
}

export default function SubscriptionPlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [sub, setSub] = useState(null);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [pRes, sRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/payments/plans`, { withCredentials: true }),
          axios.get(`${API_BASE}/payments/my-subscription`, {
            withCredentials: true,
          }),
        ]);
        if (pRes.status === "fulfilled") setPlans(pRes.value.data.plans || []);
        if (sRes.status === "fulfilled") setSub(sRes.value.data);
      } catch (e) {
        setError("Не удалось загрузить тарифы");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Аудитория юзера по его эффективному плану.
  const audience = useMemo(() => {
    const p = sub?.effectivePlan || "";
    if (p.startsWith("doctor")) return "doctor";
    if (p.startsWith("patient")) return "patient";
    if (p.startsWith("clinic")) return "clinic";
    return null;
  }, [sub]);

  // Врачам показываем и клинические планы.
  const visible = plans.filter((p) => {
    if (!audience) return true;
    if (audience === "doctor") return p.audience === "doctor" || p.audience === "clinic";
    return p.audience === audience;
  });

  const subscribe = async (planKey) => {
    setBusyKey(planKey);
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE}/payments/subscribe`,
        { planKey, period },
        { withCredentials: true },
      );
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        setError("Не удалось начать оплату");
      }
    } catch (e) {
      if (e.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError(e.response?.data?.message || "Ошибка при оформлении");
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
        Загрузка тарифов…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
        Тарифные планы
      </h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Цены указаны в манатах (AZN). Годовая оплата выгоднее месячной.
      </p>

      {sub && (
        <div
          style={{
            background: "#eef7fb",
            border: `1px solid ${TEAL}33`,
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          Текущий план: <b>{sub.effectivePlanName || sub.effectivePlan}</b>
          {sub.trial?.active && sub.trial?.endsAt && (
            <>
              {" "}
              · пробный период до{" "}
              {new Date(sub.trial.endsAt).toLocaleDateString("ru-RU")}
            </>
          )}
          {sub.subscriptionEndsAt && (
            <>
              {" "}
              · оплачено до{" "}
              {new Date(sub.subscriptionEndsAt).toLocaleDateString("ru-RU")}
            </>
          )}
        </div>
      )}

      {/* Переключатель периода */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { k: "monthly", label: "Ежемесячно" },
          { k: "yearly", label: "Ежегодно −20%" },
        ].map((o) => (
          <button
            key={o.k}
            onClick={() => setPeriod(o.k)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: `1px solid ${TEAL}`,
              background: period === o.k ? TEAL : "#fff",
              color: period === o.k ? "#fff" : TEAL,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ color: "#c0392b", marginBottom: 16 }}>{error}</div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {visible.map((plan) => {
          const price = period === "yearly" ? plan.yearly : plan.monthly;
          const isCurrent = sub?.storedPlan === plan.key;
          return (
            <div
              key={plan.key}
              style={{
                border: isCurrent ? `2px solid ${TEAL}` : "1px solid #e3e3e3",
                borderRadius: 14,
                padding: 20,
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>{plan.name}</div>
              <div style={{ margin: "10px 0" }}>
                <span style={{ fontSize: 30, fontWeight: 800 }}>{price}</span>
                <span style={{ color: "#888" }}> AZN</span>
                <span style={{ color: "#888", fontSize: 14 }}>
                  {" "}
                  / {period === "yearly" ? "год" : "мес"}
                </span>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 16px",
                  color: "#555",
                  fontSize: 14,
                  flex: 1,
                }}
              >
                {featureLines(plan).map((f, i) => (
                  <li key={i} style={{ padding: "3px 0" }}>
                    ✓ {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrent || busyKey === plan.key}
                onClick={() => subscribe(plan.key)}
                style={{
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: isCurrent ? "#cfd8dc" : TEAL,
                  color: "#fff",
                  fontWeight: 700,
                  cursor: isCurrent ? "default" : "pointer",
                }}
              >
                {isCurrent
                  ? "Текущий план"
                  : busyKey === plan.key
                  ? "Открываем оплату…"
                  : "Оформить"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
