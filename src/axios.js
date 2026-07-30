// ─────────────────────────────────────────────────────────────────────
//   Общий HTTP-клиент DocPats.
//
//   КОНВЕНЦИЯ: новый код делает запросы к бэкенду через этот default-инстанс
//   (`import api from ".../axios"`), а не через сырой `axios` с ручной сборкой
//   URL. Инстанс уже несёт baseURL (API_BASE из config.js) и
//   withCredentials:true — это устраняет два класса багов, что мы ловили:
//   забытый префикс `/api` и потерянный withCredentials.
//
//   baseURL НЕ содержит "/api", поэтому:
//     api.get("/notifications/...")        // роуты в корне
//     api.post("/api/payments/subscribe")  // роуты под /api
// ─────────────────────────────────────────────────────────────────────

import axios from "axios";
import { API_BASE, NEWS_API_BASE } from "./config";
import i18n from "./i18n";

const instance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

const API_NEWS_AI = axios.create({
  baseURL: NEWS_API_BASE,
  withCredentials: true,
});

// ─────────────────────────────────────────────────────────────────────
//   ЯЗЫК ВРАЧА В КАЖДОМ ЗАПРОСЕ.
//
//   Accept-Language ставит браузер, из локали системы, и к выбору языка в
//   интерфейсе он отношения не имеет: врач с русской Windows, переключивший
//   сайт на турецкий, продолжал присылать "ru-RU". Сервер верил заголовку и
//   отдавал русские кейсы — выглядело это как отсутствующий перевод, хотя
//   перевод лежал в базе.
//
//   Поэтому язык, выбранный в интерфейсе, уезжает явным X-Language. Accept-
//   Language дублируем тем же значением: часть эндпоинтов читает его.
//
//   Заголовок берётся на момент запроса, а не при создании инстанса: язык
//   переключают на ходу, и запомненное при старте значение устарело бы после
//   первого же переключения.
// ─────────────────────────────────────────────────────────────────────

function currentLang() {
  const fromI18n = String(i18n?.language ?? "").slice(0, 2).toLowerCase();
  if (fromI18n) return fromI18n;
  // Часть переключателей пишет выбор в localStorage — оттуда же его берёт
  // i18n при инициализации.
  return String(localStorage.getItem("lang") ?? "ru").slice(0, 2).toLowerCase();
}

function attachLanguage(client) {
  client.interceptors.request.use((config) => {
    const lang = currentLang();
    if (!config.headers) config.headers = {};
    // Явно заданный в конкретном вызове заголовок не перебиваем: у отдельных
    // страниц (статьи, новости) свои правила выбора локали контента.
    if (!config.headers["X-Language"]) config.headers["X-Language"] = lang;
    if (!config.headers["Accept-Language"]) config.headers["Accept-Language"] = lang;
    return config;
  });
  return client;
}

attachLanguage(instance);
attachLanguage(API_NEWS_AI);

/*
========================
FETCH NEWS
========================
*/

export const fetchNews = async ({
  page = 1,
  limit = 20,
  source = "",
  type = "",
  specialty = "",
  locale = "en",
}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  params.append("locale", locale);
  if (source) params.append("source", source);
  if (type) params.append("type", type);
  if (specialty) params.append("specialty", specialty);
  const res = await API_NEWS_AI.get(`/api/news?${params.toString()}`);
  return res.data;
};

/*
========================
SEARCH NEWS
========================
*/

export const searchNews = async ({
  query,
  page = 1,
  limit = 20,
  type = "",
  specialty = "",
  locale = "en",
}) => {
  const params = new URLSearchParams();
  params.append("q", query);
  params.append("page", page);
  params.append("limit", limit);
  params.append("locale", locale);
  if (type) params.append("type", type);
  if (specialty) params.append("specialty", specialty);
  const res = await API_NEWS_AI.get(`/api/search?${params.toString()}`);
  return res.data;
};

/*
========================
SYNTHESIS
========================
*/

export const fetchSynthesisArticles = async ({
  page = 1,
  limit = 10,
  specialty = "",
  locale = "",
} = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (specialty) params.append("specialty", specialty);
  if (locale && locale !== "ru") params.append("locale", locale);
  const res = await API_NEWS_AI.get(`/api/synthesis?${params.toString()}`);
  return res.data;
};

export const fetchSynthesisArticle = async (id, locale = "ru") => {
  const res = await API_NEWS_AI.get(`/api/synthesis/${id}?locale=${locale}`);
  return res.data;
};
/*
========================
AI CONSULTATION
========================
*/

export const consultationApi = {
  getStatus: (guestId) =>
    instance.get("/api/consultation/session-status", {
      headers: { "x-guest-id": guestId },
    }),

  start: (guestId) =>
    instance.post(
      "/api/consultation/start",
      {},
      { headers: { "x-guest-id": guestId } },
    ),

  sendMessage: (messages, patientInfo, guestId) =>
    instance.post(
      "/api/consultation/message",
      { messages, patientInfo },
      { headers: { "x-guest-id": guestId } },
    ),

  getEpicrisis: (messages, patientInfo, guestId) =>
    instance.post(
      "/api/consultation/epicrisis",
      { messages, patientInfo },
      { headers: { "x-guest-id": guestId } },
    ),
};

export default instance;
