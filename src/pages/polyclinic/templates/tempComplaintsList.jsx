import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function TempComplaintsList() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;
  const [searchQuery, setSearchQuery] = useState("");
  const API_BASE = process.env.REACT_APP_API_URL;
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch(`${API_BASE}/clinic/temp-complaints-list`);
        if (!response.ok) {
          throw new Error("Ошибка при загрузке данных");
        }
        const data = await response.json();
        setComplaints(data);

        // Устанавливаем правильное количество страниц
        const calculatedPages = Math.ceil(data.length / pageSize);
        setTotalPages(calculatedPages);
        setCurrentPage(1); // Сброс на первую страницу
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredComplaints = complaints.filter((complaint) =>
    (complaint.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    // Обновляем totalPages и корректируем currentPage
    const calculatedPages = Math.ceil(filteredComplaints.length / pageSize);
    setTotalPages(calculatedPages);

    // Если текущая страница выходит за границы доступных страниц, корректируем её
    if (currentPage > calculatedPages) {
      setCurrentPage(calculatedPages || 1); // Убеждаемся, что currentPage не становится 0
    }
  }, [filteredComplaints, pageSize]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Поиск..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          marginBottom: "10px",
          padding: "5px",
          width: "100%",
          maxWidth: "300px",
        }}
      />
      <div className="table-responsive">
        <table className="table table-bordered border-primary">
          <thead>
            <tr style={{ marginBottom: "10px", fontSize: "13px" }}>
              <th scope="col">№</th>
              <th scope="col">Name of patient</th>
              <th scope="col">Date of creation</th>
            </tr>
          </thead>
          <tbody style={{ marginBottom: "10px", fontSize: "15px" }}>
            {loading ? (
              <tr>
                <td colSpan="6">Loading...</td>
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
                  Пациенты не найдены
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
                        to={`/dp/patient-detail/${complaint._id}`}
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
      {/* Пагинация */}
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
            Prev
          </button>
          <span
            style={{
              color: "blue",
            }}
          >
            Page {currentPage} of {totalPages}
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
            Next
          </button>
        </div>
      )}
    </div>
  );
}
