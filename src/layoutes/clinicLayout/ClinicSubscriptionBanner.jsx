// client/src/layoutes/clinicLayout/ClinicSubscriptionBanner.jsx
//
// Полоса о состоянии подписки клиники.
//
// Зачем она вообще: без неё клиника узнаёт об окончании пробного периода
// единственным способом — упершись в отказ посреди приёма, когда
// регистратура не может завести пациента. Предупредить надо заранее и в
// том месте, где человек работает, а не письмом, которое читает владелец.
//
// Три состояния приходят из GET /api/v1/clinic/me → subscription.state:
//
//   active — ничего не показываем. Полоса, висящая всегда, перестаёт
//            читаться на второй день и мешает работать.
//   trial  — показываем только на последней неделе. Напоминание за 25
//            дней до срока — это шум, а не забота.
//   frozen — показываем всегда и красным: запись закрыта, и человек
//            должен понимать почему, ещё до первой неудачной попытки.
//
// Кнопка ведёт на страницу тарифов: оплата идёт мимо клинического
// роутера, поэтому заморозка ей не мешает.

import { Link } from "react-router-dom";

/** Сколько дней осталось. Округляем вверх: «остался 1 день» честнее нуля. */
function daysLeft(until) {
  if (!until) return null;
  const ms = new Date(until).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

/** Русское склонение: 1 день, 2 дня, 5 дней. */
function pluralDays(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

// Полоса появляется за неделю до конца пробного периода. Раньше — шум.
const WARN_FROM_DAYS = 7;

export default function ClinicSubscriptionBanner({ subscription }) {
  if (!subscription) return null;

  const { state, until } = subscription;
  if (state === "active") return null;

  if (state === "trial") {
    const left = daysLeft(until);
    if (left === null || left > WARN_FROM_DAYS) return null;

    return (
      <div className="clinic-subscription-banner clinic-subscription-banner--warn">
        <span>
          Пробный период клиники заканчивается через{" "}
          <strong>
            {left} {pluralDays(left)}
          </strong>
          . После этого карты пациентов останутся доступны, но новые записи
          создавать будет нельзя.
        </span>
        <Link className="clinic-subscription-banner__cta" to="/pricing">
          Выбрать тариф
        </Link>
      </div>
    );
  }

  // frozen
  return (
    <div className="clinic-subscription-banner clinic-subscription-banner--frozen">
      <span>
        <strong>Пробный период закончился.</strong> Карты пациентов, история и
        выгрузка доступны по-прежнему — новые записи, приёмы и сотрудники
        создаются после оплаты тарифа.
      </span>
      <Link className="clinic-subscription-banner__cta" to="/pricing">
        Оплатить
      </Link>
    </div>
  );
}
