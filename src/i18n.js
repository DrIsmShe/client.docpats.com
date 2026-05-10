import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: localStorage.getItem("lang") || "ru",
    fallbackLng: "ru",
    debug: false,

    ns: [
      "common",
      "patientDetail",
      "doctorProfile",
      "footer",
      "header",
      "Anthropometry",
      "clinic",
    ],
    defaultNS: "common",

    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
