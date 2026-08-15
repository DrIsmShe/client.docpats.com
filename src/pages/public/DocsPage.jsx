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
import { Link, useParams } from "react-router-dom";
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

/**
 * Ссылки внутри документации.
 *
 * Три разных случая, и путать их нельзя:
 *
 *   #якорь      — оглавление внутри самого документа (руководство по
 *                 симуляции целиком на них построено). Абсолютным его
 *                 делать нельзя, новую вкладку открывать тем более:
 *                 перескок должен происходить на этой же странице.
 *   mailto:/tel: — не адрес страницы. Трогать нечего.
 *   /раздел      — ссылка на страницу сайта. Разворачивается в полный
 *                 адрес и открывается в новой вкладке, чтобы читатель не
 *                 терял место в документе.
 *
 * Полный адрес собирается из origin в момент отрисовки, а не зашит в
 * markdown: на docpats.com получится https://docpats.com/pricing, на
 * localhost — localhost. Иначе проверять документацию локально было бы
 * невозможно: любая ссылка уводила бы на прод.
 */
function absoluteUrl(path) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://docpats.com";
  return /^https?:/i.test(path)
    ? path
    : `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

function DocLink({ href = "", children, node, ...rest }) {
  const isAnchor = href.startsWith("#");
  const isProtocol = /^[a-z][a-z0-9+.-]*:/i.test(href); // mailto:, tel:, https:

  if (isAnchor || (isProtocol && !/^https?:/i.test(href))) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <a href={absoluteUrl(href)} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}

/**
 * Адреса страниц, набранные в тексте моноширинным шрифтом.
 *
 * В корпусе они записаны как `/patient/my-lab-results` — то есть кодом, а не
 * markdown-ссылкой. Так их и писать удобнее (в тексте это скорее «название
 * места», чем ссылка), и переводчику они достаются нетронутыми: содержимое
 * обратных кавычек модель не переводит. Но читателю от этого не легче —
 * приходится копировать путь руками в адресную строку.
 *
 * Поэтому ссылку делаем на отрисовке, а не в исходниках: markdown остаётся
 * прежним, а кликабельными становятся сразу все разделы, включая будущие.
 *
 * Два случая исключены намеренно:
 *
 *   - блок кода (```) — там путь стоит внутри примера, а не как адрес;
 *   - путь с подстановкой: `/dp/patient-detail/<id>`, `/clinics/<адрес
 *     клиники>`. Такого адреса не существует, ссылка привела бы на «страница
 *     не найдена». Их в корпусе десять, и они остаются просто кодом.
 */
const PATH_IN_CODE = /^\/[A-Za-z0-9][A-Za-z0-9/_-]*$/;

function DocCode({ inline, className, children, node, ...rest }) {
  const text = (Array.isArray(children) ? children.join("") : String(children ?? "")).trim();

  if (!inline || !PATH_IN_CODE.test(text)) {
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    );
  }

  return (
    <a
      className={styles.pathLink}
      href={absoluteUrl(text)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <code className={className} {...rest}>
        {children}
      </code>
    </a>
  );
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

        {state === "ready" && (
          <>
            {/* Возврат к оглавлению: без него читатель, пришедший по прямой
                ссылке, не узнает, что разделов ещё двенадцать. */}
            <Link className={styles.backLink} to="/docs">
              ← {t("docs.allSections", { defaultValue: "Все разделы" })}
            </Link>
            <ReactMarkdown components={{ a: DocLink, code: DocCode }}>
              {markdown}
            </ReactMarkdown>
          </>
        )}
      </article>
    </div>
  );
}
