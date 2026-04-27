import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function TempStatusPreasensList() {
  const { t } = useTranslation("Examinations");

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 5;

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/clinic/temp-status-preasens-list`
        );

        if (!response.ok) {
          throw new Error(t("tempStatusPreasensList.messages.loadError"));
        }

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

  const filteredTemplates = templates.filter((item) =>
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const pages = Math.ceil(filteredTemplates.length / pageSize);
    setTotalPages(pages);

    if (currentPage > pages) {
      setCurrentPage(pages || 1);
    }
  }, [filteredTemplates]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div>
      {/* HEADER SEARCH + BUTTON */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder={t("tempStatusPreasensList.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            marginBottom: "10px",
            padding: "5px",
            width: "100%",
            maxWidth: "300px",
          }}
        />

        <Link to="/dp/add-status-preasens-template">
          <button
            style={{
              backgroundColor: "green",
              color: "white",
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            {t("tempStatusPreasensList.buttons.createNew")}
          </button>
        </Link>
      </div>

      {/* TABLE */}
      <div className="table-responsive">
        <table className="table table-bordered border-primary">
          <thead>
            <tr style={{ fontSize: "13px" }}>
              <th>№</th>
              <th>{t("tempStatusPreasensList.columns.title")}</th>
              <th>{t("tempStatusPreasensList.columns.date")}</th>
            </tr>
          </thead>

          <tbody style={{ fontSize: "15px" }}>
            {loading ? (
              <tr>
                <td colSpan="3">
                  {t("tempStatusPreasensList.messages.loading")}
                </td>
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
                  {t("tempStatusPreasensList.messages.noData")}
                </td>
              </tr>
            ) : (
              filteredTemplates
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((item, index) => (
                  <tr key={item._id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>
                      <Link
                        target="_blank"
                        to={`/dp/status-preasens-template-detail/${item._id}`}
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td>
                      <time dateTime={item.createdAt}>
                        {format(new Date(item.createdAt), "yyyy-MM-dd")}
                      </time>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination pagination-row d-flex justify-content-center align-items-center gap-3 mt-3">
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="btn btn-light"
          >
            {t("tempStatusPreasensList.pagination.prev")}
          </button>

          <span style={{ color: "blue" }}>
            {t("tempStatusPreasensList.pagination.page")} {currentPage}{" "}
            {t("tempStatusPreasensList.pagination.of")} {totalPages}
          </span>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="btn btn-light"
          >
            {t("tempStatusPreasensList.pagination.next")}
          </button>
        </div>
      )}
    </div>
  );
}
