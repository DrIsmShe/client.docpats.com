// client/src/components/shared/PageNav.jsx
//
// Две кнопки возврата для публичных страниц: «назад» и «в кабинет».
//
// Зачем обе. «Назад» возвращает туда, откуда пришли, — из списка в список,
// из письма в почту. Но на страницу конференции часто попадают по прямой
// ссылке из письма, и тогда истории нет: кнопка «назад» уводит из приложения
// вовсе. Поэтому рядом отдельный, всегда предсказуемый путь в кабинет.
//
// Гостю кабинет не показываем: у него его нет, и ссылка вела бы на логин.

import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSession } from "../../api/session";

export default function PageNav({ fallback = "/" }) {
  const navigate = useNavigate();
  const { t } = useTranslation("conferences");
  const [role, setRole] = useState(null);

  useEffect(() => {
    let alive = true;
    getSession()
      .then((d) => alive && setRole(d?.authenticated ? d.user?.role || "" : ""))
      .catch(() => alive && setRole(""));
    return () => {
      alive = false;
    };
  }, []);

  const cabinet =
    role === "doctor"
      ? "/doctor/home-page"
      : role === "admin"
        ? "/admin/admin-panel"
        : role
          ? "/patient/home-page"
          : null;

  const goBack = () => {
    // Истории может не быть — пришли по ссылке из письма. Тогда уводим на
    // список, а не в пустоту за пределами приложения.
    if (window.history.length > 1) navigate(-1);
    else navigate(fallback);
  };

  return (
    <div style={row}>
      <button type="button" onClick={goBack} style={btn}>
        ← {t("back_prev", { defaultValue: "Назад" })}
      </button>
      {cabinet && (
        <Link to={cabinet} style={{ ...btn, textDecoration: "none" }}>
          {t("to_cabinet", { defaultValue: "В кабинет" })}
        </Link>
      )}
    </div>
  );
}

const row = { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 };
const btn = {
  padding: "6px 14px",
  background: "#fff",
  border: "1px solid #d9dfe8",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  color: "#334155",
  display: "inline-block",
};
