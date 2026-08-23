// client/src/pages/clinic/vitrina/components/BookingWidget.jsx
//
// Запись к врачу прямо с витрины клиники.
//
// Что это НЕ делает: не создаёт приём. Посетитель без аккаунта оставляет
// ЗАЯВКУ — клиника видит её во входящих вместе с обращениями с сайта и
// оформляет запись сама. Иначе любой скрипт занял бы календарь врача, и
// защититься от этого можно было бы только капчей.
//
// Поэтому и формулировки здесь про заявку, а не про подтверждённую запись:
// обещать посетителю бронь, которой нет, — худший способ начать отношения
// с клиникой.
//
// Слоты запрашиваются на неделю вперёд от выбранного дня и перепроверяются
// сервером в момент отправки: список мог устареть, пока заполняли форму.

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPublicDoctorSlots, createPublicBooking } from "../../../../api/clinic";

const CSS = `
.vt-bk { margin-top: 28px; padding-top: 22px; border-top: 1px solid var(--v-border); }
.vt-bk-title { font-family: var(--v-font-heading); font-size: 22px; font-weight: 700; margin: 0 0 6px; }
.vt-bk-note { font-size: 13px; color: var(--v-text-muted); line-height: 1.5; margin: 0 0 16px; }
.vt-bk-days { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 14px; }
.vt-bk-day { flex: 0 0 auto; border: 1px solid var(--v-border); background: var(--v-surface); color: var(--v-text); font: inherit; font-size: 13px; font-weight: 600; padding: 8px 14px; border-radius: 12px; cursor: pointer; white-space: nowrap; }
.vt-bk-day:hover { border-color: var(--v-primary); color: var(--v-primary); }
.vt-bk-day.is-active { background: var(--v-primary); border-color: var(--v-primary); color: var(--v-on-primary); }
.vt-bk-day.is-empty { opacity: .45; cursor: default; }
.vt-bk-slots { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.vt-bk-slot { border: 1px solid var(--v-border); background: var(--v-surface); color: var(--v-text); font: inherit; font-size: 14px; font-weight: 600; padding: 8px 16px; border-radius: 100px; cursor: pointer; }
.vt-bk-slot:hover { border-color: var(--v-primary); color: var(--v-primary); }
.vt-bk-slot.is-active { background: var(--v-primary); border-color: var(--v-primary); color: var(--v-on-primary); }
.vt-bk-form { display: grid; gap: 10px; max-width: 460px; }
.vt-bk-input, .vt-bk-area { width: 100%; font: inherit; font-size: 14px; padding: 10px 12px; border: 1px solid var(--v-border); border-radius: 10px; background: var(--v-surface); color: var(--v-text); }
.vt-bk-area { resize: vertical; min-height: 72px; }
.vt-bk-btn { justify-self: start; border: none; background: var(--v-primary); color: var(--v-on-primary); font: inherit; font-size: 15px; font-weight: 600; padding: 11px 26px; border-radius: 100px; cursor: pointer; }
.vt-bk-btn:disabled { opacity: .55; cursor: default; }
.vt-bk-msg { font-size: 14px; line-height: 1.5; padding: 12px 14px; border-radius: 12px; }
.vt-bk-ok { background: var(--v-surface-alt); border: 1px solid var(--v-border); }
.vt-bk-err { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.vt-bk-empty { font-size: 14px; color: var(--v-text-muted); }
`;

