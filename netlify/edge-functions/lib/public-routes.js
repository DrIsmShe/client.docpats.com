// netlify/edge-functions/public-routes.js
//
// Корневые сегменты, которые обслуживает приложение.
//
// ЗАЧЕМ. Netlify отдаёт оболочку приложения со статусом 200 на ЛЮБОЙ
// адрес (`/* /index.html 200` в _redirects). Значит /zzz-nonexistent,
// /en и любая опечатка выглядели для поисковика полноценной страницей —
// «мягкий 404». Он тратит на такие адреса обход, считает их дублями и
// показывает в отчётах как проблему индексации.
//
// ПОЧЕМУ ТОЛЬКО ПЕРВЫЙ СЕГМЕНТ, А НЕ ВЕСЬ АДРЕС. Маршрутов в App.jsx
// шестьсот с лишним, и половина из них — вложенные страницы кабинета,
// которые меняются каждую неделю. Список полных адресов устареет на
// первой же правке, и цена ошибки здесь несимметрична: лишний 404 на
// живой странице страшнее лишнего 200 на несуществующей. Первый сегмент
// меняется редко — это зоны приложения, а не отдельные экраны.
//
// ЧТО С ОДНОСЕГМЕНТНЫМИ АДРЕСАМИ. `/<slug>` — это витрина клиники, и она
// проверяется запросом к публичному API раньше (см. seo.js). Сюда такой
// адрес доходит только если клиники с таким слагом нет.
//
// КАК НЕ ДАТЬ СПИСКУ УСТАРЕТЬ. scripts/check-public-routes.cjs сверяет
// его с App.jsx на каждой сборке: новая зона, не попавшая сюда, роняет
// сборку, а не отдаёт 404 живым посетителям.

export const ROOT_SEGMENTS = new Set([
  "about",
  "admin",
  "arena",
  "articles",
  "clinic",
  "clinics",
  "complete-registration",
  "conferences",
  "consultation",
  "demo",
  "diagnostics",
  "docs",
  "doctor",
  "dp",
  // Студия DP-Videra: обслуживается прокси на другой сервер
  // (см. public/_redirects), в App.jsx маршрута нет.
  "dp-videra",
  "education",
  // Встраиваемый плеер ролика — тоже прокси, не маршрут приложения.
  "embed",
  "login",
  "medical-codes",
  "news",
  "newsletter",
  "patient",
  "pay",
  "payment",
  "previsit",
  "pricing",
  "public",
  "radiology",
  "registration",
  "resetpassword",
  "terms-consent-page",
  "top-doctors",
  "user-synthesis",
  "videos",
  "webinar",
]);

/**
 * Файлы и служебные адреса, которые не являются страницами приложения.
 *
 * Их отдаёт статика или прокси, и решать за них судьбу мы не вправе: у
 * файла своя судьба — он либо есть, либо его нет, и статус ставит тот,
 * кто его отдаёт.
 */
export function служебныйАдрес(pathname) {
  return (
    /\.[a-z0-9]{2,5}$/i.test(pathname) || // файл с расширением
    pathname.startsWith("/static/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/locales/") ||
    pathname.startsWith("/docs/") || // markdown корпуса документации
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/.netlify/") ||
    pathname.startsWith("/cdn-cgi/")
  );
}

/*
 * Разделы витрины клиники. Совпадают со списком в config.path (seo.js):
 * шаблоном "/:slug/:section" их не описать — тот покрыл бы и
 * /patient/home-page, и /doctor/schedule, то есть весь кабинет.
 */
const РАЗДЕЛЫ_ВИТРИНЫ = new Set([
  "about",
  "departments",
  "doctors",
  "articles",
  "gallery",
  "reviews",
  "faq",
  "contacts",
  "services",
]);

/**
 * Похож ли адрес на вложенную страницу витрины клиники.
 *
 * Корень витрины — слаг клиники, а не зона приложения, поэтому отсечка по
 * первому сегменту принимала /<слаг>/about за опечатку и отвечала 404 на
 * странице, которую карта сайта объявляет публичной.
 *
 * Проверяем ФОРМУ адреса, а не существование клиники: запрос к API здесь
 * стоил бы задержки на каждом промахе, а ветка витрины ниже всё равно
 * спрашивает API и отвечает 404, если клиники с таким слагом нет.
 */
export function витринныйАдрес(pathname) {
  const части = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (части.length < 2) return false;
  // Зона приложения слагом клиники быть не может: /doctor/videos — кабинет.
  if (ROOT_SEGMENTS.has(части[0])) return false;
  // Слаг: то же, что допускает регулярка витрины в seo.js.
  if (!/^[a-z0-9-]+$/i.test(части[0])) return false;

  if (части[1] === "dp") return true; // страницы и статьи внутри витрины
  if (части.length === 2) return РАЗДЕЛЫ_ВИТРИНЫ.has(части[1]);
  if (части.length === 3)
    return части[1] === "doctors" || части[1] === "publications";
  return false;
}

/** Известен ли первый сегмент адреса приложению. */
export function знакомыйКорень(pathname) {
  const первый = pathname.replace(/^\/+/, "").split("/")[0];
  if (!первый) return true; // главная
  return ROOT_SEGMENTS.has(первый);
}
