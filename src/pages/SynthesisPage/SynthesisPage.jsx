import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { loadArticles, resetSynthesis } from "../../slices/synthesisSlice";
import { useTranslation } from "react-i18next";
import FooterAI from "../../components/newsAI/footer/footer";

const PAGE_SIZE = 25;

const SPECIALTY_COLORS = {
  "Инфекционные болезни": "#b7290e",
  Генетика: "#0e5c6b",
  Кардиология: "#a93226",
  Онкология: "#b83030",
  Неврология: "#0e5c6b",
  Эндокринология: "#8a6a00",
  Хирургия: "#1a7a4a",
  Фармакология: "#1a5276",
  "Общая медицина": "#3a3830",
  Терапия: "#6c5ce7",
  Педиатрия: "#00b894",
  Дерматология: "#fd79a8",
  Психиатрия: "#6d6875",
  Психология: "#a29bfe",
  Офтальмология: "#0984e3",
  Отоларингология: "#00cec9",
  Урология: "#2d3436",
  Гинекология: "#e84393",
  Акушерство: "#d63031",
  Ревматология: "#636e72",
  Гастроэнтерология: "#e17055",
  Пульмонология: "#74b9ff",
  Гематология: "#c0392b",
  Иммунология: "#27ae60",
  Аллергология: "#2ecc71",
  Нефрология: "#34495e",
  Травматология: "#7f8c8d",
  Ортопедия: "#95a5a6",
  Реаниматология: "#c0392b",
  Анестезиология: "#8e44ad",
  Радиология: "#2980b9",
  Рентгенология: "#3498db",
  УЗИ: "#16a085",
  "Функциональная диагностика": "#1abc9c",
  Стоматология: "#f1c40f",
  Нутрициология: "#d35400",
  Косметология: "#e84393",
  Эпидемиология: "#c0392b",
  Вирусология: "#9b59b6",
  Бактериология: "#2c3e50",
  Патология: "#7f0000",
  Нейрохирургия: "#0b5345",
  Нейронауки: "#0e5c6b",
  Геномика: "#1a5276",
  Микробиология: "#2c3e50",
  Биохимия: "#1f618d",
  "Молекулярная биология": "#117a65",
  Иммунотерапия: "#6c3483",
  "Генная терапия": "#0e5c6b",
  Микробиом: "#27ae60",
  "Биология рака": "#b83030",
  Нейродегенерация: "#7b241c",
  "Психическое здоровье": "#6d6875",
  Долголетие: "#1a6b3c",
  "Биология старения": "#566573",
};

