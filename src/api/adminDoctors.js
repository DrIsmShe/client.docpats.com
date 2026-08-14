// client/src/api/adminDoctors.js
//
// Управление профилями врачей из админки. Серверная часть —
// /api/admin/doctors (server/modules/admin/controllers/adminDoctors.controller.js).
//
// Через общий инстанс из src/axios.js: нужен withCredentials — доступ
// проверяется по роли из сессии, и без куки все запросы вернут 401.

import api from "../axios";

const ROOT = "/api/admin/doctors";

/** Список врачей. Поиск идёт по точному совпадению имени, фамилии или почты. */
export async function fetchDoctors({ q = "", limit = 50 } = {}) {
  const { data } = await api.get(ROOT, { params: { q: q || undefined, limit } });
  return data.doctors || [];
}

/** Справочник специальностей для выпадающего списка. */
export async function fetchSpecializations() {
  const { data } = await api.get(`${ROOT}/specializations`);
  return data.specializations || [];
}

/** Всё о враче — для формы правки. */
export async function fetchDoctor(userId) {
  const { data } = await api.get(`${ROOT}/${userId}`);
  return data.doctor;
}

export async function createDoctor(payload) {
  const { data } = await api.post(ROOT, payload);
  return data;
}

export async function updateDoctor(userId, payload) {
  const { data } = await api.put(`${ROOT}/${userId}`, payload);
  return data;
}

/**
 * Убирает врача из каталога.
 *
 * Запись не стирается: на врача ссылаются приёмы, переписка и медицинские
 * записи. Пропадает карточка, сам профиль помечается удалённым.
 */
export async function deleteDoctor(userId) {
  const { data } = await api.delete(`${ROOT}/${userId}`);
  return data;
}

/** Пустая форма — все поля, которые понимает сервер. */
export const EMPTY_DOCTOR = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  job: "",
  bio: "",
  specializationId: "",
  country: "",
  clinic: "",
  address: "",
  profileImage: "",
  about: "",
  allowVideo: true,
  verificationStatus: "pending",
  educationInstitution: "",
  educationStartYear: "",
  educationEndYear: "",
  specializationInstitution: "",
  specializationStartYear: "",
  specializationEndYear: "",
};

export default {
  fetchDoctors,
  fetchSpecializations,
  fetchDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  EMPTY_DOCTOR,
};
