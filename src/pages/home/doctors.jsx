import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { FaCommentDots } from "react-icons/fa6";
import { BsCalendar2DateFill } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import { BsFillShareFill } from "react-icons/bs";
import { sh } from "../../lib/sanitizeHtml";

export default function Doctors() {
  const { t } = useTranslation("doctorsPage");

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(`${API_BASE}/doctors`, {
          withCredentials: true,
        });
        setDoctors(response.data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  if (loading) {
    return <div>{t("loading")}</div>;
  }

  return (
    <div>
      <section className="section">
        <div className="row align-items-top">
          <div className="col-lg-9">
            <div className="row">
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <div className="col-md-6" key={doctor._id}>
                    <div
                      className="card mb-3"
                      style={{ height: "650px", overflow: "hidden" }}
                    >
                      <div className="row g-0">
                        <div className="col-md-12">
                          <div className="card-body">
                            <div
                              className="title-articles-count"
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                height: "80px",
                                overflow: "hidden",
                              }}
                            >
                              <div className="title-doctor">
                                <h2
                                  style={{ fontSize: "20px" }}
                                  className="card-title"
                                >
                                  {doctor.user
                                    ? `${doctor.user.firstName} ${doctor.user.lastName}`
                                    : t("unknown")}
                                </h2>
                              </div>

                              <div className="articles-info">
                                <Link
                                  to={`/doctor-articles/${doctor._id}`}
                                  className="btn btn-primary"
                                >
                                  {t("articles")}: {doctor.articles.count}
                                </Link>
                              </div>
                            </div>

                            <img
                              src={doctor.profileImage}
                              alt={
                                doctor.user
                                  ? `${doctor.user.firstName} ${doctor.user.lastName}`
                                  : t("doctor")
                              }
                              style={{
                                width: "100%",
                                height: "300px",
                                objectFit: "cover",
                              }}
                            />

                            <div
                              className="card-text"
                              style={{
                                height: "92px",
                                overflow: "hidden",
                                marginTop: "20px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: sh(doctor.about,)
                              }}
                            />

                            <p className="card-text">
                              <strong>{t("clinic")}:</strong> {doctor.clinic}
                            </p>

                            <p className="card-text">
                              <strong>{t("country")}:</strong> {doctor.country}
                            </p>
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
                              alignItems: "center",
                            }}
                          >
                            <div
                              className="is_published_article"
                              style={{
                                marginRight: "20px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <BsCalendar2DateFill
                                style={{ marginRight: "5px" }}
                              />
                              {new Date(doctor.createdAt).toLocaleDateString(
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
                                alignItems: "center",
                              }}
                            >
                              <AiFillLike style={{ marginRight: "1px" }} />
                              <div>656</div>
                            </div>

                            <div
                              className="edit_article"
                              style={{
                                marginRight: "2px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <div className="me-4">
                                <BsFillShareFill className="me-1" />
                                {t("share")}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>{t("noDoctors")}</p>
              )}
            </div>
          </div>

          <div className="col-lg-3">
            <div className="card">
              <img
                src="assets/img/card.jpg"
                className="card-img-top"
                alt="overlay"
              />
              <div className="card-img-overlay">
                <h5 className="card-title">{t("overlayTitle")}</h5>
                <p className="card-text">{t("overlayText")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
