// client/src/hooks/useCurrentUser.js

import { useEffect, useState } from "react";
import axios from "axios";

export const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true, // 🔥 ОБЯЗАТЕЛЬНО для session
        });

        if (data?.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("❌ Ошибка получения пользователя:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [API_BASE]);

  return { user, loading };
};
