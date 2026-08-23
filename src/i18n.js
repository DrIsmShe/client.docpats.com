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
      "clinicReviews",
      "education",
      "diagnostics",
      "arena",
      // Справочник модальностей: сервер отдаёт его по-русски, потому что
      // те же строки служат протоколом в промпте разбора.
      "modalities",
      // Страницы исследований пациента. Здесь namespace предзагружается,
      // а не подтягивается по требованию, из-за useSuspense: false ниже:
      // до загрузки t() возвращает сам ключ, и медицинская карта на миг
      // показала бы «card.dob» вместо даты рождения. 8 КБ против такого
      // первого впечатления — приемлемая цена.
      "patientExam",
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
