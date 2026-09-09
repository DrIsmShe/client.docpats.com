// client/src/styles/articlePage.js
//
// Единый стиль страницы статьи — врачебной и собранной ИИ.
//
// ПОЧЕМУ ОДНА КОПИЯ. Раньше их было пять: по одной в каждом файле
// страницы. Четыре успели разойтись в мелочах, пятая — целиком:
// газетная бумага против фирменной шапки. Читатель переходил из общей
// ленты то на одну страницу, то на другую и видел два разных сайта.
//
// ПОЧЕМУ СТРОКОЙ, А НЕ .css-ФАЙЛОМ. Страницы вставляют стиль тегом
// <style> внутри себя, и правила живут ровно столько, сколько открыта
// страница: глобальный лист протекал бы на соседние экраны кабинета,
// где действует своя вёрстка.

export const articleStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  :root {
    --cream: #faf8f4;
    --cream2: #f3efe8;
    --parchment: #ede8df;
    --ink: #1c1917;
    --ink2: #44403c;
    --ink3: #78716c;
    --teal: #0f766e;
    --teal-light: #14b8a6;
    --teal-pale: #f0fdfa;
    --teal-border: #99f6e4;
    --gold: #b45309;
    --gold-pale: #fffbeb;
    --rose: #be185d;
    --border: #e7e2d8;
    --shadow-sm: 0 1px 3px rgba(28,25,23,.06), 0 1px 2px rgba(28,25,23,.04);
    --shadow-md: 0 4px 16px rgba(28,25,23,.08), 0 2px 6px rgba(28,25,23,.04);
    --shadow-lg: 0 20px 60px rgba(28,25,23,.10), 0 8px 24px rgba(28,25,23,.06);
    --radius: 16px;
    --font-display: 'Lora', Georgia, serif;
    --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  .sa-page {
    background: var(--cream);
    min-height: 100vh;
    font-family: var(--font-body);
    color: var(--ink);
  }

  /* ── HERO BANNER ── */
  .sa-hero {
    background: linear-gradient(160deg, #0c4a6e 0%, #0f766e 55%, #065f46 100%);
    padding: 64px 0 80px;
    position: relative;
    overflow: hidden;
  }
  .sa-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 600px 400px at 80% 50%, rgba(20,184,166,.18) 0%, transparent 70%),
      radial-gradient(ellipse 400px 600px at 10% 100%, rgba(6,95,70,.4) 0%, transparent 60%);
    pointer-events: none;
  }
  .sa-hero::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 64px;
    background: var(--cream);
    clip-path: ellipse(55% 100% at 50% 100%);
  }
  .sa-hero-inner {
    max-width: 860px;
    margin: 0 auto;
    padding: 0 32px;
    position: relative;
    z-index: 1;
  }
  .sa-category-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.25);
    color: rgba(255,255,255,.9);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    padding: 6px 14px;
    border-radius: 100px;
    margin-bottom: 20px;
  }
  .sa-category-pill::before {
    content: '';
    width: 6px; height: 6px;
    background: #5eead4;
    border-radius: 50%;
  }
  .sa-title {
    font-family: var(--font-display);
    font-size: clamp(28px, 5vw, 48px);
    font-weight: 700;
    color: white;
    line-height: 1.2;
    letter-spacing: -.01em;
    margin-bottom: 24px;
  }
  .sa-meta-row {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }
  .sa-meta-chip {
    display: flex;
    align-items: center;
    gap: 7px;
    color: rgba(255,255,255,.75);
    font-size: 13px;
    font-weight: 500;
  }
  .sa-meta-chip svg { opacity: .8; }

  /* ── LAYOUT ── */
  .sa-layout {
    max-width: 1160px;
    margin: -24px auto 0;
    padding: 0 32px 80px;
    position: relative;
    z-index: 2;
  }

  /* ── AUTHOR CARDS ── */
  .sa-authors-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 32px;
  }
  @media (max-width: 600px) {
    .sa-authors-row { grid-template-columns: 1fr; }
  }
  .sa-author-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 22px;
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .sa-author-avatar {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-light) 100%);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }
  .sa-author-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--teal);
    margin-bottom: 3px;
  }
  .sa-author-name {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.3;
  }

  /* ── ABSTRACT ── */
  .sa-abstract {
    background: linear-gradient(135deg, var(--teal-pale) 0%, #f0fdf9 100%);
    border: 1px solid var(--teal-border);
    border-radius: var(--radius);
    padding: 28px 32px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
  }
  .sa-abstract::before {
    content: '"';
    position: absolute;
    top: -10px; left: 16px;
    font-family: var(--font-display);
    font-size: 120px;
    color: rgba(15,118,110,.1);
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }
  .sa-abstract-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--teal);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sa-abstract-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--teal-border);
  }
  .sa-abstract-text {
    font-family: var(--font-display);
    font-size: 16px;
    font-style: italic;
    color: var(--ink2);
    line-height: 1.75;
    position: relative;
    z-index: 1;
  }

  /* ── MAIN ARTICLE CARD ── */
  .sa-article-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    margin-bottom: 24px;
  }
  .sa-article-image {
    width: 100%;
    max-height: 440px;
    object-fit: cover;
    display: block;
  }
  .sa-article-body {
    padding: 40px 44px;
  }
  @media (max-width: 600px) {
    .sa-article-body { padding: 24px 20px; }
  }

  /* ── ARTICLE CONTENT TYPOGRAPHY ── */
  .sa-article-content {
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.85;
    color: var(--ink2);
    margin-bottom: 36px;
  }
  .sa-article-content h1,
  .sa-article-content h2,
  .sa-article-content h3 {
    font-family: var(--font-display);
    color: var(--ink);
    margin-top: 32px;
    margin-bottom: 12px;
  }
  .sa-article-content h2 { font-size: 22px; }
  .sa-article-content h3 { font-size: 18px; }
  .sa-article-content p { margin-bottom: 18px; }
  .sa-article-content a { color: var(--teal); text-decoration: underline; text-decoration-color: rgba(15,118,110,.3); }
  .sa-article-content blockquote {
    border-left: 3px solid var(--teal-light);
    margin: 24px 0;
    padding: 4px 0 4px 20px;
    font-family: var(--font-display);
    font-style: italic;
    color: var(--ink3);
  }

  /* ── REFERENCES ── */
  .sa-references {
    background: var(--cream2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 22px 26px;
    margin-bottom: 32px;
  }
  .sa-references-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--ink3);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sa-references-label::before {
    content: '§';
    color: var(--gold);
    font-family: var(--font-display);
    font-size: 16px;
    font-style: italic;
  }
  .sa-references-text {
    font-size: 13px;
    color: var(--ink3);
    line-height: 1.7;
  }

  /* ── ACTION BAR ── */
  .sa-action-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding-top: 24px;
    border-top: 1px solid var(--border);
  }
  .sa-stat {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink3);
    font-size: 14px;
    font-weight: 500;
    padding: 8px 14px;
    border-radius: 100px;
    background: var(--cream2);
    border: 1px solid var(--border);
    transition: all .2s;
  }
  .sa-stat:hover { border-color: var(--teal-border); color: var(--teal); }
  .sa-like-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 18px;
    border-radius: 100px;
    border: 1px solid var(--border);
    background: var(--cream2);
    cursor: pointer;
    transition: all .2s;
    color: var(--ink3);
  }
  .sa-like-btn:hover { border-color: var(--teal-border); background: var(--teal-pale); }
  .sa-like-btn.liked {
    background: var(--teal-pale);
    border-color: var(--teal-border);
    color: var(--teal);
  }
  .sa-like-btn.guest {
    opacity: .7;
    cursor: default;
  }
  .sa-share-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 18px;
    border-radius: 100px;
    border: 1px solid var(--border);
    background: white;
    cursor: pointer;
    color: var(--ink2);
    transition: all .2s;
  }
  .sa-share-btn:hover { border-color: var(--ink3); background: var(--cream2); }

  /* ── OWNER ACTIONS ── */
  .sa-owner-actions {
    display: flex;
    gap: 10px;
    margin-left: auto;
  }
  .sa-btn-edit {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    background: white;
    border: 1.5px solid var(--teal);
    color: var(--teal);
    border-radius: 100px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: all .2s;
  }
  .sa-btn-edit:hover { background: var(--teal); color: white; }
  .sa-btn-delete {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    background: white;
    border: 1.5px solid #fca5a5;
    color: #dc2626;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
  }
  .sa-btn-delete:hover { background: #fef2f2; border-color: #dc2626; }

  /* ── AUTH GATE ── */
  .sa-auth-gate {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 48px 32px;
    text-align: center;
    box-shadow: var(--shadow-sm);
  }
  .sa-auth-gate-icon {
    width: 56px; height: 56px;
    background: var(--teal-pale);
    border: 1.5px solid var(--teal-border);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    margin: 0 auto 16px;
  }
  .sa-auth-gate-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 8px;
  }
  .sa-auth-gate-sub {
    font-size: 14px;
    color: var(--ink3);
    margin-bottom: 24px;
    line-height: 1.6;
  }
  .sa-auth-gate-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .sa-btn-login {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 28px;
    background: var(--teal);
    color: white;
    border: none;
    border-radius: 100px;
    font-size: 14px;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    text-decoration: none;
    transition: background .2s;
  }
  .sa-btn-login:hover { background: #0d6560; color: white; }
  .sa-btn-register {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 28px;
    background: white;
    color: var(--teal);
    border: 1.5px solid var(--teal-border);
    border-radius: 100px;
    font-size: 14px;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    text-decoration: none;
    transition: all .2s;
  }
  .sa-btn-register:hover { background: var(--teal-pale); border-color: var(--teal); }

  /* ── COMMENTS SECTION ── */
  .sa-comments-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .sa-comments-header {
    padding: 22px 32px;
    border-bottom: 1px solid var(--border);
    background: var(--cream2);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sa-comments-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    color: var(--ink);
  }
  .sa-comments-count {
    background: var(--teal);
    color: white;
    font-size: 12px;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 100px;
  }
  .sa-comments-body {
    padding: 28px 32px;
  }
  @media (max-width: 600px) {
    .sa-comments-header, .sa-comments-body { padding-left: 20px; padding-right: 20px; }
  }

  /* ── LOADING / ERROR ── */
  .sa-state {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--ink3);
    font-size: 15px;
    background: var(--cream);
  }
  .sa-spinner {
    width: 40px; height: 40px;
    border: 3px solid var(--parchment);
    border-top-color: var(--teal);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── DIVIDER ── */
  .sa-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
    margin: 32px 0;
  }

  /* ── Статья, собранная ИИ ──────────────────────────────────────────
   *
   * Те же бумага, шрифты и шапка, что у врачебной статьи: для читателя
   * это один жанр, и различаться страницы должны подписью автора, а не
   * оформлением. Здесь — только то, чего у врачебной статьи нет:
   * пронумерованные источники, сноски в тексте и оглавление.
   */

  .sa-ai-sources {
    margin-top: 40px;
    padding-top: 28px;
    border-top: 1px solid var(--border);
  }
  .sa-ai-sources-label {
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--ink3);
    margin-bottom: 16px;
  }
  .sa-ai-source {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
    line-height: 1.6;
  }
  .sa-ai-source:last-child { border-bottom: 0; }
  .sa-ai-source-num {
    flex: 0 0 auto;
    min-width: 24px;
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 700;
    color: var(--teal);
  }
  .sa-ai-source-title { color: var(--ink2); }
  .sa-ai-source-link {
    color: var(--teal);
    text-decoration: underline;
    text-decoration-color: rgba(15,118,110,.3);
    word-break: break-word;
  }
  .sa-ai-source-year { color: var(--ink3); }

  /* Сноска в тексте: маленькая, приподнятая, кликабельная. */
  .sa-article-content .sa-ref,
  .sa-ai-ref {
    display: inline-block;
    vertical-align: super;
    font-size: 11px;
    font-weight: 700;
    color: var(--teal);
    text-decoration: none;
    padding: 0 2px;
  }

  /* Оглавление длинной статьи. У врачебных статей его нет — они короче. */
  .sa-ai-toc {
    background: var(--cream2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px 20px;
    margin-bottom: 28px;
  }
  .sa-ai-toc-label {
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--ink3);
    margin-bottom: 10px;
  }
  .sa-ai-toc a {
    display: block;
    padding: 5px 0;
    color: var(--ink2);
    text-decoration: none;
    font-size: 14px;
    line-height: 1.5;
    border-bottom: 1px solid transparent;
  }
  .sa-ai-toc a:hover { color: var(--teal); }

  /* Переключатель языка и прочие мелкие кнопки шапки. */
  .sa-hero-btn {
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.3);
    background: rgba(255,255,255,.1);
    color: rgba(255,255,255,.92);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 13px;
    backdrop-filter: blur(8px);
  }
  .sa-hero-btn:hover { background: rgba(255,255,255,.18); }

  /* Тело статьи ИИ: она приходит разобранной на абзацы и подзаголовки,
     а не готовым HTML, поэтому у неё свои классы. Размеры те же, что у
     врачебной статьи, — читателю переход между ними должен быть незаметен. */
  .sa-h1 {
    font-family: var(--font-display);
    font-size: clamp(22px, 3vw, 32px);
    font-weight: 700;
    line-height: 1.25;
    color: var(--ink);
    margin: 0 0 20px;
  }
  .sa-subhead {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--ink);
    margin: 2.4em 0 .8em;
    padding-top: .9em;
    border-top: 1px solid var(--border);
  }
  .sa-h3 {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 700;
    margin: 1.8em 0 .6em;
    color: var(--ink);
  }
  .sa-para {
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.85;
    color: var(--ink2);
    margin: 0 0 1.5em;
  }
  /* Первый абзац крупнее: он же лид. */
  .sa-para:first-of-type {
    font-family: var(--font-display);
    font-size: 18px;
    line-height: 1.75;
    color: var(--ink);
  }
  .sa-ref {
    font-family: var(--font-body);
    font-size: 12px;
    color: var(--ink3);
    margin: 4px 0;
    line-height: 1.6;
  }

  @media (max-width: 640px) {
    .sa-ai-source { font-size: 13px; }
    .sa-ai-toc { padding: 14px 16px; }
  }
`;

export default articleStyles;
