// client/src/lib/events.js
//
// Словарь продуктовых событий. Единственное место, где заведены их имена.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. Имя события — это контракт со счётчиком: в дашборде
// оно становится строкой в таблице, и «arena_attempt_start» рядом с
// «arena_attempt_started» превращают статистику в мусор, который уже не
// склеить задним числом (переименовать событие в PostHog нельзя, прошлые
// записи останутся под старым именем). Поэтому имена не пишутся по месту
// вызова, а берутся отсюда.
//
// ПРАВИЛА ИМЕНОВАНИЯ:
//   <модуль>_<объект>_<действие в прошедшем времени>
//   arena_attempt_started, clinic_patient_created, dictation_uploaded
// Прошедшее время потому, что событие пишется ПОСЛЕ успеха — «попытка
// начата», а не «начать попытку».
//
// ЧТО МОЖНО КЛАСТЬ В СВОЙСТВА. Только структурное: тип станции, число
// элементов, флаг «прошёл/не прошёл», длительность. Никогда — имена,
// диагнозы, тексты, идентификаторы записей. Правило то же, что у серверного
// аудита (modules/audit): наружу уходит форма события, а не его содержание.
// Технически это подстраховано в analytics.js (safeProps режет длинные
// строки и объекты), но полагаться на фильтр вместо головы не стоит.

// ─── Арена: чтение снимков, анализы, виртуальный пациент ───────
export const ARENA_ATTEMPT_STARTED = "arena_attempt_started";
export const ARENA_ATTEMPT_SUBMITTED = "arena_attempt_submitted";
export const ARENA_INVESTIGATION_ORDERED = "arena_investigation_ordered";
export const ARENA_DIFFERENTIAL_COMMITTED = "arena_differential_committed";
export const ARENA_ATTEMPT_ANALYZED = "arena_attempt_analyzed";
export const ARENA_DUEL_CREATED = "arena_duel_created";
export const ARENA_DUEL_FINISHED = "arena_duel_finished";
export const ARENA_CASE_CREATED = "arena_case_created";
export const ARENA_CASE_REVIEWED = "arena_case_reviewed";
export const ARENA_CASE_AI_GENERATED = "arena_case_ai_generated";

// ─── Тесты и экзамены ──────────────────────────────────────────
export const EDUCATION_ATTEMPT_STARTED = "education_attempt_started";
export const EDUCATION_ANSWER_SUBMITTED = "education_answer_submitted";
export const EDUCATION_ATTEMPT_FINISHED = "education_attempt_finished";
export const EDUCATION_IMPORT_STARTED = "education_import_started";

// ─── Диагностический разбор ────────────────────────────────────
export const DIAGNOSTICS_CASE_CREATED = "diagnostics_case_created";
export const DIAGNOSTICS_DOCUMENT_EXTRACTED = "diagnostics_document_extracted";
export const DIAGNOSTICS_CASE_ANALYZED = "diagnostics_case_analyzed";
export const DIAGNOSTICS_CASE_EXPORTED = "diagnostics_case_exported";

// ─── Надиктовка истории болезни ────────────────────────────────
export const DICTATION_UPLOADED = "dictation_uploaded";
export const DICTATION_DRAFT_SAVED = "dictation_draft_saved";

// ─── Клиника (мультитенантный SaaS) ────────────────────────────
export const CLINIC_CREATED = "clinic_created";
export const CLINIC_PATIENT_CREATED = "clinic_patient_created";
export const CLINIC_APPOINTMENT_CREATED = "clinic_appointment_created";
export const CLINIC_STAFF_ADDED = "clinic_staff_added";
export const CLINIC_INVITATION_CREATED = "clinic_invitation_created";
export const CLINIC_INVITATION_ACCEPTED = "clinic_invitation_accepted";
export const CLINIC_CONSILIUM_CREATED = "clinic_consilium_created";
export const CLINIC_TELEMED_STARTED = "clinic_telemed_started";
export const CLINIC_EMPLOYEE_LOGGED_IN = "clinic_employee_logged_in";

// ─── Клиника: медицинская работа ───────────────────────────────
export const CLINIC_ENCOUNTER_CREATED = "clinic_encounter_created";
export const CLINIC_PRESCRIPTION_CREATED = "clinic_prescription_created";
export const CLINIC_LAB_RESULT_ADDED = "clinic_lab_result_added";
export const CLINIC_IMAGING_ADDED = "clinic_imaging_added";
export const CLINIC_CONSENT_REQUESTED = "clinic_consent_requested";
// Разделы медкарты (аллергии, хронические, операции, наследственность,
// прививки) — одно событие со свойством kind, а не пять почти одинаковых:
// вопрос к ним общий — «ведут ли карту вообще», а разрез по разделу
// отвечает «какие части заполняют».
export const CLINIC_MEDICAL_RECORD_ADDED = "clinic_medical_record_added";

