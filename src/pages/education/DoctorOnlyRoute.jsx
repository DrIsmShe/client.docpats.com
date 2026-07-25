// client/src/pages/education/DoctorOnlyRoute.jsx
//
// Гейт для раздела подготовки к экзаменам: /education и вложенные страницы
// открыты ТОЛЬКО врачам. Всем остальным (пациент, гость) доступ закрыт.
//
// Роль определяем через тот же API, что и публичный лендинг
// (/common-for-user по cookie-сессии), а НЕ через localStorage.user — у
// части врачей localStorage.user не заполнен (вход по сессии), и старая
// проверка по localStorage ошибочно кидала их на /login. API — единый
// источник правды: раз лендинг видит роль «doctor», гейт увидит её тоже.
//
// admin/superadmin пропускаем как надстройку над врачом. Реальную защиту
// данных обеспечивает бэкенд; здесь задача — не пускать не-врача на страницу.

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const ALLOWED_ROLES = ["doctor", "admin", "superadmin"];
const API = process.env.REACT_APP_API_URL;

export default function DoctorOnlyRoute({ children }) {
  // "checking" — идёт проверка; "allowed" — врач; { redirect } — куда уводим.
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/common-for-user`, {
          withCredentials: true,
        });
        if (cancelled) return;
        const role = String(data?.user?.role || "").toLowerCase();
        if (data?.authenticated && ALLOWED_ROLES.includes(role)) {
          setStatus("allowed");
        } else {
          // Авторизованный не-врач → на главную; гость → на вход.
          setStatus({ redirect: data?.authenticated ? "/" : "/login" });
        }
      } catch {
        // Не смогли подтвердить доступ — закрываемся (fail-closed): бэкенд
        // раздела гостей не режет, поэтому здесь единственный барьер.
        if (!cancelled) setStatus({ redirect: "/login" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <>
        <style>{`@keyframes dp-eduspin{to{transform:rotate(360deg)}}`}</style>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              border: "3px solid #c8d6ee",
              borderTopColor: "#1447e6",
              borderRadius: "50%",
              display: "inline-block",
              animation: "dp-eduspin 0.8s linear infinite",
            }}
          />
        </div>
      </>
    );
  }

  if (status === "allowed") return children;

  return <Navigate to={status.redirect} replace />;
}
