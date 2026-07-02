// client/src/pages/clinic/vitrina/lib/utils.js
//
// ВИТРИНА 2.0 — общие хелперы блоков. Вынесены из PublicClinicPage, чтобы
// каждый блок не таскал свою копию. Чистые функции (resolveUrl читает env).
//
// Stars-компонент НЕ здесь (этот файл без JSX) — он приедет в reviews-блок.

// Базовый URL API для резолва относительных медиа-ключей (R2/локальные пути).
const API_BASE = process.env.REACT_APP_API_URL || "";

// Поддерживаемые языки витрины (порядок = порядок кнопок переключателя).
export const LANGS = ["ru", "en", "tr", "az", "ar"];

// Языки с письмом справа-налево.
export const RTL_LANGS = ["ar"];

/**
 * Абсолютный URL картинки. Абсолютные (http/https) — как есть; относительные —
 * приклеиваются к API_BASE. Пусто → null.
 * @param {string|null|undefined} u
 * @returns {string|null}
 */
export function resolveUrl(u) {
  if (!u) return null;
  const s = String(u).trim();
  if (/^https?:\/\//.test(s)) return s;
  const base = API_BASE.replace(/\/+$/, "");
  return base ? `${base}/${s.replace(/^\/+/, "")}` : s;
}

/**
 * Инициалы из имени (до 2 букв, аплеркейс). Пусто → "?".
 * @param {string|null|undefined} name
 * @returns {string}
 */
export function initials(name) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

/**
 * Локализованная дата (длинный формат). Невалидно → "".
 * @param {string|Date|null|undefined} dateStr
 * @param {string} [lang="ru"]
 * @returns {string}
 */
export function formatDate(dateStr, lang) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(lang || "ru", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Телефон → tel:-href (без пробелов).
 * @param {string|null|undefined} phone
 * @returns {string|null}
 */
export function telHref(phone) {
  if (!phone) return null;
  return `tel:${String(phone).replace(/\s+/g, "")}`;
}

// ───────────────────────────────────────────────────────────────────────────
// ВИТРИНА: фон отдельного блока (config.bg + config.bgColor). Любой блок может
// переопределить фон своей секции. Возвращает { style, dark }:
//   style — CSS для корня блока (background + опц. color);
//   dark  — true, если фон тёмный/акцентный (для светлого текста; блоки могут
//           использовать как подсказку, но базово полагаемся на color в style).
// Значения config.bg:
//   undefined/"theme" — не трогаем (как в теме);
//   "surface"   — --v-surface (светлый);
//   "surfaceAlt"— --v-surface-alt (серый);
//   "accent"    — --v-primary (акцент, светлый текст);
//   "transparent" — прозрачный (просвечивает фон страницы);
//   "custom"    — config.bgColor (свой цвет).
// ───────────────────────────────────────────────────────────────────────────
export function blockBgStyle(config = {}) {
  const bg = config?.bg;
  if (!bg || bg === "theme") return { style: {}, dark: false, hasBg: false };
  if (bg === "surface")
    return {
      style: { background: "var(--v-surface)" },
      dark: false,
      hasBg: true,
    };
  if (bg === "surfaceAlt")
    return {
      style: { background: "var(--v-surface-alt)" },
      dark: false,
      hasBg: true,
    };
  if (bg === "transparent")
    return { style: { background: "transparent" }, dark: false, hasBg: true };
  if (bg === "accent") {
    return {
      style: { background: "var(--v-primary)", color: "var(--v-on-primary)" },
      dark: true,
      hasBg: true,
    };
  }
  if (bg === "custom") {
    const c = (config.bgColor || "").trim();
    if (!c) return { style: {}, dark: false, hasBg: false };
    return { style: { background: c }, dark: isDarkColor(c), hasBg: true };
  }
  return { style: {}, dark: false, hasBg: false };
}

/** Грубая оценка яркости hex-цвета (#rgb/#rrggbb) → тёмный ли. */
export function isDarkColor(hex) {
  if (typeof hex !== "string") return false;
  let h = hex.replace("#", "").trim();
  if (h.length === 3)
    h = h
      .split("")
      .map((x) => x + x)
      .join("");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // относительная яркость
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
}

// ───────────────────────────────────────────────────────────────────────────
// ВИТРИНА: многостраничность. Каждый «контентный» блок может открываться
// отдельной страницей /clinics/:slug/:section. Слаги — читаемые и стабильные
// (НЕ тип блока, чтобы URL были человеческими и не зависели от внутренних имён).
//
// Chrome-блоки (topbar/nav/hero/footer/cta/stats/whyUs) НЕ имеют своей страницы:
// они часть оболочки/лендинга. В меню попадают только блоки из SECTION_BY_TYPE.
// ───────────────────────────────────────────────────────────────────────────
export const SECTION_BY_TYPE = {
  whyUs: "about",
  bento: "departments",
  doctors: "doctors",
  publications: "articles",
  gallery: "gallery",
  reviews: "reviews",
  faq: "faq",
  contacts: "contacts",
  priceList: "services",
};

// обратный маппинг slug → тип блока
export const TYPE_BY_SECTION = Object.fromEntries(
  Object.entries(SECTION_BY_TYPE).map(([type, slug]) => [slug, type]),
);

/** Тип блока → slug секции (или null, если у блока нет своей страницы). */
export function sectionSlugForType(type) {
  return SECTION_BY_TYPE[type] || null;
}

/** slug секции → тип блока (или null, если slug неизвестен). */
export function typeForSectionSlug(slug) {
  return TYPE_BY_SECTION[slug] || null;
}

/**
 * Базовый путь витрины по текущему pathname.
 * /clinics/nizami/doctors → /clinics/nizami ; /clinics/nizami → /clinics/nizami
 */
export function clinicBasePath(pathname, slug) {
  if (!pathname || !slug) return pathname || "/";
  const i = pathname.indexOf(`/${slug}`);
  if (i === -1) return pathname;
  return pathname.slice(0, i + slug.length + 1);
}

// ───────────────────────────────────────────────────────────────────────────
// ВИТРИНА: «умная» ссылка для кнопок/CTA на странице раздела.
// Разбирает значение, введённое в редакторе, в { kind, href }:
//   ""            → null (нет ссылки)
//   "#contacts"   → { kind:"anchor",   href:"#contacts" }   (скролл по якорю)
//   "http(s)://…" → { kind:"external", href:… }             (новый таб)
//   "tel:" / "mailto:" → external (без таба)
//   "doctors"     → { kind:"internal", href:"<base>/doctors" } (раздел витрины)
//   "/foo"        → если "/foo" совпал со slug раздела → раздел витрины,
//                   иначе абсолютный internal-путь "/foo"
// base — базовый путь витрины (/clinics/:slug), нужен для разделов.
// ───────────────────────────────────────────────────────────────────────────
export function resolveVitrinaLink(raw, base) {
  const v = (raw || "").trim();
  if (!v) return null;

  if (v.startsWith("#")) return { kind: "anchor", href: v };
  if (/^(https?:)?\/\//i.test(v)) return { kind: "external", href: v };
  if (/^(tel:|mailto:)/i.test(v)) return { kind: "external", href: v };

  const b = base || "";

  // кастомная страница: "dp/promo" или "/dp/promo" → /clinics/:slug/dp/promo
  const dpMatch = v.match(/^\/?dp\/([a-z0-9-]+)$/i);
  if (dpMatch) {
    return { kind: "internal", href: `${b}/dp/${dpMatch[1].toLowerCase()}` };
  }

  // слово без слеша: "doctors" → раздел витрины, если такой slug известен
  if (!v.startsWith("/")) {
    if (typeForSectionSlug(v)) return { kind: "internal", href: `${b}/${v}` };
    // иначе считаем якорем-именем блока на текущей странице
    return { kind: "anchor", href: `#${v}` };
  }

  // путь со слешем: "/doctors" → если это раздел витрины, строим под base
  const seg = v.replace(/^\/+/, "").split("/")[0];
  if (typeForSectionSlug(seg)) return { kind: "internal", href: `${b}/${seg}` };

  // прочий абсолютный путь — отдаём как есть (internal SPA-навигация)
  return { kind: "internal", href: v };
}
