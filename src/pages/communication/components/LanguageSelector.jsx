// client/src/communication/components/LanguageSelector.jsx
//
// Выбор языка перевода из 100+ языков мира.
// Есть поиск — без него листать неудобно.

import React, { useState, useEffect, useRef } from "react";
import {
  getSupportedLanguages,
  savePreferredLanguage,
} from "../hooks/useMessageTranslation";

// Флаги для самых популярных языков
const FLAGS = {
  af: "🇿🇦",
  sq: "🇦🇱",
  hy: "🇦🇲",
  az: "🇦🇿",
  eu: "🏴",
  be: "🇧🇾",
  bs: "🇧🇦",
  bg: "🇧🇬",
  ca: "🏴",
  hr: "🇭🇷",
  cs: "🇨🇿",
  da: "🇩🇰",
  nl: "🇳🇱",
  en: "🇬🇧",
  et: "🇪🇪",
  fi: "🇫🇮",
  fr: "🇫🇷",
  gl: "🏴",
  ka: "🇬🇪",
  de: "🇩🇪",
  el: "🇬🇷",
  hu: "🇭🇺",
  is: "🇮🇸",
  ga: "🇮🇪",
  it: "🇮🇹",
  lv: "🇱🇻",
  lt: "🇱🇹",
  lb: "🇱🇺",
  mk: "🇲🇰",
  mt: "🇲🇹",
  no: "🇳🇴",
  pl: "🇵🇱",
  pt: "🇵🇹",
  ro: "🇷🇴",
  ru: "🇷🇺",
  sr: "🇷🇸",
  sk: "🇸🇰",
  sl: "🇸🇮",
  es: "🇪🇸",
  sv: "🇸🇪",
  uk: "🇺🇦",
  cy: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
  hi: "🇮🇳",
  bn: "🇧🇩",
  gu: "🇮🇳",
  id: "🇮🇩",
  kn: "🇮🇳",
  km: "🇰🇭",
  lo: "🇱🇦",
  ms: "🇲🇾",
  ml: "🇮🇳",
  mr: "🇮🇳",
  my: "🇲🇲",
  ne: "🇳🇵",
  pa: "🇮🇳",
  si: "🇱🇰",
  ta: "🇮🇳",
  te: "🇮🇳",
  th: "🇹🇭",
  tl: "🇵🇭",
  ur: "🇵🇰",
  uz: "🇺🇿",
  vi: "🇻🇳",
  ar: "🇸🇦",
  he: "🇮🇱",
  fa: "🇮🇷",
  tr: "🇹🇷",
  ku: "🏴",
  kk: "🇰🇿",
  ky: "🇰🇬",
  mn: "🇲🇳",
  tg: "🇹🇯",
  tk: "🇹🇲",
  tt: "🇷🇺",
  am: "🇪🇹",
  ha: "🇳🇬",
  ig: "🇳🇬",
  sw: "🇰🇪",
  yo: "🇳🇬",
  zu: "🇿🇦",
  so: "🇸🇴",
  rw: "🇷🇼",
  mg: "🇲🇬",
};

export default function LanguageSelector({ value = "ru", onChange }) {
  const [languages, setLanguages] = useState([]);
  const [search, setSearch] = useState("");
  const [current, setCurrent] = useState(value);
  const [status, setStatus] = useState(null); // "saving"|"saved"|"error"
  const searchRef = useRef(null);

  useEffect(() => {
    getSupportedLanguages().then(setLanguages);
  }, []);

  useEffect(() => {
    setCurrent(value);
  }, [value]);

  const filtered = languages.filter(({ code, name }) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
  });

  const handleSelect = async (lang) => {
    if (lang === current) return;
    const prev = current;
    setCurrent(lang);
    setStatus("saving");
    const ok = await savePreferredLanguage(lang);
    if (ok) {
      setStatus("saved");
      onChange?.(lang);
      setTimeout(() => setStatus(null), 2000);
    } else {
      setCurrent(prev);
      setStatus("error");
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const currentLang = languages.find((l) => l.code === current);

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* Текущий выбранный язык */}
      {currentLang && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "rgba(61,127,255,0.08)",
            borderRadius: 8,
            marginBottom: 10,
            border: "1.5px solid rgba(61,127,255,0.25)",
          }}
        >
          <span style={{ fontSize: 20 }}>{FLAGS[current] || "🌐"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#3d7fff" }}>
              {currentLang.name}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              Язык перевода входящих сообщений
            </div>
          </div>
          {status === "saving" && (
            <span
              style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}
            >
              Сохраняем...
            </span>
          )}
          {status === "saved" && (
            <span
              style={{ marginLeft: "auto", fontSize: 11, color: "#22c55e" }}
            >
              ✓ Сохранено
            </span>
          )}
          {status === "error" && (
            <span
              style={{ marginLeft: "auto", fontSize: 11, color: "#ef4444" }}
            >
              Ошибка
            </span>
          )}
        </div>
      )}

      {/* Поиск */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск языка..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "7px 32px 7px 10px",
            border: "1.5px solid #1e2535",
            borderRadius: 8,
            background: "#0d1117",
            color: "#e2e8f0",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Список языков */}
      <div
        style={{
          maxHeight: 220,
          overflowY: "auto",
          border: "1px solid #1e2535",
          borderRadius: 8,
          background: "#0d1117",
        }}
      >
        {filtered.length === 0 && (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#64748b",
              fontSize: 13,
            }}
          >
            Язык не найден
          </div>
        )}
        {filtered.map(({ code, name }) => {
          const active = code === current;
          return (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              disabled={status === "saving"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 12px",
                background: active ? "rgba(61,127,255,0.12)" : "transparent",
                border: "none",
                borderBottom: "1px solid #1e2535",
                color: active ? "#3d7fff" : "#94a3b8",
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.1s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: 18, width: 24, flexShrink: 0 }}>
                {FLAGS[code] || "🌐"}
              </span>
              <span style={{ fontWeight: active ? 600 : 400 }}>{name}</span>
              <span
                style={{ marginLeft: "auto", fontSize: 10, color: "#64748b" }}
              >
                {code}
              </span>
              {active && (
                <span style={{ color: "#3d7fff", fontSize: 14 }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 6, fontSize: 11, color: "#64748b" }}>
        {languages.length} языков · GPT-4o-mini
      </div>
    </div>
  );
}
