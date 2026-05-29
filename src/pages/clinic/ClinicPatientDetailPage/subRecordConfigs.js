// client/src/pages/clinic/ClinicPatientDetailPage/subRecordConfigs.js
//
// Configuration for the 5 medical-record sub-models. Each entry binds
// API functions to a tab id and declares the form field schema for that
// sub-record type. SubRecordTab reads from this map to render itself.
//
// Sprint 2 Phase 2D.2 — Step 3.
//
// Sub-model differences captured here:
//
//   allergies / chronic / operations
//     - single field "content" (multiline)
//
//   family-history
//     - relative      (text, required)
//     - diseaseName   (text, required)
//     - content       (multiline, optional notes)
//
//   immunizations
//     - vaccineName   (text, required)
//     - dateGiven     (date, optional)
//     - content       (multiline, optional notes)
//
// The backend RBAC matrix:
//   - All these sub-records can be WRITTEN by owner/admin/doctor/nurse
//   - DELETE is owner-only (mirrored in UI via canDelete prop)
//   - Cross-clinic records (isCrossClinic === true) are read-only in UI
//
// Why a config object instead of 5 separate components:
//   - Less code surface, easier to keep consistent UI/behaviour
//   - Adding a 6th sub-model later (e.g. "vital signs") = one config entry
//   - Backend was built with the same fabric pattern (buildSubRecordService)

import {
  // allergy
  createAllergy,
  listAllergies,
  updateAllergy,
  deleteAllergy,
  // chronic
  createChronicDisease,
  listChronicDiseases,
  updateChronicDisease,
  deleteChronicDisease,
  // operation
  createOperation,
  listOperations,
  updateOperation,
  deleteOperation,
  // family
  createFamilyHistory,
  listFamilyHistory,
  updateFamilyHistoryRecord,
  deleteFamilyHistoryRecord,
  // immunization
  createImmunization,
  listImmunizations,
  updateImmunization,
  deleteImmunization,
} from "../../../api/clinic";

// ─── Field-type constants for the form-renderer ──────────────────────

export const FT = Object.freeze({
  TEXT: "text", // single-line input
  TEXTAREA: "textarea", // multi-line
  DATE: "date",
});

// ─── Configs ─────────────────────────────────────────────────────────

export const SUB_RECORD_CONFIGS = {
  allergies: {
    api: {
      create: createAllergy,
      list: listAllergies,
      update: updateAllergy,
      remove: deleteAllergy,
    },
    titleKey: "medical.allergies.title",
    titleDefault: "Аллергии",
    addLabelKey: "medical.allergies.addButton",
    addLabelDefault: "+ Добавить аллергию",
    emptyKey: "medical.allergies.emptyText",
    emptyDefault: "Нет записей об аллергиях.",
    summaryField: "content",
    fields: [
      {
        name: "content",
        type: FT.TEXTAREA,
        rows: 3,
        required: true,
        labelKey: "medical.allergies.fields.content",
        labelDefault: "Описание аллергии",
        placeholderKey: "medical.allergies.placeholders.content",
        placeholderDefault: "Например: пенициллин — крапивница",
      },
    ],
  },

  chronic: {
    api: {
      create: createChronicDisease,
      list: listChronicDiseases,
      update: updateChronicDisease,
      remove: deleteChronicDisease,
    },
    titleKey: "medical.chronic.title",
    titleDefault: "Хронические заболевания",
    addLabelKey: "medical.chronic.addButton",
    addLabelDefault: "+ Добавить заболевание",
    emptyKey: "medical.chronic.emptyText",
    emptyDefault: "Нет записей о хронических заболеваниях.",
    summaryField: "content",
    fields: [
      {
        name: "content",
        type: FT.TEXTAREA,
        rows: 3,
        required: true,
        labelKey: "medical.chronic.fields.content",
        labelDefault: "Описание заболевания",
        placeholderKey: "medical.chronic.placeholders.content",
        placeholderDefault: "Например: гипертоническая болезнь II ст.",
      },
    ],
  },

  operations: {
    api: {
      create: createOperation,
      list: listOperations,
      update: updateOperation,
      remove: deleteOperation,
    },
    titleKey: "medical.operations.title",
    titleDefault: "Перенесённые операции",
    addLabelKey: "medical.operations.addButton",
    addLabelDefault: "+ Добавить операцию",
    emptyKey: "medical.operations.emptyText",
    emptyDefault: "Нет записей об операциях.",
    summaryField: "content",
    fields: [
      {
        name: "content",
        type: FT.TEXTAREA,
        rows: 3,
        required: true,
        labelKey: "medical.operations.fields.content",
        labelDefault: "Описание операции",
        placeholderKey: "medical.operations.placeholders.content",
        placeholderDefault: "Например: аппендэктомия, 2015",
      },
    ],
  },

  family: {
    api: {
      create: createFamilyHistory,
      list: listFamilyHistory,
      update: updateFamilyHistoryRecord,
      remove: deleteFamilyHistoryRecord,
    },
    titleKey: "medical.family.title",
    titleDefault: "Семейный анамнез",
    addLabelKey: "medical.family.addButton",
    addLabelDefault: "+ Добавить запись",
    emptyKey: "medical.family.emptyText",
    emptyDefault: "Нет записей о семейном анамнезе.",
    summaryField: "diseaseName", // shown as the main line in list view
    fields: [
      {
        name: "relative",
        type: FT.TEXT,
        required: true,
        labelKey: "medical.family.fields.relative",
        labelDefault: "Родственник",
        placeholderKey: "medical.family.placeholders.relative",
        placeholderDefault: "Например: отец",
      },
      {
        name: "diseaseName",
        type: FT.TEXT,
        required: true,
        labelKey: "medical.family.fields.diseaseName",
        labelDefault: "Заболевание",
        placeholderKey: "medical.family.placeholders.diseaseName",
        placeholderDefault: "Например: ишемическая болезнь сердца",
      },
      {
        name: "content",
        type: FT.TEXTAREA,
        rows: 2,
        required: false,
        labelKey: "medical.family.fields.content",
        labelDefault: "Комментарий",
        placeholderKey: "medical.family.placeholders.content",
        placeholderDefault: "Дополнительные детали (необязательно)",
      },
    ],
  },

  immunization: {
    api: {
      create: createImmunization,
      list: listImmunizations,
      update: updateImmunization,
      remove: deleteImmunization,
    },
    titleKey: "medical.immunization.title",
    titleDefault: "Прививки",
    addLabelKey: "medical.immunization.addButton",
    addLabelDefault: "+ Добавить прививку",
    emptyKey: "medical.immunization.emptyText",
    emptyDefault: "Нет записей о прививках.",
    summaryField: "vaccineName",
    fields: [
      {
        name: "vaccineName",
        type: FT.TEXT,
        required: true,
        labelKey: "medical.immunization.fields.vaccineName",
        labelDefault: "Вакцина",
        placeholderKey: "medical.immunization.placeholders.vaccineName",
        placeholderDefault: "Например: COVID-19 (Pfizer), 3-я доза",
      },
      {
        name: "dateGiven",
        type: FT.DATE,
        required: false,
        labelKey: "medical.immunization.fields.dateGiven",
        labelDefault: "Дата введения",
      },
      {
        name: "content",
        type: FT.TEXTAREA,
        rows: 2,
        required: false,
        labelKey: "medical.immunization.fields.content",
        labelDefault: "Комментарий",
        placeholderKey: "medical.immunization.placeholders.content",
        placeholderDefault: "Реакция, серия и т.п. (необязательно)",
      },
    ],
  },
};
