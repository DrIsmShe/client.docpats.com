import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { loadArticle, clearCurrent } from "../../slices/synthesisSlice";
import { useTranslation } from "react-i18next";
import { FaCommentDots } from "react-icons/fa6";
import FooterAI from "../../components/newsAI/footer/footer";
import { Helmet } from "react-helmet-async";
import CommentSection from "../../components/shared/CommentSection";
import useCommentCount from "../../components/shared/useCommentCountDetail";
const SPECIALTY_COLORS = {
  therapist: "#3a3830",
  family_doctor: "#3a3830",
  gastroenterologist: "#7d6608",
  cardiologist: "#a93226",
  interventional_cardiologist: "#922b21",
  pediatric_cardiologist: "#c0392b",
  pulmonologist: "#5d6d7e",
  nephrologist: "#1f618d",
  hematologist: "#922b21",
  endocrinologist: "#8a6a00",
  rheumatologist: "#117864",
  allergist_immunologist: "#6c3483",
  infectious_disease_specialist: "#b7290e",
  phthisiatrician: "#7b241c",
  hepatologist: "#7d6608",
  dietitian: "#16a085",
  urologist: "#2e86c1",
  dermatologist: "#d68910",
  occupational_medicine_doctor: "#566573",
  pain_management_specialist: "#884ea0",
  pediatrician: "#1abc9c",
  neonatologist: "#48c9b0",
  child_psychiatrist: "#7b7d7d",
  gynecologist: "#af7ac5",
  obstetrician: "#f1948a",
  reproductive_endocrinologist: "#8a6a00",
  andrologist: "#2874a6",
  neurosurgeon: "#0b5345",
  orthopedic_trauma_surgeon: "#7d3c98",
  maxillofacial_surgeon: "#a04000",
  cardiac_surgeon: "#922b21",
  thoracic_surgeon: "#1a5276",
  abdominal_surgeon: "#1a7a4a",
  coloproctologist: "#7d6608",
  endocrine_surgeon: "#8a6a00",
  plastic_surgeon: "#c0392b",
  purulent_surgeon: "#922b21",
  vascular_surgeon: "#21618c",
  transplant_surgeon: "#145a32",
  oral_surgeon: "#d35400",
  ophthalmologist: "#f1c40f",
  otolaryngologist: "#48c9b0",
  oncologist: "#b83030",
  oncologist_chemotherapist: "#a93226",
  oncologist_radiotherapist: "#cb4335",
  psychiatrist: "#7b7d7d",
  psychologist: "#5d6d7e",
  neurologist: "#0e5c6b",
  geriatrician: "#566573",
  sleep_medicine_specialist: "#34495e",
  clinical_pharmacologist: "#1a5276",
  internal_medicine_doctor: "#3a3830",
  medical_geneticist: "#0e5c6b",
  toxicologist: "#7b241c",
  immunotherapist: "#6c3483",
  pediatric_neurologist: "#0e5c6b",
  pediatric_endocrinologist: "#8a6a00",
  pediatric_oncologist: "#b83030",
  gynecologic_oncologist: "#af7ac5",
  breast_specialist: "#f1948a",
  menopause_specialist: "#d7bde2",
  sexologist: "#2874a6",
  psychotherapist: "#7b7d7d",
  addiction_specialist: "#884ea0",
  oculoplastic_surgeon: "#f1c40f",
  robotic_surgeon: "#2c3e50",
  bariatric_surgeon: "#27ae60",
  neuro_ophthalmologist: "#f4d03f",
  oculist: "#f7dc6f",
  cytologist: "#4a235a",
  biochemist: "#1f618d",
  molecular_diagnostics_specialist: "#117a65",
  medical_imaging_specialist: "#34495e",
  endodontist: "#d35400",
  dental_hygienist: "#f39c12",
  oral_pathologist: "#a04000",
  chiropractor: "#52be80",
  osteopath: "#45b39d",
  acupuncturist: "#16a085",
  speech_therapist: "#48c9b0",
  occupational_therapist: "#52be80",
  rehabilitation_psychologist: "#7b7d7d",
  kinesiologist: "#27ae60",
  athletic_trainer: "#2ecc71",
  disaster_medicine_specialist: "#e74c3c",
  triage_specialist: "#c0392b",
  functional_diagnostics_specialist: "#5d6d7e",
  radiologist: "#34495e",
  ultrasound_diagnostician: "#5dade2",
  pathologist: "#4a235a",
  forensic_medical_examiner: "#7b241c",
  geneticist: "#0e5c6b",
  laboratory_diagnostics_specialist: "#117a65",
  dentist: "#d35400",
  orthodontist: "#e67e22",
  periodontist: "#ca6f1e",
  prosthodontist: "#a04000",
  physiotherapist: "#45b39d",
  exercise_therapy_doctor: "#52be80",
  sports_doctor: "#27ae60",
  emergency_medicine_doctor: "#e74c3c",
};

