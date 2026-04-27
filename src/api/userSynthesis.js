import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:11000",
  withCredentials: true,
  timeout: 360000,
});

export const generateArticle = (data) =>
  API.post("/api/user-synthesis/generate", data);

export const getMyLimit = () => API.get("/api/user-synthesis/limit");

export const getMyArticles = (params = {}) =>
  API.get("/api/user-synthesis/my", { params });

export const getMyArticle = (id) => API.get(`/api/user-synthesis/my/${id}`);
