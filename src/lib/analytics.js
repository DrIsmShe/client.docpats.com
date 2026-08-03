// client/src/lib/analytics.js
//
// Счётчик продуктовых событий: чем из построенного вообще пользуются.
//
// ЗАЧЕМ. В приложении около 560 маршрутов и 30 серверных модулей, и до сих
// пор не было способа ответить на вопрос «что из этого живое». Доменная
// аналитика (аналитика клиники, арены, отчёты аптеки) отвечает на вопросы
// ПОЛЬЗОВАТЕЛЕЙ внутри модуля и ничего не говорит о самом продукте.
//
// ПОЧЕМУ КОНФИГУРАЦИЯ ЗДЕСЬ НЕ СТАНДАРТНАЯ. Настройки любого счётчика по
// умолчанию рассчитаны на интернет-магазин, и для медицинского продукта они
// опасны. Три вещи выключены намеренно, и включать их нельзя:
//
//   1. autocapture — автоматический сбор кликов вместе с ТЕКСТОМ элемента.
//      В карточке пациента это отправило бы наружу его фамилию.
//   2. session recording — запись экрана. Это прямая утечка ПД пациента
//      в чужую систему.
//   3. сырой путь страницы — /clinic/patients/652f… содержит идентификатор
//      записи. Наружу уходит только ШАБЛОН пути: /clinic/patients/:id.
//
// Правило то же, что в серверном модуле аудита: наружу — только
// СТРУКТУРНОЕ (что за экран, какой модуль, сколько чего), никогда —
// содержательное (имена, диагнозы, тексты, адреса, телефоны).
//
// БЕЗ КЛЮЧА МОДУЛЬ НЕ ДЕЛАЕТ НИЧЕГО. Как isConfigured() на сервере: пока в
// сборке нет REACT_APP_POSTHOG_KEY, все функции — пустышки. Поэтому код
// безопасно живёт в проде до того, как заведён аккаунт.

let client = null;

/** Настроен ли счётчик. Без ключа весь модуль — no-op. */
export function isAnalyticsEnabled() {
  return Boolean(client);
}

// Идентификаторы в путях: ObjectId, UUID, длинные числа, слаги-хеши.
// Без нормализации каждый пациент давал бы «уникальную страницу», отчёт
// превращался бы в кашу, а сам идентификатор уходил бы наружу.
const ID_PATTERNS = [
  [/\/[a-f0-9]{24}(?=\/|$)/gi, "/:id"], // mongo ObjectId
  [/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, "/:uuid"],
  [/\/\d{4,}(?=\/|$)/g, "/:num"],
];

/** Шаблон пути вместо конкретного адреса: /clinic/patients/:id. */
export function pathTemplate(pathname) {
  let out = String(pathname || "/");
  for (const [re, to] of ID_PATTERNS) out = out.replace(re, to);
  return out;
}

// Всё, что похоже на адрес: абсолютный URL или путь от корня.
const URL_LIKE = /^(https?:\/\/|\/)/i;

/**
 * Обеззаразить любое значение-адрес: путь заменяется шаблоном, query и hash
 * отбрасываются целиком.
 *
 * ЗАЧЕМ ОТБРАСЫВАТЬ QUERY. В строке запроса оказывается то, что человек
 * ввёл: /dp/search-patient-polyclinic?q=Фамилия. Разбирать её по параметрам
 * бессмысленно — безопаснее выкинуть всю.
 */
