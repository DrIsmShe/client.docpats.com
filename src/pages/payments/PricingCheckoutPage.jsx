// client/src/pages/payments/PricingCheckoutPage.jsx
// ─────────────────────────────────────────────────────────────────────
//   Мост между PricingPage и платёжным бэкендом.
//   Сюда ведут кнопки тарифов: /pricing/checkout?plan=<key>&period=<p>.
//   Логика: POST /payments/subscribe → редирект на checkoutUrl провайдера
//   (в mock-режиме это /payment/mock?tx=…; при боевом iyzico/Stripe — URL
//   их страницы оплаты).
// ─────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL;
const TEAL = "#2484a7";

export default function PricingCheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const plan = params.get("plan");
  const period = params.get("period") === "yearly" ? "yearly" : "monthly";

  const [error, setError] = useState("");
  const started = useRef(false); // защита от двойного вызова (StrictMode)

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      if (!plan) {
        setError("Не указан тариф");
        return;
      }
      try {
        const res = await axios.post(
          `${API_BASE}/api/payments/subscribe`,
          { planKey: plan, period },
          { withCredentials: true },
        );
        if (res.data?.checkoutUrl) {
          const url = res.data.checkoutUrl;
          // Внутренний путь (mock) — через роутер; внешний — полный переход.
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            navigate(url.replace(/^.*\/\/[^/]+/, "") || url);
          }
        } else {
          setError("Не удалось начать оплату");
        }
      } catch (e) {
        if (e.response?.status === 401) {
          // Не авторизован — на вход, потом вернём на тарифы.
          navigate("/login", { state: { from: "/pricing" } });
          return;
        }
        const raw = e.response?.data?.message || "";
        // Тариф чужой роли (бэкенд: "Role ... cannot purchase plan ...").
        if (/cannot purchase/i.test(raw)) {
          setError(
            "Этот тариф предназначен для другой роли. Выберите план из своего раздела: врач — «Врачи», пациент — «Пациенты», клиника — «Клиники».",
          );
        } else {
          setError(raw || "Ошибка при оформлении подписки. Попробуйте позже.");
        }
      }
    })();
  }, [plan, period, navigate]);

  return (
    <div
      style={{
        maxWidth: 460,
        margin: "80px auto",
        padding: "28px 24px",
        textAlign: "center",
      }}
    >
      {!error ? (
        <>
          <div
            style={{
              width: 44,
              height: 44,
              margin: "0 auto 18px",
              border: `4px solid ${TEAL}33`,
              borderTopColor: TEAL,
              borderRadius: "50%",
              animation: "dp-spin 0.8s linear infinite",
            }}
          />
          <div style={{ color: "#555", fontSize: 16 }}>
            Открываем оплату…
          </div>
          <style>{`@keyframes dp-spin { to { transform: rotate(360deg); } }`}</style>
        </>
      ) : (
        <>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
          <div style={{ color: "#c0392b", marginBottom: 20 }}>{error}</div>
          <button
            onClick={() => navigate("/pricing")}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: TEAL,
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Назад к тарифам
          </button>
        </>
      )}
    </div>
  );
}