/** Ближайшие N дней в формате YYYY-MM-DD. */
function nextDays(count) {
  const out = [];
  const base = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function timeOf(iso, lang) {
  try {
    return new Date(iso).toLocaleTimeString(lang || "ru", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function BookingWidget({ slug, doctorId, doctorName }) {
  const { t, i18n } = useTranslation();
  const lang = String(i18n.language || "ru").slice(0, 2);

  const days = nextDays(14);
  const [byDay, setByDay] = useState({});
  const [activeDay, setActiveDay] = useState(days[0]);
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!slug || !doctorId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicDoctorSlots(
        slug,
        doctorId,
        days[0],
        days[days.length - 1],
      );
      const map = {};
      for (const day of data?.days || []) map[day.date] = day.slots || [];
      setByDay(map);
    } catch {
      // Расписания может не быть вовсе — это не ошибка страницы, просто
      // записаться пока не к чему.
      setByDay({});
    } finally {
      setLoading(false);
    }
    // days пересобирается каждый рендер, но зависит только от сегодняшней
    // даты — включать его в зависимости значит гонять запрос без конца.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, doctorId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!slot || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await createPublicBooking(slug, doctorId, {
        startUTC: slot,
        name,
        phone,
        message,
      });
      setDone(res);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === "SLOT_TAKEN") {
        setError(
          t("booking.slotTaken", {
            defaultValue: "Это время только что заняли. Выберите другое.",
          }),
        );
        setSlot(null);
        load();
      } else if (code === "RATE_LIMITED") {
        setError(
          t("booking.tooMany", {
            defaultValue: "Слишком много заявок подряд. Попробуйте позже.",
          }),
        );
      } else {
        setError(
          t("booking.failed", {
            defaultValue: "Не удалось отправить заявку. Попробуйте позже.",
          }),
        );
      }
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <section className="vt-bk">
        <style>{CSS}</style>
        <h2 className="vt-bk-title">
          {t("booking.doneTitle", { defaultValue: "Заявка отправлена" })}
        </h2>
        <div className="vt-bk-msg vt-bk-ok">
          {t("booking.doneText", {
            defaultValue:
              "Клиника свяжется с вами, чтобы подтвердить запись. Выбранное время закрепляется только после подтверждения.",
          })}
        </div>
      </section>
    );
  }

  const slots = byDay[activeDay] || [];
  const hasAny = Object.values(byDay).some((s) => s.length > 0);

  return (
    <section className="vt-bk">
      <style>{CSS}</style>
      <h2 className="vt-bk-title">
        {t("booking.title", { defaultValue: "Записаться на приём" })}
        {doctorName ? ` — ${doctorName}` : ""}
      </h2>
      <p className="vt-bk-note">
        {t("booking.note", {
          defaultValue:
            "Выберите удобное время и оставьте контакты. Это заявка: клиника перезвонит и подтвердит запись.",
        })}
      </p>

      {loading ? (
        <div className="vt-bk-empty">
          {t("publicClinic.loading", { defaultValue: "Загрузка…" })}
        </div>
      ) : !hasAny ? (
        <div className="vt-bk-empty">
          {t("booking.noSlots", {
            defaultValue:
              "Свободного времени на ближайшие две недели нет. Позвоните в клинику — регистратура подберёт время.",
          })}
        </div>
      ) : (
        <>
          <div className="vt-bk-days">
            {days.map((d) => {
              const count = (byDay[d] || []).length;
              return (
                <button
                  key={d}
                  type="button"
                  className={
                    "vt-bk-day" +
                    (activeDay === d ? " is-active" : "") +
                    (count === 0 ? " is-empty" : "")
                  }
                  disabled={count === 0}
                  onClick={() => {
                    setActiveDay(d);
                    setSlot(null);
                  }}
                >
                  {new Date(d).toLocaleDateString(lang, {
                    day: "numeric",
                    month: "short",
                  })}
                </button>
              );
            })}
          </div>

          <div className="vt-bk-slots">
            {slots.length === 0 ? (
              <span className="vt-bk-empty">
                {t("booking.dayEmpty", { defaultValue: "В этот день приёма нет" })}
              </span>
            ) : (
              slots.map((s) => (
                <button
                  key={s.startUTC}
                  type="button"
                  className={"vt-bk-slot" + (slot === s.startUTC ? " is-active" : "")}
                  onClick={() => setSlot(s.startUTC)}
                >
                  {timeOf(s.startUTC, lang)}
                </button>
              ))
            )}
          </div>

          {slot && (
            <form className="vt-bk-form" onSubmit={submit}>
              <input
                className="vt-bk-input"
                placeholder={t("booking.name", { defaultValue: "Ваше имя" })}
                value={name}
                maxLength={200}
                required
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="vt-bk-input"
                placeholder={t("booking.phone", { defaultValue: "Телефон" })}
                value={phone}
                maxLength={40}
                required
                onChange={(e) => setPhone(e.target.value)}
              />
              <textarea
                className="vt-bk-area"
                placeholder={t("booking.message", {
                  defaultValue: "Что беспокоит (необязательно)",
                })}
                value={message}
                maxLength={2000}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button className="vt-bk-btn" type="submit" disabled={sending}>
                {sending
                  ? t("booking.sending", { defaultValue: "Отправляем…" })
                  : t("booking.submit", { defaultValue: "Отправить заявку" })}
              </button>
            </form>
          )}
        </>
      )}

      {error && <div className="vt-bk-msg vt-bk-err">{error}</div>}
    </section>
  );
}
