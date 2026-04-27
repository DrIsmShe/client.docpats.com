import { useState, useEffect } from "react";
import i18n from "../i18n";

export const useLanguage = () => {
  const [language, setLanguage] = useState(
    () => localStorage.getItem("docpats_lang") || i18n.language || "ru",
  );

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("docpats_lang", lang);
    i18n.changeLanguage(lang); // синхронизируем i18next
  };

  return { language, setLanguage: changeLanguage };
};
