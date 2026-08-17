// client/src/pages/admin/billing/PaymentRequisites.jsx
//
// Реквизиты для оплаты по счёту: куда заявителю отправлять деньги.
//
// Уходят в письмо-подтверждение автоматически, поэтому правятся здесь и
// действуют сразу — без правки кода и без рестарта сервера. Банк закрыл
// счёт, добавили карту в другой валюте, для Турции один счёт, для
// Азербайджана другой: всё это меняется столько раз, сколько нужно.
//
// Удаление мягкое: реквизит, по которому уже платили, нужен, чтобы
// разобрать старые поступления. Отключённый в письма не попадает.

import { useCallback, useEffect, useState } from "react";
import axios from "../../../axios";

const API = "/api/payments";

const KINDS = [
  { key: "bank", label: "Банковский счёт" },
  { key: "card", label: "Карта" },
  { key: "other", label: "Другое" },
];

// Шаблоны в подсказке поля. Форма свободная, но пустое поле не
// подсказывает, чего именно не хватает, — а не хватает обычно того, без
// чего банк отправителя перевод не примет: SWIFT и полного имени
// получателя.
const DETAILS_HINT = {
  bank: `Получатель (Beneficiary): DOCPATS MMC
Счёт / IBAN: AZ00 XXXX 0000 0000 0000 0000
Банк: Kapital Bank OJSC
SWIFT / BIC: AIIBAZ2X
Адрес банка: Baku, Azerbaijan
Назначение платежа: DocPats subscription`,

  card: `Карта: 4169 XXXX XXXX XXXX
Получатель: ISMAILOV I.
Банк: Kapital Bank`,

  other: `Способ оплаты и всё, что нужно отправителю`,
};

const NOTE_HINT = {
  bank: "в назначении платежа укажите номер счёта",
  card: "в комментарии к переводу укажите название организации",
  other: "",
};

const EMPTY = {
  title: "",
  kind: "bank",
  currency: "USD",
  details: "",
  note: "",
  sortOrder: 0,
};

export default function PaymentRequisites({ onNotice, onError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/requisites`, {
        params: { all: "true" },
      });
      setItems(data.items ?? []);
    } catch (err) {
      onError?.(
        err?.response?.data?.message ?? "Не удалось загрузить реквизиты",
      );
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function startEdit(item) {
    setEditingId(item._id);
    setForm({
      title: item.title,
      kind: item.kind,
      currency: item.currency ?? "",
      details: item.details,
      note: item.note ?? "",
      sortOrder: item.sortOrder ?? 0,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (editingId) {
        await axios.patch(`${API}/requisites/${editingId}`, form);
        onNotice?.("Реквизиты обновлены — новые письма пойдут уже с ними");
      } else {
        await axios.post(`${API}/requisites`, form);
        onNotice?.("Реквизиты добавлены");
      }
      cancelEdit();
      load();
    } catch (err) {
      onError?.(err?.response?.data?.message ?? "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(item) {
    setBusy(true);
    try {
      if (item.isActive) {
        await axios.delete(`${API}/requisites/${item._id}`);
        onNotice?.("Отключено: в новые письма не попадёт");
      } else {
        await axios.patch(`${API}/requisites/${item._id}`, { isActive: true });
        onNotice?.("Включено");
      }
      load();
    } catch (err) {
      onError?.(err?.response?.data?.message ?? "Не удалось изменить");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="edu-card">
      <h2 className="edu-card-title">Реквизиты для оплаты</h2>
      <p className="edu-hint" style={{ marginTop: 0 }}>
        Действующие реквизиты попадают в письмо заявителю автоматически.
        Порядок показа — по полю «Порядок», меньше значит выше.
      </p>

      <form onSubmit={save} style={{ marginBottom: 20 }}>
        <div className="edu-form-row">
          <label className="edu-prog-setting">
            <span>Название</span>
            <input
              className="edu-input"
              value={form.title}
              onChange={set("title")}
              placeholder="Банковский перевод"
              required
            />
          </label>

          <label className="edu-prog-setting">
            <span>Вид</span>
            <select className="edu-select" value={form.kind} onChange={set("kind")}>
              {KINDS.map((k) => (
                <option key={k.key} value={k.key}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>

          <label className="edu-prog-setting">
            <span>Валюта</span>
            <input
              className="edu-input"
              value={form.currency}
              onChange={set("currency")}
              placeholder="USD"
            />
          </label>

          <label className="edu-prog-setting">
            <span>Порядок</span>
            <input
              className="edu-input"
              value={form.sortOrder}
              onChange={set("sortOrder")}
              placeholder="0"
            />
          </label>
        </div>

        <label className="edu-prog-setting" style={{ display: "block" }}>
          <span>Реквизиты — как показать заявителю</span>
          <textarea
            className="edu-input"
            rows={form.kind === "card" ? 4 : 7}
            value={form.details}
            onChange={set("details")}
            placeholder={DETAILS_HINT[form.kind] ?? DETAILS_HINT.other}
            required
          />
          <span className="edu-hint">
            {form.kind === "bank"
              ? "Для перевода из-за рубежа нужны SWIFT и полное имя получателя — без них банк отправителя перевод не примет. Для платежей в долларах часто требуется ещё банк-корреспондент."
              : form.kind === "card"
                ? "Карта подходит частному врачу. Бухгалтерия клиники на карту не платит: ей нужен счёт и закрывающие документы."
                : "Всё, что нужно отправителю, чтобы деньги дошли."}
          </span>
        </label>

        <label className="edu-prog-setting" style={{ display: "block" }}>
          <span>Пояснение (необязательно)</span>
          <input
            className="edu-input"
            value={form.note}
            onChange={set("note")}
            placeholder={NOTE_HINT[form.kind] ?? ""}
          />
          <span className="edu-hint">
            Здесь просят подписать перевод. Без этого несколько платежей на
            один счёт не различить: пришло три раза по 9 $, а от кого — неясно.
          </span>
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="edu-btn" disabled={busy}>
            {editingId ? "Сохранить изменения" : "Добавить реквизиты"}
          </button>
          {editingId && (
            <button
              type="button"
              className="edu-btn edu-btn--ghost"
              onClick={cancelEdit}
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="edu-hint">Загружаем…</p>
      ) : items.length === 0 ? (
        <p className="edu-hint">
          Реквизитов нет — письма пока обещают прислать их отдельно.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((it) => (
            <div
              key={it._id}
              className="edu-card"
              style={{ opacity: it.isActive ? 1 : 0.55 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <strong>
                  {it.title}
                  {it.currency ? ` (${it.currency})` : ""}
                  {it.isActive ? "" : " — отключено"}
                </strong>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="edu-btn edu-btn--ghost"
                    onClick={() => startEdit(it)}
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    className="edu-btn edu-btn--ghost"
                    disabled={busy}
                    onClick={() => toggleActive(it)}
                  >
                    {it.isActive ? "Отключить" : "Включить"}
                  </button>
                </div>
              </div>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  margin: "8px 0 0",
                  fontFamily: "inherit",
                }}
              >
                {it.details}
              </pre>
              {it.note ? <p className="edu-hint">{it.note}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
