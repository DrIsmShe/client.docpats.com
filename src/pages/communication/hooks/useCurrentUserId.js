// client/src/pages/communication/hooks/useCurrentUserId.js
//
// Минимальный хук — берёт userId из сессии один раз при загрузке приложения.
// Используется в App.jsx для передачи в GlobalCallProvider.

import { useState, useEffect } from "react";

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
