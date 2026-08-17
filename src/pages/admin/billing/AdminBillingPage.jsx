// client/src/pages/admin/billing/AdminBillingPage.jsx
//
// Админка → Тарифы и заявки. Маршрут: /admin/billing
//
// Два инструмента на период, пока не подключён эквайринг, и после него:
//
//   1. Ручная выдача тарифа или аддона. Продажа по счёту, промо,
//      партнёрский доступ, компенсация за инцидент. Эквайринг это не
//      закрывает, поэтому экран останется нужным и после запуска кассы.
//
//   2. Лист ожидания: кто оставил email на странице тарифов и каким
//      тарифом интересовался. Это единственный источник данных о спросе,
//      пока купить нельзя.
//
// Выдача всегда пишется в реестр платежей (provider: "local", amount: 0)
// с указанием, кто выдал и почему — иначе через полгода в базе будут
// подписки, неотличимые от оплаченных.

import { useCallback, useEffect, useState } from "react";
import axios from "../../../axios";
import InvoiceRequests from "./InvoiceRequests";
import PaymentRequisites from "./PaymentRequisites";
import "../../education/education.css";

const API = "/api/payments";

// Ключи планов совпадают с server/common/config/aiPlanLimits.js.
// Список короткий и меняется вместе с тарифной сеткой — держать его в
// отдельном справочнике ради трёх мест нет смысла.
// doctor_lite здесь отсутствовал: тариф появился позже, а список не
// обновили — выдать его вручную было нельзя. Тот же пропуск, из-за
// которого doctor_lite нельзя было и купить.
//
// Список планов в кодовой базе не один: PLAN_LIMITS и PLAN_PRICES в
// конфиге, enum модели User, PLAN_ALLOWED_ROLES, PAID_PLANS в рассылке
// напоминаний и вот этот. Заводя тариф, пройдите все шесть.
const GRANTABLE = [
  { group: "Пациенты", keys: ["patient_std"] },
  {
    group: "Врачи",
    keys: ["doctor_lite", "doctor_basic", "doctor_super", "doctor_pro"],
  },
  { group: "Клиники", keys: ["clinic_start", "clinic", "clinic_pro"] },
  { group: "Подготовка к экзаменам", keys: ["exam_plus", "exam_unlimited"] },
];

export default function AdminBillingPage() {
  const [waitlist, setWaitlist] = useState([]);
  const [byPlan, setByPlan] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Форма выдачи.
  const [userId, setUserId] = useState("");
  const [planKey, setPlanKey] = useState("exam_plus");
  const [months, setMonths] = useState("1");
  const [reason, setReason] = useState("");
  const [granting, setGranting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/waitlist`);
      setWaitlist(data.items ?? []);
      setByPlan(data.byPlan ?? {});
    } catch (err) {
      setError(
        err?.response?.data?.message ?? "Не удалось загрузить лист ожидания",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGrant(e) {
    e.preventDefault();
    setGranting(true);
    setError(null);
    setNotice(null);
    try {
      const { data } = await axios.post(`${API}/admin/grant`, {
        userId: userId.trim(),
        planKey,
        months: Number(months),
        reason: reason.trim(),
      });
      const until =
        data.subscriptionEndsAt ?? data.examAddonEndsAt ?? null;
      setNotice(
        `Выдано: ${planKey} на ${data.months} мес.` +
          (until ? ` Действует до ${new Date(until).toLocaleDateString()}.` : ""),
      );
      setUserId("");
      setReason("");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Не удалось выдать тариф");
    } finally {
      setGranting(false);
    }
  }

  return (
    <div className="edu-page edu-page--wide">
      <h1 className="edu-title">Оплаты</h1>
      <p className="edu-subtitle">
        Заявки на счёт, реквизиты для оплаты, ручная выдача доступа и лист
        ожидания запуска кассы.
      </p>

      {error && <div className="edu-error">{error}</div>}
      {notice && <div className="edu-notice">{notice}</div>}

      {/* Заявки первыми: это единственный блок, требующий реакции.
          Остальное — справочники и инструменты, к ним заходят по нужде. */}
      <InvoiceRequests onNotice={setNotice} onError={setError} />

      <PaymentRequisites onNotice={setNotice} onError={setError} />

      {/* ─── Выдача ─── */}
      <div className="edu-card">
        <h2 className="edu-card-title">Выдать тариф вручную</h2>
        <p className="edu-hint" style={{ marginTop: 0 }}>
          Выдача попадёт в реестр платежей как ручная операция с нулевой
          суммой — вместе с причиной и тем, кто её сделал.
        </p>

        <form onSubmit={handleGrant}>
          <div className="edu-form-row">
            <label className="edu-prog-setting">
              <span>ID пользователя</span>
              <input
                className="edu-input"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="6a61e679…"
                required
              />
            </label>

            <label className="edu-prog-setting">
              <span>Тариф или аддон</span>
              <select
                className="edu-select"
                value={planKey}
                onChange={(e) => setPlanKey(e.target.value)}
              >
                {GRANTABLE.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.keys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <label className="edu-prog-setting">
              <span>Срок, месяцев</span>
              <input
                className="edu-input"
                type="number"
                min="1"
                max="36"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="edu-field-label">Причина</div>
          <input
            className="edu-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="оплата переводом, счёт №12 / промо / компенсация"
            required
            minLength={3}
          />
          <p className="edu-hint">
            Обязательна: через полгода запись без причины читается как
            «непонятно, откуда у него платный тариф».
          </p>

          <div className="edu-btn-row">
            <button className="edu-btn" type="submit" disabled={granting}>
              {granting ? "Выдаём…" : "Выдать"}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Лист ожидания ─── */}
      <div className="edu-section-title">Лист ожидания</div>

      {loading ? (
        <div className="edu-state">Загружаем…</div>
      ) : waitlist.length === 0 ? (
        <div className="edu-state">
          Заявок пока нет.
          <br />
          Они появятся, когда кто-то оставит email на странице тарифов.
        </div>
      ) : (
        <div className="edu-card">
          <div className="edu-btn-row" style={{ marginTop: 0 }}>
            <a
              className="edu-btn edu-btn--ghost"
              href={`${process.env.REACT_APP_API_URL}${API}/waitlist?format=csv`}
            >
              Выгрузить CSV
            </a>
          </div>

          {/* Сводка: какой тариф ждут чаще — ради этого лист и собирается. */}
          <div className="edu-card-meta">
            {Object.entries(byPlan)
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => (
                <span key={key} className="edu-tag">
                  {key}: {count}
                </span>
              ))}
          </div>

          {waitlist.map((item) => (
            <div key={item._id} className="edu-block-row">
              <div className="edu-block-info">
                <div className="edu-block-name">{item.email}</div>
                <div className="edu-block-range">
                  {item.planKey ?? "без тарифа"}
                  {item.period ? ` · ${item.period}` : ""} ·{" "}
                  {new Date(item.createdAt).toLocaleDateString()}
                  {item.userId ? " · есть аккаунт" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