const SPECIALTY_TRANSLATIONS = {
  en: {
    "Инфекционные болезни": "Infectious Diseases",
    Генетика: "Genetics",
    Кардиология: "Cardiology",
    Онкология: "Oncology",
    Неврология: "Neurology",
    Эндокринология: "Endocrinology",
    Хирургия: "Surgery",
    Фармакология: "Pharmacology",
    "Общая медицина": "General Medicine",
    Терапия: "Therapy",
    Педиатрия: "Pediatrics",
    Дерматология: "Dermatology",
    Психиатрия: "Psychiatry",
    Психология: "Psychology",
    Офтальмология: "Ophthalmology",
    Отоларингология: "Otolaryngology",
    Урология: "Urology",
    Гинекология: "Gynecology",
    Акушерство: "Obstetrics",
    Ревматология: "Rheumatology",
    Гастроэнтерология: "Gastroenterology",
    Пульмонология: "Pulmonology",
    Гематология: "Hematology",
    Иммунология: "Immunology",
    Аллергология: "Allergology",
    Нефрология: "Nephrology",
    Травматология: "Traumatology",
    Ортопедия: "Orthopedics",
    Реаниматология: "Intensive Care",
    Анестезиология: "Anesthesiology",
    Радиология: "Radiology",
    Рентгенология: "Radiology",
    УЗИ: "Ultrasound",
    "Функциональная диагностика": "Functional Diagnostics",
    Стоматология: "Dentistry",
    Нутрициология: "Nutritiology",
    Косметология: "Cosmetology",
    Эпидемиология: "Epidemiology",
    Вирусология: "Virology",
    Бактериология: "Bacteriology",
    Патология: "Pathology",
    Нейрохирургия: "Neurosurgery",
    Нейронауки: "Neuroscience",
    Геномика: "Genomics",
    Микробиология: "Microbiology",
    Биохимия: "Biochemistry",
    "Молекулярная биология": "Molecular Biology",
    Иммунотерапия: "Immunotherapy",
    "Генная терапия": "Gene Therapy",
    Микробиом: "Microbiome",
    "Биология рака": "Cancer Biology",
    Нейродегенерация: "Neurodegeneration",
    "Психическое здоровье": "Mental Health",
    Долголетие: "Longevity",
    "Биология старения": "Aging Biology",
  },
  az: {
    "Инфекционные болезни": "İnfeksion Xəstəliklər",
    Генетика: "Genetika",
    Кардиология: "Kardiologiya",
    Онкология: "Onkologiya",
    Неврология: "Nevrologiya",
    Эндокринология: "Endokrinologiya",
    Хирургия: "Cərrahiyyə",
    Фармакология: "Farmakologiya",
    "Общая медицина": "Ümumi Tibb",
    Терапия: "Terapiya",
    Педиатрия: "Pediatriya",
    Дерматология: "Dermatoligiya",
    Психиатрия: "Psixiatriya",
    Психология: "Psixologiya",
    Офтальмология: "Oftalmologiya",
    Отоларингология: "Otorinolaringologiya",
    Урология: "Urologiya",
    Гинекология: "Ginekologiya",
    Акушерство: "Mamalıq",
    Ревматология: "Revmatologiya",
    Гастроэнтерология: "Qastroenterologiya",
    Пульмонология: "Pulmonologiya",
    Гематология: "Hematoligiya",
    Иммунология: "İmmunologiya",
    Аллергология: "Allergologiya",
    Нефрология: "Nefrologiya",
    Травматология: "Travmatologiya",
    Ортопедия: "Ortopediya",
    Анестезиология: "Anestezologiya",
    Радиология: "Radiologiya",
    Стоматология: "Stomatologiya",
    Эпидемиология: "Epidemiologiya",
    Вирусология: "Virusologiya",
    Нейрохирургия: "Neyrocərrahiyyə",
    Нейронауки: "Nevrologiya",
    Геномика: "Genomika",
    Микробиология: "Mikrobiologiya",
    Иммунотерапия: "İmmunoterapiya",
    "Психическое здоровье": "Psixi Sağlamlıq",
    Долголетие: "Uzunömürlülük",
  },
  tr: {
    "Инфекционные болезни": "Enfeksiyon Hastalıkları",
    Генетика: "Genetik",
    Кардиология: "Kardiyoloji",
    Онкология: "Onkoloji",
    Неврология: "Nöroloji",
    Эндокринология: "Endokrinoloji",
    Хирургия: "Cerrahi",
    Фармакология: "Farmakoloji",
    "Общая медицина": "Genel Tıp",
    Терапия: "Terapi",
    Педиатрия: "Pediatri",
    Дерматология: "Dermatoloji",
    Психиатрия: "Psikiyatri",
    Психология: "Psikoloji",
    Офтальмология: "Oftalmoloji",
    Отоларингология: "Kulak Burun Boğaz",
    Урология: "Üroloji",
    Гинекология: "Jinekoloji",
    Акушерство: "Doğum Bilimi",
    Ревматология: "Romatoloji",
    Гастроэнтерология: "Gastroenteroloji",
    Пульмонология: "Pulmoloji",
    Гематология: "Hematoloji",
    Иммунология: "İmmünoloji",
    Аллергология: "Allerji",
    Нефрология: "Nefroloji",
    Травматология: "Travmatoloji",
    Ортопедия: "Ortopedi",
    Анестезиология: "Anesteziyoloji",
    Радиология: "Radyoloji",
    Стоматология: "Diş Hekimliği",
    Эпидемиология: "Epidemiyoloji",
    Вирусология: "Viroloji",
    Нейрохирургия: "Nöroşirürji",
    Нейронауки: "Nörobilim",
    Геномика: "Genomik",
    Микробиология: "Mikrobiyoloji",
    Иммунотерапия: "İmmünoterapi",
    "Психическое здоровье": "Ruh Sağlığı",
    Долголетие: "Uzun Ömür",
  },
  ar: {
    "Инфекционные болезни": "الأمراض المعدية",
    Генетика: "علم الوراثة",
    Кардиология: "أمراض القلب",
    Онкология: "علم الأورام",
    Неврология: "طب الأعصاب",
    Эндокринология: "الغدد الصماء",
    Хирургия: "الجراحة",
    Фармакология: "علم الأدوية",
    "Общая медицина": "الطب العام",
    Терапия: "العلاج",
    Педиатрия: "طب الأطفال",
    Дерматология: "الأمراض الجلدية",
    Психиатрия: "الطب النفسي",
    Психология: "علم النفس",
    Офтальмология: "طب العيون",
    Отоларингология: "الأنف والأذن والحنجرة",
    Урология: "المسالك البولية",
    Гинекология: "أمراض النساء",
    Акушерство: "التوليد",
    Ревматология: "أمراض الروماتيزم",
    Гастроэнтерология: "أمراض الجهاز الهضمي",
    Пульмонология: "أمراض الرئة",
    Гематология: "أمراض الدم",
    Иммунология: "علم المناعة",
    Аллергология: "أمراض الحساسية",
    Нефрология: "أمراض الكلى",
    Травматология: "جراحة العظام",
    Ортопедия: "تقويم العظام",
    Анестезиология: "التخدير",
    Радиология: "الأشعة",
    Стоматология: "طب الأسنان",
    Эпидемиология: "علم الأوبئة",
    Вирусология: "علم الفيروسات",
    Нейрохирургия: "جراحة الأعصاب",
    Нейронауки: "علم الأعصاب",
    Геномика: "علم الجينوم",
    Микробиология: "علم الأحياء الدقيقة",
    Иммунотерапия: "العلاج المناعي",
    "Психическое здоровье": "الصحة النفسية",
    Долголетие: "طول العمر",
  },
};

