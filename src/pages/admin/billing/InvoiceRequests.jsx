// client/src/pages/admin/billing/InvoiceRequests.jsx
//
// Заявки на оплату по счёту.
//
// Канал параллельный онлайн-оплате: бухгалтерия клиники не платит
// корпоративной картой, и для чека в 99–499 $ счёт с закрывающими
// документами — основной способ.
//
// Порядок работы администратора: заявка приходит → выставили счёт (номер
// сохраняем, по нему потом сверять с выпиской) → деньги пришли →
// подтвердили. Подтверждение включает тариф, пишет транзакцию и шлёт
// заявителю письмо. Отменить нельзя только оплаченную: на ней транзакция.

import { useCallback, useEffect, useState } from "react";
import axios from "../../../axios";

const API = "/api/payments";

const STATUS_LABEL = {
  new: "новая",
  invoiced: "счёт выставлен",
  paid: "оплачена",
  cancelled: "отменена",
};

const FILTERS = [
  { key: "new", label: "Новые" },
  { key: "invoiced", label: "Счёт выставлен" },
  { key: "paid", label: "Оплаченные" },
  { key: "all", label: "Все" },
];

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("ru-RU") : "—";
}

export default function InvoiceRequests({ onNotice, onError }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("new");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(false);

  // Поля подтверждения — заполняются по одной заявке за раз.
  const [userId, setUserId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/invoice-requests`, {
        params: { status },
      });
      setItems(data.items ?? []);
    } catch (err) {
      onError?.(
        err?.response?.data?.message ?? "Не удалось загрузить заявки",
      );
    } finally {
      setLoading(false);
    }
  }, [status, onError]);

  useEffect(() => {
    load();
  }, [load]);

  function openCard(item) {
    const next = openId === item._id ? null : item._id;
    setOpenId(next);
    // Подставляем то, что известно: аккаунт из заявки и сумму по прайсу.
    setUserId(item.userId ?? "");
    setInvoiceNumber(item.invoiceNumber ?? "");
    setAmount("");
  }

  async function markPaid(item) {
    setBusy(true);
    try {
      const body = { invoiceNumber: invoiceNumber.trim() || undefined };
      if (userId.trim()) body.userId = userId.trim();
      if (amount.trim()) body.amount = Number(amount);

      const { data } = await axios.post(
        `${API}/invoice-requests/${item._id}/paid`,
        body,
      );
      onNotice?.(
        `Тариф ${data.planKey} подключён на ${data.months} мес. ` +
          `Заявителю отправлено письмо.`,
      );
      setOpenId(null);
      load();
    } catch (err) {
      onError?.(
        err?.response?.data?.message ?? "Не удалось подтвердить оплату",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    setBusy(true);
    try {
      await axios.delete(`${API}/invoice-requests/${item._id}`);
      onNotice?.("Заявка удалена");
      load();
    } catch (err) {
      onError?.(err?.response?.data?.message ?? "Не удалось удалить заявку");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="edu-card">
      <h2 className="edu-card-title">Заявки на счёт</h2>
      <p className="edu-hint" style={{ marginTop: 0 }}>
        Подтверждение оплаты включает тариф, пишет транзакцию с
        <code> provider: invoice</code> и отправляет заявителю письмо.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`edu-btn ${status === f.key ? "" : "edu-btn--ghost"}`}
            onClick={() => setStatus(f.key)}
          >
            {f.label}
          </button>
        ))}
        <button type="button" className="edu-btn edu-btn--ghost" onClick={load}>
          Обновить
        </button>
      </div>

      {loading ? (
        <p className="edu-hint">Загружаем…</p>
      ) : items.length === 0 ? (
        <p className="edu-hint">Заявок нет.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="edu-table">
            <thead>
              <tr>
                <th>Организация</th>
                <th>Email</th>
                <th>Тариф</th>
                <th>Период</th>
                {/* Сумма и номер — прямо в списке: именно их админ сверяет
                    с банковской выпиской, и открывать ради этого каждую
                    карточку значит десять кликов вместо одного взгляда. */}
                <th>Ждём</th>
                <th>Номер</th>
                <th>Статус</th>
                <th>Создана</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id}>
                  <td>{it.companyName}</td>
                  <td>
                    <a href={`mailto:${it.email}`}>{it.email}</a>
                  </td>
                  <td>{it.planKey}</td>
                  <td>
                    {it.months} мес.
                    {it.period === "yearly" ? " (год)" : ""}
                  </td>
                  <td style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {it.amountExpected
                      ? `${Number(it.amountExpected).toFixed(2)} $`
                      : "—"}
                  </td>
                  <td>
                    <code>{it.reference || "—"}</code>
                  </td>
                  <td>
                    {STATUS_LABEL[it.status] ?? it.status}
                    {/* Плательщик нажал «я оплатил». Это ещё не оплата —
                        сигнал, что в выписке пора искать. */}
                    {it.paymentClaimedAt && it.status !== "paid" ? (
                      <span
                        className="badge bg-warning text-dark ms-2"
                        title={`Плательщик сообщил об оплате ${fmtDate(
                          it.paymentClaimedAt,
                        )} — проверьте выписку`}
                      >
                        сообщил об оплате
                      </span>
                    ) : null}
                  </td>
                  <td>{fmtDate(it.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="edu-btn edu-btn--ghost"
                      onClick={() => openCard(it)}
                    >
                      {openId === it._id ? "Свернуть" : "Открыть"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items
        .filter((it) => it._id === openId)
        .map((it) => (
          <div key={it._id} className="edu-card" style={{ marginTop: 16 }}>
            <h3 className="edu-card-title">{it.companyName}</h3>

            <dl className="edu-form-row" style={{ display: "grid", gap: 4 }}>
              {/* То, по чему платёж ищут в выписке. Копейки уникальны —
                  это и есть опознавательный знак, поэтому показываем их
                  первыми, до контактов. */}
              <div>
                <strong>
                  Ищем в выписке:{" "}
                  {it.amountExpected
                    ? `${Number(it.amountExpected).toFixed(2)} $`
                    : "сумма не назначена"}
                  {it.reference ? ` · ${it.reference}` : ""}
                </strong>
              </div>
              <div>Контакт: {it.contactName || "—"}</div>
              <div>Телефон: {it.phone || "—"}</div>
              <div>Налоговый номер: {it.taxId || "—"}</div>
              <div>Страна: {it.country || "—"}</div>
              <div>Аккаунт: {it.userId || "не привязан"}</div>
              {it.note ? <div>Комментарий: {it.note}</div> : null}
              {it.paymentClaimedAt ? (
                <div>
                  <strong>Плательщик сообщил об оплате:</strong>{" "}
                  {fmtDate(it.paymentClaimedAt)}
                  {it.claimNote ? ` — ${it.claimNote}` : ""}
                </div>
              ) : null}
              {it.paidAt ? <div>Оплачена: {fmtDate(it.paidAt)}</div> : null}
            </dl>

            {it.status === "paid" ? (
              <p className="edu-hint">
                Заявка оплачена, транзакция {String(it.transactionId)}. Удалить
                нельзя: это разорвало бы связь с деньгами.
              </p>
            ) : (
              <>
                <div className="edu-form-row">
                  <label className="edu-prog-setting">
                    <span>Кому включить (ID пользователя)</span>
                    <input
                      className="edu-input"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="обязательно, если в заявке нет аккаунта"
                    />
                  </label>
                  <label className="edu-prog-setting">
                    <span>Номер счёта</span>
                    <input
                      className="edu-input"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="INV-2026-001"
                    />
                  </label>
                  <label className="edu-prog-setting">
                    <span>Фактическая сумма</span>
                    <input
                      className="edu-input"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="если банк зачислил не ровно прайс"
                    />
                  </label>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="edu-btn"
                    disabled={busy}
                    onClick={() => markPaid(it)}
                  >
                    Оплата получена — включить тариф
                  </button>
                  <a
                    className="edu-btn edu-btn--ghost"
                    href={`mailto:${it.email}?subject=${encodeURIComponent(
                      `DocPats — счёт на ${it.planKey}`,
                    )}`}
                  >
                    Написать заявителю
                  </a>
                  <button
                    type="button"
                    className="edu-btn edu-btn--ghost"
                    disabled={busy}
                    onClick={() => remove(it)}
                  >
                    Удалить заявку
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
    </div>
  );
}
