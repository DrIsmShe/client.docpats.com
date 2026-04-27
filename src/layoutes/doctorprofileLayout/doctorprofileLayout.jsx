import React, { useEffect, useState } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import Aside from "../../components/doctorprofileComponents/aside/aside";
import Header from "../../components/doctorprofileComponents/header/header";
import Footer from "../../components/doctorprofileComponents/footer/footer";
import axios from "axios";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

export default function DoctorprofileLayout() {
  const isOpen = useSelector((state) => state.menu.isOpen);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation(); // 🔥 подключили перевод

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log("🔍 Checking if user is doctor...");
        const response = await axios.get(
          `${API_BASE}/doctor-profile/doctorprofilelayout`,
          { withCredentials: true }
        );

        console.log("✅ Server response:", response.data);

        if (
          response.data.authenticated &&
          response.data.user?.role === "doctor"
        ) {
          console.log("✅ User is a doctor, access allowed");
          setIsAuthenticated(true);
        } else {
          console.warn("⚠️ User is not a doctor, redirecting...");
          navigate("/login");
        }
      } catch (error) {
        console.error("❌ Error checking authentication:", error);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [navigate]);

  if (isLoading) {
    return <div>{t("loading")}</div>; // 🔥 заменили "Загрузка..."
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <Aside />

      <main id="main" className={isOpen ? "main" : "main open"}>
        <Outlet />
      </main>

      <Footer />

      {/* кнопка наверх */}
      <Link
        to="#"
        className="back-to-top d-flex align-items-center justify-content-center"
        title={t("go_to_top")} // 🔥 добавили перевод
      >
        <i className="bi bi-arrow-up-short"></i>
      </Link>
    </>
  );
}
