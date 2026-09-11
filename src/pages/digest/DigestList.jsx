// client/src/pages/digest/DigestList.jsx
//
// Дайджест исследований — лента коротких изложений чужих публикаций.
//
// ЧЕМ ЭТО ОТЛИЧАЕТСЯ ОТ ПРЕЖНЕЙ ЛЕНТЫ НОВОСТЕЙ. Раньше страница новостей
// показывала полный текст чужой статьи, снятый с сайта издания, и выглядел
// он как наш материал. Здесь на карточке только НАШЕ изложение в три-четыре
// предложения — что изучали, на ком, что вышло — и ссылка на оригинал.
// Читать текст идут к тому, кто им владеет.
//
// ПОЧЕМУ ССЫЛКА НА ИСТОЧНИК ВНЕШНЯЯ И ВИДНАЯ. Она не «дополнительная
// информация», а суть карточки: дайджест — указатель, а не замена
// публикации. Поэтому rel="noopener nofollow" и target="_blank" — уходим к
// издателю, а не притворяемся, что текст у нас.
//
// УРОВЕНЬ ДОКАЗАТЕЛЬНОСТИ НА КАРТОЧКЕ. Он посчитан правилами при сборе
// (дизайн исследования, журнал, выборка, свежесть), и врач видит его до
// того, как потратит время: метаанализ в Lancet и описание случая — разные
// вещи, и лента, которая их не различает, врёт о значимости.

import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { fetchDigest, fetchDigestCategories } from "../../axios";

/* Шапку и подвал рисует DashboardLayout, внутри которого объявлен маршрут.
   Своя копия здесь дала бы вторую шапку — ровно так выглядела страница
   новостей, пока её импорт Header не оказался мёртвым. */

const RTL = new Set(["ar"]);
const ЯЗЫКИ = new Set(["ru", "en", "az", "tr", "ar"]);

/* Цвет уровня доказательности. Три значения, не шкала: подробнее показывают
   сигналы в подписи, а цвет отвечает на один вопрос — насколько это твёрдо. */
const УРОВЕНЬ = {
  high: { color: "#0f766e", bg: "rgba(15,118,110,.1)" },
  moderate: { color: "#8a6a00", bg: "rgba(138,106,0,.1)" },
  low: { color: "#78716c", bg: "rgba(120,113,108,.1)" },
};

const СТИЛИ = `
.dg{--cream:#faf8f4;--card:#fff;--ink:#1c1917;--ink2:#44403c;--ink3:#78716c;
  --teal:#0f766e;--border:#e7e2d8;background:var(--cream);min-height:100vh}
.dg-wrap{max-width:1120px;margin:0 auto;padding:28px 20px 56px}
.dg-back{display:inline-block;margin-bottom:16px;font-size:14px;font-weight:600;
  color:var(--teal);text-decoration:none}
.dg-back:hover{text-decoration:underline}
.dg-head{margin-bottom:24px}
.dg-kicker{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal)}
.dg-h1{margin:6px 0 0;font-size:30px;line-height:1.2;font-weight:700;color:var(--ink);text-wrap:balance}
.dg-lede{margin:10px 0 0;max-width:62ch;font-size:15px;line-height:1.6;color:var(--ink2)}
.dg-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:22px 0 18px}
.dg-search{flex:1;min-width:200px;max-width:340px;display:flex;gap:8px}
.dg-input{flex:1;font:inherit;font-size:14px;padding:9px 12px;border:1.5px solid var(--border);
  border-radius:8px;background:#fff;color:var(--ink);outline:none}
.dg-input:focus{border-color:var(--teal)}
.dg-select{font:inherit;font-size:14px;padding:9px 12px;border:1.5px solid var(--border);
  border-radius:8px;background:#fff;color:var(--ink2);cursor:pointer;max-width:240px}
.dg-btn{font:inherit;font-size:14px;font-weight:600;padding:9px 16px;border-radius:8px;
  border:1.5px solid var(--teal);background:var(--teal);color:#fff;cursor:pointer}
.dg-btn.ghost{background:#fff;color:var(--teal)}
.dg-count{font-size:13px;color:var(--ink3);margin-bottom:14px}
.dg-list{display:flex;flex-direction:column;gap:16px}
.dg-card{background:var(--card);border:1px solid var(--border);border-radius:14px;
  padding:18px 20px;display:flex;flex-direction:column;gap:10px}
.dg-tags{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.dg-chip{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  padding:4px 10px;border-radius:999px;color:var(--teal);background:rgba(15,118,110,.09)}
.dg-title{margin:0;font-size:19px;line-height:1.35;font-weight:700;color:var(--ink);text-wrap:balance}
.dg-title a{color:inherit;text-decoration:none}
.dg-title a:hover{color:var(--teal)}
.dg-intro{margin:0;font-size:15px;line-height:1.65;color:var(--ink2)}
.dg-foot{display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding-top:10px;
  border-top:1px solid var(--border);font-size:13px;color:var(--ink3)}
.dg-src{color:var(--teal);font-weight:600;text-decoration:none}
.dg-src:hover{text-decoration:underline}
.dg-empty{padding:56px 0;text-align:center;color:var(--ink3);font-size:15px}
.dg-more{margin:28px auto 0;display:block}
@media (max-width:640px){.dg-h1{font-size:24px}.dg-wrap{padding:20px 14px 40px}}
`;

