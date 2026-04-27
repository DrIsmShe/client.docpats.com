import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function useCommentCountBulk(articleIds = []) {
  const { t } = useTranslation("CommentSection");
  const [counts, setCounts] = useState({});
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      setCounts({});
      return;
    }

    let isMounted = true;

    const fetchCounts = async () => {
      try {
        const response = await axios.post(
          `${API_BASE}/comments/add-comments/comment-count-bulk`,
          { ids: articleIds },
          { withCredentials: true },
        );

        if (isMounted) {
          setCounts(response.data?.counts || {});
        }
      } catch (err) {
        console.error(
          t("errors.loadCommentCount", "Error fetching comment count"),
          err,
        );
      }
    };

    fetchCounts();

    return () => {
      isMounted = false;
    };
  }, [API_BASE, JSON.stringify(articleIds), t]);

  return counts;
}
