import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import { resolveInitialLanguage, isRtl } from "./lib/language";

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    // Порядок выбора — в src/lib/language.js: АДРЕС главнее сохранённого.
    // Раньше здесь стоял только localStorage, и из-за этого поисковая выдача
    // врала: эдж-функция отдавала боту арабские теги по адресу ?locale=ar,
    // а приложение затем рисовало страницу на языке из хранилища.
    lng: resolveInitialLanguage(),
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
      // Остальной кабинет пациента — по той же причине, что и
      // patientExam: анкета, уведомления и журнал доступа не должны
      // мигать ключами на первом кадре.
      "patientArea",
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

// ─── Язык и направление письма самого документа ───────────────
//
// Раньше dir/lang выставлял только ClinicLayout — то есть ровно
// внутри кабинета клиники. Публичная витрина (/:slug), карточка
// врача и всё остальное идут мимо этого лейаута и оставались
// <html lang="en" dir="ltr"> с арабским текстом внутри. Это не косметика:
// при dir="ltr" в смешанной строке браузер ставит знаки препинания и числа
// не с той стороны, а неверный <html lang> — это ещё и то, что читает
// поисковик и скринридер.
//
// Живёт здесь, а не в компоненте, потому что i18n — единственное место,
// которое знает язык до первой отрисовки React.
//
// Эдж-функция выставляет те же атрибуты в СЫРОМ HTML (бот до JS не доходит);
// здесь они подтверждаются и следуют за переключением языка на живой
// странице. Значения обязаны совпадать — оттого список RTL-языков общий,
// в src/lib/language.js.
export function applyDocumentLanguage(lng) {
  if (typeof document === "undefined") return;
  const lang = String(lng || "ru").split("-")[0];
  const el = document.documentElement;
  el.setAttribute("lang", lang);
  el.setAttribute("dir", isRtl(lang) ? "rtl" : "ltr");
}

applyDocumentLanguage(i18n.language);
i18n.on("languageChanged", applyDocumentLanguage);

export default i18n;
