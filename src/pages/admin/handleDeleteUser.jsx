import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useParams, useNavigate } from "react-router-dom";

const DeleteUser = () => {
  const location = useLocation();
  const { id } = useParams(); // Для маршрутов, если id передан в пути URL
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;
  useEffect(() => {
    // Проверяем, передан ли userId через state или параметры маршрута
    if (location.state?.userId) {
      setUserId(location.state.userId);
    } else if (id) {
      setUserId(id);
    }
  }, [location.state, id]);

  const handleDelete = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${API_BASE}/admin/delete-user/${userId}`,
        {},
        { withCredentials: true }
      );
      setMessage(response.data.message);
      navigate("/admin/users-list");
    } catch (error) {
      setMessage(error.response?.data?.message || "Error deleting user");
    }
  };

  return (
    <div>
      <h2>Удаление пользователя</h2>
      <form onSubmit={handleDelete}>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          readOnly // Инпут доступен только для чтения
        />
        <button type="submit">Delete</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default DeleteUser;
