import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function renderBody(text) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (line.startsWith("# "))
      return (
        <h1
          key={i}
          style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(22px,3vw,36px)",
            fontWeight: 700,
            letterSpacing: "-.02em",
            lineHeight: 1.2,
            color: "var(--ink)",
            margin: "0 0 20px",
          }}
        >
          {line.slice(2)}
        </h1>
      );
    if (line.startsWith("## "))
      return (
        <h2
          key={i}
          style={{
            fontFamily: "var(--serif)",
            fontSize: 20,
            fontWeight: 700,
            margin: "32px 0 12px",
            paddingBottom: 8,
            borderBottom: "1px solid var(--rule)",
            color: "var(--ink)",
          }}
        >
          {line.slice(3)}
        </h2>
      );
    if (line.startsWith("### "))
      return (
        <h3
          key={i}
          style={{
            fontFamily: "var(--serif)",
            fontSize: 17,
            fontWeight: 700,
            margin: "20px 0 8px",
            color: "var(--ink)",
          }}
        >
          {line.slice(4)}
        </h3>
      );
    if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
    if (/^\[?\d+\]/.test(line.trim()) && line.length < 300)
      return (
        <p
          key={i}
          style={{
            fontFamily: "var(--mono)",
            fontSize: 12,
            color: "var(--muted)",
            margin: "4px 0",
            lineHeight: 1.6,
          }}
        >
          {line}
        </p>
      );
    return (
      <p
        key={i}
        style={{
          fontFamily: "var(--sans)",
          fontSize: 16,
          fontWeight: 300,
          lineHeight: 1.85,
          margin: "0 0 14px",
          color: "var(--ink2)",
        }}
      >
        {line}
      </p>
    );
  });
}

export default function UserSynthesisResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const article = state?.article;
  const { t, i18n } = useTranslation("UserSynthesis");
  const isRTL = i18n.language === "ar";

  if (!article) {
    navigate("/user-synthesis");
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(article.body);
    alert(t("result.copiedAlert"));
  };

  const handlePrint = () => window.print();

  return (
    <>
      <style>{CSS}</style>
      <div className="ur-page" dir={isRTL ? "rtl" : "ltr"}>
        <div className="ur-topbar">
          <span>{t("topbar.yourArticle")}</span>
          <span>
            {t("topbar.wordCount", {
              count: article.wordCount?.toLocaleString() || 0,
            })}
          </span>
        </div>

        <nav className="ur-nav">
          <Link to="/user-synthesis" className="ur-nav-back">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("nav.newArticle")}
          </Link>
          <Link to="/public/news" className="ur-nav-logo">
            Doc<span>Pats</span>
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCopy} className="ur-action-btn">
              {t("nav.copy")}
            </button>
            <button onClick={handlePrint} className="ur-action-btn">
              {t("nav.print")}
            </button>
          </div>
        </nav>

        <article className="ur-article">
          <div className="ur-body">{renderBody(article.body)}</div>

          {/* ── АННОТАЦИЯ ── */}
          {article.abstract && (
            <div
              style={{
                background: "var(--paper2)",
                border: "1px solid var(--rule)",
                borderInlineStart: "4px solid #b83030",
                padding: "20px 24px",
                marginBottom: 28,
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 10,
                }}
              >
                {t("result.abstract")}
              </div>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 15,
                  fontStyle: "italic",
                  lineHeight: 1.75,
                  color: "var(--ink2)",
                  margin: 0,
                }}
              >
                {article.abstract}
              </p>
            </div>
          )}

          {/* ── ТЕГИ И КЛЮЧЕВЫЕ СЛОВА ── */}
          {(article.tags?.length > 0 || article.keywords?.length > 0) && (
            <div
              style={{
                marginBottom: 32,
                padding: "16px 20px",
                border: "1px solid var(--rule)",
                background: "var(--paper)",
              }}
            >
              {article.tags?.length > 0 && (
                <div
                  style={{
                    marginBottom: article.keywords?.length > 0 ? 12 : 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginInlineEnd: 10,
                    }}
                  >
                    {t("result.tags")}
                  </span>
                  {article.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        color: "#b83030",
                        background: "rgba(184,48,48,.08)",
                        border: "1px solid rgba(184,48,48,.2)",
                        padding: "2px 10px",
                        marginInlineEnd: 6,
                        marginBottom: 4,
                        borderRadius: 2,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {article.keywords?.length > 0 && (
                <div>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginInlineEnd: 10,
                    }}
                  >
                    {t("result.keywords")}
                  </span>
                  {article.keywords.map((kw, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        color: "var(--ink2)",
                        background: "var(--paper2)",
                        border: "1px solid var(--rule)",
                        padding: "2px 10px",
                        marginInlineEnd: 6,
                        marginBottom: 4,
                        borderRadius: 2,
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── META DESCRIPTION ── */}
          {article.metaDescription && (
            <div
              style={{
                marginBottom: 24,
                padding: "12px 16px",
                border: "1px solid var(--rule)",
                background: "var(--paper2)",
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 6,
                }}
              >
                {t("result.metaDescription")}
              </div>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  color: "var(--ink2)",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {article.metaDescription}
              </p>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color:
                    article.metaDescription.length > 160
                      ? "#b83030"
                      : "var(--muted)",
                  marginTop: 4,
                }}
              >
                {t("result.metaCharsOf", {
                  current: article.metaDescription.length,
                })}
              </div>
            </div>
          )}

          {/* ── Редакционный блок ── */}
          <div className="ur-editorial">
            <div className="ur-editorial-label">{t("result.createdOn")}</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#b83030",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--serif)",
                  fontSize: 16,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {/* Берём первую букву имени из локали */}
                {t("result.editorName").charAt(0)}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--ink)",
                  }}
                >
                  {t("result.editorName")}
                </div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    color: "var(--muted)",
                    letterSpacing: ".06em",
                  }}
                >
                  {t("result.editorRole")}
                </div>
              </div>
            </div>
            <p
              style={{
                fontFamily: "var(--sans)",
                fontSize: 13,
                fontWeight: 300,
                color: "var(--ink2)",
                lineHeight: 1.7,
                margin: "0 0 10px",
              }}
            >
              {t("result.editorialNote")}
            </p>
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--muted)",
                borderTop: "1px solid var(--rule)",
                paddingTop: 10,
                margin: 0,
              }}
            >
              {t("result.disclaimer")}
            </p>
          </div>

          {article.remaining !== undefined && (
            <div className="ur-remaining">
              {t("result.remainingLeft")} <strong>{article.remaining}</strong>
              {article.remaining === 0 && (
                <>
                  {" "}
                  · <Link to="/pricing">{t("result.upgradePlan")}</Link>
                </>
              )}
            </div>
          )}
        </article>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
