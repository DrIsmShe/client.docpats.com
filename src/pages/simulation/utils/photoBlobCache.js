// src/pages/simulation/utils/photoBlobCache.js
//
// S.7.7+ — IndexedDB кеш для свежезагруженных фото.
//
// Зачем: после upload в R2 фото на CDN (media.docpats.com) становится
// доступным не сразу — есть eventual consistency задержка. Чтобы врач
// не ждал, сохраняем оригинал из File-объекта прямо в IndexedDB и
// показываем его пока CDN не подъедет.
//
// Cleanup: записи старше 24 часов удаляются автоматически при init.
// За это время R2 точно settled, и blob уже не нужен.
//
// API:
//   savePhotoBlob(planId, blob, meta?)  — сохранить
//   loadPhotoBlob(planId)               — получить { blob, blobUrl, ... } | null
//   removePhotoBlob(planId)             — удалить
//   cleanupOldBlobs()                   — удалить всё старше 24ч

const DB_NAME = "docpats_simulation";
const DB_VERSION = 1;
const STORE_NAME = "photo_blobs";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 часа

let dbPromise = null;

/**
 * Открывает (или создаёт) IndexedDB соединение. Singleton.
 */
function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "planId" });
        store.createIndex("savedAt", "savedAt", { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Сохранить blob фото для плана.
 *
 * @param {string} planId
 * @param {Blob} blob - оригинальный файл от <input type="file">
 * @param {Object} [meta] - { width, height, mimeType }
 */
export async function savePhotoBlob(planId, blob, meta = {}) {
  if (!planId || !blob) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({
      planId,
      blob,
      width: meta.width || null,
      height: meta.height || null,
      mimeType: meta.mimeType || blob.type,
      savedAt: Date.now(),
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[photoBlobCache] savePhotoBlob failed:", err);
  }
}

/**
 * Загрузить blob для плана. Возвращает blob URL и метаданные либо null.
 * Caller отвечает за URL.revokeObjectURL когда blobUrl больше не нужен.
 */
export async function loadPhotoBlob(planId) {
  if (!planId) return null;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(planId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const record = request.result;
        if (!record || !record.blob) {
          resolve(null);
          return;
        }
        // Если запись старше TTL — игнорируем (cleanup потом удалит)
        if (Date.now() - record.savedAt > TTL_MS) {
          resolve(null);
          return;
        }
        const blobUrl = URL.createObjectURL(record.blob);
        resolve({
          blobUrl,
          blob: record.blob,
          width: record.width,
          height: record.height,
          mimeType: record.mimeType,
          savedAt: record.savedAt,
        });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[photoBlobCache] loadPhotoBlob failed:", err);
    return null;
  }
}

/**
 * Удалить blob для плана. Используется после успешной CDN загрузки или
 * при удалении плана.
 */
export async function removePhotoBlob(planId) {
  if (!planId) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(planId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[photoBlobCache] removePhotoBlob failed:", err);
  }
}

/**
 * Удалить все записи старше TTL.
 * Должна вызываться один раз при старте приложения.
 */
export async function cleanupOldBlobs() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const cutoff = Date.now() - TTL_MS;

    const request = store.index("savedAt").openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.savedAt < cutoff) {
        cursor.delete();
      }
      cursor.continue();
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[photoBlobCache] cleanupOldBlobs failed:", err);
  }
}

/**
 * Утилита для считывания размеров изображения из blob.
 */
export function getImageDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const result = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(result);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: null, height: null });
    };
    img.src = url;
  });
}
