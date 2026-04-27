import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function TempComplaintsList() {
  const { t } = useTranslation("Examinations");

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;

  const [searchQuery, setSearchQuery] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE}/clinic/temp-complaints-list`);

        if (!response.ok) {
          throw new Error(t("tempComplaintsList.messages.loadError"));
        }

        const data = await response.json();
        setComplaints(data);

        // Calculate pagination
        const pages = Math.ceil(data.length / pageSize);
        setTotalPages(pages);
        setCurrentPage(1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const filteredComplaints = complaints.filter((c) =>
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const pages = Math.ceil(filteredComplaints.length / pageSize);
    setTotalPages(pages);

    if (currentPage > pages) setCurrentPage(pages || 1);
  }, [filteredComplaints]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div>
      {/* SEARCH */}
      <input
        type="text"
        placeholder={t("tempComplaintsList.searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          marginBottom: "10px",
          padding: "5px",
          width: "100%",
          maxWidth: "300px",
        }}
      />

      {/* CREATE NEW TEMPLATE BUTTON */}
      <Link to="/dp/add-complainte-template">
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
          {t("tempComplaintsList.buttons.createNew")}
        </button>
      </Link>

      {/* TABLE */}
      <div className="table-responsive">
        <table className="table table-bordered border-primary">
          <thead>
            <tr style={{ marginBottom: "10px", fontSize: "13px" }}>
              <th>№</th>
              <th>{t("tempComplaintsList.columns.title")}</th>
              <th>{t("tempComplaintsList.columns.date")}</th>
            </tr>
          </thead>

          <tbody style={{ fontSize: "15px" }}>
            {loading ? (
              <tr>
                <td colSpan="6">{t("tempComplaintsList.messages.loading")}</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" style={{ color: "red", textAlign: "center" }}>
                  {error}
                </td>
              </tr>
            ) : filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ color: "red", textAlign: "center" }}>
                  {t("tempComplaintsList.messages.noData")}
                </td>
              </tr>
            ) : (
              filteredComplaints
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((complaint, index) => (
                  <tr key={complaint._id}>
                    <th scope="row">
                      {(currentPage - 1) * pageSize + index + 1}
                    </th>
                    <td>
                      <Link
                        target="_blank"
                        to={`/dp/complaints-detail/${complaint._id}`}
                      >
                        {complaint.title}
                      </Link>
                    </td>
                    <td>
                      <time dateTime={complaint.createdAt}>
                        {format(new Date(complaint.createdAt), "yyyy-MM-dd")}
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
            {t("tempComplaintsList.pagination.prev")}
          </button>

          <span style={{ color: "blue" }}>
            {t("tempComplaintsList.pagination.page")} {currentPage}{" "}
            {t("tempComplaintsList.pagination.of")} {totalPages}
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
            {t("tempComplaintsList.pagination.next")}
          </button>
        </div>
      )}
    </div>
  );
}
