// client/src/lib/language.js
//
// Единственное место, где решается «какой сейчас язык».
//
// Зачем понадобилось
// ─────────────────────────────────────────────────────────────────────
// Хранилищ языка в приложении исторически три, и они не согласованы:
//   • localStorage.lang          — им живёт i18n.js, то есть ВЕСЬ интерфейс,
//                                  и от него же зависит заголовок X-Language
//                                  в каждом запросе (src/axios.js);
//   • localStorage.docpats_lang  — hooks/useLanguage.js;
//   • localStorage.locale + cookie locale — читалка новостей и синтез-статей;
//     именно cookie читает netlify/edge-functions/seo.js, когда язык не задан
//     в адресе.
//
// Добавлять к трём правилам четвёртое («а ещё смотри в адрес») значило бы
// закрепить расхождение. Поэтому правило собрано здесь, и точки входа —
// старт i18n и переключатель языка — ходят через него.
//
// Главное правило, ради которого всё затевалось
// ─────────────────────────────────────────────────────────────────────
// ЯЗЫК ИЗ АДРЕСА ГЛАВНЕЕ СОХРАНЁННОГО. Без этого поисковая выдача врёт:
// эдж-функция отдаёт боту арабские title/description/hreflang по адресу
// ?locale=ar, а приложение затем рисует страницу на языке из localStorage —
// то есть по умолчанию русскую. Google такое несовпадение заявленного и
// фактического языка выбрасывает из индекса, а hreflang, ведущий на страницу
// с другим языком, обесценивает всю группу версий: вреднее, чем его отсутствие.
//
// И ровно одно исключение из этого правила
// ─────────────────────────────────────────────────────────────────────
// Язык из адреса НЕ СОХРАНЯЕТСЯ. Он действует на просмотр и умирает вместе с
// ним. Иначе врач, открывший арабскую ссылку на клинику, получит арабский
// кабинет навсегда — и не поймёт, что произошло. Сохраняет только явный выбор
// в переключателе: там человек сообщает о своём предпочтении, а не просто
// открывает чужую ссылку.

// Модуль НАМЕРЕННО не импортирует i18n. Его зовёт сам i18n.js на старте,
// чтобы вычислить начальный язык, — обратный импорт замкнул бы цикл, а
// вычисление происходит в момент инициализации модуля, когда во второй
// половине цикла ещё пусто. Поэтому здесь только правила выбора языка, без
// его применения: применяют вызывающие.

export const LANGS = ["ru", "en", "az", "tr", "ar"];
export const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);
export const DEFAULT_LANG = "ru";

// Имя параметра ОДНО на всё приложение. Новости и витрина клиники уже
// используют "locale" — оно и становится каноническим.
//
// Формат (параметр против префикса пути /ar/...) выбран как меньший из двух:
// префикс читается лучше, но требует переписать 560 маршрутов в одном
// <Routes>. Для поисковика разницы нет — различный адрес есть различный
// адрес. И раз правило теперь живёт в одной функции, смена формата позже
// будет правкой здесь, а не в четырёх местах.
export const LOCALE_PARAM = "locale";

const norm = (v) => String(v || "").slice(0, 2).toLowerCase();

/**
 * Язык из строки запроса, если он там есть и допустим.
 *
 * `lang` читается как устаревший синоним: этим именем язык статьи передаётся
 * с самого начала (server/common/middlewares/resolveLanguage.js), и живые
 * ссылки с ним существуют. Канон — `locale`, поэтому он и старше.
 */
export function localeFromSearch(search) {
  try {
    const params = new URLSearchParams(
      search ?? (typeof window === "undefined" ? "" : window.location.search),
    );
    const raw = params.get(LOCALE_PARAM) ?? params.get("lang");
    const code = norm(raw);
    // Белый список, а не «любой код из адреса»: ?locale=zz иначе уехал бы в
    // запрос к бэкенду и в <html lang>.
    return LANGS.includes(code) ? code : null;
  } catch {
    return null;
  }
}

/** Сохранённое предпочтение. Читаем и устаревшие ключи — они у людей в
 *  браузерах уже лежат, и терять их выбор при выкатке незачем. */
