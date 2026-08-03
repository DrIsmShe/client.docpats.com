import axios from "axios";
import { track } from "../lib/analytics";
import { SYNTHESIS_ARTICLE_GENERATED } from "../lib/events";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:11000",
  withCredentials: true,
  timeout: 360000,
});

export const generateArticle = (data) =>
  API.post("/api/user-synthesis/generate", data).then((r) => {
    // Генерация статьи — платный вызов модели. Тема и запрос автора это
    // свободный текст, поэтому в событие идёт только язык и специальность.
    track(SYNTHESIS_ARTICLE_GENERATED, {
      lang: data?.lang,
      specialty: data?.specialty,
    });
    return r;
  });

export const getMyLimit = () => API.get("/api/user-synthesis/limit");

export const getMyArticles = (params = {}) =>
  API.get("/api/user-synthesis/my", { params });

export const getMyArticle = (id) => API.get(`/api/user-synthesis/my/${id}`);
