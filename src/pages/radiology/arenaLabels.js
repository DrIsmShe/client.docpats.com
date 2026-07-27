// client/src/pages/radiology/arenaLabels.js
//
// Подписи тренажёра: станции, модальности, сложность + сборка ссылки на кейс.
//
// Вынесено из страницы-хаба, потому что этими подписями пользуются и хаб, и
// дуэли, и вьюер, и админка. Раньше они лежали в файле страницы, и импорт
// подписи тянул за собой всю страницу — включая её запросы к API.
//
// Про названия: раздел называется «Тренажёр диагностики», а не «Радиология».
// Внутри — снимки, анализы и виртуальный пациент; станций будет больше.
// Слово «радиология» осталось только в путях к файлам модуля и в API, где оно
// историческое, — врачу оно нигде не показывается.

/** Станции тренажёра. Порядок — как в интерфейсе. */
export const STATIONS = [
  {
    key: "radiology",
    title: "Снимки",
    icon: "🩻",
    what: "Найти патологию на изображении, назвать и поставить диагноз",
    hrefFor: (id) => `/arena/cases/${id}`,
  },
  {
    key: "labs",
    title: "Анализы",
    icon: "🧪",
    what: "Разобрать лабораторную панель: что значимо, что вторично",
    hrefFor: (id) => `/arena/labs/cases/${id}`,
  },
  {
    key: "vp",
    title: "Виртуальный пациент",
    icon: "🩺",
    what: "Собрать анамнез, назначить обследование, дойти до диагноза",
    hrefFor: (id) => `/arena/vp/cases/${id}`,
  },
];

export const STATION_BY_KEY = Object.fromEntries(STATIONS.map((s) => [s.key, s]));

/** Ссылка на кейс любой станции. */
export function caseHref(item) {
  const station = STATION_BY_KEY[item.station];
  return station ? station.hrefFor(item._id) : `/arena/cases/${item._id}`;
}

export const MODALITY_LABELS = {
  cxr: "Рентген ОГК",
  ct: "КТ",
  mri: "МРТ",
  us: "УЗИ",
  ecg: "ЭКГ",
  mammography: "Маммография",
  other: "Другое",
};

export const DIFFICULTY_LABELS = { easy: "Лёгкий", medium: "Средний", hard: "Сложный" };

/** Порядок сложности для сортировки — по возрастанию. */
export const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 };
