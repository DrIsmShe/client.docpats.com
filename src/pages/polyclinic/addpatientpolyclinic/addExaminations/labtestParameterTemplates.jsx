// labtestParameterTemplates.jsx

/**
 * Parameter template fields:
 * - name: indicator name (in English, display/base language)
 * - unit: measurement unit (canonical code, e.g. "g/L")
 * - valueType: "number" | "text"
 * - referenceRange: { min: number|null, max: number|null } | null
 * - options?: string[] (text value hints; optional)
 */

const LABTEST_PARAMETER_TEMPLATES = {
  /* ===================== BASIC PANELS ===================== */
  UrineTest: [
    {
      name: "Color",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["straw-yellow", "yellow", "amber", "other"],
    },
    {
      name: "Clarity",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["clear", "slightly cloudy", "cloudy"],
    },
    {
      name: "Specific gravity",
      unit: "",
      valueType: "number",
      referenceRange: { min: 1.005, max: 1.03 },
    },
    {
      name: "pH",
      unit: "",
      valueType: "number",
      referenceRange: { min: 4.5, max: 8.0 },
    },
    {
      name: "Protein",
      unit: "g/L",
      valueType: "number",
      referenceRange: { min: 0, max: 0.14 },
    },
    {
      name: "Glucose",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 0, max: 0.8 },
    },
    {
      name: "Leukocytes",
      unit: "cells/hpf",
      valueType: "number",
      referenceRange: { min: 0, max: 5 },
    },
  ],

  BloodTestGeneral: [
    {
      name: "Hemoglobin",
      unit: "g/L",
      valueType: "number",
      referenceRange: { min: 120, max: 160 },
    },
    {
      name: "Erythrocytes",
      unit: "10^12/L",
      valueType: "number",
      referenceRange: { min: 4.0, max: 5.5 },
    },
    {
      name: "Leukocytes",
      unit: "10^9/L",
      valueType: "number",
      referenceRange: { min: 4.0, max: 9.0 },
    },
    {
      name: "Platelets",
      unit: "10^9/L",
      valueType: "number",
      referenceRange: { min: 150, max: 400 },
    },
  ],

  BloodTestBiochemistry: [
    {
      name: "Glucose",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 3.9, max: 5.8 },
    },
    {
      name: "Creatinine",
      unit: "µmol/L",
      valueType: "number",
      referenceRange: { min: 62, max: 106 },
    },
    {
      name: "Urea",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 2.5, max: 8.3 },
    },
    {
      name: "ALT",
      unit: "U/L",
      valueType: "number",
      referenceRange: { min: 0, max: 41 },
    },
    {
      name: "AST",
      unit: "U/L",
      valueType: "number",
      referenceRange: { min: 0, max: 38 },
    },
  ],

  StoolTest: [
    {
      name: "Consistency",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["formed", "soft", "mushy", "watery"],
    },
    { name: "Color", unit: "", valueType: "text", referenceRange: null },
    { name: "Reaction", unit: "", valueType: "text", referenceRange: null },
    {
      name: "Mucus",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["none", "traces", "present"],
    },
    {
      name: "Leukocytes",
      unit: "cells/hpf",
      valueType: "number",
      referenceRange: { min: 0, max: 5 },
    },
  ],

  HormonePanel: [
    {
      name: "TSH",
      unit: "µIU/mL",
      valueType: "number",
      referenceRange: { min: 0.4, max: 4.0 },
    },
    {
      name: "Free T4",
      unit: "pmol/L",
      valueType: "number",
      referenceRange: { min: 9, max: 22 },
    },
    {
      name: "Free T3",
      unit: "pmol/L",
      valueType: "number",
      referenceRange: { min: 3.1, max: 6.8 },
    },
  ],

  TumorMarkers: [
    {
      name: "CEA",
      unit: "ng/mL",
      valueType: "number",
      referenceRange: { min: 0, max: 5 },
    },
    {
      name: "CA 125",
      unit: "IU/mL",
      valueType: "number",
      referenceRange: { min: 0, max: 35 },
    },
    {
      name: "CA 19-9",
      unit: "IU/mL",
      valueType: "number",
      referenceRange: { min: 0, max: 37 },
    },
  ],

  PCR: [
    {
      name: "COVID-19 (SARS-CoV-2)",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["not detected", "detected"],
    },
    {
      name: "Influenza A/B",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["not detected", "detected"],
    },
  ],

  Immunology: [
    {
      name: "IgG",
      unit: "g/L",
      valueType: "number",
      referenceRange: { min: 7, max: 16 },
    },
    {
      name: "IgA",
      unit: "g/L",
      valueType: "number",
      referenceRange: { min: 0.7, max: 4.0 },
    },
    {
      name: "IgM",
      unit: "g/L",
      valueType: "number",
      referenceRange: { min: 0.4, max: 2.3 },
    },
  ],

  GeneticScreening: [
    {
      name: "BRCA1",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["mutation not detected", "mutation detected"],
    },
    {
      name: "BRCA2",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["mutation not detected", "mutation detected"],
    },
  ],

  Other: [],

  /* ===================== ADDITIONAL PANELS ===================== */
  CoagulationPanel: [
    {
      name: "PT",
      unit: "sec",
      valueType: "number",
      referenceRange: { min: 11, max: 15 },
    },
    {
      name: "INR",
      unit: "",
      valueType: "number",
      referenceRange: { min: 0.8, max: 1.2 },
    },
    {
      name: "aPTT",
      unit: "sec",
      valueType: "number",
      referenceRange: { min: 25, max: 35 },
    },
    {
      name: "Fibrinogen",
      unit: "g/L",
      valueType: "number",
      referenceRange: { min: 2, max: 4 },
    },
    {
      name: "D-dimer",
      unit: "mg/L_FEU",
      valueType: "number",
      referenceRange: { min: 0, max: 0.5 },
    },
  ],

  LipidProfile: [
    {
      name: "Total cholesterol",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 0, max: 5.0 },
    },
    {
      name: "LDL-C",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 0, max: 3.0 },
    },
    {
      name: "HDL-C",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 1.0, max: 99 },
    },
    {
      name: "Triglycerides",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 0, max: 1.7 },
    },
    {
      name: "ApoB",
      unit: "g/L",
      valueType: "number",
      referenceRange: { min: 0.6, max: 1.2 },
    },
    {
      name: "Lp(a)",
      unit: "mg/dL",
      valueType: "number",
      referenceRange: { min: 0, max: 30 },
    },
  ],

  LiverFunction: [
    {
      name: "AST",
      unit: "U/L",
      valueType: "number",
      referenceRange: { min: 0, max: 40 },
    },
    {
      name: "ALT",
      unit: "U/L",
      valueType: "number",
      referenceRange: { min: 0, max: 41 },
    },
    {
      name: "ALP",
      unit: "U/L",
      valueType: "number",
      referenceRange: { min: 40, max: 130 },
    },
    {
      name: "GGT",
      unit: "U/L",
      valueType: "number",
      referenceRange: { min: 8, max: 61 },
    },
    {
      name: "Total bilirubin",
      unit: "µmol/L",
      valueType: "number",
      referenceRange: { min: 5, max: 21 },
    },
    {
      name: "Direct bilirubin",
      unit: "µmol/L",
      valueType: "number",
      referenceRange: { min: 0, max: 5 },
    },
    {
      name: "Albumin",
      unit: "g/L",
      valueType: "number",
      referenceRange: { min: 35, max: 52 },
    },
  ],

  RenalElectrolytes: [
    {
      name: "Creatinine",
      unit: "µmol/L",
      valueType: "number",
      referenceRange: { min: 60, max: 110 },
    },
    {
      name: "eGFR",
      unit: "mL/min/1.73m²",
      valueType: "number",
      referenceRange: { min: 60, max: 999 },
    },
    {
      name: "Urea",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 2.5, max: 8.3 },
    },
    {
      name: "Sodium",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 135, max: 145 },
    },
    {
      name: "Potassium",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 3.5, max: 5.1 },
    },
    {
      name: "Chloride",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 98, max: 107 },
    },
    {
      name: "Magnesium",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 0.66, max: 1.07 },
    },
  ],

  IronStudies: [
    {
      name: "Iron",
      unit: "µmol/L",
      valueType: "number",
      referenceRange: { min: 10, max: 30 },
    },
    {
      name: "Ferritin",
      unit: "ng/mL",
      valueType: "number",
      referenceRange: { min: 15, max: 150 },
    },
    {
      name: "TIBC",
      unit: "µmol/L",
      valueType: "number",
      referenceRange: { min: 45, max: 81 },
    },
    {
      name: "Transferrin saturation",
      unit: "%",
      valueType: "number",
      referenceRange: { min: 20, max: 45 },
    },
  ],

  DiabetesPanel: [
    {
      name: "Fasting glucose",
      unit: "mmol/L",
      valueType: "number",
      referenceRange: { min: 3.9, max: 5.5 },
    },
    {
      name: "HbA1c",
      unit: "%",
      valueType: "number",
      referenceRange: { min: 4, max: 5.6 },
    },
    {
      name: "Insulin",
      unit: "µIU/mL",
      valueType: "number",
      referenceRange: { min: 2, max: 25 },
    },
    {
      name: "C-peptide",
      unit: "ng/mL",
      valueType: "number",
      referenceRange: { min: 0.8, max: 3.1 },
    },
  ],

  ThyroidPanel: [
    {
      name: "TSH",
      unit: "mIU/mL",
      valueType: "number",
      referenceRange: { min: 0.4, max: 4.0 },
    },
    {
      name: "Free T4",
      unit: "pmol/L",
      valueType: "number",
      referenceRange: { min: 12, max: 22 },
    },
    {
      name: "Free T3",
      unit: "pmol/L",
      valueType: "number",
      referenceRange: { min: 3.1, max: 6.8 },
    },
    {
      name: "anti-TPO",
      unit: "IU/mL",
      valueType: "number",
      referenceRange: { min: 0, max: 35 },
    },
    {
      name: "anti-TG",
      unit: "IU/mL",
      valueType: "number",
      referenceRange: { min: 0, max: 40 },
    },
  ],

  CardiacMarkers: [
    {
      name: "Troponin I/T",
      unit: "ng/L",
      valueType: "number",
      referenceRange: { min: 0, max: 34 },
    },
    {
      name: "CK-MB",
      unit: "U/L",
      valueType: "number",
      referenceRange: { min: 0, max: 25 },
    },
    {
      name: "NT-proBNP",
      unit: "pg/mL",
      valueType: "number",
      referenceRange: { min: 0, max: 125 },
    },
  ],

  VitaminsTrace: [
    {
      name: "Vitamin D (25-OH)",
      unit: "nmol/L",
      valueType: "number",
      referenceRange: { min: 75, max: 250 },
    },
    {
      name: "Vitamin B12",
      unit: "pg/mL",
      valueType: "number",
      referenceRange: { min: 200, max: 900 },
    },
    {
      name: "Folate",
      unit: "ng/mL",
      valueType: "number",
      referenceRange: { min: 3, max: 17 },
    },
    {
      name: "Zinc",
      unit: "µg/dL",
      valueType: "number",
      referenceRange: { min: 70, max: 120 },
    },
  ],

  InfectiousSerology: [
    {
      name: "HBsAg",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["negative", "positive"],
    },
    {
      name: "anti-HBs",
      unit: "mIU/mL",
      valueType: "number",
      referenceRange: { min: 10, max: 9999 },
    },
    {
      name: "anti-HCV",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["negative", "positive"],
    },
    {
      name: "HIV Ag/Ab",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["negative", "positive"],
    },
    {
      name: "RPR/VDRL",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["non-reactive", "reactive"],
    },
  ],

  UrineAlbuminACR: [
    {
      name: "Urine albumin",
      unit: "mg/L",
      valueType: "number",
      referenceRange: { min: 0, max: 20 },
    },
    {
      name: "Urine creatinine",
      unit: "mg/dL",
      valueType: "number",
      referenceRange: { min: 20, max: 320 },
    },
    {
      name: "ACR",
      unit: "mg/g",
      valueType: "number",
      referenceRange: { min: 0, max: 30 },
    },
  ],

  StoolInflammation: [
    {
      name: "Calprotectin",
      unit: "µg/g",
      valueType: "number",
      referenceRange: { min: 0, max: 50 },
    },
    {
      name: "Occult blood (FIT)",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["negative", "positive"],
    },
    {
      name: "H. pylori antigen (stool)",
      unit: "",
      valueType: "text",
      referenceRange: null,
      options: ["negative", "positive"],
    },
  ],
};

