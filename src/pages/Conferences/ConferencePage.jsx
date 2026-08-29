// client/src/pages/Conferences/ConferencePage.jsx
//
// Карточка одной конференции. Именно сюда ведут ссылки из письма: врач
// должен попадать туда, где уже есть ответ, а не в общий список.
//
// О вёрстке. Страницу читают, чтобы принять решение — ехать или нет, — и
// читают часто с телефона между приёмами. Поэтому:
//   • факты (даты, место, формат, организатор) вынесены в отдельный блок
//     подписанными полями, а не идут серой строкой под заголовком;
//   • дедлайн выделен цветом: дату начала не пропустишь, а срок регистрации
//     закрывается тихо;
//   • программа пронумерована — это перечень пунктов, и глазу нужен якорь,
//     чтобы не терять строку при переносе;
//   • основной текст крупнее и темнее обычного (17px, #1f2937): бледный
//     мелкий шрифт на длинном описании читать никто не станет.

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../../components/shared/PageNav";
import axios from "axios";
import { NEWS_API_BASE } from "../../config";
import { formatDate, formatDateRange, formatPlace } from "../../lib/localeFormat";
import { CONFERENCE_FONT } from "./styles";

const RTL_LOCALES = new Set(["ar"]);

export default function ConferencePage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation("conferences");
  const locale = i18n.language || "ru";
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  const [conference, setConference] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let alive = true;
    setState("loading");
    axios
      .get(`${NEWS_API_BASE}/api/conferences/${slug}`, { params: { locale } })
      .then((r) => {
        if (!alive) return;
        setConference(r.data.conference || null);
        setState(r.data.conference ? "ready" : "missing");
      })
      .catch(() => alive && setState("missing"));
    return () => {
      alive = false;
    };
  }, [slug, locale]);

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
        <PageNav fallback="/conferences" />
        <div style={{ color: "#475569", fontSize: 17 }}>{t("not_found")}</div>
      </div>
    );
  }

  const c = conference;
  const place =
    c.format === "online"
      ? t("format.online")
      : formatPlace(c.city, c.country, locale) || t(`format.${c.format}`);

  // Подписи полей, а не фильтров: «Даты», а не «По дате начала».
  const facts = [
    [t("field_dates"), formatDateRange(c.startDate, c.endDate, locale, { long: true })],
    [t("field_place"), place],
    [t("field_format"), t(`format.${c.format}`)],
    [t("organizer"), c.organizer],
    [t("venue"), c.venue],
  ].filter(([, v]) => v);

  const deadlines = [
    [t("registration_until"), c.registrationDeadline],
    [t("abstracts_until"), c.abstractDeadline],
  ].filter(([, v]) => v);

  const extras = [
    [t("audience"), c.audience],
    [t("cme"), c.cmeCredits],
    [t("price"), c.price],
  ].filter(([, v]) => v);

  return (
    <div dir={dir} style={wrap}>
      <PageNav fallback="/conferences" />

      <article>
        {c.categories?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {c.categories.map((code) => (
              <span key={code} style={chip}>
                {t(`categories.${code}`)}
              </span>
            ))}
          </div>
        )}

        <h1 style={h1}>{c.title}</h1>

        <div style={factsBox}>
          {facts.map(([label, value]) => (
            <div key={label} style={{ minWidth: 0 }}>
              <div style={factLabel}>{label}</div>
              <div style={factValue}>{value}</div>
            </div>
          ))}
        </div>

        {deadlines.length > 0 && (
          <div style={deadlineBox}>
            {deadlines.map(([label, value]) => (
              <div key={label} style={{ fontSize: 16 }}>
                <b>{label}</b> {formatDate(value, locale, { long: true })}
              </div>
            ))}
          </div>
        )}

        {c.description && <p style={lead}>{c.description}</p>}

        {c.program?.length > 0 && (
          <section style={section}>
            <h2 style={h2}>{t("program")}</h2>
            <ol style={programList}>
              {c.program.map((line, i) => (
                <li key={i} style={programItem}>
                  <span style={num}>{i + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {c.conditions && (
          <section style={section}>
            <h2 style={h2}>{t("conditions")}</h2>
            <p style={body}>{c.conditions}</p>
          </section>
        )}

        {extras.length > 0 && (
          <section style={section}>
            <dl style={dl}>
              {extras.map(([label, value]) => (
                <div key={label} style={dlRow}>
                  <dt style={dt}>{label}</dt>
                  <dd style={dd}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Внешняя ссылка: rel закрывает и подмену вкладки, и передачу веса
            домену, который мы не контролируем. */}
        <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" style={cta}>
          {t("website")} →
        </a>
      </article>
    </div>
  );
}

const wrap = {
  padding: "28px 20px 72px",
  maxWidth: 780,
  margin: "0 auto",
  fontFamily: CONFERENCE_FONT,
  color: "#1f2937",
};
const h1 = { fontSize: 32, lineHeight: 1.2, margin: "0 0 20px", fontWeight: 700, color: "#0f172a" };
const h2 = { fontSize: 20, margin: "0 0 14px", fontWeight: 700, color: "#0f172a" };
const section = { marginBottom: 32 };
const lead = { fontSize: 18, lineHeight: 1.7, color: "#1f2937", margin: "0 0 32px" };
const body = { fontSize: 17, lineHeight: 1.75, color: "#1f2937", margin: 0 };

const factsBox = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 18,
  padding: "20px 22px",
  background: "#f8fafc",
  border: "1px solid #e6eaf0",
  borderRadius: 14,
  marginBottom: 20,
};
const factLabel = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: ".04em",
  color: "#64748b",
  marginBottom: 4,
  fontWeight: 600,
};
const factValue = { fontSize: 16, lineHeight: 1.45, color: "#0f172a", fontWeight: 500 };

const deadlineBox = {
  padding: "14px 18px",
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: 12,
  color: "#9a3412",
  marginBottom: 28,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const programList = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};
const programItem = {
  display: "flex",
  gap: 14,
  alignItems: "flex-start",
  fontSize: 17,
  lineHeight: 1.6,
  color: "#1f2937",
};
const num = {
  flex: "0 0 28px",
  height: 28,
  borderRadius: "50%",
  background: "#e0edff",
  color: "#1d4ed8",
  fontSize: 14,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 1,
};

const chip = {
  fontSize: 13,
  color: "#0f766e",
  background: "rgba(15,118,110,.1)",
  padding: "4px 12px",
  borderRadius: 999,
  fontWeight: 500,
};
const dl = {
  margin: 0,
  border: "1px solid #e6eaf0",
  borderRadius: 14,
  overflow: "hidden",
  background: "#fff",
};
const dlRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  padding: "14px 18px",
  borderBottom: "1px solid #f1f5f9",
};
const dt = { color: "#64748b", fontSize: 15, minWidth: 190, margin: 0, fontWeight: 600 };
const dd = { margin: 0, fontSize: 16, lineHeight: 1.6, color: "#1f2937", flex: 1, minWidth: 220 };
const cta = {
  display: "inline-block",
  padding: "14px 28px",
  background: "#2563eb",
  color: "#fff",
  borderRadius: 12,
  textDecoration: "none",
  fontSize: 16,
  fontWeight: 600,
};
