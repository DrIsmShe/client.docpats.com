// client/src/pages/patientProfilePages/shared/doctors/doctorsArticles.jsx
//
// Публикации врача — то, что пациент открывает из его карточки.
//
// ЧТО ЗДЕСЬ БЫЛО НЕ ТАК.
//
// 1. Показывалась половина работ. Мнения врача лежат в одной коллекции,
//    научные статьи — в другой; страница спрашивала только первую. У врача
//    с шестью научными работами и четырьмя мнениями выходило четыре
//    карточки. Теперь сервер отдаёт обе и помечает каждую видом (kind), а
//    страница по нему ведёт на нужный экран: адреса просмотра разные.
//
// 2. Вёрстка была голым бутстрапом с фиксированными высотами: заголовок в
//    70 пикселей, текст в 92, картинка в 250 — всё, что не влезло,
//    обрезалось посередине слова, а карточки с короткими заголовками
//    зияли пустотой. Высоты заменены на ограничение по числу строк
//    (line-clamp): обрезка идёт по строке, а не по пикселю, и карточка
//    занимает столько, сколько нужно.
//
// ПОЧЕМУ СТИЛИ ЗДЕСЬ, А НЕ В ОБЩЕМ ФАЙЛЕ. Страница одна, и её оформление
// нигде больше не повторяется; выносить ради неё общий модуль — заводить
// зависимость, которую придётся помнить. Палитра взята та же, что у ленты
// статей, чтобы переход из ленты сюда не выглядел переходом на чужой сайт.

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { BsCalendar2DateFill } from "react-icons/bs";
import { FaCommentDots } from "react-icons/fa6";
import { AiFillLike } from "react-icons/ai";
import { sh } from "../../../../lib/sanitizeHtml";

const СТИЛИ = `
.da-root{--cream:#faf8f4;--card:#fff;--ink:#1c1917;--ink2:#44403c;--ink3:#78716c;
  --teal:#0f766e;--teal-pale:#f0fdfa;--teal-border:#99f6e4;--border:#e7e2d8;
  background:var(--cream);min-height:100%;padding:28px 16px 48px}
.da-head{max-width:1120px;margin:0 auto 26px;text-align:center}
.da-kicker{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal)}
.da-title{margin:6px 0 0;font-size:28px;line-height:1.25;font-weight:700;color:var(--ink);text-wrap:balance}
.da-count{margin-top:8px;font-size:14px;color:var(--ink3)}
.da-grid{max-width:1120px;margin:0 auto;display:grid;gap:20px;
  grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}
.da-card{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--border);
  border-radius:14px;overflow:hidden;transition:box-shadow .15s,transform .15s}
.da-card:hover{box-shadow:0 8px 24px rgba(28,25,23,.09);transform:translateY(-2px)}
.da-cover{width:100%;aspect-ratio:16/9;object-fit:cover;background:var(--cream)}
.da-body{display:flex;flex-direction:column;gap:10px;padding:16px 18px 18px;flex:1}
.da-kind{align-self:flex-start;font-size:11px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;padding:4px 10px;border-radius:999px;
  color:var(--teal);background:var(--teal-pale);border:1px solid var(--teal-border)}
.da-kind.opinion{color:#9a3412;background:#fff7ed;border-color:#fed7aa}
.da-name{margin:0;font-size:18px;line-height:1.35;font-weight:700;color:var(--ink);
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.da-link{text-decoration:none}
.da-link:hover .da-name{color:var(--teal)}
.da-text{font-size:14px;line-height:1.55;color:var(--ink2);
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.da-text *{font-size:inherit!important;line-height:inherit!important;margin:0!important}
.da-meta{margin-top:auto;padding-top:12px;border-top:1px solid var(--border);
  display:flex;flex-wrap:wrap;gap:16px;font-size:13px;color:var(--ink3)}
.da-meta span{display:inline-flex;align-items:center;gap:6px}
.da-empty{max-width:520px;margin:40px auto;text-align:center;color:var(--ink3);font-size:15px}
@media (max-width:640px){.da-title{font-size:22px}.da-grid{grid-template-columns:1fr}}
`;

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
          { withCredentials: true },
        );

        const { success, doctorProfile, articles } = response.data;

        if (success) {
          setDoctor(doctorProfile);
          setArticles(Array.isArray(articles) ? articles : []);
        } else {
          setError(t("articles.loadFailed"));
        }
      } catch (err) {
        setError(err.response?.data?.message || t("articles.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDoctorArticles();
  }, [id, API_BASE, t]);

  if (loading)
    return <div className="text-center mt-4">{t("common.loadingSpin")}</div>;

  if (error)
    return <div className="text-danger text-center mt-4">{error}</div>;

  const имяВрача = doctor ? `${doctor.firstName} ${doctor.lastName}`.trim() : "";

  /* Научная статья и мнение открываются на РАЗНЫХ экранах. Пометку kind
     ставит сервер; для записей, пришедших без неё (старый ответ из кэша),
     считаем мнением — так было до этой правки. */
  const адрес = (статья) =>
    статья.kind === "scientific"
      ? `/patient/article-scientific-detail/${статья._id}`
      : `/patient/article-detail/${статья._id}`;

  return (
    <div className="da-root">
      <style>{СТИЛИ}</style>

      <header className="da-head">
        <div className="da-kicker">{t("articles.kicker")}</div>
        <h1 className="da-title">
          {t("articles.title")} {имяВрача}
        </h1>
        {articles.length > 0 && (
          <div className="da-count">
            {t("articles.count", { count: articles.length })}
          </div>
        )}
      </header>

      {articles.length === 0 ? (
        <p className="da-empty">{t("articles.doctorHasNone")}</p>
      ) : (
        <div className="da-grid">
          {articles.map((article) => (
            <article className="da-card" key={article._id}>
              {article.imageUrl && (
                <Link to={адрес(article)}>
                  <img
                    className="da-cover"
                    src={article.imageUrl}
                    alt={article.title}
                    loading="lazy"
                  />
                </Link>
              )}

              <div className="da-body">
                <span
                  className={
                    "da-kind" +
                    (article.kind === "scientific" ? "" : " opinion")
                  }
                >
                  {article.kind === "scientific"
                    ? t("articles.kindScientific")
                    : t("articles.kindOpinion")}
                </span>

                <Link className="da-link" to={адрес(article)}>
                  <h2 className="da-name">{article.title}</h2>
                </Link>

                <div
                  className="da-text"
                  dangerouslySetInnerHTML={{
                    __html: sh(article.abstract || article.content),
                  }}
                />

                <div className="da-meta">
                  <span>
                    <BsCalendar2DateFill />
                    {new Date(article.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                  <span>
                    <FaCommentDots />
                    {article.commentsCount || 0}
                  </span>
                  <span>
                    <AiFillLike />
                    {article.likesCount || 0}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
