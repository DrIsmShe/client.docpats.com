// src/pages/simulation/utils/dateFormat.js

/* ──────────────────────────────────────────────────────────────────────────
   Форматирование дат с учётом текущей локали i18next.
   "Сегодня в 14:30" / "Вчера в 09:15" / "12 апр 2026" — зависит от
   того, насколько дата свежая.

   Пользуется нативным Intl.DateTimeFormat — никаких moment/dayjs.
   ────────────────────────────────────────────────────────────────────────── */

const MS_IN_DAY = 86_400_000;

/* ──────────────────────────────────────────────────────────────────────────
   Относительная дата: сегодня / вчера / N дней назад / полная дата.
   ────────────────────────────────────────────────────────────────────────── */
export function formatRelativeDate(iso, locale, t) {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const diffDays = Math.floor((startOfToday - date) / MS_IN_DAY);

  const timeStr = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (diffDays <= 0) return t("dates.todayAt", { time: timeStr });
  if (diffDays === 1) return t("dates.yesterdayAt", { time: timeStr });
  if (diffDays < 7) {
    return t("dates.daysAgo", { count: diffDays });
  }

  // Старше недели — полная дата
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
