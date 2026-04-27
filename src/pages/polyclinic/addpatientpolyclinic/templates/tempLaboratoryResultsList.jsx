import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function TempLaboratoryResultsList() {
  const { t } = useTranslation("Examinations");

  const [template, setTemplates] = useState([]);
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
          `${API_BASE}/clinic/temp-laboratory-tests-list`
        );

        if (!response.ok) {
          throw new Error(t("laboratory.messages.loadError"));
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

  const filteredTemplates = template.filter((item) =>
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const calculatedPages = Math.ceil(filteredTemplates.length / pageSize);
    setTotalPages(calculatedPages);

    if (currentPage > calculatedPages) {
      setCurrentPage(calculatedPages || 1);
    }
  }, [filteredTemplates]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder={t("laboratory.searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          marginBottom: "10px",
          padding: "5px",
          width: "100%",
          maxWidth: "300px",
        }}
      />

      {/* Create new template */}
      <Link to="/dp/add-laboratory-tests-template">
        <button
          style={{
            backgroundColor: "green",
            color: "white",
            paddingInlineStart: "10px",
            paddingInlineEnd: "10px",
            border: "none",
            cursor: "pointer",
            marginLeft: "10px",
            height: "40px",
          }}
        >
          {t("laboratory.buttons.createNew")}
        </button>
      </Link>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered border-primary">
          <thead>
            <tr style={{ fontSize: "13px" }}>
              <th>№</th>
              <th>{t("laboratory.columns.title")}</th>
              <th>{t("laboratory.columns.date")}</th>
            </tr>
          </thead>

          <tbody style={{ fontSize: "15px" }}>
            {loading ? (
              <tr>
                <td colSpan="6">{t("laboratory.messages.loading")}</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" style={{ color: "red", textAlign: "center" }}>
                  {error}
                </td>
              </tr>
            ) : filteredTemplates.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ color: "red", textAlign: "center" }}>
                  {t("laboratory.messages.noData")}
                </td>
              </tr>
            ) : (
              filteredTemplates
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((item, index) => (
                  <tr key={item._id}>
                    <th>{(currentPage - 1) * pageSize + index + 1}</th>

                    <td>
                      <Link
                        target="_blank"
                        to={`/dp/laboratory-tests-template-detail/${item._id}`}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination pagination-row">
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            style={{
              marginRight: "10px",
              width: "100px",
              backgroundColor: "#E8EAF6",
              borderRadius: "5px",
              borderTopLeftRadius: "40%",
              borderBottomLeftRadius: "40%",
            }}
          >
            {t("laboratory.pagination.prev")}
          </button>

          <span style={{ color: "blue" }}>
            {t("laboratory.pagination.page")} {currentPage}{" "}
            {t("laboratory.pagination.of")} {totalPages}
          </span>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            style={{
              marginLeft: "10px",
              width: "100px",
              backgroundColor: "#E8EAF6",
              borderRadius: "5px",
              borderTopRightRadius: "40%",
              borderBottomRightRadius: "40%",
            }}
          >
            {t("laboratory.pagination.next")}
          </button>
        </div>
      )}
    </div>
  );
}
