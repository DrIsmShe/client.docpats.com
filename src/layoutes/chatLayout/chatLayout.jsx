import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import ChatHome from "../../pages/Communication/chatHome";

export default function ChatLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });

        if (response.data?.authenticated) {
          setIsAuthenticated(true);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Ошибка проверки аутентификации:", error);
        navigate("/login");
      }
    };

    checkAuthentication();
  }, [navigate]);

  if (!isAuthenticated) return null;

  return (
    <div>
      {/* ✅ Вместо ChatHome вставляем Outlet */}
      <ChatHome />
    </div>
  );
}
