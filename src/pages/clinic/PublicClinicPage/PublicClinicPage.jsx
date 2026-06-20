// client/src/pages/clinic/PublicClinicPage/PublicClinicPage.jsx
//
// Clinic-as-Brand — публичная страница клиники /<prefix>/:slug.
// Гостевая, БЕЗ авторизации и БЕЗ ClinicLayout. Данные: getPublicClinicPage(slug)
// → GET /api/v1/public/clinics/:slug (DTO напрямую).
//
// Блоки: 1) шапка (+ переключатель языка) · 2) описание · 3) врачи ·
//        4) отзывы (C) · 5) публикации (D) · 6) галерея (B) · 7) контакты.
// Отзывы и публикации используют namespace "clinicReviews" (хук tr).

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPublicClinicPage } from "../../../api/clinic";

/* ─────────────────────────── STYLES ─────────────────────────── */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

.pcp {
  --cream:#faf8f4; --cream2:#f3efe8; --ink:#1c1917; --ink2:#44403c; --ink3:#78716c;
  --teal:#0f766e; --teal-mid:#0d9488; --teal-pale:#f0fdfa; --teal-border:#99f6e4;
  --border:#e7e2d8; --border2:#d6d0c6; --amber:#f59e0b;
  --sh-sm:0 2px 8px rgba(28,25,23,.07),0 1px 3px rgba(28,25,23,.04);
  --sh-md:0 8px 24px rgba(28,25,23,.09),0 2px 8px rgba(28,25,23,.04);
  --radius:18px; --radius-sm:12px;
  --font-d:'Lora',Georgia,serif; --font-b:'Plus Jakarta Sans',system-ui,sans-serif;
  background:var(--cream); min-height:100vh; font-family:var(--font-b); color:var(--ink);
}

