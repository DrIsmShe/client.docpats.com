import React, { useEffect, useState } from "react";
import axios from "axios";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.REACT_APP_API_URL;
const FALLBACK_AVATAR = `${API_BASE}/uploads/avatars/gorilla.png`;

const abs = (u) =>
  !u
    ? null
    : /^https?:\/\//i.test(u)
      ? u
      : `${API_BASE}${u.startsWith("/") ? u : `/${u}`}`;

const getAvatar = (author) => {
  const u = author?.avatar || author?.profileImage || author?.photoUrl || null;

  return abs(u || FALLBACK_AVATAR);
};

export default function CommentSection({
  refId,
  userId,
  targetType = "Doctor",
  onNewComment,
  onDeleteComment,
  // Режим чтения: список видно, действий нет.
  //
  // Проп передавали со страницы врача (doctorDetailForAll) для гостя, но
  // компонент его не принимал — и гость видел полноценную форму, которая при
  // отправке упиралась в отказ сервера. Показать обсуждение и не предлагать
  // писать в него — это и был замысел вызывающей стороны.
  readOnly = false,
}) {
  const { t } = useTranslation("CommentSection");

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showReplyPicker, setShowReplyPicker] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ================= USER =================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (res.data?.user?.userId) {
          setCurrentUserId(res.data.user.userId);
        }
      } catch (err) {
        console.error("User fetch error:", err.message);
      }
    };
    fetchUser();
  }, []);

  // ================= EMOJI =================
  const addEmoji = (emoji) => setNewComment((prev) => prev + emoji.native);

  const addReplyEmoji = (emoji) =>
    setReplyContent((prev) => prev + emoji.native);

  // ================= FETCH =================
  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/comments/add-comments/by-ref/${refId}`,
        { withCredentials: true },
      );
      setComments(res.data.comments || []);
    } catch (err) {
      console.error("Load error:", err.message);
      setError(t("errors.load"));
    } finally {
      setLoading(false);
    }
  };

  // ================= CREATE =================
  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await axios.post(
        `${API_BASE}/comments/add-comments/create`,
        { content: newComment, targetId: refId, targetType },
        { withCredentials: true },
      );

      if (onNewComment) onNewComment();

      setNewComment("");
      fetchComments();
    } catch (err) {
      console.error("Create error:", err.message);
      setError(t("errors.create"));
    }
  };

  // ================= REPLY =================
  const handleReply = async (parentId) => {
    if (!replyContent.trim()) return;

    try {
      await axios.post(
        `${API_BASE}/comments/add-comments/create`,
        {
          content: replyContent,
          targetId: refId,
          targetType,
          parentCommentId: parentId,
        },
        { withCredentials: true },
      );

      if (onNewComment) onNewComment();

      setReplyContent("");
      setReplyingTo(null);
      fetchComments();
    } catch (err) {
      console.error("Reply error:", err.message);
      setError(t("errors.reply"));
    }
  };

  // ================= DELETE =================
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(t("confirmDelete"))) return;

    try {
      await axios.delete(
        `${API_BASE}/comments/add-comments/delete/${commentId}`,
        { withCredentials: true },
      );

      if (onDeleteComment) onDeleteComment();

      fetchComments();
    } catch (err) {
      console.error("Delete error:", err.message);
      setError(t("errors.delete"));
    }
  };

  // ================= LIKE =================
  const handleLikeToggle = async (commentId) => {
    try {
      await axios.put(
        `${API_BASE}/comments/add-comments/like/${commentId}`,
        {},
        { withCredentials: true },
      );
      fetchComments();
    } catch (err) {
      console.error("Like error:", err.message);
      setError(t("errors.like"));
    }
  };

  // ================= EDIT =================
  const handleUpdateComment = async (commentId) => {
    try {
      await axios.put(
        `${API_BASE}/comments/add-comments/update/${commentId}`,
        { content: editedContent },
        { withCredentials: true },
      );

      setEditingId(null);
      setEditedContent("");
      fetchComments();
    } catch (err) {
      console.error("Edit error:", err.message);
      setError(t("errors.edit"));
    }
  };

  const canEdit = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    return now - created <= 15 * 60 * 1000;
  };

  // ================= RENDER =================
  const renderComments = (commentsList) => {
    return commentsList.map((comment) => (
      <div key={comment._id} className="border rounded p-2 mb-3 bg-light">
        <img
          src={getAvatar(comment.author)}
          alt="Avatar"
          className="rounded-circle"
          style={{ width: 40, height: 40, objectFit: "cover" }}
        />

        <div className="fw-bold">
          {comment.author?.firstName
            ? `${comment.author.firstName} ${comment.author.lastName || ""}`
            : comment.author?.username || t("anonymous")}

          <span className="text-muted ms-2" style={{ fontSize: "12px" }}>
            • {new Date(comment.createdAt).toLocaleString()}
            {comment.editedAt && ` ${t("edited")}`}
          </span>
        </div>

        {comment.parentAuthor && comment.parentContent && (
          <div
            className="border-start ps-2 mb-2 text-muted"
            style={{ fontSize: "0.875rem", borderLeftColor: "#ccc" }}
          >
            {t("replyTo")}{" "}
            <strong>
              {comment.parentAuthor.firstName} {comment.parentAuthor.lastName}
            </strong>
            : “
            {comment.parentContent.length > 80
              ? comment.parentContent.slice(0, 80) + "..."
              : comment.parentContent}
            ”
          </div>
        )}

        {editingId === comment._id ? (
          <>
            <textarea
              className="form-control mb-2"
              rows={3}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />

            <button
              className="btn btn-sm btn-success me-2"
              onClick={() => handleUpdateComment(comment._id)}
            >
              {t("save")}
            </button>

            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setEditingId(null)}
            >
              {t("cancel")}
            </button>
          </>
        ) : (
          <>
            <div
              className="mb-2"
              style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}
            >
              {comment.content}
            </div>

            {!readOnly && (
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleLikeToggle(comment._id)}
              >
                ❤️ {comment.likes?.length || 0}
              </button>

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setReplyingTo(comment._id)}
              >
                {t("reply")}
              </button>

              {String(comment.author?._id) === String(currentUserId) &&
                canEdit(comment.createdAt) && (
                  <>
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => {
                        setEditingId(comment._id);
                        setEditedContent(comment.content);
                      }}
                    >
                      {t("edit")}
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      {t("delete")}
                    </button>
                  </>
                )}
            </div>
            )}
          </>
        )}

        {replyingTo === comment._id && (
          <div className="mt-2">
            <textarea
              className="form-control mb-2"
              rows={2}
              placeholder={t("writeComment")}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />

            <div className="d-flex align-items-center mb-2">
              <button
                className="btn btn-sm btn-primary me-2"
                onClick={() => handleReply(comment._id)}
              >
                {t("send")}
              </button>

              <button
                className="btn btn-sm btn-outline-secondary me-2"
                onClick={() => setReplyingTo(null)}
              >
                {t("cancel")}
              </button>

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowReplyPicker((prev) => !prev)}
              >
                😊
              </button>
            </div>

            {showReplyPicker && (
              <Picker data={data} onEmojiSelect={addReplyEmoji} theme="light" />
            )}
          </div>
        )}

        {comment.replies?.length > 0 && (
          <div className="ms-4 mt-3">{renderComments(comment.replies)}</div>
        )}
      </div>
    ));
  };

  useEffect(() => {
    if (refId) fetchComments();
  }, [refId]);

  return (
    <div className="mt-4">
      <h4 className="mb-3">💬 {t("title")}</h4>

      {!readOnly && (
      <form onSubmit={handleCreateComment} className="mb-4">
        <textarea
          className="form-control"
          rows={3}
          placeholder={t("writeComment")}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          required
        />

        <div className="d-flex align-items-center mt-2">
          <button className="btn btn-primary me-2" type="submit">
            {t("send")}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowPicker((prev) => !prev)}
          >
            😊
          </button>
        </div>

        {showPicker && (
          <div className="mt-2" style={{ zIndex: 10 }}>
            <Picker data={data} onEmojiSelect={addEmoji} theme="light" />
          </div>
        )}
      </form>
      )}

      {loading && <p>{t("loading")}</p>}
      {error && <p className="text-danger">{error}</p>}

      <div>{renderComments(comments)}</div>
    </div>
  );
}
