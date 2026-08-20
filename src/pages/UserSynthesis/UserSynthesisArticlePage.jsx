import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { getMyArticle } from "../../api/userSynthesis";

export default function UserSynthesisArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("UserSynthesis");
  const [article, setArticle] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | not_found | error
  const [error, setError] = useState("");

  const isRTL = i18n.language === "ar";

  const dateLocaleMap = {
    ru: "ru-RU",
    en: "en-GB",
    az: "az-AZ",
    tr: "tr-TR",
    ar: "ar-AE",
  };
  const dateLocale = dateLocaleMap[i18n.language] || "ru-RU";

  useEffect(() => {
    let mounted = true;
    setStatus("loading");

    getMyArticle(id)
      .then((r) => {
        if (!mounted) return;
        if (r.data?.success && r.data?.article) {
          setArticle(r.data.article);
          setStatus("ok");
        } else {
          setStatus("not_found");
        }
      })
      .catch((err) => {
        if (!mounted) return;
        const code = err?.response?.status;
        if (code === 404) {
          setStatus("not_found");
        } else if (code === 401) {
          setStatus("error");
          setError(t("article.notAuthorized"));
        } else {
          setStatus("error");
          setError(err?.response?.data?.message || t("article.loadError"));
        }
      });

    return () => {
      mounted = false;
    };
  }, [id, t]);

  // ─── Print / Copy ───
  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    if (!article?.body) return;
    try {
      await navigator.clipboard.writeText(article.body);
      alert(t("article.copied"));
    } catch {
      alert(t("article.copyFailed"));
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="usa-page" dir={isRTL ? "rtl" : "ltr"}>
        {/* TOPBAR */}
        <div className="usa-topbar">
          <span>{t("topbar.brand")}</span>
          <span>{t("article.topbarTag")}</span>
        </div>

        {/* NAV */}
        <nav className="usa-nav">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="usa-nav-back"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("nav.back")}
          </button>
          <Link to="/news" className="usa-nav-logo">
            Doc<span>Pats</span>
          </Link>
          <Link to="/public/user-synthesis" className="usa-nav-tag">
            {t("article.newArticleCta")}
          </Link>
        </nav>

        {/* CONTENT */}
        <main className="usa-main">
          <div className="usa-main-inner">
            {/* LOADING */}
            {status === "loading" && (
              <div className="usa-state">
                <div className="usa-state-text">{t("article.loading")}</div>
              </div>
            )}

            {/* NOT FOUND */}
            {status === "not_found" && (
              <div className="usa-state">
                <div className="usa-state-title">
                  {t("article.notFoundTitle")}
                </div>
                <div className="usa-state-text">
                  {t("article.notFoundText")}
                </div>
                <Link to="/public/user-synthesis" className="usa-state-cta">
                  {t("article.backToCreate")}
                </Link>
              </div>
            )}

            {/* ERROR */}
            {status === "error" && (
              <div className="usa-state">
                <div className="usa-state-title usa-state-error">
                  {t("article.errorTitle")}
                </div>
                <div className="usa-state-text">{error}</div>
                <Link to="/public/user-synthesis" className="usa-state-cta">
                  {t("article.backToCreate")}
                </Link>
              </div>
            )}

            {/* ARTICLE */}
            {status === "ok" && article && (
              <article className="usa-article">
                <div className="usa-meta-bar">
                  <div className="usa-meta-left">
                    <span className="usa-meta-date">
                      {new Date(article.createdAt).toLocaleDateString(
                        dateLocale,
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </span>
                    <span className="usa-meta-sep">·</span>
                    <span className="usa-meta-words">
                      {t("article.wordsCount", {
                        count: article.wordCount || 0,
                        words:
                          article.wordCount?.toLocaleString(dateLocale) || 0,
                      })}
                    </span>
                    {article.language && (
                      <>
                        <span className="usa-meta-sep">·</span>
                        <span className="usa-meta-lang">
                          {article.language.toUpperCase()}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="usa-meta-right">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="usa-action-btn"
                    >
                      {t("article.copy")}
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="usa-action-btn"
                    >
                      {t("article.print")}
                    </button>
                  </div>
                </div>

                <h1 className="usa-title">{article.title}</h1>

                {article.abstract && (
                  <p className="usa-abstract">{article.abstract}</p>
                )}

                {Array.isArray(article.tags) && article.tags.length > 0 && (
                  <div className="usa-tags">
                    {article.tags.map((tg, i) => (
                      <span key={i} className="usa-tag">
                        {tg}
                      </span>
                    ))}
                  </div>
                )}

                <div className="usa-rule" />

                <div className="usa-body">
                  <ReactMarkdown>{article.body || ""}</ReactMarkdown>
                </div>

                {Array.isArray(article.sources) &&
                  article.sources.length > 0 && (
                    <div className="usa-sources-block">
                      <div className="usa-sources-title">
                        {t("article.sourcesUsed")}
                      </div>
                      <ol className="usa-sources-list">
                        {article.sources.map((s, i) => (
                          <li key={i}>
                            {s.url ? (
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {s.title || s.url}
                              </a>
                            ) : (
                              <span>{s.title || "—"}</span>
                            )}
                            {s.authors && (
                              <span className="usa-source-meta">
                                {" "}
                                · {s.authors}
                              </span>
                            )}
                            {s.year && (
                              <span className="usa-source-meta">
                                {" "}
                                · {s.year}
                              </span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
              </article>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
.usa-page*,.usa-page *::before,.usa-page *::after{box-sizing:border-box}
.usa-page{
  --paper:#f7f4ee;--paper2:#ede9e0;--ink:#1c1a16;--ink2:#3a3830;
  --muted:#7a7668;--rule:#cdc9bc;--accent:#b83030;
  --serif:'Playfair Display',Georgia,serif;
  --mono:'IBM Plex Mono','Courier New',monospace;
  --sans:'IBM Plex Sans',-apple-system,sans-serif;
  background:var(--paper);min-height:100vh;color:var(--ink);
  font-family:var(--sans);-webkit-font-smoothing:antialiased;
}
.usa-topbar{background:var(--ink);color:#6a6660;padding:0 40px;height:32px;
  display:flex;align-items:center;justify-content:space-between;
  font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.usa-nav{position:sticky;top:0;z-index:200;background:var(--paper);
  border-bottom:3px double var(--ink);display:flex;align-items:center;
  justify-content:space-between;padding:0 40px;height:52px}
.usa-nav-back{display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;
  font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);transition:color .15s;padding:0}
.usa-nav-back:hover{color:var(--ink)}
.usa-nav-logo{font-family:'Playfair Display',Georgia,serif!important;
  font-size:26px;font-weight:900;letter-spacing:-.02em;color:var(--ink);text-decoration:none}
.usa-nav-logo span{color:var(--accent)}
.usa-nav-tag{font-family:var(--mono);font-size:10px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--accent);border:1px solid var(--accent);padding:4px 12px;
  text-decoration:none;transition:all .15s}
.usa-nav-tag:hover{background:var(--accent);color:#fff}

.usa-main{padding:0}
.usa-main-inner{max-width:760px;margin:0 auto;padding:48px 40px 96px}

/* ── States ── */
.usa-state{
  text-align:center;padding:80px 20px;
}
.usa-state-title{
  font-family:var(--serif);font-size:32px;font-weight:700;color:var(--ink);
  margin-bottom:12px;
}
.usa-state-error{color:var(--accent)}
.usa-state-text{font-size:15px;color:var(--muted);margin-bottom:24px;line-height:1.6}
.usa-state-cta{
  display:inline-block;padding:12px 24px;
  font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;
  background:var(--ink);color:var(--paper);text-decoration:none;
}
.usa-state-cta:hover{background:#3a3830}

/* ── Meta bar ── */
.usa-meta-bar{
  display:flex;align-items:center;justify-content:space-between;
  flex-wrap:wrap;gap:14px;
  padding:12px 0;
  border-bottom:1px solid var(--rule);
  margin-bottom:28px;
  font-family:var(--mono);font-size:11px;
}
.usa-meta-left{display:flex;align-items:center;gap:8px;color:var(--muted);flex-wrap:wrap}
.usa-meta-sep{color:var(--rule)}
.usa-meta-right{display:flex;gap:8px}
.usa-action-btn{
  font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;
  background:none;border:1px solid var(--rule);color:var(--muted);
  padding:5px 12px;cursor:pointer;transition:all .15s;
}
.usa-action-btn:hover{color:var(--ink);border-color:var(--ink2)}

/* ── Title & abstract ── */
.usa-title{
  font-family:var(--serif);font-size:clamp(30px,4.5vw,52px);font-weight:900;
  letter-spacing:-.025em;line-height:1.08;color:var(--ink);
  margin:0 0 20px;
}
.usa-abstract{
  font-family:var(--serif);font-size:19px;font-style:italic;
  color:var(--ink2);line-height:1.6;margin:0 0 22px;
  padding-inline-start:18px;border-inline-start:3px solid var(--accent);
}
.usa-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:28px}
.usa-tag{
  font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;
  background:var(--paper2);color:var(--muted);
  padding:4px 10px;border-radius:2px;border:1px solid var(--rule);
}
.usa-rule{height:4px;width:64px;background:var(--accent);margin:0 0 36px}

/* ── Body (markdown) ── */
.usa-body{
  font-family:var(--serif);font-size:18px;line-height:1.78;color:var(--ink2);
}
.usa-body h1{display:none} /* первый h1 это уже title */
.usa-body h2{
  font-family:var(--serif);font-size:28px;font-weight:700;color:var(--ink);
  margin:48px 0 16px;letter-spacing:-.015em;line-height:1.2;
}
.usa-body h3{
  font-family:var(--serif);font-size:22px;font-weight:700;color:var(--ink);
  margin:36px 0 12px;line-height:1.25;
}
.usa-body p{margin:0 0 18px}
.usa-body ul,.usa-body ol{margin:0 0 20px;padding-inline-start:26px}
.usa-body li{margin-bottom:8px}
.usa-body strong{color:var(--ink);font-weight:700}
.usa-body em{font-style:italic}
.usa-body code{
  font-family:var(--mono);font-size:14px;background:var(--paper2);
  padding:2px 6px;border-radius:2px;
}
.usa-body pre{
  background:var(--paper2);padding:14px 18px;
  border-radius:4px;overflow-x:auto;
  font-family:var(--mono);font-size:13px;line-height:1.6;
  border:1px solid var(--rule);
  margin:0 0 22px;
}
.usa-body pre code{background:none;padding:0}
.usa-body blockquote{
  border-inline-start:3px solid var(--accent);
  background:rgba(184,48,48,.04);
  padding:14px 20px;margin:0 0 22px;
  font-style:italic;color:var(--ink2);
}
.usa-body blockquote p:last-child{margin-bottom:0}
.usa-body a{color:var(--accent);text-decoration:underline;text-underline-offset:3px}
.usa-body a:hover{text-decoration:none}
.usa-body hr{border:none;border-top:1px solid var(--rule);margin:36px 0}
.usa-body table{
  width:100%;border-collapse:collapse;margin:0 0 22px;font-size:15px;
}
.usa-body th,.usa-body td{
  text-align:start;padding:10px 14px;border-bottom:1px solid var(--rule);
}
.usa-body th{
  font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;
  color:var(--muted);font-weight:600;
}

/* ── Sources block ── */
.usa-sources-block{
  margin-top:48px;padding-top:24px;border-top:2px solid var(--ink);
}
.usa-sources-title{
  font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--muted);margin-bottom:14px;
}
.usa-sources-list{
  margin:0;padding-inline-start:20px;
  font-size:14px;line-height:1.7;color:var(--ink2);
}
.usa-sources-list li{margin-bottom:10px}
.usa-sources-list a{color:var(--accent);text-decoration:underline;word-break:break-word}
.usa-source-meta{color:var(--muted);font-size:12px}

@media print{
  .usa-topbar,.usa-nav,.usa-meta-right{display:none!important}
  .usa-page{background:#fff}
  .usa-main-inner{padding:0;max-width:100%}
  .usa-body a{color:var(--ink)}
}

@media(max-width:768px){
  .usa-topbar,.usa-nav{padding:0 20px}
  .usa-main-inner{padding:32px 20px 64px}
  .usa-body{font-size:17px}
}
@media(max-width:480px){
  .usa-topbar{display:none}
  .usa-nav{padding:0 14px}
  .usa-main-inner{padding:24px 14px 48px}
  .usa-meta-bar{font-size:10px}
  .usa-body{font-size:16px}
  .usa-body h2{font-size:24px}
  .usa-body h3{font-size:19px}
}
`;
