import { Link } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t, i18n } = useTranslation("AboutPage");
  const isRTL = i18n.language === "ar";

  // Arrays from translation file (returnObjects required for nested arrays)
  const platformRaw = t("platform.items", { returnObjects: true });
  const sourcesRaw = t("sources.items", { returnObjects: true });
  const policiesRaw = t("policy.items", { returnObjects: true });
  const platform = Array.isArray(platformRaw) ? platformRaw : [];
  const sources = Array.isArray(sourcesRaw) ? sourcesRaw : [];
  const policies = Array.isArray(policiesRaw) ? policiesRaw : [];

  return (
    <>
      <style>{CSS}</style>
      <div className="ab-page" dir={isRTL ? "rtl" : "ltr"}>
        {/* TOP BAR */}
        <div className="ab-topbar">
          <span>{t("topbar.left")}</span>
          <span>{t("topbar.right")}</span>
        </div>

        {/* NAV */}
        <nav className="ab-nav">
          <Link to="/public/news" className="ab-nav-back">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
            >
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("nav.back")}
          </Link>
          <Link to="/public/news" className="ab-nav-logo">
            Doc<span>Pats</span>
          </Link>
          <div className="ab-nav-right">
            <LanguageSwitcher />
            <span className="ab-nav-tag">{t("nav.tag")}</span>
          </div>
        </nav>

        {/* HERO */}
        <header className="ab-header">
          <div className="ab-header-inner">
            <div className="ab-label">{t("hero.label")}</div>
            <h1 className="ab-headline">{t("hero.headline")}</h1>
            <div className="ab-rule" />
            <p className="ab-deck">{t("hero.deck")}</p>
          </div>
        </header>

        {/* CONTENT */}
        <main className="ab-main">
          <div className="ab-main-inner">
            {/* WHAT DOCPATS IS — the platform, not just the editorial arm.
                Comes first: the reader needs to know what the project is
                before meeting the editor who runs one part of it. */}
            <section className="ab-section">
              <h2 className="ab-section-title">{t("platform.sectionTitle")}</h2>
              <p className="ab-text">{t("platform.lead")}</p>
              <div className="ab-plat-grid">
                {platform.map((p, i) => (
                  <div key={p.who || i} className="ab-plat-item">
                    <div className="ab-plat-who">{p.who}</div>
                    <p className="ab-plat-text">{p.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* MISSION */}
            <section className="ab-section">
              <h2 className="ab-section-title">{t("mission.sectionTitle")}</h2>
              <p className="ab-text">{t("mission.p1")}</p>
              <p className="ab-text">{t("mission.p2")}</p>
              <p className="ab-text">{t("mission.p3")}</p>
            </section>

            {/* EDITOR BLOCK — the editorial arm starts here; sources and
                policy below belong to it. */}
            <section className="ab-section">
              <h2 className="ab-section-title">{t("editor.sectionTitle")}</h2>
              <div className="ab-editor-card">
                <div className="ab-editor-avatar">{t("editor.avatar")}</div>
                <div className="ab-editor-info">
                  <div className="ab-editor-name">{t("editor.name")}</div>
                  <div className="ab-editor-title">{t("editor.title")}</div>
                  <p className="ab-editor-bio">{t("editor.bio")}</p>
                  <Link to="/public/news" className="ab-editor-profile">
                    {t("editor.profileLink")}
                  </Link>
                </div>
              </div>
            </section>

            {/* SOURCES */}
            <section className="ab-section">
              <h2 className="ab-section-title">{t("sources.sectionTitle")}</h2>
              <div className="ab-sources-grid">
                {sources.map((s, i) => (
                  <div key={s.name || i} className="ab-source-item">
                    <div className="ab-source-name">{s.name}</div>
                    <div className="ab-source-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* EDITORIAL POLICY */}
            <section className="ab-section">
              <h2 className="ab-section-title">{t("policy.sectionTitle")}</h2>
              <div className="ab-policy-list">
                {policies.map((p) => (
                  <div key={p.num} className="ab-policy-item">
                    <div className="ab-policy-num">{p.num}</div>
                    <div className="ab-policy-body">
                      <div className="ab-policy-title">{p.title}</div>
                      <p className="ab-policy-text">{p.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* DISCLAIMER */}
            <section className="ab-disclaimer">
              <div className="ab-disclaimer-icon">⚕</div>
              <div>
                <div className="ab-disclaimer-title">
                  {t("disclaimer.title")}
                </div>
                <p className="ab-disclaimer-text">{t("disclaimer.text")}</p>
              </div>
            </section>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="ab-footer">
          <div className="ab-footer-inner">
            <span className="ab-footer-logo">
              Doc<span>Pats</span>
            </span>
            <span className="ab-footer-tag">{t("footer.tag")}</span>
            <Link to="/public/articles" className="ab-footer-link">
              {t("footer.link")}
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&family=Noto+Naskh+Arabic:wght@400;500;700&family=Noto+Sans+Arabic:wght@300;400;500;600&display=swap');

.ab-page,.ab-page *,.ab-page *::before,.ab-page *::after{box-sizing:border-box}
.ab-page{
  --paper:#f7f4ee;--paper2:#ede9e0;--ink:#1c1a16;--ink2:#3a3830;
  --muted:#7a7668;--rule:#cdc9bc;
  --serif:'Playfair Display',Georgia,serif;
  --mono:'IBM Plex Mono','Courier New',monospace;
  --sans:'IBM Plex Sans',-apple-system,sans-serif;
  background:var(--paper);min-height:100vh;color:var(--ink);
  font-family:var(--sans);-webkit-font-smoothing:antialiased;
}

/* RTL: switch fonts to Arabic-supporting families */
.ab-page[dir="rtl"]{
  --serif:'Noto Naskh Arabic','Amiri',Georgia,serif;
  --sans:'Noto Sans Arabic','IBM Plex Sans',-apple-system,sans-serif;
}
.ab-page[dir="rtl"] .ab-nav-logo,
.ab-page[dir="rtl"] .ab-footer-logo{
  font-family:'Playfair Display',Georgia,serif!important;
}

.ab-topbar{
  background:var(--ink);color:#6a6660;padding:0 40px;height:32px;
  display:flex;align-items:center;justify-content:space-between;
  font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;
}
.ab-nav{
  position:sticky;top:0;z-index:200;background:var(--paper);
  border-bottom:3px double var(--ink);
  display:flex;align-items:center;justify-content:space-between;
  padding:0 40px;height:52px;gap:16px;
}
.ab-nav-back{
  display:flex;align-items:center;gap:6px;text-decoration:none;
  font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);transition:color .15s;
}
.ab-nav-back:hover{color:var(--ink)}
.ab-nav-logo{
  font-family:'Playfair Display',Georgia,serif!important;
  font-size:26px;font-weight:900;letter-spacing:-.02em;
  color:var(--ink);text-decoration:none;
}
.ab-nav-logo span{color:#b83030}
.ab-nav-right{
  display:flex;align-items:center;gap:12px;
}
.ab-nav-tag{
  font-family:var(--mono);font-size:10px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);
  border:1px solid var(--rule);padding:4px 12px;
}
.ab-header{background:var(--paper2);border-bottom:2px solid var(--ink);padding:52px 0 0}
.ab-header-inner{max-width:780px;margin:0 auto;padding:0 40px 44px}
.ab-label{
  font-family:var(--mono);font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);margin-bottom:20px;
}
.ab-headline{
  font-family:var(--serif);font-size:clamp(32px,4vw,56px);font-weight:700;
  letter-spacing:-.025em;line-height:1.1;color:var(--ink);margin:0 0 22px;
}
.ab-rule{height:4px;width:64px;background:#b83030;margin-bottom:20px}
.ab-deck{
  font-family:var(--serif);font-size:18px;font-style:italic;
  color:var(--ink2);line-height:1.65;margin:0;
}
/* Italic doesn't render well in Arabic — disable it */
.ab-page[dir="rtl"] .ab-deck{font-style:normal;font-weight:400}

.ab-main{padding:0}
.ab-main-inner{max-width:860px;margin:0 auto;padding:56px 40px 80px}
.ab-section{margin-bottom:56px;padding-bottom:56px;border-bottom:1px solid var(--rule)}
.ab-section:last-of-type{border-bottom:none}
.ab-section-title{
  font-family:var(--serif);font-size:28px;font-weight:700;
  letter-spacing:-.02em;color:var(--ink);margin:0 0 28px;
}
.ab-text{
  font-family:var(--sans);font-size:17px;font-weight:300;
  line-height:1.85;color:var(--ink2);margin:0 0 18px;
}
.ab-page[dir="rtl"] .ab-text{font-weight:400}

.ab-editor-card{
  display:flex;gap:24px;align-items:flex-start;
  background:var(--paper2);border:1px solid var(--rule);
  border-top:3px solid #b83030;padding:28px 32px;
}
.ab-editor-avatar{
  width:64px;height:64px;border-radius:50%;flex-shrink:0;
  background:#b83030;color:white;
  display:flex;align-items:center;justify-content:center;
  font-family:var(--serif);font-size:22px;font-weight:700;
}
.ab-editor-name{
  font-family:var(--serif);font-size:22px;font-weight:700;
  color:var(--ink);margin-bottom:4px;
}
.ab-editor-title{
  font-family:var(--mono);font-size:11px;letter-spacing:.06em;
  text-transform:uppercase;color:var(--muted);margin-bottom:14px;
}
/* Mono fonts don't include Arabic glyphs — fall back to sans */
.ab-page[dir="rtl"] .ab-editor-title,
.ab-page[dir="rtl"] .ab-nav-back,
.ab-page[dir="rtl"] .ab-nav-tag,
.ab-page[dir="rtl"] .ab-label,
.ab-page[dir="rtl"] .ab-footer-tag,
.ab-page[dir="rtl"] .ab-footer-link,
.ab-page[dir="rtl"] .ab-editor-profile,
.ab-page[dir="rtl"] .ab-topbar{
  font-family:var(--sans);text-transform:none;letter-spacing:0;
}

.ab-editor-bio{
  font-family:var(--sans);font-size:15px;font-weight:300;
  line-height:1.75;color:var(--ink2);margin:0 0 16px;
}
.ab-page[dir="rtl"] .ab-editor-bio,
.ab-page[dir="rtl"] .ab-policy-text,
.ab-page[dir="rtl"] .ab-source-desc,
.ab-page[dir="rtl"] .ab-disclaimer-text{font-weight:400}

.ab-editor-profile{
  font-family:var(--mono);font-size:11px;letter-spacing:.08em;
  text-transform:uppercase;color:#b83030;text-decoration:none;
  border-bottom:1px solid #b83030;padding-bottom:2px;
  transition:opacity .15s;
}
.ab-editor-profile:hover{opacity:.7}
/* «Что такое DocPats»: четыре карточки по аудиториям. Своя сетка, а не
   ab-sources-grid — там короткие подписи в две строки, здесь абзац. */
.ab-plat-grid{
  display:grid;grid-template-columns:repeat(2,1fr);gap:2px;margin-top:26px;
}
.ab-plat-item{
  background:var(--paper2);border:1px solid var(--rule);
  border-top:3px solid #b83030;padding:20px 22px;
}
.ab-plat-who{
  font-family:var(--mono);font-size:10px;letter-spacing:.12em;
  text-transform:uppercase;color:#b83030;margin-bottom:10px;
}
.ab-page[dir="rtl"] .ab-plat-who{
  font-family:var(--sans);text-transform:none;letter-spacing:0;font-weight:600;
}
.ab-plat-text{
  font-family:var(--sans);font-size:14px;font-weight:300;
  line-height:1.75;color:var(--ink2);margin:0;
}
.ab-page[dir="rtl"] .ab-plat-text{font-weight:400}

.ab-sources-grid{
  display:grid;grid-template-columns:repeat(2,1fr);gap:2px;
}
.ab-source-item{
  background:var(--paper2);padding:18px 20px;
  border:1px solid var(--rule);
}
.ab-source-name{
  font-family:var(--serif);font-size:15px;font-weight:700;
  color:var(--ink);margin-bottom:4px;
}
.ab-source-desc{
  font-family:var(--sans);font-size:13px;font-weight:300;
  color:var(--muted);
}
.ab-policy-list{display:flex;flex-direction:column;gap:0}
.ab-policy-item{
  display:flex;gap:24px;padding:24px 0;
  border-bottom:1px solid var(--rule);
}
.ab-policy-item:last-child{border-bottom:none}
.ab-policy-num{
  font-family:'IBM Plex Mono','Courier New',monospace;
  font-size:13px;font-weight:500;
  color:var(--muted);flex-shrink:0;width:32px;padding-top:2px;
}
.ab-policy-title{
  font-family:var(--serif);font-size:17px;font-weight:700;
  color:var(--ink);margin-bottom:8px;
}
.ab-policy-text{
  font-family:var(--sans);font-size:15px;font-weight:300;
  line-height:1.75;color:var(--ink2);margin:0;
}
.ab-disclaimer{
  display:flex;gap:20px;align-items:flex-start;
  background:var(--paper2);border:1px solid var(--rule);
  border-left:4px solid #b83030;padding:24px 28px;
}
.ab-page[dir="rtl"] .ab-disclaimer{
  border-left:1px solid var(--rule);
  border-right:4px solid #b83030;
}
.ab-disclaimer-icon{font-size:24px;flex-shrink:0;margin-top:2px}
.ab-disclaimer-title{
  font-family:var(--serif);font-size:16px;font-weight:700;
  color:var(--ink);margin-bottom:10px;
}
.ab-disclaimer-text{
  font-family:var(--sans);font-size:14px;font-weight:300;
  line-height:1.75;color:var(--ink2);margin:0;
}
.ab-footer{border-top:2px solid var(--ink);background:var(--paper2);padding:28px 0}
.ab-footer-inner{
  max-width:860px;margin:0 auto;padding:0 40px;
  display:flex;align-items:center;gap:16px;flex-wrap:wrap;
}
.ab-footer-logo{
  font-family:'Playfair Display',Georgia,serif!important;
  font-size:22px;font-weight:900;color:var(--ink);
}
.ab-footer-logo span{color:#b83030}
.ab-footer-tag{
  font-family:var(--mono);font-size:10px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--muted);flex:1;
}
.ab-footer-link{
  font-family:var(--mono);font-size:10px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);text-decoration:none;
  border:1px solid var(--rule);padding:6px 14px;transition:all .15s;
}
.ab-footer-link:hover{color:var(--ink);border-color:var(--ink)}
@media(max-width:768px){
  .ab-topbar,.ab-nav{padding:0 20px}
  .ab-header-inner,.ab-main-inner,.ab-footer-inner{padding-left:20px;padding-right:20px}
  .ab-sources-grid,.ab-plat-grid{grid-template-columns:1fr}
  .ab-editor-card{flex-direction:column}
  .ab-nav-tag{display:none}
}
@media(max-width:480px){
  .ab-topbar{display:none}
  .ab-nav{padding:0 14px}
  .ab-header-inner,.ab-main-inner,.ab-footer-inner{padding-left:14px;padding-right:14px}
  .ab-headline{font-size:28px}
}
`;
