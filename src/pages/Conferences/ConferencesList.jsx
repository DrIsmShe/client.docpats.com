// client/src/pages/Conferences/ConferencesList.jsx
//
// Публичная рубрика конференций.
//
// Сортировка по умолчанию — по ближайшему ДЕДЛАЙНУ регистрации, а не по дате
// начала. Дату начала пропустить нельзя, а дедлайн — запросто, и именно ради
// него сюда возвращаются. Список конференций гуглится за минуту; сроки, к
// которым надо успеть, — нет.
//
// Данные берём прямо из новостного движка: карточки живут там, а его
// публичные эндпоинты открыты для docpats.com. Через backend это гонять
// незачем — здесь нет ни персональных данных, ни авторизации.

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../../components/shared/PageNav";
import axios from "axios";
import { NEWS_API_BASE } from "../../config";
import { formatDateRange, formatPlace, countryName } from "../../lib/localeFormat";
import { CONFERENCE_FONT } from "./styles";

const RTL_LOCALES = new Set(["ar"]);
const CATEGORY_CODES = [
  "therapeutic",
  "surgical",
  "diagnostics",
  "rehabilitation",
  "dentistry",
  "womens-health",
  "pediatrics",
  "mental-health",
  "ophthalmology-ent",
  "sports-medicine",
  "oncology",
  "emergency",
  "mens-health",
  "pharmacy",
];

const PER_PAGE = 20;

