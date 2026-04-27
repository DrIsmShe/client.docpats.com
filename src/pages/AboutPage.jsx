import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <>
      <style>{CSS}</style>
      <div className="ab-page">
        {/* TOP BAR */}
        <div className="ab-topbar">
          <span>DocPats · Medical Intelligence</span>
          <span>О редакции</span>
        </div>

        {/* NAV */}
        <nav className="ab-nav">
          <Link to="/public/news" className="ab-nav-back">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            На главную
          </Link>
          <Link to="/public/news" className="ab-nav-logo">
            Doc<span>Pats</span>
          </Link>
          <span className="ab-nav-tag">О редакции</span>
        </nav>

        {/* HERO */}
        <header className="ab-header">
          <div className="ab-header-inner">
            <div className="ab-label">DocPats · Медицинская редакция</div>
            <h1 className="ab-headline">О нас</h1>
            <div className="ab-rule" />
            <p className="ab-deck">
              Независимая медицинская редакция под руководством практикующего
              врача. Все материалы основаны исключительно на рецензируемых
              научных источниках.
            </p>
          </div>
        </header>

        {/* CONTENT */}
        <main className="ab-main">
          <div className="ab-main-inner">
            {/* EDITOR BLOCK */}
            <section className="ab-section">
              <h2 className="ab-section-title">Главный редактор</h2>
              <div className="ab-editor-card">
                <div className="ab-editor-avatar">ИИ</div>
                <div className="ab-editor-info">
                  <div className="ab-editor-name">Д-р Исмаил Исмаилов</div>
                  <div className="ab-editor-title">
                    Главный редактор DocPats · Оториноларинголог
                  </div>
                  <p className="ab-editor-bio">
                    Практикующий врач-оториноларинголог и основатель медицинской
                    платформы DocPats. Под его редакторским руководством все
                    аналитические материалы платформы проходят проверку на
                    соответствие актуальным клиническим данным и стандартам
                    доказательной медицины.
                  </p>
                  <Link to="/public/news" className="ab-editor-profile">
                    Профиль на DocPats →
                  </Link>
                </div>
              </div>
            </section>

            {/* MISSION */}
            <section className="ab-section">
              <h2 className="ab-section-title">Наша миссия</h2>
              <p className="ab-text">
                DocPats создан для того чтобы врачи и пациенты имели доступ к
                глубокому анализу актуальных медицинских и научных данных. Мы не
                заменяем медицинские журналы — мы делаем их содержание доступным
                и применимым на практике.
              </p>
              <p className="ab-text">
                Каждый аналитический материал DocPats синтезирует данные из
                нескольких рецензируемых источников, предоставляя читателю
                целостную картину по актуальным вопросам медицины и
                биологических наук.
              </p>
            </section>

            {/* SOURCES */}
            <section className="ab-section">
              <h2 className="ab-section-title">
                Источники которым мы доверяем
              </h2>
              <div className="ab-sources-grid">
                {[
                  {
                    name: "PubMed / MEDLINE",
                    desc: "Национальная медицинская библиотека США",
                  },
                  {
                    name: "The Lancet",
                    desc: "Один из старейших медицинских журналов мира",
                  },
                  { name: "NEJM", desc: "New England Journal of Medicine" },
                  {
                    name: "PLOS Medicine",
                    desc: "Открытый рецензируемый журнал",
                  },
                  {
                    name: "WHO",
                    desc: "Всемирная организация здравоохранения",
                  },
                  { name: "CDC", desc: "Центры по контролю заболеваний США" },
                  {
                    name: "Frontiers in Medicine",
                    desc: "Международный рецензируемый журнал",
                  },
                  { name: "PeerJ", desc: "Открытый научный журнал" },
                ].map((s) => (
                  <div key={s.name} className="ab-source-item">
                    <div className="ab-source-name">{s.name}</div>
                    <div className="ab-source-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* EDITORIAL POLICY */}
            <section className="ab-section">
              <h2 className="ab-section-title">Редакционная политика</h2>
              <div className="ab-policy-list">
                {[
                  {
                    num: "01",
                    title: "Только рецензируемые источники",
                    text: "Все материалы основаны на публикациях в рецензируемых научных журналах. Мы не используем непроверенные источники, социальные сети или непрофессиональные издания.",
                  },
                  {
                    num: "02",
                    title: "Актуальность данных",
                    text: "Приоритет отдаётся публикациям последних 2-3 лет. Для каждой темы указывается дата публикации источников.",
                  },
                  {
                    num: "03",
                    title: "Редакционная проверка",
                    text: "Все материалы проходят проверку главным редактором на соответствие клинической практике и действующим стандартам лечения.",
                  },
                  {
                    num: "04",
                    title: "Прозрачность",
                    text: "В конце каждой статьи указаны все использованные источники с прямыми ссылками на оригинальные публикации.",
                  },
                  {
                    num: "05",
                    title: "Независимость",
                    text: "DocPats не принимает финансирование от фармацевтических компаний и не публикует рекламный контент под видом редакционных материалов.",
                  },
                ].map((p) => (
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
                  Медицинский дисклеймер
                </div>
                <p className="ab-disclaimer-text">
                  Все материалы DocPats носят исключительно информационный и
                  образовательный характер. Они не являются медицинским советом,
                  диагнозом или назначением лечения. Для получения медицинской
                  помощи обратитесь к квалифицированному специалисту. Не
                  игнорируйте профессиональный медицинский совет и не
                  откладывайте обращение к врачу на основании информации,
                  прочитанной на этом сайте.
                </p>
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
            <span className="ab-footer-tag">Medical Intelligence Platform</span>
            <Link to="/public/articles" className="ab-footer-link">
              Аналитика →
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

.ab-page*,.ab-page *::before,.ab-page *::after{box-sizing:border-box}
.ab-page{
  --paper:#f7f4ee;--paper2:#ede9e0;--ink:#1c1a16;--ink2:#3a3830;
  --muted:#7a7668;--rule:#cdc9bc;
  --serif:'Playfair Display',Georgia,serif;
  --mono:'IBM Plex Mono','Courier New',monospace;
  --sans:'IBM Plex Sans',-apple-system,sans-serif;
  background:var(--paper);min-height:100vh;color:var(--ink);
  font-family:var(--sans);-webkit-font-smoothing:antialiased;
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
  padding:0 40px;height:52px;
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
.ab-editor-bio{
  font-family:var(--sans);font-size:15px;font-weight:300;
  line-height:1.75;color:var(--ink2);margin:0 0 16px;
}
.ab-editor-profile{
  font-family:var(--mono);font-size:11px;letter-spacing:.08em;
  text-transform:uppercase;color:#b83030;text-decoration:none;
  border-bottom:1px solid #b83030;padding-bottom:2px;
  transition:opacity .15s;
}
.ab-editor-profile:hover{opacity:.7}
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
  font-family:var(--mono);font-size:13px;font-weight:500;
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
  .ab-sources-grid{grid-template-columns:1fr}
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
