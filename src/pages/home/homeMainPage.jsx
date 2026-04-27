import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function HomeMainPage() {
  const [articleCount, setArticleCount] = useState(0);

  const API_BASE = process.env.REACT_APP_API_URL;
  useEffect(() => {
    const fetchArticleCount = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/count-articles-today`
        );

        console.log("Full server response:", response);

        if (!response || !response.data) {
          console.error("⚠️ Server returned empty response!");
          return;
        }

        setArticleCount(response.data.count || 0);
      } catch (error) {
        console.error(
          "Error while fetching today's articles:",
          error?.message || error
        );
      }
    };

    fetchArticleCount();
  }, []);

  const [totalArticles, setTotalArticles] = useState(0);

  useEffect(() => {
    const fetchTotalArticles = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/count-articles-all`);

        if (!response || !response.data) {
          console.error("⚠️ Server returned empty response!");
          return;
        }

        setTotalArticles(response.data.count || 0);
      } catch (error) {
        console.error(
          "Error while fetching total articles:",
          error?.message || error
        );
      }
    };

    fetchTotalArticles();
  }, []);

  const [totalDoctors, setTotalDoctors] = useState(0);

  useEffect(() => {
    const fetchTotalDoctors = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/count-doctors-all`);

        if (!response || !response.data) {
          console.error("⚠️ Server returned empty response!");
          return;
        }

        setTotalDoctors(response.data.count || 0);
      } catch (error) {
        console.error(
          "Error while fetching total doctors:",
          error?.message || error
        );
      }
    };

    fetchTotalDoctors();
  }, []);

  return (
    <div>
      <section className="section dashboard">
        <div className="row">
          {/* Your dashboard content here with translated titles like:
              "Articles | Today", "Total Articles | In Database", etc. */}
        </div>
      </section>
    </div>
  );
}