const SPECIALTY_ALIASES = {
  терапевт: "therapist",
  "семейный врач": "family_doctor",
  гастроэнтеролог: "gastroenterologist",
  кардиология: "cardiologist",
  кардиолог: "cardiologist",
  "интервенционный кардиолог": "interventional_cardiologist",
  "детский кардиолог": "pediatric_cardiologist",
  пульмонолог: "pulmonologist",
  нефролог: "nephrologist",
  гематолог: "hematologist",
  эндокринология: "endocrinologist",
  эндокринолог: "endocrinologist",
  ревматолог: "rheumatologist",
  "аллерголог-иммунолог": "allergist_immunologist",
  "инфекционные болезни": "infectious_disease_specialist",
  инфекционист: "infectious_disease_specialist",
  фтизиатр: "phthisiatrician",
  гепатолог: "hepatologist",
  диетолог: "dietitian",
  урология: "urologist",
  уролог: "urologist",
  дерматолог: "dermatologist",
  "врач профпатолог": "occupational_medicine_doctor",
  "специалист по лечению боли": "pain_management_specialist",
  педиатр: "pediatrician",
  неонатолог: "neonatologist",
  "детский психиатр": "child_psychiatrist",
  гинекология: "gynecologist",
  гинеколог: "gynecologist",
  акушер: "obstetrician",
  "репродуктивный эндокринолог": "reproductive_endocrinologist",
  андролог: "andrologist",
  нейрохирург: "neurosurgeon",
  "ортопед-травматолог": "orthopedic_trauma_surgeon",
  "челюстно-лицевой хирург": "maxillofacial_surgeon",
  кардиохирург: "cardiac_surgeon",
  "торакальный хирург": "thoracic_surgeon",
  "абдоминальный хирург": "abdominal_surgeon",
  колопроктолог: "coloproctologist",
  "эндокринный хирург": "endocrine_surgeon",
  "пластический хирург": "plastic_surgeon",
  "гнойный хирург": "purulent_surgeon",
  "сосудистый хирург": "vascular_surgeon",
  трансплантолог: "transplant_surgeon",
  "оральный хирург": "oral_surgeon",
  офтальмология: "ophthalmologist",
  офтальмолог: "ophthalmologist",
  лор: "otolaryngologist",
  отоларинголог: "otolaryngologist",
  онкология: "oncologist",
  онколог: "oncologist",
  "онколог-химиотерапевт": "oncologist_chemotherapist",
  "онколог-радиотерапевт": "oncologist_radiotherapist",
  психиатр: "psychiatrist",
  психолог: "psychologist",
  неврология: "neurologist",
  невролог: "neurologist",
  гериатр: "geriatrician",
  "специалист по медицине сна": "sleep_medicine_specialist",
  "клинический фармаколог": "clinical_pharmacologist",
  терапия: "internal_medicine_doctor",
  "врач внутренней медицины": "internal_medicine_doctor",
  "медицинский генетик": "medical_geneticist",
  токсиколог: "toxicologist",
  иммунотерапевт: "immunotherapist",
  "детский невролог": "pediatric_neurologist",
  "детский эндокринолог": "pediatric_endocrinologist",
  "детский онколог": "pediatric_oncologist",
  "гинеколог-онколог": "gynecologic_oncologist",
  маммолог: "breast_specialist",
  "специалист по менопаузе": "menopause_specialist",
  сексолог: "sexologist",
  психотерапевт: "psychotherapist",
  "специалист по зависимостям": "addiction_specialist",
  "окулопластический хирург": "oculoplastic_surgeon",
  "роботический хирург": "robotic_surgeon",
  "бариатрический хирург": "bariatric_surgeon",
  нейроофтальмолог: "neuro_ophthalmologist",
  окулист: "oculist",
  цитолог: "cytologist",
  биохимик: "biochemist",
  "специалист по молекулярной диагностике": "molecular_diagnostics_specialist",
  "специалист по медицинской визуализации": "medical_imaging_specialist",
  эндодонтист: "endodontist",
  "гигиенист стоматологический": "dental_hygienist",
  "оральный патолог": "oral_pathologist",
  хиропрактик: "chiropractor",
  остеопат: "osteopath",
  иглотерапевт: "acupuncturist",
  логопед: "speech_therapist",
  эрготерапевт: "occupational_therapist",
  "реабилитационный психолог": "rehabilitation_psychologist",
  кинезиолог: "kinesiologist",
  "атлетический тренер": "athletic_trainer",
  "специалист по медицине катастроф": "disaster_medicine_specialist",
  "триаж-специалист": "triage_specialist",
  "специалист по функциональной диагностике":
    "functional_diagnostics_specialist",
  радиолог: "radiologist",
  "врач узи": "ultrasound_diagnostician",
  патолог: "pathologist",
  "судебно-медицинский эксперт": "forensic_medical_examiner",
  генетик: "geneticist",
  "специалист по лабораторной диагностике": "laboratory_diagnostics_specialist",
  стоматолог: "dentist",
  ортодонт: "orthodontist",
  пародонтолог: "periodontist",
  "ортопед-стоматолог": "prosthodontist",
  физиотерапевт: "physiotherapist",
  "врач лфк": "exercise_therapy_doctor",
  "спортивный врач": "sports_doctor",
  "врач скорой помощи": "emergency_medicine_doctor",
  cardiology: "cardiologist",
  neurology: "neurologist",
  oncology: "oncologist",
  endocrinology: "endocrinologist",
  urology: "urologist",
  gynecology: "gynecologist",
  ophthalmology: "ophthalmologist",
  otolaryngology: "otolaryngologist",
  pediatrics: "pediatrician",
  radiology: "radiologist",
  pathology: "pathologist",
  dentistry: "dentist",
  physiotherapy: "physiotherapist",
};

