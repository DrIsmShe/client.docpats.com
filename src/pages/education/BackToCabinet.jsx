// client/src/pages/education/BackToCabinet.jsx
//
// Выход из модуля подготовки к экзаменам.
//
// У зоны /education нет своего layout: ни шапки, ни сайдбара (страницы
// самозащищаются сами — см. комментарий в ExamCatalogPage). Человек приходит
// сюда из кабинета врача, и без этой ссылки вернуться можно было только
// браузерным «назад», а из корня каталога — вообще никак.
//
// Куда вести, зависит от роли, поэтому берём её из сессии. Отдельного «кто я»
// в API нет, но /api/me/trial-status уже отдаёт role и закрыт requireAuth —
// используем его, чтобы не заводить ради одной ссылки новый эндпоинт и не
// привязывать модуль к зоне врача (тесты открываем и пациентам).
//
// Пока роль неизвестна — ведём на главную: оттуда любая роль попадёт к себе.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../axios";

const HOME_BY_ROLE = {
  doctor: "/doctor",
  patient: "/patient",
  admin: "/admin/admin-panel",
};

export default function BackToCabinet() {
  const { t } = useTranslation("education");
  const [to, setTo] = useState("/");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get("/api/me/trial-status");
        if (!cancelled && data?.role) setTo(HOME_BY_ROLE[data.role] ?? "/");
      } catch {
        // Молча: это навигационное удобство, а не функциональность.
        // Если сессии нет, основной запрос страницы всё равно уведёт
        // на /login — дублировать эту обработку здесь незачем.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link to={to} className="edu-btn edu-btn--ghost edu-back-link">
      ← {t("shared.actions.toCabinet")}
    </Link>
  );
}
