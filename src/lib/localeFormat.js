// client/src/lib/localeFormat.js
//
// Даты и названия стран на языке интерфейса — с честным запасным вариантом.
//
// Зачем отдельный модуль. Браузер знает не все локали, которые знает наш
// интерфейс. Для азербайджанского Chrome обычно не имеет названий месяцев и
// падает в корневую локаль, а она печатает «2026 M09 26» вместо «26 sen
// 2026». Выглядит как поломка, и на витрине конференций так и выглядело.
//
// Поэтому перед форматированием спрашиваем браузер, поддерживает ли он
// локаль, и если нет — берём ближайшую, которую он точно умеет.

const FALLBACK_CHAIN = {
  az: ["az", "tr", "en"], // турецкий ближе к азербайджанскому, чем английский
  ru: ["ru", "en"],
  tr: ["tr", "en"],
  ar: ["ar", "en"],
  en: ["en"],
};

function pickSupported(lang, probe) {
  const chain = FALLBACK_CHAIN[lang] || [lang, "en"];
  for (const tag of chain) {
    try {
      if (probe(tag).length > 0) return tag;
    } catch {
      /* локаль неизвестна — пробуем следующую */
    }
  }
  return "en";
}

// supportedLocalesOf для дат недостаточно: Chrome отвечает, что `az`
// поддерживает, но названий месяцев у него нет и он печатает корневой
// шаблон — «2027 M03 3». Поэтому спрашиваем не мнение браузера, а результат:
// форматируем пробную дату и смотрим, получилось ли название месяца буквами.
function hasMonthNames(tag) {
  try {
    const probe = new Intl.DateTimeFormat(tag, {
      month: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, 2, 3)));
    // «M03» — признак корневой локали; ждём буквы или цифры арабского письма.
    return !/^M\d/i.test(probe) && /[^\d\s.]/u.test(probe);
  } catch {
    return false;
  }
}

function dateLocale(lang) {
  const chain = FALLBACK_CHAIN[lang] || [lang, "en"];
  for (const tag of chain) if (hasMonthNames(tag)) return tag;
  return "en";
}

const regionLocale = (lang) =>
  pickSupported(lang, (t) =>
    Intl.DisplayNames ? Intl.DisplayNames.supportedLocalesOf([t]) : [],
  );

/** «26 сентября 2026 г.». Пустая дата — пустая строка, а не «Invalid Date». */
export function formatDate(value, lang, { long = false } = {}) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(dateLocale(lang), {
      day: "numeric",
      month: long ? "long" : "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Диапазон: «26 — 29 сентября 2026 г.» без повторов года и месяца. */
export function formatDateRange(start, end, lang, options) {
  const from = formatDate(start, lang, options);
  if (!end) return from;
  const to = formatDate(end, lang, options);
  if (!to || to === from) return from;
  return `${from} — ${to}`;
}

/** «US» → «Соединенные Штаты». Незнакомый код возвращаем как есть. */
export function countryName(code, lang) {
  const raw = String(code || "").trim().toUpperCase();
  if (raw.length !== 2) return String(code || "");
  try {
    return new Intl.DisplayNames([regionLocale(lang)], { type: "region" }).of(raw) || raw;
  } catch {
    return raw;
  }
}

/** «Milan, Италия» — город как есть, страна словом. */
export function formatPlace(city, country, lang) {
  return [String(city || "").trim(), countryName(country, lang)]
    .filter(Boolean)
    .join(", ");
}
