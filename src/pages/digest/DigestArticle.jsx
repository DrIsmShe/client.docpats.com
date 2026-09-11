// client/src/pages/digest/DigestArticle.jsx
//
// Одна запись дайджеста: наше изложение и дорога к оригиналу.
//
// ПОЧЕМУ У ЭТОЙ СТРАНИЦЫ ЕСТЬ ЗАПАСНОЙ ХОД. Адреса вида /news/<слаг>
// проиндексированы тысячами и теперь ведут сюда. Но изложение пишется
// порциями — архив разбирается не за один день, — и для части этих адресов
// записи дайджеста ещё нет. Отдавать по ним 404 значит выбросить из индекса
// живые страницы за то, что до них не дошла очередь.
//
// Поэтому при промахе спрашиваем архив и показываем то, что является
// фактом, а не чужим текстом: заголовок, издание, дату, DOI и ссылку. Текст
// оригинала сюда не приходит вовсе — сервер его больше не отдаёт.
//
// КАНОНИЧЕСКИЙ АДРЕС ВСЕГДА /digest/<слаг>. Ни на оригинал, ни на старый
// /news/<слаг> он не указывает: canonical на чужой домен отдал бы наше
// изложение чужой странице, а canonical на старый адрес закрепил бы в
// индексе тот, с которого мы уходим.

import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { NEWS_API_BASE } from "../../config";
import { fetchDigestItem } from "../../axios";
import { useDropEdgeSeoTags } from "../../lib/useDropEdgeSeoTags";
import ShareButtons from "../../components/share/ShareButtons";

const RTL = new Set(["ar"]);
const ЯЗЫКИ = new Set(["ru", "en", "az", "tr", "ar"]);
const САЙТ = "https://docpats.com";

const УРОВЕНЬ = {
  high: { color: "#0f766e", bg: "rgba(15,118,110,.1)" },
  moderate: { color: "#8a6a00", bg: "rgba(138,106,0,.1)" },
  low: { color: "#78716c", bg: "rgba(120,113,108,.1)" },
};

const СТИЛИ = `
.dga{--cream:#faf8f4;--card:#fff;--ink:#1c1917;--ink2:#44403c;--ink3:#78716c;
  --teal:#0f766e;--border:#e7e2d8;background:var(--cream);min-height:100vh}
.dga-wrap{max-width:720px;margin:0 auto;padding:28px 20px 64px}
.dga-back{display:inline-block;margin-bottom:18px;font-size:14px;font-weight:600;
  color:var(--teal);text-decoration:none}
.dga-back:hover{text-decoration:underline}
.dga-tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.dga-chip{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  padding:4px 10px;border-radius:999px;color:var(--teal);background:rgba(15,118,110,.09)}
.dga-h1{margin:0;font-size:30px;line-height:1.25;font-weight:700;color:var(--ink);text-wrap:balance}
.dga-meta{margin:14px 0 0;display:flex;flex-wrap:wrap;gap:14px;font-size:13px;color:var(--ink3)}
.dga-intro{margin:24px 0 0;font-size:18px;line-height:1.7;color:var(--ink2)}
.dga-note{margin:18px 0 0;font-size:13px;line-height:1.6;color:var(--ink3);font-style:italic}
.dga-source{margin:28px 0 0;background:var(--card);border:1px solid var(--border);
  border-radius:14px;padding:20px}
.dga-source-h{margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.07em;
  text-transform:uppercase;color:var(--ink3)}
.dga-source-t{margin:0 0 14px;font-size:15px;line-height:1.5;color:var(--ink)}
.dga-go{display:inline-block;font-size:14px;font-weight:700;padding:11px 20px;border-radius:8px;
  background:var(--teal);color:#fff;text-decoration:none}
.dga-ids{margin:14px 0 0;display:flex;flex-wrap:wrap;gap:14px;font-size:13px;color:var(--ink3)}
.dga-ids a{color:var(--teal);text-decoration:none}
.dga-langs{margin:26px 0 0;display:flex;flex-wrap:wrap;gap:8px;align-items:center;
  font-size:13px;color:var(--ink3)}
.dga-lang{padding:5px 11px;border:1.5px solid var(--border);border-radius:8px;
  background:#fff;color:var(--ink2);text-decoration:none;font-weight:600}
.dga-lang.on{border-color:var(--teal);color:var(--teal)}
.dga-state{padding:64px 0;text-align:center;color:var(--ink3);font-size:15px}
@media (max-width:640px){.dga-h1{font-size:24px}.dga-intro{font-size:16px}}
`;