export function urlTemplate(value) {
  const raw = String(value ?? "");
  if (!URL_LIKE.test(raw)) return raw; // "$direct", пустая строка и прочее — как есть
  try {
    const relative = raw.startsWith("/");
    // База нужна только чтобы разобрать относительный путь; наружу не идёт.
    const url = new URL(raw, relative ? "https://parse.invalid" : undefined);
    const path = pathTemplate(url.pathname);
    return relative ? path : url.origin + path;
  } catch {
    // Неразбираемый адрес: срезаем query/hash вручную, лучше грубо, чем никак.
    return pathTemplate(raw.split(/[?#]/)[0]);
  }
}

// Свойства, которые PostHog добавляет сам и которые нам не нужны ни для
// одного вопроса, зато потенциально везут содержательное.
const DROP_PROPS = new Set([
  // Заголовок вкладки. Сейчас он статический, но стоит какой-нибудь странице
  // начать писать в него имя пациента — и утечка появится молча.
  "title",
]);

/**
 * Обеззаразить плоский набор свойств: адреса — через шаблон, лишнее — прочь.
 * Вложенные объекты ($set, $set_once) обходятся на один уровень: глубже у
 * событий ничего не бывает, а бесконечная рекурсия по чужой структуре —
 * лишний риск.
 */
export function sanitizeOutgoing(props) {
  const out = {};
  for (const [key, value] of Object.entries(props ?? {})) {
    if (DROP_PROPS.has(key)) continue;
    if (typeof value === "string") {
      out[key] = urlTemplate(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = sanitizeOutgoing(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Единый фильтр исходящих событий. PostHog зовёт его для КАЖДОГО события,
 * включая служебные ($web_vitals, $pageleave, $feature_flag_called), — и это
 * принципиально: свой код кладёт шаблон пути только в собственные поля, а
 * SDK добавляет сверху $pathname, $session_entry_url,
 * $session_entry_pathname, $prev_pageview_pathname и полный $current_url.
 * Перечислять их поимённо нельзя — список меняется с версией библиотеки,
 * поэтому обеззараживается ВСЁ, что выглядит как адрес.
 *
 * ВОЗВРАЩАТЬ СОБЫТИЕ ОБЯЗАТЕЛЬНО. null здесь означает «выбросить событие», а
 * потеря служебного свойства token приводит к 401 на приёме — поэтому
 * фильтр только переписывает значения и никогда не удаляет ключи, кроме
 * явно перечисленных в DROP_PROPS.
 */
export function sanitizeEvent(event) {
  if (!event) return event;
  return {
    ...event,
    properties: sanitizeOutgoing(event.properties),
    ...(event.$set ? { $set: sanitizeOutgoing(event.$set) } : null),
    ...(event.$set_once ? { $set_once: sanitizeOutgoing(event.$set_once) } : null),
  };
}

// Свойства события. Пропускаем только скаляры и только короткие строки:
// длинная строка — почти наверняка чей-то текст, а не название экрана.
// Это грубый фильтр, и он намеренно грубый: цена ошибки здесь несимметрична.
const MAX_PROP_CHARS = 64;

function safeProps(props) {
  const out = {};
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null) continue;
    if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    } else if (typeof value === "string" && value.length <= MAX_PROP_CHARS) {
      out[key] = value;
    }
    // Объекты, массивы и длинные строки отбрасываются молча: в счётчике
    // событий им делать нечего, а разбираться, что там внутри, — не его дело.
  }
  return out;
}

/**
 * Инициализация. Вызывается один раз из index.js.
 * Хост задаётся отдельно: для медицинского продукта имеет значение, в какой
 * юрисдикции лежат данные (EU-хост у PostHog — eu.i.posthog.com).
 */
export async function initAnalytics() {
  const key = process.env.REACT_APP_POSTHOG_KEY;
  if (!key || client) return;

  try {
    const { default: posthog } = await import("posthog-js");
    posthog.init(key, {
      api_host: process.env.REACT_APP_POSTHOG_HOST || "https://eu.i.posthog.com",

      // ─── Всё, что ниже, — защита от утечки ПД. Не менять. ───
      autocapture: false, // иначе уедет текст элементов (фамилии пациентов)
      disable_session_recording: true, // запись экрана в медпродукте недопустима
      capture_pageview: false, // свой pageview с шаблоном пути, см. trackPageView
      capture_pageleave: false,
      mask_all_text: true,
      mask_all_element_attributes: true,

      // Последний рубеж: библиотека прикрепляет к каждому событию свои
      // свойства с сырым адресом страницы, и capture_pageview: false их не
      // выключает — $web_vitals уходит собственным потоком. Здесь через
      // шаблон пути прогоняется КАЖДОЕ строковое свойство любого события.
      // (sanitize_properties делал бы то же, но объявлен устаревшим и не
      // видит $set/$set_once.)
      before_send: sanitizeEvent,

      // Персональные профили только для вошедших: аноним не создаёт профиль.
      person_profiles: "identified_only",
    });
    client = posthog;
  } catch {
    // Счётчик не должен ронять приложение. Не загрузился — работаем без него.
    client = null;
  }
}

/**
 * Произвольное событие.
 * @param {string} name  имя в snake_case: "arena_attempt_started"
 * @param {object} [props] ТОЛЬКО структурные свойства (см. safeProps)
 */
export function track(name, props) {
  if (!client || !name) return;
  client.capture(name, safeProps(props));
}

/** Просмотр экрана. Путь нормализуется до шаблона. */
export function trackPageView(pathname) {
  if (!client) return;
  const template = pathTemplate(pathname);
  client.capture("$pageview", {
    $current_url: template,
    path_template: template,
    zone: zoneOf(template),
  });
}

// Зона приложения — крупная группировка поверх 560 маршрутов. Именно она
// отвечает на исходный вопрос «каким из модулей пользуются», тогда как
// отдельный маршрут слишком мелок, чтобы что-то показать.
export function zoneOf(template) {
  const p = String(template || "/");
  // ВНИМАНИЕ на порядок: /clinics/:slug — ПУБЛИЧНАЯ витрина клиники, а
  // /clinic/* — её рабочий кабинет. Это разные аудитории и разные вопросы
  // («приходят ли снаружи» против «работают ли внутри»), а по префиксу
  // /clinic витрина ловится первой. Проверка витрины обязана идти раньше.
  if (p.startsWith("/clinics")) return "public";
  if (p.startsWith("/clinic")) return "clinic";
  if (p.startsWith("/doctor")) return "doctor";
  if (p.startsWith("/patient")) return "patient";
  if (p.startsWith("/admin")) return "admin";
  if (p.startsWith("/radiology") || p.startsWith("/arena")) return "arena";
  if (p.startsWith("/diagnostics")) return "diagnostics";
  if (p.startsWith("/dp")) return "simulation";
  if (p.startsWith("/public") || p.startsWith("/clinics")) return "public";
  return "other";
}

/**
 * Связать события с пользователем. ТОЛЬКО идентификатор и роль — ни имени,
 * ни почты, ни телефона: то же правило, что у серверного аудита.
 */
export function identifyUser({ userId, role }) {
  if (!client || !userId) return;
  client.identify(String(userId), safeProps({ role }));
}

/** Выход: разорвать связь событий с человеком. */
export function resetAnalytics() {
  if (!client) return;
  client.reset();
}
