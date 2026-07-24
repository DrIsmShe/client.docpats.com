// client/src/pages/education/DoctorOnlyRoute.jsx
//
// Гейт для раздела подготовки к экзаменам: /education и вложенные страницы
// открыты ТОЛЬКО врачам. Всем остальным (пациент, гость) доступ закрыт.
//
// Это UI-уровень — как и остальные зоны проекта, где layout'ы
// самозащищаются по роли из localStorage. Реальную защиту данных
// обеспечивает бэкенд; здесь задача — не пускать не-врача на страницу.
//
// Роль берём из localStorage.user.role (тот же источник, что у зон
// врача/пациента и у NewsList). admin/superadmin пропускаем как надстройку
// над врачом, чтобы персонал мог открыть раздел; остальных — заворачиваем.

import { Navigate } from "react-router-dom";

const ALLOWED_ROLES = ["doctor", "admin", "superadmin"];

function readRole() {
  try {
    return JSON.parse(localStorage.getItem("user"))?.role ?? null;
  } catch {
    // Битый/пустой localStorage — считаем, что роли нет.
    return null;
  }
}

export default function DoctorOnlyRoute({ children }) {
  const role = readRole();

  if (ALLOWED_ROLES.includes(role)) return children;

  // Гость — на вход; авторизованный не-врач — на главную (на /login его
  // слать некуда, он уже вошёл).
  return <Navigate to={role ? "/" : "/login"} replace />;
}
