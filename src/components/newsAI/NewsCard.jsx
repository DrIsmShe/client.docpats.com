// components/newsAI/NewsCard.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const SPECIALTY_CONFIG = {
  oncology: {
    color: "#c0392b",
    pale: "#fff0ee",
    strip: "linear-gradient(90deg,#c0392b,#e74c3c)",
  },
  cardiology: {
    color: "#922b21",
    pale: "#fdf2f2",
    strip: "linear-gradient(90deg,#922b21,#c0392b)",
  },
  neurology: {
    color: "#1a5276",
    pale: "#eaf2f8",
    strip: "linear-gradient(90deg,#1a5276,#2980b9)",
  },
  infectious: {
    color: "#b7290e",
    pale: "#fdf3f0",
    strip: "linear-gradient(90deg,#b7290e,#e74c3c)",
  },
  surgery: {
    color: "#1e8449",
    pale: "#eafaf1",
    strip: "linear-gradient(90deg,#1e8449,#27ae60)",
  },
  endocrinology: {
    color: "#9a7d0a",
    pale: "#fef9e7",
    strip: "linear-gradient(90deg,#9a7d0a,#f1c40f)",
  },
  pulmonology: {
    color: "#1a5276",
    pale: "#eaf2fb",
    strip: "linear-gradient(90deg,#1a5276,#2e86c1)",
  },
  gastroenterology: {
    color: "#0e6655",
    pale: "#e8f8f5",
    strip: "linear-gradient(90deg,#0e6655,#148f77)",
  },
  hematology: {
    color: "#7b241c",
    pale: "#fdedec",
    strip: "linear-gradient(90deg,#7b241c,#c0392b)",
  },
  dermatology: {
    color: "#6e2f8a",
    pale: "#f5eef8",
    strip: "linear-gradient(90deg,#6e2f8a,#9b59b6)",
  },
  pediatrics: {
    color: "#1f618d",
    pale: "#eaf2f8",
    strip: "linear-gradient(90deg,#1f618d,#2e86c1)",
  },
  orthopedics: {
    color: "#4a235a",
    pale: "#f4ecf7",
    strip: "linear-gradient(90deg,#4a235a,#7d3c98)",
  },
  nephrology: {
    color: "#1a5276",
    pale: "#eaf4fb",
    strip: "linear-gradient(90deg,#1a5276,#2471a3)",
  },
  rheumatology: {
    color: "#943126",
    pale: "#fdf2f1",
    strip: "linear-gradient(90deg,#943126,#c0392b)",
  },
  ophthalmology: {
    color: "#117a65",
    pale: "#e8f8f5",
    strip: "linear-gradient(90deg,#117a65,#1abc9c)",
  },
  general: {
    color: "#2c3e50",
    pale: "#f2f3f4",
    strip: "linear-gradient(90deg,#2c3e50,#566573)",
  },
};

const RTL_LOCALES = new Set(["ar"]);