// ─── Клиника: устройство и витрина ─────────────────────────────
// Отделения, кабинеты и оборудование — тоже одно событие с kind: это
// настройка клиники, и интересна она целиком, а не по типам справочника.
export const CLINIC_RESOURCE_CREATED = "clinic_resource_created";
export const CLINIC_SERVICE_CREATED = "clinic_service_created";
export const CLINIC_ANNOUNCEMENT_CREATED = "clinic_announcement_created";
export const CLINIC_KNOWLEDGE_CREATED = "clinic_knowledge_created";
export const CLINIC_ARTICLE_PUBLISHED = "clinic_article_published";
export const CLINIC_PAGE_PUBLISHED = "clinic_page_published";
export const CLINIC_MEMBERSHIP_REQUESTED = "clinic_membership_requested";
// Заявка с публичной витрины — вход в воронку снаружи, без регистрации.
export const CLINIC_LEAD_SUBMITTED = "clinic_lead_submitted";

// ─── Аптека и склад ────────────────────────────────────────────
export const PHARMACY_DRUG_CREATED = "pharmacy_drug_created";
export const PHARMACY_REQUISITION_CREATED = "pharmacy_requisition_created";
export const PHARMACY_REQUISITION_SUBMITTED = "pharmacy_requisition_submitted";
export const PHARMACY_DISPENSED = "pharmacy_dispensed";
export const PHARMACY_REPORT_EXPORTED = "pharmacy_report_exported";

// ─── Антропометрия ─────────────────────────────────────────────
export const ANTHROPOMETRY_STUDY_CREATED = "anthropometry_study_created";
export const ANTHROPOMETRY_STUDY_COMPLETED = "anthropometry_study_completed";

// ─── Хирургия и планирование операций ──────────────────────────
export const SURGERY_CASE_CREATED = "surgery_case_created";
export const SURGERY_OUTCOME_RECORDED = "surgery_outcome_recorded";
export const SURGERY_CASE_PUBLISHED = "surgery_case_published";
export const SIMULATION_PLAN_CREATED = "simulation_plan_created";
export const SIMULATION_LANDMARKS_SAVED = "simulation_landmarks_saved";

// ─── Контент врача ─────────────────────────────────────────────
export const DOCTOR_ARTICLE_CREATED = "doctor_article_created";
export const SYNTHESIS_ARTICLE_GENERATED = "synthesis_article_generated";

// ─── Прочее ────────────────────────────────────────────────────
export const GUIDE_QUESTION_ASKED = "guide_question_asked";
export const VIDEO_ROOM_JOINED = "video_room_joined";
export const PUSH_SUBSCRIBED = "push_subscribed";

// ─── Пациент: согласия на доступ к своим данным ────────────────
export const PATIENT_CONSENT_GRANTED = "patient_consent_granted";
export const PATIENT_CONSENT_REVOKED = "patient_consent_revoked";

// ─── Поликлиника (единоличная практика, зона /dp) ──────────────
export const POLYCLINIC_PATIENT_CREATED = "polyclinic_patient_created";
export const POLYCLINIC_HISTORY_SAVED = "polyclinic_history_saved";

// ─── ИИ-консультация ───────────────────────────────────────────
export const AI_CONSULTATION_STARTED = "ai_consultation_started";
export const AI_CONSULTATION_MESSAGE_SENT = "ai_consultation_message_sent";
export const AI_EPICRISIS_REQUESTED = "ai_epicrisis_requested";

// ─── Общение: чат и звонки ─────────────────────────────────────
export const CHAT_MESSAGE_SENT = "chat_message_sent";
export const CALL_STARTED = "call_started";

// ─── Тарифы и оплата ───────────────────────────────────────────
export const BILLING_CHECKOUT_STARTED = "billing_checkout_started";
export const BILLING_WAITLIST_JOINED = "billing_waitlist_joined";

// ─── Станции арены. Одно и то же событие приходит с трёх станций,
// и без явного признака их потом не разделить в отчёте. ─────────
export const STATION = {
  RADIOLOGY: "radiology",
  LAB: "lab",
  VP: "vp",
};

/**
 * Балл в процентах для свойства события.
 *
 * Балл приходит из разных мест в двух видах — долей (0…1) и процентами
 * (0…100). В отчёте они смешались бы в одну колонку, где «85» значит то
 * 85 %, то 8500 %. Приводим к целым процентам здесь, а не по месту вызова.
 */
export function scorePct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n <= 1 ? n * 100 : n);
}

/**
 * Размер коллекции — «сколько всего», без самого содержимого.
 * Частый случай: длина списка находок, число вопросов, количество вложений.
 */
export function count(value) {
  if (Array.isArray(value)) return value.length;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
