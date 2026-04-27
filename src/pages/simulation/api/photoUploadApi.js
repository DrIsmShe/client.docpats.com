// src/pages/simulation/api/photoUploadApi.js
import client from "./client.js";

/* ──────────────────────────────────────────────────────────────────────────
   Upload отдельным файлом — multipart/form-data отличается настройками
   от JSON-запросов. onProgress — опциональный callback для прогресс-бара
   в модалке.

   Возвращает embedded-photo объект, готовый для createPlan.
   ────────────────────────────────────────────────────────────────────────── */
export async function uploadPhoto(file, { onProgress } = {}) {
  if (!file) throw new Error("uploadPhoto: file is required");

  const form = new FormData();
  form.append("photo", file);

  const { data } = await client.post("/photos", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000, // крупные фото + медленный интернет
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });

  return data.photo;
}
