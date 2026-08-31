// ВНИМАНИЕ: подпись выбирается по labelKey, а label — только запасной текст.
//
// Списки вычисляются один раз при загрузке файла, когда язык ещё никто не
// выбирал. Подпись, записанная сюда строкой, останется на языке автора при
// любом переключении — так на английской странице оставались «КТ» и
// «Название исследования». Подпись берётся при отрисовке: t(x.labelKey).
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
  { key: "CT", labelKey: "exam.modality.CT", radiation: true, label: "КТ" },
  { key: "MRI", labelKey: "exam.modality.MRI", radiation: false, label: "МРТ" },
  { key: "USG", labelKey: "exam.modality.USG", radiation: false, label: "УЗИ" },
  { key: "X-Ray", label: "Рентген", radiation: true },
  { key: "PET", labelKey: "exam.modality.PET", radiation: true, label: "ПЭТ" },
  { key: "SPECT", labelKey: "exam.modality.SPECT", radiation: true, label: "ОФЭКТ" },
  { key: "EEG", labelKey: "exam.modality.EEG", radiation: false, label: "ЭЭГ" },
  { key: "ECG", labelKey: "exam.modality.ECG", radiation: false, label: "ЭКГ" },
  { key: "EchoECG", labelKey: "exam.modality.EchoECG", radiation: false, label: "ЭхоКГ" },
  { key: "Holter", labelKey: "exam.modality.Holter", radiation: false, label: "Холтер" },
  { key: "Spirometry", labelKey: "exam.modality.Spirometry", radiation: false, label: "Спирометрия" },
  { key: "Doppler", labelKey: "exam.modality.Doppler", radiation: false, label: "Допплер" },
  { key: "Coronography", labelKey: "exam.modality.Coronography", radiation: true, label: "Коронография" },
  { key: "Angiography", labelKey: "exam.modality.Angiography", radiation: true, label: "Ангиография" },
  { key: "Gastroscopy", labelKey: "exam.modality.Gastroscopy", radiation: false, label: "Гастроскопия" },
  { key: "Colonoscopy", labelKey: "exam.modality.Colonoscopy", radiation: false, label: "Колоноскопия" },
  { key: "CapsuleEndoscopy", labelKey: "exam.modality.CapsuleEndoscopy", radiation: false, label: "Капсульная эндоскопия" },
  { key: "Gynecology", labelKey: "exam.modality.Gynecology", radiation: false, label: "Гинекология" },
];

/**
 * Четыре блока, из которых врач собирает протокол. Порядок тот же, в каком
 * они идут в форме, и тот же, что в myClinic: название → протокол →
 * заключение → рекомендации.
 */
export const TEMPLATE_KINDS = [
  { key: "nameOfExam", labelKey: "exam.block.nameOfExam", field: "nameOfExam", label: "Название исследования" },
  { key: "report", labelKey: "exam.block.report", field: "report", label: "Протокол" },
  { key: "diagnosis", labelKey: "exam.block.diagnosis", field: "diagnosis", label: "Заключение" },
  { key: "recommendation", labelKey: "exam.block.recommendation", field: "recommendation", label: "Рекомендации" },
];

/**
 * Одиннадцать блоков записи приёма, к которым тоже заводятся заготовки.
 *
 * Ключи повторяют имена полей формы приёма и модели — заготовка попадает в
 * поле напрямую, без таблицы соответствий. Порядок — как в форме.
 *
 * В единоличной практике (модуль myClinic) под каждый блок заведена своя
 * коллекция-справочник (tempComplaints, tempAnamnesisMorbi, …); здесь это
 * значения поля kind в одном справочнике.
 */
export const ENCOUNTER_BLOCKS = [
  { key: "complaints", labelKey: "exam.encounterBlock.complaints", label: "Жалобы" },
  { key: "anamnesisMorbi", labelKey: "exam.encounterBlock.anamnesisMorbi", label: "Anamnesis morbi" },
  { key: "anamnesisVitae", labelKey: "exam.encounterBlock.anamnesisVitae", label: "Anamnesis vitae" },
  { key: "statusPreasens", labelKey: "exam.encounterBlock.statusPreasens", label: "Status praesens" },
  { key: "statusLocalis", labelKey: "exam.encounterBlock.statusLocalis", label: "Status localis" },
  { key: "additionalDiagnosis", labelKey: "exam.encounterBlock.additionalDiagnosis", label: "Дополнительный диагноз" },
  { key: "recommendations", labelKey: "exam.encounterBlock.recommendations", label: "Рекомендации" },
  { key: "ctScanResults", labelKey: "exam.encounterBlock.ctScanResults", label: "Результаты КТ" },
  { key: "mriResults", labelKey: "exam.encounterBlock.mriResults", label: "Результаты МРТ" },
  { key: "ultrasoundResults", labelKey: "exam.encounterBlock.ultrasoundResults", label: "Результаты УЗИ" },
  { key: "laboratoryTestResults", labelKey: "exam.encounterBlock.laboratoryTestResults", label: "Результаты анализов" },
];

/** Подпись блока приёма. */
export function encounterBlockLabel(key) {
  return ENCOUNTER_BLOCKS.find((b) => b.key === key)?.label || key;
}

/**
 * Ключ перевода для вида исследования.
 *
 * Возвращает именно ключ, а не подпись: переводчик доступен только внутри
 * компонента, а этот файл — обычный модуль. Вызывающий делает t(...).
 * Неизвестный ключ отдаём как есть — лучше показать код, чем пустоту.
 */
export function modalityLabelKey(key) {
  return MODALITIES.find((m) => m.key === key)?.labelKey || key;
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