export default function DigestArticle() {
  const { t, i18n } = useTranslation("NewsAiTranslate");
  const { slug } = useParams();
  const [params] = useSearchParams();

  const изАдреса = params.get("locale");
  const locale = ЯЗЫКИ.has(изАдреса) ? изАдреса : (i18n.language || "ru").slice(0, 2);
  const dir = RTL.has(locale) ? "rtl" : "ltr";

  const [запись, setЗапись] = useState(null);
  const [запасной, setЗапасной] = useState(null);
  const [грузим, setГрузим] = useState(true);

  // Мета-теги здесь пишет Helmet — комплект от edge-функции надо снять,
  // иначе в <head> окажутся два title и два canonical.
  useDropEdgeSeoTags(!грузим);

  useEffect(() => {
    let живо = true;
    setГрузим(true);
    setЗапись(null);
    setЗапасной(null);

    fetchDigestItem(slug, locale)
      .then((d) => {
        if (живо) setЗапись(d?.data || null);
      })
      .catch(async () => {
        /* Изложения ещё нет. Берём из архива только факты — заголовок,
           издание, дату, идентификаторы и ссылку. Полного текста сервер не
           отдаёт, так что взять его отсюда невозможно даже по ошибке. */
        try {
          const res = await fetch(
            `${NEWS_API_BASE}/api/news/${encodeURIComponent(slug)}?locale=${locale}`,
          );
          const d = await res.json();
          if (живо && d?.success) setЗапасной(d.data);
        } catch {
          /* пусто — покажем «не найдено» */
        }
      })
      .finally(() => {
        if (живо) setГрузим(false);
      });

    return () => {
      живо = false;
    };
  }, [slug, locale]);

  if (грузим) {
    return (
      <div className="dga" dir={dir}>
        <style>{СТИЛИ}</style>
        <p className="dga-state">{t("states.loading")}</p>
      </div>
    );
  }

  const данные = запись || запасной;

  if (!данные) {
    return (
      <div className="dga" dir={dir}>
        <style>{СТИЛИ}</style>
        <div className="dga-wrap">
          <p className="dga-state">{t("states.notFound")}</p>
          <p style={{ textAlign: "center" }}>
            <Link className="dga-back" to="/digest">
              {t("digest.backToList")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const адрес = `${САЙТ}/digest/${slug}${locale === "ru" ? "" : `?locale=${locale}`}`;
  const ур = УРОВЕНЬ[данные.evidenceLevel];
  const заголовок = данные.title || данные.originalTitle || "";
  const изложение = запись?.intro || "";
  const издание = данные.sourceName || t("body.defaultSource");
  const языки = запись?.availableLangs || [];

  /* hreflang объявляем только для языков, на которых изложение реально
     написано. Перечислить все пять там, где есть два, — это заявка на
     переводы, которых нет. */
  const альтернативы = языки.map((к) => ({
    к,
    href: `${САЙТ}/digest/${slug}${к === "ru" ? "" : `?locale=${к}`}`,
  }));

  const разметка = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: заголовок,
    ...(изложение ? { abstract: изложение } : {}),
    inLanguage: запись?.lang || locale,
    url: адрес,
    ...(данные.publishedAt ? { datePublished: данные.publishedAt } : {}),
    /* Первоисточник объявлен явно: isBasedOn говорит, что это изложение
       чужой работы, а не самостоятельное исследование. */
    ...(данные.canonicalUrl
      ? { isBasedOn: данные.canonicalUrl, sameAs: данные.canonicalUrl }
      : {}),
    ...(данные.journal ? { citation: данные.journal } : {}),
    publisher: {
      "@type": "Organization",
      name: "DocPats",
      "@id": `${САЙТ}/#organization`,
    },
  };

  return (
    <div className="dga" dir={dir}>
      <style>{СТИЛИ}</style>

      <Helmet>
        <title>{`${заголовок} — DocPats`}</title>
        {изложение && <meta name="description" content={изложение.slice(0, 200)} />}
        <link rel="canonical" href={адрес} />
        {альтернативы.map((а) => (
          <link key={а.к} rel="alternate" hrefLang={а.к} href={а.href} />
        ))}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={заголовок} />
        {изложение && <meta property="og:description" content={изложение.slice(0, 200)} />}
        <meta property="og:url" content={адрес} />
        <meta property="og:locale" content={запись?.lang || locale} />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">{JSON.stringify(разметка)}</script>
      </Helmet>

      <div className="dga-wrap">
        <Link className="dga-back" to="/digest">
          {t("digest.backToList")}
        </Link>

        <div className="dga-tags">
          {данные.specialty && (
            <span className="dga-chip">
              {t(`specialties.${данные.specialty}`, { defaultValue: данные.specialty })}
            </span>
          )}
          {ур && (
            <span className="dga-chip" style={{ color: ур.color, background: ур.bg }}>
              {t(`digest.evidence.${данные.evidenceLevel}`)}
            </span>
          )}
        </div>

        <h1 className="dga-h1">{заголовок}</h1>

        <div className="dga-meta">
          {данные.publishedAt && (
            <span>
              {new Date(данные.publishedAt).toLocaleDateString(
                locale === "en" ? "en-GB" : locale,
              )}
            </span>
          )}
          <span>{издание}</span>
          {данные.journal && <span>{данные.journal}</span>}
        </div>

        {изложение ? (
          <>
            <p className="dga-intro">{изложение}</p>
            <p className="dga-note">{t("digest.disclaimer")}</p>
          </>
        ) : (
          <p className="dga-note">{t("digest.notYetSummarized")}</p>
        )}

        <section className="dga-source">
          <h2 className="dga-source-h">{t("digest.sourceHeading")}</h2>
          {данные.originalTitle && (
            <p className="dga-source-t">{данные.originalTitle}</p>
          )}
          {данные.canonicalUrl && (
            <a
              className="dga-go"
              href={данные.canonicalUrl}
              target="_blank"
              rel="noopener nofollow"
            >
              {t("digest.readAtSource", { source: издание })}
            </a>
          )}
          <div className="dga-ids">
            {данные.doi && (
              <a
                href={`https://doi.org/${данные.doi}`}
                target="_blank"
                rel="noopener nofollow"
              >
                DOI: {данные.doi}
              </a>
            )}
            {данные.pmid && (
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${данные.pmid}/`}
                target="_blank"
                rel="noopener nofollow"
              >
                PMID: {данные.pmid}
              </a>
            )}
          </div>
        </section>

        {альтернативы.length > 1 && (
          <div className="dga-langs">
            <span>{t("digest.languages")}</span>
            {альтернативы.map((а) => (
              <a
                key={а.к}
                className={`dga-lang${а.к === (запись?.lang || locale) ? " on" : ""}`}
                href={`/digest/${slug}${а.к === "ru" ? "" : `?locale=${а.к}`}`}
              >
                {а.к.toUpperCase()}
              </a>
            ))}
          </div>
        )}

        <div style={{ marginTop: 26 }}>
          <ShareButtons url={адрес} title={заголовок} />
        </div>
      </div>
    </div>
  );
}
