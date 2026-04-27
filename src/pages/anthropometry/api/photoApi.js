/**
 * Photo API
 * =========
 * Обёртки над endpoints /studies/:studyId/photos и /photos/:photoId/*
 */

import client from "./client.js";

/**
 * POST /studies/:studyId/photos (multipart/form-data)
 *
 * Загружает фото в Cloudflare R2 через backend.
 *
 * @param {String} studyId
 * @param {File} file — File из input[type=file] или drag-drop
 * @param {String} viewType — frontal, lateral_left, lateral_right, etc
 * @param {Function} onProgress — (percentage: 0..100) => void — для progress bar
 */
export const uploadPhoto = async (studyId, file, viewType, onProgress) => {
  const formData = new FormData();
  formData.append("photo", file);
  formData.append("viewType", viewType);

  const { data: response } = await client.post(
    `/studies/${studyId}/photos`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        }
      },
    },
  );
  return response.data;
};

/**
 * GET /studies/:studyId/photos
 */
export const listPhotosByStudy = async (studyId) => {
  const { data: response } = await client.get(`/studies/${studyId}/photos`);
  return response.data;
};

/**
 * GET /photos/:photoId
 */
export const getPhoto = async (photoId) => {
  const { data: response } = await client.get(`/photos/${photoId}`);
  return response.data;
};

/**
 * GET /photos/:photoId/url
 * Получить signed URL для оригинала фото.
 * @returns {{url: string, expiresAt: string}}
 */
export const getPhotoSignedUrl = async (photoId, ttlSeconds) => {
  const params = ttlSeconds ? { ttlSeconds } : {};
  const { data: response } = await client.get(`/photos/${photoId}/url`, {
    params,
  });
  return response.data;
};

/**
 * GET /photos/:photoId/thumbnail
 * Получить signed URL для превью.
 */
export const getThumbnailSignedUrl = async (photoId, ttlSeconds) => {
  const params = ttlSeconds ? { ttlSeconds } : {};
  const { data: response } = await client.get(`/photos/${photoId}/thumbnail`, {
    params,
  });
  return response.data;
};

/**
 * DELETE /photos/:photoId
 */
export const deletePhoto = async (photoId, reason) => {
  const { data: response } = await client.delete(`/photos/${photoId}`, {
    data: { reason },
  });
  return response.data;
};
