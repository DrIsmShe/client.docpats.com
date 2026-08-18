// client/src/pages/communication/hooks/useCurrentUserId.js
//
// Минимальный хук — берёт userId из сессии один раз при загрузке приложения.
// Используется в App.jsx для передачи в GlobalCallProvider.

import { useState, useEffect } from "react";

/**
 * Тот же запрос, но отдаёт и РОЛЬ.
 *
 * Понадобилась записи приёма: панель показывается врачу и пациенту
 * по-разному, и решать это на глаз по наличию профиля нельзя.
 *
 * Отдельный хук, а не расширение возвращаемого значения useCurrentUserId:
 * тот используется в App.jsx и возвращает строку, а не объект. Поменять
 * его тип значило бы тронуть точку входа всего приложения ради одной
 * панели.
 */
export function useCurrentUser() {
  const [user, setUser] = useState({ userId: null, role: null });

  useEffect(() => {
    fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:11000"}/common-for-user`,
      { credentials: "include" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const u = data.user || data;
        const id = u.id || u._id;
        if (id) setUser({ userId: String(id), role: u.role || null });
      })
      .catch(() => {});
  }, []);

  return user;
}

export function useCurrentUserId() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:11000"}/common-for-user`,
      { credentials: "include" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          // Поддерживаем разные форматы: { id }, { _id }, { user: { id } }
          const id = data.id || data._id || data.user?.id || data.user?._id;
          if (id) setUserId(String(id));
        }
      })
      .catch(() => {}); // Если не авторизован — userId остаётся null, звонки не работают
  }, []);

  return userId;
}
