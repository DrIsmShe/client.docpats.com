import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaCommentDots } from "react-icons/fa6";
import { BsCalendar2DateFill } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import parse from "html-react-parser";
import { BsFillShareFill } from "react-icons/bs";
import { sh } from "../../../../lib/sanitizeHtml";
export default function AllArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = process.env.REACT_APP_API_URL;
  useEffect(() => {
    // Запрос на получение всех статей
    const fetchArticles = async () => {
      try {
        const response = await axios.get(`${API_BASE}/articles-all`);
        setArticles(response.data.articles); // Получаем список статей
        setLoading(false);
      } catch (err) {
        setError("Ошибка при загрузке статей");
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <div class="pagetitle">
        <h1>All articles</h1>
        {/* <nav>
          <ol class="breadcrumb">
            <li class="breadcrumb-item">
              <a href="index.html">Home</a>
            </li>
            <li class="breadcrumb-item">Components</li>
            <li class="breadcrumb-item active">Cards</li>
          </ol>
        </nav> */}
      </div>

      <section class="section">
        <div class="row align-items-top">
          {articles.length === 0 ? (
            <p>Статей нет</p>
          ) : (
            <div class="col-lg-9">
              <div className="row">
                {articles.map((article) => (
                  <div className="col-md-6">
                    <div className="card mb-3" key={article._id}>
                      <div className="row g-0">
                        <div className="col-md-12">
                          <div className="card-body">
                            <Link to={`/article-detail/${article._id}`}>
                              <h2
                                style={{
                                  fontSize: "22px",
                                  height: "100px",
                                  overflow: "hidden",
                                }}
                                className="card-title"
                              >
                                {article.title}
                              </h2>
                            </Link>

                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              style={{ width: "100%", height: "300px" }}
                            />

                            {/* Редактирование статьи */}

                            {/* Отображение содержимого */}
                            <div
                              className="card-text"
                              style={{
                                height: "92px",
                                overflow: "hidden",
                                marginTop: "20px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: sh(article.content,)
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="row g-0">
                        <div className="col-md-12">
                          <div
                            className="subarticle"
                            style={{
                              display: "flex",
                              padding: "20px",
                              justifyContent: "flex-start",
                              alignItems: "center",
                            }}
                          >
                            <div
                              className="is_published_article"
                              style={{
                                marginRight: "20px",
                                display: "flex",
                                justifyContent: "space-evenly",
                                alignItems: "center",
                              }}
                            >
                              <BsCalendar2DateFill
                                style={{ marginRight: "5px" }}
                              />
                              {new Date(article.createdAt).toLocaleDateString(
                                "en-EN",
                                {
                                  day: "numeric",
                                  month: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </div>
                            <div
                              className="comments_article"
                              style={{
                                marginRight: "20px",
                                display: "flex",
                                justifyContent: "space-evenly",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <FaCommentDots style={{ marginRight: "5px" }} />
                              </div>

                              <div>346</div>
                            </div>
                            <div
                              className="likes_article"
                              style={{
                                marginRight: "20px",
                                display: "flex",
                                justifyContent: "space-evenly",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <AiFillLike style={{ marginRight: "1px" }} />
                              </div>

                              <div>656</div>
                            </div>
                            <div className="me-4">
                              <BsFillShareFill className="me-1" />
                              Share
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div class="col-lg-3">
            <div class="card">
              <img src="assets/img/card.jpg" class="card-img-top" alt="..." />
              <div class="card-img-overlay">
                <h5 class="card-title">Card with an image overlay</h5>
                <p class="card-text">
                  Some quick example text to build on the card title and make up
                  the bulk of the card's content.
                </p>
              </div>
            </div>
            <div class="card">
              <img src="assets/img/card.jpg" class="card-img-top" alt="..." />
              <div class="card-img-overlay">
                <h5 class="card-title">Card with an image overlay</h5>
                <p class="card-text">
                  Some quick example text to build on the card title and make up
                  the bulk of the card's content.
                </p>
              </div>
            </div>
            <div class="card">
              <img src="assets/img/card.jpg" class="card-img-top" alt="..." />
              <div class="card-img-overlay">
                <h5 class="card-title">Card with an image overlay</h5>
                <p class="card-text">
                  Some quick example text to build on the card title and make up
                  the bulk of the card's content.
                </p>
              </div>
            </div>
            <div class="card">
              <img src="assets/img/card.jpg" class="card-img-top" alt="..." />
              <div class="card-img-overlay">
                <h5 class="card-title">Card with an image overlay</h5>
                <p class="card-text">
                  Some quick example text to build on the card title and make up
                  the bulk of the card's content.
                </p>
              </div>
            </div>
            <div class="card">
              <img src="assets/img/card.jpg" class="card-img-top" alt="..." />
              <div class="card-img-overlay">
                <h5 class="card-title">Card with an image overlay</h5>
                <p class="card-text">
                  Some quick example text to build on the card title and make up
                  the bulk of the card's content.
                </p>
              </div>
            </div>
            <div class="card">
              <img src="assets/img/card.jpg" class="card-img-top" alt="..." />
              <div class="card-img-overlay">
                <h5 class="card-title">Card with an image overlay</h5>
                <p class="card-text">
                  Some quick example text to build on the card title and make up
                  the bulk of the card's content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
