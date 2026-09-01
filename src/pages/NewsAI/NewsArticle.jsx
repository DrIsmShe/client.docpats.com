import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import FooterAI from "../../components/newsAI/footer/footer";
import ShareButtons from "../../components/share/ShareButtons";
import { useDropEdgeSeoTags } from "../../lib/useDropEdgeSeoTags";
import { Helmet } from "react-helmet-async";
/* ─────────────────────────────────────────────────────────────
   Specialty → accent colour map
───────────────────────────────────────────────────────────── */
const SPECIALTY_CONFIG = {
  oncology: { color: "#b83030", pale: "#f5eaea", rule: "#d4a0a0" },
  cardiology: { color: "#a93226", pale: "#fdf5f5", rule: "#c9a0a0" },
  neurology: { color: "#0e5c6b", pale: "#e5f1f4", rule: "#8abcca" },
  infectious: { color: "#b7290e", pale: "#fdf3f0", rule: "#d4a898" },
  surgery: { color: "#1a7a4a", pale: "#f0faf4", rule: "#8acaac" },
  endocrinology: { color: "#8a6a00", pale: "#faf4e0", rule: "#c4aa60" },
  pulmonology: { color: "#1a5276", pale: "#eaf2f8", rule: "#80aac4" },
  gastroenterology: { color: "#0e6655", pale: "#eafaf5", rule: "#7acab8" },
  general: { color: "#3a3830", pale: "#f8f7f4", rule: "#b8b4a8" },
};

/* Languages that use RTL layout */
const RTL_LOCALES = new Set(["ar"]);

// Языки, которые страница действительно умеет показывать. Нужен именно
// список, а не «любой код из адреса»: ?locale=zz иначе ушёл бы в запрос к
// API и в атрибут <html lang>, где ему делать нечего.
const SUPPORTED_LOCALES = new Set(["en", "ru", "az", "ar", "tr"]);

/** Язык из адреса — если он там есть и мы его поддерживаем. */
function localeFromUrl() {
  try {
    const code = new URLSearchParams(window.location.search).get("locale");
    return code && SUPPORTED_LOCALES.has(code) ? code : null;
  } catch {
    return null;
  }
}

