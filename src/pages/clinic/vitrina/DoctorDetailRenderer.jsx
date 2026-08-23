// client/src/pages/clinic/vitrina/DoctorDetailRenderer.jsx
//
// ВИТРИНА — профиль врача ВНУТРИ сайта клиники:
//   /<slug>/doctors/:doctorId
//
// Раньше карточка врача вела на /public/doctor-profile/doctor-details/:id —
// страницу ПЛАТФОРМЫ, со своей шапкой и своим брендом. Посетитель уходил с
// сайта клиники ровно там, где клиника показывает главное. Здесь те же данные
// показаны в теме клиники, с её topbar/nav/footer и по её адресу — адрес
// настоящий, им можно поделиться, и он индексируется.
//
// Публикации врача ведут на /<slug>/publications/:id, то есть остаются внутри
// витрины, а не уводят обратно на платформу.

import React, { useEffect } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useVitrinaTheme } from "./theme/useVitrinaTheme.js";
import { getBlockComponent } from "./blocks/blockRegistry.js";
import {
  RTL_LANGS,
  resolveUrl,
  initials,
  formatDate,
  clinicBasePath,
} from "./lib/utils.js";
import DoctorReviews from "../../../components/shared/DoctorReviews";
import CommentSection from "../../../components/shared/CommentSection";
import { useViewer } from "./lib/useViewer.js";
import BookingWidget from "./components/BookingWidget.jsx";

const CHROME_TOP = new Set(["topbar", "nav"]);

const DOC_CSS = `
.vt-doc { min-height: 100vh; }
.vt-doc-main { max-width: 980px; margin: 0 auto; padding: 28px 24px 64px; font-family: var(--v-font-body); color: var(--v-text); }
.vt-doc-crumbs { font-size: 13px; color: var(--v-text-muted); margin-bottom: 20px; }
.vt-doc-crumbs a { color: var(--v-primary); text-decoration: none; }
.vt-doc-crumbs a:hover { text-decoration: underline; }

.vt-doc-head { display: grid; grid-template-columns: 260px 1fr; gap: 32px; align-items: start; margin-bottom: 40px; }
.vt-doc-photo { width: 100%; aspect-ratio: 1 / 1; border-radius: 20px; overflow: hidden; background: var(--v-surface-alt); border: 1px solid var(--v-border); }
.vt-doc-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.vt-doc-init { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-family: var(--v-font-heading); font-size: 64px; font-weight: 700; color: var(--v-primary); }
.vt-doc-name { font-family: var(--v-font-heading); font-size: clamp(26px, 4vw, 40px); font-weight: 700; line-height: 1.15; margin: 0 0 10px; display: flex; align-items: flex-start; gap: 8px; }
.vt-doc-vrf { color: var(--v-primary); font-size: 22px; flex-shrink: 0; }
.vt-doc-role { font-size: 17px; color: var(--v-text-muted); margin: 0 0 18px; }
.vt-doc-facts { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 22px; }
.vt-doc-fact { font-size: 13px; font-weight: 600; color: var(--v-text); background: var(--v-surface-alt); border: 1px solid var(--v-border); border-radius: 100px; padding: 7px 15px; }
.vt-doc-about { font-size: 16px; line-height: 1.7; white-space: pre-line; }

.vt-doc-pubs { margin-top: 8px; }
.vt-doc-pubs-title { font-family: var(--v-font-heading); font-size: 26px; font-weight: 700; margin: 0 0 20px; }
.vt-doc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 22px; }
.vt-doc-pub { display: block; text-decoration: none; color: inherit; background: var(--v-surface-alt); border: 1px solid var(--v-border); border-radius: 16px; overflow: hidden; transition: box-shadow .2s, transform .2s; }
.vt-doc-pub:hover { box-shadow: 0 10px 30px rgba(0,0,0,.08); transform: translateY(-3px); }
.vt-doc-pub-img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; display: block; background: var(--v-surface); }
.vt-doc-pub-body { padding: 14px 16px 18px; }
.vt-doc-pub-kind { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--v-primary); background: var(--v-surface); border-radius: 100px; padding: 4px 10px; margin-bottom: 10px; }
.vt-doc-pub-title { font-family: var(--v-font-heading); font-size: 17px; font-weight: 600; line-height: 1.3; margin-bottom: 8px; }
.vt-doc-pub-abs { font-size: 14px; color: var(--v-text-muted); line-height: 1.5; }
.vt-doc-pub-date { font-size: 12px; color: var(--v-text-muted); margin-top: 10px; }

.vt-doc-section { margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--v-border); }
.vt-doc-section-title { font-family: var(--v-font-heading); font-size: 26px; font-weight: 700; margin: 0 0 20px; }
.vt-doc-gate { text-align: center; padding: 30px 20px; background: var(--v-surface-alt); border: 1px solid var(--v-border); border-radius: 16px; }
.vt-doc-gate-ico { font-size: 38px; opacity: .5; margin-bottom: 10px; }
.vt-doc-gate-title { font-family: var(--v-font-heading); font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.vt-doc-gate-sub { font-size: 14px; color: var(--v-text-muted); line-height: 1.55; margin-bottom: 18px; }
.vt-doc-gate-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.vt-doc-gate-actions a { text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 100px; padding: 9px 20px; }
.vt-doc-gate-primary { background: var(--v-primary); color: var(--v-on-primary); }
.vt-doc-gate-ghost { border: 1px solid var(--v-border); color: var(--v-text); }

@media (max-width: 720px) {
  .vt-doc-head { grid-template-columns: 1fr; gap: 22px; }
  .vt-doc-photo { max-width: 240px; }
}
`;

