import React from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

const LANGS = [
  { code: "en", label: "EN", name: "English" },
  { code: "az", label: "AZ", name: "Azərbaycan" },
  { code: "tr", label: "TR", name: "Türkçe" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "ar", label: "AR", name: "العربية" },
];

const STYLES = `
  .dp-lang-select-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .dp-lang-select-wrap::after {
    content: '';
    position: absolute;
    right: 9px;
    top: 50%;
    transform: translateY(-50%);
    width: 0; height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4.5px solid #5a6f8f;
    pointer-events: none;
    transition: border-top-color .15s;
  }
  .dp-lang-select-wrap:hover::after {
    border-top-color: #1447e6;
  }

  .dp-lang-select {
    appearance: none;
    -webkit-appearance: none;
    background: white;
    border: 1px solid #c8d6ee;
    border-radius: 8px;
    padding: 7px 28px 7px 10px;
    font-family: 'Geist Mono', 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    color: #2d3f5c;
    letter-spacing: .06em;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(10,22,40,.06);
    transition: all .15s;
    outline: none;
    min-width: 58px;
  }

  .dp-lang-select:hover {
    border-color: #1447e6;
    color: #1447e6;
    background: #eef2ff;
  }

  .dp-lang-select:focus {
    border-color: #1447e6;
    box-shadow: 0 0 0 3px rgba(20,71,230,.12);
  }

  /* на очень маленьких экранах — ещё компактнее */
  @media (max-width: 400px) {
    .dp-lang-select {
      padding: 6px 24px 6px 8px;
      font-size: 11px;
      min-width: 50px;
    }
  }
`;

export default function LanguageSwitcher() {
  const { t } = useTranslation("common");
  const current = localStorage.getItem("lang") || i18n.language || "en";

  const handleChange = async (e) => {
    const lang = e.target.value;
    localStorage.setItem("lang", lang);
    await i18n.changeLanguage(lang);
    window.location.reload();
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="dp-lang-select-wrap">
        <select
          className="dp-lang-select"
          value={current}
          onChange={handleChange}
          aria-label={t("header.selectLanguage")}
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
