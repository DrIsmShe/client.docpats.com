// client/src/api/doctorPrescriptions.js
//
// Рецепты, которые врач выписывает частному пациенту — вне клиники.
// Отдельный модуль, а не ветка в api/clinic.js: там всё уходит на
// /api/v1/clinic/..., где действует клиническая аренда и RBAC клиники,
// а частный приём проходит мимо неё.

import axios from "axios";

const BASE = `${process.env.REACT_APP_API_URL}/clinic/doctor-prescriptions`;

export async function createDoctorPrescription(patientId, payload) {
  const res = await axios.post(`${BASE}/patient/${patientId}`, payload, {
    withCredentials: true,
  });
  return res.data;
}

export async function listDoctorPrescriptions(patientId) {
  const res = await axios.get(`${BASE}/patient/${patientId}`, {
    withCredentials: true,
  });
  return res.data?.prescriptions || [];
}

// Бланк открывается во вкладке. Через blob, а не прямой ссылкой: запрос
// требует куки сессии, а <a href> к API их отправит не во всех браузерах.
export async function openDoctorPrescriptionPdf(id, lang = "ru") {
  const res = await axios.get(`${BASE}/${id}/pdf`, {
    params: { lang },
    responseType: "blob",
    withCredentials: true,
  });
  const url = URL.createObjectURL(res.data);
  window.open(url, "_blank", "noopener");
  // Освобождаем не сразу: вкладка ещё не успела прочитать содержимое.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
