// ВНИМАНИЕ: здесь КЛЮЧИ перевода, а не подписи.
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
  { key: "CT", labelKey: "exam.modality.CT", radiation: true },
  { key: "MRI", labelKey: "exam.modality.MRI", radiation: false },
  { key: "USG", labelKey: "exam.modality.USG", radiation: false },
  { key: "X-Ray", label: "Рентген", radiation: true },
  { key: "PET", labelKey: "exam.modality.PET", radiation: true },
  { key: "SPECT", labelKey: "exam.modality.SPECT", radiation: true },
  { key: "EEG", labelKey: "exam.modality.EEG", radiation: false },
  { key: "ECG", labelKey: "exam.modality.ECG", radiation: false },
  { key: "EchoECG", labelKey: "exam.modality.EchoECG", radiation: false },
  { key: "Holter", labelKey: "exam.modality.Holter", radiation: false },
  { key: "Spirometry", labelKey: "exam.modality.Spirometry", radiation: false },
  { key: "Doppler", labelKey: "exam.modality.Doppler", radiation: false },
  { key: "Coronography", labelKey: "exam.modality.Coronography", radiation: true },
  { key: "Angiography", labelKey: "exam.modality.Angiography", radiation: true },
  { key: "Gastroscopy", labelKey: "exam.modality.Gastroscopy", radiation: false },
  { key: "Colonoscopy", labelKey: "exam.modality.Colonoscopy", radiation: false },
  { key: "CapsuleEndoscopy", labelKey: "exam.modality.CapsuleEndoscopy", radiation: false },
  { key: "Gynecology", labelKey: "exam.modality.Gynecology", radiation: false },
];

/**
 * Четыре блока, из которых врач собирает протокол. Порядок тот же, в каком
 * они идут в форме, и тот же, что в myClinic: название → протокол →
 * заключение → рекомендации.
 */
export const TEMPLATE_KINDS = [
  { key: "nameOfExam", labelKey: "exam.block.nameOfExam", field: "nameOfExam" },
  { key: "report", labelKey: "exam.block.report", field: "report" },
  { key: "diagnosis", labelKey: "exam.block.diagnosis", field: "diagnosis" },
  { key: "recommendation", labelKey: "exam.block.recommendation", field: "recommendation" },
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
  { key: "complaints", labelKey: "exam.modality.complaints" },
  { key: "anamnesisMorbi", labelKey: "exam.modality.anamnesisMorbi" },
  { key: "anamnesisVitae", labelKey: "exam.modality.anamnesisVitae" },
  { key: "statusPreasens", labelKey: "exam.modality.statusPreasens" },
  { key: "statusLocalis", labelKey: "exam.modality.statusLocalis" },
  { key: "additionalDiagnosis", labelKey: "exam.modality.additionalDiagnosis" },
  { key: "recommendations", labelKey: "exam.modality.recommendations" },
  { key: "ctScanResults", labelKey: "exam.modality.ctScanResults" },
  { key: "mriResults", labelKey: "exam.modality.mriResults" },
  { key: "ultrasoundResults", labelKey: "exam.modality.ultrasoundResults" },
  { key: "laboratoryTestResults", labelKey: "exam.modality.laboratoryTestResults" },
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