function normalizeSpecialtyKey(value) {
  if (!value || typeof value !== "string") return "";
  const cleaned = value.trim().toLowerCase();
  if (SPECIALTY_ALIASES[cleaned]) return SPECIALTY_ALIASES[cleaned];
  const normalized = cleaned
    .replace(/[–—-]/g, "_")
    .replace(/[()/.,]/g, "")
    .replace(/\s+/g, "_")
    .replace(/__+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (SPECIALTY_COLORS[normalized]) return normalized;
  if (SPECIALTY_ALIASES[normalized]) return SPECIALTY_ALIASES[normalized];
  return normalized;
}

function ReadingProgress({ color }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? (el.scrollTop / total) * 100 : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          transition: "width .08s linear",
        }}
      />
    </div>
  );
}

function renderBody(text) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (line.startsWith("# "))
      return (
        <h1 key={i} className="sa-h1">
          {line.slice(2)}
        </h1>
      );
    if (line.startsWith("## "))
      return (
        <h2 key={i} className="sa-subhead">
          {line.slice(3)}
        </h2>
      );
    if (line.startsWith("### "))
      return (
        <h3 key={i} className="sa-h3">
          {line.slice(4)}
        </h3>
      );
    if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
    if (/^\[?\d+\]/.test(line.trim()) && line.length < 300)
      return (
        <p key={i} className="sa-ref">
          {line}
        </p>
      );
    return (
      <p key={i} className="sa-para">
        {line}
      </p>
    );
  });
}

