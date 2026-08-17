// client/src/pages/public/PaymentClaimPage.jsx
//
// Страница «я оплатил». Маршрут: /pay/claim/:token
//
// Сюда ведёт подписанная ссылка из письма с реквизитами. Банк о
// поступлении не сообщает, поэтому единственный способ узнать, что деньги
// отправлены, — услышать это от плательщика.
//
// Страница НЕ подтверждает оплату и не включает тариф: это заявление
// плательщика, которое ещё предстоит сверить с выпиской. Формулировки
// подобраны так, чтобы человек не решил, будто всё уже готово.
//
// Без авторизации намеренно: счёт оплачивает бухгалтер, у которого
// аккаунта здесь нет.

import { useState } from "react";
import { useParams } from "react-router-dom";

export default function PaymentClaimPage() {
  const { token } = useParams();
  const [note, setNote] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/payments/invoice-claim/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: note.trim() }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "error");
      setMessage(data.message);
      setState("done");
    } catch (err) {
      setMessage(
        err.message ||
          "Не удалось отправить. Попробуйте ещё раз или ответьте на письмо.",
      );
      setState("error");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)",
      }}
    >
      <div
        className="card border-0 shadow-sm rounded-4"
        style={{ maxWidth: 520, width: "100%" }}
      >
        <div className="card-body p-4 p-md-5">
          {state === "done" ? (
            <>
              <h1 className="h4 fw-bold mb-3">Спасибо, записали</h1>
              <p className="text-muted mb-0">{message}</p>
            </>
          ) : (
            <>
              <h1 className="h4 fw-bold mb-2">Вы отправили оплату?</h1>
              <p className="text-muted">
                Банк не сообщает нам о поступлении автоматически. Нажмите
                кнопку — и мы будем знать, что искать в выписке. Тариф
                подключим после сверки, в течение рабочего дня.
              </p>

              <form onSubmit={submit}>
                <label className="form-label small text-muted">
                  Что-нибудь, что поможет найти платёж — необязательно
                </label>
                <textarea
                  className="form-control mb-3"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="дата перевода, последние 4 цифры карты, номер платежа"
                />

                <button
                  type="submit"
                  className="btn btn-primary w-100 rounded-3 fw-semibold"
                  disabled={state === "sending"}
                >
                  {state === "sending" ? "Отправляем…" : "Да, я оплатил"}
                </button>
              </form>

              {state === "error" && (
                <p className="text-danger small mt-3 mb-0">{message}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