export default function DigestList() {
  const { t, i18n } = useTranslation("NewsAiTranslate");
  const [params, setParams] = useSearchParams();

  const изАдреса = params.get("locale");
  const locale = ЯЗЫКИ.has(изАдреса) ? изАдреса : (i18n.language || "ru").slice(0, 2);
  const dir = RTL.has(locale) ? "rtl" : "ltr";

  const specialty = params.get("specialty") || "";
  const q = params.get("q") || "";

  const [поле, setПоле] = useState(q);
  const [записи, setЗаписи] = useState([]);
  const [страница, setСтраница] = useState(1);
  const [страниц, setСтраниц] = useState(1);
  const [всего, setВсего] = useState(0);
  const [рубрики, setРубрики] = useState([]);
  const [грузим, setГрузим] = useState(true);
  const [ещё, setЕщё] = useState(false);

  useEffect(() => {
    fetchDigestCategories()
      .then((d) => setРубрики(d?.categories || []))
      .catch(() => setРубрики([]));
  }, []);

  const загрузить = useCallback(
    async (стр = 1, добавить = false) => {
      добавить ? setЕщё(true) : setГрузим(true);
      try {
        const d = await fetchDigest({ page: стр, limit: 20, specialty, q, locale });
        const пачка = d?.data || [];
        setЗаписи((прежние) => (добавить ? [...прежние, ...пачка] : пачка));
        setСтраница(d?.page || стр);
        setСтраниц(d?.pages || 1);
        setВсего(d?.total || 0);
      } catch {
        if (!добавить) setЗаписи([]);
      } finally {
        добавить ? setЕщё(false) : setГрузим(false);
      }
    },
    [specialty, q, locale],
  );

  useEffect(() => {
    setПоле(q);
    загрузить(1, false);
  }, [загрузить, q]);

  const применить = (изменения) => {
    const следующие = new URLSearchParams(params);
    Object.entries(изменения).forEach(([к, з]) => {
      if (з) следующие.set(к, з);
      else следующие.delete(к);
    });
    setParams(следующие, { replace: true });
  };

  const дата = (з) =>
    з ? new Date(з).toLocaleDateString(locale === "en" ? "en-GB" : locale) : "";

  return (
    <div className="dg" dir={dir}>
      <style>{СТИЛИ}</style>
      <Helmet>
        <title>{`${t("digest.title")} — DocPats`}</title>
        <meta name="description" content={t("digest.lede")} />
        <link rel="canonical" href="https://docpats.com/digest" />
      </Helmet>

      <div className="dg-wrap">
        {/* Обратный ход. Дайджест открывают из ленты в новой вкладке, но
            прийти сюда можно и по прямой ссылке — из письма, из поиска, от
            коллеги, — и тогда кнопка «назад» в браузере ведёт не в ленту, а
            туда, откуда человек пришёл. Явная ссылка работает в обоих
            случаях. */}
        <Link className="dg-back" to="/news">
          {t("digest.backToFeed")}
        </Link>

        <header className="dg-head">
          <div className="dg-kicker">{t("digest.kicker")}</div>
          <h1 className="dg-h1">{t("digest.title")}</h1>
          <p className="dg-lede">{t("digest.lede")}</p>
        </header>

        <div className="dg-bar">
          <form
            className="dg-search"
            onSubmit={(e) => {
              e.preventDefault();
              применить({ q: поле.trim() });
            }}
          >
            <input
              className="dg-input"
              value={поле}
              onChange={(e) => setПоле(e.target.value)}
              placeholder={t("digest.searchPlaceholder")}
              aria-label={t("digest.searchPlaceholder")}
            />
            <button className="dg-btn" type="submit">
              {t("digest.searchGo")}
            </button>
          </form>

          <select
            className="dg-select"
            value={specialty}
            onChange={(e) => применить({ specialty: e.target.value })}
            aria-label={t("filters.specialty")}
          >
            <option value="">{t("filters.all")}</option>
            {рубрики.map((р) => (
              <option key={р._id} value={р._id}>
                {t(`specialties.${р._id}`, { defaultValue: р._id })} ({р.count})
              </option>
            ))}
          </select>

          {(specialty || q) && (
            <button
              className="dg-btn ghost"
              type="button"
              onClick={() => применить({ specialty: "", q: "" })}
            >
              {t("filter_reset")}
            </button>
          )}
        </div>

        {грузим ? (
          <p className="dg-empty">{t("loading")}</p>
        ) : записи.length === 0 ? (
          <p className="dg-empty">{t("nothing_found")}</p>
        ) : (
          <>
            <div className="dg-count">{t("digest.count", { count: всего })}</div>

            <div className="dg-list">
              {записи.map((з) => {
                const ур = УРОВЕНЬ[з.evidenceLevel];
                return (
                  <article className="dg-card" key={з.slug}>
                    <div className="dg-tags">
                      {з.specialty && (
                        <span className="dg-chip">
                          {t(`specialties.${з.specialty}`, {
                            defaultValue: з.specialty,
                          })}
                        </span>
                      )}
                      {ур && (
                        <span
                          className="dg-chip"
                          style={{ color: ур.color, background: ур.bg }}
                        >
                          {t(`digest.evidence.${з.evidenceLevel}`)}
                        </span>
                      )}
                    </div>

                    <h2 className="dg-title">
                      <Link to={`/digest/${з.slug}?locale=${locale}`}>
                        {з.title}
                      </Link>
                    </h2>

                    <p className="dg-intro">{з.intro}</p>

                    <div className="dg-foot">
                      {з.publishedAt && <span>{дата(з.publishedAt)}</span>}
                      {з.journal && <span>{з.journal}</span>}
                      <a
                        className="dg-src"
                        href={з.canonicalUrl}
                        target="_blank"
                        rel="noopener nofollow"
                      >
                        {t("digest.readAtSource", {
                          source: з.sourceName || t("body.defaultSource"),
                        })}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>

            {страница < страниц && (
              <button
                className="dg-btn dg-more"
                type="button"
                disabled={ещё}
                onClick={() => загрузить(страница + 1, true)}
              >
                {ещё ? t("loading_more") : t("buttons.loadMore")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