function getSpecialty(specialty, locale) {
  if (!locale || locale === "ru" || !specialty) return specialty;
  return SPECIALTY_TRANSLATIONS[locale]?.[specialty] || specialty;
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  const s = 60 + (Math.abs(hash) % 20);
  const l = 45 + (Math.abs(hash) % 10);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function getColor(specialty) {
  return SPECIALTY_COLORS[specialty] || stringToColor(specialty || "");
}

export default function SynthesisPage() {
  const { t, i18n } = useTranslation("NewsAiTranslate");
  const dispatch = useDispatch();
  const {
    articles = [],
    status = "idle",
    loadMoreStatus = "idle",
    hasMore = false,
    page = 1,
    total = 0,
  } = useSelector((s) => s.synthesis ?? {});

  const [locale, setLocale] = useState(i18n.language || "ru");
  const sentinelRef = useRef(null);

  useEffect(() => {
    setLocale(i18n.language);
  }, [i18n.language]);

  // Первая загрузка / смена локали → сброс + загрузка page 1
  useEffect(() => {
    dispatch(resetSynthesis());
    dispatch(
      loadArticles({
        page: 1,
        limit: PAGE_SIZE,
        locale: locale !== "ru" ? locale : undefined,
      }),
    );
  }, [dispatch, locale]);

  // Догрузка следующей страницы — вызывается при пересечении sentinel
  const loadMore = useCallback(() => {
    if (!hasMore || loadMoreStatus === "loading" || status === "loading")
      return;
    dispatch(
      loadArticles({
        page: page + 1,
        limit: PAGE_SIZE,
        locale: locale !== "ru" ? locale : undefined,
      }),
    );
  }, [dispatch, hasMore, loadMoreStatus, status, page, locale]);

  // IntersectionObserver — следит за невидимым "маяком" в конце списка
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }, // подгружаем заранее, до того как юзер доскроллил
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  return (
    <>
      <style>{CSS}</style>
      <div className="sy-page">
        {/* TOP BAR */}
        <div className="sy-topbar">
          <span className="sy-topbar-left">{t("topbar_title")}</span>
          <span className="sy-topbar-date">
            {new Date().toLocaleDateString(i18n.language || "ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {/* NAV */}
        <nav className="sy-nav">
          <Link to="/news" className="sy-nav-back">
            ← {t("nav_news")}
          </Link>
          <Link to="/news" className="sy-nav-logo">
            Doc<span>Pats</span>
          </Link>
          <span className="sy-nav-tag">{t("nav_tag")}</span>
        </nav>

        {/* HEADER */}
        <header className="sy-header">
          <div className="sy-header-inner">
            <div className="sy-header-label">{t("header_label")}</div>
            <h1 className="sy-headline">{t("headline")}</h1>
            <div className="sy-rule" />
            <p className="sy-deck">{t("deck")}</p>

            {!["idle", "loading"].includes(status) && (
              <div className="sy-byline">
                <span className="sy-count">
                  {t("materials_count", { count: total || articles.length })}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <main className="sy-main">
          <div className="sy-main-inner">
            {status === "loading" && (
              <div className="sy-state">
                <div className="sy-spinner" />
                <p className="sy-state-text">{t("loading")}</p>
              </div>
            )}

            {status === "error" && (
              <div className="sy-state">
                <p className="sy-state-text">{t("load_error")}</p>
              </div>
            )}

            {status === "success" && articles.length === 0 && (
              <div className="sy-state">
                <p className="sy-state-text">{t("empty_state")}</p>
              </div>
            )}

            {status === "success" && articles.length > 0 && (
              <>
                <Link
                  to={`/articles/${articles[0]._id}`}
                  className="sy-hero-link"
                >
                  <article className="sy-hero-card">
                    <div className="sy-hero-body">
                      <div className="sy-card-meta-row">
                        <span
                          className="sy-specialty"
                          style={{ color: getColor(articles[0].specialty) }}
                        >
                          {getSpecialty(articles[0].specialty, locale)}
                        </span>
                      </div>
                      <h2 className="sy-hero-title">{articles[0].title}</h2>
                      <div
                        className="sy-hero-rule"
                        style={{ background: getColor(articles[0].specialty) }}
                      />
                      <span className="sy-author">{t("author_name")}</span>
                      <div className="sy-card-footer">
                        <span className="sy-words">
                          {t("words", { count: articles[0].wordCount || 0 })}
                        </span>
                        <span className="sy-dot">·</span>
                        <span className="sy-words">
                          {t("sources", {
                            count: articles[0].sources?.length || 0,
                          })}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>

                {articles.length > 1 && (
                  <>
                    <div className="sy-section-label">
                      {t("other_materials")}
                    </div>
                    <div className="sy-grid">
                      {articles.slice(1).map((a) => (
                        <Link
                          key={a._id}
                          to={`/articles/${a._id}`}
                          className="sy-card-link"
                        >
                          <article className="sy-card">
                            <div
                              className="sy-card-accent"
                              style={{ background: getColor(a.specialty) }}
                            />
                            <div className="sy-card-body">
                              <div className="sy-card-meta-row">
                                <span
                                  className="sy-specialty"
                                  style={{ color: getColor(a.specialty) }}
                                >
                                  {getSpecialty(a.specialty, locale)}
                                </span>
                              </div>
                              <h3 className="sy-card-title">{a.title}</h3>
                              <div className="sy-card-footer">
                                <span className="sy-words">
                                  {t("words", { count: a.wordCount || 0 })}
                                </span>
                              </div>
                            </div>
                          </article>
                        </Link>
                      ))}
                    </div>

                    {/* ── LAZY LOAD SENTINEL + индикатор ── */}
                    {hasMore && (
                      <div ref={sentinelRef} className="sy-sentinel">
                        {loadMoreStatus === "loading" && (
                          <>
                            <div className="sy-spinner sy-spinner-sm" />
                            <span className="sy-loadmore-text">
                              {t("loading_more", "Загружаем ещё...")}
                            </span>
                          </>
                        )}
                        {loadMoreStatus === "error" && (
                          <button
                            onClick={loadMore}
                            className="sy-loadmore-retry"
                          >
                            {t("retry", "Повторить")}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Все статьи показаны */}
                    {!hasMore && articles.length >= PAGE_SIZE && (
                      <div className="sy-end-marker">
                        <span>{t("all_loaded", "Все материалы показаны")}</span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="sy-footer">
          <div className="sy-footer-inner">
            <div className="sy-footer-brand">
              <span className="sy-footer-logo">
                Doc<span>Pats</span>
              </span>
              <span className="sy-footer-tag">{t("footer_tag")}</span>
            </div>
            <Link to="/news" className="sy-footer-link">
              {t("all_news")}
            </Link>
          </div>
        </footer>
        <FooterAI />
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

.sy-page*,.sy-page *::before,.sy-page *::after{box-sizing:border-box}
.sy-page{
  --paper:#f7f4ee;--paper2:#ede9e0;--ink:#1c1a16;--ink2:#3a3830;
  --muted:#7a7668;--rule:#cdc9bc;
  --serif:'Playfair Display',Georgia,serif;
  --mono:'IBM Plex Mono','Courier New',monospace;
  --sans:'IBM Plex Sans',-apple-system,sans-serif;
  background:var(--paper);min-height:100vh;color:var(--ink);
  font-family:var(--sans);-webkit-font-smoothing:antialiased;
}
.sy-topbar{background:var(--ink);color:#7a7668;padding:0 40px;height:32px;display:flex;align-items:center;justify-content:space-between;font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;}
.sy-topbar-left{color:#6a6660;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sy-topbar-date{color:#5a5a52;white-space:nowrap;flex-shrink:0}
.sy-nav{position:sticky;top:0;z-index:200;background:var(--paper);border-bottom:3px double var(--ink);display:flex;align-items:center;justify-content:space-between;padding:0 40px;height:52px;gap:16px;}
.sy-nav-back{display:flex;align-items:center;gap:6px;text-decoration:none;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);transition:color .15s;}
.sy-nav-back:hover{color:var(--ink)}
.sy-nav-logo{font-family:'Playfair Display',Georgia,serif!important;font-size:26px;font-weight:900;letter-spacing:-.02em;color:var(--ink);text-decoration:none;line-height:1;}
.sy-nav-logo span{color:#b83030}
.sy-nav-tag{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);border:1px solid var(--rule);padding:4px 12px;}
.sy-header{background:var(--paper2);border-bottom:2px solid var(--ink);padding:52px 0 0;}
.sy-header-inner{max-width:780px;margin:0 auto;padding:0 40px 44px}
.sy-header-label{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:20px;}
.sy-headline{font-family:var(--serif);font-size:clamp(32px,4vw,56px);font-weight:700;letter-spacing:-.025em;line-height:1.1;color:var(--ink);margin:0 0 22px;}
.sy-rule{height:4px;width:64px;background:var(--ink2);margin-bottom:20px}
.sy-deck{font-family:var(--serif);font-size:18px;font-style:italic;color:var(--ink2);line-height:1.65;margin:0 0 24px;}
.sy-byline{padding-top:14px;border-top:1px solid var(--rule);font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.06em;}
.sy-count{font-weight:500;color:var(--ink2)}
.sy-main{padding:0}
.sy-main-inner{max-width:1260px;margin:0 auto;padding:52px 40px 72px}
.sy-state{display:flex;flex-direction:column;align-items:center;padding:80px 0;gap:16px;text-align:center;}
.sy-spinner{width:28px;height:28px;border:2px solid var(--rule);border-top-color:var(--ink);border-radius:50%;animation:sy-spin .7s linear infinite;}
.sy-spinner-sm{width:20px;height:20px;border-width:2px}
@keyframes sy-spin{to{transform:rotate(360deg)}}
.sy-state-text{font-family:var(--serif);font-size:17px;font-style:italic;color:var(--muted)}
.sy-hero-link{display:block;text-decoration:none;margin-bottom:40px}
.sy-hero-card{background:var(--paper2);border:1px solid var(--rule);border-top:3px solid var(--ink);padding:36px 40px;transition:box-shadow .2s;cursor:pointer;}
.sy-hero-card:hover{box-shadow:0 8px 32px rgba(28,26,22,.1)}
.sy-card-meta-row{display:flex;align-items:center;gap:8px;margin-bottom:16px;font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;}
.sy-specialty{font-weight:500}
.sy-dot{color:var(--rule)}
.sy-date,.sy-words{color:var(--muted)}
.sy-hero-title{font-family:var(--serif);font-size:clamp(22px,3vw,38px);font-weight:700;letter-spacing:-.02em;line-height:1.15;color:var(--ink);margin:0 0 20px;}
.sy-hero-rule{height:3px;width:48px;margin-bottom:20px}
.sy-card-footer{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:10px;letter-spacing:.08em;color:var(--muted);padding-top:16px;border-top:1px solid var(--rule);}
.sy-section-label{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding-bottom:12px;border-bottom:2px solid var(--ink);margin-bottom:24px;}
.sy-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.sy-card-link{display:block;text-decoration:none}
.sy-card{background:var(--paper);border:1px solid var(--rule);padding:0;position:relative;overflow:hidden;transition:background .15s;cursor:pointer;height:100%;}
.sy-card:hover{background:var(--paper2)}
.sy-card-accent{width:100%;height:3px}
.sy-card-body{padding:20px 22px 20px;height:75%;}
.sy-card-title{font-family:var(--serif);font-size:18px;font-weight:700;letter-spacing:-.01em;line-height:1.3;color:var(--ink);margin:10px 0 16px;}

/* ── LAZY LOAD ── */
.sy-sentinel{
  display:flex;align-items:center;justify-content:center;gap:12px;
  padding:48px 0 16px;min-height:80px;
}
.sy-loadmore-text{
  font-family:var(--mono);font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);
}
.sy-loadmore-retry{
  font-family:var(--mono);font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--ink);
  background:transparent;border:1px solid var(--rule);
  padding:8px 18px;cursor:pointer;transition:all .15s;
}
.sy-loadmore-retry:hover{border-color:var(--ink);background:var(--paper2)}
.sy-end-marker{
  display:flex;justify-content:center;padding:48px 0 16px;
  font-family:var(--mono);font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);
}
.sy-end-marker span{
  padding:8px 20px;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);
}

.sy-footer{border-top:2px solid var(--ink);background:var(--paper2);padding:28px 0}
.sy-footer-inner{max-width:860px;margin:0 auto;padding:0 40px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.sy-footer-brand{display:flex;align-items:baseline;gap:12px}
.sy-footer-logo{font-family:'Playfair Display',Georgia,serif!important;font-size:22px;font-weight:900;letter-spacing:-.02em;color:var(--ink);}
.sy-footer-logo span{color:#b83030}
.sy-footer-tag{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);}
.sy-footer-link{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-decoration:none;border:1px solid var(--rule);padding:6px 14px;transition:all .15s;}
.sy-footer-link:hover{color:var(--ink);border-color:var(--ink)}
@media(max-width:768px){
  .sy-topbar{padding:0 20px}.sy-nav{padding:0 20px;height:48px}.sy-nav-tag{display:none}
  .sy-header-inner{padding:0 20px 32px}.sy-main-inner{padding:36px 20px 56px}
  .sy-hero-card{padding:24px 20px}.sy-grid{grid-template-columns:1fr}
  .sy-footer-inner{padding:0 20px}
}
@media(max-width:480px){
  .sy-topbar{display:none}.sy-nav{padding:0 14px}.sy-nav-logo{font-size:20px}
  .sy-header-inner{padding:0 14px 24px}.sy-headline{font-size:28px}
  .sy-main-inner{padding:28px 14px 48px}
}
`;