/**
 * Legacy RU labels (можно больше не использовать в UI)
 */
export const LABELS_RU = {
  UrineTest: "Анализ мочи",
  BloodTestGeneral: "Общий анализ крови",
  BloodTestBiochemistry: "Биохимия крови",
  StoolTest: "Анализ кала",
  HormonePanel: "Гормоны",
  TumorMarkers: "Онкомаркеры",
  PCR: "ПЦР",
  Immunology: "Иммунология",
  GeneticScreening: "Генетический скрининг",
  Other: "Другое",

  CoagulationPanel: "Коагулограмма",
  LipidProfile: "Липидный профиль",
  LiverFunction: "Печёночные пробы",
  RenalElectrolytes: "Почки и электролиты",
  IronStudies: "Обмен железа",
  DiabetesPanel: "Диабет-панель",
  ThyroidPanel: "Щитовидная железа (расширено)",
  CardiacMarkers: "Кардиомаркеры",
  VitaminsTrace: "Витамины и микроэлементы",
  InfectiousSerology: "Серология инфекций",
  UrineAlbuminACR: "Микроальбуминурия (ACR)",
  StoolInflammation: "Кал — воспаление/кровь",
};

/**
 * List of types for select.
 * In UI use: t(`AddLabTest.testTypes.${value}`)
 */
export const TEST_TYPES = Object.keys(LABTEST_PARAMETER_TEMPLATES).map(
  (key) => ({
    value: key,
    label: LABELS_RU[key] || key, // for backward compatibility
  })
);

export { LABTEST_PARAMETER_TEMPLATES };
