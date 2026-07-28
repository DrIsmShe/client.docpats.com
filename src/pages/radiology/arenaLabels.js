// client/src/pages/radiology/arenaLabels.js
//
// Станции тренажёра и сборка ссылки на кейс.
//
// ЗДЕСЬ НЕТ ГОТОВЫХ ПОДПИСЕЙ — только ключи словаря. Раздел переводится на
// пять языков, и подпись, зашитая в код, оказалась бы русской в арабской
// версии. Сами тексты живут в public/locales/<lang>/arena.json.
//
// Вынесено из страницы-хаба, потому что этими данными пользуются и хаб, и
// дуэли, и вьюер, и админка. Раньше подписи лежали в файле страницы, и импорт
// подписи тянул за собой всю страницу вместе с её запросами к API.
//
// Про названия: раздел называется «Тренажёр диагностики», а не «Радиология».
// Внутри — снимки, анализы и виртуальный пациент; станций будет больше. Слово
// «радиология» осталось только в путях к файлам и в API, где оно историческое.

/** Станции тренажёра. Порядок — как в интерфейсе. */
export const STATIONS = [
  {
    key: "radiology",
    titleKey: "stationRadiology",
    whatKey: "whatRadiology",
    icon: "🩻",
    hrefFor: (id) => `/arena/cases/${id}`,
  },
  {
    key: "labs",
    titleKey: "stationLabs",
    whatKey: "whatLabs",
    icon: "🧪",
    hrefFor: (id) => `/arena/labs/cases/${id}`,
  },
  {
    key: "vp",
    titleKey: "stationVp",
    whatKey: "whatVp",
    icon: "🩺",
    hrefFor: (id) => `/arena/vp/cases/${id}`,
  },
];

export const STATION_BY_KEY = Object.fromEntries(STATIONS.map((s) => [s.key, s]));

/** Ссылка на кейс любой станции. */
export function caseHref(item) {
  const station = STATION_BY_KEY[item.station];
  return station ? station.hrefFor(item._id) : `/arena/cases/${item._id}`;
}

/** Модальности снимков. Ключ словаря — modality_<key>. */
export const MODALITIES = ["cxr", "ct", "mri", "us", "ecg", "mammography", "other"];

/** Подпись модальности: t из пространства имён arena. */
export function modalityLabel(t, key) {
  if (!key) return "";
  const label = t(`modality_${key}`, { defaultValue: "" });
  return label || key;
}

export const DIFFICULTIES = ["easy", "medium", "hard"];

/** Порядок сложности для сортировки — по возрастанию. */
export const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 };

// Совместимость со старым кодом (вьюер и админка ещё используют карту).
// Русские подписи здесь остаются намеренно: те экраны пока не переведены, и
// показать им пустую строку было бы хуже, чем показать русскую.
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