/* ─── Reading progress bar ──────────────────────────────── */
function ReadingProgress({ color }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? (el.scrollTop / total) * 100 : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: "transparent",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color || "#3a3830",
          transition: "width 0.08s linear",
        }}
      />
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function NewsArticle() {
  const API_BASE = process.env.REACT_APP_NEWS_API || "http://localhost:5010";
  const { t, i18n } = useTranslation("NewsAiTranslate");
  const { slug } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [translating, setTranslating] = useState(false);
  // Язык берём СНАЧАЛА из адреса и только потом из localStorage.
  //
  // Раньше адрес не читался вовсе, хотя ?locale= в нём проставлялся при
  // переключении языка. Ссылка /news/<slug>?locale=az открывалась на
  // языке прошлого визита: поисковик и edge-функция считали страницу
  // азербайджанской (мета собирается по этому же параметру), а человек
  // видел английский текст. Пока таких адресов не было в sitemap, это
  // ломало только пересланные ссылки; с языковыми URL в индексе это стало
  // бы расхождением меты и содержимого.
  const [locale, setLocale] = useState(
    () => localeFromUrl() || localStorage.getItem("locale") || "en",
  );
  /* current locale + layout direction */

  const isRTL = RTL_LOCALES.has(locale);
  const dir = isRTL ? "rtl" : "ltr";
  const LOCALES = [
    { code: "en", label: "EN" },
    { code: "ru", label: "RU" },
    { code: "az", label: "AZ" },
    { code: "ar", label: "AR" },
    { code: "tr", label: "TR" },
  ];
  /* date locale map */
  const DATE_LOCALE_MAP = {
    ar: "ar-SA",
    tr: "tr-TR",
    az: "az-AZ",
    ru: "ru-RU",
    en: "en-GB",
  };

  /* ── load article ── */
  useEffect(() => {
    loadArticle();
  }, [slug]);

  // Язык из адреса дотягиваем и до интерфейса. Без этого текст статьи
  // азербайджанский, а подписи вокруг — с прошлого визита; и запомнить
  // выбор тоже надо, иначе переход на соседнюю страницу его теряет.
  useEffect(() => {
    const fromUrl = localeFromUrl();
    if (!fromUrl) return;
    localStorage.setItem("locale", fromUrl);
    document.cookie = `locale=${fromUrl};path=/;max-age=31536000`;
    if (i18n.language !== fromUrl) i18n.changeLanguage(fromUrl);
  }, [slug, i18n]);
  const changeLocale = (code) => {
    setLocale(code);
    localStorage.setItem("locale", code);
    i18n.changeLanguage(code);
    document.cookie = `locale=${code};path=/;max-age=31536000`;
    // Обновляем URL с locale параметром. Для английского — голый адрес:
    // он и есть английская версия, а ?locale=en был бы вторым адресом с
    // тем же содержимым и разошёлся бы с canonical.
    const newUrl =
      code === "en" ? `/news/${article.slug}` : `/news/${article.slug}?locale=${code}`;
    window.history.replaceState(null, "", newUrl);
  };
  /* ── auto-translate body ── */
  useEffect(() => {
    if (!article || locale === "en" || !article.content) return;
    const run = async () => {
      try {
        setTranslating(true);
        const res = await axios.post(
          `${API_BASE}/api/news/${article.slug}/translate-content`,
          { locale },
        );
        setTranslatedContent(res.data.translated);
      } catch (err) {
        console.error("Content translation failed:", err.message);
      } finally {
        setTranslating(false);
      }
    };
    run();
  }, [article, locale]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/api/news/${slug}?locale=${locale}`,
      );
      setArticle(res.data.data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Мета-теги здесь пишет Helmet, поэтому комплект от edge-функции надо
  // снять — иначе на странице два canonical и двенадцать hreflang.
  useDropEdgeSeoTags(Boolean(article));

  /* ── derived values ── */
  const spec = SPECIALTY_CONFIG[article?.specialty] || SPECIALTY_CONFIG.general;
  const typeLabel = article?.type
    ? t(`types.${article.type}`, { defaultValue: article.type })
    : t("types.news");

  const dateStr = article?.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(
        DATE_LOCALE_MAP[locale] || "en-GB",
        { day: "numeric", month: "long", year: "numeric" },
      )
    : null;

  const wordCount = article
    ? ((article.content || "") + " " + (article.aiSummaryShort || ""))
        .split(/\s+/)
        .filter(Boolean).length
    : 0;
  const readMin = Math.max(1, Math.round(wordCount / 200));

  const rawText = translatedContent || article?.content || "";
  const paragraphs = rawText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  /* ── icon helpers ── */
  const BackArrow = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      style={{ transform: isRTL ? "scaleX(-1)" : "none", flexShrink: 0 }}
    >
      <path
        d="M10 3L5 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const ExternalIcon = ({ size = 10, style = {} }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      style={{ transform: isRTL ? "scaleX(-1)" : "none", ...style }}
    >
      <path
        d="M2 10L10 2M10 2H5M10 2v5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  /* ════════════════════════════════════════════════════════════
     LOADING
  ════════════════════════════════════════════════════════════ */
  if (loading)
    return (
      <>
        <style>{CSS}</style>
        <div className="dp-page" dir={dir}>
          <div className="dp-state">
            <div className="dp-spinner" />
            <p className="dp-state-text">{t("states.loading")}</p>
          </div>
        </div>
      </>
    );

  /* ════════════════════════════════════════════════════════════
     NOT FOUND
  ════════════════════════════════════════════════════════════ */
  if (error || !article)
    return (
      <>
        <style>{CSS}</style>
        <div className="dp-page" dir={dir}>
          <div className="dp-state">
            <div className="dp-404">404</div>
            <p className="dp-state-text">{t("states.notFound")}</p>
            <button className="dp-back-btn" onClick={() => navigate(-1)}>
              {t("states.back")}
            </button>
          </div>
        </div>
      </>
    );

  /* ── Языковые адреса одной и той же новости ──────────────────
     Английский живёт на голом адресе, остальные — на ?locale=xx.
     Отдельного ?locale=en нет намеренно: он был бы вторым адресом с тем
     же содержимым, то есть дублем, который поисковику пришлось бы
     склеивать.

     canonical у каждой версии свой. Это существенно: если бы все пять
     указывали на голый адрес, Google оставил бы в индексе только его, а
     переводы выбросил — canonical сильнее hreflang, и вся языковая
     разметка оказалась бы бесполезной. */
  const newsBaseUrl = `https://docpats.com/news/${article.slug}`;
  const localeUrl = (code) =>
    code === "en" ? newsBaseUrl : `${newsBaseUrl}?locale=${code}`;
  const pageUrl = localeUrl(locale);
  const description = article.aiSummaryShort || article.summary || "";

  return (
    <>
      <style>{CSS}</style>
      <ReadingProgress color={spec.color} />
      <Helmet>
        <title>{article.title} | DocPats</title>
        <meta
          name="description"
          content={article.aiSummaryShort || article.summary || ""}
        />
        <link rel="canonical" href={pageUrl} />
        {/* hreflang: связывает языковые версии между собой. Указывать
            обязательно НА РАЗНЫЕ адреса — пять ссылок на один URL, как
            было в sitemap, не значат ничего. */}
        <link rel="alternate" hrefLang="x-default" href={newsBaseUrl} />
        <link rel="alternate" hrefLang="en" href={localeUrl("en")} />
        <link rel="alternate" hrefLang="ru" href={localeUrl("ru")} />
        <link rel="alternate" hrefLang="az" href={localeUrl("az")} />
        <link rel="alternate" hrefLang="tr" href={localeUrl("tr")} />
        <link rel="alternate" hrefLang="ar" href={localeUrl("ar")} />
        <html lang={locale} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.title} />
        <meta
          property="og:description"
          content={article.aiSummaryShort || article.summary || ""}
        />
        <meta
          property="og:url"
          content={pageUrl}
        />
        <meta
          property="og:image"
          content={article.imageUrl || "https://docpats.com/og-default.jpg"}
        />
        <meta property="og:locale" content={locale} />
        <meta property="article:published_time" content={article.publishedAt} />
        <meta property="article:section" content={article.specialty || ""} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta
          name="twitter:description"
          content={article.aiSummaryShort || article.summary || ""}
        />
        <meta
          name="twitter:image"
          content={article.imageUrl || "https://docpats.com/og-default.jpg"}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: article.title,
            description: article.aiSummaryShort || article.summary || "",
            url: pageUrl,
            datePublished: article.publishedAt,
            image: article.imageUrl || "https://docpats.com/og-default.jpg",
            publisher: {
              "@type": "Organization",
              name: "DocPats",
              url: "https://docpats.com",
            },
            inLanguage: locale,
          })}
        </script>
      </Helmet>
      <div className="dp-page" dir={dir}>
        {/* TOP BAR */}
        <div className="dp-topbar">
          <span className="dp-topbar-left">{t("brand")}</span>

          <span className="dp-topbar-date">{dateStr || ""}</span>
        </div>

        {/* NAV */}
        <nav className="dp-nav">
          <button
            className="dp-nav-back"
            onClick={() =>
              window.history.length > 1
                ? navigate(-1)
                : navigate("/news")
            }
          >
            <BackArrow />
            {t("nav.back")}
          </button>

          <Link to="/" className="dp-nav-logo">
            Doc<span>Pats</span>
          </Link>

          {article.canonicalUrl && (
            <a
              className="dp-nav-source"
              href={article.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("nav.source")}
              <ExternalIcon style={{ marginInlineStart: 4 }} />
            </a>
          )}
        </nav>

        {/* ARTICLE */}
        <article className="dp-article">
          {/* ── HEADER ── */}
          <header className="dp-header">
            <div className="dp-header-inner">
              {/* Specialties row */}
              <div className="dp-meta-row">
                <span className="dp-type-label" style={{ color: spec.color }}>
                  {typeLabel}
                </span>
                {article.specialty && (
                  <>
                    <span className="dp-sep">/</span>
                    <span
                      className="dp-spec-label"
                      style={{ color: spec.color }}
                    >
                      {article.specialty}
                    </span>
                  </>
                )}
                {article.specialties
                  ?.filter((s) => s !== article.specialty)
                  .map((sp) => (
                    <span key={sp} className="dp-spec-tag">
                      {sp}
                    </span>
                  ))}
              </div>

              {/* Headline */}
              <h1 className="dp-headline">{article.title}</h1>
              <div
                className="nl-locale-switcher"
                style={{
                  display: "flex",
                  width: "650px",
                  border: "1px",
                  borderRadius: "5%",
                  paddingRight: "10px",
                  paddingLeft: "10px",
                  paddingTop: "5px",
                  paddingBottom: "3px",
                  marginBottom: "20px",
                }}
              >
                <h4>{t("translateArticles")}:</h4>
                {LOCALES.map((l) => (
                  <button
                    key={l.code}
                    className={`nl-locale-btn${locale === l.code ? " active" : ""}`}
                    onClick={() => changeLocale(l.code)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              {/* Accent rule */}
              <div className="dp-rule" style={{ background: spec.color }} />

              {/* Deck */}
              {(article.aiSummaryShort || article.summary) && (
                <p className="dp-deck">
                  {article.aiSummaryShort || article.summary}
                </p>
              )}

              {/* Byline */}
              <div className="dp-byline">
                <div className="dp-byline-left">
                  {article.sourceName && (
                    <span className="dp-source" style={{ color: spec.color }}>
                      {article.sourceName}
                    </span>
                  )}
                  {dateStr && (
                    <>
                      <span className="dp-dot">·</span>
                      <time className="dp-date">{dateStr}</time>
                    </>
                  )}
                  <span className="dp-dot">·</span>
                  <span className="dp-readtime">
                    {readMin} {t("meta.readMin")}
                  </span>
                </div>
                {article.canonicalUrl && (
                  <a
                    className="dp-original-link"
                    href={article.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: spec.color, borderColor: spec.rule }}
                  >
                    {t("byline.readOriginal")}
                  </a>
                )}
              </div>

              {/* Hero image убран: статьи выводятся без изображений */}
            </div>
          </header>

          {/* ── BODY ── */}
          <div className="dp-body">
            <div className="dp-body-inner">
              {translating && (
                <div className="dp-translating">
                  <div className="dp-translating-spinner" />
                  {t("body.translating")}
                </div>
              )}

              {!translating && paragraphs.length > 0
                ? paragraphs.map((para, i) => {
                    const isHeading =
                      para.length < 80 &&
                      !para.endsWith(".") &&
                      !para.endsWith(",") &&
                      i > 0;
                    if (isHeading) {
                      return (
                        <h2
                          key={i}
                          className="dp-subhead"
                          style={{ borderTopColor: spec.rule }}
                        >
                          {para}
                        </h2>
                      );
                    }
                    return (
                      <p
                        key={i}
                        className={`dp-para${i === 0 ? " dp-para--lead" : ""}`}
                      >
                        {para}
                      </p>
                    );
                  })
                : !translating && (
                    <div className="dp-no-content">
                      <p className="dp-no-content-msg">{t("body.noContent")}</p>
                      {article.canonicalUrl && (
                        <a
                          href={article.canonicalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dp-source-link"
                          style={{
                            color: spec.color,
                            borderBottomColor: spec.color,
                          }}
                        >
                          {t("body.readFullAt")}{" "}
                          {article.sourceName || t("body.defaultSource")} →
                        </a>
                      )}
                    </div>
                  )}
            </div>
          </div>

          {/* ── ПОДЕЛИТЬСЯ ──
              Ставится ДО блока источника и ВНЕ его условия: тот блок
              рисуется только при наличии article.canonicalUrl (ссылки на
              первоисточник), и кнопки, вложенные в него, пропадали бы у
              части материалов без всякой причины.
              Отдаём pageUrl — адрес текущей языковой версии, чтобы коллега
              открыл ровно то, что читает отправитель, а не английский
              вариант вместо азербайджанского. */}
          <ShareButtons
            url={pageUrl}
            title={article.title}
            accent={spec.color}
          />

          {/* ── FOOTER ── */}
          {article.canonicalUrl && (
            <footer className="dp-footer">
              <div className="dp-footer-inner">
                <div
                  className="dp-footer-rule"
                  style={{ background: spec.color }}
                />
                <div className="dp-footer-grid">
                  <div className="dp-footer-left">
                    {article.sourceName && (
                      <p className="dp-footer-pub">
                        {t("footer.publishedIn")}{" "}
                        <strong style={{ color: spec.color }}>
                          {article.sourceName}
                        </strong>
                        {dateStr && <> · {dateStr}</>}
                      </p>
                    )}
                    <p className="dp-footer-note">{t("footer.disclaimer")}</p>
                  </div>
                  <a
                    href={article.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dp-footer-btn"
                    style={{ borderColor: spec.color, color: spec.color }}
                  >
                    {t("footer.readOriginal")}
                    <ExternalIcon size={11} style={{ marginInlineStart: 6 }} />
                  </a>
                </div>
                {/* Фирменной строки здесь больше нет: сразу под этим
                    блоком идёт подвал редакции, тоже с именем DocPats.
                    Два фирменных блока подряд — не подпись, а шум. */}
              </div>
            </footer>
          )}
          <FooterAI />
        </article>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CSS — DocPats Newspaper Theme
   LTR fonts: Playfair Display + IBM Plex Mono + IBM Plex Sans
   RTL font:  Noto Naskh Arabic (Arabic only)
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');

/* ── scoped box-sizing reset ── */
.dp-page *, .dp-page *::before, .dp-page *::after { box-sizing: border-box; }

/* ── RTL font overrides ── */
.dp-page[dir="rtl"] {
  --serif: 'Noto Naskh Arabic', Georgia, serif;
  --sans:  'Noto Naskh Arabic', -apple-system, sans-serif;
}

/* ─────────────────────────────────────
   BASE
───────────────────────────────────── */
.dp-page {
  --paper:  #f7f4ee;
  --paper2: #ede9e0;
  --ink:    #1c1a16;
  --ink2:   #3a3830;
  --muted:  #7a7668;
  --rule:   #cdc9bc;
  --serif:  'Playfair Display', Georgia, 'Times New Roman', serif;
  --mono:   'IBM Plex Mono', 'Courier New', monospace;
  --sans:   'IBM Plex Sans', -apple-system, sans-serif;
  background: var(--paper);
  min-height: 100vh;
  color: var(--ink);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
}

/* ── TOP BAR ── */

.nl-locale-btn{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgb(3 3 3);background:none;border:1px solid transparent;border-radius:6px;padding:4px 8px;cursor:pointer;transition:all .12s}
.nl-locale-btn:hover{color:rgba(64, 67, 233, 0.85);border-color:rgba(199, 222, 230, 0.2)}
.nl-locale-btn.active{color:rgba(14, 3, 3, 0.3);border-color:rgba(14, 3, 3, 0.3);background:rgba(123, 192, 212, 0.1)}

.dp-topbar {
  background: var(--ink); color: #7a7668;
  padding: 0 40px; height: 32px;
  display: flex; align-items: center; justify-content: space-between;
  font-family: var(--mono); font-size: 10px;
  letter-spacing: .12em; text-transform: uppercase;
  overflow: hidden; box-sizing: border-box; width: 100%;
}
.dp-page[dir="rtl"] .dp-topbar { letter-spacing: 0; }
.dp-topbar-left { color: #6a6660; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dp-topbar-date { color: #5a5a52; white-space: nowrap; flex-shrink: 0; }

/* ── NAV ── */
.dp-nav {
  position: sticky; top: 0; z-index: 200;
  background: var(--paper);
  border-bottom: 3px double var(--ink);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 40px; height: 52px; gap: 16px;
  box-sizing: border-box; width: 100%; overflow: hidden;
}
.dp-nav-back {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font-family: var(--mono); font-size: 10px;
  letter-spacing: .1em; text-transform: uppercase;
  color: var(--muted); padding: 0; transition: color .15s; white-space: nowrap;
}
.dp-page[dir="rtl"] .dp-nav-back { letter-spacing: 0; }
.dp-nav-back:hover { color: var(--ink); }
.dp-nav-logo {
  /* always Latin — never switch to Arabic font */
  font-family: 'Playfair Display', Georgia, serif !important;
  font-size: 26px; font-weight: 900;
  letter-spacing: -.02em; color: var(--ink); text-decoration: none; line-height: 1;
}
.dp-nav-logo span { color: #b83030; }
.dp-nav-source {
  display: flex; align-items: center;
  font-family: var(--mono); font-size: 10px;
  letter-spacing: .1em; text-transform: uppercase;
  color: var(--muted); text-decoration: none;
  padding: 5px 12px; border: 1px solid var(--rule);
  transition: all .15s; white-space: nowrap;
}
.dp-page[dir="rtl"] .dp-nav-source { letter-spacing: 0; }
.dp-nav-source:hover { color: var(--ink); border-color: var(--ink); }

/* ── HEADER ── */
.dp-header {
  background: var(--paper2); border-bottom: 2px solid var(--ink);
  padding: 52px 0 0; width: 100%; box-sizing: border-box; overflow: hidden;
}
.dp-header-inner {
  max-width: 780px; margin: 0 auto;
  padding: 0 40px 44px; box-sizing: border-box; width: 100%;
}

/* ── META ROW ── */
.dp-meta-row {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--mono); font-size: 10px;
  letter-spacing: .14em; text-transform: uppercase;
  margin-bottom: 22px;
  overflow-x: auto; overflow-y: hidden; scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  flex-wrap: nowrap; width: 100%; max-width: 100%;
  -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
  mask-image: linear-gradient(to right, black 85%, transparent 100%);
}
.dp-page[dir="rtl"] .dp-meta-row {
  letter-spacing: 0;
  -webkit-mask-image: linear-gradient(to left, black 85%, transparent 100%);
  mask-image: linear-gradient(to left, black 85%, transparent 100%);
}
.dp-meta-row::-webkit-scrollbar { display: none; }
.dp-sep { color: var(--rule); font-weight: 300; }
.dp-type-label { font-weight: 500; white-space: nowrap; }
.dp-spec-label { font-weight: 400; white-space: nowrap; }
.dp-spec-tag {
  background: var(--paper); border: 1px solid var(--rule);
  padding: 2px 8px; border-radius: 2px;
  font-family: var(--mono); font-size: 9px;
  color: var(--muted); letter-spacing: .08em; white-space: nowrap; flex-shrink: 0;
}
.dp-page[dir="rtl"] .dp-spec-tag { letter-spacing: 0; }

/* ── HEADLINE ── */
.dp-headline {
  font-family: var(--serif);
  font-size: clamp(28px, 4vw, 48px);
  font-weight: 700; line-height: 1.12; letter-spacing: -.025em;
  color: var(--ink); margin: 0 0 24px;
}
.dp-page[dir="rtl"] .dp-headline { letter-spacing: 0; line-height: 1.3; }

.dp-rule { height: 4px; width: 64px; margin-bottom: 22px; }
.dp-page[dir="rtl"] .dp-rule { margin-inline-start: 0; }

/* ── DECK ── */
.dp-deck {
  font-family: var(--serif); font-size: 19px; font-weight: 400;
  font-style: italic; line-height: 1.65; color: var(--ink2);
  margin: 0 0 28px; letter-spacing: -.005em;
}
.dp-page[dir="rtl"] .dp-deck { font-style: normal; letter-spacing: 0; line-height: 1.9; }

/* ── BYLINE ── */
.dp-byline {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 10px;
  padding-top: 16px; border-top: 1px solid var(--rule); margin-bottom: 28px;
}
.dp-byline-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dp-source { font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: .06em; }
.dp-page[dir="rtl"] .dp-source { letter-spacing: 0; font-family: var(--sans); }
.dp-dot { color: var(--rule); }
.dp-date { font-family: var(--mono); font-size: 11px; color: var(--muted); }
.dp-readtime { font-family: var(--mono); font-size: 10px; color: var(--muted); letter-spacing: .06em; }
.dp-page[dir="rtl"] .dp-readtime { letter-spacing: 0; font-family: var(--sans); }
.dp-original-link {
  font-family: var(--mono); font-size: 10px; font-weight: 500;
  letter-spacing: .08em; text-transform: uppercase;
  text-decoration: none; padding: 5px 12px; border: 1px solid;
  transition: all .15s; white-space: nowrap;
}
.dp-page[dir="rtl"] .dp-original-link { letter-spacing: 0; font-family: var(--sans); }
.dp-original-link:hover { background: var(--paper); }

/* ── HERO IMAGE ── */
.dp-hero-img-wrap { width: 100%; border: 1px solid var(--rule); overflow: hidden; }
.dp-hero-img { width: 100%; display: block; transition: transform .4s ease; }
.dp-hero-img:hover { transform: scale(1.02); }

/* ─────────────────────────────────────
   BODY
───────────────────────────────────── */
.dp-body { padding: 0; width: 100%; overflow: hidden; }
.dp-body-inner {
  max-width: 680px; margin: 0 auto;
  padding: 52px 40px 64px; box-sizing: border-box; width: 100%;
}

.dp-translating {
  display: flex; align-items: center; gap: 12px; padding: 24px 0 40px;
  font-family: var(--serif); font-size: 16px; color: var(--muted); font-style: italic;
}
.dp-page[dir="rtl"] .dp-translating { font-style: normal; font-family: var(--sans); }
.dp-translating-spinner {
  width: 18px; height: 18px; flex-shrink: 0;
  border: 2px solid var(--rule); border-top-color: var(--ink);
  border-radius: 50%; animation: dp-spin .7s linear infinite;
}

.dp-para {
  font-family: var(--sans); font-size: 17px; font-weight: 300;
  line-height: 1.85; color: var(--ink2); margin: 0 0 1.6em; letter-spacing: .005em;
}
.dp-page[dir="rtl"] .dp-para { letter-spacing: 0; line-height: 2.1; font-weight: 400; }

.dp-para--lead {
  font-family: var(--serif); font-size: 19px; font-weight: 400;
  line-height: 1.75; color: var(--ink);
}
.dp-page[dir="rtl"] .dp-para--lead { line-height: 2.1; font-family: var(--sans); }

/* Drop-cap: LTR only */
.dp-page[dir="ltr"] .dp-para--lead::first-letter {
  font-family: var(--serif); font-size: 84px; font-weight: 900;
  float: left; line-height: .78; margin: 8px 12px -4px 0; color: var(--ink);
}

.dp-subhead {
  font-family: var(--serif); font-size: 22px; font-weight: 700;
  line-height: 1.3; letter-spacing: -.015em; color: var(--ink);
  margin: 2.8em 0 .9em; padding-top: 1em; border-top: 1px solid;
}
.dp-page[dir="rtl"] .dp-subhead { letter-spacing: 0; line-height: 1.6; }

.dp-no-content { padding: 72px 0; text-align: center; }
.dp-no-content-msg {
  font-family: var(--serif); font-size: 18px;
  font-style: italic; color: var(--muted); margin-bottom: 20px;
}
.dp-page[dir="rtl"] .dp-no-content-msg { font-style: normal; font-family: var(--sans); }
.dp-source-link {
  font-family: var(--mono); font-size: 12px; font-weight: 500;
  letter-spacing: .08em; text-transform: uppercase;
  text-decoration: none; border-bottom: 1px solid; padding-bottom: 2px; transition: opacity .15s;
}
.dp-page[dir="rtl"] .dp-source-link { letter-spacing: 0; font-family: var(--sans); }
.dp-source-link:hover { opacity: .7; }

/* ─────────────────────────────────────
   FOOTER
───────────────────────────────────── */
.dp-footer { border-top: 2px solid var(--ink); background: var(--paper2); width: 100%; overflow: hidden; }
.dp-footer-inner { max-width: 780px; margin: 0 auto; padding: 0 40px 28px; box-sizing: border-box; width: 100%; }
.dp-footer-rule { height: 4px; width: 64px; margin-bottom: 32px; }
.dp-footer-grid {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 28px; flex-wrap: wrap; padding-bottom: 4px;
}
.dp-footer-left { flex: 1; min-width: 200px; }
.dp-footer-pub { font-family: var(--sans); font-size: 14px; color: var(--ink2); margin-bottom: 8px; }
.dp-footer-note {
  font-family: var(--sans); font-size: 12px; font-weight: 300;
  color: var(--muted); line-height: 1.65; max-width: 400px;
}
.dp-page[dir="rtl"] .dp-footer-note { font-weight: 400; line-height: 1.95; }
.dp-footer-btn {
  display: inline-flex; align-items: center; white-space: nowrap;
  font-family: var(--mono); font-size: 10px; font-weight: 500;
  letter-spacing: .12em; text-transform: uppercase;
  padding: 11px 20px; border: 1.5px solid;
  text-decoration: none; background: var(--paper); transition: all .15s;
}
.dp-page[dir="rtl"] .dp-footer-btn { letter-spacing: 0; font-family: var(--sans); }
.dp-footer-btn:hover { background: white; }
.dp-page[dir="rtl"] 
/* ─────────────────────────────────────
   STATE SCREENS
───────────────────────────────────── */
.dp-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 100vh; gap: 16px; text-align: center; padding: 0 24px;
}
.dp-spinner {
  width: 32px; height: 32px;
  border: 2px solid var(--rule); border-top-color: var(--ink);
  border-radius: 50%; animation: dp-spin .7s linear infinite;
}
@keyframes dp-spin { to { transform: rotate(360deg); } }
.dp-state-text { font-family: var(--serif); font-size: 17px; font-style: italic; color: var(--muted); }
.dp-page[dir="rtl"] .dp-state-text { font-style: normal; font-family: var(--sans); }
.dp-404 {
  font-family: 'Playfair Display', Georgia, serif !important;
  font-size: 96px; font-weight: 900; color: var(--rule); line-height: 1;
}
.dp-back-btn {
  font-family: var(--mono); font-size: 11px; font-weight: 500;
  letter-spacing: .1em; text-transform: uppercase;
  color: var(--ink); background: none; border: 1.5px solid var(--ink);
  padding: 9px 20px; cursor: pointer; transition: background .15s; margin-top: 8px;
}
.dp-page[dir="rtl"] .dp-back-btn { letter-spacing: 0; font-family: var(--sans); }
.dp-back-btn:hover { background: var(--paper2); }

/* ══════════════════════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════════════════════ */

/* 2xl */
@media (min-width: 1280px) {
  .dp-header-inner { max-width: 860px; }
  .dp-body-inner   { max-width: 720px; }
  .dp-footer-inner { max-width: 860px; }
}

/* xl */
@media (max-width: 1279px) and (min-width: 1024px) {
  .dp-header-inner { max-width: 720px; padding: 0 32px 40px; }
  .dp-body-inner   { max-width: 640px; padding: 44px 32px 56px; }
  .dp-footer-inner { max-width: 720px; padding: 0 32px 44px; }
  .dp-headline     { font-size: clamp(26px, 3vw, 42px); }
}

/* lg: tablets portrait */
@media (max-width: 1023px) and (min-width: 768px) {
  .dp-topbar { padding: 0 24px; font-size: 9px; }
  .dp-nav { padding: 0 24px; height: 50px; }
  .dp-nav-logo { font-size: 22px; }
  .dp-header { padding-top: 40px; }
  .dp-header-inner { max-width: 100%; padding: 0 24px 36px; }
  .dp-headline { font-size: clamp(24px, 3.5vw, 36px); }
  .dp-deck { font-size: 17px; }
  .dp-body-inner { max-width: 100%; padding: 40px 24px 52px; }
  .dp-para { font-size: 16px; line-height: 1.8; }
  .dp-para--lead { font-size: 18px; }
  .dp-page[dir="ltr"] .dp-para--lead::first-letter { font-size: 72px; }
  .dp-subhead { font-size: 20px; }
  .dp-footer-inner { max-width: 100%; padding: 0 24px 40px; }
}

/* md: phablets */
@media (max-width: 767px) and (min-width: 640px) {
  .dp-topbar { padding: 0 20px; }
  .dp-topbar-date { display: none; }
  .dp-nav { padding: 0 20px; height: 48px; }
  .dp-nav-logo { font-size: 20px; }
  .dp-nav-source { font-size: 9px; padding: 4px 10px; }
  .dp-header { padding-top: 32px; }
  .dp-header-inner { padding: 0 20px 30px; }
  .dp-headline { font-size: clamp(22px, 4.5vw, 30px); }
  .dp-deck { font-size: 16px; }
  .dp-rule { width: 48px; }
  .dp-byline { flex-direction: column; align-items: flex-start; gap: 10px; }
  .dp-original-link { align-self: flex-start; }
  .dp-body-inner { padding: 36px 20px 48px; }
  .dp-para { font-size: 16px; line-height: 1.8; margin-bottom: 1.4em; }
  .dp-para--lead { font-size: 17px; }
  .dp-page[dir="ltr"] .dp-para--lead::first-letter { font-size: 64px; margin: 6px 10px -4px 0; }
  .dp-subhead { font-size: 19px; margin: 2.2em 0 .8em; }
  .dp-footer-inner { padding: 0 20px 36px; }
  .dp-footer-grid { flex-direction: column; gap: 20px; }
  }

/* sm: large phones */
@media (max-width: 639px) and (min-width: 480px) {
  .dp-topbar { display: none; }
  .dp-nav { padding: 0 18px; height: 46px; }
  .dp-nav-logo { font-size: 20px; }
  .dp-nav-source { font-size: 0; padding: 6px 8px; border: none; }
  .dp-nav-source svg { width: 14px; height: 14px; margin: 0; }
  .dp-header { padding-top: 28px; }
  .dp-header-inner { padding: 0 18px 28px; }
  .dp-headline { font-size: clamp(20px, 5.5vw, 28px); margin-bottom: 18px; }
  .dp-deck { font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
  .dp-rule { width: 40px; height: 3px; margin-bottom: 16px; }
  .dp-spec-tag { display: none; }
  .dp-byline { flex-direction: column; align-items: flex-start; gap: 10px; margin-bottom: 20px; }
  .dp-byline-left { gap: 6px; }
  .dp-source { font-size: 10px; }
  .dp-date { font-size: 10px; }
  .dp-readtime { font-size: 9px; }
  .dp-original-link { font-size: 9px; padding: 5px 10px; }
  .dp-body-inner { padding: 28px 18px 44px; }
  .dp-para { font-size: 15.5px; line-height: 1.78; margin-bottom: 1.4em; }
  .dp-para--lead { font-size: 16px; }
  .dp-page[dir="ltr"] .dp-para--lead::first-letter { font-size: 56px; line-height: .82; margin: 5px 9px -2px 0; }
  .dp-subhead { font-size: 18px; margin: 2em 0 .75em; padding-top: .85em; }
  .dp-no-content { padding: 48px 0; }
  .dp-no-content-msg { font-size: 16px; }
  .dp-footer-inner { padding: 0 18px 32px; }
  .dp-footer-rule { width: 40px; height: 3px; margin-bottom: 24px; }
  .dp-footer-grid { flex-direction: column; gap: 16px; }
  .dp-footer-pub { font-size: 13px; }
  .dp-footer-note { font-size: 11px; }
  .dp-footer-btn { font-size: 9px; padding: 9px 16px; }
        .dp-404 { font-size: 72px; }
  .dp-state-text { font-size: 15px; }
}

/* xs: small phones */
@media (max-width: 479px) {
  .dp-topbar { display: none; }
  .dp-nav { padding: 0 14px; height: 44px; gap: 8px; }
  .dp-nav-back { font-size: 9px; letter-spacing: .08em; gap: 4px; }
  .dp-page[dir="rtl"] .dp-nav-back { letter-spacing: 0; }
  .dp-nav-logo { font-size: 18px; }
  .dp-nav-source { font-size: 0; padding: 6px 6px; border: none; opacity: .6; }
  .dp-nav-source svg { width: 13px; height: 13px; margin: 0; }
  .dp-header { padding-top: 22px; }
  .dp-header-inner { padding: 0 14px 24px; }
  .dp-headline { font-size: clamp(19px, 6.5vw, 24px); letter-spacing: -.02em; margin-bottom: 14px; line-height: 1.15; }
  .dp-page[dir="rtl"] .dp-headline { letter-spacing: 0; line-height: 1.4; }
  .dp-deck { font-size: 14.5px; line-height: 1.58; margin-bottom: 16px; }
  .dp-page[dir="rtl"] .dp-deck { line-height: 1.9; }
  .dp-rule { width: 32px; height: 3px; margin-bottom: 14px; }
  .dp-meta-row { flex-wrap: wrap; gap: 4px; font-size: 8.5px; letter-spacing: .1em; }
  .dp-page[dir="rtl"] .dp-meta-row { letter-spacing: 0; }
  .dp-sep { display: none; }
  .dp-spec-tag { display: none; }
  .dp-byline { flex-direction: column; align-items: flex-start; gap: 8px; margin-bottom: 16px; padding-top: 12px; }
  .dp-byline-left { gap: 5px; flex-wrap: wrap; }
  .dp-source { font-size: 9.5px; }
  .dp-date { font-size: 9.5px; }
  .dp-dot { font-size: 9px; }
  .dp-readtime { font-size: 8.5px; }
  .dp-original-link { font-size: 8.5px; padding: 5px 9px; letter-spacing: .07em; }
  .dp-page[dir="rtl"] .dp-original-link { letter-spacing: 0; }
  .dp-body-inner { padding: 24px 14px 40px; }
  .dp-para { font-size: 15px; line-height: 1.75; margin-bottom: 1.3em; letter-spacing: 0; }
  .dp-page[dir="rtl"] .dp-para { line-height: 2.1; }
  .dp-para--lead { font-size: 15.5px; line-height: 1.72; }
  .dp-page[dir="rtl"] .dp-para--lead { line-height: 2.1; }
  .dp-page[dir="ltr"] .dp-para--lead::first-letter { font-size: 48px; line-height: .84; margin: 4px 8px -2px 0; }
  .dp-subhead { font-size: 16.5px; letter-spacing: -.01em; margin: 1.8em 0 .7em; padding-top: .75em; }
  .dp-page[dir="rtl"] .dp-subhead { letter-spacing: 0; }
  .dp-translating { font-size: 14px; padding: 18px 0 30px; }
  .dp-no-content { padding: 40px 0; }
  .dp-no-content-msg { font-size: 15px; }
  .dp-source-link { font-size: 10px; letter-spacing: .06em; }
  .dp-page[dir="rtl"] .dp-source-link { letter-spacing: 0; }
  .dp-footer-inner { padding: 0 14px 28px; }
  .dp-footer-rule { width: 32px; height: 3px; margin-bottom: 20px; }
  .dp-footer-grid { flex-direction: column; gap: 14px; padding-bottom: 20px; }
  .dp-footer-pub { font-size: 12px; margin-bottom: 6px; }
  .dp-footer-note { font-size: 10.5px; line-height: 1.55; }
  .dp-page[dir="rtl"] .dp-footer-note { line-height: 1.95; }
  .dp-footer-btn { font-size: 8.5px; padding: 8px 14px; letter-spacing: .1em; align-self: flex-start; }
  .dp-page[dir="rtl"] .dp-footer-btn { letter-spacing: 0; }
        .dp-page[dir="rtl"]   .dp-state { padding: 0 20px; }
  .dp-404 { font-size: 60px; }
  .dp-state-text { font-size: 14px; }
  .dp-back-btn { font-size: 9.5px; padding: 8px 16px; }
}

/* notched phones */
@supports (padding: env(safe-area-inset-bottom)) {
  .dp-footer-inner { padding-bottom: max(48px, calc(32px + env(safe-area-inset-bottom))); }
  @media (max-width: 639px) {
    .dp-footer-inner { padding-bottom: max(28px, calc(16px + env(safe-area-inset-bottom))); }
  }
  @media (max-width: 479px) {
    .dp-footer-inner { padding-bottom: max(24px, calc(12px + env(safe-area-inset-bottom))); }
  }
}

/* touch: remove hover effects */
@media (hover: none) and (pointer: coarse) {
  .dp-hero-img:hover      { transform: none; }
  .dp-nav-source:hover    { color: var(--muted); border-color: var(--rule); }
  .dp-nav-back:hover      { color: var(--muted); }
  .dp-original-link:hover { background: transparent; }
  .dp-footer-btn:hover    { background: var(--paper); }
  .dp-back-btn:hover      { background: none; }
  .dp-source-link:hover   { opacity: 1; }
}
`;
