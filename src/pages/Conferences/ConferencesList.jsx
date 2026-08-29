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

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { NEWS_API_BASE } from "../../config";

const RTL_LOCALES = new Set(["ar"]);
const LOCALE_TAG = { ru: "ru-RU", en: "en-US", az: "az-AZ", tr: "tr-TR", ar: "ar" };

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

  const fmt = useMemo(() => {
    const tag = LOCALE_TAG[locale] || "ru-RU";
    return (d) =>
      d
        ? new Intl.DateTimeFormat(tag, {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(d))
        : "";
  }, [locale]);

  const load = useCallback(
    async (nextPage = 1, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = { page: nextPage, limit: PER_PAGE, sort };
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
    [category, country, format, sort, t],
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

  const place = (c) =>
    c.format === "online"
      ? t("format.online")
      : [c.city, c.country].filter(Boolean).join(", ") +
        (c.format === "hybrid" ? ` · ${t("format.hybrid")}` : "");

  return (
    <div dir={dir} style={wrap}>
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
          {countries.map((c) => (
            <option key={c._id} value={c._id}>
              {c._id} ({c.count})
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
                {fmt(c.startDate)}
                {c.endDate ? ` — ${fmt(c.endDate)}` : ""}
                {place(c) ? ` · ${place(c)}` : ""}
              </div>

              {c.organizer && <div style={meta}>{c.organizer}</div>}

              {/* Дедлайн — единственное, что выделено цветом: остальное
                  врач и так прочитает, а это он может пропустить. */}
              {(c.registrationDeadline || c.abstractDeadline) && (
                <div style={deadline}>
                  {c.registrationDeadline
                    ? `${t("registration_until")} ${fmt(c.registrationDeadline)}`
                    : `${t("abstracts_until")} ${fmt(c.abstractDeadline)}`}
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

const wrap = { padding: "24px 20px 60px", maxWidth: 860, margin: "0 auto" };
const h1 = { fontSize: 26, marginBottom: 6 };
const sub = { color: "#64748b", fontSize: 14, marginBottom: 20, lineHeight: 1.5 };
const filters = { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 };
const input = { padding: "8px 10px", border: "1px solid #d9dfe8", borderRadius: 8, fontSize: 14, background: "#fff" };
const cardLink = { textDecoration: "none", color: "inherit" };
const card = { background: "#fff", border: "1px solid #e6eaf0", borderRadius: 12, padding: 18, marginBottom: 12 };
const cardTitle = { fontSize: 17, margin: "0 0 8px", lineHeight: 1.35 };
const meta = { color: "#475569", fontSize: 14, marginBottom: 2 };
const deadline = { marginTop: 8, color: "#9a3412", fontSize: 14, fontWeight: 600 };
const chip = { fontSize: 12, color: "#0f766e", background: "rgba(15,118,110,.1)", padding: "3px 8px", borderRadius: 999 };
const moreBtn = { padding: "10px 20px", background: "#3d7fff", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", marginTop: 8 };
