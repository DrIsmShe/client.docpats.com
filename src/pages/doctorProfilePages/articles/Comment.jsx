import React, { useState } from "react";
import { RiReplyLine } from "react-icons/ri";
import { AiFillLike } from "react-icons/ai";
import { MdDelete } from "react-icons/md";
import { useTranslation } from "react-i18next";

const Comment = ({
  comment,
  currentUserId,
  onReply,
  onDelete,
  onLike,
  replyToComment,
}) => {
  const { t } = useTranslation();

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const handleReply = () => {
    if (replyContent.trim()) {
      replyToComment(replyContent, comment._id);
      setReplyContent("");
      setShowReplyForm(false);
    }
  };

  return (
    <div className="comment">
      {/* --- Header --- */}
      <div className="comment-header d-flex align-items-center">
        <img
          src={comment.author?.avatar || "/default-avatar.png"}
          alt={comment.author?.username || t("comment.avatar")}
          className="rounded-circle me-3"
          style={{ width: "50px", height: "50px" }}
        />
        <strong>{comment.author?.username || t("comment.anonymous")}</strong>
      </div>

      {/* --- Content --- */}
      <p>{comment.content}</p>

      {/* --- Actions --- */}
      <div className="comment-actions mt-2">
        <button
          onClick={() => onLike(comment._id)}
          className="btn btn-outline-primary me-2"
        >
          <AiFillLike />{" "}
          {Array.isArray(comment.likes) ? comment.likes.length : comment.likes}{" "}
          {t("comment.likes")}
        </button>

        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="btn btn-primary me-2"
        >
          <RiReplyLine /> {t("comment.reply")}
        </button>

        {comment.author?._id === currentUserId && (
          <button
            onClick={() => onDelete(comment._id)}
            className="btn btn-danger"
          >
            <MdDelete /> {t("comment.delete")}
          </button>
        )}
      </div>

      {/* --- Reply Form --- */}
      {showReplyForm && (
        <div className="reply-form mt-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="form-control"
            rows="2"
            placeholder={t("comment.reply_placeholder")}
          />
          <button onClick={handleReply} className="btn btn-success mt-2">
            {t("comment.submit_reply")}
          </button>
        </div>
      )}

      {/* --- Recursive Replies --- */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies ms-5 mt-3">
          {comment.replies.map((reply) => (
            <Comment
              key={reply._id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              onLike={onLike}
              replyToComment={replyToComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