function Highlight({ text, term }) {
  if (!term?.trim() || !text) return <>{text}</>;
  const words = term.trim().split(/\s+/).filter(Boolean);
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark key={i} className="nc2-hl">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// Единая карточка ленты. Дайджест использует её как есть; публикации врачей и
// научные статьи передают href/typeLabel/byline — так все карточки во всех
// вкладках набраны одним шрифтом и живут по одним правилам вёрстки.
export default function NewsCard({
  news,
  searchTerm = "",
  href,
  typeLabel: typeLabelProp,
  typeIcon,
  byline,
}) {
  const { t, i18n } = useTranslation("NewsAiTranslate");
  const [hov, setHov] = useState(false);

  const locale = i18n.language || localStorage.getItem("locale") || "en";
  const isRTL = RTL_LOCALES.has(locale);

  const DATE_MAP = {
    ar: "ar-SA",
    tr: "tr-TR",
    az: "az-AZ",
    ru: "ru-RU",
    en: "en-GB",
  };

  const mainSpec = news.specialty || news.specialties?.[0] || "general";
  const spec = SPECIALTY_CONFIG[mainSpec] || SPECIALTY_CONFIG.general;

  const isResearch = news.type === "research";
  const typeLabel =
    typeLabelProp ??
    (isResearch
      ? t("types.researchFull")
      : news.type === "news"
        ? t("types.newsFull")
        : news.type || "");
  const icon = typeIcon ?? (isResearch ? "⚗" : "📡");
  const link = href || (news.slug ? `/public/news/${news.slug}` : null);

  const dateStr = news.publishedAt
    ? new Date(news.publishedAt).toLocaleDateString(
        DATE_MAP[locale] || "en-GB",
        { day: "numeric", month: "short", year: "numeric" },
      )
    : null;

  const summary = news.aiSummaryShort || news.summary || "";

  return (
    <>
      <style>{CSS}</style>
      <article
        className={`nc2${hov ? " nc2--hov" : ""}${isResearch ? " nc2--research" : ""}`}
        dir={isRTL ? "rtl" : "ltr"}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        {/* Цветная полоса специализации */}
        <div className="nc2-strip" style={{ background: spec.strip }} />

        {/* Тип + дата */}
        <div className="nc2-eyebrow">
          {typeLabel && (
            <span
              className="nc2-type"
              style={{
                color: spec.color,
                borderColor: spec.color + "40",
                background: spec.pale,
              }}
            >
              {icon} {typeLabel}
            </span>
          )}
          {dateStr && <time className="nc2-date">{dateStr}</time>}
        </div>

        {/* Заголовок */}
        <h3 className="nc2-title">
          {link ? (
            <a href={link} className="nc2-title-link" rel="noopener noreferrer">
              <Highlight text={news.title} term={searchTerm} />
            </a>
          ) : (
            <Highlight text={news.title} term={searchTerm} />
          )}
        </h3>

        {/* Краткое содержание */}
        {summary && (
          <p className="nc2-summary">
            <Highlight text={summary} term={searchTerm} />
          </p>
        )}

        {/* Футер */}
        <div className="nc2-footer">
          {/* <div className="nc2-tags">
            {Array.isArray(news.specialties) &&
              [
                news.specialty,
                ...news.specialties.filter((sp) => sp !== news.specialty),
              ]
                .filter(Boolean)
                .slice(0, 3)
                .map((sp) => {
                  const s = SPECIALTY_CONFIG[sp] || SPECIALTY_CONFIG.general;
                  return (
                    <span
                      key={sp}
                      className="nc2-tag"
                      style={{
                        color: s.color,
                        background: s.pale,
                        borderColor: s.color + "30",
                      }}
                    >
                      {sp}
                    </span>
                  );
                })}
            {news.sourceName && (
              <span className="nc2-source">{news.sourceName}</span>
            )}
          </div> */}
          {byline && <span className="nc2-byline">{byline}</span>}
          {link && (
            <a
              href={link}
              className="nc2-read"
              style={{ color: spec.color }}
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {t("card.readFull")}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
              >
                <path
                  d="M2 10L10 2M10 2H5M10 2v5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}
        </div>

        {/* Угловой акцент при ховере */}
        <div className="nc2-corner" style={{ background: spec.strip }} />
      </article>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600&display=swap');

.nc2 {
  --bg: #ffffff;
  --bg2: #f8f7f4;
  --ink: #14110f;
  --ink2: #3d3830;
  --muted: #7a7268;
  --rule: #e8e3da;
  --serif: 'DM Serif Display', Georgia, serif;
  --sans: 'DM Sans', system-ui, sans-serif;
  --ease: cubic-bezier(.4,0,.2,1);

  background: var(--bg);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid var(--rule);
  box-shadow: 0 1px 4px rgba(20,17,15,.05), 0 4px 16px rgba(20,17,15,.04);
  transition: box-shadow .25s var(--ease), transform .25s var(--ease), border-color .2s;
}

.nc2[dir="rtl"] {
  --serif: 'Noto Naskh Arabic', Georgia, serif;
  --sans: 'Noto Naskh Arabic', system-ui, sans-serif;
}

.nc2--hov {
  box-shadow: 0 8px 32px rgba(20,17,15,.1), 0 2px 8px rgba(20,17,15,.06);
  transform: translateY(-4px);
  border-color: rgba(20,17,15,.15);
}

/* Цветная полоска сверху */
.nc2-strip {
  height: 4px;
  width: 100%;
  flex-shrink: 0;
  border-radius: 20px 20px 0 0;
  transition: height .2s var(--ease);
}
.nc2--hov .nc2-strip { height: 6px; }

/* Угловой декор */
.nc2-corner {
  position: absolute;
  bottom: -24px;
  right: -24px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  opacity: 0;
  transition: opacity .3s, transform .3s var(--ease);
  transform: scale(.6);
  pointer-events: none;
  filter: blur(18px);
}
.nc2--hov .nc2-corner { opacity: .35; transform: scale(1); }

/* Body */
.nc2-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 22px 0;
  flex-wrap: wrap;
}

.nc2-type {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--sans);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 100px;
  border: 1.5px solid;
  white-space: nowrap;
  line-height: 1;
}
.nc2[dir="rtl"] .nc2-type { letter-spacing: 0; }

.nc2-date {
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 400;
  color: var(--muted);
  margin-inline-start: auto;
}

/* Заголовок */
.nc2-title {
  font-family: var(--serif);
  font-size: 21px;
  font-weight: 400;
  line-height: 1.42;
  letter-spacing: -.01em;
  color: var(--ink);
  margin: 14px 22px 12px;
  flex-shrink: 0;
}
.nc2[dir="rtl"] .nc2-title { letter-spacing: 0; line-height: 1.6; font-size: 17px; }

.nc2-title-link {
  color: inherit;
  text-decoration: none;
  background-image: linear-gradient(currentColor, currentColor);
  background-size: 0% 1px;
  background-repeat: no-repeat;
  background-position: 0 100%;
  transition: background-size .3s var(--ease), color .2s;
}
.nc2--hov .nc2-title-link {
  background-size: 100% 1px;
}

/* Summary */
.nc2-summary {
  font-family: var(--sans);
  font-size: 15.5px;
  font-weight: 400;
  line-height: 1.72;
  color: var(--ink2);
  margin: 0 22px 16px;
  /* без flex:1 — иначе блок растягивается по высоте карточки и вместо ровных
     трёх строк показывает обрезанную по горизонту четвёртую */
  flex: 0 0 auto;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.nc2[dir="rtl"] .nc2-summary { line-height: 1.9; }

/* Highlight */
.nc2-hl {
  background: #fef08a;
  color: var(--ink);
  border-radius: 3px;
  padding: 1px 3px;
  font-weight: 700;
  font-style: normal;
}

/* Footer */
.nc2-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding: 14px 22px 18px;
  border-top: 1px solid var(--rule);
  flex-wrap: wrap;
}

.nc2-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.nc2-tag {
  font-family: var(--sans);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  padding: 3px 9px;
  border: 1.5px solid;
  border-radius: 100px;
  white-space: nowrap;
  line-height: 1.4;
}
.nc2[dir="rtl"] .nc2-tag { letter-spacing: 0; }

/* Подпись автора в футере (публикации врачей / научные статьи) */
.nc2-byline {
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nc2-source {
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  font-style: italic;
}

.nc2-read {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 100px;
  border: 1.5px solid currentColor;
  transition: background .18s, color .18s;
  opacity: .8;
}
.nc2[dir="rtl"] .nc2-read { letter-spacing: 0; }
.nc2-read:hover { opacity: 1; background: currentColor; }
.nc2-read:hover * { filter: invert(1) brightness(2); }

/* Research variant — тонкий левый бордер */
.nc2--research {
  border-left: 3px solid transparent;
  background-clip: padding-box;
}

@media (max-width: 479px) {
  .nc2-title { font-size: 17px; }
  .nc2-summary { font-size: 13px; -webkit-line-clamp: 2; }
  .nc2-footer { flex-direction: column; align-items: flex-start; }
  .nc2-read { align-self: flex-end; }
}
@media (hover: none) and (pointer: coarse) {
  .nc2--hov { transform: none; box-shadow: 0 1px 4px rgba(20,17,15,.05); border-color: var(--rule); }
  .nc2--hov .nc2-title-link { background-size: 0%; }
}
`;
