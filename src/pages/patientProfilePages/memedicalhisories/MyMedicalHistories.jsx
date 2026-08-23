import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

export default function MyMedicalHistories() {
  const { t } = useTranslation("patientArea");
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchMedicalHistories = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/patient-profile/get-my-medical-history`,
          {
            withCredentials: true,
          }
        );

        setHistories(response.data.data || []);
      } catch (err) {
        console.error("Ошибка при получении историй болезни:", err);
        setError("Ошибка загрузки данных. Попробуйте позже.");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalHistories();
  }, []);

  if (loading) return <p>{t("common.loading")}</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (histories.length === 0) return <p>{t("histories.empty")}</p>;

  return (
    <div>
      <h2>{t("histories.title")}</h2>
      <ul>
        {histories.map((history) => {
          const doctorFirstName = history.doctorId?.firstName || "";
          const doctorLastName = history.doctorId?.lastName || "";
          const doctorPosition = history.doctorProfileId?.position || "";
          const doctorSpecialization =
            history.doctorId?.specialization?.name || "";

          return (
            <li key={history._id} style={{ marginBottom: "1.5rem" }}>
              <strong>{t("histories.diagnosis")}</strong> {history.diagnosis}
              <br />
              <strong>{t("histories.complaints")}</strong> {history.complaints || "—"}
              <br />
              <strong>{t("histories.createdAt")}</strong>{" "}
              {new Date(history.createdAt).toLocaleDateString()}
              <br />
              <strong>{t("histories.doctor")}</strong>{" "}
              {doctorFirstName || doctorLastName
                ? `${doctorFirstName} ${doctorLastName}`
                : "Не указано"}
              {(doctorPosition || doctorSpecialization) && (
                <>
                  {" "}
                  –{" "}
                  <em>
                    {doctorSpecialization}
                    {doctorPosition && `, ${doctorPosition}`}
                  </em>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
