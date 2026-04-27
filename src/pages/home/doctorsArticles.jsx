import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { BsCalendar2DateFill } from "react-icons/bs";
import { FaCommentDots } from "react-icons/fa6";
import { AiFillLike } from "react-icons/ai";
import { BsFillShareFill } from "react-icons/bs";

export default function DoctorsArticles() {
  const { id } = useParams(); // doctor profile id from URL
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.REACT_APP_API_URL;
  useEffect(() => {
    const fetchDoctorArticles = async () => {
      try {
        const response = await axios.get(`${API_BASE}/doctor-articles/${id}`, {
          withCredentials: true,
        });
        setArticles(response.data);
      } catch (error) {
        console.error("Error fetching doctor articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorArticles();
  }, [id]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="pagetitle">
        <h1>All articles</h1>
      </div>

      <section className="section">
        <div className="row align-items-top">
          {articles.length === 0 ? (
            <p>No articles available</p>
          ) : (
            <div className="col-lg-9">
              <div className="row">
                {articles.map((article) => (
                  <div className="col-md-6" key={article._id}>
                    <div className="card mb-3">
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
                              style={{
                                width: "100%",
                                height: "300px",
                                objectFit: "cover",
                              }}
                            />

                            {/* Displaying article content */}
                            <div
                              className="card-text"
                              style={{
                                height: "92px",
                                overflow: "hidden",
                                marginTop: "20px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: article.content,
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
                              <FaCommentDots style={{ marginRight: "5px" }} />
                              <div>345</div>
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
                              <AiFillLike style={{ marginRight: "1px" }} />
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

          {/* Additional block with image or advertisement */}
          <div className="col-lg-3">
            <div className="card">
              <img
                src="assets/img/card.jpg"
                className="card-img-top"
                alt="..."
              />
              <div className="card-img-overlay">
                <h5 className="card-title">Card with an image overlay</h5>
                <p className="card-text">
                  Some quick example text to build on the card title and make up
                  the bulk of the card's content.
                </p>
              </div>
            </div>
            {/* You can add more cards here */}
          </div>
        </div>
      </section>
    </div>
  );
}
