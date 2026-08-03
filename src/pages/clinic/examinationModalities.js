// client/src/pages/clinic/examinationModalities.js
//
// Справочник видов исследований и видов заготовок для протокола.
//
// ОДИН СПИСОК ВМЕСТО СЕМНАДЦАТИ ЭКРАНОВ. В единоличной практике (модуль
// myClinic) на каждый вид исследования заведён свой экран, свой набор
// маршрутов и своя пятёрка моделей. Здесь вид исследования — это ЗНАЧЕНИЕ:
// формы и списки одни на всех, а различает их выбранная модальность.
// Добавить восемнадцатый вид — дописать строку сюда.
//
// Ключи (`key`) обязаны совпадать с enum studyType в серверной модели
// ImagingStudy и со списком VALID_STUDY_TYPES в imaging.service.js.

export const MODALITIES = [
  { key: "CT", label: "КТ", radiation: true },
  { key: "MRI", label: "МРТ", radiation: false },
  { key: "USG", label: "УЗИ", radiation: false },
  { key: "X-Ray", label: "Рентген", radiation: true },
  { key: "PET", label: "ПЭТ", radiation: true },
  { key: "SPECT", label: "ОФЭКТ", radiation: true },
  { key: "EEG", label: "ЭЭГ", radiation: false },
  { key: "ECG", label: "ЭКГ", radiation: false },
  { key: "EchoECG", label: "ЭхоКГ", radiation: false },
  { key: "Holter", label: "Холтер", radiation: false },
  { key: "Spirometry", label: "Спирометрия", radiation: false },
  { key: "Doppler", label: "Допплер", radiation: false },
  { key: "Coronography", label: "Коронография", radiation: true },
  { key: "Angiography", label: "Ангиография", radiation: true },
  { key: "Gastroscopy", label: "Гастроскопия", radiation: false },
  { key: "Colonoscopy", label: "Колоноскопия", radiation: false },
  { key: "CapsuleEndoscopy", label: "Капсульная эндоскопия", radiation: false },
  { key: "Gynecology", label: "Гинекология", radiation: false },
];

/**
 * Четыре блока, из которых врач собирает протокол. Порядок тот же, в каком
 * они идут в форме, и тот же, что в myClinic: название → протокол →
 * заключение → рекомендации.
 */
export const TEMPLATE_KINDS = [
  { key: "nameOfExam", label: "Название исследования", field: "nameOfExam" },
  { key: "report", label: "Протокол", field: "report" },
  { key: "diagnosis", label: "Заключение", field: "diagnosis" },
  { key: "recommendation", label: "Рекомендации", field: "recommendation" },
];

/** Подпись вида исследования; неизвестный ключ показываем как есть. */
export function modalityLabel(key) {
  return MODALITIES.find((m) => m.key === key)?.label || key;
}

/**
 * Бывает ли у этого исследования доза облучения.
 *
 * В myClinic поле дозы стояло во всех семнадцати формах, включая ЭКГ и
 * спирометрию, — это следствие копирования экрана, а не замысел. Здесь
 * поле показывается только там, где имеет смысл; сервер, со своей стороны,
 * отбрасывает дозу у нелучевых методов.
 */
export function hasRadiation(key) {
  return Boolean(MODALITIES.find((m) => m.key === key)?.radiation);
}