export default function ConferencesList() {
  const { t, i18n } = useTranslation("conferences");
  const locale = i18n.language || "ru";
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [countries, setCountries] = useState([]);
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [format, setFormat] = useState("");
  const [sort, setSort] = useState("deadline");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (nextPage = 1, append = false) => {
      setLoading(true);
      setError(null);
      try {
        // Карточки приходят на языке интерфейса: движок накладывает перевод.
        const params = { page: nextPage, limit: PER_PAGE, sort, locale };
        if (category) params.category = category;
        if (country) params.country = country;
        if (format) params.format = format;

        const r = await axios.get(`${NEWS_API_BASE}/api/conferences`, { params });
        setItems((prev) => (append ? [...prev, ...(r.data.items || [])] : r.data.items || []));
        setTotal(r.data.total || 0);
        setPage(nextPage);
      } catch {
        setError(t("error"));
      } finally {
        setLoading(false);
      }
    },
    [category, country, format, sort, locale, t],
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  useEffect(() => {
    axios
      .get(`${NEWS_API_BASE}/api/conferences/countries`)
      .then((r) => setCountries(r.data.countries || []))
      .catch(() => setCountries([]));
  }, []);

  // Страна словом, а не кодом: «Milan, IT» ничего не говорит врачу, который
  // решает, поедет ли он туда.
  const place = (c) =>
    c.format === "online"
      ? t("format.online")
      : formatPlace(c.city, c.country, locale) +
        (c.format === "hybrid" ? ` · ${t("format.hybrid")}` : "");

  return (
    <div dir={dir} style={wrap}>
      <PageNav fallback="/conferences" />
      <h1 style={h1}>{t("title")}</h1>
      <p style={sub}>{t("subtitle")}</p>

      <div style={filters}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
          <option value="">{t("all_categories")}</option>
          {CATEGORY_CODES.map((code) => (
            <option key={code} value={code}>
              {t(`categories.${code}`)}
            </option>
          ))}
        </select>

        <select value={country} onChange={(e) => setCountry(e.target.value)} style={input}>
          <option value="">{t("all_countries")}</option>
          {/* Названия стран, а не коды: «UA (3)» ничего не говорит, а
              список стран — первое, по чему врач фильтрует. Сортируем по
              названию на языке интерфейса, иначе порядок кажется случайным. */}
          {countries
            .map((c) => ({ ...c, label: countryName(c._id, locale) }))
            .sort((a, b) => a.label.localeCompare(b.label, locale))
            .map((c) => (
              <option key={c._id} value={c._id}>
                {c.label} ({c.count})
              </option>
            ))}
        </select>

        <select value={format} onChange={(e) => setFormat(e.target.value)} style={input}>
          <option value="">{t("all_formats")}</option>
          <option value="onsite">{t("format.onsite")}</option>
          <option value="online">{t("format.online")}</option>
          <option value="hybrid">{t("format.hybrid")}</option>
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)} style={input}>
          <option value="deadline">{t("sort.deadline")}</option>
          <option value="date">{t("sort.date")}</option>
          <option value="recent">{t("sort.recent")}</option>
        </select>
      </div>

      {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>}

      {loading && items.length === 0 ? (
        <div style={{ color: "#64748b" }}>{t("loading")}</div>
      ) : items.length === 0 ? (
        <div style={{ color: "#64748b" }}>{t("empty")}</div>
      ) : (
        items.map((c) => (
          <Link key={c._id} to={`/conferences/${c.slug}`} style={cardLink}>
            <article style={card}>
              <h2 style={cardTitle}>{c.title}</h2>

              <div style={meta}>
                {formatDateRange(c.startDate, c.endDate, locale)}
                {place(c) ? ` · ${place(c)}` : ""}
              </div>

              {c.organizer && <div style={meta}>{c.organizer}</div>}

              {/* Дедлайн — единственное, что выделено цветом: остальное
                  врач и так прочитает, а это он может пропустить. */}
              {(c.registrationDeadline || c.abstractDeadline) && (
                <div style={deadline}>
                  {c.registrationDeadline
                    ? `${t("registration_until")} ${formatDateRange(c.registrationDeadline, null, locale)}`
                    : `${t("abstracts_until")} ${formatDateRange(c.abstractDeadline, null, locale)}`}
                </div>
              )}

              {c.categories?.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {c.categories.map((code) => (
                    <span key={code} style={chip}>
                      {t(`categories.${code}`)}
                    </span>
                  ))}
                </div>
              )}

              {/* Карточка кликабельна целиком, но видимая ссылка нужна: без
                  неё непонятно, что за карточкой есть страница, и врач уходит
                  искать конференцию в поиске. */}
              <div style={moreLink}>{t("details")} →</div>
            </article>
          </Link>
        ))
      )}

      {items.length > 0 && items.length < total && (
        <button onClick={() => load(page + 1, true)} disabled={loading} style={moreBtn}>
          {loading ? t("loading") : t("show_more")}
        </button>
      )}
    </div>
  );
}

const wrap = {
  padding: "28px 20px 72px",
  maxWidth: 860,
  margin: "0 auto",
  fontFamily: CONFERENCE_FONT,
  color: "#1f2937",
};
const h1 = { fontSize: 30, marginBottom: 8, fontWeight: 700, color: "#0f172a" };
const sub = { color: "#475569", fontSize: 16, marginBottom: 22, lineHeight: 1.6 };
const filters = { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 };
const input = { padding: "8px 10px", border: "1px solid #d9dfe8", borderRadius: 8, fontSize: 14, background: "#fff" };
const cardLink = { textDecoration: "none", color: "inherit" };
const card = { background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, padding: 22, marginBottom: 14 };
const cardTitle = { fontSize: 20, margin: "0 0 10px", lineHeight: 1.3, fontWeight: 700, color: "#0f172a" };
const meta = { color: "#334155", fontSize: 16, marginBottom: 3, lineHeight: 1.5 };
const deadline = { marginTop: 10, color: "#9a3412", fontSize: 15, fontWeight: 600 };
const moreLink = { marginTop: 12, color: "#2563eb", fontSize: 15, fontWeight: 600 };
const chip = { fontSize: 12, color: "#0f766e", background: "rgba(15,118,110,.1)", padding: "3px 8px", borderRadius: 999 };
const moreBtn = { padding: "10px 20px", background: "#3d7fff", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", marginTop: 8 };
