// client/src/api/examinationTemplates.js
//
// Справочник заготовок для протоколов исследований
// (/api/v1/clinic/medical/examination-templates).
//
// Заготовка — это готовая формулировка клиники: название исследования,
// типовой протокол, частое заключение или рекомендация. Пациента здесь нет:
// справочник принадлежит клинике, а не карте.

import axios from "../axios";
import { track } from "../lib/analytics";
import { CLINIC_KNOWLEDGE_CREATED } from "../lib/events";

const BASE = "/api/v1/clinic/medical/examination-templates";

/**
 * Заготовки нужного вида. Оба фильтра необязательны, но форма исследования
 * всегда запрашивает конкретную пару: вид исследования + блок протокола.
 */
export async function listExaminationTemplates({ scope, modality, kind, limit } = {}) {
  // scope обязателен к передаче: сервер без него считает запрос протоколом
  // исследования, и вкладка «История болезни» получала бы чужой список.
  const { data } = await axios.get(BASE, {
    params: { scope, modality, kind, limit },
  });
  return data.items ?? [];
}

export async function getExaminationTemplate(templateId) {
  const { data } = await axios.get(`${BASE}/${templateId}`);
  return data.template;
}

export async function createExaminationTemplate({ scope, modality, kind, title, body }) {
  // scope должен уйти на сервер обязательно. Без него сервер подставляет
  // «обследования», и заготовка приёма («жалобы», «анамнез») отвергается как
  // блок, не относящийся к этой области.
  const { data } = await axios.post(BASE, { scope, modality, kind, title, body });
  // Считаем как пополнение базы знаний клиники: область, вид исследования и
  // блок перечислимы, сама формулировка наружу не идёт.
  track(CLINIC_KNOWLEDGE_CREATED, {
    kind: "examination_template",
    scope: scope || "examination",
    modality,
  });
  return data.template;
}

export async function updateExaminationTemplate(templateId, { title, body }) {
  const { data } = await axios.patch(`${BASE}/${templateId}`, { title, body });
  return data.template;
}

export async function deleteExaminationTemplate(templateId) {
  const { data } = await axios.delete(`${BASE}/${templateId}`);
  return data;
}