.ur-page*,.ur-page *::before,.ur-page *::after{box-sizing:border-box}
.ur-page{--paper:#f7f4ee;--paper2:#ede9e0;--ink:#1c1a16;--ink2:#3a3830;
  --muted:#7a7668;--rule:#cdc9bc;
  --serif:'Playfair Display',Georgia,serif;
  --mono:'IBM Plex Mono','Courier New',monospace;
  --sans:'IBM Plex Sans',-apple-system,sans-serif;
  background:var(--paper);min-height:100vh;color:var(--ink);
  font-family:var(--sans);-webkit-font-smoothing:antialiased}
.ur-topbar{background:var(--ink);color:#6a6660;padding:0 40px;height:32px;
  display:flex;align-items:center;justify-content:space-between;
  font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.ur-nav{position:sticky;top:0;z-index:200;background:var(--paper);
  border-bottom:3px double var(--ink);display:flex;align-items:center;
  justify-content:space-between;padding:0 40px;height:52px;gap:16px}
.ur-nav-back{display:flex;align-items:center;gap:6px;text-decoration:none;
  font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);transition:color .15s}
.ur-nav-back:hover{color:var(--ink)}
.ur-nav-logo{font-family:'Playfair Display',Georgia,serif!important;
  font-size:24px;font-weight:900;color:var(--ink);text-decoration:none}
.ur-nav-logo span{color:#b83030}
.ur-action-btn{font-family:var(--mono);font-size:10px;letter-spacing:.08em;
  text-transform:uppercase;background:none;border:1px solid var(--rule);
  color:var(--muted);padding:6px 14px;cursor:pointer;transition:all .15s}
.ur-action-btn:hover{color:var(--ink);border-color:var(--ink2)}
.ur-article{max-width:720px;margin:0 auto;padding:52px 40px 80px}
.ur-body{margin-bottom:48px}
.ur-editorial{background:var(--paper2);border:1px solid var(--rule);
  border-top:3px solid var(--ink);padding:24px 28px;margin-bottom:24px}
.ur-editorial-label{font-family:var(--mono);font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.ur-remaining{font-family:var(--mono);font-size:11px;color:var(--muted);
  text-align:center;padding:12px;border:1px solid var(--rule)}
.ur-remaining a{color:#b83030}
.ur-remaining strong{color:var(--ink)}
@media print{.ur-topbar,.ur-nav,.ur-remaining{display:none}
  .ur-article{padding:0;max-width:100%}}
@media(max-width:768px){
  .ur-topbar,.ur-nav{padding:0 20px}
  .ur-article{padding:36px 20px 60px}}
@media(max-width:480px){
  .ur-topbar{display:none}
  .ur-nav{padding:0 14px}
  .ur-article{padding:28px 14px 48px}}
`;
