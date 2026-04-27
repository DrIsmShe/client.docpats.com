import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function TempRecommendationsList() {
  const { t } = useTranslation("examinations");

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 5;
  const [searchQuery, setSearchQuery] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/clinic/temp-recommendations-list`
        );

        if (!response.ok) throw new Error(t("common.loadError"));

        const data = await response.json();
        setTemplates(data);

        const pages = Math.ceil(data.length / pageSize);
        setTotalPages(pages);
        setCurrentPage(1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [t]);

  const filteredTemplates = templates.filter((tpl) =>
    (tpl.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const pages = Math.ceil(filteredTemplates.length / pageSize);
    setTotalPages(pages);

    if (currentPage > pages) {
      setCurrentPage(pages || 1);
    }
  }, [filteredTemplates, pageSize, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder={t("list.search")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          marginBottom: "10px",
          padding: "5px",
          width: "100%",
          maxWidth: "300px",
        }}
      />

      {/* Create new */}
      <Link to="/dp/add-recommendation-template">
        <button
          style={{
            backgroundColor: "green",
            color: "white",
            padding: "10px 20px",
            border: "none",
            cursor: "pointer",
            marginLeft: "10px",
            height: "40px",
          }}
        >
          {t("actions.createNew")}
        </button>
      </Link>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered border-primary">
          <thead>
            <tr style={{ fontSize: "13px" }}>
              <th>№</th>
              <th>{t("fields.templateTitle")}</th>
              <th>{t("fields.createdAt")}</th>
            </tr>
          </thead>

          <tbody style={{ fontSize: "15px" }}>
            {loading ? (
              <tr>
                <td colSpan="3">{t("common.loading")}</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="3" style={{ color: "red", textAlign: "center" }}>
                  {error}
                </td>
              </tr>
            ) : filteredTemplates.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ color: "red", textAlign: "center" }}>
                  {t("common.noResults")}
                </td>
              </tr>
            ) : (
              filteredTemplates
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((tpl, index) => (
                  <tr key={tpl._id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>

                    <td>
                      <Link
                        target="_blank"
                        to={`/dp/recommendations-template-detail/${tpl._id}`}
                      >
                        {tpl.title}
                      </Link>
                    </td>

                    <td>
                      <time dateTime={tpl.createdAt}>
                        {format(new Date(tpl.createdAt), "yyyy-MM-dd")}
                      </time>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination pagination-row mt-3">
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="btn btn-light"
          >
            {t("pagination.prev")}
          </button>

          <span style={{ margin: "0 10px", color: "blue" }}>
            {t("pagination.page")} {currentPage} {t("pagination.of")}{" "}
            {totalPages}
          </span>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="btn btn-light"
          >
            {t("pagination.next")}
          </button>
        </div>
      )}
    </div>
  );
}
