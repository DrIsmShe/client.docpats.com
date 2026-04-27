// src/pages/simulation/pages/HelpPage.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

import styles from "./HelpPage.module.css";

/* ──────────────────────────────────────────────────────────────────────────
   Help page с автоподгрузкой markdown'а по текущему языку.
   Путь файлов: /docs/simulation/{lng}.md (static из public/).

   Fallback — ru.md если локализованной версии нет.

   Без remark-gfm: таблицы в .md заменены на списки.
   ────────────────────────────────────────────────────────────────────────── */

const SUPPORTED = ["ru", "en", "tr", "az", "ar"];
const LANG_LABELS = {
  ru: "Русский",
  en: "English",
  tr: "Türkçe",
  az: "Azərbaycan",
  ar: "العربية",
};
/* ────────── Helpers ────────── */

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function childrenToText(children) {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children
      .map(function (c) {
        if (typeof c === "string") return c;
        if (c && c.props && c.props.children) {
          return childrenToText(c.props.children);
        }
        return "";
      })
      .join("");
  }
  if (children && children.props && children.props.children) {
    return childrenToText(children.props.children);
  }
  return "";
}

/* ────────── Отдельный компонент для H2 с якорем ──────────
   Вынесен из inline чтобы избежать parsing-ошибок некоторых версий
   ESLint parser с деструктуризацией в стрелочной функции. */
function HeadingWithId(props) {
  const text = childrenToText(props.children);
  const id = slugify(text);
  return <h2 id={id}>{props.children}</h2>;
}

const markdownComponents = {
  h2: HeadingWithId,
};

/* ────────── Главный компонент ────────── */

export default function HelpPage() {
  const { t, i18n } = useTranslation("Simulation");
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  const lang = useMemo(
    function () {
      const raw = i18n.language || "ru";
      const base = raw.split("-")[0].toLowerCase();
      return SUPPORTED.indexOf(base) >= 0 ? base : "ru";
    },
    [i18n.language],
  );

  /* Загрузка markdown */
  useEffect(
    function () {
      let cancelled = false;
      setLoading(true);
      setError(null);

      async function tryFetch(code) {
        const res = await fetch("/docs/simulation/" + code + ".md");
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      }

      (async function () {
        try {
          let text;
          try {
            text = await tryFetch(lang);
          } catch (e) {
            text = await tryFetch("ru");
          }
          if (!cancelled) {
            setMarkdown(text);
            setLoading(false);
          }
        } catch (err) {
          if (!cancelled) {
            setError(err.message);
            setLoading(false);
          }
        }
      })();

      return function () {
        cancelled = true;
      };
    },
    [lang],
  );

  /* Парсим h2 заголовки для sidebar TOC */
  const tocItems = useMemo(
    function () {
      if (!markdown) return [];
      const lines = markdown.split("\n");
      const result = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.indexOf("## ") === 0) {
          const title = line.replace(/^##\s+/, "").trim();
          const id = slugify(title);
          result.push({ title: title, id: id });
        }
      }
      return result;
    },
    [markdown],
  );

  /* Scroll-spy */
  useEffect(
    function () {
      if (!containerRef.current) return undefined;
      const headings = containerRef.current.querySelectorAll("h2[id]");
      if (headings.length === 0) return undefined;

      const observer = new IntersectionObserver(
        function (entries) {
          const visible = entries.filter(function (e) {
            return e.isIntersecting;
          });
          if (visible.length > 0) {
            const first = visible[0].target;
            setActiveSection(first.id);
          }
        },
        { rootMargin: "-80px 0px -70% 0px" },
      );

      headings.forEach(function (h) {
        observer.observe(h);
      });

      return function () {
        observer.disconnect();
      };
    },
    [markdown],
  );

  function handleTocClick(e, id) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* Render */
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTopRow}>
          <button
            type="button"
            onClick={function () {
              navigate("/dp/simulation");
            }}
            className={styles.backBtn}
          >
            ← {t("help.backToList")}
          </button>

          {/* Language switcher — только для этой страницы */}
          <div className={styles.langSwitcher}>
            {SUPPORTED.map(function (code) {
              const isActive = lang === code;
              return (
                <button
                  key={code}
                  type="button"
                  className={
                    isActive
                      ? styles.langBtn + " " + styles.langBtnActive
                      : styles.langBtn
                  }
                  onClick={function () {
                    i18n.changeLanguage(code);
                  }}
                  title={LANG_LABELS[code]}
                >
                  {code.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
        <h1 className={styles.title}>{t("help.pageTitle")}</h1>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>{t("help.toc")}</div>
          <nav className={styles.tocList}>
            {tocItems.map(function (item) {
              const linkClass =
                activeSection === item.id
                  ? styles.tocLink + " " + styles.tocLinkActive
                  : styles.tocLink;
              return (
                <a
                  key={item.id}
                  href={"#" + item.id}
                  onClick={function (e) {
                    handleTocClick(e, item.id);
                  }}
                  className={linkClass}
                >
                  {item.title}
                </a>
              );
            })}
          </nav>
        </aside>

        <main className={styles.content} ref={containerRef}>
          {loading && (
            <div className={styles.stateBox}>{t("help.loading")}</div>
          )}
          {error && (
            <div className={styles.stateBox}>
              {t("help.loadError")}: {error}
            </div>
          )}
          {!loading && !error && (
            <article className={styles.markdown}>
              <ReactMarkdown components={markdownComponents}>
                {markdown}
              </ReactMarkdown>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