/* HERO */
.pcp-hero { background:linear-gradient(150deg,#0c4a6e 0%,#0f766e 60%,#065f46 100%); padding:56px 32px 90px; position:relative; overflow:hidden; }
.pcp-hero::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 700px 400px at 88% 30%,rgba(20,184,166,.18) 0%,transparent 65%); pointer-events:none; }
.pcp-hero::after { content:''; position:absolute; bottom:-1px; left:0; right:0; height:56px; background:var(--cream); clip-path:ellipse(60% 100% at 50% 100%); }
.pcp-hero-in { max-width:1040px; margin:0 auto; position:relative; z-index:1; display:flex; align-items:flex-end; gap:24px; flex-wrap:wrap; }
.pcp-logo { width:104px; height:104px; border-radius:24px; overflow:hidden; border:3px solid rgba(255,255,255,.35); box-shadow:0 8px 32px rgba(0,0,0,.2); flex-shrink:0; background:rgba(255,255,255,.12); }
.pcp-logo img { width:100%; height:100%; object-fit:cover; display:block; }
.pcp-logo-init { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-family:var(--font-d); font-size:38px; font-weight:700; color:rgba(255,255,255,.75); }
.pcp-hero-info { flex:1; min-width:0; }
.pcp-hero-name { font-family:var(--font-d); font-size:clamp(24px,3.4vw,38px); font-weight:700; color:#fff; line-height:1.18; letter-spacing:-.015em; margin:0 0 10px; }
.pcp-hero-meta { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
.pcp-chip { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2); color:rgba(255,255,255,.9); font-size:12px; font-weight:500; padding:5px 13px; border-radius:100px; }
.pcp-verified { background:rgba(94,234,212,.16); border-color:rgba(94,234,212,.4); color:#5eead4; font-weight:600; }
.pcp-verified::before { content:''; width:6px; height:6px; background:#5eead4; border-radius:50%; }
.pcp-rating-chip { background:rgba(245,158,11,.16); border-color:rgba(245,158,11,.4); color:#fcd34d; font-weight:600; }

/* LANG SWITCH (витрина) */
.pcp-lang { position:absolute; top:20px; right:24px; z-index:3; display:flex; gap:4px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.22); padding:4px; border-radius:100px; backdrop-filter:blur(6px); }
.pcp[dir='rtl'] .pcp-lang { right:auto; left:24px; }
.pcp-lang-btn { border:none; background:transparent; color:rgba(255,255,255,.75); font-family:var(--font-b); font-size:11px; font-weight:600; letter-spacing:.04em; padding:5px 9px; border-radius:100px; cursor:pointer; transition:all .15s; text-transform:uppercase; line-height:1; }
.pcp-lang-btn:hover { color:#fff; background:rgba(255,255,255,.14); }
.pcp-lang-btn.active { color:var(--teal); background:#fff; }
@media(max-width:640px){ .pcp-lang { top:14px; right:14px; } .pcp[dir='rtl'] .pcp-lang { left:14px; right:auto; } .pcp-lang-btn { padding:4px 7px; font-size:10px; } }

/* BODY */
.pcp-body { max-width:1040px; margin:0 auto; padding:0 32px 80px; position:relative; z-index:2; }
@media(max-width:640px){ .pcp-body{ padding:0 16px 60px; } .pcp-hero{ padding:44px 18px 80px; } }

.pcp-card { background:#fff; border:1px solid var(--border); border-radius:var(--radius); box-shadow:var(--sh-sm); overflow:hidden; margin-bottom:22px; }
.pcp-card-head { padding:18px 26px 14px; border-bottom:1px solid var(--border); background:var(--cream2); display:flex; align-items:center; justify-content:space-between; gap:12px; }
.pcp-card-title { font-family:var(--font-d); font-size:18px; font-weight:600; color:var(--ink); margin:0; }
.pcp-card-body { padding:24px 26px; }

.pcp-specs { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
.pcp-spec { font-size:12px; font-weight:600; color:var(--teal); background:var(--teal-pale); border:1px solid var(--teal-border); padding:5px 13px; border-radius:100px; }

.pcp-about { font-family:var(--font-d); font-size:15.5px; color:var(--ink2); line-height:1.85; white-space:pre-wrap; word-break:break-word; }

/* DOCTORS */
.pcp-docs { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:18px; }
.pcp-doc { display:flex; flex-direction:column; align-items:center; text-align:center; background:#fff; border:1px solid var(--border); border-radius:var(--radius-sm); padding:22px 18px; text-decoration:none; color:inherit; transition:all .2s cubic-bezier(.4,0,.2,1); }
.pcp-doc:hover { box-shadow:var(--sh-md); border-color:var(--teal-border); transform:translateY(-3px); }
.pcp-doc-av { width:88px; height:88px; border-radius:50%; object-fit:cover; border:3px solid #fff; box-shadow:0 4px 16px rgba(15,118,110,.16); margin-bottom:12px; background:var(--cream2); }
.pcp-doc-av-init { width:88px; height:88px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:var(--font-d); font-size:28px; font-weight:700; color:var(--teal); background:var(--teal-pale); border:3px solid #fff; box-shadow:0 4px 16px rgba(15,118,110,.16); margin-bottom:12px; }
.pcp-doc-name { font-family:var(--font-d); font-size:15px; font-weight:600; color:var(--ink); margin-bottom:4px; display:flex; align-items:center; gap:6px; justify-content:center; }
.pcp-doc-vrf { color:var(--teal); font-size:13px; }
.pcp-doc-spec { font-size:12.5px; color:var(--ink3); margin-bottom:8px; }
.pcp-doc-about { font-size:12px; color:var(--ink3); line-height:1.5; }

/* REVIEWS (этап C) */
.pcp-rating-summary { display:flex; align-items:center; gap:14px; margin-bottom:20px; flex-wrap:wrap; }
.pcp-rating-big { font-family:var(--font-d); font-size:46px; font-weight:700; color:var(--ink); line-height:1; }
.pcp-rating-side { display:flex; flex-direction:column; gap:4px; }
.pcp-stars-row { display:inline-flex; gap:2px; font-size:20px; color:#d6d0c6; line-height:1; }
.pcp-stars-row .on { color:var(--amber); }
.pcp-rating-count { font-size:13px; color:var(--ink3); }
.pcp-reviews-list { display:flex; flex-direction:column; gap:14px; }
.pcp-review { border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px 18px; background:var(--cream); }
.pcp-review-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
.pcp-review-author { font-size:14px; font-weight:600; color:var(--ink); }
.pcp-review-stars { display:inline-flex; gap:2px; font-size:14px; color:#d6d0c6; line-height:1; }
.pcp-review-stars .on { color:var(--amber); }
.pcp-review-date { font-size:11.5px; color:var(--ink3); }
.pcp-review-text { font-size:14px; color:var(--ink2); line-height:1.65; white-space:pre-wrap; word-break:break-word; }

/* GALLERY */
.pcp-gallery { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
.pcp-gal-item { position:relative; border-radius:var(--radius-sm); overflow:hidden; aspect-ratio:4/3; background:var(--cream2); border:1px solid var(--border); }
.pcp-gal-item img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .3s ease; }
.pcp-gal-item:hover img { transform:scale(1.06); }
.pcp-gal-cap { position:absolute; left:0; right:0; bottom:0; padding:8px 10px; font-size:11px; color:#fff; background:linear-gradient(0deg,rgba(0,0,0,.6),transparent); }

/* CONTACTS */
.pcp-contacts { display:flex; flex-wrap:wrap; gap:10px 22px; }
.pcp-contact { display:inline-flex; align-items:center; gap:8px; font-size:14px; color:var(--ink2); text-decoration:none; }
.pcp-contact a { color:var(--teal); text-decoration:none; }
.pcp-contact a:hover { text-decoration:underline; }

/* STATES */
.pcp-state { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:70vh; gap:16px; font-size:15px; color:var(--ink3); text-align:center; padding:24px; }
.pcp-state-ico { font-size:48px; opacity:.4; }
.pcp-state-title { font-family:var(--font-d); font-size:22px; font-weight:600; color:var(--ink2); }
.pcp-spinner { width:46px; height:46px; border:3px solid var(--cream2); border-top-color:var(--teal); border-radius:50%; animation:pcp-spin .7s linear infinite; }
@keyframes pcp-spin { to{ transform:rotate(360deg) } }

/* PUBLICATIONS (этап D) */
.pcp-pubs { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
.pcp-pub { display:flex; flex-direction:column; background:#fff; border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; text-decoration:none; color:inherit; transition:all .2s cubic-bezier(.4,0,.2,1); }
.pcp-pub:hover { box-shadow:var(--sh-md); border-color:var(--teal-border); transform:translateY(-3px); }
.pcp-pub-img { width:100%; height:148px; object-fit:cover; background:var(--cream2); }
.pcp-pub-body { padding:14px 16px; display:flex; flex-direction:column; gap:6px; }
.pcp-pub-title { font-family:var(--font-d); font-size:15px; font-weight:600; color:var(--ink); line-height:1.35; }
.pcp-pub-abstract { font-size:13px; color:var(--ink3); line-height:1.5; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.pcp-pub-meta { display:flex; gap:12px; font-size:12px; color:var(--ink3); margin-top:2px; }
`;

/* ─────────────────────────── HELPERS ─────────────────────────── */
const API_BASE = process.env.REACT_APP_API_URL || "";

const LANGS = ["ru", "en", "tr", "az", "ar"];

function resolveUrl(u) {
  if (!u) return null;
  const s = String(u).trim();
  if (/^https?:\/\//.test(s)) return s;
  const base = API_BASE.replace(/\/+$/, "");
  return base ? `${base}/${s.replace(/^\/+/, "")}` : s;
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function Stars({ value, className }) {
  const v = Math.round(Number(value) || 0);
  return (
    <span className={className}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= v ? "on" : ""}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(dateStr, lang) {
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

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function PublicClinicPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { t: tr } = useTranslation("clinicReviews"); // namespace отзывов
  const isRTL = i18n.language === "ar";

  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    setError(false);

    getPublicClinicPage(slug)
      .then((data) => {
        if (!alive) return;
        setClinic(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        if (err?.response?.status === 404) setNotFound(true);
        else setError(true);
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [slug]);

  // Компактный переключатель языка (используется во всех состояниях шапки)
  const langSwitch = (
    <div className="pcp-lang">
      {LANGS.map((lng) => (
        <button
          key={lng}
          type="button"
          className={"pcp-lang-btn" + (i18n.language === lng ? " active" : "")}
          onClick={() => i18n.changeLanguage(lng)}
        >
          {lng}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="pcp" dir={isRTL ? "rtl" : "ltr"}>
        <style>{styles}</style>
        <div className="pcp-state">
          <div className="pcp-spinner" />
          <span>
            {t("publicClinic.loading", { defaultValue: "Загрузка…" })}
          </span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="pcp" dir={isRTL ? "rtl" : "ltr"}>
        <style>{styles}</style>
        <div className="pcp-state">
          <span className="pcp-state-ico">🏥</span>
          <div className="pcp-state-title">
            {t("publicClinic.notFoundTitle", {
              defaultValue: "Клиника не найдена",
            })}
          </div>
          <span>
            {t("publicClinic.notFoundText", {
              defaultValue:
                "Возможно, страница ещё не опубликована или адрес введён неверно.",
            })}
          </span>
        </div>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="pcp" dir={isRTL ? "rtl" : "ltr"}>
        <style>{styles}</style>
        <div className="pcp-state">
          <span className="pcp-state-ico">⚠</span>
          <span>
            {t("publicClinic.error", {
              defaultValue: "Не удалось загрузить страницу. Попробуйте позже.",
            })}
          </span>
        </div>
      </div>
    );
  }

  const {
    name,
    isVerified,
    logo,
    description,
    gallery = [],
    address = {},
    specializations = [],
    contacts = {},
    doctors = [],
    rating = { avg: 0, count: 0 },
    reviews = [],
    publications = [],
  } = clinic;

  const cityLine = [address.city, address.country].filter(Boolean).join(", ");
  const logoUrl = resolveUrl(logo);
  const hasReviews = (rating?.count || 0) > 0 && reviews.length > 0;
  const hasPublications =
    Array.isArray(publications) && publications.length > 0;

  return (
    <div className="pcp" dir={isRTL ? "rtl" : "ltr"}>
      <style>{styles}</style>

      {/* ── HERO ── */}
      <div className="pcp-hero">
        {langSwitch}
        <div className="pcp-hero-in">
          <div className="pcp-logo">
            {logoUrl ? (
              <img src={logoUrl} alt={name} />
            ) : (
              <div className="pcp-logo-init">{initials(name)}</div>
            )}
          </div>
          <div className="pcp-hero-info">
            <h1 className="pcp-hero-name">{name}</h1>
            <div className="pcp-hero-meta">
              {isVerified && (
                <span className="pcp-chip pcp-verified">
                  {t("publicClinic.verified", { defaultValue: "Подтверждена" })}
                </span>
              )}
              {hasReviews && (
                <span className="pcp-chip pcp-rating-chip">
                  ★ {rating.avg} · {rating.count}
                </span>
              )}
              {cityLine && <span className="pcp-chip">📍 {cityLine}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="pcp-body">
        {/* description + specializations */}
        {(description || specializations.length > 0) && (
          <div className="pcp-card">
            <div className="pcp-card-head">
              <h2 className="pcp-card-title">
                {t("publicClinic.aboutTitle", { defaultValue: "О клинике" })}
              </h2>
            </div>
            <div className="pcp-card-body">
              {description && <div className="pcp-about">{description}</div>}
              {specializations.length > 0 && (
                <div className="pcp-specs">
                  {specializations.map((s, i) => (
                    <span className="pcp-spec" key={i}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* doctors */}
        {doctors.length > 0 && (
          <div className="pcp-card">
            <div className="pcp-card-head">
              <h2 className="pcp-card-title">
                {t("publicClinic.doctorsTitle", { defaultValue: "Врачи" })}
              </h2>
            </div>
            <div className="pcp-card-body">
              <div className="pcp-docs">
                {doctors.map((d) => {
                  const img = resolveUrl(d.profileImage);
                  const inner = (
                    <>
                      {img ? (
                        <img className="pcp-doc-av" src={img} alt={d.name} />
                      ) : (
                        <div className="pcp-doc-av-init">
                          {initials(d.name)}
                        </div>
                      )}
                      <div className="pcp-doc-name">
                        {d.name || "—"}
                        {d.isVerified && (
                          <span
                            className="pcp-doc-vrf"
                            title={t("publicClinic.verifiedDoctor", {
                              defaultValue: "Подтверждённый врач",
                            })}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      {d.specialization && (
                        <div className="pcp-doc-spec">{d.specialization}</div>
                      )}
                      {d.about && (
                        <div className="pcp-doc-about">{d.about}</div>
                      )}
                    </>
                  );

                  return d.profileUrl ? (
                    <Link className="pcp-doc" to={d.profileUrl} key={d.userId}>
                      {inner}
                    </Link>
                  ) : (
                    <div className="pcp-doc" key={d.userId}>
                      {inner}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* reviews (этап C) — namespace clinicReviews */}
        {hasReviews && (
          <div className="pcp-card">
            <div className="pcp-card-head">
              <h2 className="pcp-card-title">{tr("sectionTitle")}</h2>
            </div>
            <div className="pcp-card-body">
              <div className="pcp-rating-summary">
                <div className="pcp-rating-big">{rating.avg}</div>
                <div className="pcp-rating-side">
                  <Stars value={rating.avg} className="pcp-stars-row" />
                  <span className="pcp-rating-count">
                    {tr("count", { count: rating.count })}
                  </span>
                </div>
              </div>

              <div className="pcp-reviews-list">
                {reviews.map((r) => (
                  <div className="pcp-review" key={r.id}>
                    <div className="pcp-review-head">
                      <span className="pcp-review-author">{r.authorName}</span>
                      <Stars value={r.rating} className="pcp-review-stars" />
                    </div>
                    {r.text && <div className="pcp-review-text">{r.text}</div>}
                    {r.createdAt && (
                      <div className="pcp-review-date">
                        {formatDate(r.createdAt, i18n.language)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* publications (этап D) — namespace clinicReviews */}
        {hasPublications && (
          <div className="pcp-card">
            <div className="pcp-card-head">
              <h2 className="pcp-card-title">{tr("publicationsTitle")}</h2>
            </div>
            <div className="pcp-card-body">
              <div className="pcp-pubs">
                {publications.map((p) => (
                  <a className="pcp-pub" href={p.url} key={p.id}>
                    {resolveUrl(p.imageUrl) && (
                      <img
                        className="pcp-pub-img"
                        src={resolveUrl(p.imageUrl)}
                        alt={p.title}
                      />
                    )}
                    <div className="pcp-pub-body">
                      <div className="pcp-pub-title">{p.title}</div>
                      {p.abstract && (
                        <div className="pcp-pub-abstract">{p.abstract}</div>
                      )}
                      <div className="pcp-pub-meta">
                        {p.authorName && <span>{p.authorName}</span>}
                        {p.readTime > 0 && (
                          <span>{tr("readTime", { count: p.readTime })}</span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* gallery (этап B) */}
        {gallery.length > 0 && (
          <div className="pcp-card">
            <div className="pcp-card-head">
              <h2 className="pcp-card-title">
                {t("publicClinic.galleryTitle", { defaultValue: "Галерея" })}
              </h2>
            </div>
            <div className="pcp-card-body">
              <div className="pcp-gallery">
                {gallery.map((g) => {
                  const src = resolveUrl(g.url);
                  if (!src) return null;
                  return (
                    <div className="pcp-gal-item" key={g.id || src}>
                      <img src={src} alt={g.caption || name} />
                      {g.caption && (
                        <div className="pcp-gal-cap">{g.caption}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* contacts */}
        {(contacts.phone || contacts.email || contacts.website) && (
          <div className="pcp-card">
            <div className="pcp-card-head">
              <h2 className="pcp-card-title">
                {t("publicClinic.contactsTitle", { defaultValue: "Контакты" })}
              </h2>
            </div>
            <div className="pcp-card-body">
              <div className="pcp-contacts">
                {contacts.phone && (
                  <span className="pcp-contact">
                    📞{" "}
                    <a href={`tel:${contacts.phone}`} dir="ltr">
                      {contacts.phone}
                    </a>
                  </span>
                )}
                {contacts.email && (
                  <span className="pcp-contact">
                    ✉️ <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
                  </span>
                )}
                {contacts.website && (
                  <span className="pcp-contact">
                    🌐{" "}
                    <a
                      href={contacts.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {contacts.website}
                    </a>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
