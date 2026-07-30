// client/src/pages/admin/docs/AdminDocsPage.jsx
//
// Корпус документации: что написано, на каких языках и что устарело.
//
// ЗАЧЕМ ОТДЕЛЬНАЯ СТРАНИЦА. Тексты лежат файлами в репозитории и переводятся
// скриптом. Пока разделов было два, их состояние держалось в голове; на десяти
// это уже не работает, а увидеть «арабский перевод отстал от русского» иначе
// можно только сравнив файлы вручную.
//
// Страница ЧИТАЮЩАЯ. Правка идёт в репозиторий, а не отсюда: текст — часть
// поставки, он проходит ревью и уезжает вместе с кодом. Кнопка «сохранить» в
// админке означала бы вторую версию правды, которая молча разойдётся с git.

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

const LANGS = [
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
  { code: "az", label: "Azərbaycan" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
];

const STATUS = {
  source: { label: "оригинал", color: "#0d2440", bg: "#eef2f7" },
  fresh: { label: "актуален", color: "#067647", bg: "#ecfdf3" },
  stale: { label: "устарел", color: "#b45309", bg: "#fffaeb" },
  missing: { label: "нет", color: "#b42318", bg: "#fef3f2" },
};

// Отпечаток источника, который дописывает scripts/translateDocs.js.
const STAMP = /<!--\s*translated-from-ru:[\s\S]*?-->/g;

export default function AdminDocsPage() {
  const [manifest, setManifest] = useState(null);
  const [error, setError] = useState("");
  const [section, setSection] = useState(null);
  const [lang, setLang] = useState("ru");
  const [text, setText] = useState("");
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/docs/index.json");
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (cancelled) return;
        setManifest(data);
        setSection(data.sections?.[0]?.name ?? null);
      } catch {
        if (!cancelled) {
          setError(
            "Опись корпуса не найдена. Она создаётся при прогоне server/scripts/translateDocs.js.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!section) return;
    let cancelled = false;
    setLoadingText(true);
    (async () => {
      try {
        const res = await fetch(`/docs/${section}/${lang}.md`);
        const body = await res.text();
        // Netlify отдаёт index.html со статусом 200 на несуществующий путь,
        // поэтому res.ok здесь ничего не доказывает.
        if (!res.ok || body.trimStart().startsWith("<")) throw new Error("missing");
        if (!cancelled) setText(body.replace(STAMP, "").trimEnd());
      } catch {
        if (!cancelled) setText("");
      } finally {
        if (!cancelled) setLoadingText(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [section, lang]);

  const current = useMemo(
    () => manifest?.sections?.find((s) => s.name === section) ?? null,
    [manifest, section],
  );

  const totals = useMemo(() => {
    const acc = { fresh: 0, stale: 0, missing: 0 };
    for (const s of manifest?.sections ?? []) {
      for (const [code, info] of Object.entries(s.languages ?? {})) {
        if (code === "ru") continue;
        if (acc[info.status] !== undefined) acc[info.status] += 1;
      }
    }
    return acc;
  }, [manifest]);

  if (error) {
    return (
      <main className="rad-page">
        <div className="edu-notice" style={{ marginTop: 16 }}>{error}</div>
      </main>
    );
  }

  return (
    <main className="rad-page">
      <div className="edu-card-title" style={{ fontSize: 20 }}>
        Документация для пользователей
      </div>
      <div className="edu-hint" style={{ marginBottom: 12 }}>
        Тексты корпуса и состояние переводов. Правка — в репозитории
        (<code>client/public/docs/&lt;раздел&gt;/ru.md</code>), затем{" "}
        <code>node scripts/translateDocs.js &lt;раздел&gt;</code>. Отсюда только
        чтение: вторая версия правды рядом с git разойдётся с ней молча.
      </div>

      {manifest && (
        <div className="edu-hint" style={{ marginBottom: 12 }}>
          Разделов: <b>{manifest.sections.length}</b> · переводов актуальных:{" "}
          <b>{totals.fresh}</b>
          {totals.stale > 0 && <> · устарело: <b>{totals.stale}</b></>}
          {totals.missing > 0 && <> · отсутствует: <b>{totals.missing}</b></>}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Разделы */}
        <div className="rad-panel" style={{ flex: "0 0 280px", minWidth: 240 }}>
          <div className="edu-card-title" style={{ fontSize: 15 }}>Разделы</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {(manifest?.sections ?? []).map((s) => {
              const problems = Object.entries(s.languages ?? {}).filter(
                ([code, info]) => code !== "ru" && info.status !== "fresh",
              ).length;
              const active = s.name === section;
              return (
                <button
                  key={s.name}
                  type="button"
                  className={`edu-btn ${active ? "" : "edu-btn--ghost"}`}
                  style={{ justifyContent: "flex-start", textAlign: "left", padding: "8px 10px" }}
                  onClick={() => setSection(s.name)}
                >
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</span>
                    <span style={{ fontSize: 11, opacity: 0.75 }}>
                      /docs/{s.name}
                      {problems > 0 ? ` · требует внимания: ${problems}` : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Текст */}
        <div className="rad-panel" style={{ flex: "1 1 520px", minWidth: 320 }}>
          {current && (
            <>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {LANGS.map((l) => {
                  const info = current.languages?.[l.code] ?? { status: "missing" };
                  const s = STATUS[info.status] ?? STATUS.missing;
                  const active = lang === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLang(l.code)}
                      className="edu-btn edu-btn--ghost"
                      style={{
                        padding: "4px 10px",
                        fontSize: 12,
                        border: `1px solid ${active ? s.color : "#dbe2ea"}`,
                        background: active ? s.bg : "transparent",
                        color: s.color,
                        fontWeight: active ? 700 : 500,
                      }}
                      title={`${l.label}: ${s.label}`}
                    >
                      {l.code.toUpperCase()} · {s.label}
                    </button>
                  );
                })}
                <a
                  className="edu-btn edu-btn--ghost"
                  style={{ padding: "4px 10px", fontSize: 12, marginInlineStart: "auto" }}
                  href={`/docs/${current.name}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  открыть на сайте
                </a>
              </div>

              <div
                dir={lang === "ar" ? "rtl" : "ltr"}
                style={{
                  borderTop: "1px solid #e6ecf3",
                  paddingTop: 12,
                  maxHeight: "70vh",
                  overflowY: "auto",
                  lineHeight: 1.6,
                }}
              >
                {loadingText && <div className="edu-hint">Загружаем…</div>}
                {!loadingText && !text && (
                  <div className="edu-notice">
                    Перевода на этот язык нет. Создаётся командой{" "}
                    <code>node scripts/translateDocs.js {current.name} {lang}</code>.
                  </div>
                )}
                {!loadingText && text && <ReactMarkdown>{text}</ReactMarkdown>}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
