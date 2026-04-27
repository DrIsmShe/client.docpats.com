import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CreateMyArticleDoctor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(""); // Добавляем состояние для хранения userId
  const API_BASE = process.env.REACT_APP_API_URL;
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });

        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setUserId(response.data.user.userId); // Сохраняем userId
          console.log("Authenticated, userId:", response.data.user.userId); // Добавляем лог userId
        } else {
          console.log("Not authenticated");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      }
    };

    checkAuthentication();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert("Пожалуйста, войдите в систему.");
      navigate("/login");
      return;
    }

    console.log("Отправка статьи: ", {
      title,
      content,
      tags: tags.split(",").map((tag) => tag.trim()), // Преобразуем строку тегов в массив
      isPublished,
      userId,
    });

    try {
      const response = await axios.post(
        `${API_BASE}/create-my-article`,
        {
          title,
          content,
          tags: tags.split(",").map((tag) => tag.trim()),
          isPublished,
          userId, // Передаём userId для связи статьи с пользователем
        },
        { withCredentials: true }
      );

      console.log("Ответ от сервера: ", response.data); // Лог ответа от сервера
      // alert(response.data.message);
      navigate("/articles");
    } catch (error) {
      console.error("Ошибка при создании статьи: ", error);
      alert(error.response ? error.response.data.message : "Произошла ошибка.");
    }
  };

  return (
    <div>
      <section className="section">
        <div className="row">
          <div className="col-lg-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Создать новую статью</h5>
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <label
                      htmlFor="inputText"
                      className="col-sm-2 col-form-label"
                    >
                      Заголовок
                    </label>
                    <div className="col-sm-10">
                      <input
                        type="text"
                        className="form-control"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label
                      htmlFor="inputContent"
                      className="col-sm-2 col-form-label"
                    >
                      Содержимое
                    </label>
                    <div className="col-sm-10">
                      <textarea
                        className="form-control"
                        style={{ height: "100px" }}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label
                      htmlFor="inputTags"
                      className="col-sm-2 col-form-label"
                    >
                      Теги
                    </label>
                    <div className="col-sm-10">
                      <input
                        type="text"
                        className="form-control"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        required
                      />
                      <small className="form-text">
                        Введите теги через запятую.
                      </small>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <legend className="col-form-label col-sm-2 pt-0">
                      Опубликовать
                    </legend>
                    <div className="col-sm-10">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={isPublished}
                          onChange={() => setIsPublished(!isPublished)}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="gridCheck1"
                        >
                          Да, опубликовать
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-sm-10 offset-sm-2">
                      <button type="submit" className="btn btn-primary">
                        Отправить
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
