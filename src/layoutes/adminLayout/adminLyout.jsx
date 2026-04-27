import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Импортируйте useNavigate
import Aside from "../../components/adminComponents/aside";
import Header from "../../components/adminComponents/header";
import Footer from "../../components/adminComponents/footer";
import { Outlet } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
export default function AdminLayout() {
  const isOpen = useSelector((state) => state.menu.isOpen);

  const API_BASE = process.env.REACT_APP_API_URL;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await axios.get(`${API_BASE}/admin/admin-panel`, {
          withCredentials: true,
        });
        if (response.status === 200) {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Access Denied:", error);
        navigate("/login"); // Перенаправление на страницу логина
      }
    };

    checkAdminAccess();
  }, [navigate]);

  if (!isAuthorized) {
    return null; // Ничего не показываем, пока идет проверка
  }

  return (
    <>
      <Header />
      <Aside />
      <main id="main" className={isOpen ? "main" : "main open"}>
        <Outlet />
      </main>
      <Footer />
      <Link
        to="#"
        className="back-to-top d-flex align-items-center justify-content-center"
      >
        <i className="bi bi-arrow-up-short"></i>
      </Link>
    </>
  );
}
