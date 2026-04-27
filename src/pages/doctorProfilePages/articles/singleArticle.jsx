import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaCommentDots } from "react-icons/fa6";
import { BsCalendar2DateFill } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { BsFillShareFill } from "react-icons/bs";
import { RiReplyLine } from "react-icons/ri";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";
const API_BASE = process.env.REACT_APP_API_URL;

const abs = (u) =>
  !u
    ? null
    : /^https?:\/\//i.test(u)
      ? u
      : `${API_BASE}${u.startsWith("/") ? u : `/${u}`}`;

export default function SingleArticle() {
  const { t, i18n } = useTranslation();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyContent, setReplyContent] = useState(""); // State for reply content
  const [replysContent, setReplysContent] = useState(""); // State for reply content
  const [datauser, setDatauser] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const { id } = useParams();
  const [showOriginal, setShowOriginal] = useState(false);
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let isMounted = true; // флаг для защиты от обновления размонтированного компонента
    const controller = new AbortController(); // для отмены запроса если пользователь уйдет

    const fetchData = async () => {
      try {
        const [articleRes, commentsRes, userRes] = await Promise.all([
          axios.get(`${API_BASE}/doctor-profile/my-article-single/${id}`, {
            headers: {
              "Accept-Language": i18n.language,
            },
            signal: controller.signal,
          }),
          axios.get(`${API_BASE}/comments/get-comments/${id}`, {
            withCredentials: true,
            signal: controller.signal,
          }),
          axios.get(`${API_BASE}/common-for-user`, {
            withCredentials: true,
            signal: controller.signal,
          }),
        ]);

        if (isMounted) {
          setArticle(articleRes.data.article || articleRes.data);
          const comments = Array.isArray(commentsRes.data.comments)
            ? commentsRes.data.comments
            : [];
          setComments(comments);
          setDatauser(userRes.data.authorAvatar || "/default-avatar.png");
          setCurrentUserId(userRes.data.user.userId);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          if (axios.isCancel(err)) {
            console.log("Запрос отменен");
          } else {
            console.error(err);
            setError(
              err.response?.data?.message || t("article_single.load_error"),
            );
            setLoading(false);
          }
        }
      }
    };

    // Перед загрузкой нового - очистить
    setArticle(null);
    setComments([]);
    setLoading(true);
    setError(null);

    fetchData();

    // Очистка эффекта
    return () => {
      isMounted = false;
      controller.abort(); // отменить активные запросы
    };
  }, [id, i18n.language, refresh]);
  useEffect(() => {
    if (!article) return;

    if (!article.isOriginal) return;

    const interval = setInterval(() => {
      console.log("🔄 refreshing article...");
      setRefresh((r) => r + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [article]);
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(
        `${API_BASE}/comments/add-comments`,
        { content: newComment, articleId: id },
        { withCredentials: true },
      );

      setComments((prevComments) => [
        {
          ...response.data.comment,
          author: {
            _id: currentUserId,
            username: t("article_single.you"),
            avatar: datauser,
          },
        },
        ...prevComments,
      ]);
      setNewComment("");
    } catch (err) {
      console.error("Error while adding comment:", err);
      alert(t("article_single.add_comment_failed"));
    }
  };

  const [replyTo, setReplyTo] = useState(null); // ID of the comment being replied to

  const handleReplyToComment = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const response = await axios.post(
        `${API_BASE}/comments/reply-to-comment/${replyTo}/reply`,
        { content: replyContent, parentCommentId: replyTo, articleId: id },
        { withCredentials: true },
      );

      // Обновляем комментарии, добавляя новый ответ
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === replyTo
            ? {
                ...comment,
                replies: [
                  ...(comment.replies || []),
                  response.data.reply, // Ответ, возвращаемый сервером
                ],
              }
            : comment,
        ),
      );

      // Очищаем форму для ответа
      setReplyContent("");
      setReplyTo(null);
    } catch (err) {
      console.error("Error while adding reply:", err);
      alert(t("article_single.add_reply_failed"));
    }
  };

  const [isReplying, setIsReplying] = useState(false); // Состояние для контроля видимости формы ответа
  const [replyssContent, setReplyssContent] = useState(""); // Контент ответа
  const handleReplyToReplyToComment = async (commentId, replyId, content) => {
    if (!commentId || !replyId || !content) {
      console.error("The required parameters for the request are missing");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/comments/add-comment-reply-reply-replyt/${commentId}/${replyId}`,
        { content },
        { withCredentials: true },
      );

      if (response.status === 201) {
        console.log("Ответ на ответ успешно добавлен");
        setReplyssContent("");
        setIsReplying(false);
      } else {
        console.error("Server error:", response.data.message);
      }
    } catch (error) {
      console.error("Error sending request:", error.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("article_single.confirm_delete_article"))) return;

    try {
      const response = await axios.delete(
        `${API_BASE}/doctor-profile/delete-my-article/${id}`,
        { withCredentials: true },
      );
      alert(response.data.message);
      console.log(
        "The article has been successfully deleted:",
        response.data.message,
      );
      navigate("/doctor/my-articles");
    } catch (err) {
      console.error("Error deleting article:", err);
      alert(t("article_single.delete_article_failed"));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(t("article_single.confirm_delete_comment"))) return;

    try {
      await axios.delete(`${API_BASE}/comments/delete-comments/${commentId}`, {
        withCredentials: true,
      });

      setComments((prevComments) =>
        prevComments.filter((comment) => comment._id !== commentId),
      );
    } catch (err) {
      console.error("Error while deleting comment:", err);
      alert(t("article_single.delete_comment_failed"));
    }
  };

  const handleDeleteReply = async (replyId, parentCommentId) => {
    if (!window.confirm(t("article_single.confirm_delete_reply"))) return;

    try {
      await axios.delete(
        `${API_BASE}/comments/delete-comment-reply/${parentCommentId}/${replyId}`,
        { withCredentials: true },
      );

      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === parentCommentId
            ? {
                ...comment,
                replies: comment.replies.filter(
                  (reply) => reply._id !== replyId,
                ),
              }
            : comment,
        ),
      );
    } catch (err) {
      console.error("Error while deleting reply:", err);
      alert(t("article_single.delete_reply_failed"));
    }
  };

  const handleDeleteReplyReply = async (replyId) => {
    if (!window.confirm(t("article_single.confirm_delete_reply"))) return;
    console.log("Attempting to delete reply:", replyId);

    try {
      // Отправляем запрос на сервер для удаления комментария
      const response = await axios.delete(
        `${API_BASE}/comments/delete-comment-reply-reply/${replyId}`,
        { withCredentials: true },
      );

      // Проверяем, что сервер вернул ожидаемый ответ
      console.log("Server response:", response.data);

      if (response.status === 200 && response.data.deletedReplyId) {
        const deletedReplyId = response.data.deletedReplyId;

        // Функция для рекурсивного удаления ответа
        const deleteNestedReply = (comments) => {
          return comments.map((comment) => {
            // Если у комментария есть вложенные ответы, рекурсивно их проверяем
            if (comment.replies) {
              const updatedReplies = comment.replies.filter(
                (reply) => reply._id !== deletedReplyId,
              );

              // Если был изменен список ответов, обновляем комментарий
              if (updatedReplies.length !== comment.replies.length) {
                comment.replies = updatedReplies;
              }

              // Рекурсивно проверяем все вложенные ответы
              comment.replies = deleteNestedReply(comment.replies);
            }
            return comment;
          });
        };

        // Обновляем состояние, удаляя нужный ответ
        setComments((prevComments) => deleteNestedReply(prevComments));
      } else {
        console.error(
          "No deletedReplyId returned or incorrect response format",
        );
        alert(t("article_single.delete_reply_failed"));
      }
    } catch (err) {
      console.error("Error while deleting reply:", err);
      alert(t("article_single.delete_reply_failed"));
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await axios.post(
        `${API_BASE}/comments-like/${commentId}`,
        {},
        { withCredentials: true },
      );

      console.log("Response from the server:", response.data);

      const updatedLikes = response.data.likes;

      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === commentId
            ? { ...comment, likes: updatedLikes }
            : comment,
        ),
      );
    } catch (err) {
      console.error("Error while liking comment:", err);
      alert(t("article_single.like_comment_failed"));
    }
  };

  // Обработчик лайка для ответа
  const handleLikeReply = async (replyId) => {
    try {
      const response = await axios.post(
        `${API_BASE}/comments/comments-reply-like/${replyId}`,
        {},
        { withCredentials: true },
      );
      console.log("Ответ сервера:", response.data);
      console.log("Reply ID:", replyId);
      const updatedLikes = response.data.likes;
      setComments((prevComments) =>
        prevComments.map((comment) => ({
          ...comment,
          replies: comment.replies.map((reply) =>
            reply._id === replyId
              ? {
                  ...reply,
                  likes: Array.isArray(updatedLikes) ? updatedLikes : [],
                }
              : reply,
          ),
        })),
      );
    } catch (error) {
      if (error.response) {
        console.error("Error from server:", error.response);
      } else if (error.request) {
        console.error(
          "The request was sent but there is no response:",
          error.request,
        );
      } else {
        console.error("An error occurred:", error.message);
      }
      alert(t("article_single.like_reply_failed"));
    }
  };

  const [replysTo, setReplysTo] = useState(null);

  const handleReplyToReply = async (e, parentCommentId, replyId) => {
    e.preventDefault();
    console.log("Sending reply content:", replysContent);
    console.log("Parent Comment ID:", parentCommentId);
    console.log("Reply ID:", replyId);
    if (!replysContent.trim()) return;
    try {
      const response = await axios.post(
        `${API_BASE}/comments/comments-reply-reply/${parentCommentId}/${replyId}`,
        { content: replysContent },
        { withCredentials: true },
      );

      // Обновляем состояние, добавляя новый ответ
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === parentCommentId
            ? {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply._id === replyId
                    ? {
                        ...reply,
                        replies: [
                          ...(reply.replies || []),
                          response.data.reply,
                        ],
                      }
                    : reply,
                ),
              }
            : comment,
        ),
      );

      setReplysContent("");
      setReplysTo(null);
    } catch (error) {
      console.error("Axios Error:", error.response?.data || error.message);
      alert(
        t("article_single.add_reply_to_reply_failed", {
          error: error.response?.data?.error || "",
        }),
      );
    }
  };

  const countAllCommentsAndReplies = (commentsList) => {
    let totalCount = 0;

    const countReplies = (replies) => {
      if (!replies || replies.length === 0) return 0;
      return replies.reduce(
        (acc, reply) => acc + 1 + countReplies(reply.replies),
        0,
      );
    };

    commentsList.forEach((comment) => {
      totalCount += 1; // Сам комментарий
      if (comment.replies) {
        totalCount += countReplies(comment.replies);
      }
    });

    return totalCount;
  };

  if (loading) return <div>{t("article_single.loading")}</div>;
  if (error)
    return (
      <div>
        {t("article_single.error_prefix")}: {error}
      </div>
    );

  return (
    <div>
      <div className="pagetitle">
        <h1>{article?.title}</h1>
        <div style={{ marginBottom: 10 }}>
          {article?.isOriginal && (
            <span style={{ color: "#888" }}>
              Original ({article?.displayedLanguage})
            </span>
          )}

          {!article?.isOriginal && article?.isAutoTranslated && (
            <span style={{ color: "#0d9488" }}>
              🌍 Auto translated ({article?.displayedLanguage})
            </span>
          )}
        </div>
      </div>
      <button onClick={() => setShowOriginal(!showOriginal)}>
        {showOriginal ? "Показать перевод" : "Показать оригинал"}
      </button>
      <div className="pageauthors">
        <h1>{article?.authors || t("article_single.no_authors")}</h1>
      </div>

      <div className="pagereferencess">
        <h1>{article?.references || t("article_single.no_references")}</h1>
      </div>

      <section className="section">
        <div className="card mb-3">
          <div className="card-body">
            <img
              src={article?.imageUrl || "/default-image.jpg"}
              alt={article?.title}
              style={{ width: "50%", height: "auto" }}
            />

            <div
              className="card-text"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  showOriginal ? article?.originalContent : article?.content,
                ),
              }}
            />

            <div className="subarticle-display subarticle d-flex justify-content-start align-items-center">
              <div className="me-4">
                <BsCalendar2DateFill className="me-1" />
                {article?.createdAt
                  ? new Date(article.createdAt).toLocaleDateString(
                      i18n.language,
                    )
                  : t("article_single.date_unknown")}
              </div>
              <div className="me-4">
                <FaCommentDots className="me-1" />
                {countAllCommentsAndReplies(comments)}
              </div>
              <div className="me-4">
                <AiFillLike className="me-1" />
                656
              </div>
              <div className="me-4">
                <BsFillShareFill className="me-1" />
                {t("article_single.share")}
              </div>
              {article?.authorId === currentUserId && (
                <Link
                  to={`/doctor/update-my-article/${article?._id}`}
                  target="_blank"
                  className="me-3"
                >
                  <FaEdit className="me-1" /> {t("article_single.edit")}
                </Link>
              )}
              {article?.authorId === currentUserId && (
                <button onClick={handleDelete} className="btn btn-danger">
                  <MdDelete className="me-1" />
                  {t("article_single.delete")}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="gradient-custom">
        <div className="container my-5 py-5">
          <h4 className="text-center mb-4 pb-2">
            {t("article_single.comments_title")}
          </h4>

          <div className="row">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment._id} className="d-flex flex-start mt-4">
                  <div className="card w-100">
                    <div className="card-body">
                      <h5 className="card-title">
                        <img
                          src={abs(
                            comment?.author?.avatar &&
                              comment.author.avatar !== "null"
                              ? comment.author.avatar
                              : "/images/avatar/1.jpg",
                          )}
                          alt={comment?.author?.username || "Avatar"}
                          className="rounded-circle me-3"
                          style={{ width: "50px", height: "50px" }}
                        />

                        {comment.author?.username}
                      </h5>
                      <p className="card-text">{comment.content}</p>

                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          setReplyTo(
                            replyTo === comment._id ? null : comment._id,
                          )
                        }
                        style={{
                          fontSize: "14px",
                          height: "32px",
                          paddingLeft: "8px",
                          paddingRight: "2px",
                          padding: "5px",
                          marginRight: "5px",
                        }}
                      >
                        <RiReplyLine className="me-1" />
                      </button>

                      <button
                        className="btn btn-outline-primary me-2"
                        onClick={() => handleLikeComment(comment._id)}
                        style={{
                          fontSize: "14px",
                          height: "32px",
                          paddingLeft: "8px",
                          paddingRight: "2px",
                          padding: "5px",
                          marginRight: "5px",
                        }}
                      >
                        <AiFillLike className="me-1" />
                        {comment.likes >= 0
                          ? comment.likes
                          : comment.likes.length}
                      </button>

                      {comment.author?._id === currentUserId && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="btn btn-danger"
                          style={{
                            fontSize: "14px",
                            height: "32px",
                            paddingLeft: "8px",
                            paddingRight: "2px",
                            padding: "5px",
                            marginRight: "5px",
                          }}
                        >
                          <MdDelete className="me-1" />
                        </button>
                      )}

                      {replyTo === comment._id && (
                        <div className="mt-3">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="form-control"
                            rows="2"
                            placeholder={t("article_single.reply_placeholder")}
                          />
                          <button
                            onClick={handleReplyToComment}
                            className="btn btn-success mt-2"
                            style={{
                              fontSize: "14px",
                              height: "32px",
                              paddingLeft: "8px",
                              paddingRight: "2px",
                              padding: "5px",
                              marginRight: "5px",
                            }}
                          >
                            {t("article_single.send_reply")}
                          </button>
                        </div>
                      )}

                      {/* Displaying replies */}
                      {comment.replies?.length > 0 &&
                        comment.replies.map((reply) => (
                          <div key={reply._id} className="mt-3 ms-5">
                            <img
                              src={abs(
                                reply?.author?.avatar &&
                                  reply.author.avatar !== "null"
                                  ? reply.author.avatar
                                  : "/images/avatar/1.jpg",
                              )}
                              alt={reply.author?.username || "Avatar"}
                              className="rounded-circle me-3"
                              style={{ width: "50px", height: "50px" }}
                            />
                            <strong>
                              {reply.author?.username ||
                                t("article_single.anonymous")}
                              &nbsp;
                              {t("article_single.replied_to")}&nbsp;@
                              {comment.author.username}
                            </strong>
                            <p className="card-text">{reply.content}</p>

                            <button
                              onClick={() =>
                                setReplysTo(
                                  replysTo === reply._id ? null : reply._id,
                                )
                              }
                              className="btn btn-primary"
                              style={{
                                fontSize: "14px",
                                height: "32px",
                                paddingLeft: "8px",
                                paddingRight: "2px",
                                padding: "5px",
                                marginRight: "5px",
                              }}
                            >
                              <RiReplyLine className="me-1" />
                            </button>

                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleLikeReply(reply._id)}
                              style={{
                                fontSize: "14px",
                                height: "32px",
                                paddingLeft: "8px",
                                paddingRight: "2px",
                                padding: "5px",
                                marginRight: "5px",
                              }}
                            >
                              <AiFillLike className="me-1" />
                              {reply.likes?.length || 0}
                            </button>

                            {reply.author?._id === currentUserId && (
                              <button
                                onClick={() =>
                                  handleDeleteReply(reply._id, comment._id)
                                }
                                className="btn btn-danger"
                                style={{
                                  fontSize: "14px",
                                  height: "32px",
                                  paddingLeft: "8px",
                                  paddingRight: "2px",
                                  padding: "5px",
                                  marginRight: "5px",
                                }}
                              >
                                <MdDelete className="me-1" />
                              </button>
                            )}

                            {replysTo === reply._id && (
                              <div style={{ marginTop: "10px" }}>
                                <textarea
                                  value={replysContent}
                                  onChange={(e) =>
                                    setReplysContent(e.target.value)
                                  }
                                  className="form-control"
                                  rows="2"
                                  placeholder={t(
                                    "article_single.reply_placeholder",
                                  )}
                                />
                                <button
                                  onClick={(e) =>
                                    handleReplyToReply(
                                      e,
                                      comment._id,
                                      reply._id,
                                    )
                                  }
                                  className="btn btn-success"
                                  style={{
                                    fontSize: "14px",
                                    height: "32px",
                                    paddingLeft: "8px",
                                    paddingRight: "2px",
                                    padding: "5px",
                                    margin: "5px",
                                  }}
                                >
                                  {t("article_single.send_reply")}
                                </button>
                              </div>
                            )}

                            {/* Recursive rendering for nested replies */}
                            {reply.replies?.length > 0 &&
                              reply.replies.map((nestedReply) => (
                                <div
                                  key={nestedReply._id}
                                  className="ms-5 mt-2"
                                >
                                  <img
                                    src={abs(
                                      nestedReply?.author?.avatar &&
                                        nestedReply.author.avatar !== "null"
                                        ? nestedReply.author.avatar
                                        : "/images/avatar/1.jpg",
                                    )}
                                    alt={
                                      nestedReply.author?.username || "Avatar"
                                    }
                                    className="rounded-circle me-2"
                                    style={{ width: "30px", height: "30px" }}
                                  />
                                  <strong>
                                    {nestedReply.author?.username ||
                                      t("article_single.anonymous")}
                                  </strong>
                                  &nbsp;
                                  {t("article_single.answered_to")}&nbsp;@
                                  {reply.author.username}
                                  <p>{nestedReply?.content}</p>
                                  {/* Форма для вложенного ответа (логика сохранена как была) */}
                                  {isReplying[nestedReply._id] && (
                                    <div className="mt-2">
                                      <textarea
                                        placeholder={t(
                                          "article_single.reply_nested_placeholder",
                                        )}
                                        rows="3"
                                        className="form-control"
                                        value={replyssContent}
                                        onChange={(e) =>
                                          setReplyssContent(e.target.value)
                                        }
                                      />
                                      <button
                                        onClick={() => {
                                          console.log(
                                            "nestedReply._id:",
                                            nestedReply._id,
                                          );
                                          console.log(
                                            "reply.commentId:",
                                            reply.commentId,
                                          );
                                          console.log(
                                            "replyssContent:",
                                            replyssContent,
                                          );

                                          if (
                                            nestedReply._id &&
                                            reply.commentId &&
                                            replyssContent
                                          ) {
                                            handleReplyToReplyToComment(
                                              reply.commentId,
                                              nestedReply._id,
                                              replyssContent,
                                            );
                                          } else {
                                            console.error(
                                              "Required data is missing",
                                            );
                                          }
                                        }}
                                        className="btn btn-primary mt-2"
                                      >
                                        {t("article_single.answer")}
                                      </button>
                                    </div>
                                  )}
                                  {nestedReply.author?._id ===
                                    currentUserId && (
                                    <button
                                      onClick={() =>
                                        handleDeleteReplyReply(nestedReply._id)
                                      }
                                      className="btn btn-danger"
                                      style={{
                                        fontSize: "14px",
                                        height: "32px",
                                        paddingLeft: "8px",
                                        paddingRight: "2px",
                                        padding: "5px",
                                        marginRight: "5px",
                                      }}
                                    >
                                      <MdDelete className="me-1" />
                                    </button>
                                  )}
                                </div>
                              ))}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>{t("article_single.no_comments")}</p>
            )}
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="form-control"
            rows="3"
            placeholder={t("article_single.comment_placeholder")}
          />
          <button onClick={handleAddComment} className="btn btn-primary mt-2">
            {t("article_single.add_comment")}
          </button>
        </div>
      </section>
    </div>
  );
}