export default function DoctorDetailRenderer({ clinic, doctor }) {
  const { i18n, t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const rootStyle = useVitrinaTheme(clinic?.theme);
  const slug = params.slug || clinic?.slug || "";
  const viewer = useViewer();

  // SEO страницы врача — тем же способом, что и на детейле статьи витрины.
  // Роботам без JS достаётся версия edge-функции, остальным — эта.
  const clinicName = clinic?.name || "";
  const name = doctor?.name || "";
  const about = doctor?.about || "";
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const prev = document.title;
    if (name) {
      document.title = clinicName ? `${name} — ${clinicName}` : name;
    }
    const desc = about.replace(/\s+/g, " ").trim().slice(0, 155);
    if (desc) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
      }
      m.setAttribute("content", desc);
    }
    return () => {
      document.title = prev;
    };
  }, [name, about, clinicName]);

  if (!clinic || !doctor) return null;

  const isRTL = RTL_LANGS.includes(i18n?.language);
  const base = clinicBasePath(location.pathname, slug);

  const vitrinaBlocks = Array.isArray(clinic.layout?.blocks)
    ? clinic.layout.blocks.filter((b) => b && b.visible !== false)
    : [];
  const topChrome = vitrinaBlocks
    .filter((b) => CHROME_TOP.has(b.type))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const footer = vitrinaBlocks.filter((b) => b.type === "footer");

  const renderBlock = (block, idx) => {
    const Component = getBlockComponent(block.type);
    if (!Component) return null;
    const key = block.id || `${block.type}-${block.order ?? idx}`;
    return <Component key={key} clinic={clinic} config={block.config || {}} />;
  };

  const photo = resolveUrl(doctor.profileImage);
  const publications = Array.isArray(doctor.publications)
    ? doctor.publications
    : [];

  return (
    <div
      className="vitrina-root vt-doc"
      dir={isRTL ? "rtl" : "ltr"}
      style={rootStyle}
    >
      <style>{DOC_CSS}</style>

      {topChrome.map(renderBlock)}

      <main className="vt-doc-main">
        <nav className="vt-doc-crumbs">
          <Link to={`${base}/doctors`}>
            ← {t("publicPage.doctorsTitle", { defaultValue: "Специалисты" })}
          </Link>
        </nav>

        <header className="vt-doc-head">
          <div className="vt-doc-photo">
            {photo ? (
              <img src={photo} alt={name} />
            ) : (
              <div className="vt-doc-init">{initials(name)}</div>
            )}
          </div>

          <div>
            <h1 className="vt-doc-name">
              {name}
              {doctor.isVerified && (
                <span
                  className="vt-doc-vrf"
                  title={t("publicPage.verified", {
                    defaultValue: "Профиль подтверждён",
                  })}
                >
                  ✔
                </span>
              )}
            </h1>

            {doctor.specialization && (
              <p className="vt-doc-role">{doctor.specialization}</p>
            )}

            <div className="vt-doc-facts">
              {doctor.experienceYears > 0 && (
                <span className="vt-doc-fact">
                  {t("publicPage.experienceYears", {
                    defaultValue: "Стаж {{count}} лет",
                    count: doctor.experienceYears,
                  })}
                </span>
              )}
              {doctor.country && (
                <span className="vt-doc-fact">{doctor.country}</span>
              )}
            </div>

            {about && <div className="vt-doc-about">{about}</div>}
          </div>
        </header>

        {/* Запись к врачу. Стоит сразу под карточкой, до публикаций: ради
            этого действия страницу врача чаще всего и открывают. */}
        <BookingWidget
          slug={slug}
          doctorId={doctor.id}
          doctorName={doctor.name}
        />

        {publications.length > 0 && (
          <section className="vt-doc-pubs">
            <h2 className="vt-doc-pubs-title">
              {t("publicPage.doctorPublications", {
                defaultValue: "Публикации врача",
              })}
            </h2>
            <div className="vt-doc-grid">
              {publications.map((p) => {
                const img = resolveUrl(p.imageUrl);
                return (
                  <Link
                    className="vt-doc-pub"
                    key={p.id}
                    to={`${base}/publications/${p.id}`}
                  >
                    {img && (
                      <img className="vt-doc-pub-img" src={img} alt={p.title} />
                    )}
                    <div className="vt-doc-pub-body">
                      <span className="vt-doc-pub-kind">
                        {p.kind === "scientific"
                          ? t("publicPage.kindScientific", {
                              defaultValue: "Научная",
                            })
                          : t("publicPage.kindOpinion", {
                              defaultValue: "Мнение",
                            })}
                      </span>
                      <div className="vt-doc-pub-title">{p.title}</div>
                      {p.abstract && (
                        <div className="vt-doc-pub-abs">{p.abstract}</div>
                      )}
                      {p.createdAt && (
                        <div className="vt-doc-pub-date">
                          {formatDate(p.createdAt, i18n?.language)}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Отзывы пациентов — тот же компонент и тот же источник, что на
            странице врача платформы: отзыв один, и расходиться списки не
            должны. Читать может любой, оставить — вошедший (компонент решает
            это сам). */}
        <section className="vt-doc-section">
          <h2 className="vt-doc-section-title">
            {t("publicPage.doctorReviews", { defaultValue: "Отзывы" })}
          </h2>
          <DoctorReviews doctorProfileId={doctor.id} />
        </section>

        {/* Комментарии врача — refId это DoctorProfile._id, ровно как на
            платформе. Гостю показываем приглашение, а не форму: форма без
            входа всё равно не отправится. */}
        <section className="vt-doc-section">
          <h2 className="vt-doc-section-title">
            {t("publicPage.commentsTitle", { defaultValue: "Комментарии" })}
          </h2>
          {!viewer.ready ? null : viewer.isAuthenticated ? (
            <CommentSection
              refId={doctor.id}
              userId={viewer.userId}
              targetType="Doctor"
            />
          ) : (
            <>
              {/* Гостю показываем только приглашение.
                  Режим чтения здесь пробовался и убран по факту проверки в
                  браузере: список комментариев отдаёт
                  GET /comments/add-comments/by-ref/:refId, а он закрыт
                  authMiddleware — гость получал пустой блок и 401 в консоли.
                  Чтобы обсуждение было видно с публичной страницы клиники,
                  эндпоинт нужно открывать намеренно: он раскрывает имена
                  комментаторов. */}
            <div className="vt-doc-gate">
              <div className="vt-doc-gate-ico">💬</div>
              <div className="vt-doc-gate-title">
                {t("publicPage.commentsGateTitle", {
                  defaultValue: "Присоединитесь к обсуждению",
                })}
              </div>
              <div className="vt-doc-gate-sub">
                {t("publicPage.commentsGateSubDoctor", {
                  defaultValue:
                    "Войдите в аккаунт DocPats, чтобы оставить комментарий врачу.",
                })}
              </div>
              <div className="vt-doc-gate-actions">
                <Link className="vt-doc-gate-primary" to="/login">
                  {t("publicPage.login", { defaultValue: "Войти" })}
                </Link>
                <Link className="vt-doc-gate-ghost" to="/registration">
                  {t("publicPage.register", {
                    defaultValue: "Зарегистрироваться",
                  })}
                </Link>
              </div>
            </div>
            </>
          )}
        </section>
      </main>

      {footer.map(renderBlock)}
    </div>
  );
}
