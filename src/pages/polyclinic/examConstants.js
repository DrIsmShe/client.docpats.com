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

/**
 * Виды лабораторных анализов для выпадающего списка.
 *
 * Здесь ключ, а не готовая подпись: строка в справочнике не видна ни
 * детектору текста в разметке, ни сверке ключей, и список оставался
 * русским на всех языках. value менять нельзя — по нему идёт
 * сопоставление с полем testType из базы.
 */
export const SCAN_TEST_TYPES = [
  { value: "BloodTestGeneral", labelKey: "labType.BloodTestGeneral" },
  { value: "BloodTestBiochemistry", labelKey: "labType.BloodTestBiochemistry" },
  { value: "UrineTest", labelKey: "labType.UrineTest" },
  { value: "StoolTest", labelKey: "labType.StoolTest" },
  { value: "HormonePanel", labelKey: "labType.HormonePanel" },
  { value: "TumorMarkers", labelKey: "labType.TumorMarkers" },
  { value: "PCR", labelKey: "labType.PCR" },
  { value: "Immunology", labelKey: "labType.Immunology" },
  { value: "GeneticScreening", labelKey: "labType.GeneticScreening" },
  { value: "Other", labelKey: "labType.Other" },
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