export function storedLanguage() {
  if (typeof localStorage === "undefined") return null;
  try {
    const candidates = [
      localStorage.getItem("lang"),
      localStorage.getItem("locale"),
      localStorage.getItem("docpats_lang"),
    ];
    for (const c of candidates) {
      const code = norm(c);
      if (LANGS.includes(code)) return code;
    }
  } catch {
    // Приватный режим, отключённые куки и хранилище: доступ бросает.
    // Язык по умолчанию хуже, чем сохранённый, но лучше, чем белый экран.
  }
  return null;
}

/**
 * Язык, с которым приложение стартует.
 * Порядок: адрес → сохранённое → умолчание.
 */
export function resolveInitialLanguage() {
  return localeFromSearch() || storedLanguage() || DEFAULT_LANG;
}

export function isRtl(lang) {
  return RTL_LANGS.has(norm(lang));
}

/**
 * Явный выбор языка человеком. ТОЛЬКО отсюда язык попадает в хранилище.
 *
 * Пишем во все три ключа и в cookie — не из любви к дублированию, а потому
 * что читатели у них разные и живые: cookie читает эдж-функция на сервере,
 * `locale` — читалка новостей, `lang` — i18n. Пока они не сведены в один,
 * запись только в свой ключ означала бы, что половина приложения о выборе
 * не узнает.
 */
export function persistLanguage(lang) {
  const code = LANGS.includes(norm(lang)) ? norm(lang) : DEFAULT_LANG;
  try {
    localStorage.setItem("lang", code);
    localStorage.setItem("locale", code);
    localStorage.setItem("docpats_lang", code);
  } catch {
    // см. storedLanguage: хранилище может быть недоступно
  }
  try {
    document.cookie = `${LOCALE_PARAM}=${code};path=/;max-age=31536000`;
  } catch {
    /* пусто */
  }
  return code;
}

// ─── Страницы, у которых языковые адреса есть ────────────────────────
//
// Объявляет их САМА страница, а не список маршрутов здесь. Причина
// практическая: витрина клиники живёт на корневом слаге (/docpats-medical-club),
// и отличить её от /login или /pricing можно только списком занятых сегментов
// — такой список уже есть в netlify/edge-functions/seo.js (RESERVED_ROOT), и
// вторая его копия неизбежно разойдётся с первой. Страница же про себя знает
// точно и ошибиться не может.
//
// Здесь же хранится язык ОРИГИНАЛА: переключение на него должно параметр
// УБИРАТЬ, а не выставлять. Оригинал живёт на голом адресе — так его пишет
// карта сайта и на него же указывает canonical. Добавить ?locale=az там, где
// az и так отдаётся по голому адресу, значит завести второй адрес одного
// текста и заставить поисковик их склеивать.
let addressablePage = null;

/**
 * Страница сообщает: у меня есть языковые адреса.
 * @param {{original?: string}} info - язык оригинала материала, если известен
 * @returns {() => void} снять объявление (для useEffect)
 */
export function markLocaleAddressable({ original } = {}) {
  addressablePage = { original: norm(original) || null };
  return () => {
    addressablePage = null;
  };
}

export function isLocaleAddressable() {
  return Boolean(addressablePage);
}

/**
 * Адрес с проставленным языком — для переключателя.
 *
 * Возвращает null, когда адрес менять не нужно: тогда переключателю
 * достаточно перезагрузки.
 *
 * Правила:
 *   • параметр уже в адресе → правим его (иначе перезагрузка вернёт старый
 *     язык, и переключатель выглядел бы сломанным);
 *   • страница объявила языковые адреса → добавляем, чтобы скопированная
 *     ссылка открылась на том же языке, а не на языке получателя;
 *   • выбран язык оригинала → параметр УБИРАЕМ: оригинал живёт на голом
 *     адресе;
 *   • обычная страница кабинета → не трогаем вовсе, там параметр — мусор.
 */
export function urlWithLanguage(lang, href) {
  try {
    const url = new URL(
      href ?? (typeof window === "undefined" ? "" : window.location.href),
    );
    const has = url.searchParams.has(LOCALE_PARAM);
    if (!has && !addressablePage) return null;

    const code = norm(lang);
    if (addressablePage?.original && code === addressablePage.original) {
      if (!has) return null;
      url.searchParams.delete(LOCALE_PARAM);
      return url.toString();
    }

    url.searchParams.set(LOCALE_PARAM, code);
    return url.toString();
  } catch {
    return null;
  }
}

