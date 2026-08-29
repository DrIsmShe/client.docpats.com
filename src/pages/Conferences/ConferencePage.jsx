// client/src/pages/Conferences/ConferencePage.jsx
//
// Карточка одной конференции. Именно сюда ведут ссылки из письма: врач
// должен попадать туда, где уже есть ответ, а не в общий список.

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { NEWS_API_BASE } from "../../config";

const RTL_LOCALES = new Set(["ar"]);
const LOCALE_TAG = { ru: "ru-RU", en: "en-US", az: "az-AZ", tr: "tr-TR", ar: "ar" };

export default function ConferencePage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation("conferences");
  const locale = i18n.language || "ru";
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  const [conference, setConference] = useState(null);
  const [state, setState] = useState("loading");

  const fmt = useMemo(() => {
    const tag = LOCALE_TAG[locale] || "ru-RU";
    return (d) =>
      d
        ? new Intl.DateTimeFormat(tag, {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(d))
        : "—";
  }, [locale]);

  useEffect(() => {
    let alive = true;
    setState("loading");
    axios
      .get(`${NEWS_API_BASE}/api/conferences/${slug}`)
      .then((r) => {
        if (!alive) return;
        setConference(r.data.conference || null);
        setState(r.data.conference ? "ready" : "missing");
      })
      .catch(() => alive && setState("missing"));
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (conference?.title) document.title = `${conference.title} — DocPats`;
  }, [conference]);

  if (state === "loading") {
    return (
      <div dir={dir} style={wrap}>
        <div style={{ color: "#64748b" }}>{t("loading")}</div>
      </div>
    );
  }

  if (state === "missing") {
    return (
      <div dir={dir} style={wrap}>
        <div style={{ color: "#64748b", marginBottom: 16 }}>{t("not_found")}</div>
        <Link to="/conferences" style={backLink}>
          ← {t("back")}
        </Link>
      </div>
    );
  }

  const c = conference;
  const place =
    c.format === "online"
      ? t("format.online")
      : [c.city, c.country].filter(Boolean).join(", ") ||
        t(`format.${c.format}`);

  const rows = [
    [t("organizer"), c.organizer],
    [t("registration_until"), c.registrationDeadline ? fmt(c.registrationDeadline) : null],
    [t("abstracts_until"), c.abstractDeadline ? fmt(c.abstractDeadline) : null],
    [t("cme"), c.cmeCredits],
    [t("price"), c.price],
  ].filter(([, value]) => value);

  return (
    <div dir={dir} style={wrap}>
      <Link to="/conferences" style={backLink}>
        ← {t("back")}
      </Link>

      <h1 style={{ fontSize: 26, margin: "14px 0 10px", lineHeight: 1.3 }}>{c.title}</h1>

      <div style={{ color: "#475569", fontSize: 15, marginBottom: 4 }}>
        {fmt(c.startDate)}
        {c.endDate ? ` — ${fmt(c.endDate)}` : ""}
      </div>
      <div style={{ color: "#475569", fontSize: 15, marginBottom: 16 }}>
        {place}
        {c.format === "hybrid" ? ` · ${t("format.hybrid")}` : ""}
      </div>

      {c.categories?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
          {c.categories.map((code) => (
            <span key={code} style={chip}>
              {t(`categories.${code}`)}
            </span>
          ))}
        </div>
      )}

      {c.description && (
        <p style={{ lineHeight: 1.65, color: "#334155", marginBottom: 20 }}>{c.description}</p>
      )}

      {rows.length > 0 && (
        <dl style={dl}>
          {rows.map(([label, value]) => (
            <div key={label} style={dlRow}>
              <dt style={dt}>{label}</dt>
              <dd style={dd}>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Внешняя ссылка: rel закрывает и подмену вкладки, и передачу веса
          домену, который мы не контролируем. */}
      <a
        href={c.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        style={cta}
      >
        {t("website")} →
      </a>
    </div>
  );
}

const wrap = { padding: "24px 20px 60px", maxWidth: 760, margin: "0 auto" };
const backLink = { color: "#3d7fff", textDecoration: "none", fontSize: 14 };
const chip = { fontSize: 12, color: "#0f766e", background: "rgba(15,118,110,.1)", padding: "3px 8px", borderRadius: 999 };
const dl = { border: "1px solid #e6eaf0", borderRadius: 12, padding: 4, marginBottom: 24, background: "#fff" };
const dlRow = { display: "flex", flexWrap: "wrap", gap: 8, padding: "10px 14px", borderBottom: "1px solid #f1f5f9" };
const dt = { color: "#64748b", fontSize: 14, minWidth: 180, margin: 0 };
const dd = { margin: 0, fontSize: 14, color: "#0f172a" };
const cta = { display: "inline-block", padding: "12px 22px", background: "#3d7fff", color: "#fff", borderRadius: 10, textDecoration: "none", fontSize: 15 };
