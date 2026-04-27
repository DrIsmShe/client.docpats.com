import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useParams, useNavigate } from "react-router-dom";
const BlockUser = () => {
  const location = useLocation();
  const { id } = useParams(); // Для маршрутов, если id передан в пути URL
  const [userId, setUserId] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${API_BASE}/admin/block-user-from-admin/${userId}`,
        {
          isBlocked,
        }
      );
      console.log("User is blocked");
      setMessage(response.data.message);
      navigate("/admin/users-list");
    } catch (error) {
      setMessage(error.response?.data?.message || "Ошибка");
    }
  };

  return (
    <div>
      <h2>Blocking a user</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="ID пользователя"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          readOnly // Запрещаем редактирование
        />
        <select
          value={isBlocked}
          onChange={(e) => setIsBlocked(e.target.value)}
        >
          <option value="false">Unblock</option>
          <option value="true">Block</option>
        </select>
        <button type="submit">Send</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default BlockUser;
