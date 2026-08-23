import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SearchPatientFromPatient() {
  const { t } = useTranslation("patientArea");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_URL;
  const handleSearch = async () => {
    if (!query.trim()) {
      alert("Enter Email, Phone or Document.");
      return;
    }

    try {
      const { data } = await axios.get(
        `${API_BASE}/patient-profile/search-patient`,
        {
          params: { query: query.trim() },
          withCredentials: true,
        }
      );

      console.log("🔍 Search result:", data);
      setResult(data);

      if (data.found) {
        alert("Patient found. Redirecting...");
        navigate(`/patient/patient-profile/${data.patient.id}`);
      } else {
        alert("Patient not found. Creating a new one...");
        navigate("/patient/add-patient-to-clinic", { state: { query } });
      }
    } catch (error) {
      console.error("❌ Search error:", error.response?.data || error.message);

      if (error.response && error.response.status === 404) {
        alert("Patient not found. Creating a new one...");
        navigate("/patient/add-patient-to-clinic", { state: { query } });
      } else {
        alert(
          "Error while searching for patient. Check connection and try again."
        );
      }
    }
  };

  return (
    <div>
      <h2>{t("searchPatient.title")}</h2>
      <input
        type="text"
        placeholder={t("searchPatient.placeholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>{t("searchPatient.search")}</button>

      {result && (
        <div>
          <p>{result.message}</p>

          {result.found && (
            <div>
              <p>{t("searchPatient.name")} {result.patient.fullName}</p>
              <p>{t("searchPatient.email")} {result.patient.email}</p>
              <p>{t("searchPatient.phone")} {result.patient.phoneNumber}</p>
            </div>
          )}

          {!result.found && (
            <button
              onClick={() =>
                navigate("/patient/add-patient-to-clinic", { state: { query } })
              }
            >
              {t("searchPatient.create")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
