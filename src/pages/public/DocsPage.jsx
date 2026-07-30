// client/src/pages/public/DocsPage.jsx
//
// Публичная страница документации: /docs/:section
//
// Одна страница на весь корпус, а не по странице на раздел. Корпус растёт по
// разделу на модуль, и компонент под каждый значил бы копию загрузки, копию
// выбора языка и копию обработки ошибок — расходятся они молча.
//
// Язык берётся из переключателя интерфейса, своего здесь нет намеренно: две
// ручки выбора языка на одном экране противоречат друг другу, и пользователь
// не понимает, какая главнее. Нет перевода на его язык — показываем русский
// оригинал, это лучше пустой страницы.

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import styles from "./DocsPage.module.css";

// Языки, на которых существует корпус. Неизвестный язык интерфейса сводится к
// русскому: на нём пишутся оригиналы.
const LANGS = ["ru", "en", "az", "tr", "ar"];
const FALLBACK = "ru";

// Отпечаток источника, который дописывает scripts/translateDocs.js. В тексте
// он невидим, но в разметку ему попадать незачем.
const STAMP = /<!--\s*translated-from-ru:[\s\S]*?-->/g;

/**
 * Netlify отдаёт index.html со статусом 200 на любой несуществующий путь
 * (redirect /* → /index.html). Поэтому res.ok здесь ничего не доказывает: без
 * этой проверки на неизвестном разделе врач увидел бы исходник HTML-страницы
 * вместо текста.
 */
function looksLikeHtml(text) {
  return text.trimStart().startsWith("<");
}

export default function DocsPage() {
  const { section } = useParams();
  const { t, i18n } = useTranslation();

  const [markdown, setMarkdown] = useState("");
  const [state, setState] = useState("loading"); // loading | ready | missing

  const lang = useMemo(() => {
    const code = String(i18n.language || FALLBACK).slice(0, 2).toLowerCase();
    return LANGS.includes(code) ? code : FALLBACK;
  }, [i18n.language]);

  // Раздел приходит из URL — в путь к файлу пускаем только безопасное имя.
  const safeSection = useMemo(
    () => String(section || "").toLowerCase().replace(/[^a-z0-9-]/g, ""),
    [section],
  );

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    async function load(code) {
      const res = await fetch(`/docs/${safeSection}/${code}.md`);
      if (!res.ok) throw new Error(String(res.status));
      const text = await res.text();
      if (looksLikeHtml(text)) throw new Error("not-a-doc");
      return text;
    }

    (async () => {
      if (!safeSection) {
        if (!cancelled) setState("missing");
        return;
      }
      let text = null;
      try {
        text = await load(lang);
      } catch {
        // Перевода на язык врача может не быть — это обычное состояние
        // свежего раздела, а не ошибка.
        try {
          text = await load(FALLBACK);
        } catch {
          text = null;
        }
      }
      if (cancelled) return;
      if (text) {
        setMarkdown(text.replace(STAMP, "").trimEnd());
        setState("ready");
      } else {
        setState("missing");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [safeSection, lang]);

  return (
    <div className={styles.page} dir={lang === "ar" ? "rtl" : "ltr"}>
      <article className={styles.doc}>
        {state === "loading" && (
          <p className={styles.note}>
            {t("docs.loading", { defaultValue: "Загружаем…" })}
          </p>
        )}

        {state === "missing" && (
          <p className={styles.note}>
            {t("docs.missing", {
              defaultValue: "Такого раздела документации нет.",
            })}
          </p>
        )}

        {state === "ready" && <ReactMarkdown>{markdown}</ReactMarkdown>}
      </article>
    </div>
  );
}