export default function SynthesisArticlePage() {
  const { t, i18n } = useTranslation("NewsAiTranslate");
  const { id, lang } = useParams();

  // ── AUTH: проверяем через /common-for-user (как в SingleArticle.jsx)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API_BASE}/common-for-user`, { withCredentials: true })
      .then((res) => {
        if (cancelled) return;
        if (res?.data?.authenticated) {
          setIsAuthenticated(true);
          setUserId(res.data.user?.userId || null);
        }
      })
      .catch(() => {
        /* гость — isAuthenticated остаётся false */
      });
    return () => {
      cancelled = true;
    };
  }, [API_BASE]);

  // Счётчик комментариев — тот же хук, что и в SingleArticle.jsx
  const commentCount = useCommentCount(id);

  const [locale, setLocale] = useState(() => {
    const fromUrl =
      lang && ["en", "ru", "az", "ar", "tr"].includes(lang) ? lang : null;
    const result = fromUrl || i18n.language || "ru";
    document.cookie = `locale=${result};path=/;max-age=31536000`;
    return result;
  });

  useEffect(() => {
    setLocale(i18n.language);
  }, [i18n.language]);
  const [translatedContent, setTranslatedContent] = useState(null);
  // "idle" | "pending" | "streaming" | "done"
  const [translateState, setTranslateState] = useState("idle");

  const abortRef = useRef(null);

  const LOCALES = [
    { code: "en", label: "EN" },
    { code: "ru", label: "RU" },
    { code: "az", label: "AZ" },
    { code: "ar", label: "AR" },
    { code: "tr", label: "TR" },
  ];
  const changeLocale = (code) => {
    setLocale(code);
    localStorage.setItem("locale", code);
    i18n.changeLanguage(code);
    document.cookie = `locale=${code};path=/;max-age=31536000`;
    // Меняем URL — Google увидит отдельную страницу для каждого языка
    window.history.replaceState(null, "", `/articles/${id}/${code}`);
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const synthesis = useSelector((s) => s.synthesis ?? {});
  const current = synthesis.current;
  const status = synthesis.status || "idle";

  const currentId = current?._id;
  const currentBody = current?.body;

  useEffect(() => {
    if (id) dispatch(loadArticle(id));
    return () => dispatch(clearCurrent());
  }, [id, dispatch]);

  useEffect(() => {
    if (!currentId || !currentBody) return;

    if (locale === "ru") {
      setTranslatedContent(null);
      setTranslateState("idle");
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setTranslatedContent(null);
    setTranslateState("idle");

    const run = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_NEWS_API}/api/synthesis/${currentId}/translate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale }),
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentType = response.headers.get("content-type") || "";

        // ── Случай 1 & 2: JSON (кэш или translationPending) ──
        if (contentType.includes("application/json")) {
          const data = await response.json();
          if (controller.signal.aborted) return;

          if (data.translationPending) {
            // Перевод готовится в фоне — показываем русский + баннер
            setTranslateState("pending");
            setTranslatedContent(null);
          } else {
            // Готовый перевод из кэша
            setTranslatedContent(data.translated);
            setTranslateState("done");
          }
          return;
        }

        // ── Случай 3: SSE стрим (старые статьи без перевода) ─
        setTranslateState("streaming");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let bodyText = "";
        let pendingText = "";
        let rafId = null;

        const flush = () => {
          if (pendingText && !controller.signal.aborted) {
            const snap = pendingText;
            setTranslatedContent((prev) => ({
              title: prev?.title || "",
              body: (prev?.body || "") + snap,
            }));
            pendingText = "";
          }
          rafId = null;
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done || controller.signal.aborted) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                bodyText += data.chunk;
                pendingText += data.chunk;
                if (!rafId) rafId = requestAnimationFrame(flush);
              }
              if (data.done) {
                if (rafId) cancelAnimationFrame(rafId);
                if (!controller.signal.aborted) {
                  setTranslatedContent({ title: data.title, body: bodyText });
                  setTranslateState("done");
                }
              }
              if (data.error) {
                console.error("Stream error:", data.error);
                if (!controller.signal.aborted) setTranslateState("idle");
              }
            } catch {
              /* битый JSON */
            }
          }
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Translation error:", err.message);
        setTranslateState("idle");
      }
    };

    run();
    return () => {
      controller.abort();
      setTranslateState("idle");
    };
  }, [currentId, currentBody, locale]);

  const specialtyKey = current?.specialty
    ? normalizeSpecialtyKey(current.specialty)
    : "";
  const color = current
    ? SPECIALTY_COLORS[specialtyKey] || "#3a3830"
    : "#3a3830";
  const readMin = current
    ? Math.max(1, Math.round((current.wordCount || 0) / 200))
    : 0;

  const localeMap = {
    en: "en-US",
    ru: "ru-RU",
    az: "az-AZ",
    tr: "tr-TR",
    ar: "ar-EG",
  };
  const dateStr = current
    ? new Date(current.createdAt).toLocaleDateString(
        localeMap[i18n.language] || "en-US",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        },
      )
    : "";

  const displayTitle = translatedContent?.title || current?.title || "";
  const displayBody = translatedContent?.body || current?.body || "";
  const isStreaming = translateState === "streaming";
  const isPending = translateState === "pending";

  // ↓ ВОТ СЮДА — после isPending
  const seoForLocale = current?.seo?.[locale];
  const pageTitle = seoForLocale?.title || displayTitle || current?.title || "";
  const pageDesc =
    seoForLocale?.description ||
    (current?.body || "").replace(/#+\s/g, "").slice(0, 155);
  const canonical = `https://docpats.com/articles/${id}/${locale}`;
  const ogImage = `https://docpats.com/og-default.jpg`;
  const langCode = localeMap[locale] || "ru-RU";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    headline: pageTitle,
    description: pageDesc,
    url: canonical,
    inLanguage: langCode,
    datePublished: current?.createdAt,
    dateModified: current?.updatedAt || current?.createdAt,
    publisher: {
      "@type": "Organization",
      name: "DocPats",
      url: "https://docpats.com",
      logo: {
        "@type": "ImageObject",
        url: "https://docpats.com/logo.png",
      },
    },
    about: {
      "@type": "MedicalCondition",
      name: current?.specialty || "",
    },
    audience: {
      "@type": "MedicalAudience",
      audienceType: "Physician",
    },
    wordCount: current?.wordCount || 0,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "DocPats",
          item: "https://docpats.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Аналитика",
          item: "https://docpats.com/synthesis",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: current?.specialty || "",
          item: canonical,
        },
      ],
    },
  };
  if (status === "loading" || !current) {
    return (
      <>
        <style>{CSS}</style>
        <div className="sa-page">
          <div className="sa-state">
            <div className="sa-spinner" />
            <p className="sa-state-text">{t("loading_ai.article")}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <ReadingProgress color={color} />
      <Helmet>
        {/* Базовые */}
        <title>{pageTitle} | DocPats</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonical} />
        <html lang={locale} />
        <link
          rel="alternate"
          hreflang="ru"
          href={`https://docpats.com/articles/${id}/ru`}
        />
        <link
          rel="alternate"
          hreflang="en"
          href={`https://docpats.com/articles/${id}/en`}
        />
        <link
          rel="alternate"
          hreflang="az"
          href={`https://docpats.com/articles/${id}/az`}
        />
        <link
          rel="alternate"
          hreflang="ar"
          href={`https://docpats.com/articles/${id}/ar`}
        />
        <link
          rel="alternate"
          hreflang="tr"
          href={`https://docpats.com/articles/${id}/tr`}
        />
        <link
          rel="alternate"
          hreflang="x-default"
          href={`https://docpats.com/articles/${id}/ru`}
        />
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:locale" content={langCode} />
        <meta property="article:published_time" content={current?.createdAt} />
        <meta property="article:modified_time" content={current?.updatedAt} />
        <meta property="article:section" content={current?.specialty} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={ogImage} />

        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      <div className="sa-page">
        <div className="sa-topbar">
          <span className="sa-topbar-left">{t("topbar.title")}</span>
          <span className="sa-topbar-date">{dateStr}</span>
        </div>

        <nav className="sa-nav">
          <button
            className="sa-nav-back"
            onClick={() =>
              window.history.length > 1
                ? navigate(-1)
                : navigate("/public/articles")
            }
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
            {t("nav_ai.all_articles")}
          </button>
          <Link to="/public/news" className="sa-nav-logo">
            Doc<span>Pats</span>
          </Link>
          <span className="sa-nav-tag">{t("nav_ai.analytics")}</span>
        </nav>
        <nav
          aria-label="breadcrumb"
          style={{
            maxWidth: 780,
            margin: "0 auto",
            padding: "10px 40px",
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: 11,
            color: "#7a7668",
            letterSpacing: ".06em",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Link to="/" style={{ color: "#7a7668", textDecoration: "none" }}>
            DocPats
          </Link>
          <span>›</span>
          <Link
            to="/synthesis"
            style={{ color: "#7a7668", textDecoration: "none" }}
          >
            {t("nav_ai.analytics")}
          </Link>
          <span>›</span>
          <span style={{ color: "#3a3830" }}>{current?.specialty}</span>
        </nav>
        {/* LANG SWITCHER */}

        <article
          className="sa-article"
          itemScope
          itemType="https://schema.org/MedicalWebPage"
        >
          <header className="sa-header">
            <div className="sa-header-inner">
              <div className="sa-meta-row">
                <span className="sa-specialty" style={{ color }}>
                  {t(`specialties.${specialtyKey}`, current.specialty)}
                </span>
                <span className="sa-sep">·</span>
                <span className="sa-label">{t("meta_ai.ai_synthesis")}</span>
              </div>
              <h1 className="sa-headline" itemProp="headline">
                {displayTitle}
              </h1>
              <div className="sa-rule" style={{ background: color }} />
              <div className="sa-byline">
                <div className="sa-byline-left">
                  <span className="sa-source" style={{ color }}>
                    DocPats Editorial
                  </span>
                  <span className="sa-dot">·</span>
                  <time className="sa-date" dateTime={current?.createdAt}>
                    {dateStr}
                  </time>
                  <span className="sa-dot">·</span>
                  <span className="sa-readtime">
                    {t("meta_ai.reading_time", { count: readMin })}
                  </span>
                  <span className="sa-dot">·</span>
                  <span className="sa-readtime">
                    {t("meta_ai.words", { count: current.wordCount })}
                  </span>
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                    fontSize: 11,
                    fontFamily: "var(--mono)",
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                  }}
                >
                  <span
                    style={{
                      background: "rgba(184,48,48,.1)",
                      color: "#b83030",
                      padding: "3px 10px",
                      borderRadius: 2,
                      fontWeight: 500,
                    }}
                  >
                    {t("badges.our_analytics")}
                  </span>
                  <span>·</span>
                  <span className="sy-author">{t("author_name")}</span>
                </div>
              </div>
            </div>
          </header>

          <div className="sa-body">
            <div className="sa-body-inner">
              {/* ── Баннер "перевод готовится" ─────────────── */}
              {isPending && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 18px",
                    marginBottom: 32,
                    border: "1px solid var(--rule)",
                    borderLeft: "3px solid #8a6a00",
                    background: "#fdf8ec",
                    borderRadius: 2,
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    letterSpacing: ".08em",
                    color: "#8a6a00",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8a6a00"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {t(
                    "body_ai.translation_pending",
                    "Перевод готовится — обычно занимает до 10 минут после публикации. Показываем оригинал.",
                  )}
                </div>
              )}

              {/* ── Баннер "переводим статью" при стриминге ── */}
              {isStreaming && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    marginBottom: 32,
                    border: "1px solid var(--rule)",
                    borderLeft: "3px solid #3a3830",
                    background: "var(--paper2)",
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: "var(--ink2)",
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      flexShrink: 0,
                      border: "1.5px solid #cdc9bc",
                      borderTopColor: "#3a3830",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "sa-spin .7s linear infinite",
                    }}
                  />
                  {t("body_ai.translating", "Перевод статьи...")}
                </div>
              )}

              {renderBody(displayBody)}

              {/* Мигающий курсор при стриминге */}
              {isStreaming && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: "1.2em",
                    background: "#3a3830",
                    marginLeft: 3,
                    verticalAlign: "text-bottom",
                    animation: "sa-blink 1s step-end infinite",
                  }}
                />
              )}
            </div>
          </div>

          {current.sources?.length > 0 && (
            <footer className="sa-footer">
              <div className="sa-footer-inner">
                <div className="sa-footer-rule" style={{ background: color }} />
                <p className="sa-footer-pub">
                  {t("sources_ai.title")} ·{" "}
                  <strong style={{ color }}>
                    {t("sources_ai.materials", {
                      count: current.sources.length,
                    })}
                  </strong>
                </p>
                <div className="sa-sources-list">
                  {current.sources.map((s, i) => (
                    <div key={i} className="sa-source-item">
                      <span className="sa-source-num">[{i + 1}]</span>
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="sa-source-link"
                        >
                          {s.title}
                        </a>
                      ) : (
                        <span className="sa-source-title">{s.title}</span>
                      )}
                      {s.year && (
                        <span className="sa-source-year"> — {s.year}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* ── COMMENTS ── */}
                <div className="sa-comments-card">
                  <div className="sa-comments-header">
                    <FaCommentDots size={18} color="#0f766e" />
                    <span className="sa-comments-title">
                      {t("article_single.comments_title", "Комментарии")}
                    </span>
                    <span className="sa-comments-count">{commentCount}</span>
                  </div>
                  <div className="sa-comments-body">
                    {isAuthenticated ? (
                      <CommentSection refId={id} targetType="Article" />
                    ) : (
                      <div className="sa-auth-gate">
                        <div className="sa-auth-gate-icon">💬</div>
                        <div className="sa-auth-gate-title">
                          {t(
                            "article_single.comments_login_title",
                            "Присоединитесь к обсуждению",
                          )}
                        </div>
                        <div className="sa-auth-gate-sub">
                          {t(
                            "article_single.comments_login_sub",
                            "Войдите в аккаунт, чтобы оставлять комментарии и участвовать в профессиональных дискуссиях.",
                          )}
                        </div>
                        <div className="sa-auth-gate-actions">
                          <Link
                            to={`/login?redirect=/articles/${id}/${locale}`}
                            className="sa-btn-login"
                          >
                            {t("article_single.login_btn", "Войти")}
                          </Link>
                          <Link
                            to={`/registration?redirect=/articles/${id}/${locale}`}
                            className="sa-btn-register"
                          >
                            {t(
                              "article_single.register_btn",
                              "Зарегистрироваться",
                            )}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sa-footer-brand">
                  <span className="sa-footer-logo">
                    Doc<span>Pats</span>
                  </span>
                  <span className="sa-footer-tagline">
                    {t("footer_ai.platform")}
                  </span>
                </div>
              </div>
            </footer>
          )}

          <FooterAI />
        </article>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

.sa-page*,.sa-page *::before,.sa-page *::after{box-sizing:border-box}
.sa-page{--paper:#f7f4ee;--paper2:#ede9e0;--ink:#1c1a16;--ink2:#3a3830;--muted:#7a7668;--rule:#cdc9bc;--serif:'Playfair Display',Georgia,serif;--mono:'IBM Plex Mono','Courier New',monospace;--sans:'IBM Plex Sans',-apple-system,sans-serif;background:var(--paper);min-height:100vh;color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden;}
.sa-topbar{background:var(--ink);color:#7a7668;padding:0 40px;height:32px;display:flex;align-items:center;justify-content:space-between;font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;}
.sa-topbar-left{color:#6a6660;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sa-topbar-date{color:#5a5a52;white-space:nowrap;flex-shrink:0}
.sa-nav{position:sticky;top:0;z-index:200;background:var(--paper);border-bottom:3px double var(--ink);display:flex;align-items:center;justify-content:space-between;padding:0 40px;height:52px;gap:16px;}
.sa-nav-back{display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding:0;transition:color .15s;white-space:nowrap;}
.sa-nav-back:hover{color:var(--ink)}
.sa-nav-logo{font-family:'Playfair Display',Georgia,serif!important;font-size:26px;font-weight:900;letter-spacing:-.02em;color:var(--ink);text-decoration:none;line-height:1;}
.sa-nav-logo span{color:#b83030}
.sa-nav-tag{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);border:1px solid var(--rule);padding:4px 12px;white-space:nowrap;}
.sa-header{background:var(--paper2);border-bottom:2px solid var(--ink);padding:52px 0 0}
.sa-header-inner{max-width:780px;margin:0 auto;padding:0 40px 44px}
.sa-meta-row{display:flex;align-items:center;gap:8px;margin-bottom:20px;font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;}
.sa-specialty{font-weight:500}.sa-sep{color:var(--rule)}.sa-label{color:var(--muted)}
.sa-headline{font-family:var(--serif);font-size:clamp(26px,4vw,46px);font-weight:700;letter-spacing:-.025em;line-height:1.12;color:var(--ink);margin:0 0 22px;}
.sa-rule{height:4px;width:64px;margin-bottom:20px}
.sa-byline{padding-top:14px;border-top:1px solid var(--rule)}
.sa-byline-left{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sa-source{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.06em}
.sa-dot{color:var(--rule)}.sa-date,.sa-readtime{font-family:var(--mono);font-size:11px;color:var(--muted)}
.sa-body{padding:0}
.sa-body-inner{max-width:680px;margin:0 auto;padding:52px 40px 64px}
.sa-h1{font-family:var(--serif);font-size:clamp(22px,3vw,36px);font-weight:700;line-height:1.2;letter-spacing:-.02em;color:var(--ink);margin:0 0 24px;}
.sa-subhead{font-family:var(--serif);font-size:22px;font-weight:700;line-height:1.3;letter-spacing:-.015em;color:var(--ink);margin:2.8em 0 .9em;padding-top:1em;border-top:1px solid var(--rule);}
.sa-h3{font-family:var(--serif);font-size:18px;font-weight:700;margin:2em 0 .7em;color:var(--ink)}
.sa-para{font-family:var(--sans);font-size:17px;font-weight:300;line-height:1.85;color:var(--ink2);margin:0 0 1.6em;letter-spacing:.005em;}
.sa-para:first-of-type{font-family:var(--serif);font-size:19px;font-weight:400;line-height:1.75;color:var(--ink);}
.sa-ref{font-family:var(--mono);font-size:12px;color:var(--muted);margin:4px 0;line-height:1.6;}
.sa-footer{border-top:2px solid var(--ink);background:var(--paper2)}
.sa-footer-inner{max-width:780px;margin:0 auto;padding:0 40px 48px}
.sa-footer-rule{height:4px;width:64px;margin-bottom:28px}
.sa-footer-pub{font-family:var(--sans);font-size:14px;color:var(--ink2);margin-bottom:20px}
.sa-sources-list{display:flex;flex-direction:column;gap:8px;margin-bottom:32px}
.sa-source-item{display:flex;align-items:baseline;gap:8px;font-size:13px}
.sa-source-num{font-family:var(--mono);font-size:11px;color:var(--muted);flex-shrink:0}
.sa-source-link{color:var(--ink2);text-decoration:none;border-bottom:1px solid var(--rule);transition:border-color .15s}
.sa-source-link:hover{border-color:var(--ink)}
.sa-source-title{color:var(--ink2)}.sa-source-year{color:var(--muted);font-family:var(--mono);font-size:11px}
.sa-footer-brand{display:flex;align-items:center;gap:12px;padding-top:20px;border-top:1px solid var(--rule)}
.sa-footer-logo{font-family:'Playfair Display',Georgia,serif!important;font-size:20px;font-weight:900;letter-spacing:-.02em;color:var(--ink)}
.sa-footer-logo span{color:#b83030}
.sa-footer-tagline{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.sa-state{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;gap:16px}
.sa-spinner{width:28px;height:28px;border:2px solid var(--rule);border-top-color:var(--ink);border-radius:50%;animation:sa-spin .7s linear infinite}
@keyframes sa-spin{to{transform:rotate(360deg)}}
@keyframes sa-blink{0%,100%{opacity:1}50%{opacity:0}}
.sa-state-text{font-family:var(--serif);font-size:17px;font-style:italic;color:var(--muted)}

/* ── COMMENTS CARD ── */
.sa-comments-card{margin:48px 0 32px;border:1px solid var(--rule);background:var(--paper);border-radius:4px;overflow:hidden;}
.sa-comments-header{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--rule);background:var(--paper2);}
.sa-comments-title{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);font-weight:500;flex:1;}
.sa-comments-count{font-family:var(--mono);font-size:11px;color:var(--muted);background:var(--paper);border:1px solid var(--rule);padding:2px 10px;border-radius:10px;min-width:28px;text-align:center;}
.sa-comments-body{padding:20px;}

/* ── AUTH GATE ── */
.sa-auth-gate{display:flex;flex-direction:column;align-items:center;text-align:center;padding:32px 20px;gap:4px;}
.sa-auth-gate-icon{font-size:36px;margin-bottom:8px;opacity:.85;}
.sa-auth-gate-title{font-family:var(--serif);font-size:20px;font-weight:700;color:var(--ink);line-height:1.3;margin-bottom:6px;}
.sa-auth-gate-sub{font-family:var(--sans);font-size:14px;color:var(--muted);max-width:420px;line-height:1.6;margin-bottom:20px;}
.sa-auth-gate-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}
.sa-btn-login,.sa-btn-register{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:10px 20px;border-radius:2px;text-decoration:none;transition:all .15s;border:1px solid var(--ink);}
.sa-btn-login{background:var(--ink);color:var(--paper);}
.sa-btn-login:hover{background:#2a2822;}
.sa-btn-register{background:transparent;color:var(--ink);}
.sa-btn-register:hover{background:var(--ink);color:var(--paper);}

@media(max-width:768px){.sa-topbar{padding:0 20px}.sa-nav{padding:0 20px}.sa-nav-tag{display:none}.sa-header-inner{padding:0 20px 32px}.sa-body-inner{padding:36px 20px 52px}.sa-footer-inner{padding:0 20px 40px}}
@media(max-width:480px){.sa-topbar{display:none}.sa-nav{padding:0 14px}.sa-nav-logo{font-size:20px}.sa-header-inner{padding:0 14px 24px}.sa-headline{font-size:26px}.sa-body-inner{padding:28px 14px 44px}.sa-para{font-size:15.5px}.sa-footer-inner{padding:0 14px 32px}.sa-comments-header{padding:14px 16px}.sa-comments-body{padding:16px}.sa-auth-gate{padding:24px 12px}.sa-auth-gate-title{font-size:18px}.sa-btn-login,.sa-btn-register{padding:9px 16px;font-size:10px}}
`;
