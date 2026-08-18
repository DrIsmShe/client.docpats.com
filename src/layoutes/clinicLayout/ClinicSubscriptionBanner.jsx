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
//   frozen — запись закрыта, и человек должен понимать почему, ещё до
//            первой неудачной попытки.
//
// ─── КОМУ ЧТО ПОКАЗЫВАЕМ ────────────────────────────────────────────
//
// Деньги клиники — дело её руководства. Врачу, медсестре и регистратуре
// незачем знать, когда у клиники кончается оплаченный период, и тем
// более незачем видеть кнопку «Оплатить», нажать которую они не могут:
// призыв к действию, недоступному человеку, — это не информирование, а
// раздражение.
//
// Поэтому:
//   • про пробный период и про оплату говорим ТОЛЬКО руководству;
//   • при заморозке остальным показываем короткую нейтральную строку
//     без денег и без кнопки — но показываем. Медсестра, у которой не
//     сохраняется приём, должна понимать, что дело не в её ошибке и не
//     в поломке, а в состоянии клиники, и к кому с этим идти.

import { Link } from "react-router-dom";

// Только владелец. Оплата тарифа — его решение и его деньги; админ
// ведёт клинику, но не платит за неё.
const BILLING_ROLES = ["owner"];

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

export default function ClinicSubscriptionBanner({ subscription, role }) {
  if (!subscription) return null;

  const { state, until } = subscription;
  if (state === "active") return null;

  const canPay = BILLING_ROLES.includes(role);

  if (state === "trial") {
    // Про сроки оплаты — только руководству. Остальным это чужая
    // бухгалтерия, и в рабочем экране ей не место.
    if (!canPay) return null;

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
        <Link className="clinic-subscription-banner__cta" to="/pricing?tab=clinics">
          Выбрать тариф
        </Link>
      </div>
    );
  }

  // frozen
  //
  // Здесь полоса нужна ВСЕМ, но говорит разное. Сотруднику, у которого
  // не сохраняется приём, важно понять, что дело не в его ошибке и не в
  // поломке; про деньги ему знать незачем.
  if (!canPay) {
    return (
      <div className="clinic-subscription-banner clinic-subscription-banner--frozen">
        <span>
          <strong>Новые записи временно не создаются.</strong> Карты
          пациентов, история и выгрузка доступны как обычно. Обратитесь к
          руководителю клиники.
        </span>
      </div>
    );
  }

  return (
    <div className="clinic-subscription-banner clinic-subscription-banner--frozen">
      <span>
        <strong>Пробный период закончился.</strong> Карты пациентов, история и
        выгрузка доступны по-прежнему — новые записи, приёмы и сотрудники
        создаются после оплаты тарифа.
      </span>
      <Link className="clinic-subscription-banner__cta" to="/pricing?tab=clinics">
        Оплатить
      </Link>
    </div>
  );
}
