import instance from "../../axios"; // путь: src/axios.js

const BASE = "/api/surgery";

export const getCases = (params = {}) =>
  instance.get(`${BASE}/cases`, { params });

export const getCaseById = (id) => instance.get(`${BASE}/cases/${id}`);

export const createCase = (data) => instance.post(`${BASE}/cases`, data);

export const updateCase = (id, data) =>
  instance.put(`${BASE}/cases/${id}`, data);

export const deleteCase = (id) => instance.delete(`${BASE}/cases/${id}`);

export const uploadPhoto = (caseId, file, label) => {
  const form = new FormData();
  form.append("photo", file);
  form.append("label", label);
  return instance.post(`${BASE}/cases/${caseId}/photos`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deletePhoto = (caseId, photoId) =>
  instance.delete(`${BASE}/cases/${caseId}/photos/${photoId}`);

export const addFollowUp = (caseId, data) =>
  instance.post(`${BASE}/cases/${caseId}/followup`, data);

export const setOutcome = (caseId, score) =>
  instance.put(`${BASE}/cases/${caseId}/outcome`, { score });

export const publishCase = (caseId, publish = true) =>
  instance.put(`${BASE}/cases/${caseId}/publish`, { publish });

export const getStats = () => instance.get(`${BASE}/stats`);

export const getPublicCases = (params = {}) =>
  instance.get(`${BASE}/public`, { params });
