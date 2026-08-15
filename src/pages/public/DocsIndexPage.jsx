// client/src/pages/public/DocsIndexPage.jsx
//
// Оглавление документации: /docs
//
// До него тринадцать разделов существовали, переводились на пять языков —
// и были недостижимы: в футере жили ссылки на четыре, на остальные девять
// не вело ничего. Попасть можно было только набрав адрес руками.
//
// Список берётся из docs/index.json — того самого манифеста, который
// пересобирает scripts/translateDocs.js. Заголовки лежат там на каждом
// языке, поэтому тянуть тринадцать markdown-файлов ради первой строки
// каждого не нужно.

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./DocsPage.module.css";

const LANGS = ["ru", "en", "az", "tr", "ar"];
const FALLBACK = "ru";

// Порядок витрины. Разделы, которых здесь нет, идут следом в алфавитном
// порядке — новый раздел появится в списке сам, без правки этого файла.
const ORDER = [
  "for-patients",
  "for-doctors",
  "clinic",
  "clinic-workflows",
  "patient-cabinet",
  "doctor-schedule",
  "doctor-patients",
  "doctor-records",
  "doctor-diagnostics",
  "exams",
  "simulation",
  "privacy",
  "hipaa",
];

export default function DocsIndexPage() {
  const { t, i18n } = useTranslation();
  const [sections, setSections] = useState(null);
  const [failed, setFailed] = useState(false);

  const lang = useMemo(() => {
    const code = String(i18n.language || FALLBACK).slice(0, 2).toLowerCase();
    return LANGS.includes(code) ? code : FALLBACK;
  }, [i18n.language]);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://docpats.com";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/docs/index.json");
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!cancelled) setSections(data.sections || []);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ordered = useMemo(() => {
    if (!sections) return [];
    const rank = (name) => {
      const i = ORDER.indexOf(name);
      return i === -1 ? ORDER.length : i;
    };
    return [...sections].sort(
      (a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name),
    );
  }, [sections]);

  return (
    <div className={styles.page} dir={lang === "ar" ? "rtl" : "ltr"}>
      <article className={styles.doc}>
        <h1>{t("docs.indexTitle", { defaultValue: "Документация" })}</h1>

        {failed && (
          <p className={styles.note}>
            {t("docs.indexFailed", {
              defaultValue: "Не удалось загрузить список разделов.",
            })}
          </p>
        )}

        {!sections && !failed && (
          <p className={styles.note}>
            {t("docs.loading", { defaultValue: "Загружаем…" })}
          </p>
        )}

        {sections && (
          <ul>
            {ordered.map((s) => {
              // Заголовок на языке читателя; нет перевода — русский
              // оригинал, это лучше пустой строки.
              const title =
                s.languages?.[lang]?.title ||
                s.languages?.[FALLBACK]?.title ||
                s.title ||
                s.name;
              return (
                <li key={s.name}>
                  {/* Полный адрес и новая вкладка: раздел документации —
                      самостоятельная страница, на которую дают ссылку
                      коллеге, а не шаг внутри сценария. Origin берётся в
                      момент отрисовки, поэтому локально ссылки остаются
                      локальными, а на проде становятся docpats.com. */}
                  <a
                    href={`${origin}/docs/${s.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {title}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </div>
  );
}
