import React, { useEffect, useState } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import HeaderPatient from "../../components/patientComponents/header/header";
import FooterPatient from "../../components/patientComponents/footer/footer";
import AsidePatient from "../../components/patientComponents/aside/aside";
import axios from "axios";
import { useSelector } from "react-redux";

export default function PatientLayout() {
  const isOpen = useSelector((state) => state.menu.isOpen);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log("🔍 Checking patient authentication...");

        const response = await axios.get(
          `${API_BASE}/patient-profile/patientprofilelayout`,
          { withCredentials: true }
        );

        console.log("✅ Server response:", response.data);

        if (
          response.data.authenticated &&
          response.data.user?.role === "patient"
        ) {
          console.log("✅ User authenticated as patient");
          setIsAuthenticated(true);
        } else {
          console.warn("⚠️ Access denied, redirecting to login...");
          navigate("/login");
        }
      } catch (error) {
        console.error("❌ Error checking authentication:", error);

        if (error.response && error.response.status === 403) {
          console.warn("⚠️ Access denied, redirecting to login...");
        }
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [navigate]);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <HeaderPatient />
      <AsidePatient />
      <main id="main" className={isOpen ? "main" : "main open"}>
        <Outlet />
      </main>
      <FooterPatient />
      <Link
        to="#"
        className="back-to-top d-flex align-items-center justify-content-center"
      >
        <i className="bi bi-arrow-up-short"></i>
      </Link>
    </>
  );
}
