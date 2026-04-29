// src/pages/simulation/utils/photoUrl.js
//
// S.7.7+ — Общий helper для нормализации фото-URL.
//
// Backend возвращает proxy URL как относительный путь:
//   /api/simulation/photos/proxy?key=...
//
// Любой <img src>, CSS background-image, fetch или canvas требует
// абсолютный URL. Этот helper превращает относительный путь в полный
// URL с API_BASE из config.js.
//
// Использование:
//   import { resolvePhotoUrl } from "@/pages/simulation/utils/photoUrl.js";
//
//   <div style={{ backgroundImage: `url(${resolvePhotoUrl(plan.photo.url)})` }} />
//   <img src={resolvePhotoUrl(plan.photo.url)} />
//
// Обычно использовать НЕ нужно — simulationSlice уже нормализует URL
// при получении плана из backend. Но для случаев когда работаешь с
// сырым URL (например, из uploadPhoto response до сохранения в Redux) —
// этот helper надёжен.

import { API_BASE } from "../../../config.js";

export function resolvePhotoUrl(url) {
  if (!url) return url;
  // Полный URL — без изменений
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Относительный путь /api/... → {API_BASE}/api/...
  if (url.startsWith("/")) {
    const base = (API_BASE || "").replace(/\/$/, "");
    return `${base}${url}`;
  }
  return url;
}
