import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { BsCalendar2DateFill, BsFillShareFill } from "react-icons/bs";
import { FaCommentDots, FaUserNurse } from "react-icons/fa6";
import { AiFillLike } from "react-icons/ai";
import { sh } from "../../../../lib/sanitizeHtml";

export default function DoctorArticlesForPatient() {
  const { t } = useTranslation("patientArea");
  const { id } = useParams();
  const [articles, setArticles] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API_BASE = process.env.REACT_APP_API_URL;
  useEffect(() => {
    const fetchDoctorArticles = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/patient-profile/doctor-articles/${id}`,
          { withCredentials: true }
        );

        const { success, doctorProfile, articles } = response.data;

        if (success) {
          setDoctor(doctorProfile);
          setArticles(articles);
        } else {
          setError("Данные не найдены");
        }
      } catch (err) {
        console.error("❌ Ошибка загрузки:", err.response?.data || err);
        setError(err.response?.data?.message || "Ошибка при загрузке данных");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDoctorArticles();
    }
  }, [id]);

  if (loading) return <div className="text-center mt-4">{t("common.loadingSpin")}</div>;

  if (error)
    return <div className="text-danger text-center mt-4">❌ {error}</div>;

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">
        {t("articles.title")} {doctor ? `${doctor.firstName} ${doctor.lastName}` : "доктора"}
      </h2>

      {articles.length === 0 ? (
        <p className="text-center">
          {t("articles.doctorHasNone")}
        </p>
      ) : (
        <div className="row">
          {articles.map((article) => (
            <div className="col-md-6" key={article._id}>
              <div className="card mb-4 shadow-sm">
                <div className="card-body">
                  <Link to={`/patient/article-detail/${article._id}`}>
                    <h5
                      className="card-title"
                      style={{
                        fontSize: "20px",
                        height: "70px",
                        overflow: "hidden",
                      }}
                    >
                      {article.title}
                    </h5>
                  </Link>

                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="img-fluid rounded"
                      style={{
                        height: "250px",
                        objectFit: "cover",
                        marginBottom: "15px",
                      }}
                    />
                  )}

                  <div
                    className="card-text"
                    style={{ height: "92px", overflow: "hidden" }}
                    dangerouslySetInnerHTML={{ __html: sh(article.content) }}
                  />

                  <div className="d-flex justify-content-start align-items-center mt-3 gap-4 flex-wrap">
                    <span className="d-flex align-items-center gap-2">
                      <BsCalendar2DateFill />
                      {new Date(article.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                    <span className="d-flex align-items-center gap-2">
                      <FaCommentDots />
                      {article.commentsCount || 0}
                    </span>
                    <span className="d-flex align-items-center gap-2">
                      <AiFillLike />
                      {article.likesCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
