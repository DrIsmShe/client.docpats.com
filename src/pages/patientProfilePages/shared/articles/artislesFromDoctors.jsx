import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaCommentDots } from "react-icons/fa6";
import { BsCalendar2DateFill, BsFillShareFill } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import useCommentCountBulk from "../../../../components/shared/useCommentCount";
import { sh } from "../../../../lib/sanitizeHtml";

export default function ArticlesFromDoctorsForPatient() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const articleIds = articles.length ? articles.map((a) => a._id) : [];
  const commentCounts = useCommentCountBulk(articleIds);
  const API_BASE = process.env.REACT_APP_API_URL;
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/doctor-profile/articles-all`,
          { withCredentials: true }
        );
        setArticles(response.data.data || []); // ПРАВИЛЬНО: берем data, не articles
      } catch (err) {
        console.error("Ошибка при загрузке статей:", err.message);
        setError("Ошибка при загрузке статей");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div>
      <div className="pagetitle">
        <h1>Все статьи</h1>
      </div>

      <section className="section">
        <div className="row align-items-top">
          {articles.length === 0 ? (
            <p>Статей нет</p>
          ) : (
            <div className="col-lg-9">
              <div className="row">
                {articles.map((article) => (
                  <div key={article._id} className="col-md-6">
                    <div className="card mb-3">
                      <div className="row g-0">
                        <div className="col-md-12">
                          <div className="card-body">
                            <Link to={`/patient/article-detail/${article._id}`}>
                              <h2
                                className="card-title"
                                style={{
                                  fontSize: "22px",
                                  height: "100px",
                                  overflow: "hidden",
                                }}
                              >
                                {article.title}
                              </h2>
                            </Link>

                            {article.imageUrl && (
                              <img
                                src={article.imageUrl}
                                alt={article.title}
                                style={{
                                  width: "100%",
                                  height: "300px",
                                  objectFit: "cover",
                                }}
                                className="mb-3"
                              />
                            )}

                            <div
                              className="card-text"
                              style={{
                                height: "92px",
                                overflow: "hidden",
                                marginTop: "20px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html:
                                  sh(article.content ||
                                  "<p>Контент отсутствует</p>",)
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
                              gap: "20px",
                            }}
                          >
                            <div className="d-flex align-items-center">
                              <BsCalendar2DateFill className="me-1" />
                              {article.createdAt
                                ? new Date(
                                    article.createdAt
                                  ).toLocaleDateString("ru-RU")
                                : "Нет даты"}
                            </div>

                            <div className="d-flex align-items-center">
                              <FaCommentDots className="me-1" />
                              {commentCounts[article._id] || 0}
                            </div>

                            <div className="d-flex align-items-center">
                              <AiFillLike className="me-1" />
                              656
                            </div>

                            <div className="d-flex align-items-center">
                              <BsFillShareFill className="me-1" />
                              Поделиться
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

          {/* Боковая колонка */}
          <div className="col-lg-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="card mb-3">
                <img
                  src="assets/img/card.jpg"
                  className="card-img-top"
                  alt="..."
                />
                <div className="card-img-overlay">
                  <h5 className="card-title">Card with an image overlay</h5>
                  <p className="card-text">
                    Some quick example text to build on the card title and make
                    up the bulk of the card's content.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
