export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:11000";

export const fetchArticle = async (id, language = "en") => {
  const res = await fetch(`${API_URL}/articles/${id}`, {
    headers: {
      "Accept-Language": language,
    },
  });

  return res.json();
};
