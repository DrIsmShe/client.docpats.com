// components/shared/useCommentCountDetailt.js
import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
export default function useCommentCount(refId) {
  const { t } = useTranslation("CommentSection");
  const [count, setCount] = useState(0);
  const API_BASE = process.env.REACT_APP_API_URL;
  useEffect(() => {
    if (!refId) return;

    const fetchCount = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/comments/add-comments/comment-count/${refId}`,
        );
        setCount(res.data.count || 0); // ✅ предполагается, что сервер возвращает { count: число }
      } catch (err) {
        console.error(
          t("errors.loadCommentCount", "Error fetching comment count"),
          err,
        );
      }
    };

    fetchCount();
  }, [refId]);

  return count;
}
