// client/src/pages/polyclinic/examConstants.js
//
// Общие справочники двух карточек пациента: patientdetail.jsx (пациент
// поликлиники) и privatePatientDetail.jsx (частный приём). Страницы разные,
// но перечни исследований у них одни и те же и до сих пор лежали в каждой
// своей копией — дословно совпадающей.
//
// Здесь только чистые данные. Вкладки исследований (examTabs) сюда не
// вынесены намеренно: они собирают подписи через t() и подставляют состояние
// компонента, то есть это разметка, а не справочник.

/** Виды лабораторных анализов для выпадающего списка. */
export const SCAN_TEST_TYPES = [
  { value: "BloodTestGeneral", label: "Общий анализ крови" },
  { value: "BloodTestBiochemistry", label: "Биохимия" },
  { value: "UrineTest", label: "Анализ мочи" },
  { value: "StoolTest", label: "Анализ кала" },
  { value: "HormonePanel", label: "Гормоны" },
  { value: "TumorMarkers", label: "Онкомаркеры" },
  { value: "PCR", label: "ПЦР" },
  { value: "Immunology", label: "Иммунология" },
  { value: "GeneticScreening", label: "Генетический скрининг" },
  { value: "Other", label: "Другое" },
];

/** Эндпоинты снимков — по одному на вид исследования. */
export const ENDPOINTS = [
  "CTscaner",
  "MRIscaner",
  "USMscaner",
  "XRAYscaner",
  "PETscaner",
  "SPECTscaner",
  "EEGscaner",
  "Ginecology",
  "HOLTERscaner",
  "Spirometryscaner",
  "Doplerscaner",
  "Gastroscopyscaner",
  "CapsuleEndoscopyscaner",
  "Angiographyscaner",
  "EKGscaner",
  "EchoEKGscaner",
  "Coronographyscaner",
  "Labtestscaner",
  ];

export default { SCAN_TEST_TYPES, ENDPOINTS };
