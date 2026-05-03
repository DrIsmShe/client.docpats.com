import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  generateArticle,
  getMyLimit,
  getMyArticles,
} from "../../api/userSynthesis";

const STYLES = [
  { value: "analytical", label: "Аналитический" },
  { value: "clinical", label: "Клинический" },
  { value: "popular", label: "Научно-популярный" },
  { value: "review", label: "Обзор литературы" },
  { value: "education", label: "Образовательный" },
];

const LANGUAGES = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "az", label: "Azərbaycan" },
  { value: "ar", label: "العربية" },
  { value: "tr", label: "Türkçe" },
];

function SourceCard({ source, index, onChange, onRemove, canRemove }) {
  return (
    <div
      style={{
        background: "var(--paper2)",
        border: "1px solid var(--rule)",
        borderRadius: 4,
        padding: "14px 16px",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Источник {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            style={{
              background: "none",
              border: "1px solid var(--rule)",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 12,
              padding: "1px 8px",
            }}
          >
            ×
          </button>
        )}
      </div>
      <input
        type="text"
        placeholder="Название источника *"
        value={source.title}
        onChange={(e) => onChange("title", e.target.value)}
        style={inputStyle}
      />
      <input
        type="url"
        placeholder="URL (необязательно)"
        value={source.url}
        onChange={(e) => onChange("url", e.target.value)}
        style={{ ...inputStyle, marginTop: 6 }}
      />
      <textarea
        placeholder="Аннотация / выдержка (улучшает качество)"
        value={source.excerpt}
        onChange={(e) => onChange("excerpt", e.target.value)}
        rows={2}
        style={{ ...inputStyle, marginTop: 6, resize: "vertical" }}
      />
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13,
  border: "1px solid var(--rule)",
  background: "var(--paper)",
  color: "var(--ink)",
  fontFamily: "inherit",
  borderRadius: 2,
  outline: "none",
};

// ─── helper: определяем залогинен ли юзер по ответу лимита ───
// Сервер возвращает plan: "guest" для неавторизованных,
// и "free"/"registered"/"standard"/"doctor_pro"/etc — для залогиненных.
// Если plan приходит "guest" ИЛИ limit равен 1 — считаем гостем.
function detectLoggedIn(limit) {
  if (!limit) return false;
  if (limit.plan === "guest") return false;
  // На случай если бэкенд не возвращает plan="guest", ориентируемся на лимит:
  // у гостя 1 статья, у любого залогиненного — минимум 3.
  if (limit.limit <= 1 && (!limit.plan || limit.plan === "free")) return false;
  return true;
}

export default function UserSynthesisPage() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("analytical");
  const [language, setLanguage] = useState("ru");
  const [sources, setSources] = useState([
    { id: 1, title: "", url: "", excerpt: "" },
  ]);
  const [limit, setLimit] = useState(null);
  const [myArticles, setMyArticles] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  // ─── isLoggedIn выводится из ответа лимита, а не из localStorage ───
  const isLoggedIn = detectLoggedIn(limit);

  useEffect(() => {
    // Грузим лимит и историю параллельно. История вернёт 401 если не авторизован —
    // молча игнорируем, это нормально для гостя.
    getMyLimit()
      .then((r) => setLimit(r.data))
      .catch(() => {});

    getMyArticles({ limit: 5 })
      .then((r) => setMyArticles(r.data.articles || []))
      .catch(() => {
        // 401 для гостя — это ожидаемо, ничего не делаем
      });
  }, []);

  const addSource = () =>
    setSources((p) => [
      ...p,
      { id: Date.now(), title: "", url: "", excerpt: "" },
    ]);

  const removeSource = (id) => setSources((p) => p.filter((s) => s.id !== id));

  const updateSource = (id, field, value) =>
    setSources((p) =>
      p.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Введите тему статьи");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await generateArticle({
        topic: topic.trim(),
        style,
        language,
        sources: sources
          .filter((s) => s.title)
          .map((s) => ({
            title: s.title,
            url: s.url,
            excerpt: s.excerpt,
          })),
      });
      navigate("/user-synthesis/result", { state: { article: res.data } });
    } catch (err) {
      setError(
        err.response?.data?.message || "Ошибка генерации. Попробуйте ещё раз.",
      );
      setStatus("error");
    }
  };

  // ─── Кнопка генерации: текст и состояние ───
  const limitReached = limit && !limit.allowed;
  const isDisabled = status === "loading" || limitReached;

  let buttonText;
  if (status === "loading") {
    buttonText = "⏳ Генерация статьи... (~60 сек)";
  } else if (limitReached && !isLoggedIn) {
    buttonText = "Зарегистрируйтесь чтобы продолжить →";
  } else if (limitReached && isLoggedIn) {
    buttonText = "Лимит на месяц исчерпан";
  } else {
    buttonText = "Создать статью →";
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="us-page">
        <div className="us-topbar">
          <span>DocPats · AI Article Generator</span>
          <span>Создать статью</span>
        </div>

        <nav className="us-nav">
          <Link to="/public/news" className="us-nav-back">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Назад
          </Link>
          <Link to="/public/news" className="us-nav-logo">
            Doc<span>Pats</span>
          </Link>
          <span className="us-nav-tag">AI Synthesis</span>
        </nav>

        <header className="us-header">
          <div className="us-header-inner">
            <div className="us-label">DocPats · Персональный генератор</div>
            <h1 className="us-headline">Создайте свою научную статью</h1>
            <div className="us-rule" />
            <p className="us-deck">
              Введите тему и источники — AI создаст глубокую аналитическую
              статью от 3000 слов с академическими ссылками
            </p>

            {limit && (
              <div className="us-limit-bar">
                <span className="us-limit-plan">
                  План: <strong>{limit.plan || "free"}</strong>
                </span>
                <span className="us-limit-count">
                  Использовано: <strong>{limit.used}</strong> / {limit.limit} в
                  месяц
                </span>
                {limitReached && (
                  <span className="us-limit-warn">
                    {!isLoggedIn ? (
                      <>
                        Лимит гостя исчерпан ·{" "}
                        <Link to="/register">Зарегистрируйтесь</Link> — 3 статьи
                        в месяц бесплатно
                      </>
                    ) : (
                      <>
                        Лимит исчерпан ·{" "}
                        <Link to="/pricing">Обновить план</Link>
                      </>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="us-main">
          <div className="us-main-inner">
            <div className="us-grid">
              {/* LEFT — форма */}
              <div className="us-form-col">
                <div className="us-form-section">
                  <label className="us-form-label">Тема статьи *</label>
                  <input
                    type="text"
                    placeholder="Например: Роль микробиома в развитии сахарного диабета 2 типа"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    style={{
                      ...inputStyle,
                      fontSize: 15,
                      padding: "12px 14px",
                    }}
                  />
                  <div className="us-form-hint">
                    Чем конкретнее тема — тем глубже статья
                  </div>
                </div>

                <div className="us-form-row">
                  <div className="us-form-section" style={{ flex: 1 }}>
                    <label className="us-form-label">Стиль</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {STYLES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="us-form-section" style={{ flex: 1 }}>
                    <label className="us-form-label">Язык</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="us-form-section">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <label className="us-form-label" style={{ margin: 0 }}>
                      Источники (необязательно)
                    </label>
                    <button onClick={addSource} className="us-add-btn">
                      + Добавить
                    </button>
                  </div>
                  {sources.map((s, i) => (
                    <SourceCard
                      key={s.id}
                      source={s}
                      index={i}
                      onChange={(f, v) => updateSource(s.id, f, v)}
                      onRemove={() => removeSource(s.id)}
                      canRemove={sources.length > 1}
                    />
                  ))}
                  <div className="us-form-hint">
                    Без источников AI использует актуальные данные из открытых
                    баз
                  </div>
                </div>

                {error && <div className="us-error">{error}</div>}

                {/* Если лимит исчерпан и гость — основное действие отправляет на регистрацию */}
                {limitReached && !isLoggedIn ? (
                  <Link
                    to="/register"
                    className="us-generate-btn us-generate-btn-link"
                  >
                    Зарегистрируйтесь чтобы продолжить →
                  </Link>
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={isDisabled}
                    className="us-generate-btn"
                  >
                    {buttonText}
                  </button>
                )}

                {/* Дополнительный CTA для залогиненного пользователя с исчерпанным лимитом */}
                {limitReached && isLoggedIn && (
                  <div className="us-login-hint">
                    <Link to="/pricing">Обновить план</Link> чтобы получить
                    больше генераций
                  </div>
                )}

                {!isLoggedIn && !limitReached && (
                  <div className="us-login-hint">
                    <Link to="/login">Войдите</Link> чтобы сохранять статьи и
                    получить больше генераций
                  </div>
                )}
              </div>

              {/* RIGHT — история и инфо */}
              <div className="us-info-col">
                <div className="us-info-card">
                  <div className="us-info-title">Что вы получите</div>
                  {[
                    "От 3000 слов глубокого анализа",
                    "Синтез нескольких источников",
                    "Академические ссылки в конце",
                    "Блок «Что это значит на практике»",
                    "5 стилей подачи на выбор",
                    "5 языков",
                  ].map((item) => (
                    <div key={item} className="us-info-item">
                      <span className="us-info-check">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="us-info-card">
                  <div className="us-info-title">Планы</div>
                  {[
                    { plan: "Гость", limit: "1 статья", price: "Бесплатно" },
                    {
                      plan: "Зарегистрирован",
                      limit: "3 статьи/мес",
                      price: "Бесплатно",
                    },
                    {
                      plan: "Doctor Free",
                      limit: "3 статьи/мес",
                      price: "Бесплатно",
                    },
                    {
                      plan: "Standard",
                      limit: "5 статей/мес",
                      price: "Платно",
                    },
                    {
                      plan: "Doctor Pro",
                      limit: "50 статей/мес",
                      price: "Платно",
                    },
                  ].map((p) => (
                    <div key={p.plan} className="us-plan-item">
                      <span className="us-plan-name">{p.plan}</span>
                      <span className="us-plan-limit">{p.limit}</span>
                      <span className="us-plan-price">{p.price}</span>
                    </div>
                  ))}
                  <Link to="/pricing" className="us-upgrade-link">
                    Обновить план →
                  </Link>
                </div>

                {isLoggedIn && myArticles.length > 0 && (
                  <div className="us-info-card">
                    <div className="us-info-title">Мои статьи</div>
                    {myArticles.map((a) => (
                      <Link
                        key={a._id}
                        to={`/user-synthesis/my/${a._id}`}
                        className="us-my-article"
                      >
                        <div className="us-my-title">{a.title}</div>
                        <div className="us-my-meta">
                          {a.wordCount?.toLocaleString()} слов ·{" "}
                          {new Date(a.createdAt).toLocaleDateString("ru-RU")}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
.us-page*,.us-page *::before,.us-page *::after{box-sizing:border-box}
.us-page{
  --paper:#f7f4ee;--paper2:#ede9e0;--ink:#1c1a16;--ink2:#3a3830;
  --muted:#7a7668;--rule:#cdc9bc;
  --serif:'Playfair Display',Georgia,serif;
  --mono:'IBM Plex Mono','Courier New',monospace;
  --sans:'IBM Plex Sans',-apple-system,sans-serif;
  background:var(--paper);min-height:100vh;color:var(--ink);
  font-family:var(--sans);-webkit-font-smoothing:antialiased;
}
.us-topbar{background:var(--ink);color:#6a6660;padding:0 40px;height:32px;
  display:flex;align-items:center;justify-content:space-between;
  font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.us-nav{position:sticky;top:0;z-index:200;background:var(--paper);
  border-bottom:3px double var(--ink);display:flex;align-items:center;
  justify-content:space-between;padding:0 40px;height:52px}
.us-nav-back{display:flex;align-items:center;gap:6px;text-decoration:none;
  font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);transition:color .15s}
.us-nav-back:hover{color:var(--ink)}
.us-nav-logo{font-family:'Playfair Display',Georgia,serif!important;
  font-size:26px;font-weight:900;letter-spacing:-.02em;color:var(--ink);text-decoration:none}
.us-nav-logo span{color:#b83030}
.us-nav-tag{font-family:var(--mono);font-size:10px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);border:1px solid var(--rule);padding:4px 12px}
.us-header{background:var(--paper2);border-bottom:2px solid var(--ink);padding:44px 0 0}
.us-header-inner{max-width:1000px;margin:0 auto;padding:0 40px 36px}
.us-label{font-family:var(--mono);font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.us-headline{font-family:var(--serif);font-size:clamp(26px,3.5vw,44px);font-weight:700;
  letter-spacing:-.025em;line-height:1.1;color:var(--ink);margin:0 0 18px}
.us-rule{height:4px;width:64px;background:#b83030;margin-bottom:16px}
.us-deck{font-family:var(--serif);font-size:17px;font-style:italic;
  color:var(--ink2);line-height:1.65;margin:0 0 20px}
.us-limit-bar{display:flex;align-items:center;gap:20px;flex-wrap:wrap;
  padding:10px 14px;background:var(--paper);border:1px solid var(--rule);
  font-family:var(--mono);font-size:11px;color:var(--muted)}
.us-limit-plan,.us-limit-count{color:var(--muted)}
.us-limit-plan strong,.us-limit-count strong{color:var(--ink)}
.us-limit-warn{color:#b83030}
.us-limit-warn a{color:#b83030;font-weight:500}
.us-main{padding:0}
.us-main-inner{max-width:1000px;margin:0 auto;padding:40px 40px 80px}
.us-grid{display:grid;grid-template-columns:1fr 320px;gap:32px;align-items:start}
.us-form-section{margin-bottom:20px}
.us-form-row{display:flex;gap:12px;margin-bottom:20px}
.us-form-label{display:block;font-family:var(--mono);font-size:10px;
  letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.us-form-hint{font-family:var(--sans);font-size:12px;color:var(--muted);
  margin-top:6px;line-height:1.5}
.us-add-btn{font-family:var(--mono);font-size:10px;letter-spacing:.08em;
  text-transform:uppercase;background:none;border:1px solid var(--rule);
  color:var(--muted);padding:5px 12px;cursor:pointer;transition:all .15s}
.us-add-btn:hover{color:var(--ink);border-color:var(--ink2)}
.us-error{padding:10px 14px;background:#fdf0ee;border:1px solid #f0c0bc;
  color:#b83030;font-size:13px;margin-bottom:16px;line-height:1.5}
.us-generate-btn{
  width:100%;padding:14px;font-family:var(--mono);font-size:12px;
  font-weight:500;letter-spacing:.1em;text-transform:uppercase;
  background:var(--ink);color:var(--paper);border:none;cursor:pointer;
  transition:background .15s;display:block;text-align:center;text-decoration:none;
  box-sizing:border-box}
.us-generate-btn:hover:not(:disabled){background:#3a3830}
.us-generate-btn:disabled{opacity:.4;cursor:not-allowed}
.us-generate-btn-link{background:#b83030;color:#fff}
.us-generate-btn-link:hover{background:#9a2828}
.us-login-hint{text-align:center;font-family:var(--mono);font-size:11px;
  color:var(--muted);margin-top:12px}
.us-login-hint a{color:#b83030}
.us-info-card{background:var(--paper2);border:1px solid var(--rule);
  padding:20px;margin-bottom:16px}
.us-info-title{font-family:var(--serif);font-size:16px;font-weight:700;
  color:var(--ink);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--rule)}
.us-info-item{display:flex;gap:10px;margin-bottom:8px;font-size:13px;color:var(--ink2)}
.us-info-check{color:#b83030;font-weight:700;flex-shrink:0}
.us-plan-item{display:flex;align-items:center;gap:8px;padding:7px 0;
  border-bottom:1px solid var(--rule);font-size:12px}
.us-plan-item:last-of-type{border-bottom:none}
.us-plan-name{font-weight:500;color:var(--ink);flex:1}
.us-plan-limit{color:var(--muted);font-family:var(--mono);font-size:10px}
.us-plan-price{color:var(--muted);font-family:var(--mono);font-size:10px;margin-left:auto}
.us-upgrade-link{display:block;text-align:center;margin-top:12px;
  font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;
  color:#b83030;text-decoration:none}
.us-my-article{display:block;padding:10px 0;border-bottom:1px solid var(--rule);
  text-decoration:none;transition:opacity .15s}
.us-my-article:last-child{border-bottom:none}
.us-my-article:hover{opacity:.7}
.us-my-title{font-family:var(--serif);font-size:14px;font-weight:700;
  color:var(--ink);margin-bottom:4px;line-height:1.3}
.us-my-meta{font-family:var(--mono);font-size:10px;color:var(--muted)}
@media(max-width:768px){
  .us-topbar,.us-nav{padding:0 20px}
  .us-header-inner,.us-main-inner{padding-left:20px;padding-right:20px}
  .us-grid{grid-template-columns:1fr}
  .us-nav-tag{display:none}
  .us-form-row{flex-direction:column}
}
@media(max-width:480px){
  .us-topbar{display:none}
  .us-nav{padding:0 14px}
  .us-header-inner,.us-main-inner{padding-left:14px;padding-right:14px}
}
`;
