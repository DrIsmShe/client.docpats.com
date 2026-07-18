// client/src/pages/payments/MockCheckoutPage.jsx
// ─────────────────────────────────────────────────────────────────────
//   Тестовая страница оплаты (mock-провайдер). Сюда ведёт checkoutUrl,
//   когда PAYMENTS_PROVIDER=mock. Реальные деньги НЕ списываются.
//   Кнопка «Оплатить» → POST /payments/mock/confirm → активация плана.
//
//   Когда подключим боевой iyzico/Stripe — этот маршрут больше не
//   используется, checkoutUrl будет вести на страницу шлюза.
// ─────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL;
const TEAL = "#2484a7";

export default function MockCheckoutPage() {
  const [params] = useSearchParams();
  const tx = params.get("tx");
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle"); // idle | paying | done | error
  const [msg, setMsg] = useState("");

  const pay = async () => {
    if (!tx) {
      setStatus("error");
      setMsg("Нет идентификатора транзакции");
      return;
    }
    setStatus("paying");
    try {
      const res = await axios.post(
        `${API_BASE}/api/payments/mock/confirm`,
        { transactionId: tx },
        { withCredentials: true },
      );
      if (res.data?.success) {
        setStatus("done");
      } else {
        setStatus("error");
        setMsg(res.data?.message || "Не удалось подтвердить оплату");
      }
    } catch (e) {
      setStatus("error");
      setMsg(e.response?.data?.message || "Ошибка при оплате");
    }
  };

  return (
    <div
      style={{
        maxWidth: 460,
        margin: "60px auto",
        padding: "28px 24px",
        border: "1px solid #e3e3e3",
        borderRadius: 16,
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "#fff8e1",
          border: "1px solid #ffe082",
          color: "#8a6d00",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 13,
          marginBottom: 20,
        }}
      >
        ⚠️ Тестовый режим оплаты — реальные деньги не списываются.
      </div>

      {status !== "done" ? (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Подтверждение оплаты
          </h2>
          <p style={{ color: "#666", marginBottom: 24 }}>
            Нажмите кнопку, чтобы завершить тестовую оплату и активировать
            подписку.
          </p>

          {status === "error" && (
            <div style={{ color: "#c0392b", marginBottom: 16 }}>{msg}</div>
          )}

          <button
            onClick={pay}
            disabled={status === "paying"}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 10,
              border: "none",
              background: TEAL,
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              cursor: status === "paying" ? "default" : "pointer",
            }}
          >
            {status === "paying" ? "Обработка…" : "Оплатить (тест)"}
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Оплата прошла
          </h2>
          <p style={{ color: "#666", marginBottom: 24 }}>
            Подписка активирована. Спасибо!
          </p>
          <button
            onClick={() => navigate("/subscription")}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 10,
              border: "none",
              background: TEAL,
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            К тарифам
          </button>
        </>
      )}
    </div>
  );
}
