import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const UpdateUserRole = () => {
  const { id } = useParams(); // Получаем ID из URL
  const [userId, setUserId] = useState(id); // Инициализируем состояние с этим ID
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${API_BASE}/admin/user/users-role-update/${userId}`,
        { newRole: role },
        { withCredentials: true }
      );
      setMessage(response.data.message);
      navigate("/admin/users-list");
    } catch (error) {
      setMessage(error.response?.data?.message || "Role change error");
    }
  };

  useEffect(() => {
    // Если ID изменился в URL, обновим userId
    setUserId(id);
  }, [id]);

  return (
    <div>
      <h2>Change user role</h2>

      <section className="section">
        <div className="row">
          <div className="col-lg-12">
            <div className="card">
              <div className="card-body">
                <h2>Change user role</h2>
                <div className="alert alert-warning1" role="alert">
                  <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                      <label>User Id:</label>
                      <input
                        type="text"
                        placeholder="ID пользователя"
                        value={userId}
                        disabled // Поле ID только для чтения
                      />
                    </div>
                    <div className="row mb-3">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        <option>Select a role</option>
                        <option value="patient">Patient</option>
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                      </select>
                    </div>

                    <button type="submit">Change role</button>
                  </form>
                  {message && <p>{message}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
export default UpdateUserRole;
